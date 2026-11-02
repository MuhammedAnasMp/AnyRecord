import type {
	FingerGestureRegion,
	GestureAttachment,
} from "../../components/video-editor/gestures/gestureTypes";
import { computeFingertipAnchor } from "./anchorMath";

export interface GestureObjectTransform {
	x: number; // normalized (0-1) in webcam frame
	y: number; // normalized (0-1) in webcam frame
	scale: number; // multiplier (1.0 = normal)
	rotationDeg: number;
	opacity: number;
	visible: boolean;
	sizePct: number;
	handScale: number;
}

// Cubic bezier evaluator
export function cubicBezier(
	p1x: number,
	p1y: number,
	p2x: number,
	p2y: number,
): (t: number) => number {
	return (t: number) => {
		if (t <= 0) return 0;
		if (t >= 1) return 1;

		// Newton-Raphson approximation
		let x = t;
		for (let i = 0; i < 5; i++) {
			const currentX =
				3 * (1 - x) * (1 - x) * x * p1x +
				3 * (1 - x) * x * x * p2x +
				x * x * x -
				t;
			const currentDx =
				3 * (1 - x) * (1 - x) * p1x +
				6 * (1 - x) * x * (p2x - p1x) +
				3 * x * x * (1 - p2x);
			if (Math.abs(currentDx) < 1e-6) break;
			x -= currentX / currentDx;
		}
		x = Math.max(0, Math.min(1, x));

		return (
			3 * (1 - x) * (1 - x) * x * p1y +
			3 * (1 - x) * x * x * p2y +
			x * x * x
		);
	};
}

// Easing curves from motion-skills / animation-principles
export const EASING = {
	easeOut: cubicBezier(0.16, 1, 0.3, 1),
	popOvershoot: cubicBezier(0.34, 1.56, 0.64, 1),
	easeIn: cubicBezier(0.7, 0, 0.84, 0),
	easeInOut: cubicBezier(0.65, 0, 0.35, 1),
};

/**
 * Pure function of time: interpolates the fingertip trajectory and calculates
 * animation state (entrance pop, idle floating, exit shrink, rotation) for time `tMs`.
 */
export function evaluateGestureObject(
	region: FingerGestureRegion,
	attachmentOverride?: GestureAttachment,
	tMs: number = 0,
): GestureObjectTransform {
	const attachment = attachmentOverride ?? region.attachment;

	if (tMs < region.startMs || tMs > region.endMs || region.samples.length === 0) {
		return {
			x: 0.5,
			y: 0.5,
			scale: 0,
			rotationDeg: 0,
			opacity: 0,
			visible: false,
			sizePct: attachment.sizePct,
			handScale: 1,
		};
	}

	const samples = region.samples;
	const regionDuration = Math.max(1, region.endMs - region.startMs);
	const progress = Math.max(0, Math.min(1, (tMs - region.startMs) / regionDuration));

	const firstSampleTime = samples[0].tMs;
	const lastSampleTime = samples[samples.length - 1].tMs;
	const sampleSpan = Math.max(0, lastSampleTime - firstSampleTime);
	const effectiveSampleTime =
		sampleSpan > 0 ? firstSampleTime + progress * sampleSpan : firstSampleTime;

	let sampleIndex = 0;
	while (
		sampleIndex < samples.length - 1 &&
		samples[sampleIndex + 1].tMs <= effectiveSampleTime
	) {
		sampleIndex++;
	}

	const s0 = samples[sampleIndex];
	const s1 = samples[Math.min(samples.length - 1, sampleIndex + 1)];

	let interp = 0;
	if (s1.tMs > s0.tMs) {
		interp = Math.max(0, Math.min(1, (effectiveSampleTime - s0.tMs) / (s1.tMs - s0.tMs)));
	}

	// Interpolate tip & direction
	const tipX = s0.tipX + (s1.tipX - s0.tipX) * interp;
	const tipY = s0.tipY + (s1.tipY - s0.tipY) * interp;
	const dirX = s0.directionX + (s1.directionX - s0.directionX) * interp;
	const dirY = s0.directionY + (s1.directionY - s0.directionY) * interp;
	const pxPerCm = s0.pxPerCm + (s1.pxPerCm - s0.pxPerCm) * interp;

	// Calculate live anchor based on current attachment offsetCm
	const anchor = computeFingertipAnchor({
		tipX,
		tipY,
		dirX,
		dirY,
		offsetCm: attachment.offsetCm,
		offsetAngleDeg: attachment.offsetAngleDeg,
		pxPerCm,
	});

	// Finger angle in degrees
	const fingerAngleDeg = (Math.atan2(dirY, dirX) * 180) / Math.PI + 90;

	// Hand depth scaling factor (calibrated around nominal pxPerCm ~ 0.04)
	const handScale = attachment.scaleWithHand ? pxPerCm / 0.04 : 1.0;

	// Entrance animation
	const elapsedEnter = tMs - region.startMs;
	const enterProgress = Math.min(1, Math.max(0, elapsedEnter / (attachment.enterDurationMs || 350)));
	let enterScale = 1;
	let enterOpacity = 1;

	if (enterProgress < 1) {
		switch (attachment.enterAnimation) {
			case "pop":
				enterScale = EASING.popOvershoot(enterProgress);
				enterOpacity = EASING.easeOut(enterProgress);
				break;
			case "fade-up":
				enterScale = 0.8 + 0.2 * EASING.easeOut(enterProgress);
				enterOpacity = EASING.easeOut(enterProgress);
				break;
			case "scale":
				enterScale = EASING.easeOut(enterProgress);
				enterOpacity = EASING.easeOut(enterProgress);
				break;
			case "spin-in":
				enterScale = EASING.popOvershoot(enterProgress);
				enterOpacity = EASING.easeOut(enterProgress);
				break;
			case "none":
			default:
				enterScale = 1;
				enterOpacity = 1;
				break;
		}
	}

	// Exit animation
	const remainingMs = region.endMs - tMs;
	const exitProgress = Math.min(1, Math.max(0, remainingMs / (attachment.exitDurationMs || 200)));
	let exitScale = 1;
	let exitOpacity = 1;

	if (exitProgress < 1) {
		const exitT = 1 - exitProgress;
		switch (attachment.exitAnimation) {
			case "shrink":
				exitScale = 1 - EASING.easeIn(exitT);
				exitOpacity = 1 - EASING.easeIn(exitT);
				break;
			case "fade":
				exitOpacity = 1 - EASING.easeIn(exitT);
				break;
			case "fly-up":
				exitScale = 1 - 0.3 * EASING.easeIn(exitT);
				exitOpacity = 1 - EASING.easeIn(exitT);
				break;
			case "none":
			default:
				exitScale = 1;
				exitOpacity = 1;
				break;
		}
	}

	// Idle secondary animation
	let idleXOffset = 0;
	let idleYOffset = 0;
	let idleScale = 1;
	if (enterProgress >= 1 && exitProgress >= 1) {
		const idleTimeSec = (tMs - region.startMs) / 1000;
		switch (attachment.idleAnimation) {
			case "float":
				idleYOffset = Math.sin(idleTimeSec * Math.PI * 2) * 0.005;
				break;
			case "pulse":
				idleScale = 1.0 + Math.sin(idleTimeSec * Math.PI * 3) * 0.05;
				break;
			case "sway":
				idleXOffset = Math.sin(idleTimeSec * Math.PI * 1.5) * 0.005;
				break;
			case "none":
			default:
				break;
		}
	}

	const finalScale = enterScale * exitScale * idleScale * Math.max(0.5, Math.min(2.0, handScale));
	const finalOpacity = Math.max(0, Math.min(1, enterOpacity * exitOpacity));
	const finalRotation = attachment.followRotation ? fingerAngleDeg : 0;

	return {
		x: anchor.x + idleXOffset,
		y: anchor.y + idleYOffset,
		scale: finalScale,
		rotationDeg: finalRotation,
		opacity: finalOpacity,
		visible: finalOpacity > 0.01 && finalScale > 0.01,
		sizePct: attachment.sizePct,
		handScale,
	};
}

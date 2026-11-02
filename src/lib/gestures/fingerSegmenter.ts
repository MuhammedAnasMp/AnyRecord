import {
	DEFAULT_GESTURE_ATTACHMENT,
	type FingerGestureRegion,
	type FingerTrackSample,
	type FingerType,
	type HandSide,
} from "../../components/video-editor/gestures/gestureTypes";
import { computeFingertipAnchor } from "./anchorMath";
import type { FingerDetectionResult } from "./fingerClassifier";
import { OneEuroFilter2D } from "./oneEuroFilter";

export interface FrameFingerDetection {
	tMs: number; // video timestamp
	pxPerCm: number;
	detections: FingerDetectionResult[];
}

interface ActiveFingerTrack {
	hand: HandSide;
	finger: FingerType;
	startTimeMs: number;
	lastSeenTimeMs: number;
	firstDetectedTimeMs: number;
	samples: FingerTrackSample[];
	filter: OneEuroFilter2D;
}

export function segmentFingerDetections(
	frames: FrameFingerDetection[],
	params: {
		minHoldMs?: number;
		releaseMs?: number;
		offsetCm?: number;
	} = {},
): FingerGestureRegion[] {
	const minHoldMs = params.minHoldMs ?? 180;
	const releaseMs = params.releaseMs ?? 140;
	const offsetCm = params.offsetCm ?? 1.0;

	const completedRegions: FingerGestureRegion[] = [];
	const activeTracks = new Map<string, ActiveFingerTrack>();

	const getTrackKey = (hand: HandSide, finger: FingerType) => `${hand}-${finger}`;

	for (const frame of frames) {
		const { tMs, pxPerCm, detections } = frame;
		const seenKeys = new Set<string>();

		for (const det of detections) {
			if (!det.isOpen) continue;

			const key = getTrackKey(det.hand, det.finger);
			seenKeys.add(key);

			let track = activeTracks.get(key);
			if (!track) {
				track = {
					hand: det.hand,
					finger: det.finger,
					startTimeMs: tMs,
					lastSeenTimeMs: tMs,
					firstDetectedTimeMs: tMs,
					samples: [],
					filter: new OneEuroFilter2D(1.2, 0.008),
				};
				activeTracks.set(key, track);
			}

			track.lastSeenTimeMs = tMs;

			// Smooth tip and anchor
			const smoothedTip = track.filter.filter(det.tip.x, det.tip.y, tMs / 1000);
			const anchor = computeFingertipAnchor({
				tipX: smoothedTip.x,
				tipY: smoothedTip.y,
				dirX: det.direction.dx,
				dirY: det.direction.dy,
				offsetCm,
				pxPerCm,
			});

			track.samples.push({
				tMs,
				x: anchor.x,
				y: anchor.y,
				tipX: smoothedTip.x,
				tipY: smoothedTip.y,
				directionX: det.direction.dx,
				directionY: det.direction.dy,
				pxPerCm,
				confidence: det.confidence,
			});
		}

		// Check for closed fingers (tracks not seen in this frame)
		for (const [key, track] of activeTracks.entries()) {
			if (!seenKeys.has(key)) {
				const timeSinceLastSeen = tMs - track.lastSeenTimeMs;
				if (timeSinceLastSeen > releaseMs) {
					// Finger closed! Finalize region if it met minimum hold time
					const totalDuration = track.lastSeenTimeMs - track.startTimeMs;
					if (totalDuration >= minHoldMs && track.samples.length >= 2) {
						completedRegions.push({
							id: `gesture-${track.hand}-${track.finger}-${Math.round(track.startTimeMs)}`,
							hand: track.hand,
							finger: track.finger,
							startMs: Math.round(track.startTimeMs),
							endMs: Math.round(track.lastSeenTimeMs),
							samples: track.samples,
							attachment: { ...DEFAULT_GESTURE_ATTACHMENT },
						});
					}
					activeTracks.delete(key);
				}
			}
		}
	}

	// Finalize any remaining open tracks at video end
	for (const track of activeTracks.values()) {
		const totalDuration = track.lastSeenTimeMs - track.startTimeMs;
		if (totalDuration >= minHoldMs && track.samples.length >= 2) {
			completedRegions.push({
				id: `gesture-${track.hand}-${track.finger}-${Math.round(track.startTimeMs)}`,
				hand: track.hand,
				finger: track.finger,
				startMs: Math.round(track.startTimeMs),
				endMs: Math.round(track.lastSeenTimeMs),
				samples: track.samples,
				attachment: { ...DEFAULT_GESTURE_ATTACHMENT },
			});
		}
	}

	return completedRegions.sort((a, b) => a.startMs - b.startMs);
}

import type { AnnotationTextStyle } from "../types";

export type HandSide = "left" | "right";
export type FingerType = "thumb" | "index" | "middle" | "ring" | "pinky";

export interface FingerTrackSample {
	tMs: number; // webcam source time in ms
	x: number; // normalized anchor x in webcam frame (0-1)
	y: number; // normalized anchor y in webcam frame (0-1)
	tipX: number; // normalized fingertip x (0-1)
	tipY: number; // normalized fingertip y (0-1)
	directionX: number; // normalized extension unit vector x
	directionY: number; // normalized extension unit vector y
	pxPerCm: number; // normalized hand scale factor
	confidence: number;
}

export type GestureObjectKind =
	| "sticker"
	| "image"
	| "video"
	| "text"
	| "number"
	| "letter";

export type GestureEnterAnimation =
	| "pop"
	| "fade-up"
	| "scale"
	| "spin-in"
	| "none";

export type GestureExitAnimation = "shrink" | "fade" | "fly-up" | "none";

export type GestureIdleAnimation = "float" | "pulse" | "sway" | "none";

export type GestureBadgeStyle =
	| "glass"
	| "solid"
	| "pill"
	| "neon"
	| "outline"
	| "none";

export interface GestureAttachment {
	kind: GestureObjectKind;
	content: string; // emoji char, image data URL/path, video path, or text
	sizePct: number; // size in % relative to webcam/canvas frame (default 14)
	offsetCm: number; // distance above fingertip in cm (default 1.0)
	offsetAngleDeg: number; // angular deviation from finger extension line (default 0)
	followRotation: boolean; // whether to rotate the object with the finger angle
	scaleWithHand: boolean; // whether to scale size dynamically as hand moves closer/farther
	enterAnimation: GestureEnterAnimation;
	exitAnimation: GestureExitAnimation;
	idleAnimation: GestureIdleAnimation;
	enterDurationMs: number; // default 350
	exitDurationMs: number; // default 200
	followLag: number; // damping factor 0 (instant) to 1 (heavy lag), default 0.3
	textColor?: string;
	backgroundColor?: string;
	badgeStyle?: GestureBadgeStyle;
	fontSizeMultiplier?: number;
	fontFamily?: string;
	textStyle?: Partial<AnnotationTextStyle>;
	videoLoop?: boolean;
	videoMuted?: boolean;
}

export interface FingerGestureRegion {
	id: string;
	hand: HandSide;
	finger: FingerType;
	startMs: number; // timeline time
	endMs: number; // timeline time
	samples: FingerTrackSample[];
	attachment: GestureAttachment;
}

export interface GestureTrackingSettings {
	enabled: boolean;
	confidenceThreshold: number;
	minHoldMs: number;
	releaseMs: number;
	defaultAttachment: GestureAttachment;
	showDebugLandmarks: boolean;
}

export const DEFAULT_GESTURE_ATTACHMENT: GestureAttachment = {
	kind: "sticker",
	content: "✨",
	sizePct: 14,
	offsetCm: 1.0,
	offsetAngleDeg: 0,
	followRotation: true,
	scaleWithHand: true,
	enterAnimation: "pop",
	exitAnimation: "shrink",
	idleAnimation: "float",
	enterDurationMs: 350,
	exitDurationMs: 200,
	followLag: 0.25,
	textColor: "#ffffff",
	backgroundColor: "#6366f1",
	badgeStyle: "glass",
	fontSizeMultiplier: 1,
	videoLoop: true,
	videoMuted: true,
};

export const DEFAULT_GESTURE_TRACKING_SETTINGS: GestureTrackingSettings = {
	enabled: false,
	confidenceThreshold: 0.55,
	minHoldMs: 180,
	releaseMs: 140,
	defaultAttachment: DEFAULT_GESTURE_ATTACHMENT,
	showDebugLandmarks: false,
};

export function getFingerDisplayName(finger: FingerType, hand: HandSide): string {
	const fingerNames: Record<FingerType, string> = {
		thumb: "Thumb",
		index: "Index",
		middle: "Middle",
		ring: "Ring",
		pinky: "Pinky",
	};
	const handPrefix = hand === "left" ? "L" : "R";
	return `${fingerNames[finger]} (${handPrefix})`;
}

export function getFingerEmoji(finger: FingerType): string {
	switch (finger) {
		case "thumb":
			return "👍";
		case "index":
			return "☝️";
		case "middle":
			return "✌️";
		case "ring":
			return "💍";
		case "pinky":
			return "🤙";
		default:
			return "✋";
	}
}

export type CaptionEngine = "google" | "whisper";

export type CaptionAnimationStyle =
	| "none"
	// Instagram / TikTok Signature Animations
	| "sparkShots"
	| "crookedError"
	| "paperPlane"
	| "heartCursor"
	| "pathWriting"
	| "jitteryShine"
	| "typeSlide"
	| "glitchSpark"
	| "hotFlicker"
	| "rgbFlex"
	| "neonYellow"
	| "quickIntro"
	| "echoedDrop"
	| "cutEchoes"
	| "stretchDown"
	| "blueCircle"
	| "unHalved"
	| "littlePop"
	// Standard Entrance
	| "fade"
	| "pop"
	| "rise"
	| "scale"
	| "slideUp"
	| "slideDown"
	| "slideLeft"
	| "slideRight"
	| "bounce"
	| "typewriter"
	// Standard Emphasis
	| "pulse"
	| "shake"
	| "jitter"
	| "glow"
	| "flash"
	| "colorChange"
	// Standard Exit
	| "fadeOut"
	| "scaleOut";

export type CaptionBackgroundStyle =
	| "none"
	| "transparent"
	| "rounded"
	| "pill"
	| "box"
	| "fullWidth"
	| "wordBadge"
	| "semiDark";

export type CaptionAlignment = "left" | "center" | "right";
export type CaptionVerticalPosition = "top" | "middle" | "bottom" | "custom";
export type CaptionTextTransform = "none" | "uppercase" | "lowercase" | "capitalize";
export type CaptionAnimationScope = "caption" | "word" | "character";

export interface CaptionShadowSettings {
	color: string;
	blur: number;
	opacity: number;
	offsetX: number;
	offsetY: number;
}

export interface CaptionStrokeSettings {
	color: string;
	width: number;
}

export interface CaptionPreset {
	id: string;
	name: string;
	description?: string;
	category: "reels" | "tiktok" | "podcast" | "cinematic" | "custom";
	fontFamily: string;
	fontSize: number;
	fontWeight: number | string;
	letterSpacing: number;
	lineHeight: number;
	textTransform: CaptionTextTransform;
	fontStyle: "normal" | "italic";
	textDecoration: "none" | "underline";
	textOpacity: number;
	textColor: string;
	inactiveTextColor: string;
	activeWordColor: string;
	keywordColor: string;
	gradientText?: string | null;
	stroke: CaptionStrokeSettings;
	shadow: CaptionShadowSettings;
	alignment: CaptionAlignment;
	verticalPosition: CaptionVerticalPosition;
	bottomOffset: number;
	backgroundStyle: CaptionBackgroundStyle;
	backgroundColor: string;
	backgroundOpacity: number;
	boxRadius: number;
	paddingX: number;
	paddingY: number;
	animationStyle: CaptionAnimationStyle;
	animationDurationMs: number;
	animationScope: CaptionAnimationScope;
	animationSpeed: number;
	isCustom?: boolean;
}

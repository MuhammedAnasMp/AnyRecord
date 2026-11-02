import type { CaptionAnimationStyle } from "./captionTypes";

export interface CaptionAnimationInfo {
	id: CaptionAnimationStyle;
	name: string;
	category: "signature" | "entrance" | "emphasis" | "exit";
	description: string;
	previewClass: string;
	durationMs: number;
}

export const CAPTION_ANIMATIONS: CaptionAnimationInfo[] = [
	{
		id: "none",
		name: "None",
		category: "entrance",
		description: "Static text with no motion",
		previewClass: "",
		durationMs: 0,
	},
	// Instagram / TikTok Signature Animations
	{
		id: "sparkShots",
		name: "Spark Shots",
		category: "signature",
		description: "Energetic particle spark burst around text",
		previewClass: "anim-preview-sparkShots",
		durationMs: 220,
	},
	{
		id: "crookedError",
		name: "Crooked Error",
		category: "signature",
		description: "Glitch & error distortion with dynamic skew",
		previewClass: "anim-preview-crookedError",
		durationMs: 200,
	},
	{
		id: "paperPlane",
		name: "Paper Plane",
		category: "signature",
		description: "Swooping curve flight entrance",
		previewClass: "anim-preview-paperPlane",
		durationMs: 260,
	},
	{
		id: "heartCursor",
		name: "Heart Cursor",
		category: "signature",
		description: "Pulsing heart romantic glow reaction",
		previewClass: "anim-preview-heartCursor",
		durationMs: 240,
	},
	{
		id: "pathWriting",
		name: "Path Writing",
		category: "signature",
		description: "Text reveals as if written in motion",
		previewClass: "anim-preview-typeSlide",
		durationMs: 280,
	},
	{
		id: "jitteryShine",
		name: "Jittery Shine",
		category: "signature",
		description: "High-energy subtle jitter with light sweep",
		previewClass: "anim-preview-jitteryShine",
		durationMs: 220,
	},
	{
		id: "typeSlide",
		name: "Type Slide",
		category: "signature",
		description: "Words slide swiftly into position",
		previewClass: "anim-preview-typeSlide",
		durationMs: 180,
	},
	{
		id: "glitchSpark",
		name: "Glitch Spark",
		category: "signature",
		description: "RGB displacement and electric spark",
		previewClass: "anim-preview-glitchSpark",
		durationMs: 180,
	},
	{
		id: "hotFlicker",
		name: "Hot Flicker",
		category: "signature",
		description: "Rapid fire & flame brightness flicker",
		previewClass: "anim-preview-hotFlicker",
		durationMs: 200,
	},
	{
		id: "rgbFlex",
		name: "RGB Flex",
		category: "signature",
		description: "3D chromatic aberration split and bounce",
		previewClass: "anim-preview-rgbFlex",
		durationMs: 220,
	},
	{
		id: "neonYellow",
		name: "Neon Yellow",
		category: "signature",
		description: "Electrifying neon aura and glow pulse",
		previewClass: "anim-preview-neonYellow",
		durationMs: 250,
	},
	{
		id: "quickIntro",
		name: "Quick Intro",
		category: "signature",
		description: "Fast scale blur snap-in",
		previewClass: "anim-preview-quickIntro",
		durationMs: 160,
	},
	{
		id: "echoedDrop",
		name: "Echoed Drop",
		category: "signature",
		description: "Staggered trailing duplicate drop-in",
		previewClass: "anim-preview-echoedDrop",
		durationMs: 220,
	},
	{
		id: "cutEchoes",
		name: "Cut Echoes",
		category: "signature",
		description: "Offset ghost silhouettes snap to place",
		previewClass: "anim-preview-cutEchoes",
		durationMs: 200,
	},
	{
		id: "stretchDown",
		name: "Stretch Down",
		category: "signature",
		description: "Vertical elastic squash & stretch bounce",
		previewClass: "anim-preview-stretchDown",
		durationMs: 220,
	},
	{
		id: "blueCircle",
		name: "Blue Circle",
		category: "signature",
		description: "Vibrant cyan-blue circular energy highlight",
		previewClass: "anim-preview-blueCircle",
		durationMs: 240,
	},
	{
		id: "unHalved",
		name: "Un-Halved",
		category: "signature",
		description: "Top and bottom halves slice and reconnect",
		previewClass: "anim-preview-unHalved",
		durationMs: 220,
	},
	{
		id: "littlePop",
		name: "Little Pop",
		category: "signature",
		description: "Clean bouncy pop for every spoken word",
		previewClass: "anim-preview-littlePop",
		durationMs: 180,
	},
	// Standard Entrance
	{
		id: "fade",
		name: "Fade",
		category: "entrance",
		description: "Smooth opacity transition",
		previewClass: "anim-preview-fade",
		durationMs: 200,
	},
	{
		id: "pop",
		name: "Pop",
		category: "entrance",
		description: "Snappy bounce scale",
		previewClass: "anim-preview-pop",
		durationMs: 200,
	},
	{
		id: "rise",
		name: "Rise",
		category: "entrance",
		description: "Upward floating entrance",
		previewClass: "anim-preview-fade",
		durationMs: 220,
	},
	{
		id: "slideUp",
		name: "Slide Up",
		category: "entrance",
		description: "Slide in from below",
		previewClass: "anim-preview-typeSlide",
		durationMs: 200,
	},
	{
		id: "slideDown",
		name: "Slide Down",
		category: "entrance",
		description: "Slide in from above",
		previewClass: "anim-preview-typeSlide",
		durationMs: 200,
	},
	{
		id: "bounce",
		name: "Bounce",
		category: "entrance",
		description: "Playful spring bounce",
		previewClass: "anim-preview-bounce",
		durationMs: 280,
	},
	{
		id: "typewriter",
		name: "Typewriter",
		category: "entrance",
		description: "Sequential typewriter reveal",
		previewClass: "anim-preview-typeSlide",
		durationMs: 260,
	},
	// Standard Emphasis
	{
		id: "pulse",
		name: "Pulse",
		category: "emphasis",
		description: "Continuous subtle rhythmic pulse",
		previewClass: "anim-preview-pulse",
		durationMs: 300,
	},
	{
		id: "shake",
		name: "Shake",
		category: "emphasis",
		description: "Quick horizontal shake effect",
		previewClass: "anim-preview-shake",
		durationMs: 200,
	},
	{
		id: "glow",
		name: "Glow",
		category: "emphasis",
		description: "Luminous neon breathing glow",
		previewClass: "anim-preview-glow",
		durationMs: 300,
	},
];

/**
 * Returns keyframe animation name for CSS injection
 */
export function getCaptionAnimationKeyframe(style: CaptionAnimationStyle): string {
	switch (style) {
		case "sparkShots": return "captionSparkShots";
		case "crookedError": return "captionCrookedError";
		case "paperPlane": return "captionPaperPlane";
		case "heartCursor": return "captionHeartCursor";
		case "jitteryShine": return "captionJitteryShine";
		case "typeSlide": return "captionTypeSlide";
		case "glitchSpark": return "captionGlitchSpark";
		case "hotFlicker": return "captionHotFlicker";
		case "rgbFlex": return "captionRgbFlex";
		case "neonYellow": return "captionNeonYellow";
		case "quickIntro": return "captionQuickIntro";
		case "echoedDrop": return "captionEchoedDrop";
		case "cutEchoes": return "captionCutEchoes";
		case "stretchDown": return "captionStretchDown";
		case "blueCircle": return "captionBlueCircle";
		case "unHalved": return "captionUnHalved";
		case "littlePop": return "captionLittlePop";
		case "pop": return "captionPopIn";
		case "fade": return "captionFadeIn";
		case "rise": return "captionRiseIn";
		case "scale": return "captionScaleIn";
		case "slideUp": return "captionSlideUp";
		case "slideDown": return "captionSlideDown";
		case "slideLeft": return "captionSlideLeft";
		case "slideRight": return "captionSlideRight";
		case "bounce": return "captionBounceIn";
		case "pulse": return "captionPulse";
		case "shake": return "captionShake";
		case "jitter": return "captionJitter";
		case "glow": return "captionGlow";
		case "flash": return "captionFlash";
		case "colorChange": return "captionColorChange";
		default: return "";
	}
}

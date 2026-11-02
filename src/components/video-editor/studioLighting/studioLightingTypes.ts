export type StudioLightRole = "key" | "fill" | "rim" | "accent" | "custom";

export interface StudioLight {
	id: string;
	name: string;
	role: StudioLightRole;
	enabled: boolean;
	/** Normalized horizontal position (0.0 to 1.0) relative to the camera clip */
	x: number;
	/** Normalized vertical position (0.0 to 1.0) relative to the camera clip */
	y: number;
	/** Normalized distance / height above the surface (0.1 to 2.0) */
	z: number;
	/** Light intensity multiplier (0.0 to 2.5) */
	intensity: number;
	/** Hex color string (e.g. "#FFF3E0") */
	color: string;
	/** Falloff radius / reach (0.2 to 3.0) */
	radius: number;
	/** Whether this light casts raymarched screen-space soft shadows */
	castShadow: boolean;
	/** Specular highlight glint intensity (0.0 to 1.0) */
	specular: number;
}

export type StudioLightingPresetId =
	| "three-point-classic"
	| "warm-podcaster"
	| "cyberpunk-neon"
	| "corporate-clean"
	| "golden-hour"
	| "rembrandt-dramatic"
	| "ring-light"
	| "custom";

export interface StudioLightingPreset {
	id: StudioLightingPresetId;
	label: string;
	description: string;
	previewGradients: string[];
	settings: Omit<StudioLightingSettings, "enabled" | "presetId">;
}

export interface StudioLightingSettings {
	enabled: boolean;
	presetId: StudioLightingPresetId;
	lights: StudioLight[];
	/** Base ambient illumination intensity (0.0 to 1.0) */
	ambientIntensity: number;
	/** Base ambient tint color */
	ambientColor: string;
	/** Depth responsiveness - scales surface normal reconstruction strength (0.0 to 2.5) */
	depthResponse: number;
	/** Normal smoothing filter strength (0.0 to 2.0) */
	normalSmoothness: number;
	/** Soft shadow penumbra radius / softness (0.0 to 1.0) */
	shadowSoftness: number;
	/** Specular shininess exponent (8.0 to 64.0) */
	specularShininess: number;
	/** Exposure compensation multiplier (0.5 to 2.0) */
	exposure: number;
	/** Contrast enhancement (0.8 to 1.5) */
	contrast: number;
	/** Exponential moving average alpha for temporal depth stabilization (0.1 to 0.9) */
	smoothingAlpha: number;
	/** Depthbake diffuse wrap factor for soft skin scattering (0.0 to 0.5) */
	diffuseWrap?: number;
	/** Depthbake edge halo suppression factor (0.0 to 1.0) */
	haloSuppression?: number;
	/** Depthbake raymarch shadow reach towards light (0.1 to 0.5) */
	shadowReach?: number;
	/** Depthbake raymarch shadow steps (4 to 16) */
	shadowSteps?: number;
}

export const STUDIO_LIGHT_COLOR_SWATCHES = [
	{ name: "Tungsten Warm (3200K)", hex: "#FFB066" },
	{ name: "Golden Warm (3800K)", hex: "#FFD199" },
	{ name: "Studio Neutral (4500K)", hex: "#FFF2E5" },
	{ name: "Daylight White (5600K)", hex: "#F0F6FF" },
	{ name: "Cool Daylight (6500K)", hex: "#D6E8FF" },
	{ name: "Sunset Orange", hex: "#F97316" },
	{ name: "Amber Glow", hex: "#F59E0B" },
	{ name: "Electric Cyan", hex: "#06B6D4" },
	{ name: "Neon Pink", hex: "#F43F5E" },
	{ name: "Deep Indigo", hex: "#6366F1" },
	{ name: "Emerald Mint", hex: "#10B981" },
	{ name: "Pure White", hex: "#FFFFFF" },
] as const;

export const DEFAULT_STUDIO_LIGHTS: StudioLight[] = [
	{
		id: "light-key",
		name: "Key Light",
		role: "key",
		enabled: true,
		x: 0.72,
		y: 0.28,
		z: 0.65,
		intensity: 0.85,
		color: "#FFEED9",
		radius: 1.5,
		castShadow: true,
		specular: 0.4,
	},
	{
		id: "light-fill",
		name: "Fill Light",
		role: "fill",
		enabled: true,
		x: 0.22,
		y: 0.45,
		z: 0.85,
		intensity: 0.45,
		color: "#E2EEFF",
		radius: 1.7,
		castShadow: false,
		specular: 0.2,
	},
	{
		id: "light-rim",
		name: "Rim Light",
		role: "rim",
		enabled: true,
		x: 0.85,
		y: 0.15,
		z: 0.35,
		intensity: 0.65,
		color: "#F8FAFC",
		radius: 1.2,
		castShadow: true,
		specular: 0.5,
	},
];

export const DEFAULT_STUDIO_LIGHTING_SETTINGS: StudioLightingSettings = {
	enabled: false,
	presetId: "three-point-classic",
	lights: DEFAULT_STUDIO_LIGHTS,
	ambientIntensity: 0.5,
	ambientColor: "#202028",
	depthResponse: 1.0,
	normalSmoothness: 1.0,
	shadowSoftness: 0.5,
	specularShininess: 24.0,
	exposure: 1.0,
	contrast: 1.0,
	smoothingAlpha: 0.35,
	diffuseWrap: 0.2,
	haloSuppression: 0.75,
	shadowReach: 0.25,
	shadowSteps: 10,
};


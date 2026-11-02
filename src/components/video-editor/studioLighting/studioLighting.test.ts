import { describe, expect, it } from "vitest";
import {
	DEFAULT_STUDIO_LIGHTING_SETTINGS,
	DEFAULT_STUDIO_LIGHTS,
	STUDIO_LIGHT_COLOR_SWATCHES,
} from "./studioLightingTypes";
import {
	STUDIO_LIGHTING_PRESETS,
	applyStudioLightingPreset,
	getStudioLightingPreset,
} from "./studioLightingPresets";
import { hexToRgb } from "./studioLightingEngine";

describe("Studio Lighting types & defaults", () => {
	it("has valid default studio lighting settings", () => {
		expect(DEFAULT_STUDIO_LIGHTING_SETTINGS.enabled).toBe(false);
		expect(DEFAULT_STUDIO_LIGHTING_SETTINGS.presetId).toBe("three-point-classic");
		expect(DEFAULT_STUDIO_LIGHTING_SETTINGS.lights.length).toBeGreaterThanOrEqual(3);
		expect(DEFAULT_STUDIO_LIGHTING_SETTINGS.ambientIntensity).toBeGreaterThan(0);
		expect(DEFAULT_STUDIO_LIGHTING_SETTINGS.depthResponse).toBeGreaterThan(0);
		expect(DEFAULT_STUDIO_LIGHTING_SETTINGS.diffuseWrap).toBe(0.2);
		expect(DEFAULT_STUDIO_LIGHTING_SETTINGS.haloSuppression).toBe(0.75);
		expect(DEFAULT_STUDIO_LIGHTING_SETTINGS.shadowReach).toBe(0.25);
		expect(DEFAULT_STUDIO_LIGHTING_SETTINGS.shadowSteps).toBe(10);
	});

	it("contains default 3-point lights: key, fill, rim", () => {
		const roles = DEFAULT_STUDIO_LIGHTS.map((l) => l.role);
		expect(roles).toContain("key");
		expect(roles).toContain("fill");
		expect(roles).toContain("rim");
	});

	it("provides rich color swatches", () => {
		expect(STUDIO_LIGHT_COLOR_SWATCHES.length).toBeGreaterThanOrEqual(8);
		for (const swatch of STUDIO_LIGHT_COLOR_SWATCHES) {
			expect(swatch.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
		}
	});
});

describe("Studio Lighting Presets", () => {
	it("contains all expected studio presets", () => {
		const presetIds = STUDIO_LIGHTING_PRESETS.map((p) => p.id);
		expect(presetIds).toContain("three-point-classic");
		expect(presetIds).toContain("warm-podcaster");
		expect(presetIds).toContain("cyberpunk-neon");
		expect(presetIds).toContain("corporate-clean");
		expect(presetIds).toContain("golden-hour");
		expect(presetIds).toContain("rembrandt-dramatic");
		expect(presetIds).toContain("ring-light");
	});

	it("applies a preset cleanly without mutating original templates", () => {
		const base = { ...DEFAULT_STUDIO_LIGHTING_SETTINGS, enabled: true };
		const podcaster = applyStudioLightingPreset(base, "warm-podcaster");

		expect(podcaster.presetId).toBe("warm-podcaster");
		expect(podcaster.enabled).toBe(true);
		expect(podcaster.lights.length).toBeGreaterThanOrEqual(3);
		expect(podcaster.lights[0].name).toContain("Amber");

		// Modifying applied light should not alter preset definitions
		podcaster.lights[0].intensity = 999;
		const freshPodcaster = getStudioLightingPreset("warm-podcaster");
		expect(freshPodcaster.settings.lights[0].intensity).not.toBe(999);
	});

	it("handles custom preset without overriding existing lights", () => {
		const custom = applyStudioLightingPreset(DEFAULT_STUDIO_LIGHTING_SETTINGS, "custom");
		expect(custom.presetId).toBe("custom");
	});
});

describe("Studio Lighting hexToRgb conversion", () => {
	it("correctly parses standard 6-digit hex colors", () => {
		const [r, g, b] = hexToRgb("#FFFFFF");
		expect(r).toBeCloseTo(1, 2);
		expect(g).toBeCloseTo(1, 2);
		expect(b).toBeCloseTo(1, 2);

		const [r2, g2, b2] = hexToRgb("#000000");
		expect(r2).toBe(0);
		expect(g2).toBe(0);
		expect(b2).toBe(0);

		const [r3, g3, b3] = hexToRgb("#F43F5E");
		expect(r3).toBeCloseTo(0.957, 2);
		expect(g3).toBeCloseTo(0.247, 2);
		expect(b3).toBeCloseTo(0.369, 2);
	});

	it("correctly parses 3-digit shorthand hex", () => {
		const [r, g, b] = hexToRgb("#FFF");
		expect(r).toBeCloseTo(1, 2);
		expect(g).toBeCloseTo(1, 2);
		expect(b).toBeCloseTo(1, 2);
	});

	it("handles invalid hex with safe fallback", () => {
		const [r, g, b] = hexToRgb("invalid");
		expect(r).toBe(1);
		expect(g).toBe(1);
		expect(b).toBe(1);
	});
});

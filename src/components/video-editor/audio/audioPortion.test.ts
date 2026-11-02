import { describe, expect, it } from "vitest";
import {
	type AudioPortion,
	applyAudioPortionsToBuffer,
	clampAudioPortion,
	createDefaultAudioPortion,
	getEffectivePortionGain,
} from "./audioPortion";

describe("audioPortion helpers", () => {
	it("returns 1 when no portions are present", () => {
		expect(getEffectivePortionGain([], 1000)).toBe(1);
		expect(getEffectivePortionGain(undefined, 1000)).toBe(1);
	});

	it("calculates gain inside a portion accurately", () => {
		const portions: AudioPortion[] = [
			{ id: "p1", startMs: 2000, endMs: 5000, volume: 1.5, trackId: "all" },
		];

		// Before portion
		expect(getEffectivePortionGain(portions, 1000)).toBe(1);
		// Inside portion
		expect(getEffectivePortionGain(portions, 3000)).toBe(1.5);
		// After portion
		expect(getEffectivePortionGain(portions, 6000)).toBe(1);
	});

	it("supports muting a portion (volume 0)", () => {
		const portions: AudioPortion[] = [
			{ id: "p1", startMs: 2000, endMs: 5000, volume: 0, trackId: "all" },
		];

		expect(getEffectivePortionGain(portions, 3000)).toBe(0);
	});

	it("filters by trackId when specified", () => {
		const portions: AudioPortion[] = [
			{ id: "p1", startMs: 2000, endMs: 5000, volume: 0.2, trackId: "mic" },
		];

		// For mic track, gain is 0.2
		expect(getEffectivePortionGain(portions, 3000, "mic")).toBe(0.2);
		// For system track, gain is unaffected (1.0)
		expect(getEffectivePortionGain(portions, 3000, "system")).toBe(1);
	});

	it("creates default audio portion correctly", () => {
		const portion = createDefaultAudioPortion(5000, 20000, 2);
		expect(portion.startMs).toBe(5000);
		expect(portion.endMs).toBe(8000);
		expect(portion.volume).toBe(1.0);
		expect(portion.label).toBe("Portion 2");
	});

	it("clamps portion boundaries to timeline bounds", () => {
		const clamped = clampAudioPortion(
			{ id: "p1", startMs: -500, endMs: 30000, volume: 5 },
			10000,
		);
		expect(clamped.startMs).toBe(0);
		expect(clamped.endMs).toBe(10000);
		expect(clamped.volume).toBe(3);
	});

	it("modulates AudioBuffer PCM samples with applyAudioPortionsToBuffer", () => {
		const sampleRate = 1000; // 1 sample per ms
		const channelData = new Float32Array(5000).fill(1.0);
		const mockBuffer = {
			sampleRate,
			length: 5000,
			numberOfChannels: 1,
			getChannelData: () => channelData,
		} as unknown as AudioBuffer;

		const portions: AudioPortion[] = [
			{ id: "p1", startMs: 1000, endMs: 3000, volume: 0.5, trackId: "all" },
		];

		// Buffer starts at 0ms
		applyAudioPortionsToBuffer(mockBuffer, 0, portions, "all");

		// At 500ms (before portion): gain is 1.0
		expect(channelData[500]).toBeCloseTo(1.0, 2);
		// At 2000ms (inside portion): gain is 0.5
		expect(channelData[2000]).toBeCloseTo(0.5, 2);
		// At 4000ms (after portion): gain is 1.0
		expect(channelData[4000]).toBeCloseTo(1.0, 2);
	});
});

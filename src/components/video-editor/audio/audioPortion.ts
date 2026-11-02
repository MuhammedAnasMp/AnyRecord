export type AudioPortionTrack = "all" | "system" | "mic" | "webcam";

export interface AudioPortion {
	id: string;
	startMs: number;
	endMs: number;
	volume: number; // 0 to 2 (0% to 200%, default 1.0)
	gainMultiplier?: number;
	trackId?: AudioPortionTrack;
	targetTrack?: AudioPortionTrack;
	label?: string;
}

const RAMP_TIME_MS = 30; // 30ms ramp at boundaries to prevent audible clicking

/**
 * Calculates the volume multiplier (gain) at a specific timestamp given a list of audio portions.
 * Supports smooth ramps at portion boundaries to avoid pops/clicks.
 */
export function getEffectivePortionGain(
	portions: AudioPortion[] | undefined,
	timeMs: number,
	trackId?: string,
): number {
	if (!portions || portions.length === 0) return 1;

	let gain = 1;
	for (const portion of portions) {
		const targetTrack = portion.trackId ?? portion.targetTrack;
		if (
			targetTrack &&
			targetTrack !== "all" &&
			trackId &&
			trackId !== "all" &&
			targetTrack !== trackId
		) {
			continue;
		}

		if (timeMs >= portion.startMs - RAMP_TIME_MS && timeMs <= portion.endMs + RAMP_TIME_MS) {
			const rawVol = Number.isFinite(portion.volume)
				? portion.volume
				: Number.isFinite(portion.gainMultiplier)
					? (portion.gainMultiplier as number)
					: 1;
			const targetVolume = Math.max(0, Math.min(3, rawVol));
			// If inside the portion body, apply full target volume
			if (timeMs >= portion.startMs + RAMP_TIME_MS && timeMs <= portion.endMs - RAMP_TIME_MS) {
				gain *= targetVolume;
			} else if (timeMs >= portion.startMs - RAMP_TIME_MS && timeMs < portion.startMs + RAMP_TIME_MS) {
				// Ramp in
				const progress = Math.max(0, Math.min(1, (timeMs - (portion.startMs - RAMP_TIME_MS)) / (RAMP_TIME_MS * 2)));
				const interpolated = 1 + (targetVolume - 1) * progress;
				gain *= interpolated;
			} else if (timeMs > portion.endMs - RAMP_TIME_MS && timeMs <= portion.endMs + RAMP_TIME_MS) {
				// Ramp out
				const progress = Math.max(0, Math.min(1, (timeMs - (portion.endMs - RAMP_TIME_MS)) / (RAMP_TIME_MS * 2)));
				const interpolated = targetVolume + (1 - targetVolume) * progress;
				gain *= interpolated;
			}
		}
	}

	return Math.max(0, Math.min(3, gain));
}

/**
 * Factory to create a default audio portion at a given time
 */
export function createDefaultAudioPortion(
	currentMs: number,
	maxDurationMs: number,
	portionIndex = 1,
): AudioPortion {
	const defaultDuration = 3000;
	const safeMax = Math.max(1000, maxDurationMs);
	const startMs = Math.max(0, Math.min(safeMax - 500, Math.round(currentMs)));
	const endMs = Math.min(safeMax, startMs + defaultDuration);

	return {
		id: `portion-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
		startMs,
		endMs: endMs > startMs ? endMs : startMs + 1000,
		volume: 1.0,
		gainMultiplier: 1.0,
		trackId: "all",
		targetTrack: "all",
		label: `Portion ${portionIndex}`,
	};
}

/**
 * Clamps portion boundaries to the valid timeline duration
 */
export function clampAudioPortion(
	portion: AudioPortion,
	maxDurationMs = 100_000_000,
): AudioPortion {
	const safeMax = Math.max(500, maxDurationMs);
	const startMs = Math.max(0, Math.min(safeMax - 100, Math.round(portion.startMs)));
	const endMs = Math.max(startMs + 100, Math.min(safeMax, Math.round(portion.endMs)));
	const rawVol = Number.isFinite(portion.volume)
		? portion.volume
		: Number.isFinite(portion.gainMultiplier)
			? (portion.gainMultiplier as number)
			: 1;
	const volume = Math.max(0, Math.min(3, rawVol));
	const track = portion.trackId ?? portion.targetTrack ?? "all";

	return {
		...portion,
		startMs,
		endMs,
		volume,
		gainMultiplier: volume,
		trackId: track,
		targetTrack: track,
	};
}

/**
 * Applies audio portions gain automation directly to an AudioBuffer's PCM data.
 * Used for offline export rendering (WAV and AAC) to ensure smooth, click-free, sample-accurate volume adjustments.
 */
export function applyAudioPortionsToBuffer(
	buffer: AudioBuffer,
	outputStartMs: number,
	portions?: AudioPortion[],
	trackId?: string,
): void {
	if (!portions || portions.length === 0) return;
	const sampleRate = buffer.sampleRate;
	const length = buffer.length;
	const durationMs = (length / sampleRate) * 1000;
	const outputEndMs = outputStartMs + durationMs;

	// Check if any portion overlaps with [outputStartMs, outputEndMs]
	const hasOverlap = portions.some((p) => {
		const targetTrack = p.trackId ?? p.targetTrack;
		const trackMatches =
			!targetTrack || targetTrack === "all" || !trackId || trackId === "all" || targetTrack === trackId;
		return trackMatches && p.endMs + RAMP_TIME_MS > outputStartMs && p.startMs - RAMP_TIME_MS < outputEndMs;
	});
	if (!hasOverlap) return;

	// Process in small steps (64 samples = ~1.3ms at 48kHz)
	const step = 64;
	const channels = buffer.numberOfChannels;
	const channelData: Float32Array[] = [];
	for (let c = 0; c < channels; c++) {
		channelData.push(buffer.getChannelData(c));
	}

	for (let i = 0; i < length; i += step) {
		const blockEnd = Math.min(length, i + step);
		const timeMs = outputStartMs + (i / sampleRate) * 1000;
		const gain = getEffectivePortionGain(portions, timeMs, trackId);
		if (Math.abs(gain - 1) < 0.0001) continue;

		for (let c = 0; c < channels; c++) {
			const data = channelData[c];
			for (let j = i; j < blockEnd; j++) {
				data[j] *= gain;
			}
		}
	}
}

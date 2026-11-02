import type { CaptionWordState } from "./captionLayout";
import { DEFAULT_AUTO_CAPTION_SETTINGS } from "./types";

export const CAPTION_FONT_WEIGHT = 700;
export const CAPTION_LINE_HEIGHT = 1.25;

export const BASE_CAPTION_PREVIEW_WIDTH = 960;

export function getCaptionTargetWidth(containerWidth: number, maxWidthPercent: number) {
	return Math.max(1, containerWidth * (maxWidthPercent / 100));
}

/**
 * Computes font size that scales linearly and consistently with video container width,
 * ensuring 100% visual ratio match between live preview and exported video.
 */
export function getCaptionScaledFontSize(
	fontSize: number,
	containerWidth: number,
	_maxWidthPercent?: number,
) {
	const scale = containerWidth / BASE_CAPTION_PREVIEW_WIDTH;
	return Math.max(1, fontSize * scale);
}

export function getCaptionPadding(fontSize: number, paddingX?: number, paddingY?: number) {
	const baseline = DEFAULT_AUTO_CAPTION_SETTINGS.fontSize || 30;
	const scale = fontSize / baseline;
	return {
		x: (paddingX ?? 16) * scale,
		y: (paddingY ?? 10) * scale,
	};
}

export function getCaptionScaledRadius(radius: number = 17.5, fontSize: number = 30) {
	const baseline = Math.max(1, DEFAULT_AUTO_CAPTION_SETTINGS.fontSize || 30);
	return Math.max(0, radius * (fontSize / baseline));
}

export function getCaptionTextMaxWidth(
	containerWidth: number,
	maxWidthPercent: number,
	fontSize: number,
	paddingX?: number,
) {
	const padding = getCaptionPadding(fontSize, paddingX);
	return Math.max(
		fontSize * 2,
		getCaptionTargetWidth(containerWidth, maxWidthPercent) - padding.x * 2,
	);
}

export function getCaptionWordVisualState(
	hasWordTimings: boolean,
	state: CaptionWordState,
) {
	if (!hasWordTimings) {
		return {
			isActive: false,
			isInactive: false,
			opacity: 1,
		};
	}

	if (state === "active") {
		return {
			isActive: true,
			isInactive: false,
			opacity: 1,
		};
	}

	if (state === "upcoming") {
		return {
			isActive: false,
			isInactive: true,
			opacity: 0.6,
		};
	}

	// Spoken
	return {
		isActive: false,
		isInactive: false,
		opacity: 1,
	};
}

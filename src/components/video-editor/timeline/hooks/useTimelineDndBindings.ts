import type { Span } from "dnd-timeline";
import { useCallback, useMemo } from "react";
import type {
	AnnotationRegion,
	AudioRegion,
	CaptionCue,
	ClipRegion,
	SpeedRegion,
	TrimRegion,
	ZoomRegion,
} from "../../types";
import type { FingerGestureRegion } from "../../gestures/gestureTypes";
import type { AudioPortion } from "../../audio/audioPortion";
import {
	getAnnotationTrackIndex,
	getAudioTrackIndex,
	isAnnotationTrackRowId,
	isAudioTrackRowId,
} from "../core/rows";
import { spansOverlap } from "../core/spans";
import type { ClipSequenceSpan, TimelineRenderItem } from "../core/timelineTypes";
import { buildAllRegionSpans, buildTimelineItems, resolveDropRowId } from "../model/timelineModel";

interface UseTimelineDndBindingsParams {
	zoomRegions: ZoomRegion[];
	trimRegions: TrimRegion[];
	clipRegions: ClipRegion[];
	cameraRegions?: import("../core/timelineTypes").CameraRegion[];
	annotationRegions: AnnotationRegion[];
	speedRegions: SpeedRegion[];
	audioRegions: AudioRegion[];
	captionCues: CaptionCue[];
	gestureRegions?: FingerGestureRegion[];
	audioPortions?: AudioPortion[];
	onZoomSpanChange: (id: string, span: Span) => void;
	onTrimSpanChange?: (id: string, span: Span) => void;
	onClipSpanChange?: (id: string, span: ClipSequenceSpan) => void;
	onCameraSpanChange?: (id: string, span: Span) => void;
	onAnnotationSpanChange?: (id: string, span: Span, trackIndex?: number) => void;
	onSpeedSpanChange?: (id: string, span: Span) => void;
	onAudioSpanChange?: (id: string, span: Span, trackIndex?: number) => void;
	onCaptionSpanChange?: (id: string, span: Span) => void;
	onGestureSpanChange?: (id: string, span: Span) => void;
	onAudioPortionSpanChange?: (id: string, span: Span) => void;
}

type TimelineItemKind =
	| "zoom"
	| "trim"
	| "clip"
	| "camera"
	| "annotation"
	| "speed"
	| "audio"
	| "caption"
	| "gesture"
	| "audio-portion"
	| null;

export function useTimelineDndBindings({
	zoomRegions,
	trimRegions,
	clipRegions,
	cameraRegions = [],
	annotationRegions,
	speedRegions,
	audioRegions,
	captionCues,
	gestureRegions = [],
	audioPortions = [],
	onZoomSpanChange,
	onTrimSpanChange,
	onClipSpanChange,
	onCameraSpanChange,
	onAnnotationSpanChange,
	onSpeedSpanChange,
	onAudioSpanChange,
	onCaptionSpanChange,
	onGestureSpanChange,
	onAudioPortionSpanChange,
}: UseTimelineDndBindingsParams) {
	const resolveItemKind = useCallback(
		(id: string): TimelineItemKind => {
			if (zoomRegions.some((r) => r.id === id)) return "zoom";
			if (trimRegions.some((r) => r.id === id)) return "trim";
			if (clipRegions.some((r) => r.id === id)) return "clip";
			if (cameraRegions.some((c) => c.id === id)) return "camera";
			if (annotationRegions.some((r) => r.id === id)) return "annotation";
			if (speedRegions.some((r) => r.id === id)) return "speed";
			if (audioRegions.some((r) => r.id === id)) return "audio";
			if (captionCues.some((c) => c.id === id)) return "caption";
			if (gestureRegions.some((g) => g.id === id)) return "gesture";
			if (audioPortions.some((p) => p.id === id)) return "audio-portion";
			return null;
		},
		[
			zoomRegions,
			trimRegions,
			clipRegions,
			cameraRegions,
			annotationRegions,
			speedRegions,
			audioRegions,
			captionCues,
			gestureRegions,
			audioPortions,
		],
	);

	const resolveTrackIndex = useCallback(
		(kind: "annotation" | "audio", id: string, rowId?: string): number => {
			if (kind === "annotation") {
				return rowId && isAnnotationTrackRowId(rowId)
					? getAnnotationTrackIndex(rowId)
					: (annotationRegions.find((region) => region.id === id)?.trackIndex ?? 0);
			}
			return rowId && isAudioTrackRowId(rowId)
				? getAudioTrackIndex(rowId)
				: (audioRegions.find((region) => region.id === id)?.trackIndex ?? 0);
		},
		[annotationRegions, audioRegions],
	);

	const hasOverlap = useCallback(
		(newSpan: Span, excludeId?: string, rowId?: string): boolean => {
			if (!excludeId) return false;
			const itemKind = resolveItemKind(excludeId);

			if (itemKind === "annotation") return false;

			const checkOverlap = (regions: { id: string; startMs: number; endMs: number }[]) =>
				regions.some((region) => {
					if (region.id === excludeId) return false;
					return spansOverlap(newSpan, { start: region.startMs, end: region.endMs });
				});

			if (itemKind === "zoom") return checkOverlap(zoomRegions);
			if (itemKind === "trim") return checkOverlap(trimRegions);
			if (itemKind === "clip") return checkOverlap(clipRegions);
			if (itemKind === "camera") return checkOverlap(cameraRegions);
			if (itemKind === "speed") return checkOverlap(speedRegions);
			if (itemKind === "audio-portion") return checkOverlap(audioPortions);
			// Captions share a single lane and must never overlap, so validate a dragged or
			// resized caption against the other cues just like the other timeline items.
			if (itemKind === "caption") return checkOverlap(captionCues);

			if (itemKind === "audio") {
				const activeTrackIndex = resolveTrackIndex("audio", excludeId, rowId);
				return checkOverlap(
					audioRegions.filter((region) => (region.trackIndex ?? 0) === activeTrackIndex),
				);
			}

			return false;
		},
		[
			resolveItemKind,
			resolveTrackIndex,
			zoomRegions,
			trimRegions,
			clipRegions,
			cameraRegions,
			audioRegions,
			speedRegions,
			captionCues,
			audioPortions,
		],
	);

	const timelineItems = useMemo<TimelineRenderItem[]>(
		() =>
			buildTimelineItems({
				zoomRegions,
				clipRegions,
				cameraRegions,
				annotationRegions,
				audioRegions,
				captionCues,
				gestureRegions,
				audioPortions,
			}),
		[
			zoomRegions,
			clipRegions,
			cameraRegions,
			annotationRegions,
			audioRegions,
			captionCues,
			gestureRegions,
			audioPortions,
		],
	);

	const allRegionSpans = useMemo(
		() =>
			buildAllRegionSpans({
				zoomRegions,
				clipRegions,
				cameraRegions,
				audioRegions,
				annotationRegions,
				captionCues,
				gestureRegions,
				audioPortions,
			}),
		[
			zoomRegions,
			clipRegions,
			cameraRegions,
			audioRegions,
			annotationRegions,
			captionCues,
			gestureRegions,
			audioPortions,
		],
	);

	const getResolvedDropRowId = useCallback(
		(id: string, proposedRowId: string) => resolveDropRowId(id, proposedRowId, timelineItems),
		[timelineItems],
	);

	const handleItemSpanChange = useCallback(
		(id: string, span: ClipSequenceSpan, rowId?: string) => {
			const itemKind = resolveItemKind(id);
			if (itemKind === "zoom") {
				onZoomSpanChange(id, span);
			} else if (itemKind === "trim") {
				onTrimSpanChange?.(id, span);
			} else if (itemKind === "clip") {
				onClipSpanChange?.(id, span);
			} else if (itemKind === "camera") {
				onCameraSpanChange?.(id, span);
			} else if (itemKind === "annotation") {
				const nextTrackIndex = resolveTrackIndex("annotation", id, rowId);
				onAnnotationSpanChange?.(id, span, nextTrackIndex);
			} else if (itemKind === "speed") {
				onSpeedSpanChange?.(id, span);
			} else if (itemKind === "audio") {
				const nextTrackIndex = resolveTrackIndex("audio", id, rowId);
				onAudioSpanChange?.(id, span, nextTrackIndex);
			} else if (itemKind === "caption") {
				onCaptionSpanChange?.(id, span);
			} else if (itemKind === "gesture") {
				onGestureSpanChange?.(id, span);
			} else if (itemKind === "audio-portion") {
				onAudioPortionSpanChange?.(id, span);
			}
		},
		[
			resolveItemKind,
			resolveTrackIndex,
			onZoomSpanChange,
			onTrimSpanChange,
			onClipSpanChange,
			onCameraSpanChange,
			onAnnotationSpanChange,
			onSpeedSpanChange,
			onAudioSpanChange,
			onCaptionSpanChange,
			onGestureSpanChange,
			onAudioPortionSpanChange,
		],
	);

	return {
		hasOverlap,
		timelineItems,
		allRegionSpans,
		getResolvedDropRowId,
		handleItemSpanChange,
	};
}

import type { Span } from "dnd-timeline";
import type { ForwardedRef, RefObject } from "react";
import { useCallback, useImperativeHandle } from "react";
import type {
	AnnotationRegion,
	AudioRegion,
	CaptionCue,
	ClipRegion,
	CursorTelemetryPoint,
	SpeedRegion,
	TrimRegion,
	ZoomFocus,
	ZoomRegion,
} from "../../types";
import type { ClipSequenceSpan, TimelineShortcutBindings } from "../core/timelineTypes";
import type { AudioPortion } from "../../audio/audioPortion";
import type { TimelineEditorHandle } from "../TimelineEditor";
import { useTimelineAudioActions } from "./actions/useTimelineAudioActions";
import { useTimelineCaptionActions } from "./actions/useTimelineCaptionActions";
import { useTimelineZoomActions } from "./actions/useTimelineZoomActions";
import { useTimelineDndBindings } from "./useTimelineDndBindings";
import { useTimelineKeyboardShortcuts } from "./useTimelineKeyboardShortcuts";
import { useTimelineNormalization } from "./useTimelineNormalization";
import { useTimelineSelection } from "./useTimelineSelection";

interface UseTimelineEditorRuntimeParams {
	ref: ForwardedRef<TimelineEditorHandle>;
	videoDuration: number;
	totalMs: number;
	currentTimeMs: number;
	safeMinDurationMs: number;
	cursorTelemetry: CursorTelemetryPoint[];
	autoSuggestZoomsTrigger: number;
	onAutoSuggestZoomsConsumed?: () => void;
	disableSuggestedZooms: boolean;
	zoomRegions: ZoomRegion[];
	onZoomAdded: (span: Span) => void;
	onZoomSuggested?: (span: Span, focus: ZoomFocus) => void;
	onZoomSpanChange: (id: string, span: Span) => void;
	onZoomDelete: (id: string) => void;
	selectedZoomId: string | null;
	onSelectZoom: (id: string | null) => void;
	trimRegions: TrimRegion[];
	onTrimSpanChange?: (id: string, span: Span) => void;
	clipRegions: ClipRegion[];
	onClipSplit?: (splitMs: number) => void;
	onClipSpanChange?: (id: string, span: ClipSequenceSpan) => void;
	onClipDelete?: (id: string) => void;
	selectedClipId?: string | null;
	onSelectClip?: (id: string | null) => void;
	cameraRegions?: import("../core/timelineTypes").CameraRegion[];
	onCameraSplit?: (splitMs: number) => void;
	onCameraSpanChange?: (id: string, span: Span) => void;
	onCameraDelete?: (id: string) => void;
	selectedCameraId?: string | null;
	onSelectCamera?: (id: string | null) => void;
	annotationRegions: AnnotationRegion[];
	onAnnotationAdded?: (span: Span, trackIndex?: number) => void;
	onAnnotationSpanChange?: (id: string, span: Span, trackIndex?: number) => void;
	onAnnotationDelete?: (id: string) => void;
	selectedAnnotationId?: string | null;
	onSelectAnnotation?: (id: string | null) => void;
	speedRegions: SpeedRegion[];
	onSpeedSpanChange?: (id: string, span: Span) => void;
	audioRegions: AudioRegion[];
	onAudioAdded?: (span: Span, audioPath: string, trackIndex?: number) => void;
	onAudioSpanChange?: (id: string, span: Span, trackIndex?: number) => void;
	onAudioDelete?: (id: string) => void;
	selectedAudioId?: string | null;
	onSelectAudio?: (id: string | null) => void;
	captionCues: CaptionCue[];
	onCaptionSpanChange?: (id: string, span: Span) => void;
	onCaptionDelete?: (id: string) => void;
	onCaptionAdded?: (span: Span) => void;
	selectedCaptionId?: string | null;
	onSelectCaption?: (id: string | null) => void;
	gestureRegions?: import("../../gestures/gestureTypes").FingerGestureRegion[];
	onGestureSpanChange?: (id: string, span: Span) => void;
	onGestureDelete?: (id: string) => void;
	selectedGestureId?: string | null;
	onSelectGesture?: (id: string | null) => void;
	gestureTrackingEnabled?: boolean;
	audioPortions?: AudioPortion[];
	onAudioPortionSpanChange?: (id: string, span: Span) => void;
	onAudioPortionDelete?: (id: string) => void;
	onAudioPortionAdded?: (span: Span) => void;
	selectedAudioPortionId?: string | null;
	onSelectAudioPortion?: (id: string | null) => void;
	isMac: boolean;
	keyShortcuts: TimelineShortcutBindings;
	isTimelineFocusedRef: RefObject<boolean | null>;
}

export function useTimelineEditorRuntime({
	ref,
	videoDuration,
	totalMs,
	currentTimeMs,
	safeMinDurationMs,
	cursorTelemetry,
	autoSuggestZoomsTrigger,
	onAutoSuggestZoomsConsumed,
	disableSuggestedZooms,
	zoomRegions,
	onZoomAdded,
	onZoomSuggested,
	onZoomSpanChange,
	onZoomDelete,
	selectedZoomId,
	onSelectZoom,
	trimRegions,
	onTrimSpanChange,
	clipRegions,
	onClipSplit,
	onClipSpanChange,
	onClipDelete,
	selectedClipId,
	onSelectClip,
	cameraRegions = [],
	onCameraSplit,
	onCameraSpanChange,
	onCameraDelete,
	selectedCameraId,
	onSelectCamera,
	annotationRegions,
	onAnnotationAdded,
	onAnnotationSpanChange,
	onAnnotationDelete,
	selectedAnnotationId,
	onSelectAnnotation,
	speedRegions,
	onSpeedSpanChange,
	audioRegions,
	onAudioAdded,
	onAudioSpanChange,
	onAudioDelete,
	selectedAudioId,
	onSelectAudio,
	captionCues,
	onCaptionSpanChange,
	onCaptionDelete,
	onCaptionAdded,
	selectedCaptionId,
	onSelectCaption,
	gestureRegions = [],
	onGestureSpanChange,
	onGestureDelete,
	selectedGestureId,
	onSelectGesture,
	audioPortions = [],
	onAudioPortionSpanChange,
	onAudioPortionDelete,
	onAudioPortionAdded,
	selectedAudioPortionId,
	onSelectAudioPortion,
	isMac,
	keyShortcuts,
	isTimelineFocusedRef,
}: UseTimelineEditorRuntimeParams) {
	const {
		keyframes,
		selectedKeyframeId,
		setSelectedKeyframeId,
		selectAllBlocksActive,
		setSelectAllBlocksActive,
		hasAnyZoomBlocks,
		activateSelectAllZooms,
		addKeyframe,
		deleteSelectedKeyframe,
		handleKeyframeMove,
		deleteSelectedZoom,
		deleteSelectedClip,
		deleteSelectedAnnotation,
		deleteSelectedAudio,
		deleteSelectedCaption,
		deleteSelectedGesture,
		deleteSelectedAudioPortion,
		clearSelectedBlocks,
		handleSelectZoom,
		handleSelectClip,
		handleSelectCamera,
		handleSelectAnnotation,
		handleSelectAudio,
		handleSelectCaption,
		handleSelectGesture,
		handleSelectAudioPortion,
		deleteSelectedCamera,
		cycleAnnotationsAtCurrentTime,
	} = useTimelineSelection({
		totalMs,
		currentTimeMs,
		zoomRegions,
		clipRegions,
		annotationRegions,
		audioRegions,
		selectedZoomId,
		selectedClipId,
		selectedCameraId,
		selectedAnnotationId,
		selectedAudioId,
		selectedCaptionId,
		selectedGestureId,
		selectedAudioPortionId,
		onZoomDelete,
		onClipDelete,
		onCameraDelete,
		onAnnotationDelete,
		onAudioDelete,
		onCaptionDelete,
		onGestureDelete,
		onAudioPortionDelete,
		onSelectZoom,
		onSelectClip,
		onSelectCamera,
		onSelectAnnotation,
		onSelectAudio,
		onSelectCaption,
		onSelectGesture,
		onSelectAudioPortion,
	});

	useTimelineNormalization({
		totalMs,
		safeMinDurationMs,
		zoomRegions,
		trimRegions,
		speedRegions,
		audioRegions,
		onZoomSpanChange,
		onTrimSpanChange,
		onSpeedSpanChange,
		onAudioSpanChange,
	});

	const {
		hasOverlap,
		timelineItems,
		allRegionSpans,
		getResolvedDropRowId,
		handleItemSpanChange,
	} = useTimelineDndBindings({
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
	});

	const {
		defaultRegionDurationMs,
		canPlaceZoomAtMs,
		addZoomAtMs,
		handleAddZoom,
		handleSuggestZooms,
	} = useTimelineZoomActions({
		timeline: { videoDuration, totalMs, currentTimeMs },
		regions: { zoom: zoomRegions, clip: clipRegions },
		cursorTelemetry,
		options: { disableSuggestedZooms },
		autoSuggestZoomsTrigger,
		onAutoSuggestZoomsConsumed,
		onZoomAdded,
		onZoomSuggested,
	});

	const { canPlaceCaptionAtMs, addCaptionAtMs, resolveCaptionSpanAtMs } =
		useTimelineCaptionActions({
			totalMs,
			captionRegions: captionCues,
			onCaptionAdded,
		});

	const handleSplitClip = useCallback(() => {
		if (!videoDuration || videoDuration === 0 || totalMs === 0) {
			return;
		}
		if (selectedCameraId && onCameraSplit) {
			onCameraSplit(currentTimeMs);
			return;
		}
		if (onClipSplit) {
			onClipSplit(currentTimeMs);
		}
	}, [videoDuration, totalMs, currentTimeMs, selectedCameraId, onCameraSplit, onClipSplit]);

	const { handleAddAudio } = useTimelineAudioActions({
		timeline: { videoDuration, totalMs, currentTimeMs },
		regions: { audio: audioRegions },
		onAudioAdded,
	});

	const handleAddAnnotation = useCallback(
		(trackIndex = 0) => {
			if (!videoDuration || videoDuration === 0 || totalMs === 0 || !onAnnotationAdded) {
				return;
			}

			const defaultDuration = Math.min(defaultRegionDurationMs, totalMs);
			if (defaultDuration <= 0) {
				return;
			}

			const latestStartPos = Math.max(0, totalMs - defaultDuration);
			const startPos = Math.max(0, Math.min(currentTimeMs, latestStartPos));
			const endPos = Math.min(startPos + defaultDuration, totalMs);
			onAnnotationAdded({ start: startPos, end: endPos }, trackIndex);
		},
		[videoDuration, totalMs, currentTimeMs, defaultRegionDurationMs, onAnnotationAdded],
	);

	useTimelineKeyboardShortcuts({
		isMac,
		keyShortcuts,
		isTimelineFocusedRef,
		hasAnyZoomBlocks,
		activateSelectAllZooms,
		annotationCount: annotationRegions.length,
		selectedKeyframeId,
		selectedZoomId,
		selectedClipId,
		selectedCameraId,
		selectedAnnotationId,
		selectedAudioId,
		selectedCaptionId,
		selectedAudioPortionId,
		selectAllBlocksActive,
		addKeyframe,
		handleAddZoom,
		handleSplitClip,
		handleAddAnnotation: () => handleAddAnnotation(),
		deleteSelectedKeyframe,
		deleteSelectedZoom,
		deleteSelectedClip,
		deleteSelectedCamera,
		deleteSelectedAnnotation,
		deleteSelectedAudio,
		deleteSelectedCaption,
		deleteSelectedAudioPortion,
		cycleAnnotationsAtCurrentTime,
	});

	const canPlaceAudioPortionAtMs = useCallback(
		(startMs: number) => {
			if (!videoDuration || videoDuration === 0 || totalMs === 0) return false;
			const startPos = Math.max(0, Math.min(startMs, totalMs));
			return !audioPortions.some((p) => startPos >= p.startMs && startPos < p.endMs);
		},
		[videoDuration, totalMs, audioPortions],
	);

	const addAudioPortionAtMs = useCallback(
		(startMs: number) => {
			if (!videoDuration || videoDuration === 0 || totalMs === 0) return;
			const defaultDuration = Math.min(2500, totalMs);
			const startPos = Math.max(0, Math.min(startMs, totalMs));
			const sorted = [...audioPortions].sort((a, b) => a.startMs - b.startMs);
			const next = sorted.find((p) => p.startMs > startPos);
			const endPos = next
				? Math.min(startPos + defaultDuration, next.startMs)
				: Math.min(startPos + defaultDuration, totalMs);
			if (endPos <= startPos) return;
			onAudioPortionAdded?.({ start: startPos, end: endPos });
		},
		[videoDuration, totalMs, audioPortions, onAudioPortionAdded],
	);

	useImperativeHandle(
		ref,
		() => ({
			addZoom: handleAddZoom,
			suggestZooms: handleSuggestZooms,
			splitClip: handleSplitClip,
			addAnnotation: handleAddAnnotation,
			addAudio: handleAddAudio,
			keyframes,
		}),
		[
			handleAddAnnotation,
			handleAddAudio,
			handleAddZoom,
			handleSuggestZooms,
			handleSplitClip,
			keyframes,
		],
	);

	return {
		keyframes,
		selectedKeyframeId,
		setSelectedKeyframeId,
		selectAllBlocksActive,
		setSelectAllBlocksActive,
		handleKeyframeMove,
		clearSelectedBlocks,
		handleSelectZoom,
		handleSelectClip,
		handleSelectCamera,
		handleSelectAnnotation,
		handleSelectAudio,
		handleSelectCaption,
		handleSelectGesture,
		handleSelectAudioPortion,
		deleteSelectedCamera,
		deleteSelectedGesture,
		deleteSelectedAudioPortion,
		hasOverlap,
		timelineItems,
		allRegionSpans,
		getResolvedDropRowId,
		handleItemSpanChange,
		canPlaceZoomAtMs,
		addZoomAtMs,
		canPlaceCaptionAtMs,
		addCaptionAtMs,
		resolveCaptionSpanAtMs,
		canPlaceAudioPortionAtMs,
		addAudioPortionAtMs,
		handleAddZoom,
		handleSuggestZooms,
		handleSplitClip,
		handleAddAudio,
		handleAddAnnotation,
	};
}

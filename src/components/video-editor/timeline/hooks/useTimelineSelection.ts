import { useCallback, useMemo, useState } from "react";
import type { TimelineRegion } from "../core/timelineTypes";

interface UseTimelineSelectionParams {
	totalMs: number;
	currentTimeMs: number;
	zoomRegions: TimelineRegion[];
	clipRegions: TimelineRegion[];
	annotationRegions: (TimelineRegion & { zIndex: number })[];
	audioRegions: TimelineRegion[];
	selectedZoomId: string | null;
	selectedClipId?: string | null;
	selectedCameraId?: string | null;
	selectedAnnotationId?: string | null;
	selectedAudioId?: string | null;
	selectedCaptionId?: string | null;
	selectedGestureId?: string | null;
	selectedAudioPortionId?: string | null;
	onZoomDelete: (id: string) => void;
	onClipDelete?: (id: string) => void;
	onCameraDelete?: (id: string) => void;
	onAnnotationDelete?: (id: string) => void;
	onAudioDelete?: (id: string) => void;
	onCaptionDelete?: (id: string) => void;
	onGestureDelete?: (id: string) => void;
	onAudioPortionDelete?: (id: string) => void;
	onSelectZoom: (id: string | null) => void;
	onSelectClip?: (id: string | null) => void;
	onSelectCamera?: (id: string | null) => void;
	onSelectAnnotation?: (id: string | null) => void;
	onSelectAudio?: (id: string | null) => void;
	onSelectCaption?: (id: string | null) => void;
	onSelectGesture?: (id: string | null) => void;
	onSelectAudioPortion?: (id: string | null) => void;
}

export function useTimelineSelection({
	totalMs,
	currentTimeMs,
	zoomRegions,
	annotationRegions,
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
}: UseTimelineSelectionParams) {
	const [keyframes, setKeyframes] = useState<{ id: string; time: number }[]>([]);
	const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null);
	const [selectAllBlocksActive, setSelectAllBlocksActive] = useState(false);
	const hasAnyZoomBlocks = useMemo(() => zoomRegions.length > 0, [zoomRegions.length]);

	const addKeyframe = useCallback(() => {
		if (totalMs === 0) return;
		const time = Math.max(0, Math.min(currentTimeMs, totalMs));
		if (keyframes.some((kf) => Math.abs(kf.time - time) < 1)) return;
		setKeyframes((prev) => [...prev, { id: globalThis.crypto.randomUUID(), time }]);
	}, [currentTimeMs, totalMs, keyframes]);

	const deleteSelectedKeyframe = useCallback(() => {
		if (!selectedKeyframeId) return;
		setKeyframes((prev) => prev.filter((kf) => kf.id !== selectedKeyframeId));
		setSelectedKeyframeId(null);
	}, [selectedKeyframeId]);

	const handleKeyframeMove = useCallback(
		(id: string, newTime: number) => {
			setKeyframes((prev) =>
				prev.map((kf) =>
					kf.id === id ? { ...kf, time: Math.max(0, Math.min(newTime, totalMs)) } : kf,
				),
			);
		},
		[totalMs],
	);

	const deleteSelectedZoom = useCallback(() => {
		if (selectAllBlocksActive) {
			zoomRegions.map((region) => region.id).forEach((id) => onZoomDelete(id));
		} else if (selectedZoomId) {
			onZoomDelete(selectedZoomId);
		} else {
			return;
		}

		onSelectZoom(null);
		onSelectClip?.(null);
		onSelectCamera?.(null);
		onSelectAnnotation?.(null);
		onSelectAudio?.(null);
		onSelectCaption?.(null);
		onSelectGesture?.(null);
		onSelectAudioPortion?.(null);
		setSelectAllBlocksActive(false);
	}, [
		selectAllBlocksActive,
		zoomRegions,
		onZoomDelete,
		selectedZoomId,
		onSelectZoom,
		onSelectClip,
		onSelectCamera,
		onSelectAnnotation,
		onSelectAudio,
		onSelectCaption,
		onSelectGesture,
		onSelectAudioPortion,
	]);

	const deleteSelectedClip = useCallback(() => {
		if (!selectedClipId || !onClipDelete) return;
		onClipDelete(selectedClipId);
		onSelectClip?.(null);
	}, [selectedClipId, onClipDelete, onSelectClip]);

	const deleteSelectedCamera = useCallback(() => {
		if (!selectedCameraId || !onCameraDelete) return;
		onCameraDelete(selectedCameraId);
		onSelectCamera?.(null);
	}, [selectedCameraId, onCameraDelete, onSelectCamera]);

	const deleteSelectedAnnotation = useCallback(() => {
		if (!selectedAnnotationId || !onAnnotationDelete) return;
		onAnnotationDelete(selectedAnnotationId);
		onSelectAnnotation?.(null);
	}, [selectedAnnotationId, onAnnotationDelete, onSelectAnnotation]);

	const deleteSelectedAudio = useCallback(() => {
		if (!selectedAudioId || !onAudioDelete) return;
		onAudioDelete(selectedAudioId);
		onSelectAudio?.(null);
	}, [selectedAudioId, onAudioDelete, onSelectAudio]);

	const deleteSelectedCaption = useCallback(() => {
		if (!selectedCaptionId || !onCaptionDelete) return;
		onCaptionDelete(selectedCaptionId);
		onSelectCaption?.(null);
	}, [selectedCaptionId, onCaptionDelete, onSelectCaption]);

	const deleteSelectedGesture = useCallback(() => {
		if (!selectedGestureId || !onGestureDelete) return;
		onGestureDelete(selectedGestureId);
		onSelectGesture?.(null);
	}, [selectedGestureId, onGestureDelete, onSelectGesture]);

	const deleteSelectedAudioPortion = useCallback(() => {
		if (!selectedAudioPortionId || !onAudioPortionDelete) return;
		onAudioPortionDelete(selectedAudioPortionId);
		onSelectAudioPortion?.(null);
	}, [selectedAudioPortionId, onAudioPortionDelete, onSelectAudioPortion]);

	const clearSelectedBlocks = useCallback(() => {
		onSelectZoom(null);
		onSelectClip?.(null);
		onSelectCamera?.(null);
		onSelectAnnotation?.(null);
		onSelectAudio?.(null);
		onSelectCaption?.(null);
		onSelectGesture?.(null);
		onSelectAudioPortion?.(null);
		setSelectAllBlocksActive(false);
	}, [
		onSelectZoom,
		onSelectClip,
		onSelectCamera,
		onSelectAnnotation,
		onSelectAudio,
		onSelectCaption,
		onSelectGesture,
		onSelectAudioPortion,
	]);

	const activateSelectAllZooms = useCallback(() => {
		onSelectZoom(null);
		onSelectClip?.(null);
		onSelectCamera?.(null);
		onSelectAnnotation?.(null);
		onSelectAudio?.(null);
		onSelectCaption?.(null);
		onSelectGesture?.(null);
		onSelectAudioPortion?.(null);
		setSelectedKeyframeId(null);
		setSelectAllBlocksActive(true);
	}, [
		onSelectZoom,
		onSelectClip,
		onSelectCamera,
		onSelectAnnotation,
		onSelectAudio,
		onSelectCaption,
		onSelectGesture,
		onSelectAudioPortion,
	]);

	const handleSelectZoom = useCallback(
		(id: string | null) => {
			setSelectAllBlocksActive(false);
			setSelectedKeyframeId(null);
			onSelectAudioPortion?.(null);
			onSelectZoom(id);
		},
		[onSelectZoom, onSelectAudioPortion],
	);

	const handleSelectClip = useCallback(
		(id: string | null) => {
			setSelectAllBlocksActive(false);
			setSelectedKeyframeId(null);
			onSelectAudioPortion?.(null);
			onSelectClip?.(id);
		},
		[onSelectClip, onSelectAudioPortion],
	);

	const handleSelectCamera = useCallback(
		(id: string | null) => {
			setSelectAllBlocksActive(false);
			setSelectedKeyframeId(null);
			onSelectAudioPortion?.(null);
			onSelectCamera?.(id);
		},
		[onSelectCamera, onSelectAudioPortion],
	);

	const handleSelectAnnotation = useCallback(
		(id: string | null) => {
			setSelectAllBlocksActive(false);
			setSelectedKeyframeId(null);
			onSelectAudioPortion?.(null);
			onSelectAnnotation?.(id);
		},
		[onSelectAnnotation, onSelectAudioPortion],
	);

	const handleSelectAudio = useCallback(
		(id: string | null) => {
			setSelectAllBlocksActive(false);
			setSelectedKeyframeId(null);
			onSelectAudioPortion?.(null);
			onSelectAudio?.(id);
		},
		[onSelectAudio, onSelectAudioPortion],
	);

	const handleSelectCaption = useCallback(
		(id: string | null) => {
			setSelectAllBlocksActive(false);
			setSelectedKeyframeId(null);
			onSelectAudioPortion?.(null);
			onSelectCaption?.(id);
		},
		[onSelectCaption, onSelectAudioPortion],
	);

	const handleSelectGesture = useCallback(
		(id: string | null) => {
			setSelectAllBlocksActive(false);
			setSelectedKeyframeId(null);
			onSelectAudioPortion?.(null);
			onSelectGesture?.(id);
		},
		[onSelectGesture, onSelectAudioPortion],
	);

	const handleSelectAudioPortion = useCallback(
		(id: string | null) => {
			setSelectAllBlocksActive(false);
			setSelectedKeyframeId(null);
			onSelectZoom(null);
			onSelectClip?.(null);
			onSelectCamera?.(null);
			onSelectAnnotation?.(null);
			onSelectAudio?.(null);
			onSelectCaption?.(null);
			onSelectGesture?.(null);
			onSelectAudioPortion?.(id);
		},
		[
			onSelectZoom,
			onSelectClip,
			onSelectCamera,
			onSelectAnnotation,
			onSelectAudio,
			onSelectCaption,
			onSelectGesture,
			onSelectAudioPortion,
		],
	);

	const cycleAnnotationsAtCurrentTime = useCallback(
		(backward = false) => {
			const overlapping = annotationRegions
				.filter((a) => currentTimeMs >= a.startMs && currentTimeMs <= a.endMs)
				.sort((a, b) => a.zIndex - b.zIndex);
			if (overlapping.length === 0) {
				return false;
			}

			if (!selectedAnnotationId || !overlapping.some((a) => a.id === selectedAnnotationId)) {
				onSelectAnnotation?.(overlapping[0].id);
				return true;
			}

			const currentIndex = overlapping.findIndex((a) => a.id === selectedAnnotationId);
			const nextIndex = backward
				? (currentIndex - 1 + overlapping.length) % overlapping.length
				: (currentIndex + 1) % overlapping.length;
			onSelectAnnotation?.(overlapping[nextIndex].id);
			return true;
		},
		[annotationRegions, currentTimeMs, selectedAnnotationId, onSelectAnnotation],
	);

	return {
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
		deleteSelectedCamera,
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
		cycleAnnotationsAtCurrentTime,
	};
}

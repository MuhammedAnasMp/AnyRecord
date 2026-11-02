import { formatClipSpeedLabel } from "../../clipSpeedChange";
import type {
	AnnotationRegion,
	AudioRegion,
	CaptionCue,
	ClipRegion,
	ZoomRegion,
} from "../../types";
import { getClipSourceEndMs, getClipSourceStartMs } from "../../types";
import { CAPTION_ROW_ID, CLIP_ROW_ID, CAMERA_ROW_ID, GESTURE_ROW_ID, ZOOM_ROW_ID, AUDIO_PORTION_ROW_ID } from "../core/constants";
import type { AudioPortion } from "../../audio/audioPortion";
import {
	getAnnotationTrackIndex,
	getAnnotationTrackRowId,
	getAudioTrackIndex,
	getAudioTrackRowId,
	isAnnotationTrackRowId,
	isAudioTrackRowId,
} from "../core/rows";
import type { CameraRegion, TimelineRegionSpan, TimelineRenderItem } from "../core/timelineTypes";
import {
	type FingerGestureRegion,
	getFingerDisplayName,
	getFingerEmoji,
} from "../../gestures/gestureTypes";

export function getAnnotationLabel(region: AnnotationRegion): string {
	if (region.type === "text") {
		const preview = region.content.trim() || "Empty text";
		return preview.length > 20 ? `${preview.substring(0, 20)}...` : preview;
	}
	if (region.type === "image") {
		return "Image";
	}
	return "Annotation";
}

export function getAudioLabel(region: AudioRegion): string {
	return (
		region.audioPath
			.split(/[\\/]/)
			.pop()
			?.replace(/\.[^.]+$/, "") || "Audio"
	);
}

function getCaptionLabel(cue: CaptionCue): string {
	const preview = cue.text.trim() || "Caption";
	return preview.length > 24 ? `${preview.substring(0, 24)}...` : preview;
}

export function buildTimelineItems(params: {
	zoomRegions: ZoomRegion[];
	clipRegions: ClipRegion[];
	cameraRegions?: CameraRegion[];
	annotationRegions: AnnotationRegion[];
	audioRegions: AudioRegion[];
	captionCues?: CaptionCue[];
	gestureRegions?: FingerGestureRegion[];
	audioPortions?: AudioPortion[];
}): TimelineRenderItem[] {
	const {
		zoomRegions,
		clipRegions,
		cameraRegions = [],
		annotationRegions,
		audioRegions,
		captionCues = [],
		gestureRegions = [],
		audioPortions = [],
	} = params;
	const zooms: TimelineRenderItem[] = zoomRegions.map((region, index) => ({
		id: region.id,
		rowId: ZOOM_ROW_ID,
		span: { start: region.startMs, end: region.endMs },
		label: `Zoom ${index + 1}`,
		zoomDepth: region.depth,
		zoomMode: region.mode ?? "auto",
		variant: "zoom",
	}));

	const clips: TimelineRenderItem[] = clipRegions.map((region, index) => {
		const speed = Number.isFinite(region.speed) && region.speed > 0 ? region.speed : 1;
		const sourceEndMs = getClipSourceEndMs(region);
		const speedLabel = formatClipSpeedLabel(speed);

		return {
			id: region.id,
			rowId: CLIP_ROW_ID,
			span: { start: region.startMs, end: region.endMs },
			sourceSpan: { start: getClipSourceStartMs(region), end: sourceEndMs },
			label: speedLabel ? `Clip ${index + 1} ${speedLabel}` : `Clip ${index + 1}`,
			speedValue: speedLabel ? speed : undefined,
			showSourceAudio: region.showSourceAudio,
			muted: Boolean(region.muted),
			variant: "clip",
		};
	});

	const cameras: TimelineRenderItem[] = cameraRegions.map((region, index) => ({
		id: region.id,
		rowId: CAMERA_ROW_ID,
		span: { start: region.startMs, end: region.endMs },
		label: cameraRegions.length > 1 ? `Camera ${index + 1}` : "Camera",
		variant: "camera",
	}));

	const annotations: TimelineRenderItem[] = annotationRegions.map((region) => ({
		id: region.id,
		rowId: getAnnotationTrackRowId(region.trackIndex ?? 0),
		span: { start: region.startMs, end: region.endMs },
		label: getAnnotationLabel(region),
		variant: "annotation",
	}));

	const audios: TimelineRenderItem[] = audioRegions.map((region) => ({
		id: region.id,
		rowId: getAudioTrackRowId(region.trackIndex ?? 0),
		span: { start: region.startMs, end: region.endMs },
		label: getAudioLabel(region),
		audioPath: region.audioPath,
		audioGain: region.volume,
		audioNormalize: Boolean(region.normalize),
		variant: "audio",
	}));

	const captions: TimelineRenderItem[] = captionCues.map((cue) => ({
		id: cue.id,
		rowId: CAPTION_ROW_ID,
		span: { start: cue.startMs, end: cue.endMs },
		label: getCaptionLabel(cue),
		variant: "caption",
	}));

	const gestures: TimelineRenderItem[] = gestureRegions.map((gesture) => ({
		id: gesture.id,
		rowId: GESTURE_ROW_ID,
		span: { start: gesture.startMs, end: gesture.endMs },
		label: `${getFingerEmoji(gesture.finger)} ${getFingerDisplayName(gesture.finger, gesture.hand)} ${gesture.attachment?.content || ""}`.trim(),
		variant: "gesture",
	}));

	const portions: TimelineRenderItem[] = audioPortions.map((portion) => {
		const volPercent = Math.round(portion.volume * 100);
		const volLabel = portion.volume === 0 ? "Muted" : `${volPercent}%`;
		return {
			id: portion.id,
			rowId: AUDIO_PORTION_ROW_ID,
			span: { start: portion.startMs, end: portion.endMs },
			label: portion.label || `Sound ${volLabel}`,
			volume: portion.volume,
			variant: "audio-portion",
		};
	});

	return [...zooms, ...clips, ...cameras, ...annotations, ...audios, ...captions, ...gestures, ...portions];
}

export function buildAllRegionSpans(params: {
	annotationRegions?: AnnotationRegion[];
	captionCues?: CaptionCue[];
	gestureRegions?: FingerGestureRegion[];
	zoomRegions: ZoomRegion[];
	clipRegions: ClipRegion[];
	cameraRegions?: CameraRegion[];
	audioRegions: AudioRegion[];
	audioPortions?: AudioPortion[];
}): TimelineRegionSpan[] {
	const { zoomRegions, clipRegions, cameraRegions = [], audioRegions, audioPortions = [] } = params;
	const zooms = zoomRegions.map((r) => ({
		id: r.id,
		start: r.startMs,
		end: r.endMs,
		rowId: ZOOM_ROW_ID,
	}));
	const clips = clipRegions.map((r) => ({
		id: r.id,
		start: r.startMs,
		end: r.endMs,
		rowId: CLIP_ROW_ID,
	}));
	const cameras = cameraRegions.map((r) => ({
		id: r.id,
		start: r.startMs,
		end: r.endMs,
		rowId: CAMERA_ROW_ID,
	}));
	const audios = audioRegions.map((r) => ({
		id: r.id,
		start: r.startMs,
		end: r.endMs,
		rowId: getAudioTrackRowId(r.trackIndex ?? 0),
	}));
	const portions = audioPortions.map((p) => ({
		id: p.id,
		start: p.startMs,
		end: p.endMs,
		rowId: AUDIO_PORTION_ROW_ID,
	}));
	return [
		...zooms,
		...clips,
		...cameras,
		...audios,
		...portions,
		...(params.annotationRegions ?? []).map((r) => ({
			id: r.id,
			start: r.startMs,
			end: r.endMs,
			rowId: getAnnotationTrackRowId(r.trackIndex ?? 0),
		})),
		...(params.captionCues ?? []).map((r) => ({
			id: r.id,
			start: r.startMs,
			end: r.endMs,
			rowId: CAPTION_ROW_ID,
		})),
		...(params.gestureRegions ?? []).map((r) => ({
			id: r.id,
			start: r.startMs,
			end: r.endMs,
			rowId: GESTURE_ROW_ID,
		})),
	];
}

export function resolveDropRowId(
	id: string,
	proposedRowId: string,
	timelineItems: TimelineRenderItem[],
) {
	const currentRowId = timelineItems.find((item) => item.id === id)?.rowId;
	if (!currentRowId) {
		return proposedRowId;
	}

	if (currentRowId === CAMERA_ROW_ID) {
		return CAMERA_ROW_ID;
	}

	if (currentRowId === AUDIO_PORTION_ROW_ID) {
		return AUDIO_PORTION_ROW_ID;
	}

	if (isAnnotationTrackRowId(currentRowId)) {
		return isAnnotationTrackRowId(proposedRowId)
			? getAnnotationTrackRowId(getAnnotationTrackIndex(proposedRowId))
			: currentRowId;
	}

	if (isAudioTrackRowId(currentRowId)) {
		return isAudioTrackRowId(proposedRowId)
			? getAudioTrackRowId(getAudioTrackIndex(proposedRowId))
			: currentRowId;
	}

	return currentRowId;
}

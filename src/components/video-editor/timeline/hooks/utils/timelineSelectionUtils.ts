export type DeleteSelectionTarget =
	| "keyframe"
	| "zoom"
	| "clip"
	| "camera"
	| "annotation"
	| "audio"
	| "caption"
	| "audio-portion"
	| "none";

interface ResolveDeleteSelectionTargetParams {
	selectAllBlocksActive: boolean;
	selectedKeyframeId: string | null;
	selectedZoomId: string | null;
	selectedClipId?: string | null;
	selectedCameraId?: string | null;
	selectedAnnotationId?: string | null;
	selectedAudioId?: string | null;
	selectedCaptionId?: string | null;
	selectedAudioPortionId?: string | null;
}

export function resolveDeleteSelectionTarget({
	selectAllBlocksActive,
	selectedKeyframeId,
	selectedZoomId,
	selectedClipId,
	selectedCameraId,
	selectedAnnotationId,
	selectedAudioId,
	selectedCaptionId,
	selectedAudioPortionId,
}: ResolveDeleteSelectionTargetParams): DeleteSelectionTarget {
	if (selectAllBlocksActive) return "zoom";
	if (selectedKeyframeId) return "keyframe";
	if (selectedZoomId) return "zoom";
	if (selectedCameraId) return "camera";
	if (selectedClipId) return "clip";
	if (selectedAnnotationId) return "annotation";
	if (selectedAudioId) return "audio";
	if (selectedCaptionId) return "caption";
	if (selectedAudioPortionId) return "audio-portion";
	return "none";
}

import { useCallback, useState } from "react";
import { toast } from "@/components/ui/toast";
import { analyzeWebcamVideo } from "@/lib/gestures/gestureAnalyzer";
import { resolveVideoUrl } from "../projectPersistence";
import type { EditorEffectSection } from "../types";
import type {
	FingerGestureRegion,
	GestureAttachment,
	GestureTrackingSettings,
} from "./gestureTypes";

interface UseGestureControllerParams {
	webcamSourcePath: string | null;
	gestureSettings: GestureTrackingSettings;
	setGestureSettings: React.Dispatch<React.SetStateAction<GestureTrackingSettings>>;
	setGestureRegions: React.Dispatch<React.SetStateAction<FingerGestureRegion[]>>;
	selectedGestureId: string | null;
	setSelectedGestureId: React.Dispatch<React.SetStateAction<string | null>>;
	setActiveEffectSection: React.Dispatch<React.SetStateAction<EditorEffectSection>> | ((section: EditorEffectSection) => void);
}

export function useGestureController({
	webcamSourcePath,
	gestureSettings,
	setGestureSettings,
	setGestureRegions,
	selectedGestureId,
	setSelectedGestureId,
	setActiveEffectSection,
}: UseGestureControllerParams) {
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [analysisProgress, setAnalysisProgress] = useState(0);

	const handleAnalyzeWebcam = useCallback(async () => {
		if (!webcamSourcePath) {
			toast.error("No video footage available to analyze.");
			return;
		}

		setIsAnalyzing(true);
		setAnalysisProgress(0);

		try {
			const resolvedVideoUrl = await resolveVideoUrl(webcamSourcePath);
			const detectedRegions = await analyzeWebcamVideo(resolvedVideoUrl, {
				sampleFps: 15,
				confidenceThreshold: gestureSettings.confidenceThreshold,
				minHoldMs: gestureSettings.minHoldMs,
				releaseMs: gestureSettings.releaseMs,
				offsetCm: gestureSettings.defaultAttachment.offsetCm,
				onProgress: (p) => setAnalysisProgress(p),
			});

			// Apply default attachment to newly detected regions
			const enrichedRegions = detectedRegions.map((r) => ({
				...r,
				attachment: { ...gestureSettings.defaultAttachment },
			}));

			setGestureRegions(enrichedRegions);
			setGestureSettings((prev) => ({ ...prev, enabled: true }));

			if (enrichedRegions.length > 0) {
				toast.success(
					`Found ${enrichedRegions.length} finger gesture ${enrichedRegions.length === 1 ? "session" : "sessions"}!`,
				);
			} else {
				toast.info("No raised fingers detected in video.");
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			toast.error(`Gesture scanning failed: ${msg}`);
		} finally {
			setIsAnalyzing(false);
		}
	}, [webcamSourcePath, gestureSettings, setGestureRegions, setGestureSettings]);

	const handleUpdateDefaultAttachment = useCallback(
		(partial: Partial<GestureAttachment>) => {
			setGestureSettings((prev) => ({
				...prev,
				defaultAttachment: {
					...prev.defaultAttachment,
					...partial,
				},
			}));
			setGestureRegions((prev) =>
				prev.map((r) => ({
					...r,
					attachment: {
						...r.attachment,
						...partial,
					},
				})),
			);
		},
		[setGestureSettings, setGestureRegions],
	);

	const handleSelectGesture = useCallback(
		(id: string) => {
			setSelectedGestureId(id);
			setActiveEffectSection("gesture");
		},
		[setSelectedGestureId, setActiveEffectSection],
	);

	const handleUpdateGestureRegion = useCallback(
		(updated: FingerGestureRegion) => {
			setGestureRegions((prev) =>
				prev.map((r) => (r.id === updated.id ? updated : r)),
			);
		},
		[setGestureRegions],
	);

	const handleUpdateAllGestureRegions = useCallback(
		(regions: FingerGestureRegion[]) => {
			setGestureRegions(regions);
		},
		[setGestureRegions],
	);

	const handleDeleteGestureRegion = useCallback(
		(id: string) => {
			setGestureRegions((prev) => prev.filter((r) => r.id !== id));
			if (selectedGestureId === id) {
				setSelectedGestureId(null);
				setActiveEffectSection("gestures");
			}
		},
		[selectedGestureId, setGestureRegions, setSelectedGestureId, setActiveEffectSection],
	);

	const handleBackToGestures = useCallback(() => {
		setSelectedGestureId(null);
		setActiveEffectSection("gestures");
	}, [setSelectedGestureId, setActiveEffectSection]);

	return {
		isAnalyzing,
		analysisProgress,
		handleAnalyzeWebcam,
		handleUpdateDefaultAttachment,
		handleSelectGesture,
		handleUpdateGestureRegion,
		handleUpdateAllGestureRegions,
		handleDeleteGestureRegion,
		handleBackToGestures,
	};
}

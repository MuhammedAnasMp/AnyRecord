import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import type { HandSide } from "../../components/video-editor/gestures/gestureTypes";
import { calculateNormalizedPxPerCm, type Landmark } from "./anchorMath";
import { classifyFingersForHand } from "./fingerClassifier";
import { type FrameFingerDetection, segmentFingerDetections } from "./fingerSegmenter";

const WASM_CDN_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_ASSET_PATH =
	"https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

let handLandmarkerInstance: HandLandmarker | null = null;
let initPromise: Promise<HandLandmarker> | null = null;

export async function getOrInitHandLandmarker(): Promise<HandLandmarker> {
	if (handLandmarkerInstance) return handLandmarkerInstance;
	if (initPromise) return initPromise;

	initPromise = (async () => {
		const vision = await FilesetResolver.forVisionTasks(WASM_CDN_PATH);
		let landmarker: HandLandmarker;
		try {
			landmarker = await HandLandmarker.createFromOptions(vision, {
				baseOptions: {
					modelAssetPath: MODEL_ASSET_PATH,
					delegate: "GPU",
				},
				runningMode: "VIDEO",
				numHands: 2,
				minHandDetectionConfidence: 0.5,
				minHandPresenceConfidence: 0.5,
				minTrackingConfidence: 0.5,
			});
		} catch (_gpuErr) {
			// Fallback to CPU delegate if GPU delegate fails
			landmarker = await HandLandmarker.createFromOptions(vision, {
				baseOptions: {
					modelAssetPath: MODEL_ASSET_PATH,
					delegate: "CPU",
				},
				runningMode: "VIDEO",
				numHands: 2,
				minHandDetectionConfidence: 0.5,
				minHandPresenceConfidence: 0.5,
				minTrackingConfidence: 0.5,
			});
		}

		handLandmarkerInstance = landmarker;
		return landmarker;
	})();

	return initPromise;
}

export interface AnalyzeVideoOptions {
	sampleFps?: number; // default 15
	confidenceThreshold?: number; // default 0.55
	minHoldMs?: number; // default 180
	releaseMs?: number; // default 140
	offsetCm?: number; // default 1.0
	onProgress?: (progress: number) => void;
	signal?: AbortSignal;
}

/**
 * Decodes video and runs MediaPipe HandLandmarker frame-by-frame,
 * converting raw detections into segmented finger timeline regions.
 */
export async function analyzeWebcamVideo(
	videoUrlOrPath: string,
	options: AnalyzeVideoOptions = {},
) {
	const {
		sampleFps = 15,
		confidenceThreshold = 0.55,
		minHoldMs = 180,
		releaseMs = 140,
		offsetCm = 1.0,
		onProgress,
		signal,
	} = options;

	const landmarker = await getOrInitHandLandmarker();

	// Create offscreen video element for frame stepping
	const video = document.createElement("video");
	video.crossOrigin = "anonymous";
	video.src = videoUrlOrPath;
	video.muted = true;
	video.playsInline = true;

	await new Promise<void>((resolve, reject) => {
		video.onloadedmetadata = () => resolve();
		video.onerror = () => reject(new Error("Failed to load video metadata for gesture analysis"));
	});

	const durationSec = video.duration;
	if (!Number.isFinite(durationSec) || durationSec <= 0) {
		return [];
	}

	const frameIntervalSec = 1 / sampleFps;
	const totalSteps = Math.max(1, Math.floor(durationSec / frameIntervalSec));
	const recordedFrames: FrameFingerDetection[] = [];

	const seekVideo = (timeSec: number) =>
		new Promise<void>((resolve) => {
			video.currentTime = timeSec;
			video.onseeked = () => resolve();
		});

	for (let step = 0; step <= totalSteps; step++) {
		if (signal?.aborted) {
			break;
		}

		const currentTimeSec = Math.min(durationSec, step * frameIntervalSec);
		await seekVideo(currentTimeSec);

		const currentTimeMs = Math.round(currentTimeSec * 1000);
		const results = landmarker.detectForVideo(video, currentTimeMs);

		const frameDetections: FrameFingerDetection["detections"] = [];
		let framePxPerCm = 0.04; // default nominal

		if (results.landmarks && results.landmarks.length > 0) {
			for (let i = 0; i < results.landmarks.length; i++) {
				const handLandmarks = results.landmarks[i] as Landmark[];
				const handednessCategory = results.handednesses?.[i]?.[0]?.categoryName;
				const handSide: HandSide = handednessCategory?.toLowerCase() === "left" ? "left" : "right";

				framePxPerCm = calculateNormalizedPxPerCm(handLandmarks);
				const fingerResults = classifyFingersForHand(handLandmarks, handSide, confidenceThreshold);
				frameDetections.push(...fingerResults);
			}
		}

		recordedFrames.push({
			tMs: currentTimeMs,
			pxPerCm: framePxPerCm,
			detections: frameDetections,
		});

		onProgress?.(step / totalSteps);
	}

	// Segment continuous frame detections into discrete open-to-close finger sessions
	return segmentFingerDetections(recordedFrames, {
		minHoldMs,
		releaseMs,
		offsetCm,
	});
}

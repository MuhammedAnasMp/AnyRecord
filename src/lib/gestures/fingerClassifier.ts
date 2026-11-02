import type { FingerType, HandSide } from "../../components/video-editor/gestures/gestureTypes";
import { dist2D, LANDMARK, type Landmark } from "./anchorMath";

export interface FingerDetectionResult {
	finger: FingerType;
	hand: HandSide;
	isOpen: boolean;
	confidence: number;
	tip: { x: number; y: number };
	direction: { dx: number; dy: number };
}

/**
 * Classifies the extension state (open vs closed) of each of the 5 fingers on a hand.
 */
export function classifyFingersForHand(
	landmarks: Landmark[],
	handedness: HandSide,
	confidenceThreshold: number = 0.55,
): FingerDetectionResult[] {
	if (landmarks.length < 21) return [];

	const wrist = landmarks[LANDMARK.WRIST];
	const results: FingerDetectionResult[] = [];

	// 1. Index Finger
	const indexTip = landmarks[LANDMARK.INDEX_TIP];
	const indexPip = landmarks[LANDMARK.INDEX_PIP];
	const indexMcp = landmarks[LANDMARK.INDEX_MCP];
	const indexDistWrist = dist2D(wrist, indexTip);
	const indexPipDistWrist = dist2D(wrist, indexPip);
	const indexMcpDistWrist = dist2D(wrist, indexMcp);
	const isIndexOpen =
		indexDistWrist > indexPipDistWrist * 1.15 &&
		indexDistWrist > indexMcpDistWrist * 1.25;

	const indexDx = indexTip.x - indexPip.x;
	const indexDy = indexTip.y - indexPip.y;
	const indexLen = Math.sqrt(indexDx * indexDx + indexDy * indexDy) || 1;

	results.push({
		finger: "index",
		hand: handedness,
		isOpen: isIndexOpen,
		confidence: isIndexOpen ? 0.9 : 0.2,
		tip: { x: indexTip.x, y: indexTip.y },
		direction: { dx: indexDx / indexLen, dy: indexDy / indexLen },
	});

	// 2. Middle Finger
	const middleTip = landmarks[LANDMARK.MIDDLE_TIP];
	const middlePip = landmarks[LANDMARK.MIDDLE_PIP];
	const middleMcp = landmarks[LANDMARK.MIDDLE_MCP];
	const middleDistWrist = dist2D(wrist, middleTip);
	const middlePipDistWrist = dist2D(wrist, middlePip);
	const middleMcpDistWrist = dist2D(wrist, middleMcp);
	const isMiddleOpen =
		middleDistWrist > middlePipDistWrist * 1.15 &&
		middleDistWrist > middleMcpDistWrist * 1.25;

	const middleDx = middleTip.x - middlePip.x;
	const middleDy = middleTip.y - middlePip.y;
	const middleLen = Math.sqrt(middleDx * middleDx + middleDy * middleDy) || 1;

	results.push({
		finger: "middle",
		hand: handedness,
		isOpen: isMiddleOpen,
		confidence: isMiddleOpen ? 0.9 : 0.2,
		tip: { x: middleTip.x, y: middleTip.y },
		direction: { dx: middleDx / middleLen, dy: middleDy / middleLen },
	});

	// 3. Ring Finger
	const ringTip = landmarks[LANDMARK.RING_TIP];
	const ringPip = landmarks[LANDMARK.RING_PIP];
	const ringMcp = landmarks[LANDMARK.RING_MCP];
	const ringDistWrist = dist2D(wrist, ringTip);
	const ringPipDistWrist = dist2D(wrist, ringPip);
	const ringMcpDistWrist = dist2D(wrist, ringMcp);
	const isRingOpen =
		ringDistWrist > ringPipDistWrist * 1.15 &&
		ringDistWrist > ringMcpDistWrist * 1.25;

	const ringDx = ringTip.x - ringPip.x;
	const ringDy = ringTip.y - ringPip.y;
	const ringLen = Math.sqrt(ringDx * ringDx + ringDy * ringDy) || 1;

	results.push({
		finger: "ring",
		hand: handedness,
		isOpen: isRingOpen,
		confidence: isRingOpen ? 0.9 : 0.2,
		tip: { x: ringTip.x, y: ringTip.y },
		direction: { dx: ringDx / ringLen, dy: ringDy / ringLen },
	});

	// 4. Pinky Finger
	const pinkyTip = landmarks[LANDMARK.PINKY_TIP];
	const pinkyPip = landmarks[LANDMARK.PINKY_PIP];
	const pinkyMcp = landmarks[LANDMARK.PINKY_MCP];
	const pinkyDistWrist = dist2D(wrist, pinkyTip);
	const pinkyPipDistWrist = dist2D(wrist, pinkyPip);
	const pinkyMcpDistWrist = dist2D(wrist, pinkyMcp);
	const isPinkyOpen =
		pinkyDistWrist > pinkyPipDistWrist * 1.15 &&
		pinkyDistWrist > pinkyMcpDistWrist * 1.25;

	const pinkyDx = pinkyTip.x - pinkyPip.x;
	const pinkyDy = pinkyTip.y - pinkyPip.y;
	const pinkyLen = Math.sqrt(pinkyDx * pinkyDx + pinkyDy * pinkyDy) || 1;

	results.push({
		finger: "pinky",
		hand: handedness,
		isOpen: isPinkyOpen,
		confidence: isPinkyOpen ? 0.9 : 0.2,
		tip: { x: pinkyTip.x, y: pinkyTip.y },
		direction: { dx: pinkyDx / pinkyLen, dy: pinkyDy / pinkyLen },
	});

	// 5. Thumb
	// Thumb extends outward from MCP/CMC
	const thumbTip = landmarks[LANDMARK.THUMB_TIP];
	const thumbIp = landmarks[LANDMARK.THUMB_IP];
	const thumbMcp = landmarks[LANDMARK.THUMB_MCP];
	const thumbDistPinkyMcp = dist2D(landmarks[LANDMARK.PINKY_MCP], thumbTip);
	const thumbIpDistPinkyMcp = dist2D(landmarks[LANDMARK.PINKY_MCP], thumbIp);
	const isThumbOpen =
		thumbDistPinkyMcp > thumbIpDistPinkyMcp * 1.15 &&
		dist2D(wrist, thumbTip) > dist2D(wrist, thumbMcp) * 1.1;

	const thumbDx = thumbTip.x - thumbIp.x;
	const thumbDy = thumbTip.y - thumbIp.y;
	const thumbLen = Math.sqrt(thumbDx * thumbDx + thumbDy * thumbDy) || 1;

	results.push({
		finger: "thumb",
		hand: handedness,
		isOpen: isThumbOpen,
		confidence: isThumbOpen ? 0.9 : 0.2,
		tip: { x: thumbTip.x, y: thumbTip.y },
		direction: { dx: thumbDx / thumbLen, dy: thumbDy / thumbLen },
	});

	return results.filter((r) => r.confidence >= confidenceThreshold || r.isOpen);
}

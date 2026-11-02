export interface Landmark {
	x: number; // normalized 0-1
	y: number; // normalized 0-1
	z?: number;
}

// MediaPipe Hand landmark indices
export const LANDMARK = {
	WRIST: 0,
	THUMB_CMC: 1,
	THUMB_MCP: 2,
	THUMB_IP: 3,
	THUMB_TIP: 4,
	INDEX_MCP: 5,
	INDEX_PIP: 6,
	INDEX_DIP: 7,
	INDEX_TIP: 8,
	MIDDLE_MCP: 9,
	MIDDLE_PIP: 10,
	MIDDLE_DIP: 11,
	MIDDLE_TIP: 12,
	RING_MCP: 13,
	RING_PIP: 14,
	RING_DIP: 15,
	RING_TIP: 16,
	PINKY_MCP: 17,
	PINKY_PIP: 18,
	PINKY_DIP: 19,
	PINKY_TIP: 20,
} as const;

export function dist2D(a: Landmark, b: Landmark): number {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates normalized units per cm based on anatomical averages.
 * An average adult index finger length (MCP to TIP) is ~8.0 cm.
 * An average palm width (INDEX_MCP to PINKY_MCP) is ~7.5 cm.
 */
export function calculateNormalizedPxPerCm(landmarks: Landmark[]): number {
	if (landmarks.length < 21) return 0.05; // safe fallback

	const indexLen = dist2D(landmarks[LANDMARK.INDEX_MCP], landmarks[LANDMARK.INDEX_TIP]);
	const palmWidth = dist2D(landmarks[LANDMARK.INDEX_MCP], landmarks[LANDMARK.PINKY_MCP]);

	const scaleFromIndex = indexLen / 8.0;
	const scaleFromPalm = palmWidth / 7.5;

	// Weighted blend of finger length and palm width for stability
	const pxPerCm = scaleFromIndex * 0.6 + scaleFromPalm * 0.4;
	return Math.max(0.005, Math.min(0.2, pxPerCm));
}

/**
 * Computes direction unit vector pointing out from a finger's tip.
 */
export function getFingerTipDirection(
	landmarks: Landmark[],
	tipIndex: number,
	pipIndex: number,
): { dx: number; dy: number } {
	const tip = landmarks[tipIndex];
	const pip = landmarks[pipIndex];
	const dx = tip.x - pip.x;
	const dy = tip.y - pip.y;
	const len = Math.sqrt(dx * dx + dy * dy);

	if (len < 1e-5) {
		return { dx: 0, dy: -1 }; // default upwards
	}

	return {
		dx: dx / len,
		dy: dy / len,
	};
}

/**
 * Computes the virtual air anchor located `offsetCm` beyond the fingertip.
 */
export function computeFingertipAnchor(params: {
	tipX: number;
	tipY: number;
	dirX: number;
	dirY: number;
	offsetCm: number;
	offsetAngleDeg?: number;
	pxPerCm: number;
}): { x: number; y: number } {
	const { tipX, tipY, dirX, dirY, offsetCm, offsetAngleDeg = 0, pxPerCm } = params;
	const distance = Math.max(0, offsetCm) * pxPerCm;

	if (offsetAngleDeg === 0) {
		return {
			x: tipX + dirX * distance,
			y: tipY + dirY * distance,
		};
	}

	const angleRad = (offsetAngleDeg * Math.PI) / 180;
	const cos = Math.cos(angleRad);
	const sin = Math.sin(angleRad);

	const rotatedDirX = dirX * cos - dirY * sin;
	const rotatedDirY = dirX * sin + dirY * cos;

	return {
		x: tipX + rotatedDirX * distance,
		y: tipY + rotatedDirY * distance,
	};
}

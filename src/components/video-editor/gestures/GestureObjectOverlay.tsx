import { evaluateGestureObject } from "@/lib/gestures/gestureMotion";
import type { WebcamOverlaySettings } from "../types";
import {
	getCropMatchedWebcamHeightPercent,
	getWebcamOverlayDimensionsPx,
	getWebcamOverlayPosition,
	scaleWebcamOverlayPixels,
} from "../webcamOverlay";
import type { FingerGestureRegion, GestureTrackingSettings } from "./gestureTypes";

function isImageUrl(content: string | undefined): boolean {
	if (!content) return false;
	return (
		content.startsWith("data:image/") ||
		content.startsWith("blob:") ||
		content.startsWith("http://") ||
		content.startsWith("https://") ||
		content.startsWith("file://") ||
		/\.(png|jpe?g|webp|svg|gif|avif)$/i.test(content)
	);
}

interface GestureObjectOverlayProps {
	enabled: boolean;
	gestureRegions: FingerGestureRegion[];
	currentTimeMs: number;
	webcamSettings: WebcamOverlaySettings;
	containerWidth: number;
	containerHeight: number;
	zoomScale?: number;
	settings?: GestureTrackingSettings;
}

export function GestureObjectOverlay({
	enabled,
	gestureRegions,
	currentTimeMs,
	webcamSettings,
	containerWidth,
	containerHeight,
	zoomScale = 1,
	settings,
}: GestureObjectOverlayProps) {
	if (!enabled || !gestureRegions.length || containerWidth <= 0 || containerHeight <= 0) {
		return null;
	}

	const hasSeparateWebcam = Boolean(
		webcamSettings?.sourcePath && webcamSettings?.enabled !== false,
	);

	let webcamDims: { width: number; height: number };
	let webcamPos: { x: number; y: number };

	if (hasSeparateWebcam) {
		const scaledMargin = scaleWebcamOverlayPixels(
			webcamSettings.margin ?? 24,
			containerWidth,
		);
		const widthPercent = webcamSettings.width ?? webcamSettings.size ?? 50;
		const heightPercent = getCropMatchedWebcamHeightPercent(
			widthPercent,
			webcamSettings.height ?? webcamSettings.size ?? 50,
			null,
			null,
			webcamSettings.cropRegion,
		);

		// Calculate webcam box position and dimensions in container
		webcamDims = getWebcamOverlayDimensionsPx({
			containerWidth,
			containerHeight,
			widthPercent,
			heightPercent,
			margin: scaledMargin,
			zoomScale,
			reactToZoom: webcamSettings.reactToZoom ?? true,
		});

		webcamPos = getWebcamOverlayPosition({
			containerWidth,
			containerHeight,
			size: widthPercent,
			width: webcamDims.width,
			height: webcamDims.height,
			margin: scaledMargin,
			positionPreset: webcamSettings.positionPreset ?? webcamSettings.corner,
			positionX: webcamSettings.positionX ?? 1,
			positionY: webcamSettings.positionY ?? 1,
			legacyCorner: webcamSettings.corner,
		});
	} else {
		webcamDims = {
			width: containerWidth,
			height: containerHeight,
		};
		webcamPos = {
			x: 0,
			y: 0,
		};
	}

	const renderedObjects = gestureRegions
		.map((region) => {
			const attachment = {
				...(settings?.defaultAttachment ?? {}),
				...(region.attachment ?? {}),
			};
			const motion = evaluateGestureObject(region, attachment, currentTimeMs);
			if (!motion.visible) return null;

			// Map normalized webcam coordinates (0-1) to container pixel coordinates
			let normX = motion.x;
			if (webcamSettings.mirror) {
				normX = 1 - normX;
			}

			const screenX = webcamPos.x + normX * webcamDims.width;
			const screenY = webcamPos.y + motion.y * webcamDims.height;

			const textColor = attachment.textColor || "#ffffff";
			const bgColor = attachment.backgroundColor || (attachment.kind === "number" ? "#3b82f6" : "#000000");
			const badgeStyle = attachment.badgeStyle || (attachment.kind === "number" ? "solid" : "glass");

			const getBadgeStyles = () => {
				const base = {
					color: textColor,
				};
				if (badgeStyle === "none") {
					return {
						...base,
						background: "transparent",
						textShadow: "0 2px 10px rgba(0,0,0,0.8)",
					};
				}
				if (badgeStyle === "outline") {
					return {
						...base,
						background: "transparent",
						border: `2px solid ${bgColor}`,
						boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
					};
				}
				if (badgeStyle === "neon") {
					return {
						...base,
						background: "rgba(10, 10, 15, 0.85)",
						border: `2px solid ${bgColor}`,
						boxShadow: `0 0 18px ${bgColor}, inset 0 0 8px ${bgColor}55`,
						textShadow: `0 0 8px ${textColor}`,
					};
				}
				if (badgeStyle === "solid") {
					return {
						...base,
						backgroundColor: bgColor,
						border: "1.5px solid rgba(255,255,255,0.35)",
						boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
					};
				}
				if (badgeStyle === "pill") {
					return {
						...base,
						backgroundColor: bgColor,
						borderRadius: "9999px",
						border: "1.5px solid rgba(255,255,255,0.3)",
						boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
					};
				}
				// Default: glass
				return {
					...base,
					backgroundColor: `${bgColor.startsWith("#") && bgColor.length === 7 ? `${bgColor}bb` : "rgba(0,0,0,0.75)"}`,
					backdropFilter: "blur(12px)",
					border: "1px solid rgba(255,255,255,0.25)",
					boxShadow: "0 8px 30px rgba(0,0,0,0.45)",
				};
			};

			const sizePx = (Math.min(webcamDims.width, webcamDims.height) * (motion.sizePct || 14)) / 100;

			return (
				<div
					key={region.id}
					className="pointer-events-none absolute left-0 top-0 will-change-transform select-none"
					style={{
						transform: `translate3d(${screenX}px, ${screenY}px, 0px) translate(-50%, -50%) rotate(${motion.rotationDeg}deg) scale(${motion.scale})`,
						opacity: motion.opacity,
						transformOrigin: "center center",
						zIndex: 40,
					}}
				>
					{attachment.kind === "sticker" && (
						<span
							style={{ fontSize: `${sizePx}px`, lineHeight: 1 }}
							className="drop-shadow-lg filter"
						>
							{isImageUrl(attachment.content) || (attachment.content && attachment.content.length > 8)
								? "✨"
								: attachment.content || "✨"}
						</span>
					)}

					{attachment.kind === "text" && (
						<div
							style={{
								fontSize: `${Math.max(12, sizePx * 0.4 * (attachment.fontSizeMultiplier || 1))}px`,
								borderRadius: badgeStyle === "pill" ? "9999px" : "8px",
								padding: "5px 12px",
								...getBadgeStyles(),
							}}
							className="font-bold whitespace-nowrap"
						>
							{isImageUrl(attachment.content) ? "Note" : attachment.content || "Note"}
						</div>
					)}

					{attachment.kind === "number" && (
						<div
							style={{
								width: `${sizePx}px`,
								height: `${sizePx}px`,
								fontSize: `${sizePx * 0.55 * (attachment.fontSizeMultiplier || 1)}px`,
								borderRadius: badgeStyle === "pill" || badgeStyle === "solid" || badgeStyle === "glass" || badgeStyle === "neon" ? "9999px" : "8px",
								...getBadgeStyles(),
							}}
							className="flex items-center justify-center font-black"
						>
							{isImageUrl(attachment.content) ? "1" : attachment.content || "1"}
						</div>
					)}

					{attachment.kind === "image" && (
						attachment.content && isImageUrl(attachment.content) ? (
							<img
								src={attachment.content}
								alt=""
								style={{
									width: `${sizePx}px`,
									height: `${sizePx}px`,
									objectFit: "contain",
								}}
								className="drop-shadow-xl"
							/>
						) : (
							<div
								style={{
									width: `${sizePx}px`,
									height: `${sizePx}px`,
									fontSize: `${sizePx * 0.5}px`,
								}}
								className="flex items-center justify-center rounded-xl bg-primary/20 border border-primary text-primary"
							>
								🖼️
							</div>
						)
					)}

					{attachment.kind === "video" && (
						attachment.content ? (
							<video
								src={attachment.content}
								autoPlay
								loop={attachment.videoLoop ?? true}
								muted={attachment.videoMuted ?? true}
								playsInline
								style={{
									width: `${sizePx}px`,
									height: `${sizePx}px`,
									objectFit: "contain",
									borderRadius: "12px",
								}}
								className="drop-shadow-xl"
							/>
						) : (
							<div
								style={{
									width: `${sizePx}px`,
									height: `${sizePx}px`,
									fontSize: `${sizePx * 0.5}px`,
								}}
								className="flex items-center justify-center rounded-xl bg-primary/20 border border-primary text-primary"
							>
								🎥
							</div>
						)
					)}
				</div>
			);
		})
		.filter(Boolean);

	if (renderedObjects.length === 0) return null;

	return <div className="pointer-events-none absolute inset-0 overflow-visible">{renderedObjects}</div>;
}

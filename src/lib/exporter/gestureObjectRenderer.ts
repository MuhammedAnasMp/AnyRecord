import type {
	FingerGestureRegion,
	GestureTrackingSettings,
} from "@/components/video-editor/gestures/gestureTypes";
import type { WebcamOverlaySettings } from "@/components/video-editor/types";
import {
	getCropMatchedWebcamHeightPercent,
	getWebcamOverlayDimensionsPx,
	getWebcamOverlayPosition,
	scaleWebcamOverlayPixels,
} from "@/components/video-editor/webcamOverlay";
import { evaluateGestureObject } from "@/lib/gestures/gestureMotion";

const imageCache = new Map<string, HTMLImageElement>();
const videoCache = new Map<string, HTMLVideoElement>();

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

function isVideoUrl(content: string | undefined): boolean {
	if (!content) return false;
	return (
		content.startsWith("data:video/") ||
		content.startsWith("blob:") ||
		content.startsWith("http://") ||
		content.startsWith("https://") ||
		content.startsWith("file://") ||
		/\.(mp4|webm|mov|avi|mkv|m4v)$/i.test(content)
	);
}

function getImage(src: string): HTMLImageElement | null {
	if (!src || !isImageUrl(src)) return null;
	let img = imageCache.get(src);
	if (!img) {
		img = new Image();
		img.crossOrigin = "anonymous";
		img.src = src;
		imageCache.set(src, img);
	}
	return img.complete && img.naturalWidth > 0 ? img : null;
}

function getVideo(src: string): HTMLVideoElement | null {
	if (!src) return null;
	let video = videoCache.get(src);
	if (!video) {
		if (typeof document === "undefined") return null;
		video = document.createElement("video");
		video.crossOrigin = "anonymous";
		video.muted = true;
		video.playsInline = true;
		video.preload = "auto";
		video.autoplay = false;
		video.src = src;
		video.currentTime = 0;
		video.load();
		videoCache.set(src, video);
	}
	return video;
}

export async function preloadGestureMedia(regions: FingerGestureRegion[]): Promise<void> {
	if (!regions || regions.length === 0) return;
	const promises: Promise<void>[] = [];

	for (const region of regions) {
		const content = region.attachment?.content;
		const kind = region.attachment?.kind;
		if (!content) continue;

		if ((kind === "image" || isImageUrl(content)) && isImageUrl(content)) {
			promises.push(
				new Promise<void>((resolve) => {
					let img = imageCache.get(content);
					if (!img) {
						img = new Image();
						img.crossOrigin = "anonymous";
						img.src = content;
						imageCache.set(content, img);
					}
					if (img.complete) return resolve();
					img.onload = () => resolve();
					img.onerror = () => resolve();
					setTimeout(resolve, 1500);
				}),
			);
		} else if (kind === "video" || isVideoUrl(content)) {
			promises.push(
				new Promise<void>((resolve) => {
					const video = getVideo(content);
					if (!video) return resolve();
					if (video.readyState >= 2) return resolve();
					const onLoaded = () => {
						video.removeEventListener("loadeddata", onLoaded);
						video.removeEventListener("canplay", onLoaded);
						video.removeEventListener("error", onLoaded);
						resolve();
					};
					video.addEventListener("loadeddata", onLoaded);
					video.addEventListener("canplay", onLoaded);
					video.addEventListener("error", onLoaded);
					setTimeout(resolve, 2000);
				}),
			);
		}
	}

	await Promise.all(promises);
}

export function disposeGestureMediaCache(): void {
	for (const video of videoCache.values()) {
		try {
			video.pause();
			video.removeAttribute("src");
			video.load();
		} catch {
			// ignore cleanup errors
		}
	}
	videoCache.clear();
	imageCache.clear();
}

export function renderGestureObjects(
	ctx: CanvasRenderingContext2D,
	regions: FingerGestureRegion[],
	settings: GestureTrackingSettings | undefined,
	webcamSettings: WebcamOverlaySettings,
	width: number,
	height: number,
	timeMs: number,
	zoomScale: number = 1,
) {
	if (!settings?.enabled || !regions || regions.length === 0) {
		return;
	}

	const hasSeparateWebcam = Boolean(
		webcamSettings?.sourcePath && webcamSettings?.enabled !== false,
	);

	let webcamDims: { width: number; height: number };
	let webcamPos: { x: number; y: number };

	if (hasSeparateWebcam) {
		const scaledMargin = scaleWebcamOverlayPixels(
			webcamSettings.margin ?? 24,
			width,
		);
		const widthPercent = webcamSettings.width ?? webcamSettings.size ?? 50;
		const heightPercent = getCropMatchedWebcamHeightPercent(
			widthPercent,
			webcamSettings.height ?? webcamSettings.size ?? 50,
			null,
			null,
			webcamSettings.cropRegion,
		);

		// Calculate webcam box in canvas
		webcamDims = getWebcamOverlayDimensionsPx({
			containerWidth: width,
			containerHeight: height,
			widthPercent,
			heightPercent,
			margin: scaledMargin,
			zoomScale,
			reactToZoom: webcamSettings.reactToZoom ?? true,
		});

		webcamPos = getWebcamOverlayPosition({
			containerWidth: width,
			containerHeight: height,
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
			width,
			height,
		};
		webcamPos = {
			x: 0,
			y: 0,
		};
	}

	for (const region of regions) {
		const attachment = {
			...(settings?.defaultAttachment ?? {}),
			...(region.attachment ?? {}),
		};
		const motion = evaluateGestureObject(region, attachment, timeMs);
		if (!motion.visible || motion.opacity <= 0.01) continue;

		let normX = motion.x;
		if (webcamSettings.mirror) {
			normX = 1 - normX;
		}

		const screenX = webcamPos.x + normX * webcamDims.width;
		const screenY = webcamPos.y + motion.y * webcamDims.height;
		const sizePx =
			(Math.min(webcamDims.width, webcamDims.height) * (motion.sizePct || 14)) /
			100;

		const textColor = attachment.textColor || "#ffffff";
		const bgColor =
			attachment.backgroundColor ||
			(attachment.kind === "number" ? "#3b82f6" : "#000000");
		const badgeStyle =
			attachment.badgeStyle ||
			(attachment.kind === "number" ? "solid" : "glass");

		ctx.save();
		ctx.globalAlpha = motion.opacity;
		ctx.translate(screenX, screenY);
		ctx.rotate((motion.rotationDeg * Math.PI) / 180);
		ctx.scale(motion.scale, motion.scale);

		if (attachment.kind === "sticker") {
			const emoji =
				isImageUrl(attachment.content) || (attachment.content && attachment.content.length > 8)
					? "✨"
					: attachment.content || "✨";
			ctx.font = `${sizePx}px sans-serif`;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
			ctx.shadowBlur = sizePx * 0.25;
			ctx.shadowOffsetY = sizePx * 0.05;
			ctx.fillText(emoji, 0, 0);
			ctx.shadowColor = "transparent";
			ctx.shadowBlur = 0;
			ctx.shadowOffsetY = 0;
		} else if (attachment.kind === "text") {
			const text = isImageUrl(attachment.content) ? "Note" : attachment.content || "Note";
			const fontSize = Math.max(
				12,
				sizePx * 0.4 * (attachment.fontSizeMultiplier || 1),
			);
			ctx.font = `bold ${fontSize}px sans-serif`;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";

			const metrics = ctx.measureText(text);
			const paddingX = 14;
			const paddingY = 8;
			const boxW = metrics.width + paddingX * 2;
			const boxH = fontSize * 1.5 + paddingY;
			const radius = badgeStyle === "pill" ? boxH / 2 : 8;

			if (badgeStyle !== "none") {
				ctx.beginPath();
				if (typeof ctx.roundRect === "function") {
					ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, radius);
				} else {
					ctx.rect(-boxW / 2, -boxH / 2, boxW, boxH);
				}

				if (badgeStyle === "solid" || badgeStyle === "pill") {
					ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
					ctx.shadowBlur = sizePx * 0.28;
					ctx.shadowOffsetY = sizePx * 0.06;
					ctx.fillStyle = bgColor;
					ctx.fill();
					ctx.shadowColor = "transparent";
					ctx.shadowBlur = 0;
					ctx.shadowOffsetY = 0;

					ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
					ctx.lineWidth = Math.max(1.5, sizePx * 0.025);
					ctx.stroke();
				} else if (badgeStyle === "neon") {
					ctx.shadowColor = bgColor;
					ctx.shadowBlur = sizePx * 0.4;
					ctx.fillStyle = "rgba(10, 10, 15, 0.85)";
					ctx.fill();

					ctx.strokeStyle = bgColor;
					ctx.lineWidth = Math.max(2, sizePx * 0.035);
					ctx.stroke();
					ctx.shadowColor = "transparent";
					ctx.shadowBlur = 0;
				} else if (badgeStyle === "outline") {
					ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
					ctx.shadowBlur = sizePx * 0.2;
					ctx.strokeStyle = bgColor;
					ctx.lineWidth = Math.max(2, sizePx * 0.035);
					ctx.stroke();
					ctx.shadowColor = "transparent";
					ctx.shadowBlur = 0;
				} else {
					// glass (default)
					ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
					ctx.shadowBlur = sizePx * 0.35;
					ctx.shadowOffsetY = sizePx * 0.08;
					ctx.fillStyle =
						bgColor.startsWith("#") && bgColor.length === 7
							? `${bgColor}bb`
							: "rgba(0, 0, 0, 0.75)";
					ctx.fill();
					ctx.shadowColor = "transparent";
					ctx.shadowBlur = 0;
					ctx.shadowOffsetY = 0;

					ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
					ctx.lineWidth = Math.max(1.2, sizePx * 0.02);
					ctx.stroke();
				}
			}

			if (badgeStyle === "neon") {
				ctx.shadowColor = textColor;
				ctx.shadowBlur = sizePx * 0.15;
			} else if (badgeStyle === "none") {
				ctx.shadowColor = "rgba(0,0,0,0.8)";
				ctx.shadowBlur = sizePx * 0.15;
				ctx.shadowOffsetY = sizePx * 0.04;
			}
			ctx.fillStyle = textColor;
			ctx.fillText(text, 0, 0);
			ctx.shadowColor = "transparent";
			ctx.shadowBlur = 0;
			ctx.shadowOffsetY = 0;
		} else if (attachment.kind === "number") {
			const num = isImageUrl(attachment.content) ? "1" : attachment.content || "1";
			const radius = sizePx / 2;

			if (badgeStyle !== "none") {
				ctx.beginPath();
				ctx.arc(0, 0, radius, 0, Math.PI * 2);

				if (badgeStyle === "neon") {
					// Pronounced outer neon glow + dark core
					ctx.shadowColor = bgColor;
					ctx.shadowBlur = sizePx * 0.45;
					ctx.fillStyle = "rgba(10, 10, 15, 0.85)";
					ctx.fill();

					ctx.strokeStyle = bgColor;
					ctx.lineWidth = Math.max(2.5, sizePx * 0.045);
					ctx.stroke();
					ctx.shadowColor = "transparent";
					ctx.shadowBlur = 0;
				} else if (badgeStyle === "outline") {
					ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
					ctx.shadowBlur = sizePx * 0.22;
					ctx.strokeStyle = bgColor;
					ctx.lineWidth = Math.max(2.5, sizePx * 0.04);
					ctx.stroke();
					ctx.shadowColor = "transparent";
					ctx.shadowBlur = 0;
				} else if (badgeStyle === "solid" || badgeStyle === "pill") {
					ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
					ctx.shadowBlur = sizePx * 0.32;
					ctx.shadowOffsetY = sizePx * 0.07;
					ctx.fillStyle = bgColor;
					ctx.fill();
					ctx.shadowColor = "transparent";
					ctx.shadowBlur = 0;
					ctx.shadowOffsetY = 0;

					ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
					ctx.lineWidth = Math.max(1.5, sizePx * 0.025);
					ctx.stroke();
				} else {
					// glass (default for number)
					ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
					ctx.shadowBlur = sizePx * 0.35;
					ctx.shadowOffsetY = sizePx * 0.08;
					ctx.fillStyle =
						bgColor.startsWith("#") && bgColor.length === 7
							? `${bgColor}bb`
							: "rgba(0, 0, 0, 0.75)";
					ctx.fill();
					ctx.shadowColor = "transparent";
					ctx.shadowBlur = 0;
					ctx.shadowOffsetY = 0;

					ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
					ctx.lineWidth = Math.max(1.5, sizePx * 0.025);
					ctx.stroke();
				}
			}

			const fontSize = sizePx * 0.55 * (attachment.fontSizeMultiplier || 1);
			ctx.font = `900 ${fontSize}px sans-serif`;
			if (badgeStyle === "neon") {
				ctx.shadowColor = textColor;
				ctx.shadowBlur = sizePx * 0.15;
			} else if (badgeStyle === "none") {
				ctx.shadowColor = "rgba(0,0,0,0.8)";
				ctx.shadowBlur = sizePx * 0.15;
				ctx.shadowOffsetY = sizePx * 0.04;
			}
			ctx.fillStyle = textColor;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(num, 0, 1);
			ctx.shadowColor = "transparent";
			ctx.shadowBlur = 0;
			ctx.shadowOffsetY = 0;
		} else if (attachment.kind === "image" && attachment.content) {
			const img = getImage(attachment.content);
			if (img) {
				const aspect = img.naturalWidth / (img.naturalHeight || 1);
				let drawW = sizePx;
				let drawH = sizePx;
				if (aspect > 1) {
					drawH = sizePx / aspect;
				} else {
					drawW = sizePx * aspect;
				}
				ctx.save();
				ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
				ctx.shadowBlur = sizePx * 0.3;
				ctx.shadowOffsetY = sizePx * 0.07;
				const cornerRadius = Math.max(4, sizePx * 0.12);
				ctx.beginPath();
				if (typeof ctx.roundRect === "function") {
					ctx.roundRect(-drawW / 2, -drawH / 2, drawW, drawH, cornerRadius);
				} else {
					ctx.rect(-drawW / 2, -drawH / 2, drawW, drawH);
				}
				ctx.clip();
				ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
				ctx.restore();
			}
		} else if (attachment.kind === "video" && attachment.content) {
			const video = getVideo(attachment.content);
			if (video) {
				// Seek video frame relative to gesture start time
				const elapsedSec = Math.max(0, (timeMs - (region.startMs ?? 0)) / 1000);
				const duration = video.duration && isFinite(video.duration) && video.duration > 0 ? video.duration : null;
				let targetTime = elapsedSec;
				if (duration) {
					if (attachment.videoLoop !== false) {
						targetTime = elapsedSec % duration;
					} else {
						targetTime = Math.min(elapsedSec, duration);
					}
				}
				if (Math.abs(video.currentTime - targetTime) > 0.03) {
					try {
						video.currentTime = targetTime;
					} catch {
						// ignore seek issues during rapid playback
					}
				}

				if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
					const aspect = video.videoWidth / video.videoHeight;
					let drawW = sizePx;
					let drawH = sizePx;
					if (aspect > 1) {
						drawH = sizePx / aspect;
					} else {
						drawW = sizePx * aspect;
					}
					ctx.save();
					ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
					ctx.shadowBlur = sizePx * 0.3;
					ctx.shadowOffsetY = sizePx * 0.07;
					const cornerRadius = Math.max(4, sizePx * 0.12);
					ctx.beginPath();
					if (typeof ctx.roundRect === "function") {
						ctx.roundRect(-drawW / 2, -drawH / 2, drawW, drawH, cornerRadius);
					} else {
						ctx.rect(-drawW / 2, -drawH / 2, drawW, drawH);
					}
					ctx.clip();
					ctx.drawImage(video, -drawW / 2, -drawH / 2, drawW, drawH);
					ctx.restore();
				}
			}
		}

		ctx.restore();
	}
}


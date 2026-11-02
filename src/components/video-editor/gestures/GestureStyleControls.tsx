import { Button } from "@/components/ui/button";
import { ColorControl } from "@/components/ui/color-picker";
import { Switch } from "@/components/ui/switch";
import { SliderControl } from "../SliderControl";
import { useRef, useState } from "react";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import type { useI18n } from "@/contexts/I18nContext";
import type {
	GestureAttachment,
	GestureBadgeStyle,
	GestureEnterAnimation,
	GestureObjectKind,
} from "./gestureTypes";

const GESTURE_TEXT_COLORS = [
	"#FFFFFF",
	"#000000",
	"#FACC15",
	"#4ADE80",
	"#60A5FA",
	"#F43F5E",
	"#A855F7",
	"#FB923C",
];

const GESTURE_BG_COLORS = [
	"#000000",
	"#18181B",
	"#6366F1",
	"#2563EB",
	"#DC2626",
	"#16A34A",
	"#D97706",
	"#9333EA",
	"#EC4899",
];

const BADGE_STYLES: Array<{ id: GestureBadgeStyle; label: string }> = [
	{ id: "glass", label: "Glass" },
	{ id: "solid", label: "Solid" },
	{ id: "pill", label: "Pill" },
	{ id: "neon", label: "Neon" },
	{ id: "outline", label: "Outline" },
	{ id: "none", label: "None" },
];

interface GestureStyleControlsProps {
	t: ReturnType<typeof useI18n>["t"];
	attachment: GestureAttachment;
	onChange: (partial: Partial<GestureAttachment>) => void;
	showObjectKindTabs?: boolean;
}

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

function getDefaultContentForKind(kind: GestureObjectKind, currentContent: string = ""): string {
	switch (kind) {
		case "sticker":
			return isImageUrl(currentContent) || isVideoUrl(currentContent) || currentContent.length > 8
				? "✨"
				: currentContent || "✨";
		case "text":
			return isImageUrl(currentContent) || isVideoUrl(currentContent) ? "Note" : currentContent || "Note";
		case "number":
			return isImageUrl(currentContent) || isVideoUrl(currentContent) || isNaN(Number(currentContent))
				? "1"
				: currentContent || "1";
		case "image":
			return isImageUrl(currentContent) ? currentContent : "";
		case "video":
			return isVideoUrl(currentContent) ? currentContent : "";
		default:
			return currentContent;
	}
}

export function GestureStyleControls({
	t,
	attachment,
	onChange,
	showObjectKindTabs = true,
}: GestureStyleControlsProps) {
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const videoFileInputRef = useRef<HTMLInputElement>(null);

	const textColor = attachment.textColor || "#FFFFFF";
	const bgColor =
		attachment.backgroundColor ||
		(attachment.kind === "number" ? "#2563EB" : "#000000");
	const badgeStyle =
		attachment.badgeStyle ||
		(attachment.kind === "number" ? "solid" : "glass");

	const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") {
				onChange({ content: reader.result });
			}
		};
		reader.readAsDataURL(file);
	};

	const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") {
				onChange({ content: reader.result });
			}
		};
		reader.readAsDataURL(file);
	};

	const handlePickLocalImage = async () => {
		try {
			if (window.electronAPI?.openImageFilePicker) {
				const res = await window.electronAPI.openImageFilePicker();
				if (res.success && res.path) {
					onChange({ content: res.path });
					return;
				}
			}
		} catch {
			// Fallback to browser file input
		}
		fileInputRef.current?.click();
	};

	const handlePickLocalVideo = async () => {
		try {
			if (window.electronAPI?.openVideoFilePicker) {
				const res = await window.electronAPI.openVideoFilePicker();
				if (res.success && res.path) {
					onChange({ content: res.path });
					return;
				}
			}
		} catch {
			// Fallback to browser file input
		}
		videoFileInputRef.current?.click();
	};

	return (
		<div className="flex flex-col gap-4 text-xs">
			{/* Object Kind Selector */}
			{showObjectKindTabs && (
				<div className="flex flex-col gap-1.5">
					<span className="font-semibold text-foreground">
						{t("settings.gestures.objectType", "Attached Object Type")}
					</span>
					<div className="grid grid-cols-5 gap-1 rounded-lg bg-foreground/[0.05] p-1">
						{(["sticker", "text", "number", "image", "video"] as GestureObjectKind[]).map(
							(kind) => (
								<button
									key={kind}
									type="button"
									onClick={() => {
										const nextContent = getDefaultContentForKind(kind, attachment.content);
										onChange({
											kind,
											content: nextContent,
										});
									}}
									className={`rounded-md py-1.5 text-xs font-medium capitalize transition-colors ${
										attachment.kind === kind
											? "bg-background text-foreground shadow-sm font-semibold"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									{kind}
								</button>
							),
						)}
					</div>
				</div>
			)}

			{/* Kind: Sticker / Emoji */}
			{attachment.kind === "sticker" && (
				<div className="relative flex flex-col gap-2">
					<span className="text-muted-foreground">Sticker Icon</span>
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => setShowEmojiPicker(!showEmojiPicker)}
							className="flex size-12 items-center justify-center rounded-xl border border-border bg-foreground/[0.04] text-2xl hover:bg-foreground/[0.08] transition-colors"
						>
							{isImageUrl(attachment.content) || (attachment.content && attachment.content.length > 8)
								? "✨"
								: attachment.content || "✨"}
						</button>
						<span className="text-xs text-muted-foreground">
							Click icon to pick an emoji or symbol
						</span>
					</div>
					{showEmojiPicker && (
						<div className="absolute top-14 z-50 shadow-2xl">
							<EmojiPicker
								onEmojiClick={(emoji: EmojiClickData) => {
									onChange({ content: emoji.emoji });
									setShowEmojiPicker(false);
								}}
							/>
						</div>
					)}
				</div>
			)}

			{/* Kind: Text */}
			{attachment.kind === "text" && (
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-1.5">
						<span className="text-muted-foreground">Text Message</span>
						<input
							type="text"
							value={isImageUrl(attachment.content) ? "" : attachment.content || ""}
							onChange={(e) => onChange({ content: e.target.value })}
							placeholder="e.g. Important Point"
							className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
						/>
					</div>

					{/* Badge Style */}
					<div className="flex flex-col gap-1.5">
						<span className="text-muted-foreground">Badge Style</span>
						<div className="grid grid-cols-3 gap-1 rounded-lg bg-foreground/[0.05] p-1">
							{BADGE_STYLES.map((style) => (
								<button
									key={style.id}
									type="button"
									onClick={() => onChange({ badgeStyle: style.id })}
									className={`rounded-md py-1 text-xs font-medium transition-colors ${
										badgeStyle === style.id
											? "bg-background text-foreground shadow-sm font-semibold"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									{style.label}
								</button>
							))}
						</div>
					</div>

					{/* Text & Background Colors */}
					<div className="grid grid-cols-2 gap-2 pt-1">
						<div className="flex flex-col gap-1.5">
							<span className="text-muted-foreground">Text Color</span>
							<ColorControl
								compact
								label="Text Color"
								value={textColor}
								onChange={(val) => onChange({ textColor: val })}
							/>
							<div className="flex flex-wrap gap-1">
								{GESTURE_TEXT_COLORS.map((c) => (
									<button
										key={c}
										type="button"
										onClick={() => onChange({ textColor: c })}
										className={`size-4 rounded-full border border-white/20 transition-transform hover:scale-125 ${
											textColor.toLowerCase() === c.toLowerCase()
												? "ring-2 ring-primary ring-offset-1 ring-offset-background"
												: ""
										}`}
										style={{ backgroundColor: c }}
									/>
								))}
							</div>
						</div>

						{badgeStyle !== "none" && (
							<div className="flex flex-col gap-1.5">
								<span className="text-muted-foreground">Badge Color</span>
								<ColorControl
									compact
									label="Badge Color"
									value={bgColor}
									onChange={(val) => onChange({ backgroundColor: val })}
								/>
								<div className="flex flex-wrap gap-1">
									{GESTURE_BG_COLORS.map((c) => (
										<button
											key={c}
											type="button"
											onClick={() => onChange({ backgroundColor: c })}
											className={`size-4 rounded-full border border-white/20 transition-transform hover:scale-125 ${
												bgColor.toLowerCase() === c.toLowerCase()
													? "ring-2 ring-primary ring-offset-1 ring-offset-background"
													: ""
											}`}
											style={{ backgroundColor: c }}
										/>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Kind: Number */}
			{attachment.kind === "number" && (
				<div className="flex flex-col gap-3">
					<div className="flex items-center justify-between gap-3">
						<div className="flex flex-col gap-1.5">
							<span className="text-muted-foreground">Display Number</span>
							<input
								type="text"
								value={isImageUrl(attachment.content) ? "" : attachment.content || ""}
								onChange={(e) => onChange({ content: e.target.value })}
								placeholder="1"
								className="w-24 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
							/>
						</div>

						<div className="flex flex-col gap-1.5 flex-1">
							<span className="text-muted-foreground">Badge Shape</span>
							<div className="grid grid-cols-3 gap-1 rounded-lg bg-foreground/[0.05] p-1">
								{(["solid", "glass", "neon", "outline", "none"] as GestureBadgeStyle[]).map(
									(style) => (
										<button
											key={style}
											type="button"
											onClick={() => onChange({ badgeStyle: style })}
											className={`rounded-md py-1 text-xs font-medium capitalize transition-colors ${
												badgeStyle === style
													? "bg-background text-foreground shadow-sm font-semibold"
													: "text-muted-foreground hover:text-foreground"
											}`}
										>
											{style}
										</button>
									),
								)}
							</div>
						</div>
					</div>

					{/* Text & Background Colors */}
					<div className="grid grid-cols-2 gap-2 pt-1">
						<div className="flex flex-col gap-1.5">
							<span className="text-muted-foreground">Number Color</span>
							<ColorControl
								compact
								label="Number Color"
								value={textColor}
								onChange={(val) => onChange({ textColor: val })}
							/>
							<div className="flex flex-wrap gap-1">
								{GESTURE_TEXT_COLORS.map((c) => (
									<button
										key={c}
										type="button"
										onClick={() => onChange({ textColor: c })}
										className={`size-4 rounded-full border border-white/20 transition-transform hover:scale-125 ${
											textColor.toLowerCase() === c.toLowerCase()
												? "ring-2 ring-primary ring-offset-1 ring-offset-background"
												: ""
										}`}
										style={{ backgroundColor: c }}
									/>
								))}
							</div>
						</div>

						{badgeStyle !== "none" && (
							<div className="flex flex-col gap-1.5">
								<span className="text-muted-foreground">Badge Color</span>
								<ColorControl
									compact
									label="Badge Color"
									value={bgColor}
									onChange={(val) => onChange({ backgroundColor: val })}
								/>
								<div className="flex flex-wrap gap-1">
									{GESTURE_BG_COLORS.map((c) => (
										<button
											key={c}
											type="button"
											onClick={() => onChange({ backgroundColor: c })}
											className={`size-4 rounded-full border border-white/20 transition-transform hover:scale-125 ${
												bgColor.toLowerCase() === c.toLowerCase()
													? "ring-2 ring-primary ring-offset-1 ring-offset-background"
													: ""
											}`}
											style={{ backgroundColor: c }}
										/>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Kind: Custom Image Upload */}
			{attachment.kind === "image" && (
				<div className="flex flex-col gap-2.5">
					<span className="text-muted-foreground">Custom Image</span>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
						className="hidden"
						onChange={handleImageFileUpload}
					/>

					{isImageUrl(attachment.content) ? (
						<div className="flex items-center gap-3 rounded-xl border border-border bg-foreground/[0.03] p-2.5">
							<img
								src={attachment.content}
								alt="Uploaded gesture target"
								className="size-14 rounded-lg object-contain bg-background/50 border border-border/60"
							/>
							<div className="flex flex-col gap-1.5 flex-1">
								<span className="text-[11px] font-medium text-foreground truncate">
									Custom Image Loaded
								</span>
								<div className="flex items-center gap-2">
									<Button
										size="sm"
										variant="outline"
										className="h-7 text-xs px-2.5"
										onClick={() => fileInputRef.current?.click()}
									>
										Replace
									</Button>
									<Button
										size="sm"
										variant="ghost"
										className="h-7 text-xs px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
										onClick={() => onChange({ content: "" })}
									>
										Remove
									</Button>
								</div>
							</div>
						</div>
					) : (
						<div
							onClick={handlePickLocalImage}
							className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/80 p-5 text-center cursor-pointer hover:border-primary hover:bg-foreground/[0.02] transition-colors"
						>
							<span className="text-2xl">🖼️</span>
							<div>
								<span className="font-semibold text-foreground">
									Upload Custom Image
								</span>
								<p className="text-[11px] text-muted-foreground">
									PNG, JPG, WebP, SVG, or GIF
								</p>
							</div>
							<Button size="sm" variant="secondary" className="h-7 text-xs mt-1 pointer-events-none">
								Browse Files
							</Button>
						</div>
					)}
				</div>
			)}

			{/* Kind: Custom Video Upload */}
			{attachment.kind === "video" && (
				<div className="flex flex-col gap-2.5">
					<span className="text-muted-foreground">Custom Video</span>
					<input
						ref={videoFileInputRef}
						type="file"
						accept="video/mp4,video/webm,video/quicktime,video/mov,video/avi,video/mkv"
						className="hidden"
						onChange={handleVideoFileUpload}
					/>

					{isVideoUrl(attachment.content) ? (
						<div className="flex flex-col gap-2.5 rounded-xl border border-border bg-foreground/[0.03] p-2.5">
							<div className="flex items-center gap-3">
								<video
									src={attachment.content}
									className="size-14 rounded-lg object-cover bg-background/50 border border-border/60"
									muted
									loop
									playsInline
									autoPlay
								/>
								<div className="flex flex-col gap-1.5 flex-1">
									<span className="text-[11px] font-medium text-foreground truncate">
										Custom Video Loaded
									</span>
									<div className="flex items-center gap-2">
										<Button
											size="sm"
											variant="outline"
											className="h-7 text-xs px-2.5"
											onClick={handlePickLocalVideo}
										>
											Replace
										</Button>
										<Button
											size="sm"
											variant="ghost"
											className="h-7 text-xs px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
											onClick={() => onChange({ content: "" })}
										>
											Remove
										</Button>
									</div>
								</div>
							</div>

							<div className="flex items-center justify-between border-t border-border/40 pt-2 text-[11px]">
								<span className="text-muted-foreground">Loop video</span>
								<Switch
									checked={attachment.videoLoop ?? true}
									onCheckedChange={(videoLoop) => onChange({ videoLoop })}
									aria-label="Loop video"
								/>
							</div>
						</div>
					) : (
						<div
							onClick={handlePickLocalVideo}
							className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/80 p-5 text-center cursor-pointer hover:border-primary hover:bg-foreground/[0.02] transition-colors"
						>
							<span className="text-2xl">🎥</span>
							<div>
								<span className="font-semibold text-foreground">
									Upload Custom Video
								</span>
								<p className="text-[11px] text-muted-foreground">
									MP4, WebM, MOV, or AVI
								</p>
							</div>
							<Button size="sm" variant="secondary" className="h-7 text-xs mt-1 pointer-events-none">
								Browse Video Files
							</Button>
						</div>
					)}
				</div>
			)}

			{/* Distance from Fingertip Slider (0 - 25 cm) */}
			<SliderControl
				label={t("settings.gestures.distance", "Air Distance above fingertip")}
				value={attachment.offsetCm}
				min={0}
				max={25}
				step={0.1}
				onChange={(val) => onChange({ offsetCm: val })}
				formatValue={(val) => `${val.toFixed(1)} cm`}
			/>

			{/* Object Size Slider (4 - 120%) */}
			<SliderControl
				label={t("settings.gestures.size", "Object Size")}
				value={attachment.sizePct}
				min={4}
				max={120}
				step={1}
				onChange={(val) => onChange({ sizePct: val })}
				formatValue={(val) => `${val}%`}
			/>

			{/* Entrance Animation Preset */}
			<div className="flex flex-col gap-1.5">
				<span className="text-muted-foreground">
					{t("settings.gestures.animation", "Entrance Animation")}
				</span>
				<div className="grid grid-cols-3 gap-1 rounded-lg bg-foreground/[0.05] p-1">
					{(["pop", "fade-up", "scale"] as GestureEnterAnimation[]).map((anim) => (
						<button
							key={anim}
							type="button"
							onClick={() => onChange({ enterAnimation: anim })}
							className={`rounded-md py-1 text-xs font-medium capitalize transition-colors ${
								attachment.enterAnimation === anim
									? "bg-background text-foreground shadow-sm font-semibold"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							{anim}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

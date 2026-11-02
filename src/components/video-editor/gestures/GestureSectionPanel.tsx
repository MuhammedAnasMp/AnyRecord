import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash } from "@/components/ui/icons";
import type { useI18n } from "@/contexts/I18nContext";
import { GestureStyleControls } from "./GestureStyleControls";
import {
	type FingerGestureRegion,
	type GestureAttachment,
	type GestureTrackingSettings,
	getFingerDisplayName,
	getFingerEmoji,
} from "./gestureTypes";

interface GestureSectionPanelProps {
	t: ReturnType<typeof useI18n>["t"];
	settings: GestureTrackingSettings;
	onSettingsChange: (settings: GestureTrackingSettings) => void;
	onUpdateDefaultAttachment?: (partial: Partial<GestureAttachment>) => void;
	gestureRegions: FingerGestureRegion[];
	onUpdateRegions?: (regions: FingerGestureRegion[]) => void;
	onAnalyzeWebcam: () => Promise<void>;
	isAnalyzing: boolean;
	analysisProgress: number;
	webcamSourcePath: string | null;
	onSelectRegion?: (id: string) => void;
	onDeleteRegion?: (id: string) => void;
	selectedRegionId?: string | null;
	advanced?: boolean;
}

function getAttachmentBadgeLabel(attachment?: GestureAttachment) {
	if (!attachment) return "✨ Sticker";
	switch (attachment.kind) {
		case "sticker":
			return attachment.content && attachment.content.length <= 4 ? attachment.content : "✨";
		case "text":
			return "📝 Text";
		case "number":
			return `#${attachment.content || "1"}`;
		case "image":
			return "🖼️ Image";
		case "video":
			return "🎥 Video";
		default:
			return "✨ Object";
	}
}

export function GestureSectionPanel({
	t,
	settings,
	onSettingsChange,
	onUpdateDefaultAttachment,
	gestureRegions,
	onUpdateRegions,
	onAnalyzeWebcam,
	isAnalyzing,
	analysisProgress,
	webcamSourcePath,
	onSelectRegion,
	onDeleteRegion,
	selectedRegionId,
	advanced = false,
}: GestureSectionPanelProps) {
	const updateDefaultAttachment = (partial: Partial<GestureAttachment>) => {
		if (onUpdateDefaultAttachment) {
			onUpdateDefaultAttachment(partial);
		} else {
			onSettingsChange({
				...settings,
				defaultAttachment: {
					...settings.defaultAttachment,
					...partial,
				},
			});
			if (onUpdateRegions && gestureRegions.length > 0) {
				onUpdateRegions(
					gestureRegions.map((region) => ({
						...region,
						attachment: {
							...region.attachment,
							...partial,
						},
					})),
				);
			}
		}
	};

	return (
		<div className="flex flex-col gap-5 p-4 text-sm">
			{/* Master Toggle */}
			<div className="flex items-center justify-between gap-3">
				<div>
					<span className="font-medium text-foreground">
						{t("settings.gestures.enableTracking", "Fingertip Tracking")}
					</span>
					<p className="text-xs text-muted-foreground">
						{t(
							"settings.gestures.description",
							"Detect raised fingers in webcam",
						)}
					</p>
				</div>
				<Switch
					aria-label={t("settings.gestures.enableTracking", "Fingertip Tracking")}
					checked={Boolean(settings.enabled)}
					onCheckedChange={(enabled) =>
						onSettingsChange({ ...settings, enabled })
					}
				/>
			</div>

			{settings.enabled && (
				<>
					{/* Analysis status / Action */}
					<div className="rounded-xl border border-border/50 bg-foreground/[0.02] p-3.5 flex flex-col gap-3">
						<div className="flex items-center justify-between">

							<span className="text-xs text-muted-foreground">
								{gestureRegions.length}{" "}
								{gestureRegions.length === 1 ? "finger block" : "finger blocks"}
							</span>
						</div>

						{isAnalyzing ? (
							<div className="flex flex-col gap-2">
								<div className="flex justify-between text-xs text-muted-foreground">
									<span>Scanning fingers...</span>
									<span>{Math.round(analysisProgress * 100)}%</span>
								</div>
								<div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
									<div
										className="h-full bg-primary transition-all duration-150"
										style={{ width: `${Math.round(analysisProgress * 100)}%` }}
									/>
								</div>
							</div>
						) : (
							<Button
								size="sm"
								variant="default"
								className="w-full font-medium"
								disabled={!webcamSourcePath}
								onClick={onAnalyzeWebcam}
							>
								{gestureRegions.length > 0
									? t("settings.gestures.reanalyze", "Re-Scan Fingers")
									: t("settings.gestures.scanWebcam", "Scan Fingers")}
							</Button>
						)}

						{!webcamSourcePath && (
							<p className="text-xs text-amber-500/90">
								{t(
									"settings.gestures.noWebcamWarning",
									"No video footage detected in this recording.",
								)}
							</p>
						)}
					</div>

					{/* Detected Regions List */}
					{gestureRegions.length > 0 && (
						<div className="flex flex-col gap-2">
							<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
								{t("settings.gestures.detectedFingers", "Detected Finger Sessions")}
							</span>
							<div className="max-h-48 flex flex-col gap-1.5 overflow-y-auto pr-1">
								{gestureRegions.map((region) => {
									const isSelected = region.id === selectedRegionId;
									return (
										<div
											key={region.id}
											className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors group ${isSelected
												? "bg-primary text-primary-foreground font-medium"
												: "bg-foreground/[0.04] hover:bg-foreground/[0.08] text-foreground"
												}`}
										>
											<button
												type="button"
												onClick={() => onSelectRegion?.(region.id)}
												className="flex items-center gap-2 flex-1 text-left"
											>
												<span className="text-base">{getFingerEmoji(region.finger)}</span>
												<div className="flex flex-col">
													<span>{getFingerDisplayName(region.finger, region.hand)}</span>
													<span className="text-[10px] opacity-75 font-mono">
														{(region.startMs / 1000).toFixed(1)}s – {(region.endMs / 1000).toFixed(1)}s
													</span>
												</div>
											</button>
											<div className="flex items-center gap-1.5">
												<span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isSelected
													? "bg-primary-foreground/20 text-primary-foreground"
													: "bg-foreground/[0.06] text-muted-foreground"
													}`}>
													{getAttachmentBadgeLabel(region.attachment || settings.defaultAttachment)}
												</span>
												{onDeleteRegion && (
													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															onDeleteRegion(region.id);
														}}
														title="Delete finger session"
														className={`size-6 flex items-center justify-center rounded transition-colors ${isSelected
															? "hover:bg-primary-foreground/20 text-primary-foreground"
															: "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
															}`}
													>
														<Trash className="size-3.5" />
													</button>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}

					{/* Default Attachment Config */}
					<div className="flex flex-col gap-3 border-t border-border/40 pt-4">
						<span className="text-xs font-semibold text-foreground">
							{t("settings.gestures.defaultObject", "Default Floating Object")}
						</span>

						<GestureStyleControls
							t={t}
							attachment={settings.defaultAttachment}
							onChange={updateDefaultAttachment}
							showObjectKindTabs={true}
						/>
					</div>

					{/* Advanced settings */}
					{advanced && (
						<div className="flex flex-col gap-3 border-t border-border/40 pt-4 text-xs">
							<span className="font-semibold text-muted-foreground uppercase tracking-wider">
								Advanced Tuning
							</span>

							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Rotate with finger tilt</span>
								<Switch
									checked={Boolean(settings.defaultAttachment.followRotation)}
									onCheckedChange={(followRotation) =>
										updateDefaultAttachment({ followRotation })
									}
									aria-label="Rotate with finger tilt"
								/>
							</div>

							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Scale with hand depth</span>
								<Switch
									checked={Boolean(settings.defaultAttachment.scaleWithHand)}
									onCheckedChange={(scaleWithHand) =>
										updateDefaultAttachment({ scaleWithHand })
									}
									aria-label="Scale with hand depth"
								/>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}

import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash } from "@/components/ui/icons";
import type { useI18n } from "@/contexts/I18nContext";
import { GestureStyleControls } from "./GestureStyleControls";
import {
	type FingerGestureRegion,
	type GestureAttachment,
	getFingerDisplayName,
	getFingerEmoji,
} from "./gestureTypes";

interface GestureItemPanelProps {
	t: ReturnType<typeof useI18n>["t"];
	region: FingerGestureRegion;
	onRegionChange: (updated: FingerGestureRegion) => void;
	onDeleteRegion: (id: string) => void;
	onBack?: () => void;
}

export function GestureItemPanel({
	t,
	region,
	onRegionChange,
	onDeleteRegion,
	onBack,
}: GestureItemPanelProps) {
	const attachment = region.attachment;

	const updateAttachment = (partial: Partial<GestureAttachment>) => {
		onRegionChange({
			...region,
			attachment: {
				...attachment,
				...partial,
			},
		});
	};

	return (
		<div className="flex flex-col gap-4 p-4 text-sm">
			{/* Back button navigation */}
			<div className="flex items-center justify-between border-b border-border/40 pb-2">
				<Button
					variant="ghost"
					size="sm"
					className="h-8 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
					onClick={onBack}
				>
					<ArrowLeft className="size-4" />
					<span>Back to Gestures</span>
				</Button>
				<Button
					size="sm"
					variant="ghost"
					className="h-8 px-2 text-xs gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/10"
					onClick={() => onDeleteRegion(region.id)}
				>
					<Trash className="size-3.5" />
					<span>Delete</span>
				</Button>
			</div>

			<div className="flex items-center gap-3 rounded-xl border border-border/50 bg-foreground/[0.02] p-3">
				<span className="text-3xl">{getFingerEmoji(region.finger)}</span>
				<div className="flex-1">
					<span className="font-semibold text-foreground text-sm">
						{getFingerDisplayName(region.finger, region.hand)}
					</span>
					<p className="text-xs text-muted-foreground font-mono">
						{(region.startMs / 1000).toFixed(2)}s — {(region.endMs / 1000).toFixed(2)}s
					</p>
				</div>
			</div>

			<GestureStyleControls
				t={t}
				attachment={attachment}
				onChange={updateAttachment}
				showObjectKindTabs={true}
			/>
		</div>
	);
}


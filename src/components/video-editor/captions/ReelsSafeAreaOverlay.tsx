import React from "react";

interface ReelsSafeAreaOverlayProps {
	visible: boolean;
	aspectRatioValue?: number; // e.g. 9/16 = 0.5625
}

export const ReelsSafeAreaOverlay: React.FC<ReelsSafeAreaOverlayProps> = ({
	visible,
}) => {
	if (!visible) return null;

	return (
		<div className="pointer-events-none absolute inset-0 z-30 select-none overflow-hidden font-sans">
			{/* Top Safe Area Margin (Profile header, audio, search) */}
			<div className="absolute inset-x-0 top-0 h-[14%] border-b border-dashed border-cyan-400/40 bg-cyan-950/10 backdrop-blur-[1px]">
				<div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-400/80">
					<span>Instagram Reels Header Area</span>
					<span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px]">Top Safe Limit</span>
				</div>
			</div>

			{/* Bottom Safe Area Margin (Caption, audio track, handle) */}
			<div className="absolute inset-x-0 bottom-0 h-[22%] border-t border-dashed border-rose-400/40 bg-rose-950/10 backdrop-blur-[1px]">
				<div className="flex items-end justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-rose-400/80">
					<span>Post Description & Audio Bar</span>
					<span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px]">Bottom Safe Limit</span>
				</div>
			</div>

			{/* Right Side UI Buttons Safe Area (Like, Comment, Share, Remix) */}
			<div className="absolute bottom-[22%] right-0 top-[14%] w-[16%] border-l border-dashed border-amber-400/40 bg-amber-950/10">
				<div className="flex h-full flex-col items-center justify-center gap-3 text-center text-[9px] font-semibold uppercase text-amber-400/70">
					<div className="rotate-90 whitespace-nowrap">Like / Share Bar</div>
				</div>
			</div>

			{/* Central Safe Zone Box */}
			<div className="absolute bottom-[22%] left-[4%] right-[16%] top-[14%] rounded-xl border border-dashed border-emerald-400/50">
				<div className="absolute left-2 top-2 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
					✓ 9:16 Caption Sweet Spot
				</div>
			</div>
		</div>
	);
};

import type React from "react";
import { useCallback, useRef } from "react";
import type { StudioLightingSettings } from "./studioLightingTypes";
import { cn } from "@/lib/utils";

interface StudioLightGizmoOverlayProps {
	settings: StudioLightingSettings;
	onUpdateSettings: (settings: StudioLightingSettings) => void;
	selectedLightId?: string | null;
	onSelectLight?: (id: string) => void;
	visible?: boolean;
}

export function StudioLightGizmoOverlay({
	settings,
	onUpdateSettings,
	selectedLightId,
	onSelectLight,
	visible = true,
}: StudioLightGizmoOverlayProps) {
	const draggingLightIdRef = useRef<string | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);

	const handlePointerDown = useCallback(
		(lightId: string, event: React.PointerEvent) => {
			event.preventDefault();
			event.stopPropagation();
			draggingLightIdRef.current = lightId;
			onSelectLight?.(lightId);
			(event.target as HTMLElement).setPointerCapture(event.pointerId);
		},
		[onSelectLight],
	);

	const handlePointerMove = useCallback(
		(event: React.PointerEvent) => {
			const draggingId = draggingLightIdRef.current;
			if (!draggingId || !containerRef.current) return;

			const rect = containerRef.current.getBoundingClientRect();
			if (rect.width <= 0 || rect.height <= 0) return;

			const clientX = event.clientX;
			const clientY = event.clientY;

			const nextX = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
			const nextY = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));

			const updatedLights = settings.lights.map((light) => {
				if (light.id === draggingId) {
					return {
						...light,
						x: Math.round(nextX * 1000) / 1000,
						y: Math.round(nextY * 1000) / 1000,
					};
				}
				return light;
			});

			onUpdateSettings({
				...settings,
				presetId: "custom",
				lights: updatedLights,
			});
		},
		[settings, onUpdateSettings],
	);

	const handlePointerUp = useCallback((event: React.PointerEvent) => {
		if (draggingLightIdRef.current) {
			try {
				(event.target as HTMLElement).releasePointerCapture(event.pointerId);
			} catch {
				// ignore
			}
			draggingLightIdRef.current = null;
		}
	}, []);

	const handleWheel = useCallback(
		(lightId: string, event: React.WheelEvent) => {
			event.preventDefault();
			event.stopPropagation();

			const delta = event.deltaY > 0 ? -0.05 : 0.05;
			const updatedLights = settings.lights.map((light) => {
				if (light.id === lightId) {
					const nextZ = Math.min(2.0, Math.max(0.1, light.z + delta));
					return {
						...light,
						z: Math.round(nextZ * 100) / 100,
					};
				}
				return light;
			});

			onUpdateSettings({
				...settings,
				presetId: "custom",
				lights: updatedLights,
			});
		},
		[settings, onUpdateSettings],
	);

	if (!visible || !settings.enabled) {
		return null;
	}

	return (
		<div
			ref={containerRef}
			className="absolute inset-0 pointer-events-auto select-none overflow-hidden"
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={handlePointerUp}
		>
			{settings.lights
				.filter((light) => light.enabled)
				.map((light) => {
					const isSelected = selectedLightId === light.id;
					const leftPercent = light.x * 100;
					const topPercent = light.y * 100;

					const roleIcons: Record<string, string> = {
						key: "☀️",
						fill: "💡",
						rim: "🌟",
						accent: "🎨",
						custom: "✨",
					};

					return (
						<div
							key={light.id}
							className={cn(
								"group absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-transform",
								isSelected ? "z-30 scale-110" : "z-20 hover:scale-105",
							)}
							style={{
								left: `${leftPercent}%`,
								top: `${topPercent}%`,
							}}
							onPointerDown={(e) => handlePointerDown(light.id, e)}
							onWheel={(e) => handleWheel(light.id, e)}
							title={`${light.name} (Height: ${light.z.toFixed(2)} - Scroll to change height)`}
						>
							{/* Outer glow ring */}
							<div
								className="relative flex items-center justify-center rounded-full p-1.5 backdrop-blur-md shadow-lg transition-all"
								style={{
									backgroundColor: `${light.color}33`,
									border: `2px solid ${light.color}`,
									boxShadow: isSelected
										? `0 0 16px 4px ${light.color}99, 0 0 0 2px #FFFFFF`
										: `0 0 10px 2px ${light.color}66`,
								}}
							>
								<div
									className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
									style={{
										backgroundColor: light.color,
										color: "#000000",
									}}
								>
									<span className="text-[10px] leading-none select-none">
										{roleIcons[light.role] || "💡"}
									</span>
								</div>
							</div>

							{/* Label tooltip */}
							<div className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-background/90 px-1.5 py-0.5 text-[9px] font-semibold text-foreground backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md border border-foreground/10">
								{light.name}
							</div>
						</div>
					);
				})}
		</div>
	);
}

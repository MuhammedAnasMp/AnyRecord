import { useState } from "react";
import {
	type StudioLight,
	type StudioLightingPresetId,
	type StudioLightingSettings,
	DEFAULT_STUDIO_LIGHTING_SETTINGS,
	STUDIO_LIGHT_COLOR_SWATCHES,
} from "./studioLightingTypes";
import {
	STUDIO_LIGHTING_PRESETS,
	applyStudioLightingPreset,
} from "./studioLightingPresets";
import { Switch } from "@/components/ui/switch";
import { SliderControl } from "../SliderControl";
import { ColorControl } from "@/components/ui/color-picker";
import { Button } from "@/components/ui/button";
import { Plus, Trash as Trash2, MagicWand, CaretDown, CaretUpIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface StudioLightingControlsProps {
	settings?: StudioLightingSettings;
	onChange: (settings: StudioLightingSettings) => void;
	selectedLightId?: string | null;
	onSelectLight?: (id: string | null) => void;
	advanced?: boolean;
}

export function StudioLightingControls({
	settings,
	onChange,
	selectedLightId,
	onSelectLight,
	advanced: _advanced = false,
}: StudioLightingControlsProps) {
	const [expandedLightId, setExpandedLightId] = useState<string | null>(null);
	const [showAdvancedTuning, setShowAdvancedTuning] = useState(false);

	if (!settings) return null;

	const handleMasterToggle = (enabled: boolean) => {
		onChange({
			...settings,
			enabled,
		});
	};

	const handleReset = () => {
		onChange({
			...DEFAULT_STUDIO_LIGHTING_SETTINGS,
			enabled: settings.enabled,
		});
		setExpandedLightId(null);
		onSelectLight?.(null);
	};

	const handlePresetSelect = (presetId: StudioLightingPresetId) => {
		const updated = applyStudioLightingPreset(settings, presetId);
		onChange(updated);
	};

	const handleLightChange = (lightId: string, updates: Partial<StudioLight>) => {
		const updatedLights = settings.lights.map((l) =>
			l.id === lightId ? { ...l, ...updates } : l,
		);
		onChange({
			...settings,
			presetId: "custom",
			lights: updatedLights,
		});
	};

	const handleAddLight = () => {
		const newIndex = settings.lights.length + 1;
		const newLight: StudioLight = {
			id: `light-custom-${Date.now()}`,
			name: `Accent Light ${newIndex}`,
			role: "accent",
			enabled: true,
			x: 0.5,
			y: 0.3,
			z: 0.6,
			intensity: 1.0,
			color: "#06B6D4",
			radius: 1.3,
			castShadow: false,
			specular: 0.4,
		};
		onChange({
			...settings,
			presetId: "custom",
			lights: [...settings.lights, newLight],
		});
		setExpandedLightId(newLight.id);
	};

	const handleRemoveLight = (lightId: string) => {
		if (settings.lights.length <= 1) return;
		onChange({
			...settings,
			presetId: "custom",
			lights: settings.lights.filter((l) => l.id !== lightId),
		});
		if (expandedLightId === lightId) setExpandedLightId(null);
	};

	return (
		<div className="flex flex-col gap-4">
			{/* Master Switch */}
			<div className="flex items-center justify-between py-1">
				<div className="flex items-center gap-2">
					<MagicWand className="h-4 w-4 text-accent" />
					<div className="flex flex-col">
						<div className="flex items-center gap-1.5">
							<span className="text-sm font-medium text-foreground">
								Virtual Light
							</span>

						</div>

					</div>
				</div>
				<Switch
					aria-label="Virtual Light"
					checked={settings.enabled}
					onCheckedChange={handleMasterToggle}
				/>
			</div>

			{settings.enabled && (
				<>
					{/* Presets */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-xs font-medium text-muted-foreground">
								Lighting Presets
							</span>
							<Button
								variant="ghost"
								size="sm"
								className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
								type="button"
								onClick={handleReset}
							>
								Reset
							</Button>
						</div>
						<div className="grid grid-cols-2 gap-1.5">
							{STUDIO_LIGHTING_PRESETS.map((preset) => {
								const isSelected = settings.presetId === preset.id;
								return (
									<button
										key={preset.id}
										type="button"
										onClick={() => handlePresetSelect(preset.id)}
										className={cn(
											"flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-all",
											isSelected
												? "border-accent bg-accent/10 shadow-sm"
												: "border-foreground/10 bg-background/50 hover:border-foreground/20 hover:bg-background/80",
										)}
									>
										<div className="flex w-full items-center justify-between">
											<span className="text-xs font-semibold text-foreground">
												{preset.label}
											</span>
											<div className="flex items-center gap-1">
												{preset.previewGradients.map((c, i) => (
													<span
														key={i}
														className="h-2.5 w-2.5 rounded-full border border-black/20 shadow-xs"
														style={{ backgroundColor: c }}
													/>
												))}
											</div>
										</div>
										<p className="line-clamp-1 text-[10px] text-muted-foreground">
											{preset.description}
										</p>
									</button>
								);
							})}
						</div>
					</div>

					{/* Lights List */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-xs font-medium text-muted-foreground">
								Active Lights ({settings.lights.filter((l) => l.enabled).length}/{settings.lights.length})
							</span>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={handleAddLight}
								className="h-7 gap-1 px-2 text-xs text-accent hover:text-accent"
							>
								<Plus className="h-3 w-3" />
								Add Light
							</Button>
						</div>

						<div className="space-y-2">
							{settings.lights.map((light) => {
								const isExpanded = expandedLightId === light.id || selectedLightId === light.id;
								const roleBadges: Record<string, { label: string; color: string }> = {
									key: { label: "KEY", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
									fill: { label: "FILL", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
									rim: { label: "RIM", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
									accent: { label: "GEL", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
									custom: { label: "LIGHT", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
								};
								const badge = roleBadges[light.role] || roleBadges.custom;

								return (
									<div
										key={light.id}
										className={cn(
											"rounded-lg border bg-surface-secondary/40 transition-all",
											isExpanded
												? "border-accent/50 bg-surface-secondary shadow-sm"
												: "border-foreground/10 hover:border-foreground/20",
										)}
									>
										{/* Header row */}
										<div className="flex items-center justify-between p-2.5">
											<div className="flex items-center gap-2">
												<Switch
													aria-label={`Toggle ${light.name}`}
													checked={light.enabled}
													onCheckedChange={(enabled) =>
														handleLightChange(light.id, { enabled })
													}
												/>
												<button
													type="button"
													onClick={() => {
														setExpandedLightId(isExpanded ? null : light.id);
														onSelectLight?.(isExpanded ? null : light.id);
													}}
													className="flex items-center gap-2 text-left"
												>
													<span
														className="h-4 w-4 rounded-full border border-black/20 shadow-xs shrink-0"
														style={{ backgroundColor: light.color }}
													/>
													<span className="text-xs font-semibold text-foreground">
														{light.name}
													</span>
													<span
														className={cn(
															"text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0",
															badge.color,
														)}
													>
														{badge.label}
													</span>

												</button>
											</div>

											<div className="flex items-center gap-1">
												{settings.lights.length > 1 && (
													<Button
														type="button"
														variant="ghost"
														size="icon"
														onClick={() => handleRemoveLight(light.id)}
														className="h-6 w-6 text-muted-foreground hover:text-destructive"
													>
														<Trash2 className="h-3 w-3" />
													</Button>
												)}
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() => {
														setExpandedLightId(isExpanded ? null : light.id);
														onSelectLight?.(isExpanded ? null : light.id);
													}}
													className="h-6 w-6 text-muted-foreground"
												>
													{isExpanded ? (
														<CaretUpIcon className="h-3.5 w-3.5" />
													) : (
														<CaretDown className="h-3.5 w-3.5" />
													)}
												</Button>
											</div>
										</div>

										{/* Expanded light controls */}
										{isExpanded && (
											<div className="space-y-3 border-t border-foreground/10 p-3 pt-2.5">
												{/* Quick color temperatures */}
												<div className="space-y-1.5">
													<div className="text-[11px] font-medium text-muted-foreground">
														Color & Temperature
													</div>
													<div className="grid grid-cols-6 gap-1.5">
														{STUDIO_LIGHT_COLOR_SWATCHES.map((swatch) => (
															<button
																key={swatch.hex}
																type="button"
																title={swatch.name}
																onClick={() =>
																	handleLightChange(light.id, { color: swatch.hex })
																}
																className={cn(
																	"h-6 w-full rounded border shadow-xs transition-transform hover:scale-110",
																	light.color.toUpperCase() === swatch.hex.toUpperCase()
																		? "border-accent ring-2 ring-accent/40"
																		: "border-black/20",
																)}
																style={{ backgroundColor: swatch.hex }}
															/>
														))}
													</div>
													<ColorControl
														label="Custom Color"
														value={light.color}
														onChange={(color) =>
															handleLightChange(light.id, { color })
														}
													/>
												</div>

												{/* Sliders */}
												<SliderControl
													label="Intensity"
													value={light.intensity}
													min={0}
													max={2.5}
													step={0.05}
													onChange={(v) =>
														handleLightChange(light.id, { intensity: v })
													}
													formatValue={(v) => `${Math.round(v * 100)}%`}
												/>

												<SliderControl
													label="Position X"
													value={light.x * 100}
													min={0}
													max={100}
													step={1}
													onChange={(v) =>
														handleLightChange(light.id, { x: v / 100 })
													}
													formatValue={(v) => `${Math.round(v)}%`}
												/>

												<SliderControl
													label="Position Y"
													value={light.y * 100}
													min={0}
													max={100}
													step={1}
													onChange={(v) =>
														handleLightChange(light.id, { y: v / 100 })
													}
													formatValue={(v) => `${Math.round(v)}%`}
												/>

												<SliderControl
													label="Height / Distance (Z)"
													value={light.z}
													min={0.1}
													max={2.0}
													step={0.05}
													onChange={(v) =>
														handleLightChange(light.id, { z: v })
													}
													formatValue={(v) => `${v.toFixed(2)}`}
												/>

												<SliderControl
													label="Reach / Falloff Radius"
													value={light.radius}
													min={0.2}
													max={3.0}
													step={0.05}
													onChange={(v) =>
														handleLightChange(light.id, { radius: v })
													}
													formatValue={(v) => `${v.toFixed(2)}`}
												/>

												<div className="flex items-center justify-between py-1">
													<span className="text-xs text-muted-foreground">
														Cast Screen-Space Soft Shadows
													</span>
													<Switch
														aria-label="Cast Shadows"
														checked={light.castShadow}
														onCheckedChange={(castShadow) =>
															handleLightChange(light.id, { castShadow })
														}
													/>
												</div>

												<SliderControl
													label="Specular Catchlight"
													value={light.specular}
													min={0}
													max={1}
													step={0.05}
													onChange={(v) =>
														handleLightChange(light.id, { specular: v })
													}
													formatValue={(v) => `${Math.round(v * 100)}%`}
												/>
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>

					{/* Studio Global Tuning */}
					<div className="rounded-lg border border-foreground/10 bg-surface-secondary/30 p-2.5">
						<button
							type="button"
							onClick={() => setShowAdvancedTuning(!showAdvancedTuning)}
							className="flex w-full items-center justify-between text-xs font-semibold text-foreground"
						>
							<span>Ambient Controls</span>
							{showAdvancedTuning ? (
								<CaretUpIcon className="h-3.5 w-3.5" />
							) : (
								<CaretDown className="h-3.5 w-3.5" />
							)}
						</button>

						{showAdvancedTuning && (
							<div className="mt-3 space-y-3 border-t border-foreground/10 pt-2.5">
								<SliderControl
									label="Ambient Fill Intensity"
									value={settings.ambientIntensity}
									min={0}
									max={1}
									step={0.02}
									onChange={(v) =>
										onChange({ ...settings, ambientIntensity: v })
									}
									formatValue={(v) => `${Math.round(v * 100)}%`}
								/>

								<SliderControl
									label="Monocular Depth Response"
									value={settings.depthResponse}
									min={0}
									max={2.5}
									step={0.05}
									onChange={(v) =>
										onChange({ ...settings, depthResponse: v })
									}
									formatValue={(v) => `${v.toFixed(2)}×`}
								/>

								<SliderControl
									label="Normal Smoothing"
									value={settings.normalSmoothness}
									min={0}
									max={2.0}
									step={0.05}
									onChange={(v) =>
										onChange({ ...settings, normalSmoothness: v })
									}
									formatValue={(v) => `${v.toFixed(2)}`}
								/>

								<SliderControl
									label="Shadow Softness"
									value={settings.shadowSoftness}
									min={0}
									max={1.0}
									step={0.05}
									onChange={(v) =>
										onChange({ ...settings, shadowSoftness: v })
									}
									formatValue={(v) => `${Math.round(v * 100)}%`}
								/>

								<SliderControl
									label="Film Exposure"
									value={settings.exposure}
									min={0.5}
									max={2.0}
									step={0.02}
									onChange={(v) =>
										onChange({ ...settings, exposure: v })
									}
									formatValue={(v) => `${v.toFixed(2)}×`}
								/>

								<SliderControl
									label="Film Contrast"
									value={settings.contrast}
									min={0.8}
									max={1.5}
									step={0.02}
									onChange={(v) =>
										onChange({ ...settings, contrast: v })
									}
									formatValue={(v) => `${v.toFixed(2)}×`}
								/>

								<SliderControl
									label="Diffuse Wrap (Skin Softness)"
									value={settings.diffuseWrap ?? 0.20}
									min={0.0}
									max={0.5}
									step={0.02}
									onChange={(v) =>
										onChange({ ...settings, diffuseWrap: v })
									}
									formatValue={(v) => `${Math.round(v * 100)}%`}
								/>

								<SliderControl
									label="Edge Halo Suppression"
									value={settings.haloSuppression ?? 0.75}
									min={0.0}
									max={1.0}
									step={0.05}
									onChange={(v) =>
										onChange({ ...settings, haloSuppression: v })
									}
									formatValue={(v) => `${Math.round(v * 100)}%`}
								/>

								<SliderControl
									label="Raymarch Shadow Reach"
									value={settings.shadowReach ?? 0.25}
									min={0.1}
									max={0.5}
									step={0.02}
									onChange={(v) =>
										onChange({ ...settings, shadowReach: v })
									}
									formatValue={(v) => `${v.toFixed(2)}`}
								/>

								<SliderControl
									label="Raymarch Shadow Steps"
									value={settings.shadowSteps ?? 10}
									min={4}
									max={16}
									step={1}
									onChange={(v) =>
										onChange({ ...settings, shadowSteps: Math.round(v) })
									}
									formatValue={(v) => `${Math.round(v)} steps`}
								/>
							</div>
						)}
					</div>
				</>
			)}
		</div>
	);
}

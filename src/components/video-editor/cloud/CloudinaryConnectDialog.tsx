import { CheckCircle, CloudArrowUp, Info, Sparkle, Trash } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import {
	type CloudinaryConfig,
	loadCloudinaryConfig,
	saveCloudinaryConfig,
} from "@/lib/cloudinary/cloudinaryConfig";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConnected?: (config: CloudinaryConfig) => void;
	onDisconnected?: () => void;
};

export function CloudinaryConnectDialog({
	open,
	onOpenChange,
	onConnected,
	onDisconnected,
}: Props) {
	const [cloudName, setCloudName] = useState("");
	const [uploadPreset, setUploadPreset] = useState("");
	const [folder, setFolder] = useState("AnyRecord");
	const [currentConfig, setCurrentConfig] = useState<CloudinaryConfig | null>(null);
	const [showHelp, setShowHelp] = useState(false);

	useEffect(() => {
		if (open) {
			const existing = loadCloudinaryConfig();
			setCurrentConfig(existing);
			if (existing) {
				setCloudName(existing.cloudName);
				setUploadPreset(existing.uploadPreset);
				setFolder(existing.folder || "AnyRecord");
			} else {
				setCloudName("");
				setUploadPreset("");
				setFolder("AnyRecord");
			}
		}
	}, [open]);

	const handleSave = () => {
		const trimmedCloudName = cloudName.trim();
		const trimmedPreset = uploadPreset.trim();
		const trimmedFolder = folder.trim() || "AnyRecord";

		if (!trimmedCloudName) {
			toast.error("Please enter your Cloudinary Cloud Name");
			return;
		}

		if (!trimmedPreset) {
			toast.error("Please enter your Cloudinary Upload Preset (Unsigned)");
			return;
		}

		const newConfig: CloudinaryConfig = {
			cloudName: trimmedCloudName,
			uploadPreset: trimmedPreset,
			folder: trimmedFolder,
			connectedAt: new Date().toISOString(),
		};

		saveCloudinaryConfig(newConfig);
		setCurrentConfig(newConfig);
		toast.success(`Connected to Cloudinary account: ${trimmedCloudName}`);
		onConnected?.(newConfig);
		onOpenChange(false);
	};

	const handleDisconnect = () => {
		saveCloudinaryConfig(null);
		setCurrentConfig(null);
		setCloudName("");
		setUploadPreset("");
		toast.info("Cloudinary account disconnected");
		onDisconnected?.();
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md p-6">
				<DialogHeader className="space-y-1">
					<div className="flex items-center gap-2">
						<div className="flex size-9 items-center justify-center rounded-lg bg-sky-500/15 text-sky-500">
							<CloudArrowUp size={22} weight="duotone" />
						</div>
						<div>
							<DialogTitle className="text-base font-semibold">
								Connect Cloudinary Storage
							</DialogTitle>
							<DialogDescription className="text-xs text-muted-foreground">
								Upload and stream recordings directly from your Cloudinary media
								library
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-4 py-2 text-sm">
					{currentConfig ? (
						<div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
							<div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
								<CheckCircle size={18} weight="fill" />
								<div className="text-xs">
									<p className="font-semibold">Connected</p>
									<p className="text-muted-foreground">
										Cloud: {currentConfig.cloudName}
									</p>
								</div>
							</div>
							<Button
								size="sm"
								variant="ghost"
								onClick={handleDisconnect}
								className="h-8 gap-1 text-xs text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
							>
								<Trash size={14} />
								Disconnect
							</Button>
						</div>
					) : null}

					<div className="space-y-3">
						<div>
							<label
								className="text-xs font-medium text-foreground"
								htmlFor="cloudinary-cloud-name"
							>
								Cloud Name <span className="text-rose-500">*</span>
							</label>
							<input
								id="cloudinary-cloud-name"
								type="text"
								value={cloudName}
								onChange={(e) => setCloudName(e.target.value)}
								placeholder="e.g. my-cloud-name"
								className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground shadow-xs outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
							/>
						</div>

						<div>
							<label
								className="text-xs font-medium text-foreground"
								htmlFor="cloudinary-preset"
							>
								Upload Preset (Unsigned) <span className="text-rose-500">*</span>
							</label>
							<input
								id="cloudinary-preset"
								type="text"
								value={uploadPreset}
								onChange={(e) => setUploadPreset(e.target.value)}
								placeholder="e.g. anyrecord_unsigned"
								className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground shadow-xs outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
							/>
						</div>

						<div>
							<label
								className="text-xs font-medium text-foreground"
								htmlFor="cloudinary-folder"
							>
								Storage Folder (Optional)
							</label>
							<input
								id="cloudinary-folder"
								type="text"
								value={folder}
								onChange={(e) => setFolder(e.target.value)}
								placeholder="AnyRecord"
								className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground shadow-xs outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
							/>
						</div>
					</div>

					{/* Help tip accordion */}
					<div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs">
						<button
							type="button"
							onClick={() => setShowHelp(!showHelp)}
							className="flex w-full items-center justify-between font-medium text-muted-foreground hover:text-foreground"
						>
							<span className="flex items-center gap-1.5">
								<Info size={14} />
								Where do I get an Unsigned Upload Preset?
							</span>
							<span className="text-[10px]">{showHelp ? "Hide" : "Show"}</span>
						</button>
						{showHelp ? (
							<ol className="mt-2.5 list-decimal space-y-1.5 pl-4 text-muted-foreground">
								<li>
									Log into your Cloudinary Console and find your{" "}
									<strong>Cloud Name</strong> at the top.
								</li>
								<li>
									Click <strong>Settings</strong> (⚙️) in the bottom-left, then
									select <strong>Upload</strong>.
								</li>
								<li>
									Scroll down to <strong>Upload presets</strong> and click{" "}
									<strong>Add upload preset</strong>.
								</li>
								<li>
									Change <strong>Signing Mode</strong> from <em>Signed</em> to{" "}
									<strong>Unsigned</strong>.
								</li>
								<li>Copy the preset name, paste it above, and click Save!</li>
							</ol>
						) : null}
					</div>
				</div>

				<DialogFooter className="mt-2 flex items-center justify-end gap-2">
					<Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						size="sm"
						onClick={handleSave}
						className="gap-1.5 bg-sky-500 text-white hover:bg-sky-600"
					>
						<Sparkle size={14} weight="fill" />
						{currentConfig ? "Update Connection" : "Connect Cloudinary"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

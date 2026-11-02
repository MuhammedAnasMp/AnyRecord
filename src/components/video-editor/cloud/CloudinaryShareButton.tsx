import {
	ArrowSquareOut,
	Check,
	CheckCircle,
	CloudArrowUp,
	Copy,
	Gear,
	XCircle,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { type CloudinaryConfig, loadCloudinaryConfig } from "@/lib/cloudinary/cloudinaryConfig";
import { CloudinaryConnectDialog } from "./CloudinaryConnectDialog";

type Props = {
	projectPath?: string | null;
	projectTitle: string;
	prepareFile?: () => Promise<string | undefined>;
	preparationProgress?: number;
	onCancelPrepare?: () => void;
	onBusyChange?: (busy: boolean) => void;
};

export function CloudinaryShareButton({
	projectTitle,
	prepareFile,
	preparationProgress = 0,
	onCancelPrepare,
	onBusyChange,
}: Props) {
	const [config, setConfig] = useState<CloudinaryConfig | null>(null);
	const [connectDialogOpen, setConnectDialogOpen] = useState(false);

	const [phase, setPhase] = useState<"idle" | "preparing" | "uploading" | "done">("idle");
	const [progress, setProgress] = useState(0);
	const [uploadUrl, setUploadUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const activeUploadId = useRef<string | undefined>(undefined);
	const preparedFileRef = useRef<string | undefined>(undefined);

	useEffect(() => {
		setConfig(loadCloudinaryConfig());
	}, []);

	const isBusy = phase === "preparing" || phase === "uploading";
	useEffect(() => {
		onBusyChange?.(isBusy);
	}, [isBusy, onBusyChange]);

	// Track preparation progress (0% -> 60%)
	useEffect(() => {
		if (phase === "preparing" && Number.isFinite(preparationProgress)) {
			setProgress(Math.max(5, Math.min(60, Math.round(preparationProgress * 0.6))));
		}
	}, [phase, preparationProgress]);

	// Listen to Electron Cloudinary upload progress (60% -> 100%)
	useEffect(() => {
		if (typeof window === "undefined" || !window.electronAPI?.onCloudinaryProgress) return;
		return window.electronAPI.onCloudinaryProgress((next) => {
			if (next.uploadId !== activeUploadId.current) return;
			if (next.totalBytes <= 0 || !Number.isFinite(next.uploadedBytes)) return;
			const ratio = Math.min(1, next.uploadedBytes / next.totalBytes);
			setProgress(Math.round(60 + ratio * 40));
		});
	}, []);

	const discardPreparedFile = useCallback(() => {
		const preparedPath = preparedFileRef.current;
		preparedFileRef.current = undefined;
		if (preparedPath && window.electronAPI?.discardExportedTemp) {
			void window.electronAPI.discardExportedTemp(preparedPath);
		}
	}, []);

	useEffect(() => discardPreparedFile, [discardPreparedFile]);

	const handleStartUpload = async () => {
		if (!config) {
			setConnectDialogOpen(true);
			return;
		}

		setError(null);
		setUploadUrl(null);
		setProgress(0);
		setPhase("preparing");

		try {
			// 1. Prepare/Export video file
			let resolvedFilePath: string | undefined;
			if (prepareFile) {
				resolvedFilePath = await prepareFile();
			}

			if (!resolvedFilePath) {
				throw new Error("Could not prepare video for upload.");
			}
			preparedFileRef.current = resolvedFilePath;

			// 2. Start Cloudinary upload
			const nextUploadId = crypto.randomUUID();
			activeUploadId.current = nextUploadId;
			setPhase("uploading");
			setProgress(60);

			if (!window.electronAPI?.cloudinaryUpload) {
				throw new Error("Cloudinary upload is not supported in this environment.");
			}

			const result = await window.electronAPI.cloudinaryUpload({
				filePath: resolvedFilePath,
				cloudName: config.cloudName,
				uploadPreset: config.uploadPreset,
				folder: config.folder || "AnyRecord",
				title: projectTitle,
				uploadId: nextUploadId,
			});

			if (!result.success || !result.url) {
				if (result.canceled) {
					toast.info("Upload canceled");
					setPhase("idle");
					return;
				}
				throw new Error(result.error || "Upload failed");
			}

			setProgress(100);
			setUploadUrl(result.url);
			setPhase("done");
			toast.success("Uploaded to Cloudinary successfully!");
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
			setPhase("idle");
			toast.error(err instanceof Error ? err.message : "Upload failed");
		} finally {
			activeUploadId.current = undefined;
		}
	};

	const handleCancel = async () => {
		if (phase === "preparing") {
			onCancelPrepare?.();
			setPhase("idle");
			return;
		}
		if (
			phase === "uploading" &&
			activeUploadId.current &&
			window.electronAPI?.cloudinaryCancel
		) {
			await window.electronAPI.cloudinaryCancel(activeUploadId.current);
		}
		setPhase("idle");
		discardPreparedFile();
	};

	const handleCopy = async () => {
		if (!uploadUrl) return;
		try {
			await navigator.clipboard.writeText(uploadUrl);
			setCopied(true);
			toast.success("Cloudinary video link copied!");
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Could not copy link to clipboard");
		}
	};

	const handleOpenInBrowser = () => {
		if (!uploadUrl) return;
		if (window.electronAPI?.openExternalUrl) {
			void window.electronAPI.openExternalUrl(uploadUrl);
		} else {
			window.open(uploadUrl, "_blank");
		}
	};

	return (
		<div className="space-y-4 px-5 pb-5">
			<CloudinaryConnectDialog
				open={connectDialogOpen}
				onOpenChange={setConnectDialogOpen}
				onConnected={(newConfig) => {
					setConfig(newConfig);
					setError(null);
				}}
				onDisconnected={() => {
					setConfig(null);
					setPhase("idle");
					setUploadUrl(null);
				}}
			/>

			{!config ? (
				/* Not connected state */
				<div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 text-center">
					<div className="mx-auto flex size-12 items-center justify-center rounded-full bg-sky-500/10 text-sky-500">
						<CloudArrowUp size={28} weight="duotone" />
					</div>
					<h3 className="mt-2 text-sm font-semibold text-foreground">
						Connect Cloudinary
					</h3>
					<p className="mt-1 text-xs text-muted-foreground">
						Store, stream, and share your recordings with your Cloudinary media cloud.
					</p>
					<Button
						onClick={() => setConnectDialogOpen(true)}
						className="mt-3 w-full gap-2 bg-sky-500 text-white hover:bg-sky-600"
					>
						<CloudArrowUp size={16} weight="bold" />
						Connect Cloudinary
					</Button>
				</div>
			) : (
				/* Connected state */
				<div className="space-y-3">
					{/* Status pill */}
					<div className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-xs">
						<div className="flex items-center gap-2">
							<span className="flex size-2 rounded-full bg-emerald-500" />
							<span className="text-muted-foreground">Connected:</span>
							<strong className="font-semibold text-foreground">
								{config.cloudName}
							</strong>
						</div>
						<button
							type="button"
							onClick={() => setConnectDialogOpen(true)}
							disabled={isBusy}
							className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-50"
						>
							<Gear size={13} />
							Settings
						</button>
					</div>

					{error ? (
						<div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-500">
							<XCircle size={16} className="mt-0.5 shrink-0" weight="fill" />
							<span>{error}</span>
						</div>
					) : null}

					{phase === "done" && uploadUrl ? (
						/* Completed state */
						<div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5">
							<div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
								<CheckCircle size={20} weight="fill" />
								<span className="text-xs font-semibold">
									Video uploaded to Cloudinary!
								</span>
							</div>

							<div className="flex items-center gap-2 rounded-md border border-border bg-background p-1.5 text-xs">
								<input
									type="text"
									readOnly
									value={uploadUrl}
									className="w-full bg-transparent px-1 text-[11px] text-muted-foreground outline-none"
								/>
								<Button
									size="sm"
									variant="secondary"
									onClick={handleCopy}
									className="h-7 shrink-0 gap-1 px-2 text-xs"
								>
									{copied ? <Check size={14} /> : <Copy size={14} />}
									{copied ? "Copied" : "Copy"}
								</Button>
							</div>

							<div className="flex items-center gap-2">
								<Button
									size="sm"
									variant="outline"
									onClick={handleOpenInBrowser}
									className="w-full gap-1.5 text-xs"
								>
									<ArrowSquareOut size={14} />
									Open Video
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={() => {
										setPhase("idle");
										setUploadUrl(null);
									}}
									className="text-xs text-muted-foreground hover:text-foreground"
								>
									Reset
								</Button>
							</div>
						</div>
					) : isBusy ? (
						/* Uploading / Preparing state */
						<div className="space-y-2 rounded-xl border border-sky-500/20 bg-sky-500/5 p-3.5">
							<div className="flex items-center justify-between text-xs">
								<span className="font-medium text-foreground">
									{phase === "preparing"
										? "Preparing video…"
										: "Uploading to Cloudinary…"}
								</span>
								<span className="font-semibold text-sky-500">{progress}%</span>
							</div>
							<div className="h-1.5 w-full overflow-hidden rounded-full bg-sky-500/20">
								<div
									className="h-full bg-sky-500 transition-all duration-300"
									style={{ width: `${progress}%` }}
								/>
							</div>
							<div className="pt-1">
								<Button
									size="sm"
									variant="outline"
									onClick={handleCancel}
									className="w-full text-xs text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
								>
									Cancel
								</Button>
							</div>
						</div>
					) : (
						/* Idle ready to upload state */
						<div className="space-y-2">
							<Button
								onClick={handleStartUpload}
								className="w-full gap-2 bg-sky-500 text-white hover:bg-sky-600"
							>
								<CloudArrowUp size={16} weight="bold" />
								Upload to Cloudinary
							</Button>
							<p className="text-center text-[11px] text-muted-foreground">
								Video will be uploaded to folder:{" "}
								<strong>{config.folder || "AnyRecord"}</strong>
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

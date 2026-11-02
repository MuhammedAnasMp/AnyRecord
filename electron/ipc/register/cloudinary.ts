import fs from "node:fs/promises";
import path from "node:path";
import { ipcMain } from "electron";
import { isOwnedExportPath } from "../export/exportStream";
import { isAllowedLocalReadPath } from "../project/manager";

const activeUploads = new Map<string, AbortController>();
const CHUNK_SIZE = 20 * 1024 * 1024; // 20 MB chunks for Cloudinary large uploads

export function registerCloudinaryHandlers() {
	ipcMain.handle(
		"cloudinary-upload",
		async (
			event,
			input: {
				filePath?: unknown;
				cloudName?: unknown;
				uploadPreset?: unknown;
				folder?: unknown;
				title?: unknown;
				uploadId?: unknown;
			},
		) => {
			let uploadId: string | undefined;
			try {
				if (typeof input?.filePath !== "string" || input.filePath.trim().length === 0) {
					throw new Error("Export a video before uploading to Cloudinary.");
				}
				if (typeof input?.cloudName !== "string" || input.cloudName.trim().length === 0) {
					throw new Error("Cloudinary Cloud Name is required.");
				}
				if (
					typeof input?.uploadPreset !== "string" ||
					input.uploadPreset.trim().length === 0
				) {
					throw new Error("Cloudinary Upload Preset is required.");
				}

				const cloudName = input.cloudName.trim();
				const uploadPreset = input.uploadPreset.trim();
				const folder = typeof input.folder === "string" ? input.folder.trim() : "AnyRecord";
				const title =
					typeof input.title === "string" ? input.title.trim().slice(0, 200) : "";

				uploadId =
					typeof input.uploadId === "string" && /^[a-f0-9-]{36}$/i.test(input.uploadId)
						? input.uploadId
						: crypto.randomUUID();

				const controller = new AbortController();
				activeUploads.set(uploadId, controller);

				const requestedPath = path.resolve(input.filePath);
				const resolvedPath = await fs.realpath(requestedPath);
				const isAnyRecordExport =
					isOwnedExportPath(requestedPath) || isOwnedExportPath(resolvedPath);
				if (!isAnyRecordExport && !isAllowedLocalReadPath(resolvedPath)) {
					throw new Error("This file is outside AnyRecord's approved media locations.");
				}

				const stat = await fs.stat(resolvedPath);
				if (!stat.isFile()) throw new Error("The exported video could not be found.");
				const fileSize = stat.size;

				const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/video/upload`;
				const fileHandle = await fs.open(resolvedPath, "r");

				const sendProgress = (uploadedBytes: number) => {
					if (event.sender.isDestroyed()) return;
					event.sender.send("cloudinary-upload-progress", {
						uploadId,
						uploadedBytes,
						totalBytes: fileSize,
					});
				};

				let resultData: Record<string, unknown> | null = null;

				try {
					if (fileSize <= CHUNK_SIZE) {
						// Single direct upload
						sendProgress(0);
						const fileBuffer = await fileHandle.readFile();
						const formData = new FormData();
						const fileBlob = new Blob([fileBuffer], { type: "video/mp4" });
						formData.append("file", fileBlob, path.basename(resolvedPath));
						formData.append("upload_preset", uploadPreset);
						if (folder) formData.append("folder", folder);
						if (title) formData.append("context", `title=${title}`);

						const response = await fetch(endpoint, {
							method: "POST",
							body: formData,
							signal: controller.signal,
						});

						const json = (await response.json()) as Record<string, unknown>;
						if (!response.ok) {
							const errorMsg =
								json &&
								typeof json.error === "object" &&
								json.error &&
								"message" in json.error
									? String((json.error as { message: unknown }).message)
									: `Cloudinary upload failed (${response.status}).`;
							throw new Error(errorMsg);
						}

						resultData = json;
						sendProgress(fileSize);
					} else {
						// Chunked upload for larger files
						const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
						const uniqueUploadId = uploadId.replace(/-/g, "");

						for (let i = 0; i < totalChunks; i++) {
							if (controller.signal.aborted) {
								throw new Error("Upload canceled");
							}

							const start = i * CHUNK_SIZE;
							const end = Math.min(start + CHUNK_SIZE, fileSize);
							const chunkLength = end - start;
							const chunkBuffer = Buffer.alloc(chunkLength);

							await fileHandle.read(chunkBuffer, 0, chunkLength, start);

							const formData = new FormData();
							const chunkBlob = new Blob([chunkBuffer], {
								type: "application/octet-stream",
							});
							formData.append("file", chunkBlob, path.basename(resolvedPath));
							formData.append("upload_preset", uploadPreset);
							if (folder) formData.append("folder", folder);
							if (title) formData.append("context", `title=${title}`);

							const contentRange = `bytes ${start}-${end - 1}/${fileSize}`;

							const response = await fetch(endpoint, {
								method: "POST",
								headers: {
									"Content-Range": contentRange,
									"X-Unique-Upload-Id": uniqueUploadId,
								},
								body: formData,
								signal: controller.signal,
							});

							const json = (await response.json()) as Record<string, unknown>;
							if (!response.ok) {
								const errorMsg =
									json &&
									typeof json.error === "object" &&
									json.error &&
									"message" in json.error
										? String((json.error as { message: unknown }).message)
										: `Cloudinary chunked upload failed (${response.status}).`;
								throw new Error(errorMsg);
							}

							sendProgress(end);

							if (i === totalChunks - 1) {
								resultData = json;
							}
						}
					}
				} finally {
					await fileHandle.close();
				}

				if (!resultData) {
					throw new Error("No response received from Cloudinary.");
				}

				const secureUrl =
					typeof resultData.secure_url === "string" ? resultData.secure_url : "";
				const fallbackUrl = typeof resultData.url === "string" ? resultData.url : "";
				const finalUrl = secureUrl || fallbackUrl;

				if (!finalUrl) {
					throw new Error("Cloudinary succeeded but did not return a public URL.");
				}

				return {
					success: true,
					uploadId,
					url: finalUrl,
					publicId:
						typeof resultData.public_id === "string" ? resultData.public_id : undefined,
					format: typeof resultData.format === "string" ? resultData.format : undefined,
					bytes: typeof resultData.bytes === "number" ? resultData.bytes : fileSize,
				};
			} catch (error) {
				const isCanceled =
					(error instanceof Error && error.name === "AbortError") ||
					(error instanceof Error && error.message.toLowerCase().includes("cancel"));
				return {
					success: false,
					uploadId,
					canceled: isCanceled,
					error: error instanceof Error ? error.message : String(error),
				};
			} finally {
				if (uploadId) activeUploads.delete(uploadId);
			}
		},
	);

	ipcMain.handle("cloudinary-cancel", async (_event, uploadId: string) => {
		if (typeof uploadId === "string" && activeUploads.has(uploadId)) {
			activeUploads.get(uploadId)?.abort();
			activeUploads.delete(uploadId);
			return { success: true };
		}
		return { success: false };
	});
}

import fs from "node:fs/promises";
import { parseJsonWithByteOrderMark } from "../utils";

export type RecordingMode = "screen-camera" | "camera-only" | "screen-only";
export type CameraAspectRatio = "16:9" | "9:16" | "4:3" | "1:1";

export interface RecordingPreferencesPatch {
	microphoneEnabled?: boolean;
	microphoneDeviceId?: string;
	systemAudioEnabled?: boolean;
	webcamEnabled?: boolean;
	webcamDeviceId?: string;
	recordingMode?: RecordingMode;
	cameraAspectRatio?: CameraAspectRatio;
	cameraMirrored?: boolean;
}

export function createRecordingPreferencesStore(filePath: string) {
	let operationQueue: Promise<void> = Promise.resolve();

	const readFile = async (): Promise<Record<string, unknown>> => {
		try {
			const content = await fs.readFile(filePath, "utf-8");
			const parsed = parseJsonWithByteOrderMark<unknown>(content);
			return parsed && typeof parsed === "object" && !Array.isArray(parsed)
				? (parsed as Record<string, unknown>)
				: {};
		} catch {
			return {};
		}
	};

	return {
		async read(): Promise<Record<string, unknown>> {
			await operationQueue;
			return readFile();
		},
		async update(patch: RecordingPreferencesPatch): Promise<void> {
			const operation = operationQueue.then(async () => {
				const existing = await readFile();
				await fs.writeFile(
					filePath,
					JSON.stringify({ ...existing, ...patch }, null, 2),
					"utf-8",
				);
			});
			operationQueue = operation.catch(() => undefined);
			await operation;
		},
	};
}

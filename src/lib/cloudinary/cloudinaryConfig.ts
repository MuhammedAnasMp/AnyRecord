import { loadAppSetting, saveAppSetting } from "@/lib/appSettings";

export type CloudinaryConfig = {
	cloudName: string;
	uploadPreset: string;
	folder?: string;
	connectedAt?: string;
};

const CLOUDINARY_STORAGE_KEY = "anyrecord.cloudinary.config";

export function loadCloudinaryConfig(): CloudinaryConfig | null {
	// First attempt to load via Electron app settings
	const fromSettings = loadAppSetting<CloudinaryConfig>(CLOUDINARY_STORAGE_KEY);
	if (fromSettings && fromSettings.cloudName && fromSettings.uploadPreset) {
		return fromSettings;
	}

	// Fallback to localStorage (for web / dev preview)
	if (typeof window !== "undefined" && window.localStorage) {
		try {
			const raw = window.localStorage.getItem(CLOUDINARY_STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as CloudinaryConfig;
				if (parsed.cloudName && parsed.uploadPreset) {
					return parsed;
				}
			}
		} catch {
			// ignore json errors
		}
	}

	return null;
}

export function saveCloudinaryConfig(config: CloudinaryConfig | null): void {
	if (config) {
		const cleanConfig: CloudinaryConfig = {
			cloudName: config.cloudName.trim(),
			uploadPreset: config.uploadPreset.trim(),
			folder: config.folder?.trim() || "AnyRecord",
			connectedAt: config.connectedAt || new Date().toISOString(),
		};
		saveAppSetting(CLOUDINARY_STORAGE_KEY, cleanConfig);
		if (typeof window !== "undefined" && window.localStorage) {
			try {
				window.localStorage.setItem(CLOUDINARY_STORAGE_KEY, JSON.stringify(cleanConfig));
			} catch {
				// ignore storage errors
			}
		}
	} else {
		saveAppSetting(CLOUDINARY_STORAGE_KEY, null);
		if (typeof window !== "undefined" && window.localStorage) {
			try {
				window.localStorage.removeItem(CLOUDINARY_STORAGE_KEY);
			} catch {
				// ignore
			}
		}
	}
}

export function isCloudinaryConfigured(): boolean {
	const config = loadCloudinaryConfig();
	return Boolean(config?.cloudName && config?.uploadPreset);
}

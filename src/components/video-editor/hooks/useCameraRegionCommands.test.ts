import { describe, expect, it } from "vitest";
import {
	deleteCameraRegionList,
	splitCameraRegionList,
	updateCameraRegionSpanList,
} from "./useCameraRegionCommands";

describe("Camera region commands helpers", () => {
	it("splits camera footage at playhead into two distinct regions", () => {
		const initial = [{ id: "cam-1", startMs: 0, endMs: 10000 }];
		let nextId = 2;
		const { regions, newSelectedId } = splitCameraRegionList(initial, 4000, () => `cam-${nextId++}`);

		expect(regions).toHaveLength(2);
		expect(regions[0]).toEqual({ id: "cam-2", startMs: 0, endMs: 4000 });
		expect(regions[1]).toEqual({ id: "cam-3", startMs: 4000, endMs: 10000 });
		expect(newSelectedId).toBe("cam-2");
	});

	it("does not split if split point is outside or on boundaries", () => {
		const initial = [{ id: "cam-1", startMs: 0, endMs: 10000 }];
		const { regions, newSelectedId } = splitCameraRegionList(initial, 12000, () => "cam-2");

		expect(regions).toBe(initial);
		expect(newSelectedId).toBeNull();
	});

	it("updates camera region span when trimmed or resized", () => {
		const initial = [
			{ id: "cam-1", startMs: 0, endMs: 4000 },
			{ id: "cam-2", startMs: 4000, endMs: 10000 },
		];

		const updated = updateCameraRegionSpanList(initial, "cam-1", { start: 1000, end: 3500 });
		expect(updated[0]).toEqual({ id: "cam-1", startMs: 1000, endMs: 3500 });
		expect(updated[1]).toEqual({ id: "cam-2", startMs: 4000, endMs: 10000 });
	});

	it("deletes a selected camera region leaving other camera segments intact", () => {
		const initial = [
			{ id: "cam-1", startMs: 0, endMs: 4000 },
			{ id: "cam-2", startMs: 4000, endMs: 10000 },
		];

		const remaining = deleteCameraRegionList(initial, "cam-1");
		expect(remaining).toHaveLength(1);
		expect(remaining[0]).toEqual({ id: "cam-2", startMs: 4000, endMs: 10000 });
	});
});

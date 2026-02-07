import { renderHook } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { useImageUpload } from "@/hooks/use-image-upload";

describe("useImageUpload", () => {
	it("reports upload errors without rethrowing", async () => {
		const onError = vi.fn();
		const uploadHandler = vi.fn().mockRejectedValue(new Error("Upload failed"));
		const { result } = renderHook(() =>
			useImageUpload({ onError, uploadHandler })
		);
		const createObjectURLSpy = vi
			.spyOn(URL, "createObjectURL")
			.mockReturnValue("blob:preview");
		const revokeObjectURLSpy = vi
			.spyOn(URL, "revokeObjectURL")
			.mockImplementation(() => {
				// Mock implementation - no-op
			});

		const file = new File(["data"], "test.png", { type: "image/png" });
		const event = {
			target: { files: [file] },
		} as ChangeEvent<HTMLInputElement>;

		await expect(
			result.current.handleFileChange(event)
		).resolves.toBeUndefined();
		expect(onError).toHaveBeenCalled();

		createObjectURLSpy.mockRestore();
		revokeObjectURLSpy.mockRestore();
	});
});

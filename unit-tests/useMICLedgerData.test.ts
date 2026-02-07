import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMICLedgerData } from "@/lib/hooks/useMICLedgerData";
import { logger } from "@/lib/logger";

vi.mock("convex/react", () => ({
	useAction: () => async () => {
		throw new Error("boom");
	},
}));

vi.mock("@/lib/logger", () => ({
	logger: {
		error: vi.fn(),
	},
}));

describe("useMICLedgerData", () => {
	it("logs errors when refresh fails", async () => {
		const { result } = renderHook(() => useMICLedgerData());

		await waitFor(() => {
			expect(result.current.error).toBe("boom");
			expect(logger.error).toHaveBeenCalled();
		});
	});
});

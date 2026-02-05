import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useMICStore } from "@/lib/stores/useMICStore";

describe("useMediaQuery", () => {
	it("updates when media query changes", () => {
		const listeners: Array<(event: MediaQueryListEvent) => void> = [];
		const matchMediaMock = vi.fn().mockReturnValue({
			matches: false,
			addEventListener: (
				_: string,
				listener: (event: MediaQueryListEvent) => void
			) => {
				listeners.push(listener);
			},
			removeEventListener: (
				_: string,
				listener: (event: MediaQueryListEvent) => void
			) => {
				const index = listeners.indexOf(listener);
				if (index >= 0) listeners.splice(index, 1);
			},
			addListener: (listener: (event: MediaQueryListEvent) => void) => {
				listeners.push(listener);
			},
			removeListener: (listener: (event: MediaQueryListEvent) => void) => {
				const index = listeners.indexOf(listener);
				if (index >= 0) listeners.splice(index, 1);
			},
		});

		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: matchMediaMock,
		});

		const { result } = renderHook(() => useMediaQuery("(max-width: 640px)"));
		expect(result.current).toBe(false);

		act(() => {
			for (const listener of listeners) {
				listener({ matches: true } as MediaQueryListEvent);
			}
		});

		expect(result.current).toBe(true);
	});
});

describe("useMICStore", () => {
	beforeEach(() => {
		useMICStore.getState().resetDemo();
	});

	it("generates AUM ids with M- prefix", () => {
		useMICStore.getState().addAUM({
			address: "123 Test St",
			principal: 100000,
			micOwnership: 50,
			interestRate: 5,
			originationDate: new Date().toISOString(),
		});

		const lastAum = useMICStore.getState().aums.at(-1);
		expect(lastAum?.id.startsWith("M-")).toBe(true);
	});

	it("rejects sellAUM when percentage exceeds ownership", () => {
		const target = useMICStore.getState().aums[0];
		const originalOwnership = target?.micOwnership ?? 0;
		const originalCash = useMICStore.getState().metrics.cashBalance;

		if (target) {
			useMICStore
				.getState()
				.sellAUM(target.id, originalOwnership + 1, "buyer", 500);
		}

		const updated = useMICStore
			.getState()
			.aums.find((aum) => aum.id === target?.id);
		expect(updated?.micOwnership).toBe(originalOwnership);
		expect(useMICStore.getState().metrics.cashBalance).toBe(originalCash);
	});
});

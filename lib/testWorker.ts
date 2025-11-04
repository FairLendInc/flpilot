// /Users/connor/Dev/convex-workos-nextjs-template/convex-next-authkit/lib/testWorker.ts
// Small collection of helper utilities to verify a test harness is wired up.

export function add(a: number, b: number): number {
	return a + b;
}

/**
 * Resolves with the provided value after a short delay.
 * Useful for testing async behavior in your harness.
 */
export function delayedEcho<T>(value: T, ms = 20): Promise<T> {
	return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * Simple in-memory counter factory for deterministic stateful tests.
 * Usage:
 *   const c = makeCounter(5);
 *   c.increment(); // 6
 *   c.get(); // 6
 */
export function makeCounter(initial = 0) {
	let value = initial;
	return {
		increment: (by = 1) => {
			value += by;
			return value;
		},
		decrement: (by = 1) => {
			value -= by;
			return value;
		},
		get: () => value,
		reset: (v = initial) => {
			value = v;
			return value;
		},
	};
}

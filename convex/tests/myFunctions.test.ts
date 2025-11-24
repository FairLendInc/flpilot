// @vitest-environment node
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

// @ts-ignore
const modules = import.meta.glob("../**/*.{ts,js,tsx,jsx}", { eager: false });
const createTest = () => convexTest(schema, modules);

describe("myFunctions", () => {
	describe("addNumber mutation", () => {
		test("should add a single number to the database", async () => {
			const t = createTest();

			await t.mutation(api.myFunctions.addNumber, { value: 42 });

			const result = await t.query(api.myFunctions.listNumbers, { count: 10 });
			expect(result.numbers).toHaveLength(1);
			expect(result.numbers[0]).toBe(42);
		});

		test("should add multiple numbers in sequence", async () => {
			const t = createTest();

			await t.mutation(api.myFunctions.addNumber, { value: 1 });
			await t.mutation(api.myFunctions.addNumber, { value: 2 });
			await t.mutation(api.myFunctions.addNumber, { value: 3 });

			const result = await t.query(api.myFunctions.listNumbers, { count: 10 });
			expect(result.numbers).toEqual([1, 2, 3]);
		});

		test("should handle negative numbers", async () => {
			const t = createTest();

			await t.mutation(api.myFunctions.addNumber, { value: -100 });

			const result = await t.query(api.myFunctions.listNumbers, { count: 10 });
			expect(result.numbers).toEqual([-100]);
		});

		test("should handle zero", async () => {
			const t = createTest();

			await t.mutation(api.myFunctions.addNumber, { value: 0 });

			const result = await t.query(api.myFunctions.listNumbers, { count: 10 });
			expect(result.numbers).toEqual([0]);
		});

		test("should handle decimal numbers", async () => {
			const t = createTest();

			await t.mutation(api.myFunctions.addNumber, { value: Math.PI });

			const result = await t.query(api.myFunctions.listNumbers, { count: 10 });
			expect(result.numbers[0]).toBeCloseTo(Math.PI);
		});

		test("should handle very large numbers", async () => {
			const t = createTest();

			await t.mutation(api.myFunctions.addNumber, {
				value: Number.MAX_SAFE_INTEGER,
			});

			const result = await t.query(api.myFunctions.listNumbers, { count: 10 });
			expect(result.numbers).toEqual([Number.MAX_SAFE_INTEGER]);
		});
	});

	describe("listNumbers query", () => {
		test("should return empty array when no numbers exist", async () => {
			const t = createTest();

			const result = await t.query(api.myFunctions.listNumbers, { count: 10 });

			expect(result.numbers).toEqual([]);
			expect(result.viewer).toBeNull();
		});

		test("should return numbers in insertion order", async () => {
			const t = createTest();

			await t.mutation(api.myFunctions.addNumber, { value: 10 });
			await t.mutation(api.myFunctions.addNumber, { value: 20 });
			await t.mutation(api.myFunctions.addNumber, { value: 30 });

			const result = await t.query(api.myFunctions.listNumbers, { count: 10 });
			expect(result.numbers).toEqual([10, 20, 30]);
		});

		test("should limit results to specified count", async () => {
			const t = createTest();

			// Add 10 numbers
			for (let i = 1; i <= 10; i += 1) {
				await t.mutation(api.myFunctions.addNumber, { value: i });
			}

			const result = await t.query(api.myFunctions.listNumbers, { count: 5 });
			expect(result.numbers).toHaveLength(5);
			// Should return the 5 most recent (6-10)
			expect(result.numbers).toEqual([6, 7, 8, 9, 10]);
		});

		test("should handle count of 0", async () => {
			const t = createTest();

			await t.mutation(api.myFunctions.addNumber, { value: 42 });

			const result = await t.query(api.myFunctions.listNumbers, { count: 0 });
			expect(result.numbers).toEqual([]);
		});

		test("should handle count larger than available numbers", async () => {
			const t = createTest();

			await t.mutation(api.myFunctions.addNumber, { value: 1 });
			await t.mutation(api.myFunctions.addNumber, { value: 2 });

			const result = await t.query(api.myFunctions.listNumbers, { count: 100 });
			expect(result.numbers).toEqual([1, 2]);
		});

		test("should return null viewer when not authenticated", async () => {
			const t = createTest();

			await t.mutation(api.myFunctions.addNumber, { value: 42 });

			const result = await t.query(api.myFunctions.listNumbers, { count: 10 });
			expect(result.viewer).toBeNull();
		});

		test("should return viewer subject when authenticated", async () => {
			const t = createTest();

			// Mock an authenticated user
			const asUser = t.withIdentity({
				subject: "user_123",
				tokenIdentifier: "https://example.com|user_123",
			});

			await asUser.mutation(api.myFunctions.addNumber, { value: 42 });

			const result = await asUser.query(api.myFunctions.listNumbers, {
				count: 10,
			});
			expect(result.viewer).toBe("user_123");
			expect(result.numbers).toEqual([42]);
		});

		test("should work with multiple authenticated users", async () => {
			const t = createTest();

			const user1 = t.withIdentity({
				subject: "user_1",
				tokenIdentifier: "https://example.com|user_1",
			});

			const user2 = t.withIdentity({
				subject: "user_2",
				tokenIdentifier: "https://example.com|user_2",
			});

			// User 1 adds numbers
			await user1.mutation(api.myFunctions.addNumber, { value: 10 });

			// User 2 adds numbers
			await user2.mutation(api.myFunctions.addNumber, { value: 20 });

			// User 1 queries
			const result1 = await user1.query(api.myFunctions.listNumbers, {
				count: 10,
			});
			expect(result1.viewer).toBe("user_1");
			expect(result1.numbers).toEqual([10, 20]); // All numbers visible

			// User 2 queries
			const result2 = await user2.query(api.myFunctions.listNumbers, {
				count: 10,
			});
			expect(result2.viewer).toBe("user_2");
			expect(result2.numbers).toEqual([10, 20]); // All numbers visible
		});
	});

	describe("myAction action", () => {
		test("should query and mutate data successfully", async () => {
			const t = createTest();

			// Pre-populate some numbers
			await t.mutation(api.myFunctions.addNumber, { value: 1 });
			await t.mutation(api.myFunctions.addNumber, { value: 2 });

			// Run the action
			await t.action(api.myFunctions.myAction, {
				first: 99,
				second: "test-string",
			});

			// Verify the action added the number
			const result = await t.query(api.myFunctions.listNumbers, { count: 10 });
			expect(result.numbers).toEqual([1, 2, 99]);
		});

		test("should handle empty database", async () => {
			const t = createTest();

			await t.action(api.myFunctions.myAction, {
				first: 42,
				second: "hello",
			});

			const result = await t.query(api.myFunctions.listNumbers, { count: 10 });
			expect(result.numbers).toEqual([42]);
		});

		test("should respect the 10-count limit in internal query", async () => {
			const t = createTest();

			// Add more than 10 numbers
			for (let i = 1; i <= 15; i += 1) {
				await t.mutation(api.myFunctions.addNumber, { value: i });
			}

			// The action queries with count: 10, then adds a number
			await t.action(api.myFunctions.myAction, {
				first: 999,
				second: "test",
			});

			const result = await t.query(api.myFunctions.listNumbers, { count: 20 });
			// Should have all 16 numbers (15 original + 1 from action)
			expect(result.numbers).toHaveLength(16);
			expect(result.numbers[15]).toBe(999);
		});

		test("should work with authenticated context", async () => {
			const t = createTest();

			const asUser = t.withIdentity({
				subject: "action_user",
				tokenIdentifier: "https://example.com|action_user",
			});

			await asUser.action(api.myFunctions.myAction, {
				first: 777,
				second: "authenticated-action",
			});

			const result = await asUser.query(api.myFunctions.listNumbers, {
				count: 10,
			});
			expect(result.viewer).toBe("action_user");
			expect(result.numbers).toEqual([777]);
		});

		test("should handle various string types in second parameter", async () => {
			const t = createTest();

			const testCases = [
				"",
				"short",
				"a very long string with special chars !@#$%^&*()",
			];

			for (const testString of testCases) {
				await t.action(api.myFunctions.myAction, {
					first: 1,
					second: testString,
				});
			}

			const result = await t.query(api.myFunctions.listNumbers, { count: 10 });
			expect(result.numbers).toHaveLength(testCases.length);
		});
	});

	describe("integration tests", () => {
		test("should handle complex workflow with queries, mutations, and actions", async () => {
			const t = createTest();

			// Initial state
			let result = await t.query(api.myFunctions.listNumbers, { count: 10 });
			expect(result.numbers).toEqual([]);

			// Add some numbers via mutations
			await t.mutation(api.myFunctions.addNumber, { value: 5 });
			await t.mutation(api.myFunctions.addNumber, { value: 10 });

			result = await t.query(api.myFunctions.listNumbers, { count: 10 });
			expect(result.numbers).toEqual([5, 10]);

			// Use action to add more
			await t.action(api.myFunctions.myAction, { first: 15, second: "action" });

			result = await t.query(api.myFunctions.listNumbers, { count: 10 });
			expect(result.numbers).toEqual([5, 10, 15]);

			// Test limiting
			result = await t.query(api.myFunctions.listNumbers, { count: 2 });
			expect(result.numbers).toEqual([10, 15]);
		});

		test("should handle concurrent mutations", async () => {
			const t = createTest();

			// Simulate concurrent adds
			await Promise.all([
				t.mutation(api.myFunctions.addNumber, { value: 1 }),
				t.mutation(api.myFunctions.addNumber, { value: 2 }),
				t.mutation(api.myFunctions.addNumber, { value: 3 }),
			]);

			const result = await t.query(api.myFunctions.listNumbers, { count: 10 });
			expect(result.numbers).toHaveLength(3);
			// All numbers should be present (order may vary due to concurrency)
			expect(result.numbers.sort()).toEqual([1, 2, 3]);
		});

		test("should maintain data consistency across multiple operations", async () => {
			const t = createTest();

			const user1 = t.withIdentity({
				subject: "user_a",
				tokenIdentifier: "https://example.com|user_a",
			});

			const user2 = t.withIdentity({
				subject: "user_b",
				tokenIdentifier: "https://example.com|user_b",
			});

			// User 1 performs operations
			await user1.mutation(api.myFunctions.addNumber, { value: 100 });
			await user1.action(api.myFunctions.myAction, {
				first: 200,
				second: "u1",
			});

			// User 2 performs operations
			await user2.mutation(api.myFunctions.addNumber, { value: 300 });
			await user2.action(api.myFunctions.myAction, {
				first: 400,
				second: "u2",
			});

			// Both users should see all data
			const result1 = await user1.query(api.myFunctions.listNumbers, {
				count: 10,
			});
			const result2 = await user2.query(api.myFunctions.listNumbers, {
				count: 10,
			});

			expect(result1.numbers).toEqual([100, 200, 300, 400]);
			expect(result2.numbers).toEqual([100, 200, 300, 400]);

			// But viewers should be different
			expect(result1.viewer).toBe("user_a");
			expect(result2.viewer).toBe("user_b");
		});
	});
});

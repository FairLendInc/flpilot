/**
 * 7.2 Unit test redaction and payload size handling.
 */
import { describe, expect, it } from "vitest";
import {
	redactPayload,
	serializeWithLimit,
} from "../convex/lib/telemetry/payloadCapture";

describe("redactPayload", () => {
	it("redacts keys matching the denylist (case-insensitive)", () => {
		const data = {
			name: "Alice",
			password: "secret123",
			email: "alice@example.com",
			token: "abc-def",
		};

		const { result, wasRedacted } = redactPayload(data, ["password", "token"]);

		expect(wasRedacted).toBe(true);
		expect(result).toEqual({
			name: "Alice",
			password: "[REDACTED]",
			email: "alice@example.com",
			token: "[REDACTED]",
		});
	});

	it("handles case-insensitive key matching", () => {
		const data = { Password: "secret", TOKEN: "abc" };
		const { result, wasRedacted } = redactPayload(data, ["password", "token"]);

		expect(wasRedacted).toBe(true);
		expect(result).toEqual({
			Password: "[REDACTED]",
			TOKEN: "[REDACTED]",
		});
	});

	it("redacts nested keys", () => {
		const data = {
			user: {
				name: "Bob",
				credentials: {
					apiKey: "sk-1234",
					email: "bob@test.com",
				},
			},
		};

		const { result, wasRedacted } = redactPayload(data, ["apiKey"]);

		expect(wasRedacted).toBe(true);
		expect((result as any).user.credentials.apiKey).toBe("[REDACTED]");
		expect((result as any).user.credentials.email).toBe("bob@test.com");
		expect((result as any).user.name).toBe("Bob");
	});

	it("redacts within arrays", () => {
		const data = [
			{ name: "Alice", secret: "shh" },
			{ name: "Bob", secret: "quiet" },
		];

		const { result, wasRedacted } = redactPayload(data, ["secret"]);

		expect(wasRedacted).toBe(true);
		expect(result).toEqual([
			{ name: "Alice", secret: "[REDACTED]" },
			{ name: "Bob", secret: "[REDACTED]" },
		]);
	});

	it("returns wasRedacted=false when no keys match", () => {
		const data = { name: "Alice", email: "alice@test.com" };
		const { result, wasRedacted } = redactPayload(data, ["password"]);

		expect(wasRedacted).toBe(false);
		expect(result).toEqual(data);
	});

	it("handles null and undefined values", () => {
		const { result: r1 } = redactPayload(null, ["password"]);
		expect(r1).toBeNull();

		const { result: r2 } = redactPayload(undefined, ["password"]);
		expect(r2).toBeUndefined();
	});

	it("handles primitive values", () => {
		const { result: r1 } = redactPayload("hello", ["password"]);
		expect(r1).toBe("hello");

		const { result: r2 } = redactPayload(42, ["password"]);
		expect(r2).toBe(42);
	});
});

describe("serializeWithLimit", () => {
	it("serializes small payloads without truncation", () => {
		const data = { name: "Alice", age: 30 };
		const { content, sizeBytes, truncated } = serializeWithLimit(data, 1024);

		expect(truncated).toBe(false);
		expect(JSON.parse(content)).toEqual(data);
		expect(sizeBytes).toBeGreaterThan(0);
	});

	it("truncates payloads exceeding maxBytes", () => {
		const data = { longString: "x".repeat(10000) };
		const { content, truncated } = serializeWithLimit(data, 500);

		expect(truncated).toBe(true);
		const parsed = JSON.parse(content);
		expect(parsed._truncated).toBe(true);
		expect(parsed._originalSizeBytes).toBeGreaterThan(500);
		expect(parsed._maxSizeBytes).toBe(500);
		expect(parsed._preview).toBeDefined();
	});

	it("handles non-serializable data gracefully", () => {
		const circular: Record<string, unknown> = {};
		circular.self = circular;

		const { content, truncated } = serializeWithLimit(circular, 1024);
		const parsed = JSON.parse(content);
		expect(parsed._error).toBe("payload not serializable");
	});

	it("respects exact boundary", () => {
		// Create data that is exactly at the boundary
		const smallData = { a: "b" };
		const serialized = JSON.stringify(smallData);
		const exactSize = new TextEncoder().encode(serialized).length;

		const { truncated } = serializeWithLimit(smallData, exactSize);
		expect(truncated).toBe(false);

		const { truncated: truncated2 } = serializeWithLimit(
			smallData,
			exactSize - 1
		);
		expect(truncated2).toBe(true);
	});

	it("preview in truncated output is capped at 1024 chars", () => {
		const data = { longString: "x".repeat(50000) };
		const { content } = serializeWithLimit(data, 100);
		const parsed = JSON.parse(content);
		expect(parsed._preview.length).toBeLessThanOrEqual(1024);
	});
});

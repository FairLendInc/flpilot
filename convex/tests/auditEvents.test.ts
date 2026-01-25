// @vitest-environment node
/**
 * Audit Events Tests
 *
 * Tests for the audit event system used in ownership transfer workflow.
 * See footguns.md for critical requirements:
 * - #4: No PII/credentials in audit events
 * - #7: Cron job continues after individual failures
 */

import { convexTest } from "convex-test";
import { describe, expect, test, vi } from "vitest";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
	OWNERSHIP_EVENT_TYPES,
	ENTITY_TYPES,
	SENSITIVE_FIELDS,
	sanitizeState,
} from "../lib/events/types";
import schema from "../schema";

// @ts-ignore
const modules = import.meta.glob("../**/*.{ts,js,tsx,jsx}", { eager: false });
const createTest = () => convexTest(schema, modules);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get an authenticated test instance with admin role
 */
async function getAdminTest(t: ReturnType<typeof createTest>) {
	const adminIdpId = "test-admin-user";
	await t.run(async (ctx) => {
		const existingAdmin = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", adminIdpId))
			.first();

		if (!existingAdmin) {
			await ctx.db.insert("users", {
				idp_id: adminIdpId,
				email: "admin@test.example.com",
				email_verified: true,
				first_name: "Test",
				last_name: "Admin",
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				metadata: {
					testUser: true,
					role: "admin",
				},
			});
		}
	});

	return t.withIdentity({
		subject: adminIdpId,
		role: "admin",
	});
}

/**
 * Create a test user and return their ID
 */
async function createTestUser(t: ReturnType<typeof createTest>) {
	return await t.run(
		async (ctx) =>
			await ctx.db.insert("users", {
				idp_id: `test_user_${Date.now()}`,
				email: `testuser_${Date.now()}@test.example.com`,
				email_verified: true,
				first_name: "Test",
				last_name: "User",
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				metadata: {
					testUser: true,
					role: "user",
				},
			})
	);
}

// ============================================================================
// Event Creation Tests
// ============================================================================

describe("createAuditEvent", () => {
	test("should create an audit event with all fields", async () => {
		const t = createTest();
		const userId = await createTestUser(t);

		const eventId = await t.run(async (ctx) => {
			return await ctx.runMutation(internal.auditEvents.createAuditEvent, {
				eventType: OWNERSHIP_EVENT_TYPES.TRANSFER_CREATED,
				entityType: ENTITY_TYPES.PENDING_TRANSFER,
				entityId: "test-entity-123",
				userId,
				beforeState: { status: "pending" },
				afterState: { status: "approved" },
				metadata: { dealId: "deal-123" },
			});
		});

		expect(eventId).toBeDefined();

		// Verify the event was created
		const event = await t.run(async (ctx) => ctx.db.get(eventId));
		expect(event).toBeTruthy();
		expect(event?.eventType).toBe(OWNERSHIP_EVENT_TYPES.TRANSFER_CREATED);
		expect(event?.entityType).toBe(ENTITY_TYPES.PENDING_TRANSFER);
		expect(event?.entityId).toBe("test-entity-123");
		expect(event?.userId).toBe(userId);
		expect(event?.timestamp).toBeDefined();
		expect(event?.emittedAt).toBeUndefined();
		expect(event?.emitFailures).toBe(0);
	});

	test("should create event without optional fields", async () => {
		const t = createTest();
		const userId = await createTestUser(t);

		const eventId = await t.run(async (ctx) => {
			return await ctx.runMutation(internal.auditEvents.createAuditEvent, {
				eventType: "test.event",
				entityType: "test_entity",
				entityId: "test-123",
				userId,
			});
		});

		const event = await t.run(async (ctx) => ctx.db.get(eventId));
		expect(event?.beforeState).toBeUndefined();
		expect(event?.afterState).toBeUndefined();
		expect(event?.metadata).toBeUndefined();
	});

	test("should record timestamp at creation time", async () => {
		const t = createTest();
		const userId = await createTestUser(t);

		const beforeTime = Date.now();

		const eventId = await t.run(async (ctx) => {
			return await ctx.runMutation(internal.auditEvents.createAuditEvent, {
				eventType: "test.event",
				entityType: "test_entity",
				entityId: "test-123",
				userId,
			});
		});

		const afterTime = Date.now();

		const event = await t.run(async (ctx) => ctx.db.get(eventId));
		expect(event?.timestamp).toBeGreaterThanOrEqual(beforeTime);
		expect(event?.timestamp).toBeLessThanOrEqual(afterTime);
	});
});

// ============================================================================
// PII Sanitization Tests (CRITICAL - footguns.md #4)
// ============================================================================

describe("sanitizeState - PII removal", () => {
	test("should remove email from state", () => {
		const state = {
			name: "John Doe",
			email: "john@example.com",
			status: "active",
		};

		const sanitized = sanitizeState(state) as Record<string, unknown>;

		expect(sanitized.name).toBe("John Doe");
		expect(sanitized.status).toBe("active");
		expect(sanitized).not.toHaveProperty("email");
	});

	test("should remove phone number from state", () => {
		const state = {
			name: "John",
			phone: "555-123-4567",
		};

		const sanitized = sanitizeState(state) as Record<string, unknown>;

		expect(sanitized.name).toBe("John");
		expect(sanitized).not.toHaveProperty("phone");
	});

	test("should remove SSN and financial data", () => {
		const state = {
			id: "123",
			ssn: "123-45-6789",
			accountNumber: "1234567890",
			routingNumber: "021000021",
			creditCardNumber: "4111111111111111",
		};

		const sanitized = sanitizeState(state) as Record<string, unknown>;

		expect(sanitized.id).toBe("123");
		expect(sanitized).not.toHaveProperty("ssn");
		expect(sanitized).not.toHaveProperty("accountNumber");
		expect(sanitized).not.toHaveProperty("routingNumber");
		expect(sanitized).not.toHaveProperty("creditCardNumber");
	});

	test("should remove credentials", () => {
		const state = {
			userId: "user-123",
			password: "secret123",
			accessToken: "eyJhbGc...",
			refreshToken: "refresh...",
			apiKey: "sk-abc123",
		};

		const sanitized = sanitizeState(state) as Record<string, unknown>;

		expect(sanitized.userId).toBe("user-123");
		expect(sanitized).not.toHaveProperty("password");
		expect(sanitized).not.toHaveProperty("accessToken");
		expect(sanitized).not.toHaveProperty("refreshToken");
		expect(sanitized).not.toHaveProperty("apiKey");
	});

	test("should sanitize nested objects", () => {
		const state = {
			user: {
				name: "John",
				email: "john@example.com",
				profile: {
					phone: "555-1234",
					avatar: "avatar.jpg",
				},
			},
		};

		const sanitized = sanitizeState(state) as Record<string, unknown>;
		const user = sanitized.user as Record<string, unknown>;
		const profile = user.profile as Record<string, unknown>;

		expect(user.name).toBe("John");
		expect(user).not.toHaveProperty("email");
		expect(profile.avatar).toBe("avatar.jpg");
		expect(profile).not.toHaveProperty("phone");
	});

	test("should sanitize arrays", () => {
		const state = {
			users: [
				{ name: "John", email: "john@example.com" },
				{ name: "Jane", email: "jane@example.com" },
			],
		};

		const sanitized = sanitizeState(state) as Record<string, unknown>;
		const users = sanitized.users as Array<Record<string, unknown>>;

		expect(users).toHaveLength(2);
		expect(users[0].name).toBe("John");
		expect(users[0]).not.toHaveProperty("email");
		expect(users[1].name).toBe("Jane");
		expect(users[1]).not.toHaveProperty("email");
	});

	test("should handle case-insensitive field matching", () => {
		const state = {
			Email: "john@example.com",
			EMAIL: "john@example.com",
			userEmail: "john@example.com",
		};

		const sanitized = sanitizeState(state) as Record<string, unknown>;

		expect(sanitized).not.toHaveProperty("Email");
		expect(sanitized).not.toHaveProperty("EMAIL");
		expect(sanitized).not.toHaveProperty("userEmail");
	});

	test("should handle null and primitive values", () => {
		expect(sanitizeState(null)).toBeNull();
		expect(sanitizeState(undefined)).toBeUndefined();
		expect(sanitizeState("string")).toBe("string");
		expect(sanitizeState(123)).toBe(123);
		expect(sanitizeState(true)).toBe(true);
	});

	test("should preserve non-sensitive fields", () => {
		const state = {
			id: "123",
			status: "active",
			percentage: 50,
			isApproved: true,
			createdAt: "2024-01-01",
			metadata: {
				version: 1,
				source: "api",
			},
		};

		const sanitized = sanitizeState(state) as Record<string, unknown>;

		expect(sanitized.id).toBe("123");
		expect(sanitized.status).toBe("active");
		expect(sanitized.percentage).toBe(50);
		expect(sanitized.isApproved).toBe(true);
		expect(sanitized.createdAt).toBe("2024-01-01");
		const metadata = sanitized.metadata as Record<string, unknown>;
		expect(metadata.version).toBe(1);
		expect(metadata.source).toBe("api");
	});
});

describe("createAuditEvent - PII sanitization in database", () => {
	test("should sanitize beforeState when storing", async () => {
		const t = createTest();
		const userId = await createTestUser(t);

		const eventId = await t.run(async (ctx) => {
			return await ctx.runMutation(internal.auditEvents.createAuditEvent, {
				eventType: "test.event",
				entityType: "test",
				entityId: "123",
				userId,
				beforeState: {
					name: "John",
					email: "john@example.com",
					status: "pending",
				},
			});
		});

		const event = await t.run(async (ctx) => ctx.db.get(eventId));
		const beforeState = event?.beforeState as Record<string, unknown>;

		expect(beforeState.name).toBe("John");
		expect(beforeState.status).toBe("pending");
		expect(beforeState).not.toHaveProperty("email");
	});

	test("should sanitize afterState when storing", async () => {
		const t = createTest();
		const userId = await createTestUser(t);

		const eventId = await t.run(async (ctx) => {
			return await ctx.runMutation(internal.auditEvents.createAuditEvent, {
				eventType: "test.event",
				entityType: "test",
				entityId: "123",
				userId,
				afterState: {
					name: "John",
					phone: "555-1234",
					password: "secret",
					status: "approved",
				},
			});
		});

		const event = await t.run(async (ctx) => ctx.db.get(eventId));
		const afterState = event?.afterState as Record<string, unknown>;

		expect(afterState.name).toBe("John");
		expect(afterState.status).toBe("approved");
		expect(afterState).not.toHaveProperty("phone");
		expect(afterState).not.toHaveProperty("password");
	});
});

// ============================================================================
// Query Tests
// ============================================================================

describe("getEventsForEntity", () => {
	test("should return events for a specific entity", async () => {
		const t = createTest();
		const userId = await createTestUser(t);
		const entityId = `entity-${Date.now()}`;

		// Create multiple events for the same entity
		await t.run(async (ctx) => {
			await ctx.runMutation(internal.auditEvents.createAuditEvent, {
				eventType: "event.type.one",
				entityType: "test_entity",
				entityId,
				userId,
			});
			await ctx.runMutation(internal.auditEvents.createAuditEvent, {
				eventType: "event.type.two",
				entityType: "test_entity",
				entityId,
				userId,
			});
			// Event for different entity
			await ctx.runMutation(internal.auditEvents.createAuditEvent, {
				eventType: "event.type.three",
				entityType: "test_entity",
				entityId: "other-entity",
				userId,
			});
		});

		const adminT = await getAdminTest(t);
		const events = await adminT.query(api.auditEvents.getEventsForEntity, {
			entityType: "test_entity",
			entityId,
		});

		expect(events.length).toBe(2);
		expect(events.every((e) => e.entityId === entityId)).toBe(true);
	});

	test("should respect limit parameter", async () => {
		const t = createTest();
		const userId = await createTestUser(t);
		const entityId = `entity-${Date.now()}`;

		// Create 5 events
		await t.run(async (ctx) => {
			for (let i = 0; i < 5; i++) {
				await ctx.runMutation(internal.auditEvents.createAuditEvent, {
					eventType: `event.type.${i}`,
					entityType: "test_entity",
					entityId,
					userId,
				});
			}
		});

		const adminT = await getAdminTest(t);
		const events = await adminT.query(api.auditEvents.getEventsForEntity, {
			entityType: "test_entity",
			entityId,
			limit: 3,
		});

		expect(events.length).toBe(3);
	});

	test("should return events in descending order", async () => {
		const t = createTest();
		const userId = await createTestUser(t);
		const entityId = `entity-${Date.now()}`;

		// Create events
		await t.run(async (ctx) => {
			await ctx.runMutation(internal.auditEvents.createAuditEvent, {
				eventType: "first",
				entityType: "test_entity",
				entityId,
				userId,
			});
			await ctx.runMutation(internal.auditEvents.createAuditEvent, {
				eventType: "second",
				entityType: "test_entity",
				entityId,
				userId,
			});
		});

		const adminT = await getAdminTest(t);
		const events = await adminT.query(api.auditEvents.getEventsForEntity, {
			entityType: "test_entity",
			entityId,
		});

		// Most recent should be first
		expect(events[0].eventType).toBe("second");
		expect(events[1].eventType).toBe("first");
	});
});

describe("getEventsByType", () => {
	test("should return events filtered by type", async () => {
		const t = createTest();
		const userId = await createTestUser(t);
		const eventType = `test.type.${Date.now()}`;

		await t.run(async (ctx) => {
			await ctx.runMutation(internal.auditEvents.createAuditEvent, {
				eventType,
				entityType: "entity1",
				entityId: "id1",
				userId,
			});
			await ctx.runMutation(internal.auditEvents.createAuditEvent, {
				eventType,
				entityType: "entity2",
				entityId: "id2",
				userId,
			});
			await ctx.runMutation(internal.auditEvents.createAuditEvent, {
				eventType: "other.type",
				entityType: "entity3",
				entityId: "id3",
				userId,
			});
		});

		const adminT = await getAdminTest(t);
		const events = await adminT.query(api.auditEvents.getEventsByType, {
			eventType,
		});

		expect(events.length).toBe(2);
		expect(events.every((e) => e.eventType === eventType)).toBe(true);
	});
});

describe("getRecentEvents", () => {
	test("should return most recent events", async () => {
		const t = createTest();
		const userId = await createTestUser(t);

		// Create several events
		await t.run(async (ctx) => {
			for (let i = 0; i < 5; i++) {
				await ctx.runMutation(internal.auditEvents.createAuditEvent, {
					eventType: `recent.event.${i}`,
					entityType: "test",
					entityId: `id-${i}`,
					userId,
				});
			}
		});

		const adminT = await getAdminTest(t);
		const events = await adminT.query(api.auditEvents.getRecentEvents, {
			limit: 3,
		});

		expect(events.length).toBeLessThanOrEqual(3);
		// Should be in descending order
		for (let i = 0; i < events.length - 1; i++) {
			expect(events[i]._creationTime).toBeGreaterThanOrEqual(
				events[i + 1]._creationTime
			);
		}
	});
});

// ============================================================================
// Emission Marking Tests
// ============================================================================

describe("markEventEmitted", () => {
	test("should set emittedAt timestamp", async () => {
		const t = createTest();
		const userId = await createTestUser(t);

		const eventId = await t.run(async (ctx) => {
			return await ctx.runMutation(internal.auditEvents.createAuditEvent, {
				eventType: "test.event",
				entityType: "test",
				entityId: "123",
				userId,
			});
		});

		// Initially not emitted
		const eventBefore = await t.run(async (ctx) => ctx.db.get(eventId));
		expect(eventBefore?.emittedAt).toBeUndefined();

		const beforeMark = Date.now();

		// Mark as emitted
		await t.run(async (ctx) => {
			await ctx.runMutation(internal.auditEvents.markEventEmitted, {
				eventId,
			});
		});

		const afterMark = Date.now();

		// Verify emittedAt is set
		const eventAfter = await t.run(async (ctx) => ctx.db.get(eventId));
		expect(eventAfter?.emittedAt).toBeDefined();
		expect(eventAfter?.emittedAt).toBeGreaterThanOrEqual(beforeMark);
		expect(eventAfter?.emittedAt).toBeLessThanOrEqual(afterMark);
	});
});

describe("incrementEmitFailures", () => {
	test("should increment failure counter", async () => {
		const t = createTest();
		const userId = await createTestUser(t);

		const eventId = await t.run(async (ctx) => {
			return await ctx.runMutation(internal.auditEvents.createAuditEvent, {
				eventType: "test.event",
				entityType: "test",
				entityId: "123",
				userId,
			});
		});

		// Initially 0 failures
		const eventBefore = await t.run(async (ctx) => ctx.db.get(eventId));
		expect(eventBefore?.emitFailures).toBe(0);

		// Increment failures twice
		await t.run(async (ctx) => {
			await ctx.runMutation(internal.auditEvents.incrementEmitFailures, {
				eventId,
			});
			await ctx.runMutation(internal.auditEvents.incrementEmitFailures, {
				eventId,
			});
		});

		const eventAfter = await t.run(async (ctx) => ctx.db.get(eventId));
		expect(eventAfter?.emitFailures).toBe(2);
	});
});

describe("getUnemittedEvents", () => {
	test("should return only unemitted events", async () => {
		const t = createTest();
		const userId = await createTestUser(t);

		// Create two events
		const [eventId1, eventId2] = await t.run(async (ctx) => {
			const id1 = await ctx.runMutation(internal.auditEvents.createAuditEvent, {
				eventType: "unemitted.event",
				entityType: "test",
				entityId: "1",
				userId,
			});
			const id2 = await ctx.runMutation(internal.auditEvents.createAuditEvent, {
				eventType: "emitted.event",
				entityType: "test",
				entityId: "2",
				userId,
			});
			return [id1, id2];
		});

		// Mark one as emitted
		await t.run(async (ctx) => {
			await ctx.runMutation(internal.auditEvents.markEventEmitted, {
				eventId: eventId2,
			});
		});

		// Query unemitted events
		const unemittedEvents = await t.run(async (ctx) => {
			return await ctx.runQuery(internal.auditEvents.getUnemittedEvents, {});
		});

		// Should include eventId1 but not eventId2
		const unemittedIds = unemittedEvents.map((e) => e._id);
		expect(unemittedIds).toContain(eventId1);
		expect(unemittedIds).not.toContain(eventId2);
	});

	test("should respect limit parameter", async () => {
		const t = createTest();
		const userId = await createTestUser(t);

		// Create 5 events
		await t.run(async (ctx) => {
			for (let i = 0; i < 5; i++) {
				await ctx.runMutation(internal.auditEvents.createAuditEvent, {
					eventType: `batch.event.${i}`,
					entityType: "test",
					entityId: `id-${i}`,
					userId,
				});
			}
		});

		const events = await t.run(async (ctx) => {
			return await ctx.runQuery(internal.auditEvents.getUnemittedEvents, {
				limit: 2,
			});
		});

		expect(events.length).toBe(2);
	});
});

// ============================================================================
// Cron Job Behavior Tests (footguns.md #7)
// ============================================================================

describe("emitPendingEvents cron job", () => {
	test("should process multiple events and track successes", async () => {
		const t = createTest();
		const userId = await createTestUser(t);

		// Create multiple unemitted events
		await t.run(async (ctx) => {
			for (let i = 0; i < 3; i++) {
				await ctx.runMutation(internal.auditEvents.createAuditEvent, {
					eventType: `cron.test.event.${i}`,
					entityType: "test",
					entityId: `cron-${i}`,
					userId,
				});
			}
		});

		// Run the cron action
		const result = await t.action(internal.auditEventsCron.emitPendingEvents, {});

		// Should process all events
		expect(result.processed).toBeGreaterThanOrEqual(3);
		expect(result.succeeded).toBeGreaterThanOrEqual(3);
		expect(result.failed).toBe(0);
	});

	test("should mark successful events as emitted", async () => {
		const t = createTest();
		const userId = await createTestUser(t);

		const eventId = await t.run(async (ctx) => {
			return await ctx.runMutation(internal.auditEvents.createAuditEvent, {
				eventType: "cron.success.test",
				entityType: "test",
				entityId: "success-1",
				userId,
			});
		});

		// Verify not emitted before cron
		const eventBefore = await t.run(async (ctx) => ctx.db.get(eventId));
		expect(eventBefore?.emittedAt).toBeUndefined();

		// Run cron
		await t.action(internal.auditEventsCron.emitPendingEvents, {});

		// Verify emitted after cron
		const eventAfter = await t.run(async (ctx) => ctx.db.get(eventId));
		expect(eventAfter?.emittedAt).toBeDefined();
	});

	test("should return zero counts when no events to process", async () => {
		const t = createTest();

		// Clear any existing unemitted events by marking them
		await t.run(async (ctx) => {
			const events = await ctx.db
				.query("audit_events")
				.filter((q) => q.eq(q.field("emittedAt"), undefined))
				.collect();

			for (const event of events) {
				await ctx.db.patch(event._id, { emittedAt: Date.now() });
			}
		});

		const result = await t.action(internal.auditEventsCron.emitPendingEvents, {});

		expect(result.processed).toBe(0);
		expect(result.succeeded).toBe(0);
		expect(result.failed).toBe(0);
	});
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("audit events integration", () => {
	test("full lifecycle: create -> query -> emit -> verify emitted", async () => {
		const t = createTest();
		const userId = await createTestUser(t);
		const entityId = `lifecycle-${Date.now()}`;

		// 1. Create event
		const eventId = await t.run(async (ctx) => {
			return await ctx.runMutation(internal.auditEvents.createAuditEvent, {
				eventType: OWNERSHIP_EVENT_TYPES.TRANSFER_CREATED,
				entityType: ENTITY_TYPES.PENDING_TRANSFER,
				entityId,
				userId,
				beforeState: { status: "pending", email: "test@test.com" },
				afterState: { status: "approved" },
				metadata: { source: "test" },
			});
		});

		// 2. Query for the event
		const adminT = await getAdminTest(t);
		const queriedEvents = await adminT.query(api.auditEvents.getEventsForEntity, {
			entityType: ENTITY_TYPES.PENDING_TRANSFER,
			entityId,
		});

		expect(queriedEvents.length).toBe(1);
		expect(queriedEvents[0]._id).toBe(eventId);
		// Verify PII was stripped
		const beforeState = queriedEvents[0].beforeState as Record<string, unknown>;
		expect(beforeState).not.toHaveProperty("email");

		// 3. Run emission cron
		await t.action(internal.auditEventsCron.emitPendingEvents, {});

		// 4. Verify event is marked as emitted
		const event = await t.run(async (ctx) => ctx.db.get(eventId));
		expect(event?.emittedAt).toBeDefined();
	});

	test("should cover all SENSITIVE_FIELDS in sanitization", () => {
		// Build an object with all sensitive fields
		const stateWithAllSensitive: Record<string, string> = {};
		for (const field of SENSITIVE_FIELDS) {
			stateWithAllSensitive[field] = `test-value-${field}`;
		}
		stateWithAllSensitive.safeField = "should-remain";

		const sanitized = sanitizeState(stateWithAllSensitive) as Record<
			string,
			unknown
		>;

		// All sensitive fields should be removed
		for (const field of SENSITIVE_FIELDS) {
			expect(sanitized).not.toHaveProperty(field);
		}

		// Safe field should remain
		expect(sanitized.safeField).toBe("should-remain");
	});
});

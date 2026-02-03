// @vitest-environment node
/**
 * Unit Tests for Rotessa Sync Infrastructure
 *
 * Tests sync log management, transaction processing, and admin queries.
 */

import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import schema from "../schema";

// @ts-ignore - vitest glob import pattern
const modules = import.meta.glob("../**/*.{ts,js,tsx,jsx}", { eager: false });
const createTest = () => convexTest(schema, modules);

// ============================================================================
// Helper Functions
// ============================================================================

async function createTestUser(
	t: ReturnType<typeof createTest>,
	identifier: string
) {
	return await t.run(
		async (ctx) =>
			await ctx.db.insert("users", {
				idp_id: `idp_${identifier}`,
				email: `${identifier}@test.example.com`,
				email_verified: true,
				first_name: "Test",
				last_name: identifier,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				metadata: {},
			})
	);
}

async function getUserIdpId(
	t: ReturnType<typeof createTest>,
	userId: Id<"users">
): Promise<string> {
	const user = await t.run(async (ctx) => ctx.db.get(userId));
	if (!user?.idp_id) {
		throw new Error(`User ${userId} has no idp_id`);
	}
	return user.idp_id;
}

async function createTestBorrower(
	t: ReturnType<typeof createTest>,
	rotessaCustomerId: string
) {
	return await t.run(
		async (ctx) =>
			await ctx.db.insert("borrowers", {
				name: "Test Borrower",
				email: `borrower_${Date.now()}@example.com`,
				rotessaCustomerId,
			})
	);
}

async function createTestMortgage(
	t: ReturnType<typeof createTest>,
	borrowerId: Id<"borrowers">,
	rotessaScheduleId: number
) {
	return await t.run(
		async (ctx) =>
			await ctx.db.insert("mortgages", {
				borrowerId,
				loanAmount: 500000,
				interestRate: 5.5,
				originationDate: "2024-01-01",
				maturityDate: "2025-01-01",
				status: "active" as const,
				mortgageType: "1st" as const,
				address: {
					street: "123 Test St",
					city: "Test City",
					state: "ON",
					zip: "M5V1A1",
					country: "Canada",
				},
				location: { lat: 43.65, lng: -79.38 },
				propertyType: "Single Family",
				appraisalMarketValue: 600000,
				appraisalMethod: "Comparative Market Analysis",
				appraisalCompany: "Test Appraisal Co",
				appraisalDate: "2023-12-01",
				ltv: 83.33,
				images: [],
				documents: [],
				externalMortgageId: `test-mortgage-${Date.now()}-${Math.random()}`,
				rotessaScheduleId,
			})
	);
}

async function createTestSyncLog(
	t: ReturnType<typeof createTest>,
	options?: {
		syncType?: "daily" | "manual";
		scope?: "all" | "borrower" | "mortgage";
		status?: "running" | "completed" | "partial" | "failed";
		startedAt?: number;
		completedAt?: number;
		metrics?: {
			transactionsProcessed: number;
			paymentsCreated: number;
			paymentsUpdated: number;
			ledgerTransactionsCreated: number;
			errors: number;
		};
	}
) {
	const now = Date.now();
	return await t.run(
		async (ctx) =>
			await ctx.db.insert("rotessa_sync_log", {
				syncType: options?.syncType ?? "daily",
				scope: options?.scope ?? "all",
				status: options?.status ?? "completed",
				startedAt: options?.startedAt ?? now - 60000,
				completedAt: options?.completedAt ?? now,
				metrics: options?.metrics ?? {
					transactionsProcessed: 10,
					paymentsCreated: 5,
					paymentsUpdated: 3,
					ledgerTransactionsCreated: 5,
					errors: 0,
				},
			})
	);
}

// ============================================================================
// Sync Log Management Tests
// ============================================================================

describe("createSyncLog", () => {
	test("should create a sync log with running status", async () => {
		const t = createTest();

		const syncLogId = await t.run(async (ctx) =>
			ctx.runMutation(internal.rotessaSync.createSyncLog, {
				syncType: "daily",
				scope: "all",
			})
		);

		expect(syncLogId).toBeDefined();

		// Verify the sync log was created
		const syncLog = await t.run(async (ctx) => ctx.db.get(syncLogId));
		const syncLogDoc = syncLog as Doc<"rotessa_sync_log">;
		expect(syncLogDoc).toBeDefined();
		expect(syncLogDoc?.status).toBe("running");
		expect(syncLogDoc?.syncType).toBe("daily");
		expect(syncLogDoc?.scope).toBe("all");
		expect(syncLogDoc?.startedAt).toBeDefined();
	});

	test("should create a manual sync log with entity ID", async () => {
		const t = createTest();
		const userId = await createTestUser(t, "sync_trigger_user");

		const syncLogId = await t.run(async (ctx) =>
			ctx.runMutation(internal.rotessaSync.createSyncLog, {
				syncType: "manual",
				scope: "borrower",
				entityId: "12345",
				triggeredBy: userId,
			})
		);

		const syncLog = await t.run(async (ctx) => ctx.db.get(syncLogId));
		const syncLogDoc = syncLog as Doc<"rotessa_sync_log">;
		expect(syncLogDoc?.syncType).toBe("manual");
		expect(syncLogDoc?.scope).toBe("borrower");
		expect(syncLogDoc?.entityId).toBe("12345");
		expect(syncLogDoc?.triggeredBy).toBe(userId);
	});
});

describe("updateSyncLog", () => {
	test("should update sync log status to completed", async () => {
		const t = createTest();

		const syncLogId = await t.run(async (ctx) =>
			ctx.runMutation(internal.rotessaSync.createSyncLog, {
				syncType: "daily",
				scope: "all",
			})
		);

		await t.run(async (ctx) =>
			ctx.runMutation(internal.rotessaSync.updateSyncLog, {
				syncLogId,
				status: "completed",
				metrics: {
					transactionsProcessed: 10,
					paymentsCreated: 5,
					paymentsUpdated: 3,
					ledgerTransactionsCreated: 5,
					errors: 0,
				},
				completedAt: Date.now(),
			})
		);

		const syncLog = await t.run(async (ctx) => ctx.db.get(syncLogId));
		const syncLogDoc = syncLog as Doc<"rotessa_sync_log">;
		expect(syncLogDoc?.status).toBe("completed");
		expect(syncLogDoc?.metrics?.transactionsProcessed).toBe(10);
		expect(syncLogDoc?.completedAt).toBeDefined();
	});

	test("should update sync log with errors", async () => {
		const t = createTest();

		const syncLogId = await t.run(async (ctx) =>
			ctx.runMutation(internal.rotessaSync.createSyncLog, {
				syncType: "daily",
				scope: "all",
			})
		);

		const errors = [
			{ transactionId: "123", error: "Payment failed", timestamp: Date.now() },
			{
				transactionId: "456",
				error: "Unknown borrower",
				timestamp: Date.now(),
			},
		];

		await t.run(async (ctx) =>
			ctx.runMutation(internal.rotessaSync.updateSyncLog, {
				syncLogId,
				status: "partial",
				metrics: {
					transactionsProcessed: 10,
					paymentsCreated: 3,
					paymentsUpdated: 2,
					ledgerTransactionsCreated: 3,
					errors: 2,
				},
				errors,
				completedAt: Date.now(),
			})
		);

		const syncLog = await t.run(async (ctx) => ctx.db.get(syncLogId));
		const syncLogDoc = syncLog as Doc<"rotessa_sync_log">;
		expect(syncLogDoc?.status).toBe("partial");
		expect(syncLogDoc?.errors?.length).toBe(2);
		expect(syncLogDoc?.errors?.[0]?.transactionId).toBe("123");
	});
});

describe("getSyncLogs", () => {
	test("should return recent sync logs", async () => {
		const t = createTest();

		await createTestSyncLog(t, { status: "completed" });
		await createTestSyncLog(t, { status: "completed" });
		await createTestSyncLog(t, { status: "partial" });

		const logs = await t.run(async (ctx) =>
			ctx.runQuery(internal.rotessaSync.getSyncLogs, {})
		);

		expect(logs.length).toBe(3);
	});

	test("should filter by status", async () => {
		const t = createTest();

		await createTestSyncLog(t, { status: "completed" });
		await createTestSyncLog(t, { status: "failed" });

		const logs = await t.run(async (ctx) =>
			ctx.runQuery(internal.rotessaSync.getSyncLogs, { status: "failed" })
		);

		expect(logs.length).toBe(1);
		expect(logs[0]?.status).toBe("failed");
	});

	test("should respect limit parameter", async () => {
		const t = createTest();

		for (let i = 0; i < 5; i += 1) {
			await createTestSyncLog(t);
		}

		const logs = await t.run(async (ctx) =>
			ctx.runQuery(internal.rotessaSync.getSyncLogs, { limit: 3 })
		);

		expect(logs.length).toBe(3);
	});
});

// ============================================================================
// Transaction Processing Tests
// ============================================================================

describe("processTransaction", () => {
	test("should create new payment from Rotessa transaction", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t, "12345");
		const _mortgageId = await createTestMortgage(t, borrowerId, 99999);

		const result = await t.run(async (ctx) =>
			ctx.runMutation(internal.rotessaSync.processTransaction, {
				transactionId: 1001,
				customerId: 12345,
				scheduleId: 99999,
				amount: "1500.00",
				status: "Approved",
				processDate: "2024-01-15",
			})
		);

		expect(result.created).toBe(true);
		expect(result.updated).toBe(false);
		expect(result.paymentId).toBeDefined();

		// Verify payment was created
		const payment = await t.run(async (ctx) => ctx.db.get(result.paymentId));
		const paymentDoc = payment as Doc<"payments">;
		expect(paymentDoc).toBeDefined();
		expect(paymentDoc?.amount).toBe(1500);
		expect(paymentDoc?.status).toBe("cleared");
		expect(paymentDoc?.rotessaTransactionId).toBe("1001");
	});

	test("should update existing payment", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t, "12346");
		const mortgageId = await createTestMortgage(t, borrowerId, 99998);

		// Create initial payment
		const initialPaymentId = await t.run(
			async (ctx) =>
				await ctx.db.insert("payments", {
					mortgageId,
					amount: 1500,
					processDate: "2024-01-15",
					status: "pending",
					paymentId: "1002",
					customerId: "12346",
					transactionScheduleId: "99998",
					borrowerId,
					currency: "CAD",
					paymentType: "interest_only",
					dueDate: "2024-01-15",
					rotessaTransactionId: "1002",
					rotessaScheduleId: 99998,
					rotessaStatus: "Pending",
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				})
		);

		// Process same transaction with updated status
		const result = await t.run(async (ctx) =>
			ctx.runMutation(internal.rotessaSync.processTransaction, {
				transactionId: 1002,
				customerId: 12346,
				scheduleId: 99998,
				amount: "1500.00",
				status: "Approved",
				processDate: "2024-01-15",
				settlementDate: "2024-01-17",
			})
		);

		expect(result.created).toBe(false);
		expect(result.updated).toBe(true);
		expect(result.paymentId).toBe(initialPaymentId);

		// Verify payment was updated
		const payment = await t.run(async (ctx) => ctx.db.get(initialPaymentId));
		const paymentDoc = payment as Doc<"payments">;
		expect(paymentDoc?.status).toBe("cleared");
		expect(paymentDoc?.rotessaStatus).toBe("Approved");
		expect(paymentDoc?.settlementDate).toBe("2024-01-17");
	});

	test("should throw error for unknown borrower", async () => {
		const t = createTest();

		await expect(
			t.run(async (ctx) =>
				ctx.runMutation(internal.rotessaSync.processTransaction, {
					transactionId: 1003,
					customerId: 99999, // Non-existent
					scheduleId: 11111,
					amount: "1000.00",
					status: "Pending",
					processDate: "2024-01-15",
				})
			)
		).rejects.toThrow("Borrower not found");
	});

	test("should throw error for unknown mortgage", async () => {
		const t = createTest();

		await createTestBorrower(t, "12347");

		await expect(
			t.run(async (ctx) =>
				ctx.runMutation(internal.rotessaSync.processTransaction, {
					transactionId: 1004,
					customerId: 12347,
					scheduleId: 88888, // Non-existent
					amount: "1000.00",
					status: "Pending",
					processDate: "2024-01-15",
				})
			)
		).rejects.toThrow("Mortgage not found");
	});

	test("should map Rotessa statuses correctly", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t, "12348");
		await createTestMortgage(t, borrowerId, 99997);

		// Test Pending status
		const result1 = await t.run(async (ctx) =>
			ctx.runMutation(internal.rotessaSync.processTransaction, {
				transactionId: 2001,
				customerId: 12348,
				scheduleId: 99997,
				amount: "100.00",
				status: "Pending",
				processDate: "2024-01-15",
			})
		);

		const payment1 = await t.run(async (ctx) => ctx.db.get(result1.paymentId));
		const payment1Doc = payment1 as Doc<"payments">;
		expect(payment1Doc?.status).toBe("pending");

		// Test Declined status (create new borrower/mortgage)
		const borrowerId2 = await createTestBorrower(t, "12349");
		await createTestMortgage(t, borrowerId2, 99996);

		const result2 = await t.run(async (ctx) =>
			ctx.runMutation(internal.rotessaSync.processTransaction, {
				transactionId: 2002,
				customerId: 12349,
				scheduleId: 99996,
				amount: "100.00",
				status: "Declined",
				processDate: "2024-01-15",
			})
		);

		const payment2 = await t.run(async (ctx) => ctx.db.get(result2.paymentId));
		const payment2Doc = payment2 as Doc<"payments">;
		expect(payment2Doc?.status).toBe("failed");

		// Test Chargeback status
		const borrowerId3 = await createTestBorrower(t, "12350");
		await createTestMortgage(t, borrowerId3, 99995);

		const result3 = await t.run(async (ctx) =>
			ctx.runMutation(internal.rotessaSync.processTransaction, {
				transactionId: 2003,
				customerId: 12350,
				scheduleId: 99995,
				amount: "100.00",
				status: "Chargeback",
				processDate: "2024-01-15",
			})
		);

		const payment3 = await t.run(async (ctx) => ctx.db.get(result3.paymentId));
		const payment3Doc = payment3 as Doc<"payments">;
		expect(payment3Doc?.status).toBe("nsf");
	});
});

// ============================================================================
// Admin Query Tests
// ============================================================================

describe("getSyncStatus", () => {
	test("should return healthy status when no syncs", async () => {
		const t = createTest();
		const adminUserId = await createTestUser(t, "admin_status");
		const adminIdpId = await getUserIdpId(t, adminUserId);

		const status = await t
			.withIdentity({ subject: adminIdpId, role: "admin" })
			.query(api.rotessaSync.getSyncStatus, {});

		expect(status.status).toBe("healthy");
		expect(status.message).toBe("No sync history");
	});

	test("should return syncing status when sync is running", async () => {
		const t = createTest();

		// Create a running sync
		await t.run(async (ctx) =>
			ctx.db.insert("rotessa_sync_log", {
				syncType: "daily",
				scope: "all",
				status: "running",
				startedAt: Date.now(),
			})
		);

		const adminUserId = await createTestUser(t, "admin_syncing");
		const adminIdpId = await getUserIdpId(t, adminUserId);

		const status = await t
			.withIdentity({ subject: adminIdpId, role: "admin" })
			.query(api.rotessaSync.getSyncStatus, {});

		expect(status.status).toBe("syncing");
		expect(status.activeSyncId).toBeDefined();
	});

	test("should return partial status when last sync had errors", async () => {
		const t = createTest();

		await createTestSyncLog(t, {
			status: "partial",
			metrics: {
				transactionsProcessed: 10,
				paymentsCreated: 5,
				paymentsUpdated: 2,
				ledgerTransactionsCreated: 5,
				errors: 3,
			},
		});

		const adminUserId = await createTestUser(t, "admin_partial");
		const adminIdpId = await getUserIdpId(t, adminUserId);

		const status = await t
			.withIdentity({ subject: adminIdpId, role: "admin" })
			.query(api.rotessaSync.getSyncStatus, {});

		expect(status.status).toBe("partial");
		expect(status.message).toContain("3 errors");
	});
});

describe("getWeekMetrics", () => {
	test("should return aggregated weekly metrics", async () => {
		const t = createTest();

		// Create syncs from this week
		await createTestSyncLog(t, {
			startedAt: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
			metrics: {
				transactionsProcessed: 10,
				paymentsCreated: 5,
				paymentsUpdated: 3,
				ledgerTransactionsCreated: 5,
				errors: 1,
			},
		});

		await createTestSyncLog(t, {
			startedAt: Date.now() - 48 * 60 * 60 * 1000, // 2 days ago
			metrics: {
				transactionsProcessed: 8,
				paymentsCreated: 4,
				paymentsUpdated: 2,
				ledgerTransactionsCreated: 4,
				errors: 0,
			},
		});

		const adminUserId = await createTestUser(t, "admin_metrics");
		const adminIdpId = await getUserIdpId(t, adminUserId);

		const metrics = await t
			.withIdentity({ subject: adminIdpId, role: "admin" })
			.query(api.rotessaSync.getWeekMetrics, {});

		expect(metrics.totalSynced).toBe(18);
		expect(metrics.ledgerTransactions).toBe(9);
		expect(metrics.errors).toBe(1);
		expect(metrics.successRate).toBeGreaterThan(90);
	});
});

// ============================================================================
// Manual Sync Trigger Tests
// ============================================================================

describe("triggerManualSync", () => {
	test("should create sync log and schedule action", async () => {
		const t = createTest();

		const adminUserId = await createTestUser(t, "admin_trigger");
		const adminIdpId = await getUserIdpId(t, adminUserId);

		const syncLogId = await t
			.withIdentity({ subject: adminIdpId, role: "admin" })
			.mutation(api.rotessaSync.triggerManualSync, {
				scope: "all",
			});

		expect(syncLogId).toBeDefined();

		// Verify sync log was created
		const syncLog = await t.run(async (ctx) => ctx.db.get(syncLogId));
		const syncLogDoc = syncLog as Doc<"rotessa_sync_log">;
		expect(syncLogDoc).toBeDefined();
		expect(syncLogDoc?.syncType).toBe("manual");
		expect(syncLogDoc?.status).toBe("running");
	});

	test("should reject if sync already running", async () => {
		const t = createTest();

		// Create a running sync
		await t.run(async (ctx) =>
			ctx.db.insert("rotessa_sync_log", {
				syncType: "daily",
				scope: "all",
				status: "running",
				startedAt: Date.now(),
			})
		);

		const adminUserId = await createTestUser(t, "admin_blocked");
		const adminIdpId = await getUserIdpId(t, adminUserId);

		await expect(
			t
				.withIdentity({ subject: adminIdpId, role: "admin" })
				.mutation(api.rotessaSync.triggerManualSync, { scope: "all" })
		).rejects.toThrow("already in progress");
	});

	test("should reject invalid date range", async () => {
		const t = createTest();

		const adminUserId = await createTestUser(t, "admin_invalid_dates");
		const adminIdpId = await getUserIdpId(t, adminUserId);

		// Start date after end date
		await expect(
			t
				.withIdentity({ subject: adminIdpId, role: "admin" })
				.mutation(api.rotessaSync.triggerManualSync, {
					scope: "all",
					dateRange: {
						startDate: "2024-02-01",
						endDate: "2024-01-01",
					},
				})
		).rejects.toThrow("Start date must be before end date");
	});

	test("should reject date range exceeding 90 days", async () => {
		const t = createTest();

		const adminUserId = await createTestUser(t, "admin_long_range");
		const adminIdpId = await getUserIdpId(t, adminUserId);

		await expect(
			t
				.withIdentity({ subject: adminIdpId, role: "admin" })
				.mutation(api.rotessaSync.triggerManualSync, {
					scope: "all",
					dateRange: {
						startDate: "2024-01-01",
						endDate: "2024-06-01", // ~150 days
					},
				})
		).rejects.toThrow("cannot exceed 90 days");
	});
});

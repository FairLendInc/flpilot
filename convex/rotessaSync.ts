/**
 * Rotessa Sync Infrastructure
 *
 * Handles synchronization of Rotessa transactions with local payment records
 * and Formance Ledger. Implements CRON-based polling since Rotessa doesn't
 * offer webhooks.
 *
 * Key patterns:
 * - Sync logs provide audit trail
 * - Per-item error isolation
 * - Idempotency via ledger references
 */

import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import {
	internalAction,
	internalMutation,
	internalQuery,
} from "./_generated/server";
import {
	type AuthorizedMutationCtx,
	type AuthorizedQueryCtx,
	createAuthorizedMutation,
	createAuthorizedQuery,
} from "./lib/server";

// ============================================================================
// Type Definitions
// ============================================================================

const syncStatusUnion = v.union(
	v.literal("running"),
	v.literal("completed"),
	v.literal("partial"),
	v.literal("failed")
);

const syncTypeUnion = v.union(v.literal("daily"), v.literal("manual"));

const syncScopeUnion = v.union(
	v.literal("all"),
	v.literal("borrower"),
	v.literal("mortgage")
);

const syncMetricsSchema = v.object({
	transactionsProcessed: v.number(),
	paymentsCreated: v.number(),
	paymentsUpdated: v.number(),
	ledgerTransactionsCreated: v.number(),
	errors: v.number(),
});

const syncErrorSchema = v.object({
	transactionId: v.string(),
	error: v.string(),
	timestamp: v.number(),
});

const syncLogSchema = v.object({
	_id: v.id("rotessa_sync_log"),
	_creationTime: v.number(),
	syncType: syncTypeUnion,
	scope: syncScopeUnion,
	entityId: v.optional(v.string()),
	status: syncStatusUnion,
	triggeredBy: v.optional(v.id("users")),
	startedAt: v.number(),
	completedAt: v.optional(v.number()),
	metrics: v.optional(syncMetricsSchema),
	errors: v.optional(v.array(syncErrorSchema)),
	dateRange: v.optional(
		v.object({
			startDate: v.string(),
			endDate: v.string(),
		})
	),
});

// ============================================================================
// Sync Log Management (Task 4.2)
// ============================================================================

/**
 * Create a new sync log entry
 */
export const createSyncLog = internalMutation({
	args: {
		syncType: syncTypeUnion,
		scope: syncScopeUnion,
		entityId: v.optional(v.string()),
		triggeredBy: v.optional(v.id("users")),
		dateRange: v.optional(
			v.object({
				startDate: v.string(),
				endDate: v.string(),
			})
		),
	},
	returns: v.id("rotessa_sync_log"),
	handler: async (ctx, args) =>
		await ctx.db.insert("rotessa_sync_log", {
			syncType: args.syncType,
			scope: args.scope,
			entityId: args.entityId,
			status: "running",
			triggeredBy: args.triggeredBy,
			startedAt: Date.now(),
			dateRange: args.dateRange,
		}),
});

/**
 * Update sync log with progress or completion
 */
export const updateSyncLog = internalMutation({
	args: {
		syncLogId: v.id("rotessa_sync_log"),
		status: v.optional(syncStatusUnion),
		metrics: v.optional(syncMetricsSchema),
		errors: v.optional(v.array(syncErrorSchema)),
		completedAt: v.optional(v.number()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const { syncLogId, ...updates } = args;

		// Remove undefined values
		const patchData: Partial<Doc<"rotessa_sync_log">> = {};
		if (updates.status !== undefined) patchData.status = updates.status;
		if (updates.metrics !== undefined) patchData.metrics = updates.metrics;
		if (updates.errors !== undefined) patchData.errors = updates.errors;
		if (updates.completedAt !== undefined)
			patchData.completedAt = updates.completedAt;

		await ctx.db.patch(syncLogId, patchData);
		return null;
	},
});

/**
 * Get recent sync logs
 */
export const getSyncLogs = internalQuery({
	args: {
		limit: v.optional(v.number()),
		status: v.optional(syncStatusUnion),
	},
	returns: v.array(syncLogSchema),
	handler: async (ctx, args) => {
		const limit = args.limit ?? 20;

		let query = ctx.db.query("rotessa_sync_log").order("desc");

		if (args.status) {
			query = query.filter((q) => q.eq(q.field("status"), args.status));
		}

		return await query.take(limit);
	},
});

/**
 * Get a single sync log by ID
 */
export const getSyncLogById = internalQuery({
	args: { syncLogId: v.id("rotessa_sync_log") },
	returns: v.union(syncLogSchema, v.null()),
	handler: async (ctx, args) => await ctx.db.get(args.syncLogId),
});

// ============================================================================
// Public Queries (Authenticated)
// ============================================================================

const adminQuery = createAuthorizedQuery(["admin"]);
const adminMutation = createAuthorizedMutation(["admin"]);

/**
 * Get sync status overview for admin dashboard
 */
export const getSyncStatus = adminQuery({
	args: {},
	returns: v.object({
		status: v.union(
			v.literal("healthy"),
			v.literal("syncing"),
			v.literal("partial"),
			v.literal("failed")
		),
		message: v.string(),
		lastSync: v.union(
			v.null(),
			v.object({
				completedAt: v.number(),
				transactionsProcessed: v.number(),
				errors: v.number(),
			})
		),
		nextSync: v.optional(v.string()),
		activeSyncId: v.optional(v.id("rotessa_sync_log")),
	}),
	handler: async (ctx: AuthorizedQueryCtx) => {
		// Check for running sync
		const runningSync = await ctx.db
			.query("rotessa_sync_log")
			.withIndex("by_status", (q) => q.eq("status", "running"))
			.first();

		if (runningSync) {
			return {
				status: "syncing" as const,
				message: "Sync in progress",
				lastSync: null,
				activeSyncId: runningSync._id,
			};
		}

		// Get last completed sync
		const lastSync = await ctx.db
			.query("rotessa_sync_log")
			.order("desc")
			.first();

		if (!lastSync) {
			return {
				status: "healthy" as const,
				message: "No sync history",
				lastSync: null,
				nextSync: "Daily at 11 PM UTC",
			};
		}

		const syncStatus =
			lastSync.status === "completed"
				? ("healthy" as const)
				: lastSync.status === "partial"
					? ("partial" as const)
					: ("failed" as const);

		const message =
			syncStatus === "healthy"
				? "All systems normal"
				: syncStatus === "partial"
					? `${lastSync.metrics?.errors ?? 0} errors in last sync`
					: "Last sync failed";

		return {
			status: syncStatus,
			message,
			lastSync: lastSync.completedAt
				? {
						completedAt: lastSync.completedAt,
						transactionsProcessed: lastSync.metrics?.transactionsProcessed ?? 0,
						errors: lastSync.metrics?.errors ?? 0,
					}
				: null,
			nextSync: "Daily at 11 PM UTC",
		};
	},
});

/**
 * Get recent sync logs for admin table
 */
export const getRecentSyncLogs = adminQuery({
	args: {
		limit: v.optional(v.number()),
	},
	returns: v.array(syncLogSchema),
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		const limit = args.limit ?? 10;
		return await ctx.db.query("rotessa_sync_log").order("desc").take(limit);
	},
});

/**
 * Get week metrics for admin dashboard
 */
export const getWeekMetrics = adminQuery({
	args: {},
	returns: v.object({
		totalSynced: v.number(),
		ledgerTransactions: v.number(),
		errors: v.number(),
		successRate: v.number(),
	}),
	handler: async (ctx: AuthorizedQueryCtx) => {
		const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

		const recentSyncs = await ctx.db
			.query("rotessa_sync_log")
			.withIndex("by_started_at")
			.filter((q) => q.gte(q.field("startedAt"), oneWeekAgo))
			.collect();

		const totals = recentSyncs.reduce(
			(acc, sync) => {
				acc.totalSynced += sync.metrics?.transactionsProcessed ?? 0;
				acc.ledgerTransactions += sync.metrics?.ledgerTransactionsCreated ?? 0;
				acc.errors += sync.metrics?.errors ?? 0;
				return acc;
			},
			{ totalSynced: 0, ledgerTransactions: 0, errors: 0 }
		);

		const successRate =
			totals.totalSynced > 0
				? ((totals.totalSynced - totals.errors) / totals.totalSynced) * 100
				: 100;

		return {
			...totals,
			successRate: Math.round(successRate * 10) / 10,
		};
	},
});

// ============================================================================
// Manual Sync Trigger (Task 4.4)
// ============================================================================

/**
 * Trigger a manual sync (admin only)
 */
export const triggerManualSync = adminMutation({
	args: {
		scope: syncScopeUnion,
		entityId: v.optional(v.string()),
		dateRange: v.optional(
			v.object({
				startDate: v.string(),
				endDate: v.string(),
			})
		),
	},
	returns: v.id("rotessa_sync_log"),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}

		// Look up admin user by identity subject (idp_id)
		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", subject))
			.unique();

		if (!user) {
			throw new Error("Admin user not found");
		}
		const triggeredBy = user._id;

		// Check if there's already a running sync
		const runningSync = await ctx.db
			.query("rotessa_sync_log")
			.withIndex("by_status", (q) => q.eq("status", "running"))
			.first();

		if (runningSync) {
			throw new Error("A sync is already in progress");
		}

		// Validate date range if provided
		if (args.dateRange) {
			const start = new Date(args.dateRange.startDate);
			const end = new Date(args.dateRange.endDate);

			if (start > end) {
				throw new Error("Start date must be before end date");
			}

			const diffDays =
				(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
			if (diffDays > 90) {
				throw new Error("Date range cannot exceed 90 days");
			}
		}

		// Create sync log
		const syncLogId = await ctx.db.insert("rotessa_sync_log", {
			syncType: "manual",
			scope: args.scope,
			entityId: args.entityId,
			status: "running",
			triggeredBy,
			startedAt: Date.now(),
			dateRange: args.dateRange,
		});

		// Schedule the actual sync action
		await ctx.scheduler.runAfter(0, internal.rotessaSync.performSync, {
			syncLogId,
			scope: args.scope,
			entityId: args.entityId,
			startDate: args.dateRange?.startDate,
			endDate: args.dateRange?.endDate,
		});

		return syncLogId;
	},
});

// ============================================================================
// Internal Sync Actions (Task 4.1)
// ============================================================================

/**
 * Perform the actual sync operation
 */
export const performSync = internalAction({
	args: {
		syncLogId: v.id("rotessa_sync_log"),
		scope: syncScopeUnion,
		entityId: v.optional(v.string()),
		startDate: v.optional(v.string()),
		endDate: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const metrics = {
			transactionsProcessed: 0,
			paymentsCreated: 0,
			paymentsUpdated: 0,
			ledgerTransactionsCreated: 0,
			errors: 0,
		};
		const errors: {
			transactionId: string;
			error: string;
			timestamp: number;
		}[] = [];

		try {
			// Import Rotessa client dynamically (only available in actions)
			const { getRotessaClient } = await import("../lib/rotessa");
			const client = getRotessaClient();

			// Determine date range
			const endDate = args.endDate ?? new Date().toISOString().split("T")[0];
			const startDate =
				args.startDate ??
				new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];

			// Fetch transactions from Rotessa
			const transactions = await client.transactionReport.list({
				start_date: startDate,
				end_date: endDate,
			});

			// Process each transaction
			for (const transaction of transactions) {
				try {
					// Filter by scope if needed
					if (
						args.scope === "borrower" &&
						args.entityId &&
						String(transaction.customer_id) !== args.entityId
					) {
						continue;
					}

					metrics.transactionsProcessed++;

					// Process the transaction
					const result = await ctx.runMutation(
						internal.rotessaSync.processTransaction,
						{
							transactionId: transaction.id,
							customerId: transaction.customer_id,
							customIdentifier: transaction.custom_identifier ?? undefined,
							scheduleId: transaction.transaction_schedule_id,
							amount: transaction.amount,
							status: transaction.status,
							statusReason: transaction.status_reason ?? undefined,
							processDate: transaction.process_date,
							settlementDate: transaction.settlement_date ?? undefined,
						}
					);

					if (result.created) {
						metrics.paymentsCreated++;
					} else if (result.updated) {
						metrics.paymentsUpdated++;
					}

					// Record to ledger if payment is approved/cleared
					if (transaction.status === "Approved" && result.paymentId) {
						try {
							await ctx.runMutation(
								internal.rotessaSync.recordPaymentToLedger,
								{
									paymentId: result.paymentId,
									amount: transaction.amount,
								}
							);
							metrics.ledgerTransactionsCreated++;
						} catch (ledgerError) {
							// Log ledger error but don't fail the sync
							const errorMessage =
								ledgerError instanceof Error
									? ledgerError.message
									: "Ledger recording failed";
							errors.push({
								transactionId: String(transaction.id),
								error: `Ledger: ${errorMessage}`,
								timestamp: Date.now(),
							});
							metrics.errors++;
						}
					}
				} catch (itemError) {
					// Per-item error isolation
					const errorMessage =
						itemError instanceof Error ? itemError.message : "Unknown error";
					errors.push({
						transactionId: String(transaction.id),
						error: errorMessage,
						timestamp: Date.now(),
					});
					metrics.errors++;
				}
			}

			// Update sync log with results
			const status =
				metrics.errors === 0
					? "completed"
					: metrics.errors < metrics.transactionsProcessed
						? "partial"
						: "failed";

			await ctx.runMutation(internal.rotessaSync.updateSyncLog, {
				syncLogId: args.syncLogId,
				status,
				metrics,
				errors: errors.length > 0 ? errors : undefined,
				completedAt: Date.now(),
			});
		} catch (error) {
			// Sync-level failure
			const errorMessage =
				error instanceof Error ? error.message : "Sync failed";
			errors.push({
				transactionId: "sync",
				error: errorMessage,
				timestamp: Date.now(),
			});

			await ctx.runMutation(internal.rotessaSync.updateSyncLog, {
				syncLogId: args.syncLogId,
				status: "failed",
				metrics,
				errors,
				completedAt: Date.now(),
			});
		}
	},
});

/**
 * Process a single Rotessa transaction
 */
export const processTransaction = internalMutation({
	args: {
		transactionId: v.number(),
		customerId: v.number(),
		customIdentifier: v.optional(v.string()),
		scheduleId: v.number(),
		amount: v.string(),
		status: v.string(),
		statusReason: v.optional(v.string()),
		processDate: v.string(),
		settlementDate: v.optional(v.string()),
		paymentMetadata: v.optional(v.any()),
		transactionSchedule: v.optional(v.any()),
	},
	returns: v.object({
		paymentId: v.optional(v.id("payments")),
		created: v.boolean(),
		updated: v.boolean(),
	}),
	handler: async (ctx, args) => {
		// Find existing payment by Rotessa transaction ID
		const existingPayment = await ctx.db
			.query("payments")
			.filter((q) =>
				q.eq(q.field("rotessaTransactionId"), String(args.transactionId))
			)
			.first();

		// Map Rotessa status to our payment status
		const paymentStatus = mapRotessaStatus(args.status);

		if (existingPayment) {
			// Update existing payment
			await ctx.db.patch(existingPayment._id, {
				status: paymentStatus,
				rotessaStatus: args.status,
				rotessaStatusReason: args.statusReason,
				settlementDate: args.settlementDate,
				paymentMetadata: args.paymentMetadata ?? existingPayment.paymentMetadata,
				transactionSchedule:
					args.transactionSchedule ?? existingPayment.transactionSchedule,
				updatedAt: new Date().toISOString(),
			});

			return {
				paymentId: existingPayment._id,
				created: false,
				updated: true,
			};
		}

		// Find borrower by Rotessa customer ID
		const borrower = await ctx.db
			.query("borrowers")
			.withIndex("by_rotessa_customer_id", (q) =>
				q.eq("rotessaCustomerId", String(args.customerId))
			)
			.first();

		if (!borrower) {
			throw new Error(
				`Borrower not found for Rotessa customer ${args.customerId}`
			);
		}

		// Find mortgage by Rotessa schedule ID
		const mortgage = await ctx.db
			.query("mortgages")
			.filter((q) => q.eq(q.field("rotessaScheduleId"), args.scheduleId))
			.first();

		if (!mortgage) {
			throw new Error(
				`Mortgage not found for Rotessa schedule ${args.scheduleId}`
			);
		}

		// Create new payment
		const paymentId = await ctx.db.insert("payments", {
			// Required fields
			mortgageId: mortgage._id,
			amount: Number.parseFloat(args.amount),
			processDate: args.processDate,
			status: paymentStatus,
			paymentId: String(args.transactionId), // Use transaction ID as payment ID
			customerId: String(args.customerId),
			transactionScheduleId: String(args.scheduleId),
			// Optional fields
			borrowerId: borrower._id,
			currency: "CAD",
			paymentType: "interest_only",
			dueDate: args.processDate,
			paidDate: paymentStatus === "cleared" ? args.settlementDate : undefined,
			settlementDate: args.settlementDate,
			rotessaTransactionId: String(args.transactionId),
			rotessaScheduleId: args.scheduleId,
			rotessaStatus: args.status,
			rotessaStatusReason: args.statusReason,
			paymentMetadata: args.paymentMetadata,
			transactionSchedule: args.transactionSchedule,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		return {
			paymentId,
			created: true,
			updated: false,
		};
	},
});

/**
 * Record payment to Formance Ledger
 *
 * Creates ledger entries for the payment collection flow:
 * 1. @world → borrower:{rotessaCustomerId}:rotessa (Payment ingress)
 * 2. borrower:... → mortgage:{mortgageId}:trust (Clear to trust)
 *
 * Uses idempotency key to prevent duplicate ledger entries.
 */
export const recordPaymentToLedger = internalMutation({
	args: {
		paymentId: v.id("payments"),
		amount: v.string(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		// Get the payment with related entities
		const payment = await ctx.db.get(args.paymentId);
		if (!payment) {
			throw new Error("Payment not found");
		}

		// Skip if already recorded
		if (payment.ledgerTransactionId) {
			return null;
		}

		// Get the mortgage to find the borrower
		const mortgage = await ctx.db.get(payment.mortgageId);
		if (!mortgage) {
			throw new Error("Mortgage not found for payment");
		}

		// Get the borrower for Rotessa customer ID
		const borrower = await ctx.db.get(mortgage.borrowerId);
		if (!borrower) {
			throw new Error("Borrower not found for mortgage");
		}

		// Generate idempotency reference
		const reference = `payment:${args.paymentId}:${payment.mortgageId}`;

		// Convert amount to cents (integer for Formance)
		const amountCents = Math.round(Number.parseFloat(args.amount) * 100);

		// Schedule the ledger recording action
		// CRITICAL: Actions must be scheduled, never called directly from mutations
		await ctx.scheduler.runAfter(0, internal.ledger.recordPaymentCollection, {
			paymentId: args.paymentId as string,
			mortgageId: payment.mortgageId as string,
			rotessaCustomerId: borrower.rotessaCustomerId,
			amountCents,
			reference,
		});

		// Mark payment with pending ledger reference
		// The action will update this with the actual transaction ID
		await ctx.db.patch(args.paymentId, {
			ledgerTransactionId: `pending:${reference}`,
			updatedAt: new Date().toISOString(),
		});

		return null;
	},
});

// ============================================================================
// CRON Handler (Task 4.3)
// ============================================================================

/**
 * Daily sync handler for CRON job
 */
export const performDailySync = internalAction({
	args: {},
	handler: async (ctx) => {
		// Create sync log
		const syncLogId = await ctx.runMutation(
			internal.rotessaSync.createSyncLog,
			{
				syncType: "daily",
				scope: "all",
			}
		);

		// Perform sync
		await ctx.runAction(internal.rotessaSync.performSync, {
			syncLogId,
			scope: "all",
		});
	},
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map Rotessa transaction status to our payment status
 */
function mapRotessaStatus(
	rotessaStatus: string
): "pending" | "processing" | "cleared" | "failed" | "nsf" {
	switch (rotessaStatus) {
		case "Future":
		case "Pending":
			return "pending";
		case "Approved":
			return "cleared";
		case "Declined":
			return "failed";
		case "Chargeback":
			return "nsf";
		default:
			return "pending";
	}
}

/**
 * Convert Rotessa settlement_date (YYYY-MM-DD) to Formance ISO 8601 timestamp
 * CRITICAL: Formance requires full ISO 8601 format with time component
 */
function toFormanceTimestamp(settlementDate: string): string {
	return `${settlementDate}T00:00:00Z`;
}

// ============================================================================
// Historical Payment Backfill (Schedule Linking)
// ============================================================================

/**
 * Create a backfill log entry
 * CRITICAL: Must be called BEFORE processing starts for audit trail
 */
export const createBackfillLog = internalMutation({
	args: {
		mortgageId: v.id("mortgages"),
		scheduleId: v.number(),
		triggeredBy: v.optional(v.id("users")),
	},
	returns: v.id("backfill_log"),
	handler: async (ctx, args) => {
		return await ctx.db.insert("backfill_log", {
			mortgageId: args.mortgageId,
			scheduleId: args.scheduleId,
			triggeredBy: args.triggeredBy,
			status: "running",
			startedAt: Date.now(),
		});
	},
});

/**
 * Update a backfill log entry with results
 */
export const updateBackfillLog = internalMutation({
	args: {
		logId: v.id("backfill_log"),
		status: v.union(
			v.literal("running"),
			v.literal("completed"),
			v.literal("partial"),
			v.literal("failed")
		),
		metrics: v.optional(
			v.object({
				transactionsFound: v.number(),
				paymentsCreated: v.number(),
				ledgerTransactionsCreated: v.number(),
				errors: v.number(),
			})
		),
		errors: v.optional(
			v.array(
				v.object({
					transactionId: v.number(),
					error: v.string(),
				})
			)
		),
		completedAt: v.optional(v.number()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await ctx.db.patch(args.logId, {
			status: args.status,
			metrics: args.metrics,
			errors: args.errors,
			completedAt: args.completedAt,
		});
		return null;
	},
});

/**
 * Backfill historical payments from Rotessa to Formance
 *
 * Called when linking a schedule with backfill enabled.
 * Fetches all Approved transactions for the schedule and records them
 * to Formance with proper bi-temporal settlement dates.
 *
 * Key behaviors:
 * - Creates backfill_log BEFORE processing for audit trail
 * - Only processes Approved transactions with settlement_date
 * - Converts settlement_date to ISO 8601 for Formance
 * - Uses backfill: reference prefix for idempotency
 * - Handles pagination for large transaction histories
 * - Per-payment error isolation (doesn't fail entire backfill)
 */
export const backfillHistoricalPayments = internalAction({
	args: {
		mortgageId: v.id("mortgages"),
		scheduleId: v.number(),
		triggeredBy: v.optional(v.id("users")),
	},
	handler: async (ctx, args) => {
		// CRITICAL: Create log BEFORE any processing for audit trail
		const logId = await ctx.runMutation(
			internal.rotessaSync.createBackfillLog,
			{
				mortgageId: args.mortgageId,
				scheduleId: args.scheduleId,
				triggeredBy: args.triggeredBy,
			}
		);

		const metrics = {
			transactionsFound: 0,
			paymentsCreated: 0,
			ledgerTransactionsCreated: 0,
			errors: 0,
		};
		const errors: { transactionId: number; error: string }[] = [];

		try {
			// Import Rotessa client dynamically
			const { getRotessaClient } = await import("../lib/rotessa");
			const client = getRotessaClient();

			// Get mortgage and borrower for the backfill
			const mortgage = (await ctx.runQuery(
				internal.mortgages.getMortgageByIdInternal,
				{ mortgageId: args.mortgageId }
			)) as Doc<"mortgages"> | null;

			if (!mortgage) {
				throw new Error(`Mortgage ${args.mortgageId} not found`);
			}

			const borrower = (await ctx.runQuery(
				internal.borrowers.getBorrowerByIdInternal,
				{ borrowerId: mortgage.borrowerId }
			)) as Doc<"borrowers"> | null;

			if (!borrower) {
				throw new Error(
					`Borrower ${mortgage.borrowerId} not found for mortgage`
				);
			}

			// Fetch ALL historical transactions with pagination
			// Go back 2 years to capture all historical data
			const startDate = new Date();
			startDate.setFullYear(startDate.getFullYear() - 2);
			const startDateStr = startDate.toISOString().split("T")[0]!;
			const endDateStr = new Date().toISOString().split("T")[0]!;

			const allTransactions: Array<{
				id: number;
				customer_id: number;
				transaction_schedule_id: number;
				amount: string;
				status: string;
				settlement_date: string | null;
				process_date: string;
			}> = [];

			// CRITICAL: Handle pagination - don't assume single page
			let page = 1;
			while (true) {
				const batch = await client.transactionReport.list({
					start_date: startDateStr,
					end_date: endDateStr,
					page,
				});

				if (batch.length === 0) break;
				allTransactions.push(...batch);
				page++;
			}

			// Filter to only this schedule's Approved transactions with settlement_date
			const scheduleTransactions = allTransactions.filter(
				(tx) =>
					tx.transaction_schedule_id === args.scheduleId &&
					tx.status === "Approved" &&
					tx.settlement_date !== null
			);

			metrics.transactionsFound = scheduleTransactions.length;

			// Process each Approved transaction
			for (const transaction of scheduleTransactions) {
				try {
					// First, create/update the payment record
					const processResult = await ctx.runMutation(
						internal.rotessaSync.processTransaction,
						{
							transactionId: transaction.id,
							customerId: transaction.customer_id,
							scheduleId: transaction.transaction_schedule_id,
							amount: transaction.amount,
							status: transaction.status,
							processDate: transaction.process_date,
							settlementDate: transaction.settlement_date ?? undefined,
						}
					);

					if (processResult.created) {
						metrics.paymentsCreated++;
					}

					// Now record to ledger with bi-temporal timestamp
					if (processResult.paymentId && transaction.settlement_date) {
						// Convert amount to cents
						const amountCents = Math.round(
							Number.parseFloat(transaction.amount) * 100
						);

						// Use backfill: prefix for idempotency
						const reference = `backfill:${processResult.paymentId}:${args.mortgageId}`;

						// Convert settlement_date to ISO 8601
						const effectiveTimestamp = toFormanceTimestamp(
							transaction.settlement_date
						);

						// Record to ledger with effectiveTimestamp for bi-temporal backdating
						const ledgerResult = await ctx.runAction(
							internal.ledger.recordPaymentCollection,
							{
								paymentId: processResult.paymentId as string,
								mortgageId: args.mortgageId as string,
								rotessaCustomerId: borrower.rotessaCustomerId,
								amountCents,
								reference,
								effectiveTimestamp,
							}
						);

						if (ledgerResult.success) {
							metrics.ledgerTransactionsCreated++;
						} else if (ledgerResult.error) {
							errors.push({
								transactionId: transaction.id,
								error: ledgerResult.error,
							});
							metrics.errors++;
						}
					}
				} catch (itemError) {
					// Per-payment error isolation
					const errorMessage =
						itemError instanceof Error ? itemError.message : "Unknown error";
					errors.push({
						transactionId: transaction.id,
						error: errorMessage,
					});
					metrics.errors++;
				}
			}

			// Determine final status
			const status =
				metrics.errors === 0
					? "completed"
					: metrics.errors < metrics.transactionsFound
						? "partial"
						: "failed";

			// Update log with results
			await ctx.runMutation(internal.rotessaSync.updateBackfillLog, {
				logId,
				status,
				metrics,
				errors: errors.length > 0 ? errors : undefined,
				completedAt: Date.now(),
			});
		} catch (error) {
			// Sync-level failure
			const errorMessage =
				error instanceof Error ? error.message : "Backfill failed";

			await ctx.runMutation(internal.rotessaSync.updateBackfillLog, {
				logId,
				status: "failed",
				metrics,
				errors: [{ transactionId: 0, error: errorMessage }],
				completedAt: Date.now(),
			});
		}
	},
});

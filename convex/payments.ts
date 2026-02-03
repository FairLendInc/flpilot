/**
 * Payment history management
 * Front-end view of Rotessa payment data (interest-only payments)
 */

import { v } from "convex/values";
import {
	authenticatedMutation,
	authenticatedQuery,
} from "./lib/authorizedFunctions";

/**
 * Get payment history for a mortgage (ordered by most recent first)
 */
export const getPaymentsForMortgage = authenticatedQuery({
	args: { mortgageId: v.id("mortgages") },
	returns: v.array(v.any()),
	handler: async (ctx, args) =>
		await ctx.db
			.query("payments")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.mortgageId))
			.order("desc")
			.collect(),
});

/**
 * Get payments by status
 */
export const getPaymentsByStatus = authenticatedQuery({
	args: {
		status: v.union(
			v.literal("pending"),
			v.literal("cleared"),
			v.literal("failed")
		),
	},
	returns: v.array(v.any()),
	handler: async (ctx, args) =>
		await ctx.db
			.query("payments")
			.withIndex("by_status", (q) => q.eq("status", args.status))
			.collect(),
});

/**
 * Get payments within a date range
 */
export const getPaymentsByDateRange = authenticatedQuery({
	args: {
		startDate: v.string(),
		endDate: v.string(),
	},
	returns: v.array(v.any()),
	handler: async (ctx, args) =>
		await ctx.db
			.query("payments")
			.withIndex("by_process_date")
			.filter((q) =>
				q.and(
					q.gte(q.field("processDate"), args.startDate),
					q.lte(q.field("processDate"), args.endDate)
				)
			)
			.collect(),
});

/**
 * Get payment by Rotessa payment ID (for idempotency/webhook reconciliation)
 */
export const getPaymentByRotessaId = authenticatedQuery({
	args: { paymentId: v.string() },
	returns: v.union(v.any(), v.null()),
	handler: async (ctx, args) =>
		await ctx.db
			.query("payments")
			.withIndex("by_payment_id", (q) => q.eq("paymentId", args.paymentId))
			.first(),
});

/**
 * Create a payment record
 */
export const createPayment = authenticatedMutation({
	args: {
		mortgageId: v.id("mortgages"),
		amount: v.number(),
		processDate: v.string(),
		status: v.union(
			v.literal("pending"),
			v.literal("cleared"),
			v.literal("failed")
		),
		paymentId: v.string(),
		customerId: v.string(),
		transactionScheduleId: v.optional(v.string()),
		transactionSchedule: v.optional(v.any()),
		paymentMetadata: v.optional(v.any()),
	},
	returns: v.id("payments"),
	handler: async (ctx, args) => {
		// Validate amount
		if (args.amount <= 0) {
			throw new Error("Payment amount must be greater than 0");
		}

		// Validate mortgage exists
		const mortgage = await ctx.db.get(args.mortgageId);
		if (!mortgage) {
			throw new Error("Mortgage not found");
		}

		return await ctx.db.insert("payments", {
			mortgageId: args.mortgageId,
			amount: args.amount,
			processDate: args.processDate,
			status: args.status,
			paymentId: args.paymentId,
			customerId: args.customerId,
			transactionScheduleId: args.transactionScheduleId,
			transactionSchedule: args.transactionSchedule,
			paymentMetadata: args.paymentMetadata,
		});
	},
});

/**
 * Update payment status (for Rotessa sync)
 */
export const updatePaymentStatus = authenticatedMutation({
	args: {
		id: v.id("payments"),
		status: v.union(
			v.literal("pending"),
			v.literal("cleared"),
			v.literal("failed")
		),
		processDate: v.optional(v.string()),
	},
	returns: v.id("payments"),
	handler: async (ctx, args) => {
		const { id, ...updates } = args;

		await ctx.db.patch(id, updates);
		return id;
	},
});

/**
 * Bulk create payments (for payment schedule creation)
 */
export const bulkCreatePayments = authenticatedMutation({
	args: {
		payments: v.array(
			v.object({
				mortgageId: v.id("mortgages"),
				amount: v.number(),
				processDate: v.string(),
				status: v.union(
					v.literal("pending"),
					v.literal("cleared"),
					v.literal("failed")
				),
				paymentId: v.string(),
				customerId: v.string(),
				transactionScheduleId: v.optional(v.string()),
				transactionSchedule: v.optional(v.any()),
				paymentMetadata: v.optional(v.any()),
			})
		),
	},
	returns: v.array(v.id("payments")),
	handler: async (ctx, args) => {
		// Validate amounts
		for (const payment of args.payments) {
			if (payment.amount <= 0) {
				throw new Error("Payment amount must be greater than 0");
			}
		}

		// Collect unique mortgage IDs
		const uniqueMortgageIds = Array.from(
			new Set(args.payments.map((p) => p.mortgageId))
		);

		// Fetch all referenced mortgages
		const mortgages = await Promise.all(
			uniqueMortgageIds.map((id) => ctx.db.get(id))
		);

		// Check if any mortgage is missing
		const missingMortgageIds = uniqueMortgageIds.filter(
			(_id, index) => !mortgages[index]
		);

		if (missingMortgageIds.length > 0) {
			throw new Error("Mortgage not found");
		}

		// Insert all payments
		const ids = await Promise.all(
			args.payments.map((payment) => ctx.db.insert("payments", payment))
		);

		return ids;
	},
});

/**
 * Sync payment from Rotessa webhook (idempotent)
 */
export const syncPaymentFromRotessa = authenticatedMutation({
	args: {
		paymentId: v.string(),
		mortgageId: v.id("mortgages"),
		amount: v.number(),
		processDate: v.string(),
		status: v.union(
			v.literal("pending"),
			v.literal("cleared"),
			v.literal("failed")
		),
		customerId: v.string(),
		transactionScheduleId: v.optional(v.string()),
		transactionSchedule: v.optional(v.any()),
		paymentMetadata: v.optional(v.any()),
	},
	returns: v.id("payments"),
	handler: async (ctx, args) => {
		// Check if payment already exists
		const existing = await ctx.db
			.query("payments")
			.withIndex("by_payment_id", (q) => q.eq("paymentId", args.paymentId))
			.first();

		if (existing) {
			// Update existing payment (idempotent webhook handling)
			await ctx.db.patch(existing._id, {
				status: args.status,
				processDate: args.processDate,
				amount: args.amount,
			});
			return existing._id;
		}

		// Create new payment
		return await ctx.db.insert("payments", {
			mortgageId: args.mortgageId,
			amount: args.amount,
			processDate: args.processDate,
			status: args.status,
			paymentId: args.paymentId,
			customerId: args.customerId,
			transactionScheduleId: args.transactionScheduleId,
			transactionSchedule: args.transactionSchedule,
			paymentMetadata: args.paymentMetadata,
		});
	},
});

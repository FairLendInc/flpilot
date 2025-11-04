/**
 * Payment history management
 * Front-end view of Rotessa payment data (interest-only payments)
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get payment history for a mortgage (ordered by most recent first)
 */
export const getPaymentsForMortgage = query({
	args: { mortgageId: v.id("mortgages") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("payments")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.mortgageId))
			.order("desc")
			.collect();
	},
});

/**
 * Get payments by status
 */
export const getPaymentsByStatus = query({
	args: {
		status: v.union(
			v.literal("pending"),
			v.literal("cleared"),
			v.literal("failed")
		),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("payments")
			.withIndex("by_status", (q) => q.eq("status", args.status))
			.collect();
	},
});

/**
 * Get payments within a date range
 */
export const getPaymentsByDateRange = query({
	args: {
		startDate: v.string(),
		endDate: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("payments")
			.withIndex("by_process_date")
			.filter((q) =>
				q.and(
					q.gte(q.field("processDate"), args.startDate),
					q.lte(q.field("processDate"), args.endDate)
				)
			)
			.collect();
	},
});

/**
 * Get payment by Rotessa payment ID (for idempotency/webhook reconciliation)
 */
export const getPaymentByRotessaId = query({
	args: { paymentId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("payments")
			.withIndex("by_payment_id", (q) => q.eq("paymentId", args.paymentId))
			.first();
	},
});

/**
 * Create a payment record
 */
export const createPayment = mutation({
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
		transactionScheduleId: v.string(),
	},
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
		});
	},
});

/**
 * Update payment status (for Rotessa sync)
 */
export const updatePaymentStatus = mutation({
	args: {
		id: v.id("payments"),
		status: v.union(
			v.literal("pending"),
			v.literal("cleared"),
			v.literal("failed")
		),
		processDate: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;

		await ctx.db.patch(id, updates);
		return id;
	},
});

/**
 * Bulk create payments (for payment schedule creation)
 */
export const bulkCreatePayments = mutation({
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
				transactionScheduleId: v.string(),
			})
		),
	},
	handler: async (ctx, args) => {
		const ids = await Promise.all(
			args.payments.map((payment) => ctx.db.insert("payments", payment))
		);

		return ids;
	},
});

/**
 * Sync payment from Rotessa webhook (idempotent)
 */
export const syncPaymentFromRotessa = mutation({
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
		transactionScheduleId: v.string(),
	},
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
		});
	},
});

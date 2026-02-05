/**
 * Borrower profile management
 * Minimal borrower data with Rotessa payment processor integration
 */

import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, internalQuery } from "./_generated/server";
import {
	authenticatedMutation,
	authenticatedQuery,
} from "./lib/authorizedFunctions";
import { paginateByCreation } from "./lib/webhookPagination";

/**
 * Schema for borrower document (includes Convex system fields)
 */
const borrowerSchema = v.object({
	_id: v.id("borrowers"),
	_creationTime: v.number(),
	name: v.string(),
	email: v.string(),
	phone: v.optional(v.string()),
	rotessaCustomerId: v.string(),
});

/**
 * Get a borrower by ID
 */
export const getBorrower = authenticatedQuery({
	args: { id: v.id("borrowers") },
	returns: v.union(borrowerSchema, v.null()),
	handler: async (ctx, args) => await ctx.db.get(args.id),
});

/**
 * Get borrower by Rotessa customer ID (for payment reconciliation)
 */
export const getBorrowerByRotessaId = authenticatedQuery({
	args: { rotessaCustomerId: v.string() },
	returns: v.union(borrowerSchema, v.null()),
	handler: async (ctx, args) =>
		await ctx.db
			.query("borrowers")
			.withIndex("by_rotessa_customer_id", (q) =>
				q.eq("rotessaCustomerId", args.rotessaCustomerId)
			)
			.first(),
});

/**
 * List all borrowers (paginated for admin)
 */
export const listBorrowers = authenticatedQuery({
	args: {},
	returns: v.array(borrowerSchema),
	handler: async (ctx) => await ctx.db.query("borrowers").collect(),
});

/**
 * Search borrowers by email
 */
export const searchBorrowersByEmail = authenticatedQuery({
	args: { email: v.string() },
	returns: v.array(borrowerSchema),
	handler: async (ctx, args) =>
		await ctx.db
			.query("borrowers")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.collect(),
});

/**
 * Create a new borrower
 */
export const createBorrower = authenticatedMutation({
	args: {
		name: v.string(),
		email: v.string(),
		rotessaCustomerId: v.string(),
	},
	returns: v.id("borrowers"),
	handler: async (ctx, args) => {
		// Validate email format
		if (!args.email.includes("@")) {
			throw new Error("Invalid email format");
		}

		// Check for duplicate Rotessa customer ID
		const existing = await ctx.db
			.query("borrowers")
			.withIndex("by_rotessa_customer_id", (q) =>
				q.eq("rotessaCustomerId", args.rotessaCustomerId)
			)
			.first();

		if (existing) {
			throw new Error(
				`Borrower with Rotessa customer ID ${args.rotessaCustomerId} already exists`
			);
		}

		// Create borrower
		return await ctx.db.insert("borrowers", {
			name: args.name,
			email: args.email,
			rotessaCustomerId: args.rotessaCustomerId,
		});
	},
});

/**
 * Update borrower profile (name and email only, rotessaCustomerId is immutable)
 */
export const updateBorrower = authenticatedMutation({
	args: {
		id: v.id("borrowers"),
		name: v.optional(v.string()),
		email: v.optional(v.string()),
	},
	returns: v.id("borrowers"),
	handler: async (ctx, args) => {
		const { id, ...updates } = args;

		// Validate email format if provided
		if (updates.email && !updates.email.includes("@")) {
			throw new Error("Invalid email format");
		}

		await ctx.db.patch(id, updates);
		return id;
	},
});

const borrowerListResultValidator = v.object({
	borrowers: v.array(borrowerSchema),
	nextCursor: v.optional(v.string()),
	hasMore: v.boolean(),
	total: v.number(),
});

const normalizeContainsValue = (value?: string | null) =>
	value?.trim().toLowerCase() ?? undefined;

const paginateBorrowers = (
	items: Doc<"borrowers">[],
	limit: number,
	cursor?: string | null
) => {
	const paginated = paginateByCreation(items, limit, cursor);
	return {
		borrowers: paginated.items,
		nextCursor: paginated.nextCursor,
		hasMore: paginated.hasMore,
		total: paginated.total,
	};
};

/**
 * Internal: Create a borrower with idempotency by rotessaCustomerId.
 */
export const createBorrowerInternal = internalMutation({
	args: {
		name: v.string(),
		email: v.string(),
		phone: v.optional(v.string()),
		rotessaCustomerId: v.string(),
	},
	returns: v.object({
		borrowerId: v.id("borrowers"),
		created: v.boolean(),
	}),
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("borrowers")
			.withIndex("by_rotessa_customer_id", (q) =>
				q.eq("rotessaCustomerId", args.rotessaCustomerId)
			)
			.first();

		if (existing) {
			return { borrowerId: existing._id, created: false };
		}

		const borrowerId = await ctx.db.insert("borrowers", {
			name: args.name,
			email: args.email,
			phone: args.phone,
			rotessaCustomerId: args.rotessaCustomerId,
		});

		return { borrowerId, created: true };
	},
});

/**
 * Internal: Get borrower by borrowerId, rotessaCustomerId, or email.
 */
export const getBorrowerInternal = internalQuery({
	args: {
		borrowerId: v.optional(v.id("borrowers")),
		rotessaCustomerId: v.optional(v.string()),
		email: v.optional(v.string()),
	},
	returns: v.union(borrowerSchema, v.null()),
	handler: async (ctx, args) => {
		if (args.borrowerId) {
			return await ctx.db.get(args.borrowerId);
		}
		if (args.rotessaCustomerId) {
			const rotessaId = args.rotessaCustomerId;
			return await ctx.db
				.query("borrowers")
				.withIndex("by_rotessa_customer_id", (q) =>
					q.eq("rotessaCustomerId", rotessaId)
				)
				.first();
		}
		if (args.email) {
			const email = args.email;
			return await ctx.db
				.query("borrowers")
				.withIndex("by_email", (q) => q.eq("email", email))
				.first();
		}
		return null;
	},
});

/**
 * Internal: List borrowers with optional filters and cursor pagination.
 */
export const listBorrowersInternal = internalQuery({
	args: {
		emailContains: v.optional(v.string()),
		nameContains: v.optional(v.string()),
		createdAfter: v.optional(v.string()),
		createdBefore: v.optional(v.string()),
		limit: v.optional(v.number()),
		cursor: v.optional(v.string()),
	},
	returns: borrowerListResultValidator,
	handler: async (ctx, args) => {
		const emailContains = normalizeContainsValue(args.emailContains);
		const nameContains = normalizeContainsValue(args.nameContains);
		const createdAfter = args.createdAfter
			? Date.parse(args.createdAfter)
			: null;
		const createdBefore = args.createdBefore
			? Date.parse(args.createdBefore)
			: null;

		const borrowers = await ctx.db.query("borrowers").collect();
		const filtered = borrowers.filter((borrower) => {
			if (
				emailContains &&
				!borrower.email.toLowerCase().includes(emailContains)
			) {
				return false;
			}
			if (nameContains && !borrower.name.toLowerCase().includes(nameContains)) {
				return false;
			}
			if (createdAfter && borrower._creationTime <= createdAfter) {
				return false;
			}
			if (createdBefore && borrower._creationTime >= createdBefore) {
				return false;
			}
			return true;
		});

		const limit = Math.min(Math.max(args.limit ?? 100, 1), 500);
		return paginateBorrowers(filtered, limit, args.cursor);
	},
});

/**
 * Internal: Update borrower fields by borrowerId or rotessaCustomerId.
 */
export const updateBorrowerInternal = internalMutation({
	args: {
		borrowerId: v.optional(v.id("borrowers")),
		rotessaCustomerId: v.optional(v.string()),
		name: v.optional(v.string()),
		email: v.optional(v.string()),
		phone: v.optional(v.string()),
	},
	returns: v.object({ borrowerId: v.id("borrowers") }),
	handler: async (ctx, args) => {
		let borrower: Doc<"borrowers"> | null = null;
		if (args.borrowerId) {
			borrower = await ctx.db.get(args.borrowerId);
		} else if (args.rotessaCustomerId) {
			const rotessaId = args.rotessaCustomerId;
			borrower = await ctx.db
				.query("borrowers")
				.withIndex("by_rotessa_customer_id", (q) =>
					q.eq("rotessaCustomerId", rotessaId)
				)
				.first();
		}

		if (!borrower) {
			throw new Error("borrower_not_found");
		}

		const updates: Partial<Doc<"borrowers">> = {};
		if (args.name !== undefined) {
			updates.name = args.name;
		}
		if (args.email !== undefined) {
			updates.email = args.email;
		}
		if (args.phone !== undefined) {
			updates.phone = args.phone;
		}

		await ctx.db.patch(borrower._id, updates);
		return { borrowerId: borrower._id };
	},
});

/**
 * Internal: Delete borrower, optionally cascading mortgages when force is true.
 */
export const deleteBorrowerInternal = internalMutation({
	args: {
		borrowerId: v.optional(v.id("borrowers")),
		rotessaCustomerId: v.optional(v.string()),
		force: v.optional(v.boolean()),
	},
	returns: v.object({
		borrowerId: v.id("borrowers"),
		deleted: v.boolean(),
		mortgageCount: v.optional(v.number()),
	}),
	handler: async (ctx, args) => {
		let borrower: Doc<"borrowers"> | null = null;
		if (args.borrowerId) {
			borrower = await ctx.db.get(args.borrowerId);
		} else if (args.rotessaCustomerId) {
			const rotessaId = args.rotessaCustomerId;
			borrower = await ctx.db
				.query("borrowers")
				.withIndex("by_rotessa_customer_id", (q) =>
					q.eq("rotessaCustomerId", rotessaId)
				)
				.first();
		}

		if (!borrower) {
			throw new Error("borrower_not_found");
		}

		const mortgages = await ctx.db
			.query("mortgages")
			.withIndex("by_borrower", (q) => q.eq("borrowerId", borrower._id))
			.collect();

		if (mortgages.length > 0 && !args.force) {
			return {
				borrowerId: borrower._id,
				deleted: false,
				mortgageCount: mortgages.length,
			};
		}

		if (mortgages.length > 0 && args.force) {
			for (const mortgage of mortgages) {
				await ctx.runMutation(internal.mortgages.deleteMortgageInternal, {
					mortgageId: mortgage._id as Id<"mortgages">,
					force: true,
				});
			}
		}

		await ctx.db.delete(borrower._id);
		return { borrowerId: borrower._id, deleted: true };
	},
});

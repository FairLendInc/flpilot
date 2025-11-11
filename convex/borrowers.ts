/**
 * Borrower profile management
 * Minimal borrower data with Rotessa payment processor integration
 */

import { v } from "convex/values";
import { authQuery, authMutation } from "./lib/server";

/**
 * Schema for borrower document (includes Convex system fields)
 */
const borrowerSchema = v.object({
	_id: v.id("borrowers"),
	_creationTime: v.number(),
	name: v.string(),
	email: v.string(),
	rotessaCustomerId: v.string(),
});

/**
 * Get a borrower by ID
 */
export const getBorrower = authQuery({
	args: { id: v.id("borrowers") },
	returns: v.union(borrowerSchema, v.null()),
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

/**
 * Get borrower by Rotessa customer ID (for payment reconciliation)
 */
export const getBorrowerByRotessaId = authQuery({
	args: { rotessaCustomerId: v.string() },
	returns: v.union(borrowerSchema, v.null()),
	handler: async (ctx, args) => {
		return await ctx.db
			.query("borrowers")
			.withIndex("by_rotessa_customer_id", (q) =>
				q.eq("rotessaCustomerId", args.rotessaCustomerId)
			)
			.first();
	},
});

/**
 * List all borrowers (paginated for admin)
 */
export const listBorrowers = authQuery({
	args: {},
	returns: v.array(borrowerSchema),
	handler: async (ctx) => {
		return await ctx.db.query("borrowers").collect();
	},
});

/**
 * Search borrowers by email
 */
export const searchBorrowersByEmail = authQuery({
	args: { email: v.string() },
	returns: v.array(borrowerSchema),
	handler: async (ctx, args) => {
		return await ctx.db
			.query("borrowers")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.collect();
	},
});

/**
 * Create a new borrower
 */
export const createBorrower = authMutation({
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
export const updateBorrower = authMutation({
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

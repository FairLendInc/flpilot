/**
 * Borrower profile management
 * Minimal borrower data with Rotessa payment processor integration
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth.config";

/**
 * Get a borrower by ID
 */
export const getBorrower = query({
	args: { id: v.id("borrowers") },
	handler: async (ctx, args) => {
				const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		};
		return await ctx.db.get(args.id);
	},
});

/**
 * Get borrower by Rotessa customer ID (for payment reconciliation)
 */
export const getBorrowerByRotessaId = query({
	args: { rotessaCustomerId: v.string() },
	handler: async (ctx, args) => {
				const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		};
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
export const listBorrowers = query({
	args: {},
	handler: async (ctx) => {
				const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		};
		return await ctx.db.query("borrowers").collect();
	},
});

/**
 * Search borrowers by email
 */
export const searchBorrowersByEmail = query({
	args: { email: v.string() },
	handler: async (ctx, args) => {
				const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		};
		return await ctx.db
			.query("borrowers")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.collect();
	},
});

/**
 * Create a new borrower
 */
export const createBorrower = mutation({
	args: {
		name: v.string(),
		email: v.string(),
		rotessaCustomerId: v.string(),
	},
	handler: async (ctx, args) => {
				const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		};
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
export const updateBorrower = mutation({
	args: {
		id: v.id("borrowers"),
		name: v.optional(v.string()),
		email: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
				const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		};
		const { id, ...updates } = args;

		// Validate email format if provided
		if (updates.email && !updates.email.includes("@")) {
			throw new Error("Invalid email format");
		}

		await ctx.db.patch(id, updates);
		return id;
	},
});

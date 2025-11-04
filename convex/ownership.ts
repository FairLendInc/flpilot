/**
 * Mortgage ownership cap table management
 * Tracks fractional ownership with support for institutional and individual investors
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get cap table for a specific mortgage (all ownership records)
 */
export const getMortgageOwnership = query({
	args: { mortgageId: v.id("mortgages") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("mortgage_ownership")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.mortgageId))
			.order("desc") // Largest owners first
			.collect();
	},
});

/**
 * Get all mortgages owned by a specific investor
 */
export const getUserPortfolio = query({
	args: { userId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("mortgage_ownership")
			.withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
			.collect();
	},
});

/**
 * Check if a user owns a specific mortgage
 */
export const checkOwnership = query({
	args: {
		mortgageId: v.id("mortgages"),
		ownerId: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("mortgage_ownership")
			.withIndex("by_mortgage_owner", (q) =>
				q.eq("mortgageId", args.mortgageId).eq("ownerId", args.ownerId)
			)
			.first();
	},
});

/**
 * Get all mortgages owned by FairLend (institutional portfolio)
 */
export const getInstitutionalPortfolio = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("mortgage_ownership")
			.withIndex("by_owner", (q) => q.eq("ownerId", "fairlend"))
			.collect();
	},
});

/**
 * Create an ownership record
 */
export const createOwnership = mutation({
	args: {
		mortgageId: v.id("mortgages"),
		ownerId: v.string(),
		ownershipPercentage: v.number(),
	},
	handler: async (ctx, args) => {
		// Validate percentage range
		if (
			args.ownershipPercentage < 0 ||
			args.ownershipPercentage > 100
		) {
			throw new Error("Ownership percentage must be between 0 and 100");
		}

		// Validate mortgage exists
		const mortgage = await ctx.db.get(args.mortgageId);
		if (!mortgage) {
			throw new Error("Mortgage not found");
		}

		// Check for duplicate ownership record
		const existing = await ctx.db
			.query("mortgage_ownership")
			.withIndex("by_mortgage_owner", (q) =>
				q.eq("mortgageId", args.mortgageId).eq("ownerId", args.ownerId)
			)
			.first();

		if (existing) {
			throw new Error(
				"Ownership record already exists for this mortgage and owner"
			);
		}

		// Validate ownerId (must be "fairlend" or valid user ID)
		if (args.ownerId !== "fairlend") {
			// For user IDs, we could validate against users table here
			// but keeping it simple for now - application layer handles this
		}

		return await ctx.db.insert("mortgage_ownership", {
			mortgageId: args.mortgageId,
			ownerId: args.ownerId,
			ownershipPercentage: args.ownershipPercentage,
		});
	},
});

/**
 * Update ownership percentage
 */
export const updateOwnershipPercentage = mutation({
	args: {
		id: v.id("mortgage_ownership"),
		ownershipPercentage: v.number(),
	},
	handler: async (ctx, args) => {
		// Validate percentage range
		if (
			args.ownershipPercentage < 0 ||
			args.ownershipPercentage > 100
		) {
			throw new Error("Ownership percentage must be between 0 and 100");
		}

		await ctx.db.patch(args.id, {
			ownershipPercentage: args.ownershipPercentage,
		});
		return args.id;
	},
});

/**
 * Transfer ownership to a new owner
 */
export const transferOwnership = mutation({
	args: {
		id: v.id("mortgage_ownership"),
		newOwnerId: v.string(),
	},
	handler: async (ctx, args) => {
		const ownership = await ctx.db.get(args.id);
		if (!ownership) {
			throw new Error("Ownership record not found");
		}

		// Validate new owner ID
		if (args.newOwnerId !== "fairlend") {
			// Application layer should validate user ID exists
		}

		await ctx.db.patch(args.id, { ownerId: args.newOwnerId });
		return args.id;
	},
});

/**
 * Delete ownership record (for 0% ownership in fractional scenarios)
 */
export const deleteOwnership = mutation({
	args: { id: v.id("mortgage_ownership") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
		return args.id;
	},
});

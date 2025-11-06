/**
 * Mortgage ownership cap table management
 * Tracks fractional ownership with support for institutional and individual investors
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get cap table for a specific mortgage (all ownership records)
 * Sorted by ownership percentage descending (largest owners first)
 */
export const getMortgageOwnership = query({
	args: { mortgageId: v.id("mortgages") },
	handler: async (ctx, args) => {
		const ownership = await ctx.db
			.query("mortgage_ownership")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.mortgageId))
			.collect();

		// Sort by ownership percentage descending
		return ownership.sort(
			(a, b) => b.ownershipPercentage - a.ownershipPercentage
		);
	},
});

/**
 * Get all mortgages owned by a specific investor
 */
export const getUserPortfolio = query({
	args: { userId: v.union(v.literal("fairlend"), v.id("users")) },
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
		ownerId: v.union(v.literal("fairlend"), v.id("users")),
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
 * Get total ownership percentage for a mortgage (should always equal 100%)
 * Useful for validation and auditing
 */
export const getTotalOwnership = query({
	args: { mortgageId: v.id("mortgages") },
	handler: async (ctx, args) => {
		const allOwnership = await ctx.db
			.query("mortgage_ownership")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.mortgageId))
			.collect();

		const total = allOwnership.reduce(
			(sum, record) => sum + record.ownershipPercentage,
			0
		);

		return {
			mortgageId: args.mortgageId,
			totalPercentage: total,
			isValid: Math.abs(total - 100) < 0.01, // Allow for floating point precision
			owners: allOwnership.length,
			breakdown: allOwnership.map((o) => ({
				ownerId: o.ownerId,
				percentage: o.ownershipPercentage,
			})),
		};
	},
});

/**
 * Create an ownership record
 * Automatically reduces FairLend's ownership to maintain 100% total
 */
export const createOwnership = mutation({
	args: {
		mortgageId: v.id("mortgages"),
		ownerId: v.union(v.literal("fairlend"), v.id("users")),
		ownershipPercentage: v.number(),
	},
	handler: async (ctx, args) => {
		// Validate percentage range
		if (
			args.ownershipPercentage <= 0 ||
			args.ownershipPercentage > 100
		) {
			throw new Error("Ownership percentage must be between 0 and 100");
		}

		// Cannot create FairLend ownership manually - it's automatic
		if (args.ownerId === "fairlend") {
			throw new Error(
				"FairLend ownership is managed automatically. Use updateOwnershipPercentage to adjust."
			);
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

		// Get FairLend's current ownership
		const fairlendOwnership = await ctx.db
			.query("mortgage_ownership")
			.withIndex("by_mortgage_owner", (q) =>
				q.eq("mortgageId", args.mortgageId).eq("ownerId", "fairlend")
			)
			.first();

		if (!fairlendOwnership) {
			throw new Error(
				"FairLend ownership record not found. All mortgages must have FairLend as default owner."
			);
		}

		// Check if FairLend has enough ownership to transfer
		if (fairlendOwnership.ownershipPercentage < args.ownershipPercentage) {
			throw new Error(
				`Insufficient FairLend ownership. FairLend owns ${fairlendOwnership.ownershipPercentage.toFixed(2)}%, but ${args.ownershipPercentage.toFixed(2)}% is requested.`
			);
		}

		// Reduce FairLend's ownership
		const newFairlendPercentage =
			fairlendOwnership.ownershipPercentage - args.ownershipPercentage;

		// If FairLend's ownership becomes 0, delete the record
		if (newFairlendPercentage === 0) {
			await ctx.db.delete(fairlendOwnership._id);
		} else {
			await ctx.db.patch(fairlendOwnership._id, {
				ownershipPercentage: newFairlendPercentage,
			});
		}

		// Create the new ownership record
		// Total ownership remains 100% (FairLend reduced, new owner added)
		return await ctx.db.insert("mortgage_ownership", {
			mortgageId: args.mortgageId,
			ownerId: args.ownerId,
			ownershipPercentage: args.ownershipPercentage,
		});
	},
});

/**
 * Update ownership percentage
 * Automatically adjusts FairLend's ownership to maintain 100% total
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

		// Get the ownership record being updated
		const ownershipRecord = await ctx.db.get(args.id);
		if (!ownershipRecord) {
			throw new Error("Ownership record not found");
		}

		// Calculate the change in ownership percentage
		const percentageChange =
			args.ownershipPercentage - ownershipRecord.ownershipPercentage;

		// If updating FairLend's ownership, just do it directly
		if (ownershipRecord.ownerId === "fairlend") {
			// Validate FairLend's ownership stays between 0 and 100
			await ctx.db.patch(args.id, {
				ownershipPercentage: args.ownershipPercentage,
			});
			return args.id;
		}

		// For non-FairLend owners, adjust FairLend's ownership to maintain 100%
		const fairlendOwnership = await ctx.db
			.query("mortgage_ownership")
			.withIndex("by_mortgage_owner", (q) =>
				q
					.eq("mortgageId", ownershipRecord.mortgageId)
					.eq("ownerId", "fairlend")
			)
			.first();

		// Calculate new FairLend percentage (opposite of the change)
		const newFairlendPercentage = fairlendOwnership
			? fairlendOwnership.ownershipPercentage - percentageChange
			: -percentageChange;

		// Validate FairLend's ownership won't go negative
		if (newFairlendPercentage < 0) {
			throw new Error(
				`Cannot update ownership: would require FairLend to have ${newFairlendPercentage.toFixed(2)}% ownership (negative). FairLend currently owns ${fairlendOwnership?.ownershipPercentage.toFixed(2) ?? 0}%.`
			);
		}

		// Validate FairLend's ownership won't exceed 100%
		if (newFairlendPercentage > 100) {
			throw new Error(
				`Cannot update ownership: would require FairLend to have ${newFairlendPercentage.toFixed(2)}% ownership (exceeds 100%).`
			);
		}

		// Update the target ownership record
		await ctx.db.patch(args.id, {
			ownershipPercentage: args.ownershipPercentage,
		});

		// Update or create FairLend's ownership
		if (newFairlendPercentage === 0) {
			// If FairLend's ownership becomes 0, delete the record
			if (fairlendOwnership) {
				await ctx.db.delete(fairlendOwnership._id);
			}
		} else if (fairlendOwnership) {
			// Update existing FairLend ownership
			await ctx.db.patch(fairlendOwnership._id, {
				ownershipPercentage: newFairlendPercentage,
			});
		} else {
			// Create new FairLend ownership record
			await ctx.db.insert("mortgage_ownership", {
				mortgageId: ownershipRecord.mortgageId,
				ownerId: "fairlend",
				ownershipPercentage: newFairlendPercentage,
			});
		}

		return args.id;
	},
});

/**
 * Transfer ownership to a new owner
 */
export const transferOwnership = mutation({
	args: {
		id: v.id("mortgage_ownership"),
		newOwnerId: v.union(v.literal("fairlend"), v.id("users")),
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
 * Delete ownership record
 * Automatically transfers ownership back to FairLend to maintain 100% total
 */
export const deleteOwnership = mutation({
	args: { id: v.id("mortgage_ownership") },
	handler: async (ctx, args) => {
		const ownershipRecord = await ctx.db.get(args.id);
		if (!ownershipRecord) {
			throw new Error("Ownership record not found");
		}

		// Cannot delete FairLend ownership directly
		// FairLend ownership is managed automatically
		if (ownershipRecord.ownerId === "fairlend") {
			throw new Error(
				"Cannot delete FairLend ownership record. FairLend ownership is managed automatically."
			);
		}

		// Get FairLend's current ownership (if exists)
		const fairlendOwnership = await ctx.db
			.query("mortgage_ownership")
			.withIndex("by_mortgage_owner", (q) =>
				q
					.eq("mortgageId", ownershipRecord.mortgageId)
					.eq("ownerId", "fairlend")
			)
			.first();

		// Delete the ownership record
		await ctx.db.delete(args.id);

		// Transfer the ownership back to FairLend
		if (fairlendOwnership) {
			// Add to existing FairLend ownership
			await ctx.db.patch(fairlendOwnership._id, {
				ownershipPercentage:
					fairlendOwnership.ownershipPercentage +
					ownershipRecord.ownershipPercentage,
			});
		} else {
			// Create new FairLend ownership record
			await ctx.db.insert("mortgage_ownership", {
				mortgageId: ownershipRecord.mortgageId,
				ownerId: "fairlend",
				ownershipPercentage: ownershipRecord.ownershipPercentage,
			});
		}

		return args.id;
	},
});

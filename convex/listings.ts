/**
 * Marketplace listing management
 * Controls visibility and lock state for mortgages available for purchase
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { hasRbacAccess } from "./auth.config";

/**
 * Get all available listings (visible and unlocked)
 */
export const getAvailableListings = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("listings")
			.filter((q) =>
				q.and(q.eq(q.field("visible"), true), q.eq(q.field("locked"), false))
			)
			.collect();
	},
});

/**
 * Get available listings with full mortgage details
 * Returns listings joined with their mortgage data for display with signed image URLs
 */
export const getAvailableListingsWithMortgages = query({
	args: {},
	handler: async (ctx) => {
		// Get all visible, unlocked listings
		const listings = await ctx.db
			.query("listings")
			.filter((q) =>
				q.and(q.eq(q.field("visible"), true), q.eq(q.field("locked"), false))
			)
			.collect();

		// Fetch mortgage data for each listing with signed URLs
		const listingsWithMortgages = await Promise.all(
			listings.map(async (listing) => {
				const mortgage = await ctx.db.get(listing.mortgageId);
				if (!mortgage) return null;

				// Fetch signed URLs for all property images
				const imagesWithUrls = await Promise.all(
					mortgage.images.map(async (img) => ({
						...img,
						url: await ctx.storage.getUrl(img.storageId as any),
					}))
				);

				return {
					listing,
					mortgage: {
						...mortgage,
						images: imagesWithUrls,
					},
				};
			})
		);

		// Filter out any null values
		return listingsWithMortgages.filter(
			(item): item is NonNullable<typeof item> => item !== null
		);
	},
});

/**
 * Get listing by mortgage ID
 */
export const getListingByMortgage = query({
	args: { mortgageId: v.id("mortgages") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("listings")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.mortgageId))
			.first();
	},
});

/**
 * Get all listings locked by a specific user
 */
export const getUserLockedListings = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("listings")
			.withIndex("by_locked_user", (q) => q.eq("lockedBy", args.userId))
			.collect();
	},
});

/**
 * Get all locked listings (admin view)
 */
export const getAllLockedListings = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("listings")
			.withIndex("by_locked_status", (q) => q.eq("locked", true))
			.collect();
	},
});

/**
 * Check if a listing is available (visible and unlocked)
 */
export const isListingAvailable = query({
	args: { listingId: v.id("listings") },
	handler: async (ctx, args) => {
		const listing = await ctx.db.get(args.listingId);
		if (!listing) {
			return { available: false, reason: "Listing not found" };
		}
		if (!listing.visible) {
			return { available: false, reason: "Listing is not visible" };
		}
		if (listing.locked) {
			return { available: false, reason: "Listing is locked" };
		}
		return { available: true };
	},
});

/**
 * Create a new listing
 */
export const createListing = mutation({
	args: {
		mortgageId: v.id("mortgages"),
		visible: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		// Validate mortgage exists
		const mortgage = await ctx.db.get(args.mortgageId);
		if (!mortgage) {
			throw new Error("Mortgage not found");
		}

		// Check for duplicate listing
		const existing = await ctx.db
			.query("listings")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.mortgageId))
			.first();

		if (existing) {
			throw new Error("Listing already exists for this mortgage");
		}

		return await ctx.db.insert("listings", {
			mortgageId: args.mortgageId,
			visible: args.visible ?? true,
			locked: false,
		});
	},
});

/**
 * Lock a listing for purchase
 */
export const lockListing = mutation({
	args: {
		listingId: v.id("listings"),
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const listing = await ctx.db.get(args.listingId);
		if (!listing) {
			throw new Error("Listing not found");
		}

		// Check if already locked
		if (listing.locked) {
			throw new Error(
				`Listing is already locked by user ${listing.lockedBy}`
			);
		}

		// Lock the listing
		await ctx.db.patch(args.listingId, {
			locked: true,
			lockedBy: args.userId,
			lockedAt: Date.now(),
		});

		return args.listingId;
	},
});

/**
 * Unlock a listing
 */
export const unlockListing = mutation({
	args: {
		listingId: v.id("listings"),
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		// Get caller identity
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		// Find the caller's user document
		const caller = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
			.unique();

		if (!caller) {
			throw new Error("User not found");
		}

		const listing = await ctx.db.get(args.listingId);
		if (!listing) {
			throw new Error("Listing not found");
		}

		// Check if caller is the one who locked it
		const isLocker = listing.lockedBy === caller._id;

		// Check if caller is admin using RBAC helper
		const isAdmin = hasRbacAccess({
			required_roles: ["admin"],
			user_identity: identity,
		});

		// Authorization check: must be locker or admin
		if (!isLocker && !isAdmin) {
			throw new Error(
				"Unauthorized: Only the user who locked this listing or an admin can unlock it"
			);
		}

		// Unlock the listing
		await ctx.db.patch(args.listingId, {
			locked: false,
			lockedBy: undefined,
			lockedAt: undefined,
		});

		return args.listingId;
	},
});

/**
 * Update listing visibility
 */
export const updateListingVisibility = mutation({
	args: {
		listingId: v.id("listings"),
		visible: v.boolean(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.listingId, { visible: args.visible });
		return args.listingId;
	},
});

/**
 * Delete a listing from marketplace
 */
export const deleteListing = mutation({
	args: { listingId: v.id("listings") },
	handler: async (ctx, args) => {
		const listing = await ctx.db.get(args.listingId);
		if (!listing) {
			throw new Error("Listing not found");
		}

		// Prevent deletion of locked listings (active deals)
		if (listing.locked) {
			throw new Error(
				"Cannot delete locked listing. Unlock first or complete the deal."
			);
		}

		await ctx.db.delete(args.listingId);
		return args.listingId;
	},
});

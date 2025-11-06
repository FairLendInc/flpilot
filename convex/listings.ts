/**
 * Marketplace listing management
 * Controls visibility and lock state for mortgages available for purchase
 */

import { v, Infer } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { hasRbacAccess } from "./auth.config";
import { ensureMortgage, mortgageDetailsValidator } from "./mortgages";
import { comparablePayloadValidator } from "./comparables";
import { logger } from "./logger";

const borrowerPayloadValidator = v.object({
	name: v.string(),
	email: v.string(),
	rotessaCustomerId: v.string(),
});

const listingOptionsValidator = v.object({
	visible: v.optional(v.boolean()),
});

const listingCreationPayloadValidator = v.object({
	borrower: borrowerPayloadValidator,
	mortgage: mortgageDetailsValidator,
	listing: listingOptionsValidator,
	comparables: v.optional(v.array(comparablePayloadValidator)),
});

const listingCreationResultValidator = v.object({
	borrowerId: v.id("borrowers"),
	mortgageId: v.id("mortgages"),
	listingId: v.id("listings"),
	created: v.boolean(),
});

type BorrowerPayload = Infer<typeof borrowerPayloadValidator>;
export type ListingCreationPayload = Infer<typeof listingCreationPayloadValidator>;
export type ListingCreationResult = Infer<typeof listingCreationResultValidator>;

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const ensureBorrowerForPayload = async (
	ctx: MutationCtx,
	borrower: BorrowerPayload
): Promise<Id<"borrowers">> => {
	if (!EMAIL_PATTERN.test(borrower.email)) {
		throw new Error("Borrower email must be a valid address");
	}
	if (borrower.rotessaCustomerId.trim().length === 0) {
		throw new Error("Borrower rotessaCustomerId is required");
	}

	const existingByRotessa = await ctx.db
		.query("borrowers")
		.withIndex("by_rotessa_customer_id", (q) =>
			q.eq("rotessaCustomerId", borrower.rotessaCustomerId)
		)
		.first();

	if (existingByRotessa) {
		const updates: Partial<{ name: string; email: string }> = {};
		if (existingByRotessa.name !== borrower.name) {
			updates.name = borrower.name;
		}
		if (existingByRotessa.email !== borrower.email) {
			updates.email = borrower.email;
		}
		if (Object.keys(updates).length > 0) {
			await ctx.db.patch(existingByRotessa._id, updates);
		}
		return existingByRotessa._id;
	}

	const existingByEmail = await ctx.db
		.query("borrowers")
		.withIndex("by_email", (q) => q.eq("email", borrower.email))
		.first();

	if (existingByEmail) {
		if (existingByEmail.rotessaCustomerId !== borrower.rotessaCustomerId) {
			throw new Error(
				"Borrower email is already associated with a different Rotessa customer"
			);
		}
		const updates: Partial<{ name: string }> = {};
		if (existingByEmail.name !== borrower.name) {
			updates.name = borrower.name;
		}
		if (Object.keys(updates).length > 0) {
			await ctx.db.patch(existingByEmail._id, updates);
		}
		return existingByEmail._id;
	}

	return await ctx.db.insert("borrowers", {
		name: borrower.name,
		email: borrower.email,
		rotessaCustomerId: borrower.rotessaCustomerId,
	});
};

const runListingCreation = async (
	ctx: MutationCtx,
	payload: ListingCreationPayload
): Promise<ListingCreationResult> => {
	const borrowerId = await ensureBorrowerForPayload(ctx, payload.borrower);

	const mortgageId = await ensureMortgage(ctx, {
		borrowerId,
		...payload.mortgage,
	});

	// Create comparables if provided
	if (payload.comparables && payload.comparables.length > 0) {
		try {
			await ctx.runMutation(internal.comparables.bulkCreateComparables, {
				mortgageId,
				comparables: payload.comparables,
			});
		} catch (error) {
			// Rollback mortgage creation if comparable creation fails
			await ctx.db.delete(mortgageId);
			throw new Error(
				`Failed to create comparables: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	}

	const existingListing = await ctx.db
		.query("listings")
		.withIndex("by_mortgage", (q) => q.eq("mortgageId", mortgageId))
		.first();

	if (existingListing) {
		if (
			payload.listing.visible !== undefined &&
			existingListing.visible !== payload.listing.visible
		) {
			await ctx.db.patch(existingListing._id, {
				visible: payload.listing.visible,
			});
		}
		return {
			borrowerId,
			mortgageId,
			listingId: existingListing._id,
			created: false,
		};
	}

	const listingId = await ctx.db.insert("listings", {
		mortgageId,
		visible: payload.listing.visible ?? true,
		locked: false,
	});

	return {
		borrowerId,
		mortgageId,
		listingId,
		created: true,
	};
};

export const createFromPayload = mutation({
	args: listingCreationPayloadValidator,
	returns: listingCreationResultValidator,
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		const isAdmin = hasRbacAccess({
			required_roles: ["admin"],
			user_identity: identity,
		});

		if (!isAdmin) {
			throw new Error("Unauthorized: Admin privileges are required");
		}

		return await runListingCreation(ctx, args);
	},
});

export const createFromPayloadInternal = internalMutation({
	args: listingCreationPayloadValidator,
	returns: listingCreationResultValidator,
	handler: async (ctx, args) => {
		return await runListingCreation(ctx, args);
	},
});

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
					url: await ctx.storage.getUrl(img.storageId),
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
 * Get all listings (admin view)
 */
export const getAllListings = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("listings").collect();
	},
});

/**
 * Get listing with mortgage details (admin view)
 */
export const getListingWithMortgage = query({
	args: { listingId: v.id("listings") },
	handler: async (ctx, args) => {
		const listing = await ctx.db.get(args.listingId);
		if (!listing) return null;

		const mortgage = await ctx.db.get(listing.mortgageId);
		if (!mortgage) return { listing, mortgage: null };

		// Fetch signed URLs for images
		const imagesWithUrls = await Promise.all(
			mortgage.images.map(async (img) => ({
				...img,
				url: await ctx.storage.getUrl(img.storageId),
			}))
		);

		return {
			listing,
			mortgage: {
				...mortgage,
				images: imagesWithUrls,
			},
		};
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
 * Admin-only: Update listing properties
 * Allows admins to update visible state, lock state, and metadata
 */
export const updateListing = mutation({
	args: {
		listingId: v.id("listings"),
		visible: v.optional(v.boolean()),
		locked: v.optional(v.boolean()),
		metadata: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		const isAdmin = hasRbacAccess({
			required_roles: ["admin"],
			user_identity: identity,
		});

		if (!isAdmin) {
			throw new Error("Unauthorized: Admin privileges are required");
		}

		const listing = await ctx.db.get(args.listingId);
		if (!listing) {
			throw new Error("Listing not found");
		}

		// Find the caller's user document for lock operations
		const caller = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
			.unique();

		if (!caller) {
			throw new Error("User not found");
		}

		const updates: Partial<{
			visible: boolean;
			locked: boolean;
			lockedBy: Id<"users">;
			lockedAt: number;
			metadata: any;
		}> = {};

		if (args.visible !== undefined) {
			updates.visible = args.visible;
		}

		if (args.locked !== undefined) {
			updates.locked = args.locked;
			if (args.locked) {
				// Locking: set lockedBy and lockedAt
				updates.lockedBy = caller._id;
				updates.lockedAt = Date.now();
			} else {
				// Unlocking: clear lockedBy and lockedAt
				updates.lockedBy = undefined;
				updates.lockedAt = undefined;
			}
		}

		if (args.metadata !== undefined) {
			updates.metadata = args.metadata;
		}

		await ctx.db.patch(args.listingId, updates);

		// Log admin action for audit trail
		console.log(
			`[AUDIT] Admin ${caller._id} updated listing ${args.listingId}:`,
			JSON.stringify(updates)
		);

		return args.listingId;
	},
});

/**
 * Admin-only: Delete a listing from marketplace
 * Preserves underlying mortgage but removes listing and cascades comparables
 */
export const deleteListing = mutation({
	args: { listingId: v.id("listings"), force: v.optional(v.boolean()) },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		const isAdmin = hasRbacAccess({
			required_roles: ["admin"],
			user_identity: identity,
		});

		if (!isAdmin) {
			throw new Error("Unauthorized: Admin privileges are required");
		}

		const listing = await ctx.db.get(args.listingId);
		if (!listing) {
			throw new Error("Listing not found");
		}

		// Find the caller's user document for audit logging
		const caller = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
			.unique();

		if (!caller) {
			throw new Error("User not found");
		}

		// Check if listing is locked
		if (listing.locked && !args.force) {
			throw new Error(
				"Cannot delete locked listing. Use force=true to unlock and delete, or unlock first."
			);
		}

		// If force is true and listing is locked, unlock it first
		if (listing.locked && args.force) {
			await ctx.db.patch(args.listingId, {
				locked: false,
				lockedBy: undefined,
				lockedAt: undefined,
			});
		}

		// Delete all comparables linked to the mortgage
		const comparables = await ctx.db
			.query("appraisal_comparables")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", listing.mortgageId))
			.collect();

		// Delete comparables (rollback handled by Convex transaction)
		try {
			await Promise.all(comparables.map((c) => ctx.db.delete(c._id)));
		} catch (error) {
			throw new Error(
				`Failed to delete comparables: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}

		// Delete the listing
		await ctx.db.delete(args.listingId);

		// Log admin action for audit trail
		console.log(
			`[AUDIT] Admin ${caller._id} deleted listing ${args.listingId} (mortgage: ${listing.mortgageId}, comparables deleted: ${comparables.length})`
		);

		return args.listingId;
	},
});

/**
 * Internal mutation for webhook: Update listing (bypasses auth, webhook authenticates via API key)
 */
export const updateListingInternal = internalMutation({
	args: {
		listingId: v.id("listings"),
		visible: v.optional(v.boolean()),
		locked: v.optional(v.boolean()),
		metadata: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		const listing = await ctx.db.get(args.listingId);
		if (!listing) {
			throw new Error("Listing not found");
		}

		const updates: Partial<{
			visible: boolean;
			locked: boolean;
			lockedBy: Id<"users">;
			lockedAt: number;
			metadata: any;
		}> = {};

		if (args.visible !== undefined) {
			updates.visible = args.visible;
		}

		if (args.locked !== undefined) {
			updates.locked = args.locked;
			if (args.locked) {
				// For webhook, we don't have a user ID, so leave lockedBy undefined
				updates.lockedAt = Date.now();
			} else {
				updates.lockedBy = undefined;
				updates.lockedAt = undefined;
			}
		}

		if (args.metadata !== undefined) {
			updates.metadata = args.metadata;
		}

		await ctx.db.patch(args.listingId, updates);

		logger.info(`[WEBHOOK] Updated listing ${args.listingId}`, updates);

		return args.listingId;
	},
});

/**
 * Internal mutation for webhook: Delete listing (bypasses auth, webhook authenticates via API key)
 */
export const deleteListingInternal = internalMutation({
	args: { listingId: v.id("listings"), force: v.optional(v.boolean()) },
	handler: async (ctx, args) => {
		const listing = await ctx.db.get(args.listingId);
		if (!listing) {
			throw new Error("Listing not found");
		}

		// Check if listing is locked
		if (listing.locked && !args.force) {
			throw new Error(
				"Cannot delete locked listing. Use force=true to unlock and delete, or unlock first."
			);
		}

		// If force is true and listing is locked, unlock it first
		if (listing.locked && args.force) {
			await ctx.db.patch(args.listingId, {
				locked: false,
				lockedBy: undefined,
				lockedAt: undefined,
			});
		}

		// Delete all comparables linked to the mortgage
		const comparables = await ctx.db
			.query("appraisal_comparables")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", listing.mortgageId))
			.collect();

		// Delete comparables (rollback handled by Convex transaction)
		try {
			await Promise.all(comparables.map((c) => ctx.db.delete(c._id)));
		} catch (error) {
			throw new Error(
				`Failed to delete comparables: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}

		// Delete the listing
		await ctx.db.delete(args.listingId);

		logger.info(
			`[WEBHOOK] Deleted listing ${args.listingId} (mortgage: ${listing.mortgageId}, comparables deleted: ${comparables.length})`
		);

		return args.listingId;
	},
});

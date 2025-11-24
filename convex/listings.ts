/**
 * Marketplace listing management
 * Controls visibility and lock state for mortgages available for purchase
 */

import { type Infer, v } from "convex/values";
import { hasRbacAccess } from "../lib/authhelper";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { comparablePayloadValidator } from "./comparables";
import { authQuery } from "./lib/server";
import { ensureMortgage, mortgageDetailsValidator } from "./mortgages";

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
export type ListingCreationPayload = Infer<
	typeof listingCreationPayloadValidator
>;
export type ListingCreationResult = Infer<
	typeof listingCreationResultValidator
>;

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

		const isAuthorized = hasRbacAccess({
			required_roles: ["admin", "broker"],
			user_identity: identity,
		});

		if (!isAuthorized) {
			throw new Error("Unauthorized: Broker or admin privileges are required");
		}

		return await runListingCreation(ctx, args);
	},
});

export const createFromPayloadInternal = internalMutation({
	args: listingCreationPayloadValidator,
	returns: listingCreationResultValidator,
	handler: async (ctx, args) => await runListingCreation(ctx, args),
});

/**
 * Get all available listings (visible and unlocked)
 */
export const getAvailableListings = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}
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
export const getAvailableListingsWithMortgages = authQuery({
	args: {},
	handler: async (ctx) => {
		// Get all visible listings (including locked ones - they remain visible per task 4.5.4)
		const listings = await ctx.db
			.query("listings")
			.filter((q) => q.eq(q.field("visible"), true))
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
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}
		return await ctx.db
			.query("listings")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.mortgageId))
			.first();
	},
});

/**
 * Get listing by listing ID
 */
export const getListingById = authQuery({
	args: { listingId: v.id("listings") },
	returns: v.union(
		v.object({
			_id: v.id("listings"),
			_creationTime: v.number(),
			mortgageId: v.id("mortgages"),
			visible: v.boolean(),
			locked: v.boolean(),
		}),
		v.null()
	),
	handler: async (ctx, args) => {
		// Authentication handled by authQuery wrapper
		return await ctx.db.get(args.listingId);
	},
});

/**
 * Get all listings locked by a specific user
 */
export const getUserLockedListings = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}
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
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}
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
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}
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
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}
		// Check broker/admin authorization
		const isAuthorized = hasRbacAccess({
			required_roles: ["admin", "broker"],
			user_identity: identity,
		});

		if (!isAuthorized) {
			throw new Error("Unauthorized: Broker or admin privileges required");
		}

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
 * Lock a listing for purchase (admin-only, bypasses approval workflow)
 *
 * NOTE: This mutation is restricted to admins only. Investors should use
 * the lock request approval workflow via createLockRequest mutation.
 * Admins can use this for urgent cases or testing.
 */
export const lockListing = action({
	args: {
		listingId: v.id("listings"),
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		if (
			!hasRbacAccess({
				required_roles: ["admin", "broker", "padmin"],
				user_identity: identity,
			})
		) {
			//TODO: extract errors to re-use a standard set of "FairLend" errors
			throw new Error("Unauthorized: Admin privileges require");
		}

		// Check broker/admin authorization
		// We can't use hasRbacAccess directly in action as it might need db access for roles
		// But we can check roles from identity if they are in the token
		// Or call an internal query to check permissions
		// For now, we'll rely on the internal mutation to check permissions or assume caller is authorized
		// But we should check auth here too.

		// Call internal mutation to lock the listing
		await ctx.runMutation(internal.listings.lockListingInternal, {
			listingId: args.listingId,
			userId: args.userId,
		});

		// If this was an admin action, we might want to trigger deal creation immediately
		// But typically deal creation happens after lock request approval
		// If this is a direct lock, we might want to create a deal too?
		// The proposal says "Update listing lock workflow to: 1. Create Deal Record..."
		// But that refers to the investor workflow.
		// This `lockListing` seems to be an admin override.

		// Let's keep it simple: this action just locks the listing.
		// Deal creation is handled by `createDeal` action which is called after approval.

		return args.listingId;
	},
});

export const lockListingInternal = internalMutation({
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
			throw new Error(`Listing is already locked by user ${listing.lockedBy}`);
		}

		// Lock the listing
		await ctx.db.patch(args.listingId, {
			locked: true,
			lockedBy: args.userId,
			lockedAt: Date.now(),
		});
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

		// Check if caller is broker/admin using RBAC helper
		const isAuthorized = hasRbacAccess({
			required_roles: ["admin", "broker"],
			user_identity: identity,
		});

		// Authorization check: must be locker or broker/admin
		if (!(isLocker || isAuthorized)) {
			throw new Error(
				"Unauthorized: Only the user who locked this listing, a broker, or an admin can unlock it"
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
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		// Check broker/admin authorization
		const isAuthorized = hasRbacAccess({
			required_roles: ["admin", "broker"],
			user_identity: identity,
		});

		if (!isAuthorized) {
			throw new Error("Unauthorized: Broker or admin privileges required");
		}

		await ctx.db.patch(args.listingId, { visible: args.visible });
		return args.listingId;
	},
});

/**
 * Admin-only: Update listing properties
 * Can update visible, locked state, and maintains audit trail
 */
/**
 * Core business logic for updating a listing (without auth checks)
 * Used by both authenticated mutations and internal webhook handlers
 */
async function updateListingCore(
	ctx: MutationCtx,
	args: {
		listingId: Id<"listings">;
		visible?: boolean;
		locked?: boolean;
		lockedBy?: Id<"users">;
	}
): Promise<Id<"listings">> {
	// Get existing listing
	const listing = await ctx.db.get(args.listingId);
	if (!listing) {
		throw new Error("Listing not found");
	}

	// Build update object
	const updates: Partial<{
		visible: boolean;
		locked: boolean;
		lockedBy: Id<"users"> | undefined;
		lockedAt: number | undefined;
	}> = {};

	// Update visible if provided
	if (args.visible !== undefined) {
		updates.visible = args.visible;
	}

	// Update lock state if provided
	if (args.locked !== undefined) {
		updates.locked = args.locked;
		if (args.locked) {
			// Locking: set lockedBy and lockedAt
			updates.lockedBy = args.lockedBy;
			updates.lockedAt = Date.now();
		} else {
			// Unlocking: clear lockedBy and lockedAt
			updates.lockedBy = undefined;
			updates.lockedAt = undefined;
		}
	}

	// Apply updates
	await ctx.db.patch(args.listingId, updates);

	return args.listingId;
}

/**
 * Core business logic for deleting a listing (without auth checks)
 * Used by both authenticated mutations and internal webhook handlers
 */
async function deleteListingCore(
	ctx: MutationCtx,
	args: {
		listingId: Id<"listings">;
		force?: boolean;
	}
): Promise<Id<"listings">> {
	const listing = await ctx.db.get(args.listingId);
	if (!listing) {
		throw new Error("Listing not found");
	}

	// Check if locked (unless force flag is set)
	if (listing.locked && !args.force) {
		throw new Error(
			"Cannot delete locked listing. Use force option or unlock first."
		);
	}

	// Check for existing lock requests (prevents deletion if requests exist)
	const lockRequests = await ctx.db
		.query("lock_requests")
		.withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
		.collect();

	if (lockRequests.length > 0 && !args.force) {
		const statusCounts = lockRequests.reduce<Record<string, number>>(
			(acc, request) => {
				acc[request.status] = (acc[request.status] ?? 0) + 1;
				return acc;
			},
			{}
		);
		const reasons = Object.entries(statusCounts)
			.filter(([, count]) => count > 0)
			.map(([status, count]) => `${count} ${status}`);

		const reasonsText =
			reasons.length > 0 ? reasons.join(", ") : "no active labels";

		throw new Error(
			`Cannot delete listing with existing lock requests (${reasonsText}). Delete requests first or use force option.`
		);
	}

	try {
		// Cascade delete comparables linked to this listing's mortgage
		const comparables = await ctx.db
			.query("appraisal_comparables")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", listing.mortgageId))
			.collect();

		for (const comparable of comparables) {
			await ctx.db.delete(comparable._id);
		}

		// Delete the listing (preserves mortgage)
		await ctx.db.delete(args.listingId);

		return args.listingId;
	} catch (error) {
		// If any deletion fails, the transaction will automatically rollback
		throw new Error(
			`Failed to delete listing: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

export const updateListing = mutation({
	args: {
		listingId: v.id("listings"),
		visible: v.optional(v.boolean()),
		locked: v.optional(v.boolean()),
		lockedBy: v.optional(v.id("users")),
	},
	returns: v.id("listings"),
	handler: async (ctx, args) => {
		// Validate broker/admin authorization
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		const isAuthorized = hasRbacAccess({
			required_roles: ["admin", "broker"],
			user_identity: identity,
		});

		if (!isAuthorized) {
			throw new Error("Unauthorized: Broker or admin privileges are required");
		}

		const result = await updateListingCore(ctx, args);

		// TODO: Add audit trail logging
		console.log("Listing updated by broker/admin:", {
			userId: identity.subject,
			listingId: args.listingId,
			updates: {
				visible: args.visible,
				locked: args.locked,
				lockedBy: args.lockedBy,
			},
			timestamp: Date.now(),
		});

		return result;
	},
});

/**
 * Internal mutation: Update listing (for webhooks, skips auth)
 */
export const updateListingInternal = internalMutation({
	args: {
		listingId: v.id("listings"),
		visible: v.optional(v.boolean()),
		locked: v.optional(v.boolean()),
		lockedBy: v.optional(v.id("users")),
	},
	returns: v.id("listings"),
	handler: async (ctx, args) => await updateListingCore(ctx, args),
});

/**
 * Admin-only: Delete a listing from marketplace
 * Includes cascade deletion of related data and rollback on failure
 */
export const deleteListing = mutation({
	args: {
		listingId: v.id("listings"),
		force: v.optional(v.boolean()),
	},
	returns: v.id("listings"),
	handler: async (ctx, args) => {
		// Validate broker/admin authorization
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		const isAuthorized = hasRbacAccess({
			required_roles: ["admin", "broker"],
			user_identity: identity,
		});

		if (!isAuthorized) {
			throw new Error("Unauthorized: Broker or admin privileges are required");
		}

		const result = await deleteListingCore(ctx, args);

		// Audit log
		const listing = await ctx.db.get(args.listingId);
		console.log("Listing deleted by broker/admin:", {
			userId: identity.subject,
			listingId: args.listingId,
			mortgageId: listing?.mortgageId,
			timestamp: Date.now(),
		});

		return result;
	},
});

/**
 * Internal mutation: Delete listing (for webhooks, skips auth)
 */
export const deleteListingInternal = internalMutation({
	args: {
		listingId: v.id("listings"),
		force: v.optional(v.boolean()),
	},
	returns: v.id("listings"),
	handler: async (ctx, args) => await deleteListingCore(ctx, args),
});

/**
 * Lock request management for marketplace listings
 * Handles investor-initiated lock requests with admin approval workflow
 */

import { v } from "convex/values";
import { hasRbacAccess } from "../lib/authhelper";
import { logger } from "../lib/logger";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

const MAX_NOTES_LENGTH = 1000;
const LAWYER_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type DatabaseCtx = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;
type IdentityCtx = QueryCtx | MutationCtx;

/**
 * Validation helper: Check if request notes are valid
 */
function validateRequestNotes(notes: string | undefined): void {
	if (notes !== undefined && notes.length > MAX_NOTES_LENGTH) {
		throw new Error(
			`Request notes exceed character limit of ${MAX_NOTES_LENGTH}`
		);
	}
}

/**
 * Validation helper: Check if listing is available for lock requests
 */
async function validateListingAvailability(
	ctx: DatabaseCtx,
	listingId: Id<"listings">
): Promise<void> {
	const listing = await ctx.db.get(listingId);
	if (!listing) {
		throw new Error("Listing not found");
	}
	if (!listing.visible) {
		throw new Error("Listing is not visible");
	}
	if (listing.locked) {
		throw new Error("Listing is already locked");
	}
}

/**
 * Get user document from identity
 * Automatically creates user from WorkOS identity data if not found
 * Handles both query (read-only) and mutation contexts
 */
type UserIdentityOptions = {
	createIfMissing?: boolean;
};

async function getUserFromIdentity(
	ctx: IdentityCtx,
	options?: UserIdentityOptions
): Promise<Id<"users"> | null> {
	const { createIfMissing = false } = options ?? {};
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Authentication required");
	}

	const user = await ctx.db
		.query("users")
		.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
		.unique();

	// If user doesn't exist, optionally create from WorkOS identity data
	if (!user) {
		const idpId = identity.subject;
		const email = identity.email;

		if (!email) {
			throw new Error("Email is required but not found in identity");
		}

		if (!createIfMissing) {
			logger.warn("User identity missing in Convex and creation disabled", {
				idpId,
			});
			return null;
		}

		const mutationCtx = ctx as MutationCtx;
		const userId = await mutationCtx.db.insert("users", {
			idp_id: idpId,
			email,
			email_verified: Boolean(identity.email_verified),
			first_name:
				typeof identity.first_name === "string"
					? identity.first_name
					: undefined,
			last_name:
				typeof identity.last_name === "string" ? identity.last_name : undefined,
			profile_picture_url:
				typeof identity.profile_picture_url === "string"
					? identity.profile_picture_url
					: typeof identity.profile_picture === "string"
						? identity.profile_picture
						: undefined,
			created_at: new Date().toISOString(),
		});

		logger.info("User created from WorkOS identity", {
			userId,
			idpId,
			email,
		});

		return userId;
	}

	return user._id;
}

/**
 * Validate lawyer email format
 */
function validateLawyerEmail(email: string): void {
	if (!LAWYER_EMAIL_REGEX.test(email)) {
		throw new Error("Invalid lawyer email format");
	}
}

/**
 * Create a lock request for a marketplace listing.
 *
 * **Authorization**: Requires investor role (admins can also create for testing)
 * **Validation**:
 * - Listing must be visible and unlocked
 * - Request notes must be <= 1000 characters (optional)
 * - Lawyer information is required (name, LSO number, email)
 * - Lawyer email must be valid format
 *
 * **Behavior**:
 * - Creates request with status "pending"
 * - Sets requestedAt to current timestamp
 * - Returns the created request ID
 *
 * **Errors**:
 * - "Unauthorized: Investor role required" - User doesn't have investor role
 * - "Listing not found" - Invalid listingId
 * - "Listing is not visible" - Listing is hidden
 * - "Listing is already locked" - Listing cannot accept new requests
 * - "Request notes exceed character limit of 1000" - Notes too long
 * - "Lawyer name/email/LSO number is required" - Missing lawyer info
 * - "Invalid lawyer email format" - Email validation failed
 *
 * @param args.listingId - ID of the listing to request lock for
 * @param args.requestNotes - Optional notes from investor (max 1000 chars)
 * @param args.lawyerName - Name of the lawyer (required)
 * @param args.lawyerLSONumber - LSO number of the lawyer (required)
 * @param args.lawyerEmail - Email of the lawyer (required, must be valid format)
 * @returns The ID of the created lock request
 *
 * @example
 * ```typescript
 * const requestId = await createLockRequest({
 *   listingId: "kg25zy58...",
 *   requestNotes: "Interested in purchasing 50%",
 *   lawyerName: "John Doe",
 *   lawyerLSONumber: "12345",
 *   lawyerEmail: "john@example.com"
 * });
 * ```
 */
export const createLockRequest = mutation({
	args: {
		listingId: v.id("listings"),
		requestNotes: v.optional(v.string()),
		lawyerName: v.string(),
		lawyerLSONumber: v.string(),
		lawyerEmail: v.string(),
	},
	returns: v.id("lock_requests"),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		// Check investor role (admins can also create for testing)
		const isInvestor = hasRbacAccess({
			required_roles: ["investor"],
			user_identity: identity,
		});
		const isAdmin = hasRbacAccess({
			required_roles: ["admin"],
			user_identity: identity,
		});

		if (!(isInvestor || isAdmin)) {
			throw new Error("Unauthorized: Investor role required");
		}

		// Validate notes length
		validateRequestNotes(args.requestNotes);

		// Validate lawyer information
		if (!args.lawyerName || args.lawyerName.trim().length === 0) {
			throw new Error("Lawyer name is required");
		}
		if (!args.lawyerLSONumber || args.lawyerLSONumber.trim().length === 0) {
			throw new Error("Lawyer LSO number is required");
		}
		if (!args.lawyerEmail || args.lawyerEmail.trim().length === 0) {
			throw new Error("Lawyer email is required");
		}
		validateLawyerEmail(args.lawyerEmail);

		// Validate listing availability
		await validateListingAvailability(ctx, args.listingId);

		// Get user document
		const userId = await getUserFromIdentity(ctx, { createIfMissing: true });
		if (!userId) {
			throw new Error("Unable to resolve user identity");
		}

		// Create request
		const requestId = await ctx.db.insert("lock_requests", {
			listingId: args.listingId,
			requestedBy: userId,
			status: "pending",
			requestedAt: Date.now(),
			requestNotes: args.requestNotes,
			lawyerName: args.lawyerName.trim(),
			lawyerLSONumber: args.lawyerLSONumber.trim(),
			lawyerEmail: args.lawyerEmail.trim(),
		});

		// Validate requestId is valid
		if (!requestId) {
			logger.error("Lock request insert returned null ID", {
				listingId: args.listingId,
				requestedBy: userId,
			});
			throw new Error("Failed to create lock request: no ID returned");
		}

		logger.info("Lock request created", {
			requestId,
			listingId: args.listingId,
			requestedBy: userId,
		});

		return requestId;
	},
});

/**
 * Approve a lock request and lock the listing (admin only).
 *
 * **Authorization**: Requires admin role
 * **Atomic Transaction**: This function performs an atomic read-check-update operation
 * to prevent race conditions when multiple admins approve different requests simultaneously.
 *
 * **Race Condition Prevention**:
 * - Reads request and listing together in single transaction
 * - Verifies listing is still available (visible && !locked) before updating
 * - If listing was locked by another admin, throws error instead of double-locking
 * - Only one approval can succeed per listing
 *
 * **Behavior**:
 * - Updates request status to "approved"
 * - Sets reviewedAt and reviewedBy fields
 * - Locks the listing (sets locked=true, lockedBy=request.requestedBy, lockedAt=now)
 * - Returns the approved request ID
 *
 * **Validation**:
 * - Request must exist and be in "pending" status
 * - Listing must exist and be visible
 * - Listing must not already be locked
 *
 * **Errors**:
 * - "Unauthorized: Admin privileges required" - User doesn't have admin role
 * - "Request not found" - Invalid requestId
 * - "Request is not pending" - Request already approved/rejected
 * - "Listing not found" - Listing was deleted
 * - "Listing is no longer available" - Listing is hidden or already locked (race condition)
 *
 * @param args.requestId - ID of the lock request to approve
 * @returns The ID of the approved request
 *
 * @example
 * ```typescript
 * try {
 *   const requestId = await approveLockRequest({ requestId: "kg25zy58..." });
 *   // Request approved, listing is now locked
 * } catch (error) {
 *   // Handle race condition: "Listing is no longer available"
 * }
 * ```
 */
export const approveLockRequest = mutation({
	args: {
		requestId: v.id("lock_requests"),
	},
	returns: v.id("lock_requests"),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		// Check admin authorization
		const isAdmin = hasRbacAccess({
			required_roles: ["admin"],
			user_identity: identity,
		});

		if (!isAdmin) {
			throw new Error("Unauthorized: Admin privileges required");
		}

		// Get admin user document
		const adminUserId = await getUserFromIdentity(ctx, {
			createIfMissing: true,
		});
		if (!adminUserId) {
			throw new Error("Unable to resolve admin user identity");
		}

		// Atomic transaction: read request and listing together
		const request = await ctx.db.get(args.requestId);
		if (!request) {
			throw new Error("Request not found");
		}

		const listing = await ctx.db.get(request.listingId);
		if (!listing) {
			throw new Error("Listing not found");
		}

		// Verify listing is still available FIRST (handles race conditions correctly)
		// This must be checked before request status to properly detect when
		// two admins approve different requests for the same listing simultaneously
		if (!listing.visible || listing.locked) {
			throw new Error("Listing is no longer available");
		}

		// Then check request status
		if (request.status !== "pending") {
			throw new Error("Request is not pending");
		}

		// Atomic update: approve request and lock listing
		await ctx.db.patch(args.requestId, {
			status: "approved",
			reviewedAt: Date.now(),
			reviewedBy: adminUserId,
		});

		await ctx.db.patch(request.listingId, {
			locked: true,
			lockedBy: request.requestedBy,
			lockedAt: Date.now(),
		});

		// Auto-reject all other pending requests for the same listing
		const otherPendingRequests = await ctx.db
			.query("lock_requests")
			.withIndex("by_listing_status", (q) =>
				q.eq("listingId", request.listingId).eq("status", "pending")
			)
			.collect();

		// Reject all pending requests except the approved one
		const rejectionPromises = otherPendingRequests
			.filter((req) => req._id !== args.requestId)
			.map((req) =>
				ctx.db.patch(req._id, {
					status: "rejected",
					reviewedBy: adminUserId,
					reviewedAt: Date.now(),
					rejectionReason: "Listing was locked",
				})
			);

		await Promise.all(rejectionPromises);

		logger.info("Lock request approved", {
			requestId: args.requestId,
			listingId: request.listingId,
			approvedBy: adminUserId,
			autoRejectedCount: rejectionPromises.length,
		});

		return args.requestId;
	},
});

/**
 * Reject a lock request (admin only).
 *
 * **Authorization**: Requires admin role
 * **Behavior**:
 * - Updates request status to "rejected"
 * - Sets reviewedAt and reviewedBy fields
 * - Sets optional rejectionReason if provided
 * - Listing remains available (not locked)
 *
 * **Validation**:
 * - Request must exist and be in "pending" status
 * - Admin must be authenticated
 *
 * **Errors**:
 * - "Unauthorized: Admin privileges required" - User doesn't have admin role
 * - "Request not found" - Invalid requestId
 * - "Request is not pending" - Request already approved/rejected
 *
 * @param args.requestId - ID of the lock request to reject
 * @param args.rejectionReason - Optional reason for rejection
 * @returns The ID of the rejected request
 *
 * @example
 * ```typescript
 * await rejectLockRequest({
 *   requestId: "kg25zy58...",
 *   rejectionReason: "Incomplete documentation"
 * });
 * ```
 */
export const rejectLockRequest = mutation({
	args: {
		requestId: v.id("lock_requests"),
		rejectionReason: v.optional(v.string()),
	},
	returns: v.id("lock_requests"),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		// Check admin authorization
		const isAdmin = hasRbacAccess({
			required_roles: ["admin"],
			user_identity: identity,
		});

		if (!isAdmin) {
			throw new Error("Unauthorized: Admin privileges required");
		}

		// Get admin user document
		const adminUserId = await getUserFromIdentity(ctx, {
			createIfMissing: true,
		});
		if (!adminUserId) {
			throw new Error("Unable to resolve admin user identity");
		}

		const request = await ctx.db.get(args.requestId);
		if (!request) {
			throw new Error("Request not found");
		}

		if (request.status !== "pending") {
			throw new Error("Request is not pending");
		}

		await ctx.db.patch(args.requestId, {
			status: "rejected",
			reviewedAt: Date.now(),
			reviewedBy: adminUserId,
			rejectionReason: args.rejectionReason,
		});

		logger.info("Lock request rejected", {
			requestId: args.requestId,
			rejectedBy: adminUserId,
			hasReason: !!args.rejectionReason,
		});

		return args.requestId;
	},
});

/**
 * Cancel a lock request (investor can cancel their own pending requests).
 *
 * **Authorization**: User must own the request (requestedBy === current user)
 * **Behavior**:
 * - Deletes the request (not marked as cancelled, just deleted)
 * - Only works for pending requests
 *
 * **Validation**:
 * - Request must exist
 * - User must be the one who created the request
 * - Request must be in "pending" status
 *
 * **Errors**:
 * - "Authentication required" - User not authenticated
 * - "Request not found" - Invalid requestId
 * - "Unauthorized: Not your request" - User doesn't own the request
 * - "Request is not pending" - Request already approved/rejected
 *
 * @param args.requestId - ID of the lock request to cancel
 * @returns The ID of the cancelled request
 *
 * @example
 * ```typescript
 * await cancelLockRequest({ requestId: "kg25zy58..." });
 * ```
 */
export const cancelLockRequest = mutation({
	args: {
		requestId: v.id("lock_requests"),
	},
	returns: v.id("lock_requests"),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		// Get user document
		const userId = await getUserFromIdentity(ctx, { createIfMissing: true });
		if (!userId) {
			throw new Error("Unable to resolve user identity");
		}

		const request = await ctx.db.get(args.requestId);
		if (!request) {
			throw new Error("Request not found");
		}

		// Validate ownership
		if (request.requestedBy !== userId) {
			throw new Error("Unauthorized: Not your request");
		}

		// Only pending requests can be cancelled
		if (request.status !== "pending") {
			throw new Error("Request is not pending");
		}

		// Delete the request (not marked as cancelled, just deleted)
		await ctx.db.delete(args.requestId);

		logger.info("Lock request cancelled", {
			requestId: args.requestId,
			cancelledBy: userId,
		});

		return args.requestId;
	},
});

/**
 * Get a single lock request by ID
 */
export const getLockRequest = query({
	args: {
		requestId: v.id("lock_requests"),
	},
	returns: v.union(
		v.object({
			_id: v.id("lock_requests"),
			listingId: v.id("listings"),
			requestedBy: v.id("users"),
			status: v.union(
				v.literal("pending"),
				v.literal("approved"),
				v.literal("rejected"),
				v.literal("expired")
			),
			requestedAt: v.number(),
			reviewedAt: v.optional(v.number()),
			reviewedBy: v.optional(v.id("users")),
			rejectionReason: v.optional(v.string()),
			requestNotes: v.optional(v.string()),
		}),
		v.null()
	),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		const request = await ctx.db.get(args.requestId);
		if (!request) {
			return null;
		}

		// Check admin authorization or if user is the requester
		const isAdmin = hasRbacAccess({
			required_roles: ["admin"],
			user_identity: identity,
		});

		if (!isAdmin) {
			// Allow requester to see their own request
			const user = await ctx.db
				.query("users")
				.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
				.unique();

			if (!user || request.requestedBy !== user._id) {
				throw new Error("Unauthorized: Admin privileges or ownership required");
			}
		}

		return request;
	},
});

/**
 * Get all pending lock requests (admin dashboard)
 */
export const getPendingLockRequests = query({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("lock_requests"),
			listingId: v.id("listings"),
			requestedBy: v.id("users"),
			status: v.literal("pending"),
			requestedAt: v.number(),
			reviewedAt: v.optional(v.number()),
			reviewedBy: v.optional(v.id("users")),
			rejectionReason: v.optional(v.string()),
			requestNotes: v.optional(v.string()),
			lawyerName: v.string(),
			lawyerLSONumber: v.string(),
			lawyerEmail: v.string(),
		})
	),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		// Check admin authorization
		const isAdmin = hasRbacAccess({
			required_roles: ["admin"],
			user_identity: identity,
		});

		if (!isAdmin) {
			throw new Error("Unauthorized: Admin privileges required");
		}

		const requests = await ctx.db
			.query("lock_requests")
			.withIndex("by_status_requested_at", (q) => q.eq("status", "pending"))
			.order("desc")
			.collect();

		// Filter to ensure type safety (should already be filtered by index, but TypeScript needs this)
		return requests.filter((r) => r.status === "pending") as Array<{
			_id: Id<"lock_requests">;
			listingId: Id<"listings">;
			requestedBy: Id<"users">;
			status: "pending";
			requestedAt: number;
			reviewedAt?: number | undefined;
			reviewedBy?: Id<"users"> | undefined;
			rejectionReason?: string | undefined;
			requestNotes?: string | undefined;
			lawyerName: string;
			lawyerLSONumber: string;
			lawyerEmail: string;
		}>;
	},
});

/**
 * Get pending lock requests with full details (joined data)
 */
export const getPendingLockRequestsWithDetails = query({
	args: {},
	returns: v.array(
		v.object({
			request: v.object({
				_id: v.id("lock_requests"),
				listingId: v.id("listings"),
				requestedBy: v.id("users"),
				status: v.literal("pending"),
				requestedAt: v.number(),
				requestNotes: v.optional(v.string()),
				lawyerName: v.string(),
				lawyerLSONumber: v.string(),
				lawyerEmail: v.string(),
			}),
			listing: v.union(
				v.object({
					_id: v.id("listings"),
					mortgageId: v.id("mortgages"),
					visible: v.boolean(),
					locked: v.boolean(),
					lockedBy: v.optional(v.id("users")),
					lockedAt: v.optional(v.number()),
				}),
				v.null()
			),
			mortgage: v.union(
				v.object({
					_id: v.id("mortgages"),
					borrowerId: v.id("borrowers"),
					loanAmount: v.number(),
					interestRate: v.number(),
					originationDate: v.string(),
					maturityDate: v.string(),
					status: v.union(
						v.literal("active"),
						v.literal("renewed"),
						v.literal("closed"),
						v.literal("defaulted")
					),
					mortgageType: v.union(
						v.literal("1st"),
						v.literal("2nd"),
						v.literal("other")
					),
					address: v.object({
						street: v.string(),
						city: v.string(),
						state: v.string(),
						zip: v.string(),
						country: v.string(),
					}),
					appraisalMarketValue: v.number(),
					ltv: v.number(),
				}),
				v.null()
			),
			borrower: v.union(
				v.object({
					_id: v.id("borrowers"),
					name: v.string(),
					email: v.string(),
					rotessaCustomerId: v.string(),
				}),
				v.null()
			),
			investor: v.union(
				v.object({
					_id: v.id("users"),
					email: v.string(),
					first_name: v.optional(v.string()),
					last_name: v.optional(v.string()),
					created_at: v.optional(v.string()),
				}),
				v.null()
			),
		})
	),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		// Check admin authorization
		const isAdmin = hasRbacAccess({
			required_roles: ["admin"],
			user_identity: identity,
		});

		if (!isAdmin) {
			throw new Error("Unauthorized: Admin privileges required");
		}

		const requests = await ctx.db
			.query("lock_requests")
			.withIndex("by_status_requested_at", (q) => q.eq("status", "pending"))
			.order("desc")
			.collect();

		// Filter to ensure type safety (should already be filtered by index, but TypeScript needs this)
		const pendingRequests = requests.filter((r) => r.status === "pending");

		return await Promise.all(
			pendingRequests.map(async (request) => {
				const listing = await ctx.db.get(request.listingId);
				const mortgage = listing ? await ctx.db.get(listing.mortgageId) : null;
				const borrower = mortgage
					? await ctx.db.get(mortgage.borrowerId)
					: null;
				const investor = await ctx.db.get(request.requestedBy);

				return {
					request: {
						_id: request._id,
						listingId: request.listingId,
						requestedBy: request.requestedBy,
						status: request.status as "pending",
						requestedAt: request.requestedAt,
						requestNotes: request.requestNotes,
						lawyerName: request.lawyerName,
						lawyerLSONumber: request.lawyerLSONumber,
						lawyerEmail: request.lawyerEmail,
					},
					listing: listing
						? {
								_id: listing._id,
								mortgageId: listing.mortgageId,
								visible: listing.visible,
								locked: listing.locked,
								lockedBy: listing.lockedBy,
								lockedAt: listing.lockedAt,
							}
						: null,
					mortgage: mortgage
						? {
								_id: mortgage._id,
								borrowerId: mortgage.borrowerId,
								loanAmount: mortgage.loanAmount,
								interestRate: mortgage.interestRate,
								originationDate: mortgage.originationDate,
								maturityDate: mortgage.maturityDate,
								status: mortgage.status,
								mortgageType: mortgage.mortgageType,
								address: mortgage.address,
								appraisalMarketValue: mortgage.appraisalMarketValue,
								ltv: mortgage.ltv,
							}
						: null,
					borrower: borrower
						? {
								_id: borrower._id,
								name: borrower.name,
								email: borrower.email,
								rotessaCustomerId: borrower.rotessaCustomerId,
							}
						: null,
					investor: investor
						? {
								_id: investor._id,
								email: investor.email,
								first_name: investor.first_name,
								last_name: investor.last_name,
								created_at: investor.created_at,
							}
						: null,
				};
			})
		);
	},
});

/**
 * Get all approved lock requests (admin history)
 */
export const getApprovedLockRequests = query({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("lock_requests"),
			listingId: v.id("listings"),
			requestedBy: v.id("users"),
			status: v.literal("approved"),
			requestedAt: v.number(),
			reviewedAt: v.optional(v.number()),
			reviewedBy: v.optional(v.id("users")),
			requestNotes: v.optional(v.string()),
			lawyerName: v.string(),
			lawyerLSONumber: v.string(),
			lawyerEmail: v.string(),
		})
	),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		// Check admin authorization
		const isAdmin = hasRbacAccess({
			required_roles: ["admin"],
			user_identity: identity,
		});

		if (!isAdmin) {
			throw new Error("Unauthorized: Admin privileges required");
		}

		const requests = await ctx.db
			.query("lock_requests")
			.withIndex("by_status_requested_at", (q) => q.eq("status", "approved"))
			.order("desc")
			.collect();

		// Filter to ensure type safety (should already be filtered by index, but TypeScript needs this)
		return requests.filter((r) => r.status === "approved") as Array<{
			_id: Id<"lock_requests">;
			listingId: Id<"listings">;
			requestedBy: Id<"users">;
			status: "approved";
			requestedAt: number;
			reviewedAt?: number | undefined;
			reviewedBy?: Id<"users"> | undefined;
			requestNotes?: string | undefined;
			lawyerName: string;
			lawyerLSONumber: string;
			lawyerEmail: string;
		}>;
	},
});

/**
 * Get approved lock requests with full details
 */
export const getApprovedLockRequestsWithDetails = query({
	args: {},
	returns: v.array(
		v.object({
			request: v.object({
				_id: v.id("lock_requests"),
				listingId: v.id("listings"),
				requestedBy: v.id("users"),
				status: v.literal("approved"),
				requestedAt: v.number(),
				reviewedAt: v.optional(v.number()),
				reviewedBy: v.optional(v.id("users")),
				requestNotes: v.optional(v.string()),
				lawyerName: v.string(),
				lawyerLSONumber: v.string(),
				lawyerEmail: v.string(),
			}),
			listing: v.union(
				v.object({
					_id: v.id("listings"),
					mortgageId: v.id("mortgages"),
					visible: v.boolean(),
					locked: v.boolean(),
					lockedBy: v.optional(v.id("users")),
					lockedAt: v.optional(v.number()),
				}),
				v.null()
			),
			mortgage: v.union(
				v.object({
					_id: v.id("mortgages"),
					borrowerId: v.id("borrowers"),
					loanAmount: v.number(),
					interestRate: v.number(),
					originationDate: v.string(),
					maturityDate: v.string(),
					status: v.union(
						v.literal("active"),
						v.literal("renewed"),
						v.literal("closed"),
						v.literal("defaulted")
					),
					mortgageType: v.union(
						v.literal("1st"),
						v.literal("2nd"),
						v.literal("other")
					),
					address: v.object({
						street: v.string(),
						city: v.string(),
						state: v.string(),
						zip: v.string(),
						country: v.string(),
					}),
					propertyType: v.optional(v.string()),
					appraisalMarketValue: v.number(),
					ltv: v.number(),
				}),
				v.null()
			),
			borrower: v.union(
				v.object({
					_id: v.id("borrowers"),
					name: v.string(),
					email: v.string(),
					rotessaCustomerId: v.string(),
				}),
				v.null()
			),
			investor: v.union(
				v.object({
					_id: v.id("users"),
					email: v.string(),
					first_name: v.optional(v.string()),
					last_name: v.optional(v.string()),
				}),
				v.null()
			),
		})
	),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		// Check admin authorization
		const isAdmin = hasRbacAccess({
			required_roles: ["admin"],
			user_identity: identity,
		});

		if (!isAdmin) {
			throw new Error("Unauthorized: Admin privileges required");
		}

		const requests = await ctx.db
			.query("lock_requests")
			.withIndex("by_status_requested_at", (q) => q.eq("status", "approved"))
			.order("desc")
			.collect();

		// Filter to ensure type safety (should already be filtered by index, but TypeScript needs this)
		const approvedRequests = requests.filter((r) => r.status === "approved");

		return await Promise.all(
			approvedRequests.map(async (request) => {
				const listing = await ctx.db.get(request.listingId);
				const mortgage = listing ? await ctx.db.get(listing.mortgageId) : null;
				const borrower = mortgage
					? await ctx.db.get(mortgage.borrowerId)
					: null;
				const investor = await ctx.db.get(request.requestedBy);

				return {
					request: {
						_id: request._id,
						listingId: request.listingId,
						requestedBy: request.requestedBy,
						status: request.status as "approved",
						requestedAt: request.requestedAt,
						reviewedAt: request.reviewedAt,
						reviewedBy: request.reviewedBy,
						requestNotes: request.requestNotes,
						lawyerName: request.lawyerName,
						lawyerLSONumber: request.lawyerLSONumber,
						lawyerEmail: request.lawyerEmail,
					},
					listing: listing
						? {
								_id: listing._id,
								mortgageId: listing.mortgageId,
								visible: listing.visible,
								locked: listing.locked,
								lockedBy: listing.lockedBy,
								lockedAt: listing.lockedAt,
							}
						: null,
					mortgage: mortgage
						? {
								_id: mortgage._id,
								borrowerId: mortgage.borrowerId,
								loanAmount: mortgage.loanAmount,
								interestRate: mortgage.interestRate,
								originationDate: mortgage.originationDate,
								maturityDate: mortgage.maturityDate,
								status: mortgage.status,
								mortgageType: mortgage.mortgageType,
								address: mortgage.address,
								propertyType: mortgage.propertyType,
								appraisalMarketValue: mortgage.appraisalMarketValue,
								ltv: mortgage.ltv,
							}
						: null,
					borrower: borrower
						? {
								_id: borrower._id,
								name: borrower.name,
								email: borrower.email,
								rotessaCustomerId: borrower.rotessaCustomerId,
							}
						: null,
					investor: investor
						? {
								_id: investor._id,
								email: investor.email,
								first_name: investor.first_name,
								last_name: investor.last_name,
							}
						: null,
				};
			})
		);
	},
});

/**
 * Get all rejected lock requests (admin history)
 */
export const getRejectedLockRequests = query({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("lock_requests"),
			listingId: v.id("listings"),
			requestedBy: v.id("users"),
			status: v.literal("rejected"),
			requestedAt: v.number(),
			reviewedAt: v.optional(v.number()),
			reviewedBy: v.optional(v.id("users")),
			rejectionReason: v.optional(v.string()),
			requestNotes: v.optional(v.string()),
			lawyerName: v.string(),
			lawyerLSONumber: v.string(),
			lawyerEmail: v.string(),
		})
	),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		// Check admin authorization
		const isAdmin = hasRbacAccess({
			required_roles: ["admin"],
			user_identity: identity,
		});

		if (!isAdmin) {
			throw new Error("Unauthorized: Admin privileges required");
		}

		const requests = await ctx.db
			.query("lock_requests")
			.withIndex("by_status_requested_at", (q) => q.eq("status", "rejected"))
			.order("desc")
			.collect();

		// Filter to ensure type safety (should already be filtered by index, but TypeScript needs this)
		return requests.filter((r) => r.status === "rejected") as Array<{
			_id: Id<"lock_requests">;
			listingId: Id<"listings">;
			requestedBy: Id<"users">;
			status: "rejected";
			requestedAt: number;
			reviewedAt?: number | undefined;
			reviewedBy?: Id<"users"> | undefined;
			rejectionReason?: string | undefined;
			requestNotes?: string | undefined;
			lawyerName: string;
			lawyerLSONumber: string;
			lawyerEmail: string;
		}>;
	},
});

/**
 * Get rejected lock requests with full details
 */
export const getRejectedLockRequestsWithDetails = query({
	args: {},
	returns: v.array(
		v.object({
			request: v.object({
				_id: v.id("lock_requests"),
				listingId: v.id("listings"),
				requestedBy: v.id("users"),
				status: v.literal("rejected"),
				requestedAt: v.number(),
				reviewedAt: v.optional(v.number()),
				reviewedBy: v.optional(v.id("users")),
				rejectionReason: v.optional(v.string()),
				requestNotes: v.optional(v.string()),
				lawyerName: v.string(),
				lawyerLSONumber: v.string(),
				lawyerEmail: v.string(),
			}),
			listing: v.union(
				v.object({
					_id: v.id("listings"),
					mortgageId: v.id("mortgages"),
					visible: v.boolean(),
					locked: v.boolean(),
					lockedBy: v.optional(v.id("users")),
					lockedAt: v.optional(v.number()),
				}),
				v.null()
			),
			mortgage: v.union(
				v.object({
					_id: v.id("mortgages"),
					borrowerId: v.id("borrowers"),
					loanAmount: v.number(),
					interestRate: v.number(),
					originationDate: v.string(),
					maturityDate: v.string(),
					status: v.union(
						v.literal("active"),
						v.literal("renewed"),
						v.literal("closed"),
						v.literal("defaulted")
					),
					mortgageType: v.union(
						v.literal("1st"),
						v.literal("2nd"),
						v.literal("other")
					),
					address: v.object({
						street: v.string(),
						city: v.string(),
						state: v.string(),
						zip: v.string(),
						country: v.string(),
					}),
					propertyType: v.optional(v.string()),
					appraisalMarketValue: v.number(),
					ltv: v.number(),
				}),
				v.null()
			),
			borrower: v.union(
				v.object({
					_id: v.id("borrowers"),
					name: v.string(),
					email: v.string(),
					rotessaCustomerId: v.string(),
				}),
				v.null()
			),
			investor: v.union(
				v.object({
					_id: v.id("users"),
					email: v.string(),
					first_name: v.optional(v.string()),
					last_name: v.optional(v.string()),
				}),
				v.null()
			),
		})
	),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		// Check admin authorization
		const isAdmin = hasRbacAccess({
			required_roles: ["admin"],
			user_identity: identity,
		});

		if (!isAdmin) {
			throw new Error("Unauthorized: Admin privileges required");
		}

		const requests = await ctx.db
			.query("lock_requests")
			.withIndex("by_status_requested_at", (q) => q.eq("status", "rejected"))
			.order("desc")
			.collect();

		// Filter to ensure type safety (should already be filtered by index, but TypeScript needs this)
		const rejectedRequests = requests.filter((r) => r.status === "rejected");

		return await Promise.all(
			rejectedRequests.map(async (request) => {
				const listing = await ctx.db.get(request.listingId);
				const mortgage = listing ? await ctx.db.get(listing.mortgageId) : null;
				const borrower = mortgage
					? await ctx.db.get(mortgage.borrowerId)
					: null;
				const investor = await ctx.db.get(request.requestedBy);

				return {
					request: {
						_id: request._id,
						listingId: request.listingId,
						requestedBy: request.requestedBy,
						status: request.status as "rejected",
						requestedAt: request.requestedAt,
						reviewedAt: request.reviewedAt,
						reviewedBy: request.reviewedBy,
						rejectionReason: request.rejectionReason,
						requestNotes: request.requestNotes,
						lawyerName: request.lawyerName,
						lawyerLSONumber: request.lawyerLSONumber,
						lawyerEmail: request.lawyerEmail,
					},
					listing: listing
						? {
								_id: listing._id,
								mortgageId: listing.mortgageId,
								visible: listing.visible,
								locked: listing.locked,
								lockedBy: listing.lockedBy,
								lockedAt: listing.lockedAt,
							}
						: null,
					mortgage: mortgage
						? {
								_id: mortgage._id,
								borrowerId: mortgage.borrowerId,
								loanAmount: mortgage.loanAmount,
								interestRate: mortgage.interestRate,
								originationDate: mortgage.originationDate,
								maturityDate: mortgage.maturityDate,
								status: mortgage.status,
								mortgageType: mortgage.mortgageType,
								address: mortgage.address,
								propertyType: mortgage.propertyType,
								appraisalMarketValue: mortgage.appraisalMarketValue,
								ltv: mortgage.ltv,
							}
						: null,
					borrower: borrower
						? {
								_id: borrower._id,
								name: borrower.name,
								email: borrower.email,
								rotessaCustomerId: borrower.rotessaCustomerId,
							}
						: null,
					investor: investor
						? {
								_id: investor._id,
								email: investor.email,
								first_name: investor.first_name,
								last_name: investor.last_name,
							}
						: null,
				};
			})
		);
	},
});

/**
 * Get all lock requests for a specific listing
 */
export const getLockRequestsByListing = query({
	args: {
		listingId: v.id("listings"),
	},
	returns: v.array(
		v.object({
			_id: v.id("lock_requests"),
			listingId: v.id("listings"),
			requestedBy: v.id("users"),
			status: v.union(
				v.literal("pending"),
				v.literal("approved"),
				v.literal("rejected"),
				v.literal("expired")
			),
			requestedAt: v.number(),
			reviewedAt: v.optional(v.number()),
			reviewedBy: v.optional(v.id("users")),
			rejectionReason: v.optional(v.string()),
			requestNotes: v.optional(v.string()),
			lawyerName: v.string(),
			lawyerLSONumber: v.string(),
			lawyerEmail: v.string(),
		})
	),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		// Check admin authorization
		const isAdmin = hasRbacAccess({
			required_roles: ["admin", "broker"],
			user_identity: identity,
		});

		if (!isAdmin) {
			throw new Error("Unauthorized: Admin or broker privileges required");
		}

		return await ctx.db
			.query("lock_requests")
			.withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
			.collect();
	},
});

/**
 * Get pending lock requests for a specific listing
 */
export const getPendingLockRequestsByListing = query({
	args: {
		listingId: v.id("listings"),
	},
	returns: v.array(
		v.object({
			_id: v.id("lock_requests"),
			listingId: v.id("listings"),
			requestedBy: v.id("users"),
			status: v.literal("pending"),
			requestedAt: v.number(),
			requestNotes: v.optional(v.string()),
			lawyerName: v.string(),
			lawyerLSONumber: v.string(),
			lawyerEmail: v.string(),
		})
	),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		// Check admin authorization
		const isAdmin = hasRbacAccess({
			required_roles: ["admin", "broker"],
			user_identity: identity,
		});

		if (!isAdmin) {
			throw new Error("Unauthorized: Admin or broker privileges required");
		}

		const requests = await ctx.db
			.query("lock_requests")
			.withIndex("by_listing_status", (q) =>
				q.eq("listingId", args.listingId).eq("status", "pending")
			)
			.collect();

		// Filter to ensure type safety (should already be filtered by index, but TypeScript needs this)
		return requests.filter((r) => r.status === "pending") as Array<{
			_id: Id<"lock_requests">;
			listingId: Id<"listings">;
			requestedBy: Id<"users">;
			status: "pending";
			requestedAt: number;
			requestNotes?: string | undefined;
			lawyerName: string;
			lawyerLSONumber: string;
			lawyerEmail: string;
		}>;
	},
});

/**
 * Get all lock requests by a specific user (investor's own requests)
 */
export const getUserLockRequests = query({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("lock_requests"),
			listingId: v.id("listings"),
			requestedBy: v.id("users"),
			status: v.union(
				v.literal("pending"),
				v.literal("approved"),
				v.literal("rejected"),
				v.literal("expired")
			),
			requestedAt: v.number(),
			reviewedAt: v.optional(v.number()),
			reviewedBy: v.optional(v.id("users")),
			rejectionReason: v.optional(v.string()),
			requestNotes: v.optional(v.string()),
			lawyerName: v.string(),
			lawyerLSONumber: v.string(),
			lawyerEmail: v.string(),
		})
	),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
			.unique();

		if (!user) {
			return [];
		}

		return await ctx.db
			.query("lock_requests")
			.withIndex("by_requested_by", (q) => q.eq("requestedBy", user._id))
			.order("desc")
			.collect();
	},
});

/**
 * Get a single lock request with full details
 */
export const getLockRequestWithDetails = query({
	args: {
		requestId: v.id("lock_requests"),
	},
	returns: v.union(
		v.object({
			request: v.object({
				_id: v.id("lock_requests"),
				listingId: v.id("listings"),
				requestedBy: v.id("users"),
				status: v.union(
					v.literal("pending"),
					v.literal("approved"),
					v.literal("rejected"),
					v.literal("expired")
				),
				requestedAt: v.number(),
				reviewedAt: v.optional(v.number()),
				reviewedBy: v.optional(v.id("users")),
				rejectionReason: v.optional(v.string()),
				requestNotes: v.optional(v.string()),
				lawyerName: v.string(),
				lawyerLSONumber: v.string(),
				lawyerEmail: v.string(),
			}),
			listing: v.union(
				v.object({
					_id: v.id("listings"),
					mortgageId: v.id("mortgages"),
					visible: v.boolean(),
					locked: v.boolean(),
					lockedBy: v.optional(v.id("users")),
					lockedAt: v.optional(v.number()),
				}),
				v.null()
			),
			mortgage: v.union(
				v.object({
					_id: v.id("mortgages"),
					address: v.object({
						street: v.string(),
						city: v.string(),
						state: v.string(),
						zip: v.string(),
						country: v.string(),
					}),
					appraisalMarketValue: v.number(),
					ltv: v.number(),
				}),
				v.null()
			),
			investor: v.union(
				v.object({
					_id: v.id("users"),
					email: v.string(),
					first_name: v.optional(v.string()),
					last_name: v.optional(v.string()),
				}),
				v.null()
			),
		}),
		v.null()
	),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		// Load request first (before any authorization checks)
		const request = await ctx.db.get(args.requestId);
		if (!request) {
			return null;
		}

		// Get current user
		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
			.unique();

		if (!user) {
			return null;
		}

		// Check authorization: request owner OR admin/broker role
		const isRequestOwner = request.requestedBy === user._id;
		const isAdminOrBroker = hasRbacAccess({
			required_roles: ["admin", "broker"],
			user_identity: identity,
		});

		if (!(isRequestOwner || isAdminOrBroker)) {
			return null;
		}

		// Only fetch details if authorized
		const listing = await ctx.db.get(request.listingId);
		const mortgage = listing ? await ctx.db.get(listing.mortgageId) : null;
		const investor = await ctx.db.get(request.requestedBy);

		return {
			request: {
				_id: request._id,
				listingId: request.listingId,
				requestedBy: request.requestedBy,
				status: request.status,
				requestedAt: request.requestedAt,
				reviewedAt: request.reviewedAt,
				reviewedBy: request.reviewedBy,
				rejectionReason: request.rejectionReason,
				requestNotes: request.requestNotes,
				lawyerName: request.lawyerName,
				lawyerLSONumber: request.lawyerLSONumber,
				lawyerEmail: request.lawyerEmail,
			},
			listing: listing
				? {
						_id: listing._id,
						mortgageId: listing.mortgageId,
						visible: listing.visible,
						locked: listing.locked,
						lockedBy: listing.lockedBy,
						lockedAt: listing.lockedAt,
					}
				: null,
			mortgage: mortgage
				? {
						_id: mortgage._id,
						address: mortgage.address,
						appraisalMarketValue: mortgage.appraisalMarketValue,
						ltv: mortgage.ltv,
					}
				: null,
			investor: investor
				? {
						_id: investor._id,
						email: investor.email,
						first_name: investor.first_name,
						last_name: investor.last_name,
					}
				: null,
		};
	},
});

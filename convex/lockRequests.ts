/**
 * Lock request management for marketplace listings
 * Handles investor-initiated lock requests with admin approval workflow
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { hasRbacAccess } from "./auth.config";
import { logger } from "../lib/logger";

const MAX_NOTES_LENGTH = 1000;

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
	ctx: { db: any },
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
 */
async function getUserFromIdentity(
	ctx: { db: any; auth: any }
): Promise<Id<"users">> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Authentication required");
	}

	const user = await ctx.db
		.query("users")
		.withIndex("by_idp_id", (q: any) => q.eq("idp_id", identity.subject))
		.unique();

	if (!user) {
		throw new Error("User not found");
	}

	return user._id;
}

/**
 * Validate lawyer email format
 */
function validateLawyerEmail(email: string): void {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		throw new Error("Invalid lawyer email format");
	}
}

/**
 * Create a lock request (investor role required)
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

		if (!isInvestor && !isAdmin) {
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
		const userId = await getUserFromIdentity(ctx);

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

		// Verify request was actually created
		const verifiedRequest = await ctx.db.get(requestId);
		if (!verifiedRequest) {
			logger.error("Lock request insert failed verification", {
				requestId,
				listingId: args.listingId,
				requestedBy: userId,
			});
			throw new Error("Failed to create lock request: verification failed");
		}

		logger.info("Lock request created and verified", {
			requestId,
			listingId: args.listingId,
			requestedBy: userId,
			status: verifiedRequest.status,
		});

		return requestId;
	},
});

/**
 * Approve a lock request (admin only, atomic transaction)
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
		const adminUserId = await getUserFromIdentity(ctx);

		// Atomic transaction: read request and listing together
		const request = await ctx.db.get(args.requestId);
		if (!request) {
			throw new Error("Request not found");
		}

		if (request.status !== "pending") {
			throw new Error("Request is not pending");
		}

		const listing = await ctx.db.get(request.listingId);
		if (!listing) {
			throw new Error("Listing not found");
		}

		// Verify listing is still available (race condition check)
		if (!listing.visible || listing.locked) {
			throw new Error("Listing is no longer available");
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

		logger.info("Lock request approved", {
			requestId: args.requestId,
			listingId: request.listingId,
			approvedBy: adminUserId,
		});

		return args.requestId;
	},
});

/**
 * Reject a lock request (admin only)
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
		const adminUserId = await getUserFromIdentity(ctx);

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
 * Cancel a lock request (investor can cancel their own pending requests)
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
		const userId = await getUserFromIdentity(ctx);

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
		return await ctx.db.get(args.requestId);
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
		const requests = await ctx.db
			.query("lock_requests")
			.withIndex("by_status_requested_at", (q) =>
				q.eq("status", "pending")
			)
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
		const requests = await ctx.db
			.query("lock_requests")
			.withIndex("by_status_requested_at", (q) =>
				q.eq("status", "pending")
			)
			.order("desc")
			.collect();

		// Filter to ensure type safety (should already be filtered by index, but TypeScript needs this)
		const pendingRequests = requests.filter((r) => r.status === "pending");

		return await Promise.all(
			pendingRequests.map(async (request) => {
				const listing = await ctx.db.get(request.listingId);
				const mortgage = listing
					? await ctx.db.get(listing.mortgageId)
					: null;
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
		const requests = await ctx.db
			.query("lock_requests")
			.withIndex("by_status_requested_at", (q) =>
				q.eq("status", "approved")
			)
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
		})
	),
	handler: async (ctx) => {
		const requests = await ctx.db
			.query("lock_requests")
			.withIndex("by_status_requested_at", (q) =>
				q.eq("status", "approved")
			)
			.order("desc")
			.collect();

		// Filter to ensure type safety (should already be filtered by index, but TypeScript needs this)
		const approvedRequests = requests.filter((r) => r.status === "approved");

		return await Promise.all(
			approvedRequests.map(async (request) => {
				const listing = await ctx.db.get(request.listingId);
				const mortgage = listing
					? await ctx.db.get(listing.mortgageId)
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
		const requests = await ctx.db
			.query("lock_requests")
			.withIndex("by_status_requested_at", (q) =>
				q.eq("status", "rejected")
			)
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
		const requests = await ctx.db
			.query("lock_requests")
			.withIndex("by_status_requested_at", (q) =>
				q.eq("status", "rejected")
			)
			.order("desc")
			.collect();

		// Filter to ensure type safety (should already be filtered by index, but TypeScript needs this)
		const rejectedRequests = requests.filter((r) => r.status === "rejected");

		return await Promise.all(
			rejectedRequests.map(async (request) => {
				const listing = await ctx.db.get(request.listingId);
				const mortgage = listing
					? await ctx.db.get(listing.mortgageId)
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
							}
						: null,
					mortgage: mortgage
						? {
								_id: mortgage._id,
								address: mortgage.address,
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
		const request = await ctx.db.get(args.requestId);
		if (!request) {
			return null;
		}

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


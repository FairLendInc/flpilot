/**
 * Deferral Request Management
 *
 * Handles borrower self-service deferral requests and admin approval workflow.
 * Borrowers can request one deferral per loan per year.
 */

import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, internalQuery } from "./_generated/server";
import {
	type AuthorizedMutationCtx,
	type AuthorizedQueryCtx,
	createAuthorizedMutation,
	createAuthorizedQuery,
} from "./lib/server";

// ============================================================================
// Schema Validators
// ============================================================================

const deferralRequestSchema = v.object({
	_id: v.id("deferral_requests"),
	_creationTime: v.number(),
	borrowerId: v.id("borrowers"),
	mortgageId: v.id("mortgages"),
	requestType: v.union(v.literal("one_time"), v.literal("hardship")),
	requestedDeferralDate: v.string(),
	reason: v.optional(v.string()),
	status: v.union(
		v.literal("pending"),
		v.literal("approved"),
		v.literal("rejected")
	),
	adminDecision: v.optional(
		v.object({
			decidedBy: v.id("users"),
			decidedAt: v.string(),
			reason: v.optional(v.string()),
		})
	),
	rotessaAdjustmentId: v.optional(v.string()),
	createdAt: v.string(),
});

const eligibilityResultSchema = v.object({
	eligible: v.boolean(),
	reason: v.optional(v.string()),
	previousDeferral: v.optional(
		v.object({
			date: v.string(),
			propertyAddress: v.string(),
		})
	),
});

// ============================================================================
// Authorization
// ============================================================================

const borrowerQuery = createAuthorizedQuery(["any"]);
const borrowerMutation = createAuthorizedMutation(["any"]);
const adminQuery = createAuthorizedQuery(["admin"]);
const adminMutation = createAuthorizedMutation(["admin"]);

// ============================================================================
// Borrower Self-Service
// ============================================================================

/**
 * Check if borrower is eligible to request a deferral for a mortgage
 * Rule: One deferral per loan per year
 */
export const checkEligibility = borrowerQuery({
	args: {
		mortgageId: v.id("mortgages"),
	},
	returns: eligibilityResultSchema,
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}

		// Look up user by identity subject (idp_id)
		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", subject))
			.unique();

		if (!user) {
			return {
				eligible: false,
				reason: "User account not found",
			};
		}

		// Get borrower profile linked to this user
		const borrower = await ctx.db
			.query("borrowers")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.first();

		if (!borrower) {
			return {
				eligible: false,
				reason: "No borrower profile found",
			};
		}

		// Verify the mortgage belongs to this borrower
		const mortgage = await ctx.db.get(args.mortgageId);
		if (!mortgage || mortgage.borrowerId !== borrower._id) {
			return {
				eligible: false,
				reason: "Mortgage not found or not owned by you",
			};
		}

		// Check for existing deferrals this year
		const yearStart = new Date();
		yearStart.setMonth(0, 1);
		yearStart.setHours(0, 0, 0, 0);
		const yearStartStr = yearStart.toISOString();

		const existingDeferrals = await ctx.db
			.query("deferral_requests")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.mortgageId))
			.collect();

		// Filter to approved deferrals this year
		const approvedThisYear = existingDeferrals.filter(
			(d) => d.status === "approved" && d.createdAt >= yearStartStr
		);

		if (approvedThisYear.length > 0) {
			const lastDeferral = approvedThisYear[0];
			if (!lastDeferral) {
				throw new Error("Expected deferral to exist after length check");
			}
			const propertyAddress = `${mortgage.address.street}, ${mortgage.address.city}`;

			return {
				eligible: false,
				reason:
					"You've already used your one-time deferral for this loan this year",
				previousDeferral: {
					date: lastDeferral.requestedDeferralDate,
					propertyAddress,
				},
			};
		}

		// Check for pending requests
		const pendingRequests = existingDeferrals.filter(
			(d) => d.status === "pending"
		);

		if (pendingRequests.length > 0) {
			return {
				eligible: false,
				reason: "You have a pending deferral request for this loan",
			};
		}

		return { eligible: true };
	},
});

/**
 * Submit a deferral request
 */
export const requestDeferral = borrowerMutation({
	args: {
		mortgageId: v.id("mortgages"),
		requestType: v.union(v.literal("one_time"), v.literal("hardship")),
		requestedDeferralDate: v.string(),
		reason: v.optional(v.string()),
	},
	returns: v.id("deferral_requests"),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}

		// Look up user by identity subject (idp_id)
		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", subject))
			.unique();

		if (!user) {
			throw new Error("User account not found");
		}

		// Get borrower profile linked to this user
		const borrower = await ctx.db
			.query("borrowers")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.first();

		if (!borrower) {
			throw new Error("Borrower profile not found");
		}

		// Verify the mortgage belongs to this borrower
		const mortgage = await ctx.db.get(args.mortgageId);
		if (!mortgage || mortgage.borrowerId !== borrower._id) {
			throw new Error("Mortgage not found or not owned by you");
		}

		// Re-check eligibility
		const yearStart = new Date();
		yearStart.setMonth(0, 1);
		yearStart.setHours(0, 0, 0, 0);
		const yearStartStr = yearStart.toISOString();

		const existingDeferrals = await ctx.db
			.query("deferral_requests")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.mortgageId))
			.collect();

		const approvedThisYear = existingDeferrals.filter(
			(d) => d.status === "approved" && d.createdAt >= yearStartStr
		);

		if (approvedThisYear.length > 0) {
			throw new Error(
				"You've already used your one-time deferral for this loan this year"
			);
		}

		const pendingRequests = existingDeferrals.filter(
			(d) => d.status === "pending"
		);

		if (pendingRequests.length > 0) {
			throw new Error("You have a pending deferral request for this loan");
		}

		// Validate deferral date (must be within 30 days of today)
		const requestedDate = new Date(args.requestedDeferralDate);
		const today = new Date();
		const maxDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

		if (requestedDate < today) {
			throw new Error("Deferral date must be in the future");
		}

		if (requestedDate > maxDate) {
			throw new Error("Deferral date must be within 30 days");
		}

		// Create deferral request
		return await ctx.db.insert("deferral_requests", {
			borrowerId: borrower._id,
			mortgageId: args.mortgageId,
			requestType: args.requestType,
			requestedDeferralDate: args.requestedDeferralDate,
			reason: args.reason,
			status: "pending",
			createdAt: new Date().toISOString(),
		});
	},
});

/**
 * Get deferral requests for the logged-in borrower
 */
export const getMyDeferralRequests = borrowerQuery({
	args: {
		status: v.optional(
			v.union(
				v.literal("pending"),
				v.literal("approved"),
				v.literal("rejected")
			)
		),
	},
	returns: v.array(deferralRequestSchema),
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}

		// Look up user by identity subject (idp_id)
		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", subject))
			.unique();

		if (!user) {
			return [];
		}

		// Get borrower profile linked to this user
		const borrower = await ctx.db
			.query("borrowers")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.first();

		if (!borrower) {
			return [];
		}

		let requests = await ctx.db
			.query("deferral_requests")
			.withIndex("by_borrower", (q) => q.eq("borrowerId", borrower._id))
			.collect();

		if (args.status) {
			requests = requests.filter((r) => r.status === args.status);
		}

		// Sort by creation time descending
		return requests.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);
	},
});

// ============================================================================
// Admin Management
// ============================================================================

/**
 * Get all pending deferral requests for admin review
 */
export const getPendingDeferralRequests = adminQuery({
	args: {},
	returns: v.array(
		v.object({
			request: deferralRequestSchema,
			borrowerName: v.string(),
			borrowerEmail: v.string(),
			propertyAddress: v.string(),
			loanAmount: v.number(),
		})
	),
	handler: async (ctx: AuthorizedQueryCtx) => {
		const pendingRequests = await ctx.db
			.query("deferral_requests")
			.withIndex("by_status", (q) => q.eq("status", "pending"))
			.collect();

		const enrichedRequests = await Promise.all(
			pendingRequests.map(async (request) => {
				const borrower = await ctx.db.get(request.borrowerId);
				const mortgage = await ctx.db.get(request.mortgageId);

				return {
					request,
					borrowerName: borrower?.name ?? "Unknown",
					borrowerEmail: borrower?.email ?? "Unknown",
					propertyAddress: mortgage
						? `${mortgage.address.street}, ${mortgage.address.city}`
						: "Unknown",
					loanAmount: mortgage?.loanAmount ?? 0,
				};
			})
		);

		// Sort by creation time ascending (oldest first)
		return enrichedRequests.sort(
			(a, b) =>
				new Date(a.request.createdAt).getTime() -
				new Date(b.request.createdAt).getTime()
		);
	},
});

/**
 * Get all deferral requests with optional filtering
 */
export const getDeferralRequests = adminQuery({
	args: {
		status: v.optional(
			v.union(
				v.literal("pending"),
				v.literal("approved"),
				v.literal("rejected")
			)
		),
		mortgageId: v.optional(v.id("mortgages")),
		borrowerId: v.optional(v.id("borrowers")),
		limit: v.optional(v.number()),
	},
	returns: v.array(deferralRequestSchema),
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		let requests: Doc<"deferral_requests">[];

		const { status, mortgageId, borrowerId } = args;

		if (status) {
			requests = await ctx.db
				.query("deferral_requests")
				.withIndex("by_status", (q) => q.eq("status", status))
				.collect();
		} else if (mortgageId) {
			requests = await ctx.db
				.query("deferral_requests")
				.withIndex("by_mortgage", (q) => q.eq("mortgageId", mortgageId))
				.collect();
		} else if (borrowerId) {
			requests = await ctx.db
				.query("deferral_requests")
				.withIndex("by_borrower", (q) => q.eq("borrowerId", borrowerId))
				.collect();
		} else {
			requests = await ctx.db.query("deferral_requests").collect();
		}

		// Sort by creation time descending
		requests = requests.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);

		// Apply limit
		if (args.limit) {
			requests = requests.slice(0, args.limit);
		}

		return requests;
	},
});

/**
 * Approve a deferral request
 */
export const approveDeferral = adminMutation({
	args: {
		requestId: v.id("deferral_requests"),
		reason: v.optional(v.string()),
	},
	returns: v.id("deferral_requests"),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}

		// Look up admin user by identity subject (idp_id)
		const adminUser = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", subject))
			.unique();

		if (!adminUser) {
			throw new Error("Admin user not found");
		}
		const adminUserId = adminUser._id;

		const request = await ctx.db.get(args.requestId);
		if (!request) {
			throw new Error("Deferral request not found");
		}

		if (request.status !== "pending") {
			throw new Error(`Request is already ${request.status}`);
		}

		// Update the request
		await ctx.db.patch(args.requestId, {
			status: "approved",
			adminDecision: {
				decidedBy: adminUserId,
				decidedAt: new Date().toISOString(),
				reason: args.reason,
			},
		});

		// TODO: Schedule Rotessa adjustment (Phase 5 future)
		// await ctx.scheduler.runAfter(0, internal.rotessa.adjustPaymentSchedule, {
		//   mortgageId: request.mortgageId,
		//   originalDate: originalPayment.processDate,
		//   newDate: request.requestedDeferralDate,
		// });

		return args.requestId;
	},
});

/**
 * Reject a deferral request
 */
export const rejectDeferral = adminMutation({
	args: {
		requestId: v.id("deferral_requests"),
		reason: v.string(),
	},
	returns: v.id("deferral_requests"),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}

		// Look up admin user by identity subject (idp_id)
		const adminUser = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", subject))
			.unique();

		if (!adminUser) {
			throw new Error("Admin user not found");
		}
		const adminUserId = adminUser._id;

		const request = await ctx.db.get(args.requestId);
		if (!request) {
			throw new Error("Deferral request not found");
		}

		if (request.status !== "pending") {
			throw new Error(`Request is already ${request.status}`);
		}

		// Update the request
		await ctx.db.patch(args.requestId, {
			status: "rejected",
			adminDecision: {
				decidedBy: adminUserId,
				decidedAt: new Date().toISOString(),
				reason: args.reason,
			},
		});

		return args.requestId;
	},
});

// ============================================================================
// Internal Functions
// ============================================================================

/**
 * Get deferral request by ID (internal)
 */
export const getDeferralRequestInternal = internalQuery({
	args: { requestId: v.id("deferral_requests") },
	returns: v.union(deferralRequestSchema, v.null()),
	handler: async (ctx, args) => await ctx.db.get(args.requestId),
});

/**
 * Update deferral request with Rotessa adjustment ID (internal)
 */
export const updateDeferralRotessaAdjustment = internalMutation({
	args: {
		requestId: v.id("deferral_requests"),
		rotessaAdjustmentId: v.string(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await ctx.db.patch(args.requestId, {
			rotessaAdjustmentId: args.rotessaAdjustmentId,
		});
		return null;
	},
});

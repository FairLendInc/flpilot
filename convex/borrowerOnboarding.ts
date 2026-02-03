/**
 * Borrower Onboarding Mutations & Queries
 *
 * Handles borrower onboarding journey lifecycle:
 * - Creating journeys (broker/admin-initiated or self-registration)
 * - Saving step data (profile, verification, Rotessa)
 * - Submitting for admin review
 * - Admin approval/rejection
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
	type AuthorizedMutationCtx,
	type AuthorizedQueryCtx,
	createAuthorizedMutation,
	createAuthorizedQuery,
} from "./lib/server";

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Assert journey is in draft status (editable)
 */
function assertDraft(journey: { status: string }) {
	if (journey.status !== "draft") {
		throw new Error("Onboarding journey can no longer be edited");
	}
}

/**
 * Assert journey is borrower persona
 */
function assertBorrowerPersona(journey: { persona: string }) {
	if (journey.persona !== "borrower") {
		throw new Error("Journey is not a borrower journey");
	}
}

// ============================================================================
// Journey Creation
// ============================================================================

const authorizedMutation = createAuthorizedMutation(["any"]);
const authorizedQuery = createAuthorizedQuery(["any"]);
const adminMutation = createAuthorizedMutation(["admin"]);
const adminQuery = createAuthorizedQuery(["admin"]);

/**
 * Start a new borrower onboarding journey
 * Can be initiated by the borrower themselves or via broker/admin invitation
 */
export const startBorrowerJourney = authorizedMutation({
	args: {
		// Optional invitation context (if broker/admin-initiated)
		invitation: v.optional(
			v.object({
				invitedBy: v.id("users"),
				invitedByRole: v.union(v.literal("broker"), v.literal("admin")),
				loanDetails: v.optional(
					v.object({
						requestedAmount: v.optional(v.number()),
						propertyAddress: v.optional(v.string()),
					})
				),
			})
		),
	},
	returns: v.id("onboarding_journeys"),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}
		const userId = subject as Id<"users">;

		// Check if user already has an active borrower journey
		const existingJourney = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.filter((q) => q.eq(q.field("persona"), "borrower"))
			.first();

		if (existingJourney && existingJourney.status !== "rejected") {
			throw new Error("You already have an active borrower onboarding journey");
		}

		// Create journey with borrower persona
		const journeyId = await ctx.db.insert("onboarding_journeys", {
			userId,
			persona: "borrower",
			stateValue: "borrower.intro",
			status: "draft",
			context: {
				borrower: {
					...(args.invitation && {
						invitation: {
							invitedBy: args.invitation.invitedBy,
							invitedByRole: args.invitation.invitedByRole,
							invitedAt: new Date().toISOString(),
							loanDetails: args.invitation.loanDetails,
						},
					}),
					configVersion: 1,
				},
			},
			lastTouchedAt: new Date().toISOString(),
		});

		return journeyId;
	},
});

/**
 * Create a borrower journey invitation (broker/admin initiates)
 */
export const createBorrowerInvitation = adminMutation({
	args: {
		borrowerEmail: v.string(),
		borrowerName: v.string(),
		loanDetails: v.optional(
			v.object({
				requestedAmount: v.optional(v.number()),
				propertyAddress: v.optional(v.string()),
			})
		),
	},
	returns: v.object({
		success: v.boolean(),
		message: v.string(),
	}),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}
		const _adminUserId = subject as Id<"users">;

		// Check if there's already a user with this email
		const existingUser = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", args.borrowerEmail))
			.first();

		// For now, just return a success message indicating invitation would be sent
		// In production, this would:
		// 1. Create a pending invitation record
		// 2. Send email via WorkOS or other email service
		// 3. Include magic link to complete onboarding

		return {
			success: true,
			message: existingUser
				? `Invitation created for existing user ${args.borrowerName}`
				: `Invitation sent to ${args.borrowerEmail}`,
		};
	},
});

// ============================================================================
// Step Mutations
// ============================================================================

/**
 * Advance past intro step
 */
export const advanceBorrowerIntro = authorizedMutation({
	args: {},
	returns: v.null(),
	handler: async (ctx: AuthorizedMutationCtx) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}
		const userId = subject as Id<"users">;

		const journey = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.filter((q) => q.eq(q.field("persona"), "borrower"))
			.first();

		if (!journey) {
			throw new Error("No borrower journey found");
		}

		assertDraft(journey);

		await ctx.db.patch(journey._id, {
			stateValue: "borrower.profile",
			lastTouchedAt: new Date().toISOString(),
		});

		return null;
	},
});

/**
 * Save borrower profile step data
 */
export const saveBorrowerProfile = authorizedMutation({
	args: {
		profile: v.object({
			firstName: v.string(),
			middleName: v.optional(v.string()),
			lastName: v.string(),
			email: v.string(),
			phone: v.optional(v.string()),
			address: v.optional(
				v.object({
					street: v.string(),
					city: v.string(),
					province: v.string(),
					postalCode: v.string(),
					country: v.string(),
				})
			),
		}),
	},
	returns: v.null(),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}
		const userId = subject as Id<"users">;

		const journey = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.filter((q) => q.eq(q.field("persona"), "borrower"))
			.first();

		if (!journey) {
			throw new Error("No borrower journey found");
		}

		assertDraft(journey);

		await ctx.db.patch(journey._id, {
			context: {
				...journey.context,
				borrower: {
					...journey.context.borrower,
					profile: args.profile,
				},
			},
			stateValue: "borrower.identity_verification",
			lastTouchedAt: new Date().toISOString(),
		});

		return null;
	},
});

/**
 * Save identity verification step (or skip)
 */
export const saveBorrowerIdVerification = authorizedMutation({
	args: {
		idVerification: v.object({
			provider: v.string(),
			status: v.union(
				v.literal("not_started"),
				v.literal("pending"),
				v.literal("verified"),
				v.literal("failed"),
				v.literal("mismatch"),
				v.literal("skipped")
			),
			inquiryId: v.optional(v.string()),
			checkedAt: v.optional(v.string()),
		}),
	},
	returns: v.null(),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}
		const userId = subject as Id<"users">;

		const journey = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.filter((q) => q.eq(q.field("persona"), "borrower"))
			.first();

		if (!journey) {
			throw new Error("No borrower journey found");
		}

		assertDraft(journey);

		await ctx.db.patch(journey._id, {
			context: {
				...journey.context,
				borrower: {
					...journey.context.borrower,
					idVerification: args.idVerification,
				},
			},
			stateValue: "borrower.kyc_aml",
			lastTouchedAt: new Date().toISOString(),
		});

		return null;
	},
});

/**
 * Save KYC/AML step (or skip)
 */
export const saveBorrowerKycAml = authorizedMutation({
	args: {
		kycAml: v.object({
			provider: v.string(),
			status: v.union(
				v.literal("not_started"),
				v.literal("pending"),
				v.literal("passed"),
				v.literal("failed"),
				v.literal("requires_review"),
				v.literal("skipped")
			),
			checkId: v.optional(v.string()),
			checkedAt: v.optional(v.string()),
		}),
	},
	returns: v.null(),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}
		const userId = subject as Id<"users">;

		const journey = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.filter((q) => q.eq(q.field("persona"), "borrower"))
			.first();

		if (!journey) {
			throw new Error("No borrower journey found");
		}

		assertDraft(journey);

		await ctx.db.patch(journey._id, {
			context: {
				...journey.context,
				borrower: {
					...journey.context.borrower,
					kycAml: args.kycAml,
				},
			},
			stateValue: "borrower.rotessa_setup",
			lastTouchedAt: new Date().toISOString(),
		});

		return null;
	},
});

/**
 * Save Rotessa setup step
 */
export const saveBorrowerRotessa = authorizedMutation({
	args: {
		rotessa: v.object({
			status: v.union(
				v.literal("not_started"),
				v.literal("pending"),
				v.literal("linked"),
				v.literal("created"),
				v.literal("active"),
				v.literal("failed")
			),
			customerId: v.optional(v.number()),
			customIdentifier: v.optional(v.string()),
			linkedAt: v.optional(v.string()),
			bankInfo: v.optional(
				v.object({
					institutionNumber: v.string(),
					transitNumber: v.string(),
					accountNumber: v.string(),
					accountType: v.union(v.literal("checking"), v.literal("savings")),
				})
			),
		}),
	},
	returns: v.null(),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}
		const userId = subject as Id<"users">;

		const journey = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.filter((q) => q.eq(q.field("persona"), "borrower"))
			.first();

		if (!journey) {
			throw new Error("No borrower journey found");
		}

		assertDraft(journey);

		// Validate Rotessa status before advancing
		const validStatuses = ["linked", "created", "active"];
		if (!validStatuses.includes(args.rotessa.status)) {
			throw new Error("Rotessa setup must be completed before proceeding");
		}

		await ctx.db.patch(journey._id, {
			context: {
				...journey.context,
				borrower: {
					...journey.context.borrower,
					rotessa: args.rotessa,
				},
			},
			stateValue: "borrower.review",
			lastTouchedAt: new Date().toISOString(),
		});

		return null;
	},
});

/**
 * Submit borrower journey for admin review
 */
export const submitBorrowerJourney = authorizedMutation({
	args: {
		finalNotes: v.optional(v.string()),
	},
	returns: v.null(),
	handler: async (ctx: AuthorizedMutationCtx, _args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}
		const userId = subject as Id<"users">;

		const journey = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.filter((q) => q.eq(q.field("persona"), "borrower"))
			.first();

		if (!journey) {
			throw new Error("No borrower journey found");
		}

		assertDraft(journey);
		assertBorrowerPersona(journey);

		// Validate required data is present
		const borrower = journey.context.borrower;
		if (!borrower?.profile) {
			throw new Error("Profile data is required");
		}
		if (
			!(
				borrower?.rotessa &&
				["linked", "created", "active"].includes(borrower.rotessa.status)
			)
		) {
			throw new Error("Rotessa setup must be completed");
		}

		await ctx.db.patch(journey._id, {
			status: "awaiting_admin",
			stateValue: "borrower.pending_admin",
			lastTouchedAt: new Date().toISOString(),
		});

		return null;
	},
});

// ============================================================================
// Admin Actions
// ============================================================================

/**
 * Approve borrower onboarding journey
 * Creates the borrower record and links to user account
 */
export const approveBorrowerJourney = adminMutation({
	args: {
		journeyId: v.id("onboarding_journeys"),
		notes: v.optional(v.string()),
	},
	returns: v.id("borrowers"),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}
		const adminUserId = subject as Id<"users">;

		const journey = await ctx.db.get(args.journeyId);
		if (!journey) {
			throw new Error("Journey not found");
		}

		if (journey.status !== "awaiting_admin") {
			throw new Error("Journey is not awaiting admin approval");
		}

		assertBorrowerPersona(journey);

		const borrowerContext = journey.context.borrower;
		if (!(borrowerContext?.profile && borrowerContext?.rotessa?.customerId)) {
			throw new Error("Journey data is incomplete");
		}

		// Create borrower record
		const borrowerId = await ctx.db.insert("borrowers", {
			userId: journey.userId,
			name: `${borrowerContext.profile.firstName} ${borrowerContext.profile.lastName}`,
			email: borrowerContext.profile.email,
			phone: borrowerContext.profile.phone,
			address: borrowerContext.profile.address,
			rotessaCustomerId: String(borrowerContext.rotessa.customerId),
			rotessaCustomIdentifier: borrowerContext.rotessa.customIdentifier,
			idVerificationStatus:
				borrowerContext.idVerification?.status === "verified"
					? "verified"
					: borrowerContext.idVerification?.status === "skipped"
						? "skipped"
						: "not_started",
			kycAmlStatus:
				borrowerContext.kycAml?.status === "passed"
					? "passed"
					: borrowerContext.kycAml?.status === "skipped"
						? "skipped"
						: "not_started",
			onboardingJourneyId: args.journeyId,
			onboardedBy: borrowerContext.invitation?.invitedByRole ?? "self",
			onboardedByUserId: borrowerContext.invitation?.invitedBy,
			onboardedAt: new Date().toISOString(),
			status: "active",
		});

		// Update journey status
		await ctx.db.patch(args.journeyId, {
			status: "approved",
			stateValue: "borrower.approved",
			adminDecision: {
				decidedBy: adminUserId,
				decidedAt: new Date().toISOString(),
				notes: args.notes,
				decisionSource: "admin",
			},
			lastTouchedAt: new Date().toISOString(),
		});

		return borrowerId;
	},
});

/**
 * Reject borrower onboarding journey
 */
export const rejectBorrowerJourney = adminMutation({
	args: {
		journeyId: v.id("onboarding_journeys"),
		reason: v.string(),
	},
	returns: v.null(),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}
		const adminUserId = subject as Id<"users">;

		const journey = await ctx.db.get(args.journeyId);
		if (!journey) {
			throw new Error("Journey not found");
		}

		if (journey.status !== "awaiting_admin") {
			throw new Error("Journey is not awaiting admin approval");
		}

		assertBorrowerPersona(journey);

		await ctx.db.patch(args.journeyId, {
			status: "rejected",
			stateValue: "borrower.rejected",
			adminDecision: {
				decidedBy: adminUserId,
				decidedAt: new Date().toISOString(),
				notes: args.reason,
				decisionSource: "admin",
			},
			lastTouchedAt: new Date().toISOString(),
		});

		return null;
	},
});

// ============================================================================
// Queries
// ============================================================================

/**
 * Get current user's borrower journey
 */
export const getMyBorrowerJourney = authorizedQuery({
	args: {},
	returns: v.union(
		v.null(),
		v.object({
			_id: v.id("onboarding_journeys"),
			userId: v.id("users"),
			persona: v.string(),
			stateValue: v.string(),
			status: v.string(),
			context: v.any(),
			adminDecision: v.optional(v.any()),
			lastTouchedAt: v.string(),
		})
	),
	handler: async (ctx: AuthorizedQueryCtx) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}
		const userId = subject as Id<"users">;

		const journey = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.filter((q) => q.eq(q.field("persona"), "borrower"))
			.first();

		return journey ?? null;
	},
});

/**
 * Get borrower journey by ID
 */
export const getBorrowerJourneyById = authorizedQuery({
	args: {
		journeyId: v.id("onboarding_journeys"),
	},
	returns: v.union(
		v.null(),
		v.object({
			_id: v.id("onboarding_journeys"),
			userId: v.id("users"),
			persona: v.string(),
			stateValue: v.string(),
			status: v.string(),
			context: v.any(),
			adminDecision: v.optional(v.any()),
			lastTouchedAt: v.string(),
		})
	),
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		const journey = await ctx.db.get(args.journeyId);

		if (!journey || journey.persona !== "borrower") {
			return null;
		}

		return journey;
	},
});

/**
 * Get all pending borrower journeys for admin review
 */
export const getPendingBorrowerJourneys = adminQuery({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("onboarding_journeys"),
			userId: v.id("users"),
			stateValue: v.string(),
			context: v.any(),
			lastTouchedAt: v.string(),
			user: v.union(
				v.null(),
				v.object({
					_id: v.id("users"),
					email: v.string(),
					first_name: v.optional(v.string()),
					last_name: v.optional(v.string()),
				})
			),
		})
	),
	handler: async (ctx: AuthorizedQueryCtx) => {
		const journeys = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_status", (q) => q.eq("status", "awaiting_admin"))
			.filter((q) => q.eq(q.field("persona"), "borrower"))
			.collect();

		// Fetch associated user data
		const journeysWithUsers = await Promise.all(
			journeys.map(async (journey) => {
				const user = await ctx.db.get(journey.userId);
				return {
					_id: journey._id,
					userId: journey.userId,
					stateValue: journey.stateValue,
					context: journey.context,
					lastTouchedAt: journey.lastTouchedAt,
					user: user
						? {
								_id: user._id,
								email: user.email,
								first_name: user.first_name,
								last_name: user.last_name,
							}
						: null,
				};
			})
		);

		return journeysWithUsers;
	},
});

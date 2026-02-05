import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { AuthorizedMutationCtx } from "../lib/server";
import { createAuthorizedMutation } from "../lib/server";

// ============================================
// Investor Onboarding Mutations
// ============================================

/**
 * Start a new investor onboarding journey
 * Creates the journey record with initial state
 */
export const startInvestorJourney = createAuthorizedMutation(["any"])({
	args: {
		brokerCode: v.optional(v.string()),
	},
	returns: v.id("onboarding_journeys"),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}

		const userId = subject as Id<"users">;

		// Check if user already has an investor journey
		const existingJourney = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.filter((q) => q.eq(q.field("persona"), "investor"))
			.first();

		if (existingJourney) {
			// Return existing journey
			return existingJourney._id;
		}

		// Determine broker assignment
		let brokerId: Id<"brokers"> | undefined;
		let resolvedBrokerCode: string | undefined;

		if (args.brokerCode) {
			// Validate broker code
			const normalizedCode = args.brokerCode.toUpperCase().trim();
			const codeRecord = await ctx.db
				.query("broker_codes")
				.withIndex("by_code", (q) => q.eq("code", normalizedCode))
				.first();

			if (codeRecord?.isActive) {
				brokerId = codeRecord.brokerId;
				resolvedBrokerCode = normalizedCode;

				// Increment use count
				await ctx.db.patch(codeRecord._id, {
					useCount: codeRecord.useCount + 1,
					updatedAt: new Date().toISOString(),
				});
			}
		}

		// If no broker code or invalid, assign to FairLend
		// TODO: Get FairLend broker ID from configuration
		if (!brokerId) {
			// For now, we'll need to look up FairLend broker
			// This should be configurable in the future
			const fairlendBroker = await ctx.db
				.query("brokers")
				.filter((q) => q.eq(q.field("subdomain"), "fairlend"))
				.first();

			if (fairlendBroker) {
				brokerId = fairlendBroker._id;
			}
		}

		// Create the journey
		const journeyId = await ctx.db.insert("onboarding_journeys", {
			userId,
			persona: "investor",
			stateValue: "investor.intro",
			context: {
				investor: {
					brokerSelection: brokerId
						? {
								brokerId,
								brokerCode: resolvedBrokerCode,
								selectedAt: new Date().toISOString(),
							}
						: undefined,
					configVersion: 1,
				},
			},
			status: "draft",
			lastTouchedAt: new Date().toISOString(),
		});

		return journeyId;
	},
});

/**
 * Save investor broker selection
 * Updates the journey with broker code and resolved broker
 */
export const saveInvestorBrokerSelection = createAuthorizedMutation(["any"])({
	args: {
		journeyId: v.id("onboarding_journeys"),
		brokerCode: v.optional(v.string()),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}

		const journey = await ctx.db.get(args.journeyId);
		if (!journey) {
			throw new Error("Journey not found");
		}

		if (journey.userId !== (subject as Id<"users">)) {
			throw new Error("Unauthorized");
		}

		// Determine broker assignment
		let brokerId: Id<"brokers"> | undefined;
		let resolvedBrokerCode: string | undefined;

		if (args.brokerCode) {
			// Validate broker code
			const normalizedCode = args.brokerCode.toUpperCase().trim();
			const codeRecord = await ctx.db
				.query("broker_codes")
				.withIndex("by_code", (q) => q.eq("code", normalizedCode))
				.first();

			if (!codeRecord) {
				throw new Error("Invalid broker code");
			}

			if (!codeRecord.isActive) {
				throw new Error("This broker code is no longer active");
			}

			if (codeRecord.expiresAt && new Date(codeRecord.expiresAt) < new Date()) {
				throw new Error("This broker code has expired");
			}

			if (
				codeRecord.maxUses !== undefined &&
				codeRecord.useCount >= codeRecord.maxUses
			) {
				throw new Error("This broker code has reached its usage limit");
			}

			brokerId = codeRecord.brokerId;
			resolvedBrokerCode = normalizedCode;

			// Increment use count
			await ctx.db.patch(codeRecord._id, {
				useCount: codeRecord.useCount + 1,
				updatedAt: new Date().toISOString(),
			});
		} else {
			// Assign to FairLend
			const fairlendBroker = await ctx.db
				.query("brokers")
				.filter((q) => q.eq(q.field("subdomain"), "fairlend"))
				.first();

			if (fairlendBroker) {
				brokerId = fairlendBroker._id;
			}
		}

		// Update journey with broker selection
		await ctx.db.patch(args.journeyId, {
			context: {
				...journey.context,
				investor: {
					...journey.context.investor,
					brokerSelection: brokerId
						? {
								brokerId,
								brokerCode: resolvedBrokerCode,
								selectedAt: new Date().toISOString(),
							}
						: undefined,
				},
			},
			stateValue: "investor.profile",
			lastTouchedAt: new Date().toISOString(),
		});
	},
});

/**
 * Save investor profile information
 */
export const saveInvestorProfile = createAuthorizedMutation(["any"])({
	args: {
		journeyId: v.id("onboarding_journeys"),
		firstName: v.string(),
		middleName: v.optional(v.string()),
		lastName: v.string(),
		entityType: v.union(
			v.literal("individual"),
			v.literal("corporation"),
			v.literal("trust"),
			v.literal("fund")
		),
		phone: v.string(),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}

		const journey = await ctx.db.get(args.journeyId);
		if (!journey) {
			throw new Error("Journey not found");
		}

		if (journey.userId !== (subject as Id<"users">)) {
			throw new Error("Unauthorized");
		}

		// Update journey with profile data
		await ctx.db.patch(args.journeyId, {
			context: {
				...journey.context,
				investor: {
					...journey.context.investor,
					profile: {
						firstName: args.firstName,
						middleName: args.middleName,
						lastName: args.lastName,
						entityType: args.entityType,
						phone: args.phone,
					},
				},
			},
			stateValue: "investor.preferences",
			lastTouchedAt: new Date().toISOString(),
		});
	},
});

/**
 * Save investor preferences
 */
export const saveInvestorPreferences = createAuthorizedMutation(["any"])({
	args: {
		journeyId: v.id("onboarding_journeys"),
		minTicket: v.number(),
		maxTicket: v.number(),
		riskProfile: v.union(
			v.literal("conservative"),
			v.literal("balanced"),
			v.literal("growth")
		),
		liquidityHorizonMonths: v.number(),
		focusRegions: v.optional(v.array(v.string())),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}

		const journey = await ctx.db.get(args.journeyId);
		if (!journey) {
			throw new Error("Journey not found");
		}

		if (journey.userId !== (subject as Id<"users">)) {
			throw new Error("Unauthorized");
		}

		// Determine if this is FairLend or external broker
		const brokerId = journey.context.investor?.brokerSelection?.brokerId;
		let isFairlend = false;

		if (brokerId) {
			const broker = await ctx.db.get(brokerId);
			isFairlend = broker?.subdomain === "fairlend";
		}

		// Update journey with preferences data
		await ctx.db.patch(args.journeyId, {
			context: {
				...journey.context,
				investor: {
					...journey.context.investor,
					preferences: {
						minTicket: args.minTicket,
						maxTicket: args.maxTicket,
						riskProfile: args.riskProfile,
						liquidityHorizonMonths: args.liquidityHorizonMonths,
						focusRegions: args.focusRegions,
					},
				},
			},
			// Next state depends on broker type
			stateValue: isFairlend ? "investor.kyc_documents" : "investor.kyc_stub",
			lastTouchedAt: new Date().toISOString(),
		});
	},
});

/**
 * Save KYC documents (FairLend flow)
 */
export const saveInvestorKycDocuments = createAuthorizedMutation(["any"])({
	args: {
		journeyId: v.id("onboarding_journeys"),
		documents: v.array(
			v.object({
				storageId: v.id("_storage"),
				documentType: v.string(),
			})
		),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}

		const journey = await ctx.db.get(args.journeyId);
		if (!journey) {
			throw new Error("Journey not found");
		}

		if (journey.userId !== (subject as Id<"users">)) {
			throw new Error("Unauthorized");
		}

		// Update journey with KYC documents
		await ctx.db.patch(args.journeyId, {
			context: {
				...journey.context,
				investor: {
					...journey.context.investor,
					kyc: {
						status: "submitted",
						documents: args.documents.map((doc) => ({
							...doc,
							uploadedAt: new Date().toISOString(),
						})),
					},
				},
			},
			stateValue: "investor.review",
			lastTouchedAt: new Date().toISOString(),
		});
	},
});

/**
 * Acknowledge KYC stub (External broker flow)
 */
export const acknowledgeInvestorKycStub = createAuthorizedMutation(["any"])({
	args: {
		journeyId: v.id("onboarding_journeys"),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}

		const journey = await ctx.db.get(args.journeyId);
		if (!journey) {
			throw new Error("Journey not found");
		}

		if (journey.userId !== (subject as Id<"users">)) {
			throw new Error("Unauthorized");
		}

		// Update journey with KYC acknowledgement
		await ctx.db.patch(args.journeyId, {
			context: {
				...journey.context,
				investor: {
					...journey.context.investor,
					kyc: {
						status: "acknowledged",
						acknowledgedAt: new Date().toISOString(),
					},
				},
			},
			stateValue: "investor.review",
			lastTouchedAt: new Date().toISOString(),
		});
	},
});

/**
 * Submit investor journey for admin review
 */
export const submitInvestorJourney = createAuthorizedMutation(["any"])({
	args: {
		journeyId: v.id("onboarding_journeys"),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}

		const journey = await ctx.db.get(args.journeyId);
		if (!journey) {
			throw new Error("Journey not found");
		}

		if (journey.userId !== (subject as Id<"users">)) {
			throw new Error("Unauthorized");
		}

		// Validate required data is present
		const investor = journey.context.investor;
		if (!(investor?.profile && investor?.preferences)) {
			throw new Error("Incomplete onboarding data");
		}

		// Update journey status
		await ctx.db.patch(args.journeyId, {
			status: "awaiting_admin",
			stateValue: "investor.pending_admin",
			lastTouchedAt: new Date().toISOString(),
		});

		// TODO: Create admin notification
	},
});

/**
 * Admin: Approve investor onboarding
 */
export const approveInvestorOnboarding = createAuthorizedMutation(["admin"])({
	args: {
		journeyId: v.id("onboarding_journeys"),
		notes: v.optional(v.string()),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}

		const journey = await ctx.db.get(args.journeyId);
		if (!journey) {
			throw new Error("Journey not found");
		}

		if (journey.status !== "awaiting_admin") {
			throw new Error("Journey is not pending admin review");
		}

		// Update journey status
		await ctx.db.patch(args.journeyId, {
			status: "approved",
			stateValue: "investor.approved",
			adminDecision: {
				decidedBy: subject as Id<"users">,
				decidedAt: new Date().toISOString(),
				notes: args.notes,
			},
			lastTouchedAt: new Date().toISOString(),
		});

		// TODO: Assign investor role via WorkOS
		// TODO: Create investor record
	},
});

/**
 * Admin: Reject investor onboarding
 */
export const rejectInvestorOnboarding = createAuthorizedMutation(["admin"])({
	args: {
		journeyId: v.id("onboarding_journeys"),
		reason: v.string(),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}

		const journey = await ctx.db.get(args.journeyId);
		if (!journey) {
			throw new Error("Journey not found");
		}

		if (journey.status !== "awaiting_admin") {
			throw new Error("Journey is not pending admin review");
		}

		// Update journey status
		await ctx.db.patch(args.journeyId, {
			status: "rejected",
			stateValue: "investor.rejected",
			adminDecision: {
				decidedBy: subject as Id<"users">,
				decidedAt: new Date().toISOString(),
				notes: args.reason,
			},
			lastTouchedAt: new Date().toISOString(),
		});
	},
});

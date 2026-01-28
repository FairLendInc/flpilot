import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { createAuthorizedMutation, createAuthorizedQuery } from "../lib/server";

function requireSubjectId(ctx: unknown): Id<"users"> {
	const subject = (ctx as { subject?: string | null }).subject;
	if (!subject) {
		throw new Error("Authentication required");
	}
	return subject as Id<"users">;
}

// ============================================
// Admin Broker Review Queries
// ============================================

/**
 * List all broker onboarding journeys pending admin review
 * Admin-only access with optional status filtering
 */
export const listPendingBrokerJourneys = createAuthorizedQuery(["admin"])({
	args: {
		status: v.optional(
			v.union(
				v.literal("draft"),
				v.literal("awaiting_admin"),
				v.literal("approved"),
				v.literal("rejected")
			)
		),
	},
	handler: async (ctx, args) => {
		// Query broker journeys by status with persona filter
		const journeys = args.status
			? await ctx.db
					.query("onboarding_journeys")
					.withIndex("by_status")
					.filter((q) =>
						q.and(
							q.eq(q.field("status"), args.status),
							q.eq(q.field("persona"), "broker")
						)
					)
					.collect()
			: await ctx.db
					.query("onboarding_journeys")
					.filter((q) => q.eq(q.field("persona"), "broker"))
					.collect();

		// Sort by lastTouchedAt descending (most recent first)
		return journeys.sort(
			(a, b) =>
				new Date(b.lastTouchedAt).getTime() -
				new Date(a.lastTouchedAt).getTime()
		);
	},
});

/**
 * Get detailed broker journey for admin review
 * Includes full journey data with all broker context and timeline
 */
export const reviewBrokerJourney = createAuthorizedQuery(["admin"])({
	args: {
		journeyId: v.id("onboarding_journeys"),
	},
	handler: async (ctx, args) => {
		const journey = await ctx.db.get(args.journeyId);

		if (!journey || journey.persona !== "broker") {
			return null;
		}

		return journey;
	},
});

// ============================================
// Admin Follow-Up and Timeline Mutations
// ============================================

/**
 * Send admin follow-up request to broker
 * Adds timeline entry to adminRequestTimeline
 */
export const sendAdminFollowUp = createAuthorizedMutation(["admin"])({
	args: {
		journeyId: v.id("onboarding_journeys"),
		message: v.string(),
		requestType: v.union(
			v.literal("info_request"),
			v.literal("document_request")
		),
	},
	handler: async (ctx, args) => {
		const journey = await ctx.db.get(args.journeyId);

		if (!journey || journey.persona !== "broker") {
			throw new Error("Invalid broker journey");
		}

		const requestId = crypto.randomUUID();
		const now = new Date().toISOString();

		// Create new timeline entry
		const subjectId = requireSubjectId(ctx);
		const newEntry: AdminRequestTimelineEntry = {
			id: requestId,
			type: args.requestType,
			requestedBy: subjectId, // Admin userId
			requestedAt: now,
			message: args.message,
			resolved: false,
		};

		const brokerContext = journey.context.broker;
		const updatedTimeline = [
			...(brokerContext?.adminRequestTimeline ?? []),
			newEntry,
		];

		await ctx.db.patch(args.journeyId, {
			context: {
				...journey.context,
				broker: {
					...brokerContext,
					adminRequestTimeline: updatedTimeline,
				} as BrokerContext,
			},
			lastTouchedAt: now,
		});

		return { requestId, requestType: args.requestType };
	},
});

/**
 * Broker responds to admin follow-up request
 * Marks timeline entry as resolved with response and optional documents
 */
export const respondToAdminRequest = createAuthorizedMutation(["any"])({
	args: {
		journeyId: v.id("onboarding_journeys"),
		requestId: v.string(),
		response: v.string(),
		documentIds: v.array(v.id("_storage")),
	},
	handler: async (ctx, args) => {
		const journey = await ctx.db.get(args.journeyId);

		if (!journey || journey.persona !== "broker") {
			throw new Error("Invalid broker journey");
		}

		// Ensure user owns this journey
		const subjectId = requireSubjectId(ctx);
		if (journey.userId !== subjectId) {
			throw new Error(
				"Unauthorized: You can only respond to your own requests"
			);
		}

		const brokerContext = journey.context.broker;
		const timeline = brokerContext?.adminRequestTimeline ?? [];
		const entryIndex = timeline.findIndex((e) => e.id === args.requestId);

		if (entryIndex === -1) {
			throw new Error("Request not found");
		}

		const now = new Date().toISOString();

		// Update timeline entry with response
		const updatedTimeline = [...timeline];
		updatedTimeline[entryIndex] = {
			...updatedTimeline[entryIndex],
			resolved: true,
			resolvedAt: now,
			response: args.response,
			responseDocuments: args.documentIds.map((id) => ({
				storageId: id,
				label: `Response document ${args.documentIds.indexOf(id) + 1}`,
			})),
		};

		await ctx.db.patch(args.journeyId, {
			context: {
				...journey.context,
				broker: {
					...brokerContext,
					adminRequestTimeline: updatedTimeline,
				} as BrokerContext,
			},
			lastTouchedAt: now,
		});

		return { requestId: args.requestId, resolvedAt: now };
	},
});

// ============================================
// Broker Approval and Rejection Mutations
// ============================================

/**
 * Approve broker onboarding
 * Creates broker record in brokers table and transitions status
 */
export const approveBrokerOnboarding = createAuthorizedMutation(["admin"])({
	args: {
		journeyId: v.id("onboarding_journeys"),
		subdomain: v.string(),
		commissionRate: v.number(),
		returnAdjustmentPercentage: v.number(),
	},
	handler: async (ctx, args) => {
		const journey = await ctx.db.get(args.journeyId);

		if (!journey || journey.persona !== "broker") {
			throw new Error("Invalid broker journey");
		}

		if (journey.status !== "awaiting_admin") {
			throw new Error("Journey must be awaiting admin review");
		}

		const now = new Date().toISOString();

		// Create broker record
		const brokerId = await ctx.db.insert("brokers", {
			userId: journey.userId,
			workosOrgId: "", // Will be set by WorkOS provisioning action
			subdomain: args.subdomain.toLowerCase(),
			branding: {
				primaryColor: "#3b82f6",
				secondaryColor: "#64748b",
			},
			commission: {
				ratePercentage: args.commissionRate,
				returnAdjustmentPercentage: args.returnAdjustmentPercentage,
			},
			status: "active",
			approvedAt: now,
			createdAt: now,
			updatedAt: now,
		});

		// Update journey status
		const brokerContext = journey.context.broker;
		await ctx.db.patch(args.journeyId, {
			status: "approved",
			stateValue: "broker.approved",
			lastTouchedAt: now,
			context: {
				...journey.context,
				broker: {
					...(brokerContext ?? {}),
					brokerId: brokerId.toString(),
					approvedBy: requireSubjectId(ctx),
					approvedAt: now,
					subdomain: args.subdomain.toLowerCase(),
				} as BrokerContext,
			},
		});

		return { brokerId, journeyId: args.journeyId };
	},
});

/**
 * Reject broker onboarding
 * Records rejection reason and transitions status
 */
export const rejectBrokerOnboarding = createAuthorizedMutation(["admin"])({
	args: {
		journeyId: v.id("onboarding_journeys"),
		reason: v.string(),
	},
	handler: async (ctx, args) => {
		const journey = await ctx.db.get(args.journeyId);

		if (!journey || journey.persona !== "broker") {
			throw new Error("Invalid broker journey");
		}

		if (journey.status !== "awaiting_admin") {
			throw new Error("Journey must be awaiting admin review");
		}

		const now = new Date().toISOString();

		// Update journey status
		const brokerContext = journey.context.broker;
		await ctx.db.patch(args.journeyId, {
			status: "rejected",
			stateValue: "broker.rejected",
			lastTouchedAt: now,
			context: {
				...journey.context,
				broker: {
					...(brokerContext ?? {}),
					rejectedBy: requireSubjectId(ctx),
					rejectedAt: now,
					rejectionReason: args.reason,
				} as BrokerContext,
			},
		});

		return { journeyId: args.journeyId, rejectedAt: now };
	},
});

// ============================================
// Rollback Mechanism
// ============================================

/**
 * Rollback broker journey to a previous state
 * Reverts state and clears post-rollback data while preserving timeline
 */
export const rollbackBrokerJourney = createAuthorizedMutation(["admin"])({
	args: {
		journeyId: v.id("onboarding_journeys"),
		targetState: v.union(
			v.literal("broker.company_info"),
			v.literal("broker.licensing"),
			v.literal("broker.representatives"),
			v.literal("broker.documents"),
			v.literal("broker.review")
		),
	},
	handler: async (ctx, args) => {
		const journey = await ctx.db.get(args.journeyId);

		if (!journey || journey.persona !== "broker") {
			throw new Error("Invalid broker journey");
		}

		const now = new Date().toISOString();

		// Map target state to rollback clearing logic
		const rollbackMappings: Record<
			string,
			{
				stateValue: string;
				clearedFields: (keyof BrokerContext)[];
			}
		> = {
			"broker.company_info": {
				stateValue: "broker.company_info",
				clearedFields: ["licensing", "representatives", "documents"],
			},
			"broker.licensing": {
				stateValue: "broker.licensing",
				clearedFields: ["representatives", "documents"],
			},
			"broker.representatives": {
				stateValue: "broker.representatives",
				clearedFields: ["documents"],
			},
			"broker.documents": {
				stateValue: "broker.documents",
				clearedFields: [],
			},
			"broker.review": {
				stateValue: "broker.review",
				clearedFields: [],
			},
		};

		const mapping = rollbackMappings[args.targetState];
		if (!mapping) {
			throw new Error("Invalid target state for rollback");
		}

		// Clear fields based on rollback target
		const clearedContext: Partial<BrokerContext> = {};
		for (const field of mapping.clearedFields) {
			clearedContext[field] = undefined;
		}

		// Update journey with rolled-back state
		const brokerContext = journey.context.broker;
		await ctx.db.patch(args.journeyId, {
			status: "draft",
			stateValue: mapping.stateValue,
			lastTouchedAt: now,
			context: {
				...journey.context,
				broker: {
					...(brokerContext ?? {}),
					...clearedContext,
					// Preserve timeline and other admin-maintained data
					adminRequestTimeline: brokerContext?.adminRequestTimeline,
				} as BrokerContext,
			},
		});

		return {
			journeyId: args.journeyId,
			previousState: journey.stateValue,
			newState: mapping.stateValue,
		};
	},
});

// ============================================
// Type Definitions
// ============================================

type BrokerContext = NonNullable<
	Doc<"onboarding_journeys">["context"]["broker"]
>;

type AdminRequestTimelineEntry = NonNullable<
	BrokerContext["adminRequestTimeline"]
>[number];

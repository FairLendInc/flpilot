import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { createAuthorizedMutation, createAuthorizedQuery } from "../lib/server";

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
		let journeys;
		if (args.status) {
			journeys = await ctx.db
				.query("onboarding_journeys")
				.withIndex("by_status")
				.filter((q) =>
					q.and(
						q.eq(q.field("status"), args.status),
						q.eq(q.field("persona"), "broker")
					)
				)
				.collect();
		} else {
			journeys = await ctx.db
				.query("onboarding_journeys")
				.filter((q) => q.eq(q.field("persona"), "broker"))
				.collect();
		}

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
		const newEntry: AdminRequestTimelineEntry = {
			id: requestId,
			type: args.requestType,
			requestedBy: (ctx as any).subject as any, // Admin userId
			requestedAt: now,
			message: args.message,
			resolved: false,
		};

		const updatedTimeline = [
			...((journey.context.broker as any)?.adminRequestTimeline ?? []),
			newEntry,
		];

		await ctx.db.patch(args.journeyId, {
			context: {
				...journey.context,
				broker: {
					...(journey.context.broker as any),
					adminRequestTimeline: updatedTimeline,
				} as any,
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
		if (journey.userId !== (ctx as any).subject) {
			throw new Error(
				"Unauthorized: You can only respond to your own requests"
			);
		}

		const timeline =
			(journey.context.broker as any)?.adminRequestTimeline ?? [];
		const entryIndex = timeline.findIndex((e: any) => e.id === args.requestId);

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
					...(journey.context.broker as any),
					adminRequestTimeline: updatedTimeline,
				} as any,
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
			createdAt: now,
			updatedAt: now,
		} as any);

		// Update journey status
		await ctx.db.patch(args.journeyId, {
			status: "approved",
			stateValue: "broker.approved",
			lastTouchedAt: now,
			context: {
				...journey.context,
				broker: {
					...(journey.context.broker as any),
					brokerId: brokerId as any,
					approvedBy: (ctx as any).subject as any,
					approvedAt: now,
					subdomain: args.subdomain.toLowerCase(),
				} as any,
			},
		} as any);

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
		await ctx.db.patch(args.journeyId, {
			status: "rejected",
			stateValue: "broker.rejected",
			lastTouchedAt: now,
			context: {
				...journey.context,
				broker: {
					...(journey.context.broker as any),
					rejectedBy: (ctx as any).subject as any,
					rejectedAt: now,
					rejectionReason: args.reason,
				} as any,
			},
		} as any);

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
		mapping.clearedFields.forEach((field) => {
			clearedContext[field] = undefined;
		});

		// Update journey with rolled-back state
		await ctx.db.patch(args.journeyId, {
			status: "draft",
			stateValue: mapping.stateValue,
			lastTouchedAt: now,
			context: {
				...journey.context,
				broker: {
					...(journey.context.broker as any),
					...clearedContext,
					// Preserve timeline and other admin-maintained data
					adminRequestTimeline: (journey.context.broker as any)
						?.adminRequestTimeline,
				} as any,
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

type AdminRequestTimelineEntry = {
	id: string;
	type: "info_request" | "document_request" | "clarification";
	requestedBy: Id<"users">;
	requestedAt: string;
	message: string;
	resolved: boolean;
	resolvedAt?: string;
	response?: string;
	responseDocuments?: Array<{
		storageId: Id<"_storage">;
		label: string;
	}>;
};

type BrokerContext = {
	companyInfo?: {
		companyName?: string;
		entityType?: string;
		registrationNumber?: string;
		address?: string;
		city?: string;
		province?: string;
		postalCode?: string;
		country?: string;
		jurisdiction?: string;
		phone?: string;
		email?: string;
		website?: string;
		logoUrl?: string;
	};
	licensing?: {
		licenseType?: string;
		licenseNumber?: string;
		issuer?: string;
		issueDate?: string;
		expiryDate?: string;
		jurisdictions?: string[];
	};
	representatives?: Array<{
		name?: string;
		title?: string;
		email?: string;
		phone?: string;
	}>;
	documents?: Array<{
		documentType?: string;
		storageId?: string;
		label?: string;
		uploadedAt?: string;
	}>;
	adminRequestTimeline?: AdminRequestTimelineEntry[];
	proposedSubdomain?: string;
	brokerId?: string;
	approvedBy?: string;
	approvedAt?: string;
	rejectedBy?: string;
	rejectedAt?: string;
	rejectionReason?: string;
	subdomain?: string;
};

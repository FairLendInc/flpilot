import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// ============================================================================
// BROKER ONBOARDING FUNCTIONS
// ============================================================================

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Start or resume a broker onboarding journey
 * Creates or retrieves the journey for the authenticated user
 */
export const startBrokerJourney = mutation({
	args: {},
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
			throw new Error("User record not found");
		}

		// Check for existing journey
		const existing = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();

		if (existing) {
			if (existing.persona !== "broker") {
				throw new Error("User already has a different persona journey");
			}
			return existing;
		}

		// Create new broker journey
		const now = new Date().toISOString();
		const journeyId = await ctx.db.insert("onboarding_journeys", {
			userId: user._id,
			persona: "broker",
			stateValue: "broker.intro",
			status: "draft",
			context: {},
			lastTouchedAt: now,
		});

		return await ctx.db.get(journeyId);
	},
});

/**
 * Advance broker onboarding from intro to company info
 */
export const advanceBrokerIntro = mutation({
	args: {},
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
			throw new Error("User record not found");
		}

		const journey = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();

		if (!journey || journey.persona !== "broker") {
			throw new Error("Broker journey not found");
		}

		if (journey.status !== "draft") {
			throw new Error("Journey is not in draft status");
		}

		const now = new Date().toISOString();

		await ctx.db.patch(journey._id, {
			stateValue: "broker.company_info",
			lastTouchedAt: now,
		});

		return await ctx.db.get(journey._id);
	},
});

/**
 * Save broker company information
 */
export const saveBrokerCompanyInfo = mutation({
	args: {
		companyName: v.string(),
		entityType: v.union(
			v.literal("sole_proprietorship"),
			v.literal("partnership"),
			v.literal("corporation")
		),
		registrationNumber: v.string(),
		registeredAddress: v.object({
			street: v.string(),
			city: v.string(),
			state: v.string(),
			zip: v.string(),
			country: v.string(),
		}),
		businessPhone: v.string(),
		businessEmail: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
			.unique();

		if (!user) {
			throw new Error("User record not found");
		}

		const journey = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();

		if (!journey) {
			throw new Error("Broker journey not found");
		}

		if (journey.persona !== "broker") {
			throw new Error("Not a broker journey");
		}

		if (journey.status !== "draft") {
			throw new Error("Journey is not in draft status");
		}

		const now = new Date().toISOString();

		await ctx.db.patch(journey._id, {
			context: {
				...journey.context,
				broker: {
					...journey.context.broker,
					companyInfo: {
						...args,
					},
					adminRequestTimeline: journey.context.broker?.adminRequestTimeline,
					documents: journey.context.broker?.documents,
					licensing: journey.context.broker?.licensing,
					proposedSubdomain: journey.context.broker?.proposedSubdomain,
					representatives: journey.context.broker?.representatives,
				},
			},
			stateValue: "broker.licensing",
			lastTouchedAt: now,
		});

		return await ctx.db.get(journey._id);
	},
});

/**
 * Save broker licensing information
 */
export const saveBrokerLicensing = mutation({
	args: {
		licenseType: v.union(
			v.literal("mortgage_broker"),
			v.literal("investment_broker"),
			v.literal("mortgage_dealer")
		),
		licenseNumber: v.string(),
		issuer: v.string(),
		issuedDate: v.string(),
		expiryDate: v.string(),
		jurisdictions: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
			.unique();

		if (!user) {
			throw new Error("User record not found");
		}

		const journey = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();

		if (
			!journey ||
			journey.persona !== "broker" ||
			journey.status !== "draft"
		) {
			throw new Error("Invalid broker journey state");
		}

		const now = new Date().toISOString();

		await ctx.db.patch(journey._id, {
			context: {
				...journey.context,
				broker: {
					...journey.context.broker,
					licensing: {
						...args,
					},
					adminRequestTimeline: journey.context.broker?.adminRequestTimeline,
					documents: journey.context.broker?.documents,
					companyInfo: journey.context.broker?.companyInfo,
					proposedSubdomain: journey.context.broker?.proposedSubdomain,
					representatives: journey.context.broker?.representatives,
				},
			},
			stateValue: "broker.representatives",
			lastTouchedAt: now,
		});

		return await ctx.db.get(journey._id);
	},
});

/**
 * Save broker representatives
 */
export const saveBrokerRepresentatives = mutation({
	args: {
		representatives: v.array(
			v.object({
				firstName: v.string(),
				lastName: v.string(),
				role: v.string(),
				email: v.string(),
				phone: v.string(),
				hasAuthority: v.boolean(),
			})
		),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
			.unique();

		if (!user) {
			throw new Error("User record not found");
		}

		const journey = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();

		if (
			!journey ||
			journey.persona !== "broker" ||
			journey.status !== "draft"
		) {
			throw new Error("Invalid broker journey state");
		}

		const now = new Date().toISOString();

		await ctx.db.patch(journey._id, {
			context: {
				...journey.context,
				broker: {
					...journey.context.broker,
					representatives: args.representatives,
					adminRequestTimeline: journey.context.broker?.adminRequestTimeline,
					documents: journey.context.broker?.documents,
					companyInfo: journey.context.broker?.companyInfo,
					licensing: journey.context.broker?.licensing,
					proposedSubdomain: journey.context.broker?.proposedSubdomain,
				},
			},
			stateValue: "broker.documents",
			lastTouchedAt: now,
		});

		return await ctx.db.get(journey._id);
	},
});

/**
 * Save broker documents
 */
export const saveBrokerDocuments = mutation({
	args: {
		documents: v.array(
			v.object({
				storageId: v.id("_storage"),
				label: v.string(),
				type: v.string(),
			})
		),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
			.unique();

		if (!user) {
			throw new Error("User record not found");
		}

		const journey = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();

		if (
			!journey ||
			journey.persona !== "broker" ||
			journey.status !== "draft"
		) {
			throw new Error("Invalid broker journey state");
		}

		const now = new Date().toISOString();

		const documentsWithTimestamps = args.documents.map((doc) => ({
			...doc,
			uploadedAt: now,
		}));

		await ctx.db.patch(journey._id, {
			context: {
				...journey.context,
				broker: {
					...journey.context.broker,
					documents: documentsWithTimestamps,
					adminRequestTimeline: journey.context.broker?.adminRequestTimeline,
					companyInfo: journey.context.broker?.companyInfo,
					licensing: journey.context.broker?.licensing,
					proposedSubdomain: journey.context.broker?.proposedSubdomain,
					representatives: journey.context.broker?.representatives,
				},
			},
			stateValue: "broker.review",
			lastTouchedAt: now,
		});

		return await ctx.db.get(journey._id);
	},
});

/**
 * Submit broker journey for admin review
 */
export const submitBrokerJourney = mutation({
	args: {
		proposedSubdomain: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
			.unique();

		if (!user) {
			throw new Error("User record not found");
		}

		const journey = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();

		if (
			!journey ||
			journey.persona !== "broker" ||
			journey.status !== "draft"
		) {
			throw new Error("Invalid broker journey state");
		}

		// Validate journey completeness
		const brokerData = journey.context.broker;
		if (
			!(
				brokerData?.companyInfo &&
				brokerData.licensing &&
				brokerData.representatives &&
				brokerData.documents
			) ||
			brokerData.documents.length === 0
		) {
			throw new Error(
				"Journey is incomplete. Please fill all required sections."
			);
		}

		const now = new Date().toISOString();

		await ctx.db.patch(journey._id, {
			context: {
				...journey.context,
				broker: {
					...journey.context.broker,
					proposedSubdomain: args.proposedSubdomain,
				},
			},
			status: "awaiting_admin",
			stateValue: "broker.pending_admin",
			lastTouchedAt: now,
		});

		return await ctx.db.get(journey._id);
	},
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get broker journey for current user
 */
export const getMyBrokerJourney = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
			.unique();

		if (!user) {
			return null;
		}

		const journey = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();

		if (!journey || journey.persona !== "broker") {
			return null;
		}

		return journey;
	},
});

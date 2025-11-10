import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { action, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { checkRbac } from "./auth.config";

const PERSONA_OPTIONS = ["broker", "investor", "lawyer"] as const;
const INVESTOR_ENTITY_TYPES = ["individual", "corporation", "trust", "fund"] as const;
const INVESTOR_RISK_PROFILES = ["conservative", "balanced", "growth"] as const;
const INVESTOR_STATE_VALUES = new Set([
	"investor.intro",
	"investor.profile",
	"investor.preferences",
	"investor.kycStub",
	"investor.documentsStub",
	"investor.review",
]);

type Persona = (typeof PERSONA_OPTIONS)[number];
type JourneyStatus = "draft" | "awaiting_admin" | "approved" | "rejected";

const investorProfileValidator = v.object({
	firstName: v.optional(v.string()),
	middleName: v.optional(v.string()),
	lastName: v.optional(v.string()),
	entityType: v.union(
		...INVESTOR_ENTITY_TYPES.map((value) => v.literal(value))
	),
	phone: v.optional(v.string()),
});

const investorPreferencesValidator = v.object({
	minTicket: v.number(),
	maxTicket: v.number(),
	riskProfile: v.union(...INVESTOR_RISK_PROFILES.map((value) => v.literal(value))),
	liquidityHorizonMonths: v.number(),
	focusRegions: v.optional(v.array(v.string())),
});

const investorKycValidator = v.object({
	status: v.union(
		v.literal("not_started"),
		v.literal("blocked"),
		v.literal("submitted")
	),
	notes: v.optional(v.string()),
});

const investorDocumentValidator = v.object({
	storageId: v.id("_storage"),
	label: v.string(),
});

const investorContextPatchValidator = v.object({
	profile: v.optional(investorProfileValidator),
	preferences: v.optional(investorPreferencesValidator),
	kycPlaceholder: v.optional(investorKycValidator),
	documents: v.optional(v.array(investorDocumentValidator)),
});

type OnboardingJourney = Doc<"onboarding_journeys">;

type AnyDbCtx = QueryCtx | MutationCtx;

async function getIdentityAndUser(ctx: AnyDbCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Authentication required");
	}
	const user = await ctx.db
		.query("users")
		.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
		.unique();
	if (!user) {
		throw new Error("User record not provisioned yet");
	}
	return { identity, user };
}

async function getJourneyForUser(
	ctx: AnyDbCtx,
	userId: Id<"users">
): Promise<OnboardingJourney | null> {
	return await ctx.db
		.query("onboarding_journeys")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.unique();
}

function assertDraft(journey: OnboardingJourney) {
	if (journey.status !== "draft") {
		throw new Error("Onboarding journey can no longer be edited");
	}
}

function assertPersona(journey: OnboardingJourney, persona: Persona) {
	if (journey.persona !== persona) {
		throw new Error("Journey persona mismatch");
	}
}

function resolveInvestorContext(journey: OnboardingJourney) {
	return {
		...journey.context,
		investor: {
			...(journey.context?.investor ?? {}),
		},
	};
}

function initialStateForPersona(persona: Persona) {
	if (persona === "investor") {
		return "investor.intro";
	}
	if (persona === "broker") {
		return "broker.placeholder";
	}
	if (persona === "lawyer") {
		return "lawyer.placeholder";
	}
	return "personaSelection";
}

async function ensureJourneyForUser(
	ctx: MutationCtx,
	userId: Id<"users">
): Promise<OnboardingJourney> {
	const existing = await getJourneyForUser(ctx, userId);
	if (existing) {
		return existing;
	}
	const now = new Date().toISOString();
	const journeyId = await ctx.db.insert("onboarding_journeys", {
		userId,
		persona: "unselected",
		stateValue: "personaSelection",
		status: "draft" as JourneyStatus,
		context: {},
		lastTouchedAt: now,
	});
	const journey = await ctx.db.get(journeyId);
	if (!journey) {
		throw new Error("Failed to persist onboarding journey");
	}
	return journey;
}

export const ensureJourney = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		// Try to get existing user
		let user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
			.unique();

		// Auto-provision user if missing
		if (!user) {
			const email = identity.email;
			if (!email) {
				throw new Error("Email is required but not found in identity");
			}

			const payload = {
				idp_id: identity.subject,
				email,
				email_verified: Boolean(identity.email_verified ?? false),
				first_name:
					typeof identity.first_name === "string" ? identity.first_name : undefined,
				last_name:
					typeof identity.last_name === "string" ? identity.last_name : undefined,
				profile_picture_url:
					typeof identity.profile_picture_url === "string"
						? identity.profile_picture_url
						: typeof identity.profile_picture === "string"
							? identity.profile_picture
							: undefined,
				created_at: new Date().toISOString(),
			};

			// Check again in case user was created concurrently
			const existingUser = await ctx.db
				.query("users")
				.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
				.unique();

			if (existingUser) {
				user = existingUser;
			} else {
				// Create new user
				const userId = await ctx.db.insert("users", payload);
				const createdUser = await ctx.db.get(userId);
				if (!createdUser) {
					throw new Error("Failed to create user record");
				}
				user = createdUser;
			}
		}

		return await ensureJourneyForUser(ctx, user._id);
	},
});

export const getJourney = query({
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
		return await getJourneyForUser(ctx, user._id);
	},
});

export const startJourney = mutation({
	args: v.object({
		persona: v.union(...PERSONA_OPTIONS.map((value) => v.literal(value))),
	}),
	handler: async (ctx, args) => {
		const { user } = await getIdentityAndUser(ctx);
		const journey = await ensureJourneyForUser(ctx, user._id);
		assertDraft(journey);
		const now = new Date().toISOString();
		const nextState = initialStateForPersona(args.persona);
		const nextContext =
			args.persona === "investor"
				? {
					investor: journey.context?.investor ?? {},
				 }
				: {};
		await ctx.db.patch(journey._id, {
			persona: args.persona,
			stateValue: nextState,
			context: nextContext,
			lastTouchedAt: now,
		});
		return await ctx.db.get(journey._id);
	},
});

export const saveInvestorStep = mutation({
	args: v.object({
		stateValue: v.string(),
		investor: v.optional(investorContextPatchValidator),
	}),
	handler: async (ctx, args) => {
		const { user } = await getIdentityAndUser(ctx);
		const journey = await getJourneyForUser(ctx, user._id);
		if (!journey) {
			throw new Error("Onboarding journey not found");
		}
		assertDraft(journey);
		assertPersona(journey, "investor");
		if (!INVESTOR_STATE_VALUES.has(args.stateValue)) {
			throw new Error("Invalid investor state transition");
		}
		const context = resolveInvestorContext(journey);
		if (args.investor?.profile) {
			context.investor.profile = args.investor.profile;
		}
		if (args.investor?.preferences) {
			context.investor.preferences = args.investor.preferences;
		}
		if (args.investor?.kycPlaceholder) {
			context.investor.kycPlaceholder = args.investor.kycPlaceholder;
		}
		if (args.investor?.documents) {
			context.investor.documents = args.investor.documents;
		}
		await ctx.db.patch(journey._id, {
			context,
			stateValue: args.stateValue,
			lastTouchedAt: new Date().toISOString(),
		});
		return await ctx.db.get(journey._id);
	},
});

export const submitInvestorJourney = mutation({
	args: v.object({
		finalNotes: v.optional(v.string()),
	}),
	handler: async (ctx, args) => {
		const { user } = await getIdentityAndUser(ctx);
		const journey = await getJourneyForUser(ctx, user._id);
		if (!journey) {
			throw new Error("Onboarding journey not found");
		}
		assertDraft(journey);
		assertPersona(journey, "investor");
		const investor = journey.context?.investor;
		if (!investor?.profile) {
			throw new Error("Investor profile information missing");
		}
		// Validate required profile fields for new submissions
		if (!investor.profile.firstName || !investor.profile.lastName) {
			throw new Error("First name and last name are required");
		}
		if (!investor?.preferences) {
			throw new Error("Investment preferences missing");
		}
		if (investor.preferences.minTicket > investor.preferences.maxTicket) {
			throw new Error("Minimum ticket cannot exceed maximum ticket");
		}
		if (investor?.kycPlaceholder?.status !== "submitted") {
			throw new Error("KYC acknowledgement is required");
		}
		await ctx.db.patch(journey._id, {
			status: "awaiting_admin" as JourneyStatus,
			stateValue: "pendingAdmin",
			lastTouchedAt: new Date().toISOString(),
			context: {
				...journey.context,
				investor: {
					...investor,
					kycPlaceholder: {
						...investor.kycPlaceholder,
						notes:
							args.finalNotes ?? investor.kycPlaceholder?.notes,
					},
				},
			},
		});
		return await ctx.db.get(journey._id);
	},
});

export const listPending = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		
		// Return null if identity is not available yet (race condition handling)
		// The client will retry once authentication is ready
		if (!identity) {
			return null;
		}

		checkRbac({
			required_permissions: ["org.member.update"],
			user_identity: identity,
		});

		const journeys = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_status", (q) => q.eq("status", "awaiting_admin"))
			.collect();
		journeys.sort((a, b) =>
			(b.lastTouchedAt ?? "").localeCompare(a.lastTouchedAt ?? "")
		);
		return await Promise.all(
			journeys.map(async (journey) => {
				const applicant = await ctx.db.get(journey.userId);
				return {
					journey,
					applicant,
				};
			})
		);
	},
});

export const approveJourney = mutation({
	args: v.object({
		journeyId: v.id("onboarding_journeys"),
		notes: v.optional(v.string()),
		organizationId: v.optional(v.string()),
	}),
	handler: async (ctx, args) => {
		const { identity, user: admin } = await getIdentityAndUser(ctx);
		checkRbac({
			required_permissions: ["org.member.update"],
			user_identity: identity,
		});
		const journey = await ctx.db.get(args.journeyId);
		if (!journey) {
			throw new Error("Journey not found");
		}
		if (journey.status !== "awaiting_admin") {
			throw new Error("Only pending journeys can be approved");
		}
		const applicant = await ctx.db.get(journey.userId);
		if (!applicant) {
			throw new Error("Applicant record missing");
		}

		const personaRole =
			journey.persona === "investor"
				? "investor"
				: journey.persona === "broker"
					? "broker"
					: journey.persona === "lawyer"
						? "lawyer"
						: "member";

		const skipRoleSync =
			process.env.NODE_ENV === "test" ||
			typeof process.env.VITEST_WORKER_ID === "string";

		// Determine which organization to assign the role to
		// Only require organization if we need to assign a role (not in test and not member role)
		const needsRoleAssignment = !skipRoleSync && personaRole !== "member";
		const organizationId =
			args.organizationId || applicant.active_organization_id;

		if (needsRoleAssignment && !organizationId) {
			throw new Error(
				"User has no active organization. Please select an organization to assign the role."
			);
		}

		// Update user's active_organization_id if organizationId was provided
		if (args.organizationId && args.organizationId !== applicant.active_organization_id) {
			await ctx.db.patch(applicant._id, {
				active_organization_id: args.organizationId,
			});
		}

		await ctx.db.patch(journey._id, {
			status: "approved" as JourneyStatus,
			stateValue: "completed",
			adminDecision: {
				decidedBy: admin._id,
				decidedAt: new Date().toISOString(),
				notes: args.notes,
			},
			lastTouchedAt: new Date().toISOString(),
		});

		// Assign organization membership role instead of user metadata role
		if (needsRoleAssignment && applicant.idp_id && organizationId) {
			await ctx.scheduler.runAfter(0, internal.workos.assignOrganizationRole, {
				userId: applicant.idp_id,
				organizationId,
				roleSlug: personaRole,
			});
		}

		return await ctx.db.get(journey._id);
	},
});

export const rejectJourney = mutation({
	args: v.object({
		journeyId: v.id("onboarding_journeys"),
		reason: v.string(),
	}),
	handler: async (ctx, args) => {
		const { identity, user: admin } = await getIdentityAndUser(ctx);
		checkRbac({
			required_permissions: ["org.member.update"],
			user_identity: identity,
		});
		const journey = await ctx.db.get(args.journeyId);
		if (!journey) {
			throw new Error("Journey not found");
		}
		if (journey.status !== "awaiting_admin") {
			throw new Error("Only pending journeys can be rejected");
		}
		await ctx.db.patch(journey._id, {
			status: "rejected" as JourneyStatus,
			stateValue: "rejected",
			adminDecision: {
				decidedBy: admin._id,
				decidedAt: new Date().toISOString(),
				notes: args.reason,
			},
			lastTouchedAt: new Date().toISOString(),
		});
		return await ctx.db.get(journey._id);
	},
});

export const generateDocumentUploadUrl = action({
	args: {},
	returns: v.string(),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}
		return await ctx.storage.generateUploadUrl();
	},
});

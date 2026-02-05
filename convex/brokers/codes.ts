import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { AuthorizedMutationCtx, AuthorizedQueryCtx } from "../lib/server";
import { createAuthorizedMutation, createAuthorizedQuery } from "../lib/server";

// Top-level regex constant for code validation (performance optimization)
const CODE_REGEX = /^[A-Z0-9]{6,20}$/;

// ============================================
// Broker Code Query Functions
// ============================================

/**
 * Validate a broker code and return broker information
 * Case-insensitive lookup - stores and searches in uppercase
 */
export const validateBrokerCode = createAuthorizedQuery(
	["any"],
	[],
	false
)({
	args: {
		code: v.string(),
	},
	returns: v.union(
		v.object({
			valid: v.literal(true),
			broker: v.object({
				_id: v.id("brokers"),
				brandName: v.string(),
				subdomain: v.string(),
				branding: v.object({
					logoStorageId: v.optional(v.id("_storage")),
					primaryColor: v.optional(v.string()),
					secondaryColor: v.optional(v.string()),
				}),
			}),
		}),
		v.object({
			valid: v.literal(false),
			error: v.string(),
		})
	),
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		// Normalize code to uppercase for case-insensitive lookup
		const normalizedCode = args.code.toUpperCase().trim();

		if (!normalizedCode) {
			return { valid: false as const, error: "Broker code is required" };
		}

		// Look up the broker code
		const codeRecord = await ctx.db
			.query("broker_codes")
			.withIndex("by_code", (q) => q.eq("code", normalizedCode))
			.first();

		if (!codeRecord) {
			return { valid: false as const, error: "Invalid broker code" };
		}

		// Check if code is active
		if (!codeRecord.isActive) {
			return {
				valid: false as const,
				error: "This broker code is no longer active",
			};
		}

		// Check if code has expired
		if (codeRecord.expiresAt && new Date(codeRecord.expiresAt) < new Date()) {
			return { valid: false as const, error: "This broker code has expired" };
		}

		// Check if code has reached max uses
		if (
			codeRecord.maxUses !== undefined &&
			codeRecord.useCount >= codeRecord.maxUses
		) {
			return {
				valid: false as const,
				error: "This broker code has reached its usage limit",
			};
		}

		// Get broker information
		const broker = await ctx.db.get(codeRecord.brokerId);
		if (!broker) {
			return { valid: false as const, error: "Broker not found" };
		}

		// Check if broker is active
		if (broker.status !== "active") {
			return {
				valid: false as const,
				error: "This broker is not currently active",
			};
		}

		return {
			valid: true as const,
			broker: {
				_id: broker._id,
				brandName: broker.branding.brandName || "Unnamed Broker",
				subdomain: broker.subdomain,
				branding: broker.branding,
			},
		};
	},
});

/**
 * Get broker by subdomain (for landing pages)
 * Public query - no authentication required
 */
export const getBrokerBySubdomain = createAuthorizedQuery(
	["any"],
	[],
	false
)({
	args: {
		subdomain: v.string(),
	},
	returns: v.optional(
		v.object({
			_id: v.id("brokers"),
			brandName: v.string(),
			subdomain: v.string(),
			customDomain: v.optional(v.string()),
			branding: v.object({
				logoStorageId: v.optional(v.id("_storage")),
				primaryColor: v.optional(v.string()),
				secondaryColor: v.optional(v.string()),
			}),
			// Contact information from broker's user profile
			contactEmail: v.optional(v.string()),
			contactPhone: v.optional(v.string()),
		})
	),
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		const broker = await ctx.db
			.query("brokers")
			.withIndex("by_subdomain", (q) =>
				q.eq("subdomain", args.subdomain.toLowerCase())
			)
			.first();

		if (!broker || broker.status !== "active") {
			return;
		}

		// Get broker user info for contact details
		const brokerUser = await ctx.db.get(broker.userId);

		return {
			_id: broker._id,
			brandName: broker.branding.brandName || "Unnamed Broker",
			subdomain: broker.subdomain,
			customDomain: broker.customDomain,
			branding: broker.branding,
			contactEmail: brokerUser?.email,
			contactPhone: brokerUser?.phone,
		};
	},
});

/**
 * Get broker landing page data
 * Comprehensive data for broker landing page including branding and CTAs
 */
export const getBrokerLandingPageData = createAuthorizedQuery(
	["any"],
	[],
	false
)({
	args: {
		subdomain: v.string(),
	},
	returns: v.optional(
		v.object({
			broker: v.object({
				_id: v.id("brokers"),
				brandName: v.string(),
				subdomain: v.string(),
				customDomain: v.optional(v.string()),
				branding: v.object({
					logoStorageId: v.optional(v.id("_storage")),
					primaryColor: v.optional(v.string()),
					secondaryColor: v.optional(v.string()),
				}),
				contactEmail: v.optional(v.string()),
				contactPhone: v.optional(v.string()),
			}),
			// Broker code for pre-filling onboarding
			brokerCode: v.optional(v.string()),
		})
	),
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		const broker = await ctx.db
			.query("brokers")
			.withIndex("by_subdomain", (q) =>
				q.eq("subdomain", args.subdomain.toLowerCase())
			)
			.first();

		if (!broker || broker.status !== "active") {
			return;
		}

		// Get broker user info
		const brokerUser = await ctx.db.get(broker.userId);

		// Get the primary broker code for this broker
		const brokerCode = await ctx.db
			.query("broker_codes")
			.withIndex("by_broker", (q) => q.eq("brokerId", broker._id))
			.filter((q) => q.eq(q.field("isActive"), true))
			.first();

		return {
			broker: {
				_id: broker._id,
				brandName: broker.branding.brandName || "Unnamed Broker",
				subdomain: broker.subdomain,
				customDomain: broker.customDomain,
				branding: broker.branding,
				contactEmail: brokerUser?.email,
				contactPhone: brokerUser?.phone,
			},
			brokerCode: brokerCode?.code,
		};
	},
});

// ============================================
// Broker Code Mutation Functions
// ============================================

/**
 * Create a new broker code
 * Admin only
 */
export const createBrokerCode = createAuthorizedMutation(["admin"])({
	args: {
		brokerId: v.id("brokers"),
		code: v.string(),
		description: v.optional(v.string()),
		expiresAt: v.optional(v.string()),
		maxUses: v.optional(v.number()),
	},
	returns: v.id("broker_codes"),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}

		// Normalize code to uppercase
		const normalizedCode = args.code.toUpperCase().trim();

		// Validate code format (alphanumeric, 6-20 characters)
		if (!CODE_REGEX.test(normalizedCode)) {
			throw new Error("Code must be 6-20 alphanumeric characters");
		}

		// Check if code already exists
		const existingCode = await ctx.db
			.query("broker_codes")
			.withIndex("by_code", (q) => q.eq("code", normalizedCode))
			.first();

		if (existingCode) {
			throw new Error("Broker code already exists");
		}

		// Verify broker exists
		const broker = await ctx.db.get(args.brokerId);
		if (!broker) {
			throw new Error("Broker not found");
		}

		// Create the broker code
		const codeId = await ctx.db.insert("broker_codes", {
			code: normalizedCode,
			brokerId: args.brokerId,
			description: args.description,
			expiresAt: args.expiresAt,
			maxUses: args.maxUses,
			useCount: 0,
			isActive: true,
			createdAt: new Date().toISOString(),
			createdBy: subject as Id<"users">,
			updatedAt: new Date().toISOString(),
		});

		return codeId;
	},
});

/**
 * Increment broker code use count
 * Called when an investor successfully uses a broker code
 */
export const incrementBrokerCodeUse = createAuthorizedMutation(["any"])({
	args: {
		code: v.string(),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const normalizedCode = args.code.toUpperCase().trim();

		const codeRecord = await ctx.db
			.query("broker_codes")
			.withIndex("by_code", (q) => q.eq("code", normalizedCode))
			.first();

		if (!codeRecord) {
			throw new Error("Broker code not found");
		}

		await ctx.db.patch(codeRecord._id, {
			useCount: codeRecord.useCount + 1,
			updatedAt: new Date().toISOString(),
		});
	},
});

/**
 * Deactivate a broker code
 * Admin only
 */
export const deactivateBrokerCode = createAuthorizedMutation(["admin"])({
	args: {
		codeId: v.id("broker_codes"),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		await ctx.db.patch(args.codeId, {
			isActive: false,
			updatedAt: new Date().toISOString(),
		});
	},
});

/**
 * List broker codes for a broker
 * Admin or the broker themselves
 */
export const listBrokerCodes = createAuthorizedQuery(["admin", "broker"])({
	args: {
		brokerId: v.id("brokers"),
	},
	returns: v.array(
		v.object({
			_id: v.id("broker_codes"),
			code: v.string(),
			description: v.optional(v.string()),
			isActive: v.boolean(),
			useCount: v.number(),
			maxUses: v.optional(v.number()),
			expiresAt: v.optional(v.string()),
			createdAt: v.string(),
		})
	),
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		const codes = await ctx.db
			.query("broker_codes")
			.withIndex("by_broker", (q) => q.eq("brokerId", args.brokerId))
			.collect();

		return codes.map((code) => ({
			_id: code._id,
			code: code.code,
			description: code.description,
			isActive: code.isActive,
			useCount: code.useCount,
			maxUses: code.maxUses,
			expiresAt: code.expiresAt,
			createdAt: code.createdAt,
		}));
	},
});

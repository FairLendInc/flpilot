import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { createAuthorizedMutation, createAuthorizedQuery } from "./lib/server";

const ruleValidator = v.object({
	type: v.union(
		v.literal("global"),
		v.literal("user"),
		v.literal("role"),
		v.literal("percentage")
	),
	value: v.optional(v.union(v.string(), v.number())),
	enabled: v.boolean(),
});

function hashToPercentageBucket(input: string): number {
	let hash = 0;
	for (let index = 0; index < input.length; index += 1) {
		hash = (hash << 5) - hash + input.charCodeAt(index);
		hash &= hash;
	}
	return Math.abs(hash) % 100;
}

export const getFlag = createAuthorizedQuery(
	["any"],
	[],
	false
)({
	args: {
		key: v.string(),
	},
	returns: v.union(
		v.object({
			key: v.string(),
			description: v.optional(v.string()),
			defaultValue: v.boolean(),
			rules: v.array(ruleValidator),
			createdAt: v.number(),
			updatedAt: v.number(),
		}),
		v.null()
	),
	handler: async (ctx, args) => {
		const flag = await ctx.db
			.query("feature_flags")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.unique();

		if (!flag) {
			return null;
		}

		const { key, description, defaultValue, rules, createdAt, updatedAt } =
			flag;

		return { key, description, defaultValue, rules, createdAt, updatedAt };
	},
});

export const listFlags = createAuthorizedQuery(
	["any"],
	[],
	false
)({
	args: {},
	returns: v.array(
		v.object({
			key: v.string(),
			description: v.optional(v.string()),
			defaultValue: v.boolean(),
			rules: v.array(ruleValidator),
			updatedAt: v.number(),
		})
	),
	handler: async (ctx) => {
		const flags = await ctx.db.query("feature_flags").collect();

		return flags.map((flag) => ({
			key: flag.key,
			description: flag.description,
			defaultValue: flag.defaultValue,
			rules: flag.rules,
			updatedAt: flag.updatedAt,
		}));
	},
});

export const evaluateFlag = createAuthorizedQuery(
	["any"],
	[],
	false
)({
	args: {
		key: v.string(),
	},
	returns: v.boolean(),
	handler: async (ctx, args) => {
		const flag = await ctx.db
			.query("feature_flags")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.unique();

		if (!flag) {
			return false;
		}

		const identity = await ctx.auth.getUserIdentity();
		const userId = identity?.subject ?? null;
		const primaryRole =
			typeof identity?.role === "string" ? identity.role : null;
		const roles =
			Array.isArray(identity?.roles) &&
			identity.roles.every((role) => typeof role === "string")
				? (identity.roles as string[])
				: [];

		for (const rule of flag.rules) {
			if (rule.type === "global") {
				return rule.enabled;
			}

			if (rule.type === "user" && userId && rule.value === userId) {
				return rule.enabled;
			}

			if (rule.type === "role") {
				if (rule.value === primaryRole) {
					return rule.enabled;
				}

				if (typeof rule.value === "string" && roles.includes(rule.value)) {
					return rule.enabled;
				}
			}

			if (rule.type === "percentage") {
				const threshold =
					typeof rule.value === "number"
						? rule.value
						: Number.isFinite(Number(rule.value))
							? Number(rule.value)
							: null;

				if (threshold === null || threshold <= 0) {
					continue;
				}

				if (!userId) {
					continue;
				}

				const bucket = hashToPercentageBucket(userId);
				if (bucket < threshold) {
					return rule.enabled;
				}
			}
		}

		return flag.defaultValue;
	},
});

export const setFlag = createAuthorizedMutation(["admin"])({
	args: {
		key: v.string(),
		defaultValue: v.boolean(),
		description: v.optional(v.string()),
		rules: v.optional(v.array(ruleValidator)),
	},
	returns: v.object({
		key: v.string(),
	}),
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("feature_flags")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.unique();

		const now = Date.now();
		const rules = args.rules ?? existing?.rules ?? [];

		if (existing) {
			await ctx.db.patch(existing._id, {
				description: args.description,
				defaultValue: args.defaultValue,
				rules,
				updatedAt: now,
			});
		} else {
			await ctx.db.insert("feature_flags", {
				key: args.key,
				description: args.description,
				defaultValue: args.defaultValue,
				rules,
				createdAt: now,
				updatedAt: now,
			});
		}

		return { key: args.key };
	},
});

export const seedDemoFlag = internalMutation({
	args: {},
	handler: async (ctx) => {
		const existing = await ctx.db
			.query("feature_flags")
			.withIndex("by_key", (q) => q.eq("key", "demo-flag"))
			.unique();

		if (existing) {
			return existing._id;
		}

		const now = Date.now();

		return ctx.db.insert("feature_flags", {
			key: "demo-flag",
			description: "Demo flag for verifying feature flag plumbing",
			defaultValue: false,
			rules: [],
			createdAt: now,
			updatedAt: now,
		});
	},
});

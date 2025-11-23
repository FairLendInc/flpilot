// import { type UserJSON } from '@workos-inc/authkit-node';
import { v } from "convex/values";
import { crud } from "convex-helpers/server/crud";
import { internalMutation, internalQuery, query, mutation, type QueryCtx, action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const userFields = schema.tables.users.validator.fields;
// export type TypeUserUpsertFields = Partial<Doc<'users'>>;
const UserUpsertFields = v.object(userFields);

export const { create, destroy, update } = crud(schema, "users");

async function userByExternalId(ctx: QueryCtx, idp_id: string) {
	return await ctx.db
		.query("users")
		.withIndex("by_idp_id", (q) => q.eq("idp_id", idp_id))
		.unique();
}

export const createFromWorkOS = internalMutation({
	args: UserUpsertFields,
	returns: v.object({
		status: v.literal("success"),
		data: v.object({
			message: v.string(),
			result: v.any(),
		}),
	}),
	handler: async (ctx, args) => {
		const existingUser = await userByExternalId(ctx, args.idp_id);

		if (existingUser) {
			await ctx.db.patch(existingUser._id, { ...args });
			return {
				status: "success" as const,
				data: {
					message: "User already exists, updated existing user",
					result: existingUser,
				},
			};
		}
		const res = await ctx.db.insert("users", { ...args });
		return {
			status: "success" as const,
			data: {
				message: "User created successfully",
				result: res,
			},
		};
	},
});

export const updateFromWorkOS = internalMutation({
	args: UserUpsertFields,
	handler: async (ctx, args) => {
		const existingUser = await userByExternalId(ctx, args.idp_id);

		if (existingUser) {
			await ctx.db.patch(existingUser._id, { ...args });
		} else {
			const res = await ctx.db.insert("users", { ...args });
			return {
				status: "success",
				data: {
					message: "User not found, created new user",
					result: res,
				},
			};
		}
	},
});

// Get user's current theme preference
export const getUserTheme = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity || typeof identity.subject !== "string") {
			return { theme: "default" };
		}

		const user = await userByExternalId(ctx, identity.subject);
		if (!user || !user.theme) {
			return { theme: "default" };
		}

		return { theme: user.theme };
	},
});

const BASE_THEMES = [
	"default",
	"modernMinimal",
	"cleanslate",
	"mocha",
	"amber",
	"amethyst",
	"bloom",
	"bubblegum",
	"candyland",
	"catppuccin",
	"boldtech",
	"claymorphism",
	"cosmic",
	"cyberpunk",
	"caffeine",
	"luxury",
	"doom",
	"darkmatter",
	"kodama",
	"claude",
] as const;

const ALLOWED_THEMES = new Set<string>([
	"light",
	"dark",
	...BASE_THEMES,
	...BASE_THEMES.map((theme) => `${theme}-dark`),
]);

// Set user's theme preference
export const setUserTheme = mutation({
	args: {
		theme: v.string(),
	},
	returns: v.object({
		success: v.boolean(),
		theme: v.string(),
	}),
	handler: async (ctx, { theme }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity || typeof identity.subject !== "string") {
			throw new Error("Authentication required");
		}

		if (!ALLOWED_THEMES.has(theme)) {
			throw new Error(`Unsupported theme "${theme}"`);
		}

		const user = await userByExternalId(ctx, identity.subject);
		if (!user) {
			throw new Error("User not found");
		}

		await ctx.db.patch(user._id, { theme });
		return { success: true, theme };
	},
});

export const provisionCurrentUser = action({
	args: {},
	returns: v.object({
		status: v.literal("success"),
		data: v.object({
			message: v.string(),
			result: v.any(),
		}),
	}),
	handler: async (ctx): Promise<{
		status: "success";
		data: {
			message: string;
			result: unknown;
		};
	}> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		const email = identity.email;
		if (!email) {
			throw new Error("Email is required but not found in identity");
		}

		const payload = {
			idp_id: identity.subject,
			email,
			email_verified: Boolean(identity.email_verified ?? false),
			first_name: typeof identity.first_name === "string" ? identity.first_name : undefined,
			last_name: typeof identity.last_name === "string" ? identity.last_name : undefined,
			profile_picture_url: typeof identity.profile_picture_url === "string" 
				? identity.profile_picture_url 
				: typeof identity.profile_picture === "string" 
					? identity.profile_picture 
					: undefined,
			created_at: new Date().toISOString(),
		};

		return await ctx.runMutation(internal.users.createFromWorkOS, payload);
	},
});

export const viewer = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}
		const user = await userByExternalId(ctx, identity.subject);
	},
});

/**
 * Internal query to get user by IDP ID
 * For use by actions that need to resolve user IDs
 */
export const getUserByIdpId = internalQuery({
	args: { idpId: v.string() },
	handler: async (ctx, { idpId }) => {
		return await userByExternalId(ctx, idpId);
	},
});

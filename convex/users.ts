// import { type UserJSON } from '@workos-inc/authkit-node';
import { v } from "convex/values";
import { crud } from "convex-helpers/server/crud";
import { internalMutation, type QueryCtx } from "./_generated/server";
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
	handler: async (ctx, args) => {
		const existingUser = await userByExternalId(ctx, args.idp_id);

		if (existingUser) {
			await ctx.db.patch(existingUser._id, { ...args });
			return {
				status: "success",
				data: {
					message: "User already exists, updated existing user",
					result: existingUser,
				},
			};
		}
		const res = await ctx.db.insert("users", { ...args });
		return {
			status: "success",
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

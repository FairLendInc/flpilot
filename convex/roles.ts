import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import schema from "./schema";

const _roleFields = schema.tables.roles.validator.fields;
// Note: user_roles table removed - roles are now managed via organization_memberships.roles[]

// Create or update a role based on WorkOS webhook data
export const createOrUpdateRole = internalMutation({
	args: v.object({
		slug: v.string(),
		name: v.optional(v.string()),
		permissions: v.optional(v.array(v.string())),
		created_at: v.optional(v.string()),
		updated_at: v.optional(v.string()),
	}),
	handler: async (ctx, args) => {
		const existingRole = await ctx.db
			.query("roles")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.unique();

		if (existingRole) {
			// Update existing role
			await ctx.db.patch(existingRole._id, {
				name: args.name,
				permissions: args.permissions,
				updated_at: args.updated_at,
			});
			console.log("Role updated:", {
				roleId: existingRole._id,
				slug: args.slug,
				permissions: args.permissions,
			});
			return existingRole._id;
		}
		// Create new role
		const roleId = await ctx.db.insert("roles", {
			slug: args.slug,
			name: args.name,
			permissions: args.permissions,
			created_at: args.created_at,
			updated_at: args.updated_at,
		});
		console.log("Role created:", {
			roleId,
			slug: args.slug,
			permissions: args.permissions,
		});
		return roleId;
	},
});

// Delete a role based on WorkOS webhook data
export const deleteRole = internalMutation({
	args: v.object({
		slug: v.string(),
	}),
	handler: async (ctx, args) => {
		const existingRole = await ctx.db
			.query("roles")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.unique();

		if (!existingRole) {
			console.log("Role not found for deletion:", { slug: args.slug });
			return { success: false, message: "Role not found" };
		}

		// Delete the role
		// Note: Role assignments are managed via organization_memberships.roles[]
		// No need to clean up user_roles table (removed)
		await ctx.db.delete(existingRole._id);

		console.log("Role deleted:", {
			roleId: existingRole._id,
			slug: args.slug,
		});

		return { success: true, message: "Role deleted successfully" };
	},
});

// ============================================================================
// DEPRECATED: The following functions used the removed user_roles table
// Roles are now managed via organization_memberships.roles[] array
// To get user roles, query organization_memberships for a given user
// ============================================================================
/*
export const assignRoleToUser = internalMutation({ ... });
export const removeRoleFromUser = internalMutation({ ... });
export const getUserRoles = internalQuery({ ... });
*/

// Get a single role by slug
export const getRoleBySlug = internalQuery({
	args: v.object({
		slug: v.string(),
	}),
	handler: async (ctx, args) =>
		await ctx.db
			.query("roles")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.unique(),
});

export const getPermissionsByRole = internalQuery({
	args: v.object({
		roleSlug: v.string(),
	}),
	handler: async (ctx, args) =>
		await ctx.db
			.query("roles")
			.withIndex("by_slug", (q) => q.eq("slug", args.roleSlug))
			.unique(),
});

export const getPermissionsForCurrentUser = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return [];
		}
		// Get the user's active organization
	},
});

import { v, Infer } from "convex/values";
import { internal, api } from "./_generated/api";
import { action, mutation, query } from "./_generated/server";
import { FunctionReturnType } from "convex/server";
import schema from "./schema";
type User = Infer<typeof schema.tables.users.validator>;
type Organization = Infer<typeof schema.tables.organizations.validator>;
type Membership = Infer<typeof schema.tables.organization_memberships.validator>;
import logger from "../lib/logger";


export const getCurrentUserProfile = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return {
				user: null,
				workOsIdentity: identity,
				memberships: [],
				activeOrganizationId: null,
			};
		}
		const workosUserId = identity.subject;

		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", workosUserId))
			.unique();

		if (!user) {
			return {
				user: null,
				workOsIdentity: identity,
				memberships: [],
				activeOrganizationId: null,
			};
		}

		const memberships = await ctx.db
			.query("organization_memberships")
			.withIndex("byUserId", (q) => q.eq("user_id", workosUserId))
			.collect();


	const orgMemberships = (await Promise.all(
		memberships.map(async (membership) => {
			const org = await ctx.db
				.query("organizations")
				.withIndex("byWorkosId", (q) => q.eq("id", membership.organization_id))
				.unique();
			
			// Fetch role details with permissions
			const roleDetails = await Promise.all(
				(membership.roles || []).map(async (roleRef) => {
					const role = await ctx.db
						.query("roles")
						.withIndex("by_slug", (q) => q.eq("slug", roleRef.slug))
						.unique();
					return {
						slug: roleRef.slug,
						name: role?.name ?? roleRef.slug,
						permissions: role?.permissions ?? [],
					};
				})
			);

			// Determine the active/primary role
			const primaryRoleSlug = membership.role?.slug ?? roleDetails[0]?.slug ?? "";
			
			return {
				organizationId: org?.id ?? "",
				organizationName: org?.name ?? "",
				organizationExternalId: org?.external_id ?? "",
				organizationMetadata: org?.metadata ?? {},					
				organizationCreatedAt: org?.created_at ?? "",
				memberShipId: membership.id,
				membershipOrgId: membership.organization_id,
				membershipRole: membership.role,
				membershipRoles: membership.roles,
				roleDetails: roleDetails,
				primaryRoleSlug: primaryRoleSlug,
				membershipCreatedAt: membership.created_at ?? "",
			}
		})
	))
// rganizationId: string; organizationName: string; organizationExternalId: string; organizationMetadata: any; organizationCreatedAt: string; memberShipId: string; membershipOrgId: string;
	// Extract WorkOS permissions from identity for the active organization
	const workosPermissions = (identity as any)?.permissions ?? [];
	const workosOrgId = (identity as any)?.org_id ?? null;
	const workosRole = (identity as any)?.role ?? null;

	console.debug("PROFILE RETURN PAYLOAD", {
		user: user,
		workOsIdentity: identity,
		memberships: orgMemberships,
		activeOrganizationId: user.active_organization_id ?? null,
		workosPermissions,
		workosOrgId,
	});

	return {
		user: user,
		workOsIdentity: identity,
		memberships: orgMemberships,
		activeOrganizationId: user.active_organization_id ?? null,
		workosPermissions,
		workosOrgId,
		workosRole,
	};
	},
});

// Export the inferred return type
export type UserProfileReturnType = FunctionReturnType<typeof api.profile.getCurrentUserProfile>;

export const updateProfile = mutation({
	args: v.object({
		first_name: v.optional(v.string()),
		last_name: v.optional(v.string()),
		phone: v.optional(v.string()),
	}),
	returns: v.object({ synced: v.boolean() }),
	handler: async (ctx, args): Promise<{ synced: boolean }> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthenticated");
		const workosUserId = identity.subject;

		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", workosUserId))
			.unique();
		if (!user) throw new Error("User not found");

		await ctx.db.patch(user._id, {
			...(args.first_name !== undefined ? { first_name: args.first_name } : {}),
			...(args.last_name !== undefined ? { last_name: args.last_name } : {}),
			...(args.phone !== undefined ? { phone: args.phone } : {}),
			updated_at: new Date().toISOString(),
		});

		try {
			await ctx.scheduler.runAfter(0, internal.workos.updateUserProfile, {
				userId: workosUserId,
				firstName: args.first_name,
				lastName: args.last_name,
				phone: args.phone,
			});
			// We schedule the sync and report success of scheduling.
			return { synced: true };
		} catch (_err) {
			// If scheduling fails, report not synced.
			return { synced: false };
		}
	},
});

export const setActiveOrganization = mutation({
	args: v.object({ organization_id: v.string() }),
	returns: v.null(),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthenticated");
		const workosUserId = identity.subject;

		const membership = await ctx.db
			.query("organization_memberships")
			.withIndex("byUserOrganization", (q) =>
				q
					.eq("user_id", workosUserId)
					.eq("organization_id", args.organization_id)
			)
			.unique();

		if (!membership) {
			throw new Error("Cannot set organization: not a member");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", workosUserId))
			.unique();
		if (!user) throw new Error("User not found");

		await ctx.db.patch(user._id, {
			active_organization_id: args.organization_id,
		});
		return null;
	},
});

export const generateUploadUrl = action({
	args: {},
	returns: v.string(),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthenticated");
		const url = await ctx.storage.generateUploadUrl();
		return url;
	},
});

export const saveProfilePicture = mutation({
	args: v.object({ storageId: v.id("_storage") }),
	returns: v.null(),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthenticated");
		const workosUserId = identity.subject;

		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", workosUserId))
			.unique();
		if (!user) throw new Error("User not found");

		const url = await ctx.storage.getUrl(args.storageId);
		if (!url) throw new Error("File not found");

		await ctx.db.patch(user._id, {
			profile_picture_url: url,
			profile_picture: url,
			updated_at: new Date().toISOString(),
		});

		// Note: WorkOS does not support updating profile pictures via API.
		// Profile pictures in WorkOS come from OAuth providers and cannot be modified.
		// We only store the custom profile picture in our Convex database.

		return null;
	},
});

export const syncOrganizationsFromWorkOS = action({
	args: {},
	returns: v.object({
		success: v.boolean(),
		message: v.string(),
		organizationsSynced: v.number(),
	}),
	handler: async (
		ctx
	): Promise<{
		success: boolean;
		message: string;
		organizationsSynced: number;
	}> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthenticated");
		const workosUserId = identity.subject;

		const result = await ctx.runAction(internal.workos.syncUserOrganizations, {
			userId: workosUserId,
		});
		return result;
	},
});

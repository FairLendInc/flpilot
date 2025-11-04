/**
 * WorkOS → Convex Sync Helper Functions
 *
 * Mutations and queries to support the daily sync process.
 * These cannot be in sync.ts because that file uses "use node" directive.
 */

import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// ============================================================================
// Query Helpers - Fetch Convex Data for Comparison
// ============================================================================

/** Get all users from Convex */
export const getAllConvexUsers = internalQuery({
	args: v.object({}),
	returns: v.array(
		v.object({
			_id: v.id("users"),
			idp_id: v.string(),
			email: v.string(),
			email_verified: v.boolean(),
			first_name: v.optional(v.string()),
			last_name: v.optional(v.string()),
			profile_picture: v.optional(v.string()),
			updated_at: v.optional(v.string()),
			last_sign_in_at: v.optional(v.string()),
			external_id: v.optional(v.string()),
			metadata: v.optional(v.any()),
		})
	),
	handler: async (ctx) => {
		const users = await ctx.db.query("users").collect();
		return users.map((user) => ({
			_id: user._id,
			idp_id: user.idp_id,
			email: user.email,
			email_verified: user.email_verified,
			first_name: user.first_name,
			last_name: user.last_name,
			profile_picture: user.profile_picture,
			updated_at: user.updated_at,
			last_sign_in_at: user.last_sign_in_at,
			external_id: user.external_id,
			metadata: user.metadata,
		}));
	},
});

/** Get all organizations from Convex */
export const getAllConvexOrganizations = internalQuery({
	args: v.object({}),
	returns: v.array(
		v.object({
			_id: v.id("organizations"),
			id: v.string(),
			name: v.string(),
			external_id: v.optional(v.string()),
			updated_at: v.optional(v.string()),
			metadata: v.optional(v.any()),
		})
	),
	handler: async (ctx) => {
		const orgs = await ctx.db.query("organizations").collect();
		return orgs.map((org) => ({
			_id: org._id,
			id: org.id,
			name: org.name,
			external_id: org.external_id,
			updated_at: org.updated_at,
			metadata: org.metadata,
		}));
	},
});

/** Get all organization memberships from Convex */
export const getAllConvexMemberships = internalQuery({
	args: v.object({}),
	returns: v.array(
		v.object({
			_id: v.id("organization_memberships"),
			id: v.string(),
			user_id: v.string(),
			organization_id: v.string(),
			status: v.optional(v.string()),
			role: v.optional(v.object({ slug: v.string() })),
			roles: v.optional(v.array(v.object({ slug: v.string() }))),
			updated_at: v.optional(v.string()),
		})
	),
	handler: async (ctx) => {
		const memberships = await ctx.db
			.query("organization_memberships")
			.collect();
		return memberships.map((m) => ({
			_id: m._id,
			id: m.id,
			user_id: m.user_id,
			organization_id: m.organization_id,
			status: m.status,
			role: m.role,
			roles: m.roles,
			updated_at: m.updated_at,
		}));
	},
});

// ============================================================================
// CRUD Mutations - Create, Update, Delete Operations
// ============================================================================

// ---------- User CRUD ----------

/** Create a new user in Convex */
export const createUser = internalMutation({
	args: v.object({
		idp_id: v.string(),
		email: v.string(),
		email_verified: v.boolean(),
		first_name: v.optional(v.string()),
		last_name: v.optional(v.string()),
		profile_picture: v.optional(v.string()),
		created_at: v.optional(v.string()),
		updated_at: v.optional(v.string()),
		last_sign_in_at: v.optional(v.string()),
		external_id: v.optional(v.string()),
		metadata: v.optional(v.any()),
	}),
	handler: async (ctx, args) => {
		return await ctx.db.insert("users", {
			idp_id: args.idp_id,
			email: args.email,
			email_verified: args.email_verified,
			first_name: args.first_name,
			last_name: args.last_name,
			profile_picture: args.profile_picture,
			created_at: args.created_at,
			updated_at: args.updated_at,
			last_sign_in_at: args.last_sign_in_at,
			external_id: args.external_id,
			metadata: args.metadata,
		});
	},
});

/** Update an existing user in Convex */
export const updateUser = internalMutation({
	args: v.object({
		idp_id: v.string(),
		email: v.string(),
		email_verified: v.boolean(),
		first_name: v.optional(v.string()),
		last_name: v.optional(v.string()),
		profile_picture: v.optional(v.string()),
		updated_at: v.optional(v.string()),
		last_sign_in_at: v.optional(v.string()),
		external_id: v.optional(v.string()),
		metadata: v.optional(v.any()),
	}),
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", args.idp_id))
			.unique();

		if (!user) {
			throw new Error(`User not found: ${args.idp_id}`);
		}

		await ctx.db.patch(user._id, {
			email: args.email,
			email_verified: args.email_verified,
			first_name: args.first_name,
			last_name: args.last_name,
			profile_picture: args.profile_picture,
			updated_at: args.updated_at,
			last_sign_in_at: args.last_sign_in_at,
			external_id: args.external_id,
			metadata: args.metadata,
		});
	},
});

/** Delete a user from Convex (hard delete) */
export const deleteUser = internalMutation({
	args: v.object({
		idp_id: v.string(),
	}),
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", args.idp_id))
			.unique();

		if (user) {
			await ctx.db.delete(user._id);
		}
	},
});

// ---------- Organization CRUD ----------

/** Create or update an organization and its domains */
export const createOrUpdateOrganization = internalMutation({
	args: v.object({
		id: v.string(),
		name: v.string(),
		external_id: v.optional(v.string()),
		metadata: v.optional(v.any()),
		created_at: v.optional(v.string()),
		updated_at: v.optional(v.string()),
		domains: v.array(
			v.object({
				id: v.string(),
				domain: v.string(),
				organization_id: v.string(),
				object: v.string(),
				created_at: v.optional(v.string()),
				updated_at: v.optional(v.string()),
			})
		),
	}),
	handler: async (ctx, args) => {
		// Check if organization exists
		const existingOrg = await ctx.db
			.query("organizations")
			.withIndex("byWorkosId", (q) => q.eq("id", args.id))
			.unique();

		if (existingOrg) {
			// Update existing organization
			await ctx.db.patch(existingOrg._id, {
				name: args.name,
				external_id: args.external_id,
				metadata: args.metadata,
				updated_at: args.updated_at,
			});
		} else {
			// Create new organization
			await ctx.db.insert("organizations", {
				id: args.id,
				name: args.name,
				external_id: args.external_id,
				metadata: args.metadata,
				created_at: args.created_at,
				updated_at: args.updated_at,
			});
		}

		// Sync domains
		const existingDomains = await ctx.db
			.query("organization_domains")
			.withIndex("byOrganizationId", (q) => q.eq("organization_id", args.id))
			.collect();

		// Create map of existing domains by ID
		const existingDomainMap = new Map(existingDomains.map((d) => [d.id, d]));

		// Add/update domains from WorkOS
		for (const domain of args.domains) {
			const existingDomain = existingDomainMap.get(domain.id);

			if (existingDomain) {
				// Update if changed
				if (
					existingDomain.domain !== domain.domain ||
					existingDomain.updated_at !== domain.updated_at
				) {
					await ctx.db.patch(existingDomain._id, {
						domain: domain.domain,
						updated_at: domain.updated_at,
					});
				}
				existingDomainMap.delete(domain.id);
			} else {
				// Create new domain
				await ctx.db.insert("organization_domains", {
					id: domain.id,
					domain: domain.domain,
					organization_id: domain.organization_id,
					object: domain.object,
					created_at: domain.created_at,
					updated_at: domain.updated_at,
				});
			}
		}

		// Delete domains that no longer exist in WorkOS
		for (const orphanedDomain of existingDomainMap.values()) {
			await ctx.db.delete(orphanedDomain._id);
		}
	},
});

/** Delete an organization from Convex (hard delete) */
export const deleteOrganization = internalMutation({
	args: v.object({
		id: v.string(),
	}),
	handler: async (ctx, args) => {
		const org = await ctx.db
			.query("organizations")
			.withIndex("byWorkosId", (q) => q.eq("id", args.id))
			.unique();

		if (org) {
			// Delete all associated domains
			const domains = await ctx.db
				.query("organization_domains")
				.withIndex("byOrganizationId", (q) => q.eq("organization_id", args.id))
				.collect();

			for (const domain of domains) {
				await ctx.db.delete(domain._id);
			}

			// Delete organization
			await ctx.db.delete(org._id);
		}
	},
});

// ---------- Organization Membership CRUD ----------

/** Create or update an organization membership */
export const createOrUpdateMembership = internalMutation({
	args: v.object({
		id: v.string(),
		user_id: v.string(),
		organization_id: v.string(),
		status: v.optional(v.string()),
		role: v.optional(v.object({ slug: v.string() })),
		roles: v.optional(v.array(v.object({ slug: v.string() }))),
		object: v.optional(v.string()),
		created_at: v.optional(v.string()),
		updated_at: v.optional(v.string()),
	}),
	handler: async (ctx, args) => {
		const existingMembership = await ctx.db
			.query("organization_memberships")
			.withIndex("byMembershipId", (q) => q.eq("id", args.id))
			.unique();

		if (existingMembership) {
			// Update existing membership
			await ctx.db.patch(existingMembership._id, {
				status: args.status,
				role: args.role,
				roles: args.roles,
				updated_at: args.updated_at,
			});
		} else {
			// Create new membership
			await ctx.db.insert("organization_memberships", {
				id: args.id,
				user_id: args.user_id,
				organization_id: args.organization_id,
				status: args.status,
				role: args.role,
				roles: args.roles,
				object: args.object,
				created_at: args.created_at,
				updated_at: args.updated_at,
			});
		}
	},
});

/** Delete an organization membership from Convex (hard delete) */
export const deleteMembership = internalMutation({
	args: v.object({
		id: v.string(),
	}),
	handler: async (ctx, args) => {
		const membership = await ctx.db
			.query("organization_memberships")
			.withIndex("byMembershipId", (q) => q.eq("id", args.id))
			.unique();

		if (membership) {
			await ctx.db.delete(membership._id);
		}
	},
});

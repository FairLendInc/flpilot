import { v } from "convex/values";
import { checkRbac } from "../lib/authhelper";
import { internalMutation, internalQuery, query } from "./_generated/server";

// Create or update an organization based on WorkOS webhook data
export const createOrUpdateOrganization = internalMutation({
	args: v.object({
		id: v.string(),
		name: v.string(),
		external_id: v.optional(v.string()),
		metadata: v.optional(v.any()),
		created_at: v.optional(v.string()),
		updated_at: v.optional(v.string()),
		domains: v.optional(
			v.array(
				v.object({
					id: v.string(),
					domain: v.string(),
					organization_id: v.string(),
					object: v.optional(v.string()),
					created_at: v.optional(v.string()),
					updated_at: v.optional(v.string()),
				})
			)
		),
	}),
	handler: async (ctx, args) => {
		const existingOrg = await ctx.db
			.query("organizations")
			.withIndex("byWorkosId", (q) => q.eq("id", args.id))
			.unique();

		let organizationId: string;
		if (existingOrg) {
			// Update existing organization
			await ctx.db.patch(existingOrg._id, {
				name: args.name,
				external_id: args.external_id,
				metadata: args.metadata,
				updated_at: args.updated_at,
			});
			console.log("Organization updated:", {
				organizationId: existingOrg._id,
				workosId: args.id,
				name: args.name,
			});
			organizationId = existingOrg._id;
		} else {
			// Create new organization
			organizationId = await ctx.db.insert("organizations", {
				id: args.id,
				name: args.name,
				external_id: args.external_id,
				metadata: args.metadata,
				created_at: args.created_at,
				updated_at: args.updated_at,
			});
			console.log("Organization created:", {
				organizationId,
				workosId: args.id,
				name: args.name,
			});
		}

		// Process domains if provided
		if (args.domains && args.domains.length > 0) {
			for (const domainData of args.domains) {
				const existingDomain = await ctx.db
					.query("organization_domains")
					.withIndex("byDomainId", (q) => q.eq("id", domainData.id))
					.unique();

				if (existingDomain) {
					// Update existing domain
					await ctx.db.patch(existingDomain._id, {
						domain: domainData.domain,
						organization_id: args.id,
						object: domainData.object,
						updated_at: domainData.updated_at,
					});
					console.log("Domain updated:", {
						domainId: existingDomain._id,
						workosId: domainData.id,
						domain: domainData.domain,
						object: domainData.object,
					});
				} else {
					// Create new domain
					const domainId = await ctx.db.insert("organization_domains", {
						id: domainData.id,
						domain: domainData.domain,
						organization_id: args.id,
						object: domainData.object,
						created_at: domainData.created_at,
						updated_at: domainData.updated_at,
					});
					console.log("Domain created:", {
						domainId,
						workosId: domainData.id,
						domain: domainData.domain,
						object: domainData.object,
					});
				}
			}
		}

		return organizationId;
	},
});

// Delete an organization based on WorkOS webhook data
export const deleteOrganization = internalMutation({
	args: v.object({
		id: v.string(),
	}),
	handler: async (ctx, args) => {
		const existingOrg = await ctx.db
			.query("organizations")
			.withIndex("byWorkosId", (q) => q.eq("id", args.id))
			.unique();

		if (!existingOrg) {
			console.log("Organization not found for deletion:", { id: args.id });
			return { success: false, message: "Organization not found" };
		}

		// Delete all associated domains first
		const domains = await ctx.db
			.query("organization_domains")
			.withIndex("byOrganizationId", (q) => q.eq("organization_id", args.id))
			.collect();

		for (const domain of domains) {
			await ctx.db.delete(domain._id);
		}

		// Delete the organization
		await ctx.db.delete(existingOrg._id);

		console.log("Organization deleted:", {
			organizationId: existingOrg._id,
			workosId: args.id,
			domainsDeleted: domains.length,
		});

		return { success: true, message: "Organization deleted successfully" };
	},
});

// Create or update an organization membership based on WorkOS webhook data
export const createOrUpdateMembership = internalMutation({
	args: v.object({
		id: v.string(),
		user_id: v.string(),
		organization_id: v.string(),
		status: v.optional(v.string()),
		role: v.optional(
			v.object({
				slug: v.string(),
			})
		),
		roles: v.optional(
			v.array(
				v.object({
					slug: v.string(),
				})
			)
		),
		object: v.optional(v.string()),
		created_at: v.optional(v.string()),
		updated_at: v.optional(v.string()),
	}),
	handler: async (ctx, args) => {
		const existingMembership = await ctx.db
			.query("organization_memberships")
			.withIndex("byMembershipId", (q) => q.eq("id", args.id))
			.unique();

		let membershipId: string;
		if (existingMembership) {
			// Update existing membership
			await ctx.db.patch(existingMembership._id, {
				user_id: args.user_id,
				organization_id: args.organization_id,
				status: args.status,
				role: args.role,
				roles: args.roles,
				updated_at: args.updated_at,
			});
			console.log("Organization membership updated:", {
				membershipId: existingMembership._id,
				workosId: args.id,
				userId: args.user_id,
				organizationId: args.organization_id,
				status: args.status,
			});
			membershipId = existingMembership._id;
		} else {
			// Create new membership
			membershipId = await ctx.db.insert("organization_memberships", {
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
			console.log("Organization membership created:", {
				membershipId,
				workosId: args.id,
				userId: args.user_id,
				organizationId: args.organization_id,
				status: args.status,
			});
		}

		return membershipId;
	},
});

// Delete an organization membership based on WorkOS webhook data
export const deleteMembership = internalMutation({
	args: v.object({
		id: v.string(),
	}),
	handler: async (ctx, args) => {
		const existingMembership = await ctx.db
			.query("organization_memberships")
			.withIndex("byMembershipId", (q) => q.eq("id", args.id))
			.unique();

		if (!existingMembership) {
			console.log("Organization membership not found for deletion:", {
				id: args.id,
			});
			return { success: false, message: "Organization membership not found" };
		}

		// Delete the membership
		await ctx.db.delete(existingMembership._id);

		console.log("Organization membership deleted:", {
			membershipId: existingMembership._id,
			workosId: args.id,
			userId: existingMembership.user_id,
			organizationId: existingMembership.organization_id,
		});

		return {
			success: true,
			message: "Organization membership deleted successfully",
		};
	},
});

// Get organization membership by WorkOS ID
export const getMembershipById = internalQuery({
	args: v.object({
		id: v.string(),
	}),
	handler: async (ctx, args) =>
		await ctx.db
			.query("organization_memberships")
			.withIndex("byMembershipId", (q) => q.eq("id", args.id))
			.unique(),
});

// Get organization by WorkOS ID
export const getOrganizationById = internalQuery({
	args: v.object({
		id: v.string(),
	}),
	handler: async (ctx, args) =>
		await ctx.db
			.query("organizations")
			.withIndex("byWorkosId", (q) => q.eq("id", args.id))
			.unique(),
});

// List all organizations for admin UI
export const listOrganizations = query({
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

		const organizations = await ctx.db.query("organizations").collect();

		return organizations.map((org) => ({
			id: org.id,
			name: org.name,
		}));
	},
});

"use node";

import { WorkOS } from "@workos-inc/node";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";

/**
 * Provision a WorkOS organization for a broker
 * Creates the organization and assigns the broker user as admin
 */
export const provisionBrokerOrganization = internalAction({
	args: {
		brokerUserId: v.string(),
		brokerWorkosUserId: v.string(),
		organizationName: v.string(),
		subdomain: v.string(),
	},
	returns: v.object({
		workosOrgId: v.string(),
		brokerUserId: v.string(),
	}),
	handler: async (_ctx, args) => {
		const apiKey = process.env.WORKOS_API_KEY;

		if (!apiKey) {
			console.warn(
				"Skipping WorkOS broker organization provisioning (missing API key)"
			);
			throw new Error("WORKOS_API_KEY is not configured");
		}

		const workos = new WorkOS(apiKey);

		try {
			// Create WorkOS organization for the broker
			const org = await workos.organizations.createOrganization({
				name: args.organizationName,
				// domains: [], // Broker can add domains later
				// metadata: {
				// 	type: "broker",
				// 	subdomain: args.subdomain,
				// 	provisionedAt: new Date().toISOString(),
				// },
			});

			console.log("Created WorkOS organization for broker:", {
				orgId: org.id,
				orgName: org.name,
				brokerUserId: args.brokerUserId,
				subdomain: args.subdomain,
			});

			// Assign broker user as admin of the organization
			const membership =
				await workos.userManagement.createOrganizationMembership({
					organizationId: org.id,
					userId: args.brokerWorkosUserId,
					roleSlug: "broker_admin",
				});

			console.log("Assigned broker admin role:", {
				orgId: org.id,
				userId: args.brokerWorkosUserId,
				roleSlug: "broker_admin",
				membershipId: membership.id,
			});

			// TODO: Update broker record with WorkOS org ID
			// Need to look up broker ID by brokerUserId and update
			// For now, returning workosOrgId so mutation can do the update

			return {
				workosOrgId: org.id,
				brokerUserId: args.brokerUserId,
			};
		} catch (error) {
			console.error("Failed to provision broker organization:", {
				brokerUserId: args.brokerUserId,
				organizationName: args.organizationName,
				subdomain: args.subdomain,
				error: error instanceof Error ? error.message : String(error),
				errorStack: error instanceof Error ? error.stack : undefined,
			});
			throw error;
		}
	},
});

/**
 * Provision a WorkOS organization for a client
 * Creates a separate org for each client for security isolation
 */
export const provisionClientOrganization = internalAction({
	args: {
		clientWorkosUserId: v.string(),
		clientUserId: v.string(),
		brokerOrgId: v.string(),
		clientName: v.string(),
		brokerName: v.string(),
	},
	returns: v.object({
		workosOrgId: v.string(),
		clientUserId: v.string(),
	}),
	handler: async (_ctx, args) => {
		const apiKey = process.env.WORKOS_API_KEY;

		if (!apiKey) {
			console.warn(
				"Skipping WorkOS client organization provisioning (missing API key)"
			);
			throw new Error("WORKOS_API_KEY is not configured");
		}

		const workos = new WorkOS(apiKey);

		try {
			// Create WorkOS organization for the client
			const org = await workos.organizations.createOrganization({
				name: `${args.clientName} (Managed by ${args.brokerName})`,
				// domains: [],
				// metadata: {
				// 	type: "client",
				// 	managedByBrokerOrgId: args.brokerOrgId,
				// 	clientUserId: args.clientUserId,
				// 	provisionedAt: new Date().toISOString(),
				// },
			});

			console.log("Created WorkOS organization for client:", {
				orgId: org.id,
				orgName: org.name,
				clientUserId: args.clientUserId,
				brokerOrgId: args.brokerOrgId,
			});

			// Assign client as member of their own organization
			const membership =
				await workos.userManagement.createOrganizationMembership({
					organizationId: org.id,
					userId: args.clientWorkosUserId,
					roleSlug: "investor",
				});

			console.log("Assigned client investor role:", {
				orgId: org.id,
				userId: args.clientWorkosUserId,
				roleSlug: "investor",
				membershipId: membership.id,
			});

			// Update broker_clients record with WorkOS org ID
			// Note: This will need to look up the actual broker client record
			// using the clientUserId and brokerOrgId

			return {
				workosOrgId: org.id,
				clientUserId: args.clientUserId,
			};
		} catch (error) {
			console.error("Failed to provision client organization:", {
				clientUserId: args.clientUserId,
				clientName: args.clientName,
				brokerOrgId: args.brokerOrgId,
				brokerName: args.brokerName,
				error: error instanceof Error ? error.message : String(error),
				errorStack: error instanceof Error ? error.stack : undefined,
			});
			throw error;
		}
	},
});

/**
 * Assign a role to a broker team member
 * Invites or assigns a user to the broker organization with a specific role
 */
export const assignBrokerRole = internalAction({
	args: {
		brokerOrgId: v.string(),
		userWorkosUserId: v.string(),
		roleSlug: v.union(
			v.literal("broker_admin"),
			v.literal("broker_member"),
			v.literal("broker_viewer")
		),
	},
	returns: v.null(),
	handler: async (_ctx, args) => {
		const apiKey = process.env.WORKOS_API_KEY;
		const isTestEnv =
			process.env.NODE_ENV === "test" ||
			typeof process.env.VITEST_WORKER_ID === "string";

		if (!apiKey || isTestEnv) {
			console.warn(
				"Skipping WorkOS broker role assignment (missing API key or test environment)"
			);
			return null;
		}

		const workos = new WorkOS(apiKey);

		try {
			// Check if user is already a member of the broker organization
			const memberships =
				await workos.userManagement.listOrganizationMemberships({
					userId: args.userWorkosUserId,
					organizationId: args.brokerOrgId,
					limit: 10,
				});

			if (!memberships.data || memberships.data.length === 0) {
				// User is not a member - create membership with role
				console.log("Creating new broker organization membership with role", {
					userId: args.userWorkosUserId,
					brokerOrgId: args.brokerOrgId,
					roleSlug: args.roleSlug,
				});

				const membership =
					await workos.userManagement.createOrganizationMembership({
						organizationId: args.brokerOrgId,
						userId: args.userWorkosUserId,
						roleSlug: args.roleSlug,
					});

				console.log("Successfully created broker membership with role", {
					membershipId: membership.id,
					brokerOrgId: args.brokerOrgId,
					roleSlug: args.roleSlug,
				});

				return null;
			}

			// User is already a member - update the membership role
			const membership = memberships.data[0];

			console.log("Updating existing broker organization membership role", {
				userId: args.userWorkosUserId,
				brokerOrgId: args.brokerOrgId,
				roleSlug: args.roleSlug,
				membershipId: membership.id,
			});

			await workos.userManagement.updateOrganizationMembership(membership.id, {
				roleSlug: args.roleSlug,
			});

			console.log("Successfully updated broker membership role", {
				membershipId: membership.id,
				brokerOrgId: args.brokerOrgId,
				roleSlug: args.roleSlug,
			});

			return null;
		} catch (error) {
			console.error("Failed to assign broker role:", {
				userWorkosUserId: args.userWorkosUserId,
				brokerOrgId: args.brokerOrgId,
				roleSlug: args.roleSlug,
				error: error instanceof Error ? error.message : String(error),
				errorStack: error instanceof Error ? error.stack : undefined,
			});
			throw error;
		}
	},
});

/**
 * Assign investor role to a client
 * Used when approving a client for investment access
 */
export const assignClientRole = internalAction({
	args: {
		clientOrgId: v.string(),
		userWorkosUserId: v.string(),
		roleSlug: v.union(
			v.literal("investor_full"),
			v.literal("investor_limited"),
			v.literal("investor_viewer")
		),
	},
	returns: v.null(),
	handler: async (_ctx, args) => {
		const apiKey = process.env.WORKOS_API_KEY;
		const isTestEnv =
			process.env.NODE_ENV === "test" ||
			typeof process.env.VITEST_WORKER_ID === "string";

		if (!apiKey || isTestEnv) {
			console.warn(
				"Skipping WorkOS client role assignment (missing API key or test environment)"
			);
			return null;
		}

		const workos = new WorkOS(apiKey);

		try {
			// Check if user is already a member of the client organization
			const memberships =
				await workos.userManagement.listOrganizationMemberships({
					userId: args.userWorkosUserId,
					organizationId: args.clientOrgId,
					limit: 10,
				});

			if (!memberships.data || memberships.data.length === 0) {
				// User is not a member - create membership with role
				console.log("Creating new client organization membership with role", {
					userId: args.userWorkosUserId,
					clientOrgId: args.clientOrgId,
					roleSlug: args.roleSlug,
				});

				const membership =
					await workos.userManagement.createOrganizationMembership({
						organizationId: args.clientOrgId,
						userId: args.userWorkosUserId,
						roleSlug: args.roleSlug,
					});

				console.log("Successfully created client membership with role", {
					membershipId: membership.id,
					clientOrgId: args.clientOrgId,
					roleSlug: args.roleSlug,
				});

				return null;
			}

			// User is already a member - update the membership role
			const membership = memberships.data[0];

			console.log("Updating existing client organization membership role", {
				userId: args.userWorkosUserId,
				clientOrgId: args.clientOrgId,
				roleSlug: args.roleSlug,
				membershipId: membership.id,
			});

			await workos.userManagement.updateOrganizationMembership(membership.id, {
				roleSlug: args.roleSlug,
			});

			console.log("Successfully updated client membership role", {
				membershipId: membership.id,
				clientOrgId: args.clientOrgId,
				roleSlug: args.roleSlug,
			});

			return null;
		} catch (error) {
			console.error("Failed to assign client role:", {
				userWorkosUserId: args.userWorkosUserId,
				clientOrgId: args.clientOrgId,
				roleSlug: args.roleSlug,
				error: error instanceof Error ? error.message : String(error),
				errorStack: error instanceof Error ? error.stack : undefined,
			});
			throw error;
		}
	},
});

/**
 * Remove broker team member
 * Removes a user's membership from the broker organization
 */
export const removeBrokerMember = internalAction({
	args: {
		brokerOrgId: v.string(),
		userWorkosUserId: v.string(),
	},
	returns: v.null(),
	handler: async (_ctx, args) => {
		const apiKey = process.env.WORKOS_API_KEY;
		const isTestEnv =
			process.env.NODE_ENV === "test" ||
			typeof process.env.VITEST_WORKER_ID === "string";

		if (!apiKey || isTestEnv) {
			console.warn(
				"Skipping WorkOS broker member removal (missing API key or test environment)"
			);
			return null;
		}

		const workos = new WorkOS(apiKey);

		try {
			// Find user's membership in the broker organization
			const memberships =
				await workos.userManagement.listOrganizationMemberships({
					userId: args.userWorkosUserId,
					organizationId: args.brokerOrgId,
					limit: 10,
				});

			if (!memberships.data || memberships.data.length === 0) {
				console.warn("User is not a member of this broker organization:", {
					brokerOrgId: args.brokerOrgId,
					userWorkosUserId: args.userWorkosUserId,
				});
				return null;
			}

			const membership = memberships.data[0];

			// Delete the membership
			await workos.userManagement.deleteOrganizationMembership(membership.id);

			console.log("Successfully removed broker member:", {
				brokerOrgId: args.brokerOrgId,
				userWorkosUserId: args.userWorkosUserId,
				membershipId: membership.id,
			});

			return null;
		} catch (error) {
			console.error("Failed to remove broker member:", {
				brokerOrgId: args.brokerOrgId,
				userWorkosUserId: args.userWorkosUserId,
				error: error instanceof Error ? error.message : String(error),
				errorStack: error instanceof Error ? error.stack : undefined,
			});
			throw error;
		}
	},
});

/**
 * Update broker organization metadata
 * Updates broker organization name or other metadata
 */
export const updateBrokerOrganization = internalAction({
	args: {
		brokerOrgId: v.string(),
		name: v.optional(v.string()),
		subdomain: v.optional(v.string()),
	},
	returns: v.null(),
	handler: async (_ctx, args) => {
		const apiKey = process.env.WORKOS_API_KEY;
		const isTestEnv =
			process.env.NODE_ENV === "test" ||
			typeof process.env.VITEST_WORKER_ID === "string";

		if (!apiKey || isTestEnv) {
			console.warn(
				"Skipping WorkOS broker organization update (missing API key or test environment)"
			);
			return null;
		}

		const workos = new WorkOS(apiKey);

		try {
			if (args.name) {
				await workos.organizations.updateOrganization({
					organization: args.brokerOrgId,
					name: args.name,
				});
			}

			// TODO: Handle subdomain metadata update when WorkOS supports it
			if (args.subdomain !== undefined) {
				console.log(
					"Subdomain metadata update not yet supported by WorkOS API"
				);
			}

			console.log("Successfully updated broker organization:", {
				brokerOrgId: args.brokerOrgId,
				name: args.name,
				subdomain: args.subdomain,
			});

			return null;
		} catch (error) {
			console.error("Failed to update broker organization:", {
				brokerOrgId: args.brokerOrgId,
				name: args.name,
				subdomain: args.subdomain,
				error: error instanceof Error ? error.message : String(error),
				errorStack: error instanceof Error ? error.stack : undefined,
			});
			throw error;
		}
	},
});

"use node";

import { WorkOS } from "@workos-inc/node";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { internalAction } from "../_generated/server";
import type { AuthorizedActionCtx } from "../lib/server";
import { createAuthorizedAction } from "../lib/server";

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
	handler: async (ctx, args) => {
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
					roleSlug: "broker",
				});

			console.log("Assigned broker role:", {
				orgId: org.id,
				userId: args.brokerWorkosUserId,
				roleSlug: "broker",
				membershipId: membership.id,
			});

			await ctx.runMutation(
				internal.brokers.management.updateBrokerOrgIdInternal,
				{
					brokerUserId: args.brokerUserId,
					workosOrgId: org.id,
				}
			);

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
			v.literal("broker"),
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

/**
 * Suspend broker organization
 * Removes all memberships from the organization to prevent access
 * Called when a broker is suspended
 */
export const suspendBrokerOrganization = internalAction({
	args: {
		brokerOrgId: v.string(),
	},
	returns: v.null(),
	handler: async (_ctx, args) => {
		const apiKey = process.env.WORKOS_API_KEY;
		const isTestEnv =
			process.env.NODE_ENV === "test" ||
			typeof process.env.VITEST_WORKER_ID === "string";

		if (!apiKey || isTestEnv) {
			console.warn(
				"Skipping WorkOS broker organization suspension (missing API key or test environment)"
			);
			return null;
		}

		const workos = new WorkOS(apiKey);

		try {
			// List all memberships in the organization
			const memberships =
				await workos.userManagement.listOrganizationMemberships({
					organizationId: args.brokerOrgId,
					limit: 100,
				});

			console.log("Suspending broker organization - removing memberships:", {
				brokerOrgId: args.brokerOrgId,
				membershipCount: memberships.data?.length || 0,
			});

			// Remove all memberships to prevent access
			for (const membership of memberships.data || []) {
				await workos.userManagement.deleteOrganizationMembership(membership.id);
				console.log("Removed membership during suspension:", {
					membershipId: membership.id,
					userId: membership.userId,
				});
			}

			console.log("Successfully suspended broker organization:", {
				brokerOrgId: args.brokerOrgId,
				membershipsRemoved: memberships.data?.length || 0,
			});

			return null;
		} catch (error) {
			console.error("Failed to suspend broker organization:", {
				brokerOrgId: args.brokerOrgId,
				error: error instanceof Error ? error.message : String(error),
				errorStack: error instanceof Error ? error.stack : undefined,
			});
			throw error;
		}
	},
});

/**
 * Reactivate broker organization
 * Re-adds the broker admin membership after suspension
 * Called when a suspended broker is reactivated
 */
export const reactivateBrokerOrganization = internalAction({
	args: {
		brokerOrgId: v.string(),
		brokerWorkosUserId: v.string(),
	},
	returns: v.null(),
	handler: async (_ctx, args) => {
		const apiKey = process.env.WORKOS_API_KEY;
		const isTestEnv =
			process.env.NODE_ENV === "test" ||
			typeof process.env.VITEST_WORKER_ID === "string";

		if (!apiKey || isTestEnv) {
			console.warn(
				"Skipping WorkOS broker organization reactivation (missing API key or test environment)"
			);
			return null;
		}

		const workos = new WorkOS(apiKey);

		try {
			// Re-add the broker admin membership
			const membership =
				await workos.userManagement.createOrganizationMembership({
					organizationId: args.brokerOrgId,
					userId: args.brokerWorkosUserId,
					roleSlug: "broker",
				});

			console.log("Successfully reactivated broker organization:", {
				brokerOrgId: args.brokerOrgId,
				brokerWorkosUserId: args.brokerWorkosUserId,
				membershipId: membership.id,
			});

			return null;
		} catch (error) {
			console.error("Failed to reactivate broker organization:", {
				brokerOrgId: args.brokerOrgId,
				brokerWorkosUserId: args.brokerWorkosUserId,
				error: error instanceof Error ? error.message : String(error),
				errorStack: error instanceof Error ? error.stack : undefined,
			});
			throw error;
		}
	},
});

/**
 * Delete broker organization
 * Permanently deletes the WorkOS organization
 * Called when a broker is permanently deleted
 */
export const deleteBrokerOrganization = internalAction({
	args: {
		brokerOrgId: v.string(),
	},
	returns: v.null(),
	handler: async (_ctx, args) => {
		const apiKey = process.env.WORKOS_API_KEY;
		const isTestEnv =
			process.env.NODE_ENV === "test" ||
			typeof process.env.VITEST_WORKER_ID === "string";

		if (!apiKey || isTestEnv) {
			console.warn(
				"Skipping WorkOS broker organization deletion (missing API key or test environment)"
			);
			return null;
		}

		const workos = new WorkOS(apiKey);

		try {
			// First remove all memberships (required before deletion)
			const memberships =
				await workos.userManagement.listOrganizationMemberships({
					organizationId: args.brokerOrgId,
					limit: 100,
				});

			for (const membership of memberships.data || []) {
				await workos.userManagement.deleteOrganizationMembership(membership.id);
			}

			// Delete the organization
			await workos.organizations.deleteOrganization(args.brokerOrgId);

			console.log("Successfully deleted broker organization:", {
				brokerOrgId: args.brokerOrgId,
				membershipsRemoved: memberships.data?.length || 0,
			});

			return null;
		} catch (error) {
			console.error("Failed to delete broker organization:", {
				brokerOrgId: args.brokerOrgId,
				error: error instanceof Error ? error.message : String(error),
				errorStack: error instanceof Error ? error.stack : undefined,
			});
			throw error;
		}
	},
});

// ============================================================================
// Admin-Facing WorkOS Actions
// ============================================================================

/**
 * Admin action to provision a WorkOS organization for a broker
 * Creates a new WorkOS organization and assigns the broker user as admin
 */
export const provisionWorkOSOrganizationAdmin = createAuthorizedAction([
	"admin",
])({
	args: {
		brokerId: v.id("brokers"),
		organizationName: v.optional(v.string()),
	},
	handler: async (
		ctx: AuthorizedActionCtx,
		args: { brokerId: Id<"brokers">; organizationName?: string }
	): Promise<{
		success: boolean;
		workosOrgId?: string;
		error?: string;
	}> => {
		try {
			// Get broker record
			const broker = await ctx.runQuery(api.brokers.management.getBrokerById, {
				brokerId: args.brokerId,
			});

			if (!broker) {
				return {
					success: false,
					error: "Broker not found",
				};
			}

			// Check if broker already has a WorkOS org
			if (broker.workosOrgId && broker.workosOrgId.length > 0) {
				return {
					success: false,
					error: "Broker already has a WorkOS organization provisioned",
				};
			}

			// Get user record to get their WorkOS ID
			const user = await ctx.runQuery(internal.users.getUserById, {
				userId: broker.userId,
			});

			if (!user) {
				return {
					success: false,
					error: "Broker user not found",
				};
			}

			if (!user.idp_id) {
				return {
					success: false,
					error: "Broker user does not have a WorkOS user ID (idp_id)",
				};
			}

			// Determine organization name
			const orgName =
				args.organizationName || broker.branding?.brandName || broker.subdomain;

			// Call the internal provisioning action
			const result: { workosOrgId: string; brokerUserId: string } =
				await ctx.runAction(
					internal.brokers.workos.provisionBrokerOrganization,
					{
						brokerUserId: broker.userId,
						brokerWorkosUserId: user.idp_id,
						organizationName: orgName,
						subdomain: broker.subdomain,
					}
				);

			console.log("Admin provisioned WorkOS organization for broker:", {
				brokerId: args.brokerId,
				workosOrgId: result.workosOrgId,
				organizationName: orgName,
			});

			return {
				success: true,
				workosOrgId: result.workosOrgId,
			};
		} catch (error) {
			console.error("Failed to provision WorkOS organization:", {
				brokerId: args.brokerId,
				error: error instanceof Error ? error.message : String(error),
			});

			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Unknown error occurred",
			};
		}
	},
});

/**
 * Admin action to update/switch a broker's WorkOS organization ID
 * This allows admins to manually assign a different WorkOS org to a broker
 */
export const updateBrokerWorkOSOrganization = createAuthorizedAction(["admin"])(
	{
		args: {
			brokerId: v.id("brokers"),
			workosOrgId: v.string(),
		},
		handler: async (
			ctx: AuthorizedActionCtx,
			args: { brokerId: Id<"brokers">; workosOrgId: string }
		): Promise<{
			success: boolean;
			previousOrgId?: string;
			newOrgId?: string;
			error?: string;
		}> => {
			try {
				// Validate org ID format (WorkOS org IDs start with "org_")
				if (!args.workosOrgId.startsWith("org_")) {
					return {
						success: false,
						error:
							"Invalid WorkOS organization ID format. Must start with 'org_'",
					};
				}

				// Get broker record
				const broker = await ctx.runQuery(
					api.brokers.management.getBrokerById,
					{
						brokerId: args.brokerId,
					}
				);

				if (!broker) {
					return {
						success: false,
						error: "Broker not found",
					};
				}

				const previousOrgId = broker.workosOrgId || undefined;

				// Update the broker's WorkOS org ID
				await ctx.runMutation(api.brokers.management.updateBrokerOrgId, {
					brokerId: args.brokerId,
					workosOrgId: args.workosOrgId,
				});

				console.log("Admin updated broker WorkOS organization:", {
					brokerId: args.brokerId,
					previousOrgId,
					newOrgId: args.workosOrgId,
				});

				return {
					success: true,
					previousOrgId,
					newOrgId: args.workosOrgId,
				};
			} catch (error) {
				console.error("Failed to update broker WorkOS organization:", {
					brokerId: args.brokerId,
					workosOrgId: args.workosOrgId,
					error: error instanceof Error ? error.message : String(error),
				});

				return {
					success: false,
					error:
						error instanceof Error ? error.message : "Unknown error occurred",
				};
			}
		},
	}
);

/**
 * Verify broker's WorkOS status by fetching their actual memberships from WorkOS
 * Returns comparison of local state vs WorkOS state
 */
export const verifyBrokerWorkOSStatus = createAuthorizedAction(["admin"])({
	args: {
		brokerId: v.id("brokers"),
	},
	handler: async (
		ctx: AuthorizedActionCtx,
		args: { brokerId: Id<"brokers"> }
	): Promise<{
		success: boolean;
		localOrgId: string | null;
		workosData: {
			memberships: Array<{
				id: string;
				organizationId: string;
				organizationName?: string;
				status: string;
				role?: string;
				roles?: Array<{ slug: string }>;
			}>;
		};
		isSynced: boolean;
		suggestedOrgId: string | null;
		error?: string;
	}> => {
		const apiKey = process.env.WORKOS_API_KEY;
		const isTestEnv = process.env.NODE_ENV === "test";

		if (!apiKey || isTestEnv) {
			return {
				success: false,
				localOrgId: null,
				workosData: { memberships: [] },
				isSynced: false,
				suggestedOrgId: null,
				error: "WorkOS API key not configured or test environment",
			};
		}

		try {
			// Get broker record
			const broker = await ctx.runQuery(api.brokers.management.getBrokerById, {
				brokerId: args.brokerId,
			});

			if (!broker) {
				return {
					success: false,
					localOrgId: null,
					workosData: { memberships: [] },
					isSynced: false,
					suggestedOrgId: null,
					error: "Broker not found",
				};
			}

			// Get the broker's user to find their WorkOS ID
			const user = await ctx.runQuery(internal.users.getUserById, {
				userId: broker.userId,
			});

			if (!user?.idp_id) {
				return {
					success: false,
					localOrgId: broker.workosOrgId || null,
					workosData: { memberships: [] },
					isSynced: false,
					suggestedOrgId: null,
					error: "User not found or no WorkOS ID",
				};
			}

			const workos = new WorkOS(apiKey);

			// Fetch user's organization memberships from WorkOS
			const memberships =
				await workos.userManagement.listOrganizationMemberships({
					userId: user.idp_id,
					limit: 100,
				});

			// Fetch organization details for each membership
			const membershipDetails = await Promise.all(
				memberships.data.map(async (membership) => {
					let organizationName: string | undefined;
					try {
						const org = await workos.organizations.getOrganization(
							membership.organizationId
						);
						organizationName = org.name;
					} catch {
						// Organization might not exist or not accessible
					}

					return {
						id: membership.id,
						organizationId: membership.organizationId,
						organizationName,
						status: membership.status,
						role: membership.role?.slug,
						roles: membership.role ? [{ slug: membership.role.slug }] : [],
					};
				})
			);

			const localOrgId = broker.workosOrgId || null;

			// Check if local state is synced
			// Synced means: local org ID matches one of the WorkOS memberships (or both are empty)
			const isSynced =
				(localOrgId === null && membershipDetails.length === 0) ||
				(localOrgId !== null &&
					membershipDetails.some((m) => m.organizationId === localOrgId));

			// Suggest an org ID if there's exactly one membership and local is empty
			const suggestedOrgId =
				localOrgId === null && membershipDetails.length === 1
					? membershipDetails[0].organizationId
					: null;

			console.log("Verified broker WorkOS status:", {
				brokerId: args.brokerId,
				localOrgId,
				membershipsFound: membershipDetails.length,
				isSynced,
				suggestedOrgId,
			});

			return {
				success: true,
				localOrgId,
				workosData: { memberships: membershipDetails },
				isSynced,
				suggestedOrgId,
			};
		} catch (error) {
			console.error("Failed to verify broker WorkOS status:", {
				brokerId: args.brokerId,
				error: error instanceof Error ? error.message : String(error),
			});

			return {
				success: false,
				localOrgId: null,
				workosData: { memberships: [] },
				isSynced: false,
				suggestedOrgId: null,
				error:
					error instanceof Error ? error.message : "Unknown error occurred",
			};
		}
	},
});

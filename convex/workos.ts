"use node";

import { WorkOS } from "@workos-inc/node";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { env, isTestEnv } from "./lib/env";

type WorkOsDomain = {
	id?: string;
	domain: string;
	createdAt?: string;
	updatedAt?: string;
};

export const verifyWebhook = internalAction({
	args: v.object({
		payload: v.string(),
		signature: v.string(),
	}),
	returns: v.any(),
	handler: async (_, args) => {
		const workos = new WorkOS(env.WORKOS_API_KEY);

		// Use the exact webhook secret from WorkOS dashboard
		const webhookSecret = env.WORKOS_WEBHOOK_SECRET;

		// WorkOS SDK bug fix applied in node_modules

		try {
			console.log("Testing WorkOS webhook with fix applied:", {
				payloadLength: args.payload.length,
				signature: args.signature,
				secretConfigured: !!webhookSecret,
			});

			const event = await workos.webhooks.constructEvent({
				payload: JSON.parse(args.payload),
				sigHeader: args.signature,
				secret: String(webhookSecret),
			});

			console.log("WorkOS SDK returned:", {
				event,
				eventType: typeof event,
				eventKeys: event ? Object.keys(event) : "no keys - event is falsy",
				eventId: event?.id || "no id property",
				eventName: event?.event || "no event property",
			});

			if (!event) {
				throw new Error("WorkOS SDK returned undefined/null event object");
			}

			console.log("WorkOS webhook verification successful:", {
				eventId: event.id,
				eventType: event.event,
			});

			return event;
		} catch (error) {
			console.error("WorkOS webhook verification failed:", {
				error: error instanceof Error ? error.message : String(error),
				errorName: error instanceof Error ? error.constructor.name : "Unknown",
				payloadLength: args.payload.length,
				signaturePresent: !!args.signature,
				secretPresent: !!webhookSecret,
			});
			throw error;
		}
	},
});

export const getUserRoleFromWorkOS = internalAction({
	args: v.object({ userId: v.string() }),
	returns: v.object({ role: v.string() }),
	handler: async (_ctx, { userId }) => {
		const workos = new WorkOS(env.WORKOS_API_KEY);
		try {
			const user = await workos.userManagement.getUser(userId);
			const role =
				(user?.metadata as Record<string, string> | undefined)?.role ||
				"member";
			return { role };
		} catch (_err) {
			return { role: "member" };
		}
	},
});

export const updateUserRole = internalAction({
	args: v.object({
		userId: v.string(),
		role: v.string(),
	}),
	returns: v.null(),
	handler: async (_ctx, { userId, role }) => {
		const apiKey = env.WORKOS_API_KEY;
		if (!apiKey || isTestEnv) {
			console.warn(
				"Skipping WorkOS role update (missing API key or test environment)"
			);
			return null;
		}
		const workos = new WorkOS(apiKey);
		try {
			const user = await workos.userManagement.getUser(userId);
			const metadata = {
				...((user.metadata as Record<string, unknown>) ?? {}),
				role,
			};
			await workos.userManagement.updateUser({
				userId,
				metadata,
			});
			return null;
		} catch (error) {
			console.error("Failed to update WorkOS user role", {
				userId,
				error,
			});
			return null;
		}
	},
});

export const updateUserProfile = internalAction({
	args: v.object({
		userId: v.string(),
		firstName: v.optional(v.string()),
		lastName: v.optional(v.string()),
		phone: v.optional(v.string()),
	}),
	returns: v.null(),
	handler: async (_ctx, args) => {
		const workos = new WorkOS(env.WORKOS_API_KEY);
		const update: Record<string, unknown> = {};
		if (args.firstName !== undefined) update.firstName = args.firstName;
		if (args.lastName !== undefined) update.lastName = args.lastName;
		if (args.phone !== undefined) {
			// WorkOS accepts phoneNumbers as an array of objects
			update.phoneNumbers = [{ phoneNumber: args.phone }];
		}
		if (Object.keys(update).length > 0) {
			await workos.userManagement.updateUser({
				userId: args.userId,
				...(update as Record<string, unknown>),
			});
		}
		return null;
	},
});

// Note: WorkOS does not support updating profile pictures via their API.
// Profile pictures come from OAuth providers and cannot be modified programmatically.

export const assignOrganizationRole = internalAction({
	args: v.object({
		userId: v.string(),
		organizationId: v.string(),
		roleSlug: v.string(),
	}),
	returns: v.null(),
	handler: async (_ctx, args) => {
		const apiKey = env.WORKOS_API_KEY;
		if (!apiKey || isTestEnv) {
			console.warn(
				"Skipping WorkOS organization role assignment (missing API key or test environment)"
			);
			return null;
		}
		const workos = new WorkOS(apiKey);
		try {
			// 1. Check if user is already a member of the organization
			const memberships =
				await workos.userManagement.listOrganizationMemberships({
					userId: args.userId,
					organizationId: args.organizationId,
					limit: 10,
				});

			if (!memberships.data || memberships.data.length === 0) {
				// User is not a member - create membership with role
				console.log("Creating new organization membership with role", {
					userId: args.userId,
					organizationId: args.organizationId,
					roleSlug: args.roleSlug,
				});

				const membership =
					await workos.userManagement.createOrganizationMembership({
						userId: args.userId,
						organizationId: args.organizationId,
						roleSlug: args.roleSlug,
					});

				console.log("Successfully created organization membership with role", {
					userId: args.userId,
					organizationId: args.organizationId,
					roleSlug: args.roleSlug,
					membershipId: membership.id,
				});

				return null;
			}

			// User is already a member - update the membership role
			const membership = memberships.data[0];

			console.log("Updating existing organization membership role", {
				userId: args.userId,
				organizationId: args.organizationId,
				roleSlug: args.roleSlug,
				membershipId: membership.id,
			});

			await workos.userManagement.updateOrganizationMembership(membership.id, {
				roleSlug: args.roleSlug,
			});

			console.log("Successfully updated organization membership role", {
				userId: args.userId,
				organizationId: args.organizationId,
				roleSlug: args.roleSlug,
				membershipId: membership.id,
			});

			return null;
		} catch (error) {
			console.error("Failed to assign WorkOS organization role", {
				userId: args.userId,
				organizationId: args.organizationId,
				roleSlug: args.roleSlug,
				error: error instanceof Error ? error.message : String(error),
				errorStack: error instanceof Error ? error.stack : undefined,
			});
			throw error;
		}
	},
});

/**
 * Fetches a single organization from WorkOS by ID and upserts it into Convex.
 * Called from the organization_membership webhook to ensure the org record
 * exists before the membership references it.
 */
export const syncSingleOrganization = internalAction({
	args: v.object({
		organizationId: v.string(),
	}),
	returns: v.object({
		success: v.boolean(),
	}),
	handler: async (ctx, { organizationId }) => {
		if (isTestEnv) return { success: true };
		const workos = new WorkOS(env.WORKOS_API_KEY);

		try {
			const organization =
				await workos.organizations.getOrganization(organizationId);
			const organizationDomains =
				(organization as { domains?: WorkOsDomain[] }).domains ?? [];

			await ctx.runMutation(internal.organizations.createOrUpdateOrganization, {
				id: organization.id,
				name: organization.name,
				external_id: organization.externalId || undefined,
				metadata: organization.metadata,
				created_at: organization.createdAt,
				updated_at: organization.updatedAt,
				domains: organizationDomains.map((domain) => ({
					id: domain.id || `${organization.id}-${domain.domain}`,
					domain: domain.domain,
					organization_id: organization.id,
					object: "organization_domain",
					created_at: domain.createdAt,
					updated_at: domain.updatedAt,
				})),
			});

			return { success: true };
		} catch (error) {
			console.error("Failed to sync organization:", organizationId, error);
			return { success: false };
		}
	},
});

export const syncUserOrganizations = internalAction({
	args: v.object({
		userId: v.string(),
	}),
	returns: v.object({
		success: v.boolean(),
		message: v.string(),
		organizationsSynced: v.number(),
	}),
	handler: async (ctx, { userId }) => {
		const workos = new WorkOS(env.WORKOS_API_KEY);

		try {
			console.log("Syncing organizations from WorkOS for user:", userId);

			// Fetch user's organization memberships from WorkOS
			const memberships =
				await workos.userManagement.listOrganizationMemberships({
					userId,
					limit: 100,
				});

			let organizationsSynced = 0;

			// Process each membership and sync organization data
			for (const membership of memberships.data) {
				// First, sync the organization if it exists
				if (membership.organizationId) {
					try {
						const organization = await workos.organizations.getOrganization(
							membership.organizationId
						);

						// Sync organization to local database
						const organizationDomains =
							(organization as { domains?: WorkOsDomain[] }).domains ?? [];

						await ctx.runMutation(
							internal.organizations.createOrUpdateOrganization,
							{
								id: organization.id,
								name: organization.name,
								external_id: organization.externalId || undefined,
								metadata: organization.metadata,
								created_at: organization.createdAt,
								updated_at: organization.updatedAt,
								domains: organizationDomains.map((domain) => ({
									id: domain.id || `${organization.id}-${domain.domain}`,
									domain: domain.domain,
									organization_id: organization.id,
									object: "organization_domain",
									created_at: domain.createdAt,
									updated_at: domain.updatedAt,
								})),
							}
						);

						organizationsSynced += 1;
					} catch (orgError) {
						console.warn(
							"Failed to sync organization:",
							membership.organizationId,
							orgError
						);
					}
				}

				// Sync the membership
				try {
					await ctx.runMutation(
						internal.organizations.createOrUpdateMembership,
						{
							id: membership.id,
							user_id: membership.userId,
							organization_id: membership.organizationId,
							status: membership.status,
							role: membership.role,
							roles: membership.roles,
							object: membership.object,
							created_at: membership.createdAt,
							updated_at: membership.updatedAt,
						}
					);
				} catch (membershipError) {
					console.warn(
						"Failed to sync membership:",
						membership.id,
						membershipError
					);
				}
			}

			console.log(
				`Successfully synced ${organizationsSynced} organizations for user ${userId}`
			);

			return {
				success: true,
				message: `Successfully synced ${organizationsSynced} organizations`,
				organizationsSynced,
			};
		} catch (error) {
			console.error("Failed to sync organizations from WorkOS:", error);
			return {
				success: false,
				message:
					error instanceof Error ? error.message : "Unknown error occurred",
				organizationsSynced: 0,
			};
		}
	},
});

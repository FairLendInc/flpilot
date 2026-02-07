"use node";

/**
 * WorkOS → Convex Sync Module
 *
 * Daily scheduled sync to ensure Convex DB stays perfectly in sync with WorkOS.
 * WorkOS is treated as the single source of truth.
 *
 * Features:
 * - Full reconciliation: Fetches all entities from WorkOS and compares with Convex
 * - Auto-fix: Adds missing records, updates drifted data, deletes orphaned records
 * - Hard delete: Removes Convex records that don't exist in WorkOS
 * - Comprehensive logging: Detailed metrics for all sync operations
 *
 * Note: Uses "use node" directive to access Node.js APIs required by WorkOS SDK
 * All mutations and queries are in syncHelpers.ts (cannot use "use node")
 */

import { WorkOS } from "@workos-inc/node";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { env } from "./lib/env";

type WorkOSMetadata = Record<string, unknown>;

// ============================================================================
// WorkOS SDK Response Interfaces
// ============================================================================

/** WorkOS User from User Management API */
type WorkOSUser = {
	id: string; // WorkOS user ID (maps to users.idp_id)
	email: string;
	email_verified: boolean;
	first_name?: string;
	last_name?: string;
	profile_picture_url?: string; // OAuth provider image
	profile_picture?: string; // Alternative field name
	created_at: string; // ISO 8601 timestamp
	updated_at: string; // ISO 8601 timestamp
	last_sign_in_at?: string; // ISO 8601 timestamp
	external_id?: string; // Custom external identifier
	metadata?: WorkOSMetadata; // Custom metadata object
};

/** WorkOS Organization from Organizations API */
type WorkOSOrganization = {
	id: string; // WorkOS org ID (maps to organizations.id)
	name: string;
	external_id?: string; // Custom external identifier
	metadata?: WorkOSMetadata; // Custom metadata object
	created_at: string; // ISO 8601 timestamp
	updated_at: string; // ISO 8601 timestamp
	domains?: WorkOSOrganizationDomain[]; // Included in org response
};

/** WorkOS Organization Domain (nested in Organization) */
type WorkOSOrganizationDomain = {
	id: string; // WorkOS domain ID
	domain: string; // e.g., "example.com"
	organization_id: string; // Parent organization ID
	object: "organization_domain"; // Type identifier
	created_at: string; // ISO 8601 timestamp
	updated_at: string; // ISO 8601 timestamp
};

/** WorkOS Organization Membership from User Management API */
type WorkOSOrganizationMembership = {
	id: string; // WorkOS membership ID
	userId: string; // WorkOS user ID (camelCase in SDK!)
	organizationId: string; // WorkOS org ID (camelCase in SDK!)
	status: string; // "active" | "inactive" | "pending"
	role?: {
		// Primary role (legacy single-role)
		slug: string;
	};
	roles?: Array<{
		// Multiple roles support
		slug: string;
	}>;
	object: "organization_membership"; // Type identifier
	createdAt: string; // ISO 8601 timestamp (camelCase in SDK!)
	updatedAt: string; // ISO 8601 timestamp (camelCase in SDK!)
};

// ============================================================================
// Convex Query Response Types (from syncHelpers.ts)
// ============================================================================

/** Convex User from getAllConvexUsers query */
type ConvexUser = {
	_id: string;
	idp_id: string;
	email: string;
	email_verified: boolean;
	first_name?: string;
	last_name?: string;
	profile_picture?: string;
	updated_at?: string;
	last_sign_in_at?: string;
	external_id?: string;
	metadata?: WorkOSMetadata;
};

/** Convex Organization from getAllConvexOrganizations query */
type ConvexOrganization = {
	_id: string;
	id: string;
	name: string;
	external_id?: string;
	updated_at?: string;
	metadata?: WorkOSMetadata;
};

/** Convex Membership from getAllConvexMemberships query */
type ConvexMembership = {
	_id: string;
	id: string;
	user_id: string;
	organization_id: string;
	status?: string;
	role?: { slug: string };
	roles?: Array<{ slug: string }>;
	updated_at?: string;
};

/** Sync result from syncUsers action */
type SyncUsersResult = {
	added: number;
	updated: number;
	deleted: number;
	total_workos: number;
	total_convex_after: number;
	errors: string[];
};

/** Sync result from syncOrganizations action */
type SyncOrganizationsResult = {
	added: number;
	updated: number;
	deleted: number;
	domains_synced: number;
	total_workos: number;
	total_convex_after: number;
	errors: string[];
};

/** Sync result from syncOrganizationMemberships action */
type SyncMembershipsResult = {
	added: number;
	updated: number;
	deleted: number;
	total_workos: number;
	total_convex_after: number;
	errors: string[];
};

// ============================================================================
// Pagination Helper
// ============================================================================

/**
 * Generic pagination helper for WorkOS SDK calls
 * Note: WorkOS SDK returns { data: T[], listMetadata: {...} }
 */
type PaginatedResponse<T> = {
	data: T[];
	listMetadata?: {
		after?: string | null;
	};
};

async function fetchAllPaginated<T>(
	fetchPage: (cursor?: string) => Promise<PaginatedResponse<T>>
): Promise<T[]> {
	const allItems: T[] = [];
	let cursor: string | undefined;

	do {
		const response = await fetchPage(cursor);
		allItems.push(...response.data);
		// WorkOS SDK uses 'listMetadata' not 'list_metadata'
		cursor = response.listMetadata?.after || undefined;

		// Small delay to respect rate limits
		if (cursor) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
	} while (cursor);

	return allItems;
}

// ============================================================================
// Entity Sync Actions
// ============================================================================

/**
 * Sync all users from WorkOS to Convex
 * - Adds missing users (WorkOS → Convex)
 * - Updates drifted user data
 * - Deletes orphaned users (not in WorkOS)
 */
export const syncUsers = internalAction({
	args: v.object({}),
	returns: v.object({
		added: v.number(),
		updated: v.number(),
		deleted: v.number(),
		total_workos: v.number(),
		total_convex_after: v.number(),
		errors: v.array(v.string()),
	}),
	handler: async (ctx) => {
		const workos = new WorkOS(env.WORKOS_API_KEY);
		const errors: string[] = [];
		let added = 0;
		let updated = 0;
		let deleted = 0;

		try {
			// Step 1: Fetch ALL users from WorkOS (with pagination)
			console.log("📥 Fetching all users from WorkOS...");
			const workosUsers = await fetchAllPaginated<WorkOSUser>(
				async (cursor) => {
					const response = await workos.userManagement.listUsers({
						limit: 100,
						after: cursor,
					});
					return response as unknown as PaginatedResponse<WorkOSUser>;
				}
			);
			console.log(`✅ Fetched ${workosUsers.length} users from WorkOS`);

			// Step 2: Fetch all users from Convex
			const convexUsers: ConvexUser[] = await ctx.runQuery(
				internal.syncHelpers.getAllConvexUsers
			);
			console.log(`📊 Found ${convexUsers.length} users in Convex`);

			// Step 3: Build lookup maps
			const workosUserMap = new Map(
				workosUsers.map((u: WorkOSUser) => [u.id, u])
			);
			const convexUserMap = new Map(
				convexUsers.map((u: ConvexUser) => [u.idp_id, u])
			);

			// Step 4: Add/Update users (WorkOS → Convex)
			for (const workosUser of workosUsers) {
				const convexUser: ConvexUser | undefined = convexUserMap.get(
					workosUser.id
				);

				if (convexUser) {
					// User exists in both → CHECK FOR DRIFT
					const needsUpdate =
						convexUser?.email !== workosUser.email ||
						convexUser?.email_verified !== workosUser.email_verified ||
						convexUser?.first_name !== workosUser.first_name ||
						convexUser?.last_name !== workosUser.last_name ||
						convexUser.profile_picture !==
							(workosUser.profile_picture_url || workosUser.profile_picture) ||
						convexUser?.updated_at !== workosUser.updated_at;

					if (needsUpdate) {
						try {
							await ctx.runMutation(internal.syncHelpers.updateUser, {
								idp_id: workosUser.id,
								email: workosUser.email,
								email_verified: workosUser.email_verified,
								first_name: workosUser.first_name,
								last_name: workosUser.last_name,
								profile_picture:
									workosUser.profile_picture_url || workosUser.profile_picture,
								updated_at: workosUser.updated_at,
								last_sign_in_at: workosUser.last_sign_in_at,
								external_id: workosUser.external_id,
								metadata: workosUser.metadata,
							});
							updated += 1;
							console.log(`🔄 Updated user: ${workosUser.email}`);
						} catch (error) {
							errors.push(`Failed to update user ${workosUser.id}: ${error}`);
						}
					}
				} else {
					// User exists in WorkOS but not Convex → ADD
					try {
						await ctx.runMutation(internal.syncHelpers.createUser, {
							idp_id: workosUser.id,
							email: workosUser.email,
							email_verified: workosUser.email_verified,
							first_name: workosUser.first_name,
							last_name: workosUser.last_name,
							profile_picture:
								workosUser.profile_picture_url || workosUser.profile_picture,
							created_at: workosUser.created_at,
							updated_at: workosUser.updated_at,
							last_sign_in_at: workosUser.last_sign_in_at,
							external_id: workosUser.external_id,
							metadata: workosUser.metadata,
						});
						added += 1;
						console.log(`➕ Added user: ${workosUser.email}`);
					} catch (error) {
						errors.push(`Failed to add user ${workosUser.id}: ${error}`);
					}
				}
			}

			// Step 5: Delete orphaned users (Convex only, not in WorkOS) - HARD DELETE
			for (const convexUser of convexUsers) {
				if (!workosUserMap.has(convexUser.idp_id)) {
					try {
						await ctx.runMutation(internal.syncHelpers.deleteUser, {
							idp_id: convexUser.idp_id,
						});
						deleted += 1;
						console.log(`🗑️ Deleted orphaned user: ${convexUser.email}`);
					} catch (error) {
						errors.push(
							`Failed to delete orphaned user ${convexUser.idp_id}: ${error}`
						);
					}
				}
			}

			return {
				added,
				updated,
				deleted,
				total_workos: workosUsers.length,
				total_convex_after: workosUsers.length,
				errors,
			};
		} catch (error) {
			errors.push(`Fatal error in syncUsers: ${error}`);
			return {
				added: 0,
				updated: 0,
				deleted: 0,
				total_workos: 0,
				total_convex_after: 0,
				errors,
			};
		}
	},
});

/**
 * Sync all organizations from WorkOS to Convex
 * Also handles organization domains (nested in org response)
 */
export const syncOrganizations = internalAction({
	args: v.object({}),
	returns: v.object({
		added: v.number(),
		updated: v.number(),
		deleted: v.number(),
		domains_synced: v.number(),
		total_workos: v.number(),
		total_convex_after: v.number(),
		errors: v.array(v.string()),
	}),
	handler: async (ctx) => {
		const workos = new WorkOS(env.WORKOS_API_KEY);
		const errors: string[] = [];
		let added = 0;
		let updated = 0;
		let deleted = 0;
		let domains_synced = 0;

		try {
			// Step 1: Fetch ALL organizations from WorkOS (includes domains)
			console.log("📥 Fetching all organizations from WorkOS...");
			const workosOrgs = await fetchAllPaginated<WorkOSOrganization>(
				async (cursor) => {
					const response = await workos.organizations.listOrganizations({
						limit: 100,
						after: cursor,
					});
					return response as unknown as PaginatedResponse<WorkOSOrganization>;
				}
			);
			console.log(`✅ Fetched ${workosOrgs.length} organizations from WorkOS`);

			// Step 2: Fetch all organizations from Convex
			const convexOrgs: ConvexOrganization[] = await ctx.runQuery(
				internal.syncHelpers.getAllConvexOrganizations
			);
			console.log(`📊 Found ${convexOrgs.length} organizations in Convex`);

			// Step 3: Build lookup maps
			const workosOrgMap = new Map(
				workosOrgs.map((o: WorkOSOrganization) => [o.id, o])
			);
			const convexOrgMap = new Map(
				convexOrgs.map((o: ConvexOrganization) => [o.id, o])
			);

			// Step 4: Add/Update organizations
			for (const workosOrg of workosOrgs) {
				const convexOrg: ConvexOrganization | undefined = convexOrgMap.get(
					workosOrg.id
				);

				const domainData = (workosOrg.domains || []).map((domain) => ({
					id: domain.id,
					domain: domain.domain,
					organization_id: domain.organization_id,
					object: domain.object,
					created_at: domain.created_at,
					updated_at: domain.updated_at,
				}));

				if (convexOrg) {
					// UPDATE if drifted
					const needsUpdate =
						convexOrg?.name !== workosOrg.name ||
						convexOrg?.external_id !== workosOrg.external_id ||
						convexOrg?.updated_at !== workosOrg.updated_at ||
						JSON.stringify(convexOrg?.metadata) !==
							JSON.stringify(workosOrg.metadata);

					if (needsUpdate || domainData.length > 0) {
						try {
							await ctx.runMutation(
								internal.syncHelpers.createOrUpdateOrganization,
								{
									id: workosOrg.id,
									name: workosOrg.name,
									external_id: workosOrg.external_id,
									metadata: workosOrg.metadata,
									created_at: workosOrg.created_at,
									updated_at: workosOrg.updated_at,
									domains: domainData,
								}
							);
							if (needsUpdate) {
								updated += 1;
								console.log(`🔄 Updated organization: ${workosOrg.name}`);
							}
							domains_synced += domainData.length;
						} catch (error) {
							errors.push(`Failed to update org ${workosOrg.id}: ${error}`);
						}
					}
				} else {
					// ADD organization
					try {
						await ctx.runMutation(
							internal.syncHelpers.createOrUpdateOrganization,
							{
								id: workosOrg.id,
								name: workosOrg.name,
								external_id: workosOrg.external_id,
								metadata: workosOrg.metadata,
								created_at: workosOrg.created_at,
								updated_at: workosOrg.updated_at,
								domains: domainData,
							}
						);
						added += 1;
						domains_synced += domainData.length;
						console.log(
							`➕ Added organization: ${workosOrg.name} (${domainData.length} domains)`
						);
					} catch (error) {
						errors.push(`Failed to add org ${workosOrg.id}: ${error}`);
					}
				}
			}

			// Step 5: Delete orphaned organizations - HARD DELETE
			for (const convexOrg of convexOrgs) {
				if (!workosOrgMap.has(convexOrg.id)) {
					try {
						await ctx.runMutation(internal.syncHelpers.deleteOrganization, {
							id: convexOrg.id,
						});
						deleted += 1;
						console.log(`🗑️ Deleted orphaned organization: ${convexOrg.name}`);
					} catch (error) {
						errors.push(
							`Failed to delete orphaned org ${convexOrg.id}: ${error}`
						);
					}
				}
			}

			return {
				added,
				updated,
				deleted,
				domains_synced,
				total_workos: workosOrgs.length,
				total_convex_after: workosOrgs.length,
				errors,
			};
		} catch (error) {
			errors.push(`Fatal error in syncOrganizations: ${error}`);
			return {
				added: 0,
				updated: 0,
				deleted: 0,
				domains_synced: 0,
				total_workos: 0,
				total_convex_after: 0,
				errors,
			};
		}
	},
});

/**
 * Sync all organization memberships from WorkOS to Convex
 * NOTE: SDK uses camelCase (userId, organizationId, createdAt)
 */
export const syncOrganizationMemberships = internalAction({
	args: v.object({}),
	returns: v.object({
		added: v.number(),
		updated: v.number(),
		deleted: v.number(),
		total_workos: v.number(),
		total_convex_after: v.number(),
		errors: v.array(v.string()),
	}),
	handler: async (ctx) => {
		const workos = new WorkOS(env.WORKOS_API_KEY);
		const errors: string[] = [];
		let added = 0;
		let updated = 0;
		let deleted = 0;

		try {
			// Step 1: Fetch ALL memberships from WorkOS (no filter)
			console.log("📥 Fetching all memberships from WorkOS...");
			const workosMemberships =
				await fetchAllPaginated<WorkOSOrganizationMembership>((cursor) =>
					workos.userManagement.listOrganizationMemberships({
						limit: 100,
						after: cursor,
					})
				);
			console.log(
				`✅ Fetched ${workosMemberships.length} memberships from WorkOS`
			);

			// Step 2: Fetch all memberships from Convex
			const convexMemberships: ConvexMembership[] = await ctx.runQuery(
				internal.syncHelpers.getAllConvexMemberships
			);
			console.log(`📊 Found ${convexMemberships.length} memberships in Convex`);

			// Step 3: Build lookup maps
			const workosMembershipMap = new Map(
				workosMemberships.map((m: WorkOSOrganizationMembership) => [m.id, m])
			);
			const convexMembershipMap = new Map(
				convexMemberships.map((m: ConvexMembership) => [m.id, m])
			);

			// Step 4: Add/Update memberships
			for (const workosMembership of workosMemberships) {
				const convexMembership: ConvexMembership | undefined =
					convexMembershipMap.get(workosMembership.id);

				// Normalize SDK camelCase to snake_case for Convex
				const normalized = {
					id: workosMembership.id,
					user_id: workosMembership.userId,
					organization_id: workosMembership.organizationId,
					status: workosMembership.status,
					role: workosMembership.role,
					roles: workosMembership.roles,
					object: workosMembership.object,
					created_at: workosMembership.createdAt,
					updated_at: workosMembership.updatedAt,
				};

				if (convexMembership) {
					// UPDATE if drifted
					const needsUpdate =
						convexMembership?.status !== normalized.status ||
						convexMembership?.updated_at !== normalized.updated_at ||
						JSON.stringify(convexMembership?.roles) !==
							JSON.stringify(normalized.roles);

					if (needsUpdate) {
						try {
							await ctx.runMutation(
								internal.syncHelpers.createOrUpdateMembership,
								normalized
							);
							updated += 1;
							console.log(
								`🔄 Updated membership: ${normalized.user_id} → ${normalized.organization_id}`
							);
						} catch (error) {
							errors.push(
								`Failed to update membership ${workosMembership.id}: ${error}`
							);
						}
					}
				} else {
					// ADD membership
					try {
						await ctx.runMutation(
							internal.syncHelpers.createOrUpdateMembership,
							normalized
						);
						added += 1;
						console.log(
							`➕ Added membership: ${normalized.user_id} → ${normalized.organization_id}`
						);
					} catch (error) {
						errors.push(
							`Failed to add membership ${workosMembership.id}: ${error}`
						);
					}
				}
			}

			// Step 5: Delete orphaned memberships - HARD DELETE
			for (const convexMembership of convexMemberships) {
				if (!workosMembershipMap.has(convexMembership.id)) {
					try {
						await ctx.runMutation(internal.syncHelpers.deleteMembership, {
							id: convexMembership.id,
						});
						deleted += 1;
						console.log(
							`🗑️ Deleted orphaned membership: ${convexMembership.user_id} → ${convexMembership.organization_id}`
						);
					} catch (error) {
						errors.push(
							`Failed to delete orphaned membership ${convexMembership.id}: ${error}`
						);
					}
				}
			}

			return {
				added,
				updated,
				deleted,
				total_workos: workosMemberships.length,
				total_convex_after: workosMemberships.length,
				errors,
			};
		} catch (error) {
			errors.push(`Fatal error in syncOrganizationMemberships: ${error}`);
			return {
				added: 0,
				updated: 0,
				deleted: 0,
				total_workos: 0,
				total_convex_after: 0,
				errors,
			};
		}
	},
});

// ============================================================================
// Main Orchestrator
// ============================================================================

/**
 * Master sync orchestrator - runs all entity syncs sequentially
 * Designed to be called by daily cron job
 */
export const performDailySync = internalAction({
	args: v.object({}),
	returns: v.object({
		success: v.boolean(),
		duration_ms: v.number(),
		summary: v.object({
			users: v.object({
				added: v.number(),
				updated: v.number(),
				deleted: v.number(),
				total: v.number(),
				errors: v.number(),
			}),
			organizations: v.object({
				added: v.number(),
				updated: v.number(),
				deleted: v.number(),
				domains_synced: v.number(),
				total: v.number(),
				errors: v.number(),
			}),
			memberships: v.object({
				added: v.number(),
				updated: v.number(),
				deleted: v.number(),
				total: v.number(),
				errors: v.number(),
			}),
		}),
		overall_errors: v.array(v.string()),
	}),
	handler: async (ctx) => {
		const startTime = Date.now();

		console.log(
			"🔄 ============================================================"
		);
		console.log("🔄 Starting daily WorkOS → Convex sync...");
		console.log(
			"🔄 ============================================================"
		);

		// Sync Users
		console.log("\n👤 ========== Syncing Users ==========");
		const usersResult: SyncUsersResult = await ctx.runAction(
			internal.sync.syncUsers,
			{}
		);
		console.log("✅ User sync complete:", {
			added: usersResult.added,
			updated: usersResult.updated,
			deleted: usersResult.deleted,
			total: usersResult.total_workos,
			errors: usersResult.errors.length,
		});

		// Sync Organizations (includes domains)
		console.log("\n🏢 ========== Syncing Organizations ==========");
		const orgsResult: SyncOrganizationsResult = await ctx.runAction(
			internal.sync.syncOrganizations,
			{}
		);
		console.log("✅ Organization sync complete:", {
			added: orgsResult.added,
			updated: orgsResult.updated,
			deleted: orgsResult.deleted,
			domains: orgsResult.domains_synced,
			total: orgsResult.total_workos,
			errors: orgsResult.errors.length,
		});

		// Sync Organization Memberships
		console.log("\n🔗 ========== Syncing Memberships ==========");
		const membershipsResult: SyncMembershipsResult = await ctx.runAction(
			internal.sync.syncOrganizationMemberships,
			{}
		);
		console.log("✅ Membership sync complete:", {
			added: membershipsResult.added,
			updated: membershipsResult.updated,
			deleted: membershipsResult.deleted,
			total: membershipsResult.total_workos,
			errors: membershipsResult.errors.length,
		});

		const duration = Date.now() - startTime;
		const success =
			usersResult.errors.length === 0 &&
			orgsResult.errors.length === 0 &&
			membershipsResult.errors.length === 0;

		const summary = {
			users: {
				added: usersResult.added,
				updated: usersResult.updated,
				deleted: usersResult.deleted,
				total: usersResult.total_workos,
				errors: usersResult.errors.length,
			},
			organizations: {
				added: orgsResult.added,
				updated: orgsResult.updated,
				deleted: orgsResult.deleted,
				domains_synced: orgsResult.domains_synced,
				total: orgsResult.total_workos,
				errors: orgsResult.errors.length,
			},
			memberships: {
				added: membershipsResult.added,
				updated: membershipsResult.updated,
				deleted: membershipsResult.deleted,
				total: membershipsResult.total_workos,
				errors: membershipsResult.errors.length,
			},
		};

		console.log(`\n${"=".repeat(60)}`);
		console.log(
			success
				? "✅ Daily sync completed successfully!"
				: "⚠️ Daily sync completed with errors"
		);
		console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
		console.log("📊 Summary:", JSON.stringify(summary, null, 2));

		if (!success) {
			console.log("\n❌ Errors encountered:");
			const aggregatedErrors = [
				...usersResult.errors,
				...orgsResult.errors,
				...membershipsResult.errors,
			];
			for (const error of aggregatedErrors) {
				console.log(`  - ${error}`);
			}
		}

		console.log(`${"=".repeat(60)}\n`);

		return {
			success,
			duration_ms: duration,
			summary,
			overall_errors: [
				...usersResult.errors,
				...orgsResult.errors,
				...membershipsResult.errors,
			],
		};
	},
});

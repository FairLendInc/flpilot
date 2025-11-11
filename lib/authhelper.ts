import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import {
	extractOrgId,
	extractPermissions,
	extractRole,
	type WorkOSIdentity,
} from "../types/workos";
// ============================================================================
// RBAC Helper Functions
// ============================================================================

export type RbacOptions = {
	required_roles?: string[];
	required_permissions?: string[];
	required_orgs?: string[];
	user_identity: WorkOSIdentity | null | undefined;
};

/**
 * Check if user has required RBAC access (non-throwing version)
 * @param options - RBAC options with required roles, permissions, orgs and user identity
 * @returns true if authorized, false otherwise
 */
export function hasRbacAccess(options: RbacOptions): boolean {
	const { required_roles, required_permissions, required_orgs, user_identity } =
		options;

	if (!user_identity) {
		return false;
	}

	// Extract role from identity (with fallback)
	const userRole = extractRole(user_identity);

	// Admins bypass all checks
	if (userRole === "admin") {
		return true;
	}

	// Extract permissions from identity (with fallback)
	const userPermissions = extractPermissions(user_identity);

	// Extract org_id from identity (with fallback)
	const userOrgId = extractOrgId(user_identity);

	// Check required roles
	if (
		required_roles &&
		required_roles.length > 0 &&
		!(userRole && required_roles.includes(userRole))
	) {
		return false;
	}

	// Check required permissions (user must have ALL required permissions)
	if (required_permissions && required_permissions.length > 0) {
		const hasAllPermissions = required_permissions.every((perm) =>
			userPermissions.includes(perm)
		);
		if (!hasAllPermissions) {
			return false;
		}
	}

	// Check required organizations
	if (
		required_orgs &&
		required_orgs.length > 0 &&
		!(userOrgId && required_orgs.includes(userOrgId))
	) {
		return false;
	}

	return true;
}

/**
 * Check if user has required RBAC access (throwing version)
 * @param options - RBAC options with required roles, permissions, orgs and user identity
 * @throws Error if unauthorized with descriptive message
 */
export function checkRbac(options: RbacOptions): void {
	const { required_roles, required_permissions, required_orgs, user_identity } =
		options;

	if (!user_identity) {
		throw new Error("Unauthorized: No user identity provided");
	}

	// Extract role from identity (with fallback)
	const userRole = extractRole(user_identity);

	// Admins bypass all checks
	if (userRole === "admin") {
		return;
	}

	// Extract permissions from identity (with fallback)
	const userPermissions = extractPermissions(user_identity);

	// Extract org_id from identity (with fallback)
	const userOrgId = extractOrgId(user_identity);

	// Check required roles
	if (
		required_roles &&
		required_roles.length > 0 &&
		!(userRole && required_roles.includes(userRole))
	) {
		throw new Error(
			`Unauthorized: Missing required roles. Required: [${required_roles.join(", ")}], User has: ${userRole || "none"}`
		);
	}

	// Check required permissions (user must have ALL required permissions)
	if (required_permissions && required_permissions.length > 0) {
		const missingPermissions = required_permissions.filter(
			(perm) => !userPermissions.includes(perm)
		);
		if (missingPermissions.length > 0) {
			throw new Error(
				`Unauthorized: Missing required permissions: [${missingPermissions.join(", ")}]`
			);
		}
	}

	// Check required organizations
	if (
		required_orgs &&
		required_orgs.length > 0 &&
		!(userOrgId && required_orgs.includes(userOrgId))
	) {
		throw new Error(
			`Unauthorized: Missing required organization. Required: [${required_orgs.join(", ")}], User in: ${userOrgId || "none"}`
		);
	}
}

/**
 * Retry options for authentication
 */
/**
 * Require authentication with retry logic (any authenticated user allowed)
 * Handles transient authentication failures due to race conditions
 * @param ctx - Convex query/mutation context
 * @param caller - Name of the calling function (for error messages)
 * @param options - Retry configuration options
 * @throws Error if not authenticated after all retries
 * @returns UserIdentity if authenticated
 */
export async function requireAuth(
	ctx: MutationCtx | QueryCtx,
	caller: string | undefined
) {
	let identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		console.log(
			`Authentication required from ${caller ?? "unknown caller"}. Waiting for identity...`
		);
		// TODO: implement proper retry logic. We can't use timeout here or spinlock style sync to check if it can get the identity.
		identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error(
				`Authentication required from ${caller ?? "unknown caller"}`
			);
		}
	}
	return identity;
}
	}
	return identity;
}

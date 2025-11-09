const clientId = process.env.WORKOS_CLIENT_ID;
import type { UserIdentity } from "convex/server";
import type { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";

const authConfig = {
	providers: [
		{
			type: "customJwt",
			issuer: "https://api.workos.com/",
			algorithm: "RS256",
			jwks: `https://api.workos.com/sso/jwks/${clientId}`,
			applicationID: clientId,
		},
		{
			type: "customJwt",
			issuer: `https://api.workos.com/user_management/${clientId}`,
			algorithm: "RS256",
			jwks: `https://api.workos.com/sso/jwks/${clientId}`,
		},
	],
};

export default authConfig;

// ============================================================================
// RBAC Helper Functions
// ============================================================================



export interface RbacOptions {
	required_roles?: string[];
	required_permissions?: string[];
	required_orgs?: string[];
	//Todo: type this based on WorkOSIdentity type
	user_identity: any; // UserIdentity from ctx.auth.getUserIdentity()
}

export type WorkOSIdentity = UserIdentity & {
	permissions?: string[];
	org_id?: string;
	role?: string;
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
	const userRole = user_identity.role || user_identity.workosRole;

	// Admins bypass all checks
	if (userRole === "admin") {
		return true;
	}

	// Extract permissions from identity (with fallback)
	const userPermissions =
		user_identity.permissions || user_identity.workosPermissions || [];

	// Extract org_id from identity (with fallback)
	const userOrgId = user_identity.org_id || user_identity.organizationId;

	// Check required roles
	if (required_roles && required_roles.length > 0) {
		if (!userRole || !required_roles.includes(userRole)) {
			return false;
		}
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
	if (required_orgs && required_orgs.length > 0) {
		if (!userOrgId || !required_orgs.includes(userOrgId)) {
			return false;
		}
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
	const userRole = user_identity.role || user_identity.workosRole;

	// Admins bypass all checks
	if (userRole === "admin") {
		return;
	}

	// Extract permissions from identity (with fallback)
	const userPermissions =
		user_identity.permissions || user_identity.workosPermissions || [];

	// Extract org_id from identity (with fallback)
	const userOrgId = user_identity.org_id || user_identity.organizationId;

	// Check required roles
	if (required_roles && required_roles.length > 0) {
		if (!userRole || !required_roles.includes(userRole)) {
			throw new Error(
				`Unauthorized: Missing required roles. Required: [${required_roles.join(", ")}], User has: ${userRole || "none"}`
			);
		}
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
	if (required_orgs && required_orgs.length > 0) {
		if (!userOrgId || !required_orgs.includes(userOrgId)) {
			throw new Error(
				`Unauthorized: Missing required organization. Required: [${required_orgs.join(", ")}], User in: ${userOrgId || "none"}`
			);
		}
	}
}

/**
 * Require authentication (any authenticated user allowed)
 * @param ctx - Convex query/mutation context
 * @throws Error if not authenticated
 * @returns UserIdentity if authenticated
 */
export async function requireAuth(ctx: any, caller: string|undefined) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error(`Authentication required from ${caller}`);
	}
	return identity;
}

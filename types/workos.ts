/**
 * WorkOS Type Definitions
 *
 * Type definitions for WorkOS AuthKit user objects and session data.
 * These types help ensure type safety when working with WorkOS identity data.
 */

/**
 * WorkOS User object from useAuth() hook
 * This is the client-side user object returned by WorkOS AuthKit
 */
export type WorkOSUser = {
	id: string;
	email: string;
	firstName?: string;
	lastName?: string;
	emailVerified?: boolean;
	profilePictureUrl?: string;
	createdAt?: string;
	updatedAt?: string;

	// RBAC fields
	role?: string;
	permissions?: string[];

	// Organization fields
	organizationId?: string;

	// Impersonation
	impersonator?: {
		email: string;
		reason?: string;
	};
};

/**
 * WorkOS Identity from ctx.auth.getUserIdentity()
 * This is the server-side identity object in Convex functions
 */
export type WorkOSIdentity = {
	subject: string; // User ID
	email?: string;
	email_verified?: boolean;
	first_name?: string;
	last_name?: string;
	profile_picture?: string;
	profile_picture_url?: string;

	// RBAC fields - with fallback naming
	role?: string;
	workosRole?: string;
	permissions?: string[];
	workosPermissions?: string[];

	// Organization fields
	org_id?: string;
	organizationId?: string;

	// Token metadata
	iss?: string; // Issuer
	aud?: string; // Audience
	exp?: number; // Expiration
	iat?: number; // Issued at
};

/**
 * WorkOS Session from withAuth()
 * This is the full session object returned by server-side withAuth()
 */
export type WorkOSSession = {
	user: WorkOSUser;
	accessToken: string;
	refreshToken?: string;
	organizationId?: string;
	role?: string;
	permissions?: string[];
	impersonator?: {
		email: string;
		reason?: string;
	};
};

/**
 * Elevated roles that should skip onboarding
 */
export const ELEVATED_ROLES = [
	"admin",
	"broker",
	"investor",
	"lawyer",
] as const;

export type ElevatedRole = (typeof ELEVATED_ROLES)[number];

/**
 * Type guard to check if a role is elevated
 */
export function isElevatedRole(role?: string): role is ElevatedRole {
	return role ? ELEVATED_ROLES.includes(role as ElevatedRole) : false;
}

/**
 * Helper to extract role from WorkOS user or identity
 */
export function extractRole(
	userOrIdentity: WorkOSUser | WorkOSIdentity | null | undefined
): string | undefined {
	if (!userOrIdentity) return;
	const obj = userOrIdentity as WorkOSUser & WorkOSIdentity;
	return obj.role || obj.workosRole;
}

/**
 * Helper to extract permissions from WorkOS user or identity
 */
export function extractPermissions(
	userOrIdentity: WorkOSUser | WorkOSIdentity | null | undefined
): string[] {
	if (!userOrIdentity) return [];
	const obj = userOrIdentity as WorkOSUser & WorkOSIdentity;
	return obj.permissions || obj.workosPermissions || [];
}

/**
 * Helper to extract organization ID from WorkOS user or identity
 */
export function extractOrgId(
	userOrIdentity: WorkOSUser | WorkOSIdentity | null | undefined
): string | undefined {
	if (!userOrIdentity) return;
	const obj = userOrIdentity as WorkOSUser & WorkOSIdentity;
	return obj.org_id || obj.organizationId;
}

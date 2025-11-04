import {
	type NavItem,
	ROLE_LABELS,
	ROLE_NAVIGATION,
	type UserRole,
} from "@/lib/navigation/role-navigation";

/**
 * Role priority order (highest to lowest)
 * Used to determine the default/primary role when a user has multiple roles
 */
const ROLE_PRIORITY: UserRole[] = ["admin", "broker", "lawyer", "investor"];

/**
 * Get the primary (highest priority) role from a list of roles
 * @param roles Array of role slugs
 * @returns The highest priority role, defaulting to 'admin'
 */
export function getPrimaryRole(roles: string[]): UserRole {
	if (!roles || roles.length === 0) {
		return "admin"; // Default to admin
	}

	// Find the highest priority role from the user's roles
	for (const priorityRole of ROLE_PRIORITY) {
		if (roles.includes(priorityRole)) {
			return priorityRole;
		}
	}

	// If no matching role found, default to admin
	return "admin";
}

/**
 * Get navigation items for a specific role
 * @param role The user role
 * @returns Array of navigation items for that role
 */
export function getRoleNavigation(role: UserRole): NavItem[] {
	return ROLE_NAVIGATION[role] || ROLE_NAVIGATION.admin;
}

/**
 * Get the display label for a role
 * @param role The user role
 * @returns Human-readable role label
 */
export function getRoleLabel(role: UserRole): string {
	return ROLE_LABELS[role] || "User";
}

/**
 * Get the default dashboard URL for a role
 * @param role The user role
 * @returns Dashboard URL for that role
 */
export function getRoleDashboardUrl(role: UserRole): string {
	const navigation = getRoleNavigation(role);
	// Return the first navigation item's URL (should be dashboard)
	return navigation[0]?.url || "/dashboard";
}

/**
 * Check if a role is valid
 * @param role String to check
 * @returns True if the role is a valid UserRole
 */
export function isValidRole(role: string): role is UserRole {
	return ["admin", "broker", "lawyer", "investor"].includes(role);
}

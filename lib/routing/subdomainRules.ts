/**
 * Subdomain Redirect Rules Engine
 *
 * A declarative, priority-based rules engine for handling subdomain redirects.
 * Rules are evaluated in priority order (lower number = higher priority).
 * First matching rule determines the redirect destination.
 */

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type SubdomainRedirectContext = {
	subdomain: string | null;
	pathname: string;
	isAuthenticated: boolean;
	role: string | null;
	/** The full URL for building redirect destinations */
	requestUrl: URL;
};

export type SubdomainRedirectRule = {
	/** Human-readable name for debugging/logging */
	name: string;
	/** Lower number = higher priority */
	priority: number;
	/** Returns true if this rule should apply */
	condition: (ctx: SubdomainRedirectContext) => boolean;
	/** Returns the redirect URL when condition matches */
	getRedirectUrl: (ctx: SubdomainRedirectContext) => string;
};

// -----------------------------------------------------------------------------
// Built-in Rules
// -----------------------------------------------------------------------------

/**
 * Rule: Unauthenticated users OR authenticated "member" role users go to underconstruction
 * Priority: 100 (lower priority - checked after subdomain-specific rules)
 */
const restrictedAccessRule: SubdomainRedirectRule = {
	name: "restricted-access-underconstruction",
	priority: 100,
	condition: (ctx) => {
		// Skip this rule for "mic" subdomain (landing page allowed without auth)
		if (ctx.subdomain === "mic") {
			return false;
		}

		// Don't redirect if already on /underconstruction
		if (ctx.pathname === "/underconstruction") {
			return false;
		}

		// Don't redirect auth paths, API routes, or public pages
		const excludedPaths = [
			"/sign-in",
			"/sign-up",
			"/callback",
			"/onboarding",
			"/api",
			"/blog",
			"/contact",
			"/about",
		];
		if (excludedPaths.some((p) => ctx.pathname.startsWith(p))) {
			return false;
		}

		// Redirect if NOT authenticated (unauthenticated users)
		if (!ctx.isAuthenticated) {
			return true;
		}

		// Redirect if authenticated but role is "member" (or no role)
		if (!ctx.role || ctx.role === "member") {
			return true;
		}

		// All other roles (admin, broker, lawyer, investor, etc.) have full access
		return false;
	},
	getRedirectUrl: (ctx) => {
		// Must use absolute URL for Next.js middleware
		const url = new URL(ctx.requestUrl);
		url.pathname = "/underconstruction";
		return url.toString();
	},
};

// -----------------------------------------------------------------------------
// Rule Registry
// -----------------------------------------------------------------------------

/**
 * Default rules applied to all requests.
 * Add new rules here to extend the engine.
 */
const DEFAULT_RULES: SubdomainRedirectRule[] = [restrictedAccessRule];

// -----------------------------------------------------------------------------
// Rule Evaluation
// -----------------------------------------------------------------------------

/**
 * Evaluates all rules against the given context.
 * Returns the redirect URL from the first matching rule, or null if no rules match.
 */
export function evaluateSubdomainRules(
	ctx: SubdomainRedirectContext,
	rules: SubdomainRedirectRule[] = DEFAULT_RULES
): string | null {
	// Sort rules by priority (ascending - lower number = higher priority)
	const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

	for (const rule of sortedRules) {
		if (rule.condition(ctx)) {
			return rule.getRedirectUrl(ctx);
		}
	}

	return null;
}

/**
 * Helper to build the redirect context from request data.
 */
export function buildRedirectContext(params: {
	subdomain: string | null;
	pathname: string;
	isAuthenticated: boolean;
	role: string | null;
	requestUrl: URL;
}): SubdomainRedirectContext {
	return {
		subdomain: params.subdomain,
		pathname: params.pathname,
		isAuthenticated: params.isAuthenticated,
		role: params.role,
		requestUrl: params.requestUrl,
	};
}

// -----------------------------------------------------------------------------
// Rule Factory Helpers (for custom rules)
// -----------------------------------------------------------------------------

/**
 * Creates a rule that redirects a specific subdomain to a destination path.
 * Note: destination should be a pathname like "/landing" - it will be converted to absolute URL.
 */
export function createSubdomainRedirectRule(
	subdomain: string,
	destinationPath: string,
	options?: { priority?: number; name?: string }
): SubdomainRedirectRule {
	return {
		name: options?.name ?? `${subdomain}-redirect`,
		priority: options?.priority ?? 50,
		condition: (ctx) => ctx.subdomain === subdomain,
		getRedirectUrl: (ctx) => {
			const url = new URL(ctx.requestUrl);
			url.pathname = destinationPath;
			return url.toString();
		},
	};
}

/**
 * Creates a rule that redirects based on user role.
 * Note: destination should be a pathname like "/access-denied" - it will be converted to absolute URL.
 */
export function createRoleRedirectRule(
	roleCondition: (role: string | null) => boolean,
	destinationPath: string,
	options?: {
		priority?: number;
		name?: string;
		requireSubdomain?: boolean;
		excludeSubdomain?: boolean;
	}
): SubdomainRedirectRule {
	return {
		name: options?.name ?? "role-redirect",
		priority: options?.priority ?? 100,
		condition: (ctx) => {
			// Check subdomain requirements
			if (options?.requireSubdomain && !ctx.subdomain) {
				return false;
			}
			if (options?.excludeSubdomain && ctx.subdomain) {
				return false;
			}

			// Must be authenticated
			if (!ctx.isAuthenticated) {
				return false;
			}

			// Check role condition
			return roleCondition(ctx.role);
		},
		getRedirectUrl: (ctx) => {
			const url = new URL(ctx.requestUrl);
			url.pathname = destinationPath;
			return url.toString();
		},
	};
}

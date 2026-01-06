/**
 * Result of parsing a hostname for subdomain information.
 */
export type SubdomainInfo = {
	subdomain: string | null;
	rootDomain: string;
};

/**
 * Parses the subdomain from a hostname by dynamically inferring the root domain.
 * Handles localhost for development (e.g. tenant.localhost:3000 -> tenant)
 * and production domains (e.g. tenant.fairlend.ca -> tenant, root: fairlend.ca).
 *
 * This approach avoids hardcoding the root domain by inferring it from the hostname structure.
 */
export const getSubdomain = (host: string | null): SubdomainInfo => {
	if (!host) return { subdomain: null, rootDomain: "" };

	// Remove port if present
	const hostname = host.split(":")[0];

	// Remove www. if present
	const cleanHost = hostname?.replace("www.", "") ?? "";

	// Handle localhost case
	if (cleanHost.includes("localhost")) {
		const parts = cleanHost.split(".");
		if (parts.length > 1 && parts[0] !== "localhost") {
			return { subdomain: parts[0], rootDomain: "localhost" };
		}
		return { subdomain: null, rootDomain: "localhost" };
	}

	// Infer root domain from the last 2 parts of the hostname (domain.tld)
	const parts = cleanHost.split(".");
	if (parts.length >= 2) {
		const rootDomain = parts.slice(-2).join("."); // e.g., "fairlend.ca"
		const subdomain = parts.length > 2 ? parts.slice(0, -2).join(".") : null;
		return { subdomain, rootDomain };
	}

	// Single-part hostname (rare, e.g., "localhost" without subdomain already handled)
	return { subdomain: null, rootDomain: cleanHost };
};

/**
 * @deprecated Use getSubdomain(host) without rootDomain parameter.
 * Legacy function signature for backwards compatibility during migration.
 */
export const getSubdomainLegacy = (
	host: string | null,
	rootDomain: string
): string | null => {
	if (!host) return null;

	// Remove port if present
	const hostname = host.split(":")[0];

	// Remove www. if present
	const cleanHost = hostname?.replace("www.", "") ?? "";

	// Check if it's a subdomain of the root domain
	if (cleanHost.endsWith(`.${rootDomain}`)) {
		return cleanHost.replace(`.${rootDomain}`, "");
	}

	// Handle localhost case
	if (cleanHost.includes("localhost")) {
		const parts = cleanHost.split(".");
		if (parts.length > 1 && parts[0] !== "localhost") {
			return parts[0];
		}
	}

	// If it's a custom domain (doesn't end with rootDomain and isn't localhost)
	// we might return the whole host, or null if we only want subdomains.
	// For Vercel Platforms, typically custom domains are treated as the "subdomain" param.
	if (cleanHost !== rootDomain && !cleanHost.includes("localhost")) {
		return cleanHost;
	}

	return null;
};

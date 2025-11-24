/**
 * Parses the subdomain from a hostname.
 * Handles localhost for development (e.g. tenant.localhost:3000 -> tenant)
 * and production domains (e.g. tenant.fairlend.com -> tenant).
 */
export const getSubdomain = (host: string | null, rootDomain: string) => {
	if (!host) return null;

	// Remove port if present
	const hostname = host.split(":")[0];

	// Remove www. if present
	const cleanHost = hostname.replace("www.", "");

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

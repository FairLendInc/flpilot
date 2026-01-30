import {
	Building2,
	Database,
	Globe,
	Home,
	type LucideIcon,
	User,
	Wallet,
} from "lucide-react";

// Top-level regex patterns for performance
const SHARE_SUFFIX_REGEX = /(\/SHARE|\/\d+)?$/;
const ASSET_HASH_REGEX = /^M([A-Z0-9]+)(\/\d+)?$/;

/**
 * Extract namespace from a Formance account address
 *
 * @example
 * getNamespace("fairlend:inventory") // "fairlend"
 * getNamespace("investor:abc123:inventory") // "investor"
 * getNamespace("@world") // "system"
 */
export function getNamespace(address: string): string {
	if (address.startsWith("@")) {
		return "system";
	}

	const colonIndex = address.indexOf(":");
	return colonIndex > 0 ? address.slice(0, colonIndex) : "other";
}

/**
 * Format a balance amount for display
 *
 * @example
 * formatBalance(10000, "CAD") // "$100.00 CAD"
 * formatBalance(50, "M5B8F2A1C") // "50 shares"
 */
export function formatBalance(
	amount: bigint | number | string,
	asset: string
): string {
	const numericAmount =
		typeof amount === "bigint" ? Number(amount) : Number(amount);

	// Share tokens (both old /SHARE and new /100 format)
	if (
		asset.startsWith("M") &&
		(asset.endsWith("/SHARE") || SHARE_SUFFIX_REGEX.test(asset))
	) {
		return `${numericAmount} share${numericAmount !== 1 ? "s" : ""}`;
	}

	// Currency (CAD, USD, etc.) - amounts are in cents
	if (["CAD", "USD", "EUR", "GBP"].includes(asset)) {
		return new Intl.NumberFormat("en-CA", {
			style: "currency",
			currency: asset,
		}).format(numericAmount / 100);
	}

	// Generic numeric format
	return `${numericAmount.toLocaleString()} ${asset}`;
}

/**
 * Generate the share asset name for a mortgage
 *
 * Formance requires asset names to match pattern: [A-Z][A-Z0-9]{0,16}(\/\d{1,6})?
 * We use a deterministic hash of the mortgage ID to create a short, uppercase identifier.
 *
 * @example mortgageId "pn7f5gkwsk831e7f32arv9zwj97tw4j7" -> "M5B8F2A1C"
 */
export function getMortgageShareAsset(mortgageId: string): string {
	// Create a simple hash from the mortgage ID (deterministic)
	let hash = 0;
	for (let i = 0; i < mortgageId.length; i += 1) {
		const char = mortgageId.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash &= hash; // Convert to 32-bit integer
	}

	// Convert hash to uppercase hex (8 chars max)
	const hexHash = Math.abs(hash).toString(16).toUpperCase().slice(0, 8);

	// Format: M + 8-char hash
	return `M${hexHash}`;
}

/**
 * Get icon for account namespace
 */
export function getAccountIcon(namespace: string): LucideIcon {
	const icons: Record<string, LucideIcon> = {
		fairlend: Building2,
		investor: User,
		mortgage: Home,
		mic: Wallet,
		system: Globe,
		world: Globe,
	};

	return icons[namespace] || Database;
}

/**
 * Get color class for account namespace
 */
export function getAccountColor(namespace: string): string {
	const colors: Record<string, string> = {
		fairlend: "text-blue-500 bg-blue-500/10",
		investor: "text-green-500 bg-green-500/10",
		mortgage: "text-purple-500 bg-purple-500/10",
		mic: "text-amber-500 bg-amber-500/10",
		system: "text-gray-500 bg-gray-500/10",
		world: "text-gray-500 bg-gray-500/10",
	};

	return colors[namespace] || "text-muted-foreground bg-muted";
}

/**
 * Parse owner ID from account address
 *
 * @example
 * parseOwnerId("investor:abc123:inventory") // "abc123"
 * parseOwnerId("fairlend:inventory") // "fairlend"
 */
export function parseOwnerId(address: string): string {
	if (address.startsWith("fairlend:")) {
		return "fairlend";
	}

	if (address.startsWith("investor:")) {
		// investor:{userId}:inventory
		const parts = address.split(":");
		return parts[1] || address;
	}

	return address;
}

/**
 * Extract mortgage ID from share asset name
 * Note: With the hashed asset format, we cannot reverse the hash to get
 * the original mortgage ID. This function returns the hash identifier only.
 *
 * @example
 * parseMortgageIdFromAsset("M5B8F2A1C") // "5B8F2A1C"
 * parseMortgageIdFromAsset("Mabc123/SHARE") // "abc123" (legacy format)
 */
export function parseMortgageIdFromAsset(asset: string): string | null {
	// New format: M{hash}
	const newFormatMatch = asset.match(ASSET_HASH_REGEX);
	if (newFormatMatch) {
		return newFormatMatch[1];
	}

	// Legacy format: M{id}/SHARE
	if (asset.startsWith("M") && asset.endsWith("/SHARE")) {
		return asset.slice(1, -"/SHARE".length);
	}
	return null;
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, maxLength = 24): string {
	if (address.length <= maxLength) return address;

	const start = address.slice(0, Math.floor(maxLength / 2) - 1);
	const end = address.slice(-(Math.floor(maxLength / 2) - 2));
	return `${start}...${end}`;
}

/**
 * Group accounts by namespace
 */
export function groupAccountsByNamespace<T extends { address: string }>(
	accounts: T[]
): Record<string, T[]> {
	const groups: Record<string, T[]> = {};

	for (const account of accounts) {
		const namespace = getNamespace(account.address);
		if (!groups[namespace]) {
			groups[namespace] = [];
		}
		groups[namespace].push(account);
	}

	return groups;
}

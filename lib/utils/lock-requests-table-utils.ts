import type {
	LockRequestSortColumn,
	SortDirection,
} from "@/hooks/use-lock-requests-filters";

// Minimal type constraints for the fields actually accessed by utility functions
type SortableLockRequest = {
	request: {
		requestedAt: number;
	};
	investor?: {
		first_name?: string | null;
		last_name?: string | null;
		email?: string | null;
	} | null;
	mortgage?: {
		address: {
			street: string;
			city: string;
			state: string;
		};
	} | null;
	listing?: {
		locked?: boolean | null;
	} | null;
};

type SearchableLockRequest = {
	investor?: {
		first_name?: string | null;
		last_name?: string | null;
		email?: string | null;
	} | null;
	mortgage?: {
		address: {
			street: string;
			city: string;
			state: string;
			zip: string;
		};
	} | null;
};

type FilterableLockRequest = {
	listing?: {
		locked?: boolean | null;
	} | null;
};

// Regex for splitting names on whitespace (moved to top level for performance)
const WHITESPACE_REGEX = /\s+/;

/**
 * Sort lock requests by the specified column and direction
 */
export function sortLockRequests<T extends SortableLockRequest>(
	requests: T[],
	column: LockRequestSortColumn,
	direction: SortDirection
): T[] {
	const sorted = [...requests];

	sorted.sort((a, b) => {
		let comparison = 0;

		switch (column) {
			case "date": {
				comparison = a.request.requestedAt - b.request.requestedAt;
				break;
			}
			case "investor": {
				const aName =
					[a.investor?.first_name, a.investor?.last_name]
						.filter(Boolean)
						.join(" ")
						.toLowerCase() ||
					a.investor?.email?.toLowerCase() ||
					"";
				const bName =
					[b.investor?.first_name, b.investor?.last_name]
						.filter(Boolean)
						.join(" ")
						.toLowerCase() ||
					b.investor?.email?.toLowerCase() ||
					"";
				comparison = aName.localeCompare(bName);
				break;
			}
			case "listing": {
				const aAddress = a.mortgage?.address
					? `${a.mortgage.address.street} ${a.mortgage.address.city} ${a.mortgage.address.state}`.toLowerCase()
					: "";
				const bAddress = b.mortgage?.address
					? `${b.mortgage.address.street} ${b.mortgage.address.city} ${b.mortgage.address.state}`.toLowerCase()
					: "";
				comparison = aAddress.localeCompare(bAddress);
				break;
			}
			case "status": {
				// Sort by lock status: locked first, then unlocked
				if (a.listing?.locked && !b.listing?.locked) {
					comparison = -1;
				} else if (!a.listing?.locked && b.listing?.locked) {
					comparison = 1;
				} else {
					comparison = 0;
				}
				break;
			}
			default: {
				comparison = 0;
				break;
			}
		}

		return direction === "asc" ? comparison : -comparison;
	});

	return sorted;
}

/**
 * Search lock requests across multiple fields
 * Searches: investor name/email, property address
 */
export function searchLockRequests<T extends SearchableLockRequest>(
	requests: T[],
	query: string
): T[] {
	if (!query.trim()) {
		return requests;
	}

	const normalizedQuery = query.trim().toLowerCase();

	return requests.filter((item) => {
		// Search investor name/email
		const investorName =
			[item.investor?.first_name, item.investor?.last_name]
				.filter(Boolean)
				.join(" ")
				.toLowerCase() || "";
		const investorEmail = item.investor?.email?.toLowerCase() || "";
		const investorMatch =
			investorName.includes(normalizedQuery) ||
			investorEmail.includes(normalizedQuery);

		// Search property address
		const addressMatch = item.mortgage?.address
			? [
					item.mortgage.address.street,
					item.mortgage.address.city,
					item.mortgage.address.state,
					item.mortgage.address.zip,
				]
					.filter(Boolean)
					.some((part) => part.toLowerCase().includes(normalizedQuery))
			: false;

		// Return true if ANY field matches (OR logic)
		return investorMatch || addressMatch;
	});
}

/**
 * Filter lock requests by lock status
 */
export function filterByLockStatus<T extends FilterableLockRequest>(
	requests: T[],
	filter: "all" | "locked" | "unlocked"
): T[] {
	if (filter === "all") {
		return requests;
	}

	return requests.filter((item) => {
		if (filter === "locked") {
			return item.listing?.locked === true;
		}
		// filter === "unlocked"
		return item.listing?.locked !== true;
	});
}

/**
 * Split a full name into first and last name components
 * @param name - Full name string (can be empty, null, or undefined)
 * @returns Object with first and last name, with "N/A" fallback
 */
export function splitName(name: string | null | undefined): {
	first: string;
	last: string;
} {
	if (!name || name.trim() === "") {
		return { first: "N/A", last: "N/A" };
	}

	const trimmed = name.trim();
	const parts = trimmed.split(WHITESPACE_REGEX);

	if (parts.length === 0) {
		return { first: "N/A", last: "N/A" };
	}

	if (parts.length === 1) {
		return { first: parts[0] || "N/A", last: "" };
	}

	return {
		first: parts[0] || "N/A",
		last: parts.slice(1).join(" ") || "",
	};
}

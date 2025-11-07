import type { LockRequestSortColumn } from "@/hooks/use-lock-requests-filters";
import type { SortDirection } from "@/hooks/use-lock-requests-filters";

// Use a generic type that matches the Convex query return type
type LockRequestWithDetails = {
	request: {
		_id: string;
		listingId: string;
		requestedBy: string;
		status: "pending" | "approved" | "rejected";
		requestedAt: number;
		requestNotes?: string;
		lawyerName: string;
		lawyerLSONumber: string;
		lawyerEmail: string;
	};
	listing: {
		_id: string;
		mortgageId: string;
		visible: boolean;
		locked: boolean;
		lockedBy?: string;
		lockedAt?: number;
	} | null;
	mortgage: {
		_id: string;
		borrowerId: string;
		loanAmount: number;
		interestRate: number;
		address: {
			street: string;
			city: string;
			state: string;
			zip: string;
			country: string;
		};
		[key: string]: unknown; // Allow additional fields
	} | null;
	investor: {
		_id: string;
		email: string;
		first_name?: string;
		last_name?: string;
		[key: string]: unknown; // Allow additional fields
	} | null;
	borrower?: {
		_id: string;
		name: string;
		email: string;
		[key: string]: unknown; // Allow additional fields
	} | null;
	[key: string]: unknown; // Allow additional fields on the root object
};

/**
 * Sort lock requests by the specified column and direction
 */
export function sortLockRequests<T extends LockRequestWithDetails>(
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
export function searchLockRequests<T extends LockRequestWithDetails>(
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
export function filterByLockStatus<T extends LockRequestWithDetails>(
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

import type { MortgageData } from "@/components/admin/mortgages/MortgageManagementTable";

type SortColumn =
	| "address"
	| "loanAmount"
	| "interestRate"
	| "status"
	| "maturityDate"
	| "borrowerName";

type SortDirection = "asc" | "desc";

const STATUS_ORDER: Record<string, number> = {
	active: 0,
	renewed: 1,
	closed: 2,
	defaulted: 3,
};

/**
 * Sort mortgages by the specified column and direction
 */
export function sortMortgages(
	mortgages: MortgageData[],
	column: SortColumn,
	direction: SortDirection
): MortgageData[] {
	const sorted = [...mortgages];

	sorted.sort((a, b) => {
		let comparison = 0;

		switch (column) {
			case "address": {
				// Sort by street, then city, then state
				const aStreet = a.address.street.toLowerCase();
				const bStreet = b.address.street.toLowerCase();
				if (aStreet !== bStreet) {
					comparison = aStreet.localeCompare(bStreet);
					break;
				}
				const aCity = a.address.city.toLowerCase();
				const bCity = b.address.city.toLowerCase();
				if (aCity !== bCity) {
					comparison = aCity.localeCompare(bCity);
					break;
				}
				comparison = a.address.state.localeCompare(b.address.state);
				break;
			}
			case "loanAmount": {
				comparison = a.loanAmount - b.loanAmount;
				break;
			}
			case "interestRate": {
				comparison = a.interestRate - b.interestRate;
				break;
			}
			case "status": {
				// Custom order: active → renewed → closed → defaulted
				const aOrder = STATUS_ORDER[a.status] ?? 999;
				const bOrder = STATUS_ORDER[b.status] ?? 999;
				comparison = aOrder - bOrder;
				break;
			}
			case "maturityDate": {
				// Date comparison
				const aDate = new Date(a.maturityDate).getTime();
				const bDate = new Date(b.maturityDate).getTime();
				comparison = aDate - bDate;
				break;
			}
			case "borrowerName": {
				const aName = a.borrower?.name.toLowerCase() ?? "";
				const bName = b.borrower?.name.toLowerCase() ?? "";
				// Handle null borrowers - place at end for ascending, beginning for descending
				if (!a.borrower && !b.borrower) {
					comparison = 0;
				} else if (!a.borrower) {
					comparison = direction === "asc" ? 1 : -1;
				} else if (!b.borrower) {
					comparison = direction === "asc" ? -1 : 1;
				} else {
					comparison = aName.localeCompare(bName);
				}
				break;
			}
		}

		return direction === "asc" ? comparison : -comparison;
	});

	return sorted;
}

/**
 * Search mortgages across multiple fields
 * Searches: property address (street, city, state, zip), status, borrower name
 */
export function searchMortgages(
	mortgages: MortgageData[],
	query: string
): MortgageData[] {
	if (!query.trim()) {
		return mortgages;
	}

	const normalizedQuery = query.trim().toLowerCase();

	return mortgages.filter((mortgage) => {
		// Search property address
		const addressMatch =
			mortgage.address.street.toLowerCase().includes(normalizedQuery) ||
			mortgage.address.city.toLowerCase().includes(normalizedQuery) ||
			mortgage.address.state.toLowerCase().includes(normalizedQuery) ||
			mortgage.address.zip.toLowerCase().includes(normalizedQuery);

		// Search status
		const statusMatch = mortgage.status.toLowerCase().includes(normalizedQuery);

		// Search borrower name
		const borrowerMatch = mortgage.borrower?.name
			.toLowerCase()
			.includes(normalizedQuery);

		// Return true if ANY field matches (OR logic)
		return addressMatch || statusMatch || borrowerMatch;
	});
}


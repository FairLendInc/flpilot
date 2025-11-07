"use client";

import { useCallback, useState } from "react";

export type SortColumn =
	| "address"
	| "loanAmount"
	| "interestRate"
	| "status"
	| "maturityDate"
	| "borrowerName";

export type SortDirection = "asc" | "desc";

export function useMortgageTableFilters() {
	const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
	const [sortDirection, setSortDirection] = useState<SortDirection | null>(
		null
	);
	const [searchQuery, setSearchQuery] = useState("");

	const setSort = useCallback(
		(column: SortColumn, direction: SortDirection) => {
			setSortColumn(column);
			setSortDirection(direction);
		},
		[]
	);

	const toggleSort = useCallback(
		(column: SortColumn) => {
			if (sortColumn === column) {
				// Same column - cycle through: desc -> asc -> null
				if (sortDirection === "desc") {
					setSortDirection("asc");
				} else if (sortDirection === "asc") {
					setSortColumn(null);
					setSortDirection(null);
				}
			} else {
				// Different column - start with descending
				setSortColumn(column);
				setSortDirection("desc");
			}
		},
		[sortColumn, sortDirection]
	);

	const clearSort = useCallback(() => {
		setSortColumn(null);
		setSortDirection(null);
	}, []);

	const clearSearch = useCallback(() => {
		setSearchQuery("");
	}, []);

	const reset = useCallback(() => {
		setSortColumn(null);
		setSortDirection(null);
		setSearchQuery("");
	}, []);

	return {
		sortColumn,
		sortDirection,
		searchQuery,
		setSort,
		toggleSort,
		setSearchQuery,
		clearSort,
		clearSearch,
		reset,
	};
}

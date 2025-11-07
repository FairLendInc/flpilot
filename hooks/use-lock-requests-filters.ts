"use client";

import { useCallback, useState } from "react";

export type LockRequestSortColumn = "date" | "investor" | "listing" | "status";

export type SortDirection = "asc" | "desc";

export type LockStatusFilter = "all" | "locked" | "unlocked";

export function useLockRequestsFilters() {
	const [sortColumn, setSortColumn] = useState<LockRequestSortColumn | null>(
		"date"
	);
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
	const [searchQuery, setSearchQuery] = useState("");
	const [lockStatusFilter, setLockStatusFilter] =
		useState<LockStatusFilter>("all");

	const setSort = useCallback(
		(column: LockRequestSortColumn, direction: SortDirection) => {
			setSortColumn(column);
			setSortDirection(direction);
		},
		[]
	);

	const toggleSort = useCallback(
		(column: LockRequestSortColumn) => {
			if (sortColumn === column) {
				// Same column - cycle through: desc -> asc -> null
				if (sortDirection === "desc") {
					setSortDirection("asc");
				} else if (sortDirection === "asc") {
					setSortColumn(null);
					setSortDirection("desc");
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
		setSortColumn("date");
		setSortDirection("desc");
	}, []);

	const clearSearch = useCallback(() => {
		setSearchQuery("");
	}, []);

	const reset = useCallback(() => {
		setSortColumn("date");
		setSortDirection("desc");
		setSearchQuery("");
		setLockStatusFilter("all");
	}, []);

	return {
		sortColumn,
		sortDirection,
		searchQuery,
		lockStatusFilter,
		setSort,
		toggleSort,
		setSearchQuery,
		setLockStatusFilter,
		clearSort,
		clearSearch,
		reset,
	};
}

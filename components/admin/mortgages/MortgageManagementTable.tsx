"use client";

import {
	ChevronDown,
	ChevronRight,
	ChevronUp,
	Edit,
	Search,
	Trash2,
	X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Id } from "@/convex/_generated/dataModel";
import {
	type SortColumn,
	useMortgageTableFilters,
} from "@/hooks/use-mortgage-table-filters";
import {
	searchMortgages,
	sortMortgages,
} from "@/lib/utils/mortgage-table-utils";

export type MortgageData = {
	_id: Id<"mortgages">;
	borrowerId: Id<"borrowers">;
	borrower: { name: string; email: string } | null;
	loanAmount: number;
	interestRate: number;
	status: "active" | "renewed" | "closed" | "defaulted";
	address: {
		street: string;
		city: string;
		state: string;
		zip: string;
		country: string;
	};
	maturityDate: string;
};

type MortgageManagementTableProps = {
	mortgages: MortgageData[];
	onEdit: (mortgage: MortgageData) => void;
	onDelete: (mortgageId: Id<"mortgages">, address: string) => void;
};

function SortButton({
	column,
	currentColumn,
	direction,
	onClick,
}: {
	column: SortColumn;
	currentColumn: SortColumn | null;
	direction: "asc" | "desc" | null;
	onClick: () => void;
}) {
	const isActive = currentColumn === column;

	// Determine which icon to show
	let Icon = ChevronRight;
	if (isActive) {
		Icon = direction === "desc" ? ChevronDown : ChevronUp;
	}

	// Map column names to human-readable labels
	const columnLabels: Record<SortColumn, string> = {
		address: "Property Address",
		borrowerName: "Borrower",
		loanAmount: "Loan Amount",
		interestRate: "Interest Rate",
		status: "Status",
		maturityDate: "Maturity Date",
	};

	const columnLabel = columnLabels[column];

	// Generate accessible label based on current state
	let ariaLabel: string;
	let title: string;
	if (!isActive) {
		ariaLabel = `Change sort for ${columnLabel}`;
		title = `Sort by ${columnLabel}`;
	} else if (direction === "desc") {
		ariaLabel = `Sort by ${columnLabel} ascending`;
		title = "Currently sorted descending, click to sort ascending";
	} else {
		// direction === "asc"
		ariaLabel = `Sort by ${columnLabel} descending`;
		title = "Currently sorted ascending, click to sort descending";
	}

	return (
		<Button
			aria-label={ariaLabel}
			className="h-6 w-6 p-0"
			onClick={onClick}
			size="sm"
			title={title}
			variant="ghost"
		>
			<Icon
				className={`h-4 w-4 ${isActive ? "text-foreground" : "text-muted-foreground opacity-50"}`}
			/>
		</Button>
	);
}

export function MortgageManagementTable({
	mortgages,
	onEdit,
	onDelete,
}: MortgageManagementTableProps) {
	const {
		sortColumn,
		sortDirection,
		searchQuery,
		toggleSort,
		setSearchQuery,
		clearSearch,
	} = useMortgageTableFilters();

	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

	// Debounce search query
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchQuery(searchQuery);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Apply search and sort
	const filteredAndSortedMortgages = useMemo(() => {
		let result = mortgages;

		// Apply search
		if (debouncedSearchQuery.trim()) {
			result = searchMortgages(result, debouncedSearchQuery);
		}

		// Apply sort
		if (sortColumn && sortDirection) {
			result = sortMortgages(result, sortColumn, sortDirection);
		}

		return result;
	}, [mortgages, debouncedSearchQuery, sortColumn, sortDirection]);

	const totalCount = mortgages.length;
	const filteredCount = filteredAndSortedMortgages.length;

	return (
		<div className="space-y-4">
			{/* Search Bar */}
			<div className="relative">
				<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
				<Input
					className="pr-9 pl-9"
					onChange={(e) => setSearchQuery(e.target.value)}
					placeholder="Search by address, status, or borrower name..."
					value={searchQuery}
				/>
				{searchQuery && (
					<Button
						className="-translate-y-1/2 absolute top-1/2 right-1 h-7 w-7 p-0"
						onClick={clearSearch}
						size="sm"
						variant="ghost"
					>
						<X className="h-4 w-4" />
					</Button>
				)}
			</div>

			{/* Result Count */}
			{totalCount > 0 && (
				<p className="text-muted-foreground text-sm">
					{filteredCount === totalCount
						? `Showing all ${totalCount} mortgage${totalCount === 1 ? "" : "s"}`
						: `Showing ${filteredCount} of ${totalCount} mortgage${totalCount === 1 ? "" : "s"}`}
				</p>
			)}

			{/* Table */}
			{filteredAndSortedMortgages.length === 0 ? (
				<div className="flex flex-1 items-center justify-center py-12">
					<p className="text-muted-foreground">
						{searchQuery.trim() || sortColumn
							? "No mortgages match your filters"
							: "No mortgages found"}
					</p>
				</div>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>
								<div className="flex items-center gap-2">
									<span>Property Address</span>
									<SortButton
										column="address"
										currentColumn={sortColumn}
										direction={sortDirection}
										onClick={() => toggleSort("address")}
									/>
								</div>
							</TableHead>
							<TableHead>
								<div className="flex items-center gap-2">
									<span>Borrower</span>
									<SortButton
										column="borrowerName"
										currentColumn={sortColumn}
										direction={sortDirection}
										onClick={() => toggleSort("borrowerName")}
									/>
								</div>
							</TableHead>
							<TableHead>
								<div className="flex items-center gap-2">
									<span>Loan Amount</span>
									<SortButton
										column="loanAmount"
										currentColumn={sortColumn}
										direction={sortDirection}
										onClick={() => toggleSort("loanAmount")}
									/>
								</div>
							</TableHead>
							<TableHead>
								<div className="flex items-center gap-2">
									<span>Interest Rate</span>
									<SortButton
										column="interestRate"
										currentColumn={sortColumn}
										direction={sortDirection}
										onClick={() => toggleSort("interestRate")}
									/>
								</div>
							</TableHead>
							<TableHead>
								<div className="flex items-center gap-2">
									<span>Status</span>
									<SortButton
										column="status"
										currentColumn={sortColumn}
										direction={sortDirection}
										onClick={() => toggleSort("status")}
									/>
								</div>
							</TableHead>
							<TableHead>
								<div className="flex items-center gap-2">
									<span>Maturity Date</span>
									<SortButton
										column="maturityDate"
										currentColumn={sortColumn}
										direction={sortDirection}
										onClick={() => toggleSort("maturityDate")}
									/>
								</div>
							</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredAndSortedMortgages.map((mortgage) => (
							<TableRow key={mortgage._id}>
								<TableCell>
									<div>
										<p className="font-medium">{mortgage.address.street}</p>
										<p className="text-muted-foreground text-sm">
											{mortgage.address.city}, {mortgage.address.state}{" "}
											{mortgage.address.zip}
										</p>
									</div>
								</TableCell>
								<TableCell>
									{mortgage.borrower ? (
										<div>
											<p className="font-medium">{mortgage.borrower.name}</p>
											<p className="text-muted-foreground text-sm">
												{mortgage.borrower.email}
											</p>
										</div>
									) : (
										<span className="text-muted-foreground">—</span>
									)}
								</TableCell>
								<TableCell>${mortgage.loanAmount.toLocaleString()}</TableCell>
								<TableCell>{mortgage.interestRate}%</TableCell>
								<TableCell>
									<Badge
										variant={
											mortgage.status === "active"
												? "default"
												: mortgage.status === "closed"
													? "secondary"
													: mortgage.status === "defaulted"
														? "destructive"
														: "outline"
										}
									>
										{mortgage.status}
									</Badge>
								</TableCell>
								<TableCell>
									{new Date(mortgage.maturityDate).toLocaleDateString()}
								</TableCell>
								<TableCell className="text-right">
									<div className="flex justify-end gap-2">
										<Button
											aria-label="Edit mortgage"
											onClick={() => onEdit(mortgage)}
											size="sm"
											variant="outline"
										>
											<Edit className="h-4 w-4" />
										</Button>
										<Button
											aria-label="Delete mortgage"
											onClick={() =>
												onDelete(
													mortgage._id,
													`${mortgage.address.street}, ${mortgage.address.city}, ${mortgage.address.state} ${mortgage.address.zip}`
												)
											}
											size="sm"
											variant="destructive"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}

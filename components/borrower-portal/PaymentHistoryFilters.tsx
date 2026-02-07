"use client";

import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Property = {
	id: string;
	address: string;
};

type PaymentHistoryFiltersProps = {
	properties: Property[];
	selectedPropertyId: string | null;
	onPropertyChange: (id: string | null) => void;
	selectedStatuses: ("pending" | "cleared" | "failed")[];
	onStatusChange: (statuses: ("pending" | "cleared" | "failed")[]) => void;
	dateRange: "30d" | "3m" | "6m" | "12m" | "all" | "custom";
	onDateRangeChange: (
		range: "30d" | "3m" | "6m" | "12m" | "all" | "custom"
	) => void;
	totalResults: number;
	onClearAll: () => void;
	className?: string;
};

const dateRangeOptions = [
	{ value: "30d", label: "Last 30 days" },
	{ value: "3m", label: "Last 3 months" },
	{ value: "6m", label: "Last 6 months" },
	{ value: "12m", label: "Last 12 months" },
	{ value: "all", label: "All time" },
] as const;

export function PaymentHistoryFilters({
	properties,
	selectedPropertyId,
	onPropertyChange,
	selectedStatuses,
	onStatusChange,
	dateRange,
	onDateRangeChange,
	totalResults,
	onClearAll,
	className,
}: PaymentHistoryFiltersProps) {
	const hasActiveFilters =
		selectedPropertyId !== null ||
		selectedStatuses.length < 3 ||
		dateRange !== "12m";

	const toggleStatus = (status: "pending" | "cleared" | "failed") => {
		if (selectedStatuses.includes(status)) {
			if (selectedStatuses.length > 1) {
				onStatusChange(selectedStatuses.filter((s) => s !== status));
			}
		} else {
			onStatusChange([...selectedStatuses, status]);
		}
	};

	return (
		<div className={cn("space-y-4", className)}>
			{/* Filter controls */}
			<div className="flex flex-wrap items-center gap-3">
				{/* Property filter */}
				<Select
					onValueChange={(v) => onPropertyChange(v === "all" ? null : v)}
					value={selectedPropertyId ?? "all"}
				>
					<SelectTrigger className="w-[200px]">
						<SelectValue placeholder="All Properties" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Properties</SelectItem>
						{properties.map((property) => (
							<SelectItem key={property.id} value={property.id}>
								{property.address.split(",")[0]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Status filter - inline badges */}
				<div className="flex items-center gap-1.5">
					<span className="mr-1 text-muted-foreground text-sm">Status:</span>
					{(["cleared", "pending", "failed"] as const).map((status) => (
						<Badge
							className={cn(
								"cursor-pointer transition-colors",
								selectedStatuses.includes(status)
									? status === "cleared"
										? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
										: status === "pending"
											? "bg-amber-100 text-amber-700 hover:bg-amber-200"
											: "bg-red-100 text-red-700 hover:bg-red-200"
									: "bg-muted text-muted-foreground hover:bg-muted/80"
							)}
							key={status}
							onClick={() => toggleStatus(status)}
							variant="secondary"
						>
							{status.charAt(0).toUpperCase() + status.slice(1)}
						</Badge>
					))}
				</div>

				{/* Date range filter */}
				<Select
					onValueChange={(v) => onDateRangeChange(v as typeof dateRange)}
					value={dateRange}
				>
					<SelectTrigger className="w-[160px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{dateRangeOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Results summary and clear */}
			<div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
				<div className="flex items-center gap-2">
					<Filter className="h-4 w-4 text-muted-foreground" />
					<span className="text-sm">
						Showing <span className="font-semibold">{totalResults}</span>{" "}
						payments
						{selectedPropertyId && " for selected property"}
					</span>
				</div>
				{hasActiveFilters && (
					<Button
						className="h-7 gap-1.5 text-xs"
						onClick={onClearAll}
						size="sm"
						variant="ghost"
					>
						<X className="h-3 w-3" />
						Clear All
					</Button>
				)}
			</div>
		</div>
	);
}

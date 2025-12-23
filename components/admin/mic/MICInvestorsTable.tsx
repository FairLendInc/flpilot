"use client";

import {
	ArrowDownRight,
	Eye,
	Filter,
	MoreHorizontal,
	Search,
} from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { AccrualStatusIndicator } from "./AccrualStatusIndicator";
import { MICCapBadge } from "./MICCapBadge";

type InvestorRow = {
	id: string;
	name: string;
	email: string;
	capitalClass: string;
	unitsOwned: number;
	ownershipPercentage: number;
	currentValue: number;
	accrualStatus: "up-to-date" | "pending" | "behind";
	lastAccruedDate?: string;
};

type MICInvestorsTableProps = {
	/**
	 * Array of investor data
	 */
	data: InvestorRow[];
	/**
	 * Callback when "View Details" is clicked
	 */
	onViewDetails?: (investor: InvestorRow) => void;
	/**
	 * Callback when "Redeem" is clicked
	 */
	onRedeem?: (investor: InvestorRow) => void;
	/**
	 * Optional className for the container
	 */
	className?: string;
};

/**
 * A feature-rich data table for managing MIC investors.
 * Includes search, filtering suggestions, and actions for each investor.
 * Strictly decoupled from data fetching for full testability in Storybook.
 */
export function MICInvestorsTable({
	data,
	onViewDetails,
	onRedeem,
	className,
}: MICInvestorsTableProps) {
	const [searchQuery, setSearchQuery] = React.useState("");

	const filteredData = data.filter(
		(item) =>
			item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.email.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			<div className="flex items-center justify-between gap-4">
				<div className="relative max-w-sm flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground/60" />
					<Input
						className="border-muted-foreground/20 bg-background/50 pl-9 focus-visible:ring-primary/20"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search investors..."
						value={searchQuery}
					/>
				</div>
				<Button
					className="gap-2 border-muted-foreground/20"
					size="sm"
					variant="outline"
				>
					<Filter className="size-4" />
					Filters
				</Button>
			</div>

			<div className="overflow-hidden rounded-xl border bg-card/50 shadow-sm">
				<Table>
					<TableHeader className="bg-muted/30">
						<TableRow>
							<TableHead className="font-bold text-[11px] uppercase tracking-wider">
								Investor
							</TableHead>
							<TableHead className="text-center font-bold text-[11px] uppercase tracking-wider">
								Class
							</TableHead>
							<TableHead className="text-right font-bold text-[11px] uppercase tracking-wider">
								Units
							</TableHead>
							<TableHead className="text-right font-bold text-[11px] uppercase tracking-wider">
								Ownership
							</TableHead>
							<TableHead className="font-bold text-[11px] uppercase tracking-wider">
								Accrual Status
							</TableHead>
							<TableHead className="w-[50px]" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredData.length === 0 ? (
							<TableRow>
								<TableCell
									className="h-32 text-center text-muted-foreground"
									colSpan={6}
								>
									No investors found matching your search.
								</TableCell>
							</TableRow>
						) : (
							filteredData.map((investor) => (
								<TableRow
									className="group transition-colors hover:bg-muted/50"
									key={investor.id}
								>
									<TableCell>
										<div className="flex flex-col gap-0.5">
											<span className="font-bold text-foreground text-sm">
												{investor.name}
											</span>
											<span className="font-medium text-[10px] text-muted-foreground">
												{investor.email}
											</span>
										</div>
									</TableCell>
									<TableCell className="text-center">
										<MICCapBadge capitalClass={investor.capitalClass} />
									</TableCell>
									<TableCell className="text-right">
										<span className="font-bold font-mono text-sm tabular-nums">
											{investor.unitsOwned.toLocaleString()}
										</span>
									</TableCell>
									<TableCell className="text-right">
										<span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-bold text-[10px] text-primary">
											{investor.ownershipPercentage}%
										</span>
									</TableCell>
									<TableCell>
										<AccrualStatusIndicator
											lastAccruedDate={investor.lastAccruedDate}
											showDetails={false}
											status={investor.accrualStatus}
										/>
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													className="h-8 w-8 p-0 hover:bg-background/80"
													variant="ghost"
												>
													<MoreHorizontal className="h-4 w-4" />
													<span className="sr-only">Open menu</span>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="w-[160px]">
												<DropdownMenuLabel className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
													Actions
												</DropdownMenuLabel>
												<DropdownMenuItem
													className="cursor-pointer gap-2"
													onClick={() => onViewDetails?.(investor)}
												>
													<Eye className="size-4" />
													View Details
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													className="cursor-pointer gap-2 text-rose-500 focus:text-rose-500"
													onClick={() => onRedeem?.(investor)}
												>
													<ArrowDownRight className="size-4" />
													Redeem Units
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-between px-2 font-medium text-[11px] text-muted-foreground">
				<span>
					Showing {filteredData.length} of {data.length} investors
				</span>
				<div className="flex items-center gap-4">
					<Button
						className="h-8 text-[11px]"
						disabled
						size="sm"
						variant="ghost"
					>
						Previous
					</Button>
					<Button
						className="h-8 text-[11px]"
						disabled
						size="sm"
						variant="ghost"
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
}

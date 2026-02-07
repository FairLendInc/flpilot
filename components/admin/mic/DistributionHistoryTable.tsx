"use client";

import {
	CheckCircle2,
	Clock,
	ExternalLink,
	FileDown,
	MoreHorizontal,
	Search,
} from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
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

type DistributionRow = {
	id: string;
	periodName: string;
	totalAmount: number;
	rate: number;
	investorCount: number;
	status: "completed" | "pending" | "failed";
	completionDate?: string;
};

type DistributionHistoryTableProps = {
	/**
	 * Array of distribution historical data
	 */
	data: DistributionRow[];
	/**
	 * Callback when "Download Report" is clicked
	 */
	onDownloadReport?: (dist: DistributionRow) => void;
	/**
	 * Optional className for the container
	 */
	className?: string;
};

/**
 * A data table for tracking past MIC distribution cycles.
 * Provides a high-level overview of historical fund performance and disbursement status.
 */
export function DistributionHistoryTable({
	data,
	onDownloadReport,
	className,
}: DistributionHistoryTableProps) {
	const [searchQuery, setSearchQuery] = React.useState("");

	const filteredData = data.filter((item) =>
		item.periodName.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			<div className="flex items-center justify-between gap-4">
				<div className="relative max-w-sm flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground/60" />
					<Input
						className="border-muted-foreground/20 bg-background/50 pl-9 focus-visible:ring-primary/20"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search by period..."
						value={searchQuery}
					/>
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border bg-card/50 shadow-sm">
				<Table>
					<TableHeader className="bg-muted/30">
						<TableRow>
							<TableHead className="font-bold text-[11px] uppercase tracking-wider">
								Distribution Period
							</TableHead>
							<TableHead className="text-right font-bold text-[11px] uppercase tracking-wider">
								Total Disbursed
							</TableHead>
							<TableHead className="text-center font-bold text-[11px] uppercase tracking-wider">
								Annualized Rate
							</TableHead>
							<TableHead className="text-center font-bold text-[11px] uppercase tracking-wider">
								Investors
							</TableHead>
							<TableHead className="font-bold text-[11px] uppercase tracking-wider">
								Status
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
									No distribution history found for this search.
								</TableCell>
							</TableRow>
						) : (
							filteredData.map((dist) => (
								<TableRow
									className="group transition-colors hover:bg-muted/50"
									key={dist.id}
								>
									<TableCell>
										<div className="flex flex-col gap-0.5">
											<span className="font-bold text-foreground text-sm">
												{dist.periodName}
											</span>
											{dist.completionDate && (
												<span className="font-medium text-[10px] text-muted-foreground">
													Completed on {dist.completionDate}
												</span>
											)}
										</div>
									</TableCell>
									<TableCell className="text-right">
										<span className="font-bold font-mono text-emerald-600 text-sm tabular-nums dark:text-emerald-400">
											${dist.totalAmount.toLocaleString()}
										</span>
									</TableCell>
									<TableCell className="text-center">
										<span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-bold text-[10px] text-primary">
											{dist.rate}%
										</span>
									</TableCell>
									<TableCell className="text-center">
										<span className="font-bold text-foreground text-xs">
											{dist.investorCount}
										</span>
									</TableCell>
									<TableCell>
										{dist.status === "completed" ? (
											<div className="flex items-center gap-1.5 text-emerald-500">
												<CheckCircle2 className="size-3.5" />
												<span className="font-bold text-[10px] uppercase tracking-widest">
													Success
												</span>
											</div>
										) : dist.status === "pending" ? (
											<div className="flex items-center gap-1.5 text-amber-500">
												<Clock className="size-3.5 animate-pulse" />
												<span className="font-bold text-[10px] uppercase tracking-widest">
													Processing
												</span>
											</div>
										) : (
											<Badge
												className="font-bold text-[9px] uppercase tracking-tighter"
												variant="destructive"
											>
												Failed
											</Badge>
										)}
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
											<DropdownMenuContent align="end" className="w-[180px]">
												<DropdownMenuLabel className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
													Archive
												</DropdownMenuLabel>
												<DropdownMenuItem
													className="cursor-pointer gap-2"
													onClick={() => onDownloadReport?.(dist)}
												>
													<FileDown className="size-4" />
													Download Report
												</DropdownMenuItem>
												<DropdownMenuItem className="cursor-pointer gap-2">
													<ExternalLink className="size-4" />
													View Periodic Ledger
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
				<span>Historical Cycles: {filteredData.length}</span>
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

"use client";

import {
	ArrowUpRight,
	Building2,
	MapPin,
	MoreHorizontal,
	Search,
	Settings2,
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

type AUMRow = {
	id: string;
	mortgageName: string;
	address: string;
	totalValue: number;
	ownershipPercentage: number;
	micValue: number;
	accrualStatus: "up-to-date" | "pending" | "behind";
	lastAccruedDate?: string;
};

type MICAUMTableProps = {
	/**
	 * Array of AUM asset data
	 */
	data: AUMRow[];
	/**
	 * Callback when "Manage" is clicked
	 */
	onManage?: (asset: AUMRow) => void;
	/**
	 * Callback when "Sell Fraction" is clicked
	 */
	onSellFraction?: (asset: AUMRow) => void;
	/**
	 * Optional className for the container
	 */
	className?: string;
};

/**
 * A specialized data table for managing the MIC's Assets Under Management (AUM).
 * Visualizes fractional mortgage ownership and interest accrual at a glance.
 */
export function MICAUMTable({
	data,
	onManage,
	onSellFraction,
	className,
}: MICAUMTableProps) {
	const [searchQuery, setSearchQuery] = React.useState("");

	const filteredData = data.filter(
		(item) =>
			item.mortgageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.address.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			<div className="flex items-center justify-between gap-4">
				<div className="relative max-w-sm flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground/60" />
					<Input
						className="border-muted-foreground/20 bg-background/50 pl-9 focus-visible:ring-primary/20"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search assets..."
						value={searchQuery}
					/>
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border bg-card/50 shadow-sm">
				<Table>
					<TableHeader className="bg-muted/30">
						<TableRow>
							<TableHead className="font-bold text-[11px] uppercase tracking-wider">
								Mortgage Asset
							</TableHead>
							<TableHead className="text-right font-bold text-[11px] uppercase tracking-wider">
								Total Principal
							</TableHead>
							<TableHead className="text-center font-bold text-[11px] uppercase tracking-wider">
								MIC Share
							</TableHead>
							<TableHead className="text-right font-bold text-[11px] uppercase tracking-wider">
								MIC Value
							</TableHead>
							<TableHead className="font-bold text-[11px] uppercase tracking-wider">
								Interest Status
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
									No assets found matching your search.
								</TableCell>
							</TableRow>
						) : (
							filteredData.map((asset) => (
								<TableRow
									className="group transition-colors hover:bg-muted/50"
									key={asset.id}
								>
									<TableCell>
										<div className="flex items-start gap-3">
											<div className="mt-1 rounded-lg bg-blue-500/10 p-1.5 text-blue-500">
												<Building2 className="size-3.5" />
											</div>
											<div className="flex flex-col gap-0.5">
												<span className="font-bold text-foreground text-sm">
													{asset.mortgageName}
												</span>
												<div className="flex items-center gap-1 font-medium text-[10px] text-muted-foreground">
													<MapPin className="size-3 opacity-70" />
													{asset.address}
												</div>
											</div>
										</div>
									</TableCell>
									<TableCell className="text-right">
										<span className="font-bold font-mono text-sm tabular-nums">
											${asset.totalValue.toLocaleString()}
										</span>
									</TableCell>
									<TableCell className="text-center">
										<span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 font-bold text-[10px] text-indigo-500">
											{asset.ownershipPercentage}%
										</span>
									</TableCell>
									<TableCell className="text-right">
										<span className="font-bold font-mono text-primary text-sm tabular-nums">
											${asset.micValue.toLocaleString()}
										</span>
									</TableCell>
									<TableCell>
										<AccrualStatusIndicator
											lastAccruedDate={asset.lastAccruedDate}
											showDetails={false}
											status={asset.accrualStatus}
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
											<DropdownMenuContent align="end" className="w-[180px]">
												<DropdownMenuLabel className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
													Asset Management
												</DropdownMenuLabel>
												<DropdownMenuItem
													className="cursor-pointer gap-2"
													onClick={() => onManage?.(asset)}
												>
													<Settings2 className="size-4" />
													Manage States
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													className="cursor-pointer gap-2 text-primary focus:text-primary"
													onClick={() => onSellFraction?.(asset)}
												>
													<ArrowUpRight className="size-4" />
													Sell Fraction (Aisle)
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
				<span>Portfolio Assets: {filteredData.length}</span>
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

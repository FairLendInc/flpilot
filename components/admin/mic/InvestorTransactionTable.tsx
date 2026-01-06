"use client";

import { format } from "date-fns";
import type { LucideIcon } from "lucide-react";
import {
	ArrowDownLeft,
	ArrowUpRight,
	Coins,
	FileText,
	Percent,
	Search,
} from "lucide-react";
import React from "react";
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
import { cn } from "@/lib/utils";

type TransactionType =
	| "subscription"
	| "redemption"
	| "distribution"
	| "adjustment";

type InvestorTransaction = {
	id: string;
	type: TransactionType;
	description: string;
	timestamp: Date | string;
	amount: number;
	balanceAfter: number;
	reference?: string;
};

type InvestorTransactionTableProps = {
	/**
	 * Array of transaction data for a specific investor
	 */
	data: InvestorTransaction[];
	/**
	 * Optional className for the container
	 */
	className?: string;
};

const txConfig: Record<
	TransactionType,
	{ icon: LucideIcon; color: string; bgColor: string }
> = {
	subscription: {
		icon: ArrowUpRight,
		color: "text-emerald-500",
		bgColor: "bg-emerald-500/10",
	},
	redemption: {
		icon: ArrowDownLeft,
		color: "text-rose-500",
		bgColor: "bg-rose-500/10",
	},
	distribution: {
		icon: Coins,
		color: "text-indigo-500",
		bgColor: "bg-indigo-500/10",
	},
	adjustment: {
		icon: Percent,
		color: "text-amber-500",
		bgColor: "bg-amber-500/10",
	},
};

/**
 * A ledger-style table for viewing individual investor transaction history.
 * Highlights debits/credits and maintains a running balance view.
 * Optimized for display within an Investor Detail Sheet.
 */
export function InvestorTransactionTable({
	data,
	className,
}: InvestorTransactionTableProps) {
	const [searchQuery, setSearchQuery] = React.useState("");

	const filteredData = data.filter(
		(item) =>
			item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.reference?.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const formatDate = (date: Date | string) => {
		const d = typeof date === "string" ? new Date(date) : date;
		return format(d, "MMM d, yyyy HH:mm");
	};

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			<div className="flex items-center gap-4">
				<div className="relative max-w-sm flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground/60" />
					<Input
						className="border-muted-foreground/20 bg-background/50 pl-9 focus-visible:ring-primary/20"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search transactions..."
						value={searchQuery}
					/>
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border bg-card/50 shadow-sm">
				<Table>
					<TableHeader className="bg-muted/30">
						<TableRow>
							<TableHead className="font-bold text-[11px] uppercase tracking-wider">
								Date & Type
							</TableHead>
							<TableHead className="font-bold text-[11px] uppercase tracking-wider">
								Description
							</TableHead>
							<TableHead className="text-right font-bold text-[11px] uppercase tracking-wider">
								Amount
							</TableHead>
							<TableHead className="text-right font-bold text-[11px] uppercase tracking-wider">
								Balance
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredData.length === 0 ? (
							<TableRow>
								<TableCell
									className="h-32 text-center text-muted-foreground"
									colSpan={4}
								>
									No transactions found.
								</TableCell>
							</TableRow>
						) : (
							filteredData.map((tx) => {
								const config = txConfig[tx.type];
								const Icon = config.icon;
								const isCredit = tx.amount >= 0;

								return (
									<TableRow
										className="group transition-colors hover:bg-muted/50"
										key={tx.id}
									>
										<TableCell>
											<div className="flex items-center gap-3">
												<div
													className={cn(
														"flex size-8 shrink-0 items-center justify-center rounded-lg shadow-xs",
														config.bgColor,
														config.color
													)}
												>
													<Icon className="size-4" />
												</div>
												<div className="flex flex-col gap-0.5">
													<span className="font-bold text-[10px] text-muted-foreground uppercase leading-none tracking-widest">
														{tx.type}
													</span>
													<span className="font-bold text-[11px] text-foreground opacity-80">
														{formatDate(tx.timestamp)}
													</span>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className="flex flex-col gap-0.5">
												<span className="font-bold text-foreground text-sm leading-tight tracking-tight">
													{tx.description}
												</span>
												{tx.reference && (
													<div className="flex items-center gap-1 font-medium text-[10px] text-muted-foreground">
														<FileText className="size-3 opacity-60" />
														Ref: {tx.reference}
													</div>
												)}
											</div>
										</TableCell>
										<TableCell className="text-right">
											<span
												className={cn(
													"font-bold font-mono text-sm tabular-nums",
													isCredit
														? "text-emerald-600 dark:text-emerald-400"
														: "text-rose-600 dark:text-rose-400"
												)}
											>
												{isCredit ? "+" : ""}$
												{Math.abs(tx.amount).toLocaleString()}
											</span>
										</TableCell>
										<TableCell className="text-right">
											<span className="font-bold font-mono text-foreground text-sm tabular-nums">
												${tx.balanceAfter.toLocaleString()}
											</span>
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-between px-2 font-medium text-[11px] text-muted-foreground">
				<span>Transaction Events: {filteredData.length}</span>
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

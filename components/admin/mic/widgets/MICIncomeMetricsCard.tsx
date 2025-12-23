"use client";

import { HandCoins, TrendingUp } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MICIncomeMetricsCardProps = {
	interestEarned: number;
	lendingFees: number;
	className?: string;
};

export function MICIncomeMetricsCard({
	interestEarned,
	lendingFees,
	className,
}: MICIncomeMetricsCardProps) {
	return (
		<Card
			className={cn("border-none shadow-sm dark:bg-slate-900/50", className)}
		>
			<CardHeader className="pb-4">
				<CardTitle className="font-bold text-muted-foreground/80 text-sm uppercase tracking-wider">
					Fund Income
				</CardTitle>
				<CardDescription className="text-xs">
					Accumulated earnings from mortgage operations.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-center justify-between rounded-xl bg-emerald-500/5 p-4 ring-1 ring-emerald-500/10">
					<div className="flex items-center gap-3">
						<div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
							<TrendingUp className="size-5" />
						</div>
						<div className="flex flex-col">
							<span className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
								Interest Earned
							</span>
							<span className="font-bold text-foreground text-xl tracking-tight">
								${(interestEarned / 100).toLocaleString()}
							</span>
						</div>
					</div>
				</div>

				<div className="flex items-center justify-between rounded-xl bg-indigo-500/5 p-4 ring-1 ring-indigo-500/10">
					<div className="flex items-center gap-3">
						<div className="flex size-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
							<HandCoins className="size-5" />
						</div>
						<div className="flex flex-col">
							<span className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
								Lending Fees
							</span>
							<span className="font-bold text-foreground text-xl tracking-tight">
								${(lendingFees / 100).toLocaleString()}
							</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

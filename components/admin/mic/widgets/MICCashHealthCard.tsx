"use client";

import { Info, Wallet } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type MICCashHealthCardProps = {
	/**
	 * Current cash balance
	 */
	balance: number;
	/**
	 * Target or reserve cash amount
	 */
	target: number;
	/**
	 * Currency symbol
	 */
	currency?: string;
	/**
	 * Optional className for the container
	 */
	className?: string;
};

/**
 * A specialized widget for monitoring MIC cash position relative to targets.
 * Features a visual health indicator and status-aware styling.
 */
export function MICCashHealthCard({
	balance,
	target,
	currency = "$",
	className,
}: MICCashHealthCardProps) {
	// Calculate health percentage (clamped at 100)
	const percentage = Math.min(100, Math.round((balance / target) * 100));

	// Determine status color and message
	const getStatusConfig = () => {
		if (balance > target) {
			return {
				color: "text-amber-500 bg-amber-500",
				message:
					"Excess capital detected. Recommend deploying capital into new mortgage originations to maintain target yield.",
				warning: true,
			};
		}
		if (percentage >= 100) {
			return {
				color: "text-emerald-500 bg-emerald-500",
				message:
					"Cash position is healthy. Ready for deployment or distributions.",
				warning: false,
			};
		}
		if (percentage >= 50) {
			return {
				color: "text-amber-500 bg-amber-500",
				message: "Cash levels are moderate. Caution advised for large payouts.",
				warning: false,
			};
		}
		return {
			color: "text-rose-500 bg-rose-500",
			message:
				"Critical cash levels. New contributions or asset sales may be required.",
			warning: false,
		};
	};

	const config = getStatusConfig();

	return (
		<Card
			className={cn(
				"overflow-hidden border-none shadow-sm dark:bg-slate-900/50",
				className
			)}
		>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="font-bold text-muted-foreground/80 text-sm uppercase tracking-wider">
						Cash Position
					</CardTitle>
					<div
						className={cn(
							"rounded-full p-1.5",
							config.warning ? "bg-amber-500/10" : "bg-background/50",
							config.color.split(" ")[0]
						)}
					>
						<Wallet className="size-4" />
					</div>
				</div>
				<CardDescription className="font-bold text-2xl text-foreground tracking-tight">
					{currency}
					{balance.toLocaleString()}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<div className="flex flex-col gap-1.5">
					<div className="flex items-center justify-between font-bold text-[11px] text-muted-foreground/60 uppercase tracking-tight">
						<span>
							Target Reserve: {currency}
							{target.toLocaleString()}
						</span>
						<span>{percentage}%</span>
					</div>
					<Progress
						className="h-2"
						value={percentage}
						// Custom styling for the progress indicator
					/>
				</div>

				<div
					className={cn(
						"flex items-start gap-2 rounded-lg p-2.5 font-medium text-[10px] leading-normal",
						config.warning
							? "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20"
							: "bg-muted/50 text-muted-foreground"
					)}
				>
					<Info className="mt-0.5 size-3 shrink-0" />
					<p>{config.message}</p>
				</div>
			</CardContent>
		</Card>
	);
}

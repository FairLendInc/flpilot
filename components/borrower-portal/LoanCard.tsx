"use client";

import { ArrowRight, Building2, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LoanStatus = "active" | "completed" | "default";

type Mortgage = {
	id: string;
	propertyAddress: string;
	principal: number;
	interestRate: number;
	monthlyPayment: number;
	termMonths: number;
	remainingMonths: number;
	status: LoanStatus;
};

type LoanCardProps = {
	mortgage: Mortgage;
	onView: () => void;
	className?: string;
};

const statusConfig: Record<
	LoanStatus,
	{
		label: string;
		icon: React.ElementType;
		className: string;
	}
> = {
	active: {
		label: "Active",
		icon: CheckCircle2,
		className:
			"bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
	},
	completed: {
		label: "Completed",
		icon: CheckCircle2,
		className:
			"bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
	},
	default: {
		label: "Default",
		icon: XCircle,
		className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
	},
};

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-CA", {
		style: "currency",
		currency: "CAD",
		maximumFractionDigits: 0,
	}).format(amount);
}

function formatPercent(rate: number): string {
	return `${rate.toFixed(1)}%`;
}

export function LoanCard({ mortgage, onView, className }: LoanCardProps) {
	const config = statusConfig[mortgage.status];
	const StatusIcon = config.icon;

	return (
		<Card
			className={cn(
				"group overflow-hidden transition-all hover:shadow-lg",
				className
			)}
		>
			<CardContent className="p-0">
				{/* Header with address and view button */}
				<div className="flex items-start justify-between gap-4 p-5 pb-4">
					<div className="flex items-start gap-3">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
							<Building2 className="h-5 w-5 text-primary" />
						</div>
						<div>
							<h3 className="font-semibold text-lg leading-tight">
								{mortgage.propertyAddress.split(",")[0]}
							</h3>
							<p className="text-muted-foreground text-sm">
								{mortgage.propertyAddress.split(",").slice(1).join(",").trim()}
							</p>
						</div>
					</div>
					<Button
						className="shrink-0 gap-1.5 opacity-0 transition-opacity group-hover:opacity-100"
						onClick={onView}
						size="sm"
						variant="ghost"
					>
						View
						<ArrowRight className="h-4 w-4" />
					</Button>
				</div>

				{/* Metrics grid */}
				<div className="grid grid-cols-3 gap-px bg-muted/50">
					<div className="bg-card p-4 text-center">
						<p className="font-bold text-2xl tabular-nums">
							{formatCurrency(mortgage.principal)}
						</p>
						<p className="mt-1 text-muted-foreground text-xs">Principal</p>
					</div>
					<div className="bg-card p-4 text-center">
						<p className="font-bold text-2xl tabular-nums">
							{formatPercent(mortgage.interestRate)}
						</p>
						<p className="mt-1 text-muted-foreground text-xs">Interest Rate</p>
					</div>
					<div className="bg-card p-4 text-center">
						<p className="font-bold text-2xl tabular-nums">
							{formatCurrency(mortgage.monthlyPayment)}
						</p>
						<p className="mt-1 text-muted-foreground text-xs">
							Monthly Payment
						</p>
					</div>
				</div>

				{/* Footer with term and status */}
				<div className="flex items-center justify-between bg-muted/30 px-5 py-4">
					<span className="text-muted-foreground text-sm">
						Term: {mortgage.termMonths} months ({mortgage.remainingMonths}{" "}
						remaining)
					</span>
					<Badge className={cn("gap-1", config.className)} variant="secondary">
						<StatusIcon className="h-3 w-3" />
						{config.label}
					</Badge>
				</div>
			</CardContent>
		</Card>
	);
}

export type { Mortgage, LoanStatus };

"use client";

import { format } from "date-fns";
import { Calendar, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PeriodStatus = "open" | "closing" | "closed";

type CurrentPeriodCardProps = {
	/**
	 * Month and year of the period (e.g., "December 2024")
	 */
	periodName: string;
	/**
	 * Start date of the period
	 */
	startDate: Date | string;
	/**
	 * End date of the period
	 */
	endDate: Date | string;
	/**
	 * Current status of the period
	 */
	status: PeriodStatus;
	/**
	 * Progress percentage towards period end (0-100)
	 */
	progress?: number;
	/**
	 * Optional className for the container
	 */
	className?: string;
};

/**
 * A dashboard widget showing the status of the current MIC distribution period.
 * Features status-aware badges and clean date range displays.
 */
export function CurrentPeriodCard({
	periodName,
	startDate,
	endDate,
	status,
	progress,
	className,
}: CurrentPeriodCardProps) {
	const statusConfig = {
		open: {
			label: "Period Open",
			variant: "success",
			icon: Clock,
			description: "Accepting subscriptions and originations.",
		},
		closing: {
			label: "Closing Soon",
			variant: "warning",
			icon: Calendar,
			description: "Preparing for monthly distribution close.",
		},
		closed: {
			label: "Period Closed",
			variant: "secondary",
			icon: CheckCircle2,
			description: "Distribution complete. View history for details.",
		},
	} as const;

	const { label, variant, icon: Icon, description } = statusConfig[status];

	const formatDate = (date: Date | string) => {
		const d = typeof date === "string" ? new Date(date) : date;
		return format(d, "MMM d, yyyy");
	};

	return (
		<Card
			className={cn(
				"flex flex-col border-none shadow-sm dark:bg-slate-900/50",
				className
			)}
		>
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<CardTitle className="font-bold text-muted-foreground/80 text-sm uppercase tracking-wider">
						Current Period
					</CardTitle>
					<Badge
						className="gap-1 rounded-full px-2 py-0.5 font-bold text-[10px] uppercase"
						variant={variant}
					>
						<Icon className="size-3" />
						{label}
					</Badge>
				</div>
				<CardDescription className="font-bold text-2xl text-foreground tracking-tight">
					{periodName}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<div className="grid grid-cols-2 gap-4 rounded-xl bg-muted/30 p-3">
					<div className="flex flex-col gap-0.5">
						<span className="font-bold text-[10px] text-muted-foreground/60 uppercase tracking-widest">
							Starts
						</span>
						<span className="font-bold text-foreground text-xs">
							{formatDate(startDate)}
						</span>
					</div>
					<div className="flex flex-col gap-0.5">
						<span className="font-bold text-[10px] text-muted-foreground/60 uppercase tracking-widest">
							Ends
						</span>
						<span className="font-bold text-foreground text-xs">
							{formatDate(endDate)}
						</span>
					</div>
				</div>

				{progress !== undefined && status !== "closed" && (
					<div className="flex flex-col gap-1.5">
						<div className="flex items-center justify-between font-bold text-[10px] text-muted-foreground/60 uppercase tracking-widest">
							<span>Period Progress</span>
							<span>{progress}%</span>
						</div>
						<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="h-full bg-primary transition-all duration-500"
								style={{ width: `${progress}%` }}
							/>
						</div>
					</div>
				)}

				<p className="font-medium text-[11px] text-muted-foreground/80 leading-relaxed">
					{description}
				</p>
			</CardContent>
		</Card>
	);
}

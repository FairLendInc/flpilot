"use client";

import { format } from "date-fns";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type AccrualStatus = "up-to-date" | "pending" | "behind";

type AccrualStatusIndicatorProps = {
	/**
	 * Current accrual status
	 */
	status: AccrualStatus;
	/**
	 * The date when interest was last successfully accrued
	 */
	lastAccruedDate?: Date | string;
	/**
	 * The next expected accrual date
	 */
	nextAccrualDate?: Date | string;
	/**
	 * Optional className for the container
	 */
	className?: string;
	/**
	 * Whether to show the date details
	 */
	showDetails?: boolean;
};

/**
 * A status indicator for mortgage/investor accruals.
 * Features a pulsing dot and clear status icons with premium styling.
 */
export function AccrualStatusIndicator({
	status,
	lastAccruedDate,
	nextAccrualDate,
	className,
	showDetails = true,
}: AccrualStatusIndicatorProps) {
	const config = {
		"up-to-date": {
			color: "text-emerald-500",
			bgColor: "bg-emerald-500/10",
			borderColor: "border-emerald-500/20",
			dotColor: "bg-emerald-500",
			icon: CheckCircle2,
			label: "Up to Date",
		},
		pending: {
			color: "text-amber-500",
			bgColor: "bg-amber-500/10",
			borderColor: "border-amber-500/20",
			dotColor: "bg-amber-500",
			icon: Clock,
			label: "Accrual Pending",
		},
		behind: {
			color: "text-rose-500",
			bgColor: "bg-rose-500/10",
			borderColor: "border-rose-500/20",
			dotColor: "bg-rose-500",
			icon: AlertCircle,
			label: "Accrual Behind",
		},
	};

	const {
		color,
		bgColor,
		borderColor,
		dotColor,
		icon: Icon,
		label,
	} = config[status];

	const formatDate = (date?: Date | string) => {
		if (!date) return "N/A";
		const d = typeof date === "string" ? new Date(date) : date;
		try {
			return format(d, "MMM d, yyyy");
		} catch {
			return "Invalid Date";
		}
	};

	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<div
				className={cn(
					"inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-semibold text-[11px] transition-all duration-300",
					bgColor,
					borderColor,
					color
				)}
			>
				<span className="relative flex h-2 w-2">
					{status !== "up-to-date" && (
						<span
							className={cn(
								"absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
								dotColor
							)}
						/>
					)}
					<span
						className={cn(
							"relative inline-flex h-2 w-2 rounded-full",
							dotColor
						)}
					/>
				</span>
				<Icon className="size-3.5 stroke-[2.5px]" />
				<span className="uppercase tracking-wider">{label}</span>
			</div>

			{showDetails && (lastAccruedDate || nextAccrualDate) && (
				<div className="flex flex-col px-1 font-medium text-[10px] text-muted-foreground/80">
					{lastAccruedDate && (
						<span className="flex items-center gap-1">
							Last:{" "}
							<span className="text-foreground/70">
								{formatDate(lastAccruedDate)}
							</span>
						</span>
					)}
					{nextAccrualDate && (
						<span className="flex items-center gap-1">
							Next:{" "}
							<span className="text-foreground/70">
								{formatDate(nextAccrualDate)}
							</span>
						</span>
					)}
				</div>
			)}
		</div>
	);
}

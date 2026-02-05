"use client";

import { Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type MICCapBadgeProps = {
	/**
	 * Optional CSS className for styling/overrides
	 */
	className?: string;
	/**
	 * The name of the capital class (e.g., "MICCAP-FLMIC/0")
	 */
	capitalClass: string;
	/**
	 * Visual variant
	 */
	variant?: "default" | "success" | "warning" | "danger" | "outline";
	/**
	 * Whether to show the icon
	 */
	showIcon?: boolean;
};

/**
 * A premium badge component for displaying MIC capital unit classes.
 * Features a subtle gradient and specific icons for capital management.
 */
export function MICCapBadge({
	className,
	capitalClass,
	variant = "default",
	showIcon = true,
}: MICCapBadgeProps) {
	// Custom premium styling based on variant
	const variantStyles = {
		default:
			"bg-linear-to-br from-slate-100 to-slate-200 text-slate-900 border-slate-300 dark:from-slate-800 dark:to-slate-900 dark:text-slate-100 dark:border-slate-700 shadow-sm",
		success:
			"bg-linear-to-br from-emerald-50 to-emerald-100 text-emerald-900 border-emerald-200 dark:from-emerald-900/40 dark:to-emerald-900/60 dark:text-emerald-50 dark:border-emerald-800 shadow-xs",
		warning:
			"bg-linear-to-br from-amber-50 to-amber-100 text-amber-900 border-amber-200 dark:from-amber-900/40 dark:to-amber-900/60 dark:text-amber-50 dark:border-amber-800 shadow-xs",
		danger:
			"bg-linear-to-br from-rose-50 to-rose-100 text-rose-900 border-rose-200 dark:from-rose-900/40 dark:to-rose-900/60 dark:text-rose-50 dark:border-rose-800 shadow-xs",
		outline:
			"bg-transparent border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400",
	};

	return (
		<Badge
			aria-label={`Capital Class: ${capitalClass}`}
			className={cn(
				"h-7 gap-1.5 px-2.5 py-0.5 font-bold text-[11px] uppercase tracking-tight transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
				variantStyles[variant],
				className
			)}
			variant="secondary"
		>
			{showIcon && (
				<Coins
					aria-hidden="true"
					className="size-3 stroke-[2.5px] opacity-80"
				/>
			)}
			<span className="truncate">{capitalClass}</span>
		</Badge>
	);
}

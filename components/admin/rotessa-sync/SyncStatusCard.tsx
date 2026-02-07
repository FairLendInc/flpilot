"use client";

import {
	AlertTriangle,
	CheckCircle2,
	Loader2,
	type LucideIcon,
	XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type SyncStatus = "healthy" | "syncing" | "partial" | "failed";

type StatusConfig = {
	icon: LucideIcon;
	label: string;
	iconClassName: string;
	cardClassName: string;
	animate?: boolean;
};

const statusConfig: Record<SyncStatus, StatusConfig> = {
	healthy: {
		icon: CheckCircle2,
		label: "Healthy",
		iconClassName: "text-emerald-500",
		cardClassName:
			"bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 dark:from-emerald-950/40 dark:to-emerald-900/20 dark:border-emerald-800",
	},
	syncing: {
		icon: Loader2,
		label: "Syncing...",
		iconClassName: "text-blue-500",
		cardClassName:
			"bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 dark:from-blue-950/40 dark:to-blue-900/20 dark:border-blue-800",
		animate: true,
	},
	partial: {
		icon: AlertTriangle,
		label: "Partial",
		iconClassName: "text-amber-500",
		cardClassName:
			"bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200 dark:from-amber-950/40 dark:to-amber-900/20 dark:border-amber-800",
	},
	failed: {
		icon: XCircle,
		label: "Failed",
		iconClassName: "text-red-500",
		cardClassName:
			"bg-gradient-to-br from-red-50 to-red-100/50 border-red-200 dark:from-red-950/40 dark:to-red-900/20 dark:border-red-800",
	},
};

type SyncStatusCardProps = {
	status: SyncStatus;
	message: string;
	details?: string;
	className?: string;
};

export function SyncStatusCard({
	status,
	message,
	details,
	className,
}: SyncStatusCardProps) {
	const config = statusConfig[status];
	const Icon = config.icon;

	return (
		<Card className={cn("overflow-hidden", config.cardClassName, className)}>
			<CardContent className="p-5">
				<div className="flex items-start gap-4">
					<div
						className={cn(
							"flex h-12 w-12 items-center justify-center rounded-xl",
							status === "healthy" && "bg-emerald-100 dark:bg-emerald-900/50",
							status === "syncing" && "bg-blue-100 dark:bg-blue-900/50",
							status === "partial" && "bg-amber-100 dark:bg-amber-900/50",
							status === "failed" && "bg-red-100 dark:bg-red-900/50"
						)}
					>
						<Icon
							className={cn(
								"h-6 w-6",
								config.iconClassName,
								config.animate && "animate-spin"
							)}
						/>
					</div>
					<div className="flex-1">
						<h3 className="font-semibold text-lg">{config.label}</h3>
						<p className="text-muted-foreground text-sm">{message}</p>
						{details && (
							<p className="mt-1 text-muted-foreground/70 text-xs">{details}</p>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

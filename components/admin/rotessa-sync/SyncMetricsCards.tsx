"use client";

import {
	ArrowUpRight,
	CheckCircle2,
	Clock,
	TrendingUp,
	XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
	title: string;
	value: string | number;
	subtitle?: string;
	icon: React.ReactNode;
	trend?: {
		direction: "up" | "down" | "neutral";
		label: string;
	};
	className?: string;
};

function MetricCard({
	title,
	value,
	subtitle,
	icon,
	trend,
	className,
}: MetricCardProps) {
	return (
		<Card className={cn("border-muted-foreground/10 bg-muted/30", className)}>
			<CardContent className="p-4">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
							{title}
						</p>
						<p className="mt-1 font-bold text-2xl tabular-nums">{value}</p>
						{subtitle && (
							<p className="mt-0.5 text-muted-foreground text-xs">{subtitle}</p>
						)}
						{trend && (
							<div
								className={cn(
									"mt-2 flex items-center gap-1 font-medium text-xs",
									trend.direction === "up" && "text-emerald-600",
									trend.direction === "down" && "text-red-600",
									trend.direction === "neutral" && "text-muted-foreground"
								)}
							>
								{trend.direction === "up" && (
									<ArrowUpRight className="h-3 w-3" />
								)}
								{trend.label}
							</div>
						)}
					</div>
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
						{icon}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

type LastSyncData = {
	completedAt: number;
	transactionsProcessed: number;
	errors: number;
};

type WeekMetrics = {
	totalSyncs: number;
	transactionsProcessed: number;
	ledgerTransactionsCreated: number;
	successRate: number;
	errors: number;
};

type SyncMetricsCardsProps = {
	lastSync: LastSyncData | null;
	weekMetrics: WeekMetrics | null;
	nextSyncTime?: string;
	className?: string;
};

function formatRelativeTime(timestamp: number): string {
	const now = Date.now();
	const diff = now - timestamp;
	const hours = Math.floor(diff / (1000 * 60 * 60));
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

	if (hours > 0) {
		return `${hours}h ${minutes}m ago`;
	}
	return `${minutes}m ago`;
}

export function SyncMetricsCards({
	lastSync,
	weekMetrics,
	nextSyncTime = "Daily at 11 PM UTC",
	className,
}: SyncMetricsCardsProps) {
	return (
		<div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
			{/* Last Sync */}
			<MetricCard
				icon={<CheckCircle2 className="h-5 w-5" />}
				subtitle={lastSync ? formatRelativeTime(lastSync.completedAt) : "—"}
				title="Last Sync"
				value={lastSync ? `${lastSync.transactionsProcessed} txns` : "—"}
			/>

			{/* Next Sync */}
			<MetricCard
				icon={<Clock className="h-5 w-5" />}
				subtitle="Scheduled"
				title="Next Sync"
				value={nextSyncTime}
			/>

			{/* This Week */}
			<MetricCard
				icon={<TrendingUp className="h-5 w-5" />}
				subtitle={`${weekMetrics?.ledgerTransactionsCreated ?? 0} ledger txns`}
				title="This Week"
				trend={
					weekMetrics
						? {
								direction:
									weekMetrics.successRate >= 99
										? "up"
										: weekMetrics.successRate >= 95
											? "neutral"
											: "down",
								label: `${weekMetrics.successRate.toFixed(1)}% success`,
							}
						: undefined
				}
				value={weekMetrics?.transactionsProcessed ?? 0}
			/>

			{/* Errors */}
			<MetricCard
				className={
					(weekMetrics?.errors ?? 0) > 0
						? "border-red-200 dark:border-red-800"
						: ""
				}
				icon={
					(weekMetrics?.errors ?? 0) > 0 ? (
						<XCircle className="h-5 w-5 text-red-500" />
					) : (
						<CheckCircle2 className="h-5 w-5 text-emerald-500" />
					)
				}
				subtitle="This week"
				title="Errors"
				value={weekMetrics?.errors ?? 0}
			/>
		</div>
	);
}

"use client";

import { formatDistanceToNow } from "date-fns";
import {
	AlertTriangle,
	CheckCircle2,
	Eye,
	Loader2,
	RefreshCw,
	XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type SyncLogStatus = "running" | "completed" | "partial" | "failed";
export type SyncLogType = "daily" | "manual";

export type SyncLog = {
	id: string;
	syncType: SyncLogType;
	status: SyncLogStatus;
	startedAt: number;
	completedAt?: number;
	triggeredBy?: string;
	metrics?: {
		transactionsProcessed: number;
		paymentsCreated: number;
		paymentsUpdated: number;
		ledgerTransactionsCreated: number;
		errors: number;
	};
};

type SyncHistoryTableProps = {
	logs: SyncLog[];
	onViewDetails: (logId: string) => void;
	onRetry?: (logId: string) => void;
	isLoading?: boolean;
};

const statusConfig: Record<
	SyncLogStatus,
	{
		icon: React.ElementType;
		label: string;
		className: string;
	}
> = {
	running: {
		icon: Loader2,
		label: "Running",
		className:
			"bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400",
	},
	completed: {
		icon: CheckCircle2,
		label: "Complete",
		className:
			"bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
	},
	partial: {
		icon: AlertTriangle,
		label: "Partial",
		className:
			"bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
	},
	failed: {
		icon: XCircle,
		label: "Failed",
		className:
			"bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400",
	},
};

function formatSyncTime(timestamp: number): {
	primary: string;
	secondary: string;
} {
	const date = new Date(timestamp);
	const now = new Date();
	const isToday = date.toDateString() === now.toDateString();
	const isYesterday =
		new Date(now.getTime() - 86400000).toDateString() === date.toDateString();

	const time = date.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
	});

	if (isToday) {
		return {
			primary: `Today ${time}`,
			secondary: formatDistanceToNow(date, { addSuffix: true }),
		};
	}
	if (isYesterday) {
		return {
			primary: `Yesterday ${time}`,
			secondary: "",
		};
	}

	return {
		primary: date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		}),
		secondary: time,
	};
}

export function SyncHistoryTable({
	logs,
	onViewDetails,
	onRetry,
	isLoading,
}: SyncHistoryTableProps) {
	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="flex flex-col items-center gap-3">
					<RefreshCw className="h-8 w-8 animate-spin text-muted-foreground/50" />
					<p className="text-muted-foreground text-sm">
						Loading sync history...
					</p>
				</div>
			</div>
		);
	}

	if (logs.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-12">
				<RefreshCw className="h-10 w-10 text-muted-foreground/30" />
				<div className="text-center">
					<p className="font-medium">No sync history</p>
					<p className="text-muted-foreground text-sm">
						Syncs will appear here after they run
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-lg border">
			<Table>
				<TableHeader>
					<TableRow className="bg-muted/30 hover:bg-muted/30">
						<TableHead className="font-semibold">Time</TableHead>
						<TableHead className="font-semibold">Type</TableHead>
						<TableHead className="font-semibold">Status</TableHead>
						<TableHead className="text-right font-semibold">
							Processed
						</TableHead>
						<TableHead className="text-right font-semibold">Errors</TableHead>
						<TableHead className="w-[100px]" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{logs.map((log) => {
						const config = statusConfig[log.status];
						const Icon = config.icon;
						const time = formatSyncTime(log.startedAt);

						return (
							<TableRow
								className="group cursor-pointer hover:bg-muted/50"
								key={log.id}
								onClick={() => onViewDetails(log.id)}
							>
								<TableCell>
									<div>
										<p className="font-medium text-sm">{time.primary}</p>
										{time.secondary && (
											<p className="text-muted-foreground text-xs">
												{time.secondary}
											</p>
										)}
									</div>
								</TableCell>
								<TableCell>
									<Badge
										className="capitalize"
										variant={log.syncType === "daily" ? "secondary" : "outline"}
									>
										{log.syncType === "daily" ? "CRON" : "Manual"}
									</Badge>
								</TableCell>
								<TableCell>
									<Badge
										className={cn(
											"gap-1.5 border font-medium",
											config.className
										)}
										variant="outline"
									>
										<Icon
											className={cn(
												"h-3 w-3",
												log.status === "running" && "animate-spin"
											)}
										/>
										{config.label}
									</Badge>
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{log.metrics?.transactionsProcessed ?? "—"}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{(log.metrics?.errors ?? 0) > 0 ? (
										<span className="font-medium text-red-600 dark:text-red-400">
											{log.metrics?.errors}
										</span>
									) : (
										<span className="text-muted-foreground">0</span>
									)}
								</TableCell>
								<TableCell>
									<div className="flex items-center justify-end gap-1">
										<Button
											className="h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"
											onClick={(e) => {
												e.stopPropagation();
												onViewDetails(log.id);
											}}
											size="sm"
											variant="ghost"
										>
											<Eye className="h-4 w-4" />
										</Button>
										{log.status === "failed" && onRetry && (
											<Button
												className="h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"
												onClick={(e) => {
													e.stopPropagation();
													onRetry(log.id);
												}}
												size="sm"
												variant="ghost"
											>
												<RefreshCw className="h-4 w-4" />
											</Button>
										)}
									</div>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}

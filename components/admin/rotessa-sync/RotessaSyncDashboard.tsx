"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ManualSyncDialog } from "./ManualSyncDialog";
import { SyncHistoryTable, type SyncLog } from "./SyncHistoryTable";
import { SyncLogDetailSheet } from "./SyncLogDetailSheet";
import { SyncMetricsCards } from "./SyncMetricsCards";
import { type SyncStatus, SyncStatusCard } from "./SyncStatusCard";

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

type RotessaSyncDashboardProps = {
	status: SyncStatus;
	statusMessage: string;
	statusDetails?: string;
	lastSync: LastSyncData | null;
	weekMetrics: WeekMetrics | null;
	syncLogs: SyncLog[];
	onManualSync: (params: {
		scope: "all" | "borrower" | "mortgage";
		scopeId?: string;
		dateRange: { startDate: string; endDate: string };
	}) => Promise<string>;
	onRetrySync: (syncLogId: string) => Promise<void>;
	onRefresh: () => void;
	isRefreshing?: boolean;
};

export function RotessaSyncDashboard({
	status,
	statusMessage,
	statusDetails,
	lastSync,
	weekMetrics,
	syncLogs,
	onManualSync,
	onRetrySync,
	onRefresh,
	isRefreshing,
}: RotessaSyncDashboardProps) {
	const [manualSyncOpen, setManualSyncOpen] = useState(false);
	const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null);
	const [isRetrying, setIsRetrying] = useState(false);

	const handleViewLog = (logId: string) => {
		const log = syncLogs.find((l) => l.id === logId);
		if (log) {
			setSelectedLog(log);
		}
	};

	const handleRetryFromTable = async (logId: string) => {
		await onRetrySync(logId);
	};

	const handleRetryFromSheet = async () => {
		if (!selectedLog) return;
		setIsRetrying(true);
		try {
			await onRetrySync(selectedLog.id);
		} finally {
			setIsRetrying(false);
		}
	};

	const handleStartSync = async (config: {
		scope: "all" | "borrower" | "mortgage";
		entityId?: string;
		dateRange: "default" | "custom";
		startDate?: Date;
		endDate?: Date;
	}): Promise<string> => {
		const startDate = config.startDate ?? new Date();
		const endDate = config.endDate ?? new Date();

		return onManualSync({
			scope: config.scope,
			scopeId: config.entityId,
			dateRange: {
				startDate: startDate.toISOString().split("T")[0],
				endDate: endDate.toISOString().split("T")[0],
			},
		});
	};

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Rotessa Sync</h1>
					<p className="mt-1 text-muted-foreground">
						Monitor and manage payment synchronization with Rotessa
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Button
						className="gap-2"
						disabled={isRefreshing}
						onClick={onRefresh}
						size="sm"
						variant="outline"
					>
						<RefreshCw
							className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
						/>
						Refresh
					</Button>
					<Button className="gap-2" onClick={() => setManualSyncOpen(true)}>
						<RefreshCw className="h-4 w-4" />
						Manual Sync
					</Button>
				</div>
			</div>

			{/* Status and Metrics */}
			<div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
				<SyncStatusCard
					details={statusDetails}
					message={statusMessage}
					status={status}
				/>
				<SyncMetricsCards lastSync={lastSync} weekMetrics={weekMetrics} />
			</div>

			{/* Sync History */}
			<div className="space-y-4">
				<h2 className="font-semibold text-lg">Sync History</h2>
				<SyncHistoryTable
					logs={syncLogs}
					onRetry={handleRetryFromTable}
					onViewDetails={handleViewLog}
				/>
			</div>

			{/* Manual Sync Dialog */}
			<ManualSyncDialog
				onClose={() => setManualSyncOpen(false)}
				onStartSync={handleStartSync}
				open={manualSyncOpen}
			/>

			{/* Sync Log Detail Sheet */}
			<SyncLogDetailSheet
				isRetrying={isRetrying}
				onClose={() => setSelectedLog(null)}
				onRetry={handleRetryFromSheet}
				open={!!selectedLog}
				syncLog={selectedLog}
			/>
		</div>
	);
}

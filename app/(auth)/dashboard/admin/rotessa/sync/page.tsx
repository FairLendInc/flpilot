"use client";

import { useConvexAuth, useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
	RotessaSyncDashboard,
	type SyncLog,
	type SyncStatus,
} from "@/components/admin/rotessa-sync";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import { useAuthenticatedQuery } from "@/convex/lib/client";

export default function AdminRotessaSyncPage() {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();

	// Fetch sync status
	const syncStatus = useAuthenticatedQuery(api.rotessaSync.getSyncStatus, {});

	// Fetch recent sync logs
	const syncLogsResult = useAuthenticatedQuery(
		api.rotessaSync.getRecentSyncLogs,
		{ limit: 20 }
	);

	// Fetch week metrics
	const weekMetrics = useAuthenticatedQuery(api.rotessaSync.getWeekMetrics, {});

	// Manual sync trigger
	const triggerManualSync = useMutation(api.rotessaSync.triggerManualSync);

	// Loading states
	if (authLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground">Authentication required</p>
			</div>
		);
	}

	// Determine dashboard status from sync status
	const dashboardStatus: SyncStatus =
		syncStatus?.status === "syncing"
			? "syncing"
			: syncStatus?.status === "healthy"
				? "healthy"
				: syncStatus?.status === "partial"
					? "partial"
					: syncStatus?.status === "failed"
						? "failed"
						: "healthy";

	// Transform sync logs to expected format
	const syncLogs: SyncLog[] = (syncLogsResult ?? []).map(
		(log: NonNullable<typeof syncLogsResult>[number]) => ({
			id: log._id,
			syncType: log.syncType,
			status: log.status,
			startedAt: log.startedAt,
			completedAt: log.completedAt,
			triggeredBy: log.triggeredBy,
			metrics: log.metrics
				? {
						transactionsProcessed: log.metrics.transactionsProcessed ?? 0,
						paymentsCreated: log.metrics.paymentsCreated ?? 0,
						paymentsUpdated: log.metrics.paymentsUpdated ?? 0,
						ledgerTransactionsCreated:
							log.metrics.ledgerTransactionsCreated ?? 0,
						errors: log.metrics.errors ?? 0,
					}
				: undefined,
		})
	);

	const handleManualSync = async (params: {
		scope: "all" | "borrower" | "mortgage";
		scopeId?: string;
		dateRange: { startDate: string; endDate: string };
	}): Promise<string> => {
		try {
			const syncLogId = await triggerManualSync({
				scope: params.scope,
				entityId: params.scopeId,
				dateRange: params.dateRange,
			});

			toast.success("Sync started", {
				description: "The sync process has been initiated",
			});

			return syncLogId;
		} catch (error) {
			toast.error("Failed to start sync", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
			throw error;
		}
	};

	const handleRetrySync = async (_syncLogId: string) => {
		// Retry is not directly supported - suggest creating a new sync
		toast.info("Retry not available", {
			description: "Please start a new sync to retry",
		});
	};

	const handleRefresh = () => {
		// Convex queries are reactive - they refresh automatically
		toast.info("Data refreshes automatically");
	};

	// Calculate total syncs for the week
	const recentCompletedSyncs = syncLogs.filter(
		(log) =>
			log.status === "completed" &&
			log.startedAt > Date.now() - 7 * 24 * 60 * 60 * 1000
	).length;

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Rotessa Sync</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				{syncStatus && weekMetrics ? (
					<RotessaSyncDashboard
						isRefreshing={dashboardStatus === "syncing"}
						lastSync={syncStatus.lastSync ?? null}
						onManualSync={handleManualSync}
						onRefresh={handleRefresh}
						onRetrySync={handleRetrySync}
						status={dashboardStatus}
						statusDetails={
							syncStatus.lastSync
								? `Last sync completed with ${syncStatus.lastSync.errors} errors`
								: "No sync history"
						}
						statusMessage={syncStatus.message}
						syncLogs={syncLogs}
						weekMetrics={{
							totalSyncs: recentCompletedSyncs,
							transactionsProcessed: weekMetrics.totalSynced,
							ledgerTransactionsCreated: weekMetrics.ledgerTransactions,
							successRate: weekMetrics.successRate,
							errors: weekMetrics.errors,
						}}
					/>
				) : (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				)}
			</div>
		</>
	);
}

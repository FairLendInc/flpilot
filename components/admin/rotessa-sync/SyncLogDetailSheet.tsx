"use client";

import {
	AlertTriangle,
	CheckCircle2,
	ClipboardCopy,
	Clock,
	Loader2,
	RefreshCw,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { SyncLog, SyncLogStatus } from "./SyncHistoryTable";

type Transaction = {
	id: string;
	rotessaId: string;
	borrowerName: string;
	amount: number;
	status: "cleared" | "pending" | "failed";
	ledgerTransactionId?: string;
};

type SyncError = {
	transactionId: string;
	error: string;
	timestamp: number;
	context?: {
		scheduleId?: string;
		borrowerName?: string;
		amount?: number;
	};
};

type SyncLogDetail = SyncLog & {
	dateRange?: {
		startDate: string;
		endDate: string;
	};
	triggeredByName?: string;
	errors?: SyncError[];
};

type SyncLogDetailSheetProps = {
	open: boolean;
	onClose: () => void;
	syncLog: SyncLogDetail | null;
	transactions?: Transaction[];
	onRetry?: () => void;
	isRetrying?: boolean;
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
		className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
	},
	completed: {
		icon: CheckCircle2,
		label: "Completed",
		className:
			"bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
	},
	partial: {
		icon: AlertTriangle,
		label: "Partial",
		className:
			"bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
	},
	failed: {
		icon: XCircle,
		label: "Failed",
		className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
	},
};

function formatDuration(startedAt: number, completedAt?: number): string {
	if (!completedAt) return "—";
	const diff = completedAt - startedAt;
	const minutes = Math.floor(diff / 60000);
	const seconds = Math.floor((diff % 60000) / 1000);
	if (minutes > 0) {
		return `${minutes}m ${seconds}s`;
	}
	return `${seconds}s`;
}

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-CA", {
		style: "currency",
		currency: "CAD",
	}).format(amount);
}

export function SyncLogDetailSheet({
	open,
	onClose,
	syncLog,
	transactions = [],
	onRetry,
	isRetrying,
}: SyncLogDetailSheetProps) {
	const [activeTab, setActiveTab] = useState<"transactions" | "errors">(
		"transactions"
	);

	if (!syncLog) return null;

	const config = statusConfig[syncLog.status];
	const Icon = config.icon;
	const hasErrors = (syncLog.errors?.length ?? 0) > 0;

	const handleCopyId = async () => {
		await navigator.clipboard.writeText(syncLog.id);
		toast.success("Sync ID copied");
	};

	return (
		<Sheet onOpenChange={(o) => !o && onClose()} open={open}>
			<SheetContent className="w-full overflow-y-auto border-none backdrop-blur-xl sm:max-w-[640px] dark:bg-slate-900/95">
				<SheetHeader className="pb-4">
					<div className="flex items-start justify-between">
						<div>
							<SheetTitle className="font-bold text-xl">
								Sync Details
							</SheetTitle>
							<SheetDescription className="mt-1 flex items-center gap-2">
								<span className="font-mono text-xs">{syncLog.id}</span>
								<Button
									className="h-5 w-5 p-0"
									onClick={handleCopyId}
									size="sm"
									variant="ghost"
								>
									<ClipboardCopy className="h-3 w-3" />
								</Button>
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				{/* Status Card */}
				<Card className={cn("mb-6", config.className)}>
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<Icon
								className={cn(
									"h-6 w-6",
									syncLog.status === "running" && "animate-spin"
								)}
							/>
							<div>
								<p className="font-semibold">
									{config.label}{" "}
									{syncLog.syncType === "daily" ? "Daily CRON" : "Manual"} Sync
								</p>
								<div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
									<span>
										Started:{" "}
										{new Date(syncLog.startedAt).toLocaleString("en-US", {
											month: "short",
											day: "numeric",
											year: "numeric",
											hour: "numeric",
											minute: "2-digit",
										})}
									</span>
									{syncLog.completedAt && (
										<span>
											Duration:{" "}
											{formatDuration(syncLog.startedAt, syncLog.completedAt)}
										</span>
									)}
								</div>
								{syncLog.triggeredByName && (
									<p className="mt-1 text-sm">
										Triggered by: {syncLog.triggeredByName}
									</p>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Error Alert */}
				{hasErrors && (
					<div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
						<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
						<div>
							<p className="font-medium text-amber-800 dark:text-amber-200">
								{syncLog.errors?.length} transaction
								{syncLog.errors?.length === 1 ? "" : "s"} failed to process
							</p>
							<p className="mt-1 text-amber-700 text-sm dark:text-amber-300">
								Review the errors below for details.
							</p>
						</div>
					</div>
				)}

				{/* Metrics */}
				{syncLog.metrics && (
					<div className="mb-6 grid grid-cols-4 gap-3">
						<Card className="bg-muted/30">
							<CardContent className="p-3 text-center">
								<p className="font-bold text-2xl tabular-nums">
									{syncLog.metrics.transactionsProcessed}
								</p>
								<p className="text-muted-foreground text-xs">Processed</p>
							</CardContent>
						</Card>
						<Card className="bg-muted/30">
							<CardContent className="p-3 text-center">
								<p className="font-bold text-2xl tabular-nums">
									{syncLog.metrics.paymentsCreated}
								</p>
								<p className="text-muted-foreground text-xs">Created</p>
							</CardContent>
						</Card>
						<Card className="bg-muted/30">
							<CardContent className="p-3 text-center">
								<p className="font-bold text-2xl tabular-nums">
									{syncLog.metrics.paymentsUpdated}
								</p>
								<p className="text-muted-foreground text-xs">Updated</p>
							</CardContent>
						</Card>
						<Card className="bg-muted/30">
							<CardContent className="p-3 text-center">
								<p className="font-bold text-2xl tabular-nums">
									{syncLog.metrics.ledgerTransactionsCreated}
								</p>
								<p className="text-muted-foreground text-xs">Ledger</p>
							</CardContent>
						</Card>
					</div>
				)}

				{/* Tabs */}
				<Tabs
					onValueChange={(v) => setActiveTab(v as typeof activeTab)}
					value={activeTab}
				>
					<TabsList className="grid w-full grid-cols-2 bg-muted/50">
						<TabsTrigger value="transactions">Transactions</TabsTrigger>
						<TabsTrigger value="errors">
							Errors
							{hasErrors && (
								<Badge
									className="ml-1.5 h-5 min-w-[20px] justify-center bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
									variant="secondary"
								>
									{syncLog.errors?.length}
								</Badge>
							)}
						</TabsTrigger>
					</TabsList>

					{/* Transactions Tab */}
					<TabsContent className="mt-4" value="transactions">
						{transactions.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
								<Clock className="h-10 w-10 text-muted-foreground/30" />
								<p className="text-muted-foreground text-sm">
									No transaction details available
								</p>
							</div>
						) : (
							<div className="overflow-hidden rounded-lg border">
								<Table>
									<TableHeader>
										<TableRow className="bg-muted/30">
											<TableHead className="font-semibold">
												Rotessa ID
											</TableHead>
											<TableHead className="font-semibold">Borrower</TableHead>
											<TableHead className="text-right font-semibold">
												Amount
											</TableHead>
											<TableHead className="font-semibold">Status</TableHead>
											<TableHead className="font-semibold">Ledger</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{transactions.map((txn) => (
											<TableRow key={txn.id}>
												<TableCell className="font-mono text-xs">
													{txn.rotessaId}
												</TableCell>
												<TableCell>{txn.borrowerName}</TableCell>
												<TableCell className="text-right font-medium tabular-nums">
													{formatCurrency(txn.amount)}
												</TableCell>
												<TableCell>
													<Badge
														className={cn(
															"border",
															txn.status === "cleared" &&
																"border-emerald-200 bg-emerald-50 text-emerald-700",
															txn.status === "pending" &&
																"border-amber-200 bg-amber-50 text-amber-700",
															txn.status === "failed" &&
																"border-red-200 bg-red-50 text-red-700"
														)}
														variant="outline"
													>
														{txn.status}
													</Badge>
												</TableCell>
												<TableCell className="font-mono text-muted-foreground text-xs">
													{txn.ledgerTransactionId
														? `${txn.ledgerTransactionId.slice(0, 10)}...`
														: "—"}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</TabsContent>

					{/* Errors Tab */}
					<TabsContent className="mt-4 space-y-3" value="errors">
						{hasErrors ? (
							syncLog.errors?.map((error) => (
								<Card
									className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
									key={`${error.transactionId}-${error.timestamp}`}
								>
									<CardContent className="p-4">
										<div className="flex items-start gap-3">
											<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
											<div className="min-w-0 flex-1">
												<p className="font-medium text-sm">
													{error.transactionId}
												</p>
												<p className="mt-1 text-muted-foreground text-sm">
													{error.error}
												</p>
												{error.context && (
													<div className="mt-2 space-y-0.5 text-muted-foreground text-xs">
														{error.context.borrowerName && (
															<p>Borrower: {error.context.borrowerName}</p>
														)}
														{error.context.scheduleId && (
															<p>Schedule: {error.context.scheduleId}</p>
														)}
														{error.context.amount && (
															<p>
																Amount: {formatCurrency(error.context.amount)}
															</p>
														)}
													</div>
												)}
												<p className="mt-2 text-muted-foreground/70 text-xs">
													{new Date(error.timestamp).toLocaleTimeString(
														"en-US",
														{
															hour: "numeric",
															minute: "2-digit",
															second: "2-digit",
														}
													)}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							))
						) : (
							<div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
								<CheckCircle2 className="h-10 w-10 text-emerald-500" />
								<p className="text-muted-foreground text-sm">
									No errors in this sync
								</p>
							</div>
						)}
					</TabsContent>
				</Tabs>

				{/* Footer */}
				<Separator className="mt-8" />
				<div className="flex items-center justify-between py-4">
					{syncLog.status === "failed" && onRetry && (
						<Button
							className="gap-1.5"
							disabled={isRetrying}
							onClick={onRetry}
							variant="outline"
						>
							<RefreshCw
								className={cn("h-4 w-4", isRetrying && "animate-spin")}
							/>
							{isRetrying ? "Retrying..." : "Retry Sync"}
						</Button>
					)}
					<div className="flex-1" />
					<Button onClick={onClose}>Close</Button>
				</div>
			</SheetContent>
		</Sheet>
	);
}

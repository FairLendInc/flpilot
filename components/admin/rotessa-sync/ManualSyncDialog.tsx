"use client";

import { subDays } from "date-fns";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SyncScope = "all" | "borrower" | "mortgage";
type DateRangeType = "default" | "custom";

type SyncConfig = {
	scope: SyncScope;
	entityId?: string;
	dateRange: DateRangeType;
	startDate?: Date;
	endDate?: Date;
};

type ManualSyncDialogProps = {
	open: boolean;
	onClose: () => void;
	onStartSync: (config: SyncConfig) => Promise<string>;
	borrowers?: Array<{
		id: string;
		name: string;
		email: string;
		rotessaCustomerId?: string;
	}>;
	mortgages?: Array<{
		id: string;
		address: string;
		rotessaScheduleId?: string;
	}>;
};

type DialogState = "config" | "syncing" | "complete" | "error";

export function ManualSyncDialog({
	open,
	onClose,
	onStartSync,
	borrowers = [],
	mortgages = [],
}: ManualSyncDialogProps) {
	const [state, setState] = useState<DialogState>("config");
	const [scope, setScope] = useState<SyncScope>("all");
	const [entityId, setEntityId] = useState<string>("");
	const [dateRangeType, setDateRangeType] = useState<DateRangeType>("default");
	const [startDate, setStartDate] = useState<Date | undefined>(
		subDays(new Date(), 1)
	);
	const [endDate, setEndDate] = useState<Date | undefined>(new Date());
	const [syncLogId, setSyncLogId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Calculate date range warning
	const dateDiff =
		startDate && endDate
			? Math.ceil(
					(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
				)
			: 0;
	const showDateWarning = dateRangeType === "custom" && dateDiff > 30;

	const resetState = () => {
		setState("config");
		setScope("all");
		setEntityId("");
		setDateRangeType("default");
		setStartDate(subDays(new Date(), 1));
		setEndDate(new Date());
		setSyncLogId(null);
		setError(null);
	};

	const handleClose = () => {
		resetState();
		onClose();
	};

	const handleStartSync = async () => {
		setState("syncing");
		setError(null);

		try {
			const config: SyncConfig = {
				scope,
				entityId: scope !== "all" ? entityId : undefined,
				dateRange: dateRangeType,
				startDate: dateRangeType === "custom" ? startDate : undefined,
				endDate: dateRangeType === "custom" ? endDate : undefined,
			};

			const logId = await onStartSync(config);
			setSyncLogId(logId);
			setState("complete");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Sync failed");
			setState("error");
		}
	};

	const isValid =
		(scope === "all" || entityId) &&
		(dateRangeType === "default" ||
			(dateRangeType === "custom" &&
				startDate &&
				endDate &&
				startDate <= endDate));

	return (
		<Dialog onOpenChange={(o) => !o && handleClose()} open={open}>
			<DialogContent className="sm:max-w-[520px]">
				<DialogHeader>
					<DialogTitle>Manual Rotessa Sync</DialogTitle>
					<DialogDescription>
						{state === "config" &&
							"Trigger a manual sync to fetch the latest payment data from Rotessa."}
						{state === "syncing" && "Processing transactions from Rotessa..."}
						{state === "complete" && "Sync completed successfully."}
						{state === "error" && "Sync encountered an error."}
					</DialogDescription>
				</DialogHeader>

				{/* Config State */}
				{state === "config" && (
					<div className="space-y-6 py-4">
						{/* Scope Selection */}
						<div className="space-y-3">
							<Label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
								Sync Scope
							</Label>
							<RadioGroup
								className="space-y-2"
								onValueChange={(v) => {
									setScope(v as SyncScope);
									setEntityId("");
								}}
								value={scope}
							>
								<label
									className={cn(
										"flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
										scope === "all"
											? "border-primary bg-primary/5"
											: "hover:bg-muted/50"
									)}
									htmlFor="sync-scope-all"
								>
									<RadioGroupItem
										className="mt-0.5"
										id="sync-scope-all"
										value="all"
									/>
									<div>
										<p className="font-medium text-sm">All Transactions</p>
										<p className="text-muted-foreground text-xs">
											Sync all borrowers and mortgages
										</p>
									</div>
								</label>
								<label
									className={cn(
										"flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
										scope === "borrower"
											? "border-primary bg-primary/5"
											: "hover:bg-muted/50"
									)}
									htmlFor="sync-scope-borrower"
								>
									<RadioGroupItem
										className="mt-0.5"
										id="sync-scope-borrower"
										value="borrower"
									/>
									<div className="flex-1">
										<p className="font-medium text-sm">Specific Borrower</p>
										<p className="text-muted-foreground text-xs">
											Sync transactions for one borrower
										</p>
										{scope === "borrower" && (
											<Select onValueChange={setEntityId} value={entityId}>
												<SelectTrigger className="mt-2 h-9">
													<SelectValue placeholder="Select borrower..." />
												</SelectTrigger>
												<SelectContent>
													{borrowers.map((b) => (
														<SelectItem key={b.id} value={b.id}>
															<span>{b.name}</span>
															{b.rotessaCustomerId && (
																<span className="ml-2 font-mono text-muted-foreground text-xs">
																	{b.rotessaCustomerId}
																</span>
															)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									</div>
								</label>
								<label
									className={cn(
										"flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
										scope === "mortgage"
											? "border-primary bg-primary/5"
											: "hover:bg-muted/50"
									)}
									htmlFor="sync-scope-mortgage"
								>
									<RadioGroupItem
										className="mt-0.5"
										id="sync-scope-mortgage"
										value="mortgage"
									/>
									<div className="flex-1">
										<p className="font-medium text-sm">Specific Mortgage</p>
										<p className="text-muted-foreground text-xs">
											Sync transactions for one mortgage schedule
										</p>
										{scope === "mortgage" && (
											<Select onValueChange={setEntityId} value={entityId}>
												<SelectTrigger className="mt-2 h-9">
													<SelectValue placeholder="Select mortgage..." />
												</SelectTrigger>
												<SelectContent>
													{mortgages.map((m) => (
														<SelectItem key={m.id} value={m.id}>
															<span>{m.address}</span>
															{m.rotessaScheduleId && (
																<span className="ml-2 font-mono text-muted-foreground text-xs">
																	{m.rotessaScheduleId}
																</span>
															)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									</div>
								</label>
							</RadioGroup>
						</div>

						{/* Date Range */}
						<div className="space-y-3">
							<Label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
								Date Range
							</Label>
							<RadioGroup
								className="space-y-2"
								onValueChange={(v) => setDateRangeType(v as DateRangeType)}
								value={dateRangeType}
							>
								<label
									className={cn(
										"flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
										dateRangeType === "default"
											? "border-primary bg-primary/5"
											: "hover:bg-muted/50"
									)}
									htmlFor="date-range-default"
								>
									<RadioGroupItem id="date-range-default" value="default" />
									<p className="font-medium text-sm">Default (Last 24 hours)</p>
								</label>
								<label
									className={cn(
										"flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
										dateRangeType === "custom"
											? "border-primary bg-primary/5"
											: "hover:bg-muted/50"
									)}
									htmlFor="date-range-custom"
								>
									<RadioGroupItem
										className="mt-0.5"
										id="date-range-custom"
										value="custom"
									/>
									<div className="flex-1">
										<p className="font-medium text-sm">Custom Range</p>
										{dateRangeType === "custom" && (
											<div className="mt-3 flex gap-3">
												<div className="flex-1">
													<Label className="text-muted-foreground text-xs">
														Start Date
													</Label>
													<DatePicker
														date={startDate}
														onDateChange={setStartDate}
													/>
												</div>
												<div className="flex-1">
													<Label className="text-muted-foreground text-xs">
														End Date
													</Label>
													<DatePicker
														date={endDate}
														onDateChange={setEndDate}
													/>
												</div>
											</div>
										)}
									</div>
								</label>
							</RadioGroup>
							{showDateWarning && (
								<div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
									<AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
									<p className="text-amber-700 text-xs dark:text-amber-300">
										Range exceeds 30 days. This may take several minutes.
									</p>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Syncing State */}
				{state === "syncing" && (
					<div className="flex flex-col items-center justify-center gap-4 py-12">
						<div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/50">
							<Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
						</div>
						<div className="text-center">
							<p className="font-medium">Syncing...</p>
							<p className="mt-1 text-muted-foreground text-sm">
								Processing transactions from Rotessa
							</p>
						</div>
						<div className="text-muted-foreground text-xs">
							Scope: {scope === "all" ? "All" : entityId}
						</div>
					</div>
				)}

				{/* Complete State */}
				{state === "complete" && (
					<div className="flex flex-col items-center justify-center gap-4 py-8">
						<div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
							<CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
						</div>
						<div className="text-center">
							<p className="font-semibold text-lg">Sync Complete</p>
							<p className="mt-1 text-muted-foreground text-sm">
								The sync has been scheduled and is running in the background.
							</p>
						</div>
						{syncLogId && (
							<div className="font-mono text-muted-foreground text-xs">
								Log ID: {syncLogId}
							</div>
						)}
					</div>
				)}

				{/* Error State */}
				{state === "error" && (
					<div className="flex flex-col items-center justify-center gap-4 py-8">
						<div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
							<AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
						</div>
						<div className="text-center">
							<p className="font-semibold text-lg">Sync Failed</p>
							<p className="mt-1 text-muted-foreground text-sm">
								{error || "An unexpected error occurred"}
							</p>
						</div>
					</div>
				)}

				<DialogFooter>
					{state === "config" && (
						<>
							<Button onClick={handleClose} variant="outline">
								Cancel
							</Button>
							<Button disabled={!isValid} onClick={handleStartSync}>
								Start Sync
							</Button>
						</>
					)}
					{state === "syncing" && (
						<Button disabled variant="outline">
							Running in background...
						</Button>
					)}
					{(state === "complete" || state === "error") && (
						<>
							{state === "complete" && syncLogId && (
								<Button variant="outline">View Log</Button>
							)}
							<Button onClick={handleClose}>Done</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

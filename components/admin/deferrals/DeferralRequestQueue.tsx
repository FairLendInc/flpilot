"use client";

import { CheckCircle2, Clock, Filter, RefreshCw, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DeferralApproveDialog } from "./DeferralApproveDialog";
import { DeferralRejectDialog } from "./DeferralRejectDialog";
import {
	type DeferralRequest,
	DeferralRequestCard,
	type DeferralRequestStatus,
} from "./DeferralRequestCard";

type DeferralRequestQueueProps = {
	requests: DeferralRequest[];
	onApprove: (requestId: string) => Promise<void>;
	onReject: (requestId: string, reason: string) => Promise<void>;
	onRefresh: () => void;
	isRefreshing?: boolean;
};

type StatusFilter = "all" | DeferralRequestStatus;

const statusFilters: { value: StatusFilter; label: string; count?: number }[] =
	[
		{ value: "all", label: "All Requests" },
		{ value: "pending", label: "Pending Review" },
		{ value: "approved", label: "Approved" },
		{ value: "rejected", label: "Rejected" },
	];

export function DeferralRequestQueue({
	requests,
	onApprove,
	onReject,
	onRefresh,
	isRefreshing,
}: DeferralRequestQueueProps) {
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
	const [isProcessing, setIsProcessing] = useState(false);
	const [approveDialogRequest, setApproveDialogRequest] =
		useState<DeferralRequest | null>(null);
	const [rejectDialogRequest, setRejectDialogRequest] =
		useState<DeferralRequest | null>(null);

	const filteredRequests =
		statusFilter === "all"
			? requests
			: requests.filter((r) => r.status === statusFilter);

	const pendingCount = requests.filter((r) => r.status === "pending").length;

	const handleApprove = (requestId: string) => {
		const request = requests.find((r) => r.id === requestId);
		if (request) {
			setApproveDialogRequest(request);
		}
	};

	const handleReject = (requestId: string) => {
		const request = requests.find((r) => r.id === requestId);
		if (request) {
			setRejectDialogRequest(request);
		}
	};

	const handleConfirmApprove = async () => {
		if (!approveDialogRequest) return;

		setIsProcessing(true);
		try {
			await onApprove(approveDialogRequest.id);
			toast.success("Deferral approved", {
				description: `Payment rescheduled for ${approveDialogRequest.borrowerName}`,
			});
			setApproveDialogRequest(null);
		} catch (error) {
			toast.error("Failed to approve deferral", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		} finally {
			setIsProcessing(false);
		}
	};

	const handleConfirmReject = async (reason: string) => {
		if (!rejectDialogRequest) return;

		setIsProcessing(true);
		try {
			await onReject(rejectDialogRequest.id, reason);
			toast.success("Deferral rejected", {
				description: "Borrower has been notified",
			});
			setRejectDialogRequest(null);
		} catch (error) {
			toast.error("Failed to reject deferral", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">
						Deferral Requests
					</h1>
					<p className="mt-1 text-muted-foreground">
						Review and process borrower payment deferral requests
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
							className={cn("h-4 w-4", isRefreshing && "animate-spin")}
						/>
						Refresh
					</Button>
				</div>
			</div>

			{/* Stats cards */}
			<div className="grid gap-4 sm:grid-cols-3">
				<Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
								<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
							</div>
							<div>
								<p className="font-bold text-2xl">{pendingCount}</p>
								<p className="text-muted-foreground text-sm">Pending Review</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
								<CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
							</div>
							<div>
								<p className="font-bold text-2xl">
									{requests.filter((r) => r.status === "approved").length}
								</p>
								<p className="text-muted-foreground text-sm">Approved</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950">
								<XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
							</div>
							<div>
								<p className="font-bold text-2xl">
									{requests.filter((r) => r.status === "rejected").length}
								</p>
								<p className="text-muted-foreground text-sm">Rejected</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filter bar */}
			<div className="flex items-center gap-3">
				<div className="flex items-center gap-2">
					<Filter className="h-4 w-4 text-muted-foreground" />
					<span className="font-medium text-sm">Status:</span>
				</div>
				<Select
					onValueChange={(v) => setStatusFilter(v as StatusFilter)}
					value={statusFilter}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{statusFilters.map((filter) => (
							<SelectItem key={filter.value} value={filter.value}>
								<div className="flex items-center gap-2">
									{filter.label}
									{filter.value === "pending" && pendingCount > 0 && (
										<Badge
											className="h-5 min-w-5 justify-center bg-amber-100 text-amber-700"
											variant="secondary"
										>
											{pendingCount}
										</Badge>
									)}
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<span className="text-muted-foreground text-sm">
					Showing {filteredRequests.length} request
					{filteredRequests.length !== 1 ? "s" : ""}
				</span>
			</div>

			{/* Request list */}
			{filteredRequests.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-lg border bg-muted/20 py-16 text-center">
					<CheckCircle2 className="mb-4 h-12 w-12 text-muted-foreground/30" />
					<h3 className="mb-1 font-semibold text-lg">
						{statusFilter === "pending"
							? "No Pending Requests"
							: "No Requests Found"}
					</h3>
					<p className="max-w-sm text-muted-foreground text-sm">
						{statusFilter === "pending"
							? "All deferral requests have been processed. Check back later for new requests."
							: "No deferral requests match the selected filter."}
					</p>
				</div>
			) : (
				<div className="space-y-4">
					{filteredRequests.map((request) => (
						<DeferralRequestCard
							isProcessing={isProcessing}
							key={request.id}
							onApprove={handleApprove}
							onReject={handleReject}
							request={request}
						/>
					))}
				</div>
			)}

			{/* Dialogs */}
			<DeferralApproveDialog
				isProcessing={isProcessing}
				onClose={() => setApproveDialogRequest(null)}
				onConfirm={handleConfirmApprove}
				open={!!approveDialogRequest}
				request={
					approveDialogRequest
						? {
								borrowerName: approveDialogRequest.borrowerName,
								propertyAddress: approveDialogRequest.propertyAddress,
								originalPaymentDate: approveDialogRequest.originalPaymentDate,
								requestedDeferralDate:
									approveDialogRequest.requestedDeferralDate,
								amount: approveDialogRequest.originalPaymentAmount,
							}
						: null
				}
			/>

			<DeferralRejectDialog
				isProcessing={isProcessing}
				onClose={() => setRejectDialogRequest(null)}
				onConfirm={handleConfirmReject}
				open={!!rejectDialogRequest}
				request={
					rejectDialogRequest
						? {
								borrowerName: rejectDialogRequest.borrowerName,
								propertyAddress: rejectDialogRequest.propertyAddress,
								originalPaymentDate: rejectDialogRequest.originalPaymentDate,
								requestedDeferralDate:
									rejectDialogRequest.requestedDeferralDate,
								amount: rejectDialogRequest.originalPaymentAmount,
							}
						: null
				}
			/>
		</div>
	);
}

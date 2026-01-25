/**
 * Ownership Transfer Review Component
 *
 * Displays pending ownership transfer details for admin review.
 * Shows current and projected cap table, transfer details, and approve/reject actions.
 */

"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useAction, useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import {
	AlertTriangle,
	ArrowRight,
	Check,
	CheckCircle2,
	ChevronRight,
	ClipboardCheck,
	Loader2,
	User,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// ============================================================================
// Types
// ============================================================================

type OwnershipTransferReviewProps = {
	dealId: Id<"deals">;
	onApproved?: () => void;
	onRejected?: () => void;
};

type OwnershipEntry = {
	ownerId: "fairlend" | Id<"users">;
	percentage: number;
	ownerName: string;
};

// ============================================================================
// Sub-components
// ============================================================================

function OwnershipBar({
	ownership,
	label,
}: {
	ownership: OwnershipEntry[];
	label: string;
}) {
	const sortedOwnership = [...ownership].sort(
		(a, b) => b.percentage - a.percentage
	);
	const colors = [
		"bg-primary",
		"bg-blue-500",
		"bg-emerald-500",
		"bg-amber-500",
		"bg-purple-500",
	];

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<span className="text-muted-foreground text-sm">{label}</span>
				<span className="font-medium text-sm">100%</span>
			</div>
			<div className="flex h-6 w-full overflow-hidden rounded-full">
				{sortedOwnership.map((entry, idx) => (
					<TooltipProvider key={`${String(entry.ownerId)}-${idx}`}>
						<Tooltip>
							<TooltipTrigger asChild>
								<div
									className={`${colors[idx % colors.length]} flex items-center justify-center text-primary-foreground text-xs transition-all`}
									style={{ width: `${entry.percentage}%` }}
								>
									{entry.percentage >= 10 && `${entry.percentage.toFixed(1)}%`}
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p className="font-semibold">{entry.ownerName}</p>
								<p>{entry.percentage.toFixed(2)}%</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				))}
			</div>
		</div>
	);
}

function OwnershipTable({ ownership }: { ownership: OwnershipEntry[] }) {
	const sortedOwnership = [...ownership].sort(
		(a, b) => b.percentage - a.percentage
	);

	return (
		<div className="space-y-2">
			{sortedOwnership.map((entry, idx) => (
				<div
					className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
					key={`${String(entry.ownerId)}-${idx}`}
				>
					<div className="flex items-center gap-3">
						<div
							className={`flex h-8 w-8 items-center justify-center rounded-full ${
								entry.ownerId === "fairlend"
									? "bg-primary text-primary-foreground"
									: "bg-blue-500 text-white"
							}`}
						>
							{entry.ownerId === "fairlend" ? (
								<span className="font-bold text-xs">FL</span>
							) : (
								<User className="h-4 w-4" />
							)}
						</div>
						<div>
							<p className="font-medium text-sm">{entry.ownerName}</p>
							<p className="text-muted-foreground text-xs">
								{entry.ownerId === "fairlend" ? "Platform" : "Investor"}
							</p>
						</div>
					</div>
					<div className="text-right">
						<p className="font-semibold">{entry.percentage.toFixed(2)}%</p>
					</div>
				</div>
			))}
		</div>
	);
}

function TransferArrow({
	from,
	to,
	percentage,
}: {
	from: string;
	to: string;
	percentage: number;
}) {
	return (
		<div className="flex flex-col items-center justify-center py-4">
			<div className="flex items-center gap-4">
				<div className="rounded-lg bg-muted px-4 py-2 text-center">
					<p className="font-medium text-sm">{from}</p>
					<p className="text-muted-foreground text-xs">Source</p>
				</div>
				<div className="flex flex-col items-center">
					<div className="relative">
						<div className="absolute inset-0 flex items-center justify-center">
							<ChevronRight className="h-5 w-5 animate-pulse text-primary" />
						</div>
						<ArrowRight className="h-8 w-8 text-primary" />
					</div>
					<Badge className="mt-1" variant="secondary">
						{percentage.toFixed(2)}%
					</Badge>
				</div>
				<div className="rounded-lg bg-primary/10 px-4 py-2 text-center">
					<p className="font-medium text-primary text-sm">{to}</p>
					<p className="text-muted-foreground text-xs">Destination</p>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// Main Component
// ============================================================================

// ============================================================================
// Main Component (Container)
// ============================================================================

export function OwnershipTransferReview({
	dealId,
	onApproved,
	onRejected,
}: OwnershipTransferReviewProps) {
	const { user, loading: authLoading } = useAuth();

	// Mutations
	const transitionDeal = useMutation(api.deals.transitionDealState);
	const fetchOwnershipPreview = useAction(
		api.pendingOwnershipTransfers.getOwnershipPreview
	);

	// Queries
	const pendingTransfer = useQuery(
		api.pendingOwnershipTransfers.getPendingTransferByDeal,
		authLoading || !user ? "skip" : { dealId }
	);

	const [ownershipPreview, setOwnershipPreview] = useState<
		| typeof api.pendingOwnershipTransfers.getOwnershipPreview._returnType
		| null
		| undefined
	>(undefined);

	useEffect(() => {
		if (authLoading || !user || !pendingTransfer?._id) {
			return;
		}

		let cancelled = false;
		setOwnershipPreview(undefined);

		fetchOwnershipPreview({ transferId: pendingTransfer._id })
			.then((data) => {
				if (!cancelled) {
					setOwnershipPreview(data);
				}
			})
			.catch(() => {
				if (!cancelled) {
					setOwnershipPreview(null);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [authLoading, fetchOwnershipPreview, pendingTransfer?._id, user]);

	// Loading state
	if (
		authLoading ||
		pendingTransfer === undefined ||
		ownershipPreview === undefined
	) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="mt-2 h-4 w-64" />
				</CardHeader>
				<CardContent className="space-y-6">
					<Skeleton className="h-24 w-full" />
					<Skeleton className="h-32 w-full" />
					<div className="flex gap-4">
						<Skeleton className="h-10 w-32" />
						<Skeleton className="h-10 w-32" />
					</div>
				</CardContent>
			</Card>
		);
	}

	// Not found or null
	if (pendingTransfer === null || ownershipPreview === null) {
		return null;
	}

	const handleApprove = async () => {
		await transitionDeal({
			dealId,
			event: { type: "CONFIRM_TRANSFER", notes: "Approved via admin review" },
		});
		onApproved?.();
	};

	const handleReject = async (reason: string) => {
		await transitionDeal({
			dealId,
			event: { type: "REJECT_TRANSFER", reason },
		});
		onRejected?.();
	};

	return (
		<OwnershipTransferReviewContent
			afterOwnership={ownershipPreview.afterOwnership}
			currentOwnership={ownershipPreview.currentOwnership}
			onApprove={handleApprove}
			onReject={handleReject}
			pendingTransfer={pendingTransfer}
		/>
	);
}

// ============================================================================
// Presentational Component
// ============================================================================

export type OwnershipTransferReviewContentProps = {
	pendingTransfer: NonNullable<
		typeof api.pendingOwnershipTransfers.getPendingTransferByDeal._returnType
	>;
	currentOwnership: OwnershipEntry[];
	afterOwnership: OwnershipEntry[];
	onApprove: () => Promise<void>;
	onReject: (reason: string) => Promise<void>;
};

export function OwnershipTransferReviewContent({
	pendingTransfer,
	currentOwnership,
	afterOwnership,
	onApprove,
	onReject,
}: OwnershipTransferReviewContentProps) {
	const [isApproving, setIsApproving] = useState(false);
	const [isRejecting, setIsRejecting] = useState(false);
	const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
	const [rejectReason, setRejectReason] = useState("");

	const handleApproveClick = async () => {
		setIsApproving(true);
		try {
			await onApprove();
		} catch (error) {
			console.error("Failed to approve transfer:", error);
		} finally {
			setIsApproving(false);
		}
	};

	const handleRejectClick = async () => {
		if (!rejectReason.trim()) return;

		setIsRejecting(true);
		try {
			await onReject(rejectReason);
			setRejectDialogOpen(false);
			setRejectReason("");
		} catch (error) {
			console.error("Failed to reject transfer:", error);
		} finally {
			setIsRejecting(false);
		}
	};

	// Transfer already processed
	if (pendingTransfer.status !== "pending") {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						{pendingTransfer.status === "approved" ? (
							<>
								<CheckCircle2 className="h-5 w-5 text-green-500" />
								Transfer Approved
							</>
						) : (
							<>
								<X className="h-5 w-5 text-red-500" />
								Transfer Rejected
							</>
						)}
					</CardTitle>
					<CardDescription>
						{pendingTransfer.reviewedAt &&
							`Processed on ${format(new Date(pendingTransfer.reviewedAt), "PPP 'at' p")}`}
					</CardDescription>
				</CardHeader>
				{pendingTransfer.reviewNotes && (
					<CardContent>
						<div className="rounded-lg bg-muted p-3">
							<p className="text-muted-foreground text-sm">
								<span className="font-medium">Notes:</span>{" "}
								{pendingTransfer.reviewNotes}
							</p>
						</div>
					</CardContent>
				)}
			</Card>
		);
	}

	const fromOwnerName =
		currentOwnership.find((o) => o.ownerId === pendingTransfer.fromOwnerId)
			?.ownerName ?? "Unknown";

	const toOwnerName =
		afterOwnership.find((o) => o.ownerId === pendingTransfer.toOwnerId)
			?.ownerName ?? "Unknown";

	return (
		<Card className="overflow-hidden">
			<CardHeader className="bg-linear-to-r from-primary/5 to-primary/10">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
							<ClipboardCheck className="h-5 w-5 text-primary" />
						</div>
						<div>
							<CardTitle>Ownership Transfer Review</CardTitle>
							<CardDescription>
								Created{" "}
								{format(new Date(pendingTransfer.createdAt), "PPP 'at' p")}
							</CardDescription>
						</div>
					</div>
					<Badge
						className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
						variant="secondary"
					>
						Pending Review
					</Badge>
				</div>
			</CardHeader>

			<CardContent className="space-y-6 pt-6">
				{/* Rejection warning if previously rejected */}
				{(pendingTransfer.rejectionCount ?? 0) > 0 && (
					<div className="flex items-start gap-3 rounded-lg border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
						<AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
						<div>
							<p className="font-medium text-amber-800 text-sm dark:text-amber-200">
								Previously Rejected {pendingTransfer.rejectionCount} time(s)
							</p>
							{pendingTransfer.reviewNotes && (
								<p className="mt-1 text-amber-700 text-sm dark:text-amber-300">
									Last reason: {pendingTransfer.reviewNotes}
								</p>
							)}
						</div>
					</div>
				)}

				{/* Transfer visualization */}
				<TransferArrow
					from={fromOwnerName}
					percentage={pendingTransfer.percentage}
					to={toOwnerName}
				/>

				{/* Cap table comparison */}
				<div className="grid gap-6 md:grid-cols-2">
					<div className="space-y-4">
						<h4 className="font-semibold text-sm">Current Ownership</h4>
						<OwnershipBar
							label="Before Transfer"
							ownership={currentOwnership}
						/>
						<OwnershipTable ownership={currentOwnership} />
					</div>

					<div className="space-y-4">
						<h4 className="font-semibold text-primary text-sm">
							After Transfer
						</h4>
						<OwnershipBar label="After Transfer" ownership={afterOwnership} />
						<OwnershipTable ownership={afterOwnership} />
					</div>
				</div>

				{/* Action buttons */}
				<div className="flex flex-col gap-3 border-t pt-6 sm:flex-row">
					{/* Reject Dialog */}
					<Dialog onOpenChange={setRejectDialogOpen} open={rejectDialogOpen}>
						<Button
							className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
							disabled={isApproving}
							onClick={() => setRejectDialogOpen(true)}
							variant="outline"
						>
							<X className="mr-2 h-4 w-4" />
							Reject Transfer
						</Button>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Reject Ownership Transfer</DialogTitle>
								<DialogDescription>
									Please provide a reason for rejecting this transfer. This will
									be recorded in the audit log.
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label htmlFor="reject-reason">Rejection Reason</Label>
									<Textarea
										id="reject-reason"
										onChange={(e) => setRejectReason(e.target.value)}
										placeholder="Enter the reason for rejection..."
										rows={4}
										value={rejectReason}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button
									disabled={isRejecting}
									onClick={() => setRejectDialogOpen(false)}
									variant="outline"
								>
									Cancel
								</Button>
								<Button
									disabled={!rejectReason.trim() || isRejecting}
									onClick={handleRejectClick}
									variant="destructive"
								>
									{isRejecting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Rejecting...
										</>
									) : (
										<>
											<X className="mr-2 h-4 w-4" />
											Confirm Rejection
										</>
									)}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>

					{/* Approve confirmation */}
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								className="flex-1 bg-green-600 hover:bg-green-700"
								disabled={isRejecting}
							>
								<Check className="mr-2 h-4 w-4" />
								Approve Transfer
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Confirm Transfer Approval</AlertDialogTitle>
								<AlertDialogDescription>
									This will transfer {pendingTransfer.percentage.toFixed(2)}%
									ownership from {fromOwnerName} to {toOwnerName}. This action
									cannot be easily undone.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel disabled={isApproving}>
									Cancel
								</AlertDialogCancel>
								<AlertDialogAction
									className="bg-green-600 hover:bg-green-700"
									disabled={isApproving}
									onClick={handleApproveClick}
								>
									{isApproving ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Approving...
										</>
									) : (
										<>
											<Check className="mr-2 h-4 w-4" />
											Approve Transfer
										</>
									)}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</CardContent>
		</Card>
	);
}

export default OwnershipTransferReview;

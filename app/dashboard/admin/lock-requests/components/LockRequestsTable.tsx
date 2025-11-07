"use client";

import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { Lock, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";

type LockRequestsTableProps = {
	status: "pending" | "approved" | "rejected";
};

export function LockRequestsTable({ status }: LockRequestsTableProps) {
	const pendingRequests = useQuery(
		api.lockRequests.getPendingLockRequestsWithDetails
	);
	const approvedRequests = useQuery(
		api.lockRequests.getApprovedLockRequestsWithDetails
	);
	const rejectedRequests = useQuery(
		api.lockRequests.getRejectedLockRequestsWithDetails
	);

	const approveMutation = useMutation(api.lockRequests.approveLockRequest);
	const rejectMutation = useMutation(api.lockRequests.rejectLockRequest);

	const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
	const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
		null
	);
	const [rejectionReason, setRejectionReason] = useState("");

	const requests =
		status === "pending"
			? pendingRequests
			: status === "approved"
				? approvedRequests
				: rejectedRequests;

	const isLoading = requests === undefined;

	const handleApprove = async (requestId: string) => {
		try {
			await approveMutation({ requestId: requestId as any });
			toast.success("Request approved", {
				description: "Listing has been locked for the investor.",
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to approve request";
			toast.error("Approval failed", {
				description: errorMessage,
			});
		}
	};

	const handleReject = async () => {
		if (!selectedRequestId) return;

		try {
			await rejectMutation({
				requestId: selectedRequestId as any,
				rejectionReason: rejectionReason || undefined,
			});
			toast.success("Request rejected");
			setRejectDialogOpen(false);
			setSelectedRequestId(null);
			setRejectionReason("");
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to reject request";
			toast.error("Rejection failed", {
				description: errorMessage,
			});
		}
	};

	const openRejectDialog = (requestId: string) => {
		setSelectedRequestId(requestId);
		setRejectDialogOpen(true);
	};

	if (isLoading) {
		return (
			<div className="py-8 text-center text-muted-foreground">
				Loading requests...
			</div>
		);
	}

	if (!requests || requests.length === 0) {
		return (
			<div className="py-8 text-center text-muted-foreground">
				No {status} requests found
			</div>
		);
	}

	return (
		<>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Request ID</TableHead>
						<TableHead>Date</TableHead>
						<TableHead>Listing Address</TableHead>
						<TableHead>Lock Status</TableHead>
						<TableHead>Investor</TableHead>
						<TableHead>Lawyer</TableHead>
						<TableHead>Borrower</TableHead>
						<TableHead>Mortgage Details</TableHead>
						<TableHead>Notes</TableHead>
						<TableHead>Status</TableHead>
						{status === "pending" && <TableHead>Actions</TableHead>}
					</TableRow>
				</TableHeader>
				<TableBody>
					{requests.map((item) => {
						const request = item.request;
						const listing = item.listing;
						const mortgage = item.mortgage;
						// Borrower only exists on pending requests
						const borrower = "borrower" in item ? item.borrower : null;
						const investor = item.investor;

						const requestIdShort = request._id.slice(0, 8);
						const address = mortgage?.address
							? `${mortgage.address.street}, ${mortgage.address.city}, ${mortgage.address.state}`
							: "N/A";
						const investorName = investor
							? [investor.first_name, investor.last_name]
									.filter(Boolean)
									.join(" ") || investor.email
							: "Unknown";
						const borrowerName = borrower?.name || "N/A";

						return (
							<TableRow key={request._id}>
								<TableCell className="font-mono text-xs">
									{requestIdShort}
								</TableCell>
								<TableCell>
									{format(new Date(request.requestedAt), "MMM d, yyyy HH:mm")}
								</TableCell>
								<TableCell className="max-w-[200px] truncate">
									{address}
								</TableCell>
								<TableCell>
									{listing?.locked ? (
										<Badge className="gap-1" variant="destructive">
											<Lock className="h-3 w-3" />
											Locked
										</Badge>
									) : (
										<Badge variant="outline">Available</Badge>
									)}
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-2">
										<User className="h-4 w-4 text-muted-foreground" />
										<span className="max-w-[150px] truncate">
											{investorName}
										</span>
									</div>
								</TableCell>
								<TableCell>
									<div className="space-y-1 text-xs">
										<div className="font-medium">{request.lawyerName}</div>
										<div className="text-muted-foreground">
											LSO: {request.lawyerLSONumber}
										</div>
										<div className="max-w-[150px] truncate text-muted-foreground">
											{request.lawyerEmail}
										</div>
									</div>
								</TableCell>
								<TableCell>
									{"borrower" in item && item.borrower
										? item.borrower.name
										: "N/A"}
								</TableCell>
								<TableCell>
									{mortgage ? (
										<div className="space-y-1 text-xs">
											{"loanAmount" in mortgage && mortgage.loanAmount ? (
												<div>Loan: ${mortgage.loanAmount.toLocaleString()}</div>
											) : null}
											{"ltv" in mortgage && mortgage.ltv ? (
												<div>LTV: {mortgage.ltv.toFixed(1)}%</div>
											) : (
												<div className="text-muted-foreground">
													Limited details
												</div>
											)}
										</div>
									) : (
										"N/A"
									)}
								</TableCell>
								<TableCell className="max-w-[200px]">
									{request.requestNotes ? (
										<div
											className="truncate text-xs"
											title={request.requestNotes}
										>
											{request.requestNotes}
										</div>
									) : (
										<span className="text-muted-foreground text-xs">
											No notes
										</span>
									)}
								</TableCell>
								<TableCell>
									<Badge
										variant={
											status === "approved"
												? "default"
												: status === "rejected"
													? "destructive"
													: "secondary"
										}
									>
										{status}
									</Badge>
								</TableCell>
								{status === "pending" && (
									<TableCell>
										<div className="flex gap-2">
											<Button
												disabled={listing?.locked}
												onClick={() => handleApprove(request._id)}
												size="sm"
												variant="default"
											>
												Approve
											</Button>
											<Button
												onClick={() => openRejectDialog(request._id)}
												size="sm"
												variant="destructive"
											>
												Reject
											</Button>
										</div>
									</TableCell>
								)}
							</TableRow>
						);
					})}
				</TableBody>
			</Table>

			<Dialog onOpenChange={setRejectDialogOpen} open={rejectDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reject Lock Request</DialogTitle>
						<DialogDescription>
							Optionally provide a reason for rejecting this request. The
							investor will see this reason.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="rejection-reason">
								Rejection Reason (Optional)
							</Label>
							<Textarea
								id="rejection-reason"
								onChange={(e) => setRejectionReason(e.target.value)}
								placeholder="Enter reason for rejection..."
								value={rejectionReason}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							onClick={() => {
								setRejectDialogOpen(false);
								setRejectionReason("");
							}}
							variant="outline"
						>
							Cancel
						</Button>
						<Button onClick={handleReject} variant="destructive">
							Reject Request
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

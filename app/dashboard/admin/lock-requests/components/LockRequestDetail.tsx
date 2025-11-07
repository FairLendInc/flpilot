"use client";

import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import {
	AlertTriangle,
	Building2,
	Calendar,
	FileText,
	Lock,
	Mail,
	MapPin,
	User,
} from "lucide-react";
import Link from "next/link";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// Use a flexible type that matches the query return types
type LockRequestDetailData = {
	request: {
		_id: Id<"lock_requests">;
		listingId: Id<"listings">;
		requestedBy: Id<"users">;
		status: "pending" | "approved" | "rejected";
		requestedAt: number;
		reviewedAt?: number;
		reviewedBy?: Id<"users">;
		rejectionReason?: string;
		requestNotes?: string;
		lawyerName: string;
		lawyerLSONumber: string;
		lawyerEmail: string;
		[key: string]: unknown; // Allow additional fields
	};
	listing: {
		_id: Id<"listings">;
		mortgageId: Id<"mortgages">;
		visible: boolean;
		locked: boolean;
		lockedBy?: Id<"users">;
		lockedAt?: number;
		[key: string]: unknown; // Allow additional fields
	} | null;
	mortgage: {
		_id: Id<"mortgages">;
		borrowerId: Id<"borrowers">;
		loanAmount: number;
		interestRate: number;
		originationDate: string;
		maturityDate: string;
		status: "active" | "renewed" | "closed" | "defaulted";
		mortgageType: "1st" | "2nd" | "other";
		address: {
			street: string;
			city: string;
			state: string;
			zip: string;
			country: string;
		};
		propertyType?: string;
		appraisalMarketValue?: number;
		ltv?: number;
		[key: string]: unknown; // Allow additional fields
	} | null;
	investor: {
		_id: Id<"users">;
		email: string;
		first_name?: string;
		last_name?: string;
		[key: string]: unknown; // Allow additional fields
	} | null;
	borrower?: {
		_id: Id<"borrowers">;
		name: string;
		email: string;
		rotessaCustomerId?: string;
		[key: string]: unknown; // Allow additional fields
	} | null;
	[key: string]: unknown; // Allow additional fields on the root object
};

type LockRequestDetailProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	requestData: LockRequestDetailData;
	otherPendingCount?: number;
};

export function LockRequestDetail({
	open,
	onOpenChange,
	requestData,
	otherPendingCount,
}: LockRequestDetailProps) {
	const { request, listing, mortgage, investor, borrower } = requestData;

	const approveMutation = useMutation(api.lockRequests.approveLockRequest);
	const rejectMutation = useMutation(api.lockRequests.rejectLockRequest);

	const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
	const [rejectionReason, setRejectionReason] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Get other pending requests count if not provided
	const allPendingRequests = useQuery(
		api.lockRequests.getPendingLockRequestsWithDetails,
		otherPendingCount !== undefined ? "skip" : {}
	);
	const actualOtherPendingCount =
		otherPendingCount ??
		(allPendingRequests
			? allPendingRequests.filter(
					(item) =>
						item.listing?._id === request.listingId &&
						item.request._id !== request._id
				).length
			: 0);

	const handleApprove = async () => {
		if (listing?.locked) {
			toast.error("Cannot approve", {
				description: "Listing is already locked",
			});
			return;
		}

		setIsSubmitting(true);
		try {
			await approveMutation({ requestId: request._id });
			toast.success("Request approved", {
				description: "Listing has been locked for the investor.",
			});
			onOpenChange(false);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to approve request";
			toast.error("Approval failed", {
				description: errorMessage,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleReject = async () => {
		setIsSubmitting(true);
		try {
			await rejectMutation({
				requestId: request._id,
				rejectionReason: rejectionReason || undefined,
			});
			toast.success("Request rejected");
			setRejectDialogOpen(false);
			setRejectionReason("");
			onOpenChange(false);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to reject request";
			toast.error("Rejection failed", {
				description: errorMessage,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const address = mortgage?.address
		? `${mortgage.address.street}, ${mortgage.address.city}, ${mortgage.address.state} ${mortgage.address.zip}`
		: "N/A";

	const investorName = investor
		? [investor.first_name, investor.last_name].filter(Boolean).join(" ") ||
			investor.email
		: "Unknown";

	const propertyType = mortgage?.propertyType || "N/A";
	const marketValue = mortgage?.appraisalMarketValue
		? `$${mortgage.appraisalMarketValue.toLocaleString()}`
		: "N/A";
	const ltv = mortgage?.ltv ? `${mortgage.ltv.toFixed(1)}%` : "N/A";

	const loanAmount = mortgage?.loanAmount
		? `$${mortgage.loanAmount.toLocaleString()}`
		: "N/A";
	const apr = mortgage?.interestRate
		? `${mortgage.interestRate.toFixed(2)}%`
		: "N/A";
	const origination = mortgage?.originationDate
		? format(new Date(mortgage.originationDate), "MMM d, yyyy")
		: "N/A";
	const maturity = mortgage?.maturityDate
		? format(new Date(mortgage.maturityDate), "MMM d, yyyy")
		: "N/A";
	const mortgageType =
		mortgage?.mortgageType === "1st"
			? "1st Mortgage"
			: mortgage?.mortgageType === "2nd"
				? "2nd Mortgage"
				: mortgage?.mortgageType === "other"
					? "Other"
					: "N/A";
	const mortgageStatus = mortgage?.status
		? mortgage.status.charAt(0).toUpperCase() + mortgage.status.slice(1)
		: "N/A";

	const borrowerName = borrower?.name || "N/A";
	const borrowerEmail = borrower?.email || "N/A";
	const rotessaId = borrower?.rotessaCustomerId || "N/A";

	const requestDate = format(
		new Date(request.requestedAt),
		"MMM d, yyyy HH:mm"
	);

	return (
		<>
			<Dialog onOpenChange={onOpenChange} open={open}>
				<DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto overflow-x-hidden">
					<DialogHeader>
						<DialogTitle>Lock Request Details</DialogTitle>
						<DialogDescription>
							Request ID: {request._id.slice(0, 8)}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-6 overflow-x-hidden">
						{/* Warning if listing is locked */}
						{listing?.locked && (
							<div className="flex items-start gap-3 rounded-md border border-warning bg-warning/10 p-4">
								<AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
								<div className="flex-1">
									<p className="font-semibold text-sm">Approval will fail</p>
									<p className="mt-1 text-muted-foreground text-sm">
										This listing is already locked. You cannot approve this
										request.
									</p>
								</div>
							</div>
						)}

						{/* Other pending requests indicator */}
						{actualOtherPendingCount > 0 && (
							<div className="rounded-md border bg-muted/50 p-3">
								<p className="text-sm">
									<span className="font-medium">{actualOtherPendingCount}</span>{" "}
									other pending request
									{actualOtherPendingCount === 1 ? "" : "s"} for this listing.
								</p>
							</div>
						)}

						{/* Listing Information */}
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<Building2 className="h-5 w-5 text-muted-foreground" />
								<h3 className="font-semibold text-lg">Listing Information</h3>
							</div>
							<div className="grid gap-3 pl-7 sm:grid-cols-2">
								<div>
									<Label className="text-muted-foreground text-xs">
										Address
									</Label>
									<div className="flex items-center gap-2">
										<MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
										<p className="wrap-break-word font-medium">{address}</p>
									</div>
								</div>
								<div>
									<Label className="text-muted-foreground text-xs">
										Property Type
									</Label>
									<p className="font-medium">{propertyType}</p>
								</div>
								<div>
									<Label className="text-muted-foreground text-xs">
										Market Value
									</Label>
									<p className="font-medium">{marketValue}</p>
								</div>
								<div>
									<Label className="text-muted-foreground text-xs">LTV</Label>
									<p className="font-medium">{ltv}</p>
								</div>
								<div>
									<Label className="text-muted-foreground text-xs">
										Lock Status
									</Label>
									<div className="mt-1">
										{listing?.locked ? (
											<Badge className="gap-1" variant="destructive">
												<Lock className="h-3 w-3" />
												Locked
											</Badge>
										) : (
											<Badge variant="outline">Available</Badge>
										)}
									</div>
								</div>
							</div>
						</div>

						<Separator />

						{/* Mortgage Information */}
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<FileText className="h-5 w-5 text-muted-foreground" />
								<h3 className="font-semibold text-lg">Mortgage Information</h3>
							</div>
							<div className="grid gap-3 pl-7 sm:grid-cols-2">
								<div>
									<Label className="text-muted-foreground text-xs">
										Loan Amount
									</Label>
									<p className="font-medium">{loanAmount}</p>
								</div>
								<div>
									<Label className="text-muted-foreground text-xs">APR</Label>
									<p className="font-medium">{apr}</p>
								</div>
								<div>
									<Label className="text-muted-foreground text-xs">
										Origination Date
									</Label>
									<div className="flex items-center gap-2">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<p className="font-medium">{origination}</p>
									</div>
								</div>
								<div>
									<Label className="text-muted-foreground text-xs">
										Maturity Date
									</Label>
									<div className="flex items-center gap-2">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<p className="font-medium">{maturity}</p>
									</div>
								</div>
								<div>
									<Label className="text-muted-foreground text-xs">
										Mortgage Type
									</Label>
									<p className="font-medium">{mortgageType}</p>
								</div>
								<div>
									<Label className="text-muted-foreground text-xs">
										Status
									</Label>
									<p className="font-medium">{mortgageStatus}</p>
								</div>
							</div>
						</div>

						<Separator />

						{/* Borrower Information */}
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<User className="h-5 w-5 text-muted-foreground" />
								<h3 className="font-semibold text-lg">Borrower Information</h3>
							</div>
							<div className="grid gap-3 pl-7 sm:grid-cols-2">
								<div>
									<Label className="text-muted-foreground text-xs">Name</Label>
									<p className="font-medium">{borrowerName}</p>
								</div>
								<div>
									<Label className="text-muted-foreground text-xs">Email</Label>
									<div className="flex items-center gap-2">
										<Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
										<p className="wrap-break-word font-medium">
											{borrowerEmail}
										</p>
									</div>
								</div>
								<div>
									<Label className="text-muted-foreground text-xs">
										Rotessa Customer ID
									</Label>
									<p className="font-medium">{rotessaId}</p>
								</div>
							</div>
						</div>

						<Separator />

						{/* Investor Information */}
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<User className="h-5 w-5 text-muted-foreground" />
								<h3 className="font-semibold text-lg">Investor Information</h3>
							</div>
							<div className="grid gap-3 pl-7 sm:grid-cols-2">
								<div>
									<Label className="text-muted-foreground text-xs">Name</Label>
									<p className="font-medium">{investorName}</p>
								</div>
								<div>
									<Label className="text-muted-foreground text-xs">Email</Label>
									<div className="flex items-center gap-2">
										<Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
										<p className="wrap-break-word font-medium">
											{investor?.email || "N/A"}
										</p>
									</div>
								</div>
								<div>
									<Label className="text-muted-foreground text-xs">
										User ID
									</Label>
									<p className="break-all font-mono text-xs">
										{investor?._id || "N/A"}
									</p>
								</div>
							</div>
						</div>

						<Separator />

						{/* Request Details */}
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<FileText className="h-5 w-5 text-muted-foreground" />
								<h3 className="font-semibold text-lg">Request Details</h3>
							</div>
							<div className="space-y-3 pl-7">
								<div>
									<Label className="text-muted-foreground text-xs">Date</Label>
									<div className="flex items-center gap-2">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<p className="font-medium">{requestDate}</p>
									</div>
								</div>
								<div>
									<Label className="text-muted-foreground text-xs">
										Status
									</Label>
									<div className="mt-1">
										<Badge
											variant={
												request.status === "approved"
													? "success"
													: request.status === "rejected"
														? "danger"
														: "warning"
											}
										>
											{request.status}
										</Badge>
									</div>
								</div>
								{request.requestNotes && (
									<div>
										<Label className="text-muted-foreground text-xs">
											Notes
										</Label>
										<p className="wrap-break-word mt-1 whitespace-pre-wrap text-sm">
											{request.requestNotes}
										</p>
									</div>
								)}
								{request.rejectionReason && (
									<div>
										<Label className="text-muted-foreground text-xs">
											Rejection Reason
										</Label>
										<p className="wrap-break-word mt-1 whitespace-pre-wrap text-destructive text-sm">
											{request.rejectionReason}
										</p>
									</div>
								)}
								{request.reviewedAt && (
									<div>
										<Label className="text-muted-foreground text-xs">
											Reviewed At
										</Label>
										<div className="flex items-center gap-2">
											<Calendar className="h-4 w-4 text-muted-foreground" />
											<p className="font-medium">
												{format(
													new Date(request.reviewedAt),
													"MMM d, yyyy HH:mm"
												)}
											</p>
										</div>
									</div>
								)}
								<div>
									<Label className="text-muted-foreground text-xs">
										Lawyer Information
									</Label>
									<div className="mt-1 space-y-1 text-sm">
										<p className="font-medium">{request.lawyerName}</p>
										<p className="text-muted-foreground">
											LSO: {request.lawyerLSONumber}
										</p>
										<p className="wrap-break-word text-muted-foreground">
											{request.lawyerEmail}
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* View Full Listing Link */}
						{listing?._id && (
							<div className="pt-4">
								<Link href={`/listings/${listing._id}`} target="_blank">
									<Button className="w-full" variant="outline">
										View Full Listing
									</Button>
								</Link>
							</div>
						)}
					</div>

					{/* Action Buttons */}
					{request.status === "pending" && (
						<DialogFooter>
							<Button
								disabled={isSubmitting || listing?.locked}
								onClick={() => setRejectDialogOpen(true)}
								variant="destructive"
							>
								Reject
							</Button>
							<Button
								disabled={isSubmitting || listing?.locked}
								onClick={handleApprove}
								variant="default"
							>
								{isSubmitting ? "Processing..." : "Approve"}
							</Button>
						</DialogFooter>
					)}
				</DialogContent>
			</Dialog>

			{/* Reject Dialog */}
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
								placeholder="Enter rejection reason..."
								value={rejectionReason}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							disabled={isSubmitting}
							onClick={() => {
								setRejectDialogOpen(false);
								setRejectionReason("");
							}}
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							disabled={isSubmitting}
							onClick={handleReject}
							variant="destructive"
						>
							{isSubmitting ? "Rejecting..." : "Reject Request"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

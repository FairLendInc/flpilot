"use client";

import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import {
	AlertCircle,
	ChevronDown,
	ChevronRight,
	ChevronUp,
	Lock,
	RefreshCw,
	Search,
	User,
	X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import {
	type LockRequestSortColumn,
	type LockStatusFilter,
	useLockRequestsFilters,
} from "@/hooks/use-lock-requests-filters";
import {
	filterByLockStatus,
	searchLockRequests,
	sortLockRequests,
} from "@/lib/utils/lock-requests-table-utils";
import { LockRequestDetail } from "./LockRequestDetail";

type LockRequestsTableProps = {
	status: "pending" | "approved" | "rejected";
	listingId?: string; // Optional: filter by specific listing (for task 3.7)
};

function SortButton({
	column,
	currentColumn,
	direction,
	onClick,
}: {
	column: LockRequestSortColumn;
	currentColumn: LockRequestSortColumn | null;
	direction: "asc" | "desc" | null;
	onClick: () => void;
}) {
	const isActive = currentColumn === column;

	// Determine which icon to show
	let Icon = ChevronRight;
	if (isActive) {
		Icon = direction === "desc" ? ChevronDown : ChevronUp;
	}

	// Map column names to human-readable labels
	const columnLabels: Record<LockRequestSortColumn, string> = {
		date: "Date",
		investor: "Investor",
		listing: "Listing",
		status: "Lock Status",
	};

	const columnLabel = columnLabels[column];

	// Generate accessible label based on current state
	let ariaLabel: string;
	let title: string;
	if (!isActive) {
		ariaLabel = `Change sort for ${columnLabel}`;
		title = `Sort by ${columnLabel}`;
	} else if (direction === "desc") {
		ariaLabel = `Sort by ${columnLabel} ascending`;
		title = "Currently sorted descending, click to sort ascending";
	} else {
		// direction === "asc"
		ariaLabel = `Sort by ${columnLabel} descending`;
		title = "Currently sorted ascending, click to sort descending";
	}

	return (
		<Button
			aria-label={ariaLabel}
			className="h-6 w-6 p-0"
			onClick={onClick}
			size="sm"
			title={title}
			variant="ghost"
		>
			<Icon
				className={`h-4 w-4 ${isActive ? "text-foreground" : "text-muted-foreground opacity-50"}`}
			/>
		</Button>
	);
}

export function LockRequestsTable({
	status,
	listingId,
}: LockRequestsTableProps) {
	const pendingRequests = useQuery(
		api.lockRequests.getPendingLockRequestsWithDetails
	);
	const approvedRequests = useQuery(
		api.lockRequests.getApprovedLockRequestsWithDetails
	);
	const rejectedRequests = useQuery(
		api.lockRequests.getRejectedLockRequestsWithDetails
	);

	// Query for "other pending requests" count (task 3.7)
	const allPendingRequests = useQuery(
		api.lockRequests.getPendingLockRequestsWithDetails
	);

	const approveMutation = useMutation(api.lockRequests.approveLockRequest);
	const rejectMutation = useMutation(api.lockRequests.rejectLockRequest);

	const {
		sortColumn,
		sortDirection,
		searchQuery,
		lockStatusFilter,
		toggleSort,
		setSearchQuery,
		setLockStatusFilter,
		clearSearch,
	} = useLockRequestsFilters();

	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

	// Debounce search query
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchQuery(searchQuery);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
	const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
		null
	);
	const [rejectionReason, setRejectionReason] = useState("");
	const [detailDialogOpen, setDetailDialogOpen] = useState(false);
	const [selectedRequestData, setSelectedRequestData] = useState<
		(typeof filteredAndSortedRequests)[0] | null
	>(null);

	const rawRequests =
		status === "pending"
			? pendingRequests
			: status === "approved"
				? approvedRequests
				: rejectedRequests;

	// Filter by listingId if provided (for task 3.7)
	const requestsFilteredByListing = useMemo(() => {
		if (!(listingId && rawRequests)) return rawRequests;
		return rawRequests.filter((item) => item.listing?._id === listingId);
	}, [rawRequests, listingId]);

	// Apply search, filter, and sort
	const filteredAndSortedRequests = useMemo(() => {
		if (!requestsFilteredByListing) return [];

		let result = [...requestsFilteredByListing];

		// Apply search
		if (debouncedSearchQuery.trim()) {
			result = searchLockRequests(
				result as any,
				debouncedSearchQuery
			) as typeof result;
		}

		// Apply lock status filter (only for pending tab)
		if (status === "pending" && lockStatusFilter !== "all") {
			result = filterByLockStatus(
				result as any,
				lockStatusFilter
			) as typeof result;
		}

		// Apply sort
		if (sortColumn && sortDirection) {
			result = sortLockRequests(
				result as any,
				sortColumn,
				sortDirection
			) as typeof result;
		}

		return result;
	}, [
		requestsFilteredByListing,
		debouncedSearchQuery,
		lockStatusFilter,
		sortColumn,
		sortDirection,
		status,
	]);

	// Calculate "other pending requests" count for task 3.7
	const otherPendingCount = useMemo(() => {
		if (!(listingId && allPendingRequests)) return 0;
		return allPendingRequests.filter((item) => item.listing?._id === listingId)
			.length;
	}, [listingId, allPendingRequests]);

	const isLoading = rawRequests === undefined;
	const hasError = rawRequests === null;

	const handleRetry = () => {
		// Force refetch by triggering a re-render
		// Convex queries automatically retry on error
		window.location.reload();
	};

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

	const handleViewAllRequests = () => {
		// Clear listing filter by navigating to the page without listingId
		// This is a simple implementation - could use router.push if needed
		window.location.href = "/dashboard/admin/lock-requests";
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				{/* Search skeleton */}
				<div className="flex flex-col gap-4 sm:flex-row">
					<Skeleton className="h-10 flex-1" />
					{status === "pending" && (
						<Skeleton className="h-10 w-full sm:w-[180px]" />
					)}
				</div>
				{/* Table skeleton */}
				<div className="space-y-3">
					{Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map((key) => (
						<div className="flex gap-4" key={key}>
							<Skeleton className="h-16 flex-1" />
							<Skeleton className="h-16 w-32" />
							<Skeleton className="h-16 w-40" />
							<Skeleton className="h-16 w-24" />
							<Skeleton className="h-16 w-32" />
							{status === "pending" && <Skeleton className="h-16 w-32" />}
						</div>
					))}
				</div>
			</div>
		);
	}

	if (hasError) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 py-12">
				<AlertCircle className="h-12 w-12 text-destructive" />
				<div className="text-center">
					<h3 className="font-semibold text-lg">Failed to load requests</h3>
					<p className="mt-2 text-muted-foreground text-sm">
						There was an error loading lock requests. Please try again.
					</p>
				</div>
				<Button onClick={handleRetry} variant="default">
					<RefreshCw className="mr-2 h-4 w-4" />
					Retry
				</Button>
			</div>
		);
	}

	const totalCount = requestsFilteredByListing?.length ?? 0;
	const filteredCount = filteredAndSortedRequests.length;

	return (
		<>
			<div className="space-y-4">
				{/* Other Pending Requests Indicator (Task 3.7) */}
				{listingId && otherPendingCount > 0 && (
					<div className="rounded-md border bg-muted/50 p-3">
						<p className="text-sm">
							<span className="font-medium">{otherPendingCount}</span> other
							pending request{otherPendingCount === 1 ? "" : "s"} for this
							listing.
							<Button
								className="ml-2 h-auto p-0 text-sm underline"
								onClick={handleViewAllRequests}
								variant="link"
							>
								View all pending requests
							</Button>
						</p>
					</div>
				)}

				{/* Search and Filters */}
				<div className="flex flex-col gap-4 sm:flex-row">
					<div className="relative flex-1">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
						<Input
							className="pr-9 pl-9"
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by investor name/email or property address..."
							value={searchQuery}
						/>
						{searchQuery && (
							<Button
								className="-translate-y-1/2 absolute top-1/2 right-1 h-7 w-7 p-0"
								onClick={clearSearch}
								size="sm"
								variant="ghost"
							>
								<X className="h-4 w-4" />
							</Button>
						)}
					</div>

					{/* Lock Status Filter (only for pending tab) */}
					{status === "pending" && (
						<Select
							onValueChange={(value) =>
								setLockStatusFilter(value as LockStatusFilter)
							}
							value={lockStatusFilter}
						>
							<SelectTrigger className="w-full sm:w-[180px]">
								<SelectValue placeholder="Filter by lock status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="locked">Locked</SelectItem>
								<SelectItem value="unlocked">Unlocked</SelectItem>
							</SelectContent>
						</Select>
					)}
				</div>

				{/* Result Count */}
				{totalCount > 0 && (
					<p className="text-muted-foreground text-sm">
						{filteredCount === totalCount
							? `Showing all ${totalCount} request${totalCount === 1 ? "" : "s"}`
							: `Showing ${filteredCount} of ${totalCount} request${totalCount === 1 ? "" : "s"}`}
					</p>
				)}

				{/* Table */}
				{filteredAndSortedRequests.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-4 py-12">
						{searchQuery.trim() || lockStatusFilter !== "all" || listingId ? (
							<>
								<Search className="h-12 w-12 text-muted-foreground" />
								<div className="text-center">
									<h3 className="font-semibold text-lg">
										No matching requests
									</h3>
									<p className="mt-2 text-muted-foreground text-sm">
										{searchQuery.trim()
											? "Try adjusting your search terms or clearing filters."
											: lockStatusFilter !== "all"
												? "No requests match the selected filter. Try selecting a different filter."
												: listingId
													? "No requests found for this listing."
													: `No ${status} requests found.`}
									</p>
								</div>
								{(searchQuery.trim() || lockStatusFilter !== "all") && (
									<Button
										onClick={() => {
											clearSearch();
											setLockStatusFilter("all");
										}}
										variant="outline"
									>
										Clear filters
									</Button>
								)}
							</>
						) : (
							<>
								<Lock className="h-12 w-12 text-muted-foreground" />
								<div className="text-center">
									<h3 className="font-semibold text-lg">
										No {status} requests
									</h3>
									<p className="mt-2 text-muted-foreground text-sm">
										{status === "pending"
											? "All lock requests have been reviewed. Check back later for new requests."
											: status === "approved"
												? "No requests have been approved yet."
												: "No requests have been rejected."}
									</p>
								</div>
							</>
						)}
					</div>
				) : (
					<div className="w-full min-w-0 overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="min-w-[100px]">
										<div className="flex items-center gap-2">
											Request ID
											<SortButton
												column="date"
												currentColumn={sortColumn}
												direction={sortDirection}
												onClick={() => toggleSort("date")}
											/>
										</div>
									</TableHead>
									<TableHead className="min-w-[120px]">
										<div className="flex items-center gap-2">
											Date
											<SortButton
												column="date"
												currentColumn={sortColumn}
												direction={sortDirection}
												onClick={() => toggleSort("date")}
											/>
										</div>
									</TableHead>
									<TableHead className="min-w-[200px]">
										<div className="flex items-center gap-2">
											Listing Address
											<SortButton
												column="listing"
												currentColumn={sortColumn}
												direction={sortDirection}
												onClick={() => toggleSort("listing")}
											/>
										</div>
									</TableHead>
									<TableHead className="min-w-[100px]">
										<div className="flex items-center gap-2">
											Lock Status
											<SortButton
												column="status"
												currentColumn={sortColumn}
												direction={sortDirection}
												onClick={() => toggleSort("status")}
											/>
										</div>
									</TableHead>
									<TableHead className="min-w-[150px]">
										<div className="flex items-center gap-2">
											Investor
											<SortButton
												column="investor"
												currentColumn={sortColumn}
												direction={sortDirection}
												onClick={() => toggleSort("investor")}
											/>
										</div>
									</TableHead>
									<TableHead className="hidden min-w-[150px] lg:table-cell">
										Lawyer
									</TableHead>
									<TableHead className="hidden min-w-[100px] md:table-cell">
										Borrower
									</TableHead>
									<TableHead className="min-w-[100px]">Status</TableHead>
									{status === "pending" && (
										<TableHead className="min-w-[180px]">Actions</TableHead>
									)}
									{status !== "pending" && (
										<TableHead className="min-w-[120px]">Actions</TableHead>
									)}
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredAndSortedRequests.map((item) => {
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
									// Split borrower name into first and last name
									const borrowerFirstName =
										borrowerName !== "N/A"
											? borrowerName.split(" ")[0] || borrowerName
											: "N/A";
									const borrowerLastName =
										borrowerName !== "N/A" && borrowerName.includes(" ")
											? borrowerName.split(" ").slice(1).join(" ")
											: borrowerName !== "N/A"
												? ""
												: "N/A";

									return (
										<TableRow key={request._id}>
											<TableCell className="font-mono text-xs">
												<Button
													className="h-auto p-0 font-mono text-xs underline"
													onClick={() => {
														setSelectedRequestData(item);
														setDetailDialogOpen(true);
													}}
													variant="link"
												>
													{requestIdShort}
												</Button>
											</TableCell>
											<TableCell>
												{format(
													new Date(request.requestedAt),
													"MMM d, yyyy HH:mm"
												)}
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
											<TableCell className="hidden lg:table-cell">
												<div className="space-y-1 text-xs">
													<div className="font-medium">
														{request.lawyerName}
													</div>
													<div className="text-muted-foreground">
														LSO: {request.lawyerLSONumber}
													</div>
													<div className="max-w-[150px] truncate text-muted-foreground">
														{request.lawyerEmail}
													</div>
												</div>
											</TableCell>
											<TableCell className="hidden md:table-cell">
												{"borrower" in item && item.borrower ? (
													<div className="space-y-0.5 text-xs">
														<div className="font-medium">
															{borrowerFirstName}
														</div>
														{borrowerLastName && borrowerLastName !== "N/A" && (
															<div className="text-muted-foreground">
																{borrowerLastName}
															</div>
														)}
													</div>
												) : (
													<div className="space-y-0.5 text-xs">
														<div className="text-muted-foreground">N/A</div>
													</div>
												)}
											</TableCell>
											<TableCell>
												<Badge
													variant={
														status === "approved"
															? "success"
															: status === "rejected"
																? "danger"
																: "warning"
													}
												>
													{status}
												</Badge>
											</TableCell>
											{status === "pending" ? (
												<TableCell className="whitespace-nowrap">
													<div className="flex flex-col gap-2 sm:flex-row">
														<Button
															className="h-auto px-2 py-1 text-xs"
															onClick={() => {
																setSelectedRequestData(item);
																setDetailDialogOpen(true);
															}}
															size="sm"
															variant="outline"
														>
															View Details
														</Button>
														<Tooltip>
															<TooltipTrigger asChild>
																<span>
																	<Button
																		disabled={listing?.locked}
																		onClick={() => handleApprove(request._id)}
																		size="sm"
																		variant="default"
																	>
																		Approve
																	</Button>
																</span>
															</TooltipTrigger>
															<TooltipContent>
																{listing?.locked
																	? "Cannot approve: Listing is already locked"
																	: "Approve this lock request and lock the listing"}
															</TooltipContent>
														</Tooltip>
														<Tooltip>
															<TooltipTrigger asChild>
																<span>
																	<Button
																		onClick={() =>
																			openRejectDialog(request._id)
																		}
																		size="sm"
																		variant="destructive"
																	>
																		Reject
																	</Button>
																</span>
															</TooltipTrigger>
															<TooltipContent>
																Reject this lock request
															</TooltipContent>
														</Tooltip>
													</div>
												</TableCell>
											) : (
												<TableCell className="whitespace-nowrap">
													<Button
														className="h-auto px-2 py-1 text-xs"
														onClick={() => {
															setSelectedRequestData(item);
															setDetailDialogOpen(true);
														}}
														size="sm"
														variant="outline"
													>
														View Details
													</Button>
												</TableCell>
											)}
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				)}
			</div>

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

			{/* Lock Request Detail Dialog */}
			{selectedRequestData && (
				<LockRequestDetail
					onOpenChange={setDetailDialogOpen}
					open={detailDialogOpen}
					otherPendingCount={otherPendingCount}
					requestData={selectedRequestData as any}
				/>
			)}
		</>
	);
}

/**
 * Ownership Review Queue Page
 *
 * Displays all pending ownership transfers awaiting admin review.
 * Part of the Maker-Checker pattern implementation.
 */

"use client";

import { format } from "date-fns";
import {
	AlertTriangle,
	ArrowRight,
	CheckCircle,
	ClipboardCheck,
	Clock,
	ExternalLink,
	RefreshCw,
	User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ManualResolutionPanel } from "@/components/admin/deals/ManualResolutionPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { useAuthenticatedQuery } from "@/convex/lib/client";

type PendingTransfer =
	(typeof api.pendingOwnershipTransfers.getPendingTransfersForReview._returnType)[number];

// Helper type for transfers that have been reviewed
type ReviewedExceptionalTransfer = PendingTransfer & { reviewedAt: number };

export default function OwnershipReviewPage() {
	const router = useRouter();

	// Query pending transfers
	const pendingTransfers = useAuthenticatedQuery(
		api.pendingOwnershipTransfers.getPendingTransfersForReview,
		{}
	);

	// Loading state
	if (pendingTransfers === undefined) {
		return (
			<div className="container space-y-8 py-8">
				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-10 w-32" />
				</div>
				<div className="grid gap-4 md:grid-cols-3">
					<Skeleton className="h-24" />
					<Skeleton className="h-24" />
					<Skeleton className="h-24" />
				</div>
				<Skeleton className="h-64" />
			</div>
		);
	}

	const pendingCount = pendingTransfers?.length ?? 0;
	const escalatedCount =
		pendingTransfers?.filter(
			(t: PendingTransfer) => (t.rejectionCount ?? 0) >= 2
		).length ?? 0;
	const reviewedTransfers: ReviewedExceptionalTransfer[] =
		pendingTransfers.filter(
			(transfer): transfer is ReviewedExceptionalTransfer =>
				typeof transfer.reviewedAt === "number"
		);
	const avgReviewTimeMs =
		reviewedTransfers.length > 0
			? reviewedTransfers.reduce(
					(sum: number, transfer: ReviewedExceptionalTransfer) =>
						sum + (transfer.reviewedAt - transfer.createdAt),
					0
				) / reviewedTransfers.length
			: null;
	const avgReviewTimeHours =
		avgReviewTimeMs !== null ? avgReviewTimeMs / (1000 * 60 * 60) : null;
	const slaThresholdMs = 4 * 60 * 60 * 1000;
	const avgReviewTimeLabel =
		avgReviewTimeHours !== null ? `${avgReviewTimeHours.toFixed(1)}h` : "—";
	const slaStatus =
		avgReviewTimeMs === null
			? {
					label: "placeholder",
					className: "text-muted-foreground",
					icon: Clock,
				}
			: avgReviewTimeMs <= slaThresholdMs
				? {
						label: "Within SLA target",
						className: "text-green-600",
						icon: CheckCircle,
					}
				: {
						label: "Outside SLA target",
						className: "text-amber-600",
						icon: AlertTriangle,
					};
	const StatusIcon = slaStatus.icon;

	return (
		<div className="container space-y-8 py-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="flex items-center gap-2 font-bold text-2xl">
						<ClipboardCheck className="h-6 w-6 text-primary" />
						Ownership Transfer Review
					</h1>
					<p className="text-muted-foreground">
						Review and approve pending mortgage ownership transfers
					</p>
				</div>
				<Button onClick={() => router.refresh()} variant="outline">
					<RefreshCw className="mr-2 h-4 w-4" />
					Refresh
				</Button>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Pending Reviews</CardDescription>
						<CardTitle className="text-3xl">{pendingCount}</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center text-muted-foreground text-sm">
							<Clock className="mr-1 h-4 w-4" />
							Awaiting admin action
						</div>
					</CardContent>
				</Card>

				<Card
					className={
						escalatedCount > 0 ? "border-red-200 dark:border-red-800" : ""
					}
				>
					<CardHeader className="pb-2">
						<CardDescription
							className={escalatedCount > 0 ? "text-red-600" : ""}
						>
							Escalated
						</CardDescription>
						<CardTitle
							className={`text-3xl ${escalatedCount > 0 ? "text-red-600" : ""}`}
						>
							{escalatedCount}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div
							className={`flex items-center text-sm ${escalatedCount > 0 ? "text-red-600" : "text-muted-foreground"}`}
						>
							<AlertTriangle className="mr-1 h-4 w-4" />
							Requires manual resolution
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Avg. Review Time</CardDescription>
						<CardTitle className="text-3xl">{avgReviewTimeLabel}</CardTitle>
					</CardHeader>
					<CardContent>
						<div className={`flex items-center text-sm ${slaStatus.className}`}>
							<StatusIcon className="mr-1 h-4 w-4" />
							{slaStatus.label}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Escalated Items Section */}
			{escalatedCount > 0 && (
				<div className="space-y-4">
					<ManualResolutionPanel />
				</div>
			)}

			{/* Pending Transfers Table */}
			<Card>
				<CardHeader>
					<CardTitle>Pending Transfers</CardTitle>
					<CardDescription>
						Click on a row to open the detailed review
					</CardDescription>
				</CardHeader>
				<CardContent>
					{pendingTransfers.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
								<CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
							</div>
							<h3 className="mt-4 font-semibold">All Caught Up!</h3>
							<p className="mt-1 text-muted-foreground text-sm">
								No pending ownership transfers to review.
							</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Created</TableHead>
									<TableHead>Transfer</TableHead>
									<TableHead>Percentage</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pendingTransfers.map((transfer: PendingTransfer) => (
									<TableRow
										className="cursor-pointer hover:bg-muted/50"
										key={transfer._id}
									>
										<TableCell>
											<div className="text-sm">
												{format(new Date(transfer.createdAt), "MMM d, yyyy")}
											</div>
											<div className="text-muted-foreground text-xs">
												{format(new Date(transfer.createdAt), "h:mm a")}
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
													{transfer.fromOwnerId === "fairlend" ? (
														<span className="font-bold text-primary text-xs">
															FL
														</span>
													) : (
														<User className="h-3 w-3 text-primary" />
													)}
												</div>
												<ArrowRight className="h-4 w-4 text-muted-foreground" />
												<div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
													<User className="h-3 w-3 text-blue-600" />
												</div>
											</div>
										</TableCell>
										<TableCell>
											<Badge variant="secondary">
												{transfer.percentage.toFixed(1)}%
											</Badge>
										</TableCell>
										<TableCell>
											{(transfer.rejectionCount ?? 0) >= 2 ? (
												<Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
													<AlertTriangle className="mr-1 h-3 w-3" />
													Escalated
												</Badge>
											) : (transfer.rejectionCount ?? 0) > 0 ? (
												<Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
													Previously Rejected
												</Badge>
											) : (
												<Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
													<Clock className="mr-1 h-3 w-3" />
													Pending
												</Badge>
											)}
										</TableCell>
										<TableCell className="text-right">
											<Link href={`/dashboard/admin/deals/${transfer.dealId}`}>
												<Button size="sm" variant="ghost">
													Review
													<ExternalLink className="ml-2 h-3 w-3" />
												</Button>
											</Link>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

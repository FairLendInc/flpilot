/**
 * Investor Deal Detail Page
 *
 * Read-only view of a single deal for the investor. Shows:
 * - Current state and progression
 * - Full audit trail
 * - Property and investor details
 * - Lawyer information
 *
 * No admin actions (cancel, archive, transfer) are available.
 */

"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { format } from "date-fns";
import {
	AlertTriangle,
	Archive,
	ArrowLeft,
	Banknote,
	Calendar,
	CheckCircle,
	ClipboardCheck,
	ExternalLink,
	FileSignature,
	Lock,
	MapPin,
	Scale,
	SearchCheck,
	User,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuthenticatedQuery } from "@/convex/lib/client";
import {
	DEAL_STATE_COLORS,
	DEAL_STATE_LABELS,
	type DealStateValue,
	formatDealValue,
	getDaysInState,
} from "@/lib/types/dealTypes";

const STATE_ICONS: Record<DealStateValue, typeof Lock> = {
	locked: Lock,
	pending_lawyer: Scale,
	pending_docs: FileSignature,
	pending_transfer: Banknote,
	pending_verification: SearchCheck,
	pending_ownership_review: ClipboardCheck,
	completed: CheckCircle,
	cancelled: XCircle,
	archived: Archive,
};

export default function InvestorDealDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const resolvedParams = use(params);
	const dealId = resolvedParams.id as Id<"deals">;
	const router = useRouter();
	const { loading: authLoading } = useAuth();

	const dealData = useAuthenticatedQuery(
		api.deals.getInvestorDealWithDetails,
		{ dealId }
	);

	if (authLoading || !dealData) {
		return (
			<>
				<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator className="mr-2 h-4" orientation="vertical" />
					<h1 className="font-semibold text-lg">Deal Details</h1>
				</header>
				<div className="flex flex-1 flex-col gap-6 p-6">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-96 w-full" />
				</div>
			</>
		);
	}

	if (!dealData.deal) {
		return (
			<>
				<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator className="mr-2 h-4" orientation="vertical" />
					<h1 className="font-semibold text-lg">Deal Details</h1>
				</header>
				<div className="flex flex-1 flex-col gap-6 p-6">
					<Card>
						<CardContent className="py-12 text-center">
							<AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
							<h2 className="mb-2 font-semibold text-2xl">Deal Not Found</h2>
							<p className="mb-4 text-muted-foreground">
								The deal you're looking for doesn't exist or you don't have
								access.
							</p>
							<Button
								onClick={() => router.push("/dashboard/investor/deals")}
							>
								Back to My Deals
							</Button>
						</CardContent>
					</Card>
				</div>
			</>
		);
	}

	const { deal, lockRequest, mortgage, investor } = dealData;
	const IconComponent = STATE_ICONS[deal.currentState as DealStateValue];
	const stateColor = DEAL_STATE_COLORS[deal.currentState as DealStateValue];

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Deal Details</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Button
							onClick={() => router.push("/dashboard/investor/deals")}
							size="sm"
							variant="ghost"
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to My Deals
						</Button>
						<div>
							<h1 className="font-bold text-3xl tracking-tight">Deal Details</h1>
							<p className="text-muted-foreground text-sm">
								Created {format(new Date(deal.createdAt), "MMM d, yyyy")}
							</p>
						</div>
					</div>
					<Button asChild>
						<Link href={`/dealportal/${deal._id}`}>
							Deal Portal
							<ExternalLink className="ml-2 h-4 w-4" />
						</Link>
					</Button>
				</div>

				<div className="grid gap-6 lg:grid-cols-3">
					{/* Main Content - Left Column */}
					<div className="space-y-6 lg:col-span-2">
						{/* Current State */}
						<Card>
							<CardHeader>
								<CardTitle>Current State</CardTitle>
								<CardDescription>Deal progress and status</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center gap-4">
									<div
										className="rounded-lg p-3"
										style={{ backgroundColor: `${stateColor}20` }}
									>
										<IconComponent
											className="h-6 w-6"
											style={{ color: stateColor }}
										/>
									</div>
									<div className="flex-1">
										<h3 className="font-semibold text-lg">
											{DEAL_STATE_LABELS[deal.currentState as DealStateValue]}
										</h3>
										<p className="text-muted-foreground text-sm">
											In this state for {getDaysInState(deal)} days
										</p>
									</div>
									<Badge
										style={{
											borderColor: stateColor,
											color: stateColor,
										}}
										variant="outline"
									>
										{deal.currentState}
									</Badge>
								</div>

								{deal.currentState === "completed" && deal.completedAt && (
									<div className="border-t pt-4">
										<Badge className="text-sm" variant="success">
											Ownership Transferred{" "}
											{format(new Date(deal.completedAt), "MMM d, yyyy")}
										</Badge>
									</div>
								)}

								{deal.currentState === "cancelled" && deal.cancelledAt && (
									<div className="border-t pt-4">
										<Badge className="text-sm" variant="destructive">
											Deal Cancelled{" "}
											{format(new Date(deal.cancelledAt), "MMM d, yyyy")}
										</Badge>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Property Details */}
						{mortgage && (
							<Card>
								<CardHeader>
									<CardTitle>Property Details</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="flex items-start gap-3">
										<MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
										<div>
											<p className="font-medium">{mortgage.address.street}</p>
											<p className="text-muted-foreground text-sm">
												{mortgage.address.city}, {mortgage.address.state}{" "}
												{mortgage.address.zip}
											</p>
										</div>
									</div>

									<Separator />

									<div className="grid grid-cols-2 gap-4">
										<div>
											<Label className="text-muted-foreground text-xs">
												Loan Amount
											</Label>
											<p className="font-medium">
												{formatDealValue(mortgage.loanAmount)}
											</p>
										</div>
										<div>
											<Label className="text-muted-foreground text-xs">
												Interest Rate
											</Label>
											<p className="font-medium">{mortgage.interestRate}%</p>
										</div>
										<div>
											<Label className="text-muted-foreground text-xs">
												Property Type
											</Label>
											<p className="font-medium">
												{mortgage.propertyType || "N/A"}
											</p>
										</div>
										<div>
											<Label className="text-muted-foreground text-xs">
												Purchase Percentage
											</Label>
											<p className="font-medium">{deal.purchasePercentage}%</p>
										</div>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Audit Trail */}
						<Card>
							<CardHeader>
								<CardTitle>Audit Trail</CardTitle>
								<CardDescription>
									Complete history of all state transitions
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{deal.stateHistory?.map(
										(
											entry: NonNullable<typeof deal.stateHistory>[number],
											idx: number
										) => (
											<div
												className="flex gap-4"
												key={`${entry.timestamp}-${entry.fromState}-${entry.toState}`}
											>
												<div className="flex flex-col items-center">
													<div className="h-2 w-2 rounded-full bg-primary" />
													{idx < (deal.stateHistory?.length ?? 0) - 1 && (
														<div className="mt-1 w-px flex-1 bg-border" />
													)}
												</div>
												<div className="flex-1 pb-4">
													<div className="mb-1 flex items-center gap-2">
														<Badge className="text-xs" variant="outline">
															{entry.fromState} → {entry.toState}
														</Badge>
														<span className="text-muted-foreground text-xs">
															{format(
																new Date(entry.timestamp),
																"MMM d, yyyy HH:mm"
															)}
														</span>
													</div>
													{entry.notes && (
														<p className="text-muted-foreground text-sm">
															{entry.notes}
														</p>
													)}
												</div>
											</div>
										)
									)}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Sidebar - Right Column */}
					<div className="space-y-6">
						{/* Deal Summary */}
						<Card>
							<CardHeader>
								<CardTitle>Deal Summary</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<Label className="text-muted-foreground text-xs">
										Deal Value
									</Label>
									<p className="font-bold text-2xl">
										{formatDealValue(deal.dealValue ?? 0)}
									</p>
								</div>

								<Separator />

								<div className="space-y-3">
									<div className="flex items-center gap-2 text-sm">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<span className="text-muted-foreground">Created:</span>
										<span className="font-medium">
											{format(new Date(deal.createdAt), "MMM d, yyyy")}
										</span>
									</div>

									<div className="flex items-center gap-2 text-sm">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<span className="text-muted-foreground">Last Updated:</span>
										<span className="font-medium">
											{format(new Date(deal.updatedAt), "MMM d, yyyy")}
										</span>
									</div>

									{deal.currentState === "completed" && deal.completedAt && (
										<div className="flex items-center gap-2 text-sm">
											<CheckCircle className="h-4 w-4 text-green-600" />
											<span className="text-muted-foreground">Completed:</span>
											<span className="font-medium">
												{format(new Date(deal.completedAt), "MMM d, yyyy")}
											</span>
										</div>
									)}

									{deal.currentState === "cancelled" && deal.cancelledAt && (
										<div className="flex items-center gap-2 text-sm">
											<XCircle className="h-4 w-4 text-red-600" />
											<span className="text-muted-foreground">Cancelled:</span>
											<span className="font-medium">
												{format(new Date(deal.cancelledAt), "MMM d, yyyy")}
											</span>
										</div>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Investor Details */}
						{investor && (
							<Card>
								<CardHeader>
									<CardTitle>Your Details</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="flex items-center gap-3">
										<User className="h-5 w-5 text-muted-foreground" />
										<div>
											<p className="font-medium">
												{investor.first_name && investor.last_name
													? `${investor.first_name} ${investor.last_name}`
													: investor.email}
											</p>
											<p className="text-muted-foreground text-sm">
												{investor.email}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Lawyer Information */}
						{lockRequest && (
							<Card>
								<CardHeader>
									<CardTitle>Lawyer Information</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2">
									<div>
										<Label className="text-muted-foreground text-xs">
											Name
										</Label>
										<p className="font-medium">{lockRequest.lawyerName}</p>
									</div>
									<div>
										<Label className="text-muted-foreground text-xs">
											LSO Number
										</Label>
										<p className="font-medium">{lockRequest.lawyerLSONumber}</p>
									</div>
									<div>
										<Label className="text-muted-foreground text-xs">
											Email
										</Label>
										<p className="break-all font-medium text-sm">
											{lockRequest.lawyerEmail}
										</p>
									</div>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</div>
		</>
	);
}

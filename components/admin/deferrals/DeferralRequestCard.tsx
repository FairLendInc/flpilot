"use client";

import { format, formatDistanceToNow } from "date-fns";
import {
	Calendar,
	ChevronDown,
	ChevronUp,
	FileText,
	MapPin,
	User,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type DeferralRequestStatus = "pending" | "approved" | "rejected";
type RequestType = "one_time" | "hardship";

type DeferralRequest = {
	id: string;
	borrowerName: string;
	borrowerEmail: string;
	borrowerId: string;
	mortgageId: string;
	propertyAddress: string;
	requestType: RequestType;
	originalPaymentDate: string;
	originalPaymentAmount: number;
	requestedDeferralDate: string;
	reason?: string;
	status: DeferralRequestStatus;
	createdAt: string;
	previousDeferrals?: {
		date: string;
		approved: boolean;
	}[];
};

type DeferralRequestCardProps = {
	request: DeferralRequest;
	onApprove: (requestId: string) => void;
	onReject: (requestId: string) => void;
	isProcessing?: boolean;
	className?: string;
};

const requestTypeLabels: Record<RequestType, string> = {
	one_time: "One-time Deferral",
	hardship: "Hardship Request",
};

const statusConfig: Record<
	DeferralRequestStatus,
	{ label: string; className: string }
> = {
	pending: {
		label: "Pending Review",
		className:
			"bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
	},
	approved: {
		label: "Approved",
		className:
			"bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
	},
	rejected: {
		label: "Rejected",
		className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
	},
};

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-CA", {
		style: "currency",
		currency: "CAD",
	}).format(amount);
}

export function DeferralRequestCard({
	request,
	onApprove,
	onReject,
	isProcessing,
	className,
}: DeferralRequestCardProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	const config = statusConfig[request.status];
	const isPending = request.status === "pending";
	const daysDifference = Math.round(
		(new Date(request.requestedDeferralDate).getTime() -
			new Date(request.originalPaymentDate).getTime()) /
			(1000 * 60 * 60 * 24)
	);

	return (
		<Card className={cn("overflow-hidden", className)}>
			<Collapsible onOpenChange={setIsExpanded} open={isExpanded}>
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between gap-4">
						{/* Left side - borrower info */}
						<div className="flex items-start gap-3">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
								<User className="h-5 w-5 text-primary" />
							</div>
							<div>
								<h3 className="font-semibold">{request.borrowerName}</h3>
								<p className="text-muted-foreground text-sm">
									{request.borrowerEmail}
								</p>
							</div>
						</div>

						{/* Right side - status and expand */}
						<div className="flex items-center gap-2">
							<Badge className={config.className} variant="secondary">
								{config.label}
							</Badge>
							<CollapsibleTrigger asChild>
								<Button className="h-8 w-8" size="icon" variant="ghost">
									{isExpanded ? (
										<ChevronUp className="h-4 w-4" />
									) : (
										<ChevronDown className="h-4 w-4" />
									)}
								</Button>
							</CollapsibleTrigger>
						</div>
					</div>

					{/* Summary row */}
					<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<MapPin className="h-3.5 w-3.5" />
							<span>{request.propertyAddress.split(",")[0]}</span>
						</div>
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<Calendar className="h-3.5 w-3.5" />
							<span>
								{format(new Date(request.originalPaymentDate), "MMM d")} →{" "}
								{format(new Date(request.requestedDeferralDate), "MMM d")}
							</span>
						</div>
						<div className="flex items-center gap-1.5 font-medium">
							{formatCurrency(request.originalPaymentAmount)}
						</div>
					</div>
				</CardHeader>

				<CollapsibleContent>
					<Separator />
					<CardContent className="space-y-4 pt-4">
						{/* Request details grid */}
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-3">
								<h4 className="font-semibold text-sm">Request Details</h4>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span className="text-muted-foreground">Type</span>
										<Badge variant="outline">
											{requestTypeLabels[request.requestType]}
										</Badge>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Original Date</span>
										<span>
											{format(
												new Date(request.originalPaymentDate),
												"MMM d, yyyy"
											)}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											Requested Date
										</span>
										<span>
											{format(
												new Date(request.requestedDeferralDate),
												"MMM d, yyyy"
											)}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Delay</span>
										<span>{daysDifference} days</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Submitted</span>
										<span>
											{formatDistanceToNow(new Date(request.createdAt), {
												addSuffix: true,
											})}
										</span>
									</div>
								</div>
							</div>

							<div className="space-y-3">
								<h4 className="font-semibold text-sm">Payment Info</h4>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span className="text-muted-foreground">Amount</span>
										<span className="font-medium">
											{formatCurrency(request.originalPaymentAmount)}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Property</span>
										<span className="max-w-[200px] truncate text-right">
											{request.propertyAddress}
										</span>
									</div>
								</div>

								{request.previousDeferrals &&
									request.previousDeferrals.length > 0 && (
										<div className="border-t pt-2">
											<p className="mb-1 text-muted-foreground text-xs">
												Previous Deferrals
											</p>
											{request.previousDeferrals.map((prev) => (
												<div
													className="flex justify-between text-xs"
													key={prev.date}
												>
													<span>
														{format(new Date(prev.date), "MMM d, yyyy")}
													</span>
													<span
														className={
															prev.approved
																? "text-emerald-600"
																: "text-red-600"
														}
													>
														{prev.approved ? "Approved" : "Rejected"}
													</span>
												</div>
											))}
										</div>
									)}
							</div>
						</div>

						{/* Reason if provided */}
						{request.reason && (
							<div className="space-y-2">
								<h4 className="flex items-center gap-1.5 font-semibold text-sm">
									<FileText className="h-4 w-4" />
									Reason Provided
								</h4>
								<p className="rounded-lg bg-muted/50 p-3 text-muted-foreground text-sm">
									{request.reason}
								</p>
							</div>
						)}

						{/* Actions - only for pending */}
						{isPending && (
							<div className="flex items-center justify-end gap-3 pt-2">
								<Button
									disabled={isProcessing}
									onClick={() => onReject(request.id)}
									variant="outline"
								>
									Reject
								</Button>
								<Button
									disabled={isProcessing}
									onClick={() => onApprove(request.id)}
								>
									Approve Deferral
								</Button>
							</div>
						)}
					</CardContent>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}

export type { DeferralRequest, DeferralRequestStatus, RequestType };

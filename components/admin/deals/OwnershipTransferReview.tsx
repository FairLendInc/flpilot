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
	Building,
	Building2,
	Calendar,
	Check,
	ChevronDown,
	ChevronRight,
	ClipboardCheck,
	Copy,
	Database,
	DollarSign,
	FileText,
	Loader2,
	MapPin,
	TrendingDown,
	TrendingUp,
	User,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { getMortgageShareAsset } from "@/lib/ledger/utils";
import { logger } from "@/lib/logger";

// ============================================================================
// Types
// ============================================================================

type DealData = {
	mortgage?: {
		loanAmount?: number;
		interestRate?: number;
		ltv?: number;
		address?: {
			street?: string;
			city?: string;
			state?: string;
			zip?: string;
		};
		propertyType?: string;
		appraisalMarketValue?: number;
	};
	deal?: {
		_id: Id<"deals">;
		createdAt: number;
		dealValue?: number;
		purchasePercentage?: number;
		lawyerEmail?: string;
		lawyerName?: string;
		lawyerLSONumber?: string;
		brokerEmail?: string;
		brokerName?: string;
		brokerId?: string;
	};
	investor?: {
		_id: Id<"users">;
		first_name?: string;
		last_name?: string;
		email?: string;
		phone?: string;
	};
	borrower?: {
		name?: string;
		email?: string;
		phone?: string;
		rotessaCustomerId?: string;
	};
};

type OwnershipTransferReviewProps = {
	dealId: Id<"deals">;
	onApproved?: () => void;
	onRejected?: () => void;
	dealData?: DealData;
};

type OwnershipEntry = {
	ownerId: "fairlend" | Id<"users">;
	percentage: number;
	ownerName: string;
};

type LedgerAccountState = {
	address: string;
	ownerName: string;
	ownerId: "fairlend" | Id<"users">;
	currentBalance: number;
	projectedBalance: number;
	balanceChange: number;
};

type LedgerState = {
	assetIdentifier: string;
	sourceAccount: LedgerAccountState;
	destinationAccount: LedgerAccountState;
};

type OwnershipPreview = {
	currentOwnership: OwnershipEntry[];
	afterOwnership: OwnershipEntry[];
	ledgerState: LedgerState;
};

function formatUserName(
	user:
		| {
				first_name?: string;
				last_name?: string;
				email?: string;
				_id?: string;
		  }
		| null
		| undefined
): string | null {
	if (!user) return null;
	const name = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
	return name || user.email || null;
}

function isFairlendOwnerId(
	ownerId: string | Id<"users">
): ownerId is "fairlend" {
	return ownerId === "fairlend";
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Deal Overview Card - displays key deal information
 */
function DealOverviewCard({ dealData }: { dealData: DealData }) {
	const mortgage = dealData?.mortgage;
	const deal = dealData?.deal;

	if (!(mortgage && deal)) return null;

	return (
		<Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
			<CardHeader>
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
						<FileText className="h-5 w-5 text-primary" />
					</div>
					<div>
						<CardTitle>Deal Overview</CardTitle>
						<CardDescription>
							ID: {deal._id} • Created{" "}
							{new Date(deal.createdAt).toLocaleDateString()}
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Mortgage Details */}
				<div className="grid gap-4 md:grid-cols-3">
					<div className="flex items-start gap-3 rounded-lg bg-background/50 p-3">
						<DollarSign className="mt-0.5 h-5 w-5 text-primary" />
						<div>
							<p className="text-muted-foreground text-xs">Loan Amount</p>
							<p className="font-semibold">
								${mortgage.loanAmount?.toLocaleString() ?? "N/A"}
							</p>
						</div>
					</div>
					<div className="flex items-start gap-3 rounded-lg bg-background/50 p-3">
						<Calendar className="mt-0.5 h-5 w-5 text-primary" />
						<div>
							<p className="text-muted-foreground text-xs">Interest Rate</p>
							<p className="font-semibold">
								{mortgage.interestRate?.toFixed(2) ?? "N/A"}% APR
							</p>
						</div>
					</div>
					<div className="flex items-start gap-3 rounded-lg bg-background/50 p-3">
						<Calendar className="mt-0.5 h-5 w-5 text-primary" />
						<div>
							<p className="text-muted-foreground text-xs">LTV Ratio</p>
							<p className="font-semibold">
								{mortgage.ltv?.toFixed(1) ?? "N/A"}%
							</p>
						</div>
					</div>
				</div>

				{/* Property Details */}
				<div className="flex items-start gap-3 rounded-lg bg-background/50 p-3">
					<MapPin className="mt-0.5 h-5 w-5 text-primary" />
					<div>
						<p className="text-muted-foreground text-xs">Property Address</p>
						<p className="font-medium">
							{mortgage.address?.street}
							<br />
							{mortgage.address?.city}, {mortgage.address?.state}{" "}
							{mortgage.address?.zip}
						</p>
						<div className="mt-1 text-muted-foreground text-sm">
							{mortgage.propertyType} • Appraisal: $
							{mortgage.appraisalMarketValue?.toLocaleString() ?? "N/A"}
						</div>
					</div>
				</div>

				{/* Deal Value */}
				{deal.dealValue && (
					<div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
						<Database className="mt-0.5 h-5 w-5 text-primary" />
						<div>
							<p className="text-muted-foreground text-xs">Deal Value</p>
							<p className="font-bold text-lg text-primary">
								${deal.dealValue.toLocaleString()}
							</p>
							<p className="text-muted-foreground text-xs">
								Purchase: {deal.purchasePercentage ?? 100}%
							</p>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

/**
 * Parties Section - displays all participants in the deal
 */
function PartiesSection({ dealData }: { dealData: DealData }) {
	const mortgage = dealData?.mortgage;
	const deal = dealData?.deal;
	const investor = dealData?.investor;
	const borrower = dealData?.borrower;

	if (!(mortgage && deal)) return null;

	const formatPhoneNumber = (phone: string | undefined) => {
		if (!phone) return "N/A";
		const cleaned = phone.replace(/\D/g, "");
		if (cleaned.length === 10) {
			return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
		}
		return phone;
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
						<Building2 className="h-5 w-5 text-primary" />
					</div>
					<div>
						<CardTitle>Deal Participants</CardTitle>
						<CardDescription>
							All parties involved in this transaction
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="grid gap-4 md:grid-cols-2">
					{/* Investor Section */}
					<div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/10">
						<div className="mb-3 flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
								<User className="h-4 w-4" />
							</div>
							<h4 className="font-semibold text-blue-900 dark:text-blue-100">
								Investor
							</h4>
						</div>
						{investor ? (
							<div className="space-y-1 text-sm">
								<p className="font-medium">
									{investor.first_name} {investor.last_name}
								</p>
								<p className="text-blue-700 dark:text-blue-300">
									{investor.email}
								</p>
								{investor.phone && (
									<p className="text-blue-700 dark:text-blue-300">
										{formatPhoneNumber(investor.phone)}
									</p>
								)}
								<p className="mt-2 text-muted-foreground text-xs">
									ID: {investor._id}
								</p>
							</div>
						) : (
							<p className="text-muted-foreground text-sm">
								Investor details not available
							</p>
						)}
					</div>

					{/* Borrower Section */}
					<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/10">
						<div className="mb-3 flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white">
								<Building className="h-4 w-4" />
							</div>
							<h4 className="font-semibold text-amber-900 dark:text-amber-100">
								Borrower
							</h4>
						</div>
						{borrower ? (
							<div className="space-y-1 text-sm">
								<p className="font-medium">{borrower.name}</p>
								<p className="text-amber-700 dark:text-amber-300">
									{borrower.email}
								</p>
								{borrower.phone && (
									<p className="text-amber-700 dark:text-amber-300">
										{formatPhoneNumber(borrower.phone)}
									</p>
								)}
								{borrower.rotessaCustomerId && (
									<p className="mt-2 text-muted-foreground text-xs">
										Rotessa ID: {borrower.rotessaCustomerId}
									</p>
								)}
							</div>
						) : (
							<p className="text-muted-foreground text-sm">
								Borrower details not available
							</p>
						)}
					</div>

					{/* Lawyer Section */}
					{deal.lawyerEmail && (
						<div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/10">
							<div className="mb-3 flex items-center gap-2">
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white">
									<FileText className="h-4 w-4" />
								</div>
								<h4 className="font-semibold text-purple-900 dark:text-purple-100">
									Lawyer
								</h4>
							</div>
							<div className="space-y-1 text-sm">
								<p className="font-medium">
									{deal.lawyerName || "Not specified"}
								</p>
								<p className="text-purple-700 dark:text-purple-300">
									{deal.lawyerEmail}
								</p>
								{deal.lawyerLSONumber && (
									<p className="mt-2 text-muted-foreground text-xs">
										LSO #: {deal.lawyerLSONumber}
									</p>
								)}
							</div>
						</div>
					)}

					{/* Broker Section */}
					{deal.brokerEmail && (
						<div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/10">
							<div className="mb-3 flex items-center gap-2">
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
									<Building2 className="h-4 w-4" />
								</div>
								<h4 className="font-semibold text-green-900 dark:text-green-100">
									Broker
								</h4>
							</div>
							<div className="space-y-1 text-sm">
								<p className="font-medium">
									{deal.brokerName || "Not specified"}
								</p>
								<p className="text-green-700 dark:text-green-300">
									{deal.brokerEmail}
								</p>
								{deal.brokerId && (
									<p className="mt-2 text-muted-foreground text-xs">
										ID: {deal.brokerId}
									</p>
								)}
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

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

// Ledger State Card Component
function LedgerStateCard({ ledgerState }: { ledgerState: LedgerState }) {
	const [copiedSource, setCopiedSource] = useState(false);
	const [copiedDest, setCopiedDest] = useState(false);
	const [copyCopied, setCopyCopied] = useState(false);

	const copyToClipboard = (text: string, setCopied: (val: boolean) => void) => {
		navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Collapsible className="rounded-lg border">
			<CollapsibleTrigger className="flex w-full items-center justify-between rounded-t-lg bg-muted/50 px-4 py-3 hover:bg-muted">
				<div className="flex items-center gap-3">
					<Database className="h-5 w-5 text-primary" />
					<div>
						<p className="font-medium">Ledger State</p>
						<p className="text-muted-foreground text-xs">
							Asset:{" "}
							<code className="rounded bg-muted px-1">
								{ledgerState.assetIdentifier}
							</code>
						</p>
					</div>
				</div>
				<ChevronDown className="h-5 w-5 transition-transform" />
			</CollapsibleTrigger>
			<CollapsibleContent className="space-y-6 border-t p-4">
				{/* Asset Overview */}
				<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
					<div>
						<p className="text-muted-foreground text-sm">Share Asset</p>
						<div className="mt-1 flex items-center gap-2">
							<code className="rounded border bg-background px-2 py-1 font-mono text-sm">
								{ledgerState.assetIdentifier}
							</code>
							<Button
								className="h-7 w-7"
								onClick={() =>
									copyToClipboard(ledgerState.assetIdentifier, setCopyCopied)
								}
								size="icon"
								variant="ghost"
							>
								<Copy className="h-3.5 w-3.5" />
							</Button>
							{copyCopied && (
								<span className="text-muted-foreground text-xs">Copied!</span>
							)}
						</div>
					</div>
					<div>
						<p className="text-muted-foreground text-sm">Transfer Amount</p>
						<p className="font-semibold">
							{ledgerState.destinationAccount.balanceChange.toFixed(2)}%
						</p>
					</div>
				</div>

				{/* Source Account */}
				<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/10">
					<div className="mb-3 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<TrendingDown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
							<div>
								<p className="font-semibold text-sm">Source Account</p>
								<p className="text-muted-foreground text-xs">
									{ledgerState.sourceAccount.ownerName}
								</p>
							</div>
						</div>
						<Badge
							className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
							variant="outline"
						>
							Debit
						</Badge>
					</div>
					<div className="space-y-2 text-sm">
						<div>
							<p className="text-muted-foreground">Account Address</p>
							<div className="mt-1 flex items-center justify-between rounded border bg-background/50 px-2 py-1 font-mono">
								<code className="text-xs">
									{ledgerState.sourceAccount.address}
								</code>
								<Button
									className="h-6 w-6"
									onClick={() =>
										copyToClipboard(
											ledgerState.sourceAccount.address,
											setCopiedSource
										)
									}
									size="icon"
									variant="ghost"
								>
									<Copy className="h-3 w-3" />
								</Button>
							</div>
							{copiedSource && (
								<span className="ml-2 text-muted-foreground text-xs">
									Copied!
								</span>
							)}
						</div>
						<div className="mt-3 grid grid-cols-3 gap-3">
							<div>
								<p className="text-muted-foreground text-xs">Before</p>
								<p className="font-medium">
									{ledgerState.sourceAccount.currentBalance.toFixed(2)}%
								</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Change</p>
								<p className="font-medium text-red-600">
									{ledgerState.sourceAccount.balanceChange >= 0 ? "+" : ""}
									{ledgerState.sourceAccount.balanceChange.toFixed(2)}%
								</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">After</p>
								<p className="font-medium">
									{ledgerState.sourceAccount.projectedBalance.toFixed(2)}%
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Destination Account */}
				<div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/10">
					<div className="mb-3 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
							<div>
								<p className="font-semibold text-sm">Destination Account</p>
								<p className="text-muted-foreground text-xs">
									{ledgerState.destinationAccount.ownerName}
								</p>
							</div>
						</div>
						<Badge
							className="border-green-300 text-green-700 dark:border-green-700 dark:text-green-300"
							variant="outline"
						>
							Credit
						</Badge>
					</div>
					<div className="space-y-2 text-sm">
						<div>
							<p className="text-muted-foreground">Account Address</p>
							<div className="mt-1 flex items-center justify-between rounded border bg-background/50 px-2 py-1 font-mono">
								<code className="text-xs">
									{ledgerState.destinationAccount.address}
								</code>
								<Button
									className="h-6 w-6"
									onClick={() =>
										copyToClipboard(
											ledgerState.destinationAccount.address,
											setCopiedDest
										)
									}
									size="icon"
									variant="ghost"
								>
									<Copy className="h-3 w-3" />
								</Button>
							</div>
							{copiedDest && (
								<span className="ml-2 text-muted-foreground text-xs">
									Copied!
								</span>
							)}
						</div>
						<div className="mt-3 grid grid-cols-3 gap-3">
							<div>
								<p className="text-muted-foreground text-xs">Before</p>
								<p className="font-medium">
									{ledgerState.destinationAccount.currentBalance.toFixed(2)}%
								</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Change</p>
								<p className="font-medium text-green-600">
									+{ledgerState.destinationAccount.balanceChange.toFixed(2)}%
								</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">After</p>
								<p className="font-medium">
									{ledgerState.destinationAccount.projectedBalance.toFixed(2)}%
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Summary */}
				<div className="flex items-center justify-center gap-4 rounded-lg bg-muted/50 p-3 text-sm">
					<div className="flex items-center gap-2">
						<div className="h-2 w-2 rounded-full bg-amber-500" />
						<span>
							Source: -{ledgerState.destinationAccount.balanceChange.toFixed(2)}
							%
						</span>
					</div>
					<ArrowRight className="h-4 w-4 text-muted-foreground" />
					<div className="flex items-center gap-2">
						<div className="h-2 w-2 rounded-full bg-green-500" />
						<span>
							Destination: +
							{ledgerState.destinationAccount.balanceChange.toFixed(2)}%
						</span>
					</div>
				</div>
			</CollapsibleContent>
		</Collapsible>
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
	dealData,
}: OwnershipTransferReviewProps) {
	const { user, loading: authLoading } = useAuth();

	// Mutations
	const transitionDeal = useMutation(api.deals.transitionDealState);
	const approvePendingTransfer = useMutation(
		api.pendingOwnershipTransfers.approvePendingTransfer
	);
	const fetchOwnershipSnapshot = useAction(api.ledger.getOwnershipSnapshot);

	// Queries
	const pendingTransfer = useQuery(
		api.pendingOwnershipTransfers.getPendingTransferByDeal,
		authLoading || !user ? "skip" : { dealId }
	);
	const fromOwnerUser = useQuery(
		api.users.getUserByIdAdmin,
		authLoading ||
			!user ||
			!pendingTransfer ||
			pendingTransfer.fromOwnerId === "fairlend"
			? "skip"
			: { userId: pendingTransfer.fromOwnerId }
	);
	const toOwnerUser = useQuery(
		api.users.getUserByIdAdmin,
		authLoading || !user || !pendingTransfer
			? "skip"
			: { userId: pendingTransfer.toOwnerId }
	);

	const [ownershipPreview, setOwnershipPreview] = useState<
		OwnershipPreview | null | undefined
	>(undefined);
	const [ownershipError, setOwnershipError] = useState<string | null>(null);
	const dealInvestorId = dealData?.investor?._id;
	const dealInvestorName = formatUserName(dealData?.investor);
	const fromOwnerDisplayName = formatUserName(fromOwnerUser);
	const toOwnerDisplayName = formatUserName(toOwnerUser);

	useEffect(() => {
		if (authLoading || !user || !pendingTransfer?._id) {
			return;
		}

		let cancelled = false;
		setOwnershipPreview(undefined);
		setOwnershipError(null);

		const resolveOwnerName = (ownerId: string) => {
			if (ownerId === "fairlend") return "FairLend";
			if (dealInvestorId === ownerId && dealInvestorName) {
				return dealInvestorName;
			}
			if (toOwnerUser?._id === ownerId && toOwnerDisplayName) {
				return toOwnerDisplayName;
			}
			if (fromOwnerUser?._id === ownerId && fromOwnerDisplayName) {
				return fromOwnerDisplayName;
			}
			return `Investor ${ownerId.slice(0, 8)}...`;
		};

		fetchOwnershipSnapshot({})
			.then((result) => {
				if (cancelled) {
					return;
				}

				if (!(result.success && result.ownershipByMortgage)) {
					setOwnershipPreview(null);
					setOwnershipError(
						result.error ?? "Failed to load mortgage ownership from ledger."
					);
					return;
				}

				const mortgageIdString = pendingTransfer.mortgageId.toString();
				const assetIdentifier = getMortgageShareAsset(mortgageIdString);
				const hashKey = assetIdentifier.slice(1);
				const ownershipEntries = result.ownershipByMortgage[hashKey] ?? [];

				if (ownershipEntries.length === 0) {
					setOwnershipPreview(null);
					setOwnershipError(
						"Mortgage ownership has not been minted in the ledger yet. Mint ownership in Admin > Ledger > Mortgages before approving transfers."
					);
					return;
				}

				const currentOwnership: OwnershipEntry[] = ownershipEntries
					.map(
						(entry: {
							ownerId: string;
							percentage: number;
						}): OwnershipEntry => ({
							ownerId: isFairlendOwnerId(entry.ownerId)
								? "fairlend"
								: (entry.ownerId as Id<"users">),
							percentage: entry.percentage,
							ownerName: resolveOwnerName(entry.ownerId),
						})
					)
					.sort(
						(a: OwnershipEntry, b: OwnershipEntry) =>
							b.percentage - a.percentage
					);

				const ownershipMap = new Map<
					"fairlend" | Id<"users">,
					{ percentage: number; ownerName: string }
				>();

				for (const owner of currentOwnership) {
					let newPercentage = owner.percentage;
					if (owner.ownerId === pendingTransfer.fromOwnerId) {
						newPercentage -= pendingTransfer.percentage;
					}
					if (owner.ownerId === pendingTransfer.toOwnerId) {
						newPercentage += pendingTransfer.percentage;
					}
					if (newPercentage > 0) {
						ownershipMap.set(owner.ownerId, {
							percentage: newPercentage,
							ownerName: owner.ownerName,
						});
					}
				}

				if (!ownershipMap.has(pendingTransfer.toOwnerId)) {
					ownershipMap.set(pendingTransfer.toOwnerId, {
						percentage: pendingTransfer.percentage,
						ownerName: resolveOwnerName(pendingTransfer.toOwnerId),
					});
				}

				const afterOwnership: OwnershipEntry[] = Array.from(
					ownershipMap.entries()
				)
					.map(([ownerId, data]) => ({ ownerId, ...data }))
					.sort((a, b) => b.percentage - a.percentage);

				const sourceCurrentBalance =
					currentOwnership.find(
						(entry) => entry.ownerId === pendingTransfer.fromOwnerId
					)?.percentage ?? 0;
				const destCurrentBalance =
					currentOwnership.find(
						(entry) => entry.ownerId === pendingTransfer.toOwnerId
					)?.percentage ?? 0;

				const sourceAccountAddress =
					pendingTransfer.fromOwnerId === "fairlend"
						? "fairlend:inventory"
						: `investor:${pendingTransfer.fromOwnerId}:inventory`;
				const destinationAccountAddress =
					pendingTransfer.toOwnerId === "fairlend"
						? "fairlend:inventory"
						: `investor:${pendingTransfer.toOwnerId}:inventory`;

				const ledgerState: LedgerState = {
					assetIdentifier,
					sourceAccount: {
						address: sourceAccountAddress,
						ownerName: resolveOwnerName(pendingTransfer.fromOwnerId),
						ownerId: pendingTransfer.fromOwnerId,
						currentBalance: sourceCurrentBalance,
						projectedBalance: sourceCurrentBalance - pendingTransfer.percentage,
						balanceChange: -pendingTransfer.percentage,
					},
					destinationAccount: {
						address: destinationAccountAddress,
						ownerName: resolveOwnerName(pendingTransfer.toOwnerId),
						ownerId: pendingTransfer.toOwnerId,
						currentBalance: destCurrentBalance,
						projectedBalance: destCurrentBalance + pendingTransfer.percentage,
						balanceChange: pendingTransfer.percentage,
					},
				};

				setOwnershipPreview({
					currentOwnership,
					afterOwnership,
					ledgerState,
				});
			})
			.catch((error) => {
				if (!cancelled) {
					logger.error("Failed to fetch ownership snapshot", {
						error: error instanceof Error ? error.message : String(error),
					});
					setOwnershipPreview(null);
					setOwnershipError("Failed to load mortgage ownership from ledger.");
				}
			});

		return () => {
			cancelled = true;
		};
	}, [
		authLoading,
		dealInvestorId,
		dealInvestorName,
		fetchOwnershipSnapshot,
		fromOwnerDisplayName,
		fromOwnerUser?._id,
		pendingTransfer?.fromOwnerId,
		pendingTransfer?.mortgageId,
		pendingTransfer?.percentage,
		pendingTransfer?.toOwnerId,
		pendingTransfer?._id,
		toOwnerDisplayName,
		toOwnerUser?._id,
		user,
	]);

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
	if (pendingTransfer === null) {
		return null;
	}

	if (ownershipPreview === null) {
		return (
			<Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
						<AlertTriangle className="h-5 w-5" />
						Ownership Data Unavailable
					</CardTitle>
					<CardDescription className="text-amber-700 dark:text-amber-300">
						{ownershipError ??
							"Unable to load ownership data from the ledger. Please check ledger setup and try again."}
					</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	const handleApprove = async () => {
		await approvePendingTransfer({
			transferId: pendingTransfer._id,
			notes: "Approved via admin review",
		});
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
			dealData={dealData}
			ledgerState={ownershipPreview.ledgerState}
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
	ledgerState: LedgerState;
	dealData?: DealData;
};

export function OwnershipTransferReviewContent({
	pendingTransfer,
	currentOwnership,
	afterOwnership,
	onApprove,
	onReject,
	ledgerState,
	dealData,
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
			logger.error("Failed to approve transfer", {
				error: error instanceof Error ? error.message : String(error),
			});
			toast.error("Failed to approve transfer");
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
			logger.error("Failed to reject transfer", {
				error: error instanceof Error ? error.message : String(error),
			});
			toast.error("Failed to reject transfer");
		} finally {
			setIsRejecting(false);
		}
	};

	// Transfer already processed
	if (pendingTransfer.status !== "pending") {
		return null;
	}

	// Use ledger state for accurate source/destination names
	const fromOwnerName = ledgerState.sourceAccount.ownerName;
	const toOwnerName = ledgerState.destinationAccount.ownerName;
	const approvalBlockedReason =
		ledgerState.sourceAccount.currentBalance < pendingTransfer.percentage
			? `Insufficient balance for transfer. Source has ${ledgerState.sourceAccount.currentBalance.toFixed(
					2
				)}%, attempting to transfer ${pendingTransfer.percentage.toFixed(2)}%.`
			: null;
	const approveDisabled =
		Boolean(approvalBlockedReason) || isRejecting || isApproving;

	return (
		<Card className="overflow-hidden">
			<CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
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
				{/* Deal Overview */}
				{dealData && <DealOverviewCard dealData={dealData} />}

				{/* Parties Section */}
				{dealData && <PartiesSection dealData={dealData} />}

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

				{/* Approval blocked warning */}
				{approvalBlockedReason && (
					<div className="flex items-start gap-3 rounded-lg border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
						<AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
						<div>
							<p className="font-medium text-red-800 text-sm dark:text-red-200">
								Approval blocked
							</p>
							<p className="mt-1 text-red-700 text-sm dark:text-red-300">
								{approvalBlockedReason}
							</p>
						</div>
					</div>
				)}

				{/* Transfer visualization */}
				<TransferArrow
					from={fromOwnerName}
					percentage={pendingTransfer.percentage}
					to={toOwnerName}
				/>

				{/* Ledger State Card */}
				<LedgerStateCard ledgerState={ledgerState} />

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
								disabled={approveDisabled}
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
									disabled={approveDisabled}
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

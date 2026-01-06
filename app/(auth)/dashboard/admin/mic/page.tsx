"use client";

import {
	Building2,
	DollarSign,
	Plus,
	TrendingUp,
	Users,
	Wallet,
} from "lucide-react";
import { MICCapitalDeployedCard } from "@/components/admin/mic/widgets/MICCapitalDeployedCard";
import { MICCashHealthCard } from "@/components/admin/mic/widgets/MICCashHealthCard";
import { MICFundMetricsRow } from "@/components/admin/mic/widgets/MICFundMetricsRow";
import { MICIncomeMetricsCard } from "@/components/admin/mic/widgets/MICIncomeMetricsCard";
import { PendingActionsCard } from "@/components/admin/mic/widgets/PendingActionsCard";
import { RecentActivityFeed } from "@/components/admin/mic/widgets/RecentActivityFeed";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMICLedgerData } from "@/lib/hooks/useMICLedgerData";
import { useMICStore } from "@/lib/stores/useMICStore";

export default function MICOverviewPage() {
	// Formance ledger data (live)
	const {
		metrics: ledgerMetrics,
		recentActivity,
		isLoading,
		error,
	} = useMICLedgerData();

	// Mock data fallback for non-Formance metrics
	const { metrics: mockMetrics } = useMICStore();

	// Use Formance data where available, mock otherwise
	const mappedMetrics = [
		{
			label: "Total Capital",
			// ✅ Formance: Total MICCAP issued to investors
			value: isLoading
				? "Loading..."
				: `$${(ledgerMetrics.totalCapital / 100).toLocaleString()}`,
			change: "+2.5%", // TODO: Calculate from historical data
			trend: "up" as const,
			icon: Building2,
			color: "text-blue-500",
			bgGradient: "from-blue-500/10 to-blue-500/5",
		},
		{
			label: "MIC Value",
			// TODO: MIC Value requires AUM valuation from Convex mortgages table
			value: `$${(mockMetrics.micValue / 100).toLocaleString()}`,
			change: "+1.8%",
			trend: "up" as const,
			icon: TrendingUp,
			color: "text-indigo-500",
			bgGradient: "from-indigo-500/10 to-indigo-500/5",
		},
		{
			label: "Investor Count",
			// ✅ Formance: Count of investors with MICCAP > 0
			value: isLoading ? "..." : ledgerMetrics.investorCount.toString(),
			change: "+3",
			trend: "up" as const,
			icon: Users,
			color: "text-emerald-500",
			bgGradient: "from-emerald-500/10 to-emerald-500/5",
		},
		{
			label: "Cash Balance",
			// ✅ Formance: mic:FLMIC:cash balance
			value: isLoading
				? "Loading..."
				: `$${(ledgerMetrics.cashBalance / 100).toLocaleString()}`,
			change: "-5%",
			trend: "down" as const,
			icon: Wallet,
			color: "text-amber-500",
			bgGradient: "from-amber-500/10 to-amber-500/5",
		},
	];

	// ✅ Formance: Transform ledger transactions to activity feed format
	const mappedActivities = recentActivity.map((act) => ({
		id: act.id,
		type: act.type as
			| "subscription"
			| "origination"
			| "sale"
			| "distribution"
			| "redemption"
			| "interest"
			| "fee"
			| "other",
		title: act.title,
		description: act.description,
		timestamp: act.timestamp,
		amount: `$${(act.amount / 100).toLocaleString()}`,
	}));

	// TODO: Pending actions need workflow system integration
	const pendingActions = [
		{
			id: "a1",
			type: "subscription_approval" as const,
			title: "Approve Subscription",
			description: "Jane Smith: $50,000.00",
			priority: "high" as const,
		},
		{
			id: "a2",
			type: "distribution_review" as const,
			title: "Review Dec Distribution",
			description: "Distributable: $25,800.00",
			priority: "medium" as const,
		},
	];

	if (isLoading) {
		return (
			<div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-bold text-3xl tracking-tight">Overview</h2>
						<p className="mt-1 text-muted-foreground">
							Loading live ledger data...
						</p>
					</div>
				</div>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton className="h-32" key={i} />
					))}
				</div>
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<Skeleton className="h-64 lg:col-span-2" />
					<Skeleton className="h-64" />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
				<p className="text-destructive">Failed to load ledger data: {error}</p>
				<Button onClick={() => window.location.reload()}>Retry</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-3xl tracking-tight">Overview</h2>
					<p className="mt-1 text-muted-foreground">
						Monitor fund health, AUM performance, and investor activity.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Button className="gap-2">
						<Plus className="h-4 w-4" />
						Add Investor
					</Button>
					<Button className="gap-2" variant="outline">
						<Building2 className="h-4 w-4" />
						Add AUM
					</Button>
					<Button className="gap-2" variant="outline">
						<DollarSign className="h-4 w-4" />
						Run Distribution
					</Button>
				</div>
			</div>

			<MICFundMetricsRow metrics={mappedMetrics} />

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="flex flex-col gap-6 lg:col-span-2">
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<MICCapitalDeployedCard
							// ✅ Formance: Cash balance from ledger
							cashOnHand={ledgerMetrics.cashBalance}
							// TODO: MIC value requires AUM from Convex
							micValue={mockMetrics.micValue}
							// TODO: Total AUM requires Convex mortgages
							totalAUM={mockMetrics.totalAUM}
							// TODO: Deployed capital requires Convex mortgages
							totalCapitalDeployed={mockMetrics.totalCapitalDeployed}
						/>
						<MICIncomeMetricsCard
							// TODO: Interest earned requires fee account balances from Formance
							interestEarned={mockMetrics.interestEarned}
							// TODO: Lending fees from Formance fee accounts
							lendingFees={mockMetrics.lendingFees}
						/>
					</div>
					<RecentActivityFeed activities={mappedActivities} />
				</div>
				<div className="flex flex-col gap-6 lg:col-span-1">
					<MICCashHealthCard
						// ✅ Formance: Cash balance from ledger
						balance={ledgerMetrics.cashBalance / 100}
						// TODO: Target cash is policy-driven, not in ledger
						target={mockMetrics.targetCash / 100 || 100000}
					/>
					<PendingActionsCard actions={pendingActions} />
				</div>
			</div>
		</div>
	);
}

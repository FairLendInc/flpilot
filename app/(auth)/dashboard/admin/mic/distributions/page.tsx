"use client";

import { Download, Play } from "lucide-react";
import { useState } from "react";
import { DistributionHistoryTable } from "@/components/admin/mic/DistributionHistoryTable";
import { DistributionPreviewSheet } from "@/components/admin/mic/sheets/DistributionPreviewSheet";
import { CurrentPeriodCard } from "@/components/admin/mic/widgets/CurrentPeriodCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMICLedgerData } from "@/lib/hooks/useMICLedgerData";
import { useMICStore } from "@/lib/stores/useMICStore";

export default function DistributionsPage() {
	// Formance ledger data
	const { metrics, investorBalances, recentActivity, isLoading, error } =
		useMICLedgerData();

	// Mock data for actions and personal info
	const { runDistribution, investors: mockInvestors } = useMICStore();
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);

	const now = new Date();
	const MS_PER_DAY = 1000 * 60 * 60 * 24;
	const currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
	const displayLastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
	const periodName = now.toLocaleString("en-US", {
		month: "long",
		year: "numeric",
	});
	const periodDuration =
		currentPeriodEnd.getTime() - currentPeriodStart.getTime();
	const elapsed = now.getTime() - currentPeriodStart.getTime();
	const progress =
		periodDuration > 0
			? Math.min(100, Math.max(0, Math.round((elapsed / periodDuration) * 100)))
			: 0;
	const daysRemaining = Math.ceil(
		(currentPeriodEnd.getTime() - now.getTime()) / MS_PER_DAY
	);
	const periodStatus =
		now >= currentPeriodEnd
			? "closed"
			: daysRemaining <= 3
				? "closing"
				: "open";

	// ✅ Formance: Parse distribution transactions from activity
	const distributionTransactions = recentActivity.filter(
		(act) => act.type === "distribution"
	);

	// Group distributions by period (extract from timestamp)
	const distributionsByPeriod = distributionTransactions.reduce<
		Record<
			string,
			{
				id: string;
				totalAmount: number;
				count: number;
				timestamp: string;
			}
		>
	>((acc, tx) => {
		const date = new Date(tx.timestamp);
		const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

		if (!acc[period]) {
			acc[period] = {
				id: `dist-${period}`,
				totalAmount: 0,
				count: 0,
				timestamp: tx.timestamp,
			};
		}

		acc[period].totalAmount += tx.amount / 100;
		acc[period].count += 1;

		return acc;
	}, {});

	const mappedDistributions = Object.entries(distributionsByPeriod).map(
		([period, data]) => ({
			id: data.id,
			periodName: period,
			totalAmount: data.totalAmount,
			rate: 9.5, // TODO: Calculate actual rate from interest income
			investorCount: metrics.investorCount || 1,
			status: "completed" as const,
			completionDate: data.timestamp,
		})
	);

	// ✅ Formance: Calculate distribution shares from MICCAP balances
	const distributionShares = investorBalances
		.filter((bal) => bal.miccapBalance > 0)
		.map((bal) => {
			// Try to find matching mock investor for name
			const mockInvestor = mockInvestors.find(
				(m) => m.id === bal.investorId || m.id.toUpperCase() === bal.investorId
			);

			return {
				id: bal.investorId,
				// TODO: Get name from Convex user registry
				name: mockInvestor?.name || `Investor ${bal.investorId}`,
				units: bal.miccapBalance / 100,
				percentage: bal.ownershipPercentage,
				// ✅ Formance: Pro-rata share of cash balance
				amount: (metrics.cashBalance * bal.ownershipPercentage) / 10000,
			};
		});

	if (isLoading) {
		return (
			<div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-bold text-3xl tracking-tight">Distributions</h2>
						<p className="mt-1 text-muted-foreground">
							Loading distribution data...
						</p>
					</div>
				</div>
				<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
					<Skeleton className="h-48 xl:col-span-1" />
					<Skeleton className="h-48 xl:col-span-2" />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
				<p className="text-destructive">
					Failed to load distribution data: {error}
				</p>
				<Button onClick={() => window.location.reload()}>Retry</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-3xl tracking-tight">Distributions</h2>
					<p className="mt-1 text-muted-foreground">
						Process monthly fund close and manage investor payouts.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Button className="gap-2" variant="outline">
						<Download className="h-4 w-4" />
						Export History
					</Button>
					<Button className="gap-2" onClick={() => setIsPreviewOpen(true)}>
						<Play className="h-4 w-4" />
						Start Distribution Flow
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
				<div className="xl:col-span-1">
					{/* TODO: Period tracking needs dedicated system */}
					<CurrentPeriodCard
						endDate={displayLastDay}
						periodName={periodName}
						progress={progress}
						startDate={currentPeriodStart}
						status={periodStatus}
					/>
				</div>
				<div className="xl:col-span-2">
					<DistributionHistoryTable data={mappedDistributions} />
				</div>
			</div>

			<DistributionPreviewSheet
				onExecute={() => {
					// TODO: Execute DISTRIBUTE_DIVIDEND numscript
					runDistribution("2024-12");
					setIsPreviewOpen(false);
				}}
				onOpenChange={setIsPreviewOpen}
				open={isPreviewOpen}
				periodName="December 2024"
				shares={distributionShares}
				// ✅ Formance: Cash pool from ledger
				totalPool={metrics.cashBalance / 100}
			/>
		</div>
	);
}

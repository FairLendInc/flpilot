"use client";

import { useAction } from "convex/react";
import { Database, Layers, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { AccountsTable } from "@/components/admin/ledger/AccountsTable";
import { useLedger } from "@/components/admin/ledger/LedgerContext";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";

type LedgerStats = {
	accounts: number;
	transactions: number;
};

function StatCard({
	icon: Icon,
	label,
	value,
	isLoading,
}: {
	icon: typeof Database;
	label: string;
	value: number | string;
	isLoading?: boolean;
}) {
	return (
		<Card className="overflow-hidden border-none shadow-sm dark:bg-slate-900/40">
			<CardContent className="flex items-center gap-4 p-4">
				<div className="rounded-lg bg-primary/10 p-2.5 text-primary">
					<Icon className="size-5" />
				</div>
				<div className="flex flex-col">
					<span className="font-bold text-[10px] text-muted-foreground/60 uppercase tracking-widest">
						{label}
					</span>
					{isLoading ? (
						<div className="h-7 w-16 animate-pulse rounded bg-muted" />
					) : (
						<span className="font-bold text-foreground text-xl tabular-nums">
							{typeof value === "number" ? value.toLocaleString() : value}
						</span>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

export default function AccountsPage() {
	const { selectedLedger } = useLedger();
	const getLedgerStats = useAction(api.ledger.getLedgerStats);

	const [stats, setStats] = useState<LedgerStats | null>(null);
	const [isLoadingStats, setIsLoadingStats] = useState(true);

	useEffect(() => {
		async function fetchStats() {
			setIsLoadingStats(true);
			try {
				const result = await getLedgerStats({ ledgerName: selectedLedger });
				if (result.success && "data" in result && result.data) {
					const statsData = (
						result.data as {
							v2StatsResponse?: {
								data?: { accounts?: number; transactions?: number };
							};
						}
					)?.v2StatsResponse?.data;
					setStats({
						accounts: statsData?.accounts || 0,
						transactions: statsData?.transactions || 0,
					});
				}
			} catch {
				// Stats are optional, don't block on error
			} finally {
				setIsLoadingStats(false);
			}
		}

		fetchStats();
	}, [selectedLedger, getLedgerStats]);

	return (
		<div className="flex flex-col gap-6 overflow-auto p-6">
			<div>
				<h2 className="font-bold text-2xl tracking-tight">Accounts Overview</h2>
				<p className="text-muted-foreground text-sm">
					View all accounts and their balances in the selected ledger.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<StatCard
					icon={Wallet}
					isLoading={isLoadingStats}
					label="Total Accounts"
					value={stats?.accounts || 0}
				/>
				<StatCard
					icon={Layers}
					isLoading={isLoadingStats}
					label="Total Transactions"
					value={stats?.transactions || 0}
				/>
				<StatCard icon={Database} label="Ledger" value={selectedLedger} />
			</div>

			<AccountsTable />
		</div>
	);
}

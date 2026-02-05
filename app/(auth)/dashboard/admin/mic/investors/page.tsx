"use client";

import { Download, Plus } from "lucide-react";
import { useState } from "react";
import { MICInvestorsTable } from "@/components/admin/mic/MICInvestorsTable";
import { AddInvestorSheet } from "@/components/admin/mic/sheets/AddInvestorSheet";
import { InvestorDetailSheet } from "@/components/admin/mic/sheets/InvestorDetailSheet";
import { InvestorRedemptionSheet } from "@/components/admin/mic/sheets/InvestorRedemptionSheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMICLedgerData } from "@/lib/hooks/useMICLedgerData";
import { useMICStore } from "@/lib/stores/useMICStore";

export default function InvestorsPage() {
	// Formance ledger data (live MICCAP balances)
	const { investorBalances, isLoading, error, rawTransactions } =
		useMICLedgerData();

	// Mock data for personal info (TODO: Replace with Convex user registry)
	const {
		investors: mockInvestors,
		addInvestor,
		redeemInvestor,
	} = useMICStore();

	const [activeTab, setActiveTab] = useState("all");
	const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
	const [selectedInvestorId, setSelectedInvestorId] = useState<string | null>(
		null
	);
	const [isRedemptionSheetOpen, setIsRedemptionSheetOpen] = useState(false);

	// Merge Formance balances with mock personal info
	// ✅ Formance: MICCAP balance and ownership percentage
	// TODO: Name and email from Convex user registry
	const mappedInvestors = investorBalances
		.map((bal) => {
			// Try to find matching mock investor for personal info
			const mockInvestor = mockInvestors.find(
				(m) => m.id === bal.investorId || m.id.toUpperCase() === bal.investorId
			);

			return {
				id: bal.investorId,
				// TODO: Get name from Convex user registry
				name: mockInvestor?.name || `Investor ${bal.investorId}`,
				// TODO: Get email from Convex user registry
				email: mockInvestor?.email || null,
				capitalClass: "MICCAP-FLMIC/0", // TODO: Check governance token
				// ✅ Formance: Units owned from ledger
				unitsOwned: bal.miccapBalance / 100,
				// ✅ Formance: Ownership percentage calculated from ledger
				ownershipPercentage: bal.ownershipPercentage,
				// TODO: Replace with current unit price when available
				currentValue: bal.miccapBalance / 100,
				accrualStatus: "up-to-date" as const,
				lastAccruedDate: undefined,
			};
		})
		.filter((inv) => {
			if (activeTab === "all") return true;
			if (activeTab === "pending") return false;
			if (activeTab === "governance")
				return inv.capitalClass === "MICCAP-FLMIC/1";
			return true;
		});

	const selectedInvestor =
		mappedInvestors.find((inv) => inv.id === selectedInvestorId) || null;

	// Get transactions for selected investor
	const investorTransactions = selectedInvestorId
		? rawTransactions
				.filter((tx) =>
					tx.postings.some(
						(p) =>
							p.source.includes(selectedInvestorId) ||
							p.destination.includes(selectedInvestorId)
					)
				)
				.flatMap((tx) =>
					tx.postings
						.filter(
							(p) =>
								p.source.includes(selectedInvestorId) ||
								p.destination.includes(selectedInvestorId)
						)
						.map((p) => ({
							id: `${tx.id || tx.txid}-${p.source}-${p.destination}`,
							type: (p.destination.includes("capital")
								? "subscription"
								: "distribution") as "subscription" | "distribution",
							timestamp: tx.timestamp || tx.date || null,
							amount: Number(p.amount) / 100,
							description: `${p.source.split(":").pop()} → ${p.destination.split(":").pop()}`,
							balanceAfter: 0, // TODO: Calculate running balance
						}))
				)
		: [];

	if (isLoading) {
		return (
			<div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-bold text-3xl tracking-tight">
							Investor Management
						</h2>
						<p className="mt-1 text-muted-foreground">
							Loading investor data from ledger...
						</p>
					</div>
				</div>
				<Skeleton className="h-12 w-64" />
				<Skeleton className="h-[400px]" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
				<p className="text-destructive">
					Failed to load investor data: {error}
				</p>
				<Button onClick={() => window.location.reload()}>Retry</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-3xl tracking-tight">
						Investor Management
					</h2>
					<p className="mt-1 text-muted-foreground">
						Manage MIC investors, capital positions, and redemptions.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Button className="gap-2" variant="outline">
						<Download className="h-4 w-4" />
						Export CSV
					</Button>
					<Button className="gap-2" onClick={() => setIsAddSheetOpen(true)}>
						<Plus className="h-4 w-4" />
						Add Investor
					</Button>
				</div>
			</div>

			<Tabs className="w-full" defaultValue="all" onValueChange={setActiveTab}>
				<div className="flex items-center justify-between">
					<TabsList>
						<TabsTrigger value="all">All Investors</TabsTrigger>
						<TabsTrigger value="pending">Pending Redemptions</TabsTrigger>
						<TabsTrigger value="governance">Governance Holders</TabsTrigger>
					</TabsList>
				</div>
				<TabsContent className="mt-6" value={activeTab}>
					<MICInvestorsTable
						data={mappedInvestors}
						onRedeem={(inv) => {
							setSelectedInvestorId(inv.id);
							setIsRedemptionSheetOpen(true);
						}}
						onViewDetails={(inv) => setSelectedInvestorId(inv.id)}
					/>
				</TabsContent>
			</Tabs>

			<AddInvestorSheet
				onOpenChange={setIsAddSheetOpen}
				onSubmit={(data) => {
					// TODO: Execute INVESTOR_SUBSCRIBE numscript instead of mock
					addInvestor({
						name: data.name,
						email: data.email,
					});
				}}
				open={isAddSheetOpen}
			/>

			<InvestorDetailSheet
				investor={selectedInvestor}
				onOpenChange={(open) => !open && setSelectedInvestorId(null)}
				onRedeemClick={(inv) => {
					setSelectedInvestorId(inv.id);
					setIsRedemptionSheetOpen(true);
				}}
				open={!!selectedInvestorId && !isRedemptionSheetOpen}
				transactions={investorTransactions}
			/>

			{selectedInvestor && (
				<InvestorRedemptionSheet
					currentUnits={selectedInvestor.unitsOwned}
					investorName={selectedInvestor.name}
					onOpenChange={(open) => {
						setIsRedemptionSheetOpen(open);
						if (!open) setSelectedInvestorId(null);
					}}
					onSubmit={(data) => {
						// TODO: Execute redemption numscript instead of mock
						redeemInvestor(selectedInvestor.id, data.redemptionUnits * 100);
					}}
					open={isRedemptionSheetOpen}
				/>
			)}
		</div>
	);
}

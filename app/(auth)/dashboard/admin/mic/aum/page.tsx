"use client";

/**
 * AUM Portfolio Page
 *
 * TODO: Integrate with Formance Ledger
 *
 * AUM (Assets Under Management) data requires Convex `mortgages` table integration.
 * Formance ledger only tracks cash flows, not mortgage metadata.
 *
 * Data that CANNOT come from Formance:
 * - Mortgage address, principal, interest rate
 * - AUM state (active/repaid/defaulted)
 * - Origination date, next payment date
 *
 * Data that COULD come from Formance (future):
 * - MIC ownership percentage via mortgage share tokens
 * - Accrued interest via income accounts
 *
 * For now, this page uses mock data from useMICStore.
 */

import { Filter, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { MICAUMTable } from "@/components/admin/mic/MICAUMTable";
import { AddAUMSheet } from "@/components/admin/mic/sheets/AddAUMSheet";
import { AUMStateSheet } from "@/components/admin/mic/sheets/AUMStateSheet";
import { SellAUMSheet } from "@/components/admin/mic/sheets/SellAUMSheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMICStore } from "@/lib/stores/useMICStore";

export default function AUMPortfolioPage() {
	const { aums, addAUM, sellAUM, updateAUMState } = useMICStore();
	const [activeTab, setActiveTab] = useState("all");
	const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
	const [selectedAUMId, setSelectedAUMId] = useState<string | null>(null);
	const [isSellSheetOpen, setIsSellSheetOpen] = useState(false);
	const [isStateSheetOpen, setIsStateSheetOpen] = useState(false);

	const mappedAUMs = useMemo(
		() =>
			aums
				.map((aum) => ({
					id: aum.id,
					mortgageName: aum.address.split(",")[0],
					address: aum.address,
					totalValue: aum.principal / 100,
					ownershipPercentage: aum.micOwnership,
					micValue: (aum.principal * aum.micOwnership) / 10000,
					accrualStatus:
						aum.state === "active"
							? ("up-to-date" as const)
							: ("pending" as const),
					lastAccruedDate: aum.originationDate,
				}))
				.filter((aum) => {
					if (activeTab === "all") return true;
					if (activeTab === "full") return aum.ownershipPercentage === 100;
					if (activeTab === "partial") return aum.ownershipPercentage < 100;
					if (activeTab === "stressed")
						return aum.accrualStatus !== "up-to-date";
					return true;
				}),
		[aums, activeTab]
	);

	const selectedAUM = useMemo(
		() => aums.find((a) => a.id === selectedAUMId) || null,
		[aums, selectedAUMId]
	);

	return (
		<div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-3xl tracking-tight">AUM Portfolio</h2>
					<p className="mt-1 text-muted-foreground">
						Manage fund deployments, mortgage ownership, and state transitions.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Button className="gap-2" variant="outline">
						<Filter className="h-4 w-4" />
						Advanced Filters
					</Button>
					<Button className="gap-2" onClick={() => setIsAddSheetOpen(true)}>
						<Plus className="h-4 w-4" />
						Add AUM
					</Button>
				</div>
			</div>

			<Tabs className="w-full" defaultValue="all" onValueChange={setActiveTab}>
				<TabsList>
					<TabsTrigger value="all">Every AUM</TabsTrigger>
					<TabsTrigger value="full">100% Ownership</TabsTrigger>
					<TabsTrigger value="partial">Partial Ownership</TabsTrigger>
					<TabsTrigger value="stressed">Stressed Assets</TabsTrigger>
				</TabsList>
				<TabsContent className="mt-6" value={activeTab}>
					<MICAUMTable
						data={mappedAUMs}
						onManage={(asset) => {
							setSelectedAUMId(asset.id);
							setIsStateSheetOpen(true);
						}}
						onSellFraction={(asset) => {
							setSelectedAUMId(asset.id);
							setIsSellSheetOpen(true);
						}}
					/>
				</TabsContent>
			</Tabs>

			<AddAUMSheet
				onOpenChange={setIsAddSheetOpen}
				onSubmit={(data) => {
					addAUM({
						address: data.address,
						principal: data.totalPrincipal * 100,
						micOwnership: data.micOwnershipPercentage,
						interestRate: 10,
						originationDate: new Date().toISOString(),
					});
				}}
				open={isAddSheetOpen}
			/>

			{selectedAUM && (
				<SellAUMSheet
					assetName={selectedAUM.address.split(",")[0]}
					currentShare={selectedAUM.micOwnership}
					onOpenChange={(open) => {
						setIsSellSheetOpen(open);
						if (!open) setSelectedAUMId(null);
					}}
					onSubmit={(data) => {
						sellAUM(
							selectedAUM.id,
							data.percentageToSell,
							"aisle",
							data.salesPrice * 100
						);
					}}
					open={isSellSheetOpen}
				/>
			)}

			{selectedAUM && (
				<AUMStateSheet
					assetName={selectedAUM.address.split(",")[0]}
					currentState={selectedAUM.state}
					onOpenChange={(open) => {
						setIsStateSheetOpen(open);
						if (!open) setSelectedAUMId(null);
					}}
					onStateChange={(state) => {
						updateAUMState(
							selectedAUM.id,
							state as "active" | "repaid" | "defaulted" | "pending"
						);
					}}
					open={isStateSheetOpen}
				/>
			)}
		</div>
	);
}

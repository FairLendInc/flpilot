"use client";

import { useAction, useQuery } from "convex/react";
import { Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { getMortgageShareAsset } from "@/lib/ledger/utils";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { MortgageOwnershipRow } from "./MortgageOwnershipRow";
import { RefreshButton } from "./RefreshButton";

type OwnershipEntry = {
	ownerId: string;
	percentage: number;
};

type OwnershipByMortgage = Record<string, OwnershipEntry[]>;

export function MortgageOwnershipTable({ className }: { className?: string }) {
	const mortgages = useQuery(api.mortgages.listAllMortgagesWithBorrowers, {});
	const getOwnershipSnapshot = useAction(api.ledger.getOwnershipSnapshot);

	const [ownershipData, setOwnershipData] = useState<OwnershipByMortgage>({});
	const [isLoadingOwnership, setIsLoadingOwnership] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");

	const fetchOwnership = useCallback(async () => {
		setIsLoadingOwnership(true);
		try {
			const result = await getOwnershipSnapshot({});
			if (result.success && result.ownershipByMortgage) {
				setOwnershipData(result.ownershipByMortgage);
			}
		} catch (err) {
			console.error("Failed to fetch ownership:", err);
		} finally {
			setIsLoadingOwnership(false);
		}
	}, [getOwnershipSnapshot]);

	useEffect(() => {
		fetchOwnership();
	}, [fetchOwnership]);

	// Filter mortgages by search
	const filteredMortgages = (mortgages || []).filter(
		(mortgage: NonNullable<typeof mortgages>[number]) => {
			const addressStr = `${mortgage.address.street}, ${mortgage.address.city}`;
			return (
				addressStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
				mortgage._id.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}
	);

	// Calculate stats
	const totalMortgages = mortgages?.length || 0;
	const mintedCount = Object.keys(ownershipData).length;
	const notMintedCount = totalMortgages - mintedCount;

	const isLoading = mortgages === undefined || isLoadingOwnership;

	if (isLoading && (!mortgages || mortgages.length === 0)) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			{/* Stats */}
			<div className="flex gap-4 text-sm">
				<div className="rounded-lg bg-muted/50 px-3 py-2">
					<span className="text-muted-foreground">Total:</span>{" "}
					<span className="font-semibold">{totalMortgages}</span>
				</div>
				<div className="rounded-lg bg-green-500/10 px-3 py-2">
					<span className="text-green-600">Minted:</span>{" "}
					<span className="font-semibold">{mintedCount}</span>
				</div>
				<div className="rounded-lg bg-amber-500/10 px-3 py-2">
					<span className="text-amber-600">Not Minted:</span>{" "}
					<span className="font-semibold">{notMintedCount}</span>
				</div>
			</div>

			{/* Search and refresh */}
			<div className="flex items-center justify-between gap-4">
				<div className="relative max-w-sm flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground/60" />
					<Input
						className="border-muted-foreground/20 bg-background/50 pl-9 focus-visible:ring-primary/20"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search by address or ID..."
						value={searchQuery}
					/>
				</div>
				<RefreshButton
					isLoading={isLoadingOwnership}
					onClick={fetchOwnership}
				/>
			</div>

			{/* Mortgage list */}
			{filteredMortgages.length === 0 ? (
				<EmptyState
					description={
						searchQuery
							? "No mortgages match your search."
							: "No mortgages found in the system."
					}
					title="No Mortgages"
				/>
			) : (
				<div className="flex flex-col gap-3">
					{filteredMortgages.map(
						(mortgage: NonNullable<typeof mortgages>[number]) => {
							// Ownership data is keyed by the hash of the mortgage ID (not the full ID)
							// The asset is M{hash}, so the key is {hash}
							const assetName = getMortgageShareAsset(mortgage._id);
							const hashKey = assetName.slice(1); // Remove "M" prefix
							const ownership = ownershipData[hashKey] || null;
							const addressStr = `${mortgage.address.street}, ${mortgage.address.city}, ${mortgage.address.state}`;

							return (
								<MortgageOwnershipRow
									address={addressStr}
									key={mortgage._id}
									loanAmount={mortgage.loanAmount}
									mortgageId={mortgage._id}
									onMintSuccess={fetchOwnership}
									ownership={ownership}
								/>
							);
						}
					)}
				</div>
			)}

			<div className="px-2 font-medium text-[11px] text-muted-foreground">
				{filteredMortgages.length} mortgage
				{filteredMortgages.length !== 1 ? "s" : ""}
			</div>
		</div>
	);
}

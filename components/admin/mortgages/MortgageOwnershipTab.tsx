"use client";

import { useAction } from "convex/react";
import { Coins, Loader2, TrendingUp, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { MintOwnershipDialog } from "../ledger/MintOwnershipDialog";
import { OwnershipCapTable } from "../ledger/OwnershipCapTable";
import { AssignOwnershipDialog } from "./AssignOwnershipDialog";
import { MortgageTradeHistory } from "./MortgageTradeHistory";

type OwnershipEntry = {
	ownerId: string;
	percentage: number;
	label?: string;
};

type MortgageOwnershipTabProps = {
	mortgageId: Id<"mortgages">;
	mortgageAddress: string;
	className?: string;
};

type OwnershipState =
	| "loading"
	| "not_minted"
	| "minted_fairlend_only"
	| "minted_with_investors";

export function MortgageOwnershipTab({
	mortgageId,
	mortgageAddress,
	className,
}: MortgageOwnershipTabProps) {
	const getOwnershipFromLedger = useAction(api.ledger.getOwnershipFromLedger);

	const [ownership, setOwnership] = useState<OwnershipEntry[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showMintDialog, setShowMintDialog] = useState(false);
	const [showAssignDialog, setShowAssignDialog] = useState(false);

	const fetchOwnership = useCallback(async () => {
		setIsLoading(true);

		// DEBUG: Log the mortgage ID being queried
		console.log("[MortgageOwnershipTab] Fetching ownership", {
			mortgageId,
			mortgageIdAsString: mortgageId as string,
		});

		try {
			const result = await getOwnershipFromLedger({
				mortgageId: mortgageId as string,
			});

			// DEBUG: Log the full result
			console.log("[MortgageOwnershipTab] getOwnershipFromLedger result", {
				success: result.success,
				ownership: result.ownership,
				totalShares: result.totalShares,
				error: result.error,
				ownershipLength: result.ownership?.length,
			});

			if (result.success && result.ownership) {
				setOwnership(result.ownership);
			} else {
				setOwnership([]);
			}
		} catch (err) {
			console.error("[MortgageOwnershipTab] Failed to fetch ownership:", err);
			setOwnership([]);
		} finally {
			setIsLoading(false);
		}
	}, [getOwnershipFromLedger, mortgageId]);

	useEffect(() => {
		fetchOwnership();
	}, [fetchOwnership]);

	// Determine state
	function getState(): OwnershipState {
		if (isLoading) return "loading";
		if (ownership.length === 0) return "not_minted";

		const fairlendOwnership = ownership.find((o) => o.ownerId === "fairlend");
		if (
			ownership.length === 1 &&
			fairlendOwnership &&
			fairlendOwnership.percentage >= 99.9
		) {
			return "minted_fairlend_only";
		}

		return "minted_with_investors";
	}

	const state = getState();

	if (state === "loading") {
		return (
			<div className="flex items-center justify-center py-16">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className={cn("flex flex-col gap-6", className)}>
			{/* Not Minted State */}
			{state === "not_minted" && (
				<Card className="flex flex-col items-center gap-4 p-8 text-center">
					<div className="rounded-full bg-amber-500/10 p-4">
						<Coins className="size-8 text-amber-500" />
					</div>
					<div className="flex flex-col gap-1">
						<h3 className="font-semibold text-lg">Not Minted</h3>
						<p className="max-w-[300px] text-muted-foreground text-sm">
							This mortgage has not been minted into the Formance ledger yet.
							Mint it to enable ownership tracking and trading.
						</p>
					</div>
					<Button className="mt-2" onClick={() => setShowMintDialog(true)}>
						<Coins className="mr-2 size-4" />
						Mint to Ledger
					</Button>
				</Card>
			)}

			{/* Minted + 100% FairLend State */}
			{state === "minted_fairlend_only" && (
				<>
					{/* Status badge */}
					<div className="flex items-center gap-2">
						<Badge
							className="bg-green-500/10 text-green-600 hover:bg-green-500/20"
							variant="secondary"
						>
							Minted
						</Badge>
						<span className="text-muted-foreground text-sm">
							100% owned by FairLend
						</span>
					</div>

					{/* Cap table */}
					<OwnershipCapTable
						ownership={ownership.map((o) => ({
							...o,
							label: o.ownerId === "fairlend" ? "FairLend" : undefined,
						}))}
					/>

					{/* Assign card */}
					<Card className="flex flex-col items-center gap-4 p-6 text-center">
						<div className="rounded-full bg-primary/10 p-3">
							<Users className="size-6 text-primary" />
						</div>
						<div className="flex flex-col gap-1">
							<h3 className="font-semibold">Assign Ownership</h3>
							<p className="max-w-[280px] text-muted-foreground text-sm">
								Transfer shares to an investor or the FairLend MIC.
							</p>
						</div>
						<Button onClick={() => setShowAssignDialog(true)} variant="outline">
							<Users className="mr-2 size-4" />
							Assign Ownership
						</Button>
					</Card>

					{/* Trade history */}
					<div className="flex flex-col gap-3">
						<div className="flex items-center gap-2">
							<TrendingUp className="size-4 text-muted-foreground" />
							<h3 className="font-semibold text-sm">Trade History</h3>
						</div>
						<MortgageTradeHistory mortgageId={mortgageId as string} />
					</div>
				</>
			)}

			{/* Minted + Investor Ownership State */}
			{state === "minted_with_investors" && (
				<>
					{/* Status badge */}
					<div className="flex items-center gap-2">
						<Badge
							className="bg-green-500/10 text-green-600 hover:bg-green-500/20"
							variant="secondary"
						>
							Minted
						</Badge>
						<Badge
							className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
							variant="secondary"
						>
							{ownership.length} Owner{ownership.length !== 1 ? "s" : ""}
						</Badge>
					</div>

					{/* Cap table */}
					<OwnershipCapTable
						ownership={ownership.map((o) => ({
							...o,
							label: o.ownerId === "fairlend" ? "FairLend" : undefined,
						}))}
					/>

					{/* Trade history */}
					<div className="flex flex-col gap-3">
						<div className="flex items-center gap-2">
							<TrendingUp className="size-4 text-muted-foreground" />
							<h3 className="font-semibold text-sm">Trade History</h3>
						</div>
						<MortgageTradeHistory mortgageId={mortgageId as string} />
					</div>
				</>
			)}

			{/* Dialogs */}
			<MintOwnershipDialog
				mortgageAddress={mortgageAddress}
				mortgageId={mortgageId as string}
				onOpenChange={setShowMintDialog}
				onSuccess={fetchOwnership}
				open={showMintDialog}
			/>

			<AssignOwnershipDialog
				mortgageId={mortgageId as string}
				onOpenChange={setShowAssignDialog}
				onSuccess={fetchOwnership}
				open={showAssignDialog}
			/>
		</div>
	);
}

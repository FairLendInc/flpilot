"use client";

import { Flame, Home, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BurnOwnershipDialog } from "./BurnOwnershipDialog";
import { MintOwnershipDialog } from "./MintOwnershipDialog";
import { OwnershipCapTable } from "./OwnershipCapTable";

type OwnershipEntry = {
	ownerId: string;
	percentage: number;
};

type MortgageOwnershipRowProps = {
	mortgageId: string;
	address: string;
	loanAmount: number;
	ownership: OwnershipEntry[] | null;
	onMintSuccess?: () => void;
	className?: string;
};

export function MortgageOwnershipRow({
	mortgageId,
	address,
	loanAmount,
	ownership,
	onMintSuccess,
	className,
}: MortgageOwnershipRowProps) {
	const [showMintDialog, setShowMintDialog] = useState(false);
	const [showBurnDialog, setShowBurnDialog] = useState(false);
	const isMinted = ownership !== null && ownership.length > 0;
	const totalShares = ownership?.reduce((sum, o) => sum + o.percentage, 0) ?? 0;

	return (
		<>
			<Card className={cn("overflow-hidden", className)}>
				<CardContent className="p-4">
					<div className="flex flex-col gap-4">
						<div className="flex items-start justify-between">
							<div className="flex items-start gap-3">
								<div className="rounded-lg bg-purple-500/10 p-2 text-purple-500">
									<Home className="size-4" />
								</div>
								<div className="flex flex-col gap-0.5">
									<span className="font-medium text-foreground text-sm">
										{address}
									</span>
									<span className="font-mono text-[10px] text-muted-foreground">
										{mortgageId}
									</span>
								</div>
							</div>

							<div className="flex items-center gap-3">
								<span className="font-bold font-mono text-foreground text-sm">
									${loanAmount.toLocaleString()}
								</span>
								{isMinted ? (
									<Badge
										className="bg-green-500/10 text-green-500"
										variant="outline"
									>
										Minted
									</Badge>
								) : (
									<Badge
										className="bg-amber-500/10 text-amber-500"
										variant="outline"
									>
										Not Minted
									</Badge>
								)}
							</div>
						</div>

						{isMinted ? (
							<div className="space-y-3">
								<div className="rounded-lg bg-muted/30 p-3">
									<OwnershipCapTable ownership={ownership} />
								</div>
								<div className="flex justify-end">
									<Button
										className="gap-2 text-red-600 hover:bg-red-500/10 hover:text-red-700"
										onClick={() => setShowBurnDialog(true)}
										size="sm"
										variant="ghost"
									>
										<Flame className="size-4" />
										Burn Shares
									</Button>
								</div>
							</div>
						) : (
							<div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
								<span className="text-muted-foreground text-sm">
									This mortgage has not been minted in the ledger yet.
								</span>
								<Button
									className="gap-2"
									onClick={() => setShowMintDialog(true)}
									size="sm"
									variant="outline"
								>
									<Sparkles className="size-4" />
									Mint Ownership
								</Button>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<MintOwnershipDialog
				mortgageAddress={address}
				mortgageId={mortgageId}
				onOpenChange={setShowMintDialog}
				onSuccess={onMintSuccess}
				open={showMintDialog}
			/>

			<BurnOwnershipDialog
				currentShares={totalShares}
				mortgageAddress={address}
				mortgageId={mortgageId}
				onOpenChange={setShowBurnDialog}
				onSuccess={onMintSuccess}
				open={showBurnDialog}
			/>
		</>
	);
}

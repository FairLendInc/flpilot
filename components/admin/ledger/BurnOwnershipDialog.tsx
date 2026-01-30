"use client";

import { useAction } from "convex/react";
import { Flame, Loader2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";
import { getMortgageShareAsset } from "@/lib/ledger/utils";

type BurnOwnershipDialogProps = {
	mortgageId: string;
	mortgageAddress: string;
	currentShares: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
};

export function BurnOwnershipDialog({
	mortgageId,
	mortgageAddress,
	currentShares,
	open,
	onOpenChange,
	onSuccess,
}: BurnOwnershipDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const burnShares = useAction(api.ledger.burnMortgageShares);

	async function handleBurn() {
		setIsLoading(true);

		try {
			const shareAsset = getMortgageShareAsset(mortgageId);

			console.log("[BurnOwnershipDialog] Starting burn", {
				mortgageId,
				mortgageAddress,
				shareAsset,
				currentShares,
			});

			const result = await burnShares({ mortgageId });

			console.log("[BurnOwnershipDialog] Burn result", result);

			if (result.success) {
				toast.success("Shares burned successfully", {
					description: `${result.burnedShares} shares removed from ledger`,
				});
				onOpenChange(false);
				onSuccess?.();
			} else {
				toast.error("Failed to burn shares", {
					description: result.error || "Unknown error",
				});
			}
		} catch (error) {
			console.error("[BurnOwnershipDialog] Exception", error);
			toast.error("Error burning shares", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-red-600">
						<Flame className="size-5" />
						Burn Mortgage Shares
					</DialogTitle>
					<DialogDescription className="text-left">
						This will destroy all shares for this mortgage, removing it from
						ledger tracking.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
						<div className="flex gap-3">
							<TriangleAlert className="size-5 shrink-0 text-amber-500" />
							<div className="space-y-1 text-sm">
								<p className="font-medium text-amber-700 dark:text-amber-400">
									Destructive Action
								</p>
								<p className="text-muted-foreground">
									This action will send all <strong>{currentShares}</strong>{" "}
									shares back to @world, effectively "unminting" them. This
									cannot be undone without reminting.
								</p>
							</div>
						</div>
					</div>

					<div className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Property</span>
							<span className="font-medium">{mortgageAddress}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Mortgage ID</span>
							<span className="font-mono text-xs">{mortgageId}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Shares to burn</span>
							<span className="font-medium text-red-600">{currentShares}</span>
						</div>
					</div>
				</div>

				<DialogFooter className="gap-2">
					<Button
						disabled={isLoading}
						onClick={() => onOpenChange(false)}
						variant="outline"
					>
						Cancel
					</Button>
					<Button
						className="gap-2"
						disabled={isLoading}
						onClick={handleBurn}
						variant="destructive"
					>
						{isLoading ? (
							<>
								<Loader2 className="size-4 animate-spin" />
								Burning...
							</>
						) : (
							<>
								<Flame className="size-4" />
								Burn All Shares
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

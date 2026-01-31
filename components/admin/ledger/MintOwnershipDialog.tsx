"use client";

import { useAction } from "convex/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { api } from "@/convex/_generated/api";
import { getMortgageShareAsset } from "@/lib/ledger/utils";

type MintOwnershipDialogProps = {
	mortgageId: string;
	mortgageAddress: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
};

export function MintOwnershipDialog({
	mortgageId,
	mortgageAddress,
	open,
	onOpenChange,
	onSuccess,
}: MintOwnershipDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const initializeOwnership = useAction(api.ledger.executeNumscript);
	const getOwnershipFromLedger = useAction(api.ledger.getOwnershipFromLedger);

	async function handleMint() {
		setIsLoading(true);

		try {
			// Generate idempotency reference
			const reference = `init:mint-ui:${mortgageId}:${Date.now()}`;
			const shareAsset = getMortgageShareAsset(mortgageId);

			// DEBUG: Log minting details
			console.log("[MintOwnershipDialog] Starting mint", {
				mortgageId,
				mortgageAddress,
				shareAsset,
				reference,
			});

			// GUARD: Check if ownership already exists before minting
			console.log("[MintOwnershipDialog] Checking for existing ownership...");
			const existingOwnership = await getOwnershipFromLedger({ mortgageId });

			if (
				existingOwnership.success &&
				existingOwnership.ownership &&
				existingOwnership.ownership.length > 0
			) {
				const totalShares = existingOwnership.ownership.reduce(
					(sum, o) => sum + o.percentage,
					0
				);
				console.error(
					"[MintOwnershipDialog] BLOCKED - Ownership already exists",
					{
						totalShares,
						ownership: existingOwnership.ownership,
					}
				);
				toast.error("Cannot mint - ownership already exists", {
					description: `This mortgage already has ${totalShares} shares in the ledger. Minting more would exceed the 100 share limit.`,
				});
				setIsLoading(false);
				return;
			}

			// Numscript to mint 100 shares to FairLend
			const script = `
vars {
  asset $asset
}

send [$asset 100] (
  source = @world
  destination = @fairlend:inventory
)
`.trim();

			console.log("[MintOwnershipDialog] Executing numscript", {
				ledgerName: "flmarketplace",
				script,
				variables: { asset: shareAsset },
			});

			const result = await initializeOwnership({
				ledgerName: "flmarketplace",
				script,
				variables: {
					asset: shareAsset,
				},
				reference,
				metadata: {
					type: "mortgage_ownership_init",
					mortgageId,
					source: "admin-ledger-ui",
				},
			});

			const resultData = "data" in result ? result.data : undefined;
			const resultError = "error" in result ? result.error : undefined;

			// DEBUG: Log full result
			console.log("[MintOwnershipDialog] executeNumscript result", {
				success: result.success,
				hasData: !!resultData,
				data: resultData,
				error: resultError,
			});

			if (result.success) {
				// CRITICAL: Verify the mint actually worked before reporting success
				console.log(
					"[MintOwnershipDialog] Mint reported success, verifying..."
				);

				// Wait a moment for eventual consistency
				await new Promise((resolve) => setTimeout(resolve, 1000));

				// Verify the ownership was created
				const verification = await getOwnershipFromLedger({ mortgageId });

				console.log("[MintOwnershipDialog] Verification result", {
					success: verification.success,
					ownership: verification.ownership,
					totalShares: verification.totalShares,
					error: verification.error,
				});

				if (
					verification.success &&
					verification.ownership &&
					verification.ownership.length > 0
				) {
					const fairlendOwnership = verification.ownership.find(
						(o) => o.ownerId === "fairlend"
					);

					if (fairlendOwnership && fairlendOwnership.percentage > 0) {
						console.log(
							"[MintOwnershipDialog] Verification PASSED - ownership confirmed",
							{
								fairlendPercentage: fairlendOwnership.percentage,
							}
						);

						toast.success("Ownership initialized and verified", {
							description: `${fairlendOwnership.percentage}% ownership confirmed in ledger`,
						});
						onOpenChange(false);
						onSuccess?.();
					} else {
						console.error(
							"[MintOwnershipDialog] Verification FAILED - fairlend has no ownership",
							{
								ownership: verification.ownership,
							}
						);
						toast.error("Minting may have failed", {
							description:
								"Transaction succeeded but ownership not detected. Check console for details.",
						});
					}
				} else {
					console.error(
						"[MintOwnershipDialog] Verification FAILED - no ownership found",
						{
							verification,
						}
					);
					toast.error("Minting may have failed", {
						description:
							"Transaction succeeded but ownership not detected. Check console for details.",
					});
				}
			} else if ("error" in result) {
				// Check if it's an idempotency conflict (already minted)
				if (result.error?.includes("409")) {
					console.log("[MintOwnershipDialog] 409 conflict - already minted");
					toast.info("Already minted", {
						description: "This mortgage already has ledger ownership",
					});
					onOpenChange(false);
					onSuccess?.();
				} else {
					console.error("[MintOwnershipDialog] Minting failed with error", {
						error: result.error,
					});
					toast.error("Failed to initialize ownership", {
						description: result.error,
					});
				}
			}
		} catch (err) {
			console.error("[MintOwnershipDialog] Exception during minting", err);
			toast.error("Failed to initialize ownership", {
				description: err instanceof Error ? err.message : "Unknown error",
			});
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<AlertDialog onOpenChange={onOpenChange} open={open}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Initialize Mortgage Ownership</AlertDialogTitle>
					<AlertDialogDescription className="flex flex-col gap-4">
						<p>
							This will create 100 share tokens for mortgage at{" "}
							<span className="font-mono font-semibold">{mortgageAddress}</span>{" "}
							and assign them to FairLend.
						</p>
						<div className="rounded-lg bg-muted/50 p-3 text-sm">
							<p className="font-semibold text-foreground">What happens:</p>
							<ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
								<li>100 share tokens are minted for this mortgage</li>
								<li>100% ownership is assigned to FairLend</li>
								<li>
									Ownership can then be transferred to investors via deals
								</li>
							</ul>
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						disabled={isLoading}
						onClick={(e) => {
							e.preventDefault();
							handleMint();
						}}
					>
						{isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
						{isLoading ? "Minting..." : "Mint Ownership"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

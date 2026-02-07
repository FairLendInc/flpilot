"use client";

import { useAction, useQuery } from "convex/react";
import { Loader2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { getMortgageShareAsset } from "@/lib/ledger/utils";

type AssignOwnershipDialogProps = {
	mortgageId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
};

export function AssignOwnershipDialog({
	mortgageId,
	open,
	onOpenChange,
	onSuccess,
}: AssignOwnershipDialogProps) {
	const investors = useQuery(api.users.listAllUsers, {});
	const executeNumscript = useAction(api.ledger.executeNumscript);

	const [selectedInvestorId, setSelectedInvestorId] = useState<string>("");
	const [percentage, setPercentage] = useState<string>("100");
	const [isLoading, setIsLoading] = useState(false);

	// Get all users (filtering by role not available in listAllUsers response)
	const investorList = investors || [];

	// Add FairLend MIC as a special option
	const FLMIC_ID = "flmic";

	async function handleAssign() {
		if (!selectedInvestorId) {
			toast.error("Please select an investor or MIC");
			return;
		}

		const pct = Number.parseFloat(percentage);
		if (Number.isNaN(pct) || pct <= 0 || pct > 100) {
			toast.error("Percentage must be between 1 and 100");
			return;
		}

		setIsLoading(true);

		try {
			// Generate idempotency reference
			const reference = `assign:${mortgageId}:${selectedInvestorId}:${Date.now()}`;

			// Determine destination account
			const destAccount =
				selectedInvestorId === FLMIC_ID
					? "mic:FLMIC:inventory"
					: `investor:${selectedInvestorId}:inventory`;

			// Numscript to transfer shares from FairLend to investor
			const script = `
vars {
  asset $asset
}

send [$asset ${Math.round(pct)}] (
  source = @fairlend:inventory
  destination = @${destAccount}
)
`.trim();

			const result = await executeNumscript({
				ledgerName: "flmarketplace",
				script,
				variables: {
					asset: getMortgageShareAsset(mortgageId),
				},
				reference,
				metadata: {
					type: "ownership_transfer",
					mortgageId,
					fromOwnerId: "fairlend",
					toOwnerId: selectedInvestorId,
					percentage: String(pct),
					source: "admin-assign-dialog",
				},
			});

			if (result.success) {
				toast.success("Ownership assigned", {
					description: `${pct}% transferred successfully`,
				});
				onOpenChange(false);
				onSuccess?.();

				// Reset form
				setSelectedInvestorId("");
				setPercentage("100");
			} else if ("error" in result) {
				// Check for insufficient funds
				if (result.error?.includes("INSUFFICIENT_FUND")) {
					toast.error("Insufficient shares", {
						description: "FairLend doesn't have enough shares to transfer",
					});
				} else {
					toast.error("Failed to assign ownership", {
						description: result.error,
					});
				}
			}
		} catch (err) {
			toast.error("Failed to assign ownership", {
				description: err instanceof Error ? err.message : "Unknown error",
			});
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Assign Ownership</DialogTitle>
					<DialogDescription>
						Transfer mortgage shares from FairLend to an investor or the
						FairLend MIC.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4 py-4">
					{/* Investor selector */}
					<div className="flex flex-col gap-2">
						<Label htmlFor="investor">Assign To</Label>
						<Select
							onValueChange={setSelectedInvestorId}
							value={selectedInvestorId}
						>
							<SelectTrigger id="investor">
								<SelectValue placeholder="Select investor or MIC..." />
							</SelectTrigger>
							<SelectContent>
								{/* FairLend MIC option */}
								<SelectItem value={FLMIC_ID}>
									<div className="flex items-center gap-2">
										<Users className="size-4 text-primary" />
										<span>FairLend MIC</span>
										<Badge className="ml-1" variant="secondary">
											MIC
										</Badge>
									</div>
								</SelectItem>

								{/* Investors */}
								{investorList.map(
									(investor: NonNullable<typeof investors>[number]) => (
										<SelectItem key={investor._id} value={investor._id}>
											<div className="flex items-center gap-2">
												<span>
													{investor.first_name || ""} {investor.last_name || ""}
												</span>
												<span className="text-muted-foreground text-xs">
													({investor.email})
												</span>
											</div>
										</SelectItem>
									)
								)}
							</SelectContent>
						</Select>
					</div>

					{/* Percentage input */}
					<div className="flex flex-col gap-2">
						<Label htmlFor="percentage">Percentage</Label>
						<div className="relative">
							<Input
								className="pr-8"
								id="percentage"
								max={100}
								min={1}
								onChange={(e) => setPercentage(e.target.value)}
								type="number"
								value={percentage}
							/>
							<span className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground text-sm">
								%
							</span>
						</div>
						<p className="text-muted-foreground text-xs">
							Enter percentage of ownership to transfer (1-100)
						</p>
					</div>
				</div>

				<DialogFooter>
					<Button
						disabled={isLoading}
						onClick={() => onOpenChange(false)}
						variant="outline"
					>
						Cancel
					</Button>
					<Button
						disabled={isLoading || !selectedInvestorId}
						onClick={handleAssign}
					>
						{isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
						{isLoading ? "Assigning..." : "Assign Ownership"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

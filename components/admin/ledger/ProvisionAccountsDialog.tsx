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

type ProvisionAccountsDialogProps = {
	userId: string;
	userName: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
};

export function ProvisionAccountsDialog({
	userId,
	userName,
	open,
	onOpenChange,
	onSuccess,
}: ProvisionAccountsDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const provisionAccounts = useAction(api.ledger.provisionInvestorAccounts);

	async function handleProvision() {
		setIsLoading(true);

		try {
			const result = await provisionAccounts({ userId });

			if (result.success) {
				toast.success("Accounts provisioned", {
					description: `Created ${result.accountsCreated?.length || 0} account(s)`,
				});
				onOpenChange(false);
				onSuccess?.();
			} else {
				toast.error("Failed to provision accounts", {
					description: result.error,
				});
			}
		} catch (err) {
			toast.error("Failed to provision accounts", {
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
					<AlertDialogTitle>Provision Investor Accounts</AlertDialogTitle>
					<AlertDialogDescription className="flex flex-col gap-4">
						<p>
							This will create the required ledger accounts for{" "}
							<span className="font-semibold">{userName}</span>.
						</p>
						<div className="rounded-lg bg-muted/50 p-3 text-sm">
							<p className="font-semibold text-foreground">
								Accounts to be created:
							</p>
							<ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
								<li>
									<code className="rounded bg-muted px-1 text-xs">
										investor:{userId}:inventory
									</code>{" "}
									- Share holdings
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
							handleProvision();
						}}
					>
						{isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
						{isLoading ? "Provisioning..." : "Provision Accounts"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

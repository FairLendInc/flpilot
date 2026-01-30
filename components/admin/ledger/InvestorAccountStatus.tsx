"use client";

import { AlertTriangle, CheckCircle2, User } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatBalance } from "@/lib/ledger/utils";
import { cn } from "@/lib/utils";
import { ProvisionAccountsDialog } from "./ProvisionAccountsDialog";

type AccountInfo = {
	address: string;
	exists: boolean;
	balances?: Array<{
		asset: string;
		balance: number | string;
	}>;
};

type InvestorAccountStatusProps = {
	userId: string;
	userName: string;
	email: string;
	expectedAccounts: AccountInfo[];
	onProvisionSuccess?: () => void;
	className?: string;
};

export function InvestorAccountStatus({
	userId,
	userName,
	email,
	expectedAccounts,
	onProvisionSuccess,
	className,
}: InvestorAccountStatusProps) {
	const [showProvisionDialog, setShowProvisionDialog] = useState(false);

	const allProvisioned = expectedAccounts.every((acc) => acc.exists);
	const missingCount = expectedAccounts.filter((acc) => !acc.exists).length;

	return (
		<>
			<Card className={cn("overflow-hidden", className)}>
				<CardContent className="p-4">
					<div className="flex flex-col gap-4">
						<div className="flex items-start justify-between">
							<div className="flex items-start gap-3">
								<div className="rounded-lg bg-green-500/10 p-2 text-green-500">
									<User className="size-4" />
								</div>
								<div className="flex flex-col gap-0.5">
									<span className="font-medium text-foreground text-sm">
										{userName}
									</span>
									<span className="text-muted-foreground text-xs">{email}</span>
									<span className="font-mono text-[10px] text-muted-foreground">
										{userId}
									</span>
								</div>
							</div>

							<div className="flex items-center gap-3">
								{allProvisioned ? (
									<Badge
										className="gap-1 bg-green-500/10 text-green-500"
										variant="outline"
									>
										<CheckCircle2 className="size-3" />
										Fully Provisioned
									</Badge>
								) : (
									<Badge
										className="gap-1 bg-amber-500/10 text-amber-500"
										variant="outline"
									>
										<AlertTriangle className="size-3" />
										{missingCount} Missing
									</Badge>
								)}
							</div>
						</div>

						<div className="flex flex-col gap-2 rounded-lg bg-muted/30 p-3">
							<span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
								Expected Accounts
							</span>
							<div className="flex flex-col gap-2">
								{expectedAccounts.map((account) => (
									<div
										className="flex items-center justify-between rounded-md bg-background/50 px-3 py-2"
										key={account.address}
									>
										<div className="flex items-center gap-2">
											{account.exists ? (
												<CheckCircle2 className="size-4 text-green-500" />
											) : (
												<AlertTriangle className="size-4 text-amber-500" />
											)}
											<span className="font-mono text-xs">
												{account.address}
											</span>
										</div>
										{account.exists &&
											account.balances &&
											account.balances.length > 0 && (
												<div className="flex flex-col items-end gap-1">
													{account.balances.map(({ asset, balance }) => (
														<span
															className="font-mono text-muted-foreground text-xs"
															key={asset}
														>
															{formatBalance(balance, asset)}
														</span>
													))}
												</div>
											)}
									</div>
								))}
							</div>
						</div>

						{!allProvisioned && (
							<div className="flex justify-end">
								<Button
									onClick={() => setShowProvisionDialog(true)}
									size="sm"
									variant="outline"
								>
									Provision Accounts
								</Button>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<ProvisionAccountsDialog
				onOpenChange={setShowProvisionDialog}
				onSuccess={onProvisionSuccess}
				open={showProvisionDialog}
				userId={userId}
				userName={userName}
			/>
		</>
	);
}

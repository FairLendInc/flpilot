import type { Meta, StoryObj } from "@storybook/react";
import { CheckCircle2, AlertTriangle, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatBalance } from "@/lib/ledger/utils";

type AccountInfo = {
	address: string;
	exists: boolean;
	balances?: Array<{
		asset: string;
		balance: number | string;
	}>;
};

type InvestorAccountStatusDisplayProps = {
	userId: string;
	userName: string;
	email: string;
	expectedAccounts: AccountInfo[];
	showProvisionButton?: boolean;
	className?: string;
};

/**
 * Presentational version of InvestorAccountStatus for Storybook
 * without the dialog/action dependencies
 */
function InvestorAccountStatusDisplay({
	userId,
	userName,
	email,
	expectedAccounts,
	showProvisionButton = true,
	className,
}: InvestorAccountStatusDisplayProps) {
	const allProvisioned = expectedAccounts.every((acc) => acc.exists);
	const missingCount = expectedAccounts.filter((acc) => !acc.exists).length;

	return (
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
									key={account.address}
									className="flex items-center justify-between rounded-md bg-background/50 px-3 py-2"
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
									{account.exists && account.balances && account.balances.length > 0 && (
										<div className="flex flex-col items-end gap-1">
											{account.balances.map(({ asset, balance }) => (
												<span
													key={asset}
													className="font-mono text-xs text-muted-foreground"
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

					{!allProvisioned && showProvisionButton && (
						<div className="flex justify-end">
							<Button
								onClick={() => console.log("Provision clicked for", userId)}
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
	);
}

const meta: Meta<typeof InvestorAccountStatusDisplay> = {
	title: "Admin/Ledger/InvestorAccountStatus",
	component: InvestorAccountStatusDisplay,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"Shows an investor's ledger account provisioning status. Displays expected accounts with their existence status and balances, with an action button to provision missing accounts.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-xl">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof InvestorAccountStatusDisplay>;

/**
 * Fully provisioned investor - all expected accounts exist.
 */
export const FullyProvisioned: Story = {
	args: {
		userId: "jn7r8k4s2m1x9p0w",
		userName: "John Smith",
		email: "john.smith@example.com",
		expectedAccounts: [
			{
				address: "investor:jn7r8k4s2m1x9p0w:inventory",
				exists: true,
				balances: [
					{ asset: "CAD", balance: 25000000 },
					{ asset: "Mabc123/SHARE", balance: 5000 },
				],
			},
		],
	},
};

/**
 * Missing accounts - investor needs ledger accounts provisioned.
 */
export const MissingAccounts: Story = {
	args: {
		userId: "new_user_xyz789",
		userName: "Jane Doe",
		email: "jane.doe@example.com",
		expectedAccounts: [
			{
				address: "investor:new_user_xyz789:inventory",
				exists: false,
			},
		],
	},
};

/**
 * Provisioned with zero balance - account exists but empty.
 */
export const ZeroBalance: Story = {
	args: {
		userId: "empty_user_123",
		userName: "New Investor",
		email: "new.investor@example.com",
		expectedAccounts: [
			{
				address: "investor:empty_user_123:inventory",
				exists: true,
				balances: [],
			},
		],
	},
};

/**
 * Multiple share holdings - investor with diverse portfolio.
 */
export const MultipleHoldings: Story = {
	args: {
		userId: "rich_user_456",
		userName: "Wealthy Investor",
		email: "wealthy@example.com",
		expectedAccounts: [
			{
				address: "investor:rich_user_456:inventory",
				exists: true,
				balances: [
					{ asset: "CAD", balance: 100000000 },
					{ asset: "Mabc123/SHARE", balance: 2500 },
					{ asset: "Mdef456/SHARE", balance: 3000 },
					{ asset: "Mghi789/SHARE", balance: 1500 },
				],
			},
		],
	},
};

/**
 * Email-only display - when no name is provided.
 */
export const EmailOnly: Story = {
	args: {
		userId: "anon_user_001",
		userName: "anonymous@example.com",
		email: "anonymous@example.com",
		expectedAccounts: [
			{
				address: "investor:anon_user_001:inventory",
				exists: true,
				balances: [{ asset: "CAD", balance: 5000000 }],
			},
		],
	},
};

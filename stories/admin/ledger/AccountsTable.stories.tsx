import type { Meta, StoryObj } from "@storybook/react";
import { ChevronDown, ChevronRight, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
	getAccountColor,
	getAccountIcon,
	getNamespace,
	groupAccountsByNamespace,
} from "@/lib/ledger/utils";
import { AccountCard } from "@/components/admin/ledger/AccountCard";
import { EmptyState } from "@/components/admin/ledger/EmptyState";
import { RefreshButton } from "@/components/admin/ledger/RefreshButton";

type LedgerAccount = {
	address: string;
	metadata?: Record<string, string>;
	volumes?: {
		[asset: string]: {
			input: number | string;
			output: number | string;
			balance: number | string;
		};
	};
};

function parseAccountBalances(account: LedgerAccount) {
	if (!account.volumes) return [];
	return Object.entries(account.volumes).map(([asset, vol]) => ({
		asset,
		balance: vol.balance,
	}));
}

function parseAccountVolumes(account: LedgerAccount) {
	if (!account.volumes) return undefined;
	const input: Record<string, number | string> = {};
	const output: Record<string, number | string> = {};
	for (const [asset, vol] of Object.entries(account.volumes)) {
		input[asset] = vol.input;
		output[asset] = vol.output;
	}
	return { input, output };
}

/**
 * Presentational component for Storybook that mirrors AccountsTable UI
 */
function AccountsTableDisplay({
	accounts,
	isLoading,
	error,
}: {
	accounts: LedgerAccount[];
	isLoading?: boolean;
	error?: string | null;
}) {
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["investor", "fairlend"]));

	function toggleGroup(namespace: string) {
		setExpandedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(namespace)) {
				next.delete(namespace);
			} else {
				next.add(namespace);
			}
			return next;
		});
	}

	const filteredAccounts = accounts.filter((account) =>
		account.address.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const groupedAccounts = groupAccountsByNamespace(filteredAccounts);
	const namespaces = Object.keys(groupedAccounts).sort();

	if (error) {
		return (
			<EmptyState
				action={{ label: "Retry", onClick: () => {} }}
				description={error}
				title="Error Loading Accounts"
			/>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between gap-4">
				<div className="relative max-w-sm flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground/60" />
					<Input
						className="border-muted-foreground/20 bg-background/50 pl-9 focus-visible:ring-primary/20"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search accounts..."
						value={searchQuery}
					/>
				</div>
				<RefreshButton isLoading={isLoading ?? false} onClick={() => {}} />
			</div>

			{isLoading && accounts.length === 0 ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="size-8 animate-spin text-muted-foreground" />
				</div>
			) : filteredAccounts.length === 0 ? (
				<EmptyState
					description={
						searchQuery
							? "No accounts match your search."
							: "No accounts found in this ledger."
					}
					title="No Accounts"
				/>
			) : (
				<div className="flex flex-col gap-2">
					{namespaces.map((namespace) => {
						const groupAccounts = groupedAccounts[namespace] || [];
						const isExpanded = expandedGroups.has(namespace);
						const Icon = getAccountIcon(namespace);
						const colorClass = getAccountColor(namespace);

						return (
							<Collapsible
								key={namespace}
								onOpenChange={() => toggleGroup(namespace)}
								open={isExpanded}
							>
								<div className="overflow-hidden rounded-xl border bg-card/50">
									<CollapsibleTrigger className="flex w-full items-center gap-3 p-4 transition-colors hover:bg-muted/50">
										{isExpanded ? (
											<ChevronDown className="size-4 text-muted-foreground" />
										) : (
											<ChevronRight className="size-4 text-muted-foreground" />
										)}
										<div className={cn("rounded-lg p-2", colorClass)}>
											<Icon className="size-4" />
										</div>
										<span className="font-semibold text-foreground capitalize">
											{namespace}
										</span>
										<span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
											{groupAccounts.length} account
											{groupAccounts.length !== 1 ? "s" : ""}
										</span>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<div className="flex flex-col gap-2 border-t bg-muted/20 p-4">
											{groupAccounts.map((account) => (
												<AccountCard
													key={account.address}
													address={account.address}
													balances={parseAccountBalances(account)}
													metadata={account.metadata}
													volumes={parseAccountVolumes(account)}
												/>
											))}
										</div>
									</CollapsibleContent>
								</div>
							</Collapsible>
						);
					})}
				</div>
			)}

			<div className="flex items-center justify-between px-2 font-medium text-[11px] text-muted-foreground">
				<span>
					{filteredAccounts.length} account{filteredAccounts.length !== 1 ? "s" : ""}{" "}
					in {namespaces.length} namespace{namespaces.length !== 1 ? "s" : ""}
				</span>
			</div>
		</div>
	);
}

// Mock account data
const mockAccounts: LedgerAccount[] = [
	{
		address: "fairlend:inventory",
		metadata: { type: "platform", role: "inventory" },
		volumes: {
			CAD: { input: 50000000, output: 15000000, balance: 35000000 },
			"Mabc123/SHARE": { input: 10000, output: 5000, balance: 5000 },
		},
	},
	{
		address: "fairlend:fees",
		metadata: { type: "platform", role: "fees" },
		volumes: {
			CAD: { input: 250000, output: 50000, balance: 200000 },
		},
	},
	{
		address: "investor:user123:inventory",
		metadata: { userId: "user123" },
		volumes: {
			"Mabc123/SHARE": { input: 5000, output: 0, balance: 5000 },
			CAD: { input: 25000000, output: 25000000, balance: 0 },
		},
	},
	{
		address: "investor:user456:inventory",
		volumes: {
			CAD: { input: 10000000, output: 0, balance: 10000000 },
		},
	},
	{
		address: "mortgage:abc123:shares",
		metadata: { mortgageId: "abc123", address: "123 Main St" },
		volumes: {
			"Mabc123/SHARE": { input: 10000, output: 10000, balance: 0 },
		},
	},
	{
		address: "@world",
		volumes: {
			CAD: { input: 0, output: 100000000, balance: -100000000 },
		},
	},
];

const meta: Meta<typeof AccountsTableDisplay> = {
	title: "Admin/Ledger/AccountsTable",
	component: AccountsTableDisplay,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"Displays ledger accounts grouped by namespace with collapsible sections. Each namespace (fairlend, investor, mortgage, system) has a distinct icon and color.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-4xl">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof AccountsTableDisplay>;

/**
 * Default view with accounts grouped by namespace.
 * Shows fairlend, investor, mortgage, and system accounts.
 */
export const Default: Story = {
	args: {
		accounts: mockAccounts,
		isLoading: false,
	},
};

/**
 * Loading state while fetching accounts from the ledger.
 */
export const Loading: Story = {
	args: {
		accounts: [],
		isLoading: true,
	},
};

/**
 * Empty state when no accounts exist in the ledger.
 */
export const Empty: Story = {
	args: {
		accounts: [],
		isLoading: false,
	},
};

/**
 * Error state when account fetch fails.
 */
export const Error: Story = {
	args: {
		accounts: [],
		error: "Connection timeout - unable to reach Formance API",
	},
};

/**
 * Single namespace scenario - only investor accounts.
 */
export const SingleNamespace: Story = {
	args: {
		accounts: mockAccounts.filter((a) => a.address.startsWith("investor:")),
		isLoading: false,
	},
};

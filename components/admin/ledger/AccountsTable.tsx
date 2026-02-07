"use client";

import { useAction } from "convex/react";
import { ChevronDown, ChevronRight, Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import {
	getAccountColor,
	getAccountIcon,
	groupAccountsByNamespace,
} from "@/lib/ledger/utils";
import { cn } from "@/lib/utils";
import { AccountCard } from "./AccountCard";
import { EmptyState } from "./EmptyState";
import { useLedger } from "./LedgerContext";
import { RefreshButton } from "./RefreshButton";

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

type AccountBalance = {
	asset: string;
	balance: number | string;
};

function parseAccountBalances(account: LedgerAccount): AccountBalance[] {
	if (!account.volumes) return [];

	return Object.entries(account.volumes).map(([asset, vol]) => ({
		asset,
		balance: vol.balance,
	}));
}

function parseAccountVolumes(account: LedgerAccount) {
	if (!account.volumes) return;

	const input: Record<string, number | string> = {};
	const output: Record<string, number | string> = {};

	for (const [asset, vol] of Object.entries(account.volumes)) {
		input[asset] = vol.input;
		output[asset] = vol.output;
	}

	return { input, output };
}

export function AccountsTable({ className }: { className?: string }) {
	const { selectedLedger } = useLedger();
	const listAccounts = useAction(api.ledger.listAccounts);

	const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
	const [cursor, setCursor] = useState<string | undefined>();
	const [hasMore, setHasMore] = useState(false);

	const fetchAccounts = useCallback(
		async (append = false) => {
			setIsLoading(true);
			setError(null);

			try {
				const result = await listAccounts({
					ledgerName: selectedLedger,
					pageSize: 100,
					cursor: append ? cursor : undefined,
					expand: "volumes",
				});

				if (result.success && "data" in result && result.data) {
					const data = result.data as {
						v2AccountsCursorResponse?: {
							cursor?: { data?: LedgerAccount[]; next?: string };
						};
					};
					const accountList =
						data?.v2AccountsCursorResponse?.cursor?.data || [];
					const nextCursor = data?.v2AccountsCursorResponse?.cursor?.next;

					if (append) {
						setAccounts((prev) => [...prev, ...accountList]);
					} else {
						setAccounts(accountList);
					}

					setCursor(nextCursor);
					setHasMore(!!nextCursor);
				} else if ("error" in result) {
					setError(result.error || "Failed to load accounts");
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
			} finally {
				setIsLoading(false);
			}
		},
		[listAccounts, selectedLedger, cursor]
	);

	useEffect(() => {
		fetchAccounts();
	}, [fetchAccounts]);

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

	// Filter accounts by search query
	const filteredAccounts = accounts.filter((account) =>
		account.address.toLowerCase().includes(searchQuery.toLowerCase())
	);

	// Group by namespace
	const groupedAccounts = groupAccountsByNamespace(filteredAccounts);
	const namespaces = Object.keys(groupedAccounts).sort();

	if (error) {
		return (
			<EmptyState
				action={{ label: "Retry", onClick: () => fetchAccounts() }}
				description={error}
				title="Error Loading Accounts"
			/>
		);
	}

	return (
		<div className={cn("flex flex-col gap-4", className)}>
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
				<RefreshButton isLoading={isLoading} onClick={() => fetchAccounts()} />
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
													address={account.address}
													balances={parseAccountBalances(account)}
													key={account.address}
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
					{filteredAccounts.length} account
					{filteredAccounts.length !== 1 ? "s" : ""} in {namespaces.length}{" "}
					namespace{namespaces.length !== 1 ? "s" : ""}
				</span>
				{hasMore && (
					<Button
						disabled={isLoading}
						onClick={() => fetchAccounts(true)}
						size="sm"
						variant="ghost"
					>
						{isLoading ? "Loading..." : "Load More"}
					</Button>
				)}
			</div>
		</div>
	);
}

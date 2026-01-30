"use client";

import { useAction, useQuery } from "convex/react";
import { Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { InvestorAccountStatus } from "./InvestorAccountStatus";
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

	return Object.entries(account.volumes)
		.filter(([, vol]) => Number(vol.balance) !== 0)
		.map(([asset, vol]) => ({
			asset,
			balance: vol.balance,
		}));
}

export function InvestorAccountsList({ className }: { className?: string }) {
	const { selectedLedger } = useLedger();
	const users = useQuery(api.users.listAllUsers, {});
	const listAccounts = useAction(api.ledger.listAccounts);

	const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccount[]>([]);
	const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");

	const fetchAccounts = useCallback(async () => {
		setIsLoadingAccounts(true);
		try {
			const result = await listAccounts({
				ledgerName: selectedLedger,
				pageSize: 1000,
				expand: "volumes",
			});

			if (result.success && "data" in result && result.data) {
				const data = result.data as {
					v2AccountsCursorResponse?: { cursor?: { data?: LedgerAccount[] } };
				};
				const accountList = data?.v2AccountsCursorResponse?.cursor?.data || [];
				setLedgerAccounts(accountList);
			}
		} catch (err) {
			console.error("Failed to fetch accounts:", err);
		} finally {
			setIsLoadingAccounts(false);
		}
	}, [listAccounts, selectedLedger]);

	useEffect(() => {
		fetchAccounts();
	}, [fetchAccounts]);

	// Create a map of account address -> account data
	const accountMap = new Map<string, LedgerAccount>();
	for (const account of ledgerAccounts) {
		accountMap.set(account.address, account);
	}

	// Filter users by search
	const filteredUsers = (users || []).filter((user) => {
		const searchLower = searchQuery.toLowerCase();
		return (
			user.email.toLowerCase().includes(searchLower) ||
			user.first_name?.toLowerCase().includes(searchLower) ||
			user.last_name?.toLowerCase().includes(searchLower) ||
			user._id.toLowerCase().includes(searchLower)
		);
	});

	// Calculate stats
	const totalUsers = users?.length || 0;
	const provisionedCount = filteredUsers.filter((user) => {
		const inventoryAddress = `investor:${user._id}:inventory`;
		return accountMap.has(inventoryAddress);
	}).length;
	const missingCount = totalUsers - provisionedCount;

	const isLoading = users === undefined || isLoadingAccounts;

	if (isLoading && (!users || users.length === 0)) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			{/* Stats */}
			<div className="flex gap-4 text-sm">
				<div className="rounded-lg bg-muted/50 px-3 py-2">
					<span className="text-muted-foreground">Total Users:</span>{" "}
					<span className="font-semibold">{totalUsers}</span>
				</div>
				<div className="rounded-lg bg-green-500/10 px-3 py-2">
					<span className="text-green-600">Provisioned:</span>{" "}
					<span className="font-semibold">{provisionedCount}</span>
				</div>
				<div className="rounded-lg bg-amber-500/10 px-3 py-2">
					<span className="text-amber-600">Missing:</span>{" "}
					<span className="font-semibold">{missingCount}</span>
				</div>
			</div>

			{/* Search and refresh */}
			<div className="flex items-center justify-between gap-4">
				<div className="relative max-w-sm flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground/60" />
					<Input
						className="border-muted-foreground/20 bg-background/50 pl-9 focus-visible:ring-primary/20"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search by name, email, or ID..."
						value={searchQuery}
					/>
				</div>
				<RefreshButton isLoading={isLoadingAccounts} onClick={fetchAccounts} />
			</div>

			{/* User list */}
			{filteredUsers.length === 0 ? (
				<EmptyState
					description={
						searchQuery
							? "No users match your search."
							: "No users found in the system."
					}
					title="No Users"
				/>
			) : (
				<div className="flex flex-col gap-3">
					{filteredUsers.map((user) => {
						const inventoryAddress = `investor:${user._id}:inventory`;
						const inventoryAccount = accountMap.get(inventoryAddress);

						const expectedAccounts = [
							{
								address: inventoryAddress,
								exists: !!inventoryAccount,
								balances: inventoryAccount
									? parseAccountBalances(inventoryAccount)
									: undefined,
							},
						];

						const userName =
							[user.first_name, user.last_name].filter(Boolean).join(" ") ||
							user.email;

						return (
							<InvestorAccountStatus
								email={user.email}
								expectedAccounts={expectedAccounts}
								key={user._id}
								onProvisionSuccess={fetchAccounts}
								userId={user._id}
								userName={userName}
							/>
						);
					})}
				</div>
			)}

			<div className="px-2 font-medium text-[11px] text-muted-foreground">
				{filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
			</div>
		</div>
	);
}

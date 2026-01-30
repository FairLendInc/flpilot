"use client";

import { useAction } from "convex/react";
import { format } from "date-fns";
import { ArrowRight, Hash, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { getMortgageShareAsset } from "@/lib/ledger/utils";
import { cn } from "@/lib/utils";
import { CopyButton } from "../ledger/CopyButton";
import { EmptyState } from "../ledger/EmptyState";

// Top-level regex for @ prefix removal (performance optimization)
const AT_PREFIX_REGEX = /^@/;

type Posting = {
	source: string;
	destination: string;
	amount: number | string;
	asset: string;
};

type Transaction = {
	id: string;
	timestamp: string;
	postings: Posting[];
	reference?: string;
	metadata?: Record<string, unknown>;
};

type MortgageTradeHistoryProps = {
	mortgageId: string;
	className?: string;
};

export function MortgageTradeHistory({
	mortgageId,
	className,
}: MortgageTradeHistoryProps) {
	const listTransactions = useAction(api.ledger.listTransactions);

	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Use shared utility for asset name
	const mortgageAsset = getMortgageShareAsset(mortgageId);

	const fetchTransactions = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const result = await listTransactions({
				ledgerName: "flmarketplace",
				pageSize: 100,
			});

			if (result.success && "data" in result && result.data) {
				type TxData = {
					v2TransactionsCursorResponse?: {
						cursor?: {
							data?: Array<{
								id: { toString: () => string };
								timestamp: string;
								postings: Posting[];
								reference?: string;
								metadata?: Record<string, unknown>;
							}>;
						};
					};
				};
				const data = result.data as TxData;
				const txList = data?.v2TransactionsCursorResponse?.cursor?.data || [];

				// Filter to only transactions involving this mortgage's asset
				const filteredTxs = txList
					.filter((tx) => tx.postings?.some((p) => p.asset === mortgageAsset))
					.map((tx) => ({
						id: tx.id?.toString() || "",
						timestamp: tx.timestamp,
						postings: tx.postings || [],
						reference: tx.reference,
						metadata: tx.metadata,
					}));

				setTransactions(filteredTxs);
			} else if ("error" in result) {
				setError(result.error || "Failed to load transactions");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setIsLoading(false);
		}
	}, [listTransactions, mortgageAsset]);

	useEffect(() => {
		fetchTransactions();
	}, [fetchTransactions]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader2 className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error) {
		return (
			<EmptyState
				action={{ label: "Retry", onClick: fetchTransactions }}
				description={error}
				title="Error Loading History"
			/>
		);
	}

	if (transactions.length === 0) {
		return (
			<EmptyState
				description="No transactions have been recorded for this mortgage yet."
				title="No Trade History"
			/>
		);
	}

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			{transactions.map((tx) => (
				<TradeCard key={tx.id} transaction={tx} />
			))}
			<div className="px-1 text-[11px] text-muted-foreground">
				{transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
			</div>
		</div>
	);
}

function TradeCard({ transaction }: { transaction: Transaction }) {
	const formattedDate = format(
		new Date(transaction.timestamp),
		"MMM d, yyyy HH:mm"
	);

	// Determine trade type from metadata or postings
	const type =
		(transaction.metadata?.type as string) ||
		getTradeType(transaction.postings);

	return (
		<div className="flex flex-col gap-2 rounded-lg border bg-card p-3">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Hash className="size-3.5 text-muted-foreground" />
					<span className="font-mono text-xs">#{transaction.id}</span>
					<CopyButton text={transaction.id} />
				</div>
				<span className="text-muted-foreground text-xs">{formattedDate}</span>
			</div>

			{/* Trade type badge */}
			<div className="flex items-center gap-2">
				<span
					className={cn(
						"rounded-md px-2 py-0.5 font-medium text-xs",
						type === "mortgage_ownership_init"
							? "bg-green-500/10 text-green-600"
							: type === "ownership_transfer"
								? "bg-blue-500/10 text-blue-600"
								: "bg-muted text-muted-foreground"
					)}
				>
					{getTradeLabel(type)}
				</span>
			</div>

			{/* Postings summary */}
			{transaction.postings.map((posting, idx) => (
				<div
					className="flex items-center gap-2 text-sm"
					key={`${posting.source}-${posting.destination}-${idx}`}
				>
					<span className="max-w-[100px] truncate font-mono text-xs">
						{formatAccount(posting.source)}
					</span>
					<ArrowRight className="size-3.5 text-muted-foreground" />
					<span className="max-w-[100px] truncate font-mono text-xs">
						{formatAccount(posting.destination)}
					</span>
					<span className="ml-auto font-semibold text-xs">
						{posting.amount} shares
					</span>
				</div>
			))}
		</div>
	);
}

function getTradeType(postings: Posting[]): string {
	if (postings.some((p) => p.source === "@world")) {
		return "mortgage_ownership_init";
	}
	return "ownership_transfer";
}

function getTradeLabel(type: string): string {
	switch (type) {
		case "mortgage_ownership_init":
			return "Initial Mint";
		case "ownership_transfer":
			return "Transfer";
		default:
			return "Transaction";
	}
}

function formatAccount(account: string): string {
	// Remove @ prefix if present
	const cleanAccount = account.replace(AT_PREFIX_REGEX, "");

	if (cleanAccount === "world") return "World";
	if (cleanAccount === "fairlend:inventory") return "FairLend";
	if (cleanAccount.startsWith("investor:")) {
		const parts = cleanAccount.split(":");
		const userId = parts[1];
		return `Investor ${userId?.slice(0, 6)}...`;
	}
	return cleanAccount;
}

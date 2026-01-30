"use client";

import { useAction } from "convex/react";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { useLedger } from "./LedgerContext";
import { RefreshButton } from "./RefreshButton";
import { TransactionCard } from "./TransactionCard";

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

export function TransactionList({ className }: { className?: string }) {
	const { selectedLedger } = useLedger();
	const listTransactions = useAction(api.ledger.listTransactions);

	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [cursor, setCursor] = useState<string | undefined>();
	const [hasMore, setHasMore] = useState(false);

	const fetchTransactions = useCallback(
		async (append = false) => {
			setIsLoading(true);
			setError(null);

			try {
				const result = await listTransactions({
					ledgerName: selectedLedger,
					pageSize: 50,
					cursor: append ? cursor : undefined,
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
								next?: string;
							};
						};
					};
					const data = result.data as TxData;
					const txList = data?.v2TransactionsCursorResponse?.cursor?.data || [];
					const nextCursor = data?.v2TransactionsCursorResponse?.cursor?.next;

					// Transform transactions to expected format
					const formattedTxs: Transaction[] = txList.map((tx) => ({
						id: tx.id?.toString() || "",
						timestamp: tx.timestamp,
						postings: tx.postings || [],
						reference: tx.reference,
						metadata: tx.metadata,
					}));

					if (append) {
						setTransactions((prev) => [...prev, ...formattedTxs]);
					} else {
						setTransactions(formattedTxs);
					}

					setCursor(nextCursor);
					setHasMore(!!nextCursor);
				} else if ("error" in result) {
					setError(result.error || "Failed to load transactions");
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
			} finally {
				setIsLoading(false);
			}
		},
		[listTransactions, selectedLedger, cursor]
	);

	useEffect(() => {
		fetchTransactions();
	}, [fetchTransactions]);

	if (error) {
		return (
			<EmptyState
				action={{ label: "Retry", onClick: () => fetchTransactions() }}
				description={error}
				title="Error Loading Transactions"
			/>
		);
	}

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			<div className="flex items-center justify-end">
				<RefreshButton
					isLoading={isLoading}
					onClick={() => fetchTransactions()}
				/>
			</div>

			{isLoading && transactions.length === 0 ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="size-8 animate-spin text-muted-foreground" />
				</div>
			) : transactions.length === 0 ? (
				<EmptyState
					description="No transactions have been recorded in this ledger yet."
					title="No Transactions"
				/>
			) : (
				<div className="flex flex-col gap-3">
					{transactions.map((tx) => (
						<TransactionCard
							id={tx.id}
							key={tx.id}
							metadata={tx.metadata}
							postings={tx.postings}
							reference={tx.reference}
							timestamp={tx.timestamp}
						/>
					))}
				</div>
			)}

			<div className="flex items-center justify-between px-2 font-medium text-[11px] text-muted-foreground">
				<span>
					{transactions.length} transaction
					{transactions.length !== 1 ? "s" : ""}
				</span>
				{hasMore && (
					<Button
						disabled={isLoading}
						onClick={() => fetchTransactions(true)}
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

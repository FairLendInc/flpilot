"use client";

import { useAction } from "convex/react";
import { Database, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { useLedger } from "./LedgerContext";

type Ledger = {
	name: string;
	addedAt?: string;
	metadata?: Record<string, string>;
};

export function LedgerSelector() {
	const {
		selectedLedger,
		setSelectedLedger,
		isLoading: contextLoading,
	} = useLedger();
	const listLedgers = useAction(api.ledger.listLedgers);
	const [ledgers, setLedgers] = useState<Ledger[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchLedgers() {
			try {
				const result = await listLedgers({});
				if (result.success && "data" in result && result.data) {
					const data = result.data as {
						v2LedgerListResponse?: { cursor?: { data?: Ledger[] } };
					};
					const ledgerList = data?.v2LedgerListResponse?.cursor?.data || [];
					setLedgers(ledgerList);
				} else if ("error" in result) {
					setError(result.error || "Failed to load ledgers");
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
			} finally {
				setIsLoading(false);
			}
		}

		fetchLedgers();
	}, [listLedgers]);

	if (isLoading || contextLoading) {
		return (
			<div className="flex items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm">
				<Loader2 className="size-4 animate-spin text-muted-foreground" />
				<span className="text-muted-foreground">Loading ledgers...</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center gap-2 rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-danger text-sm">
				<Database className="size-4" />
				<span>Error: {error}</span>
			</div>
		);
	}

	return (
		<Select onValueChange={setSelectedLedger} value={selectedLedger}>
			<SelectTrigger className="w-[200px]" size="sm">
				<Database className="size-4 text-muted-foreground" />
				<SelectValue placeholder="Select ledger" />
			</SelectTrigger>
			<SelectContent>
				{ledgers.map((ledger) => (
					<SelectItem key={ledger.name} value={ledger.name}>
						{ledger.name}
					</SelectItem>
				))}
				{ledgers.length === 0 && (
					<div className="px-2 py-1.5 text-muted-foreground text-sm">
						No ledgers found
					</div>
				)}
			</SelectContent>
		</Select>
	);
}

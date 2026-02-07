"use client";

/**
 * useMICLedgerData Hook
 *
 * Fetches and transforms Formance ledger data for MIC admin screens.
 * Provides derived metrics, investor balances, and transaction history.
 *
 * Data Flow:
 * 1. Query Formance accounts with volumes
 * 2. Parse account addresses to categorize (investor, cash, treasury, etc.)
 * 3. Calculate ownership percentages from MICCAP balances
 * 4. Transform transactions into activity feed format
 */

import { useAction } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { logger } from "@/lib/logger";
import {
	ASSETS,
	MIC_ACCOUNTS,
	MIC_ID,
	MIC_LEDGER_NAME,
} from "@/lib/mic/numscripts";

// ============================================================================
// Types
// ============================================================================

export type InvestorBalance = {
	investorId: string;
	miccapBalance: number; // In cents (raw ledger amount)
	ownershipPercentage: number; // 0-100
};

export type LedgerActivity = {
	id: string;
	type:
		| "subscription"
		| "distribution"
		| "origination"
		| "interest"
		| "fee"
		| "other";
	title: string;
	description: string;
	amount: number; // In cents
	asset: string;
	timestamp: string;
	source: string;
	destination: string;
};

export type MICLedgerMetrics = {
	cashBalance: number; // mic:FLMIC:cash in cents
	totalCapital: number; // Sum of all investor MICCAP
	investorCount: number; // Count of investors with MICCAP > 0
	treasuryBalance: number; // mic:FLMIC:capital:treasury
	distributionPayable: number; // mic:FLMIC:distribution:payable
};

export type MICLedgerData = {
	// Derived data
	metrics: MICLedgerMetrics;
	investorBalances: InvestorBalance[];
	recentActivity: LedgerActivity[];

	// Raw data for advanced use
	rawAccounts: FormanceAccount[];
	rawTransactions: FormanceTransaction[];

	// Loading states
	isLoading: boolean;
	error: string | null;

	// Actions
	refresh: () => Promise<void>;
};

// Formance response types
type FormanceAccount = {
	address: string;
	metadata?: Record<string, string>;
	volumes?: Record<string, { input: bigint; output: bigint }>;
	balances?: Record<string, bigint>;
};

type FormanceTransaction = {
	id: string;
	txid?: number;
	timestamp?: string;
	date?: string;
	postings: Array<{
		source: string;
		destination: string;
		amount: bigint;
		asset: string;
	}>;
	reference?: string;
	metadata?: Record<string, string>;
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract balance from account volumes or balances
 */
function getAccountBalance(account: FormanceAccount, asset: string): number {
	// Try volumes first (from expand=volumes)
	if (account.volumes?.[asset]) {
		const vol = account.volumes[asset];
		return Number(vol.input) - Number(vol.output);
	}

	// Fall back to balances
	if (account.balances?.[asset]) {
		return Number(account.balances[asset]);
	}

	return 0;
}

/**
 * Parse investor ID from account address
 * e.g., "mic:FLMIC:capital:investor:INV1" → "INV1"
 */
function parseInvestorId(address: string): string | null {
	const pattern = `mic:${MIC_ID}:capital:investor:`;
	if (address.startsWith(pattern)) {
		return address.slice(pattern.length);
	}
	return null;
}

/**
 * Categorize transaction into activity type based on source/destination
 */
function categorizeTransaction(
	posting: FormanceTransaction["postings"][0]
): LedgerActivity["type"] {
	const { source, destination } = posting;

	// Subscription: world → investor wallet, treasury → investor capital
	if (source === "world" && destination.includes("wallet")) {
		return "subscription";
	}
	if (source.includes("treasury") && destination.includes("capital:investor")) {
		return "subscription";
	}

	// Distribution: distribution:payable → investor wallet
	if (
		source.includes("distribution:payable") &&
		destination.includes("wallet")
	) {
		return "distribution";
	}
	if (source.includes("cash") && destination.includes("distribution:payable")) {
		return "distribution";
	}

	// Interest: borrower → mic:cash
	if (source.includes("borrower") && destination.includes("cash")) {
		return "interest";
	}

	// Fee: various fee patterns
	if (
		posting.asset.includes("CAD") &&
		(source.includes("fee") ||
			destination.includes("fee") ||
			source.includes("platform") ||
			destination.includes("platform"))
	) {
		return "fee";
	}

	// Origination: mic:cash → borrower
	if (source.includes("cash") && destination.includes("borrower")) {
		return "origination";
	}

	return "other";
}

/**
 * Generate human-readable title for activity
 */
function getActivityTitle(type: LedgerActivity["type"]): string {
	switch (type) {
		case "subscription":
			return "Investor Subscription";
		case "distribution":
			return "Cash Distribution";
		case "origination":
			return "Mortgage Funded";
		case "interest":
			return "Interest Payment";
		case "fee":
			return "Fee Transaction";
		default:
			return "Ledger Transaction";
	}
}

// ============================================================================
// Main Hook
// ============================================================================

export function useMICLedgerData(): MICLedgerData {
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [rawAccounts, setRawAccounts] = useState<FormanceAccount[]>([]);
	const [rawTransactions, setRawTransactions] = useState<FormanceTransaction[]>(
		[]
	);

	const listAccounts = useAction(api.ledger.listAccounts);
	const listTransactions = useAction(api.ledger.listTransactions);

	// Fetch data from Formance
	const refresh = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const [accountsResult, txResult] = await Promise.all([
				listAccounts({
					ledgerName: MIC_LEDGER_NAME,
					pageSize: 100,
					expand: "volumes",
				}),
				listTransactions({
					ledgerName: MIC_LEDGER_NAME,
					pageSize: 50,
				}),
			]);

			// Parse accounts response
			type AccountsResponse = {
				v2AccountsCursorResponse?: {
					cursor?: { data?: FormanceAccount[] };
				};
			};
			const accountsData = ("data" in accountsResult
				? accountsResult.data
				: undefined) as AccountsResponse | undefined;

			if (
				accountsResult.success &&
				accountsData?.v2AccountsCursorResponse?.cursor?.data
			) {
				setRawAccounts(accountsData.v2AccountsCursorResponse.cursor.data);
			} else if (!accountsResult.success) {
				const errorMessage =
					"error" in accountsResult
						? accountsResult.error
						: "Failed to fetch accounts";
				throw new Error(errorMessage);
			}

			// Parse transactions response
			type TransactionsResponse = {
				v2TransactionsCursorResponse?: {
					cursor?: { data?: FormanceTransaction[] };
				};
			};
			const txData = ("data" in txResult
				? txResult.data
				: undefined) as TransactionsResponse | undefined;

			if (
				txResult.success &&
				txData?.v2TransactionsCursorResponse?.cursor?.data
			) {
				setRawTransactions(txData.v2TransactionsCursorResponse.cursor.data);
			}
		} catch (err) {
		logger.error("Failed to fetch MIC ledger data", { error: err });
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setIsLoading(false);
		}
	};

	// Fetch on mount - intentionally omit refresh from deps to avoid infinite loop
	// biome-ignore lint/correctness/useExhaustiveDependencies: refresh should only run once on mount
	useEffect(() => {
		refresh();
	}, []);

	// ========================================================================
	// Derived Data Calculations
	// ========================================================================

	// Calculate metrics from accounts
	const metrics: MICLedgerMetrics = (() => {
		const cashAccount = rawAccounts.find(
			(a) => a.address === MIC_ACCOUNTS.cash
		);
		const cashIncomeAccount = rawAccounts.find(
			(a) => a.address === MIC_ACCOUNTS.cashIncome
		);
		const treasuryAccount = rawAccounts.find(
			(a) => a.address === MIC_ACCOUNTS.capitalTreasury
		);
		const distPayableAccount = rawAccounts.find(
			(a) => a.address === MIC_ACCOUNTS.distributionPayable
		);

		const cashCapitalBalance = cashAccount
			? getAccountBalance(cashAccount, ASSETS.CAD)
			: 0;
		const cashIncomeBalance = cashIncomeAccount
			? getAccountBalance(cashIncomeAccount, ASSETS.CAD)
			: 0;
		// Total cash is sum of capital and income accounts
		const cashBalance = cashCapitalBalance + cashIncomeBalance;
		const treasuryBalance = treasuryAccount
			? getAccountBalance(treasuryAccount, ASSETS.MICCAP)
			: 0;
		const distributionPayable = distPayableAccount
			? getAccountBalance(distPayableAccount, ASSETS.CAD)
			: 0;

		// Calculate total capital from investor accounts
		const investorAccounts = rawAccounts.filter(
			(a) => parseInvestorId(a.address) !== null
		);
		const totalCapital = investorAccounts.reduce(
			(sum, acc) => sum + getAccountBalance(acc, ASSETS.MICCAP),
			0
		);

		const investorCount = investorAccounts.filter(
			(a) => getAccountBalance(a, ASSETS.MICCAP) > 0
		).length;

		return {
			cashBalance,
			totalCapital,
			investorCount,
			treasuryBalance,
			distributionPayable,
		};
	})();

	// Calculate investor balances
	const investorBalances: InvestorBalance[] = (() => {
		const investorAccounts = rawAccounts.filter(
			(a) => parseInvestorId(a.address) !== null
		);
		const totalCapital = metrics.totalCapital || 1; // Avoid division by zero

		return investorAccounts
			.map((account) => {
				const investorId = parseInvestorId(account.address);
				if (!investorId) return null;

				const miccapBalance = getAccountBalance(account, ASSETS.MICCAP);
				const ownershipPercentage = (miccapBalance / totalCapital) * 100;

				return {
					investorId,
					miccapBalance,
					ownershipPercentage,
				};
			})
			.filter((b): b is InvestorBalance => b !== null && b.miccapBalance > 0);
	})();

	// Transform transactions into activity feed
	const recentActivity: LedgerActivity[] = rawTransactions
		.flatMap((tx) => {
			const txId = tx.id || tx.txid?.toString() || "unknown";
			const timestamp = tx.timestamp || tx.date || new Date().toISOString();

			return tx.postings.map((posting, idx) => {
				const type = categorizeTransaction(posting);
				const amount = Number(posting.amount);

				return {
					id: `${txId}-${idx}`,
					type,
					title: getActivityTitle(type),
					description: `${posting.source.split(":").pop()} → ${posting.destination.split(":").pop()}`,
					amount,
					asset: posting.asset,
					timestamp,
					source: posting.source,
					destination: posting.destination,
				};
			});
		})
		.slice(0, 20); // Limit to 20 most recent

	return {
		metrics,
		investorBalances,
		recentActivity,
		rawAccounts,
		rawTransactions,
		isLoading,
		error,
		refresh,
	};
}

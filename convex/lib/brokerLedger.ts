"use node";

/**
 * Broker Ledger Operations
 *
 * This module provides ledger-based broker commission and return adjustment tracking
 * using Formance. All broker commissions and client return adjustments are recorded
 * as movement of ledger tokens.
 *
 * ## Account Structure
 * - `broker:{brokerId}:commission` - Broker commission pool (CAD/2)
 * - `client:{clientId}:adjustment` - Client return adjustments (CAD/2)
 * - `fairlend:commission_pool` - Source of commission funds (infinite source)
 *
 * ## Asset Structure
 * - `CAD/2` - Canadian Dollars (2 decimal places)
 *
 * ## Critical Invariants
 * - Commissions MUST use idempotency keys (`reference`) to prevent duplicates
 * - Commission recording happens when deals close (`completed` state)
 * - Return adjustments are NOT retroactive - rate at deal completion applies
 * - External API calls MUST be in actions, never mutations
 *
 * @see footguns.md #3 - Never call external APIs from mutations
 * @see footguns.md #5 - Always include Formance idempotency key
 */

import { api } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import { logger } from "../logger";

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_LEDGER = "flpilot";

type ExecuteNumscriptResult = {
	success: boolean;
	data?: { txid?: string };
	error?: string;
};

/**
 * Account path patterns for broker commission tracking
 */
export const BROKER_ACCOUNTS = {
	/** Broker commission pool (accumulates earned commissions) */
	brokerCommission: (brokerId: string) => `broker:${brokerId}:commission`,
	/** Client return adjustment account (adjustments applied to client returns) */
	clientAdjustment: (clientId: string) => `client:${clientId}:adjustment`,
	/** FairLend commission pool (infinite source of commission funds) */
	fairlendCommissionPool: "fairlend:commission_pool",
} as const;

/**
 * Asset definitions
 */
export const BROKER_ASSETS = {
	/** Canadian Dollars with 2 decimal places */
	cad: "CAD/2",
} as const;

/**
 * Generate a unique idempotency reference for broker operations
 */
export function generateBrokerReference(
	operation: "commission" | "adjustment",
	dealId: string,
	brokerId: string,
	clientId: string,
	timestamp?: number
): string {
	const ts = timestamp ?? Date.now();
	return `${operation}:${dealId}:${brokerId}:${clientId}:${ts}`;
}

/**
 * Calculate commission amount from capital deployed and rate
 */
export function calculateCommissionAmount(
	capitalDeployed: number,
	commissionRate: number
): number {
	// Commission rate is percentage, e.g., 2.5 means 2.5%
	return (capitalDeployed * commissionRate) / 100;
}

/**
 * Calculate adjustment amount from return and adjustment rate
 */
export function calculateAdjustmentAmount(
	returnAmount: number,
	adjustmentRate: number
): number {
	// Adjustment rate is percentage, e.g., 0.5 means 0.5%
	return (returnAmount * adjustmentRate) / 100;
}

// ============================================================================
// Ledger Operations
// ============================================================================

/**
 * Record broker commission in the ledger
 *
 * When a deal closes completes, this function records the broker's commission
 * by moving funds from FairLend's commission pool to the broker's commission account.
 *
 * This should be called when a deal transitions to `completed` state.
 *
 * @param ctx - Action context
 * @param args - Commission details
 * @returns Result with transaction ID or error
 *
 * @example
 * ```typescript
 * // Called from deal completion flow
 * const result = await recordBrokerCommission(ctx, {
 *   dealId: deal._id,
 *   brokerId: broker._id,
 *   clientId: client.clientId,
 *   capitalDeployed: 100000,
 *   commissionRate: 2.5,
 * });
 * ```
 */
export async function recordBrokerCommission(
	ctx: ActionCtx,
	args: {
		dealId: string;
		brokerId: string;
		clientId: string;
		capitalDeployed: number;
		commissionRate: number;
	}
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
	try {
		// Validate inputs
		if (args.capitalDeployed < 0) {
			throw new Error("Capital deployed cannot be negative");
		}
		if (args.commissionRate < 0 || args.commissionRate > 100) {
			throw new Error("Commission rate must be between 0 and 100");
		}

		// Calculate commission amount
		const commissionAmount = calculateCommissionAmount(
			args.capitalDeployed,
			args.commissionRate
		);

		if (commissionAmount <= 0) {
			logger.info("Commission amount is zero, skipping ledger entry", {
				dealId: args.dealId,
				brokerId: args.brokerId,
				capitalDeployed: args.capitalDeployed,
				commissionRate: args.commissionRate,
			});
			return { success: true, transactionId: "skipped" };
		}

		// Generate idempotency reference
		const reference = generateBrokerReference(
			"commission",
			args.dealId,
			args.brokerId,
			args.clientId
		);

		// Generate numscript to record commission
		const script = `
vars {
  currency $currency
  source $source
  destination $destination
}

send [COMMISSION ${commissionAmount.toFixed(2)}] (
  source = $source
  destination = $destination
)
`.trim();

		// Execute numscript
		const result = (await ctx.runAction(api.ledger.executeNumscript, {
			ledgerName: DEFAULT_LEDGER,
			script,
			variables: {
				currency: BROKER_ASSETS.cad,
				source: BROKER_ACCOUNTS.fairlendCommissionPool,
				destination: BROKER_ACCOUNTS.brokerCommission(args.brokerId),
			},
			reference,
			metadata: {
				type: "broker_commission",
				dealId: args.dealId,
				brokerId: args.brokerId,
				clientId: args.clientId,
				capitalDeployed: args.capitalDeployed.toFixed(2),
				commissionRate: args.commissionRate.toFixed(2),
				commissionAmount: commissionAmount.toFixed(2),
				earnedAt: new Date().toISOString(),
			},
		})) as ExecuteNumscriptResult;

		if (!result.success) {
			throw new Error(result.error ?? "Failed to record commission");
		}

		logger.info("Broker commission recorded successfully", {
			dealId: args.dealId,
			brokerId: args.brokerId,
			commissionAmount: commissionAmount.toFixed(2),
			transactionId: result.data?.txid,
		});

		return {
			success: true,
			transactionId: result.data?.txid,
		};
	} catch (error) {
		logger.error("Failed to record broker commission", {
			error,
			dealId: args.dealId,
			brokerId: args.brokerId,
		});
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * Record client return adjustment in the ledger
 *
 * When a client earns returns, this function records the return adjustment
 * by moving funds from the client's adjustment account to FairLend's pool.
 * Adjustment represents the broker's cut of the client's returns.
 *
 * This should be called when client returns are calculated/paid.
 *
 * @param ctx - Action context
 * @param args - Adjustment details
 * @returns Result with transaction ID or error
 */
export async function recordClientReturnAdjustment(
	ctx: ActionCtx,
	args: {
		dealId: string;
		brokerId: string;
		clientId: string;
		returnAmount: number;
		adjustmentRate: number;
	}
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
	try {
		// Validate inputs
		if (args.returnAmount < 0) {
			throw new Error("Return amount cannot be negative");
		}
		if (args.adjustmentRate < 0 || args.adjustmentRate > 100) {
			throw new Error("Adjustment rate must be between 0 and 100");
		}

		// Calculate adjustment amount
		const adjustmentAmount = calculateAdjustmentAmount(
			args.returnAmount,
			args.adjustmentRate
		);

		if (adjustmentAmount <= 0) {
			logger.info("Adjustment amount is zero, skipping ledger entry", {
				dealId: args.dealId,
				clientId: args.clientId,
				returnAmount: args.returnAmount,
				adjustmentRate: args.adjustmentRate,
			});
			return { success: true, transactionId: "skipped" };
		}

		// Generate idempotency reference
		const reference = generateBrokerReference(
			"adjustment",
			args.dealId,
			args.brokerId,
			args.clientId
		);

		// Generate numscript to record adjustment
		const script = `
vars {
  currency $currency
  source $source
  destination $destination
}

send [ADJUSTMENT ${adjustmentAmount.toFixed(2)}] (
  source = $source
  destination = $destination
)
`.trim();

		// Execute numscript
		const result = (await ctx.runAction(api.ledger.executeNumscript, {
			ledgerName: DEFAULT_LEDGER,
			script,
			variables: {
				currency: BROKER_ASSETS.cad,
				source: BROKER_ACCOUNTS.clientAdjustment(args.clientId),
				destination: BROKER_ACCOUNTS.fairlendCommissionPool,
			},
			reference,
			metadata: {
				type: "client_return_adjustment",
				dealId: args.dealId,
				brokerId: args.brokerId,
				clientId: args.clientId,
				returnAmount: args.returnAmount.toFixed(2),
				adjustmentRate: args.adjustmentRate.toFixed(2),
				adjustmentAmount: adjustmentAmount.toFixed(2),
				recordedAt: new Date().toISOString(),
			},
		})) as ExecuteNumscriptResult;

		if (!result.success) {
			throw new Error(result.error ?? "Failed to record adjustment");
		}

		logger.info("Client return adjustment recorded successfully", {
			dealId: args.dealId,
			clientId: args.clientId,
			adjustmentAmount: adjustmentAmount.toFixed(2),
			transactionId: result.data?.txid,
		});

		return {
			success: true,
			transactionId: result.data?.txid,
		};
	} catch (error) {
		logger.error("Failed to record client return adjustment", {
			error,
			dealId: args.dealId,
			clientId: args.clientId,
		});
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * Get broker commission balance from the ledger
 *
 * @param ctx - Action context
 * @param args - Broker ID
 * @returns Commission balance
 */
export async function getBrokerCommissionBalance(
	ctx: ActionCtx,
	args: {
		brokerId: string;
	}
): Promise<{ success: boolean; balance: number; error?: string }> {
	try {
		const result = (await ctx.runAction(api.ledger.getBalances, {
			ledgerName: DEFAULT_LEDGER,
			address: BROKER_ACCOUNTS.brokerCommission(args.brokerId),
		})) as {
			success: boolean;
			data?: { page?: Array<{ asset?: string; amount?: string }> };
			error?: string;
		};

		if (!result.success) {
			throw new Error(result.error ?? "Failed to get commission balance");
		}

		// Extract CAD balance from response
		// Formance balances format: { "CAD/2": { "metadata": {}, "input": "1234.56" } }
		const balances = result.data?.page ?? [];
		const cadAsset = balances.find((b) => b.asset === BROKER_ASSETS.cad);

		const balance = cadAsset?.amount
			? Number.parseFloat(cadAsset.amount)
			: 0;

		return {
			success: true,
			balance,
		};
	} catch (error) {
		logger.error("Failed to get broker commission balance", {
			error,
			brokerId: args.brokerId,
		});
		return {
			success: false,
			balance: 0,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * Get broker commission history from the ledger
 *
 * Retrieves all commission transactions for a broker, with optional filtering.
 *
 * @param ctx - Action context
 * @param args - Query parameters
 * @returns Commission history
 */
export async function getBrokerCommissionHistory(
	ctx: ActionCtx,
	args: {
		brokerId: string;
		after?: string; // ISO date string
		before?: string; // ISO date string
		limit?: number;
	}
): Promise<{
	success: boolean;
	transactions?: Array<{
		transactionId: string;
		date: string;
		dealId: string;
		clientId: string;
		capitalDeployed: number;
		commissionRate: number;
		commissionAmount: number;
	}>;
	error?: string;
}> {
	try {
		// Get all transactions for the broker's commission account
		const result = (await ctx.runAction(api.ledger.listTransactions, {
			ledgerName: DEFAULT_LEDGER,
			pageSize: args.limit ?? 100,
		})) as {
			success: boolean;
			data?: {
				page?: Array<{
					id?: string;
					metadata?: {
						type?: string;
						earnedAt?: string;
						dealId?: string;
						clientId?: string;
						capitalDeployed?: string;
						commissionRate?: string;
						commissionAmount?: string;
					};
				}>;
			};
			error?: string;
		};

		if (!result.success) {
			throw new Error(result.error ?? "Failed to get commission history");
		}

		// Filter and transform transactions
		const transactions = (result.data?.page ?? [])
			.filter((tx) => {
				// Only include commission transactions
				const metadata = tx.metadata ?? {};
				if (metadata.type !== "broker_commission") {
					return false;
				}

				// Apply date filters if provided
				const txDate = metadata.earnedAt;
				if (args.after && txDate && args.after > txDate) {
					return false;
				}
				if (args.before && txDate && args.before < txDate) {
					return false;
				}

				return true;
			})
			.map((tx) => ({
				transactionId: tx.id ?? "",
				date: tx.metadata?.earnedAt ?? "",
				dealId: tx.metadata?.dealId ?? "",
				clientId: tx.metadata?.clientId ?? "",
				capitalDeployed: Number.parseFloat(tx.metadata?.capitalDeployed ?? "0"),
				commissionRate: Number.parseFloat(tx.metadata?.commissionRate ?? "0"),
				commissionAmount: Number.parseFloat(
					tx.metadata?.commissionAmount ?? "0"
				),
			}));

		return {
			success: true,
			transactions,
		};
	} catch (error) {
		logger.error("Failed to get broker commission history", {
			error,
			brokerId: args.brokerId,
		});
		return {
			success: false,
			transactions: [],
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * Reconcile broker commissions
 *
 * Compares calculated commissions vs. ledger entries to detect discrepancies.
 * This should be run periodically to ensure ledger accuracy.
 *
 * @param ctx - Action context
 * @param args - Reconciliation parameters
 * @returns Reconciliation report
 */
export async function reconcileBrokerCommissions(
	ctx: ActionCtx,
	args: {
		brokerId: string;
		fromDate?: string; // ISO date string
		toDate?: string; // ISO date string
	}
): Promise<{
	success: boolean;
	report?: {
		brokerId: string;
		ledgerBalance: number;
		expectedBalance: number;
		discrepancy: number;
		transactionCount: number;
		mismatchedDeals: string[];
	};
	error?: string;
}> {
	try {
		// TODO: This would need to query completed deals and calculate expected commissions
		// For now, return a placeholder report

		const ledgerResult = await getBrokerCommissionBalance(ctx, {
			brokerId: args.brokerId,
		});

		return {
			success: true,
			report: {
				brokerId: args.brokerId,
				ledgerBalance: ledgerResult.balance,
				expectedBalance: 0, // TODO: Calculate from deal data
				discrepancy: ledgerResult.balance, // TODO: actual calculation
				transactionCount: 0, // TODO: count transactions
				mismatchedDeals: [], // TODO: identify discrepancies
			},
		};
	} catch (error) {
		logger.error("Failed to reconcile broker commissions", {
			error,
			brokerId: args.brokerId,
		});
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

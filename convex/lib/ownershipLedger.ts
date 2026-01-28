"use node";

/**
 * Ownership Ledger Operations
 *
 * This module provides ledger-based ownership tracking using Formance.
 * All ownership transfers are recorded as share token movements in the ledger.
 *
 * ## Account Structure
 * - `mortgage:{mortgageId}:issuance` - Source of share tokens (mint)
 * - `fairlend:inventory` - FairLend's share holdings
 * - `investor:{userId}:inventory` - Investor share holdings
 *
 * ## Asset Structure
 * - `M{mortgageId}/SHARE` - Share tokens for each mortgage (100 total = 100%)
 *
 * ## Critical Invariants
 * - Total shares per mortgage MUST equal 100
 * - All transfers MUST use idempotency keys (`reference`) to prevent duplicates
 * - External API calls MUST be in actions, never mutations
 *
 * @see footguns.md #3 - Never call external APIs from mutations
 * @see footguns.md #5 - Always include Formance idempotency key
 */

import { v } from "convex/values";
import { logger } from "../../lib/logger";
import { api } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_LEDGER = "flpilot";
export const SHARE_UNIT_SCALE = 100;
export const TOTAL_SHARE_UNITS = 100 * SHARE_UNIT_SCALE;

/**
 * Generate the share asset name for a mortgage
 */
export function getMortgageShareAsset(mortgageId: string): string {
	return `M${mortgageId}/SHARE`;
}

/**
 * Account path patterns for ownership tracking
 */
export const OWNERSHIP_ACCOUNTS = {
	/** Mortgage issuance (source of share tokens - infinite mint) */
	mortgageIssuance: (mortgageId: string) => `mortgage:${mortgageId}:issuance`,
	/** FairLend inventory (holds unsold shares) */
	fairlendInventory: "fairlend:inventory",
	/** Investor inventory (shares owned by investor) */
	investorInventory: (userId: string) => `investor:${userId}:inventory`,
} as const;

/**
 * Generate a unique idempotency reference for ownership operations
 */
export function generateOwnershipReference(
	operation: "init" | "transfer",
	dealId: string,
	mortgageId: string,
	timestamp?: number
): string {
	const ts = timestamp ?? Date.now();
	return `${operation}:${dealId}:${mortgageId}:${ts}`;
}

export function toShareUnits(percentage: number): number {
	return Math.round(percentage * SHARE_UNIT_SCALE);
}

export function fromShareUnits(units: number): number {
	return units / SHARE_UNIT_SCALE;
}

// Regex moved to top level for performance
const INVESTOR_ACCOUNT_PATTERN = /^investor:(.+):inventory$/;

export function parseOwnershipBalances(
	balances: Record<string, Record<string, bigint>>,
	shareAsset: string
): Array<{ ownerId: string; percentage: number }> {
	const ownership: Array<{ ownerId: string; percentage: number }> = [];

	const fairlendBalance =
		balances[OWNERSHIP_ACCOUNTS.fairlendInventory]?.[shareAsset];
	if (fairlendBalance && Number(fairlendBalance) > 0) {
		ownership.push({
			ownerId: "fairlend",
			percentage: fromShareUnits(Number(fairlendBalance)),
		});
	}

	for (const [account, accountBalances] of Object.entries(balances)) {
		const match = INVESTOR_ACCOUNT_PATTERN.exec(account);
		if (!match) continue;
		const investorId = match[1];
		const amount = accountBalances?.[shareAsset];
		if (!amount || Number(amount) <= 0) continue;
		ownership.push({
			ownerId: investorId,
			percentage: fromShareUnits(Number(amount)),
		});
	}

	return ownership;
}

// ============================================================================
// Ledger Operations
// ============================================================================

/**
 * Initialize mortgage ownership in the ledger
 *
 * Creates 100 share tokens for a new mortgage and assigns them to FairLend.
 * This should be called when a mortgage is created.
 *
 * @param ctx - Action context
 * @param mortgageId - The mortgage ID (Convex ID string)
 * @param reference - Idempotency key to prevent duplicate mints
 * @returns Result with transaction ID or error
 *
 * @example
 * ```typescript
 * // Called from mortgage creation action
 * const result = await initializeMortgageOwnership(ctx, {
 *   mortgageId: mortgage._id,
 *   reference: `init:${mortgage._id}:${Date.now()}`,
 * });
 * ```
 */
export async function initializeMortgageOwnership(
	ctx: ActionCtx,
	args: {
		mortgageId: string;
		reference: string;
	}
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
	const { mortgageId, reference } = args;
	const shareAsset = getMortgageShareAsset(mortgageId);

	// Numscript to mint total share units to FairLend
	// Using @world as infinite source (standard Formance pattern)
	const script = `
vars {
  asset $asset
  account $fairlend_inventory
}

send [$asset ${TOTAL_SHARE_UNITS}] (
  source = @world
  destination = $fairlend_inventory
)
`.trim();

	try {
		const result = await ctx.runAction(api.ledger.executeNumscript, {
			ledgerName: DEFAULT_LEDGER,
			script,
			variables: {
				asset: shareAsset,
				fairlend_inventory: OWNERSHIP_ACCOUNTS.fairlendInventory,
			},
			reference,
			metadata: {
				type: "mortgage_ownership_init",
				mortgageId,
			},
		});

		if (!result.success) {
			const errorMessage = "error" in result ? result.error : "Unknown error";
			logger.error("Failed to initialize mortgage ownership in ledger", {
				mortgageId,
				error: errorMessage,
			});
			return { success: false, error: errorMessage };
		}

		const transactionId = (
			"data" in result ? (result.data as { data?: { id?: string } }) : undefined
		)?.data?.id;
		logger.info("Initialized mortgage ownership in ledger", {
			mortgageId,
			transactionId,
			reference,
		});

		return { success: true, transactionId };
	} catch (error) {
		logger.error("Exception initializing mortgage ownership", {
			mortgageId,
			error,
		});
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * Record ownership transfer in the ledger
 *
 * Transfers share tokens from one owner to another.
 * Used when ownership changes (e.g., investor purchase, deal completion).
 *
 * @param ctx - Action context
 * @param args - Transfer parameters
 * @returns Result with transaction ID or error
 *
 * @example
 * ```typescript
 * // Transfer 100% from FairLend to investor
 * const result = await recordOwnershipTransfer(ctx, {
 *   mortgageId: mortgage._id,
 *   fromOwnerId: "fairlend",
 *   toOwnerId: investor._id,
 *   percentage: 100,
 *   reference: `transfer:${deal._id}:${mortgage._id}:${Date.now()}`,
 * });
 * ```
 */
export async function recordOwnershipTransfer(
	ctx: ActionCtx,
	args: {
		mortgageId: string;
		fromOwnerId: string; // "fairlend" or user ID
		toOwnerId: string; // "fairlend" or user ID
		percentage: number; // 0-100
		reference: string; // Idempotency key
		dealId?: string; // Optional deal reference
	}
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
	const { mortgageId, fromOwnerId, toOwnerId, percentage, reference, dealId } =
		args;

	// Validate percentage
	if (percentage <= 0 || percentage > 100) {
		return { success: false, error: "Percentage must be between 0 and 100" };
	}

	// Convert percentage to share units (100% = TOTAL_SHARE_UNITS)
	const shareUnits = toShareUnits(percentage);
	const shareAsset = getMortgageShareAsset(mortgageId);

	// Determine source and destination accounts
	const sourceAccount =
		fromOwnerId === "fairlend"
			? OWNERSHIP_ACCOUNTS.fairlendInventory
			: OWNERSHIP_ACCOUNTS.investorInventory(fromOwnerId);

	const destAccount =
		toOwnerId === "fairlend"
			? OWNERSHIP_ACCOUNTS.fairlendInventory
			: OWNERSHIP_ACCOUNTS.investorInventory(toOwnerId);

	// Numscript for transfer
	const script = `
vars {
  asset $asset
  account $source
  account $destination
  monetary $amount = [$asset ${shareUnits}]
}

send $amount (
  source = $source
  destination = $destination
)
`.trim();

	try {
		const result = await ctx.runAction(api.ledger.executeNumscript, {
			ledgerName: DEFAULT_LEDGER,
			script,
			variables: {
				asset: shareAsset,
				source: sourceAccount,
				destination: destAccount,
			},
			reference,
			metadata: {
				type: "ownership_transfer",
				mortgageId,
				fromOwnerId,
				toOwnerId,
				percentage: percentage.toString(),
				...(dealId ? { dealId } : {}),
			},
		});

		if (!result.success) {
			const errorMessage = "error" in result ? result.error : "Unknown error";
			// Check if it's an idempotency conflict (duplicate reference)
			if (errorMessage?.includes("CONFLICT")) {
				logger.warn("Duplicate ownership transfer reference (idempotent)", {
					reference,
					mortgageId,
				});
				// Return success for idempotent duplicate
				return { success: true };
			}

			logger.error("Failed to record ownership transfer in ledger", {
				mortgageId,
				fromOwnerId,
				toOwnerId,
				percentage,
				error: errorMessage,
			});
			return { success: false, error: errorMessage };
		}

		const transactionId = (
			"data" in result ? (result.data as { data?: { id?: string } }) : undefined
		)?.data?.id;
		logger.info("Recorded ownership transfer in ledger", {
			mortgageId,
			fromOwnerId,
			toOwnerId,
			percentage,
			transactionId,
			reference,
		});

		return { success: true, transactionId };
	} catch (error) {
		logger.error("Exception recording ownership transfer", {
			mortgageId,
			fromOwnerId,
			toOwnerId,
			percentage,
			error,
		});
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * Get ownership balances from the ledger
 *
 * Queries the ledger for current ownership distribution of a mortgage.
 *
 * @param ctx - Action context
 * @param mortgageId - The mortgage ID
 * @returns Ownership distribution from ledger
 */
export async function getOwnershipFromLedger(
	ctx: ActionCtx,
	mortgageId: string
): Promise<{
	success: boolean;
	ownership?: Array<{ ownerId: string; percentage: number }>;
	error?: string;
}> {
	const shareAsset = getMortgageShareAsset(mortgageId);

	try {
		// Query balances for the share asset
		const result = await ctx.runAction(api.ledger.getBalances, {
			ledgerName: DEFAULT_LEDGER,
			address: "*:inventory", // Match all inventory accounts
		});

		if (!result.success) {
			const errorMessage = "error" in result ? result.error : "Unknown error";
			return { success: false, error: errorMessage };
		}

		// Parse balances to extract ownership
		const balances = (
			"data" in result
				? (result.data as { data?: Record<string, unknown> })
				: undefined
		)?.data;
		if (!balances) {
			return { success: true, ownership: [] };
		}

		const ownership = parseOwnershipBalances(
			balances as Record<string, Record<string, bigint>>,
			shareAsset
		);

		return { success: true, ownership };
	} catch (error) {
		logger.error("Exception getting ownership from ledger", {
			mortgageId,
			error,
		});
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

// ============================================================================
// Validators for action args
// ============================================================================

export const ownershipTransferArgsValidator = {
	mortgageId: v.string(),
	fromOwnerId: v.string(),
	toOwnerId: v.string(),
	percentage: v.number(),
	reference: v.string(),
	dealId: v.optional(v.string()),
};

export const initializeOwnershipArgsValidator = {
	mortgageId: v.string(),
	reference: v.string(),
};

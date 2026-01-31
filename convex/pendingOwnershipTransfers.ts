/**
 * Pending Ownership Transfers
 *
 * Manages staged ownership transfers that require admin review before execution.
 * Implements the Maker-Checker pattern for ownership transfers.
 *
 * CRITICAL RULES:
 * - NEVER directly insert into mortgage_ownership - use createOwnershipInternal()
 * - NEVER call external APIs (Formance) from mutations - use scheduled actions
 * - Always include idempotency key (reference) for Formance transactions
 *
 * See footguns.md #1, #3, #5 for details.
 */

import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { getMortgageShareAsset } from "../lib/ledger/utils";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import { internalMutation, internalQuery } from "./_generated/server";
import { emitAuditEvent } from "./auditEvents";
import {
	adminAction,
	adminMutation,
	adminQuery,
} from "./lib/authorizedFunctions";
import { ENTITY_TYPES, OWNERSHIP_EVENT_TYPES } from "./lib/events/types";
import { isLedgerSourceOfTruth } from "./lib/ownershipConfig";
import {
	OWNERSHIP_ACCOUNTS,
	DEFAULT_LEDGER,
	toShareUnits,
	fromShareUnits,
} from "./lib/ownershipLedger";

type OwnershipRecord = {
	mortgageId: Id<"mortgages">;
	ownerId: "fairlend" | Id<"users">;
	ownershipPercentage: number;
};

type LegacyOwnershipRecord = {
	mortgageId: Id<"mortgages">;
	ownerId: "fairlend" | Id<"users">;
	ownershipPercentage: number;
};

type PendingTransferRecord = {
	_id: Id<"pending_ownership_transfers">;
	_creationTime: number;
	dealId: Id<"deals">;
	mortgageId: Id<"mortgages">;
	fromOwnerId: "fairlend" | Id<"users">;
	toOwnerId: Id<"users">;
	percentage: number;
	status: "pending" | "approved" | "rejected";
	createdAt: number;
	reviewedAt?: number;
	reviewedBy?: Id<"users">;
	reviewNotes?: string;
	rejectionCount?: number;
};

// OwnershipPreview type is defined inline in the function return type

async function getLedgerOwnershipSnapshot(
	ctx: ActionCtx
): Promise<Record<string, OwnershipRecord[]>> {
	const result = await ctx.runAction(api.ledger.getOwnershipSnapshot, {});
	if (!result.success) {
		throw new Error(result.error ?? "Failed to load ledger ownership snapshot");
	}

	const snapshot = (result.ownershipByMortgage ?? {}) as Record<
		string,
		Array<{ ownerId: string; percentage: number }>
	>;
	const normalized: Record<string, OwnershipRecord[]> = {};

	for (const [mortgageId, entries] of Object.entries(snapshot)) {
		normalized[mortgageId] = entries.map((entry) => ({
			mortgageId: mortgageId as Id<"mortgages">,
			ownerId:
				entry.ownerId === "fairlend"
					? "fairlend"
					: (entry.ownerId as Id<"users">),
			ownershipPercentage: entry.percentage,
		}));
	}

	return normalized;
}

// ============================================================================
// Internal Mutations
// ============================================================================

/**
 * Create a pending transfer (internal use only)
 *
 * Called when a deal transitions to pending_ownership_review state.
 * Creates a pending transfer record for admin review.
 *
 * @internal - Cannot be called from clients
 */
export const createPendingTransferInternal = internalMutation({
	args: {
		dealId: v.id("deals"),
		mortgageId: v.id("mortgages"),
		fromOwnerId: v.union(v.literal("fairlend"), v.id("users")),
		toOwnerId: v.id("users"),
		percentage: v.number(),
	},
	returns: v.id("pending_ownership_transfers"),
	handler: async (ctx, args): Promise<Id<"pending_ownership_transfers">> => {
		// Validate mortgage exists
		const mortgage = await ctx.db.get(args.mortgageId);
		if (!mortgage) {
			throw new Error("Mortgage not found");
		}

		// Validate source has sufficient ownership (legacy DB only)
		if (!isLedgerSourceOfTruth()) {
			const sourceOwnership = await ctx.db
				.query("mortgage_ownership")
				.withIndex("by_mortgage_owner", (q) =>
					q.eq("mortgageId", args.mortgageId).eq("ownerId", args.fromOwnerId)
				)
				.first();

			if (
				!sourceOwnership ||
				sourceOwnership.ownershipPercentage < args.percentage
			) {
				throw new Error(
					`Insufficient source ownership. Required: ${args.percentage}%, Available: ${sourceOwnership?.ownershipPercentage ?? 0}%`
				);
			}
		}

		// Check for existing pending transfer for this deal
		const existingTransfer = await ctx.db
			.query("pending_ownership_transfers")
			.withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
			.filter((q) => q.eq(q.field("status"), "pending"))
			.first();

		if (existingTransfer) {
			throw new Error(
				"A pending transfer already exists for this deal. Approve or reject it first."
			);
		}

		// Create the pending transfer
		const transferId = await ctx.db.insert("pending_ownership_transfers", {
			dealId: args.dealId,
			mortgageId: args.mortgageId,
			fromOwnerId: args.fromOwnerId,
			toOwnerId: args.toOwnerId,
			percentage: args.percentage,
			status: "pending",
			createdAt: Date.now(),
			rejectionCount: 0,
		});

		return transferId;
	},
});

export const getTransferByIdInternal = internalQuery({
	args: {
		transferId: v.id("pending_ownership_transfers"),
	},
	returns: v.union(
		v.object({
			_id: v.id("pending_ownership_transfers"),
			_creationTime: v.number(),
			dealId: v.id("deals"),
			mortgageId: v.id("mortgages"),
			fromOwnerId: v.union(v.literal("fairlend"), v.id("users")),
			toOwnerId: v.id("users"),
			percentage: v.number(),
			status: v.union(
				v.literal("pending"),
				v.literal("approved"),
				v.literal("rejected")
			),
			createdAt: v.number(),
			reviewedAt: v.optional(v.number()),
			reviewedBy: v.optional(v.id("users")),
			reviewNotes: v.optional(v.string()),
			rejectionCount: v.optional(v.number()),
		}),
		v.null()
	),
	handler: async (ctx, args) => await ctx.db.get(args.transferId),
});

// ============================================================================
// Admin Mutations
// ============================================================================

/**
 * Approve a pending ownership transfer
 *
 * Admin approves the transfer after reviewing details.
 * This transitions the deal to completed and schedules the ownership transfer.
 *
 * CRITICAL: Use createOwnershipInternal() - NEVER direct insert (footguns.md #1)
 * CRITICAL: Schedule Formance action - NEVER call in mutation (footguns.md #3)
 */
export const approvePendingTransfer = adminMutation({
	args: {
		transferId: v.id("pending_ownership_transfers"),
		notes: v.optional(v.string()),
	},
	returns: v.object({
		success: v.boolean(),
		dealId: v.id("deals"),
	}),
	handler: async (ctx, args) => {
		// Get admin user ID from identity
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}
		// Find the user record by identity subject
		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
			.unique();
		if (!user) {
			throw new Error("User not found");
		}
		const adminUserId = user._id;

		// Get the transfer
		const transfer = await ctx.db.get(args.transferId);
		if (!transfer) {
			throw new Error("Transfer not found");
		}

		if (transfer.status !== "pending") {
			throw new Error(
				`Transfer is not pending. Current status: ${transfer.status}`
			);
		}

		// Get the deal
		const deal = await ctx.db.get(transfer.dealId);
		if (!deal) {
			throw new Error("Deal not found");
		}

		if (deal.currentState !== "pending_ownership_review") {
			throw new Error(
				`Deal is not in pending_ownership_review state. Current state: ${deal.currentState}`
			);
		}

		// Update transfer status
		await ctx.db.patch(args.transferId, {
			status: "approved",
			reviewedAt: Date.now(),
			reviewedBy: adminUserId,
			reviewNotes: args.notes,
		});

		// Emit audit event for transfer approval
		await emitAuditEvent(ctx, {
			eventType: OWNERSHIP_EVENT_TYPES.TRANSFER_APPROVED,
			entityType: ENTITY_TYPES.PENDING_TRANSFER,
			entityId: args.transferId,
			userId: adminUserId,
			beforeState: { status: "pending" },
			afterState: { status: "approved" },
			metadata: {
				dealId: transfer.dealId,
				mortgageId: transfer.mortgageId,
				percentage: transfer.percentage,
			},
		});

		return {
			success: true,
			dealId: transfer.dealId,
		};
	},
});

/**
 * Reject a pending ownership transfer
 *
 * Admin rejects the transfer with a reason.
 * This transitions the deal back to pending_verification for retry.
 * Tracks rejection count for manual resolution escalation.
 */
export const rejectPendingTransfer = adminMutation({
	args: {
		transferId: v.id("pending_ownership_transfers"),
		reason: v.string(),
	},
	returns: v.object({
		success: v.boolean(),
		dealId: v.id("deals"),
		escalated: v.boolean(),
	}),
	handler: async (ctx, args) => {
		// Get admin user ID from identity
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}
		// Find the user record by identity subject
		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
			.unique();
		if (!user) {
			throw new Error("User not found");
		}
		const adminUserId = user._id;

		// Get the transfer
		const transfer = await ctx.db.get(args.transferId);
		if (!transfer) {
			throw new Error("Transfer not found");
		}

		if (transfer.status !== "pending") {
			throw new Error(
				`Transfer is not pending. Current status: ${transfer.status}`
			);
		}

		// Get the deal
		const deal = await ctx.db.get(transfer.dealId);
		if (!deal) {
			throw new Error("Deal not found");
		}

		if (deal.currentState !== "pending_ownership_review") {
			throw new Error(
				`Deal is not in pending_ownership_review state. Current state: ${deal.currentState}`
			);
		}

		const newRejectionCount = (transfer.rejectionCount ?? 0) + 1;
		const needsEscalation = newRejectionCount >= 2;

		// Update transfer status
		await ctx.db.patch(args.transferId, {
			status: "rejected",
			reviewedAt: Date.now(),
			reviewedBy: adminUserId,
			reviewNotes: args.reason,
			rejectionCount: newRejectionCount,
		});

		// Emit audit event for transfer rejection
		await emitAuditEvent(ctx, {
			eventType: OWNERSHIP_EVENT_TYPES.TRANSFER_REJECTED,
			entityType: ENTITY_TYPES.PENDING_TRANSFER,
			entityId: args.transferId,
			userId: adminUserId,
			beforeState: { status: "pending" },
			afterState: { status: "rejected", reason: args.reason },
			metadata: {
				dealId: transfer.dealId,
				mortgageId: transfer.mortgageId,
				rejectionCount: newRejectionCount,
				escalated: needsEscalation,
			},
		});

		// Create alert for rejection (footguns.md #9)
		await ctx.db.insert("alerts", {
			userId: deal.investorId,
			type: "ownership_transfer_rejected",
			severity: needsEscalation ? "warning" : "info",
			title: needsEscalation
				? "Ownership Transfer Requires Manual Resolution"
				: "Ownership Transfer Needs Review",
			message: needsEscalation
				? `Transfer has been rejected ${newRejectionCount} times and requires manual resolution.`
				: `Transfer was rejected: ${args.reason}`,
			relatedDealId: transfer.dealId,
			read: false,
			createdAt: Date.now(),
		});

		// If escalation needed, create high-priority alert for admin
		if (needsEscalation) {
			await emitAuditEvent(ctx, {
				eventType: OWNERSHIP_EVENT_TYPES.MANUAL_RESOLUTION_REQUIRED,
				entityType: ENTITY_TYPES.DEAL,
				entityId: transfer.dealId,
				userId: adminUserId,
				metadata: {
					transferId: args.transferId,
					rejectionCount: newRejectionCount,
					lastRejectionReason: args.reason,
				},
			});
		}

		return {
			success: true,
			dealId: transfer.dealId,
			escalated: needsEscalation,
		};
	},
});

// ============================================================================
// Queries
// ============================================================================

/**
 * Get pending transfer by deal ID
 */
export const getPendingTransferByDeal = adminQuery({
	args: {
		dealId: v.id("deals"),
	},
	returns: v.union(
		v.object({
			_id: v.id("pending_ownership_transfers"),
			_creationTime: v.number(),
			dealId: v.id("deals"),
			mortgageId: v.id("mortgages"),
			fromOwnerId: v.union(v.literal("fairlend"), v.id("users")),
			toOwnerId: v.id("users"),
			percentage: v.number(),
			status: v.union(
				v.literal("pending"),
				v.literal("approved"),
				v.literal("rejected")
			),
			createdAt: v.number(),
			reviewedAt: v.optional(v.number()),
			reviewedBy: v.optional(v.id("users")),
			reviewNotes: v.optional(v.string()),
			rejectionCount: v.optional(v.number()),
		}),
		v.null()
	),
	handler: async (ctx, args) => {
		const transfer = await ctx.db
			.query("pending_ownership_transfers")
			.withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
			.order("desc")
			.first();

		return transfer ?? null;
	},
});

/**
 * Get all pending transfers for admin review queue
 */
export const getPendingTransfersForReview = adminQuery({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("pending_ownership_transfers"),
			_creationTime: v.number(),
			dealId: v.id("deals"),
			mortgageId: v.id("mortgages"),
			fromOwnerId: v.union(v.literal("fairlend"), v.id("users")),
			toOwnerId: v.id("users"),
			percentage: v.number(),
			status: v.union(
				v.literal("pending"),
				v.literal("approved"),
				v.literal("rejected")
			),
			createdAt: v.number(),
			reviewedAt: v.optional(v.number()),
			reviewedBy: v.optional(v.id("users")),
			reviewNotes: v.optional(v.string()),
			rejectionCount: v.optional(v.number()),
		})
	),
	handler: async (ctx) => {
		const transfers = await ctx.db
			.query("pending_ownership_transfers")
			.withIndex("by_status", (q) => q.eq("status", "pending"))
			.order("asc")
			.collect();

		return transfers;
	},
});

/**
 * Get ownership preview for a pending transfer
 * Shows current cap table and what it will look like after transfer
 */
export const getOwnershipPreview = adminAction({
	args: {
		dealId: v.id("deals"),
	},
	returns: v.object({
		transfer: v.object({
			_id: v.id("pending_ownership_transfers"),
			fromOwnerId: v.union(v.literal("fairlend"), v.id("users")),
			toOwnerId: v.id("users"),
			percentage: v.number(),
		}),
		currentOwnership: v.array(
			v.object({
				ownerId: v.union(v.literal("fairlend"), v.id("users")),
				percentage: v.number(),
				ownerName: v.string(),
			})
		),
		afterOwnership: v.array(
			v.object({
				ownerId: v.union(v.literal("fairlend"), v.id("users")),
				percentage: v.number(),
				ownerName: v.string(),
			})
		),
		// Ledger state information
		ledgerState: v.object({
			assetIdentifier: v.string(),
			sourceAccount: v.object({
				address: v.string(),
				ownerName: v.string(),
				ownerId: v.union(v.literal("fairlend"), v.id("users")),
				currentBalance: v.number(),
				projectedBalance: v.number(),
				balanceChange: v.number(),
			}),
			destinationAccount: v.object({
				address: v.string(),
				ownerName: v.string(),
				ownerId: v.id("users"),
				currentBalance: v.number(),
				projectedBalance: v.number(),
				balanceChange: v.number(),
			}),
		}),
	}),
	handler: async (ctx, args): Promise<{
		transfer: {
			_id: Id<"pending_ownership_transfers">;
			fromOwnerId: "fairlend" | Id<"users">;
			toOwnerId: Id<"users">;
			percentage: number;
		};
		currentOwnership: Array<{
			ownerId: "fairlend" | Id<"users">;
			percentage: number;
			ownerName: string;
		}>;
		afterOwnership: Array<{
			ownerId: "fairlend" | Id<"users">;
			percentage: number;
			ownerName: string;
		}>;
		ledgerState: {
			assetIdentifier: string;
			sourceAccount: {
				address: string;
				ownerName: string;
				ownerId: "fairlend" | Id<"users">;
				currentBalance: number;
				projectedBalance: number;
				balanceChange: number;
			};
			destinationAccount: {
				address: string;
				ownerName: string;
				ownerId: Id<"users">;
				currentBalance: number;
				projectedBalance: number;
				balanceChange: number;
			};
		};
	}> => {
		// Get the deal
		const deal = await ctx.runQuery(api.deals.getDeal, {
			dealId: args.dealId,
		});
		if (!deal) {
			throw new Error("Deal not found");
		}

		// Get the transfer record
		const transfer: PendingTransferRecord | null = await ctx.runQuery(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId: args.dealId }
		);
		if (!transfer) {
			throw new Error("No pending transfer found for this deal");
		}

		// Get owner names
		const toOwner = await ctx.runQuery(api.users.getUserByIdAdmin, {
			userId: transfer.toOwnerId,
		});
		const toOwnerName: string = toOwner
			? `${toOwner.first_name || ""} ${toOwner.last_name || ""}`.trim() ||
				toOwner.email
			: "Unknown User";

		const fromOwnerName: string =
			transfer.fromOwnerId === "fairlend"
				? "FairLend"
				: (
						await ctx.runQuery(api.users.getUserByIdAdmin, {
							userId: transfer.fromOwnerId as Id<"users">,
						})
					)?.email || "Unknown User";

		// Get ledger asset identifier and account addresses
		const mortgageIdString = transfer.mortgageId.toString();
		const assetIdentifier = getMortgageShareAsset(mortgageIdString);

		const sourceAccountAddress =
			transfer.fromOwnerId === "fairlend"
				? OWNERSHIP_ACCOUNTS.fairlendInventory
				: OWNERSHIP_ACCOUNTS.investorInventory(transfer.fromOwnerId);
		const destinationAccountAddress = OWNERSHIP_ACCOUNTS.investorInventory(
			transfer.toOwnerId
		);

		// Fetch current balances from ledger (SOURCE OF TRUTH)
		// If ledger is unavailable, show clear error - DO NOT fall back to deprecated ownership table
		const [sourceBalanceResult, destBalanceResult] = await Promise.all([
			ctx.runAction(api.ledger.getBalances, {
				ledgerName: DEFAULT_LEDGER,
				address: sourceAccountAddress,
			}),
			ctx.runAction(api.ledger.getBalances, {
				ledgerName: DEFAULT_LEDGER,
				address: destinationAccountAddress,
			}),
		]);

		// Parse balances - Formance returns Record<string, Record<string, bigint>>
		const parseBalance = (
			result: { success: boolean; data?: unknown; error?: string },
			asset: string
		): number => {
			if (!result.success || !result.data) return 0;
			const balances = result.data as Record<string, Record<string, bigint>>;
			const assetBalances = balances[Object.keys(balances)[0]] || {};
			const balance = assetBalances[asset];
			return balance ? fromShareUnits(Number(balance)) : 0;
		};

		// Try to fetch balances from ledger
		const sourceCurrentBalance = parseBalance(sourceBalanceResult, assetIdentifier);
		const destCurrentBalance = parseBalance(destBalanceResult, assetIdentifier);

		// Check if ledger is unavailable or accounts are not provisioned
		// Use explicit type guard to narrow the union type
		const hasError = (result: { success: boolean; data?: unknown; error?: string }): result is { success: false; error: string } => {
			return !result.success && typeof result.error === 'string';
		};

		const ledgerUnavailable = hasError(sourceBalanceResult) && sourceBalanceResult.error.includes("LEDGER_NOT_FOUND");
		const accountsNotProvisioned = 
			(hasError(sourceBalanceResult) && sourceBalanceResult.error.includes("ACCOUNT_NOT_FOUND")) ||
			(hasError(destBalanceResult) && destBalanceResult.error.includes("ACCOUNT_NOT_FOUND"));

		if (ledgerUnavailable) {
			throw new Error(
				"Formance ledger is not available. Please provision the ledger before proceeding with ownership transfers. See Admin > Ledger > Settings for setup."
			);
		}

		if (accountsNotProvisioned) {
			throw new Error(
				"One or more accounts are not provisioned in the ledger. Please provision all required accounts before proceeding with ownership transfers. See Admin > Ledger > Accounts for setup."
			);
		}

		// VALIDATION: Check if source has sufficient balance
		if (sourceCurrentBalance < transfer.percentage) {
			throw new Error(
				`Insufficient balance for transfer. Source has ${sourceCurrentBalance.toFixed(2)}%, attempting to transfer ${transfer.percentage.toFixed(2)}%`
			);
		}

		// Calculate projected balances
		const sourceProjectedBalance = sourceCurrentBalance - transfer.percentage;
		const destProjectedBalance = destCurrentBalance + transfer.percentage;

		// VALIDATION: Check for negative projected balances (should never happen with above validation)
		if (sourceProjectedBalance < 0 || destProjectedBalance < 0) {
		 throw new Error(
				`Invalid transfer: would result in negative balance. Source: ${sourceProjectedBalance.toFixed(2)}%, Dest: ${destProjectedBalance.toFixed(2)}%`
			);
		}

		// Build current ownership from ledger balances
		// Include source, destination, and any other owners we can identify
		const currentOwnership: Array<{
			ownerId: "fairlend" | Id<"users">;
			percentage: number;
			ownerName: string;
		}> = [];

		// Add source owner if they have a balance
		if (sourceCurrentBalance > 0 || transfer.fromOwnerId === "fairlend") {
			currentOwnership.push({
				ownerId: transfer.fromOwnerId,
				percentage: sourceCurrentBalance,
				ownerName: fromOwnerName,
			});
		}

		// Add destination owner if they have a balance (and they're different from source)
		if (
			destCurrentBalance > 0 &&
			transfer.toOwnerId !== transfer.fromOwnerId
		) {
			currentOwnership.push({
				ownerId: transfer.toOwnerId,
				percentage: destCurrentBalance,
				ownerName: toOwnerName,
			});
		}

		// Add FairLend as remainder owner (100% invariant)
		const totalOwnedSoFar = currentOwnership.reduce(
			(sum, o) => sum + o.percentage,
			0
		);
		if (!(transfer.fromOwnerId === "fairlend") && totalOwnedSoFar < 100) {
			currentOwnership.push({
				ownerId: "fairlend",
				percentage: 100 - totalOwnedSoFar,
				ownerName: "FairLend",
			});
		}

		// Build after ownership - CRITICAL: Ensure destination is always included
		const afterOwnership: Array<{
			ownerId: "fairlend" | Id<"users">;
			percentage: number;
			ownerName: string;
		}> = [];

		// Start with current ownership and apply the transfer
		const ownershipMap = new Map<"fairlend" | Id<"users">, { percentage: number; ownerName: string }>();

		currentOwnership.forEach((owner) => {
			let newPercentage = owner.percentage;

			// Adjust source balance
			if (owner.ownerId === transfer.fromOwnerId) {
				newPercentage = Math.max(0, owner.percentage - transfer.percentage);
			}

			// Adjust destination balance
			if (owner.ownerId === transfer.toOwnerId) {
				newPercentage = owner.percentage + transfer.percentage;
			}

			// Only include if there's still ownership
			if (newPercentage > 0) {
				ownershipMap.set(owner.ownerId, {
					percentage: newPercentage,
					ownerName: owner.ownerName,
				});
			}
		});

		// CRITICAL: Ensure destination owner is included even if they had 0% before
		if (!ownershipMap.has(transfer.toOwnerId)) {
			ownershipMap.set(transfer.toOwnerId, {
				percentage: transfer.percentage,
				ownerName: toOwnerName,
			});
		}

		// Convert map to array - sorted by percentage descending
		afterOwnership.push(
			...Array.from(ownershipMap.entries())
				.map(([ownerId, data]) => ({ ownerId, ...data }))
				.sort((a, b) => b.percentage - a.percentage)
		);

		// Verify total is 100%
		const totalAfter = afterOwnership.reduce((sum, o) => sum + o.percentage, 0);
		if (Math.abs(totalAfter - 100) > 0.01) {
			// Adjust FairLend's percentage to maintain 100% invariant
			const fairlendEntry = afterOwnership.find((o) => o.ownerId === "fairlend");
			if (fairlendEntry) {
				fairlendEntry.percentage += 100 - totalAfter;
			}
		}

		// Sort final afterOwnership by percentage
		afterOwnership.sort((a, b) => b.percentage - a.percentage);

		// Build source account info
		const sourceOwnerId: "fairlend" | Id<"users"> =
			transfer.fromOwnerId === "fairlend" ? "fairlend" : transfer.fromOwnerId;
		const sourceOwnerDisplayName: string =
			sourceOwnerId === "fairlend" ? "FairLend" : fromOwnerName;

		// Build ledger state object
		const ledgerState: {
			assetIdentifier: string;
			sourceAccount: {
				address: string;
				ownerName: string;
				ownerId: "fairlend" | Id<"users">;
				currentBalance: number;
				projectedBalance: number;
				balanceChange: number;
			};
			destinationAccount: {
				address: string;
				ownerName: string;
				ownerId: Id<"users">;
				currentBalance: number;
				projectedBalance: number;
				balanceChange: number;
			};
		} = {
			assetIdentifier,
			sourceAccount: {
				address: sourceAccountAddress,
				ownerName: sourceOwnerDisplayName,
				ownerId: sourceOwnerId,
				currentBalance: sourceCurrentBalance,
				projectedBalance: sourceProjectedBalance,
				balanceChange: -transfer.percentage,
			},
			destinationAccount: {
				address: destinationAccountAddress,
				ownerName: toOwnerName,
				ownerId: transfer.toOwnerId,
				currentBalance: destCurrentBalance,
				projectedBalance: destProjectedBalance,
				balanceChange: transfer.percentage,
			},
		};

		return {
			transfer: {
				_id: transfer._id,
				fromOwnerId: transfer.fromOwnerId,
				toOwnerId: transfer.toOwnerId,
				percentage: transfer.percentage,
			},
			currentOwnership,
			afterOwnership,
			ledgerState,
		};
	},
});

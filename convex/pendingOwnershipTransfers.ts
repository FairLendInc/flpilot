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

		// Get current ownership distribution
		// Fetch all ownership for this mortgage
		const ownershipRecords: OwnershipRecord[] = await ctx.runAction(
			api.ownership.getMortgageOwnership,
			{
				mortgageId: transfer.mortgageId,
			}
		);

		// Fetch all users involved
		const userIds = ownershipRecords
			.map((o) => o.ownerId)
			.filter((id): id is Id<"users"> => typeof id === "string") as Id<"users">[
		];
		type PartialUser = {
			_id: Id<"users">;
			email: string;
			first_name: string | undefined;
			last_name: string | undefined;
		};
		const usersMap = new Map<Id<"users">, PartialUser>();
		if (userIds.length > 0) {
			for (const userId of userIds) {
				const user = await ctx.runQuery(api.users.getUserByIdAdmin, { userId });
				if (user) {
					usersMap.set(userId, user);
				}
			}
		}
		const getUserDisplayName = (ownerId: "fairlend" | Id<"users">): string => {
			if (ownerId === "fairlend") return "FairLend";
			const user = usersMap.get(ownerId);
			return user
				? `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
						user.email
				: "Unknown User";
		};

		// Build current ownership
		const currentOwnership = ownershipRecords.map((o) => ({
			ownerId: o.ownerId,
			percentage: o.ownershipPercentage,
			ownerName: getUserDisplayName(o.ownerId),
		}));

		// Build after ownership
		const afterOwnership = ownershipRecords.map((o) => ({
			ownerId: o.ownerId,
			percentage:
				o.ownerId === transfer.fromOwnerId
					? o.ownershipPercentage - transfer.percentage
					: o.ownerId === transfer.toOwnerId
						? o.ownershipPercentage + transfer.percentage
						: o.ownershipPercentage,
			ownerName: getUserDisplayName(o.ownerId),
		}));

		// Get ledger asset identifier
		const mortgageIdString = transfer.mortgageId.toString();
		const assetIdentifier = getMortgageShareAsset(mortgageIdString);

		// Get ledger account addresses
		const sourceAccountAddress =
			transfer.fromOwnerId === "fairlend"
				? OWNERSHIP_ACCOUNTS.fairlendInventory
				: OWNERSHIP_ACCOUNTS.investorInventory(transfer.fromOwnerId);
		const destinationAccountAddress = OWNERSHIP_ACCOUNTS.investorInventory(
			transfer.toOwnerId
		);

		// Fetch current balances from ledger
		const shareUnitsToTransfer = toShareUnits(transfer.percentage);
		
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

		const sourceCurrentBalance = parseBalance(sourceBalanceResult, assetIdentifier);
		const destCurrentBalance = parseBalance(destBalanceResult, assetIdentifier);

		// Calculate projected balances
		const sourceProjectedBalance = sourceCurrentBalance - transfer.percentage;
		const destProjectedBalance = destCurrentBalance + transfer.percentage;

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

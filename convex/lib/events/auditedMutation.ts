/**
 * Audited Mutation Wrapper
 *
 * Creates mutations that automatically emit audit events for state changes.
 * Extends `createAuthorizedMutation` with audit event capabilities.
 *
 * **Key features:**
 * - Automatically captures before/after state
 * - Sanitizes state to remove PII (see footguns.md #4)
 * - Provides `ctx.emitEvent()` helper for custom events
 * - Works with existing RBAC authorization
 *
 * @see research.md §6.2 for implementation patterns
 * @see footguns.md #4 for sanitization requirements
 *
 * @example
 * ```ts
 * export const approveTransfer = createAuditedMutation({
 *   eventType: "ownership.transfer.approved",
 *   entityType: "pending_ownership_transfer",
 *   args: {
 *     transferId: v.id("pending_ownership_transfers"),
 *   },
 *   handler: async (ctx, args) => {
 *     const before = await ctx.db.get(args.transferId);
 *
 *     await ctx.db.patch(args.transferId, { status: "approved" });
 *
 *     const after = await ctx.db.get(args.transferId);
 *
 *     // Emit audit event (auto-sanitized)
 *     await ctx.emitEvent({
 *       entityId: args.transferId,
 *       beforeState: before,
 *       afterState: after,
 *     });
 *   },
 * });
 * ```
 */

import type { Validator } from "convex/values";
import { v } from "convex/values";
import { customMutation, customCtxAndArgs } from "convex-helpers/server/customFunctions";
import { createError } from "../../../lib/errors";
import type { MutationCtx } from "../../_generated/server";
import { mutation, internalMutation } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { sanitizeState, type EntityType, type OwnershipEventType } from "./types";

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for an audited mutation
 */
export interface AuditedMutationConfig<Args extends Record<string, unknown>> {
	/** Event type to emit (e.g., "ownership.transfer.approved") */
	eventType: OwnershipEventType | string;
	/** Entity type being modified (e.g., "pending_ownership_transfer") */
	entityType: EntityType | string;
	/** Required roles for authorization (default: ["admin"]) */
	roles?: string[];
	/** Required permissions for authorization (default: []) */
	permissions?: string[];
	/** Argument validators */
	args: { [K in keyof Args]: Validator<Args[K], "required", string> };
	/** Return type validator */
	returns?: Validator<unknown, "required", string>;
	/** Handler function */
	handler: (
		ctx: AuditedMutationCtx,
		args: Args
	) => Promise<unknown>;
}

/**
 * Extended context with audit event emission capabilities
 */
export interface AuditedMutationCtx extends MutationCtx {
	/** User identity from authorization */
	userId: Id<"users">;
	email: string;
	role: string;
	/** Emit an audit event (automatically sanitizes state) */
	emitEvent: (params: EmitEventParams) => Promise<void>;
}

/**
 * Parameters for emitting an audit event
 */
export interface EmitEventParams {
	/** The entity ID being modified */
	entityId: string;
	/** State before the modification (will be sanitized) */
	beforeState?: Record<string, unknown>;
	/** State after the modification (will be sanitized) */
	afterState?: Record<string, unknown>;
	/** Additional metadata */
	metadata?: Record<string, unknown>;
}

// ============================================================================
// Role Check (duplicated from server.ts to avoid circular imports)
// ============================================================================

function roleCheck({
	userRole,
	roles,
}: {
	userRole?: string;
	roles: string[];
}): boolean {
	if (roles.length === 0 || roles.includes("any")) return true;
	if (!userRole) return false;
	if (userRole === "admin") return true;
	if (roles.includes(userRole)) return true;
	return false;
}

function permissionsCheck({
	userPermissions,
	permissions,
}: {
	userPermissions?: string[];
	permissions: string[];
}): boolean {
	if (permissions.length === 0 || permissions.includes("any")) return true;
	if (!userPermissions) return false;
	const userPermSet = new Set(userPermissions);
	return permissions.every((p) => userPermSet.has(p));
}

// ============================================================================
// Internal Mutation for Creating Audit Events
// ============================================================================

/**
 * Internal mutation to create audit event records
 * Used by the emitEvent helper in audited mutations
 */
export const createAuditEventInternal = internalMutation({
	args: {
		eventType: v.string(),
		entityType: v.string(),
		entityId: v.string(),
		userId: v.id("users"),
		timestamp: v.number(),
		beforeState: v.optional(v.any()),
		afterState: v.optional(v.any()),
		metadata: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("audit_events", {
			eventType: args.eventType,
			entityType: args.entityType,
			entityId: args.entityId,
			userId: args.userId,
			timestamp: args.timestamp,
			beforeState: args.beforeState,
			afterState: args.afterState,
			metadata: args.metadata,
			emitFailures: 0,
		});
	},
});

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates an audited mutation that automatically handles authorization and audit events.
 *
 * **Features:**
 * - Automatic RBAC authorization (roles + permissions)
 * - `ctx.emitEvent()` helper for audit event emission
 * - Automatic sanitization of before/after state
 * - Durable event storage for at-least-once delivery
 *
 * @param config - Mutation configuration
 * @returns Convex mutation function
 *
 * @example
 * ```ts
 * export const approveTransfer = createAuditedMutation({
 *   eventType: OWNERSHIP_EVENT_TYPES.TRANSFER_APPROVED,
 *   entityType: ENTITY_TYPES.PENDING_TRANSFER,
 *   roles: ["admin"],
 *   args: {
 *     transferId: v.id("pending_ownership_transfers"),
 *     notes: v.optional(v.string()),
 *   },
 *   handler: async (ctx, { transferId, notes }) => {
 *     const before = await ctx.db.get(transferId);
 *
 *     await ctx.db.patch(transferId, {
 *       status: "approved",
 *       reviewNotes: notes,
 *     });
 *
 *     const after = await ctx.db.get(transferId);
 *
 *     await ctx.emitEvent({
 *       entityId: transferId,
 *       beforeState: before,
 *       afterState: after,
 *       metadata: { notes },
 *     });
 *
 *     return { success: true };
 *   },
 * });
 * ```
 */
export function createAuditedMutation<Args extends Record<string, unknown>>(
	config: AuditedMutationConfig<Args>
) {
	const { eventType, entityType, roles = ["admin"], permissions = [] } = config;

	return customMutation(
		mutation,
		customCtxAndArgs({
			args: config.args as Record<string, Validator<unknown, "required", string>>,
			input: async (baseCtx, args) => {
				// Authenticate
				const identity = await baseCtx.auth.getUserIdentity();
				if (identity === null) {
					throw createError({
						code: "auth",
						status: 401,
						devMessage: "Authentication required",
						context: { location: "createAuditedMutation" },
					});
				}

				// Authorize roles
				if (!roleCheck({ userRole: identity.role as string | undefined, roles })) {
					throw createError({
						code: "auth",
						status: 403,
						devMessage: `Not authorized! Required Role(s): ${roles.join(", ")}`,
						context: { userRole: identity.role, requiredRoles: roles },
					});
				}

				// Authorize permissions
				if (
					!permissionsCheck({
						userPermissions: identity.permissions as string[] | undefined,
						permissions,
					})
				) {
					throw createError({
						code: "auth",
						status: 403,
						devMessage: `Not authorized! Required Permission(s): ${permissions.join(", ")}`,
						context: {
							userPermissions: identity.permissions,
							requiredPermissions: permissions,
						},
					});
				}

				// Get user ID from database
				const user = await baseCtx.db
					.query("users")
					.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
					.unique();

				if (!user) {
					throw createError({
						code: "not_found",
						status: 404,
						devMessage: "User not found in database",
						context: { subject: identity.subject },
					});
				}

				// Create emitEvent helper
				const emitEvent = async (params: EmitEventParams) => {
					const sanitizedBefore = params.beforeState
						? (sanitizeState(params.beforeState) as Record<string, unknown>)
						: undefined;
					const sanitizedAfter = params.afterState
						? (sanitizeState(params.afterState) as Record<string, unknown>)
						: undefined;

					// Use internal mutation for immediate, synchronous event creation
					await baseCtx.db.insert("audit_events", {
						eventType,
						entityType,
						entityId: params.entityId,
						userId: user._id,
						timestamp: Date.now(),
						beforeState: sanitizedBefore,
						afterState: sanitizedAfter,
						metadata: params.metadata,
						emitFailures: 0,
					});
				};

				// Extend context with audit capabilities
				const auditedCtx: AuditedMutationCtx = {
					...baseCtx,
					userId: user._id,
					email: identity.email ?? "",
					role: (identity.role as string) ?? "",
					emitEvent,
				};

				return { ctx: auditedCtx, args };
			},
		})
	);
}

/**
 * Type helper for extracting the handler return type from an audited mutation
 */
export type AuditedMutationReturn<T extends (...args: unknown[]) => unknown> =
	Awaited<ReturnType<T>>;

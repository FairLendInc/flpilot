/**
 * Audit Events CRUD Operations
 *
 * Provides backend functions for creating, querying, and managing audit events.
 * All mutation functions are internal (not client-callable) for security.
 *
 * CRITICAL: Always sanitize before/after state before storing - no PII allowed.
 * See footguns.md #4 and research.md #1.2 for details.
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, internalQuery } from "./_generated/server";
import { adminQuery } from "./lib/authorizedFunctions";
import { sanitizeState } from "./lib/events/types";

/**
 * Create an audit event (internal use only)
 *
 * Automatically sanitizes beforeState and afterState to remove PII.
 * Use this from other mutations to record audit events.
 *
 * @internal - Cannot be called from clients
 */
export const createAuditEvent = internalMutation({
	args: {
		eventType: v.string(),
		entityType: v.string(),
		entityId: v.string(),
		userId: v.id("users"),
		beforeState: v.optional(v.any()),
		afterState: v.optional(v.any()),
		metadata: v.optional(v.any()),
	},
	returns: v.id("audit_events"),
	handler: async (ctx, args) => {
		// Sanitize state objects before storing (footguns.md #4)
		const sanitizedBefore = args.beforeState
			? sanitizeState(args.beforeState)
			: undefined;
		const sanitizedAfter = args.afterState
			? sanitizeState(args.afterState)
			: undefined;

		return await ctx.db.insert("audit_events", {
			eventType: args.eventType,
			entityType: args.entityType,
			entityId: args.entityId,
			userId: args.userId,
			timestamp: Date.now(),
			beforeState: sanitizedBefore,
			afterState: sanitizedAfter,
			metadata: args.metadata,
			emittedAt: undefined, // Not yet emitted
			emitFailures: 0,
		});
	},
});

/**
 * Mark an event as successfully emitted
 *
 * Called by the cron job after successful external emission.
 *
 * @internal - Cannot be called from clients
 */
export const markEventEmitted = internalMutation({
	args: {
		eventId: v.id("audit_events"),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await ctx.db.patch(args.eventId, {
			emittedAt: Date.now(),
		});
		return null;
	},
});

/**
 * Increment emission failure counter
 *
 * Called by the cron job when emission fails. Allows tracking retries.
 *
 * @internal - Cannot be called from clients
 */
export const incrementEmitFailures = internalMutation({
	args: {
		eventId: v.id("audit_events"),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const event = await ctx.db.get(args.eventId);
		if (!event) return null;

		await ctx.db.patch(args.eventId, {
			emitFailures: (event.emitFailures ?? 0) + 1,
		});
		return null;
	},
});

/**
 * Get unemitted events for the cron job to process
 *
 * Returns events that haven't been successfully emitted yet.
 * Limited to prevent overwhelming the system.
 *
 * @internal - Cannot be called from clients
 */
export const getUnemittedEvents = internalQuery({
	args: {
		limit: v.optional(v.number()),
	},
	returns: v.array(
		v.object({
			_id: v.id("audit_events"),
			_creationTime: v.number(),
			eventType: v.string(),
			entityType: v.string(),
			entityId: v.string(),
			userId: v.id("users"),
			timestamp: v.number(),
			beforeState: v.optional(v.any()),
			afterState: v.optional(v.any()),
			metadata: v.optional(v.any()),
			emittedAt: v.optional(v.number()),
			emitFailures: v.optional(v.number()),
		})
	),
	handler: async (ctx, args) => {
		const limit = args.limit ?? 100;

		// Use by_emitted index to find events where emittedAt is undefined
		// Note: Convex indexes null/undefined values at the beginning
		const events = await ctx.db
			.query("audit_events")
			.withIndex("by_emitted", (q) => q.eq("emittedAt", undefined))
			.take(limit);

		return events;
	},
});

/**
 * Get events for a specific entity
 *
 * Used to display audit history in UI.
 */
export const getEventsForEntity = adminQuery({
	args: {
		entityType: v.string(),
		entityId: v.string(),
		limit: v.optional(v.number()),
	},
	returns: v.array(
		v.object({
			_id: v.id("audit_events"),
			_creationTime: v.number(),
			eventType: v.string(),
			entityType: v.string(),
			entityId: v.string(),
			userId: v.id("users"),
			timestamp: v.number(),
			beforeState: v.optional(v.any()),
			afterState: v.optional(v.any()),
			metadata: v.optional(v.any()),
			emittedAt: v.optional(v.number()),
			emitFailures: v.optional(v.number()),
		})
	),
	handler: async (ctx, args) => {
		const limit = args.limit ?? 50;

		const events = await ctx.db
			.query("audit_events")
			.withIndex("by_entity", (q) =>
				q.eq("entityType", args.entityType).eq("entityId", args.entityId)
			)
			.order("desc")
			.take(limit);

		return events;
	},
});

/**
 * Get events by type
 *
 * Used for admin dashboards to see all events of a specific type.
 */
export const getEventsByType = adminQuery({
	args: {
		eventType: v.string(),
		limit: v.optional(v.number()),
	},
	returns: v.array(
		v.object({
			_id: v.id("audit_events"),
			_creationTime: v.number(),
			eventType: v.string(),
			entityType: v.string(),
			entityId: v.string(),
			userId: v.id("users"),
			timestamp: v.number(),
			beforeState: v.optional(v.any()),
			afterState: v.optional(v.any()),
			metadata: v.optional(v.any()),
			emittedAt: v.optional(v.number()),
			emitFailures: v.optional(v.number()),
		})
	),
	handler: async (ctx, args) => {
		const limit = args.limit ?? 50;

		const events = await ctx.db
			.query("audit_events")
			.withIndex("by_type", (q) => q.eq("eventType", args.eventType))
			.order("desc")
			.take(limit);

		return events;
	},
});

/**
 * Get recent events for dashboard widget
 */
export const getRecentEvents = adminQuery({
	args: {
		limit: v.optional(v.number()),
	},
	returns: v.array(
		v.object({
			_id: v.id("audit_events"),
			_creationTime: v.number(),
			eventType: v.string(),
			entityType: v.string(),
			entityId: v.string(),
			userId: v.id("users"),
			timestamp: v.number(),
			metadata: v.optional(v.any()),
		})
	),
	handler: async (ctx, args) => {
		const limit = args.limit ?? 20;

		const events = await ctx.db.query("audit_events").order("desc").take(limit);

		// Map to simplified format for dashboard
		return events.map((e) => ({
			_id: e._id,
			_creationTime: e._creationTime,
			eventType: e.eventType,
			entityType: e.entityType,
			entityId: e.entityId,
			userId: e.userId,
			timestamp: e.timestamp,
			metadata: e.metadata,
		}));
	},
});

export const deleteOldEvents = internalMutation({
	args: {
		cutoffTimestamp: v.number(),
		limit: v.optional(v.number()),
	},
	returns: v.number(),
	handler: async (ctx, args) => {
		const limit = args.limit ?? 500;
		const events = await ctx.db
			.query("audit_events")
			.withIndex("by_timestamp", (q) => q.lt("timestamp", args.cutoffTimestamp))
			.take(limit);

		for (const event of events) {
			await ctx.db.delete(event._id);
		}

		return events.length;
	},
});

/**
 * Helper function to emit an audit event from within a mutation
 *
 * Use this helper in mutation handlers instead of calling createAuditEvent directly.
 * This provides a cleaner API and ensures proper sanitization.
 *
 * @example
 * ```typescript
 * await emitAuditEvent(ctx, {
 *   eventType: OWNERSHIP_EVENT_TYPES.TRANSFER_CREATED,
 *   entityType: ENTITY_TYPES.PENDING_TRANSFER,
 *   entityId: transferId,
 *   userId: adminUserId,
 *   beforeState: { ownership: "fairlend" },
 *   afterState: { ownership: investorId },
 *   metadata: { dealId, mortgageId },
 * });
 * ```
 */
export async function emitAuditEvent(
	ctx: MutationCtx,
	event: {
		eventType: string;
		entityType: string;
		entityId: string;
		userId: Id<"users">;
		beforeState?: Record<string, unknown>;
		afterState?: Record<string, unknown>;
		metadata?: Record<string, unknown>;
	}
): Promise<Id<"audit_events">> {
	// Sanitize state objects before storing
	const sanitizedBefore = event.beforeState
		? sanitizeState(event.beforeState)
		: undefined;
	const sanitizedAfter = event.afterState
		? sanitizeState(event.afterState)
		: undefined;

	return await ctx.db.insert("audit_events", {
		eventType: event.eventType,
		entityType: event.entityType,
		entityId: event.entityId,
		userId: event.userId,
		timestamp: Date.now(),
		beforeState: sanitizedBefore,
		afterState: sanitizedAfter,
		metadata: event.metadata,
		emittedAt: undefined,
		emitFailures: 0,
	});
}

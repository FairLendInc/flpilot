"use node";

/**
 * Audit Events Cron Job Handler
 *
 * Processes pending audit events and emits them to external systems.
 * Uses per-item error handling to prevent one failure from blocking the batch.
 *
 * See footguns.md #7: Cron job error handling pattern.
 */

import { v } from "convex/values";
import { logger } from "../lib/logger";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";
import { getEventEmitter } from "./lib/events/emitter";
import type { AuditEventRecord } from "./lib/events/types";

const AUDIT_RETENTION_MS = 1000 * 60 * 60 * 24 * 365 * 7;

/**
 * Emit pending audit events
 *
 * Called by cron job every minute. Processes unemitted events and
 * marks them as emitted or increments failure counter.
 *
 * CRITICAL: Each event emission is wrapped in try-catch.
 * One failure doesn't block the entire batch (footguns.md #7).
 */
export const emitPendingEvents = internalAction({
	args: {},
	returns: v.object({
		processed: v.number(),
		succeeded: v.number(),
		failed: v.number(),
	}),
	handler: async (
		ctx
	): Promise<{ processed: number; succeeded: number; failed: number }> => {
		// Get pending events from internal query
		const events: Array<{
			_id: Id<"audit_events">;
			_creationTime: number;
			eventType: string;
			entityType: string;
			entityId: string;
			userId: Id<"users">;
			timestamp: number;
			beforeState?: any;
			afterState?: any;
			metadata?: any;
			emittedAt?: number;
			emitFailures?: number;
		}> = await ctx.runQuery(internal.auditEvents.getUnemittedEvents, {
			limit: 100,
		});

		if (events.length === 0) {
			return { processed: 0, succeeded: 0, failed: 0 };
		}

		const emitter = getEventEmitter();
		let succeeded = 0;
		let failed = 0;

		// Process each event individually - don't let one failure block others
		for (const event of events) {
			try {
				// Cast to AuditEventRecord for the emitter
				const result = await emitter.emit(event as unknown as AuditEventRecord);

				if (result.success) {
					// Mark as emitted
					await ctx.runMutation(internal.auditEvents.markEventEmitted, {
						eventId: event._id,
					});
					succeeded += 1;
				} else {
					// Increment failure counter
					await ctx.runMutation(internal.auditEvents.incrementEmitFailures, {
						eventId: event._id,
					});
					failed += 1;
					logger.warn("Event emission failed", {
						eventId: event._id,
						eventType: event.eventType,
						error: result.error,
					});
				}
			} catch (error) {
				// Catch any unexpected errors and continue processing
				// footguns.md #7: Never let one failure block the entire batch
				failed += 1;
				logger.error("Unexpected error during event emission", {
					eventId: event._id,
					eventType: event.eventType,
					error: error instanceof Error ? error.message : "Unknown error",
				});

				// Try to increment failure counter (may also fail, but try)
				try {
					await ctx.runMutation(internal.auditEvents.incrementEmitFailures, {
						eventId: event._id,
					});
				} catch {
					// Ignore - we've already logged the main error
				}
			}
		}

		const processed: number = events.length;
		logger.info("Audit event emission complete", {
			processed,
			succeeded,
			failed,
		});

		return { processed, succeeded, failed };
	},
});

export const pruneOldEvents = internalAction({
	args: {},
	returns: v.object({
		deleted: v.number(),
		cutoffTimestamp: v.number(),
	}),
	handler: async (
		ctx
	): Promise<{ deleted: number; cutoffTimestamp: number }> => {
		const cutoffTimestamp = Date.now() - AUDIT_RETENTION_MS;
		const deletedCount: number = await ctx.runMutation(
			internal.auditEvents.deleteOldEvents,
			{
			cutoffTimestamp,
			limit: 500,
			}
		);

		return {
			deleted: deletedCount,
			cutoffTimestamp,
		};
	},
});

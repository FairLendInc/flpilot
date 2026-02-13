/**
 * Trace data retention and cleanup.
 *
 * Provides an internal mutation to purge trace_runs, trace_spans,
 * and trace_payloads older than the configured retention period.
 */

import { internalMutation } from "../../_generated/server";
import { resolveTelemetryConfig } from "./config";

const CLEANUP_BATCH_SIZE = 200;

/**
 * Purge expired trace data based on retention config.
 * Designed to be called by a daily cron job.
 *
 * Deletes in batches to avoid hitting Convex mutation size limits.
 */
export const purgeExpiredTraces = internalMutation({
	args: {},
	handler: async (ctx) => {
		const config = resolveTelemetryConfig();
		const cutoff = Date.now() - config.retentionMs;

		let runsDeleted = 0;
		let spansDeleted = 0;
		let payloadsDeleted = 0;

		// 1. Delete old payloads first (leaf records)
		const oldPayloads = await ctx.db
			.query("trace_payloads")
			.withIndex("by_createdAt", (q) => q.lt("createdAt", cutoff))
			.take(CLEANUP_BATCH_SIZE);

		for (const payload of oldPayloads) {
			await ctx.db.delete(payload._id);
			payloadsDeleted++;
		}

		// 2. Delete old spans
		const oldRuns = await ctx.db
			.query("trace_runs")
			.withIndex("by_startedAt", (q) => q.lt("startedAt", cutoff))
			.take(CLEANUP_BATCH_SIZE);

		for (const run of oldRuns) {
			// Delete all spans for this trace
			const spans = await ctx.db
				.query("trace_spans")
				.withIndex("by_traceId", (q) => q.eq("traceId", run.traceId))
				.collect();

			for (const span of spans) {
				await ctx.db.delete(span._id);
				spansDeleted++;
			}

			// Delete the trace run itself
			await ctx.db.delete(run._id);
			runsDeleted++;
		}

		return { runsDeleted, spansDeleted, payloadsDeleted, cutoff };
	},
});

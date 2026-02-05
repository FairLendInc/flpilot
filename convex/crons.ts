/**
 * Convex Scheduled Jobs (Cron)
 *
 * Defines scheduled functions that run automatically at specified intervals.
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Daily WorkOS → Convex Sync
 *
 * Runs at 2:00 AM UTC every day to ensure Convex DB stays perfectly in sync
 * with WorkOS (single source of truth).
 *
 * What it does:
 * - Fetches all users, organizations, and memberships from WorkOS
 * - Compares with Convex data and auto-fixes any discrepancies
 * - Adds missing records, updates drifted data, deletes orphaned records
 * - Provides comprehensive logging and metrics
 *
 * Schedule: Daily at 2:00 AM UTC
 * To change schedule, modify hourUTC and minuteUTC below.
 */
crons.daily(
	"daily-workos-sync",
	{
		hourUTC: 2, // 2:00 AM UTC
		minuteUTC: 0,
	},
	internal.sync.performDailySync
);

/**
 * Check for completed documents and transition deals
 * Runs every 10 minutes
 */
crons.interval(
	"check-pending-docs-deals",
	{ minutes: 10 },
	internal.deals.checkPendingDocsDeals
);

/**
 * Emit Pending Audit Events
 *
 * Runs every minute to process unemitted audit events.
 * Individual event failures are caught and logged - one failure
 * doesn't block the entire batch (footguns.md #7).
 *
 * Events are:
 * 1. Fetched from audit_events where emittedAt is null
 * 2. Sent to external emission system (stubbed for now)
 * 3. Marked as emitted or increment failure counter
 */
crons.interval(
	"emit-pending-audit-events",
	{ minutes: 1 },
	internal.auditEventsCron.emitPendingEvents
);

crons.interval(
	"prune-audit-events",
	{ hours: 24 },
	internal.auditEventsCron.pruneOldEvents
);

/**
 * Cleanup Expired Trace Spans
 *
 * Runs every hour to delete trace spans older than TRACING_RETENTION_HOURS
 * (default 24h). Prevents unbounded storage growth from dev tracing.
 */
crons.interval(
	"cleanup-expired-traces",
	{ hours: 1 },
	internal.traces.cleanupExpiredTraces
);

export default crons;

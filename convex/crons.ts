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

export default crons;

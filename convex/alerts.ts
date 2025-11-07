/**
 * Alert Management Functions
 * 
 * Handles in-app notifications for deal events and other important system
 * notifications. Alerts are stored in Convex and displayed in the UI.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { hasRbacAccess } from "./auth.config";
import { logger } from "../lib/logger";

/**
 * Get user document from identity
 */
async function getUserFromIdentity(
	ctx: { db: any; auth: any }
): Promise<Id<"users">> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Authentication required");
	}

	const user = await ctx.db
		.query("users")
		.withIndex("by_idp_id", (q: any) => q.eq("idp_id", identity.subject))
		.unique();

	if (!user) {
		throw new Error("User not found");
	}

	return user._id;
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get current user's unread alerts
 */
export const getUnreadAlerts = query({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("alerts"),
			userId: v.id("users"),
			type: v.string(),
			severity: v.string(),
			title: v.string(),
			message: v.string(),
			relatedDealId: v.optional(v.id("deals")),
			relatedListingId: v.optional(v.id("listings")),
			relatedLockRequestId: v.optional(v.id("lock_requests")),
			read: v.boolean(),
			createdAt: v.number(),
			readAt: v.optional(v.number()),
			_creationTime: v.number(),
		})
	),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return [];
		}

		const userId = await getUserFromIdentity(ctx);

		const alerts = await ctx.db
			.query("alerts")
			.withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", false))
			.order("desc")
			.collect();

		return alerts.map((alert) => ({
			_id: alert._id,
			userId: alert.userId,
			type: alert.type,
			severity: alert.severity,
			title: alert.title,
			message: alert.message,
			relatedDealId: alert.relatedDealId,
			relatedListingId: alert.relatedListingId,
			relatedLockRequestId: alert.relatedLockRequestId,
			read: alert.read,
			createdAt: alert.createdAt,
			readAt: alert.readAt,
			_creationTime: alert._creationTime,
		}));
	},
});

/**
 * Get current user's all alerts (read and unread)
 */
export const getAllUserAlerts = query({
	args: {
		limit: v.optional(v.number()),
	},
	returns: v.array(
		v.object({
			_id: v.id("alerts"),
			userId: v.id("users"),
			type: v.string(),
			severity: v.string(),
			title: v.string(),
			message: v.string(),
			relatedDealId: v.optional(v.id("deals")),
			relatedListingId: v.optional(v.id("listings")),
			relatedLockRequestId: v.optional(v.id("lock_requests")),
			read: v.boolean(),
			createdAt: v.number(),
			readAt: v.optional(v.number()),
			_creationTime: v.number(),
		})
	),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return [];
		}

		const userId = await getUserFromIdentity(ctx);
		const limit = args.limit ?? 50; // Default to 50 most recent alerts

		const alerts = await ctx.db
			.query("alerts")
			.withIndex("by_user_created_at", (q) => q.eq("userId", userId))
			.order("desc")
			.take(limit);

		return alerts.map((alert) => ({
			_id: alert._id,
			userId: alert.userId,
			type: alert.type,
			severity: alert.severity,
			title: alert.title,
			message: alert.message,
			relatedDealId: alert.relatedDealId,
			relatedListingId: alert.relatedListingId,
			relatedLockRequestId: alert.relatedLockRequestId,
			read: alert.read,
			createdAt: alert.createdAt,
			readAt: alert.readAt,
			_creationTime: alert._creationTime,
		}));
	},
});

/**
 * Get unread alert count for current user (for badge display)
 */
export const getUnreadAlertCount = query({
	args: {},
	returns: v.number(),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return 0;
		}

		const userId = await getUserFromIdentity(ctx);

		const alerts = await ctx.db
			.query("alerts")
			.withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", false))
			.collect();

		return alerts.length;
	},
});

/**
 * Get alerts for a specific deal
 */
export const getAlertsByDeal = query({
	args: {
		dealId: v.id("deals"),
	},
	returns: v.array(
		v.object({
			_id: v.id("alerts"),
			userId: v.id("users"),
			type: v.string(),
			severity: v.string(),
			title: v.string(),
			message: v.string(),
			read: v.boolean(),
			createdAt: v.number(),
		})
	),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return [];
		}

		const alerts = await ctx.db
			.query("alerts")
			.withIndex("by_deal", (q) => q.eq("relatedDealId", args.dealId))
			.order("desc")
			.collect();

		return alerts.map((alert) => ({
			_id: alert._id,
			userId: alert.userId,
			type: alert.type,
			severity: alert.severity,
			title: alert.title,
			message: alert.message,
			read: alert.read,
			createdAt: alert.createdAt,
		}));
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Mark a single alert as read
 */
export const markAlertAsRead = mutation({
	args: {
		alertId: v.id("alerts"),
	},
	returns: v.id("alerts"),
	handler: async (ctx, args) => {
		const userId = await getUserFromIdentity(ctx);

		const alert = await ctx.db.get(args.alertId);
		if (!alert) {
			throw new Error("Alert not found");
		}

		// Verify alert belongs to current user
		if (alert.userId !== userId) {
			throw new Error("Unauthorized: Alert belongs to another user");
		}

		if (alert.read) {
			// Already read, no-op
			return args.alertId;
		}

		await ctx.db.patch(args.alertId, {
			read: true,
			readAt: Date.now(),
		});

		logger.info("Alert marked as read", {
			alertId: args.alertId,
			userId,
		});

		return args.alertId;
	},
});

/**
 * Mark all alerts as read for current user
 */
export const markAllAlertsAsRead = mutation({
	args: {},
	returns: v.number(),
	handler: async (ctx) => {
		const userId = await getUserFromIdentity(ctx);

		const unreadAlerts = await ctx.db
			.query("alerts")
			.withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", false))
			.collect();

		const now = Date.now();
		for (const alert of unreadAlerts) {
			await ctx.db.patch(alert._id, {
				read: true,
				readAt: now,
			});
		}

		logger.info("All alerts marked as read", {
			userId,
			count: unreadAlerts.length,
		});

		return unreadAlerts.length;
	},
});

/**
 * Delete a single alert
 * 
 * Allows users to dismiss alerts they don't want to see anymore.
 */
export const deleteAlert = mutation({
	args: {
		alertId: v.id("alerts"),
	},
	returns: v.id("alerts"),
	handler: async (ctx, args) => {
		const userId = await getUserFromIdentity(ctx);

		const alert = await ctx.db.get(args.alertId);
		if (!alert) {
			throw new Error("Alert not found");
		}

		// Verify alert belongs to current user
		if (alert.userId !== userId) {
			throw new Error("Unauthorized: Alert belongs to another user");
		}

		await ctx.db.delete(args.alertId);

		logger.info("Alert deleted", {
			alertId: args.alertId,
			userId,
		});

		return args.alertId;
	},
});

/**
 * Delete all read alerts for current user
 * 
 * Cleanup function to remove old read alerts.
 */
export const deleteReadAlerts = mutation({
	args: {},
	returns: v.number(),
	handler: async (ctx) => {
		const userId = await getUserFromIdentity(ctx);

		const readAlerts = await ctx.db
			.query("alerts")
			.withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", true))
			.collect();

		for (const alert of readAlerts) {
			await ctx.db.delete(alert._id);
		}

		logger.info("Read alerts deleted", {
			userId,
			count: readAlerts.length,
		});

		return readAlerts.length;
	},
});

/**
 * Create a manual alert (admin utility)
 * 
 * Allows admins to create custom alerts for users.
 */
export const createAlert = mutation({
	args: {
		userId: v.id("users"),
		type: v.union(
			v.literal("deal_created"),
			v.literal("deal_state_changed"),
			v.literal("deal_completed"),
			v.literal("deal_cancelled"),
			v.literal("deal_stuck")
		),
		severity: v.union(
			v.literal("info"),
			v.literal("warning"),
			v.literal("error")
		),
		title: v.string(),
		message: v.string(),
		relatedDealId: v.optional(v.id("deals")),
		relatedListingId: v.optional(v.id("listings")),
		relatedLockRequestId: v.optional(v.id("lock_requests")),
	},
	returns: v.id("alerts"),
	handler: async (ctx, args) => {
		// Verify admin permissions
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		const isAdmin = hasRbacAccess({
			required_roles: ["admin"],
			user_identity: identity,
		});

		if (!isAdmin) {
			throw new Error("Unauthorized: Admin privileges required");
		}

		const alertId = await ctx.db.insert("alerts", {
			userId: args.userId,
			type: args.type,
			severity: args.severity,
			title: args.title,
			message: args.message,
			relatedDealId: args.relatedDealId,
			relatedListingId: args.relatedListingId,
			relatedLockRequestId: args.relatedLockRequestId,
			read: false,
			createdAt: Date.now(),
		});

		logger.info("Alert created", {
			alertId,
			userId: args.userId,
			type: args.type,
		});

		return alertId;
	},
});


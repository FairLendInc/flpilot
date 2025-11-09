/**
 * Deal Management Functions
 * 
 * Handles the complete lifecycle of mortgage purchase deals from creation
 * through ownership transfer. Integrates with XState machine for state
 * management and maintains comprehensive audit trails.
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { hasRbacAccess } from "./auth.config";
import { logger } from "../lib/logger";
import { createActor } from "xstate";
import { dealMachine, type DealContext, type DealEvent } from "./dealStateMachine";
import { createOwnershipInternal } from "./ownership";

/**
 * Get user document from identity
 * Automatically creates user from WorkOS identity data if not found
 * Handles both query (read-only) and mutation contexts
 */
type UserIdentityOptions = {
	createIfMissing?: boolean;
};

async function getUserFromIdentity(
	ctx: { db: any; auth: any },
	options?: UserIdentityOptions
): Promise<Id<"users"> | null> {
	const { createIfMissing = false } = options ?? {};
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Authentication required");
	}

	let user = await ctx.db
		.query("users")
		.withIndex("by_idp_id", (q: any) => q.eq("idp_id", identity.subject))
		.unique();

	// If user doesn't exist, optionally create from WorkOS identity data
	if (!user) {
		const idpId = identity.subject;
		const email = identity.email;

		if (!email) {
			throw new Error("Email is required but not found in identity");
		}

		if (!createIfMissing) {
			logger.warn("User identity missing in Convex and creation is disabled", {
				idpId,
			});
			return null;
		}

		const userId = await ctx.db.insert("users", {
			idp_id: idpId,
			email: email,
			email_verified: identity.email_verified ?? false,
			first_name: identity.first_name ?? undefined,
			last_name: identity.last_name ?? undefined,
			profile_picture_url: identity.profile_picture_url ?? identity.profile_picture ?? undefined,
			created_at: new Date().toISOString(),
		});

		logger.info("User created from WorkOS identity", {
			userId,
			idpId,
			email,
		});

		return userId;
	}

	return user._id;
}

/**
 * Validate admin authorization
 */
type RequireAdminOptions<T extends boolean = false> = {
	allowMissingUser?: T;
	createIfMissing?: boolean;
};

type RequireAdminReturn<T extends boolean> = T extends true ? Id<"users"> | null : Id<"users">;

async function requireAdmin<T extends boolean = false>(
	ctx: { db: any; auth: any },
	options?: RequireAdminOptions<T>
): Promise<RequireAdminReturn<T>> {
	const { allowMissingUser = false as T, createIfMissing = true } =
		(options ?? {}) as RequireAdminOptions<T>;
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

	const userId = await getUserFromIdentity(ctx, { createIfMissing });
	if (!userId) {
		if (allowMissingUser) {
			return null as RequireAdminReturn<T>;
		}
		throw new Error("User record not provisioned");
	}

	return userId as RequireAdminReturn<T>;
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get a single deal by ID with full details
 */
export const getDeal = query({
	args: { dealId: v.id("deals") },
	returns: v.union(
		v.object({
			_id: v.id("deals"),
			lockRequestId: v.id("lock_requests"),
			listingId: v.id("listings"),
			mortgageId: v.id("mortgages"),
			investorId: v.id("users"),
			stateMachineState: v.string(),
			currentState: v.string(),
			purchasePercentage: v.number(),
			dealValue: v.number(),
			createdAt: v.number(),
			updatedAt: v.number(),
			completedAt: v.optional(v.number()),
			archivedAt: v.optional(v.number()),
			stateHistory: v.array(
				v.object({
					fromState: v.string(),
					toState: v.string(),
					timestamp: v.number(),
					triggeredBy: v.id("users"),
					notes: v.optional(v.string()),
				})
			),
			validationChecks: v.optional(
				v.object({
					lawyerConfirmed: v.boolean(),
					docsComplete: v.boolean(),
					fundsReceived: v.boolean(),
					fundsVerified: v.boolean(),
				})
			),
		}),
		v.null()
	),
	handler: async (ctx, args) => {
		try {
			const adminUserId = await requireAdmin(ctx, {
				allowMissingUser: true,
				createIfMissing: false,
			});
			if (!adminUserId) {
				logger.warn("getDeal: admin identity not provisioned yet, returning null");
				return null;
			}
		} catch (error) {
			logger.error("Error in getDeal - admin check failed", {
				error: error instanceof Error ? error.message : String(error),
			});
			return null;
		}
		return await ctx.db.get(args.dealId);
	},
});

/**
 * Get all active deals (non-archived) for Kanban board
 * Includes related mortgage address and investor name for display
 */
export const getAllActiveDeals = query({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("deals"),
			lockRequestId: v.id("lock_requests"),
			listingId: v.id("listings"),
			mortgageId: v.id("mortgages"),
			investorId: v.id("users"),
			currentState: v.string(),
			purchasePercentage: v.number(),
			dealValue: v.number(),
			createdAt: v.number(),
			updatedAt: v.number(),
			completedAt: v.optional(v.number()),
			mortgageAddress: v.string(),
			investorName: v.string(),
		})
	),
	handler: async (ctx) => {
		try {
			const adminUserId = await requireAdmin(ctx, {
				allowMissingUser: true,
				createIfMissing: false,
			});
			if (!adminUserId) {
				logger.warn("getAllActiveDeals: admin identity missing, returning empty list");
				return [];
			}
		} catch (error) {
			logger.error("Error in getAllActiveDeals - admin check failed", {
				error: error instanceof Error ? error.message : String(error),
			});
			return [];
		}

		const deals = await ctx.db
			.query("deals")
			.withIndex("by_current_state")
			.filter((q) => q.neq(q.field("currentState"), "archived"))
			.collect();

		// Fetch related data for each deal
		const dealsWithDetails = await Promise.all(
			deals.map(async (deal) => {
				const mortgage = await ctx.db.get(deal.mortgageId);
				const investor = await ctx.db.get(deal.investorId);

				// Build mortgage address string
				const mortgageAddress = mortgage
					? `${mortgage.address.street}, ${mortgage.address.city}, ${mortgage.address.state} ${mortgage.address.zip}`
					: "Address not available";

				// Build investor name string
				const investorName =
					investor && investor.first_name && investor.last_name
						? `${investor.first_name} ${investor.last_name}`
						: investor?.email || "Investor not available";

				return {
					_id: deal._id,
					lockRequestId: deal.lockRequestId,
					listingId: deal.listingId,
					mortgageId: deal.mortgageId,
					investorId: deal.investorId,
					currentState: deal.currentState,
					purchasePercentage: deal.purchasePercentage,
					dealValue: deal.dealValue,
					createdAt: deal.createdAt,
					updatedAt: deal.updatedAt,
					completedAt: deal.completedAt,
					mortgageAddress,
					investorName,
				};
			})
		);

		return dealsWithDetails;
	},
});

/**
 * Get deals by specific state (for filtering Kanban columns)
 */
export const getDealsByState = query({
	args: { 
		state: v.union(
			v.literal("locked"),
			v.literal("pending_lawyer"),
			v.literal("pending_docs"),
			v.literal("pending_transfer"),
			v.literal("pending_verification"),
			v.literal("completed"),
			v.literal("cancelled"),
			v.literal("archived")
		)
	},
	returns: v.array(
		v.object({
			_id: v.id("deals"),
			mortgageId: v.id("mortgages"),
			investorId: v.id("users"),
			dealValue: v.number(),
			createdAt: v.number(),
			updatedAt: v.number(),
		})
	),
	handler: async (ctx, args) => {
		try {
			const adminUserId = await requireAdmin(ctx, {
				allowMissingUser: true,
				createIfMissing: false,
			});
			if (!adminUserId) {
				logger.warn("getDealsByState: admin identity missing, returning empty list");
				return [];
			}
		} catch (error) {
			logger.error("Error in getDealsByState - admin check failed", {
				error: error instanceof Error ? error.message : String(error),
			});
			return [];
		}

		const deals = await ctx.db
			.query("deals")
			.withIndex("by_current_state", (q) =>
				q.eq("currentState", args.state)
			)
			.collect();

		return deals.map((deal) => ({
			_id: deal._id,
			mortgageId: deal.mortgageId,
			investorId: deal.investorId,
			dealValue: deal.dealValue,
			createdAt: deal.createdAt,
			updatedAt: deal.updatedAt,
		}));
	},
});

/**
 * Get archived deals for audit/history view
 */
export const getArchivedDeals = query({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("deals"),
			lockRequestId: v.id("lock_requests"),
			currentState: v.string(),
			dealValue: v.number(),
			createdAt: v.number(),
			completedAt: v.optional(v.number()),
			archivedAt: v.optional(v.number()),
		})
	),
	handler: async (ctx) => {
		try {
			const adminUserId = await requireAdmin(ctx, {
				allowMissingUser: true,
				createIfMissing: false,
			});
			if (!adminUserId) {
				logger.warn("getArchivedDeals: admin identity missing, returning empty list");
				return [];
			}
		} catch (error) {
			logger.error("Error in getArchivedDeals - admin check failed", {
				error: error instanceof Error ? error.message : String(error),
			});
			return [];
		}

		const deals = await ctx.db
			.query("deals")
			.withIndex("by_current_state", (q) =>
				q.eq("currentState", "archived")
			)
			.order("desc")
			.collect();

		return deals.map((deal) => ({
			_id: deal._id,
			lockRequestId: deal.lockRequestId,
			currentState: deal.currentState,
			dealValue: deal.dealValue,
			createdAt: deal.createdAt,
			completedAt: deal.completedAt,
			archivedAt: deal.archivedAt,
		}));
	},
});

/**
 * Get deal with full related entity details (for detail page)
 */
export const getDealWithDetails = query({
	args: { dealId: v.id("deals") },
	returns: v.union(
		v.object({
			deal: v.object({
				_id: v.id("deals"),
				_creationTime: v.number(),
				lockRequestId: v.id("lock_requests"),
				listingId: v.id("listings"),
				mortgageId: v.id("mortgages"),
				investorId: v.id("users"),
				stateMachineState: v.string(),
				currentState: v.string(),
				purchasePercentage: v.number(),
				dealValue: v.number(),
				createdAt: v.number(),
				updatedAt: v.number(),
				completedAt: v.optional(v.number()),
				archivedAt: v.optional(v.number()),
				stateHistory: v.array(
					v.object({
						fromState: v.string(),
						toState: v.string(),
						timestamp: v.number(),
						triggeredBy: v.id("users"),
						notes: v.optional(v.string()),
					})
				),
				validationChecks: v.optional(
					v.object({
						lawyerConfirmed: v.boolean(),
						docsComplete: v.boolean(),
						fundsReceived: v.boolean(),
						fundsVerified: v.boolean(),
					})
				),
			}),
			lockRequest: v.union(
				v.object({
					_id: v.id("lock_requests"),
					status: v.string(),
					lawyerName: v.string(),
					lawyerEmail: v.string(),
					lawyerLSONumber: v.string(),
				}),
				v.null()
			),
			listing: v.union(
				v.object({
					_id: v.id("listings"),
					visible: v.boolean(),
					locked: v.boolean(),
				}),
				v.null()
			),
			mortgage: v.union(
				v.object({
					_id: v.id("mortgages"),
					loanAmount: v.number(),
					interestRate: v.number(),
					address: v.object({
						street: v.string(),
						city: v.string(),
						state: v.string(),
						zip: v.string(),
						country: v.string(),
					}),
					propertyType: v.string(),
				}),
				v.null()
			),
			investor: v.union(
				v.object({
					_id: v.id("users"),
					email: v.string(),
					first_name: v.optional(v.string()),
					last_name: v.optional(v.string()),
				}),
				v.null()
			),
		}),
		v.null()
	),
	handler: async (ctx, args) => {
		try {
			const adminUserId = await requireAdmin(ctx, {
				allowMissingUser: true,
				createIfMissing: false,
			});
			if (!adminUserId) {
				logger.warn("getDealWithDetails: admin identity missing, returning null");
				return null;
			}
		} catch (error) {
			logger.error("Error in getDealWithDetails - admin check failed", {
				error: error instanceof Error ? error.message : String(error),
			});
			return null;
		}

		const deal = await ctx.db.get(args.dealId);
		if (!deal) {
			return null;
		}

		const lockRequest = await ctx.db.get(deal.lockRequestId);
		const listing = await ctx.db.get(deal.listingId);
		const mortgage = await ctx.db.get(deal.mortgageId);
		const investor = await ctx.db.get(deal.investorId);

		return {
			deal,
			lockRequest: lockRequest
				? {
						_id: lockRequest._id,
						status: lockRequest.status,
						lawyerName: lockRequest.lawyerName,
						lawyerEmail: lockRequest.lawyerEmail,
						lawyerLSONumber: lockRequest.lawyerLSONumber,
					}
				: null,
			listing: listing
				? {
						_id: listing._id,
						visible: listing.visible,
						locked: listing.locked,
					}
				: null,
			mortgage: mortgage
				? {
						_id: mortgage._id,
						loanAmount: mortgage.loanAmount,
						interestRate: mortgage.interestRate,
						address: mortgage.address,
						propertyType: mortgage.propertyType,
					}
				: null,
			investor: investor
				? {
						_id: investor._id,
						email: investor.email,
						first_name: investor.first_name,
						last_name: investor.last_name,
					}
				: null,
		};
	},
});

/**
 * Get deal metrics for dashboard widgets
 */
export const getDealMetrics = query({
	args: {},
	returns: v.object({
		totalActive: v.number(),
		byState: v.record(v.string(), v.number()),
		totalCompleted: v.number(),
		totalCancelled: v.number(),
		averageDaysToComplete: v.number(),
		recentActivity: v.array(
			v.object({
				dealId: v.id("deals"),
				fromState: v.string(),
				toState: v.string(),
				timestamp: v.number(),
			})
		),
	}),
	handler: async (ctx) => {
		try {
			const adminUserId = await requireAdmin(ctx, {
				allowMissingUser: true,
				createIfMissing: false,
			});
			if (!adminUserId) {
				logger.warn("getDealMetrics: admin identity missing, returning empty metrics");
				return {
					totalActive: 0,
					byState: {},
					totalCompleted: 0,
					totalCancelled: 0,
					averageDaysToComplete: 0,
					recentActivity: [],
				};
			}
		} catch (error) {
			logger.error("Error in getDealMetrics - admin check failed", {
				error: error instanceof Error ? error.message : String(error),
			});
			return {
				totalActive: 0,
				byState: {},
				totalCompleted: 0,
				totalCancelled: 0,
				averageDaysToComplete: 0,
				recentActivity: [],
			};
		}

		const allDeals = await ctx.db.query("deals").collect();

		// Count by state
		const byState: Record<string, number> = {};
		let totalCompleted = 0;
		let totalCancelled = 0;

		for (const deal of allDeals) {
			if (deal.currentState === "archived") continue;
			
			byState[deal.currentState] = (byState[deal.currentState] || 0) + 1;

			if (deal.currentState === "completed") totalCompleted++;
			if (deal.currentState === "cancelled") totalCancelled++;
		}

		const totalActive = allDeals.filter(
			(d) => d.currentState !== "archived" && d.currentState !== "completed" && d.currentState !== "cancelled"
		).length;

		// Calculate average days to complete
		const completedDeals = allDeals.filter((d) => d.completedAt);
		const averageDaysToComplete =
			completedDeals.length > 0
				? completedDeals.reduce(
						(sum, d) => sum + (d.completedAt! - d.createdAt) / (1000 * 60 * 60 * 24),
						0
					) / completedDeals.length
				: 0;

		// Get recent activity (last 10 transitions across all deals)
		const recentActivity: Array<{
			dealId: Id<"deals">;
			fromState: string;
			toState: string;
			timestamp: number;
		}> = [];

		for (const deal of allDeals) {
			for (const transition of deal.stateHistory) {
				recentActivity.push({
					dealId: deal._id,
					fromState: transition.fromState,
					toState: transition.toState,
					timestamp: transition.timestamp,
				});
			}
		}

		recentActivity.sort((a, b) => b.timestamp - a.timestamp);

		return {
			totalActive,
			byState,
			totalCompleted,
			totalCancelled,
			averageDaysToComplete: Math.round(averageDaysToComplete),
			recentActivity: recentActivity.slice(0, 10),
		};
	},
});

/**
 * Check if a lock request already has an associated deal
 */
export const getDealByLockRequest = query({
	args: { lockRequestId: v.id("lock_requests") },
	returns: v.union(
		v.object({
			_id: v.id("deals"),
			currentState: v.string(),
		}),
		v.null()
	),
	handler: async (ctx, args) => {
		try {
			const adminUserId = await requireAdmin(ctx, {
				allowMissingUser: true,
				createIfMissing: false,
			});
			if (!adminUserId) {
				logger.warn("getDealByLockRequest: admin identity missing, returning null");
				return null;
			}
		} catch (error) {
			logger.error("Error in getDealByLockRequest - admin check failed", {
				error: error instanceof Error ? error.message : String(error),
			});
			return null;
		}

		const deal = await ctx.db
			.query("deals")
			.withIndex("by_lock_request", (q) =>
				q.eq("lockRequestId", args.lockRequestId)
			)
			.first();

		return deal
			? {
					_id: deal._id,
					currentState: deal.currentState,
				}
			: null;
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new deal from an approved lock request
 * 
 * This is called manually by admin via "Create Deal" button on approved requests.
 * Initializes the XState machine and creates the deal in "locked" state.
 */
export const createDeal = mutation({
	args: {
		lockRequestId: v.id("lock_requests"),
	},
	returns: v.id("deals"),
	handler: async (ctx, args) => {
		const adminUserId = await requireAdmin(ctx);

		// Get and validate lock request
		const lockRequest = await ctx.db.get(args.lockRequestId);
		if (!lockRequest) {
			throw new Error("Lock request not found");
		}

		if (lockRequest.status !== "approved") {
			throw new Error("Lock request must be approved before creating deal");
		}

		// Check if deal already exists for this lock request
		const existingDeal = await ctx.db
			.query("deals")
			.withIndex("by_lock_request", (q) =>
				q.eq("lockRequestId", args.lockRequestId)
			)
			.first();

		if (existingDeal) {
			throw new Error(
				`Deal already exists for this lock request (Deal ID: ${existingDeal._id})`
			);
		}

		// Get listing and mortgage details
		const listing = await ctx.db.get(lockRequest.listingId);
		if (!listing) {
			throw new Error("Listing not found");
		}

		const mortgage = await ctx.db.get(listing.mortgageId);
		if (!mortgage) {
			throw new Error("Mortgage not found");
		}

		// Calculate deal value (100% purchase for pilot)
		const dealValue = mortgage.loanAmount;
		const purchasePercentage = 100;

		// Initialize XState machine context
		const initialContext: Omit<DealContext, "dealId"> = {
			lockRequestId: args.lockRequestId,
			listingId: lockRequest.listingId,
			mortgageId: listing.mortgageId,
			investorId: lockRequest.requestedBy,
			purchasePercentage,
			dealValue,
			currentState: "locked",
			stateHistory: [],
		};

		// Create initial actor to get proper XState snapshot format
		// XState v5 requires a proper snapshot structure, not just { value, context }
		const initialActor = createActor(dealMachine);
		initialActor.start();

		// Get the initial snapshot structure from XState
		let initialSnapshot = initialActor.getSnapshot();
		initialActor.stop();

		// Update the snapshot's context with our initial context (with placeholder ID)
		const placeholderContext: DealContext = {
			...initialContext,
			dealId: "PLACEHOLDER" as Id<"deals">,
		};
		initialSnapshot = {
			...initialSnapshot,
			context: placeholderContext,
		};

		// Create the deal with proper XState snapshot
		const dealId = await ctx.db.insert("deals", {
			lockRequestId: args.lockRequestId,
			listingId: lockRequest.listingId,
			mortgageId: listing.mortgageId,
			investorId: lockRequest.requestedBy,
			stateMachineState: JSON.stringify(initialSnapshot),
			currentState: "locked",
			purchasePercentage,
			dealValue,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			stateHistory: [
				{
					fromState: "none",
					toState: "locked",
					timestamp: Date.now(),
					triggeredBy: adminUserId,
					notes: "Deal created from approved lock request",
				},
			],
		});

		// Update state machine context with actual deal ID
		// Create actor, update context, and get new snapshot
		const tempActor = createActor(dealMachine);
		tempActor.start();
		let updatedSnapshot = tempActor.getSnapshot();
		tempActor.stop();

		const updatedContext: DealContext = {
			...initialContext,
			dealId,
		};
		updatedSnapshot = {
			...updatedSnapshot,
			context: updatedContext,
		};

		await ctx.db.patch(dealId, {
			stateMachineState: JSON.stringify(updatedSnapshot),
		});

		// Create alert for admin
		await ctx.db.insert("alerts", {
			userId: adminUserId,
			type: "deal_created",
			severity: "info",
			title: "Deal Created",
			message: `Deal created for mortgage at ${mortgage.address.street}`,
			relatedDealId: dealId,
			relatedListingId: lockRequest.listingId,
			relatedLockRequestId: args.lockRequestId,
			read: false,
			createdAt: Date.now(),
		});

		logger.info("Deal created", {
			dealId,
			lockRequestId: args.lockRequestId,
			createdBy: adminUserId,
		});

		return dealId;
	},
});

/**
 * Transition deal to a new state
 * 
 * Handles both forward and backward state transitions via XState machine.
 * Updates the database and creates audit trail entries.
 */
export const transitionDealState = mutation({
	args: {
		dealId: v.id("deals"),
		event: v.union(
			v.object({ type: v.literal("CONFIRM_LAWYER"), notes: v.optional(v.string()) }),
			v.object({ type: v.literal("COMPLETE_DOCS"), notes: v.optional(v.string()) }),
			v.object({ type: v.literal("RECEIVE_FUNDS"), notes: v.optional(v.string()) }),
			v.object({ type: v.literal("VERIFY_FUNDS"), notes: v.optional(v.string()) }),
			v.object({ type: v.literal("COMPLETE_DEAL"), notes: v.optional(v.string()) }),
			v.object({ type: v.literal("GO_BACK"), toState: v.string(), notes: v.optional(v.string()) }),
		),
	},
	returns: v.id("deals"),
	handler: async (ctx, args) => {
		const adminUserId = await requireAdmin(ctx);

		const deal = await ctx.db.get(args.dealId);
		if (!deal) {
			throw new Error("Deal not found");
		}

		// Parse current state machine state
		const machineState = JSON.parse(deal.stateMachineState);
		
		// Create actor and restore state
		const actor = createActor(dealMachine, {
			snapshot: machineState,
		});

		// Send event with admin ID
		const eventWithAdmin = {
			...args.event,
			adminId: adminUserId,
		} as DealEvent;

		// Start actor and send event
		actor.start();
		actor.send(eventWithAdmin);

		// Get new state
		const newSnapshot = actor.getSnapshot();
		const newContext = newSnapshot.context;

		// Update deal in database
		await ctx.db.patch(args.dealId, {
			stateMachineState: JSON.stringify(newSnapshot),
			currentState: newContext.currentState,
			updatedAt: Date.now(),
			stateHistory: newContext.stateHistory,
		});

		// Stop actor
		actor.stop();

		// Create alert for state change
		await ctx.db.insert("alerts", {
			userId: adminUserId,
			type: "deal_state_changed",
			severity: "info",
			title: "Deal State Changed",
			message: `Deal moved from ${deal.currentState} to ${newContext.currentState}`,
			relatedDealId: args.dealId,
			relatedListingId: deal.listingId,
			read: false,
			createdAt: Date.now(),
		});

		logger.info("Deal state transitioned", {
			dealId: args.dealId,
			fromState: deal.currentState,
			toState: newContext.currentState,
			triggeredBy: adminUserId,
		});

		return args.dealId;
	},
});

/**
 * Cancel a deal
 * 
 * Moves deal to cancelled state, unlocks the listing, and creates alerts.
 * All changes are reverted per requirements.
 */
export const cancelDeal = mutation({
	args: {
		dealId: v.id("deals"),
		reason: v.string(),
	},
	returns: v.id("deals"),
	handler: async (ctx, args) => {
		const adminUserId = await requireAdmin(ctx);

		const deal = await ctx.db.get(args.dealId);
		if (!deal) {
			throw new Error("Deal not found");
		}

		if (deal.currentState === "archived" || deal.currentState === "cancelled") {
			throw new Error("Cannot cancel an already cancelled or archived deal");
		}

		// Unlock the listing
		await ctx.db.patch(deal.listingId, {
			locked: false,
			lockedBy: undefined,
			lockedAt: undefined,
		});

		// Update deal to cancelled state
		const machineState = JSON.parse(deal.stateMachineState);
		const cancelEvent: DealEvent = {
			type: "CANCEL",
			adminId: adminUserId,
			reason: args.reason,
		};

		const actor = createActor(dealMachine, {
			snapshot: machineState,
		});
		actor.start();
		actor.send(cancelEvent);

		const newSnapshot = actor.getSnapshot();
		const newContext = newSnapshot.context;

		await ctx.db.patch(args.dealId, {
			stateMachineState: JSON.stringify(newSnapshot),
			currentState: "cancelled",
			updatedAt: Date.now(),
			cancelledAt: Date.now(),
			stateHistory: newContext.stateHistory,
		});

		actor.stop();

		// Create alerts
		await ctx.db.insert("alerts", {
			userId: adminUserId,
			type: "deal_cancelled",
			severity: "warning",
			title: "Deal Cancelled",
			message: `Deal cancelled: ${args.reason}`,
			relatedDealId: args.dealId,
			relatedListingId: deal.listingId,
			read: false,
			createdAt: Date.now(),
		});

		// Alert investor
		await ctx.db.insert("alerts", {
			userId: deal.investorId,
			type: "deal_cancelled",
			severity: "warning",
			title: "Your Deal Was Cancelled",
			message: `Your deal has been cancelled. Reason: ${args.reason}`,
			relatedDealId: args.dealId,
			relatedListingId: deal.listingId,
			read: false,
			createdAt: Date.now(),
		});

		logger.info("Deal cancelled", {
			dealId: args.dealId,
			reason: args.reason,
			cancelledBy: adminUserId,
		});

		return args.dealId;
	},
});

/**
 * Complete deal and transfer ownership
 * 
 * This is called when admin clicks "Transfer Ownership" button on completed deals.
 * Transfers 100% ownership from FairLend to investor.
 */
export const completeDeal = mutation({
	args: {
		dealId: v.id("deals"),
	},
	returns: v.id("deals"),
	handler: async (ctx, args) => {
		const adminUserId = await requireAdmin(ctx);

		const deal = await ctx.db.get(args.dealId);
		if (!deal) {
			throw new Error("Deal not found");
		}

		if (deal.currentState !== "completed") {
			throw new Error("Deal must be in completed state before transferring ownership");
		}

		if (deal.completedAt) {
			throw new Error("Ownership has already been transferred for this deal");
		}

		// Call ownership.createOwnershipInternal to transfer 100% from FairLend to investor
		// This will automatically reduce FairLend's ownership per the 100% invariant
		await createOwnershipInternal(ctx, {
			mortgageId: deal.mortgageId,
			ownerId: deal.investorId,
			ownershipPercentage: deal.purchasePercentage,
		});

		// Mark deal as fully completed
		await ctx.db.patch(args.dealId, {
			completedAt: Date.now(),
			updatedAt: Date.now(),
		});

		// Create alerts
		await ctx.db.insert("alerts", {
			userId: adminUserId,
			type: "deal_completed",
			severity: "info",
			title: "Deal Completed",
			message: "Ownership has been successfully transferred",
			relatedDealId: args.dealId,
			relatedListingId: deal.listingId,
			read: false,
			createdAt: Date.now(),
		});

		// Alert investor
		await ctx.db.insert("alerts", {
			userId: deal.investorId,
			type: "deal_completed",
			severity: "info",
			title: "Your Deal Is Complete!",
			message: "Congratulations! Ownership has been transferred. You now own this mortgage.",
			relatedDealId: args.dealId,
			relatedListingId: deal.listingId,
			read: false,
			createdAt: Date.now(),
		});

		logger.info("Deal completed and ownership transferred", {
			dealId: args.dealId,
			mortgageId: deal.mortgageId,
			investorId: deal.investorId,
			percentage: deal.purchasePercentage,
		});

		return args.dealId;
	},
});

/**
 * Archive a deal
 * 
 * Moves completed or cancelled deals to archived state for audit purposes.
 */
export const archiveDeal = mutation({
	args: {
		dealId: v.id("deals"),
	},
	returns: v.id("deals"),
	handler: async (ctx, args) => {
		const adminUserId = await requireAdmin(ctx);

		const deal = await ctx.db.get(args.dealId);
		if (!deal) {
			throw new Error("Deal not found");
		}

		if (deal.currentState !== "completed" && deal.currentState !== "cancelled") {
			throw new Error("Only completed or cancelled deals can be archived");
		}

		// Transition to archived state
		const machineState = JSON.parse(deal.stateMachineState);
		const archiveEvent: DealEvent = {
			type: "ARCHIVE",
			adminId: adminUserId,
		};

		const actor = createActor(dealMachine, {
			snapshot: machineState,
		});
		actor.start();
		actor.send(archiveEvent);

		const newSnapshot = actor.getSnapshot();
		const newContext = newSnapshot.context;

		await ctx.db.patch(args.dealId, {
			stateMachineState: JSON.stringify(newSnapshot),
			currentState: "archived",
			archivedAt: Date.now(),
			updatedAt: Date.now(),
			stateHistory: newContext.stateHistory,
		});

		actor.stop();

		logger.info("Deal archived", {
			dealId: args.dealId,
			archivedBy: adminUserId,
		});

		return args.dealId;
	},
});

// ============================================================================
// INTERNAL / VALIDATION FUNCTIONS (Stubs for future)
// ============================================================================

/**
 * Validate lawyer confirmation
 * @future Integrate with lawyer credential verification API
 */
export const validateLawyerConfirmation = internalMutation({
	args: { dealId: v.id("deals") },
	returns: v.boolean(),
	handler: async (ctx, args) => {
		// TODO: Implement lawyer credential checks
		// - Verify LSO number is valid
		// - Check lawyer email confirmation
		// - Validate lawyer has confirmed representation
		return true; // Pass-through for now
	},
});

/**
 * Validate document completion
 * @future Integrate with document upload/signature tracking
 */
export const validateDocumentCompletion = internalMutation({
	args: { dealId: v.id("deals") },
	returns: v.boolean(),
	handler: async (ctx, args) => {
		// TODO: Implement document validation
		// - Check all required documents are uploaded
		// - Verify signatures are complete
		// - Validate document authenticity
		return true; // Pass-through for now
	},
});

/**
 * Validate fund transfer
 * @future Integrate with payment processor
 */
export const validateFundTransfer = internalMutation({
	args: { dealId: v.id("deals") },
	returns: v.boolean(),
	handler: async (ctx, args) => {
		// TODO: Implement payment validation
		// - Check funds have been received
		// - Verify amount matches deal value
		// - Validate payment source
		return true; // Pass-through for now
	},
});

/**
 * Validate fund verification
 * @future Integrate with banking APIs
 */
export const validateFundVerification = internalMutation({
	args: { dealId: v.id("deals") },
	returns: v.boolean(),
	handler: async (ctx, args) => {
		// TODO: Implement fund verification
		// - Check funds have cleared
		// - Verify no chargebacks
		// - Validate sufficient funds
		return true; // Pass-through for now
	},
});

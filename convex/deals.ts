/**
 * Deal Management Functions
 *
 * Handles the complete lifecycle of mortgage purchase deals from creation
 * through ownership transfer. Integrates with XState machine for state
 * management and maintains comprehensive audit trails.
 */

import { v } from "convex/values";
import { createActor } from "xstate";
import { hasRbacAccess } from "../lib/authhelper";
import { generateDocumentsFromTemplates } from "../lib/documenso";
import { logger } from "../lib/logger";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server";
import {
	type DealContext,
	type DealEventWithAdmin,
	dealMachine,
} from "./dealStateMachine";
import {
	adminAction,
	authenticatedMutation,
	investorLawyerAdminAction,
	investorLawyerAdminMutation,
} from "./lib/authorizedFunctions";
import { getBrokerOfRecord } from "./lib/broker";
import { isLedgerSourceOfTruth } from "./lib/ownershipConfig";
import { createOwnershipInternal } from "./ownership";

type AuthContextFields = {
	role?: string;
	subject?: string;
	email?: string;
};

/**
 * Get user document from identity
 * Automatically creates user from WorkOS identity data if not found
 * Handles both query (read-only) and mutation contexts
 */
type UserIdentityOptions = {
	createIfMissing?: boolean;
};

type IdentityCtx = QueryCtx | MutationCtx;

async function getUserFromIdentity(
	ctx: IdentityCtx,
	options?: UserIdentityOptions
): Promise<Id<"users"> | null> {
	const { createIfMissing = false } = options ?? {};
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Authentication required");
	}

	const user = await ctx.db
		.query("users")
		.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
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

		//TODO: Create extended UserIdentity type with all the custom clais so we don't need to do this bs
		const mutationCtx = ctx as MutationCtx;
		const userId = await mutationCtx.db.insert("users", {
			idp_id: idpId,
			email,
			email_verified: Boolean(identity.email_verified),
			first_name:
				typeof identity.first_name === "string"
					? identity.first_name
					: undefined,
			last_name:
				typeof identity.last_name === "string" ? identity.last_name : undefined,
			profile_picture_url:
				typeof identity.profile_picture_url === "string"
					? identity.profile_picture_url
					: typeof identity.profile_picture === "string"
						? identity.profile_picture
						: undefined,
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

type RequireAdminReturn<T extends boolean> = T extends true
	? Id<"users"> | null
	: Id<"users">;

type GeneratedDocumentResult = {
	templateId: string;
	documentId?: string;
	error?: string;
	success: boolean;
};

type DealCreationData = {
	lockRequest: Doc<"lock_requests">;
	listing: Doc<"listings">;
	mortgage: Doc<"mortgages">;
	investor: Doc<"users">;
	adminUserId: Id<"users">;
};

type CompletedDealDoc = Doc<"deals"> & { completedAt: number };

async function requireAdmin<T extends boolean = false>(
	ctx: IdentityCtx,
	options?: RequireAdminOptions<T>
): Promise<RequireAdminReturn<T>> {
	const { allowMissingUser = false as T, createIfMissing = true } = (options ??
		{}) as RequireAdminOptions<T>;
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
	handler: async (ctx, args) => {
		try {
			const adminUserId = await requireAdmin(ctx, {
				allowMissingUser: true,
				createIfMissing: false,
			});
			if (!adminUserId) {
				logger.warn(
					"getDeal: admin identity not provisioned yet, returning null"
				);
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
			lockRequestId: v.optional(v.id("lock_requests")),
			listingId: v.id("listings"),
			mortgageId: v.id("mortgages"),
			investorId: v.id("users"),
			currentState: v.optional(v.string()),
			purchasePercentage: v.optional(v.number()),
			dealValue: v.optional(v.number()),
			createdAt: v.number(),
			completedAt: v.optional(v.number()),
			updatedAt: v.number(),
			// Joined data
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
				logger.warn(
					"getAllActiveDeals: admin identity missing, returning empty list"
				);
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
					investor?.first_name && investor.last_name
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
			v.literal("pending_ownership_review"),
			v.literal("completed"),
			v.literal("cancelled"),
			v.literal("archived")
		),
	},
	returns: v.array(
		v.object({
			_id: v.id("deals"),
			mortgageId: v.id("mortgages"),
			investorId: v.id("users"),
			dealValue: v.optional(v.number()),
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
				logger.warn(
					"getDealsByState: admin identity missing, returning empty list"
				);
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
			.withIndex("by_current_state", (q) => q.eq("currentState", args.state))
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
			lockRequestId: v.optional(v.id("lock_requests")),
			currentState: v.optional(v.string()),
			dealValue: v.optional(v.number()),
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
				logger.warn(
					"getArchivedDeals: admin identity missing, returning empty list"
				);
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
			.withIndex("by_current_state", (q) => q.eq("currentState", "archived"))
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
				lockRequestId: v.optional(v.id("lock_requests")),
				listingId: v.id("listings"),
				mortgageId: v.id("mortgages"),
				investorId: v.id("users"),
				stateMachineState: v.optional(v.string()),
				currentState: v.optional(v.string()),
				purchasePercentage: v.optional(v.number()),
				dealValue: v.optional(v.number()),
				createdAt: v.number(),
				updatedAt: v.number(),
				completedAt: v.optional(v.number()),
				archivedAt: v.optional(v.number()),
				stateHistory: v.optional(
					v.array(
						v.object({
							fromState: v.string(),
							toState: v.string(),
							timestamp: v.number(),
							triggeredBy: v.id("users"),
							notes: v.optional(v.string()),
						})
					)
				),
				validationChecks: v.optional(
					v.object({
						lawyerConfirmed: v.boolean(),
						docsComplete: v.boolean(),
						fundsReceived: v.boolean(),
						fundsVerified: v.boolean(),
					})
				),
				currentUpload: v.optional(
					v.object({
						storageId: v.id("_storage"),
						uploadedBy: v.string(),
						uploadedAt: v.number(),
						fileName: v.string(),
						fileType: v.string(),
					})
				),
				uploadHistory: v.optional(
					v.array(
						v.object({
							storageId: v.id("_storage"),
							uploadedBy: v.string(),
							uploadedAt: v.number(),
							fileName: v.string(),
							fileType: v.string(),
						})
					)
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
				logger.warn(
					"getDealWithDetails: admin identity missing, returning null"
				);
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

		const lockRequest = deal.lockRequestId
			? await ctx.db.get(deal.lockRequestId)
			: null;
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
				logger.warn(
					"getDealMetrics: admin identity missing, returning empty metrics"
				);
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

			if (deal.currentState) {
				byState[deal.currentState] = (byState[deal.currentState] || 0) + 1;
			}

			if (deal.currentState === "completed") totalCompleted += 1;
			if (deal.currentState === "cancelled") totalCancelled += 1;
		}

		const totalActive = allDeals.filter(
			(d) =>
				d.currentState !== "archived" &&
				d.currentState !== "completed" &&
				d.currentState !== "cancelled"
		).length;

		// Calculate average days to complete
		const completedDeals = allDeals.filter(
			(deal): deal is CompletedDealDoc => typeof deal.completedAt === "number"
		);
		const averageDaysToComplete =
			completedDeals.length > 0
				? completedDeals.reduce(
						(sum, deal) =>
							sum + (deal.completedAt - deal.createdAt) / (1000 * 60 * 60 * 24),
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
			if (deal.stateHistory) {
				for (const transition of deal.stateHistory) {
					recentActivity.push({
						dealId: deal._id,
						fromState: transition.fromState,
						toState: transition.toState,
						timestamp: transition.timestamp,
					});
				}
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
			currentState: v.optional(v.string()),
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
				logger.warn(
					"getDealByLockRequest: admin identity missing, returning null"
				);
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
 * Internal mutation to create a deal record
 * Called by the createDeal action
 */
export const createDealInternal = internalMutation({
	args: {
		lockRequestId: v.id("lock_requests"),
		listingId: v.id("listings"),
		mortgageId: v.id("mortgages"),
		investorId: v.id("users"),
		stateMachineState: v.string(),
		currentState: v.union(
			v.literal("locked"),
			v.literal("pending_lawyer"),
			v.literal("pending_docs"),
			v.literal("pending_transfer"),
			v.literal("pending_verification"),
			v.literal("pending_ownership_review"),
			v.literal("completed"),
			v.literal("cancelled"),
			v.literal("archived")
		),
		purchasePercentage: v.number(),
		dealValue: v.number(),
		stateHistory: v.array(
			v.object({
				fromState: v.string(),
				toState: v.string(),
				timestamp: v.number(),
				triggeredBy: v.id("users"),
				notes: v.optional(v.string()),
			})
		),
		// New fields
		brokerId: v.optional(v.id("users")),
		brokerName: v.optional(v.string()),
		brokerEmail: v.optional(v.string()),
		lawyerName: v.optional(v.string()),
		lawyerEmail: v.optional(v.string()),
		lawyerLSONumber: v.optional(v.string()),
	},
	returns: v.id("deals"),
	handler: async (ctx, args) => {
		const dealId = await ctx.db.insert("deals", {
			lockRequestId: args.lockRequestId,
			listingId: args.listingId,
			mortgageId: args.mortgageId,
			investorId: args.investorId,
			stateMachineState: args.stateMachineState,
			currentState: args.currentState,
			purchasePercentage: args.purchasePercentage,
			dealValue: args.dealValue,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			stateHistory: args.stateHistory,
			// status: "pending", // Initial status
			// New fields
			brokerId: args.brokerId,
			brokerName: args.brokerName,
			brokerEmail: args.brokerEmail,
			lawyerName: args.lawyerName,
			lawyerEmail: args.lawyerEmail,
			lawyerLSONumber: args.lawyerLSONumber,
		});
		return dealId;
	},
});

/**
 * Internal mutation to update deal status
 */
// export const updateDealStatusInternal = internalMutation({
// 	args: {
// 		dealId: v.id("deals"),
// 		status: v.union(
// 			v.literal("pending"),
// 			v.literal("active"),
// 			v.literal("completed"),
// 			v.literal("cancelled"),
// 			v.literal("archived")
// 		),
// 	},
// 	handler: async (ctx, args) => {
// 		await ctx.db.patch(args.dealId, {
// 			// status: args.status,
// 			updatedAt: Date.now(),
// 		});
// 	},
// });

/**
 * Create a new deal from an approved lock request
 *
 * This is called manually by admin via "Create Deal" button on approved requests.
 * Initializes the XState machine and creates the deal in "locked" state.
 * Also generates documents from mortgage templates.
 */
export const createDeal = adminAction({
	args: {
		lockRequestId: v.id("lock_requests"),
	},
	returns: v.object({
		dealId: v.id("deals"),
		documentResults: v.array(
			v.object({
				templateId: v.string(),
				documentId: v.optional(v.string()),
				error: v.optional(v.string()),
				success: v.boolean(),
			})
		),
	}),
	handler: async (ctx, args) => {
		// 1. Validate admin authorization (via query)
		// We can't use requireAdmin directly in action as it uses ctx.db
		// So we fetch identity and check roles via helper or assume caller is authorized
		// For actions, we typically rely on the internal mutations to enforce data integrity
		// But we should check auth here too.

		// Check RBAC via a query helper if needed, or trust the internal mutation checks later
		// For now, we'll proceed and let the internal mutation fail if user is invalid,
		// but ideally we'd check here.
		// Since we need the user ID for the audit trail, we'll get it from the internal mutation return or pass it in.
		// Actually, we need to fetch data first.

		// 2. Fetch necessary data via query
		const data: DealCreationData | null = await ctx.runQuery(
			internal.deals.getDealCreationData,
			{
				lockRequestId: args.lockRequestId,
			}
		);

		if (!data) {
			throw new Error("Lock request not found or invalid");
		}

		const { lockRequest, listing, mortgage, investor, adminUserId } = data;

		if (lockRequest.status !== "approved") {
			throw new Error("Lock request must be approved before creating deal");
		}

		// 3. Initialize XState machine
		const dealValue = mortgage.loanAmount;
		const purchasePercentage = 100;

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

		const placeholderContext: DealContext = {
			...initialContext,
			dealId: "PLACEHOLDER" as Id<"deals">,
		};

		const initialActor = createActor(dealMachine, {
			input: placeholderContext,
		});
		initialActor.start();
		const initialSnapshot = initialActor.getSnapshot();
		initialActor.stop();

		// 4. Create deal record via internal mutation
		const broker = getBrokerOfRecord();

		const dealId: Id<"deals"> = await ctx.runMutation(
			internal.deals.createDealInternal,
			{
				lockRequestId: args.lockRequestId,
				listingId: lockRequest.listingId,
				mortgageId: listing.mortgageId,
				investorId: lockRequest.requestedBy,
				stateMachineState: JSON.stringify(initialSnapshot),
				currentState: "locked",
				purchasePercentage,
				dealValue,
				stateHistory: [
					{
						fromState: "none",
						toState: "locked",
						timestamp: Date.now(),
						triggeredBy: adminUserId,
						notes: "Deal created from approved lock request",
					},
				],
				// Populate broker and lawyer fields
				brokerId: broker.brokerId,
				brokerName: broker.brokerName,
				brokerEmail: broker.brokerEmail,
				lawyerName: lockRequest.lawyerName,
				lawyerEmail: lockRequest.lawyerEmail,
				lawyerLSONumber: lockRequest.lawyerLSONumber,
			}
		);

		// 5. Update state machine with actual deal ID
		const updatedContext: DealContext = {
			...initialContext,
			dealId,
		};

		const tempActor = createActor(dealMachine, { input: updatedContext });
		tempActor.start();
		const updatedSnapshot = tempActor.getSnapshot();
		tempActor.stop();

		await ctx.runMutation(internal.deals.updateDealStateMachine, {
			dealId,
			stateMachineState: JSON.stringify(updatedSnapshot),
		});

		// 6. Generate documents from templates
		const templates = mortgage.documentTemplates || [];
		let documentResults: GeneratedDocumentResult[] = [];

		if (templates.length > 0) {
			// Prepare recipient data
			// We need broker details - for now hardcoding or fetching from config
			// In a real app, this might come from an organization settings table
			const signingBroker = {
				name: "FairLend Broker",
				email: "broker@fairlend.ca", // TODO: Get from config
			};

			const investorDetails = {
				name:
					`${investor.first_name || ""} ${investor.last_name || ""}`.trim() ||
					investor.email,
				email: investor.email,
			};

			// Call Documenso lib
			documentResults = await generateDocumentsFromTemplates(
				templates,
				signingBroker,
				investorDetails
			);

			// Store results
			for (const result of documentResults) {
				if (result.success && result.documentId) {
					const template = templates.find(
						(t: { documensoTemplateId: string }) =>
							t.documensoTemplateId === result.templateId
					);
					if (template) {
						await ctx.runMutation(
							internal.deal_documents.createDealDocumentInternal,
							{
								dealId,
								documensoDocumentId: result.documentId,
								templateId: template.documensoTemplateId,
								templateName: template.name,
								signatories: [
									{ role: "Broker", ...signingBroker },
									{ role: "Investor", ...investorDetails },
								],
							}
						);
					}
				}
			}
		}

		// 7. Create alerts (via internal mutation to keep action clean)
		await ctx.runMutation(internal.deals.createDealCreationAlerts, {
			dealId,
			adminUserId,
			mortgageAddress: mortgage.address.street,
			listingId: lockRequest.listingId,
			lockRequestId: args.lockRequestId,
		});

		return { dealId, documentResults };
	},
});

/**
 * Helper query to fetch data for deal creation
 * Ensures we have all necessary data and permissions before proceeding
 */
export const getDealCreationData = internalQuery({
	args: { lockRequestId: v.id("lock_requests") },
	handler: async (ctx, args): Promise<DealCreationData | null> => {
		const adminUserId = await requireAdmin(ctx);

		const lockRequest = await ctx.db.get(args.lockRequestId);
		if (!lockRequest) return null;

		const listing = await ctx.db.get(lockRequest.listingId);
		if (!listing) return null;

		const mortgage = await ctx.db.get(listing.mortgageId);
		if (!mortgage) return null;

		const investor = await ctx.db.get(lockRequest.requestedBy);
		if (!investor) return null;

		return {
			lockRequest,
			listing,
			mortgage,
			investor,
			adminUserId,
		};
	},
});

/**
 * Internal mutation to update deal state machine
 */
export const updateDealStateMachine = internalMutation({
	args: {
		dealId: v.id("deals"),
		stateMachineState: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.dealId, {
			stateMachineState: args.stateMachineState,
		});
	},
});

/**
 * Internal mutation to create alerts after deal creation
 */
export const createDealCreationAlerts = internalMutation({
	args: {
		dealId: v.id("deals"),
		adminUserId: v.id("users"),
		mortgageAddress: v.string(),
		listingId: v.id("listings"),
		lockRequestId: v.id("lock_requests"),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert("alerts", {
			userId: args.adminUserId,
			type: "deal_created",
			severity: "info",
			title: "Deal Created",
			message: `Deal created for mortgage at ${args.mortgageAddress}`,
			relatedDealId: args.dealId,
			relatedListingId: args.listingId,
			relatedLockRequestId: args.lockRequestId,
			read: false,
			createdAt: Date.now(),
		});
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
			v.object({
				type: v.literal("CONFIRM_LAWYER"),
				notes: v.optional(v.string()),
			}),
			v.object({
				type: v.literal("COMPLETE_DOCS"),
				notes: v.optional(v.string()),
			}),
			v.object({
				type: v.literal("DOCUMENTS_COMPLETE"),
				notes: v.optional(v.string()),
			}),
			v.object({
				type: v.literal("RECEIVE_FUNDS"),
				notes: v.optional(v.string()),
			}),
			v.object({
				type: v.literal("VERIFY_FUNDS"),
				notes: v.optional(v.string()),
			}),
			// New events for ownership review workflow
			v.object({
				type: v.literal("VERIFY_COMPLETE"),
				notes: v.optional(v.string()),
			}),
			v.object({
				type: v.literal("CONFIRM_TRANSFER"),
				notes: v.optional(v.string()),
			}),
			v.object({
				type: v.literal("REJECT_TRANSFER"),
				reason: v.string(),
			}),
			// Legacy: direct to completed (backward compat)
			v.object({
				type: v.literal("COMPLETE_DEAL"),
				notes: v.optional(v.string()),
			}),
			v.object({
				type: v.literal("GO_BACK"),
				toState: v.string(),
				notes: v.optional(v.string()),
			})
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
		if (!deal.stateMachineState) {
			throw new Error("Deal has no state machine state");
		}
		const machineState = JSON.parse(deal.stateMachineState);

		// Create actor and restore state
		const actor = createActor(dealMachine, {
			input: machineState.context,
			snapshot: machineState,
		});

		// Send event with admin ID injected from auth context
		const eventWithAdmin = {
			...args.event,
			adminId: adminUserId,
		} as DealEventWithAdmin;

		// Start actor and send event
		actor.start();
		actor.send(eventWithAdmin);

		// Get new state
		const newSnapshot = actor.getSnapshot();
		const newContext = newSnapshot.context;

		// Validate transition actually happened (XState v5 returns same state if no transition found)
		if (
			newSnapshot.value === machineState.value &&
			args.event.type !== "GO_BACK"
		) {
			// Check if the event is actually handled in the current state
			// In XState v5, we can check if the state changed or if there are any actions/transitions
			// For simplicity, we'll check if the state value is the same as before
			// NOTE: Some transitions might stay in the same state (self-transitions), but for our machine
			// most events should move to a new state.
			// Actually, a better way is to check if the event is valid for the current state.
			const canHandle = actor.getSnapshot().can(eventWithAdmin);
			if (!canHandle) {
				actor.stop();
				throw new Error(
					`Invalid transition: Event ${args.event.type} is not allowed in state ${deal.currentState}`
				);
			}
		}

		// Update deal in database
		await ctx.db.patch(args.dealId, {
			stateMachineState: JSON.stringify(newSnapshot),
			currentState: newContext.currentState,
			updatedAt: Date.now(),
			stateHistory: newContext.stateHistory,
		});

		// Stop actor
		actor.stop();

		// Handle special transitions for ownership review workflow
		const previousState = deal.currentState;
		const newState = newContext.currentState;
		const transitionSucceeded = previousState !== newState;

		// VERIFY_COMPLETE: Create pending transfer when entering ownership review
		if (
			args.event.type === "VERIFY_COMPLETE" &&
			newState === "pending_ownership_review" &&
			transitionSucceeded
		) {
			const existingTransfers = await ctx.db
				.query("pending_ownership_transfers")
				.withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
				.collect();
			const existingPendingTransfer = existingTransfers.find(
				(transfer) =>
					transfer.status === "pending" &&
					transfer.mortgageId === deal.mortgageId
			);
			if (existingPendingTransfer) {
				logger.info("Pending ownership transfer already exists", {
					dealId: args.dealId,
				});
			} else {
				// Check for existing rejected transfer to carry over rejection count
				const previousTransfer = [...existingTransfers].sort(
					(a, b) => b.createdAt - a.createdAt
				)[0];

				const rejectionCount =
					previousTransfer?.status === "rejected"
						? (previousTransfer.rejectionCount ?? 0)
						: 0;

				// Create pending transfer for admin review
				await ctx.db.insert("pending_ownership_transfers", {
					dealId: args.dealId,
					mortgageId: deal.mortgageId,
					fromOwnerId: "fairlend",
					toOwnerId: deal.investorId,
					percentage: deal.purchasePercentage ?? 100,
					status: "pending",
					createdAt: Date.now(),
					rejectionCount,
				});

				// Create alert for admins about required review
				await ctx.db.insert("alerts", {
					userId: adminUserId,
					type: "ownership_review_required",
					severity: "info",
					title: "Ownership Transfer Review Required",
					message: `Deal requires ownership transfer review for ${deal.purchasePercentage ?? 100}% stake`,
					relatedDealId: args.dealId,
					relatedListingId: deal.listingId,
					read: false,
					createdAt: Date.now(),
				});

				logger.info("Pending ownership transfer created", {
					dealId: args.dealId,
					investorId: deal.investorId,
					percentage: deal.purchasePercentage ?? 100,
				});
			}
		}

		// CONFIRM_TRANSFER: Execute ownership transfer on approval
		if (args.event.type === "CONFIRM_TRANSFER" && newState === "completed") {
			// Update pending transfer status
			const pendingTransfer = await ctx.db
				.query("pending_ownership_transfers")
				.withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
				.filter((q) => q.eq(q.field("status"), "approved"))
				.first();

			if (!pendingTransfer) {
				throw new Error(
					"Transfer is not approved. Deal cannot be completed without an approved ownership transfer."
				);
			}

			const reference = `transfer:${pendingTransfer._id}`;

			if (!isLedgerSourceOfTruth()) {
				// Execute ownership transfer using createOwnershipInternal
				// CRITICAL: footguns.md #1 - NEVER direct insert, use helper
				await createOwnershipInternal(ctx, {
					mortgageId: deal.mortgageId,
					ownerId: deal.investorId,
					ownershipPercentage: deal.purchasePercentage ?? 100,
				});
			}

			// Schedule ledger transfer (Formance)
			// CRITICAL: footguns.md #3 - external API calls must be scheduled actions
			// CRITICAL: footguns.md #5 - use idempotency key (reference)
			const percentage = deal.purchasePercentage ?? 100;
			await ctx.scheduler.runAfter(0, internal.ledger.recordOwnershipTransfer, {
				mortgageId: deal.mortgageId.toString(),
				fromOwnerId: "fairlend",
				toOwnerId: deal.investorId.toString(),
				percentage,
				reference,
				dealId: args.dealId.toString(),
			});

			// Update pending transfer status
			await ctx.db.patch(pendingTransfer._id, {
				status: "approved", // Should already be approved, but keeping for consistency
				reviewedAt: Date.now(),
				reviewedBy: adminUserId,
				reviewNotes: "notes" in args.event ? args.event.notes : undefined,
			});

			// Mark deal as completed
			await ctx.db.patch(args.dealId, {
				completedAt: Date.now(),
			});

			logger.info("Ownership transfer executed and ledger scheduled", {
				dealId: args.dealId,
				investorId: deal.investorId,
				percentage,
				ledgerReference: reference,
			});
		}

		// REJECT_TRANSFER: Record rejection and handle escalation
		if (args.event.type === "REJECT_TRANSFER" && "reason" in args.event) {
			const pendingTransfer = await ctx.db
				.query("pending_ownership_transfers")
				.withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
				.filter((q) => q.eq(q.field("status"), "pending"))
				.first();

			if (pendingTransfer) {
				const newRejectionCount = (pendingTransfer.rejectionCount ?? 0) + 1;
				const needsEscalation = newRejectionCount >= 2;

				await ctx.db.patch(pendingTransfer._id, {
					status: "rejected",
					reviewedAt: Date.now(),
					reviewedBy: adminUserId,
					reviewNotes: args.event.reason,
					rejectionCount: newRejectionCount,
				});

				// Create alert for rejection
				await ctx.db.insert("alerts", {
					userId: deal.investorId,
					type: needsEscalation
						? "manual_resolution_required"
						: "ownership_transfer_rejected",
					severity: needsEscalation ? "warning" : "info",
					title: needsEscalation
						? "Manual Resolution Required"
						: "Transfer Rejected - Review Needed",
					message: needsEscalation
						? `Transfer rejected ${newRejectionCount} times. Manual resolution required.`
						: `Transfer rejected: ${args.event.reason}`,
					relatedDealId: args.dealId,
					read: false,
					createdAt: Date.now(),
				});

				logger.warn("Ownership transfer rejected", {
					dealId: args.dealId,
					rejectionCount: newRejectionCount,
					escalated: needsEscalation,
				});
			}
		}

		// Create alert for state change (generic)
		await ctx.db.insert("alerts", {
			userId: adminUserId,
			type: "deal_state_changed",
			severity: "info",
			title: "Deal State Changed",
			message: `Deal moved from ${previousState} to ${newState}`,
			relatedDealId: args.dealId,
			relatedListingId: deal.listingId,
			read: false,
			createdAt: Date.now(),
		});

		logger.info("Deal state transitioned", {
			dealId: args.dealId,
			fromState: previousState,
			toState: newState,
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
		if (!deal.stateMachineState) {
			throw new Error("Deal has no state machine state");
		}
		const machineState = JSON.parse(deal.stateMachineState);
		const cancelEvent: DealEventWithAdmin = {
			type: "CANCEL",
			adminId: adminUserId,
			reason: args.reason,
		};

		const actor = createActor(dealMachine, {
			input: machineState.context,
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
 * Complete a deal and transfer ownership from FairLend to investor.
 *
 * **DEPRECATED for new deals**: New deals should use the pending_ownership_review
 * workflow via `transitionDealState` with VERIFY_COMPLETE and CONFIRM_TRANSFER events.
 *
 * This legacy function is kept for backward compatibility with deals that:
 * 1. Were created before the ownership review workflow was implemented
 * 2. Have already reached "completed" state without going through review
 *
 * For new deals, use the state machine transitions:
 * 1. VERIFY_COMPLETE (pending_verification → pending_ownership_review)
 * 2. CONFIRM_TRANSFER (pending_ownership_review → completed) - executes transfer
 *
 * @deprecated Use transitionDealState with CONFIRM_TRANSFER for new deals
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

		// Check if deal is in the new pending_ownership_review state
		// If so, redirect to the proper workflow
		if (deal.currentState === "pending_ownership_review") {
			throw new Error(
				"This deal requires ownership review approval. Use the Approve/Reject buttons in the deal detail view, or call transitionDealState with CONFIRM_TRANSFER event."
			);
		}

		if (deal.currentState !== "completed") {
			throw new Error(
				"Deal must be in completed state before transferring ownership"
			);
		}

		if (deal.completedAt) {
			throw new Error("Ownership has already been transferred for this deal");
		}

		// Call ownership.createOwnershipInternal to transfer 100% from FairLend to investor
		// This will automatically reduce FairLend's ownership per the 100% invariant
		const percentage = deal.purchasePercentage ?? 100;
		if (!isLedgerSourceOfTruth()) {
			await createOwnershipInternal(ctx, {
				mortgageId: deal.mortgageId,
				ownerId: deal.investorId,
				ownershipPercentage: percentage,
			});
		}

		// Schedule ledger transfer (Formance)
		// CRITICAL: footguns.md #3 - external API calls must be scheduled actions
		const referenceTimestamp =
			deal.completedAt ?? deal.updatedAt ?? deal.createdAt;
		const reference = `legacy-complete:${args.dealId}:${deal.mortgageId}:${referenceTimestamp}`;
		await ctx.scheduler.runAfter(0, internal.ledger.recordOwnershipTransfer, {
			mortgageId: deal.mortgageId.toString(),
			fromOwnerId: "fairlend",
			toOwnerId: deal.investorId.toString(),
			percentage,
			reference,
			dealId: args.dealId.toString(),
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
			message:
				"Congratulations! Ownership has been transferred. You now own this mortgage.",
			relatedDealId: args.dealId,
			relatedListingId: deal.listingId,
			read: false,
			createdAt: Date.now(),
		});

		logger.info("Deal completed via legacy path (deprecated)", {
			dealId: args.dealId,
			mortgageId: deal.mortgageId,
			investorId: deal.investorId,
			percentage,
			ledgerReference: reference,
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

		if (
			deal.currentState !== "completed" &&
			deal.currentState !== "cancelled"
		) {
			throw new Error("Only completed or cancelled deals can be archived");
		}

		// Transition to archived state
		if (!deal.stateMachineState) {
			throw new Error("Deal has no state machine state");
		}
		const machineState = JSON.parse(deal.stateMachineState);
		const archiveEvent: DealEventWithAdmin = {
			type: "ARCHIVE",
			adminId: adminUserId,
		};

		const actor = createActor(dealMachine, {
			input: machineState.context,
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
	handler: async (_ctx, _args) => {
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
	handler: async (_ctx, _args) => {
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
	handler: async (_ctx, _args) => {
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
	handler: async (_ctx, _args) => {
		// TODO: Implement fund verification
		// - Check funds have cleared
		// - Verify no chargebacks
		// - Validate sufficient funds
		return true; // Pass-through for now
	},
});

/**
 * Check for deals in pending_docs state and transition if all docs signed
 * Called by cron job
 */
export const checkPendingDocsDeals = internalMutation({
	args: {},
	handler: async (ctx) => {
		// 1. Get all deals in pending_docs state
		const deals = await ctx.db
			.query("deals")
			.withIndex("by_current_state", (q) =>
				q.eq("currentState", "pending_docs")
			)
			.collect();

		if (deals.length === 0) return;

		logger.info("Checking pending_docs deals for completion", {
			count: deals.length,
		});

		for (const deal of deals) {
			// 2. Check if all documents are signed
			const documents = await ctx.db
				.query("deal_documents")
				.withIndex("by_deal", (q) => q.eq("dealId", deal._id))
				.collect();

			if (documents.length === 0) continue;

			const allSigned = documents.every((doc) => doc.status === "signed");

			if (allSigned) {
				logger.info(
					"All documents signed for deal, transitioning to pending_transfer",
					{ dealId: deal._id }
				);

				// 3. Transition state
				if (!deal.stateMachineState) {
					logger.error("Deal has no state machine state", { dealId: deal._id });
					continue;
				}

				const machineState = JSON.parse(deal.stateMachineState);
				const actor = createActor(dealMachine, {
					input: machineState.context, // XState v5 requires input even with snapshot
					snapshot: machineState,
				});

				// Send DOCUMENTS_COMPLETE event (system-triggered, use investor as triggeredBy)
				const event: DealEventWithAdmin = {
					type: "DOCUMENTS_COMPLETE",
					adminId: deal.investorId,
					notes:
						"Automatically transitioned by system after all documents signed",
				};

				actor.start();
				actor.send(event);

				const newSnapshot = actor.getSnapshot();
				const newContext = newSnapshot.context;

				if (newContext.currentState !== "pending_transfer") {
					logger.warn("Failed to transition to pending_transfer", {
						dealId: deal._id,
						currentState: newContext.currentState,
					});
					actor.stop();
					continue;
				}

				await ctx.db.patch(deal._id, {
					stateMachineState: JSON.stringify(newSnapshot),
					currentState: newContext.currentState,
					updatedAt: Date.now(),
					stateHistory: newContext.stateHistory,
				});

				actor.stop();

				// Create alert for investor
				await ctx.db.insert("alerts", {
					userId: deal.investorId,
					type: "deal_state_changed",
					severity: "info",
					title: "Documents Signed",
					message:
						"All documents have been signed. Please proceed with fund transfer.",
					relatedDealId: deal._id,
					relatedListingId: deal.listingId,
					read: false,
					createdAt: Date.now(),
				});
			}
		}
	},
});

/**
 * Internal query to get deal for action validation
 */
export const getDealInternal = internalQuery({
	args: { dealId: v.id("deals") },
	handler: async (ctx, args) => await ctx.db.get(args.dealId),
});

/**
 * Generate upload URL for fund transfer proof
 * Only accessible by investor or their lawyer
 */
export const generateFundTransferUploadUrl = investorLawyerAdminAction({
	args: { dealId: v.id("deals") },
	handler: async (ctx, args) => {
		const { role, subject, email } = ctx as typeof ctx & AuthContextFields;
		if (!subject) {
			throw new Error("Not authenticated");
		}

		// Check if user is authorized for this deal
		const deal = await ctx.runQuery(internal.deals.getDealInternal, {
			dealId: args.dealId,
		});
		if (!deal) throw new Error("Deal not found");

		// Check permissions
		// Resolve user ID from subject (use runQuery since actions can't access db directly)
		const user = await ctx.runQuery(internal.users.getUserByIdpId, {
			idpId: subject,
		});

		const isInvestor = user && deal.investorId === user._id;
		const isLawyer =
			typeof email === "string" &&
			typeof deal.lawyerEmail === "string" &&
			deal.lawyerEmail.toLowerCase() === email.toLowerCase();
		const isAdmin = role === "admin";

		if (!(isInvestor || isLawyer || isAdmin)) {
			throw new Error(
				"Unauthorized: Only investor or their lawyer can upload fund transfer proof"
			);
		}

		return await ctx.storage.generateUploadUrl();
	},
});

/**
 * Record fund transfer upload metadata
 * Validates file type and updates deal history
 */
export const recordFundTransferUpload = investorLawyerAdminMutation({
	args: {
		dealId: v.id("deals"),
		storageId: v.id("_storage"),
		fileName: v.string(),
		fileType: v.string(),
	},
	handler: async (ctx, args) => {
		const { role, email, subject } = ctx as typeof ctx & AuthContextFields;
		if (!subject) {
			throw new Error("Not authenticated");
		}

		const deal = await ctx.db.get(args.dealId);
		if (!deal) {
			throw new Error("Deal not found");
		}
		if (deal.currentState !== "pending_transfer") {
			throw new Error("Uploads only allowed in pending_transfer state");
		}

		// 1. Validate permissions
		// Resolve user ID from subject
		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", subject))
			.unique();

		const isInvestor = user && deal.investorId === user._id;
		const isLawyer =
			typeof email === "string" &&
			typeof deal.lawyerEmail === "string" &&
			deal.lawyerEmail.toLowerCase() === email.toLowerCase();
		const isAdmin = role === "admin";

		// Allow any authenticated investor, lawyer, or admin regardless of which role
		// the user logged in with. Previously this checked both the role and the
		// participant match, which prevented admins from uploading unless they were
		// also the investor.
		if (!(isInvestor || isLawyer || isAdmin)) {
			throw new Error("Unauthorized");
		}

		// 2. Validate file type
		const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
		if (!allowedTypes.includes(args.fileType)) {
			throw new Error(
				"Invalid file type. Only PDF, PNG, and JPEG are allowed."
			);
		}

		// 3. Handle history
		const currentUpload = deal.currentUpload;
		const newUpload = {
			storageId: args.storageId,
			uploadedBy: subject, // or email if lawyer? subject is safer if they have account
			uploadedAt: Date.now(),
			fileName: args.fileName,
			fileType: args.fileType,
		};

		const uploadHistory = deal.uploadHistory || [];
		if (currentUpload) {
			uploadHistory.push(currentUpload);
		}

		// 4. Update deal
		await ctx.db.patch(args.dealId, {
			currentUpload: newUpload,
			uploadHistory,
			updatedAt: Date.now(),
		});

		logger.info("Fund transfer proof uploaded", {
			dealId: args.dealId,
			uploadedBy: subject,
		});
	},
});

/**
 * Confirm lawyer representation
 * Called by the lawyer to confirm they represent the investor
 */
export const confirmLawyerRepresentation = authenticatedMutation({
	args: { dealId: v.id("deals") },
	handler: async (ctx, args) => {
		const { email } = ctx as typeof ctx & AuthContextFields;
		const deal = await ctx.db.get(args.dealId);
		if (!deal) throw new Error("Deal not found");

		// Validate that the caller is the assigned lawyer
		if (deal.lawyerEmail !== email) {
			throw new Error(
				"Unauthorized: You are not the assigned lawyer for this deal"
			);
		}

		// Get user ID for the event
		const userId = await getUserFromIdentity(ctx, { createIfMissing: true });
		if (!userId) throw new Error("User not found");

		// Update deal state
		if (!deal.stateMachineState) {
			throw new Error("Deal has no state machine state");
		}

		const machineState = JSON.parse(deal.stateMachineState);
		const actor = createActor(dealMachine, {
			input: machineState.context,
			snapshot: machineState,
		});

		const event: DealEventWithAdmin = {
			type: "CONFIRM_LAWYER",
			adminId: userId, // Lawyer acts as admin/user here for the transition
			notes: "Lawyer confirmed representation",
		};

		actor.start();
		actor.send(event);

		const newSnapshot = actor.getSnapshot();
		const newContext = newSnapshot.context;

		await ctx.db.patch(args.dealId, {
			stateMachineState: JSON.stringify(newSnapshot),
			currentState: newContext.currentState,
			updatedAt: Date.now(),
			stateHistory: newContext.stateHistory,
			validationChecks: {
				...deal.validationChecks,
				lawyerConfirmed: true,
				docsComplete: deal.validationChecks?.docsComplete ?? false,
				fundsReceived: deal.validationChecks?.fundsReceived ?? false,
				fundsVerified: deal.validationChecks?.fundsVerified ?? false,
			},
		});

		actor.stop();

		logger.info("Lawyer confirmed representation", {
			dealId: args.dealId,
			lawyerEmail: email,
		});
	},
});

/**
 * Resend lawyer invite
 * Called by admin or investor to resend the invitation email
 */
export const resendLawyerInvite = authenticatedMutation({
	args: { dealId: v.id("deals") },
	handler: async (ctx, args) => {
		const { role, subject } = ctx as typeof ctx & AuthContextFields;
		const deal = await ctx.db.get(args.dealId);
		if (!deal) throw new Error("Deal not found");

		// Validate permissions
		const isInvestor = deal.investorId === subject;
		const isAdmin = role === "admin";

		if (!(isInvestor || isAdmin)) {
			throw new Error("Unauthorized");
		}

		// TODO: Integrate with email service (Resend) to actually send the email
		// For now, we'll just log it and create an alert for the admin
		logger.info("Resending lawyer invite", {
			dealId: args.dealId,
			lawyerEmail: deal.lawyerEmail,
			requestedBy: subject,
		});

		return true;
	},
});

/**
 * Update lawyer email
 * Called by admin or investor to correct the lawyer's email address
 */
export const updateLawyerEmail = authenticatedMutation({
	args: {
		dealId: v.id("deals"),
		newEmail: v.string(),
	},
	handler: async (ctx, args) => {
		const { role, subject } = ctx as typeof ctx & AuthContextFields;
		const deal = await ctx.db.get(args.dealId);
		if (!deal) throw new Error("Deal not found");

		// Validate permissions
		const isInvestor = deal.investorId === subject;
		const isAdmin = role === "admin";

		if (!(isInvestor || isAdmin)) {
			throw new Error("Unauthorized");
		}

		if (
			deal.currentState !== "pending_lawyer" &&
			deal.currentState !== "locked"
		) {
			throw new Error("Cannot update lawyer email in current state");
		}

		const oldEmail = deal.lawyerEmail;

		await ctx.db.patch(args.dealId, {
			lawyerEmail: args.newEmail,
			updatedAt: Date.now(),
			// Reset confirmation if it was somehow set (though state check prevents this mostly)
			validationChecks: {
				...deal.validationChecks,
				lawyerConfirmed: false,
				docsComplete: deal.validationChecks?.docsComplete ?? false,
				fundsReceived: deal.validationChecks?.fundsReceived ?? false,
				fundsVerified: deal.validationChecks?.fundsVerified ?? false,
			},
		});

		logger.info("Lawyer email updated", {
			dealId: args.dealId,
			oldEmail,
			newEmail: args.newEmail,
			updatedBy: subject,
		});

		// TODO: Send revocation email to old address and new invite to new address
	},
});

/**
 * Select new lawyer
 * Called by admin or investor to replace the lawyer entirely
 */
export const selectNewLawyer = authenticatedMutation({
	args: {
		dealId: v.id("deals"),
		name: v.string(),
		email: v.string(),
		lsoNumber: v.string(),
	},
	handler: async (ctx, args) => {
		const { role, subject } = ctx as typeof ctx & AuthContextFields;
		const deal = await ctx.db.get(args.dealId);
		if (!deal) throw new Error("Deal not found");

		// Validate permissions
		const isInvestor = deal.investorId === subject;
		const isAdmin = role === "admin";

		if (!(isInvestor || isAdmin)) {
			throw new Error("Unauthorized");
		}

		if (
			deal.currentState !== "pending_lawyer" &&
			deal.currentState !== "locked"
		) {
			throw new Error("Cannot change lawyer in current state");
		}

		await ctx.db.patch(args.dealId, {
			lawyerName: args.name,
			lawyerEmail: args.email,
			lawyerLSONumber: args.lsoNumber,
			updatedAt: Date.now(),
			validationChecks: {
				...deal.validationChecks,
				lawyerConfirmed: false,
				docsComplete: deal.validationChecks?.docsComplete ?? false,
				fundsReceived: deal.validationChecks?.fundsReceived ?? false,
				fundsVerified: deal.validationChecks?.fundsVerified ?? false,
			},
		});

		logger.info("New lawyer selected", {
			dealId: args.dealId,
			newLawyerEmail: args.email,
			updatedBy: subject,
		});
	},
});

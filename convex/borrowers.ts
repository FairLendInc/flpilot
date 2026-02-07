/**
 * Borrower profile management
 * Minimal borrower data with Rotessa payment processor integration
 */

import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, internalQuery } from "./_generated/server";
import {
	authenticatedMutation,
	authenticatedQuery,
} from "./lib/authorizedFunctions";
import {
	type AuthorizedMutationCtx,
	type AuthorizedQueryCtx,
	createAuthorizedMutation,
	createAuthorizedQuery,
} from "./lib/server";
import { paginateByCreation } from "./lib/webhookPagination";

/**
 * Schema for borrower document (includes Convex system fields)
 */
const borrowerSchema = v.object({
	_id: v.id("borrowers"),
	_creationTime: v.number(),
	name: v.string(),
	email: v.string(),
	phone: v.optional(v.string()),
	rotessaCustomerId: v.string(),
});

/**
 * Get a borrower by ID
 */
export const getBorrower = authenticatedQuery({
	args: { id: v.id("borrowers") },
	returns: v.union(borrowerSchema, v.null()),
	handler: async (ctx, args) => await ctx.db.get(args.id),
});

/**
 * Get borrower by Rotessa customer ID (for payment reconciliation)
 */
export const getBorrowerByRotessaId = authenticatedQuery({
	args: { rotessaCustomerId: v.string() },
	returns: v.union(borrowerSchema, v.null()),
	handler: async (ctx, args) =>
		await ctx.db
			.query("borrowers")
			.withIndex("by_rotessa_customer_id", (q) =>
				q.eq("rotessaCustomerId", args.rotessaCustomerId)
			)
			.first(),
});

/**
 * List all borrowers (paginated for admin)
 */
export const listBorrowers = authenticatedQuery({
	args: {},
	returns: v.array(borrowerSchema),
	handler: async (ctx) => await ctx.db.query("borrowers").collect(),
});

/**
 * Search borrowers by email
 */
export const searchBorrowersByEmail = authenticatedQuery({
	args: { email: v.string() },
	returns: v.array(borrowerSchema),
	handler: async (ctx, args) =>
		await ctx.db
			.query("borrowers")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.collect(),
});

/**
 * Create a new borrower
 */
export const createBorrower = authenticatedMutation({
	args: {
		name: v.string(),
		email: v.string(),
		rotessaCustomerId: v.string(),
	},
	returns: v.id("borrowers"),
	handler: async (ctx, args) => {
		// Validate email format
		if (!args.email.includes("@")) {
			throw new Error("Invalid email format");
		}

		// Check for duplicate Rotessa customer ID
		const existing = await ctx.db
			.query("borrowers")
			.withIndex("by_rotessa_customer_id", (q) =>
				q.eq("rotessaCustomerId", args.rotessaCustomerId)
			)
			.first();

		if (existing) {
			throw new Error(
				`Borrower with Rotessa customer ID ${args.rotessaCustomerId} already exists`
			);
		}

		// Create borrower
		return await ctx.db.insert("borrowers", {
			name: args.name,
			email: args.email,
			rotessaCustomerId: args.rotessaCustomerId,
		});
	},
});

/**
 * Update borrower profile (name and email only, rotessaCustomerId is immutable)
 */
export const updateBorrower = authenticatedMutation({
	args: {
		id: v.id("borrowers"),
		name: v.optional(v.string()),
		email: v.optional(v.string()),
	},
	returns: v.id("borrowers"),
	handler: async (ctx, args) => {
		const { id, ...updates } = args;

		// Validate email format if provided
		if (updates.email && !updates.email.includes("@")) {
			throw new Error("Invalid email format");
		}

		await ctx.db.patch(id, updates);
		return id;
	},
});

const borrowerListResultValidator = v.object({
	borrowers: v.array(borrowerSchema),
	nextCursor: v.optional(v.string()),
	hasMore: v.boolean(),
	total: v.number(),
});

const normalizeContainsValue = (value?: string | null) =>
	value?.trim().toLowerCase() ?? undefined;

const paginateBorrowers = (
	items: Doc<"borrowers">[],
	limit: number,
	cursor?: string | null
) => {
	const paginated = paginateByCreation(items, limit, cursor);
	return {
		borrowers: paginated.items,
		nextCursor: paginated.nextCursor,
		hasMore: paginated.hasMore,
		total: paginated.total,
	};
};

/**
 * Internal: Create a borrower with idempotency by rotessaCustomerId.
 */
export const createBorrowerInternal = internalMutation({
	args: {
		name: v.string(),
		email: v.string(),
		phone: v.optional(v.string()),
		rotessaCustomerId: v.string(),
	},
	returns: v.object({
		borrowerId: v.id("borrowers"),
		created: v.boolean(),
	}),
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("borrowers")
			.withIndex("by_rotessa_customer_id", (q) =>
				q.eq("rotessaCustomerId", args.rotessaCustomerId)
			)
			.first();

		if (existing) {
			return { borrowerId: existing._id, created: false };
		}

		const borrowerId = await ctx.db.insert("borrowers", {
			name: args.name,
			email: args.email,
			phone: args.phone,
			rotessaCustomerId: args.rotessaCustomerId,
		});

		return { borrowerId, created: true };
	},
});

/**
 * Internal: Get borrower by borrowerId, rotessaCustomerId, or email.
 */
export const getBorrowerInternal = internalQuery({
	args: {
		borrowerId: v.optional(v.id("borrowers")),
		rotessaCustomerId: v.optional(v.string()),
		email: v.optional(v.string()),
	},
	returns: v.union(borrowerSchema, v.null()),
	handler: async (ctx, args) => {
		if (args.borrowerId) {
			return await ctx.db.get(args.borrowerId);
		}
		if (args.rotessaCustomerId) {
			const rotessaId = args.rotessaCustomerId;
			return await ctx.db
				.query("borrowers")
				.withIndex("by_rotessa_customer_id", (q) =>
					q.eq("rotessaCustomerId", rotessaId)
				)
				.first();
		}
		if (args.email) {
			const email = args.email;
			return await ctx.db
				.query("borrowers")
				.withIndex("by_email", (q) => q.eq("email", email))
				.first();
		}
		return null;
	},
});

/**
 * Internal: List borrowers with optional filters and cursor pagination.
 */
export const listBorrowersInternal = internalQuery({
	args: {
		emailContains: v.optional(v.string()),
		nameContains: v.optional(v.string()),
		createdAfter: v.optional(v.string()),
		createdBefore: v.optional(v.string()),
		limit: v.optional(v.number()),
		cursor: v.optional(v.string()),
	},
	returns: borrowerListResultValidator,
	handler: async (ctx, args) => {
		const emailContains = normalizeContainsValue(args.emailContains);
		const nameContains = normalizeContainsValue(args.nameContains);
		const createdAfter = args.createdAfter
			? Date.parse(args.createdAfter)
			: null;
		const createdBefore = args.createdBefore
			? Date.parse(args.createdBefore)
			: null;

		const borrowers = await ctx.db.query("borrowers").collect();
		const filtered = borrowers.filter((borrower) => {
			if (
				emailContains &&
				!borrower.email.toLowerCase().includes(emailContains)
			) {
				return false;
			}
			if (nameContains && !borrower.name.toLowerCase().includes(nameContains)) {
				return false;
			}
			if (createdAfter && borrower._creationTime <= createdAfter) {
				return false;
			}
			if (createdBefore && borrower._creationTime >= createdBefore) {
				return false;
			}
			return true;
		});

		const limit = Math.min(Math.max(args.limit ?? 100, 1), 500);
		return paginateBorrowers(filtered, limit, args.cursor);
	},
});

/**
 * Internal: Update borrower fields by borrowerId or rotessaCustomerId.
 */
export const updateBorrowerInternal = internalMutation({
	args: {
		borrowerId: v.optional(v.id("borrowers")),
		rotessaCustomerId: v.optional(v.string()),
		name: v.optional(v.string()),
		email: v.optional(v.string()),
		phone: v.optional(v.string()),
	},
	returns: v.object({ borrowerId: v.id("borrowers") }),
	handler: async (ctx, args) => {
		let borrower: Doc<"borrowers"> | null = null;
		if (args.borrowerId) {
			borrower = await ctx.db.get(args.borrowerId);
		} else if (args.rotessaCustomerId) {
			const rotessaId = args.rotessaCustomerId;
			borrower = await ctx.db
				.query("borrowers")
				.withIndex("by_rotessa_customer_id", (q) =>
					q.eq("rotessaCustomerId", rotessaId)
				)
				.first();
		}

		if (!borrower) {
			throw new Error("borrower_not_found");
		}

		const updates: Partial<Doc<"borrowers">> = {};
		if (args.name !== undefined) {
			updates.name = args.name;
		}
		if (args.email !== undefined) {
			updates.email = args.email;
		}
		if (args.phone !== undefined) {
			updates.phone = args.phone;
		}

		await ctx.db.patch(borrower._id, updates);
		return { borrowerId: borrower._id };
	},
});

/**
 * Internal: Delete borrower, optionally cascading mortgages when force is true.
 */
export const deleteBorrowerInternal = internalMutation({
	args: {
		borrowerId: v.optional(v.id("borrowers")),
		rotessaCustomerId: v.optional(v.string()),
		force: v.optional(v.boolean()),
	},
	returns: v.object({
		borrowerId: v.id("borrowers"),
		deleted: v.boolean(),
		mortgageCount: v.optional(v.number()),
	}),
	handler: async (ctx, args) => {
		let borrower: Doc<"borrowers"> | null = null;
		if (args.borrowerId) {
			borrower = await ctx.db.get(args.borrowerId);
		} else if (args.rotessaCustomerId) {
			const rotessaId = args.rotessaCustomerId;
			borrower = await ctx.db
				.query("borrowers")
				.withIndex("by_rotessa_customer_id", (q) =>
					q.eq("rotessaCustomerId", rotessaId)
				)
				.first();
		}

		if (!borrower) {
			throw new Error("borrower_not_found");
		}

		const mortgages = await ctx.db
			.query("mortgages")
			.withIndex("by_borrower", (q) => q.eq("borrowerId", borrower._id))
			.collect();

		if (mortgages.length > 0 && !args.force) {
			return {
				borrowerId: borrower._id,
				deleted: false,
				mortgageCount: mortgages.length,
			};
		}

		if (mortgages.length > 0 && args.force) {
			for (const mortgage of mortgages) {
				await ctx.runMutation(internal.mortgages.deleteMortgageInternal, {
					mortgageId: mortgage._id as Id<"mortgages">,
					force: true,
				});
			}
		}

		await ctx.db.delete(borrower._id);
		return { borrowerId: borrower._id, deleted: true };
	},
});

// ============================================================================
// Borrower-User Linking (Task 2.5)
// ============================================================================

const _authorizedMutation = createAuthorizedMutation(["any"]);
const authorizedQuery = createAuthorizedQuery(["any"]);
const adminMutation = createAuthorizedMutation(["admin"]);

/**
 * Enhanced borrower schema validator (includes new fields)
 */
const enhancedBorrowerSchema = v.object({
	_id: v.id("borrowers"),
	_creationTime: v.number(),
	name: v.string(),
	email: v.string(),
	phone: v.optional(v.string()),
	rotessaCustomerId: v.string(),
	userId: v.optional(v.id("users")),
	address: v.optional(
		v.object({
			street: v.string(),
			city: v.string(),
			province: v.string(),
			postalCode: v.string(),
			country: v.string(),
		})
	),
	rotessaCustomIdentifier: v.optional(v.string()),
	idVerificationStatus: v.optional(
		v.union(
			v.literal("not_started"),
			v.literal("pending"),
			v.literal("verified"),
			v.literal("failed"),
			v.literal("skipped")
		)
	),
	kycAmlStatus: v.optional(
		v.union(
			v.literal("not_started"),
			v.literal("pending"),
			v.literal("passed"),
			v.literal("failed"),
			v.literal("requires_review"),
			v.literal("skipped")
		)
	),
	onboardingJourneyId: v.optional(v.id("onboarding_journeys")),
	onboardedBy: v.optional(
		v.union(v.literal("broker"), v.literal("admin"), v.literal("self"))
	),
	onboardedByUserId: v.optional(v.id("users")),
	onboardedAt: v.optional(v.string()),
	status: v.optional(
		v.union(
			v.literal("pending_approval"),
			v.literal("active"),
			v.literal("inactive"),
			v.literal("suspended")
		)
	),
	rotessaLastSyncAt: v.optional(v.number()),
	rotessaSyncError: v.optional(v.string()),
});

/**
 * Get borrower profile for the logged-in user
 */
export const getBorrowerByUserId = authorizedQuery({
	args: {},
	returns: v.union(enhancedBorrowerSchema, v.null()),
	handler: async (ctx: AuthorizedQueryCtx) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}
		const userId = subject as Id<"users">;

		return await ctx.db
			.query("borrowers")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();
	},
});

/**
 * Link an existing borrower profile to a user account
 * Used when existing Rotessa borrowers need platform access
 */
export const linkBorrowerToUser = adminMutation({
	args: {
		borrowerId: v.id("borrowers"),
		userId: v.id("users"),
	},
	returns: v.id("borrowers"),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const borrower = await ctx.db.get(args.borrowerId);
		if (!borrower) {
			throw new Error("Borrower not found");
		}

		// Check if borrower is already linked to a user
		if (borrower.userId) {
			if (borrower.userId === args.userId) {
				// Already linked to same user, return success
				return args.borrowerId;
			}
			throw new Error("Borrower is already linked to a different user");
		}

		// Check if user exists
		const user = await ctx.db.get(args.userId);
		if (!user) {
			throw new Error("User not found");
		}

		// Check if user is already linked to another borrower
		const existingBorrower = await ctx.db
			.query("borrowers")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.first();

		if (existingBorrower) {
			throw new Error("User is already linked to a borrower profile");
		}

		// Link borrower to user
		await ctx.db.patch(args.borrowerId, {
			userId: args.userId,
		});

		return args.borrowerId;
	},
});

/**
 * Create a new borrower with user account link
 * Used when creating a borrower for an existing platform user
 */
export const createBorrowerWithUser = adminMutation({
	args: {
		userId: v.id("users"),
		name: v.string(),
		email: v.string(),
		phone: v.optional(v.string()),
		rotessaCustomerId: v.string(),
		rotessaCustomIdentifier: v.optional(v.string()),
		address: v.optional(
			v.object({
				street: v.string(),
				city: v.string(),
				province: v.string(),
				postalCode: v.string(),
				country: v.string(),
			})
		),
		onboardedBy: v.optional(
			v.union(v.literal("broker"), v.literal("admin"), v.literal("self"))
		),
	},
	returns: v.id("borrowers"),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}
		const adminUserId = subject as Id<"users">;

		// Check if user exists
		const user = await ctx.db.get(args.userId);
		if (!user) {
			throw new Error("User not found");
		}

		// Check if user is already linked to a borrower
		const existingBorrower = await ctx.db
			.query("borrowers")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.first();

		if (existingBorrower) {
			throw new Error("User already has a borrower profile");
		}

		// Check for duplicate Rotessa customer ID
		const existingRotessa = await ctx.db
			.query("borrowers")
			.withIndex("by_rotessa_customer_id", (q) =>
				q.eq("rotessaCustomerId", args.rotessaCustomerId)
			)
			.first();

		if (existingRotessa) {
			throw new Error(
				`Borrower with Rotessa customer ID ${args.rotessaCustomerId} already exists`
			);
		}

		// Create borrower linked to user
		return await ctx.db.insert("borrowers", {
			userId: args.userId,
			name: args.name,
			email: args.email,
			phone: args.phone,
			rotessaCustomerId: args.rotessaCustomerId,
			rotessaCustomIdentifier: args.rotessaCustomIdentifier,
			address: args.address,
			onboardedBy: args.onboardedBy ?? "admin",
			onboardedByUserId: adminUserId,
			onboardedAt: new Date().toISOString(),
			status: "active",
		});
	},
});

/**
 * Get borrower by user ID (internal query)
 */
export const getBorrowerByUserIdInternal = internalQuery({
	args: { userId: v.id("users") },
	returns: v.union(enhancedBorrowerSchema, v.null()),
	handler: async (ctx, args) =>
		await ctx.db
			.query("borrowers")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.first(),
});

// ============================================================================
// Rotessa Admin Integration (internal functions)
// ============================================================================

/**
 * Get borrower by Rotessa customer ID (internal - for actions)
 */
export const getBorrowerByRotessaIdInternal = internalQuery({
	args: { rotessaCustomerId: v.string() },
	returns: v.union(enhancedBorrowerSchema, v.null()),
	handler: async (ctx, args) =>
		await ctx.db
			.query("borrowers")
			.withIndex("by_rotessa_customer_id", (q) =>
				q.eq("rotessaCustomerId", args.rotessaCustomerId)
			)
			.first(),
});

/**
 * Get borrower by ID (internal - for verification)
 */
export const getBorrowerByIdInternal = internalQuery({
	args: { borrowerId: v.id("borrowers") },
	returns: v.union(enhancedBorrowerSchema, v.null()),
	handler: async (ctx, args) => await ctx.db.get(args.borrowerId),
});

/**
 * Update borrower from Rotessa customer data (internal - for sync)
 */
export const updateBorrowerFromRotessa = internalMutation({
	args: {
		borrowerId: v.id("borrowers"),
		name: v.string(),
		email: v.string(),
		phone: v.optional(v.string()),
	},
	returns: v.id("borrowers"),
	handler: async (ctx, args) => {
		const { borrowerId, ...updates } = args;

		// Filter out undefined values
		const cleanUpdates: {
			name: string;
			email: string;
			phone?: string;
			rotessaLastSyncAt: number;
		} = {
			name: updates.name,
			email: updates.email,
			rotessaLastSyncAt: Date.now(),
		};
		if (updates.phone) {
			cleanUpdates.phone = updates.phone;
		}

		await ctx.db.patch(borrowerId, cleanUpdates);
		return borrowerId;
	},
});

/**
 * Create borrower from Rotessa customer data (internal - for sync)
 */
export const createBorrowerFromRotessaInternal = internalMutation({
	args: {
		rotessaCustomerId: v.string(),
		name: v.string(),
		email: v.string(),
		phone: v.optional(v.string()),
	},
	returns: v.id("borrowers"),
	handler: async (ctx, args) => {
		// Check for existing borrower with this Rotessa ID
		const existing = await ctx.db
			.query("borrowers")
			.withIndex("by_rotessa_customer_id", (q) =>
				q.eq("rotessaCustomerId", args.rotessaCustomerId)
			)
			.first();

		if (existing) {
			throw new Error(
				`Borrower with Rotessa customer ID ${args.rotessaCustomerId} already exists`
			);
		}

		return await ctx.db.insert("borrowers", {
			rotessaCustomerId: args.rotessaCustomerId,
			name: args.name,
			email: args.email,
			phone: args.phone,
			status: "pending_approval",
			rotessaLastSyncAt: Date.now(),
		});
	},
});

/**
 * Link WorkOS user to borrower (internal - for WorkOS provisioning)
 * Creates or finds user record and links to borrower
 */
export const linkUserToBorrowerInternal = internalMutation({
	args: {
		borrowerId: v.id("borrowers"),
		userId: v.string(), // WorkOS user ID (idp_id)
	},
	returns: v.object({
		success: v.boolean(),
		convexUserId: v.optional(v.id("users")),
	}),
	handler: async (ctx, args) => {
		const borrower = await ctx.db.get(args.borrowerId);
		if (!borrower) {
			throw new Error("Borrower not found");
		}

		// Check if user record already exists with this WorkOS ID
		let user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", args.userId))
			.first();

		// If no user exists, create one from borrower info
		if (!user) {
			const userId = await ctx.db.insert("users", {
				idp_id: args.userId,
				email: borrower.email,
				email_verified: false,
				first_name: borrower.name.split(" ")[0],
				last_name: borrower.name.split(" ").slice(1).join(" ") || undefined,
				phone: borrower.phone,
				created_at: new Date().toISOString(),
			});
			user = await ctx.db.get(userId);
		}

		if (!user) {
			throw new Error("Failed to create or find user record");
		}

		// Link borrower to the user record
		await ctx.db.patch(args.borrowerId, {
			userId: user._id,
			status: "active", // Activate borrower now that they have an account
		});

		return { success: true, convexUserId: user._id };
	},
});

/**
 * Link borrower to user (internal mutation)
 */
export const linkBorrowerToUserInternal = internalMutation({
	args: {
		borrowerId: v.id("borrowers"),
		userId: v.id("users"),
	},
	returns: v.object({ success: v.boolean() }),
	handler: async (ctx, args) => {
		const borrower = await ctx.db.get(args.borrowerId);
		if (!borrower) {
			throw new Error("Borrower not found");
		}

		await ctx.db.patch(args.borrowerId, {
			userId: args.userId,
		});

		return { success: true };
	},
});

// ============================================================================
// Borrower Dashboard Queries (Task 6.1)
// ============================================================================

/**
 * Mortgage summary for dashboard
 */
const mortgageSummarySchema = v.object({
	_id: v.id("mortgages"),
	propertyAddress: v.string(),
	principal: v.number(),
	interestRate: v.number(),
	monthlyPayment: v.number(),
	termMonths: v.number(),
	remainingMonths: v.number(),
	status: v.union(
		v.literal("active"),
		v.literal("renewed"),
		v.literal("closed"),
		v.literal("defaulted")
	),
});

/**
 * Payment summary for dashboard
 */
const paymentSummarySchema = v.object({
	_id: v.id("payments"),
	mortgageId: v.id("mortgages"),
	amount: v.number(),
	dueDate: v.string(),
	paidDate: v.optional(v.string()),
	status: v.union(
		v.literal("pending"),
		v.literal("processing"),
		v.literal("cleared"),
		v.literal("failed"),
		v.literal("nsf")
	),
	propertyAddress: v.string(),
});

/**
 * Dashboard summary stats
 */
const dashboardStatsSchema = v.object({
	activeLoans: v.number(),
	totalPrincipal: v.number(),
	nextPayment: v.union(
		v.null(),
		v.object({
			amount: v.number(),
			dueDate: v.string(),
			daysUntilDue: v.number(),
		})
	),
	totalPaidThisYear: v.number(),
});

/**
 * Get borrower dashboard data
 * Returns summary stats, mortgages, and recent payments
 */
export const getBorrowerDashboard = authorizedQuery({
	args: {},
	returns: v.object({
		stats: dashboardStatsSchema,
		mortgages: v.array(mortgageSummarySchema),
	}),
	handler: async (ctx: AuthorizedQueryCtx) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}
		const userId = subject as Id<"users">;

		// Get borrower profile
		const borrower = await ctx.db
			.query("borrowers")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();

		if (!borrower) {
			return {
				stats: {
					activeLoans: 0,
					totalPrincipal: 0,
					nextPayment: null,
					totalPaidThisYear: 0,
				},
				mortgages: [],
			};
		}

		// Get all mortgages for this borrower
		const mortgages = await ctx.db
			.query("mortgages")
			.withIndex("by_borrower", (q) => q.eq("borrowerId", borrower._id))
			.collect();

		// Calculate stats
		const activeMortgages = mortgages.filter((m) => m.status === "active");
		const totalPrincipal = activeMortgages.reduce(
			(sum, m) => sum + m.loanAmount,
			0
		);

		// Get payments for this year
		const yearStart = new Date();
		yearStart.setMonth(0, 1);
		yearStart.setHours(0, 0, 0, 0);
		const yearStartStr = yearStart.toISOString().split("T")[0];

		const allPayments = await ctx.db
			.query("payments")
			.withIndex("by_borrower", (q) => q.eq("borrowerId", borrower._id))
			.collect();

		const clearedPaymentsThisYear = allPayments.filter(
			(p) => p.status === "cleared" && p.processDate >= yearStartStr
		);
		const totalPaidThisYear = clearedPaymentsThisYear.reduce(
			(sum, p) => sum + p.amount,
			0
		);

		// Find next upcoming payment
		const today = new Date().toISOString().split("T")[0];
		const upcomingPayments = allPayments
			.filter((p) => p.status === "pending" && p.processDate >= today)
			.sort((a, b) => a.processDate.localeCompare(b.processDate));

		const nextPayment =
			upcomingPayments.length > 0
				? {
						amount: upcomingPayments[0]?.amount,
						dueDate: upcomingPayments[0]?.processDate,
						daysUntilDue: Math.ceil(
							(new Date(upcomingPayments[0]?.processDate).getTime() -
								Date.now()) /
								(1000 * 60 * 60 * 24)
						),
					}
				: null;

		// Build mortgage summaries
		const mortgageSummaries = await Promise.all(
			activeMortgages.map(async (m) => {
				// Calculate monthly payment (interest only)
				const monthlyPayment = (m.loanAmount * (m.interestRate / 100)) / 12;

				// Calculate term months and remaining
				const originationDate = new Date(m.originationDate);
				const maturityDate = new Date(m.maturityDate);
				const termMonths = Math.round(
					(maturityDate.getTime() - originationDate.getTime()) /
						(1000 * 60 * 60 * 24 * 30)
				);
				const remainingMonths = Math.max(
					0,
					Math.round(
						(maturityDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
					)
				);

				// Format address
				const propertyAddress = `${m.address.street}, ${m.address.city}`;

				return {
					_id: m._id,
					propertyAddress,
					principal: m.loanAmount,
					interestRate: m.interestRate,
					monthlyPayment,
					termMonths,
					remainingMonths,
					status: m.status,
				};
			})
		);

		return {
			stats: {
				activeLoans: activeMortgages.length,
				totalPrincipal,
				nextPayment,
				totalPaidThisYear,
			},
			mortgages: mortgageSummaries,
		};
	},
});

/**
 * Get payment history for borrower
 * Returns paginated payment history with filtering
 */
export const getBorrowerPayments = authorizedQuery({
	args: {
		limit: v.optional(v.number()),
		status: v.optional(
			v.union(
				v.literal("pending"),
				v.literal("processing"),
				v.literal("cleared"),
				v.literal("failed"),
				v.literal("nsf")
			)
		),
		mortgageId: v.optional(v.id("mortgages")),
	},
	returns: v.array(paymentSummarySchema),
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}
		const userId = subject as Id<"users">;

		// Get borrower profile
		const borrower = await ctx.db
			.query("borrowers")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();

		if (!borrower) {
			return [];
		}

		// Get payments
		let payments = await ctx.db
			.query("payments")
			.withIndex("by_borrower", (q) => q.eq("borrowerId", borrower._id))
			.collect();

		// Apply filters
		if (args.status) {
			payments = payments.filter((p) => p.status === args.status);
		}
		if (args.mortgageId) {
			payments = payments.filter((p) => p.mortgageId === args.mortgageId);
		}

		// Sort by process date descending (most recent first)
		payments = payments.sort((a, b) =>
			b.processDate.localeCompare(a.processDate)
		);

		// Apply limit
		const limit = args.limit ?? 50;
		payments = payments.slice(0, limit);

		// Get mortgage addresses for payments
		const mortgageIds = [...new Set(payments.map((p) => p.mortgageId))];
		const mortgages = await Promise.all(
			mortgageIds.map((id) => ctx.db.get(id))
		);
		const mortgageMap = new Map(
			mortgages
				.filter((m): m is NonNullable<typeof m> => m !== null)
				.map((m) => [m._id, m])
		);

		return payments.map((p) => {
			const mortgage = mortgageMap.get(p.mortgageId);
			const propertyAddress = mortgage
				? `${mortgage.address.street}, ${mortgage.address.city}`
				: "Unknown";

			return {
				_id: p._id,
				mortgageId: p.mortgageId,
				amount: p.amount,
				dueDate: p.processDate,
				paidDate: p.paidDate,
				status: p.status,
				propertyAddress,
			};
		});
	},
});

/**
 * Get upcoming payments for borrower
 * Returns next N pending payments
 */
export const getUpcomingPayments = authorizedQuery({
	args: {
		limit: v.optional(v.number()),
	},
	returns: v.array(paymentSummarySchema),
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}
		const userId = subject as Id<"users">;

		// Get borrower profile
		const borrower = await ctx.db
			.query("borrowers")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();

		if (!borrower) {
			return [];
		}

		// Get pending payments
		const today = new Date().toISOString().split("T")[0];
		let payments = await ctx.db
			.query("payments")
			.withIndex("by_borrower", (q) => q.eq("borrowerId", borrower._id))
			.collect();

		// Filter to pending payments in the future
		payments = payments.filter(
			(p) => p.status === "pending" && p.processDate >= today
		);

		// Sort by process date ascending (soonest first)
		payments = payments.sort((a, b) =>
			a.processDate.localeCompare(b.processDate)
		);

		// Apply limit
		const limit = args.limit ?? 5;
		payments = payments.slice(0, limit);

		// Get mortgage addresses
		const mortgageIds = [...new Set(payments.map((p) => p.mortgageId))];
		const mortgages = await Promise.all(
			mortgageIds.map((id) => ctx.db.get(id))
		);
		const mortgageMap = new Map(
			mortgages
				.filter((m): m is NonNullable<typeof m> => m !== null)
				.map((m) => [m._id, m])
		);

		return payments.map((p) => {
			const mortgage = mortgageMap.get(p.mortgageId);
			const propertyAddress = mortgage
				? `${mortgage.address.street}, ${mortgage.address.city}`
				: "Unknown";

			return {
				_id: p._id,
				mortgageId: p.mortgageId,
				amount: p.amount,
				dueDate: p.processDate,
				paidDate: p.paidDate,
				status: p.status,
				propertyAddress,
			};
		});
	},
});

/**
 * Get recent activity for borrower dashboard
 * Returns recent cleared payments as activity timeline
 */
export const getRecentActivity = authorizedQuery({
	args: {
		limit: v.optional(v.number()),
	},
	returns: v.array(
		v.object({
			_id: v.id("payments"),
			type: v.literal("payment_collected"),
			date: v.string(),
			amount: v.number(),
			propertyAddress: v.string(),
		})
	),
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		const subject = ctx.subject;
		if (!subject) {
			throw new Error("Authentication required");
		}
		const userId = subject as Id<"users">;

		// Get borrower profile
		const borrower = await ctx.db
			.query("borrowers")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();

		if (!borrower) {
			return [];
		}

		// Get recent cleared payments
		let payments = await ctx.db
			.query("payments")
			.withIndex("by_borrower", (q) => q.eq("borrowerId", borrower._id))
			.collect();

		// Filter to cleared payments only
		payments = payments.filter((p) => p.status === "cleared");

		// Sort by process date descending (most recent first)
		payments = payments.sort((a, b) =>
			b.processDate.localeCompare(a.processDate)
		);

		// Apply limit
		const limit = args.limit ?? 10;
		payments = payments.slice(0, limit);

		// Get mortgage addresses
		const mortgageIds = [...new Set(payments.map((p) => p.mortgageId))];
		const mortgages = await Promise.all(
			mortgageIds.map((id) => ctx.db.get(id))
		);
		const mortgageMap = new Map(
			mortgages
				.filter((m): m is NonNullable<typeof m> => m !== null)
				.map((m) => [m._id, m])
		);

		return payments.map((p) => {
			const mortgage = mortgageMap.get(p.mortgageId);
			const propertyAddress = mortgage
				? `${mortgage.address.street}, ${mortgage.address.city}`
				: "Unknown";

			return {
				_id: p._id,
				type: "payment_collected" as const,
				date: p.paidDate ?? p.processDate,
				amount: p.amount,
				propertyAddress,
			};
		});
	},
});

// ============================================================================
// Admin Queries for Rotessa Dashboard Integration
// ============================================================================

/**
 * Admin: List all borrowers with optional filters
 * Used by the admin borrower management page
 */
export const listBorrowersAdmin = authorizedQuery({
	args: {
		limit: v.optional(v.number()),
		cursor: v.optional(v.string()),
		statusFilter: v.optional(
			v.union(
				v.literal("pending_approval"),
				v.literal("active"),
				v.literal("inactive"),
				v.literal("suspended"),
				v.literal("all")
			)
		),
		searchQuery: v.optional(v.string()),
	},
	returns: v.object({
		borrowers: v.array(enhancedBorrowerSchema),
		nextCursor: v.optional(v.string()),
		totalCount: v.number(),
	}),
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		const role = ctx.role;
		if (role !== "admin" && role !== "broker") {
			throw new Error("Admin or broker access required");
		}

		let borrowers = await ctx.db.query("borrowers").collect();

		// Apply status filter
		if (args.statusFilter && args.statusFilter !== "all") {
			borrowers = borrowers.filter((b) => b.status === args.statusFilter);
		}

		// Apply search query (searches name and email)
		if (args.searchQuery) {
			const query = args.searchQuery.toLowerCase();
			borrowers = borrowers.filter(
				(b) =>
					b.name.toLowerCase().includes(query) ||
					b.email.toLowerCase().includes(query)
			);
		}

		// Sort by creation time (newest first)
		borrowers = borrowers.sort((a, b) => b._creationTime - a._creationTime);

		const totalCount = borrowers.length;
		const limit = Math.min(args.limit ?? 50, 100);

		// Apply cursor-based pagination
		let startIndex = 0;
		if (args.cursor) {
			const cursorIndex = borrowers.findIndex((b) => b._id === args.cursor);
			if (cursorIndex !== -1) {
				startIndex = cursorIndex + 1;
			}
		}

		const paginated = borrowers.slice(startIndex, startIndex + limit);
		const nextCursor =
			startIndex + limit < borrowers.length
				? borrowers[startIndex + limit - 1]?._id
				: undefined;

		return {
			borrowers: paginated,
			nextCursor,
			totalCount,
		};
	},
});

/**
 * Admin: Get full borrower details with related data
 * Used by the borrower detail sheet
 */
export const getBorrowerAdmin = authorizedQuery({
	args: {
		borrowerId: v.id("borrowers"),
	},
	returns: v.object({
		borrower: enhancedBorrowerSchema,
		mortgages: v.array(
			v.object({
				_id: v.id("mortgages"),
				propertyAddress: v.string(),
				loanAmount: v.number(),
				interestRate: v.number(),
				monthlyInterestPayment: v.number(),
				status: v.string(),
				rotessaScheduleId: v.optional(v.number()),
			})
		),
		recentPayments: v.array(
			v.object({
				_id: v.id("payments"),
				amount: v.number(),
				processDate: v.string(),
				status: v.string(),
				propertyAddress: v.string(),
			})
		),
		linkedUser: v.optional(
			v.object({
				_id: v.id("users"),
				email: v.string(),
				first_name: v.optional(v.string()),
				last_name: v.optional(v.string()),
			})
		),
	}),
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		const role = ctx.role;
		if (role !== "admin" && role !== "broker") {
			throw new Error("Admin or broker access required");
		}

		const borrower = await ctx.db.get(args.borrowerId);
		if (!borrower) {
			throw new Error("Borrower not found");
		}

		// Get mortgages for this borrower
		const mortgages = await ctx.db
			.query("mortgages")
			.withIndex("by_borrower", (q) => q.eq("borrowerId", args.borrowerId))
			.collect();

		// Get recent payments (borrowerId indexed)
		let payments = await ctx.db
			.query("payments")
			.withIndex("by_borrower", (q) => q.eq("borrowerId", args.borrowerId))
			.collect();

		// Fallback: if borrowerId isn't set on payments, gather by mortgage
		if (payments.length === 0 && mortgages.length > 0) {
			const paymentsByMortgage = await Promise.all(
				mortgages.map((mortgage) =>
					ctx.db
						.query("payments")
						.withIndex("by_mortgage", (q) => q.eq("mortgageId", mortgage._id))
						.collect()
				)
			);
			const flattened = paymentsByMortgage.flat();
			const unique = new Map(flattened.map((p) => [p._id, p]));
			payments = Array.from(unique.values());
		}

		payments = payments
			.sort((a, b) => b.processDate.localeCompare(a.processDate))
			.slice(0, 10);

		// Get mortgage addresses for payments
		const mortgageMap = new Map(mortgages.map((m) => [m._id, m]));

		// Get linked user if exists
		let linkedUser:
			| {
					_id: Id<"users">;
					email: string;
					first_name?: string;
					last_name?: string;
			  }
			| undefined;
		if (borrower.userId) {
			const user = await ctx.db.get(borrower.userId);
			if (user) {
				linkedUser = {
					_id: user._id,
					email: user.email,
					first_name: user.first_name,
					last_name: user.last_name,
				};
			}
		}

		return {
			borrower,
			mortgages: mortgages.map((m) => ({
				_id: m._id,
				propertyAddress: `${m.address.street}, ${m.address.city}`,
				loanAmount: m.loanAmount,
				interestRate: m.interestRate,
				// Calculate monthly interest payment (interest-only)
				monthlyInterestPayment: (m.loanAmount * m.interestRate) / 100 / 12,
				status: m.status,
				rotessaScheduleId: m.rotessaScheduleId,
			})),
			recentPayments: payments.map((p) => {
				const mortgage = mortgageMap.get(p.mortgageId);
				return {
					_id: p._id,
					amount: p.amount,
					processDate: p.processDate,
					status: p.status,
					propertyAddress: mortgage
						? `${mortgage.address.street}, ${mortgage.address.city}`
						: "Unknown",
				};
			}),
			linkedUser,
		};
	},
});

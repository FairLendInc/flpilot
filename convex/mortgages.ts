/**
 * Mortgage management
 * Core loan + property data with embedded property information
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get a mortgage by ID with all details
 */
export const getMortgage = query({
	args: { id: v.id("mortgages") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

/**
 * List mortgages by borrower
 */
export const listMortgagesByBorrower = query({
	args: { borrowerId: v.id("borrowers") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("mortgages")
			.withIndex("by_borrower", (q) => q.eq("borrowerId", args.borrowerId))
			.order("desc")
			.collect();
	},
});

/**
 * List mortgages by status
 */
export const listMortgagesByStatus = query({
	args: {
		status: v.union(
			v.literal("active"),
			v.literal("renewed"),
			v.literal("closed"),
			v.literal("defaulted")
		),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("mortgages")
			.withIndex("by_status", (q) => q.eq("status", args.status))
			.collect();
	},
});

/**
 * Get mortgages nearing maturity (within specified days)
 */
export const getMortgagesNearingMaturity = query({
	args: { daysFromNow: v.number() },
	handler: async (ctx, args) => {
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + args.daysFromNow);
		const futureDateISO = futureDate.toISOString();

		return await ctx.db
			.query("mortgages")
			.withIndex("by_maturity_date")
			.filter((q) => q.lte(q.field("maturityDate"), futureDateISO))
			.collect();
	},
});

/**
 * Create a new mortgage
 */
export const createMortgage = mutation({
	args: {
		borrowerId: v.id("borrowers"),
		loanAmount: v.number(),
		interestRate: v.number(),
		originationDate: v.string(),
		maturityDate: v.string(),
		status: v.optional(
			v.union(
				v.literal("active"),
				v.literal("renewed"),
				v.literal("closed"),
				v.literal("defaulted")
			)
		),
		previousMortgageId: v.optional(v.id("mortgages")),
		address: v.object({
			street: v.string(),
			city: v.string(),
			state: v.string(),
			zip: v.string(),
			country: v.string(),
		}),
		location: v.object({
			lat: v.number(),
			lng: v.number(),
		}),
		propertyType: v.string(),
		images: v.optional(
			v.array(
				v.object({
					storageId: v.string(),
					alt: v.optional(v.string()),
					order: v.number(),
				})
			)
		),
		documents: v.optional(
			v.array(
				v.object({
					name: v.string(),
					type: v.union(
						v.literal("appraisal"),
						v.literal("title"),
						v.literal("inspection"),
						v.literal("loan_agreement"),
						v.literal("insurance")
					),
					storageId: v.string(),
					uploadDate: v.string(),
					fileSize: v.optional(v.number()),
				})
			)
		),
	},
	handler: async (ctx, args) => {
		// Validate numeric constraints
		if (args.loanAmount <= 0) {
			throw new Error("Loan amount must be greater than 0");
		}
		if (args.interestRate <= 0 || args.interestRate >= 100) {
			throw new Error("Interest rate must be between 0 and 100");
		}

		// Validate coordinates
		if (args.location.lat < -90 || args.location.lat > 90) {
			throw new Error("Latitude must be between -90 and 90");
		}
		if (args.location.lng < -180 || args.location.lng > 180) {
			throw new Error("Longitude must be between -180 and 180");
		}

		// Validate borrower exists
		const borrower = await ctx.db.get(args.borrowerId);
		if (!borrower) {
			throw new Error("Borrower not found");
		}

		// Create mortgage with defaults
		return await ctx.db.insert("mortgages", {
			borrowerId: args.borrowerId,
			loanAmount: args.loanAmount,
			interestRate: args.interestRate,
			originationDate: args.originationDate,
			maturityDate: args.maturityDate,
			status: args.status ?? "active",
			previousMortgageId: args.previousMortgageId,
			address: args.address,
			location: args.location,
			propertyType: args.propertyType,
			images: args.images ?? [],
			documents: args.documents ?? [],
		});
	},
});

/**
 * Update mortgage status
 */
export const updateMortgageStatus = mutation({
	args: {
		id: v.id("mortgages"),
		status: v.union(
			v.literal("active"),
			v.literal("renewed"),
			v.literal("closed"),
			v.literal("defaulted")
		),
	},
	handler: async (ctx, args) => {
		const mortgage = await ctx.db.get(args.id);
		if (!mortgage) {
			throw new Error("Mortgage not found");
		}

		// Prevent modification of closed mortgages (except reactivation)
		if (mortgage.status === "closed" && args.status !== "active") {
			throw new Error(
				"Cannot modify closed mortgage. Only reactivation is allowed."
			);
		}

		await ctx.db.patch(args.id, { status: args.status });
		return args.id;
	},
});

/**
 * Add a document to a mortgage
 */
export const addDocumentToMortgage = mutation({
	args: {
		mortgageId: v.id("mortgages"),
		document: v.object({
			name: v.string(),
			type: v.union(
				v.literal("appraisal"),
				v.literal("title"),
				v.literal("inspection"),
				v.literal("loan_agreement"),
				v.literal("insurance")
			),
			storageId: v.string(),
			uploadDate: v.string(),
			fileSize: v.optional(v.number()),
		}),
	},
	handler: async (ctx, args) => {
		const mortgage = await ctx.db.get(args.mortgageId);
		if (!mortgage) {
			throw new Error("Mortgage not found");
		}

		// Append document to existing documents
		await ctx.db.patch(args.mortgageId, {
			documents: [...mortgage.documents, args.document],
		});

		return args.mortgageId;
	},
});

/**
 * Mortgage management
 * Core loan + property data with embedded property information
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get a mortgage by ID with all details including signed URLs for images and documents
 */
export const getMortgage = query({
	args: { id: v.id("mortgages") },
	handler: async (ctx, args) => {
		const mortgage = await ctx.db.get(args.id);
		if (!mortgage) return null;

		// Fetch signed URLs for all property images
		const imagesWithUrls = await Promise.all(
			mortgage.images.map(async (img) => ({
				...img,
				url: await ctx.storage.getUrl(img.storageId),
			}))
		);

		// Fetch signed URLs for all documents
		const documentsWithUrls = await Promise.all(
			(mortgage.documents ?? []).map(async (doc) => ({
				...doc,
				url: await ctx.storage.getUrl(doc.storageId),
			}))
		);

		return {
			...mortgage,
			images: imagesWithUrls,
			documents: documentsWithUrls,
		};
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
		const now = new Date().toISOString();
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + args.daysFromNow);
		const futureDateISO = futureDate.toISOString();

		return await ctx.db
			.query("mortgages")
			.withIndex("by_maturity_date", (q) =>
				q.gte("maturityDate", now).lte("maturityDate", futureDateISO)
			)
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
		mortgageType: v.union(
			v.literal("1st"),
			v.literal("2nd"),
			v.literal("other")
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
		appraisalMarketValue: v.number(),
		appraisalMethod: v.string(),
		appraisalCompany: v.string(),
		appraisalDate: v.string(),
		ltv: v.number(),
	images: v.optional(
		v.array(
			v.object({
				storageId: v.id("_storage"),
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
				storageId: v.id("_storage"),
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
		if (args.ltv < 0 || args.ltv > 100) {
			throw new Error("LTV must be between 0 and 100");
		}
		if (args.appraisalMarketValue <= 0) {
			throw new Error("Appraisal market value must be greater than 0");
		}

		// Validate coordinates
		if (args.location.lat < -90 || args.location.lat > 90) {
			throw new Error("Latitude must be between -90 and 90");
		}
		if (args.location.lng < -180 || args.location.lng > 180) {
			throw new Error("Longitude must be between -180 and 180");
		}

		// Validate appraisal date is not in the future
		const appraisalDate = new Date(args.appraisalDate);
		const now = new Date();
		if (appraisalDate > now) {
			throw new Error("Appraisal date cannot be in the future");
		}

		// Validate borrower exists
		const borrower = await ctx.db.get(args.borrowerId);
		if (!borrower) {
			throw new Error("Borrower not found");
		}

		// Create mortgage with all fields
		const mortgageId = await ctx.db.insert("mortgages", {
			borrowerId: args.borrowerId,
			loanAmount: args.loanAmount,
			interestRate: args.interestRate,
			originationDate: args.originationDate,
			maturityDate: args.maturityDate,
			status: args.status ?? "active",
			mortgageType: args.mortgageType,
			previousMortgageId: args.previousMortgageId,
			address: args.address,
			location: args.location,
			propertyType: args.propertyType,
			appraisalMarketValue: args.appraisalMarketValue,
			appraisalMethod: args.appraisalMethod,
			appraisalCompany: args.appraisalCompany,
			appraisalDate: args.appraisalDate,
			ltv: args.ltv,
			images: args.images ?? [],
			documents: args.documents ?? [],
		});

		// Create initial 100% FairLend ownership
		// By default, all mortgages are 100% owned by FairLend until sold to investors
		await ctx.db.insert("mortgage_ownership", {
			mortgageId,
			ownerId: "fairlend",
			ownershipPercentage: 100,
		});

		return mortgageId;
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
		storageId: v.id("_storage"),
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
		documents: [...(mortgage.documents ?? []), args.document],
	});

		return args.mortgageId;
	},
});

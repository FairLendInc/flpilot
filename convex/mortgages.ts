/**
 * Mortgage management
 * Core loan + property data with embedded property information
 */

import { v, Infer } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

const mortgageStatusValidator = v.union(
	v.literal("active"),
	v.literal("renewed"),
	v.literal("closed"),
	v.literal("defaulted")
);

const mortgageTypeValidator = v.union(
	v.literal("1st"),
	v.literal("2nd"),
	v.literal("other")
);

const mortgageAddressValidator = v.object({
	street: v.string(),
	city: v.string(),
	state: v.string(),
	zip: v.string(),
	country: v.string(),
});

const mortgageLocationValidator = v.object({
	lat: v.number(),
	lng: v.number(),
});

const mortgageImageValidator = v.object({
	storageId: v.id("_storage"),
	alt: v.optional(v.string()),
	order: v.number(),
});

const mortgageDocumentValidator = v.object({
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
});

const mortgageDetailsFields = {
	loanAmount: v.number(),
	interestRate: v.number(),
	originationDate: v.string(),
	maturityDate: v.string(),
	status: v.optional(mortgageStatusValidator),
	mortgageType: mortgageTypeValidator,
	previousMortgageId: v.optional(v.id("mortgages")),
	address: mortgageAddressValidator,
	location: mortgageLocationValidator,
	propertyType: v.string(),
	appraisalMarketValue: v.number(),
	appraisalMethod: v.string(),
	appraisalCompany: v.string(),
	appraisalDate: v.string(),
	ltv: v.number(),
	images: v.optional(v.array(mortgageImageValidator)),
	documents: v.optional(v.array(mortgageDocumentValidator)),
	externalMortgageId: v.optional(v.string()),
} as const;

export const mortgageDetailsValidator = v.object(mortgageDetailsFields);

export type MortgageDetailsInput = Infer<typeof mortgageDetailsValidator>;
export type MortgageWriteInput = MortgageDetailsInput & { borrowerId: Id<"borrowers"> };

const validateMortgageDetails = (details: MortgageDetailsInput): void => {
	if (details.loanAmount <= 0) {
		throw new Error("Loan amount must be greater than 0");
	}
	if (details.interestRate <= 0 || details.interestRate >= 100) {
		throw new Error("Interest rate must be between 0 and 100");
	}
	if (details.ltv < 0 || details.ltv > 100) {
		throw new Error("LTV must be between 0 and 100");
	}
	if (details.appraisalMarketValue <= 0) {
		throw new Error("Appraisal market value must be greater than 0");
	}
	if (details.location.lat < -90 || details.location.lat > 90) {
		throw new Error("Latitude must be between -90 and 90");
	}
	if (details.location.lng < -180 || details.location.lng > 180) {
		throw new Error("Longitude must be between -180 and 180");
	}

	const parsedAppraisalDate = Date.parse(details.appraisalDate);
	if (Number.isNaN(parsedAppraisalDate)) {
		throw new Error("Appraisal date is invalid");
	}
	if (parsedAppraisalDate > Date.now()) {
		throw new Error("Appraisal date cannot be in the future");
	}
};

const normalizeMortgageDetails = (
	details: MortgageDetailsInput
): Omit<MortgageDetailsInput, "externalMortgageId"> & {
	status: Exclude<MortgageDetailsInput["status"], undefined>;
	images: NonNullable<MortgageDetailsInput["images"]>;
	documents: NonNullable<MortgageDetailsInput["documents"]>;
} => ({
	loanAmount: details.loanAmount,
	interestRate: details.interestRate,
	originationDate: details.originationDate,
	maturityDate: details.maturityDate,
	status: details.status ?? "active",
	mortgageType: details.mortgageType,
	previousMortgageId: details.previousMortgageId,
	address: details.address,
	location: details.location,
	propertyType: details.propertyType,
	appraisalMarketValue: details.appraisalMarketValue,
	appraisalMethod: details.appraisalMethod,
	appraisalCompany: details.appraisalCompany,
	appraisalDate: details.appraisalDate,
	ltv: details.ltv,
	images: details.images ?? [],
	documents: details.documents ?? [],
});

export const ensureMortgage = async (
	ctx: MutationCtx,
	input: MortgageWriteInput
): Promise<Id<"mortgages">> => {
	const { borrowerId, ...detailsWithoutBorrower } = input;
	const details: MortgageDetailsInput = detailsWithoutBorrower;
	validateMortgageDetails(details);

	const borrower = await ctx.db.get(borrowerId);
	if (!borrower) {
		throw new Error("Borrower not found");
	}

	const normalized = normalizeMortgageDetails(details);
	const { externalMortgageId } = details;

	if (externalMortgageId) {
		const existing = await ctx.db
			.query("mortgages")
			.withIndex("by_external_mortgage_id", (q) =>
				q.eq("externalMortgageId", externalMortgageId)
			)
			.first();

		if (existing) {
			if (existing.borrowerId !== borrowerId) {
				throw new Error(
					"Mortgage with this externalMortgageId is linked to a different borrower"
				);
			}

			const patchData: Partial<Doc<"mortgages">> = {
				borrowerId,
				...normalized,
			};
			patchData.externalMortgageId = externalMortgageId;

			await ctx.db.patch(existing._id, patchData);
			return existing._id;
		}
	}

	const insertData = {
		borrowerId,
		...normalized,
		externalMortgageId,
	};

	const mortgageId = await ctx.db.insert("mortgages", insertData);

	await ctx.db.insert("mortgage_ownership", {
		mortgageId,
		ownerId: "fairlend",
		ownershipPercentage: 100,
	});

	return mortgageId;
};

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
		...mortgageDetailsFields,
	},
	handler: async (ctx, args) => {
		const mortgageId = await ensureMortgage(ctx, args);
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

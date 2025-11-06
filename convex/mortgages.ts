/**
 * Mortgage management
 * Core loan + property data with embedded property information
 */

import { v, Infer } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
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
	externalMortgageId: v.string(),
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

		// Build patch data, excluding images/documents unless explicitly provided
		const patchData: Partial<Doc<"mortgages">> = {
			borrowerId,
			...normalized,
		};
		
		// Only include images/documents if they were present in the incoming details
		// This preserves existing media on partial/replayed updates
		if (details.images !== undefined) {
			patchData.images = normalized.images;
		} else {
			delete patchData.images;
		}
		
		if (details.documents !== undefined) {
			patchData.documents = normalized.documents;
		} else {
			delete patchData.documents;
		}
		
		patchData.externalMortgageId = externalMortgageId;

		await ctx.db.patch(existing._id, patchData);
		return existing._id;
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
 * Get all mortgages (admin view)
 */
export const getAllMortgages = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("mortgages").collect();
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

/**
 * Admin-only: Update mortgage properties
 * Allows admins to update loan details, property information, borrower link, and status
 */
export const updateMortgage = mutation({
	args: {
		id: v.id("mortgages"),
		loanAmount: v.optional(v.number()),
		interestRate: v.optional(v.number()),
		originationDate: v.optional(v.string()),
		maturityDate: v.optional(v.string()),
		status: v.optional(mortgageStatusValidator),
		mortgageType: v.optional(mortgageTypeValidator),
		borrowerId: v.optional(v.id("borrowers")),
		address: v.optional(mortgageAddressValidator),
		location: v.optional(mortgageLocationValidator),
		propertyType: v.optional(v.string()),
		appraisalMarketValue: v.optional(v.number()),
		appraisalMethod: v.optional(v.string()),
		appraisalCompany: v.optional(v.string()),
		appraisalDate: v.optional(v.string()),
		ltv: v.optional(v.number()),
		images: v.optional(v.array(mortgageImageValidator)),
		documents: v.optional(v.array(mortgageDocumentValidator)),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		const { hasRbacAccess } = await import("./auth.config");
		const isAdmin = hasRbacAccess({
			required_roles: ["admin"],
			user_identity: identity,
		});

		if (!isAdmin) {
			throw new Error("Unauthorized: Admin privileges are required");
		}

		const mortgage = await ctx.db.get(args.id);
		if (!mortgage) {
			throw new Error("Mortgage not found");
		}

		// Find the caller's user document for audit logging
		const caller = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
			.unique();

		if (!caller) {
			throw new Error("User not found");
		}

		// Build update object with validation
		const updates: Partial<Doc<"mortgages">> = {};

		// Validate loan amount
		if (args.loanAmount !== undefined) {
			if (args.loanAmount <= 0) {
				throw new Error("Loan amount must be greater than 0");
			}
			updates.loanAmount = args.loanAmount;
		}

		// Validate interest rate
		if (args.interestRate !== undefined) {
			if (args.interestRate <= 0 || args.interestRate >= 100) {
				throw new Error("Interest rate must be between 0 and 100");
			}
			updates.interestRate = args.interestRate;
		}

		// Validate dates
		const originationDate = args.originationDate ?? mortgage.originationDate;
		const maturityDate = args.maturityDate ?? mortgage.maturityDate;

		if (args.originationDate !== undefined) {
			updates.originationDate = args.originationDate;
		}
		if (args.maturityDate !== undefined) {
			updates.maturityDate = args.maturityDate;
		}

		// Validate maturity date is after origination date
		const parsedOrigination = Date.parse(originationDate);
		const parsedMaturity = Date.parse(maturityDate);
		if (Number.isNaN(parsedOrigination) || Number.isNaN(parsedMaturity)) {
			throw new Error("Invalid date format");
		}
		if (parsedMaturity <= parsedOrigination) {
			throw new Error("Maturity date must be after origination date");
		}

		// Validate property location
		if (args.location !== undefined) {
			if (
				args.location.lat < -90 ||
				args.location.lat > 90 ||
				args.location.lng < -180 ||
				args.location.lng > 180
			) {
				throw new Error(
					"Invalid coordinates: lat must be between -90 and 90, lng must be between -180 and 180"
				);
			}
			updates.location = args.location;
		}

		// Validate LTV
		if (args.ltv !== undefined) {
			if (args.ltv < 0 || args.ltv > 100) {
				throw new Error("LTV must be between 0 and 100");
			}
			updates.ltv = args.ltv;
		}

		// Validate appraisal market value
		if (args.appraisalMarketValue !== undefined) {
			if (args.appraisalMarketValue <= 0) {
				throw new Error("Appraisal market value must be greater than 0");
			}
			updates.appraisalMarketValue = args.appraisalMarketValue;
		}

		// Validate appraisal date
		if (args.appraisalDate !== undefined) {
			const parsedAppraisalDate = Date.parse(args.appraisalDate);
			if (Number.isNaN(parsedAppraisalDate)) {
				throw new Error("Appraisal date is invalid");
			}
			if (parsedAppraisalDate > Date.now()) {
				throw new Error("Appraisal date cannot be in the future");
			}
			updates.appraisalDate = args.appraisalDate;
		}

		// Validate borrower exists if changing borrowerId
		if (args.borrowerId !== undefined) {
			const borrower = await ctx.db.get(args.borrowerId);
			if (!borrower) {
				throw new Error("Borrower not found");
			}
			updates.borrowerId = args.borrowerId;
		}

		// Update other fields
		if (args.status !== undefined) {
			updates.status = args.status;
		}
		if (args.mortgageType !== undefined) {
			updates.mortgageType = args.mortgageType;
		}
		if (args.address !== undefined) {
			updates.address = args.address;
		}
		if (args.propertyType !== undefined) {
			updates.propertyType = args.propertyType;
		}
		if (args.appraisalMethod !== undefined) {
			updates.appraisalMethod = args.appraisalMethod;
		}
		if (args.appraisalCompany !== undefined) {
			updates.appraisalCompany = args.appraisalCompany;
		}
		if (args.images !== undefined) {
			updates.images = args.images;
		}
		if (args.documents !== undefined) {
			updates.documents = args.documents;
		}

		await ctx.db.patch(args.id, updates);

		// Log admin action for audit trail
		console.log(
			`[AUDIT] Admin ${caller._id} updated mortgage ${args.id}:`,
			JSON.stringify(Object.keys(updates))
		);

		return args.id;
	},
});

/**
 * Admin-only: Delete mortgage and all associated data
 * Cascades deletion to listings, comparables, ownership records, and payments
 */
export const deleteMortgage = mutation({
	args: {
		id: v.id("mortgages"),
		force: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		const { hasRbacAccess } = await import("./auth.config");
		const isAdmin = hasRbacAccess({
			required_roles: ["admin"],
			user_identity: identity,
		});

		if (!isAdmin) {
			throw new Error("Unauthorized: Admin privileges are required");
		}

		const mortgage = await ctx.db.get(args.id);
		if (!mortgage) {
			throw new Error("Mortgage not found");
		}

		// Find the caller's user document for audit logging
		const caller = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
			.unique();

		if (!caller) {
			throw new Error("User not found");
		}

		// Check for listings
		const listings = await ctx.db
			.query("listings")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.id))
			.collect();

		// Check if any listing is locked
		const lockedListings = listings.filter((l) => l.locked);
		if (lockedListings.length > 0 && !args.force) {
			throw new Error(
				`Cannot delete mortgage: ${lockedListings.length} listing(s) are locked. Use force=true to unlock and delete.`
			);
		}

		// Track cascade deletions for audit
		const cascadeStats = {
			listings: 0,
			comparables: 0,
			ownership: 0,
			payments: 0,
		};

		try {
			// Delete listings (unlock if force=true)
			for (const listing of listings) {
				if (listing.locked && args.force) {
					await ctx.db.patch(listing._id, {
						locked: false,
						lockedBy: undefined,
						lockedAt: undefined,
					});
				}
				await ctx.db.delete(listing._id);
				cascadeStats.listings++;
			}

			// Delete comparables
			const comparables = await ctx.db
				.query("appraisal_comparables")
				.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.id))
				.collect();

			await Promise.all(comparables.map((c) => ctx.db.delete(c._id)));
			cascadeStats.comparables = comparables.length;

			// Delete ownership records
			const ownershipRecords = await ctx.db
				.query("mortgage_ownership")
				.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.id))
				.collect();

			await Promise.all(
				ownershipRecords.map((o) => ctx.db.delete(o._id))
			);
			cascadeStats.ownership = ownershipRecords.length;

			// Delete payments
			const payments = await ctx.db
				.query("payments")
				.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.id))
				.collect();

			await Promise.all(payments.map((p) => ctx.db.delete(p._id)));
			cascadeStats.payments = payments.length;

			// Finally, delete the mortgage
			await ctx.db.delete(args.id);

			// Log admin action for audit trail
			console.log(
				`[AUDIT] Admin ${caller._id} deleted mortgage ${args.id} with cascade:`,
				JSON.stringify(cascadeStats)
			);

			return args.id;
		} catch (error) {
			// Convex transactions automatically rollback on error
			throw new Error(
				`Failed to delete mortgage: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	},
});

/**
 * Internal mutation for webhook: Update mortgage (bypasses auth, webhook authenticates via API key)
 */
export const updateMortgageInternal = internalMutation({
	args: {
		id: v.id("mortgages"),
		loanAmount: v.optional(v.number()),
		interestRate: v.optional(v.number()),
		status: v.optional(v.enum(["active", "renewed", "closed", "defaulted"])),
		mortgageType: v.optional(v.enum(["1st", "2nd", "other"])),
		borrowerId: v.optional(v.id("borrowers")),
	},
	handler: async (ctx, args) => {
		const mortgage = await ctx.db.get(args.id);
		if (!mortgage) {
			throw new Error("Mortgage not found");
		}

		const updates: Partial<typeof mortgage> = {};

		if (args.loanAmount !== undefined) {
			if (args.loanAmount <= 0) {
				throw new Error("Loan amount must be greater than 0");
			}
			updates.loanAmount = args.loanAmount;
		}

		if (args.interestRate !== undefined) {
			if (args.interestRate <= 0 || args.interestRate >= 100) {
				throw new Error("Interest rate must be between 0 and 100");
			}
			updates.interestRate = args.interestRate;
		}

		if (args.status !== undefined) {
			updates.status = args.status;
		}

		if (args.mortgageType !== undefined) {
			updates.mortgageType = args.mortgageType;
		}

		if (args.borrowerId !== undefined) {
			// Validate borrower exists
			const borrower = await ctx.db.get(args.borrowerId);
			if (!borrower) {
				throw new Error("Borrower not found");
			}
			updates.borrowerId = args.borrowerId;
		}

		await ctx.db.patch(args.id, updates);

		const { logger } = await import("./logger");
		logger.info(`[WEBHOOK] Updated mortgage ${args.id}`, updates);

		return args.id;
	},
});

/**
 * Internal mutation for webhook: Delete mortgage (bypasses auth, webhook authenticates via API key)
 */
export const deleteMortgageInternal = internalMutation({
	args: {
		id: v.id("mortgages"),
		force: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const mortgage = await ctx.db.get(args.id);
		if (!mortgage) {
			throw new Error("Mortgage not found");
		}

		// Check for listings
		const listings = await ctx.db
			.query("listings")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.id))
			.collect();

		// Check if any listing is locked
		const lockedListings = listings.filter((l) => l.locked);
		if (lockedListings.length > 0 && !args.force) {
			throw new Error(
				`Cannot delete mortgage: ${lockedListings.length} listing(s) are locked. Use force=true to unlock and delete.`
			);
		}

		// Track cascade deletions for audit
		const cascadeStats = {
			listings: 0,
			comparables: 0,
			ownership: 0,
			payments: 0,
		};

		try {
			// Delete listings (unlock if force=true)
			for (const listing of listings) {
				if (listing.locked && args.force) {
					await ctx.db.patch(listing._id, {
						locked: false,
						lockedBy: undefined,
						lockedAt: undefined,
					});
				}
				await ctx.db.delete(listing._id);
				cascadeStats.listings++;
			}

			// Delete comparables
			const comparables = await ctx.db
				.query("appraisal_comparables")
				.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.id))
				.collect();

			await Promise.all(comparables.map((c) => ctx.db.delete(c._id)));
			cascadeStats.comparables = comparables.length;

			// Delete ownership records
			const ownershipRecords = await ctx.db
				.query("mortgage_ownership")
				.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.id))
				.collect();

			await Promise.all(
				ownershipRecords.map((o) => ctx.db.delete(o._id))
			);
			cascadeStats.ownership = ownershipRecords.length;

			// Delete payments
			const payments = await ctx.db
				.query("payments")
				.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.id))
				.collect();

			await Promise.all(payments.map((p) => ctx.db.delete(p._id)));
			cascadeStats.payments = payments.length;

			// Delete the mortgage
			await ctx.db.delete(args.id);

			const { logger } = await import("./logger");
			logger.info(
				`[WEBHOOK] Deleted mortgage ${args.id} (cascade: ${JSON.stringify(cascadeStats)})`
			);

			return args.id;
		} catch (error) {
			// Convex transactions automatically rollback on error
			throw new Error(
				`Failed to delete mortgage: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	},
});

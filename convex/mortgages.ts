/**
 * Mortgage management
 * Core loan + property data with embedded property information
 *
 * ## Ownership Initialization
 * When a new mortgage is created, two things happen:
 * 1. A `mortgage_ownership` record is created with FairLend owning 100%
 * 2. A ledger action is scheduled to initialize ownership in Formance
 *
 * See footguns.md #3 - external API calls must be scheduled actions, not mutations.
 */

import { type Infer, v } from "convex/values";
import { checkRbac } from "../lib/authhelper";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, internalQuery } from "./_generated/server";
import {
	authenticatedMutation,
	authenticatedQuery,
} from "./lib/authorizedFunctions";
import { isLedgerSourceOfTruth } from "./lib/ownershipConfig";
import { paginateByCreation } from "./lib/webhookPagination";

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

const mortgageTemplateValidator = v.object({
	documensoTemplateId: v.string(),
	name: v.string(),
	signatoryRoles: v.array(v.string()),
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
	documentTemplates: v.optional(v.array(mortgageTemplateValidator)),
	externalMortgageId: v.string(),
	priorEncumbrance: v.optional(
		v.object({
			amount: v.number(),
			lender: v.string(),
		})
	),
	asIfAppraisal: v.optional(
		v.object({
			marketValue: v.number(),
			method: v.string(),
			company: v.string(),
			date: v.string(),
		})
	),
} as const;

const borrowerInlineValidator = v.object({
	name: v.string(),
	email: v.string(),
	phone: v.optional(v.string()),
	rotessaCustomerId: v.string(),
});

export const mortgageDetailsValidator = v.object(mortgageDetailsFields);

export type MortgageDetailsInput = Infer<typeof mortgageDetailsValidator>;
export type MortgageWriteInput = MortgageDetailsInput & {
	borrowerId: Id<"borrowers">;
};

type BorrowerResolution = {
	borrowerId: Id<"borrowers">;
	borrowerCreated: boolean;
};

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
	documentTemplates: details.documentTemplates ?? [],
});

/**
 * Result from ensureMortgage operation
 */
type EnsureMortgageResult = {
	mortgageId: Id<"mortgages">;
	created: boolean;
};

export const ensureMortgage = async (
	ctx: MutationCtx,
	input: MortgageWriteInput
): Promise<EnsureMortgageResult> => {
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
			patchData.images = undefined;
		}

		if (details.documents !== undefined) {
			patchData.documents = normalized.documents;
		} else {
			patchData.documents = undefined;
		}

		if (details.documentTemplates !== undefined) {
			patchData.documentTemplates = normalized.documentTemplates;
		} else {
			patchData.documentTemplates = undefined;
		}

		patchData.externalMortgageId = externalMortgageId;

		await ctx.db.patch(existing._id, patchData);
		// Return with created flag to signal callers NOT to schedule ledger init
		return { mortgageId: existing._id, created: false };
	}

	const insertData = {
		borrowerId,
		...normalized,
		externalMortgageId,
	};

	const mortgageId = await ctx.db.insert("mortgages", insertData);

	if (!isLedgerSourceOfTruth()) {
		await ctx.db.insert("mortgage_ownership", {
			mortgageId,
			ownerId: "fairlend",
			ownershipPercentage: 100,
		});
	}

	// Return with created flag to signal callers to schedule ledger init
	return { mortgageId, created: true };
};

/**
 * Legacy wrapper for backward compatibility
 * Callers that don't need the created flag can use this
 */
const _ensureMortgageId = async (
	ctx: MutationCtx,
	args: {
		borrowerId: Id<"borrowers">;
	} & MortgageDetailsInput
): Promise<Id<"mortgages">> => {
	const result = await ensureMortgage(ctx, args);
	return result.mortgageId;
};

const resolveBorrowerForCreate = async (
	ctx: MutationCtx,
	args: {
		borrowerId?: Id<"borrowers">;
		borrowerRotessaId?: string;
		borrower?: {
			name: string;
			email: string;
			phone?: string;
			rotessaCustomerId: string;
		};
	}
): Promise<BorrowerResolution> => {
	if (args.borrowerId) {
		const borrower = await ctx.db.get(args.borrowerId);
		if (!borrower) {
			throw new Error("invalid_borrower_id");
		}
		return { borrowerId: args.borrowerId, borrowerCreated: false };
	}

	if (args.borrowerRotessaId) {
		const rotessaId = args.borrowerRotessaId;
		const borrower = await ctx.db
			.query("borrowers")
			.withIndex("by_rotessa_customer_id", (q) =>
				q.eq("rotessaCustomerId", rotessaId)
			)
			.first();
		if (!borrower) {
			throw new Error("borrower_not_found");
		}
		return { borrowerId: borrower._id, borrowerCreated: false };
	}

	if (args.borrower) {
		const rotessaId = args.borrower.rotessaCustomerId;
		const existing = await ctx.db
			.query("borrowers")
			.withIndex("by_rotessa_customer_id", (q) =>
				q.eq("rotessaCustomerId", rotessaId)
			)
			.first();
		if (existing) {
			return { borrowerId: existing._id, borrowerCreated: false };
		}

		const borrowerId = await ctx.db.insert("borrowers", {
			name: args.borrower.name,
			email: args.borrower.email,
			phone: args.borrower.phone,
			rotessaCustomerId: args.borrower.rotessaCustomerId,
		});
		return { borrowerId, borrowerCreated: true };
	}

	throw new Error("missing_borrower_reference");
};

/**
 * Internal: Create mortgage with flexible borrower resolution.
 */
export const createMortgageInternal = internalMutation({
	args: {
		borrowerId: v.optional(v.id("borrowers")),
		borrowerRotessaId: v.optional(v.string()),
		borrower: v.optional(borrowerInlineValidator),
		...mortgageDetailsFields,
	},
	returns: v.object({
		mortgageId: v.id("mortgages"),
		borrowerId: v.id("borrowers"),
		created: v.boolean(),
		borrowerCreated: v.boolean(),
	}),
	handler: async (ctx, args) => {
		const { borrowerId, borrowerRotessaId, borrower, ...mortgageDetails } =
			args;
		const resolution = await resolveBorrowerForCreate(ctx, {
			borrowerId,
			borrowerRotessaId,
			borrower,
		});

		const existing = await ctx.db
			.query("mortgages")
			.withIndex("by_external_mortgage_id", (q) =>
				q.eq("externalMortgageId", mortgageDetails.externalMortgageId)
			)
			.first();

		if (existing) {
			if (existing.borrowerId !== resolution.borrowerId) {
				throw new Error("mortgage_borrower_mismatch");
			}
			return {
				mortgageId: existing._id,
				borrowerId: existing.borrowerId,
				created: false,
				borrowerCreated: resolution.borrowerCreated,
			};
		}

		const result = await ensureMortgage(ctx, {
			borrowerId: resolution.borrowerId,
			...(mortgageDetails as MortgageDetailsInput),
		});

		// Schedule ledger initialization only if mortgage was newly created
		// This records the initial 100% FairLend ownership in Formance
		// See footguns.md #3 - external API calls must be scheduled actions
		if (result.created) {
			const reference = `init:${result.mortgageId}`;
			await ctx.scheduler.runAfter(
				0,
				internal.ledger.initializeMortgageOwnership,
				{
					mortgageId: result.mortgageId.toString(),
					reference,
				}
			);
		}

		return {
			mortgageId: result.mortgageId,
			borrowerId: resolution.borrowerId,
			created: result.created,
			borrowerCreated: resolution.borrowerCreated,
		};
	},
});

/**
 * Internal: Get a mortgage with optional joined borrower and listing data.
 */
export const getMortgageInternal = internalQuery({
	args: {
		mortgageId: v.optional(v.id("mortgages")),
		externalMortgageId: v.optional(v.string()),
		includeBorrower: v.optional(v.boolean()),
		includeListing: v.optional(v.boolean()),
	},
	returns: v.union(v.any(), v.null()),
	handler: async (ctx, args) => {
		let mortgage: Doc<"mortgages"> | null = null;
		if (args.mortgageId) {
			mortgage = await ctx.db.get(args.mortgageId);
		} else if (args.externalMortgageId) {
			mortgage = await ctx.db
				.query("mortgages")
				.withIndex("by_external_mortgage_id", (q) =>
					q.eq("externalMortgageId", args.externalMortgageId)
				)
				.first();
		}

		if (!mortgage) {
			return null;
		}

		const response: Record<string, unknown> = { ...mortgage };

		if (args.includeBorrower) {
			response.borrower = await ctx.db.get(mortgage.borrowerId);
		}

		if (args.includeListing) {
			const listing = await ctx.db
				.query("listings")
				.withIndex("by_mortgage", (q) => q.eq("mortgageId", mortgage._id))
				.first();
			if (listing) {
				response.listing = listing;
			}
		}

		return response;
	},
});

/**
 * Internal: List mortgages with filters and optional borrower joins.
 */
export const listMortgagesInternal = internalQuery({
	args: {
		borrowerId: v.optional(v.id("borrowers")),
		borrowerRotessaId: v.optional(v.string()),
		status: v.optional(v.string()),
		mortgageType: v.optional(v.string()),
		minLtv: v.optional(v.number()),
		maxLtv: v.optional(v.number()),
		minLoanAmount: v.optional(v.number()),
		maxLoanAmount: v.optional(v.number()),
		maturityAfter: v.optional(v.string()),
		maturityBefore: v.optional(v.string()),
		createdAfter: v.optional(v.string()),
		createdBefore: v.optional(v.string()),
		hasListing: v.optional(v.boolean()),
		includeBorrower: v.optional(v.boolean()),
		limit: v.optional(v.number()),
		cursor: v.optional(v.string()),
	},
	returns: v.object({
		mortgages: v.array(v.any()),
		nextCursor: v.optional(v.string()),
		hasMore: v.boolean(),
		total: v.number(),
	}),
	handler: async (ctx, args) => {
		const mortgages = await ctx.db.query("mortgages").collect();
		const listings = await ctx.db.query("listings").collect();

		let borrowerFilterId = args.borrowerId;
		if (!borrowerFilterId && args.borrowerRotessaId) {
			const rotessaId = args.borrowerRotessaId;
			const borrower = await ctx.db
				.query("borrowers")
				.withIndex("by_rotessa_customer_id", (q) =>
					q.eq("rotessaCustomerId", rotessaId)
				)
				.first();
			borrowerFilterId = borrower?._id;
		}

		const statusList = args.status
			? args.status.split(",").map((value) => value.trim())
			: null;

		const maturityAfter = args.maturityAfter
			? Date.parse(args.maturityAfter)
			: null;
		const maturityBefore = args.maturityBefore
			? Date.parse(args.maturityBefore)
			: null;
		const createdAfter = args.createdAfter
			? Date.parse(args.createdAfter)
			: null;
		const createdBefore = args.createdBefore
			? Date.parse(args.createdBefore)
			: null;

		const listingByMortgageId = new Map(
			listings.map((listing) => [listing.mortgageId, listing])
		);

		const filtered = mortgages.filter((mortgage) => {
			if (borrowerFilterId && mortgage.borrowerId !== borrowerFilterId) {
				return false;
			}
			if (statusList && !statusList.includes(mortgage.status)) {
				return false;
			}
			if (args.mortgageType && mortgage.mortgageType !== args.mortgageType) {
				return false;
			}
			if (args.minLtv !== undefined && mortgage.ltv < args.minLtv) {
				return false;
			}
			if (args.maxLtv !== undefined && mortgage.ltv > args.maxLtv) {
				return false;
			}
			if (
				args.minLoanAmount !== undefined &&
				mortgage.loanAmount < args.minLoanAmount
			) {
				return false;
			}
			if (
				args.maxLoanAmount !== undefined &&
				mortgage.loanAmount > args.maxLoanAmount
			) {
				return false;
			}
			if (maturityAfter && Date.parse(mortgage.maturityDate) <= maturityAfter) {
				return false;
			}
			if (
				maturityBefore &&
				Date.parse(mortgage.maturityDate) >= maturityBefore
			) {
				return false;
			}
			if (createdAfter && mortgage._creationTime <= createdAfter) {
				return false;
			}
			if (createdBefore && mortgage._creationTime >= createdBefore) {
				return false;
			}
			if (args.hasListing !== undefined) {
				const hasListing = listingByMortgageId.has(mortgage._id);
				if (args.hasListing !== hasListing) {
					return false;
				}
			}
			return true;
		});

		const limit = Math.min(Math.max(args.limit ?? 100, 1), 500);
		const paginated = paginateByCreation(filtered, limit, args.cursor);

		const result: Record<string, unknown>[] = [];
		for (const mortgage of paginated.items) {
			const record: Record<string, unknown> = { ...mortgage };
			if (args.includeBorrower) {
				record.borrower = await ctx.db.get(mortgage.borrowerId);
			}
			result.push(record);
		}

		return {
			mortgages: result,
			nextCursor: paginated.nextCursor,
			hasMore: paginated.hasMore,
			total: paginated.total,
		};
	},
});

/**
 * Get a mortgage by ID with all details including signed URLs for images and documents
 */
export const getMortgage = authenticatedQuery({
	args: { id: v.id("mortgages") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}
		const mortgage = await ctx.db.get(args.id);
		if (!mortgage) return null;

		// Fetch signed URLs for all property images
		const imagesWithUrls = await Promise.all(
			(mortgage.images ?? []).map(async (img) => ({
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
export const listMortgagesByBorrower = authenticatedQuery({
	args: { borrowerId: v.id("borrowers") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}
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
export const listMortgagesByStatus = authenticatedQuery({
	args: {
		status: v.union(
			v.literal("active"),
			v.literal("renewed"),
			v.literal("closed"),
			v.literal("defaulted")
		),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}
		return await ctx.db
			.query("mortgages")
			.withIndex("by_status", (q) => q.eq("status", args.status))
			.collect();
	},
});

/**
 * List all mortgages with borrower information (admin only)
 */
export const listAllMortgagesWithBorrowers = authenticatedQuery({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		checkRbac({
			required_roles: ["admin"],
			user_identity: identity,
		});

		const mortgages = await ctx.db.query("mortgages").collect();
		const mortgagesWithBorrowers = await Promise.all(
			mortgages.map(async (mortgage) => {
				const borrower = await ctx.db.get(mortgage.borrowerId);
				return {
					...mortgage,
					borrower: borrower
						? { name: borrower.name, email: borrower.email }
						: null,
				};
			})
		);
		return mortgagesWithBorrowers;
	},
});

/**
 * Get mortgages nearing maturity (within specified days)
 */
export const getMortgagesNearingMaturity = authenticatedQuery({
	args: { daysFromNow: v.number() },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}
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
export const createMortgage = authenticatedMutation({
	args: {
		borrowerId: v.id("borrowers"),
		...mortgageDetailsFields,
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}
		const result = await ensureMortgage(ctx, args);

		// Schedule ledger initialization only if mortgage was newly created
		if (result.created) {
			const reference = `init:${result.mortgageId}`;
			await ctx.scheduler.runAfter(
				0,
				internal.ledger.initializeMortgageOwnership,
				{
					mortgageId: result.mortgageId.toString(),
					reference,
				}
			);
		}

		return result.mortgageId;
	},
});

/**
 * Update mortgage status
 */
export const updateMortgageStatus = authenticatedMutation({
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
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}
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
export const addDocumentToMortgage = authenticatedMutation({
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
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}
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
 * Update mortgage document templates
 */
export const updateMortgageTemplates = authenticatedMutation({
	args: {
		mortgageId: v.id("mortgages"),
		templates: v.array(mortgageTemplateValidator),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		checkRbac({
			required_roles: ["admin"],
			user_identity: identity,
		});

		const mortgage = await ctx.db.get(args.mortgageId);
		if (!mortgage) {
			throw new Error("Mortgage not found");
		}

		await ctx.db.patch(args.mortgageId, {
			documentTemplates: args.templates,
		});

		return args.mortgageId;
	},
});

/**
 * Core business logic for updating a mortgage (without auth checks)
 * Used by both authenticated mutations and internal webhook handlers
 */
async function updateMortgageCore(
	ctx: MutationCtx,
	args: {
		mortgageId: Id<"mortgages">;
		loanAmount?: number;
		interestRate?: number;
		originationDate?: string;
		maturityDate?: string;
		status?: "active" | "renewed" | "closed" | "defaulted";
		mortgageType?: "1st" | "2nd" | "other";
		address?: {
			street: string;
			city: string;
			state: string;
			zip: string;
			country: string;
		};
		location?: {
			lat: number;
			lng: number;
		};
		propertyType?: string;
		appraisalMarketValue?: number;
		appraisalMethod?: string;
		appraisalCompany?: string;
		appraisalDate?: string;
		ltv?: number;
		externalMortgageId?: string;
		borrowerId?: Id<"borrowers">;
		images?: Array<{
			storageId: Id<"_storage">;
			alt?: string;
			order: number;
		}>;
		documents?: Array<{
			name: string;
			type:
				| "appraisal"
				| "title"
				| "inspection"
				| "loan_agreement"
				| "insurance";
			storageId: Id<"_storage">;
			uploadDate: string;
			fileSize?: number;
		}>;
		documentTemplates?: Array<{
			documensoTemplateId: string;
			name: string;
			signatoryRoles: string[];
		}>;
		priorEncumbrance?: {
			amount: number;
			lender: string;
		};
		asIfAppraisal?: {
			marketValue: number;
			method: string;
			company: string;
			date: string;
		};
	}
): Promise<Id<"mortgages">> {
	// Get existing mortgage
	const mortgage = await ctx.db.get(args.mortgageId);
	if (!mortgage) {
		throw new Error("Mortgage not found");
	}

	// Build update object
	const updates: Partial<Doc<"mortgages">> = {};

	// Validate and update loan details
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

	// Validate and update dates
	if (args.originationDate !== undefined) {
		updates.originationDate = args.originationDate;
	}

	if (args.maturityDate !== undefined) {
		updates.maturityDate = args.maturityDate;
	}

	// Ensure maturity date is after origination date
	const finalOriginationDate =
		updates.originationDate ?? mortgage.originationDate;
	const finalMaturityDate = updates.maturityDate ?? mortgage.maturityDate;

	if (Date.parse(finalMaturityDate) <= Date.parse(finalOriginationDate)) {
		throw new Error("Maturity date must be after origination date");
	}

	if (args.status !== undefined) {
		updates.status = args.status;
	}

	if (args.mortgageType !== undefined) {
		if (!["1st", "2nd", "other"].includes(args.mortgageType)) {
			throw new Error("Mortgage type must be one of: 1st, 2nd, other");
		}
		updates.mortgageType = args.mortgageType;
	}

	// Update property information
	if (args.address !== undefined) {
		// Validate all required address fields
		if (
			!(
				args.address.street &&
				args.address.city &&
				args.address.state &&
				args.address.zip &&
				args.address.country
			)
		) {
			throw new Error("All address fields are required");
		}
		updates.address = args.address;
	}

	if (args.location !== undefined) {
		// Validate coordinates
		if (args.location.lat < -90 || args.location.lat > 90) {
			throw new Error("Latitude must be between -90 and 90");
		}
		if (args.location.lng < -180 || args.location.lng > 180) {
			throw new Error("Longitude must be between -180 and 180");
		}
		updates.location = args.location;
	}

	if (args.propertyType !== undefined) {
		updates.propertyType = args.propertyType;
	}

	// Update appraisal information
	if (args.appraisalMarketValue !== undefined) {
		if (args.appraisalMarketValue <= 0) {
			throw new Error("Appraisal market value must be greater than 0");
		}
		updates.appraisalMarketValue = args.appraisalMarketValue;
	}

	if (args.appraisalMethod !== undefined) {
		updates.appraisalMethod = args.appraisalMethod;
	}

	if (args.appraisalCompany !== undefined) {
		updates.appraisalCompany = args.appraisalCompany;
	}

	if (args.appraisalDate !== undefined) {
		const parsedDate = Date.parse(args.appraisalDate);
		if (Number.isNaN(parsedDate)) {
			throw new Error("Appraisal date must be a valid date");
		}
		if (parsedDate > Date.now()) {
			throw new Error("Appraisal date cannot be in the future");
		}
		updates.appraisalDate = args.appraisalDate;
	}

	if (args.ltv !== undefined) {
		if (args.ltv < 0 || args.ltv > 100) {
			throw new Error("LTV must be between 0 and 100");
		}
		updates.ltv = args.ltv;
	}

	if (args.externalMortgageId !== undefined) {
		// Check for uniqueness - ensure no other mortgage has this externalMortgageId
		const existing = await ctx.db
			.query("mortgages")
			.withIndex("by_external_mortgage_id", (q) =>
				q.eq("externalMortgageId", args.externalMortgageId)
			)
			.first();

		if (existing && existing._id !== args.mortgageId) {
			throw new Error("Mortgage with this externalMortgageId already exists");
		}

		updates.externalMortgageId = args.externalMortgageId;
	}

	// Update borrower link
	if (args.borrowerId !== undefined) {
		const borrower = await ctx.db.get(args.borrowerId);
		if (!borrower) {
			throw new Error("Borrower not found");
		}
		updates.borrowerId = args.borrowerId;
	}

	// Update images
	if (args.images !== undefined) {
		// Validate image order values are sequential and start at 0
		const sortedImages = [...args.images].sort((a, b) => a.order - b.order);
		for (let i = 0; i < sortedImages.length; i += 1) {
			if (sortedImages[i].order !== i) {
				throw new Error("Image order must be sequential starting from 0");
			}
		}
		updates.images = args.images;
	}

	// Update documents
	if (args.documents !== undefined) {
		// Validate all document types
		for (const doc of args.documents) {
			if (
				![
					"appraisal",
					"title",
					"inspection",
					"loan_agreement",
					"insurance",
				].includes(doc.type)
			) {
				throw new Error(`Invalid document type: ${doc.type}`);
			}
		}
		updates.documents = args.documents;
	}

	// Update document templates
	if (args.documentTemplates !== undefined) {
		updates.documentTemplates = args.documentTemplates;
	}

	// Update prior encumbrance
	if (args.priorEncumbrance !== undefined) {
		if (args.priorEncumbrance.amount <= 0) {
			throw new Error("Prior encumbrance amount must be greater than 0");
		}
		if (
			!args.priorEncumbrance.lender ||
			args.priorEncumbrance.lender.trim() === ""
		) {
			throw new Error("Prior encumbrance lender is required");
		}
		updates.priorEncumbrance = args.priorEncumbrance;
	}

	// Update as-if appraisal
	if (args.asIfAppraisal !== undefined) {
		if (args.asIfAppraisal.marketValue <= 0) {
			throw new Error("As-if appraisal market value must be greater than 0");
		}
		if (!args.asIfAppraisal.method || args.asIfAppraisal.method.trim() === "") {
			throw new Error("As-if appraisal method is required");
		}
		if (
			!args.asIfAppraisal.company ||
			args.asIfAppraisal.company.trim() === ""
		) {
			throw new Error("As-if appraisal company is required");
		}
		if (!args.asIfAppraisal.date || args.asIfAppraisal.date.trim() === "") {
			throw new Error("As-if appraisal date is required");
		}
		const parsedDate = Date.parse(args.asIfAppraisal.date);
		if (Number.isNaN(parsedDate)) {
			throw new Error("As-if appraisal date must be a valid date");
		}
		updates.asIfAppraisal = args.asIfAppraisal;
	}

	// Apply updates
	await ctx.db.patch(args.mortgageId, updates);

	return args.mortgageId;
}

/**
 * Core business logic for deleting a mortgage (without auth checks)
 * Used by both authenticated mutations and internal webhook handlers
 */
async function deleteMortgageCore(
	ctx: MutationCtx,
	args: {
		mortgageId: Id<"mortgages">;
		force?: boolean;
	}
): Promise<{
	mortgageId: Id<"mortgages">;
	deletedCounts: {
		listings: number;
		comparables: number;
		ownership: number;
		payments: number;
	};
}> {
	// Get existing mortgage
	const mortgage = await ctx.db.get(args.mortgageId);
	if (!mortgage) {
		throw new Error("Mortgage not found");
	}

	try {
		const deletedCounts = {
			listings: 0,
			comparables: 0,
			ownership: 0,
			payments: 0,
		};

		// 1. Check for listings
		const listings = await ctx.db
			.query("listings")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.mortgageId))
			.collect();

		// Check if any listings are locked (unless force flag is set)
		if (!args.force) {
			const lockedListing = listings.find((l) => l.locked);
			if (lockedListing) {
				throw new Error(
					"Cannot delete mortgage with locked listing. Use force option or unlock first."
				);
			}
		}

		// Delete all listings
		for (const listing of listings) {
			await ctx.db.delete(listing._id);
			deletedCounts.listings += 1;
		}

		// 2. Delete all comparables
		const comparables = await ctx.db
			.query("appraisal_comparables")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.mortgageId))
			.collect();

		for (const comparable of comparables) {
			await ctx.db.delete(comparable._id);
			deletedCounts.comparables += 1;
		}

		// 3. Delete all ownership records
		const ownershipRecords = await ctx.db
			.query("mortgage_ownership")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.mortgageId))
			.collect();

		for (const record of ownershipRecords) {
			await ctx.db.delete(record._id);
			deletedCounts.ownership += 1;
		}

		// 4. Delete all payment records
		const payments = await ctx.db
			.query("payments")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.mortgageId))
			.collect();

		for (const payment of payments) {
			await ctx.db.delete(payment._id);
			deletedCounts.payments += 1;
		}

		// 5. Finally, delete the mortgage itself (preserve borrower)
		await ctx.db.delete(args.mortgageId);

		return {
			mortgageId: args.mortgageId,
			deletedCounts,
		};
	} catch (error) {
		// Convex transactions automatically rollback on error
		throw new Error(
			`Failed to delete mortgage: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

/**
 * Admin-only: Update mortgage properties
 * Can update loan details, property info, borrower link, and documents
 */
export const updateMortgage = authenticatedMutation({
	args: {
		mortgageId: v.id("mortgages"),
		loanAmount: v.optional(v.number()),
		interestRate: v.optional(v.number()),
		originationDate: v.optional(v.string()),
		maturityDate: v.optional(v.string()),
		status: v.optional(mortgageStatusValidator),
		mortgageType: v.optional(mortgageTypeValidator),
		address: v.optional(mortgageAddressValidator),
		location: v.optional(mortgageLocationValidator),
		propertyType: v.optional(v.string()),
		appraisalMarketValue: v.optional(v.number()),
		appraisalMethod: v.optional(v.string()),
		appraisalCompany: v.optional(v.string()),
		appraisalDate: v.optional(v.string()),
		ltv: v.optional(v.number()),
		externalMortgageId: v.optional(v.string()),
		borrowerId: v.optional(v.id("borrowers")),
		images: v.optional(v.array(mortgageImageValidator)),
		documents: v.optional(v.array(mortgageDocumentValidator)),
		documentTemplates: v.optional(v.array(mortgageTemplateValidator)),
		priorEncumbrance: v.optional(
			v.object({
				amount: v.number(),
				lender: v.string(),
			})
		),
		asIfAppraisal: v.optional(
			v.object({
				marketValue: v.number(),
				method: v.string(),
				company: v.string(),
				date: v.string(),
			})
		),
	},
	returns: v.id("mortgages"),
	handler: async (ctx, args) => {
		// Validate admin authorization
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		checkRbac({
			required_roles: ["admin"],
			user_identity: identity,
		});

		const result = await updateMortgageCore(ctx, args);

		// Audit log
		console.log("Mortgage updated by admin:", {
			adminId: identity.subject,
			mortgageId: args.mortgageId,
			updates: Object.keys(args).filter((k) => k !== "mortgageId"),
			timestamp: Date.now(),
		});

		return result;
	},
});

/**
 * Internal mutation: Update mortgage (for webhooks, skips auth)
 */
export const updateMortgageInternal = internalMutation({
	args: {
		mortgageId: v.id("mortgages"),
		loanAmount: v.optional(v.number()),
		interestRate: v.optional(v.number()),
		originationDate: v.optional(v.string()),
		maturityDate: v.optional(v.string()),
		status: v.optional(mortgageStatusValidator),
		mortgageType: v.optional(mortgageTypeValidator),
		address: v.optional(mortgageAddressValidator),
		location: v.optional(mortgageLocationValidator),
		propertyType: v.optional(v.string()),
		appraisalMarketValue: v.optional(v.number()),
		appraisalMethod: v.optional(v.string()),
		appraisalCompany: v.optional(v.string()),
		appraisalDate: v.optional(v.string()),
		ltv: v.optional(v.number()),
		externalMortgageId: v.optional(v.string()),
		borrowerId: v.optional(v.id("borrowers")),
		images: v.optional(v.array(mortgageImageValidator)),
		documents: v.optional(v.array(mortgageDocumentValidator)),
	},
	returns: v.id("mortgages"),
	handler: async (ctx, args) => {
		// No auth required - this is called from webhook handlers which authenticate via API key
		return await updateMortgageCore(ctx, args);
	},
});

/**
 * Admin-only: Delete a mortgage and all associated data
 * Includes comprehensive cascade deletion with rollback on failure
 */
export const deleteMortgage = authenticatedMutation({
	args: {
		mortgageId: v.id("mortgages"),
		force: v.optional(v.boolean()),
	},
	returns: v.object({
		mortgageId: v.id("mortgages"),
		deletedCounts: v.object({
			listings: v.number(),
			comparables: v.number(),
			ownership: v.number(),
			payments: v.number(),
		}),
	}),
	handler: async (ctx, args) => {
		// Validate admin authorization
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		checkRbac({
			required_roles: ["admin"],
			user_identity: identity,
		});

		const result = await deleteMortgageCore(ctx, args);

		// Audit log
		const mortgage = await ctx.db.get(args.mortgageId);
		console.log("Mortgage deleted by admin:", {
			adminId: identity.subject,
			mortgageId: args.mortgageId,
			borrowerId: mortgage?.borrowerId,
			deletedCounts: result.deletedCounts,
			timestamp: Date.now(),
		});

		return result;
	},
});

/**
 * Internal mutation: Delete mortgage (for webhooks, skips auth)
 */
export const deleteMortgageInternal = internalMutation({
	args: {
		mortgageId: v.id("mortgages"),
		force: v.optional(v.boolean()),
	},
	returns: v.object({
		mortgageId: v.id("mortgages"),
		deletedCounts: v.object({
			listings: v.number(),
			comparables: v.number(),
			ownership: v.number(),
			payments: v.number(),
		}),
	}),
	handler: async (ctx, args) => await deleteMortgageCore(ctx, args),
});

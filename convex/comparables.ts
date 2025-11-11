/**
 * Appraisal comparable properties management
 * Stores comparable property data for mortgage appraisals
 */

import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { authQuery, authMutation } from "./lib/server";

/**
 * Validator for comparable property data
 */
export const comparablePayloadValidator = v.object({
	address: v.object({
		street: v.string(),
		city: v.string(),
		state: v.string(),
		zip: v.string(),
	}),
	saleAmount: v.number(),
	saleDate: v.string(),
	distance: v.number(),
	squareFeet: v.optional(v.number()),
	bedrooms: v.optional(v.number()),
	bathrooms: v.optional(v.number()),
	propertyType: v.optional(v.string()),
	imageStorageId: v.optional(v.id("_storage")),
});

/**
 * Get all comparables for a mortgage (ordered by distance) with signed URLs for images
 */
export const getComparablesForMortgage = authQuery({
	args: { mortgageId: v.id("mortgages") },
	returns: v.array(v.object({})),
	handler: async (ctx, args) => {
		const comparables = await ctx.db
			.query("appraisal_comparables")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.mortgageId))
			.collect();

		// Fetch signed URLs for comparable images
		const comparablesWithUrls = await Promise.all(
			comparables.map(async (comp) => {
				let imageUrl = null;
				if (comp.imageStorageId) {
					imageUrl = await ctx.storage.getUrl(comp.imageStorageId);
				}
				return {
					...comp,
					imageUrl,
				};
			})
		);

		// Sort by distance (closest first)
		return comparablesWithUrls.sort((a, b) => a.distance - b.distance);
	},
});

/**
 * Get comparables within a specific distance radius
 */
export const getComparablesWithinDistance = authQuery({
	args: {
		mortgageId: v.id("mortgages"),
		maxMiles: v.number(),
	},
	returns: v.array(v.object({})),
	handler: async (ctx, args) => {
		const comparables = await ctx.db
			.query("appraisal_comparables")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.mortgageId))
			.filter((q) => q.lte(q.field("distance"), args.maxMiles))
			.collect();

		// Sort by distance (closest first)
		return comparables.sort((a, b) => a.distance - b.distance);
	},
});

/**
 * Create a comparable record
 */
export const createComparable = authMutation({
	args: {
		mortgageId: v.id("mortgages"),
		address: v.object({
			street: v.string(),
			city: v.string(),
			state: v.string(),
			zip: v.string(),
		}),
		saleAmount: v.number(),
		saleDate: v.string(),
		distance: v.number(),
		squareFeet: v.optional(v.number()),
		bedrooms: v.optional(v.number()),
		bathrooms: v.optional(v.number()),
		propertyType: v.optional(v.string()),
		imageStorageId: v.optional(v.id("_storage")),
	},
	returns: v.id("appraisal_comparables"),
	handler: async (ctx, args) => {
		// Validate numeric constraints
		if (args.saleAmount <= 0) {
			throw new Error("Sale amount must be greater than 0");
		}
		if (args.distance < 0) {
			throw new Error("Distance must be non-negative");
		}
		if (args.squareFeet !== undefined && args.squareFeet <= 0) {
			throw new Error("Square feet must be greater than 0");
		}

		// Validate mortgage exists
		const mortgage = await ctx.db.get(args.mortgageId);
		if (!mortgage) {
			throw new Error("Mortgage not found");
		}

		return await ctx.db.insert("appraisal_comparables", {
			mortgageId: args.mortgageId,
			address: args.address,
			saleAmount: args.saleAmount,
			saleDate: args.saleDate,
			distance: args.distance,
			squareFeet: args.squareFeet,
			bedrooms: args.bedrooms,
			bathrooms: args.bathrooms,
			propertyType: args.propertyType,
			imageStorageId: args.imageStorageId,
		});
	},
});

/**
 * Bulk create comparables for a mortgage (internal)
 */
export const bulkCreateComparables = internalMutation({
	args: {
		mortgageId: v.id("mortgages"),
		comparables: v.array(
			v.object({
				address: v.object({
					street: v.string(),
					city: v.string(),
					state: v.string(),
					zip: v.string(),
				}),
				saleAmount: v.number(),
				saleDate: v.string(),
				distance: v.number(),
				squareFeet: v.optional(v.number()),
				bedrooms: v.optional(v.number()),
				bathrooms: v.optional(v.number()),
				propertyType: v.optional(v.string()),
				imageStorageId: v.optional(v.id("_storage")),
			})
		),
	},
	handler: async (ctx, args) => {
		// Validate mortgage exists
		const mortgage = await ctx.db.get(args.mortgageId);
		if (!mortgage) {
			throw new Error("Mortgage not found");
		}

		// Insert all comparables
		const ids = await Promise.all(
			args.comparables.map((comparable) =>
				ctx.db.insert("appraisal_comparables", {
					mortgageId: args.mortgageId,
					...comparable,
				})
			)
		);

		return ids;
	},
});

/**
 * Update a comparable
 */
export const updateComparable = authMutation({
	args: {
		id: v.id("appraisal_comparables"),
		address: v.optional(
			v.object({
				street: v.string(),
				city: v.string(),
				state: v.string(),
				zip: v.string(),
			})
		),
		saleAmount: v.optional(v.number()),
		saleDate: v.optional(v.string()),
		distance: v.optional(v.number()),
		squareFeet: v.optional(v.number()),
		bedrooms: v.optional(v.number()),
		bathrooms: v.optional(v.number()),
		propertyType: v.optional(v.string()),
		imageStorageId: v.optional(v.id("_storage")),
	},
	returns: v.id("appraisal_comparables"),
	handler: async (ctx, args) => {
		const { id, ...updates } = args;

		// Validate numeric constraints if provided
		if (updates.saleAmount !== undefined && updates.saleAmount <= 0) {
			throw new Error("Sale amount must be greater than 0");
		}
		if (updates.distance !== undefined && updates.distance < 0) {
			throw new Error("Distance must be non-negative");
		}

		await ctx.db.patch(id, updates);
		return id;
	},
});

/**
 * Delete a comparable
 */
export const deleteComparable = authMutation({
	args: { id: v.id("appraisal_comparables") },
	returns: v.id("appraisal_comparables"),
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
		return args.id;
	},
});

/**
 * Get comparables count for a listing (via its mortgage)
 */
export const getComparablesCountForListing = authQuery({
	args: { listingId: v.id("listings") },
	returns: v.number(),
	handler: async (ctx, args) => {
		// Get the listing to find its mortgageId
		const listing = await ctx.db.get(args.listingId);
		if (!listing) {
			return 0;
		}

		// Count comparables for the mortgage
		const comparables = await ctx.db
			.query("appraisal_comparables")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", listing.mortgageId))
			.collect();

		return comparables.length;
	},
});

/**
 * Delete all comparables for a mortgage (for clean replacement)
 */
export const deleteAllComparablesForMortgage = authMutation({
	args: { mortgageId: v.id("mortgages") },
	returns: v.number(),
	handler: async (ctx, args) => {
		const comparables = await ctx.db
			.query("appraisal_comparables")
			.withIndex("by_mortgage", (q) => q.eq("mortgageId", args.mortgageId))
			.collect();

		await Promise.all(comparables.map((c) => ctx.db.delete(c._id)));

		return comparables.length;
	},
});

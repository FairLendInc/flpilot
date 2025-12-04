import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

/**
 * Get a signed URL for a file in Convex storage
 * This is a temporary helper for testing the document viewer with a known file ID
 */
export const getTestDocumentUrl = query({
	args: {},
	returns: v.union(v.string(), v.null()),
	handler: async (ctx) => {
		//Enforce Authorization
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthorized");
		// Use the test PDF file ID
		// Note: This should be replaced with actual document IDs from your database
		const storageId = "kg222733sz1pg4gp3qpy9ca5fd7tneqg" as Id<"_storage">;
		return await ctx.storage.getUrl(storageId);
	},
});

/**
 * Get a signed URL for any file in Convex storage
 */
export const getFileUrl = query({
	args: { storageId: v.id("_storage") },
	returns: v.union(v.string(), v.null()),
	handler: async (ctx, args) => {
		//Enforce Authorization
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthorized");
		return await ctx.storage.getUrl(args.storageId);
	},
});

/**
 * Get file metadata and data for proxying
 * Used by Next.js API routes to avoid signed URL expiration
 */
export const getFile = query({
	args: { storageId: v.id("_storage") },
	returns: v.union(
		v.object({
			signedUrl: v.string(),
			contentType: v.optional(v.string()),
		}),
		v.null()
	),
	handler: async (ctx, args) => {
		//Enforce Authorization
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthorized");

		const signedUrl = await ctx.storage.getUrl(args.storageId);
		if (!signedUrl) {
			return null;
		}

		// Try to get storage metadata
		// Note: Convex doesn't directly expose content type, so we return undefined
		// The API route will try to infer it from the response
		return {
			signedUrl,
			contentType: undefined,
		};
	},
});

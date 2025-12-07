import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { createAuthorizedMutation, createAuthorizedQuery } from "./lib/server";

const authorizedQuery = createAuthorizedQuery(["any"]);
const adminAuthorizedMutation = createAuthorizedMutation(["admin"]);

/**
 * Get all documents for a specific deal
 */
export const getDealDocuments = authorizedQuery({
	args: { dealId: v.id("deals") },
	handler: async (ctx, args) => {
		// RBAC context automatically available
		// TODO: Add more granular RBAC (e.g., only investor or admin can see)

		return await ctx.db
			.query("deal_documents")
			.withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
			.collect();
	},
});

/**
 * Get a single document by ID
 */
export const getDocument = authorizedQuery({
	args: { documentId: v.id("deal_documents") },
	handler: async (ctx, args) => await ctx.db.get(args.documentId),
});

/**
 * Internal mutation to create a deal document record
 * Called by the createDeal action
 */
export const createDealDocumentInternal = internalMutation({
	args: {
		dealId: v.id("deals"),
		documensoDocumentId: v.string(),
		templateId: v.string(),
		templateName: v.string(),
		signatories: v.array(
			v.object({
				role: v.string(),
				name: v.string(),
				email: v.string(),
				id: v.optional(v.number()), // Documenso recipient ID
			})
		),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert("deal_documents", {
			dealId: args.dealId,
			documensoDocumentId: args.documensoDocumentId,
			templateId: args.templateId,
			templateName: args.templateName,
			status: "pending", // Initial status
			signatories: args.signatories.map((s) => ({
				role: s.role || "signer", // Default if missing
				name: s.name,
				email: s.email,
			})),
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

/**
 * Update document status (e.g., from webhook or manual check)
 */
export const updateDocumentStatus = adminAuthorizedMutation({
	args: {
		documentId: v.id("deal_documents"),
		status: v.union(
			v.literal("draft"),
			v.literal("pending"),
			v.literal("signed"),
			v.literal("rejected")
		),
	},
	handler: async (ctx, args) => {
		// const { role } = ctx;
		// if (role !== "admin") {
		// 	throw new Error("Unauthorized");
		// }

		await ctx.db.patch(args.documentId, {
			status: args.status,
			updatedAt: Date.now(),
		});
	},
});

/**
 * Check if all documents for a deal are signed
 */
export const areAllDocumentsSigned = internalQuery({
	args: { dealId: v.id("deals") },
	returns: v.boolean(),
	handler: async (ctx, args) => {
		const documents = await ctx.db
			.query("deal_documents")
			.withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
			.collect();

		if (documents.length === 0) return false;

		return documents.every((doc) => doc.status === "signed");
	},
});

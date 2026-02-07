import { v } from "convex/values";
import { internal } from "./_generated/api";
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

export const getDealDocumentsInternal = internalQuery({
	args: { dealId: v.id("deals") },
	handler: async (ctx, args) =>
		await ctx.db
			.query("deal_documents")
			.withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
			.collect(),
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

		// If status is "signed", trigger check for deal completion
		if (args.status === "signed") {
			const doc = await ctx.db.get(args.documentId);
			if (doc) {
				await ctx.scheduler.runAfter(
					0,
					internal.deals.checkDealDocsCompletion,
					{
						dealId: doc.dealId,
					}
				);
			}
		}
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

/**
 * Internal mutation to update document status
 * Used by sync action to bypass RBAC since source of truth is Documenso
 */
export const updateDocumentStatusInternal = internalMutation({
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
		await ctx.db.patch(args.documentId, {
			status: args.status,
			updatedAt: Date.now(),
		});

		// If status is "signed", trigger check for deal completion
		if (args.status === "signed") {
			const doc = await ctx.db.get(args.documentId);
			if (doc) {
				await ctx.scheduler.runAfter(
					0,
					internal.deals.checkDealDocsCompletion,
					{
						dealId: doc.dealId,
					}
				);
			}
		}
	},
});

import { getDocument as getDocumensoDocument } from "../lib/documenso";
import { authenticatedAction } from "./lib/authorizedFunctions";

/**
 * Sync document status with Documenso
 * Called by client on load to ensure DB is up to date
 */
export const syncDealDocuments = authenticatedAction({
	args: { dealId: v.id("deals") },
	handler: async (ctx, args) => {
		// 1. Get documents for the deal
		// We use runQuery to get the documents via internal query
		const documents = await ctx.runQuery(
			internal.deal_documents.getDealDocumentsInternal,
			{
				dealId: args.dealId,
			}
		);

		let updatedCount = 0;

		for (const doc of documents) {
			if (!doc.documensoDocumentId) continue;
			if (doc.status === "signed") continue; // Already final state

			try {
				const documensoDoc = await getDocumensoDocument(
					doc.documensoDocumentId
				);

				// Map Documenso status to our status
				// Documenso statuses: DRAFT, PENDING, COMPLETED, ARCHIVED/REJECTED?
				let newStatus: "draft" | "pending" | "signed" | "rejected" | null =
					null;

				if (documensoDoc.status === "COMPLETED") {
					newStatus = "signed";
				} else if (documensoDoc.status === "DRAFT") {
					newStatus = "draft";
				} else if (documensoDoc.status === "PENDING") {
					newStatus = "pending";
				}

				if (newStatus && newStatus !== doc.status) {
					console.log(
						`Syncing document ${doc._id}: ${doc.status} -> ${newStatus}`
					);
					await ctx.runMutation(
						internal.deal_documents.updateDocumentStatusInternal,
						{
							documentId: doc._id,
							status: newStatus,
						}
					);
					updatedCount += 1;
				}
			} catch (err) {
				console.error(`Failed to sync document ${doc._id}:`, err);
			}
		}

		return updatedCount;
	},
});

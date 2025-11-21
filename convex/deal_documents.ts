import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { checkRbac } from "../lib/authhelper";

/**
 * Get all documents for a specific deal
 */
export const getDealDocuments = query({
	args: { dealId: v.id("deals") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		// TODO: Add more granular RBAC (e.g., only investor or admin can see)
		// For now, assuming if you have the deal ID and are auth'd, you can see docs
		// Ideally check if user is the investor or an admin

		return await ctx.db
			.query("deal_documents")
			.withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
			.collect();
	},
});

/**
 * Get a single document by ID
 */
export const getDocument = query({
	args: { documentId: v.id("deal_documents") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		return await ctx.db.get(args.documentId);
	},
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
			signatories: args.signatories.map(s => ({
				role: s.role || "signer", // Default if missing
				name: s.name,
				email: s.email
			})),
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

/**
 * Update document status (e.g., from webhook or manual check)
 */
export const updateDocumentStatus = mutation({
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
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		// Only admins or system (via internal mutation wrapper) should update status manually
		// For now, we'll allow it but log it. In production, this might be restricted.
		checkRbac({
			required_roles: ["admin"],
			user_identity: identity,
		});

		await ctx.db.patch(args.documentId, {
			status: args.status,
			updatedAt: Date.now(),
		});
	},
});
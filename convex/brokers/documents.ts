import { v } from "convex/values";
import { components } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import { action } from "../_generated/server";
import {
	type AuthorizedMutationCtx,
	type AuthorizedQueryCtx,
	createAuthorizedMutation,
	createAuthorizedQuery,
} from "../lib/server";

type BrokerDocument = NonNullable<
	NonNullable<Doc<"onboarding_journeys">["context"]["broker"]>["documents"]
>[number];
// ============================================================================
// BROKER DOCUMENT MANAGEMENT WITH FILES-CONTROL COMPONENT
// ============================================================================

// ============================================================================
// UPLOAD OPERATIONS
// ============================================================================

/**
 * Generate a presigned upload URL for broker documents
 * Uses files-control component for secure upload handling
 */
export const generateUploadUrl = createAuthorizedMutation(["any"])({
	args: {
		label: v.string(),
		documentType: v.string(),
	},
	returns: v.object({
		uploadUrl: v.string(),
		storageId: v.string(),
		uploadToken: v.string(),
		uploadTokenExpiresAt: v.number(),
	}),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const userId = ctx.subject;
		if (!userId) {
			throw new Error("Authentication required");
		}

		const journey = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_user", (q) => q.eq("userId", userId as Id<"users">))
			.unique();

		if (!journey || journey.persona !== "broker") {
			throw new Error("Broker journey not found");
		}

		// Generate upload URL via files-control component
		const uploadResult = await ctx.runMutation(
			components.filesControl.upload.generateUploadUrl,
			{
				provider: "convex",
				virtualPath: `broker/${journey._id}/${args.documentType}/${Date.now()}`,
			}
		);

		return {
			uploadUrl: uploadResult.uploadUrl,
			storageId: uploadResult.storageId ?? "",
			uploadToken: uploadResult.uploadToken,
			uploadTokenExpiresAt: uploadResult.uploadTokenExpiresAt,
		};
	},
});

/**
 * Finalize document upload after file is uploaded
 * Adds access keys for broker and admin access
 */
export const finalizeDocumentUpload = createAuthorizedMutation(["any"])({
	args: {
		storageId: v.string(),
		uploadToken: v.string(),
		label: v.string(),
		documentType: v.string(),
		contentType: v.optional(v.string()),
		fileSize: v.optional(v.number()),
	},
	returns: v.object({
		documentId: v.string(),
		storageId: v.string(),
		label: v.string(),
		documentType: v.string(),
		uploadedAt: v.string(),
	}),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const userId = ctx.subject;
		if (!userId) {
			throw new Error("Authentication required");
		}

		const journey = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_user", (q) => q.eq("userId", userId as Id<"users">))
			.unique();

		if (!journey || journey.persona !== "broker") {
			throw new Error("Broker journey not found");
		}

		// Finalize upload with access keys
		const metadata = args.contentType
			? {
					contentType: args.contentType,
					sha256: "",
					size: args.fileSize || 0,
				}
			: undefined;

		await ctx.runMutation(components.filesControl.upload.finalizeUpload, {
			storageId: args.storageId,
			uploadToken: args.uploadToken,
			accessKeys: [journey._id, "admin"],
			virtualPath: `broker/${journey._id}/${args.documentType}/${Date.now()}`,
			metadata,
		});

		// Add document to journey context
		const now = new Date().toISOString();
		const documentEntry: BrokerDocument = {
			storageId: args.storageId as Id<"_storage">,
			label: args.label,
			type: args.documentType,
			uploadedAt: now,
		};

		const existingDocuments: BrokerDocument[] =
			journey.context.broker?.documents ?? [];

		await ctx.db.patch(journey._id, {
			context: {
				...journey.context,
				broker: {
					...journey.context.broker,
					documents: [...existingDocuments, documentEntry],
					adminRequestTimeline: journey.context.broker?.adminRequestTimeline,
					companyInfo: journey.context.broker?.companyInfo,
					licensing: journey.context.broker?.licensing,
					proposedSubdomain: journey.context.broker?.proposedSubdomain,
					representatives: journey.context.broker?.representatives,
				},
			},
		});

		return {
			documentId: args.storageId,
			storageId: args.storageId,
			label: args.label,
			documentType: args.documentType,
			uploadedAt: now,
		};
	},
});

// ============================================================================
// DOWNLOAD OPERATIONS
// ============================================================================

/**
 * Create a secure download grant for a broker document
 */
export const createDownloadGrant = createAuthorizedMutation(["any"])({
	args: {
		storageId: v.string(),
		maxUses: v.optional(v.number()),
		expiresInMinutes: v.optional(v.number()),
	},
	returns: v.object({
		downloadToken: v.string(),
		expiresAt: v.number(),
		maxUses: v.number(),
	}),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const userId = ctx.subject;
		if (!userId) {
			throw new Error("Authentication required");
		}

		const isAdmin =
			ctx.roles?.includes("admin") || ctx.roles?.includes("superadmin");

		const journey = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_user", (q) => q.eq("userId", userId as Id<"users">))
			.unique();

		const hasAccess = isAdmin || journey?.userId === userId;

		if (!hasAccess) {
			throw new Error("Access denied");
		}

		const fileInfo = await ctx.runQuery(
			components.filesControl.queries.getFile,
			{ storageId: args.storageId }
		);

		if (!fileInfo) {
			throw new Error("Document not found");
		}

		const expiresAt = Date.now() + (args.expiresInMinutes || 10) * 60 * 1000;

		const grant = await ctx.runMutation(
			components.filesControl.download.createDownloadGrant,
			{
				storageId: args.storageId,
				maxUses: args.maxUses ?? 1,
				expiresAt,
				shareableLink: false,
			}
		);

		return {
			downloadToken: grant.downloadToken,
			expiresAt: grant.expiresAt ?? expiresAt,
			maxUses: grant.maxUses ?? 1,
		};
	},
});

/**
 * Consume download grant and get download URL
 */
export const consumeDownloadGrant = action({
	args: {
		downloadToken: v.string(),
		accessKey: v.optional(v.string()),
	},
	returns: v.object({
		status: v.string(),
		downloadUrl: v.optional(v.string()),
		error: v.optional(v.string()),
	}),
	handler: async (ctx, args) => {
		const result = await ctx.runMutation(
			components.filesControl.download.consumeDownloadGrantForUrl,
			{
				downloadToken: args.downloadToken,
				accessKey: args.accessKey,
			}
		);

		if (result.status === "ok" && result.downloadUrl) {
			return {
				status: "ok",
				downloadUrl: result.downloadUrl,
			};
		}

		return {
			status: result.status,
			error: `Download failed: ${result.status}`,
		};
	},
});

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

/**
 * Get broker documents with metadata
 */
export const getBrokerDocuments = createAuthorizedQuery(["any"])({
	args: {},
	returns: v.array(
		v.object({
			storageId: v.string(),
			label: v.string(),
			type: v.string(),
			uploadedAt: v.string(),
			virtualPath: v.optional(v.string()),
		})
	),
	handler: async (ctx: AuthorizedQueryCtx) => {
		const userId = ctx.subject;
		if (!userId) {
			return [];
		}

		const journey = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_user", (q) => q.eq("userId", userId as Id<"users">))
			.unique();

		if (!journey || journey.persona !== "broker") {
			return [];
		}

		const documents = journey.context.broker?.documents || [];

		const enrichedDocuments = await Promise.all(
			documents.map(async (doc) => {
				const fileInfo = await ctx.runQuery(
					components.filesControl.queries.getFile,
					{ storageId: doc.storageId }
				);

				return {
					storageId: doc.storageId,
					label: doc.label,
					type: doc.type,
					uploadedAt: doc.uploadedAt,
					virtualPath: fileInfo?.virtualPath ?? undefined,
				};
			})
		);

		return enrichedDocuments;
	},
});

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import {
	searchTemplates,
	getDocument,
	getTemplateDetails,
	generateDocumentFromTemplate,
} from "../lib/documenso";
import { checkRbac } from "../lib/authhelper";

export const searchTemplatesAction = action({
	args: { query: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		// Only admins/brokers should search templates
		checkRbac({
			required_roles: ["admin", "broker", "padmin"],
			user_identity: identity,
		});

		return await searchTemplates(args.query);
	},
});

export const getSigningTokenAction = action({
	args: {
		documentId: v.string(),
		email: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		// Verify the user is requesting token for themselves or is an admin
		// We'll allow admins to get tokens for debugging/support if needed, 
		// but primarily this is for the signer.
		const isSelf = identity.email?.toLowerCase() === args.email.toLowerCase();
		
		// We can't easily check RBAC for admin here without DB access if checkRbac uses DB?
		// checkRbac implementation usually checks the identity's claims or roles.
		// Let's assume checkRbac works with identity object.
		let isAdmin = false;
		try {
			checkRbac({
				required_roles: ["admin"],
				user_identity: identity,
			});
			isAdmin = true;
		} catch (e) {
			isAdmin = false;
		}

		if (!isSelf && !isAdmin) {
			throw new Error("Unauthorized: You can only access your own signing tokens.");
		}

		const document = await getDocument(args.documentId);
		const recipient = document.recipients.find(
			(r) => r.email.toLowerCase() === args.email.toLowerCase()
		);

		if (!recipient) {
			throw new Error("Recipient not found in document");
		}

		return recipient.token;
	},
});

export const getTemplateDetailsAction = action({
	args: { templateId: v.string() },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		checkRbac({
			required_roles: ["admin", "broker", "padmin"],
			user_identity: identity,
		});

		return await getTemplateDetails(args.templateId);
	},
});

export const getDocumentAction = action({
	args: { documentId: v.string() },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		return await getDocument(args.documentId);
	},
});

export const createDocumentFromTemplateAction = action({
	args: {
		dealId: v.id("deals"),
		templateId: v.string(),
		recipients: v.array(
			v.object({
				id: v.number(), // Template recipient ID
				email: v.string(),
				name: v.string(),
				role: v.optional(v.string()),
			})
		),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		checkRbac({
			required_roles: ["admin", "broker", "padmin"],
			user_identity: identity,
		});

		// 1. Get template details to verify and get template name
		const template = await getTemplateDetails(args.templateId);

		// 2. Create document in Documenso
		const document = await generateDocumentFromTemplate({
			templateId: args.templateId,
			recipients: args.recipients,
		});

		// 3. Record in Convex
		// We need to call an internal mutation to write to the DB
		await ctx.runMutation(internal.deal_documents.createDealDocumentInternal, {
			dealId: args.dealId,
			documensoDocumentId: String(document.id),
			templateId: args.templateId,
			templateName: template.title,
			signatories: args.recipients.map((r) => ({
				role: r.role || "signer",
				name: r.name,
				email: r.email,
				id: r.id,
			})),
		});

		return document;
	},
});

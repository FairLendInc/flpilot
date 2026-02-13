import { v } from "convex/values";
import { checkRbac } from "../lib/authhelper";
import {
	generateDocumentFromTemplate,
	getDocument,
	getTemplateDetails,
	searchTemplates,
} from "../lib/documenso";
import { internal } from "./_generated/api";
import { authenticatedAction } from "./lib/authorizedFunctions";

export const searchTemplatesAction = authenticatedAction({
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

export const getSigningTokenAction = authenticatedAction({
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
		} catch (_e) {
			isAdmin = false;
		}

		if (!(isSelf || isAdmin)) {
			throw new Error(
				"Unauthorized: You can only access your own signing tokens."
			);
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

export const getTemplateDetailsAction = authenticatedAction({
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

export const getDocumentAction = authenticatedAction({
	args: { documentId: v.string() },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}

		return await getDocument(args.documentId);
	},
});

export const createDocumentFromTemplateAction = authenticatedAction({
	args: {
		dealId: v.id("deals"),
		templateId: v.string(),
		recipients: v.array(
			v.object({
				id: v.number(), // Template recipient ID
				email: v.string(),
				name: v.string(),
				role: v.optional(
					v.union(
						v.literal("SIGNER"),
						v.literal("APPROVER"),
						v.literal("CC"),
						v.literal("ASSISTANT"),
						v.literal("VIEWER")
					)
				),
			})
		),
		prefillFields: v.optional(
			v.array(
				v.object({
					id: v.number(),
					type: v.union(v.literal("text"), v.literal("number")),
					label: v.optional(v.string()),
					placeholder: v.optional(v.string()),
					value: v.string(),
				})
			)
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
			prefillFields: args.prefillFields,
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

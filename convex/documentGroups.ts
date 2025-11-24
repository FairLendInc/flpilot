import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { createAuthorizedMutation, createAuthorizedQuery } from "./lib/server";

const authenticatedQuery = createAuthorizedQuery(["any"]);
const authenticatedMutation = createAuthorizedMutation(["any"]);

type AuthContextFields = {
	role?: string;
	subject?: string;
};

const DOCUMENT_GROUP_NAME_REGEX = /^[a-zA-Z0-9\s_-]+$/;

type DocumentGroupUpdate = {
	displayName?: string;
	description?: string;
	icon?: string;
	color?: string;
	updatedAt: number;
};

// Create a new document group
export const createDocumentGroup = authenticatedMutation({
	args: {
		name: v.string(),
		displayName: v.string(),
		description: v.optional(v.string()),
		icon: v.optional(v.string()),
		color: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Validate permissions - only admins and brokers can create groups
		const { role, subject } = ctx as typeof ctx & AuthContextFields;
		if (!["admin", "broker"].includes(role as string)) {
			throw new Error(
				"Permission denied: Only admins and brokers can create document groups"
			);
		}

		// Validate name is not empty and reasonable length
		if (!args.name.trim() || args.name.length < 2 || args.name.length > 50) {
			throw new Error("Group name must be between 2 and 50 characters");
		}

		// Validate name contains only allowed characters
		if (!DOCUMENT_GROUP_NAME_REGEX.test(args.name)) {
			throw new Error(
				"Group name can only contain letters, numbers, spaces, hyphens, and underscores"
			);
		}

		// Check if group name already exists
		const existingGroup = await ctx.db
			.query("document_groups")
			.withIndex("by_name", (q) => q.eq("name", args.name.trim().toLowerCase()))
			.first();

		if (existingGroup) {
			throw new Error(`Document group "${args.name}" already exists`);
		}

		const now = Date.now();
		const normalizedGroup = {
			name: args.name.trim().toLowerCase(),
			displayName: args.displayName.trim(),
			description: args.description?.trim(),
			icon: args.icon?.trim(),
			color: args.color?.trim(),
			isDefault: false, // Only system groups are marked as default
			isActive: true,
			createdBy: subject as Id<"users">, // Use subject (user ID) from auth context
			createdAt: now,
			updatedAt: now,
		};

		const groupId = await ctx.db.insert("document_groups", normalizedGroup);

		return { success: true, groupId };
	},
});

// Update an existing document group
export const updateDocumentGroup = authenticatedMutation({
	args: {
		groupId: v.id("document_groups"),
		displayName: v.optional(v.string()),
		description: v.optional(v.string()),
		icon: v.optional(v.string()),
		color: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Validate permissions
		const { role } = ctx as typeof ctx & AuthContextFields;
		if (!["admin", "broker"].includes(role as string)) {
			throw new Error(
				"Permission denied: Only admins and brokers can update document groups"
			);
		}

		const group = await ctx.db.get(args.groupId);
		if (!group) {
			throw new Error("Document group not found");
		}

		// Brokers cannot update system default groups
		if ((role as string) === "broker" && group.isDefault) {
			throw new Error(
				"Permission denied: Brokers cannot update system default groups"
			);
		}

		const updateData: DocumentGroupUpdate = {
			updatedAt: Date.now(),
		};

		if (args.displayName !== undefined) {
			updateData.displayName = args.displayName.trim();
		}
		if (args.description !== undefined) {
			updateData.description = args.description?.trim();
		}
		if (args.icon !== undefined) {
			updateData.icon = args.icon?.trim();
		}
		if (args.color !== undefined) {
			updateData.color = args.color?.trim();
		}

		await ctx.db.patch(args.groupId, updateData);

		return { success: true };
	},
});

// Deactivate a document group (soft delete)
export const deactivateDocumentGroup = authenticatedMutation({
	args: {
		groupId: v.id("document_groups"),
	},
	handler: async (ctx, args) => {
		// Only admins can deactivate groups
		const { role } = ctx as typeof ctx & AuthContextFields;
		if ((role as string) !== "admin") {
			throw new Error(
				"Permission denied: Only admins can deactivate document groups"
			);
		}

		const group = await ctx.db.get(args.groupId);
		if (!group) {
			throw new Error("Document group not found");
		}

		// Cannot deactivate default groups like "Other"
		if (group.isDefault) {
			throw new Error("Cannot deactivate default system groups");
		}

		await ctx.db.patch(args.groupId, {
			isActive: false,
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});

// Get all active document groups
export const getDocumentGroups = authenticatedQuery({
	args: {
		includeInactive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		let groupsQuery = ctx.db.query("document_groups");

		if (!args.includeInactive) {
			groupsQuery = groupsQuery.filter((q) => q.eq(q.field("isActive"), true));
		}

		const groups = await groupsQuery.collect();

		return groups.map((group) => ({
			...group,
			isUserEditable:
				!group.isDefault ||
				((ctx as typeof ctx & AuthContextFields).role as string) === "admin",
			isUserDeletable:
				!group.isDefault &&
				((ctx as typeof ctx & AuthContextFields).role as string) === "admin",
		}));
	},
});

// Get document group by name
export const getDocumentGroupByName = authenticatedQuery({
	args: {
		name: v.string(),
	},
	handler: async (ctx, args) => {
		const normalized_name = args.name.trim().toLowerCase();
		const group = await ctx.db
			.query("document_groups")
			.withIndex("by_name", (q) => q.eq("name", normalized_name))
			.first();

		return group;
	},
});

// Reactivate a document group
export const reactivateDocumentGroup = authenticatedMutation({
	args: {
		groupId: v.id("document_groups"),
	},
	handler: async (ctx, args) => {
		// Only admins can reactivate groups
		const { role } = ctx as typeof ctx & AuthContextFields;
		if ((role as string) !== "admin") {
			throw new Error(
				"Permission denied: Only admins can reactivate document groups"
			);
		}

		const group = await ctx.db.get(args.groupId);
		if (!group) {
			throw new Error("Document group not found");
		}

		await ctx.db.patch(args.groupId, {
			isActive: true,
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});

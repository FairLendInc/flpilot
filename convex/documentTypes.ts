import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
	authenticatedMutation,
	authenticatedQuery,
} from "./lib/authorizedFunctions";

type AuthContextFields = {
	role?: string;
	subject?: string;
};

// Validation rules schema
const validationRulesSchema = v.object({
	maxSize: v.optional(v.number()),
	allowedFormats: v.optional(v.array(v.string())),
	requiredFields: v.optional(v.array(v.string())),
});

const DOCUMENT_TYPE_NAME_REGEX = /^[a-zA-Z0-9\s_-]+$/;

type DocumentTypeUpdate = Partial<
	Pick<
		Doc<"document_types">,
		"displayName" | "description" | "groupName" | "icon" | "validationRules"
	>
> & {
	updatedAt: number;
};

// Create a new document type
export const createDocumentType = authenticatedMutation({
	args: {
		name: v.string(),
		displayName: v.string(),
		description: v.optional(v.string()),
		groupName: v.string(),
		icon: v.optional(v.string()),
		validationRules: v.optional(validationRulesSchema),
	},
	handler: async (ctx, args) => {
		// Validate permissions - only admins and brokers can create types
		const { role, subject } = ctx as typeof ctx & AuthContextFields;
		if (!["admin", "broker"].includes(role as string)) {
			throw new Error(
				"Permission denied: Only admins and brokers can create document types"
			);
		}

		// Validate name is not empty and reasonable length
		if (!args.name.trim() || args.name.length < 2 || args.name.length > 50) {
			throw new Error("Type name must be between 2 and 50 characters");
		}

		// Validate name contains only allowed characters
		if (!DOCUMENT_TYPE_NAME_REGEX.test(args.name)) {
			throw new Error(
				"Type name can only contain letters, numbers, spaces, hyphens, and underscores"
			);
		}

		// Check if group exists and is active
		const groupName = args.groupName.trim().toLowerCase();
		const group = await ctx.db
			.query("document_groups")
			.withIndex("by_name", (q) => q.eq("name", groupName))
			.first();

		if (!group) {
			throw new Error(`Document group "${args.groupName}" not found`);
		}

		if (!group.isActive) {
			throw new Error(`Document group "${args.groupName}" is not active`);
		}

		// Check if type name already exists within the group
		const existingType = await ctx.db
			.query("document_types")
			.withIndex("by_group_name", (q) =>
				q.eq("groupName", groupName).eq("name", args.name.trim().toLowerCase())
			)
			.first();

		if (existingType) {
			throw new Error(
				`Document type "${args.name}" already exists in group "${args.groupName}"`
			);
		}

		// Brokers cannot create types in system-only groups
		if ((role as string) === "broker" && group.isDefault) {
			// Allow brokers to create types in default groups except for system-restricted ones
			const restrictedGroups = ["other"];
			if (restrictedGroups.includes(groupName)) {
				throw new Error(
					`Permission denied: Brokers cannot create types in group "${args.groupName}"`
				);
			}
		}

		const now = Date.now();
		const normalizedType = {
			name: args.name.trim().toLowerCase(),
			displayName: args.displayName.trim(),
			description: args.description?.trim(),
			groupName,
			icon: args.icon?.trim(),
			validationRules: args.validationRules,
			isActive: true,
			createdBy: subject as Id<"users">,
			createdAt: now,
			updatedAt: now,
		};

		const typeId = await ctx.db.insert("document_types", normalizedType);

		return { success: true, typeId };
	},
});

// Update an existing document type
export const updateDocumentType = authenticatedMutation({
	args: {
		typeId: v.id("document_types"),
		displayName: v.optional(v.string()),
		description: v.optional(v.string()),
		groupName: v.optional(v.string()),
		icon: v.optional(v.string()),
		validationRules: v.optional(validationRulesSchema),
	},
	handler: async (ctx, args) => {
		// Validate permissions
		const { role } = ctx as typeof ctx & AuthContextFields;
		if (!["admin", "broker"].includes(role as string)) {
			throw new Error(
				"Permission denied: Only admins and brokers can update document types"
			);
		}

		const type = await ctx.db.get(args.typeId);
		if (!type) {
			throw new Error("Document type not found");
		}

		// Check if type is part of a legacy system type
		const legacyTypes = [
			"appraisal",
			"title",
			"inspection",
			"loan_agreement",
			"insurance",
		];
		if (legacyTypes.includes(type.name) && (role as string) !== "admin") {
			throw new Error(
				"Permission denied: Only admins can update legacy document types"
			);
		}

		const updateData: DocumentTypeUpdate = {
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
		if (args.validationRules !== undefined) {
			updateData.validationRules = args.validationRules;
		}

		// Handle group change
		if (args.groupName !== undefined) {
			const groupName = args.groupName.trim().toLowerCase();

			// Check if new group exists and is active
			const group = await ctx.db
				.query("document_groups")
				.withIndex("by_name", (q) => q.eq("name", groupName))
				.first();

			if (!group) {
				throw new Error(`Document group "${args.groupName}" not found`);
			}

			if (!group.isActive) {
				throw new Error(`Document group "${args.groupName}" is not active`);
			}

			// Check if type name already exists in the target group
			const existingType = await ctx.db
				.query("document_types")
				.withIndex("by_group_name", (q) =>
					q.eq("groupName", groupName).eq("name", type.name)
				)
				.first();

			if (existingType && existingType._id !== args.typeId) {
				throw new Error(
					`Document type "${type.name}" already exists in group "${args.groupName}"`
				);
			}

			updateData.groupName = groupName;
		}

		await ctx.db.patch(args.typeId, updateData);

		return { success: true };
	},
});

// Deactivate a document type (soft delete)
export const deactivateDocumentType = authenticatedMutation({
	args: {
		typeId: v.id("document_types"),
		migrateToTypeId: v.optional(v.id("document_types")),
	},
	handler: async (ctx, args) => {
		// Only admins can deactivate types
		const { role } = ctx as typeof ctx & AuthContextFields;
		if ((role as string) !== "admin") {
			throw new Error(
				"Permission denied: Only admins can deactivate document types"
			);
		}

		const type = await ctx.db.get(args.typeId);
		if (!type) {
			throw new Error("Document type not found");
		}

		// Check if migration target is valid (if provided)
		if (args.migrateToTypeId) {
			const targetType = await ctx.db.get(args.migrateToTypeId);
			if (!targetType) {
				throw new Error("Migration target type not found");
			}
			if (!targetType.isActive) {
				throw new Error("Cannot migrate to inactive document type");
			}
			if (targetType.groupName !== type.groupName) {
				throw new Error("Can only migrate to types within the same group");
			}
		}

		// Note: Document migration would need to be handled at the application level
		// This function just marks the type as inactive

		await ctx.db.patch(args.typeId, {
			isActive: false,
			updatedAt: Date.now(),
		});

		return { success: true, migrateToTypeId: args.migrateToTypeId };
	},
});

// Get document types with optional group filtering
export const getDocumentTypes = authenticatedQuery({
	args: {
		groupName: v.optional(v.string()),
		includeInactive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		let typesQuery = ctx.db.query("document_types");

		// Filter by group if specified
		if (args.groupName) {
			const groupName = args.groupName.trim().toLowerCase();
			typesQuery = typesQuery.filter((q) =>
				q.eq(q.field("groupName"), groupName)
			);
		}

		// Filter by active status
		if (!args.includeInactive) {
			typesQuery = typesQuery.filter((q) => q.eq(q.field("isActive"), true));
		}

		const types = await typesQuery.collect();

		// Attach group information and user permissions
		return await Promise.all(
			types.map(async (type) => {
				const group = await ctx.db
					.query("document_groups")
					.withIndex("by_name", (q) => q.eq("name", type.groupName))
					.first();

				const legacyTypes = [
					"appraisal",
					"title",
					"inspection",
					"loan_agreement",
					"insurance",
				];

				return {
					...type,
					group,
					isUserEditable:
						!legacyTypes.includes(type.name) ||
						((ctx as typeof ctx & AuthContextFields).role as string) ===
							"admin",
					isUserDeletable:
						!legacyTypes.includes(type.name) &&
						((ctx as typeof ctx & AuthContextFields).role as string) ===
							"admin",
				};
			})
		);
	},
});

// Get document type by name
export const getDocumentTypeByName = authenticatedQuery({
	args: {
		name: v.string(),
		groupName: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const name = args.name.trim().toLowerCase();

		let type: Doc<"document_types"> | null = null;
		if (args.groupName) {
			const groupName = args.groupName.trim().toLowerCase();
			type = await ctx.db
				.query("document_types")
				.withIndex("by_group_name", (q) =>
					q.eq("groupName", groupName).eq("name", name)
				)
				.first();
		} else {
			type = await ctx.db
				.query("document_types")
				.withIndex("by_name", (q) => q.eq("name", name))
				.first();
		}

		return type;
	},
});

// Get document types grouped by category
export const getDocumentTypesByGroup = authenticatedQuery({
	args: {
		includeInactive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const typesQuery = ctx.db.query("document_types");

		if (!args.includeInactive) {
			typesQuery.filter((q) => q.eq(q.field("isActive"), true));
		}

		const types = await typesQuery.collect();

		// Group types by their groupName
		const groupedTypes: Record<string, Doc<"document_types">[]> = {};

		for (const type of types) {
			if (!groupedTypes[type.groupName]) {
				groupedTypes[type.groupName] = [];
			}
			groupedTypes[type.groupName].push(type);
		}

		// Attach group information to each group
		const result: Record<
			string,
			{ group: Doc<"document_groups"> | null; types: Doc<"document_types">[] }
		> = {};

		for (const [groupName, typeList] of Object.entries(groupedTypes)) {
			const group = await ctx.db
				.query("document_groups")
				.withIndex("by_name", (q) => q.eq("name", groupName))
				.first();

			result[groupName] = {
				group,
				types: typeList,
			};
		}

		return result;
	},
});

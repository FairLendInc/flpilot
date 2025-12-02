import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalQuery } from "./_generated/server";
import { authenticatedQuery } from "./lib/authorizedFunctions";

type DocumentGroupResolution = {
	group: string;
	displayName: string;
	icon?: string;
	color?: string;
	resolutionMethod: string;
};

// Internal versions for use within Convex functions
export const resolveDocumentGroupInternal = internalQuery({
	args: {
		document: v.optional(
			v.object({
				group: v.optional(v.string()),
				type: v.string(),
				metadata: v.optional(v.any()),
			})
		),
		explicitGroup: v.optional(v.string()),
		documentType: v.optional(v.string()),
		includeInactiveGroups: v.optional(v.boolean()),
	},
	handler: async (ctx, args): Promise<DocumentGroupResolution> => {
		// Priority 1: Explicit group assignment
		if (args.explicitGroup) {
			const normalizedGroup = args.explicitGroup.trim().toLowerCase();
			const group = await ctx.db
				.query("document_groups")
				.withIndex("by_name", (q) => q.eq("name", normalizedGroup))
				.first();

			if (group && (args.includeInactiveGroups || group.isActive)) {
				return {
					group: group.name,
					displayName: group.displayName,
					icon: group.icon,
					color: group.color,
					resolutionMethod: "explicit",
				};
			}
		}

		// Priority 2: Document's explicit group assignment
		if (args.document?.group) {
			const normalizedGroup = args.document.group.trim().toLowerCase();
			const group = await ctx.db
				.query("document_groups")
				.withIndex("by_name", (q) => q.eq("name", normalizedGroup))
				.first();

			if (group && (args.includeInactiveGroups || group.isActive)) {
				return {
					group: group.name,
					displayName: group.displayName,
					icon: group.icon,
					color: group.color,
					resolutionMethod: "document_explicit",
				};
			}
		}

		// Priority 3: Type-based group assignment
		const typeName = args.documentType || args.document?.type;
		if (typeName) {
			const normalizedType = typeName.trim().toLowerCase();

			// Try to find an active document type
			const documentType = await ctx.db
				.query("document_types")
				.withIndex("by_name", (q) => q.eq("name", normalizedType))
				.first();

			if (documentType?.isActive) {
				const group = await ctx.db
					.query("document_groups")
					.withIndex("by_name", (q) => q.eq("name", documentType.groupName))
					.first();

				if (group && (args.includeInactiveGroups || group.isActive)) {
					return {
						group: group.name,
						displayName: group.displayName,
						icon: group.icon,
						color: group.color,
						resolutionMethod: "type_based",
					};
				}
			}

			// Priority 4: Legacy type fallback
			const legacyGroupName = LEGACY_TYPE_TO_GROUP_MAPPING[normalizedType];
			if (legacyGroupName) {
				const group = await ctx.db
					.query("document_groups")
					.withIndex("by_name", (q) => q.eq("name", legacyGroupName))
					.first();

				if (group && (args.includeInactiveGroups || group.isActive)) {
					return {
						group: group.name,
						displayName: group.displayName,
						icon: group.icon,
						color: group.color,
						resolutionMethod: "legacy_fallback",
					};
				}
			}
		}

		// Priority 5: Default to "Other" group
		const otherGroup = await ctx.db
			.query("document_groups")
			.withIndex("by_name", (q) => q.eq("name", "other"))
			.first();

		if (otherGroup) {
			return {
				group: otherGroup.name,
				displayName: otherGroup.displayName,
				icon: otherGroup.icon,
				color: otherGroup.color,
				resolutionMethod: "default_other",
			};
		}

		// Fallback: create a minimal group object if "Other" doesn't exist
		return {
			group: "other",
			displayName: "Other",
			icon: "lucide:file",
			color: "#6B7280",
			resolutionMethod: "emergency_fallback",
		};
	},
});

type LegacyDocumentType = {
	name: string;
	displayName: string;
	description: string;
	groupName: string;
	isActive: boolean;
};

type DocumentTypeWithGroupResult = {
	type: Doc<"document_types"> | LegacyDocumentType | null;
	group: Doc<"document_groups"> | null;
	isLegacy: boolean;
	resolutionMethod: string;
};

export const getDocumentTypeWithGroupInternal = internalQuery({
	args: {
		typeName: v.string(),
		includeInactive: v.optional(v.boolean()),
	},
	handler: async (ctx, args): Promise<DocumentTypeWithGroupResult> => {
		const normalizedType = args.typeName.trim().toLowerCase();

		// Try to find the document type
		const documentType = await ctx.db
			.query("document_types")
			.withIndex("by_name", (q) => q.eq("name", normalizedType))
			.first();

		if (documentType && (args.includeInactive || documentType.isActive)) {
			// Get associated group
			const group = await ctx.db
				.query("document_groups")
				.withIndex("by_name", (q) => q.eq("name", documentType.groupName))
				.first();

			return {
				type: documentType,
				group,
				isLegacy: Object.hasOwn(LEGACY_TYPE_TO_GROUP_MAPPING, normalizedType),
				resolutionMethod: "found",
			};
		}

		// Check if it's a legacy type
		if (Object.hasOwn(LEGACY_TYPE_TO_GROUP_MAPPING, normalizedType)) {
			const legacyGroupName = LEGACY_TYPE_TO_GROUP_MAPPING[normalizedType];
			const group = await ctx.db
				.query("document_groups")
				.withIndex("by_name", (q) => q.eq("name", legacyGroupName))
				.first();

			return {
				type: {
					name: normalizedType,
					displayName: args.typeName,
					description: "Legacy document type",
					groupName: legacyGroupName,
					isActive: true,
				},
				group,
				isLegacy: true,
				resolutionMethod: "legacy_fallback",
			};
		}

		// Type not found
		return {
			type: null,
			group: null,
			isLegacy: false,
			resolutionMethod: "not_found",
		};
	},
});

// Legacy type to group mapping for backward compatibility
const LEGACY_TYPE_TO_GROUP_MAPPING: Record<string, string> = {
	appraisal: "property",
	title: "property",
	inspection: "property",
	loan_agreement: "mortgage",
	insurance: "insurance",
};

// Resolve document group using priority fallback system
export const resolveDocumentGroup = authenticatedQuery({
	args: {
		// Document data from various sources
		document: v.optional(
			v.object({
				group: v.optional(v.string()),
				type: v.string(),
				metadata: v.optional(v.any()),
			})
		),
		// Alternative parameters for different use cases
		explicitGroup: v.optional(v.string()),
		documentType: v.optional(v.string()),
		// Include inactive groups in resolution
		includeInactiveGroups: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		// Priority 1: Explicit group assignment
		if (args.explicitGroup) {
			const normalizedGroup = args.explicitGroup.trim().toLowerCase();
			const group = await ctx.db
				.query("document_groups")
				.withIndex("by_name", (q) => q.eq("name", normalizedGroup))
				.first();

			if (group && (args.includeInactiveGroups || group.isActive)) {
				return {
					group: group.name,
					displayName: group.displayName,
					icon: group.icon,
					color: group.color,
					resolutionMethod: "explicit",
				};
			}
		}

		// Priority 2: Document's explicit group assignment
		if (args.document?.group) {
			const normalizedGroup = args.document.group.trim().toLowerCase();
			const group = await ctx.db
				.query("document_groups")
				.withIndex("by_name", (q) => q.eq("name", normalizedGroup))
				.first();

			if (group && (args.includeInactiveGroups || group.isActive)) {
				return {
					group: group.name,
					displayName: group.displayName,
					icon: group.icon,
					color: group.color,
					resolutionMethod: "document_explicit",
				};
			}
		}

		// Priority 3: Type-based group assignment
		const typeName = args.documentType || args.document?.type;
		if (typeName) {
			const normalizedType = typeName.trim().toLowerCase();

			// Try to find an active document type
			const documentType = await ctx.db
				.query("document_types")
				.withIndex("by_name", (q) => q.eq("name", normalizedType))
				.first();

			if (documentType?.isActive) {
				const group = await ctx.db
					.query("document_groups")
					.withIndex("by_name", (q) => q.eq("name", documentType.groupName))
					.first();

				if (group && (args.includeInactiveGroups || group.isActive)) {
					return {
						group: group.name,
						displayName: group.displayName,
						icon: group.icon,
						color: group.color,
						resolutionMethod: "type_based",
					};
				}
			}

			// Priority 4: Legacy type fallback
			const legacyGroupName = LEGACY_TYPE_TO_GROUP_MAPPING[normalizedType];
			if (legacyGroupName) {
				const group = await ctx.db
					.query("document_groups")
					.withIndex("by_name", (q) => q.eq("name", legacyGroupName))
					.first();

				if (group && (args.includeInactiveGroups || group.isActive)) {
					return {
						group: group.name,
						displayName: group.displayName,
						icon: group.icon,
						color: group.color,
						resolutionMethod: "legacy_fallback",
					};
				}
			}
		}

		// Priority 5: Default to "Other" group
		const otherGroup = await ctx.db
			.query("document_groups")
			.withIndex("by_name", (q) => q.eq("name", "other"))
			.first();

		if (otherGroup) {
			return {
				group: otherGroup.name,
				displayName: otherGroup.displayName,
				icon: otherGroup.icon,
				color: otherGroup.color,
				resolutionMethod: "default_other",
			};
		}

		// Fallback: create a minimal group object if "Other" doesn't exist
		return {
			group: "other",
			displayName: "Other",
			icon: "lucide:file",
			color: "#6B7280",
			resolutionMethod: "emergency_fallback",
		};
	},
});

// Get document type with group information
export const getDocumentTypeWithGroup = authenticatedQuery({
	args: {
		typeName: v.string(),
		includeInactive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const normalizedType = args.typeName.trim().toLowerCase();

		// Try to find the document type
		const documentType = await ctx.db
			.query("document_types")
			.withIndex("by_name", (q) => q.eq("name", normalizedType))
			.first();

		if (documentType && (args.includeInactive || documentType.isActive)) {
			// Get associated group
			const group = await ctx.db
				.query("document_groups")
				.withIndex("by_name", (q) => q.eq("name", documentType.groupName))
				.first();

			return {
				type: documentType,
				group,
				isLegacy: Object.hasOwn(LEGACY_TYPE_TO_GROUP_MAPPING, normalizedType),
				resolutionMethod: "found",
			};
		}

		// Check if it's a legacy type
		if (Object.hasOwn(LEGACY_TYPE_TO_GROUP_MAPPING, normalizedType)) {
			const legacyGroupName = LEGACY_TYPE_TO_GROUP_MAPPING[normalizedType];
			const group = await ctx.db
				.query("document_groups")
				.withIndex("by_name", (q) => q.eq("name", legacyGroupName))
				.first();

			return {
				type: {
					name: normalizedType,
					displayName: args.typeName,
					description: "Legacy document type",
					groupName: legacyGroupName,
					isActive: true,
				},
				group,
				isLegacy: true,
				resolutionMethod: "legacy_fallback",
			};
		}

		// Type not found
		return {
			type: null,
			group: null,
			isLegacy: false,
			resolutionMethod: "not_found",
		};
	},
});

interface BatchResolutionResult extends DocumentGroupResolution {
	documentId: string;
}

// Batch resolve document groups for multiple documents
export const batchResolveDocumentGroups = authenticatedQuery({
	args: {
		documents: v.array(
			v.object({
				id: v.string(),
				group: v.optional(v.string()),
				type: v.string(),
				metadata: v.optional(v.any()),
			})
		),
		includeInactiveGroups: v.optional(v.boolean()),
	},
	handler: async (ctx, args): Promise<BatchResolutionResult[]> => {
		const results: BatchResolutionResult[] = await Promise.all(
			args.documents.map(async (doc): Promise<BatchResolutionResult> => {
				const resolution = await ctx.runQuery(
					internal.documentCategorization.resolveDocumentGroupInternal,
					{
						document: doc,
						includeInactiveGroups: args.includeInactiveGroups,
					}
				);

				return {
					documentId: doc.id,
					...resolution,
				};
			})
		);

		return results;
	},
});

type ValidationResult = {
	isValid: boolean;
	issues: string[];
	recommendations: string[];
};

// Validate document categorization consistency
export const validateDocumentCategorization = authenticatedQuery({
	args: {
		document: v.object({
			group: v.optional(v.string()),
			type: v.string(),
			metadata: v.optional(v.any()),
		}),
	},
	handler: async (ctx, args): Promise<ValidationResult> => {
		const issues: string[] = [];

		// Check if group exists and is active
		if (args.document.group) {
			const normalizedGroup = args.document.group.trim().toLowerCase();
			const group = await ctx.db
				.query("document_groups")
				.withIndex("by_name", (q) => q.eq("name", normalizedGroup))
				.first();

			if (!group) {
				issues.push(`Document group "${args.document.group}" does not exist`);
			} else if (!group.isActive) {
				issues.push(`Document group "${args.document.group}" is inactive`);
			}
		}

		// Check if type exists and is active
		const normalizedType = args.document.type.trim().toLowerCase();
		const documentType = await ctx.db
			.query("document_types")
			.withIndex("by_name", (q) => q.eq("name", normalizedType))
			.first();

		if (!documentType) {
			// Check if it's a legacy type
			if (!Object.hasOwn(LEGACY_TYPE_TO_GROUP_MAPPING, normalizedType)) {
				issues.push(
					`Document type "${args.document.type}" does not exist and is not a legacy type`
				);
			}
		} else if (!documentType.isActive) {
			issues.push(`Document type "${args.document.type}" is inactive`);
		}

		// Check group-type consistency
		if (args.document.group && documentType) {
			const normalizedGroup = args.document.group.trim().toLowerCase();
			if (documentType.groupName !== normalizedGroup) {
				issues.push(
					`Type "${args.document.type}" belongs to group "${documentType.groupName}" but document is assigned to group "${args.document.group}"`
				);
			}
		}

		return {
			isValid: issues.length === 0,
			issues,
			recommendations:
				issues.length > 0
					? [
							"Consider updating document group assignment",
							"Verify document type is correct",
							"Check if group or type needs to be activated",
						]
					: [],
		};
	},
});

type GroupSuggestion = {
	_id: Id<"document_groups">;
	_creationTime: number;
	name: string;
	displayName: string;
	description?: string;
	icon?: string;
	color?: string;
	isDefault?: boolean;
	isActive: boolean;
	createdBy: Id<"users">;
	createdAt: number;
	updatedAt: number;
	isPreferred: boolean;
};

// Get available groups for document type suggestions
export const getDocumentGroupsForSuggestions = authenticatedQuery({
	args: {
		documentType: v.optional(v.string()),
		maxSuggestions: v.optional(v.number()),
	},
	handler: async (ctx, args): Promise<GroupSuggestion[]> => {
		const limit = args.maxSuggestions || 10;

		// If document type is provided, get its group first
		let preferredGroupName: string | null = null;
		if (args.documentType) {
			const typeInfo = await ctx.runQuery(
				internal.documentCategorization.getDocumentTypeWithGroupInternal,
				{
					typeName: args.documentType,
				}
			);
			if (typeInfo.group) {
				preferredGroupName = typeInfo.group.name;
			}
		}

		// Get all active groups
		const groups = await ctx.db
			.query("document_groups")
			.withIndex("by_active", (q) => q.eq("isActive", true))
			.take(limit);

		// Sort groups: preferred group first, then by display name
		groups.sort((a, b) => {
			if (preferredGroupName) {
				if (a.name === preferredGroupName) return -1;
				if (b.name === preferredGroupName) return 1;
			}
			return a.displayName.localeCompare(b.displayName);
		});

		return groups.map((group) => ({
			...group,
			isPreferred: group.name === preferredGroupName,
		}));
	},
});

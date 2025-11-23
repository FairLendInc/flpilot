"use client";

import { api } from "@/convex/_generated/api";
import { useAuthenticatedQuery } from "@/convex/lib/client";

/**
 * Hook to resolve document group using the dynamic categorization system
 */
export function useDocumentGroupResolution(
	document?: {
		group?: string;
		type?: string;
		metadata?: Record<string, unknown>;
	},
	options?: {
		explicitGroup?: string;
		documentType?: string;
		includeInactiveGroups?: boolean;
	}
) {
	return useAuthenticatedQuery(
		api.documentCategorization.resolveDocumentGroup,
		{
			document: document
				? { ...document, type: document.type ?? "" }
				: undefined,
			explicitGroup: options?.explicitGroup,
			documentType: options?.documentType,
			includeInactiveGroups: options?.includeInactiveGroups,
		}
	);
}

/**
 * Hook to get document type with group information
 */
export function useDocumentTypeWithGroup(
	typeName: string,
	includeInactive?: boolean
) {
	return useAuthenticatedQuery(
		api.documentCategorization.getDocumentTypeWithGroup,
		{
			typeName,
			includeInactive,
		}
	);
}

/**
 * Hook to get all available document groups
 */
export function useDocumentGroups(includeInactive?: boolean) {
	return useAuthenticatedQuery(api.documentGroups.getDocumentGroups, {
		includeInactive,
	});
}

/**
 * Hook to get all available document types
 */
export function useDocumentTypes(
	groupName?: string,
	includeInactive?: boolean
) {
	return useAuthenticatedQuery(api.documentTypes.getDocumentTypes, {
		groupName,
		includeInactive,
	});
}

/**
 * Hook to get document types grouped by category
 */
export function useDocumentTypesByGroup(includeInactive?: boolean) {
	return useAuthenticatedQuery(api.documentTypes.getDocumentTypesByGroup, {
		includeInactive,
	});
}

/**
 * Hook to get document group suggestions
 */
export function useDocumentGroupSuggestions(
	documentType?: string,
	maxSuggestions?: number
) {
	return useAuthenticatedQuery(
		api.documentCategorization.getDocumentGroupsForSuggestions,
		{
			documentType,
			maxSuggestions,
		}
	);
}

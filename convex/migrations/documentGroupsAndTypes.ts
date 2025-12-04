import { internalMutation } from "../_generated/server";

// Default document groups for migration
export const DEFAULT_DOCUMENT_GROUPS = [
	{
		name: "mortgage",
		displayName: "Mortgage Documents",
		description: "Core mortgage and loan documents",
		icon: "lucide:home",
		color: "#3B82F6",
		isDefault: true,
	},
	{
		name: "property",
		displayName: "Property Documents",
		description:
			"Property-related documentation including appraisals and titles",
		icon: "lucide:building",
		color: "#10B981",
		isDefault: true,
	},
	{
		name: "insurance",
		displayName: "Insurance Documents",
		description: "Insurance policies and certificates",
		icon: "lucide:shield",
		color: "#F59E0B",
		isDefault: true,
	},
	{
		name: "legal",
		displayName: "Legal Documents",
		description: "Legal agreements and contracts",
		icon: "lucide:scale",
		color: "#8B5CF6",
		isDefault: true,
	},
	{
		name: "financial",
		displayName: "Financial Documents",
		description: "Financial statements and reports",
		icon: "lucide:dollar-sign",
		color: "#EF4444",
		isDefault: true,
	},
	{
		name: "other",
		displayName: "Other",
		description: "Uncategorized documents",
		icon: "lucide:file",
		color: "#6B7280",
		isDefault: true,
	},
];

// Default document types mapped to groups
export const DEFAULT_DOCUMENT_TYPES = [
	// Mortgage Documents
	{
		name: "loan_agreement",
		displayName: "Loan Agreement",
		description: "Mortgage loan agreement and terms",
		groupName: "mortgage",
		icon: "lucide:file-text",
	},
	{
		name: "mortgage_statement",
		displayName: "Mortgage Statement",
		description: "Periodic mortgage account statements",
		groupName: "mortgage",
		icon: "lucide:receipt",
	},
	{
		name: "promissory_note",
		displayName: "Promissory Note",
		description: "Promise to repay loan document",
		groupName: "mortgage",
		icon: "lucide:pen-tool",
	},

	// Property Documents
	{
		name: "appraisal",
		displayName: "Property Appraisal",
		description: "Professional property valuation report",
		groupName: "property",
		icon: "lucide:clipboard-list",
	},
	{
		name: "title",
		displayName: "Title Document",
		description: "Property title and ownership documents",
		groupName: "property",
		icon: "lucide:file-check",
	},
	{
		name: "inspection",
		displayName: "Property Inspection",
		description: "Property condition inspection report",
		groupName: "property",
		icon: "lucide:search",
	},
	{
		name: "property_survey",
		displayName: "Property Survey",
		description: "Land survey and boundary documentation",
		groupName: "property",
		icon: "lucide:map",
	},

	// Insurance Documents
	{
		name: "insurance",
		displayName: "Insurance Policy",
		description: "Property insurance policy documents",
		groupName: "insurance",
		icon: "lucide:shield-check",
	},
	{
		name: "insurance_certificate",
		displayName: "Insurance Certificate",
		description: "Proof of insurance coverage",
		groupName: "insurance",
		icon: "lucide:certificate",
	},

	// Legal Documents
	{
		name: "purchase_agreement",
		displayName: "Purchase Agreement",
		description: "Real estate purchase contract",
		groupName: "legal",
		icon: "lucide:handshake",
	},
	{
		name: "closing_disclosure",
		displayName: "Closing Disclosure",
		description: "Final loan terms and closing costs",
		groupName: "legal",
		icon: "lucide:file-certificate",
	},

	// Financial Documents
	{
		name: "tax_return",
		displayName: "Tax Return",
		description: "Income tax return documents",
		groupName: "financial",
		icon: "lucide:calculator",
	},
	{
		name: "bank_statement",
		displayName: "Bank Statement",
		description: "Bank account statements",
		groupName: "financial",
		icon: "lucide:credit-card",
	},
	{
		name: "proof_of_income",
		displayName: "Proof of Income",
		description: "Income verification documents",
		groupName: "financial",
		icon: "lucide:trending-up",
	},
];

// Migration function to create default groups
export const migrateDefaultGroups = internalMutation({
	args: {},
	handler: async (ctx) => {
		const existingGroups = await ctx.db.query("document_groups").collect();

		if (existingGroups.length > 0) {
			console.log("Document groups already exist, skipping migration");
			return;
		}

		const now = Date.now();
		const systemUser = await ctx.db.query("users").first();

		if (!systemUser) {
			throw new Error("No user found to assign as creator for default groups");
		}

		for (const groupData of DEFAULT_DOCUMENT_GROUPS) {
			await ctx.db.insert("document_groups", {
				name: groupData.name,
				displayName: groupData.displayName,
				description: groupData.description,
				icon: groupData.icon,
				color: groupData.color,
				isDefault: groupData.isDefault,
				isActive: true,
				createdBy: systemUser._id,
				createdAt: now,
				updatedAt: now,
			});
		}

		console.log(
			`Created ${DEFAULT_DOCUMENT_GROUPS.length} default document groups`
		);
	},
});

// Migration function to create default types
export const migrateDefaultTypes = internalMutation({
	args: {},
	handler: async (ctx) => {
		const existingTypes = await ctx.db.query("document_types").collect();

		if (existingTypes.length > 0) {
			console.log("Document types already exist, skipping migration");
			return;
		}

		const now = Date.now();
		const systemUser = await ctx.db.query("users").first();

		if (!systemUser) {
			throw new Error("No user found to assign as creator for default types");
		}

		for (const typeData of DEFAULT_DOCUMENT_TYPES) {
			await ctx.db.insert("document_types", {
				name: typeData.name,
				displayName: typeData.displayName,
				description: typeData.description,
				groupName: typeData.groupName,
				icon: typeData.icon,
				isActive: true,
				createdBy: systemUser._id,
				createdAt: now,
				updatedAt: now,
			});
		}

		console.log(
			`Created ${DEFAULT_DOCUMENT_TYPES.length} default document types`
		);
	},
});

// Legacy type to group mapping for backward compatibility
export const LEGACY_TYPE_TO_GROUP_MAPPING: Record<string, string> = {
	appraisal: "property",
	title: "property",
	inspection: "property",
	loan_agreement: "mortgage",
	insurance: "insurance",
};

// Get group for legacy document type
export const getGroupForLegacyType = (type: string): string =>
	LEGACY_TYPE_TO_GROUP_MAPPING[type] || "other";

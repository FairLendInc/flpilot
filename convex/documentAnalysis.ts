import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery } from "./_generated/server";
import { createAuthorizedMutation } from "./lib/server";

const authenticatedMutation = createAuthorizedMutation(["any"]);

// Document analysis result interfaces
export type DocumentContentAnalysis = {
	extractedText?: string;
	detectedLanguage?: string;
	keywordDensity: Record<string, number>;
	documentMetadata: {
		title?: string;
		author?: string;
		subject?: string;
		createdDate?: string;
		modifiedDate?: string;
		pageCount?: number;
		wordCount?: number;
	};
	contentFeatures: ContentFeatures;
	confidenceScore: number;
};

export type ContentFeatures = {
	hasTables: boolean;
	hasImages: boolean;
	hasSignatures: boolean;
	hasDates: boolean;
	hasMonetaryValues: boolean;
	hasLegalLanguage: boolean;
	hasPropertyAddresses: boolean;
	hasLoanNumbers: boolean;
	hasInsurancePolicyNumbers: boolean;
	documentStructure: "simple" | "structured" | "complex";
};

export type TypeSuggestion = {
	type: string;
	displayName: string;
	groupName: string;
	groupDisplayName: string;
	confidenceScore: number;
	reasoning: string[];
	matchedFeatures: string[];
};

export type FilenameAnalysis = {
	patterns: FilenamePattern[];
	suggestedTypes: string[];
	confidenceScore: number;
};

export type FilenamePattern = {
	pattern: string;
	weight: number;
	matchedTerms: string[];
	suggestedType: string;
};

const WHITESPACE_SPLIT_REGEX = /\s+/;
const TABLE_DETECTION_REGEX = /\|.*\||\n-{3,}|\n\s*\|/;
const IMAGE_DETECTION_REGEX = /\[image\]|<img|picture|photo/i;
const SIGNATURE_DETECTION_REGEX = /signature|signed|sign here/i;
const DATE_DETECTION_REGEX =
	/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}/;
const MONETARY_VALUE_REGEX = /\$\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/;
const LEGAL_LANGUAGE_REGEX =
	/hereby|whereas|notwithstanding|pursuant to|in witness whereof/i;
const PROPERTY_ADDRESS_REGEX =
	/\d+\s+[\w\s]+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)/i;
const LOAN_NUMBER_REGEX = /loan\s+#|loan\s+number|account\s+#|mortgage\s+#/i;
const INSURANCE_POLICY_REGEX = /policy\s+#|policy\s+number|insurance\s+#/i;
const HASH_HEADER_REGEX = /^#{1,6}\s+/m;
const COLON_HEADER_REGEX = /\n[A-Z][^.]*:/;
const MULTIPLE_SECTION_REGEX = /\n\s*\n/;
const BULLET_LIST_REGEX = /^\s*[-*•]\s+/m;
const NUMBERED_LIST_REGEX = /^\s*\d+\.\s+/m;
const LOAN_TERMS_REGEX = /interest.*rate|principal|borrower|lender/;
const INSURANCE_TERMS_REGEX = /policy.*number|coverage|premium/;
const LEGAL_DESCRIPTION_REGEX =
	/legal.*description|property.*description|ownership/;
const INSPECTION_TERMS_REGEX = /inspection|condition|defect|repair/;

// Type-specific keywords and patterns for content analysis
const TYPE_KEYWORDS: Record<
	string,
	{ keywords: string[]; patterns: RegExp[]; weight: number }
> = {
	appraisal: {
		keywords: [
			"appraisal",
			"property value",
			"market value",
			"comparable",
			"valuation",
			"assessment",
			"fair market value",
		],
		patterns: [/appraisal/i, /property value/i, /market value/i, /comparable/i],
		weight: 1.0,
	},
	title: {
		keywords: [
			"title",
			"deed",
			"ownership",
			"property title",
			"legal description",
			"chain of title",
		],
		patterns: [/title report/i, /deed/i, /ownership/i, /legal description/i],
		weight: 1.0,
	},
	inspection: {
		keywords: [
			"inspection",
			"property inspection",
			"home inspection",
			"defects",
			"repairs",
			"structural",
		],
		patterns: [/inspection report/i, /home inspection/i, /property condition/i],
		weight: 1.0,
	},
	loan_agreement: {
		keywords: [
			"loan agreement",
			"mortgage",
			"promissory note",
			"interest rate",
			"principal",
			"amortization",
			"borrower",
			"lender",
		],
		patterns: [
			/loan agreement/i,
			/mortgage agreement/i,
			/promissory note/i,
			/note and deed of trust/i,
		],
		weight: 1.0,
	},
	insurance: {
		keywords: [
			"insurance",
			"policy",
			"coverage",
			"premium",
			"deductible",
			"claim",
			"property insurance",
			"hazard insurance",
		],
		patterns: [
			/insurance policy/i,
			/policy number/i,
			/certificate of insurance/i,
			/declarations page/i,
		],
		weight: 1.0,
	},
	tax_document: {
		keywords: [
			"tax",
			"property tax",
			"tax bill",
			"assessment",
			"tax statement",
			"irs",
		],
		patterns: [/tax bill/i, /property tax/i, /tax statement/i, /form \d+/i],
		weight: 0.9,
	},
	bank_statement: {
		keywords: [
			"bank statement",
			"account statement",
			"balance",
			"transaction",
			"deposit",
			"withdrawal",
		],
		patterns: [
			/bank statement/i,
			/account statement/i,
			/statement of account/i,
		],
		weight: 0.9,
	},
	pay_stub: {
		keywords: [
			"pay stub",
			"paycheck",
			"earnings",
			"gross pay",
			"net pay",
			"year to date",
		],
		patterns: [/pay stub/i, /earnings statement/i, /pay advice/i],
		weight: 0.9,
	},
	identity_document: {
		keywords: [
			"driver license",
			"passport",
			"state id",
			"identification",
			"birth certificate",
		],
		patterns: [/driver license/i, /passport/i, /state id/i, /identification/i],
		weight: 0.8,
	},
	closing_disclosure: {
		keywords: [
			"closing disclosure",
			"cd",
			"loan estimate",
			"settlement statement",
			"hud",
			"closing costs",
		],
		patterns: [
			/closing disclosure/i,
			/loan estimate/i,
			/settlement statement/i,
			/hud-1/i,
		],
		weight: 1.0,
	},
};

// Filename pattern analysis
const FILENAME_PATTERNS: Array<{
	pattern: RegExp;
	weight: number;
	suggestedType: string;
	description: string;
}> = [
	{
		pattern: /appraisal/i,
		weight: 1.0,
		suggestedType: "appraisal",
		description: "Contains appraisal keywords",
	},
	{
		pattern: /title|deed/i,
		weight: 1.0,
		suggestedType: "title",
		description: "Contains title/deed keywords",
	},
	{
		pattern: /inspection/i,
		weight: 1.0,
		suggestedType: "inspection",
		description: "Contains inspection keywords",
	},
	{
		pattern: /loan|mortgage|note/i,
		weight: 0.9,
		suggestedType: "loan_agreement",
		description: "Contains loan/mortgage keywords",
	},
	{
		pattern: /insurance|policy|coverage/i,
		weight: 0.9,
		suggestedType: "insurance",
		description: "Contains insurance keywords",
	},
	{
		pattern: /tax|assessment/i,
		weight: 0.8,
		suggestedType: "tax_document",
		description: "Contains tax keywords",
	},
	{
		pattern: /bank|statement/i,
		weight: 0.8,
		suggestedType: "bank_statement",
		description: "Contains banking keywords",
	},
	{
		pattern: /pay_stub|paycheck|earnings/i,
		weight: 0.8,
		suggestedType: "pay_stub",
		description: "Contains payroll keywords",
	},
	{
		pattern: /closing|cd|settlement/i,
		weight: 0.9,
		suggestedType: "closing_disclosure",
		description: "Contains closing keywords",
	},
];

// Analyze document filename for type suggestions
export const analyzeFilename = internalQuery({
	args: {
		filename: v.string(),
		extension: v.optional(v.string()),
	},
	handler: async (_ctx, args): Promise<FilenameAnalysis> => {
		const filename = args.filename.toLowerCase();
		const _extension = args.extension || filename.split(".").pop() || "";

		const matchedPatterns: FilenamePattern[] = [];
		const suggestedTypes: string[] = [];
		let totalWeight = 0;

		// Analyze filename patterns
		for (const patternInfo of FILENAME_PATTERNS) {
			if (patternInfo.pattern.test(filename)) {
				const matches = filename.match(patternInfo.pattern);
				const matchedTerms = matches ? [matches[0]] : [];
				matchedPatterns.push({
					pattern: patternInfo.pattern.source,
					weight: patternInfo.weight,
					matchedTerms,
					suggestedType: patternInfo.suggestedType,
				});

				suggestedTypes.push(patternInfo.suggestedType);
				totalWeight += patternInfo.weight;
			}
		}

		// Check file extension for additional clues
		const _extensionClues: Record<string, string> = {
			pdf: "document",
			doc: "document",
			docx: "document",
			xls: "spreadsheet",
			xlsx: "spreadsheet",
			jpg: "image",
			jpeg: "image",
			png: "image",
			tiff: "image",
		};

		// Calculate confidence score
		const confidenceScore = Math.min(totalWeight / 2, 1.0); // Normalize to 0-1

		return {
			patterns: matchedPatterns,
			suggestedTypes: Array.from(new Set(suggestedTypes)), // Remove duplicates
			confidenceScore,
		};
	},
});

// Analyze document content for intelligent type suggestions
export const analyzeDocumentContent = internalQuery({
	args: {
		content: v.optional(v.string()),
		filename: v.string(),
		metadata: v.optional(v.any()),
		userId: v.id("users"),
	},
	handler: async (_ctx, args): Promise<DocumentContentAnalysis> => {
		const content = args.content || "";
		const filename = args.filename.toLowerCase();

		// Extract basic metadata
		const documentMetadata = {
			title: args.metadata?.title || filename,
			author: args.metadata?.author,
			subject: args.metadata?.subject,
			createdDate: args.metadata?.createdDate,
			modifiedDate: args.metadata?.modifiedDate,
			pageCount: args.metadata?.pageCount,
			wordCount: content
				.split(WHITESPACE_SPLIT_REGEX)
				.filter((word) => word.length > 0).length,
		};

		// Analyze content features
		const contentFeatures = analyzeContentFeatures(content);

		// Calculate keyword density
		const keywordDensity = calculateKeywordDensity(content);

		// Detect language (basic implementation)
		const detectedLanguage = detectLanguage(content);

		// Calculate overall confidence score
		const confidenceScore = calculateContentConfidence(
			content,
			filename,
			contentFeatures
		);

		return {
			extractedText: content.substring(0, 1000), // Store first 1000 chars for analysis
			detectedLanguage,
			keywordDensity,
			documentMetadata,
			contentFeatures,
			confidenceScore,
		};
	},
});

// Generate intelligent type suggestions based on analysis
export const generateTypeSuggestions = internalQuery({
	args: {
		contentAnalysis: v.object({
			extractedText: v.optional(v.string()),
			keywordDensity: v.record(v.string(), v.number()),
			documentMetadata: v.object({
				title: v.optional(v.string()),
				author: v.optional(v.string()),
				subject: v.optional(v.string()),
				createdDate: v.optional(v.string()),
				modifiedDate: v.optional(v.string()),
				pageCount: v.optional(v.number()),
				wordCount: v.optional(v.number()),
			}),
			contentFeatures: v.object({
				hasTables: v.boolean(),
				hasImages: v.boolean(),
				hasSignatures: v.boolean(),
				hasDates: v.boolean(),
				hasMonetaryValues: v.boolean(),
				hasLegalLanguage: v.boolean(),
				hasPropertyAddresses: v.boolean(),
				hasLoanNumbers: v.boolean(),
				hasInsurancePolicyNumbers: v.boolean(),
				documentStructure: v.union(
					v.literal("simple"),
					v.literal("structured"),
					v.literal("complex")
				),
			}),
			confidenceScore: v.number(),
		}),
		filenameAnalysis: v.object({
			patterns: v.array(
				v.object({
					pattern: v.string(),
					weight: v.number(),
					matchedTerms: v.array(v.string()),
					suggestedType: v.string(),
				})
			),
			suggestedTypes: v.array(v.string()),
			confidenceScore: v.number(),
		}),
		maxSuggestions: v.optional(v.number()),
	},
	handler: async (ctx, args): Promise<TypeSuggestion[]> => {
		const maxSuggestions = args.maxSuggestions || 3;
		const suggestions: TypeSuggestion[] = [];

		const { contentAnalysis, filenameAnalysis } = args;

		// Get all active document types
		const allDocumentTypes = await ctx.db.query("document_types").collect();

		const documentTypes = allDocumentTypes.filter((type) => type.isActive);

		// Get document groups
		const allDocumentGroups = await ctx.db.query("document_groups").collect();

		const documentGroups = allDocumentGroups.filter((group) => group.isActive);

		// Create group lookup map
		const groupMap = new Map(
			documentGroups.map((group) => [group.name, group])
		);

		// Score each document type
		for (const docType of documentTypes) {
			const score = calculateTypeScore(
				docType.name,
				contentAnalysis,
				filenameAnalysis
			);

			if (score.confidenceScore > 0.1) {
				// Only include types with meaningful scores
				const group = groupMap.get(docType.groupName);
				if (group) {
					suggestions.push({
						type: docType.name,
						displayName: docType.displayName,
						groupName: docType.groupName,
						groupDisplayName: group.displayName,
						confidenceScore: score.confidenceScore,
						reasoning: score.reasoning,
						matchedFeatures: score.matchedFeatures,
					});
				}
			}
		}

		// Sort by confidence score and return top suggestions
		return suggestions
			.sort((a, b) => b.confidenceScore - a.confidenceScore)
			.slice(0, maxSuggestions);
	},
});

// User preference settings for automatic type assignment
export const getUserAutoAssignmentSettings = internalQuery({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		return {
			autoAssignmentEnabled: user?.preferences?.autoDocumentTypeAssignment,
			confidenceThreshold: user?.preferences?.autoAssignmentThreshold || 0.8,
			requireConfirmation: true,
		};
	},
});

// Update user's auto-assignment settings
export const updateAutoAssignmentSettings = internalMutation({
	args: {
		userId: v.id("users"),
		autoAssignmentEnabled: v.boolean(),
		confidenceThreshold: v.number(),
		requireConfirmation: v.boolean(),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		if (!user) {
			throw new Error("User not found");
		}

		const currentPreferences = user.preferences || {};
		const updatedPreferences = {
			...currentPreferences,
			autoDocumentTypeAssignment: args.autoAssignmentEnabled,
			autoAssignmentThreshold: args.confidenceThreshold,
			requireConfirmationForAutoAssignment: args.requireConfirmation,
		};

		await ctx.db.patch(args.userId, {
			preferences: updatedPreferences,
			updated_at: new Date().toISOString(),
		});

		return { success: true };
	},
});

// Helper functions

function analyzeContentFeatures(content: string): ContentFeatures {
	return {
		hasTables: TABLE_DETECTION_REGEX.test(content),
		hasImages: IMAGE_DETECTION_REGEX.test(content),
		hasSignatures: SIGNATURE_DETECTION_REGEX.test(content),
		hasDates: DATE_DETECTION_REGEX.test(content),
		hasMonetaryValues: MONETARY_VALUE_REGEX.test(content),
		hasLegalLanguage: LEGAL_LANGUAGE_REGEX.test(content),
		hasPropertyAddresses: PROPERTY_ADDRESS_REGEX.test(content),
		hasLoanNumbers: LOAN_NUMBER_REGEX.test(content),
		hasInsurancePolicyNumbers: INSURANCE_POLICY_REGEX.test(content),
		documentStructure: analyzeDocumentStructure(content),
	};
}

function analyzeDocumentStructure(
	content: string
): "simple" | "structured" | "complex" {
	const hasHeaders =
		HASH_HEADER_REGEX.test(content) || COLON_HEADER_REGEX.test(content);
	const hasMultipleSections =
		MULTIPLE_SECTION_REGEX.test(content) && content.length > 500;
	const hasLists =
		BULLET_LIST_REGEX.test(content) || NUMBERED_LIST_REGEX.test(content);

	if (hasHeaders && hasMultipleSections && hasLists) {
		return "complex";
	}
	if (hasHeaders || hasMultipleSections) {
		return "structured";
	}
	return "simple";
}

function calculateKeywordDensity(content: string): Record<string, number> {
	const words = content.toLowerCase().split(WHITESPACE_SPLIT_REGEX);
	const wordCount = words.length;
	const density: Record<string, number> = {};

	// Count occurrences of important keywords
	const importantWords = [
		"appraisal",
		"title",
		"inspection",
		"loan",
		"mortgage",
		"insurance",
		"tax",
		"property",
		"policy",
		"agreement",
	];

	for (const word of importantWords) {
		const count = words.filter((w) => w.includes(word)).length;
		density[word] = wordCount > 0 ? count / wordCount : 0;
	}

	return density;
}

function detectLanguage(content: string): string {
	// Simple language detection based on common words
	const englishWords = [
		"the",
		"and",
		"or",
		"but",
		"in",
		"on",
		"at",
		"to",
		"for",
		"of",
		"with",
		"by",
	];
	const words = content
		.toLowerCase()
		.split(WHITESPACE_SPLIT_REGEX)
		.slice(0, 100); // Check first 100 words
	const englishWordCount = words.filter((word) =>
		englishWords.includes(word)
	).length;

	return englishWordCount / words.length > 0.1 ? "en" : "unknown";
}

function calculateContentConfidence(
	content: string,
	_filename: string,
	features: ContentFeatures
): number {
	let confidence = 0;

	// Content length contributes to confidence
	if (content.length > 100) confidence += 0.1;
	if (content.length > 500) confidence += 0.1;
	if (content.length > 1000) confidence += 0.1;

	// Meaningful features increase confidence
	if (features.hasLegalLanguage) confidence += 0.2;
	if (features.hasDates) confidence += 0.1;
	if (features.hasMonetaryValues) confidence += 0.1;
	if (features.hasPropertyAddresses) confidence += 0.2;

	return Math.min(confidence, 1.0);
}

function calculateTypeScore(
	typeName: string,
	contentAnalysis: DocumentContentAnalysis,
	filenameAnalysis: FilenameAnalysis
): { confidenceScore: number; reasoning: string[]; matchedFeatures: string[] } {
	const normalizedTypeName = typeName.toLowerCase();
	const typeInfo = TYPE_KEYWORDS[normalizedTypeName];

	if (!typeInfo) {
		return { confidenceScore: 0, reasoning: [], matchedFeatures: [] };
	}

	let score = 0;
	const reasoning: string[] = [];
	const matchedFeatures: string[] = [];

	// Check keyword matches
	const keywordMatches = typeInfo.keywords.filter((keyword) =>
		contentAnalysis.extractedText?.toLowerCase().includes(keyword)
	);

	if (keywordMatches.length > 0) {
		score += (keywordMatches.length / typeInfo.keywords.length) * 0.4;
		reasoning.push(
			`Found ${keywordMatches.length} relevant keywords: ${keywordMatches.join(", ")}`
		);
		matchedFeatures.push("keyword_match");
	}

	// Check pattern matches
	const patternMatches = typeInfo.patterns.filter((pattern) =>
		pattern.test(contentAnalysis.extractedText || "")
	);

	if (patternMatches.length > 0) {
		score += (patternMatches.length / typeInfo.patterns.length) * 0.3;
		reasoning.push(`Matched ${patternMatches.length} document patterns`);
		matchedFeatures.push("pattern_match");
	}

	// Check filename matches
	const filenameScore = filenameAnalysis.suggestedTypes.includes(
		normalizedTypeName
	)
		? 0.2
		: 0;
	if (filenameScore > 0) {
		score += filenameScore;
		reasoning.push("Filename contains relevant terms");
		matchedFeatures.push("filename_match");
	}

	// Feature-based scoring
	const { contentFeatures } = contentAnalysis;

	// Type-specific feature scoring
	if (
		["loan_agreement", "mortgage"].includes(normalizedTypeName) &&
		contentFeatures.hasMonetaryValues
	) {
		score += 0.1;
		reasoning.push("Contains monetary values typical of loan documents");
		matchedFeatures.push("monetary_values");
	}

	if (
		["title", "deed"].includes(normalizedTypeName) &&
		contentFeatures.hasLegalLanguage
	) {
		score += 0.1;
		reasoning.push("Contains legal language typical of title documents");
		matchedFeatures.push("legal_language");
	}

	if (
		["appraisal", "inspection"].includes(normalizedTypeName) &&
		contentFeatures.hasPropertyAddresses
	) {
		score += 0.1;
		reasoning.push("Contains property addresses");
		matchedFeatures.push("property_addresses");
	}

	return {
		confidenceScore: Math.min(score * typeInfo.weight, 1.0),
		reasoning,
		matchedFeatures,
	};
}

// Automatic type assignment with confidence threshold validation
export const autoAssignDocumentType = authenticatedMutation({
	args: {
		filename: v.string(),
		content: v.optional(v.string()),
		metadata: v.optional(v.any()),
		forceAssignment: v.optional(v.boolean()), // Override user preference for testing
	},
	handler: async (
		ctx,
		args
	): Promise<{
		autoAssigned: boolean;
		reason?: string;
		suggestedType: TypeSuggestion | null;
		confidenceScore?: number;
		reasoning?: string[];
		matchedFeatures?: string[];
		requireConfirmation?: boolean;
		allSuggestions?: TypeSuggestion[];
	}> => {
		// Get user's auto-assignment settings
		const settings = await ctx.runQuery(
			internal.documentAnalysis.getUserAutoAssignmentSettings,
			{
				userId: (ctx as typeof ctx & { subject?: string })
					.subject as Id<"users">,
			}
		);

		// Check if auto-assignment is enabled
		if (!(settings.autoAssignmentEnabled || args.forceAssignment)) {
			return {
				autoAssigned: false,
				reason: "Auto-assignment is disabled in user preferences",
				suggestedType: null,
			};
		}

		// Perform content analysis
		const contentAnalysis: DocumentContentAnalysis = await ctx.runQuery(
			internal.documentAnalysis.analyzeDocumentContent,
			{
				content: args.content,
				filename: args.filename,
				metadata: args.metadata,
				userId: (ctx as typeof ctx & { subject?: string })
					.subject as Id<"users">,
			}
		);

		// Analyze filename
		const filenameAnalysis = await ctx.runQuery(
			internal.documentAnalysis.analyzeFilename,
			{
				filename: args.filename,
			}
		);

		// Generate type suggestions
		const suggestions: TypeSuggestion[] = await ctx.runQuery(
			internal.documentAnalysis.generateTypeSuggestions,
			{
				contentAnalysis,
				filenameAnalysis,
				maxSuggestions: 1, // We only want the top suggestion for auto-assignment
			}
		);

		// Check if we have a confident suggestion
		if (suggestions.length === 0) {
			return {
				autoAssigned: false,
				reason: "No suitable document type suggestions found",
				suggestedType: null,
			};
		}

		const topSuggestion: TypeSuggestion = suggestions[0];
		const confidenceThreshold: number = args.forceAssignment
			? 0.5
			: settings.confidenceThreshold;

		if (topSuggestion.confidenceScore < confidenceThreshold) {
			return {
				autoAssigned: false,
				reason: `Confidence score (${topSuggestion.confidenceScore.toFixed(2)}) below threshold (${confidenceThreshold})`,
				suggestedType: topSuggestion,
				allSuggestions: suggestions,
			};
		}

		// Auto-assignment successful
		const result = {
			autoAssigned: true,
			suggestedType: topSuggestion,
			confidenceScore: topSuggestion.confidenceScore,
			reasoning: topSuggestion.reasoning,
			matchedFeatures: topSuggestion.matchedFeatures,
			requireConfirmation:
				settings.requireConfirmation && !args.forceAssignment,
			allSuggestions: suggestions,
		};

		return result;
	},
});

// Public-facing query for document type suggestions (used by the UI)
export const getDocumentTypeSuggestions = authenticatedMutation({
	args: {
		filename: v.string(),
		content: v.optional(v.string()),
		metadata: v.optional(v.any()),
		maxSuggestions: v.optional(v.number()),
	},
	handler: async (
		ctx,
		args
	): Promise<{
		suggestions: TypeSuggestion[];
		contentAnalysis: DocumentContentAnalysis;
		filenameAnalysis: FilenameAnalysis;
		hasConfidentSuggestion: boolean;
	}> => {
		const maxSuggestions = args.maxSuggestions || 3;

		// Perform content analysis
		const contentAnalysis: DocumentContentAnalysis = await ctx.runQuery(
			internal.documentAnalysis.analyzeDocumentContent,
			{
				content: args.content,
				filename: args.filename,
				metadata: args.metadata,
				userId: (ctx as typeof ctx & { subject?: string })
					.subject as Id<"users">,
			}
		);

		// Analyze filename
		const filenameAnalysis = await ctx.runQuery(
			internal.documentAnalysis.analyzeFilename,
			{
				filename: args.filename,
			}
		);

		// Generate type suggestions
		const suggestions: TypeSuggestion[] = await ctx.runQuery(
			internal.documentAnalysis.generateTypeSuggestions,
			{
				contentAnalysis,
				filenameAnalysis,
				maxSuggestions,
			}
		);

		return {
			suggestions,
			contentAnalysis,
			filenameAnalysis,
			hasConfidentSuggestion:
				suggestions.length > 0 && suggestions[0].confidenceScore > 0.7,
		};
	},
});

// Validate document against type-specific rules
export const validateDocumentForType = authenticatedMutation({
	args: {
		documentType: v.string(),
		filename: v.string(),
		fileSize: v.number(),
		fileFormat: v.string(),
		content: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const normalizedType = args.documentType.trim().toLowerCase();

		// Get document type with validation rules
		const documentType = await ctx.db
			.query("document_types")
			.withIndex("by_name", (q) => q.eq("name", normalizedType))
			.first();

		if (!documentType) {
			return {
				isValid: false,
				errors: [`Document type "${args.documentType}" not found`],
				warnings: [],
			};
		}

		if (!documentType.isActive) {
			return {
				isValid: false,
				errors: [`Document type "${args.documentType}" is inactive`],
				warnings: [],
			};
		}

		const errors: string[] = [];
		const warnings: string[] = [];

		// Check validation rules
		if (documentType.validationRules) {
			const rules = documentType.validationRules;

			// File size validation
			if (rules.maxSize && args.fileSize > rules.maxSize) {
				errors.push(
					`File size ${(args.fileSize / 1024 / 1024).toFixed(1)}MB exceeds maximum allowed size of ${(rules.maxSize / 1024 / 1024).toFixed(1)}MB`
				);
			}

			// File format validation
			if (
				rules.allowedFormats &&
				!rules.allowedFormats.includes(args.fileFormat.toLowerCase())
			) {
				errors.push(
					`File format "${args.fileFormat}" is not allowed. Allowed formats: ${rules.allowedFormats.join(", ")}`
				);
			}

			// Content-based validation if content is provided
			if (args.content && rules.requiredFields) {
				const contentLower = args.content.toLowerCase();
				for (const field of rules.requiredFields) {
					if (!contentLower.includes(field.toLowerCase())) {
						warnings.push(
							`Document may be missing required information: ${field}`
						);
					}
				}
			}
		}

		// Type-specific validation
		const typeValidation = validateTypeSpecificRequirements(
			normalizedType,
			args.filename,
			args.content
		);
		errors.push(...typeValidation.errors);
		warnings.push(...typeValidation.warnings);

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
			documentType: {
				name: documentType.name,
				displayName: documentType.displayName,
				groupName: documentType.groupName,
				validationRules: documentType.validationRules,
			},
		};
	},
});

// Helper function for type-specific validation requirements
function validateTypeSpecificRequirements(
	typeName: string,
	filename: string,
	content?: string
): { errors: string[]; warnings: string[] } {
	const errors: string[] = [];
	const warnings: string[] = [];
	const contentLower = content?.toLowerCase();

	// Type-specific validations
	switch (typeName) {
		case "appraisal":
			if (contentLower && !contentLower.includes("value")) {
				warnings.push(
					"Appraisal document should contain property valuation information"
				);
			}
			break;

		case "loan_agreement":
		case "mortgage":
			if (contentLower && !LOAN_TERMS_REGEX.test(contentLower)) {
				warnings.push(
					"Loan agreement should contain key terms like interest rate, principal, borrower, or lender"
				);
			}
			break;

		case "insurance":
			if (contentLower && !INSURANCE_TERMS_REGEX.test(contentLower)) {
				warnings.push(
					"Insurance document should contain policy number, coverage, or premium information"
				);
			}
			break;

		case "title":
			if (contentLower && !LEGAL_DESCRIPTION_REGEX.test(contentLower)) {
				warnings.push(
					"Title document should contain legal description or ownership information"
				);
			}
			break;

		case "inspection":
			if (contentLower && !INSPECTION_TERMS_REGEX.test(contentLower)) {
				warnings.push(
					"Inspection report should contain condition or defect information"
				);
			}
			break;

		default:
			break;
	}

	// File naming conventions
	const filenameLower = filename.toLowerCase();
	if (
		!(
			filenameLower.includes(typeName) ||
			content?.toLowerCase().includes(typeName)
		)
	) {
		warnings.push(
			`Filename doesn't clearly indicate document type "${typeName}"`
		);
	}

	return { errors, warnings };
}

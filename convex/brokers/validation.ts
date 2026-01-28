import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import {
	AuthorizedMutationCtx,
	AuthorizedQueryCtx,
	createAuthorizedMutation,
	createAuthorizedQuery,
} from "../lib/server";
function requireSubjectId(ctx: unknown): Doc<"users">["_id"] {
	const subject = (ctx as { subject?: string | null }).subject;
	if (!subject) {
		throw new Error("Authentication required");
	}
	return subject as Doc<"users">["_id"];
}


// ============================================
// Helper Functions (for internal use)
// ============================================

async function validateJourneyCompletenessInline(
	_ctx: unknown,
	journey: Doc<"onboarding_journeys">
): Promise<{
	valid: boolean;
	errors: string[];
	missingSections: string[];
	totalErrors: number;
}> {
	const errors: string[] = [];
	const missingSections: string[] = [];
	const brokerContext = journey.context.broker;

	// Validate Company Information
	if (brokerContext?.companyInfo) {
		const {
			companyName,
			entityType,
			registrationNumber,
			registeredAddress,
			businessPhone,
			businessEmail,
		} = brokerContext.companyInfo;

		if (!companyName) errors.push("Company name is required");
		if (!entityType) errors.push("Entity type is required");
		if (!registrationNumber) errors.push("Registration number is required");
		if (!registeredAddress?.street) errors.push("Street address is required");
		if (!registeredAddress?.city) errors.push("City is required");
		if (!registeredAddress?.state) errors.push("State is required");
		if (!registeredAddress?.zip) errors.push("Postal code is required");
		if (!registeredAddress?.country) errors.push("Country is required");
		if (!businessPhone) errors.push("Business phone is required");
		if (!businessEmail) errors.push("Business email is required");
	} else {
		missingSections.push("companyInfo");
		errors.push("Company information is required");
	}

	// Validate Licensing Information
	if (brokerContext?.licensing) {
		const { licenseType, licenseNumber, issuer, issuedDate, expiryDate } =
			brokerContext.licensing;

		if (!licenseType) errors.push("License type is required");
		if (!licenseNumber) errors.push("License number is required");
		if (!issuer) errors.push("License issuer is required");
		if (!issuedDate) errors.push("License issue date is required");
		if (!expiryDate) errors.push("License expiry date is required");

		// Check if license is not expired
		if (expiryDate && new Date(expiryDate) < new Date()) {
			errors.push("License has expired");
		}
	} else {
		missingSections.push("licensing");
		errors.push("Licensing information is required");
	}

	// Validate Representatives
	if (
		!brokerContext?.representatives ||
		brokerContext.representatives.length === 0
	) {
		missingSections.push("representatives");
		errors.push("At least one representative is required");
	} else {
		const representatives = brokerContext.representatives;
		if (representatives) {
			for (const [index, rep] of representatives.entries()) {
				if (!rep.firstName)
					errors.push(`Representative ${index + 1} first name is required`);
				if (!rep.lastName)
					errors.push(`Representative ${index + 1} last name is required`);
				if (!rep.role)
					errors.push(`Representative ${index + 1} role is required`);
				if (!rep.email)
					errors.push(`Representative ${index + 1} email is required`);
				if (!rep.phone)
					errors.push(`Representative ${index + 1} phone is required`);
				if (!rep.hasAuthority)
					errors.push(
						`Representative ${index + 1} authority status is required`
					);
			}
		}
	}

	// Validate Documents
	if (!brokerContext?.documents || brokerContext.documents.length === 0) {
		missingSections.push("documents");
		errors.push("At least one document is required");
	} else {
		const requiredDocumentTypes = [
			"business_license",
			"certificate_of_incorporation",
		];

		const documents = brokerContext.documents;
		const uploadedTypes = documents?.map((d) => d.type) ?? [];
		const missingTypes = requiredDocumentTypes.filter(
			(type) => !uploadedTypes.includes(type)
		);

		if (missingTypes.length > 0) {
			errors.push(`Missing required documents: ${missingTypes.join(", ")}`);
		}
	}

	// Check for unresolved admin requests
	const adminRequestTimeline = brokerContext?.adminRequestTimeline as
		| Array<{ resolved?: boolean }>
		| undefined;
	if (adminRequestTimeline) {
		const unresolvedRequests = adminRequestTimeline.filter(
			(req) => !req.resolved
		);

		if (unresolvedRequests.length > 0) {
			errors.push(
				`${unresolvedRequests.length} admin request(s) must be resolved before submission`
			);
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		missingSections,
		totalErrors: errors.length,
	};
}

// Regex moved to top level for performance
const VALID_SUBDOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i;

async function validateSubdomainFormatInline(subdomain: string): Promise<{
	valid: boolean;
	errors: string[];
	normalizedName: string;
}> {
	const errors: string[] = [];
	const normalized = subdomain.trim();

	// Check length (3-63 characters)
	if (normalized.length < 3) {
		errors.push("Subdomain must be at least 3 characters");
	} else if (normalized.length > 63) {
		errors.push("Subdomain cannot exceed 63 characters");
	}

	// Check for valid characters (letters, numbers, hyphens)
	if (!VALID_SUBDOMAIN_PATTERN.test(normalized)) {
		errors.push(
			"Subdomain can only contain letters, numbers, and hyphens, and must start and end with a letter or number"
		);
	}

	// Check for consecutive hyphens
	if (normalized.includes("--")) {
		errors.push("Subdomain cannot contain consecutive hyphens");
	}

	// Check for hyphen at start or end
	if (normalized.startsWith("-") || normalized.endsWith("-")) {
		errors.push("Subdomain cannot start or end with a hyphen");
	}

	// Check for all lowercase (we want consistency)
	if (normalized !== normalized.toLowerCase()) {
		errors.push("Subdomain should contain only lowercase letters");
	}

	return {
		valid: errors.length === 0,
		errors,
		normalizedName: normalized.toLowerCase(),
	};
}

async function isSubdomainAvailableInline(
	ctx: AuthorizedQueryCtx,
	subdomainParam: string
): Promise<{ available: boolean; reason: string }> {
	const normalizedSubdomain = subdomainParam.toLowerCase().trim();

	// Check against reserved subdomains
	const reservedSubdomains = [
		"www",
		"api",
		"admin",
		"app",
		"dashboard",
		"mail",
		"ftp",
		"localhost",
		"staging",
		"dev",
		"test",
		"cdn",
		"static",
		"assets",
		"images",
		"proxy",
		"monitoring",
		"grafana",
		"prometheus",
		"kibana",
		"elastic",
		"auth",
		"oauth",
		"sso",
		"login",
		"signup",
		"signin",
		"register",
		"support",
		"help",
		"docs",
		"blog",
		"news",
		"forum",
		"community",
		"status",
		"health",
		"ping",
		"webhook",
		"hooks",
		"notifications",
		"alerts",
	];

	if (reservedSubdomains.includes(normalizedSubdomain)) {
		return { available: false, reason: "subdomain_reserved" };
	}

	// Check if subdomain is already taken in brokers table
	const existingBroker = await ctx.db
		.query("brokers")
		.withIndex("by_subdomain", (q) => q.eq("subdomain", normalizedSubdomain))
		.first();

	if (existingBroker) {
		return { available: false, reason: "subdomain_taken" };
	}

	// Check if subdomain is proposed in an existing journey
	const existingJourneys = await ctx.db
		.query("onboarding_journeys")
		.filter((q) =>
			q.and(
				q.eq(q.field("persona"), "broker"),
				q.neq(q.field("status"), "approved"),
				q.neq(q.field("status"), "rejected")
			)
		)
		.collect();

	const journeyWithSubdomain = existingJourneys.find(
		(j) =>
			(
				j.context as { broker?: { proposedSubdomain?: string } }
			)?.broker?.proposedSubdomain?.toLowerCase() === normalizedSubdomain
	);

	if (journeyWithSubdomain) {
		return { available: false, reason: "subdomain_pending" };
	}

	return { available: true, reason: "available" };
}

// ============================================
// Subdomain Validation Queries
// ============================================

/**
 * Check if a subdomain is available for use
 * Returns false if subdomain is already taken or reserved
 */
export const isSubdomainAvailable = createAuthorizedQuery(["any"])({
	args: {
		subdomain: v.string(),
	},
	handler: async (ctx, args) =>
		await isSubdomainAvailableInline(ctx, args.subdomain),
});

/**
 * Validate subdomain format according to DNS and security rules
 */
export const validateSubdomainFormat = createAuthorizedQuery(["any"])({
	args: {
		subdomain: v.string(),
	},
	handler: async (_ctx, args) =>
		await validateSubdomainFormatInline(args.subdomain),
});

// ============================================
// Journey Completeness Validation
// ============================================

/**
 * Validate that a broker journey is complete and ready for submission
 * Checks all required fields across all sections
 */
export const validateJourneyCompleteness = createAuthorizedQuery(["any"])({
	args: {
		journeyId: v.id("onboarding_journeys"),
	},
	handler: async (ctx, args) => {
		const journey = await ctx.db.get(args.journeyId);

		if (!journey || journey.persona !== "broker") {
			return {
				valid: false,
				errors: ["Invalid broker journey"],
				missingSections: [],
				totalErrors: 1,
			};
		}

		return await validateJourneyCompletenessInline(ctx, journey);
	},
});

// ============================================
// Mutation to Validate and Prepare for Submission
// ============================================

/**
 * Validate journey and prepare for submission
 * Returns validation results without changing state
 */
export const validateAndPrepareJourney = createAuthorizedMutation(["any"])({
	args: {
		journeyId: v.id("onboarding_journeys"),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const journey = await ctx.db.get(args.journeyId);

		if (!journey || journey.persona !== "broker") {
			throw new Error("Invalid broker journey");
		}

		// Ensure user owns this journey
		if (journey.userId !== requireSubjectId(ctx)) {
			throw new Error("Unauthorized: You can only validate your own journey");
		}

		// Get validation results using inline helper
		const validation = await validateJourneyCompletenessInline(ctx, journey);

		// If journey has a proposed subdomain, validate it
		let subdomainFormatValid = false;
		let subdomainAvailable = false;

		if (journey.context.broker?.proposedSubdomain) {
			const formatValidation = await validateSubdomainFormatInline(
				journey.context.broker.proposedSubdomain
			);
			subdomainFormatValid = formatValidation.valid;

			const availability = await isSubdomainAvailableInline(
				ctx,
				journey.context.broker.proposedSubdomain
			);
			subdomainAvailable = availability.available;

			if (!availability.available) {
				validation.errors.push(
					`Subdomain is not available: ${availability.reason}`
				);
				validation.valid = false;
			}

			if (!formatValidation.valid) {
				validation.errors.push(...formatValidation.errors);
				validation.valid = false;
			}
		}

		return {
			journeyId: args.journeyId,
			canSubmit: validation.valid,
			errors: validation.errors,
			missingSections: validation.missingSections,
			subdomain: journey.context.broker?.proposedSubdomain,
			subdomainAvailable,
			subdomainFormatValid,
		};
	},
});

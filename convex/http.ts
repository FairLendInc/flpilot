import { httpRouter } from "convex/server";
import { z } from "zod";
import { logger } from "../lib/logger";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { httpAction } from "./_generated/server";
import { env } from "./lib/env";
import type { ListingCreationPayload } from "./listings";

const http = httpRouter();

const normalizeNullToUndefined = <T extends Record<string, unknown>>(
	obj: T
): T =>
	Object.fromEntries(
		Object.entries(obj).map(([key, value]) => [
			key,
			value === null ? undefined : value,
		])
	) as T;

const WEBHOOK_ALLOWED_ORIGIN = env.LISTINGS_WEBHOOK_ALLOWED_ORIGIN;
const LISTINGS_WEBHOOK_API_KEY = env.LISTINGS_WEBHOOK_API_KEY;

const webhookCorsHeaders = {
	"Access-Control-Allow-Origin": WEBHOOK_ALLOWED_ORIGIN,
	"Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, X-API-Key",
	"Access-Control-Max-Age": "86400",
};

const corsJsonHeaders = {
	...webhookCorsHeaders,
	"Content-Type": "application/json",
};

const borrowerWebhookSchema = z.object({
	name: z.string().min(1, "borrower.name.required"),
	email: z.string().email("borrower.email.invalid"),
	phone: z.string().optional(),
	rotessaCustomerId: z.string().min(1, "borrower.rotessaCustomerId.required"),
});

const locationWebhookSchema = z.object({
	lat: z
		.number()
		.gte(-90, "mortgage.location.lat.range")
		.lte(90, "mortgage.location.lat.range"),
	lng: z
		.number()
		.gte(-180, "mortgage.location.lng.range")
		.lte(180, "mortgage.location.lng.range"),
});

const addressWebhookSchema = z.object({
	street: z.string().min(1, "mortgage.address.street.required"),
	city: z.string().min(1, "mortgage.address.city.required"),
	state: z.string().min(1, "mortgage.address.state.required"),
	zip: z.string().min(1, "mortgage.address.zip.required"),
	country: z.string().min(1, "mortgage.address.country.required"),
});

const comparableAddressWebhookSchema = z.object({
	street: z.string().min(1, "comparable.address.street.required"),
	city: z.string().min(1, "comparable.address.city.required"),
	state: z.string().min(1, "comparable.address.state.required"),
	zip: z.string().min(1, "comparable.address.zip.required"),
});

const storageIdSchema = z.string().min(1, "storageId.required");

const imageWebhookSchema = z.object({
	storageId: storageIdSchema,
	alt: z.string().optional(),
	order: z.number().int().min(0, "mortgage.images.order.range"),
});

const documentWebhookSchema = z.object({
	name: z.string().min(1, "mortgage.documents.name.required"),
	type: z.enum(
		["appraisal", "title", "inspection", "loan_agreement", "insurance"],
		{
			message: "mortgage.documents.type.invalid",
		}
	),
	storageId: storageIdSchema,
	uploadDate: z
		.string()
		.refine(
			(value) => !Number.isNaN(Date.parse(value)),
			"mortgage.documents.uploadDate.invalid"
		)
		.refine(
			(value) => Date.parse(value) <= Date.now(),
			"mortgage.documents.uploadDate.future"
		),
	fileSize: z
		.number()
		.nonnegative("mortgage.documents.fileSize.range")
		.optional(),
});

const comparableWebhookSchema = z
	.object({
		address: comparableAddressWebhookSchema,
		saleAmount: z.number().gt(0, "comparable.saleAmount.positive"),
		saleDate: z
			.string()
			.refine(
				(value) => !Number.isNaN(Date.parse(value)),
				"comparable.saleDate.invalid"
			)
			.refine(
				(value) => Date.parse(value) <= Date.now(),
				"comparable.saleDate.future"
			),
		distance: z.number().gte(0, "comparable.distance.range"),
		squareFeet: z
			.number()
			.positive("comparable.squareFeet.positive")
			.optional(),
		bedrooms: z.number().int().min(0, "comparable.bedrooms.range").optional(),
		bathrooms: z.number().min(0, "comparable.bathrooms.range").optional(),
		propertyType: z.string().optional(),
		imageStorageId: storageIdSchema.optional(),
	})
	.superRefine((value, ctx) => {
		if (value.bedrooms !== undefined && value.bedrooms < 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["bedrooms"],
				message: "comparable.bedrooms.range",
			});
		}
		if (value.bathrooms !== undefined && value.bathrooms < 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["bathrooms"],
				message: "comparable.bathrooms.range",
			});
		}
	});

const mortgageWebhookSchema = z
	.object({
		loanAmount: z.number().gt(0, "mortgage.loanAmount.positive"),
		interestRate: z
			.number()
			.gt(0, "mortgage.interestRate.range")
			.lt(100, "mortgage.interestRate.range"),
		originationDate: z
			.string()
			.refine(
				(value) => !Number.isNaN(Date.parse(value)),
				"mortgage.originationDate.invalid"
			),
		maturityDate: z
			.string()
			.refine(
				(value) => !Number.isNaN(Date.parse(value)),
				"mortgage.maturityDate.invalid"
			),
		status: z
			.enum(["active", "renewed", "closed", "defaulted"], {
				message: "mortgage.status.invalid",
			})
			.optional(),
		mortgageType: z.enum(["1st", "2nd", "other"], {
			message: "mortgage.mortgageType.invalid",
		}),
		address: addressWebhookSchema,
		location: locationWebhookSchema,
		propertyType: z.string().min(1, "mortgage.propertyType.required"),
		appraisalMarketValue: z
			.number()
			.gt(0, "mortgage.appraisalMarketValue.positive"),
		appraisalMethod: z.string().min(1, "mortgage.appraisalMethod.required"),
		appraisalCompany: z.string().min(1, "mortgage.appraisalCompany.required"),
		appraisalDate: z
			.string()
			.refine(
				(value) => !Number.isNaN(Date.parse(value)),
				"mortgage.appraisalDate.invalid"
			)
			.refine(
				(value) => Date.parse(value) <= Date.now(),
				"mortgage.appraisalDate.future"
			),
		ltv: z.number().min(0, "mortgage.ltv.range").max(100, "mortgage.ltv.range"),
		images: z.array(imageWebhookSchema).optional(),
		documents: z.array(documentWebhookSchema).optional(),
		externalMortgageId: z
			.string()
			.min(1, "mortgage.externalMortgageId.required"),
		priorEncumbrance: z
			.object({
				amount: z.number().gt(0, "mortgage.priorEncumbrance.amount.positive"),
				lender: z.string().min(1, "mortgage.priorEncumbrance.lender.required"),
			})
			.optional(),
		asIfAppraisal: z
			.object({
				marketValue: z
					.number()
					.gt(0, "mortgage.asIfAppraisal.marketValue.positive"),
				method: z.string().min(1, "mortgage.asIfAppraisal.method.required"),
				company: z.string().min(1, "mortgage.asIfAppraisal.company.required"),
				date: z
					.string()
					.refine(
						(value) => !Number.isNaN(Date.parse(value)),
						"mortgage.asIfAppraisal.date.invalid"
					),
			})
			.optional(),
	})
	.superRefine((value, ctx) => {
		const origination = Date.parse(value.originationDate);
		const maturity = Date.parse(value.maturityDate);
		if (
			!(Number.isNaN(origination) || Number.isNaN(maturity)) &&
			origination > maturity
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["maturityDate"],
				message: "mortgage.maturityDate.beforeOrigination",
			});
		}
	});

const listingWebhookSchema = z.object({
	visible: z.boolean().optional(),
});

const listingUpdateWebhookSchema = z.object({
	visible: z.boolean().optional(),
	locked: z.boolean().optional(),
	lockedBy: z.string().optional(), // Will be converted to Id<"users">
});

const listingDeleteWebhookSchema = z.object({
	force: z.boolean().optional(),
});

const mortgageUpdateWebhookSchema = z
	.object({
		loanAmount: z.number().gt(0, "mortgage.loanAmount.positive").optional(),
		interestRate: z
			.number()
			.gt(0, "mortgage.interestRate.range")
			.lt(100, "mortgage.interestRate.range")
			.optional(),
		originationDate: z
			.string()
			.refine(
				(value) => !Number.isNaN(Date.parse(value)),
				"mortgage.originationDate.invalid"
			)
			.optional(),
		maturityDate: z
			.string()
			.refine(
				(value) => !Number.isNaN(Date.parse(value)),
				"mortgage.maturityDate.invalid"
			)
			.optional(),
		status: z
			.enum(["active", "renewed", "closed", "defaulted"], {
				message: "mortgage.status.invalid",
			})
			.optional(),
		address: addressWebhookSchema.optional(),
		location: locationWebhookSchema.optional(),
		propertyType: z
			.string()
			.min(1, "mortgage.propertyType.required")
			.optional(),
		borrowerId: z.string().optional(), // Will be converted to Id<"borrowers">
		documents: z.array(documentWebhookSchema).optional(),
	})
	.superRefine((value, ctx) => {
		// Validate date order if both dates are provided
		if (value.originationDate && value.maturityDate) {
			const origination = Date.parse(value.originationDate);
			const maturity = Date.parse(value.maturityDate);
			if (
				!(Number.isNaN(origination) || Number.isNaN(maturity)) &&
				origination > maturity
			) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["maturityDate"],
					message: "mortgage.maturityDate.beforeOrigination",
				});
			}
		}
	});

const mortgageDeleteWebhookSchema = z.object({
	force: z.boolean().optional(),
});

const listingCreationWebhookSchema = z.object({
	borrower: borrowerWebhookSchema,
	mortgage: mortgageWebhookSchema,
	listing: listingWebhookSchema,
	comparables: z.array(comparableWebhookSchema).optional(),
});

type ListingWebhookPayload = z.infer<typeof listingCreationWebhookSchema>;

const booleanQueryParam = z.preprocess((value) => {
	if (value === "true") return true;
	if (value === "false") return false;
	return value;
}, z.boolean());

const numberQueryParam = z.preprocess((value) => {
	if (typeof value !== "string") return value;
	if (value.trim() === "") return;
	return Number(value);
}, z.number());

const borrowerCreateSchema = borrowerWebhookSchema;

const borrowerGetQuerySchema = z.object({
	borrowerId: z.string().optional(),
	rotessaCustomerId: z.string().optional(),
	email: z.string().optional(),
});

const borrowerListQuerySchema = z.object({
	emailContains: z.string().optional(),
	nameContains: z.string().optional(),
	createdAfter: z.string().optional(),
	createdBefore: z.string().optional(),
	limit: numberQueryParam.optional(),
	cursor: z.string().optional(),
});

const borrowerUpdateSchema = z.object({
	borrowerId: z.string().optional(),
	rotessaCustomerId: z.string().optional(),
	name: z.string().optional(),
	email: z.string().email("borrower.email.invalid").optional(),
	phone: z.string().optional(),
});

const borrowerDeleteSchema = z.object({
	borrowerId: z.string().optional(),
	rotessaCustomerId: z.string().optional(),
	force: booleanQueryParam.optional(),
});

const mortgageCreateSchema = mortgageWebhookSchema
	.safeExtend({
		borrowerId: z.string().optional(),
		borrowerRotessaId: z.string().optional(),
		borrower: borrowerWebhookSchema.optional(),
	})
	.superRefine((value, ctx) => {
		const count = [
			value.borrowerId,
			value.borrowerRotessaId,
			value.borrower,
		].filter(Boolean).length;
		if (count !== 1) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["borrowerId"],
				message: "mortgage.borrower.reference.required",
			});
		}
	});

const mortgageGetQuerySchema = z.object({
	mortgageId: z.string().optional(),
	externalMortgageId: z.string().optional(),
	includeBorrower: booleanQueryParam.optional(),
	includeListing: booleanQueryParam.optional(),
});

const mortgageListQuerySchema = z.object({
	borrowerId: z.string().optional(),
	borrowerRotessaId: z.string().optional(),
	status: z.string().optional(),
	mortgageType: z.string().optional(),
	minLtv: numberQueryParam.optional(),
	maxLtv: numberQueryParam.optional(),
	minLoanAmount: numberQueryParam.optional(),
	maxLoanAmount: numberQueryParam.optional(),
	maturityAfter: z.string().optional(),
	maturityBefore: z.string().optional(),
	createdAfter: z.string().optional(),
	createdBefore: z.string().optional(),
	hasListing: booleanQueryParam.optional(),
	includeBorrower: booleanQueryParam.optional(),
	limit: numberQueryParam.optional(),
	cursor: z.string().optional(),
});

const listingGetQuerySchema = z.object({
	listingId: z.string().optional(),
	mortgageId: z.string().optional(),
	externalMortgageId: z.string().optional(),
	includeMortgage: booleanQueryParam.optional(),
	includeBorrower: booleanQueryParam.optional(),
	includeComparables: booleanQueryParam.optional(),
});

const listingListQuerySchema = z.object({
	visible: booleanQueryParam.optional(),
	locked: booleanQueryParam.optional(),
	available: booleanQueryParam.optional(),
	lockedBy: z.string().optional(),
	borrowerId: z.string().optional(),
	minLtv: numberQueryParam.optional(),
	maxLtv: numberQueryParam.optional(),
	minLoanAmount: numberQueryParam.optional(),
	maxLoanAmount: numberQueryParam.optional(),
	propertyType: z.string().optional(),
	state: z.string().optional(),
	city: z.string().optional(),
	includeMortgage: booleanQueryParam.optional(),
	limit: numberQueryParam.optional(),
	cursor: z.string().optional(),
});

const toListingCreationPayload = (
	payload: ListingWebhookPayload
): ListingCreationPayload => ({
	borrower: payload.borrower,
	mortgage: {
		...payload.mortgage,
		images: payload.mortgage.images?.map((image) => ({
			...image,
			storageId: image.storageId as Id<"_storage">,
		})),
		documents: payload.mortgage.documents?.map((document) => ({
			...document,
			storageId: document.storageId as Id<"_storage">,
		})),
	},
	listing: payload.listing,
	comparables: payload.comparables?.map((comp) => ({
		address: {
			street: comp.address.street,
			city: comp.address.city,
			state: comp.address.state,
			zip: comp.address.zip,
		},
		saleAmount: comp.saleAmount,
		saleDate: comp.saleDate,
		distance: comp.distance,
		squareFeet: comp.squareFeet,
		bedrooms: comp.bedrooms,
		bathrooms: comp.bathrooms,
		propertyType: comp.propertyType,
		imageStorageId: comp.imageStorageId
			? (comp.imageStorageId as Id<"_storage">)
			: undefined,
	})),
});

const formatValidationIssues = (issues: z.ZodIssue[]) =>
	issues.map((issue) => ({
		code: issue.message,
		path: issue.path.join("."),
		error: issue.code,
	}));

const validateApiKey = (request: Request): Response | null => {
	if (!LISTINGS_WEBHOOK_API_KEY) {
		logger.error("LISTINGS_WEBHOOK_API_KEY is not configured");
		return corsJsonResponse(500, {
			code: "configuration_error",
			message: "LISTINGS_WEBHOOK_API_KEY is not configured",
		});
	}

	const providedKey = request.headers.get("x-api-key");
	if (!providedKey || providedKey !== LISTINGS_WEBHOOK_API_KEY) {
		return corsJsonResponse(401, {
			code: "invalid_api_key",
			message: "Missing or invalid API key",
		});
	}

	return null;
};

const parseJsonBody = async (
	request: Request
): Promise<{ data?: unknown; errorResponse?: Response }> => {
	try {
		const raw = await request.json();
		return { data: raw };
	} catch (_err) {
		return {
			errorResponse: corsJsonResponse(400, {
				code: "invalid_json",
				message: "Request body must be valid JSON",
			}),
		};
	}
};

const parseQueryParams = <T>(
	request: Request,
	schema: z.ZodSchema<T>
): { data?: T; errorResponse?: Response } => {
	const params = Object.fromEntries(
		new URL(request.url).searchParams.entries()
	);
	const parsed = schema.safeParse(params);
	if (!parsed.success) {
		return {
			errorResponse: corsJsonResponse(400, {
				code: "payload_validation_error",
				message: "Query validation failed",
				errors: formatValidationIssues(parsed.error.issues),
			}),
		};
	}
	return { data: parsed.data };
};

const isInvalidIdError = (error: unknown, tableName: string) =>
	error instanceof Error &&
	error.message.includes(`Expected ID for table "${tableName}"`);

const corsJsonResponse = (status: number, body: Record<string, unknown>) =>
	new Response(JSON.stringify(body), {
		status,
		headers: corsJsonHeaders,
	});

const emptyCorsResponse = (status: number) =>
	new Response(null, { status, headers: webhookCorsHeaders });

// Health check endpoint for webhook testing
http.route({
	path: "/workos-webhook/health",
	method: "GET",
	handler: httpAction(
		async () =>
			new Response(
				JSON.stringify({
					status: "healthy",
					message: "WorkOS webhook endpoint is active",
					timestamp: new Date().toISOString(),
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } }
			)
	),
});

http.route({
	path: "/listings/create",
	method: "OPTIONS",
	handler: httpAction(async () => emptyCorsResponse(204)),
});

http.route({
	path: "/borrowers/create",
	method: "OPTIONS",
	handler: httpAction(async () => emptyCorsResponse(204)),
});

http.route({
	path: "/borrowers/create",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const apiError = validateApiKey(request);
		if (apiError) {
			return apiError;
		}

		const { data, errorResponse } = await parseJsonBody(request);
		if (errorResponse) {
			return errorResponse;
		}

		const parsedPayload = borrowerCreateSchema.safeParse(data);
		if (!parsedPayload.success) {
			return corsJsonResponse(400, {
				code: "payload_validation_error",
				message: "Payload validation failed",
				errors: formatValidationIssues(parsedPayload.error.issues),
			});
		}

		const result = await ctx.runMutation(
			internal.borrowers.createBorrowerInternal,
			parsedPayload.data
		);

		return corsJsonResponse(result.created ? 201 : 200, {
			code: result.created ? "borrower_created" : "borrower_already_exists",
			result,
		});
	}),
});

http.route({
	path: "/borrowers/get",
	method: "OPTIONS",
	handler: httpAction(async () => emptyCorsResponse(204)),
});

http.route({
	path: "/borrowers/get",
	method: "GET",
	handler: httpAction(async (ctx, request) => {
		const apiError = validateApiKey(request);
		if (apiError) {
			return apiError;
		}

		const params = new URL(request.url).searchParams;
		if (
			!(
				params.get("borrowerId") ||
				params.get("rotessaCustomerId") ||
				params.get("email")
			)
		) {
			return corsJsonResponse(400, {
				code: "missing_identifier",
				message: "Provide borrowerId, rotessaCustomerId, or email",
			});
		}

		const { data, errorResponse } = parseQueryParams(
			request,
			borrowerGetQuerySchema
		);
		if (errorResponse) {
			return errorResponse;
		}

		let result: unknown;
		try {
			result = await ctx.runQuery(internal.borrowers.getBorrowerInternal, {
				borrowerId: data?.borrowerId
					? (data.borrowerId as Id<"borrowers">)
					: undefined,
				rotessaCustomerId: data?.rotessaCustomerId,
				email: data?.email,
			});
		} catch (error) {
			if (isInvalidIdError(error, "borrowers")) {
				return corsJsonResponse(404, {
					code: "borrower_not_found",
					message: "Borrower not found",
				});
			}
			throw error;
		}

		if (!result) {
			return corsJsonResponse(404, {
				code: "borrower_not_found",
				message: "Borrower not found",
			});
		}

		return corsJsonResponse(200, {
			code: "borrower_found",
			result,
		});
	}),
});

http.route({
	path: "/borrowers/list",
	method: "OPTIONS",
	handler: httpAction(async () => emptyCorsResponse(204)),
});

http.route({
	path: "/borrowers/list",
	method: "GET",
	handler: httpAction(async (ctx, request) => {
		const apiError = validateApiKey(request);
		if (apiError) {
			return apiError;
		}

		const { data, errorResponse } = parseQueryParams(
			request,
			borrowerListQuerySchema
		);
		if (errorResponse) {
			return errorResponse;
		}

		const result = await ctx.runQuery(
			internal.borrowers.listBorrowersInternal,
			{
				...data,
			}
		);

		return corsJsonResponse(200, {
			code: "borrowers_listed",
			result,
		});
	}),
});

http.route({
	path: "/borrowers/update",
	method: "OPTIONS",
	handler: httpAction(async () => emptyCorsResponse(204)),
});

http.route({
	path: "/borrowers/update",
	method: "PATCH",
	handler: httpAction(async (ctx, request) => {
		const apiError = validateApiKey(request);
		if (apiError) {
			return apiError;
		}

		const { data, errorResponse } = await parseJsonBody(request);
		if (errorResponse) {
			return errorResponse;
		}

		const parsedPayload = borrowerUpdateSchema.safeParse(data);
		if (!parsedPayload.success) {
			return corsJsonResponse(400, {
				code: "payload_validation_error",
				message: "Payload validation failed",
				errors: formatValidationIssues(parsedPayload.error.issues),
			});
		}

		if (
			!(parsedPayload.data.borrowerId || parsedPayload.data.rotessaCustomerId)
		) {
			return corsJsonResponse(400, {
				code: "missing_identifier",
				message: "Provide borrowerId or rotessaCustomerId",
			});
		}

		try {
			const result = await ctx.runMutation(
				internal.borrowers.updateBorrowerInternal,
				{
					borrowerId: parsedPayload.data.borrowerId
						? (parsedPayload.data.borrowerId as Id<"borrowers">)
						: undefined,
					rotessaCustomerId: parsedPayload.data.rotessaCustomerId,
					name: parsedPayload.data.name,
					email: parsedPayload.data.email,
					phone: parsedPayload.data.phone,
				}
			);

			return corsJsonResponse(200, {
				code: "borrower_updated",
				result,
			});
		} catch (error) {
			if (error instanceof Error && error.message === "borrower_not_found") {
				return corsJsonResponse(404, {
					code: "borrower_not_found",
					message: "Borrower not found",
				});
			}

			return corsJsonResponse(400, {
				code: "processing_error",
				message:
					error instanceof Error ? error.message : "Unknown processing error",
			});
		}
	}),
});

http.route({
	path: "/borrowers/delete",
	method: "OPTIONS",
	handler: httpAction(async () => emptyCorsResponse(204)),
});

http.route({
	path: "/borrowers/delete",
	method: "DELETE",
	handler: httpAction(async (ctx, request) => {
		const apiError = validateApiKey(request);
		if (apiError) {
			return apiError;
		}

		const { data, errorResponse } = await parseJsonBody(request);
		if (errorResponse) {
			return errorResponse;
		}

		const parsedPayload = borrowerDeleteSchema.safeParse(data);
		if (!parsedPayload.success) {
			return corsJsonResponse(400, {
				code: "payload_validation_error",
				message: "Payload validation failed",
				errors: formatValidationIssues(parsedPayload.error.issues),
			});
		}

		if (
			!(parsedPayload.data.borrowerId || parsedPayload.data.rotessaCustomerId)
		) {
			return corsJsonResponse(400, {
				code: "missing_identifier",
				message: "Provide borrowerId or rotessaCustomerId",
			});
		}

		try {
			const result = await ctx.runMutation(
				internal.borrowers.deleteBorrowerInternal,
				{
					borrowerId: parsedPayload.data.borrowerId
						? (parsedPayload.data.borrowerId as Id<"borrowers">)
						: undefined,
					rotessaCustomerId: parsedPayload.data.rotessaCustomerId,
					force: parsedPayload.data.force,
				}
			);

			if (!result.deleted) {
				return corsJsonResponse(409, {
					code: "borrower_has_dependencies",
					message: "Borrower has linked mortgages",
					mortgageCount: result.mortgageCount ?? 0,
				});
			}

			return corsJsonResponse(200, {
				code: "borrower_deleted",
				result,
			});
		} catch (error) {
			if (error instanceof Error && error.message === "borrower_not_found") {
				return corsJsonResponse(404, {
					code: "borrower_not_found",
					message: "Borrower not found",
				});
			}

			return corsJsonResponse(400, {
				code: "processing_error",
				message:
					error instanceof Error ? error.message : "Unknown processing error",
			});
		}
	}),
});

http.route({
	path: "/listings/create",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const apiError = validateApiKey(request);
		if (apiError) {
			return apiError;
		}

		const { data, errorResponse } = await parseJsonBody(request);
		if (errorResponse) {
			return errorResponse;
		}

		const parsedPayload = listingCreationWebhookSchema.safeParse(data);
		if (!parsedPayload.success) {
			return corsJsonResponse(400, {
				code: "payload_validation_error",
				message: "Payload validation failed",
				errors: formatValidationIssues(parsedPayload.error.issues),
			});
		}

		const payload = toListingCreationPayload(parsedPayload.data);

		try {
			const result = await ctx.runMutation(
				internal.listings.createFromPayloadInternal,
				payload
			);

			const successCode = result.created
				? "listing_created"
				: "listing_already_exists";

			return corsJsonResponse(result.created ? 201 : 200, {
				code: successCode,
				result,
			});
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unknown processing error";
			logger.error("Listing webhook processing failed", { message });
			return corsJsonResponse(400, {
				code: "processing_error",
				message,
			});
		}
	}),
});

// Listing update endpoint
http.route({
	path: "/listings/update",
	method: "OPTIONS",
	handler: httpAction(async () => emptyCorsResponse(204)),
});

http.route({
	path: "/listings/update",
	method: "PATCH",
	handler: httpAction(async (ctx, request) => {
		const apiError = validateApiKey(request);
		if (apiError) {
			return apiError;
		}

		const { data, errorResponse } = await parseJsonBody(request);
		if (errorResponse) {
			return errorResponse;
		}

		// Extract listingId from payload
		const { listingId, ...updateData } = data as {
			listingId?: string;
			[key: string]: unknown;
		};

		if (!listingId) {
			return corsJsonResponse(400, {
				code: "missing_listing_id",
				message: "listingId is required",
			});
		}

		const parsedPayload = listingUpdateWebhookSchema.safeParse(updateData);
		if (!parsedPayload.success) {
			return corsJsonResponse(400, {
				code: "payload_validation_error",
				message: "Payload validation failed",
				errors: formatValidationIssues(parsedPayload.error.issues),
			});
		}

		try {
			const listingUpdate: {
				listingId: Id<"listings">;
				visible?: boolean;
				locked?: boolean;
				lockedBy?: Id<"users">;
			} = {
				listingId: listingId as Id<"listings">,
				...(parsedPayload.data.visible !== undefined && {
					visible: parsedPayload.data.visible,
				}),
				...(parsedPayload.data.locked !== undefined && {
					locked: parsedPayload.data.locked,
				}),
				...(parsedPayload.data.lockedBy && {
					lockedBy: parsedPayload.data.lockedBy as Id<"users">,
				}),
			};
			const result = await ctx.runMutation(
				internal.listings.updateListingInternal,
				listingUpdate
			);

			return corsJsonResponse(200, {
				code: "listing_updated",
				listingId: result,
			});
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unknown processing error";
			logger.error("Listing update webhook processing failed", { message });
			return corsJsonResponse(400, {
				code: "processing_error",
				message,
			});
		}
	}),
});

// Listing delete endpoint
http.route({
	path: "/listings/delete",
	method: "OPTIONS",
	handler: httpAction(async () => emptyCorsResponse(204)),
});

http.route({
	path: "/listings/delete",
	method: "DELETE",
	handler: httpAction(async (ctx, request) => {
		const apiError = validateApiKey(request);
		if (apiError) {
			return apiError;
		}

		const { data, errorResponse } = await parseJsonBody(request);
		if (errorResponse) {
			return errorResponse;
		}

		const { listingId, ...deleteOptions } = data as {
			listingId?: string;
			[key: string]: unknown;
		};

		if (!listingId) {
			return corsJsonResponse(400, {
				code: "missing_listing_id",
				message: "listingId is required",
			});
		}

		const parsedPayload = listingDeleteWebhookSchema.safeParse(deleteOptions);
		if (!parsedPayload.success) {
			return corsJsonResponse(400, {
				code: "payload_validation_error",
				message: "Payload validation failed",
				errors: formatValidationIssues(parsedPayload.error.issues),
			});
		}

		try {
			const result = await ctx.runMutation(
				internal.listings.deleteListingInternal,
				{
					listingId: listingId as Id<"listings">,
					...parsedPayload.data,
				}
			);

			return corsJsonResponse(200, {
				code: "listing_deleted",
				listingId: result,
			});
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unknown processing error";
			logger.error("Listing delete webhook processing failed", { message });
			return corsJsonResponse(400, {
				code: "processing_error",
				message,
			});
		}
	}),
});

// Mortgage update endpoint
http.route({
	path: "/mortgages/update",
	method: "OPTIONS",
	handler: httpAction(async () => emptyCorsResponse(204)),
});

http.route({
	path: "/mortgages/update",
	method: "PATCH",
	handler: httpAction(async (ctx, request) => {
		const apiError = validateApiKey(request);
		if (apiError) {
			return apiError;
		}

		const { data, errorResponse } = await parseJsonBody(request);
		if (errorResponse) {
			return errorResponse;
		}

		const { mortgageId, ...updateData } = data as {
			mortgageId?: string;
			[key: string]: unknown;
		};

		if (!mortgageId) {
			return corsJsonResponse(400, {
				code: "missing_mortgage_id",
				message: "mortgageId is required",
			});
		}

		const parsedPayload = mortgageUpdateWebhookSchema.safeParse(updateData);
		if (!parsedPayload.success) {
			return corsJsonResponse(400, {
				code: "payload_validation_error",
				message: "Payload validation failed",
				errors: formatValidationIssues(parsedPayload.error.issues),
			});
		}

		try {
			// Convert document storage IDs
			const documents = parsedPayload.data.documents?.map((doc) => ({
				...doc,
				storageId: doc.storageId as Id<"_storage">,
			}));

			const mortgageUpdate: {
				mortgageId: Id<"mortgages">;
				loanAmount?: number;
				interestRate?: number;
				originationDate?: string;
				maturityDate?: string;
				status?: "active" | "renewed" | "closed" | "defaulted";
				address?: {
					street: string;
					city: string;
					state: string;
					zip: string;
					country: string;
				};
				location?: {
					lat: number;
					lng: number;
				};
				propertyType?: string;
				borrowerId?: Id<"borrowers">;
				documents?: Array<{
					name: string;
					type:
						| "appraisal"
						| "title"
						| "inspection"
						| "loan_agreement"
						| "insurance";
					storageId: Id<"_storage">;
					uploadDate: string;
					fileSize?: number;
				}>;
			} = {
				mortgageId: mortgageId as Id<"mortgages">,
				...(parsedPayload.data.loanAmount !== undefined && {
					loanAmount: parsedPayload.data.loanAmount,
				}),
				...(parsedPayload.data.interestRate !== undefined && {
					interestRate: parsedPayload.data.interestRate,
				}),
				...(parsedPayload.data.originationDate && {
					originationDate: parsedPayload.data.originationDate,
				}),
				...(parsedPayload.data.maturityDate && {
					maturityDate: parsedPayload.data.maturityDate,
				}),
				...(parsedPayload.data.status && {
					status: parsedPayload.data.status as
						| "active"
						| "renewed"
						| "closed"
						| "defaulted",
				}),
				...(parsedPayload.data.address && {
					address: parsedPayload.data.address,
				}),
				...(parsedPayload.data.location && {
					location: parsedPayload.data.location,
				}),
				...(parsedPayload.data.propertyType && {
					propertyType: parsedPayload.data.propertyType,
				}),
				...(parsedPayload.data.borrowerId && {
					borrowerId: parsedPayload.data.borrowerId as Id<"borrowers">,
				}),
				...(documents && { documents }),
			};
			const result = await ctx.runMutation(
				internal.mortgages.updateMortgageInternal,
				mortgageUpdate
			);

			return corsJsonResponse(200, {
				code: "mortgage_updated",
				mortgageId: result,
			});
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unknown processing error";
			logger.error("Mortgage update webhook processing failed", { message });
			return corsJsonResponse(400, {
				code: "processing_error",
				message,
			});
		}
	}),
});

// Mortgage delete endpoint
http.route({
	path: "/mortgages/delete",
	method: "OPTIONS",
	handler: httpAction(async () => emptyCorsResponse(204)),
});

http.route({
	path: "/mortgages/delete",
	method: "DELETE",
	handler: httpAction(async (ctx, request) => {
		const apiError = validateApiKey(request);
		if (apiError) {
			return apiError;
		}

		const { data, errorResponse } = await parseJsonBody(request);
		if (errorResponse) {
			return errorResponse;
		}

		const { mortgageId, ...deleteOptions } = data as {
			mortgageId?: string;
			[key: string]: unknown;
		};

		if (!mortgageId) {
			return corsJsonResponse(400, {
				code: "missing_mortgage_id",
				message: "mortgageId is required",
			});
		}

		const parsedPayload = mortgageDeleteWebhookSchema.safeParse(deleteOptions);
		if (!parsedPayload.success) {
			return corsJsonResponse(400, {
				code: "payload_validation_error",
				message: "Payload validation failed",
				errors: formatValidationIssues(parsedPayload.error.issues),
			});
		}

		try {
			const result = await ctx.runMutation(
				internal.mortgages.deleteMortgageInternal,
				{
					mortgageId: mortgageId as Id<"mortgages">,
					...parsedPayload.data,
				}
			);

			return corsJsonResponse(200, {
				code: "mortgage_deleted",
				mortgageId: result.mortgageId,
				deletedCounts: result.deletedCounts,
			});
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unknown processing error";
			logger.error("Mortgage delete webhook processing failed", { message });
			return corsJsonResponse(400, {
				code: "processing_error",
				message,
			});
		}
	}),
});

http.route({
	path: "/mortgages/create",
	method: "OPTIONS",
	handler: httpAction(async () => emptyCorsResponse(204)),
});

http.route({
	path: "/mortgages/create",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const apiError = validateApiKey(request);
		if (apiError) {
			return apiError;
		}

		const { data, errorResponse } = await parseJsonBody(request);
		if (errorResponse) {
			return errorResponse;
		}

		const parsedPayload = mortgageCreateSchema.safeParse(data);
		if (!parsedPayload.success) {
			return corsJsonResponse(400, {
				code: "payload_validation_error",
				message: "Payload validation failed",
				errors: formatValidationIssues(parsedPayload.error.issues),
			});
		}

		const payload = parsedPayload.data;
		const images = payload.images?.map((image) => ({
			...image,
			storageId: image.storageId as Id<"_storage">,
		}));
		const documents = payload.documents?.map((document) => ({
			...document,
			storageId: document.storageId as Id<"_storage">,
		}));

		try {
			const result = await ctx.runMutation(
				internal.mortgages.createMortgageInternal,
				{
					...payload,
					images,
					documents,
					borrowerId: payload.borrowerId
						? (payload.borrowerId as Id<"borrowers">)
						: undefined,
				}
			);

			return corsJsonResponse(result.created ? 201 : 200, {
				code: result.created ? "mortgage_created" : "mortgage_already_exists",
				result,
			});
		} catch (error) {
			if (isInvalidIdError(error, "borrowers")) {
				return corsJsonResponse(400, {
					code: "invalid_borrower_id",
					message: "Invalid borrowerId",
				});
			}

			if (
				error instanceof Error &&
				(error.message === "invalid_borrower_id" ||
					error.message === "borrower_not_found" ||
					error.message === "missing_borrower_reference" ||
					error.message === "mortgage_borrower_mismatch")
			) {
				return corsJsonResponse(400, {
					code: error.message,
					message: error.message,
				});
			}

			return corsJsonResponse(400, {
				code: "processing_error",
				message:
					error instanceof Error ? error.message : "Unknown processing error",
			});
		}
	}),
});

http.route({
	path: "/mortgages/get",
	method: "OPTIONS",
	handler: httpAction(async () => emptyCorsResponse(204)),
});

http.route({
	path: "/mortgages/get",
	method: "GET",
	handler: httpAction(async (ctx, request) => {
		const apiError = validateApiKey(request);
		if (apiError) {
			return apiError;
		}

		const params = new URL(request.url).searchParams;
		if (!(params.get("mortgageId") || params.get("externalMortgageId"))) {
			return corsJsonResponse(400, {
				code: "missing_identifier",
				message: "Provide mortgageId or externalMortgageId",
			});
		}

		const { data, errorResponse } = parseQueryParams(
			request,
			mortgageGetQuerySchema
		);
		if (errorResponse) {
			return errorResponse;
		}

		let result: unknown;
		try {
			result = await ctx.runQuery(internal.mortgages.getMortgageInternal, {
				mortgageId: data?.mortgageId
					? (data.mortgageId as Id<"mortgages">)
					: undefined,
				externalMortgageId: data?.externalMortgageId,
				includeBorrower: data?.includeBorrower,
				includeListing: data?.includeListing,
			});
		} catch (error) {
			if (isInvalidIdError(error, "mortgages")) {
				return corsJsonResponse(404, {
					code: "mortgage_not_found",
					message: "Mortgage not found",
				});
			}
			throw error;
		}

		if (!result) {
			return corsJsonResponse(404, {
				code: "mortgage_not_found",
				message: "Mortgage not found",
			});
		}

		return corsJsonResponse(200, {
			code: "mortgage_found",
			result,
		});
	}),
});

http.route({
	path: "/mortgages/list",
	method: "OPTIONS",
	handler: httpAction(async () => emptyCorsResponse(204)),
});

http.route({
	path: "/mortgages/list",
	method: "GET",
	handler: httpAction(async (ctx, request) => {
		const apiError = validateApiKey(request);
		if (apiError) {
			return apiError;
		}

		const { data, errorResponse } = parseQueryParams(
			request,
			mortgageListQuerySchema
		);
		if (errorResponse) {
			return errorResponse;
		}

		const result = await ctx.runQuery(
			internal.mortgages.listMortgagesInternal,
			{
				...data,
				borrowerId: data?.borrowerId
					? (data.borrowerId as Id<"borrowers">)
					: undefined,
			}
		);

		return corsJsonResponse(200, {
			code: "mortgages_listed",
			result,
		});
	}),
});

http.route({
	path: "/listings/get",
	method: "OPTIONS",
	handler: httpAction(async () => emptyCorsResponse(204)),
});

http.route({
	path: "/listings/get",
	method: "GET",
	handler: httpAction(async (ctx, request) => {
		const apiError = validateApiKey(request);
		if (apiError) {
			return apiError;
		}

		const params = new URL(request.url).searchParams;
		if (
			!(
				params.get("listingId") ||
				params.get("mortgageId") ||
				params.get("externalMortgageId")
			)
		) {
			return corsJsonResponse(400, {
				code: "missing_identifier",
				message: "Provide listingId, mortgageId, or externalMortgageId",
			});
		}

		const { data, errorResponse } = parseQueryParams(
			request,
			listingGetQuerySchema
		);
		if (errorResponse) {
			return errorResponse;
		}

		let result: unknown;
		try {
			result = await ctx.runQuery(internal.listings.getListingInternal, {
				listingId: data?.listingId
					? (data.listingId as Id<"listings">)
					: undefined,
				mortgageId: data?.mortgageId
					? (data.mortgageId as Id<"mortgages">)
					: undefined,
				externalMortgageId: data?.externalMortgageId,
				includeMortgage: data?.includeMortgage,
				includeBorrower: data?.includeBorrower,
				includeComparables: data?.includeComparables,
			});
		} catch (error) {
			if (isInvalidIdError(error, "listings")) {
				return corsJsonResponse(404, {
					code: "listing_not_found",
					message: "Listing not found",
				});
			}
			throw error;
		}

		if (!result) {
			return corsJsonResponse(404, {
				code: "listing_not_found",
				message: "Listing not found",
			});
		}

		return corsJsonResponse(200, {
			code: "listing_found",
			result,
		});
	}),
});

http.route({
	path: "/listings/list",
	method: "OPTIONS",
	handler: httpAction(async () => emptyCorsResponse(204)),
});

http.route({
	path: "/listings/list",
	method: "GET",
	handler: httpAction(async (ctx, request) => {
		const apiError = validateApiKey(request);
		if (apiError) {
			return apiError;
		}

		const { data, errorResponse } = parseQueryParams(
			request,
			listingListQuerySchema
		);
		if (errorResponse) {
			return errorResponse;
		}

		const result = await ctx.runQuery(internal.listings.listListingsInternal, {
			...data,
			borrowerId: data?.borrowerId
				? (data.borrowerId as Id<"borrowers">)
				: undefined,
			lockedBy: data?.lockedBy ? (data.lockedBy as Id<"users">) : undefined,
		});

		return corsJsonResponse(200, {
			code: "listings_listed",
			result,
		});
	}),
});

http.route({
	path: "/create-test-user",
	method: "OPTIONS",
	handler: httpAction(
		async (_ctx, _request) =>
			new Response(null, {
				status: 204,
				headers: {
					"Access-Control-Allow-Origin": "https://glad-lime-rabbit.twenty.com",
					"Access-Control-Allow-Methods": "POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, X-Webhook-Signature",
					"Access-Control-Max-Age": "86400",
				},
			})
	),
});

http.route({
	path: "/create-test-user",
	method: "POST",
	handler: httpAction(async (_ctx, request) => {
		logger.info("Creating test user");
		const body = await request.formData();
		const ltv = body.get("ltv");
		logger.info("Request body: ", { body, ltv });
		return new Response(JSON.stringify({ message: "Test user created" }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}),
});

http.route({
	path: "/workos-webhook",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		// Read body as ArrayBuffer first to preserve exact bytes
		const bodyBuffer = await request.arrayBuffer();
		const bodyText = new TextDecoder("utf-8").decode(bodyBuffer);

		const sigHeaderRaw = request.headers.get("workos-signature");
		if (!sigHeaderRaw) {
			return new Response(
				JSON.stringify({
					status: "error",
					message: "Missing workos-signature header",
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}
		const sigHeader = String(sigHeaderRaw);

		// Add additional debugging info
		logger.debug("HTTP Request debug:", {
			bodyLength: bodyBuffer.byteLength,
			contentType: request.headers.get("content-type"),
			userAgent: request.headers.get("user-agent"),
		});

		try {
			// Verify webhook signature
			const event = await ctx.runAction(internal.workos.verifyWebhook, {
				payload: bodyText,
				signature: sigHeader,
			});

			const { data, event: eventType } = JSON.parse(bodyText);

			// Normalize null values to undefined for Convex compatibility
			const normalizedData = normalizeNullToUndefined(data);

			logger.info("Processing WorkOS webhook event:", {
				eventId: event.id,
				eventType,
				userId: data.id,
				email: data.email,
			});

			// Handle different webhook events
			switch (eventType) {
				case "user.created": {
					logger.info("Processing user.created event");
					const res = await ctx.runMutation(internal.users.create, {
						idp_id: data.id,
						email: data.email,
						email_verified: data.email_verified,
						first_name: data.first_name ?? undefined,
						last_name: data.last_name ?? undefined,
						profile_picture:
							data.profile_picture_url ?? data.profile_picture ?? undefined,
						created_at: data.created_at ?? data.createdAt,
						updated_at: data.updated_at ?? data.updatedAt ?? undefined,
						last_sign_in_at: data.last_sign_in_at ?? undefined,
						external_id: data.external_id ?? data.externalId ?? undefined,
						metadata: data.metadata,
					});

					if (!res) {
						logger.error("Failed to upsert user:", {
							userId: data.id,
							email: data.email,
						});
						throw new Error(
							`Failed to upsert user: ${data.idp_id} RES: ${res}`
						);
					}

					logger.info("Successfully processed user.created event:", {
						userId: res._id,
						workosId: data.id,
						email: data.email,
					});

					break;
				}
				case "user.updated": {
					logger.info("Processing user.updated event");
					const _res = await ctx.runMutation(internal.users.updateFromWorkOS, {
						idp_id: data.id,
						email: data.email,
						email_verified: data.email_verified,
						first_name: data.first_name ?? undefined,
						last_name: data.last_name ?? undefined,
						profile_picture:
							data.profile_picture_url ?? data.profile_picture ?? undefined,
						created_at: data.created_at ?? data.createdAt ?? undefined,
						updated_at: data.updated_at ?? data.updatedAt ?? undefined,
						last_sign_in_at: data.last_sign_in_at ?? undefined,
						external_id: data.external_id ?? data.externalId ?? undefined,
						metadata: data.metadata,
					});

					break;
				}
				case "user.deleted": {
					logger.info("Processing user.deleted event");
					const res = await ctx.runMutation(internal.users.destroyByWorkosId, {
						workosUserId: data.id,
					});

					if (!res) {
						logger.warn(
							"User not found for deletion (may have been deleted already):",
							{
								workosUserId: data.id,
								email: data.email,
							}
						);
						// Return success even if user not found - idempotent delete
						return new Response(
							JSON.stringify({
								status: "success",
								message: "User not found or already deleted",
								workosUserId: data.id,
							}),
							{ status: 200, headers: { "Content-Type": "application/json" } }
						);
					}

					logger.info("Successfully processed user.deleted event:", {
						userId: res._id,
						workosId: data.id,
						email: data.email,
					});

					break;
				}

				case "role.created": {
					logger.info("Processing role.created event");
					const _res = await ctx.runMutation(
						internal.roles.createOrUpdateRole,
						{
							slug: data.slug,
							name: data.name || data.slug, // Use slug as name if not provided
							permissions: data.permissions || [],
							created_at: data.created_at,
							updated_at: data.updated_at,
						}
					);
					break;
				}
				case "role.updated": {
					logger.info("Processing role.updated event");
					const res = await ctx.runMutation(internal.roles.createOrUpdateRole, {
						slug: data.slug,
						name: data.name || data.slug, // Use slug as name if not provided
						permissions: data.permissions || [],
						created_at: data.created_at,
						updated_at: data.updated_at,
					});

					logger.info("Successfully processed role.updated event:", {
						roleId: res,
						slug: data.slug,
						permissions: data.permissions,
					});

					break;
				}

				case "role.deleted": {
					logger.info("Processing role.deleted event");
					const res = await ctx.runMutation(internal.roles.deleteRole, {
						slug: data.slug,
					});

					if (res.success) {
						logger.info("Successfully processed role.deleted event:", {
							slug: data.slug,
						});
					} else {
						logger.error("Failed to process role.deleted event:", {
							slug: data.slug,
							error: res.message,
						});
					}

					break;
				}

				case "organization.created": {
					logger.info("Processing organization.created event");
					const res = await ctx.runMutation(
						internal.organizations.createOrUpdateOrganization,
						{
							id: normalizedData.id,
							name: normalizedData.name,
							external_id: normalizedData.external_id,
							metadata: normalizedData.metadata,
							created_at: normalizedData.created_at,
							updated_at: normalizedData.updated_at,
							domains: normalizedData.domains,
						}
					);

					logger.info("Successfully processed organization.created event:", {
						organizationId: res,
						workosId: normalizedData.id,
						name: normalizedData.name,
						domainsCount: normalizedData.domains?.length || 0,
					});

					break;
				}

				case "organization.updated": {
					logger.info("Processing organization.updated event");
					const res = await ctx.runMutation(
						internal.organizations.createOrUpdateOrganization,
						{
							id: normalizedData.id,
							name: normalizedData.name,
							external_id: normalizedData.external_id,
							metadata: normalizedData.metadata,
							created_at: normalizedData.created_at,
							updated_at: normalizedData.updated_at,
							domains: normalizedData.domains,
						}
					);

					logger.info("Successfully processed organization.updated event:", {
						organizationId: res,
						workosId: normalizedData.id,
						name: normalizedData.name,
						domainsCount: normalizedData.domains?.length || 0,
					});

					break;
				}

				case "organization.deleted": {
					logger.info("Processing organization.deleted event");
					const res = await ctx.runMutation(
						internal.organizations.deleteOrganization,
						{
							id: normalizedData.id,
						}
					);

					if (res.success) {
						logger.info("Successfully processed organization.deleted event:", {
							workosId: normalizedData.id,
							name: normalizedData.name,
						});
					} else {
						logger.error("Failed to process organization.deleted event:", {
							workosId: normalizedData.id,
							name: normalizedData.name,
							error: res.message,
						});
					}

					break;
				}

				case "organization_membership.created": {
					logger.info("Processing organization_membership.created event");

					// Ensure the organization record exists in Convex before saving the membership
					await ctx.runAction(internal.workos.syncSingleOrganization, {
						organizationId: normalizedData.organization_id,
					});

					const res = await ctx.runMutation(
						internal.organizations.createOrUpdateMembership,
						{
							id: normalizedData.id,
							user_id: normalizedData.user_id,
							organization_id: normalizedData.organization_id,
							status: normalizedData.status,
							role: normalizedData.role,
							roles: normalizedData.roles,
							object: normalizedData.object,
							created_at: normalizedData.created_at,
							updated_at: normalizedData.updated_at,
						}
					);

					// Auto-link broker if this user is a broker and doesn't have an org yet
					const linkResult = await ctx.runMutation(
						internal.brokers.management.linkBrokerWorkosOrgIfNeeded,
						{
							workosUserId: normalizedData.user_id,
							workosOrgId: normalizedData.organization_id,
						}
					);

					if (linkResult.linked) {
						logger.info(
							"Auto-linked broker to WorkOS organization via membership webhook",
							{
								brokerId: linkResult.brokerId,
								workosOrgId: normalizedData.organization_id,
							}
						);
					}

					logger.info(
						"Successfully processed organization_membership.created event:",
						{
							membershipId: res,
							workosId: normalizedData.id,
							userId: normalizedData.user_id,
							organizationId: normalizedData.organization_id,
							status: normalizedData.status,
						}
					);

					break;
				}

				case "organization_membership.updated": {
					logger.info("Processing organization_membership.updated event");

					// Ensure the organization record exists in Convex
					await ctx.runAction(internal.workos.syncSingleOrganization, {
						organizationId: normalizedData.organization_id,
					});

					const res = await ctx.runMutation(
						internal.organizations.createOrUpdateMembership,
						{
							id: normalizedData.id,
							user_id: normalizedData.user_id,
							organization_id: normalizedData.organization_id,
							status: normalizedData.status,
							role: normalizedData.role,
							roles: normalizedData.roles,
							object: normalizedData.object,
							created_at: normalizedData.created_at,
							updated_at: normalizedData.updated_at,
						}
					);

					logger.info(
						"Successfully processed organization_membership.updated event:",
						{
							membershipId: res,
							workosId: normalizedData.id,
							userId: normalizedData.user_id,
							organizationId: normalizedData.organization_id,
							status: normalizedData.status,
						}
					);

					break;
				}

				case "organization_membership.deleted": {
					logger.info("Processing organization_membership.deleted event");
					const res = await ctx.runMutation(
						internal.organizations.deleteMembership,
						{
							id: normalizedData.id,
						}
					);

					if (res.success) {
						logger.info(
							"Successfully processed organization_membership.deleted event:",
							{
								workosId: normalizedData.id,
								membershipId: normalizedData.id,
							}
						);
					} else {
						logger.error(
							"Failed to process organization_membership.deleted event:",
							{
								workosId: normalizedData.id,
								error: res.message,
							}
						);
					}

					break;
				}

				default: {
					logger.info("Received unhandled webhook event:", {
						eventType,
						eventId: event.id,
					});

					// Return success for unhandled events to avoid WorkOS retrying
					return new Response(
						JSON.stringify({
							status: "success",
							message: `Event type ${eventType} received but not handled`,
							eventId: event.id,
						}),
						{ status: 200, headers: { "Content-Type": "application/json" } }
					);
				}
			}

			// Return success response for processed events
			return new Response(
				JSON.stringify({
					status: "success",
					message: `Successfully processed ${eventType} event`,
					eventId: event.id,
					timestamp: new Date().toISOString(),
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } }
			);
		} catch (error) {
			logger.error("Webhook processing failed:", {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				bodyLength: bodyBuffer.byteLength,
				signaturePresent: !!sigHeader,
			});

			// Return error response
			return new Response(
				JSON.stringify({
					status: "error",
					message: "Webhook processing failed",
					error: error instanceof Error ? error.message : String(error),
					timestamp: new Date().toISOString(),
				}),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				}
			);
		}
	}),
});

export default http;

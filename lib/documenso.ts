"use server";

export type {
	DocumensoDocumentSummary,
	SignatoryOption,
} from "./types/documenso";

import type {
	DocumensoDocumentStatus,
	DocumensoDocumentSummary,
	DocumensoRecipientReadStatus,
	DocumensoRecipientRole,
	DocumensoRecipientSendStatus,
	DocumensoRecipientSigningStatus,
} from "./types/documenso";

const DEFAULT_DOCUMENSO_BASE_URL = "https://app.documenso.com/api/v2";

type DocumensoRecipient = {
	id: number;
	email: string;
	name: string;
	token: string;
	role: DocumensoRecipientRole;
	signingStatus: DocumensoRecipientSigningStatus;
	readStatus: DocumensoRecipientReadStatus;
	sendStatus: DocumensoRecipientSendStatus;
	signingOrder: number | null;
	rejectionReason?: string | null;
};

type DocumensoDocument = {
	id: number;
	externalId?: string | null;
	title: string;
	status: DocumensoDocumentStatus;
	createdAt: string;
	updatedAt: string;
	completedAt: string | null;
	recipients: DocumensoRecipient[];
};

type DocumensoDocumentFindResponse = {
	data: DocumensoDocument[];
	count: number;
	currentPage: number;
	perPage: number;
	totalPages: number;
};

type FindDocumentsParams = {
	status?: DocumensoDocumentStatus;
	page?: number;
	perPage?: number;
};

// --- New Types for Template Association ---

export type DocumensoTemplate = {
	id: number;
	title: string;
	externalId?: string | null;
	createdAt: string;
	updatedAt: string;
	recipients?: {
		id: number;
		email: string;
		name: string;
		role: DocumensoRecipientRole;
		signingOrder: number | null;
	}[];
};

export type DocumensoTemplateSummary = {
	id: number;
	title: string;
	externalId?: string | null;
	recipients: {
		id: number;
		email: string;
		name: string;
		role: DocumensoRecipientRole;
	}[];
};

export type CreateDocumentFromTemplateParams = {
	templateId: string;
	recipients: {
		id: number; // Recipient ID from template
		email: string;
		name: string;
		role?: DocumensoRecipientRole;
	}[];
};

export type BatchCreateDocumentResult = {
	templateId: string;
	documentId?: string;
	error?: string;
	success: boolean;
};

const DOCUMENSO_TIMEOUT_MS = 15_000;
const DOCUMENSO_CREATE_TIMEOUT_MS = 30_000; // Longer timeout for document creation

class DocumensoConfigurationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "DocumensoConfigurationError";
	}
}

class DocumensoApiError extends Error {
	status: number;
	constructor(message: string, status: number) {
		super(message);
		this.name = "DocumensoApiError";
		this.status = status;
	}
}

function getDocumensoCredentials() {
	const apiKey = process.env.DOCUMENSO_API_KEY;
	if (!apiKey) {
		throw new DocumensoConfigurationError(
			"Missing DOCUMENSO_API_KEY environment variable."
		);
	}

	const serverURL =
		process.env.DOCUMENSO_API_BASE_URL ?? DEFAULT_DOCUMENSO_BASE_URL;

	return { apiKey, serverURL };
}

async function documensoRequest<T>(
	path: string,
	init?: RequestInit & { signal?: AbortSignal; timeout?: number }
) {
	const { apiKey, serverURL } = getDocumensoCredentials();
	const url = new URL(path, ensureTrailingSlash(serverURL));
	const controller = new AbortController();
	const timeoutMs = init?.timeout ?? DOCUMENSO_TIMEOUT_MS;
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(url.toString(), {
			...init,
			headers: {
				Accept: "application/json",
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
				...(init?.headers ?? {}),
			},
			// Avoid caching responses that might change frequently
			cache: "no-store",
			signal: init?.signal ?? controller.signal,
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => "");
			let message = `Documenso request failed with ${response.status}`;

			// Map status codes to user-friendly messages
			switch (response.status) {
				case 401:
					message =
						"Authentication failed. Please check your Documenso API key.";
					break;
				case 403:
					message =
						"Access denied. You do not have permission to perform this action.";
					break;
				case 404:
					message =
						"Resource not found. The template or document may have been deleted.";
					break;
				case 429:
					message = "Rate limit exceeded. Please try again later.";
					break;
				case 500:
					message = "Documenso server error. Please try again later.";
					break;
				case 504:
					message = "Documenso request timed out.";
					break;
				default:
					// Keep default message
					break;
			}

			// Append original error text if available and not HTML
			// Check Content-Type header to avoid appending HTML error pages
			const contentType =
				response.headers?.get("content-type")?.toLowerCase() ?? "";
			const isHtml =
				contentType.includes("text/html") ||
				contentType.includes("application/xhtml+xml") ||
				// Fallback: check body if header is missing
				(!contentType && errorText.includes("<!DOCTYPE html>"));

			if (errorText && !isHtml) {
				message += ` Details: ${errorText}`;
			}

			throw new DocumensoApiError(message, response.status);
		}

		if (response.status === 204) {
			return null as T;
		}

		return (await response.json()) as T;
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new DocumensoApiError("Documenso request timed out.", 504);
		}
		throw error;
	} finally {
		clearTimeout(timeout);
	}
}

// Helper to handle ID formats

function envelopeIdToNumericId(id: string | number): number {
	if (typeof id === "number") return id;
	return Number(String(id).replace("envelope_", ""));
}

function _toEnvelopeId(id: string | number): string {
	if (typeof id === "string" && id.startsWith("envelope_")) return id;
	return `envelope_${id}`;
}

// --- Template Operations ---

// Internal type for API responses (from documenso out of our control) that may have either field name
type DocumensoTemplateApiResponse = {
	id: number;
	title: string;
	externalId?: string | null;
	createdAt: string;
	updatedAt: string;
	Recipient?: {
		id: number;
		email: string;
		name: string;
		role: DocumensoRecipientRole;
		signingOrder: number | null;
	}[];
	recipients?: {
		id: number;
		email: string;
		name: string;
		role: DocumensoRecipientRole;
		signingOrder: number | null;
	}[];
};

export async function searchTemplates(
	query = "",
	perPage = 100
): Promise<DocumensoTemplateSummary[]> {
	const allTemplates: DocumensoTemplate[] = [];
	let currentPage = 1;
	let hasMorePages = true;

	// Fetch all pages until we get fewer items than perPage
	while (hasMorePages) {
		const searchParams = new URLSearchParams();
		searchParams.set("page", String(currentPage));
		searchParams.set("perPage", String(perPage));

		const response = await documensoRequest<{
			data: DocumensoTemplateApiResponse[];
		}>(`template?${searchParams.toString()}`);

		const pageData = response?.data || [];
		// Normalize API response: ensure each template has recipients field
		const normalizedData: DocumensoTemplate[] = pageData.map((t) => ({
			...t,
			recipients: t.recipients || t.Recipient || [],
		}));
		allTemplates.push(...normalizedData);

		// Stop if we got fewer items than perPage (last page) or empty response
		hasMorePages = pageData.length >= perPage;
		currentPage += 1;
	}

	// Map all accumulated templates to the summary format
	const templates = allTemplates.map((t) => ({
		id: t.id,
		title: t.title,
		externalId: t.externalId,
		recipients: (t.recipients || []).map((r) => ({
			id: r.id,
			email: r.email,
			name: r.name,
			role: r.role,
		})),
	}));

	if (!query) {
		return templates;
	}

	const lowerQuery = query.toLowerCase();
	return templates.filter((t) => t.title.toLowerCase().includes(lowerQuery));
}

export async function getTemplateDetails(
	templateId: string | number
): Promise<DocumensoTemplate> {
	const numericId = envelopeIdToNumericId(templateId);
	const template = await documensoRequest<DocumensoTemplateApiResponse>(
		`template/${numericId}`
	);
	// Normalize API response: ensure template has recipients field
	return {
		...template,
		recipients: template.recipients || template.Recipient || [],
	};
}

// --- Document Generation ---

export async function generateDocumentFromTemplate({
	templateId,
	recipients,
}: CreateDocumentFromTemplateParams): Promise<DocumensoDocument> {
	return await documensoRequest<DocumensoDocument>("template/use", {
		method: "POST",
		body: JSON.stringify({
			templateId,
			recipients,
			distributeDocument: true,
		}),
		timeout: DOCUMENSO_CREATE_TIMEOUT_MS,
	});
}

// --- Recipient Mapping Helper ---

export async function mapRecipientsForListing(
	templateId: string,
	broker: { email: string; name: string },
	investor: { email: string; name: string }
): Promise<CreateDocumentFromTemplateParams["recipients"]> {
	// ALWAYS fetch template first to get current recipient IDs
	const template = await getTemplateDetails(templateId);
	const templateRecipients = template.recipients || [];

	const recipients: CreateDocumentFromTemplateParams["recipients"] = [];

	for (const r of templateRecipients) {
		// Normalize template recipient name: trim whitespace and lowercase
		const normalizedName = r.name.trim().toLowerCase();

		// Exact placeholder matching (case-insensitive)
		if (normalizedName === "{{broker}}" || normalizedName === "broker") {
			if (!(broker.email && broker.name)) {
				throw new Error(
					`Broker email and name are required for template recipient "${r.name}"`
				);
			}
			recipients.push({ id: r.id, email: broker.email, name: broker.name });
		} else if (
			normalizedName === "{{investor}}" ||
			normalizedName === "investor"
		) {
			if (!(investor.email && investor.name)) {
				throw new Error(
					`Investor email and name are required for template recipient "${r.name}"`
				);
			}
			recipients.push({ id: r.id, email: investor.email, name: investor.name });
		} else {
			// For non-placeholder recipients, validate they have proper email/name
			if (!(r.email && r.name)) {
				throw new Error(
					`Template recipient "${r.name}" has invalid email or name. ` +
						'Expected exact placeholders: "{{broker}}", "{{investor}}", "broker", or "investor", ' +
						"or valid email/name pairs."
				);
			}
			// Keep other recipients unchanged
			recipients.push({ id: r.id, email: r.email, name: r.name });
		}
	}

	// Validate all template recipients were mapped
	if (recipients.length !== templateRecipients.length) {
		throw new Error(
			`Failed to map all template recipients for template ${templateId}. ` +
				`Expected ${templateRecipients.length} recipients, got ${recipients.length}.`
		);
	}

	// Validate all mapped emails are non-empty
	const emptyEmails = recipients.filter((rec) => !rec.email);
	if (emptyEmails.length > 0) {
		throw new Error(
			`Template ${templateId} has ${emptyEmails.length} recipients with empty emails. ` +
				"All recipients must have valid email addresses."
		);
	}

	return recipients;
}

// --- Batch Creation ---

export async function generateDocumentsFromTemplates(
	templates: {
		documensoTemplateId: string;
		name: string;
	}[],
	broker: { email: string; name: string },
	investor: { email: string; name: string }
): Promise<BatchCreateDocumentResult[]> {
	const results: BatchCreateDocumentResult[] = [];

	for (const templateConfig of templates) {
		try {
			// 1. Map recipients
			const recipients = await mapRecipientsForListing(
				templateConfig.documensoTemplateId,
				broker,
				investor
			);

			// 2. Create document
			const document = await generateDocumentFromTemplate({
				templateId: templateConfig.documensoTemplateId,
				recipients,
			});

			results.push({
				templateId: templateConfig.documensoTemplateId,
				documentId: String(document.id),
				success: true,
			});
		} catch (error) {
			console.error(
				`Failed to generate document for template ${templateConfig.documensoTemplateId}:`,
				error
			);
			results.push({
				templateId: templateConfig.documensoTemplateId,
				error: error instanceof Error ? error.message : "Unknown error",
				success: false,
			});
		}
	}

	return results;
}

function ensureTrailingSlash(url: string) {
	return url.endsWith("/") ? url : `${url}/`;
}

function buildQuery(params: FindDocumentsParams) {
	const searchParams = new URLSearchParams();

	if (params.status) {
		searchParams.set("status", params.status);
	}

	if (typeof params.page === "number") {
		searchParams.set("page", String(params.page));
	}

	if (typeof params.perPage === "number") {
		searchParams.set("perPage", String(params.perPage));
	}

	return searchParams.toString();
}

function mapDocument(document: DocumensoDocument): DocumensoDocumentSummary {
	const recipients = (document.recipients ?? [])
		.filter((recipient) => Boolean(recipient?.token))
		.map((recipient) => ({
			id: recipient.id,
			email: recipient.email,
			name: recipient.name,
			token: recipient.token,
			role: recipient.role,
			signingStatus: recipient.signingStatus,
			readStatus: recipient.readStatus,
			sendStatus: recipient.sendStatus,
			signingOrder:
				typeof recipient.signingOrder === "number"
					? recipient.signingOrder
					: null,
			rejectionReason: recipient.rejectionReason,
		}));

	return {
		id: document.id,
		externalId: document.externalId ?? null,
		title: document.title,
		status: document.status,
		createdAt: document.createdAt,
		updatedAt: document.updatedAt,
		completedAt: document.completedAt ?? null,
		recipients,
	};
}

export async function findDocumensoDocuments(
	params: FindDocumentsParams = {}
): Promise<DocumensoDocumentSummary[]> {
	const query = buildQuery({
		status: params.status,
		page: params.page,
		perPage: params.perPage,
	});

	const path = query.length > 0 ? `document?${query}` : "document";
	const response = await documensoRequest<DocumensoDocumentFindResponse>(path);
	const documents = Array.isArray(response?.data) ? response.data : [];

	return documents.map(mapDocument);
}

export async function getDocument(
	documentId: string | number
): Promise<DocumensoDocumentSummary> {
	const numericId = envelopeIdToNumericId(documentId);
	const document = await documensoRequest<DocumensoDocument>(
		`document/${numericId}`
	);
	return mapDocument(document);
}

export async function listDocumentsReadyForSigning() {
	return findDocumensoDocuments({ status: "PENDING", perPage: 50 });
}

export { DocumensoApiError, DocumensoConfigurationError };

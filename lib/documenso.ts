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
	init?: RequestInit & { signal?: AbortSignal }
) {
	const { apiKey, serverURL } = getDocumensoCredentials();
	const url = new URL(path, ensureTrailingSlash(serverURL));
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), DOCUMENSO_TIMEOUT_MS);

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

			// Append original error text if available and not generic
			if (errorText && !errorText.includes("<!DOCTYPE html>")) {
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

export async function searchTemplates(
	query = ""
): Promise<DocumensoTemplateSummary[]> {
	const searchParams = new URLSearchParams();
	// Fetch more templates to allow for better client-side filtering
	searchParams.set("perPage", "100");

	const response = await documensoRequest<{ data: DocumensoTemplate[] }>(
		`template?${searchParams.toString()}`
	);

	const templates = (response?.data || []).map((t) => ({
		id: t.id,
		title: t.title,
		externalId: t.externalId,
		recipients: (t.Recipient || t.recipients || []).map((r) => ({
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
	return await documensoRequest<DocumensoTemplate>(`template/${numericId}`);
}

// --- Document Generation ---

export async function generateDocumentFromTemplate({
	templateId,
	recipients,
}: CreateDocumentFromTemplateParams): Promise<DocumensoDocument> {
	// const envelopeId = toEnvelopeId(templateId);

	// Use longer timeout for creation
	const { apiKey, serverURL } = getDocumensoCredentials();
	const url = new URL("template/use", ensureTrailingSlash(serverURL));
	const controller = new AbortController();
	const timeout = setTimeout(
		() => controller.abort(),
		DOCUMENSO_CREATE_TIMEOUT_MS
	);

	try {
		const response = await fetch(url.toString(), {
			method: "POST",
			headers: {
				Accept: "application/json",
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				templateId,
				recipients,
				distributeDocument: true,
			}),
			signal: controller.signal,
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => "");
			throw new DocumensoApiError(
				errorText ||
					`Documenso document creation failed with ${response.status}`,
				response.status
			);
		}

		return (await response.json()) as DocumensoDocument;
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new DocumensoApiError(
				"Documenso document creation timed out.",
				504
			);
		}
		throw error;
	} finally {
		clearTimeout(timeout);
	}
}

// --- Recipient Mapping Helper ---

export async function mapRecipientsForListing(
	templateId: string,
	broker: { email: string; name: string },
	investor: { email: string; name: string }
): Promise<CreateDocumentFromTemplateParams["recipients"]> {
	// ALWAYS fetch template first to get current recipient IDs
	const template = await getTemplateDetails(templateId);
	const templateRecipients = template.Recipient || template.recipients || [];

	const recipients: CreateDocumentFromTemplateParams["recipients"] = [];

	for (const r of templateRecipients) {
		const nameLower = r.name.toLowerCase();

		// Match by name pattern (case-insensitive, with or without {{}})
		if (nameLower.includes("{{broker}}") || nameLower.includes("broker")) {
			recipients.push({ id: r.id, email: broker.email, name: broker.name });
		} else if (
			nameLower.includes("{{investor}}") ||
			nameLower.includes("investor")
		) {
			recipients.push({ id: r.id, email: investor.email, name: investor.name });
		} else {
			// Keep other recipients unchanged (or maybe throw error if strict?)
			// For now, we'll keep them but this might fail if email is invalid/placeholder
			recipients.push({ id: r.id, email: r.email, name: r.name });
		}
	}

	// Validate all template recipients were mapped
	if (recipients.length !== templateRecipients.length) {
		throw new Error(
			`Failed to map all template recipients for template ${templateId}`
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

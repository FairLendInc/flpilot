"use server";

const DEFAULT_DOCUMENSO_BASE_URL = "https://app.documenso.com/api/v2-beta";

type DocumensoDocumentStatus = "DRAFT" | "PENDING" | "COMPLETED" | "REJECTED";
type DocumensoRecipientRole =
	| "SIGNER"
	| "APPROVER"
	| "CC"
	| "ASSISTANT"
	| "VIEWER"
	| "DELEGATE"
	| "IN_PERSON_HOST"
	| "WITNESS"
	| "SHAREHOLDER"
	| string;
type DocumensoRecipientSigningStatus = "NOT_SIGNED" | "SIGNED" | "REJECTED";
type DocumensoRecipientReadStatus = "NOT_OPENED" | "OPENED";
type DocumensoRecipientSendStatus = "NOT_SENT" | "SENT";

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

export type SignatoryOption = {
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

export type DocumensoDocumentSummary = {
	id: number;
	externalId?: string | null;
	title: string;
	status: DocumensoDocumentStatus;
	createdAt: string;
	updatedAt: string;
	completedAt: string | null;
	recipients: SignatoryOption[];
};

type FindDocumentsParams = {
	status?: DocumensoDocumentStatus;
	page?: number;
	perPage?: number;
};

const DOCUMENSO_TIMEOUT_MS = 15_000;

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
			throw new DocumensoApiError(
				errorText || `Documenso request failed with ${response.status}`,
				response.status
			);
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

export async function listDocumentsReadyForSigning() {
	return findDocumensoDocuments({ status: "PENDING", perPage: 50 });
}

export { DocumensoApiError, DocumensoConfigurationError };

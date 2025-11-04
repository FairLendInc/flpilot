import { NextResponse } from "next/server";

import {
	DocumensoApiError,
	DocumensoConfigurationError,
	type DocumensoDocumentSummary,
	findDocumensoDocuments,
} from "@/lib/documenso";

const VALID_STATUSES = new Set([
	"DRAFT",
	"PENDING",
	"COMPLETED",
	"REJECTED",
] as const);

function parseStatus(value: string | null) {
	if (!value) {
		return "PENDING" as const;
	}

	const upper = value.toUpperCase();
	return VALID_STATUSES.has(upper as never)
		? (upper as DocumensoDocumentSummary["status"])
		: ("PENDING" as const);
}

function parseNumber(value: string | null) {
	if (!value) return;
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function filterReadyForSigning(documents: DocumensoDocumentSummary[]) {
	return documents
		.filter((document) => document.status === "PENDING")
		.map((document) => ({
			...document,
			recipients: document.recipients.filter(
				(recipient) => recipient.signingStatus !== "SIGNED"
			),
		}))
		.filter((document) => document.recipients.length > 0);
}

export async function GET(request: Request) {
	const url = new URL(request.url);
	const status = parseStatus(url.searchParams.get("status"));
	const perPage = parseNumber(url.searchParams.get("perPage")) ?? 50;
	const page = parseNumber(url.searchParams.get("page"));

	try {
		const documents = await findDocumensoDocuments({
			status,
			perPage,
			page,
		});

		const readyDocuments = filterReadyForSigning(documents);

		return NextResponse.json({
			documents: readyDocuments,
			count: readyDocuments.length,
		});
	} catch (error) {
		if (error instanceof DocumensoConfigurationError) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		if (error instanceof DocumensoApiError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status }
			);
		}

		return NextResponse.json(
			{ error: "Unexpected error while fetching Documenso documents." },
			{ status: 500 }
		);
	}
}

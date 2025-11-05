"use client";

import type { MockDocument } from "@/lib/mock-data/listings";
import { DocumentViewer } from "./document-viewer";

type DocumentViewerWrapperProps = {
	documents: MockDocument[];
};

/**
 * Wrapper component that passes through documents with their pre-fetched URLs
 * Documents already have their correct URLs from the database transformation
 */
export function DocumentViewerWrapper({
	documents,
}: DocumentViewerWrapperProps) {
	// Documents already have their URLs set by transformMortgageForComponents
	// Just pass them through directly
	return <DocumentViewer documents={documents} />;
}

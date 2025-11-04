"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { MockDocument } from "@/lib/mock-data/listings";
import { DocumentViewer } from "./document-viewer";

type DocumentViewerWrapperProps = {
	documents: MockDocument[];
};

/**
 * Wrapper component that fetches real Convex storage URLs and injects them into mock documents
 * This replaces placeholder URLs with signed URLs from Convex storage
 */
export function DocumentViewerWrapper({
	documents,
}: DocumentViewerWrapperProps) {
	// Fetch the signed URL from Convex
	const testDocumentUrl = useQuery(api.storage.getTestDocumentUrl);

	// If still loading, show the viewer with placeholder URLs
	if (testDocumentUrl === undefined) {
		return <DocumentViewer documents={documents} />;
	}

	// If we have a real URL, inject it into all documents
	if (testDocumentUrl) {
		const documentsWithRealUrls = documents.map((doc) => ({
			...doc,
			url: testDocumentUrl,
		}));

		return <DocumentViewer documents={documentsWithRealUrls} />;
	}

	// Fallback to original documents if URL fetch failed
	return <DocumentViewer documents={documents} />;
}

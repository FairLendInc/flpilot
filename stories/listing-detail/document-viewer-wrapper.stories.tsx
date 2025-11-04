import type { Meta, StoryObj } from "@storybook/react";
import { DocumentViewerWrapper } from "@/components/listing-detail/document-viewer-wrapper";
import type { MockDocument } from "@/lib/mock-data/listings";

/**
 * DocumentViewerWrapper integrates with Convex to fetch real signed URLs
 * for documents stored in Convex file storage.
 *
 * Note: This requires a running Convex backend and the test file to exist.
 * For development without Convex, use the DocumentViewer component directly.
 */
const meta = {
	title: "Listing Detail/Document Viewer Wrapper",
	component: DocumentViewerWrapper,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof DocumentViewerWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to create mock documents with placeholder URLs
// The wrapper will replace these with real Convex URLs
const createMockDocument = (
	id: number,
	type: "appraisal" | "title" | "inspection" | "loan",
	name: string
): MockDocument => {
	return {
		_id: `doc_${id}`,
		name,
		type,
		url: "https://placeholder.com/document.pdf", // Will be replaced by wrapper
		uploadDate: new Date(
			Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000
		).toISOString(),
		fileSize: Math.floor(Math.random() * 4500000) + 500000,
	};
};

/**
 * Default story showing the wrapper fetching a real Convex file
 * and displaying it in the viewer.
 */
export const WithConvexFile: Story = {
	args: {
		documents: [
			createMockDocument(1, "appraisal", "Property Appraisal Report"),
			createMockDocument(2, "title", "Title Report & Insurance"),
			createMockDocument(3, "inspection", "Property Inspection Report"),
			createMockDocument(4, "loan", "Loan Agreement Documents"),
		],
	},
};

/**
 * Single document from Convex storage
 */
export const SingleDocument: Story = {
	args: {
		documents: [
			createMockDocument(1, "appraisal", "Property Appraisal Report"),
		],
	},
};

/**
 * Shows how the wrapper handles loading states
 * while fetching the Convex URL
 */
export const LoadingState: Story = {
	args: {
		documents: [
			createMockDocument(1, "appraisal", "Property Appraisal Report"),
			createMockDocument(2, "title", "Title Report & Insurance"),
		],
	},
	parameters: {
		docs: {
			description: {
				story:
					"The wrapper shows the viewer immediately with placeholder URLs, then updates to real Convex URLs once fetched.",
			},
		},
	},
};

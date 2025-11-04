import type { Meta, StoryObj } from "@storybook/react";
import { DocumentViewer } from "@/components/listing-detail/document-viewer";
import type { MockDocument } from "@/lib/mock-data/listings";

const meta = {
	title: "Listing Detail/DocumentViewer",
	component: DocumentViewer,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"PDF document viewer with dropdown selection using Adobe PDF Embed API. Displays property documents such as appraisals, title reports, inspections, and loan agreements in a sized container.",
			},
		},
	},
	tags: ["autodocs"],
} satisfies Meta<typeof DocumentViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to create mock documents
const createMockDocument = (
	id: number,
	type: "appraisal" | "title" | "inspection" | "loan",
	name: string
): MockDocument => {
	// Use test PDF URL that works with Adobe PDF Embed API
	// TODO: In production, use ctx.storage.getUrl() to get signed URLs from Convex
	const pdfUrl =
		"https://documentservices.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf";

	return {
		_id: `doc_${id}`,
		name,
		type,
		url: pdfUrl,
		uploadDate: new Date(
			Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000
		).toISOString(),
		fileSize: Math.floor(Math.random() * 4500000) + 500000, // 500KB to 5MB
	};
};

export const Default: Story = {
	args: {
		documents: [
			createMockDocument(1, "appraisal", "Property Appraisal Report"),
			createMockDocument(2, "title", "Title Report & Insurance"),
			createMockDocument(3, "inspection", "Property Inspection Report"),
			createMockDocument(4, "loan", "Loan Agreement Documents"),
		],
	},
	parameters: {
		docs: {
			description: {
				story:
					"Standard document viewer with four common real estate documents: appraisal, title, inspection, and loan agreements.",
			},
		},
	},
};

export const SingleDocument: Story = {
	args: {
		documents: [
			createMockDocument(1, "appraisal", "Property Appraisal Report"),
		],
	},
	parameters: {
		docs: {
			description: {
				story:
					"Viewer with only a single document. Useful for properties with minimal documentation.",
			},
		},
	},
};

export const ManyDocuments: Story = {
	args: {
		documents: [
			createMockDocument(1, "appraisal", "Initial Property Appraisal"),
			createMockDocument(2, "appraisal", "Updated Appraisal Report"),
			createMockDocument(3, "title", "Preliminary Title Report"),
			createMockDocument(4, "title", "Final Title Insurance Policy"),
			createMockDocument(5, "inspection", "Home Inspection Report"),
			createMockDocument(6, "inspection", "Termite Inspection"),
			createMockDocument(7, "inspection", "Roof Inspection Report"),
			createMockDocument(8, "loan", "Loan Application"),
			createMockDocument(9, "loan", "Loan Agreement"),
			createMockDocument(10, "loan", "Promissory Note"),
			createMockDocument(11, "loan", "Deed of Trust"),
			createMockDocument(12, "loan", "Closing Disclosure"),
		],
	},
	parameters: {
		docs: {
			description: {
				story:
					"Viewer with many documents (12+) to test dropdown scrolling behavior and selection handling.",
			},
		},
	},
};

export const AppraisalOnly: Story = {
	args: {
		documents: [
			createMockDocument(1, "appraisal", "Property Appraisal Report"),
			createMockDocument(2, "appraisal", "Appraisal Review & Analysis"),
			createMockDocument(3, "appraisal", "Comparative Market Analysis"),
		],
	},
	parameters: {
		docs: {
			description: {
				story:
					"Multiple appraisal documents showing different types of property valuations.",
			},
		},
	},
};

export const LoanDocuments: Story = {
	args: {
		documents: [
			createMockDocument(1, "loan", "Loan Application Form"),
			createMockDocument(2, "loan", "Loan Agreement"),
			createMockDocument(3, "loan", "Promissory Note"),
			createMockDocument(4, "loan", "Mortgage Deed"),
			createMockDocument(5, "loan", "Closing Disclosure Statement"),
		],
	},
	parameters: {
		docs: {
			description: {
				story:
					"Complete set of loan-related documents typically involved in property financing.",
			},
		},
	},
};

export const RecentUploads: Story = {
	args: {
		documents: [
			{
				_id: "doc_recent_1",
				name: "Updated Appraisal Report",
				type: "appraisal" as const,
				url: `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/kg222733sz1pg4gp3qpy9ca5fd7tneqg`,
				uploadDate: new Date(
					Date.now() - 2 * 24 * 60 * 60 * 1000
				).toISOString(), // 2 days ago
				fileSize: 2500000,
			},
			{
				_id: "doc_recent_2",
				name: "Title Insurance Policy",
				type: "title" as const,
				url: `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/kg222733sz1pg4gp3qpy9ca5fd7tneqg`,
				uploadDate: new Date(
					Date.now() - 1 * 24 * 60 * 60 * 1000
				).toISOString(), // 1 day ago
				fileSize: 1800000,
			},
			{
				_id: "doc_recent_3",
				name: "Final Inspection Report",
				type: "inspection" as const,
				url: `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/kg222733sz1pg4gp3qpy9ca5fd7tneqg`,
				uploadDate: new Date().toISOString(), // Today
				fileSize: 3200000,
			},
		],
	},
	parameters: {
		docs: {
			description: {
				story:
					"Documents with recent upload dates (within the last few days) to show current activity.",
			},
		},
	},
};

export const LargeFiles: Story = {
	args: {
		documents: [
			{
				_id: "doc_large_1",
				name: "Comprehensive Property Survey",
				type: "inspection" as const,
				url: `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/kg222733sz1pg4gp3qpy9ca5fd7tneqg`,
				uploadDate: new Date(
					Date.now() - 30 * 24 * 60 * 60 * 1000
				).toISOString(),
				fileSize: 8500000, // 8.5 MB
			},
			{
				_id: "doc_large_2",
				name: "Detailed Appraisal with Comparables",
				type: "appraisal" as const,
				url: `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/kg222733sz1pg4gp3qpy9ca5fd7tneqg`,
				uploadDate: new Date(
					Date.now() - 45 * 24 * 60 * 60 * 1000
				).toISOString(),
				fileSize: 12000000, // 12 MB
			},
		],
	},
	parameters: {
		docs: {
			description: {
				story:
					"Documents with larger file sizes to show how the UI handles and displays file size information.",
			},
		},
	},
};

// Note: NoAPIKey story would require mocking environment variables
// and is better tested in actual development/testing environments
export const NoAPIKey: Story = {
	args: {
		documents: [
			createMockDocument(1, "appraisal", "Property Appraisal Report"),
		],
	},
	parameters: {
		docs: {
			description: {
				story:
					"Error state when NEXT_PUBLIC_ADOBE_PDF_VIEWER_KEY is not configured. In production, this will show an error message.",
			},
		},
	},
};

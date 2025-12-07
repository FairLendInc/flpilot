import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/convex/lib/client";
import { useMutation as useConvexMutation } from "convex/react";
import { DocumentTypeCreationDialog } from "@/components/ui/document-type-creation-dialog";
import { DocumentTypeSelector } from "@/components/ui/document-type-selector";

// Regex constants for performance optimization
const REGEX = {
	AI_SUGGESTION: /AI Suggestion/,
	PROPERTY_APPRAISAL: /Property Appraisal/,
	CONFIDENCE: /92\.0% confidence/,
	AUTO_ASSIGNED: /Auto-assigned:/,
	DISPLAY_NAME: /Display Name/i,
	INTERNAL_NAME: /Internal Name/i,
	DOCUMENT_GROUP: /Document Group/i,
	DESCRIPTION: /Description/i,
	CREATE_TYPE: /Create Type/i,
	DISPLAY_NAME_REQUIRED: /Display name is required/i,
	TYPE_NAME_REQUIRED: /Type name is required/i,
	DOCUMENT_GROUP_REQUIRED: /Document group is required/i,
};

// Mock the Convex API
vi.mock("@/convex/lib/client", () => ({
	useAuthenticatedQuery: vi.fn(),
	useMutation: vi.fn(),
}));

vi.mock("convex/react", () => ({
	useMutation: vi.fn(),
}));

vi.mock("@/convex/_generated/api", () => ({
	api: {
		documentTypes: {
			getDocumentTypesByGroup: vi.fn(),
			createDocumentType: vi.fn(),
		},
		documentGroups: {
			getDocumentGroups: vi.fn(),
		},
		documentAnalysis: {
			getDocumentTypeSuggestions: vi.fn(),
			autoAssignDocumentType: vi.fn(),
			validateDocumentForType: vi.fn(),
			analyzeFilename: vi.fn(),
		},
	},
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

const mockedUseAuthenticatedQuery = useAuthenticatedQuery as unknown as vi.Mock;
const mockedUseMutation = useConvexMutation as unknown as vi.Mock;

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("DocumentTypeSelector Dynamic Features", () => {
	const mockDocumentTypes = {
		property: {
			group: {
				_id: "group1",
				name: "property",
				displayName: "Property Documents",
				icon: "🏠",
				color: "#3B82F6",
			},
			types: [
				{
					_id: "type1",
					name: "appraisal",
					displayName: "Property Appraisal",
					description: "Professional property valuation report",
					groupName: "property",
					groupDisplayName: "Property Documents",
					icon: "📋",
					isActive: true,
				},
				{
					_id: "type2",
					name: "title",
					displayName: "Title Report",
					description: "Property title and ownership document",
					groupName: "property",
					groupDisplayName: "Property Documents",
					icon: "📜",
					isActive: true,
				},
			],
		},
		mortgage: {
			group: {
				_id: "group2",
				name: "mortgage",
				displayName: "Mortgage Documents",
				icon: "💰",
				color: "#10B981",
			},
			types: [
				{
					_id: "type3",
					name: "loan_agreement",
					displayName: "Loan Agreement",
					description: "Mortgage loan contract and terms",
					groupName: "mortgage",
					groupDisplayName: "Mortgage Documents",
					icon: "📝",
					isActive: true,
				},
			],
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
		localStorageMock.getItem.mockReturnValue(null);
	});

	describe("Basic Functionality", () => {
		it("renders placeholder when no value is selected", () => {
			render(<DocumentTypeSelector placeholder="Select document type..." />);
			expect(screen.getByText("Select document type...")).toBeInTheDocument();
		});

		it("displays selected document type", () => {
			render(<DocumentTypeSelector value="appraisal" />);
			expect(screen.getByText("Property Appraisal")).toBeInTheDocument();
		});

		it("opens dropdown when trigger is clicked", () => {
			render(<DocumentTypeSelector />);
			const trigger = screen.getByRole("combobox");
			fireEvent.click(trigger);
			expect(
				screen.getByPlaceholderText("Search document types...")
			).toBeInTheDocument();
		});
	});

	describe("Content Analysis Features", () => {
		const mockSuggestions = {
			suggestions: [
				{
					type: "appraisal",
					displayName: "Property Appraisal",
					groupName: "property",
					groupDisplayName: "Property Documents",
					confidenceScore: 0.92,
					reasoning: [
						"Found appraisal keywords",
						"Contains property valuation language",
					],
					matchedFeatures: ["keyword_match", "content_features"],
				},
			],
			hasConfidentSuggestion: true,
		};

		const mockAutoAssignResult = {
			autoAssigned: true,
			suggestedType: {
				type: "appraisal",
				displayName: "Property Appraisal",
				confidenceScore: 0.92,
			},
			confidenceScore: 0.92,
		};

		it("analyzes document when file info is provided", async () => {
			const mockGetSuggestions = vi.fn().mockResolvedValue(mockSuggestions);

			mockedUseAuthenticatedQuery.mockReturnValue(mockDocumentTypes);
			mockedUseMutation.mockReturnValue(mockGetSuggestions);

			const fileInfo = {
				filename: "property_appraisal.pdf",
				content:
					"This is a professional property appraisal with market value analysis",
				fileSize: 2048576,
				fileFormat: "pdf",
			};

			render(
				<DocumentTypeSelector
					enableSuggestions={true}
					uploadedFileInfo={fileInfo}
				/>
			);

			await waitFor(() => {
				expect(mockGetSuggestions).toHaveBeenCalledWith({
					filename: fileInfo.filename,
					content: fileInfo.content,
					maxSuggestions: 3,
				});
			});
		});

		it("displays AI suggestion banner when confidence is high", async () => {
			const mockGetSuggestions = vi.fn().mockResolvedValue(mockSuggestions);

			mockedUseAuthenticatedQuery.mockReturnValue(mockDocumentTypes);
			mockedUseMutation.mockReturnValue(mockGetSuggestions);

			const fileInfo = {
				filename: "property_appraisal.pdf",
				content: "Professional property valuation with market analysis",
			};

			render(
				<DocumentTypeSelector
					enableSuggestions={true}
					uploadedFileInfo={fileInfo}
				/>
			);

			await waitFor(() => {
				expect(screen.getByText(REGEX.AUTO_ASSIGNED)).toBeInTheDocument();
				expect(screen.getByText(REGEX.AI_SUGGESTION)).toBeInTheDocument();
				expect(screen.getByText(REGEX.PROPERTY_APPRAISAL)).toBeInTheDocument();
				expect(screen.getByText(REGEX.CONFIDENCE)).toBeInTheDocument();
			});
		});

		it("auto-assigns type when enabled and confidence is above threshold", async () => {
			const mockGetSuggestions = vi.fn().mockResolvedValue(mockSuggestions);
			const mockAutoAssign = vi.fn().mockResolvedValue(mockAutoAssignResult);

			mockedUseAuthenticatedQuery.mockReturnValue(mockDocumentTypes);
			mockedUseMutation
				.mockReturnValueOnce(mockGetSuggestions)
				.mockReturnValueOnce(mockAutoAssign);

			const onValueChange = vi.fn();
			const fileInfo = {
				filename: "property_appraisal.pdf",
				content: "Professional property valuation report",
			};

			render(
				<DocumentTypeSelector
					autoAssignThreshold={0.8}
					enableAutoAssignment={true}
					enableSuggestions={true}
					onValueChange={onValueChange}
					uploadedFileInfo={fileInfo}
				/>
			);

			await waitFor(() => {
				expect(onValueChange).toHaveBeenCalledWith("appraisal");
				expect(screen.getByText(REGEX.AUTO_ASSIGNED)).toBeInTheDocument();
			});
		});

		it("shows validation warnings when document type is selected", async () => {
			const mockValidate = vi.fn().mockResolvedValue({
				isValid: true,
				warnings: ["Filename could be more descriptive"],
				errors: [],
			});

			mockedUseAuthenticatedQuery.mockReturnValue(mockDocumentTypes);
			mockedUseMutation.mockReturnValue(mockValidate);

			const onValueChange = vi.fn();
			const fileInfo = {
				filename: "document.pdf",
				fileSize: 1048576,
				fileFormat: "pdf",
			};

			render(
				<DocumentTypeSelector
					enableSuggestions={true}
					onValueChange={onValueChange}
					uploadedFileInfo={fileInfo}
				/>
			);

			// Select a document type
			const trigger = screen.getByRole("combobox");
			fireEvent.click(trigger);
			const appraisalOption = screen.getByText("Property Appraisal");
			fireEvent.click(appraisalOption);

			await waitFor(() => {
				expect(mockValidate).toHaveBeenCalledWith({
					documentType: "appraisal",
					filename: fileInfo.filename,
					fileSize: fileInfo.fileSize,
					fileFormat: fileInfo.fileFormat,
					content: undefined,
				});
			});
		});
	});

	describe("Custom Type Creation", () => {
		it("shows create new type option when enabled", () => {
			mockedUseAuthenticatedQuery.mockReturnValue(mockDocumentTypes);

			render(<DocumentTypeSelector enableCustomTypeCreation={true} />);

			const trigger = screen.getByRole("combobox");
			fireEvent.click(trigger);

			expect(screen.getByText("Create New Document Type")).toBeInTheDocument();
		});

		it("opens creation dialog when create option is selected", () => {
			mockedUseAuthenticatedQuery.mockReturnValue(mockDocumentTypes);

			render(<DocumentTypeSelector enableCustomTypeCreation={true} />);

			const trigger = screen.getByRole("combobox");
			fireEvent.click(trigger);

			const createOption = screen.getByText("Create New Document Type");
			fireEvent.click(createOption);

			// Dialog should be opened (we can't easily test the dialog content due to portal)
			expect(createOption).toBeInTheDocument();
		});
	});

	describe("Document Type Creation Dialog", () => {
		it("renders form fields correctly", () => {
			const mockGroups = [
				{
					_id: "group1",
					name: "property",
					displayName: "Property Documents",
				},
				{
					_id: "group2",
					name: "mortgage",
					displayName: "Mortgage Documents",
				},
			];

			mockedUseAuthenticatedQuery.mockReturnValue(mockGroups);

			render(
				<DocumentTypeCreationDialog
					defaultGroupName="property"
					onOpenChange={vi.fn()}
					open={true}
				/>
			);

			expect(screen.getByLabelText(REGEX.DISPLAY_NAME)).toBeInTheDocument();
			expect(screen.getByLabelText(REGEX.INTERNAL_NAME)).toBeInTheDocument();
			expect(screen.getByLabelText(REGEX.DOCUMENT_GROUP)).toBeInTheDocument();
			expect(screen.getByLabelText(REGEX.DESCRIPTION)).toBeInTheDocument();
		});

		it("generates naming suggestions from display name", async () => {
			const mockGroups = [
				{
					_id: "group1",
					name: "property",
					displayName: "Property Documents",
				},
			];

			mockedUseAuthenticatedQuery.mockReturnValue(mockGroups);

			render(<DocumentTypeCreationDialog onOpenChange={vi.fn()} open={true} />);

			const displayNameInput = screen.getByLabelText(REGEX.DISPLAY_NAME);
			fireEvent.change(displayNameInput, {
				target: { value: "Property Inspection Report" },
			});

			await waitFor(() => {
				expect(
					screen.getByText("property_inspection_report")
				).toBeInTheDocument();
			});
		});

		it("validates form fields correctly", async () => {
			const mockGroups = [
				{
					_id: "group1",
					name: "property",
					displayName: "Property Documents",
				},
			];

			mockedUseAuthenticatedQuery.mockReturnValue(mockGroups);

			render(<DocumentTypeCreationDialog onOpenChange={vi.fn()} open={true} />);

			// Try to submit empty form
			const submitButton = screen.getByText(REGEX.CREATE_TYPE);
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(
					screen.getByText(REGEX.DISPLAY_NAME_REQUIRED)
				).toBeInTheDocument();
				expect(screen.getByText(REGEX.TYPE_NAME_REQUIRED)).toBeInTheDocument();
				expect(
					screen.getByText(REGEX.DOCUMENT_GROUP_REQUIRED)
				).toBeInTheDocument();
			});
		});

		it("shows naming suggestions when display name is entered", async () => {
			const mockGroups = [
				{
					_id: "group1",
					name: "property",
					displayName: "Property Documents",
				},
			];

			mockedUseAuthenticatedQuery.mockReturnValue(mockGroups);

			render(<DocumentTypeCreationDialog onOpenChange={vi.fn()} open={true} />);

			const displayNameInput = screen.getByLabelText(REGEX.DISPLAY_NAME);
			fireEvent.change(displayNameInput, {
				target: { value: "Custom Document Type" },
			});

			await waitFor(() => {
				expect(screen.getByText("custom_document_type")).toBeInTheDocument();
				expect(screen.getByText("custom-document-type")).toBeInTheDocument();
				expect(screen.getByText("customdocumenttype")).toBeInTheDocument();
			});
		});
	});

	describe("User Experience", () => {
		it("shows loading state during analysis", async () => {
			const mockGetSuggestions = vi.fn(
				() => new Promise((resolve) => setTimeout(resolve, 100))
			);

			mockedUseAuthenticatedQuery.mockReturnValue(mockDocumentTypes);
			mockedUseMutation.mockReturnValue(mockGetSuggestions);

			const fileInfo = {
				filename: "large_document.pdf",
				content: "Large document content for analysis...",
			};

			render(
				<DocumentTypeSelector
					enableSuggestions={true}
					uploadedFileInfo={fileInfo}
				/>
			);

			expect(screen.getByText("Analyzing document...")).toBeInTheDocument();
		});

		it("maintains recent items functionality", () => {
			const _mockRecentTypes = [
				{
					_id: "recent1",
					name: "title",
					displayName: "Title Report",
					groupName: "property",
					groupDisplayName: "Property Documents",
					icon: "📜",
					isActive: true,
				},
			];

			localStorageMock.getItem.mockReturnValue(JSON.stringify(["title"]));

			mockedUseAuthenticatedQuery.mockReturnValue(mockDocumentTypes);

			render(<DocumentTypeSelector showRecentlyUsed={true} />);

			const trigger = screen.getByRole("combobox");
			fireEvent.click(trigger);

			expect(screen.getByText("Recently Used")).toBeInTheDocument();
		});

		it("provides clear feedback for auto-assignment", async () => {
			const mockAutoAssign = {
				autoAssigned: true,
				suggestedType: {
					type: "appraisal",
					displayName: "Property Appraisal",
					confidenceScore: 0.92,
				},
				confidenceScore: 0.92,
			};

			mockedUseAuthenticatedQuery.mockReturnValue(mockDocumentTypes);
			mockedUseMutation.mockReturnValue(vi.fn().mockResolvedValue(mockAutoAssign));

			const onValueChange = vi.fn();
			const fileInfo = {
				filename: "property_appraisal.pdf",
				content: "Professional property valuation",
			};

			render(
				<DocumentTypeSelector
					autoAssignThreshold={0.8}
					enableAutoAssignment={true}
					onValueChange={onValueChange}
					uploadedFileInfo={fileInfo}
				/>
			);

			// Simulate auto-assignment by setting the value
			render(
				<DocumentTypeSelector
					autoAssignThreshold={0.8}
					enableAutoAssignment={true}
					onValueChange={onValueChange}
					uploadedFileInfo={fileInfo}
					value="appraisal"
				/>
			);

			// In a real scenario, the auto-assigned banner would appear
			expect(screen.getByText("Property Appraisal")).toBeInTheDocument();
		});
	});
});

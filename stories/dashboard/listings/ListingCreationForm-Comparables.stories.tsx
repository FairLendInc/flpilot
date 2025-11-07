import type { Meta, StoryObj } from "@storybook/react";
import { useState, useCallback } from "react";
import { generateComparables } from "@/lib/mock-data/listings";
import { FormErrorSummary } from "@/app/dashboard/admin/listings/new/FormErrorSummary";
import type { ComparableFormState } from "@/app/dashboard/admin/listings/new/useListingCreationStore";

// Mock form data
const createMockFormData = (withComparables = true, valid = true) => {
	const borrower = {
		name: "Taylor Fairlend",
		email: "taylor@example.com",
		rotessaCustomerId: "rotessa_123",
	};

	const mortgage = {
		loanAmount: "450000",
		interestRate: "5.25",
		ltv: "75",
		status: "active",
		mortgageType: "1st",
		externalMortgageId: "ext-123",
		propertyType: "Townhouse",
		appraisalMarketValue: "540000",
		appraisalMethod: "Sales Comparison",
		appraisalCompany: "WebHook Appraisals",
		originationDate: "2024-01-01",
		maturityDate: "2034-01-01",
		appraisalDate: "2024-01-01",
		address: {
			street: "123 Property St",
			city: "Toronto",
			state: "ON",
			zip: "M5J 2N1",
			country: "Canada",
		},
		location: {
			lat: "45.4215",
			lng: "-75.6972",
		},
	};

	const listing = {
		visible: true,
	};

	const images: Array<{ storageId: string; previewUrl?: string }> = [];
	const documents: Array<{ storageId: string; name: string; type: string }> = [];

	const comparables: ComparableFormState[] = withComparables
		? valid
			? [
					{
						address: {
							street: "123 Main St",
							city: "Toronto",
							state: "ON",
							zip: "M5V 3A8",
						},
						saleAmount: "750000",
						saleDate: "2024-10-15",
						distance: "0.5",
						squareFeet: "2200",
						bedrooms: "3",
						bathrooms: "2",
						propertyType: "Townhouse",
					},
					{
						address: {
							street: "456 Oak Ave",
							city: "Toronto",
							state: "ON",
							zip: "M5V 3B9",
						},
						saleAmount: "820000",
						saleDate: "2024-09-20",
						distance: "0.8",
						squareFeet: "2400",
						bedrooms: "4",
						bathrooms: "3",
						propertyType: "Detached",
					},
					{
						address: {
							street: "789 Pine Rd",
							city: "Toronto",
							state: "ON",
							zip: "M5V 3C1",
						},
						saleAmount: "680000",
						saleDate: "2024-11-05",
						distance: "1.2",
						squareFeet: "2000",
						bedrooms: "3",
						bathrooms: "2",
						propertyType: "Townhouse",
					},
				]
			: [
					{
						address: {
							street: "",
							city: "",
							state: "",
							zip: "",
						},
						saleAmount: "",
						saleDate: "",
						distance: "",
					},
				]
		: [];

	return { borrower, mortgage, listing, images, documents, comparables };
};

// Mock form component
const MockListingCreationForm = ({
	formData,
	errors,
	onSubmit,
}: {
	formData: any;
	errors: Record<string, string>;
	onSubmit?: (data: any) => void;
}) => {
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			setSubmitting(true);
			if (onSubmit) {
				onSubmit(formData);
			}
			setTimeout(() => setSubmitting(false), 1000);
		},
		[formData, onSubmit]
	);

	return (
		<form onSubmit={handleSubmit} className="space-y-8">
			{/* Form Header */}
			<div>
				<h1 className="text-3xl font-bold">Create New Listing</h1>
				<p className="text-gray-600 dark:text-gray-400 mt-2">
					Enter mortgage and property details to create a new listing
				</p>
			</div>

			{/* Error Summary */}
			{Object.keys(errors).length > 0 && <FormErrorSummary errors={errors} />}

			{/* Borrower Information */}
			<div className="space-y-4">
				<h2 className="text-xl font-semibold">Borrower Information</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium mb-1">Name</label>
						<div className="p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
							{formData.borrower?.name || "Not provided"}
						</div>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">Email</label>
						<div className="p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
							{formData.borrower?.email || "Not provided"}
						</div>
					</div>
				</div>
			</div>

			{/* Mortgage Information */}
			<div className="space-y-4">
				<h2 className="text-xl font-semibold">Mortgage Information</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label className="block text-sm font-medium mb-1">Loan Amount</label>
						<div className="p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
							${formData.mortgage?.loanAmount || "Not provided"}
						</div>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">Interest Rate</label>
						<div className="p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
							{formData.mortgage?.interestRate || "Not provided"}%
						</div>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">LTV</label>
						<div className="p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
							{formData.mortgage?.ltv || "Not provided"}%
						</div>
					</div>
				</div>
			</div>

			{/* Comparable Properties Section */}
			<div className="space-y-4">
				<h2 className="text-xl font-semibold">Comparable Properties</h2>
				<div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
					{formData.comparables && formData.comparables.length > 0 ? (
						<div className="space-y-3">
							{formData.comparables.map((comp: ComparableFormState, index: number) => (
								<div
									key={index}
									className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
								>
									<div className="flex justify-between items-start">
										<div>
											<p className="font-medium">
												Comparable {index + 1}: {comp.address.street || "No address"}
											</p>
											<p className="text-sm text-gray-600 dark:text-gray-400">
												{comp.address.city}, {comp.address.state} {comp.address.zip}
											</p>
											<p className="text-sm text-gray-600 dark:text-gray-400">
												Sale: ${comp.saleAmount || "N/A"} on {comp.saleDate || "N/A"}
											</p>
											{comp.squareFeet && (
												<p className="text-sm text-gray-600 dark:text-gray-400">
													{comp.squareFeet} sq ft, {comp.bedrooms} bed,{" "}
													{comp.bathrooms} bath
												</p>
											)}
										</div>
										<div className="text-right">
											<p className="text-xs text-gray-500">
												{comp.distance || "?"} miles
											</p>
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-8 text-gray-500">
							No comparables added yet
						</div>
					)}
				</div>
			</div>

			{/* Submit Button */}
			<div className="flex justify-end">
				<button
					type="submit"
					disabled={submitting}
					className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/80 disabled:opacity-50"
				>
					{submitting ? "Submitting..." : "Create Listing"}
				</button>
			</div>
		</form>
	);
};

const meta: Meta<typeof MockListingCreationForm> = {
	title: "Dashboard/Admin/Listing Creation/Form with Comparables",
	component: MockListingCreationForm,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Integration stories showing comparable properties within the full listing creation form context. Demonstrates form validation, error propagation, and submission behavior.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-5xl p-6 bg-white dark:bg-gray-900 rounded-lg">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CompleteFormWithValidComparables: Story = {
	args: {
		formData: createMockFormData(true, true),
		errors: {},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Complete form with all sections filled and 3 valid comparables. No validation errors, ready for submission.",
			},
		},
	},
};

export const FormValidationErrorMissingComparables: Story = {
	args: {
		formData: { ...createMockFormData(false, true), comparables: [] },
		errors: {
			comparables: "At least one comparable is required",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Form with complete data but missing comparables. Shows FormErrorSummary displaying comparable validation error.",
			},
		},
	},
};

export const FormSubmissionWithInvalidComparables: Story = {
	args: {
		formData: createMockFormData(true, false),
		errors: {
			"comparables.0.address.street": "Street is required",
			"comparables.0.address.city": "City is required",
			"comparables.0.saleAmount": "Sale amount is required",
			"comparables.0.saleDate": "Sale date is required",
			"borrower.name": "Borrower name is required",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Form submission attempt with invalid comparable data. Shows multiple validation errors including comparable and borrower fields.",
			},
		},
	},
};

export const AddingComparablesDuringFormFill: Story = {
	render: () => {
		const [formData, setFormData] = useState(createMockFormData(true, true));
		const [errors, setErrors] = useState({});

		const handleAddComparable = useCallback(() => {
			const newComparable: ComparableFormState = {
				address: {
					street: "987 Elm St",
					city: "Toronto",
					state: "ON",
					zip: "M5V 3D2",
				},
				saleAmount: "795000",
				saleDate: "2024-12-01",
				distance: "1.5",
			};
			setFormData({
				...formData,
				comparables: [...formData.comparables, newComparable],
			});
		}, [formData]);

		return (
			<div>
				<MockListingCreationForm
					formData={formData}
					errors={errors}
					onSubmit={() => handleAddComparable()}
				/>
				<div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
					<p className="text-sm text-blue-800 dark:text-blue-200">
						<strong>Demo:</strong> This story demonstrates interactive behavior. In a real
						application, users can add comparables dynamically while filling the form.
					</p>
				</div>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Demonstrates adding comparables during form fill workflow. Shows how the form state updates when comparables are added interactively.",
			},
		},
	},
};

export const FormWithMaximumComparables: Story = {
	args: {
		formData: {
			...createMockFormData(true, true),
			comparables: Array.from({ length: 10 }, (_, i) => ({
				address: {
					street: `${100 + i} Street ${i + 1}`,
					city: "Toronto",
					state: "ON",
					zip: `M5V 3E${i}`,
				},
				saleAmount: (700000 + i * 50000).toString(),
				saleDate: `2024-1${i % 9 + 1}-15`,
				distance: (0.5 + i * 0.3).toFixed(1),
				squareFeet: (2000 + i * 100).toString(),
				bedrooms: (2 + (i % 3)).toString(),
				bathrooms: (1 + (i % 3)).toString(),
				propertyType: i % 2 === 0 ? "Townhouse" : "Detached",
			})),
		},
		errors: {},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Form with maximum 10 comparables. Demonstrates full capacity usage and how form displays multiple comparable entries.",
			},
		},
	},
};

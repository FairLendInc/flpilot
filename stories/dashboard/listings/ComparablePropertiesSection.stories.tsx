import type { Meta, StoryObj } from "@storybook/react";
import { useState, useCallback } from "react";
import { Card, Button, Input, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { generateComparables } from "@/lib/mock-data/listings";
import type { ComparableFormState } from "@/app/(auth)/dashboard/admin/listings/new/useListingCreationStore";

// Mock store implementation for stories
const createMockStore = (initialComparables: ComparableFormState[] = []) => {
	return {
		comparables: initialComparables,
		addComparable: useCallback((entry: ComparableFormState) => {
			console.log("addComparable called", entry);
		}, []),
		updateComparable: useCallback((index: number, entry: Partial<ComparableFormState>) => {
			console.log("updateComparable called", index, entry);
		}, []),
		removeComparable: useCallback((index: number) => {
			console.log("removeComparable called", index);
		}, []),
	};
};

// Helper functions to create mock data
const createEmptyComparable = (): ComparableFormState => ({
	address: { street: "", city: "", state: "", zip: "" },
	saleAmount: "",
	saleDate: "",
	distance: "",
});

const createValidComparable = (index: number): ComparableFormState => {
	const mock = generateComparables(`story-${index}`, 1)[0];
	return {
		address: {
			street: mock.address.street,
			city: mock.address.city,
			state: mock.address.state,
			zip: mock.address.zip,
		},
		saleAmount: mock.saleAmount.toString(),
		saleDate: mock.saleDate.slice(0, 10),
		distance: mock.distance.toString(),
		squareFeet: mock.squareFeet?.toString(),
		bedrooms: mock.bedrooms?.toString(),
		bathrooms: mock.bathrooms?.toString(),
		propertyType: mock.propertyType,
	};
};

const createInvalidComparable = (): ComparableFormState => ({
	address: { street: "", city: "", state: "ON", zip: "" },
	saleAmount: "-100",
	saleDate: "2030-01-01",
	distance: "-1",
	squareFeet: "-100",
	bedrooms: "-1",
	bathrooms: "-1",
});

const createComparableWithOptionalFields = (): ComparableFormState => {
	const mock = generateComparables("optional-fields", 1)[0];
	return {
		address: {
			street: mock.address.street,
			city: mock.address.city,
			state: mock.address.state,
			zip: mock.address.zip,
		},
		saleAmount: mock.saleAmount.toString(),
		saleDate: mock.saleDate.slice(0, 10),
		distance: mock.distance.toString(),
		squareFeet: mock.squareFeet?.toString() ?? "2200",
		bedrooms: mock.bedrooms?.toString() ?? "3",
		bathrooms: mock.bathrooms?.toString() ?? "2",
		propertyType: mock.propertyType ?? "Townhouse",
	};
};

// Component to simulate the comparable properties section
const ComparablePropertiesSection = ({
	comparables,
	onAdd,
	onUpdate,
	onRemove,
	errors = {},
}: {
	comparables: ComparableFormState[];
	onAdd: () => void;
	onUpdate: (index: number, field: string, value: string) => void;
	onRemove: (index: number) => void;
	errors?: Record<string, string>;
}) => {
	return (
		<Card className="p-6">
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-lg font-semibold">Comparable Properties</h3>
						<p className="text-sm text-gray-600 dark:text-gray-400">
							Add comparable property data from the appraisal to support valuation.
							At least one comparable is required.
						</p>
					</div>
					<Chip color="default">
						{comparables.length} {comparables.length === 1 ? "comparable" : "comparables"}
					</Chip>
				</div>

				{errors.comparables && (
					<div className="rounded-md bg-danger-50 p-3 text-sm text-danger">
						{errors.comparables}
					</div>
				)}

				<div className="space-y-4">
					{comparables.map((comp, index) => (
						<Card key={index} className="p-4 border-2 border-gray-200 dark:border-gray-700">
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<h4 className="font-medium">Comparable {index + 1}</h4>
									<Button
										size="sm"
										variant="danger"
										onPress={() => onRemove(index)}
									>
										<Icon icon="lucide:trash-2" className="h-4 w-4" />
										Remove
									</Button>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{/* Address Fields */}
									<div className="space-y-3">
										<h5 className="text-sm font-medium">Address</h5>
										<div>
											<label className="block text-sm font-medium mb-1">Street</label>
											<Input
												value={comp.address.street}
												onChange={(e) => onUpdate(index, "address.street", e.target.value)}
												aria-invalid={!!errors[`comparables.${index}.address.street`]}
												placeholder="123 Main Street"
											/>
											{errors[`comparables.${index}.address.street`] && (
												<p className="text-danger text-sm mt-1">{errors[`comparables.${index}.address.street`]}</p>
											)}
										</div>
										<div className="grid grid-cols-2 gap-2">
											<div>
												<label className="block text-sm font-medium mb-1">City</label>
												<Input
													value={comp.address.city}
													onChange={(e) => onUpdate(index, "address.city", e.target.value)}
													aria-invalid={!!errors[`comparables.${index}.address.city`]}
													placeholder="Toronto"
												/>
												{errors[`comparables.${index}.address.city`] && (
													<p className="text-danger text-sm mt-1">{errors[`comparables.${index}.address.city`]}</p>
												)}
											</div>
											<div>
												<label className="block text-sm font-medium mb-1">Province/State</label>
												<Input
													value={comp.address.state}
													onChange={(e) => onUpdate(index, "address.state", e.target.value)}
													aria-invalid={!!errors[`comparables.${index}.address.state`]}
													placeholder="ON"
												/>
												{errors[`comparables.${index}.address.state`] && (
													<p className="text-danger text-sm mt-1">{errors[`comparables.${index}.address.state`]}</p>
												)}
											</div>
										</div>
										<div>
											<label className="block text-sm font-medium mb-1">Postal/ZIP Code</label>
											<Input
												value={comp.address.zip}
												onChange={(e) => onUpdate(index, "address.zip", e.target.value)}
												aria-invalid={!!errors[`comparables.${index}.address.zip`]}
												placeholder="M5V 3A8"
											/>
											{errors[`comparables.${index}.address.zip`] && (
												<p className="text-danger text-sm mt-1">{errors[`comparables.${index}.address.zip`]}</p>
											)}
										</div>
									</div>

									{/* Sale Information */}
									<div className="space-y-3">
										<h5 className="text-sm font-medium">Sale Information</h5>
										<div>
											<label className="block text-sm font-medium mb-1">Sale Amount</label>
											<div className="relative">
												<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
												<Input
													type="number"
													value={comp.saleAmount}
													onChange={(e) => onUpdate(index, "saleAmount", e.target.value)}
													aria-invalid={!!errors[`comparables.${index}.saleAmount`]}
													placeholder="750000"
													className="pl-7"
												/>
											</div>
											{errors[`comparables.${index}.saleAmount`] && (
												<p className="text-danger text-sm mt-1">{errors[`comparables.${index}.saleAmount`]}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium mb-1">Sale Date</label>
											<Input
												type="date"
												value={comp.saleDate}
												onChange={(e) => onUpdate(index, "saleDate", e.target.value)}
												aria-invalid={!!errors[`comparables.${index}.saleDate`]}
											/>
											{errors[`comparables.${index}.saleDate`] && (
												<p className="text-danger text-sm mt-1">{errors[`comparables.${index}.saleDate`]}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium mb-1">Distance (miles)</label>
											<div className="relative">
												<Input
													type="number"
													value={comp.distance}
													onChange={(e) => onUpdate(index, "distance", e.target.value)}
													aria-invalid={!!errors[`comparables.${index}.distance`]}
													placeholder="0.5"
													className="pr-10"
												/>
												<span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">mi</span>
											</div>
											{errors[`comparables.${index}.distance`] && (
												<p className="text-danger text-sm mt-1">{errors[`comparables.${index}.distance`]}</p>
											)}
										</div>
									</div>
								</div>

								{/* Optional Fields */}
								<div className="space-y-3">
									<h5 className="text-sm font-medium">Property Details (Optional)</h5>
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
										<div>
											<label className="block text-sm font-medium mb-1">Square Feet</label>
											<Input
												type="number"
												value={comp.squareFeet}
												onChange={(e) => onUpdate(index, "squareFeet", e.target.value)}
												aria-invalid={!!errors[`comparables.${index}.squareFeet`]}
												placeholder="2200"
											/>
											{errors[`comparables.${index}.squareFeet`] && (
												<p className="text-danger text-sm mt-1">{errors[`comparables.${index}.squareFeet`]}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium mb-1">Bedrooms</label>
											<Input
												type="number"
												value={comp.bedrooms}
												onChange={(e) => onUpdate(index, "bedrooms", e.target.value)}
												aria-invalid={!!errors[`comparables.${index}.bedrooms`]}
												placeholder="3"
											/>
											{errors[`comparables.${index}.bedrooms`] && (
												<p className="text-danger text-sm mt-1">{errors[`comparables.${index}.bedrooms`]}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium mb-1">Bathrooms</label>
											<Input
												type="number"
												value={comp.bathrooms}
												onChange={(e) => onUpdate(index, "bathrooms", e.target.value)}
												aria-invalid={!!errors[`comparables.${index}.bathrooms`]}
												placeholder="2"
											/>
											{errors[`comparables.${index}.bathrooms`] && (
												<p className="text-danger text-sm mt-1">{errors[`comparables.${index}.bathrooms`]}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium mb-1">Property Type</label>
											<Input
												value={comp.propertyType}
												onChange={(e) => onUpdate(index, "propertyType", e.target.value)}
												aria-invalid={!!errors[`comparables.${index}.propertyType`]}
												placeholder="Townhouse"
											/>
											{errors[`comparables.${index}.propertyType`] && (
												<p className="text-danger text-sm mt-1">{errors[`comparables.${index}.propertyType`]}</p>
											)}
										</div>
									</div>
								</div>
							</div>
						</Card>
					))}
				</div>

				<Button
					variant="primary"
					onPress={onAdd}
					isDisabled={comparables.length >= 10}
					className="w-full"
				>
					<Icon icon="lucide:plus" className="h-4 w-4" />
					Add Comparable
				</Button>
			</div>
		</Card>
	);
};

const meta: Meta<typeof ComparablePropertiesSection> = {
	title: "Dashboard/Admin/Listing Creation/ComparableProperties",
	component: ComparablePropertiesSection,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Comparable properties section for listing creation form. Allows users to add appraisal comparables with address, sale amount, date, distance, and optional property details. Supports add/remove functionality with validation.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-6xl p-4">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyState: Story = {
	args: {
		comparables: [],
		errors: { comparables: "At least one comparable is required" },
	},
	parameters: {
		docs: {
			description: {
				story:
					"Empty state showing add button with validation error. User must add at least one comparable to proceed.",
			},
		},
	},
};

export const SingleComparable: Story = {
	args: {
		comparables: [createValidComparable(1)],
		errors: {},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Single comparable with all required fields populated. Shows the form layout with one comparable entry.",
			},
		},
	},
};

export const TwoComparables: Story = {
	args: {
		comparables: [createValidComparable(1), createValidComparable(2)],
		errors: {},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Two comparables showing multiple entries. Demonstrates how multiple comparable blocks are displayed and managed.",
			},
		},
	},
};

export const MaximumComparables: Story = {
	args: {
		comparables: Array.from({ length: 10 }, (_, i) => createValidComparable(i + 1)),
		errors: {},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Maximum number of comparables (10). Add button is disabled. Shows full grid layout capacity.",
			},
		},
	},
};

export const ValidationErrorsMissingFields: Story = {
	args: {
		comparables: [createEmptyComparable()],
		errors: {
			"comparables.0.address.street": "Street is required",
			"comparables.0.address.city": "City is required",
			"comparables.0.address.state": "State is required",
			"comparables.0.address.zip": "Postal/ZIP code is required",
			"comparables.0.saleAmount": "Sale amount is required",
			"comparables.0.saleDate": "Sale date is required",
			"comparables.0.distance": "Distance is required",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Validation errors for all required fields missing. Shows how field-level validation errors are displayed.",
			},
		},
	},
};

export const ValidationErrorsInvalidValues: Story = {
	args: {
		comparables: [createInvalidComparable()],
		errors: {
			"comparables.0.saleAmount": "Sale amount must be a positive number",
			"comparables.0.distance": "Distance must be 0 or greater",
			"comparables.0.saleDate": "Sale date cannot be in the future",
			"comparables.0.squareFeet": "Square feet must be 0 or greater",
			"comparables.0.bedrooms": "Bedrooms must be 0 or greater",
			"comparables.0.bathrooms": "Bathrooms must be 0 or greater",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Validation errors for invalid values. Shows negative numbers, future dates, and invalid inputs.",
			},
		},
	},
};

export const ValidationErrorExceedsMaximum: Story = {
	args: {
		comparables: Array.from({ length: 10 }, (_, i) => createValidComparable(i + 1)),
		errors: { comparables: "Maximum 10 comparables allowed" },
	},
	parameters: {
		docs: {
			description: {
				story:
					"Validation error when attempting to exceed maximum count. Add button shows error state and validation message.",
			},
		},
	},
};

export const WithOptionalFields: Story = {
	args: {
		comparables: [createComparableWithOptionalFields()],
		errors: {},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Single comparable with all optional fields filled. Shows how square feet, bedrooms, bathrooms, and property type are displayed.",
			},
		},
	},
};

export const MixedPopulatedAndEmpty: Story = {
	args: {
		comparables: [createValidComparable(1), createEmptyComparable()],
		errors: {
			"comparables.1.address.street": "Street is required",
			"comparables.1.saleAmount": "Sale amount is required",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Mixed state with one populated and one partially filled comparable. Shows validation on incomplete entry while others are valid.",
			},
		},
	},
};

export const AfterRemovingComparable: Story = {
	render: () => {
		const [comparables, setComparables] = useState([
			createValidComparable(1),
			createValidComparable(2),
			createValidComparable(3),
		]);
		const [errors, setErrors] = useState({});

		const handleAdd = () => {
			if (comparables.length < 10) {
				setComparables([...comparables, createValidComparable(comparables.length + 1)]);
			}
		};

		const handleUpdate = (index: number, field: string, value: string) => {
			const newComparables = [...comparables];
			const fieldPath = field.split(".");
			if (fieldPath.length === 2) {
				(newComparables[index] as any)[fieldPath[0]][fieldPath[1]] = value;
			} else {
				(newComparables[index] as any)[field] = value;
			}
			setComparables(newComparables);
		};

		const handleRemove = (index: number) => {
			const newComparables = comparables.filter((_, i) => i !== index);
			setComparables(newComparables);
		};

		// Remove the second comparable
		setTimeout(() => {
			handleRemove(1);
		}, 100);

		return (
			<ComparablePropertiesSection
				comparables={comparables}
				onAdd={handleAdd}
				onUpdate={handleUpdate}
				onRemove={handleRemove}
				errors={errors}
			/>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Demonstrates re-indexing behavior after removing a comparable. Shows how the form handles index updates when items are deleted.",
			},
		},
	},
};

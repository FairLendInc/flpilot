import type { Meta, StoryObj } from "@storybook/react";
import { Card, Input, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import type { ComparableFormState } from "@/app/dashboard/admin/listings/new/useListingCreationStore";

// Validation scenario component
const ValidationScenario = ({
	title,
	description,
	comparables,
	errors,
}: {
	title: string;
	description: string;
	comparables: ComparableFormState[];
	errors: Record<string, string>;
}) => {
	return (
		<Card className="p-6">
			<div className="space-y-4">
				<div>
					<h3 className="text-lg font-semibold">{title}</h3>
					<p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
				</div>

				<div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
					<div className="flex items-start gap-2">
						<Icon icon="lucide:alert-circle" className="h-5 w-5 text-yellow-600 mt-0.5" />
						<div>
							<p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
								Validation Errors
							</p>
							<ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
								{Object.entries(errors).map(([field, message]) => (
									<li key={field}>
										<span className="font-mono text-xs">{field}</span>: {message}
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>

				<div className="space-y-3">
					{comparables.map((comp, index) => (
						<div
							key={index}
							className="p-3 border border-gray-200 dark:border-gray-700 rounded"
						>
							<Chip color="warning" size="sm" className="mb-2">
								Comparable {index + 1}
							</Chip>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
								<div>
									<span className="text-gray-500">Street:</span>{" "}
									{comp.address.street || "—"}
								</div>
								<div>
									<span className="text-gray-500">City:</span> {comp.address.city || "—"}
								</div>
								<div>
									<span className="text-gray-500">State:</span>{" "}
									{comp.address.state || "—"}
								</div>
								<div>
									<span className="text-gray-500">Zip:</span> {comp.address.zip || "—"}
								</div>
								<div>
									<span className="text-gray-500">Sale Amount:</span>{" "}
									{comp.saleAmount || "—"}
								</div>
								<div>
									<span className="text-gray-500">Sale Date:</span>{" "}
									{comp.saleDate || "—"}
								</div>
								<div>
									<span className="text-gray-500">Distance:</span>{" "}
									{comp.distance || "—"}
								</div>
								<div>
									<span className="text-gray-500">Square Feet:</span>{" "}
									{comp.squareFeet || "—"}
								</div>
								<div>
									<span className="text-gray-500">Bedrooms:</span>{" "}
									{comp.bedrooms || "—"}
								</div>
								<div>
									<span className="text-gray-500">Bathrooms:</span>{" "}
									{comp.bathrooms || "—"}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</Card>
	);
};

const meta: Meta<typeof ValidationScenario> = {
	title: "Dashboard/Admin/Listing Creation/Validation",
	component: ValidationScenario,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Comprehensive validation scenarios for comparable properties. Shows all validation rules, error messages, and edge cases for address fields, numeric values, dates, and count limits.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-5xl p-4">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AddressFieldValidation: Story = {
	args: {
		title: "Address Field Validation",
		description:
			"Tests validation for all address fields. Each field has specific requirements for format and completeness.",
		comparables: [
			{
				address: { street: "", city: "", state: "", zip: "" },
				saleAmount: "750000",
				saleDate: "2024-10-15",
				distance: "0.5",
			},
		],
		errors: {
			"comparables.0.address.street": "Street is required",
			"comparables.0.address.city": "City is required",
			"comparables.0.address.state": "State is required",
			"comparables.0.address.zip": "Postal/ZIP code is required",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Missing all address fields. Shows required field validation for street address, city, province/state, and postal/ZIP code.",
			},
		},
	},
};

export const NumericFieldValidation: Story = {
	args: {
		title: "Numeric Field Validation",
		description:
			"Tests validation for sale amount and distance. Both must be positive numbers within reasonable ranges.",
		comparables: [
			{
				address: { street: "123 Test St", city: "Toronto", state: "ON", zip: "M5V 3A8" },
				saleAmount: "-50000",
				saleDate: "2024-10-15",
				distance: "-2.5",
			},
		],
		errors: {
			"comparables.0.saleAmount": "Sale amount must be a positive number",
			"comparables.0.distance": "Distance must be 0 or greater",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Negative values for sale amount and distance. Shows numeric validation requiring positive values.",
			},
		},
	},
};

export const DateValidation: Story = {
	args: {
		title: "Date Validation",
		description:
			"Tests validation for sale date. Cannot be in the future and must be a valid date.",
		comparables: [
			{
				address: { street: "123 Test St", city: "Toronto", state: "ON", zip: "M5V 3A8" },
				saleAmount: "750000",
				saleDate: "2030-12-31",
				distance: "0.5",
			},
		],
		errors: {
			"comparables.0.saleDate": "Sale date cannot be in the future",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Future sale date. Shows date validation ensuring sale dates are in the past (typical for comparable sales).",
			},
		},
	},
};

export const OptionalNumericFields: Story = {
	args: {
		title: "Optional Numeric Fields Validation",
		description:
			"Tests validation for optional numeric fields. While optional, if provided they must be valid positive numbers.",
		comparables: [
			{
				address: { street: "123 Test St", city: "Toronto", state: "ON", zip: "M5V 3A8" },
				saleAmount: "750000",
				saleDate: "2024-10-15",
				distance: "0.5",
				squareFeet: "-100",
				bedrooms: "-5",
				bathrooms: "-2",
			},
		],
		errors: {
			"comparables.0.squareFeet": "Square feet must be 0 or greater",
			"comparables.0.bedrooms": "Bedrooms must be 0 or greater",
			"comparables.0.bathrooms": "Bathrooms must be 0 or greater",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Negative values in optional fields. Shows that while optional, these fields must be non-negative if provided.",
			},
		},
	},
};

export const CountValidation: Story = {
	args: {
		title: "Count Validation (Minimum & Maximum)",
		description:
			"Tests validation for comparable count. At least one is required, maximum 10 allowed.",
		comparables: [],
		errors: {
			"comparables": "At least one comparable is required",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Zero comparables. Shows minimum count validation requiring at least one comparable property.",
			},
		},
	},
};

export const CountValidationExceedsMaximum: Story = {
	args: {
		title: "Count Validation - Exceeds Maximum",
		description:
			"Tests validation for exceeding maximum count. Maximum 10 comparables allowed per listing.",
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
		})),
		errors: {
			"comparables": "Maximum 10 comparables allowed",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Maximum comparables (10). Shows validation preventing addition of 11th comparable.",
			},
		},
	},
};

export const MultipleValidationErrors: Story = {
	args: {
		title: "Multiple Validation Errors",
		description:
			"Tests multiple validation errors across different fields in a single comparable.",
		comparables: [
			{
				address: { street: "", city: "Toronto", state: "", zip: "" },
				saleAmount: "-100",
				saleDate: "2030-01-01",
				distance: "-1",
			},
		],
		errors: {
			"comparables.0.address.street": "Street is required",
			"comparables.0.address.state": "State is required",
			"comparables.0.address.zip": "Postal/ZIP code is required",
			"comparables.0.saleAmount": "Sale amount must be a positive number",
			"comparables.0.saleDate": "Sale date cannot be in the future",
			"comparables.0.distance": "Distance must be 0 or greater",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Single comparable with multiple validation errors across address, numeric, and date fields. Shows comprehensive error handling.",
			},
		},
	},
};

export const InvalidDateFormats: Story = {
	args: {
		title: "Invalid Date Formats",
		description:
			"Tests various invalid date formats and edge cases for sale date field.",
		comparables: [
			{
				address: { street: "123 Test St", city: "Toronto", state: "ON", zip: "M5V 3A8" },
				saleAmount: "750000",
				saleDate: "invalid-date",
				distance: "0.5",
			},
		],
		errors: {
			"comparables.0.saleDate": "Please enter a valid date (YYYY-MM-DD format)",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Invalid date format. Shows date format validation requiring YYYY-MM-DD format.",
			},
		},
	},
};

export const PropertyTypeValidation: Story = {
	args: {
		title: "Property Type Validation",
		description:
			"Tests validation for property type field. While optional, should contain reasonable property type values.",
		comparables: [
			{
				address: { street: "123 Test St", city: "Toronto", state: "ON", zip: "M5V 3A8" },
				saleAmount: "750000",
				saleDate: "2024-10-15",
				distance: "0.5",
				propertyType: "12345Invalid",
			},
		],
		errors: {
			"comparables.0.propertyType":
				"Property type should contain letters and spaces only",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Invalid property type with numbers. Shows format validation for property type field.",
			},
		},
	},
};

export const DecimalValidation: Story = {
	args: {
		title: "Decimal Number Validation",
		description:
			"Tests validation for decimal numbers in numeric fields. Sale amount and distance can have decimals.",
		comparables: [
			{
				address: { street: "123 Test St", city: "Toronto", state: "ON", zip: "M5V 3A8" },
				saleAmount: "750000.50",
				saleDate: "2024-10-15",
				distance: "0.75",
			},
		],
		errors: {},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Valid decimal values. Shows that decimals are allowed for sale amount and distance fields.",
			},
		},
	},
};

export const BoundaryValues: Story = {
	args: {
		title: "Boundary Value Validation",
		description:
			"Tests boundary values for numeric fields. Shows minimum and maximum valid values.",
		comparables: [
			{
				address: { street: "123 Test St", city: "Toronto", state: "ON", zip: "M5V 3A8" },
				saleAmount: "1",
				saleDate: "2020-01-01",
				distance: "0",
			},
		],
		errors: {
			"comparables.0.saleAmount":
				"Sale amount seems unusually low. Please verify this is correct.",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Minimum boundary values. Shows that while technically valid, extremely low values may trigger warnings.",
			},
		},
	},
};

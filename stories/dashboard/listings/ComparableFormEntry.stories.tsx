import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Card, Button, Input, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import type { ComparableFormState } from "@/app/dashboard/admin/listings/new/useListingCreationStore";
import { generateComparables } from "@/lib/mock-data/listings";

// Individual comparable entry component
const ComparableFormEntry = ({
	entry,
	onUpdate,
	onRemove,
	errors,
	showRemoveButton = true,
}: {
	entry: ComparableFormState;
	onUpdate: (field: string, value: string) => void;
	onRemove: () => void;
	errors?: Record<string, string>;
	showRemoveButton?: boolean;
}) => {
	return (
		<Card className="p-4 border-2 border-gray-200 dark:border-gray-700">
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h4 className="font-medium">Comparable Property</h4>
					<div className="flex items-center gap-2">
						{entry.imageStorageId && (
							<Chip color="success" variant="flat" size="sm">
								<Icon icon="lucide:check" className="h-3 w-3 mr-1" />
								Image Uploaded
							</Chip>
						)}
						{showRemoveButton && (
							<Button
								size="sm"
								color="danger"
								variant="light"
								isIconOnly
								onPress={onRemove}
								aria-label="Remove comparable"
							>
								<Icon icon="lucide:trash-2" className="h-4 w-4" />
							</Button>
						)}
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* Address Fields */}
					<div className="space-y-3">
						<h5 className="text-sm font-medium">Address</h5>
						<Input
							label="Street"
							value={entry.address.street}
							onValueChange={(value) => onUpdate("address.street", value)}
							isInvalid={!!errors?.["address.street"]}
							errorMessage={errors?.["address.street"]}
							placeholder="123 Main Street"
						/>
						<div className="grid grid-cols-2 gap-2">
							<Input
								label="City"
								value={entry.address.city}
								onValueChange={(value) => onUpdate("address.city", value)}
								isInvalid={!!errors?.["address.city"]}
								errorMessage={errors?.["address.city"]}
								placeholder="Toronto"
							/>
							<Input
								label="Province/State"
								value={entry.address.state}
								onValueChange={(value) => onUpdate("address.state", value)}
								isInvalid={!!errors?.["address.state"]}
								errorMessage={errors?.["address.state"]}
								placeholder="ON"
							/>
						</div>
						<Input
							label="Postal/ZIP Code"
							value={entry.address.zip}
							onValueChange={(value) => onUpdate("address.zip", value)}
							isInvalid={!!errors?.["address.zip"]}
							errorMessage={errors?.["address.zip"]}
							placeholder="M5V 3A8"
						/>
					</div>

					{/* Sale Information */}
					<div className="space-y-3">
						<h5 className="text-sm font-medium">Sale Information</h5>
						<Input
							type="number"
							label="Sale Amount"
							value={entry.saleAmount}
							onValueChange={(value) => onUpdate("saleAmount", value)}
							isInvalid={!!errors?.["saleAmount"]}
							errorMessage={errors?.["saleAmount"]}
							placeholder="750000"
							startContent={
								<span className="text-gray-500 text-sm">$</span>
							}
						/>
						<Input
							type="date"
							label="Sale Date"
							value={entry.saleDate}
							onValueChange={(value) => onUpdate("saleDate", value)}
							isInvalid={!!errors?.["saleDate"]}
							errorMessage={errors?.["saleDate"]}
						/>
						<Input
							type="number"
							label="Distance (miles)"
							value={entry.distance}
							onValueChange={(value) => onUpdate("distance", value)}
							isInvalid={!!errors?.["distance"]}
							errorMessage={errors?.["distance"]}
							placeholder="0.5"
							endContent={
								<span className="text-gray-500 text-sm">mi</span>
							}
						/>
					</div>
				</div>

				{/* Optional Fields */}
				<div className="space-y-3">
					<h5 className="text-sm font-medium">Property Details (Optional)</h5>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<Input
							type="number"
							label="Square Feet"
							value={entry.squareFeet}
							onValueChange={(value) => onUpdate("squareFeet", value)}
							isInvalid={!!errors?.["squareFeet"]}
							errorMessage={errors?.["squareFeet"]}
							placeholder="2200"
						/>
						<Input
							type="number"
							label="Bedrooms"
							value={entry.bedrooms}
							onValueChange={(value) => onUpdate("bedrooms", value)}
							isInvalid={!!errors?.["bedrooms"]}
							errorMessage={errors?.["bedrooms"]}
							placeholder="3"
						/>
						<Input
							type="number"
							label="Bathrooms"
							value={entry.bathrooms}
							onValueChange={(value) => onUpdate("bathrooms", value)}
							isInvalid={!!errors?.["bathrooms"]}
							errorMessage={errors?.["bathrooms"]}
							placeholder="2"
						/>
						<Input
							label="Property Type"
							value={entry.propertyType}
							onValueChange={(value) => onUpdate("propertyType", value)}
							isInvalid={!!errors?.["propertyType"]}
							errorMessage={errors?.["propertyType"]}
							placeholder="Townhouse"
						/>
					</div>
				</div>

				{/* Image Upload Area */}
				<div className="space-y-2">
					<h5 className="text-sm font-medium">Property Image (Optional)</h5>
					<div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
						<Icon icon="lucide:image" className="h-8 w-8 mx-auto text-gray-400 mb-2" />
						<p className="text-sm text-gray-600 dark:text-gray-400">
							Click to upload or drag and drop
						</p>
						<p className="text-xs text-gray-500 mt-1">
							PNG, JPG, WebP up to 10MB
						</p>
						{entry.imageStorageId && (
							<div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-800 dark:text-green-200">
								<Icon icon="lucide:check-circle" className="h-4 w-4 inline mr-1" />
								Image uploaded successfully
							</div>
						)}
					</div>
				</div>
			</div>
		</Card>
	);
};

const meta: Meta<typeof ComparableFormEntry> = {
	title: "Dashboard/Admin/Listing Creation/ComparableFormEntry",
	component: ComparableFormEntry,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Individual comparable form entry component. Shows address, sale info, optional property details, and image upload for a single comparable property. Used within the comparable properties section.",
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

export const DefaultEntry: Story = {
	args: {
		entry: {
			address: { street: "", city: "", state: "", zip: "" },
			saleAmount: "",
			saleDate: "",
			distance: "",
		},
		errors: {},
		onUpdate: (field, value) => console.log(`Update ${field}: ${value}`),
		onRemove: () => console.log("Remove clicked"),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Default empty comparable entry showing all form fields with placeholder text. No remove button in this view.",
			},
		},
	},
};

export const PartiallyFilled: Story = {
	args: {
		entry: {
			address: { street: "123 Main St", city: "Toronto", state: "", zip: "" },
			saleAmount: "750000",
			saleDate: "",
			distance: "0.5",
		},
		errors: {
			"address.state": "Province/State is required",
			"address.zip": "Postal code is required",
			"saleDate": "Sale date is required",
		},
		onUpdate: (field, value) => console.log(`Update ${field}: ${value}`),
		onRemove: () => console.log("Remove clicked"),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Partially filled comparable showing some fields populated and validation errors on incomplete fields.",
			},
		},
	},
};

export const FullyFilled: Story = {
	args: {
		entry: (() => {
			const mock = generateComparables("story-full", 1)[0];
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
		})(),
		errors: {},
		onUpdate: (field, value) => console.log(`Update ${field}: ${value}`),
		onRemove: () => console.log("Remove clicked"),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Fully populated comparable with all required and optional fields filled. Shows complete data entry state.",
			},
		},
	},
};

export const WithImageUpload: Story = {
	args: {
		entry: (() => {
			const mock = generateComparables("story-image", 1)[0];
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
				imageStorageId: "img_storage_123",
			};
		})(),
		errors: {},
		onUpdate: (field, value) => console.log(`Update ${field}: ${value}`),
		onRemove: () => console.log("Remove clicked"),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Comparable with uploaded image showing the success state. Image upload area shows success indicator and uploaded status.",
			},
		},
	},
};

export const WithAllOptionalFields: Story = {
	args: {
		entry: {
			address: { street: "456 Oak Avenue", city: "Toronto", state: "ON", zip: "M5V 3B9" },
			saleAmount: "820000",
			saleDate: "2024-09-20",
			distance: "0.8",
			squareFeet: "2400",
			bedrooms: "4",
			bathrooms: "3",
			propertyType: "Detached Home",
		},
		errors: {},
		onUpdate: (field, value) => console.log(`Update ${field}: ${value}`),
		onRemove: () => console.log("Remove clicked"),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Comparable with all optional property details filled. Shows how square feet, bedrooms, bathrooms, and property type are displayed.",
			},
		},
	},
};

export const InvalidData: Story = {
	args: {
		entry: {
			address: { street: "", city: "Toronto", state: "ON", zip: "invalid" },
			saleAmount: "-100",
			saleDate: "2030-12-31",
			distance: "-1",
			squareFeet: "-100",
			bedrooms: "-5",
			bathrooms: "0.5",
			propertyType: "Super Long Property Type Name That Exceeds Limits",
		},
		errors: {
			"address.street": "Street is required",
			"address.zip": "Invalid postal code format",
			"saleAmount": "Sale amount must be a positive number",
			"saleDate": "Sale date cannot be in the future",
			"distance": "Distance must be 0 or greater",
			"squareFeet": "Square feet must be 0 or greater",
			"bedrooms": "Bedrooms must be 0 or greater",
			"bathrooms": "Invalid number of bathrooms",
		},
		onUpdate: (field, value) => console.log(`Update ${field}: ${value}`),
		onRemove: () => console.log("Remove clicked"),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Comparable with multiple validation errors showing all possible field validation states including format, range, and value validation.",
			},
		},
	},
};

export const WithoutRemoveButton: Story = {
	args: {
		entry: {
			address: { street: "123 Test St", city: "Toronto", state: "ON", zip: "M5V 3A8" },
			saleAmount: "750000",
			saleDate: "2024-10-15",
			distance: "0.5",
		},
		errors: {},
		onUpdate: (field, value) => console.log(`Update ${field}: ${value}`),
		onRemove: () => console.log("Remove clicked"),
		showRemoveButton: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Comparable entry without remove button. Used when displaying readonly data or when removal is handled at a higher level.",
			},
		},
	},
};

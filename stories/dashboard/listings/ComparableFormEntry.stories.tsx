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
							<Chip color="success" size="sm">
								<Icon icon="lucide:check" className="h-3 w-3 mr-1" />
								Image Uploaded
							</Chip>
						)}
						{showRemoveButton && (
							<Button
								size="sm"
								variant="danger"
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
						<div>
							<label className="block text-sm font-medium mb-1">Street</label>
							<Input
								value={entry.address.street}
								onChange={(e) => onUpdate("address.street", e.target.value)}
								aria-invalid={!!errors?.["address.street"]}
								placeholder="123 Main Street"
							/>
							{errors?.["address.street"] && (
								<p className="text-danger text-sm mt-1">{errors["address.street"]}</p>
							)}
						</div>
						<div className="grid grid-cols-2 gap-2">
							<div>
								<label className="block text-sm font-medium mb-1">City</label>
								<Input
									value={entry.address.city}
									onChange={(e) => onUpdate("address.city", e.target.value)}
									aria-invalid={!!errors?.["address.city"]}
									placeholder="Toronto"
								/>
								{errors?.["address.city"] && (
									<p className="text-danger text-sm mt-1">{errors["address.city"]}</p>
								)}
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Province/State</label>
								<Input
									value={entry.address.state}
									onChange={(e) => onUpdate("address.state", e.target.value)}
									aria-invalid={!!errors?.["address.state"]}
									placeholder="ON"
								/>
								{errors?.["address.state"] && (
									<p className="text-danger text-sm mt-1">{errors["address.state"]}</p>
								)}
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Postal/ZIP Code</label>
							<Input
								value={entry.address.zip}
								onChange={(e) => onUpdate("address.zip", e.target.value)}
								aria-invalid={!!errors?.["address.zip"]}
								placeholder="M5V 3A8"
							/>
							{errors?.["address.zip"] && (
								<p className="text-danger text-sm mt-1">{errors["address.zip"]}</p>
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
									value={entry.saleAmount}
									onChange={(e) => onUpdate("saleAmount", e.target.value)}
									aria-invalid={!!errors?.["saleAmount"]}
									placeholder="750000"
									className="pl-7"
								/>
							</div>
							{errors?.["saleAmount"] && (
								<p className="text-danger text-sm mt-1">{errors["saleAmount"]}</p>
							)}
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Sale Date</label>
							<Input
								type="date"
								value={entry.saleDate}
								onChange={(e) => onUpdate("saleDate", e.target.value)}
								aria-invalid={!!errors?.["saleDate"]}
							/>
							{errors?.["saleDate"] && (
								<p className="text-danger text-sm mt-1">{errors["saleDate"]}</p>
							)}
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Distance (miles)</label>
							<div className="relative">
								<Input
									type="number"
									value={entry.distance}
									onChange={(e) => onUpdate("distance", e.target.value)}
									aria-invalid={!!errors?.["distance"]}
									placeholder="0.5"
									className="pr-10"
								/>
								<span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">mi</span>
							</div>
							{errors?.["distance"] && (
								<p className="text-danger text-sm mt-1">{errors["distance"]}</p>
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
								value={entry.squareFeet}
								onChange={(e) => onUpdate("squareFeet", e.target.value)}
								aria-invalid={!!errors?.["squareFeet"]}
								placeholder="2200"
							/>
							{errors?.["squareFeet"] && (
								<p className="text-danger text-sm mt-1">{errors["squareFeet"]}</p>
							)}
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Bedrooms</label>
							<Input
								type="number"
								value={entry.bedrooms}
								onChange={(e) => onUpdate("bedrooms", e.target.value)}
								aria-invalid={!!errors?.["bedrooms"]}
								placeholder="3"
							/>
							{errors?.["bedrooms"] && (
								<p className="text-danger text-sm mt-1">{errors["bedrooms"]}</p>
							)}
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Bathrooms</label>
							<Input
								type="number"
								value={entry.bathrooms}
								onChange={(e) => onUpdate("bathrooms", e.target.value)}
								aria-invalid={!!errors?.["bathrooms"]}
								placeholder="2"
							/>
							{errors?.["bathrooms"] && (
								<p className="text-danger text-sm mt-1">{errors["bathrooms"]}</p>
							)}
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Property Type</label>
							<Input
								value={entry.propertyType}
								onChange={(e) => onUpdate("propertyType", e.target.value)}
								aria-invalid={!!errors?.["propertyType"]}
								placeholder="Townhouse"
							/>
							{errors?.["propertyType"] && (
								<p className="text-danger text-sm mt-1">{errors["propertyType"]}</p>
							)}
						</div>
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

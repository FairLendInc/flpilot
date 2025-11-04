import type { Meta, StoryObj } from "@storybook/react";
import { PropertyMap } from "@/components/listing-detail/property-map";

const meta: Meta<typeof PropertyMap> = {
	title: "Listing Detail/PropertyMap",
	component: PropertyMap,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Interactive map component showing property location with customizable zoom and markers. Perfect for real estate listings.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-4xl p-4">
				<div className="h-96 w-full">
					<Story />
				</div>
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		location: {
			lat: 34.0259,
			lng: -118.7798,
		},
		address: {
			street: "123 Pacific Coast Highway",
			city: "Malibu",
			state: "CA",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Default property map showing Malibu, CA location with standard zoom level.",
			},
		},
	},
};

export const DifferentLocations: Story = {
	render: () => (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div className="h-64">
				<h3 className="mb-2 font-medium text-sm">Miami, FL</h3>
				<PropertyMap
					address={{ street: "456 Ocean Drive", city: "Miami", state: "FL" }}
					location={{ lat: 25.7617, lng: -80.1918 }}
				/>
			</div>
			<div className="h-64">
				<h3 className="mb-2 font-medium text-sm">Austin, TX</h3>
				<PropertyMap
					address={{ street: "789 Congress Ave", city: "Austin", state: "TX" }}
					location={{ lat: 30.2672, lng: -97.7431 }}
				/>
			</div>
			<div className="h-64">
				<h3 className="mb-2 font-medium text-sm">Seattle, WA</h3>
				<PropertyMap
					address={{ street: "321 Pike Place", city: "Seattle", state: "WA" }}
					location={{ lat: 47.6062, lng: -122.3321 }}
				/>
			</div>
			<div className="h-64">
				<h3 className="mb-2 font-medium text-sm">Boston, MA</h3>
				<PropertyMap
					address={{ street: "159 Beacon Street", city: "Boston", state: "MA" }}
					location={{ lat: 42.3601, lng: -71.0589 }}
				/>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Multiple property maps showing different locations across the United States.",
			},
		},
	},
};

export const NoLocation: Story = {
	args: {
		location: { lat: 0, lng: 0 },
		address: {
			street: "Address Unavailable",
			city: "Unknown",
			state: "N/A",
		},
	},
	parameters: {
		docs: {
			description: {
				story: "Fallback state when location data is at default coordinates.",
			},
		},
	},
};

export const CustomZoom: Story = {
	render: () => (
		<div className="space-y-4">
			<div className="h-48">
				<h3 className="mb-2 font-medium text-sm">Malibu Beach Property</h3>
				<PropertyMap
					address={{
						street: "123 Pacific Coast Highway",
						city: "Malibu",
						state: "CA",
					}}
					location={{ lat: 34.0259, lng: -118.7798 }}
				/>
			</div>
			<div className="h-48">
				<h3 className="mb-2 font-medium text-sm">
					Same Location - Different View
				</h3>
				<PropertyMap
					address={{
						street: "123 Pacific Coast Highway",
						city: "Malibu",
						state: "CA",
					}}
					location={{ lat: 34.0259, lng: -118.7798 }}
				/>
			</div>
			<div className="h-48">
				<h3 className="mb-2 font-medium text-sm">Same Location - Close View</h3>
				<PropertyMap
					address={{
						street: "123 Pacific Coast Highway",
						city: "Malibu",
						state: "CA",
					}}
					location={{ lat: 34.0259, lng: -118.7798 }}
				/>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Multiple views of the same property location (note: zoom control is fixed at 14 in component).",
			},
		},
	},
};

export const UrbanProperty: Story = {
	args: {
		location: { lat: 40.7589, lng: -73.9851 },
		address: {
			street: "432 Park Avenue",
			city: "New York",
			state: "NY",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Urban property location in New York City showing dense metropolitan area.",
			},
		},
	},
};

export const RuralProperty: Story = {
	args: {
		location: { lat: 38.9072, lng: -77.0369 },
		address: {
			street: "1600 Pennsylvania Avenue",
			city: "Washington",
			state: "DC",
		},
	},
	parameters: {
		docs: {
			description: {
				story: "Property in Washington DC area showing suburban/urban setting.",
			},
		},
	},
};

export const WaterfrontProperty: Story = {
	args: {
		location: { lat: 26.0742, lng: -80.2375 },
		address: {
			street: "777 Beachfront Boulevard",
			city: "Fort Lauderdale",
			state: "FL",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Waterfront property showing coastal location and nearby water features.",
			},
		},
	},
};

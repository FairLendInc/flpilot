import type { Meta, StoryObj } from "@storybook/react";
import { PropertyInfo } from "@/components/listing-detail/property-info";
import { generateListing } from "@/lib/mock-data/listings";

const meta: Meta<typeof PropertyInfo> = {
	title: "Listing Detail/PropertyInfo",
	component: PropertyInfo,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Comprehensive property information display showing address, property type, key features, and investment brief. Perfect for real estate listings.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-2xl p-4">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: (() => {
		const listing = generateListing("default-property");
		return {
			title: listing.title,
			address: listing.address,
			investorBrief: listing.investorBrief,
			status: listing.status,
		};
	})(),
	parameters: {
		docs: {
			description: {
				story:
					"Complete property information including address, location details, and investment brief.",
			},
		},
	},
};

export const LuxuryProperty: Story = {
	args: (() => {
		const listing = generateListing("luxury-villa");
		return {
			title: listing.title,
			address: listing.address,
			investorBrief: listing.investorBrief,
			status: listing.status,
		};
	})(),
	parameters: {
		docs: {
			description: {
				story:
					"High-end luxury property with premium location and comprehensive investment details.",
			},
		},
	},
};

export const InvestmentProperty: Story = {
	args: (() => {
		const listing = generateListing("investment-condo");
		return {
			title: listing.title,
			address: listing.address,
			investorBrief:
				"Exceptional investment opportunity in downtown Austin. This modern condominium offers strong rental yields with projected annual returns of 8-10%. Located in the rapidly growing East Austin district with excellent appreciation potential. Recent neighborhood improvements include new restaurants, parks, and transit connections. Property features modern finishes, floor-to-ceiling windows, and premium building amenities including rooftop pool, fitness center, and concierge service.",
			status: listing.status,
		};
	})(),
	parameters: {
		docs: {
			description: {
				story:
					"Investment-focused property with detailed investor brief highlighting returns and market potential.",
			},
		},
	},
};

export const MinimalInfo: Story = {
	args: (() => {
		const listing = generateListing("minimal-house");
		return {
			title: listing.title,
			address: listing.address,
			investorBrief: undefined,
			status: listing.status,
		};
	})(),
	parameters: {
		docs: {
			description: {
				story:
					"Property with minimal information - no investment brief provided.",
			},
		},
	},
};

export const DifferentPropertyTypes: Story = {
	render: () => {
		const condo = generateListing("condo-property");
		const house = generateListing("house-property");
		const mansion = generateListing("mansion-property");

		// Update addresses to show different property types
		condo.address.street = "450 Downtown Tower Unit #2805";
		house.address.street = "1234 Oak Street";
		mansion.address.street = "7890 Privilege Drive";

		return (
			<div className="space-y-6">
				<div>
					<h3 className="mb-2 font-medium text-sm">Condominium</h3>
					<PropertyInfo
						address={condo.address}
						investorBrief={condo.investorBrief}
						status={condo.status}
						title={condo.title}
					/>
				</div>
				<div>
					<h3 className="mb-2 font-medium text-sm">Single Family Home</h3>
					<PropertyInfo
						address={house.address}
						investorBrief={house.investorBrief}
						status={house.status}
						title={house.title}
					/>
				</div>
				<div>
					<h3 className="mb-2 font-medium text-sm">Luxury Estate</h3>
					<PropertyInfo
						address={mansion.address}
						investorBrief={mansion.investorBrief}
						status={mansion.status}
						title={mansion.title}
					/>
				</div>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Various property types showing how the component adapts to different real estate categories.",
			},
		},
	},
};

export const WithLongInvestorBrief: Story = {
	args: (() => {
		const listing = generateListing("detailed-investment");
		return {
			title: listing.title,
			address: listing.address,
			investorBrief:
				"Prime real estate investment opportunity in one of Miami's most exclusive neighborhoods. This waterfront property offers exceptional value with strong fundamentals: location in a high-growth corridor, limited supply of waterfront properties, and increasing demand from both domestic and international buyers. The property features recent renovations including gourmet kitchen, master suite retreat, and outdoor living space with direct water access. Investment highlights include: Strong rental demand ($8,500-$12,000/month), 15-20% annual appreciation potential, tax benefits through depreciation, and potential for value-add through second story addition. Located near top-rated schools, world-class shopping at Bal Harbour, and easy access to Miami International Airport. This property represents both a solid investment and an exceptional lifestyle opportunity.",
			status: listing.status,
		};
	})(),
	parameters: {
		docs: {
			description: {
				story:
					"Property with comprehensive investor brief showing detailed investment analysis and market insights.",
			},
		},
	},
};

export const NewListing: Story = {
	args: (() => {
		const listing = generateListing("new-listing");
		return {
			title: listing.title,
			address: listing.address,
			investorBrief: listing.investorBrief,
			status: listing.status,
		};
	})(),
	parameters: {
		docs: {
			description: {
				story:
					"Recently listed property with current timestamps showing fresh market entry.",
			},
		},
	},
};

export const EstablishedProperty: Story = {
	args: (() => {
		const listing = generateListing("established-property");
		return {
			title: listing.title,
			address: listing.address,
			investorBrief: listing.investorBrief,
			status: listing.status,
		};
	})(),
	parameters: {
		docs: {
			description: {
				story:
					"Established property that has been on the market for an extended period.",
			},
		},
	},
};

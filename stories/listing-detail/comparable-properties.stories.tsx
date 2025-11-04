import type { Meta, StoryObj } from "@storybook/react";
import { ComparableProperties } from "@/components/listing-detail/comparable-properties";
import { generateComparables } from "@/lib/mock-data/listings";

const meta: Meta<typeof ComparableProperties> = {
	title: "Listing Detail/ComparableProperties",
	component: ComparableProperties,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Appraisal comparables display showing recent sales of similar properties used in property valuation. Displays MLS data including sale price, sale date, address, and distance.",
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

export const Default: Story = {
	args: {
		comparables: generateComparables("reference-property", 6),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Standard set of 6 appraisal comparables with recent sales data, distances, and property details.",
			},
		},
	},
};

export const ManyComparables: Story = {
	args: {
		comparables: generateComparables("busy-market", 10),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Extensive list of 10 appraisal comparables showing active market with many recent sales.",
			},
		},
	},
};

export const FewComparables: Story = {
	args: {
		comparables: generateComparables("unique-property", 3),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Limited comparables available - typical for unique properties or rural areas with few recent sales.",
			},
		},
	},
};

export const NoComparables: Story = {
	args: {
		comparables: [],
	},
	parameters: {
		docs: {
			description: {
				story:
					"No comparable sales found - empty state for highly unique properties or areas with no recent sales data.",
			},
		},
	},
};

export const CloseProximity: Story = {
	render: () => {
		const comparables = generateComparables("dense-urban", 6);
		// Adjust to show very close properties
		comparables.forEach((comp) => {
			comp.distance = Number.parseFloat((Math.random() * 0.5 + 0.1).toFixed(1));
		});

		return <ComparableProperties comparables={comparables} />;
	},
	parameters: {
		docs: {
			description: {
				story:
					"Properties in very close proximity (0.1-0.6 miles) typical of dense urban areas.",
			},
		},
	},
};

export const WiderArea: Story = {
	render: () => {
		const comparables = generateComparables("suburban-area", 6);
		// Adjust to show properties over wider area
		comparables.forEach((comp) => {
			comp.distance = Number.parseFloat((Math.random() * 3 + 1).toFixed(1));
		});

		return <ComparableProperties comparables={comparables} />;
	},
	parameters: {
		docs: {
			description: {
				story:
					"Properties spread over wider area (1-4 miles) typical of suburban markets.",
			},
		},
	},
};

export const HigherPricedComparables: Story = {
	render: () => {
		const comparables = generateComparables("premium-area", 6);
		// Set all comps to be higher priced
		comparables.forEach((comp) => {
			comp.saleAmount = 1500000 + Math.floor(Math.random() * 800000);
		});

		return <ComparableProperties comparables={comparables} />;
	},
	parameters: {
		docs: {
			description: {
				story:
					"All comparable sales priced higher - suggests subject property may be undervalued.",
			},
		},
	},
};

export const LowerPricedComparables: Story = {
	render: () => {
		const comparables = generateComparables("value-area", 6);
		// Set all comps to be lower priced
		comparables.forEach((comp) => {
			comp.saleAmount = 650000 + Math.floor(Math.random() * 400000);
		});

		return <ComparableProperties comparables={comparables} />;
	},
	parameters: {
		docs: {
			description: {
				story:
					"All comparable sales priced lower - suggests subject property may be overvalued or have premium features.",
			},
		},
	},
};

export const MixedPriceRange: Story = {
	render: () => {
		const comparables = generateComparables("mixed-market", 8);
		// Create diverse price range
		comparables.forEach((comp, index) => {
			const basePrice = 1000000;
			const variation = [
				-300000, -150000, -75000, 0, 75000, 150000, 300000, 450000,
			];
			comp.saleAmount = basePrice + variation[index];
		});

		return <ComparableProperties comparables={comparables} />;
	},
	parameters: {
		docs: {
			description: {
				story:
					"Wide price range among comparable sales showing diverse market conditions and property variations.",
			},
		},
	},
};

export const LuxuryMarketComparables: Story = {
	render: () => {
		const comparables = generateComparables("luxury-market", 6);
		// Set to luxury price ranges
		comparables.forEach((comp) => {
			comp.saleAmount = 2500000 + Math.floor(Math.random() * 3000000);
		});

		return <ComparableProperties comparables={comparables} />;
	},
	parameters: {
		docs: {
			description: {
				story:
					"Luxury market appraisal comparables with multi-million dollar sale prices typical of high-end real estate.",
			},
		},
	},
};

export const StarterHomeComparables: Story = {
	render: () => {
		const comparables = generateComparables("starter-homes", 6);
		// Set to affordable price ranges
		comparables.forEach((comp) => {
			comp.saleAmount = 250000 + Math.floor(Math.random() * 200000);
		});

		return <ComparableProperties comparables={comparables} />;
	},
	parameters: {
		docs: {
			description: {
				story:
					"First-time home buyer market with affordable comparable sales under $500k.",
			},
		},
	},
};

export const RecentSales: Story = {
	render: () => {
		const comparables = generateComparables("recent-sales", 6);
		// Make all sales very recent (last 30 days)
		comparables.forEach((comp, index) => {
			const saleDate = new Date();
			saleDate.setDate(saleDate.getDate() - (index + 1) * 5);
			comp.saleDate = saleDate.toISOString();
		});

		return <ComparableProperties comparables={comparables} />;
	},
	parameters: {
		docs: {
			description: {
				story:
					"Very recent comparable sales within the last 30 days - ideal for current market analysis.",
			},
		},
	},
};

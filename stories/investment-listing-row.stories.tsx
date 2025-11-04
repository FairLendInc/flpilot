import type { Meta, StoryObj } from "@storybook/react";
import {
	type InvestmentListingProps,
	InvestmentListingRow,
} from "@/components/investment-listing-row";

const meta: Meta<typeof InvestmentListingRow> = {
	title: "Components/InvestmentListingRow",
	component: InvestmentListingRow,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"Horizontal KPI-first row highlighting Principal, LTV, and Interest with a small thumbnail.",
			},
		},
	},
	argTypes: {
		principalLoanCents: { control: { type: "number", min: 0, step: 1000 } },
		ltvPercent: { control: { type: "range", min: 0, max: 100, step: 1 } },
		interestAprPercent: {
			control: { type: "range", min: 0, max: 20, step: 0.1 },
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleThumb =
	"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&h=300&fit=crop";

const baseArgs: InvestmentListingProps = {
	id: "inv-1",
	title: "Malibu Beach Duplex",
	city: "Malibu",
	region: "CA",
	principalLoanCents: 35000000,
	ltvPercent: 68,
	interestAprPercent: 6.5,
	imageThumbUrl: sampleThumb,
	badges: ["Verified"],
};

export const Default: Story = {
	args: baseArgs,
};

export const HighLTV: Story = {
	args: {
		...baseArgs,
		id: "inv-2",
		title: "Urban Loft",
		city: "San Francisco",
		region: "CA",
		ltvPercent: 82,
	},
};

export const LowInterest: Story = {
	args: {
		...baseArgs,
		id: "inv-3",
		title: "Suburban Triplex",
		city: "Austin",
		region: "TX",
		interestAprPercent: 4.25,
	},
};

export const MillionPlus: Story = {
	args: {
		...baseArgs,
		id: "inv-4",
		title: "Luxury Mountain Lodge",
		city: "Aspen",
		region: "CO",
		principalLoanCents: 1_250_000_00,
	},
};

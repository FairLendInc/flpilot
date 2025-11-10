import type { Meta, StoryObj } from "@storybook/react";
import { FinancialMetrics } from "@/components/listing-detail/financial-metrics";
import { generateListing } from "@/lib/mock-data/listings";

const meta: Meta<typeof FinancialMetrics> = {
	title: "Listing Detail/FinancialMetrics",
	component: FinancialMetrics,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Comprehensive financial metrics display showing purchase price, current value, monthly payments, interest rates, and returns. Perfect for investment property analysis.",
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
	args: {
		financials: {
			...generateListing("default-financial").financials,
			ltv: 75.0,
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Standard financial metrics showing healthy investment with positive appreciation.",
			},
		},
	},
};

export const HighValueProperty: Story = {
	args: {
		financials: {
			purchasePrice: 5000000,
			currentValue: 5750000,
			monthlyPayment: 28500,
			interestRate: 5.8,
			loanTerm: 360,
			maturityDate: new Date(
				Date.now() + 30 * 365 * 24 * 60 * 60 * 1000
			).toISOString(),
			principalLoanAmount: 3750000,
			ltv: 65.2,
			mortgageType: "1st Position",
			propertyType: "Residential - Single Family",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Luxury property with high-value numbers showing multi-million dollar investment.",
			},
		},
	},
};

export const InvestmentMetrics: Story = {
	args: {
		financials: {
			purchasePrice: 1250000,
			currentValue: 1425000,
			monthlyPayment: 7200,
			interestRate: 6.2,
			loanTerm: 300,
			maturityDate: new Date(
				Date.now() + 25 * 365 * 24 * 60 * 60 * 1000
			).toISOString(),
			principalLoanAmount: 1000000,
			ltv: 70.2,
			mortgageType: "1st Position",
			propertyType: "Commercial - Office",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Investment-focused property metrics showing strong returns and manageable payments.",
			},
		},
	},
};

export const LossScenario: Story = {
	args: {
		financials: {
			purchasePrice: 850000,
			currentValue: 765000,
			monthlyPayment: 5100,
			interestRate: 7.1,
			loanTerm: 240,
			maturityDate: new Date(
				Date.now() + 20 * 365 * 24 * 60 * 60 * 1000
			).toISOString(),
			principalLoanAmount: 680000,
			ltv: 88.9,
			mortgageType: "1st Position",
			propertyType: "Residential - Condo",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Property showing value decline - illustrates investment risk scenario.",
			},
		},
	},
};

export const LowInterestRate: Story = {
	args: {
		financials: {
			purchasePrice: 750000,
			currentValue: 825000,
			monthlyPayment: 3800,
			interestRate: 4.1,
			loanTerm: 360,
			maturityDate: new Date(
				Date.now() + 30 * 365 * 24 * 60 * 60 * 1000
			).toISOString(),
			principalLoanAmount: 600000,
			ltv: 72.7,
			mortgageType: "1st Position",
			propertyType: "Residential - Townhouse",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Property with favorable low interest rate showing lower monthly payments.",
			},
		},
	},
};

export const ShortTermLoan: Story = {
	args: {
		financials: {
			purchasePrice: 600000,
			currentValue: 690000,
			monthlyPayment: 6800,
			interestRate: 5.5,
			loanTerm: 180,
			maturityDate: new Date(
				Date.now() + 15 * 365 * 24 * 60 * 60 * 1000
			).toISOString(),
			principalLoanAmount: 480000,
			ltv: 69.6,
			mortgageType: "1st Position",
			propertyType: "Residential - Multi-Family",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Property with short-term loan showing higher payments but faster equity buildup.",
			},
		},
	},
};

export const BreakEvenScenario: Story = {
	args: {
		financials: {
			purchasePrice: 925000,
			currentValue: 925000,
			monthlyPayment: 5500,
			interestRate: 6.0,
			loanTerm: 300,
			maturityDate: new Date(
				Date.now() + 25 * 365 * 24 * 60 * 60 * 1000
			).toISOString(),
			principalLoanAmount: 740000,
			ltv: 80.0,
			mortgageType: "1st Position",
			propertyType: "Mixed-Use",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Property at break-even point with no appreciation or depreciation.",
			},
		},
	},
};

export const FirstTimeHomeBuyer: Story = {
	args: {
		financials: {
			purchasePrice: 350000,
			currentValue: 385000,
			monthlyPayment: 2100,
			interestRate: 5.8,
			loanTerm: 360,
			maturityDate: new Date(
				Date.now() + 30 * 365 * 24 * 60 * 60 * 1000
			).toISOString(),
			principalLoanAmount: 280000,
			ltv: 72.7,
			mortgageType: "1st Position",
			propertyType: "Residential - Condo",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Affordable starter home perfect for first-time home buyers with manageable payments.",
			},
		},
	},
};

export const ComparisonView: Story = {
	render: () => {
		const properties = [
			{
				name: "Conservative Investment",
				financials: {
					purchasePrice: 800000,
					currentValue: 880000,
					monthlyPayment: 4500,
					interestRate: 4.8,
					loanTerm: 360,
					maturityDate: new Date(
						Date.now() + 30 * 365 * 24 * 60 * 60 * 1000
					).toISOString(),
					principalLoanAmount: 640000,
					ltv: 72.7,
					mortgageType: "1st Position",
					propertyType: "Residential - Single Family",
				},
			},
			{
				name: "Balanced Investment",
				financials: {
					purchasePrice: 1200000,
					currentValue: 1320000,
					monthlyPayment: 6800,
					interestRate: 5.9,
					loanTerm: 300,
					maturityDate: new Date(
						Date.now() + 25 * 365 * 24 * 60 * 60 * 1000
					).toISOString(),
					principalLoanAmount: 960000,
					ltv: 72.7,
					mortgageType: "1st Position",
					propertyType: "Commercial - Retail",
				},
			},
			{
				name: "Aggressive Investment",
				financials: {
					purchasePrice: 2000000,
					currentValue: 2100000,
					monthlyPayment: 13500,
					interestRate: 6.8,
					loanTerm: 240,
					maturityDate: new Date(
						Date.now() + 20 * 365 * 24 * 60 * 60 * 1000
					).toISOString(),
					principalLoanAmount: 1700000,
					ltv: 81.0,
					mortgageType: "1st Position",
					propertyType: "Commercial - Office",
				},
			},
		];

		return (
			<div className="space-y-6">
				{properties.map((property, index) => (
					<div key={index}>
						<h3 className="mb-2 font-medium text-sm">{property.name}</h3>
						<FinancialMetrics financials={property.financials} />
					</div>
				))}
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Side-by-side comparison of different investment strategies showing risk vs return profiles.",
			},
		},
	},
};

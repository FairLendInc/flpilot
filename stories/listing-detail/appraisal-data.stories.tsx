import type { Meta, StoryObj } from "@storybook/react";
import { AppraisalData } from "@/components/listing-detail/appraisal-data";
import { generateListing } from "@/lib/mock-data/listings";

const meta: Meta<typeof AppraisalData> = {
	title: "Listing Detail/AppraisalData",
	component: AppraisalData,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Property appraisal information display showing valuation data, appraisal dates, methods, and appraiser details. Perfect for real estate due diligence.",
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
		appraisal: {
			value: 1250000,
			date: "2024-03-15T00:00:00.000Z",
			appraiser: "Smith & Associates Appraisals",
			method: "comparative" as const,
		},
		currentValue: 1200000,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Standard appraisal showing slight appreciation over purchase price using comparative market analysis.",
			},
		},
	},
};

export const RecentAppraisal: Story = {
	args: {
		appraisal: {
			value: 875000,
			date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
			appraiser: "Premier Property Valuations",
			method: "comparative" as const,
		},
		currentValue: 850000,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Recent appraisal from last week showing current market valuation.",
			},
		},
	},
};

export const NoAppraisal: Story = {
	args: {
		appraisal: undefined,
		currentValue: 650000,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Property without appraisal data - shows placeholder or empty state.",
			},
		},
	},
};

export const DifferentMethods: Story = {
	render: () => (
		<div className="space-y-6">
			<div>
				<h3 className="mb-2 font-medium text-sm">
					Comparative Market Analysis
				</h3>
				<AppraisalData
					appraisal={{
						value: 1450000,
						date: "2024-02-10T00:00:00.000Z",
						appraiser: "Coastal Property Assessment",
						method: "comparative",
					}}
					currentValue={1400000}
				/>
			</div>
			<div>
				<h3 className="mb-2 font-medium text-sm">Income Approach</h3>
				<AppraisalData
					appraisal={{
						value: 2100000,
						date: "2024-01-25T00:00:00.000Z",
						appraiser: "Metropolitan Valuation Group",
						method: "income",
					}}
					currentValue={2000000}
				/>
			</div>
			<div>
				<h3 className="mb-2 font-medium text-sm">Cost Approach</h3>
				<AppraisalData
					appraisal={{
						value: 980000,
						date: "2024-03-01T00:00:00.000Z",
						appraiser: "Accurate Home Appraisers",
						method: "cost",
					}}
					currentValue={950000}
				/>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Different appraisal methods showing how various valuation approaches affect property value.",
			},
		},
	},
};

export const HighValueAppraisal: Story = {
	args: {
		appraisal: {
			value: 5500000,
			date: "2024-02-28T00:00:00.000Z",
			appraiser: "Luxury Property Valuation Group",
			method: "comparative" as const,
		},
		currentValue: 5200000,
	},
	parameters: {
		docs: {
			description: {
				story:
					"High-value property appraisal showing multi-million dollar valuation.",
			},
		},
	},
};

export const BelowPurchasePrice: Story = {
	args: {
		appraisal: {
			value: 720000,
			date: "2024-01-15T00:00:00.000Z",
			appraiser: "Regional Property Assessment",
			method: "comparative" as const,
		},
		currentValue: 780000,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Appraisal below purchase price - shows potential overpayment or market decline scenario.",
			},
		},
	},
};

export const SignificantAppreciation: Story = {
	args: {
		appraisal: {
			value: 950000,
			date: "2024-03-10T00:00:00.000Z",
			appraiser: "Urban Property Valuations",
			method: "comparative" as const,
		},
		currentValue: 750000,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Property with significant appreciation showing strong investment performance.",
			},
		},
	},
};

export const OldAppraisal: Story = {
	args: {
		appraisal: {
			value: 680000,
			date: "2023-06-15T00:00:00.000Z",
			appraiser: "Heritage Property Appraisals",
			method: "comparative" as const,
		},
		currentValue: 650000,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Older appraisal from nearly a year ago - may indicate need for updated valuation.",
			},
		},
	},
};

export const WithMockListing: Story = {
	args: {
		appraisal: generateListing("appraised-property").appraisal,
		currentValue: generateListing("appraised-property").financials.currentValue,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Appraisal data using mock listing generator for realistic property valuation scenario.",
			},
		},
	},
};

export const MultipleAppraisals: Story = {
	render: () => {
		const basePrice = 1500000;
		return (
			<div className="space-y-6">
				<div>
					<h3 className="mb-2 font-medium text-sm">
						Initial Appraisal (Jan 2024)
					</h3>
					<AppraisalData
						appraisal={{
							value: 1480000,
							date: "2024-01-10T00:00:00.000Z",
							appraiser: "First County Appraisals",
							method: "comparative",
						}}
						currentValue={basePrice}
					/>
				</div>
				<div>
					<h3 className="mb-2 font-medium text-sm">
						Updated Appraisal (Mar 2024)
					</h3>
					<AppraisalData
						appraisal={{
							value: 1620000,
							date: "2024-03-15T00:00:00.000Z",
							appraiser: "Metropolitan Valuation Group",
							method: "comparative",
						}}
						currentValue={basePrice}
					/>
				</div>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Multiple appraisals over time showing property value progression and market changes.",
			},
		},
	},
};

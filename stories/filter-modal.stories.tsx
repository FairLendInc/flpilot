import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import FilterModal from "@/components/filter-modal";
import type { FilterableItem } from "@/components/ListingGridShell";
import {
	DEFAULT_FILTERS,
	FILTER_BOUNDS,
	type FilterState,
} from "@/components/types/listing-filters";

const meta: Meta<typeof FilterModal> = {
	title: "FilterModal",
	component: FilterModal,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Specialized filter modal for mortgage/loan filtering with LTV, interest rate, loan amount sliders, mortgage type selection, and maturity date picker. This component is specifically designed for financial filtering use cases.",
			},
		},
	},
	argTypes: {
		filters: {
			description:
				"Current filter state containing LTV range, interest rate range, loan amount range, mortgage types, property types, search query, and maturity date",
		},
		onFiltersChange: {
			action: "filtersChanged",
			description:
				"Callback when filters change - receives new FilterState object",
		},
		items: {
			description:
				"Optional array of filterable items used to generate histogram data for sliders",
		},
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-4xl p-4">
				<div className="flex justify-center">
					<Story />
				</div>
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample filterable items for histogram data
const sampleItems: FilterableItem[] = Array.from({ length: 100 }, (_, i) => ({
	id: `item-${i}`,
	ltv: 30 + Math.random() * 50, // Random LTV between 30-80
	apr: 3 + Math.random() * 12, // Random APR between 3-15
	principal: 100000 + Math.random() * 4900000, // Random loan amount
	title: `Property ${i + 1}`,
	address: `${100 + i} Main St`,
	lat: 40.7128 + (Math.random() - 0.5) * 0.1,
	lng: -74.006 + (Math.random() - 0.5) * 0.1,
}));

export const Default: Story = {
	args: {
		filters: DEFAULT_FILTERS,
		items: sampleItems,
		onFiltersChange: (filters: FilterState) =>
			console.log("Filters changed:", filters),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Default filter modal with default filter values and histogram data from sample items.",
			},
		},
	},
};

export const WithActiveFilters: Story = {
	args: {
		filters: {
			ltvRange: [50, 70] as [number, number],
			interestRateRange: [4.5, 8.5] as [number, number],
			loanAmountRange: [250000, 2000000] as [number, number],
			loanAmountMin: 250000,
			loanAmountMax: 2000000,
			mortgageTypes: ["First", "Second"],
			propertyTypes: ["Detached Home", "Condo"],
			searchQuery: "modern",
			maturityDate: new Date("2025-12-31"),
		},
		items: sampleItems,
		onFiltersChange: (filters: FilterState) =>
			console.log("Filters changed:", filters),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Filter modal with pre-selected active filters showing all possible filter combinations.",
			},
		},
	},
};

export const InteractiveDemo: Story = {
	render: () => {
		const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

		return (
			<div className="space-y-4">
				<div className="text-center">
					<p className="mb-4 text-gray-600 text-sm">
						Click the "Filters" button to open the modal and adjust the sliders
						and options.
					</p>
				</div>
				<FilterModal
					filters={filters}
					items={sampleItems}
					onFiltersChange={setFilters}
				/>
				<div className="mt-4 rounded-lg bg-gray-100 p-4">
					<h3 className="mb-2 font-semibold">Current Filter State:</h3>
					<pre className="overflow-auto text-xs">
						{JSON.stringify(filters, null, 2)}
					</pre>
				</div>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Interactive demo showing real-time filter state updates as you adjust the modal controls.",
			},
		},
	},
};

export const WithoutHistogramData: Story = {
	args: {
		filters: DEFAULT_FILTERS,
		onFiltersChange: (filters: FilterState) =>
			console.log("Filters changed:", filters),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Filter modal without histogram data - sliders will show without distribution charts.",
			},
		},
	},
};

export const CustomFilterRange: Story = {
	args: {
		filters: {
			ltvRange: [60, 75] as [number, number],
			interestRateRange: [5.0, 9.0] as [number, number],
			loanAmountRange: [500000, 3500000] as [number, number],
			loanAmountMin: 500000,
			loanAmountMax: 3500000,
			mortgageTypes: ["First"],
			propertyTypes: ["Condo", "Townhouse"],
			searchQuery: "",
			maturityDate: undefined,
		},
		items: sampleItems,
		onFiltersChange: (filters: FilterState) =>
			console.log("Filters changed:", filters),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Filter modal with custom preset ranges focused on specific loan criteria.",
			},
		},
	},
};

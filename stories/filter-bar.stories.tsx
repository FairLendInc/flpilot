import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { FilterBar } from "@/components/filter-bar";
import {
	DEFAULT_FILTERS,
	type FilterState,
} from "@/components/types/listing-filters";

const meta: Meta<typeof FilterBar> = {
	title: "FilterBar",
	component: FilterBar,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Interactive filter bar component for mortgage listings with search, filters (LTV, interest rate, mortgage types, property types), and maturity date filtering.",
			},
		},
	},
	argTypes: {
		filters: {
			description:
				"Current filter state including ranges, types, and search query",
		},
		onFiltersChange: {
			action: "filtersChanged",
			description: "Callback when filter state changes",
		},
		items: {
			description: "Optional array of filterable listing items",
		},
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-4xl p-4">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => {
		const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
		return <FilterBar />;
	},
	parameters: {
		docs: {
			description: {
				story: "Default filter bar with search and filter modal for listings.",
			},
		},
	},
};

export const WithActiveFilters: Story = {
	render: () => {
		const [filters, setFilters] = useState<FilterState>({
			...DEFAULT_FILTERS,
			ltvRange: [40, 70],
			interestRateRange: [5, 10],
			mortgageTypes: ["First"],
		});
		return <FilterBar />;
	},
	parameters: {
		docs: {
			description: {
				story:
					"Filter bar with some pre-selected filters showing active state.",
			},
		},
	},
};

export const WithSearchQuery: Story = {
	render: () => {
		const [filters, setFilters] = useState<FilterState>({
			...DEFAULT_FILTERS,
			searchQuery: "Toronto",
		});
		return <FilterBar />;
	},
	parameters: {
		docs: {
			description: {
				story: "Filter bar with a search query active.",
			},
		},
	},
};

export const WithMaturityDate: Story = {
	render: () => {
		const [filters, setFilters] = useState<FilterState>({
			...DEFAULT_FILTERS,
			maturityDate: new Date("2025-12-31"),
		});
		return <FilterBar />;
	},
	parameters: {
		docs: {
			description: {
				story: "Filter bar with a maturity date filter applied.",
			},
		},
	},
};

export const FullyFiltered: Story = {
	render: () => {
		const [filters, setFilters] = useState<FilterState>({
			ltvRange: [50, 65],
			interestRateRange: [6, 9],
			loanAmountRange: [500000, 2000000],
			loanAmountMin: 500000,
			loanAmountMax: 2000000,
			mortgageTypes: ["First", "Second"],
			propertyTypes: ["Condo", "Townhouse"],
			searchQuery: "Downtown",
			maturityDate: new Date("2026-06-30"),
		});
		return <FilterBar />;
	},
	parameters: {
		docs: {
			description: {
				story:
					"Filter bar with all available filters applied showing full state.",
			},
		},
	},
};

export const Interactive: Story = {
	render: () => {
		const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

		return (
			<div className="space-y-4">
				<FilterBar />
				<div className="rounded-lg bg-muted p-4">
					<h3 className="mb-2 font-semibold">Current Filters:</h3>
					<pre className="text-xs">{JSON.stringify(filters, null, 2)}</pre>
				</div>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "Interactive filter bar showing live filter state updates.",
			},
		},
	},
};

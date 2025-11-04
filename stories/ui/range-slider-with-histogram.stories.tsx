import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

// Mock function for callbacks
const fn = () => () => {};

import RangeSliderWithHistogram from "@/components/ui/range-slider-with-histogram";

const meta: Meta<typeof RangeSliderWithHistogram> = {
	title: "UI/RangeSliderWithHistogram",
	component: RangeSliderWithHistogram,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"An interactive range slider with histogram visualization for budget ranges or data distribution.",
			},
		},
	},
	argTypes: {
		min: {
			control: "number",
			description: "Minimum value for the range slider",
		},
		max: {
			control: "number",
			description: "Maximum value for the range slider",
		},
		step: {
			control: "number",
			description: "Step increment for the range slider",
		},
		histogramData: {
			control: { type: "object" },
			description: "Array of numbers representing histogram bar heights",
		},
		onValueChange: {
			action: "valueChanged",
			description: "Callback when range values change",
		},
		title: {
			control: "text",
			description: "Title displayed above the component",
		},
		formatValue: {
			control: { type: "object" },
			description: "Function to format values for display",
		},
		minLabel: {
			control: "text",
			description: "Label for minimum value",
		},
		maxLabel: {
			control: "text",
			description: "Label for maximum value",
		},
		bufferPercentage: {
			control: "number",
			description: "Buffer percentage for view range (0-1)",
		},
		inRangeClass: {
			control: "text",
			description: "CSS class for bars in range",
		},
		outOfRangeClass: {
			control: "text",
			description: "CSS class for bars out of range",
		},
		className: {
			control: "text",
			description: "Additional CSS classes",
		},
		defaultValue: {
			control: { type: "object" },
			description: "Default range values [min, max]",
		},
		renderTooltip: {
			control: { type: "object" },
			description: "Custom tooltip render function",
		},
	},
	args: {
		onValueChange: fn(),
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with sample data
export const Default: Story = {
	args: {
		title: "Budget Range",
		min: 100000,
		max: 1000000,
		step: 50000,
		histogramData: [
			500, 800, 1200, 1800, 2400, 3000, 2800, 2200, 1800, 1400, 1000, 800, 600,
			400, 300, 200, 150, 100, 50, 25,
		],
		formatValue: (value: number) => `₹${value.toLocaleString("en-IN")}`,
		minLabel: "Minimum",
		maxLabel: "Maximum",
	},
};

// Small budget range
export const SmallBudget: Story = {
	args: {
		title: "Small Project Budget",
		min: 1000,
		max: 100000,
		step: 5000,
		histogramData: [
			450, 680, 1200, 980, 750, 520, 380, 290, 180, 120, 80, 60, 40, 60, 40, 60,
			5, 3, 2, 1,
		],
		formatValue: (value: number) => `$${value.toLocaleString()}`,
		// bufferPercentage: 0.1,
	},
};

// With custom styling
export const CustomStyling: Story = {
	args: {
		title: "Custom Styled Budget",
		min: 100000,
		max: 1000000,
		step: 50000,
		histogramData: [
			500, 800, 1200, 1800, 2400, 3000, 2800, 2200, 1800, 1400, 1000, 800, 600,
			400, 300, 200, 150, 100, 50, 25,
		],
		formatValue: (value: number) => `€${(value / 1000).toFixed(0)}k`,
		inRangeClass: "bg-emerald-500",
		outOfRangeClass: "bg-gray-400",
		className: "border-2 border-emerald-200",
		// bufferPercentage: 0.15,
	},
};

// With default values set
export const WithDefaultValues: Story = {
	args: {
		title: "Pre-selected Budget Range",
		min: 25000,
		max: 250000,
		step: 5000,
		defaultValue: [75000, 150000],
		histogramData: [
			300, 600, 900, 1400, 1800, 2200, 2600, 2400, 2000, 1600, 1200, 900, 700,
			500, 400, 300, 200, 150, 100, 50,
		],
		formatValue: (value: number) => `£${(value / 1000).toFixed(0)}k`,
	},
};

// Empty histogram data (random data will be generated)
export const EmptyHistogram: Story = {
	args: {
		title: "Budget Distribution (Auto-generated)",
		min: 50000,
		max: 500000,
		step: 10000,
		histogramData: undefined, // Will use randomly generated data
		formatValue: (value: number) => `$${value.toLocaleString()}`,
	},
};

// With custom tooltip
export const CustomTooltip: Story = {
	args: {
		title: "Budget with Custom Tooltip",
		min: 100000,
		max: 1000000,
		step: 50000,
		histogramData: [
			500, 800, 1200, 1800, 2400, 3000, 2800, 2200, 1800, 1400, 1000, 800, 600,
			400, 300, 200, 150, 100, 50, 25,
		],
		renderTooltip: (count: number, value: number) => (
			<div className="text-sm">
				<div className="font-semibold text-blue-600">
					{count.toLocaleString()} projects
				</div>
				<div className="text-gray-600">
					Budget: ${(value / 1000).toFixed(0)}k
				</div>
				<div className="mt-1 text-gray-500 text-xs">Click to select range</div>
			</div>
		),
	},
};

// With high buffer percentage
export const HighBuffer: Story = {
	args: {
		title: "Budget with Extended View",
		min: 10000,
		max: 100000,
		step: 2000,
		bufferPercentage: 0.3,
		histogramData: [
			150, 300, 600, 900, 1200, 1500, 1200, 900, 600, 450, 300, 225, 150, 100,
			75, 50, 35, 25, 15, 10,
		],
		formatValue: (value: number) => `$${value.toLocaleString()}`,
	},
};

// Interactive story with state management
export const Interactive: Story = {
	render: (args: any) => {
		const [range, setRange] = useState<[number, number]>([
			args.defaultValue?.[0] || args.min || 50000,
			args.defaultValue?.[1] || args.max || 500000,
		]);

		return (
			<div className="space-y-4 p-4">
				<RangeSliderWithHistogram
					{...args}
					defaultValue={range}
					onValueChange={setRange}
				/>
				<div className="rounded-lg bg-gray-100 p-4">
					<h3 className="mb-2 font-semibold">Current Selection:</h3>
					<p className="text-sm">
						Minimum: {args.formatValue ? args.formatValue(range[0]) : range[0]}
					</p>
					<p className="text-sm">
						Maximum: {args.formatValue ? args.formatValue(range[1]) : range[1]}
					</p>
					<p className="font-semibold text-sm">
						Range Size:{" "}
						{args.formatValue
							? args.formatValue(range[1] - range[0])
							: range[1] - range[0]}
					</p>
				</div>
			</div>
		);
	},
	args: {
		title: "Interactive Budget Selector",
		min: 50000,
		max: 1000000,
		step: 25000,
		defaultValue: [200000, 600000],
		histogramData: [
			200, 400, 800, 1200, 1600, 2000, 2400, 2800, 3200, 2800, 2400, 2000, 1600,
			1200, 800, 600, 400, 300, 200, 100,
		],
		formatValue: (value: number) => `$${(value / 1000).toFixed(0)}k`,
	},
};

// Compact version with reduced styling
export const Compact: Story = {
	args: {
		title: "Quick Budget",
		min: 5000,
		max: 50000,
		step: 1000,
		histogramData: [
			120, 240, 480, 720, 960, 1200, 1440, 1680, 1920, 1680, 1440, 1200, 960,
			720, 480, 360, 240, 180, 120, 60,
		],
		formatValue: (value: number) => `$${value.toLocaleString()}`,
		className: "p-4",
		minLabel: "Min",
		maxLabel: "Max",
	},
};

import type { Meta, StoryObj } from "@storybook/react";
import { CardDecorator } from "@/components/ui/card-decorator";

const meta: Meta<typeof CardDecorator> = {
	title: "UI/CardDecorator",
	component: CardDecorator,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Decorative overlay component with corner accents. Perfect for adding visual emphasis to cards and containers.",
			},
		},
	},
	argTypes: {
		variant: {
			control: { type: "select" },
			options: ["default", "dashed", "dots", "glow"],
			description: "Visual style variant for corner decoration",
		},
		className: {
			control: { type: "text" },
			description: "Additional CSS classes",
		},
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-md p-8">
				<div className="group relative rounded-lg border bg-white p-6 dark:bg-gray-800">
					<Story />
					<div className="text-center">
						<h3 className="mb-2 font-semibold text-lg">Card Content</h3>
						<p className="text-gray-600 dark:text-gray-400">
							This is the card content with decorative corners applied.
						</p>
					</div>
				</div>
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		variant: "default",
	},
	parameters: {
		docs: {
			description: {
				story: "Default L-shaped corner decorations with solid borders.",
			},
		},
	},
};

export const Dashed: Story = {
	args: {
		variant: "dashed",
	},
	parameters: {
		docs: {
			description: {
				story: "Dashed border corners with more prominent corner accents.",
			},
		},
	},
};

export const Dots: Story = {
	args: {
		variant: "dots",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Decorative dot patterns in corners with gradient opacity effects.",
			},
		},
	},
};

export const Glow: Story = {
	args: {
		variant: "glow",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Glow effect corners with hover animations and size transitions.",
			},
		},
	},
};

export const Comparison: Story = {
	render: () => (
		<div className="grid grid-cols-2 gap-6">
			<div className="space-y-4">
				<h3 className="text-center font-medium text-sm">Corner Variants</h3>
				<div className="group relative rounded-lg border bg-white p-4 dark:bg-gray-800">
					<CardDecorator variant="default" />
					<p className="text-center text-xs">Default</p>
				</div>
				<div className="group relative rounded-lg border bg-white p-4 dark:bg-gray-800">
					<CardDecorator variant="dashed" />
					<p className="text-center text-xs">Dashed</p>
				</div>
			</div>

			<div className="space-y-4">
				<h3 className="text-center font-medium text-sm">Pattern Variants</h3>
				<div className="group relative rounded-lg border bg-white p-4 dark:bg-gray-800">
					<CardDecorator variant="dots" />
					<p className="text-center text-xs">Dots</p>
				</div>
				<div className="group relative rounded-lg border bg-white p-4 dark:bg-gray-800">
					<CardDecorator variant="glow" />
					<p className="text-center text-xs">Glow</p>
				</div>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "All available variants shown together for comparison.",
			},
		},
	},
};

export const WithCustomContent: Story = {
	render: () => (
		<div className="space-y-4">
			<div className="group relative rounded-lg border bg-white p-6 dark:bg-gray-800">
				<CardDecorator variant="dots" />
				<div className="text-center">
					<h4 className="mb-2 font-semibold">Featured Product</h4>
					<p className="mb-2 font-bold text-2xl">$29.99</p>
					<p className="mb-4 text-gray-600 text-sm">
						Premium quality with decorative corners
					</p>
					<button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
						Add to Cart
					</button>
				</div>
			</div>

			<div className="group relative rounded-lg border bg-white p-6 dark:bg-gray-800">
				<CardDecorator variant="glow" />
				<div className="text-center">
					<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
						<span className="font-bold text-purple-600">⭐</span>
					</div>
					<h4 className="mb-2 font-semibold">Premium Feature</h4>
					<p className="text-gray-600 text-sm">
						Enhanced with glow effect corners
					</p>
				</div>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Examples with different content types showing how decorators enhance various card designs.",
			},
		},
	},
};

export const DarkMode: Story = {
	render: () => (
		<div className="space-y-4">
			<div className="group relative rounded-lg border border-gray-700 bg-gray-900 p-6">
				<CardDecorator variant="default" />
				<div className="text-center">
					<h4 className="mb-2 font-semibold text-white">Dark Mode Card</h4>
					<p className="text-gray-400 text-sm">
						Decorators adapt to dark theme
					</p>
				</div>
			</div>

			<div className="group relative rounded-lg border border-gray-700 bg-gray-900 p-6">
				<CardDecorator variant="glow" />
				<div className="text-center">
					<h4 className="mb-2 font-semibold text-white">Glow in Dark</h4>
					<p className="text-gray-400 text-sm">Enhanced visibility with glow</p>
				</div>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Decorators in dark mode showing proper theme adaptation.",
			},
		},
	},
};

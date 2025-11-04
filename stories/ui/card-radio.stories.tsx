import type { Meta, StoryObj } from "@storybook/react";
import CardRadio from "@/components/ui/card-radio";

const meta: Meta<typeof CardRadio> = {
	title: "UI/CardRadio",
	component: CardRadio,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Interactive card-based radio selection demo with animated transitions. Shows three pricing options with click-to-select functionality.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-4xl p-8">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
	parameters: {
		docs: {
			description: {
				story:
					"Default CardRadio component showing three pricing plans with interactive selection.",
			},
		},
	},
};

export const Interactive: Story = {
	render: () => <CardRadio />,
	parameters: {
		docs: {
			description: {
				story:
					"Interactive demo with hover effects and spring animations on selection.",
			},
		},
	},
};

export const WithCustomStyling: Story = {
	render: () => (
		<div className="space-y-6">
			<h2 className="mb-4 text-center font-semibold text-xl">
				Premium Plan Selection
			</h2>
			<div className="rounded-xl bg-gray-50 p-6 dark:bg-gray-800">
				<CardRadio />
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "CardRadio wrapped in custom container with additional styling.",
			},
		},
	},
};

export const CenteredLayout: Story = {
	render: () => (
		<div className="flex min-h-[400px] items-center justify-center">
			<div className="w-full max-w-2xl">
				<h2 className="mb-8 text-center font-bold text-2xl">
					Choose Your Subscription
				</h2>
				<CardRadio />
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "CardRadio displayed in a centered layout with custom heading.",
			},
		},
	},
};

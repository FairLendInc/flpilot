import type { Meta, StoryObj } from "@storybook/react";
import { EmptyResult } from "@/components/ui/empty-result";

const meta: Meta<typeof EmptyResult> = {
	title: "UI/EmptyResult",
	component: EmptyResult,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Simple empty state component with animated Lottie illustration and hardcoded message. Displays 'No Data Found' with a descriptive subtitle when no data is available.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-md p-8">
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
					"Default empty state showing 'No Data Found' message with animated Lottie illustration.",
			},
		},
	},
};

export const EmptyStateDemo: Story = {
	render: () => (
		<div className="space-y-8">
			<div>
				<h3 className="mb-2 text-center font-medium text-sm">
					Default Empty State
				</h3>
				<EmptyResult />
			</div>
			<div className="text-center text-gray-600 text-sm">
				<p>
					The EmptyResult component displays a simple animated empty state with:
				</p>
				<ul className="mt-2 space-y-1">
					<li>• Animated Lottie illustration (empty.lottie)</li>
					<li>• "No Data Found" title</li>
					<li>• Descriptive subtitle text</li>
					<li>• Smooth entrance animations</li>
				</ul>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Demonstration of the EmptyResult component with explanatory context.",
			},
		},
	},
};

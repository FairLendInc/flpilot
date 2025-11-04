import type { Meta, StoryObj } from "@storybook/react";
import IconRadio from "@/components/ui/icon-radio";

const meta: Meta<typeof IconRadio> = {
	title: "UI/IconRadio",
	component: IconRadio,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Icon-based radio button component with animated selections. This is a self-contained demo component that showcases icon-based selection patterns.",
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
	parameters: {
		docs: {
			description: {
				story:
					"Default icon radio component with animated selections and multiple icon options.",
			},
		},
	},
};

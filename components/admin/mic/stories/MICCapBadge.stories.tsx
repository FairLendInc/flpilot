import type { Meta, StoryObj } from "@storybook/react";
import { MICCapBadge } from "../MICCapBadge";

const meta: Meta<typeof MICCapBadge> = {
	title: "Admin/MIC/Shared/MICCapBadge",
	component: MICCapBadge,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: ["default", "success", "warning", "danger", "outline"],
		},
		capitalClass: {
			control: "text",
		},
		showIcon: {
			control: "boolean",
		},
	},
};

export default meta;
type Story = StoryObj<typeof MICCapBadge>;

export const Default: Story = {
	args: {
		capitalClass: "MICCAP-FLMIC/0",
		variant: "default",
	},
};

export const Success: Story = {
	args: {
		capitalClass: "MICCAP-FLMIC/SUCCESS",
		variant: "success",
	},
};

export const Warning: Story = {
	args: {
		capitalClass: "MICCAP-FLMIC/PENDING",
		variant: "warning",
	},
};

export const Danger: Story = {
	args: {
		capitalClass: "MICCAP-FLMIC/LOCKED",
		variant: "danger",
	},
};

export const Outline: Story = {
	args: {
		capitalClass: "MICCAP-FLMIC/EXTERNAL",
		variant: "outline",
	},
};

export const NoIcon: Story = {
	args: {
		capitalClass: "MICCAP-FLMIC/SIMPLE",
		variant: "default",
		showIcon: false,
	},
};

export const LongClass: Story = {
	args: {
		capitalClass: "MICCAP-FLMIC-VERY-REALLY-LONG-CLASS-NAME",
		variant: "default",
	},
	decorators: [
		(StoryFn) => (
			<div style={{ width: "150px" }}>
				<StoryFn />
			</div>
		),
	],
};

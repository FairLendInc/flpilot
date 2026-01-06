import type { Meta, StoryObj } from "@storybook/react";
import { AccrualStatusIndicator } from "../AccrualStatusIndicator";

const meta: Meta<typeof AccrualStatusIndicator> = {
	title: "Admin/MIC/Shared/AccrualStatusIndicator",
	component: AccrualStatusIndicator,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		status: {
			control: "select",
			options: ["up-to-date", "pending", "behind"],
		},
		lastAccruedDate: {
			control: "date",
		},
		nextAccrualDate: {
			control: "date",
		},
		showDetails: {
			control: "boolean",
		},
	},
};

export default meta;
type Story = StoryObj<typeof AccrualStatusIndicator>;

export const UpToDate: Story = {
	args: {
		status: "up-to-date",
		lastAccruedDate: new Date("2024-12-01"),
		nextAccrualDate: new Date("2024-12-31"),
	},
};

export const Pending: Story = {
	args: {
		status: "pending",
		lastAccruedDate: new Date("2024-11-30"),
		nextAccrualDate: new Date("2024-12-15"),
	},
};

export const Behind: Story = {
	args: {
		status: "behind",
		lastAccruedDate: new Date("2024-11-15"),
		nextAccrualDate: new Date("2024-12-01"),
	},
};

export const NoDetails: Story = {
	args: {
		status: "up-to-date",
		showDetails: false,
	},
};

export const JustLastDate: Story = {
	args: {
		status: "pending",
		lastAccruedDate: new Date("2024-12-01"),
		showDetails: true,
	},
};

import type { Meta, StoryObj } from "@storybook/react";
import { OwnershipPieChart } from "@/components/admin/mic/OwnershipPieChart";

const meta: Meta<typeof OwnershipPieChart> = {
	title: "Admin/MIC/Shared/OwnershipPieChart",
	component: OwnershipPieChart,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		percentage: {
			control: { type: "range", min: 0, max: 100, step: 1 },
		},
		color: {
			control: "color",
		},
		innerRadius: {
			control: { type: "number", min: 0, max: 100 },
		},
		outerRadius: {
			control: { type: "number", min: 0, max: 150 },
		},
	},
};

export default meta;
type Story = StoryObj<typeof OwnershipPieChart>;

export const Default: Story = {
	args: {
		percentage: 75,
		label: "MIC Ownership",
		subLabel: "Ownership",
	},
};

export const FullOwnership: Story = {
	args: {
		percentage: 100,
		label: "Full MIC Ownership",
		subLabel: "Ownership",
		color: "hsl(var(--success))",
	},
};

export const PartialOwnership: Story = {
	args: {
		percentage: 20,
		label: "Minority Stake",
		subLabel: "Owned",
		color: "hsl(var(--warning))",
	},
};

export const SoldPortion: Story = {
	args: {
		percentage: 80,
		label: "External Buyer",
		subLabel: "Sold",
		color: "hsl(var(--info))",
	},
};

export const Small: Story = {
	args: {
		percentage: 50,
		innerRadius: 30,
		outerRadius: 40,
	},
};

export const ZeroOwnership: Story = {
	args: {
		percentage: 0,
		label: "No Ownership",
		subLabel: "Owned",
	},
};

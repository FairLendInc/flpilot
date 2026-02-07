import type { Meta, StoryObj } from "@storybook/react";
import { MICCashHealthCard } from "../MICCashHealthCard";

const meta: Meta<typeof MICCashHealthCard> = {
	title: "Admin/MIC/Widgets/MICCashHealthCard",
	component: MICCashHealthCard,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [
		(StoryFn) => (
			<div className="w-[350px] bg-slate-50 p-4 dark:bg-slate-950">
				<StoryFn />
			</div>
		),
	],
	argTypes: {
		balance: {
			control: { type: "number", min: 0 },
		},
		target: {
			control: { type: "number", min: 0 },
		},
	},
};

export default meta;
type Story = StoryObj<typeof MICCashHealthCard>;

export const Healthy: Story = {
	args: {
		balance: 1250000,
		target: 1000000,
	},
};

export const Warning: Story = {
	args: {
		balance: 650000,
		target: 1000000,
	},
};

export const Critical: Story = {
	args: {
		balance: 150000,
		target: 1000000,
	},
};

export const Empty: Story = {
	args: {
		balance: 0,
		target: 1000000,
	},
};

export const HighTarget: Story = {
	args: {
		balance: 5000000,
		target: 10000000,
	},
};

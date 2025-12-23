import type { Meta, StoryObj } from "@storybook/react";
import { CurrentPeriodCard } from "../CurrentPeriodCard";

const meta: Meta<typeof CurrentPeriodCard> = {
	title: "Admin/MIC/Widgets/CurrentPeriodCard",
	component: CurrentPeriodCard,
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
};

export default meta;
type Story = StoryObj<typeof CurrentPeriodCard>;

export const Open: Story = {
	args: {
		periodName: "December 2024",
		startDate: "2024-12-01",
		endDate: "2024-12-31",
		status: "open",
		progress: 65,
	},
};

export const Closing: Story = {
	args: {
		periodName: "November 2024",
		startDate: "2024-11-01",
		endDate: "2024-11-30",
		status: "closing",
		progress: 95,
	},
};

export const Closed: Story = {
	args: {
		periodName: "October 2024",
		startDate: "2024-10-01",
		endDate: "2024-10-31",
		status: "closed",
	},
};

export const JustStarted: Story = {
	args: {
		periodName: "January 2025",
		startDate: "2025-01-01",
		endDate: "2025-01-31",
		status: "open",
		progress: 5,
	},
};

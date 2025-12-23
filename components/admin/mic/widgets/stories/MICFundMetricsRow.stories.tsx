import type { Meta, StoryObj } from "@storybook/react";
import { Building2, TrendingUp, Users, Wallet } from "lucide-react";
import { MICFundMetricsRow } from "../MICFundMetricsRow";

const meta: Meta<typeof MICFundMetricsRow> = {
	title: "Admin/MIC/Widgets/MICFundMetricsRow",
	component: MICFundMetricsRow,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
	decorators: [
		(StoryFn) => (
			<div className="min-h-screen bg-slate-50 p-8 dark:bg-slate-950">
				<StoryFn />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof MICFundMetricsRow>;

export const Default: Story = {
	args: {},
};

export const CustomMetrics: Story = {
	args: {
		metrics: [
			{
				label: "New Deposits",
				value: "$450,000",
				change: "+$200k from yesterday",
				trend: "up",
				icon: Wallet,
				color: "text-emerald-500",
				bgGradient: "from-emerald-500/10 to-emerald-500/5",
			},
			{
				label: "Pending Redemptions",
				value: "$120,000",
				change: "2 requests pending",
				trend: "neutral",
				icon: Users,
				color: "text-rose-500",
				bgGradient: "from-rose-500/10 to-rose-500/5",
			},
			{
				label: "Available Pipeline",
				value: "$3,400,000",
				change: "5 deals in underwriting",
				trend: "up",
				icon: Building2,
				color: "text-indigo-500",
				bgGradient: "from-indigo-500/10 to-indigo-500/5",
			},
			{
				label: "Platform Revenue",
				value: "$45,200",
				change: "+15% month-over-month",
				trend: "up",
				icon: TrendingUp,
				color: "text-blue-500",
				bgGradient: "from-blue-500/10 to-blue-500/5",
			},
		],
	},
};

export const LoadingPerformance: Story = {
	args: {
		metrics: new Array(4).fill({
			label: "Loading...",
			value: "---",
			change: "Calculating...",
			trend: "neutral",
			icon: Wallet,
			color: "text-slate-400",
			bgGradient:
				"from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900",
		}),
	},
};

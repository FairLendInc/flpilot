import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { DemoLedgerStatePanel } from "../DemoLedgerStatePanel";

const meta: Meta<typeof DemoLedgerStatePanel> = {
	title: "Admin/MIC/Demo/DemoLedgerStatePanel",
	component: DemoLedgerStatePanel,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DemoLedgerStatePanel>;

const mockAccounts = [
	{
		id: "MIC:CASH",
		label: "MIC Cash Holdings",
		balance: "1,250,000",
		asset: "USD",
		type: "internal" as const,
	},
	{
		id: "MIC:INTEREST",
		label: "Interest Clearing",
		balance: "2,450.50",
		asset: "USD",
		type: "internal" as const,
	},
	{
		id: "inv:scott:CASH",
		label: "M. Scott Wallet",
		balance: "10,240.00",
		asset: "USD",
		type: "investor" as const,
	},
	{
		id: "mortgage:102",
		label: "Asset Participation",
		balance: "500,000",
		asset: "USD",
		type: "external" as const,
	},
];

export const Default: Story = {
	args: {
		accounts: mockAccounts,
	},
	decorators: [
		(StoryFn) => (
			<div className="w-[450px] bg-slate-900 p-4">
				<StoryFn />
			</div>
		),
	],
};

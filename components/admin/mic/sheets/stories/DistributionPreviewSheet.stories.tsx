import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Button } from "@/components/ui/button";
import { DistributionPreviewSheet } from "../DistributionPreviewSheet";

const meta: Meta<typeof DistributionPreviewSheet> = {
	title: "Admin/MIC/Sheets/DistributionPreviewSheet",
	component: DistributionPreviewSheet,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DistributionPreviewSheet>;

const mockShares = [
	{
		id: "INV-001",
		name: "Michael Scott",
		units: 250000,
		percentage: 22.5,
		amount: 15200.5,
	},
	{
		id: "INV-002",
		name: "Dwight Schrute",
		units: 850000,
		percentage: 76.8,
		amount: 51840.0,
	},
	{
		id: "INV-003",
		name: "Pam Beesly",
		units: 50000,
		percentage: 4.5,
		amount: 3040.1,
	},
	{
		id: "INV-004",
		name: "Jim Halpert",
		units: 10000,
		percentage: 0.9,
		amount: 608.0,
	},
	{
		id: "INV-005",
		name: "Stanley Hudson",
		units: 100000,
		percentage: 9.0,
		amount: 6080.0,
	},
];

export const Default: Story = {
	args: {
		open: true,
		periodName: "November 2024",
		totalPool: 76768.6,
		shares: mockShares,
		onOpenChange: (isOpen) => {
			console.log(`Open: ${isOpen}`);
		},
		onExecute: () => {
			console.log("Executing");
		},
	},
	decorators: [
		(StoryFn) => (
			<div className="min-h-screen bg-slate-50 p-8 dark:bg-slate-950">
				<Button
					onClick={() => {
						console.log("clicked");
					}}
				>
					Preview Cycle
				</Button>
				<StoryFn />
			</div>
		),
	],
};

export const LargeSet: Story = {
	args: {
		open: true,
		periodName: "Year End 2024",
		totalPool: 250000,
		shares: [
			...mockShares,
			...mockShares.map((s) => ({
				...s,
				id: `${s.id}-alt`,
				name: `${s.name} (LLC)`,
			})),
		],
		onOpenChange: (isOpen) => {
			console.log(`Open: ${isOpen}`);
		},
		onExecute: () => {
			console.log("Executing");
		},
	},
};

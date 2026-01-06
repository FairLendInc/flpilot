import type { Meta, StoryObj } from "@storybook/react";
import { MICInvestorsTable } from "../MICInvestorsTable";

const meta: Meta<typeof MICInvestorsTable> = {
	title: "Admin/MIC/Tables/MICInvestorsTable",
	component: MICInvestorsTable,
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
type Story = StoryObj<typeof MICInvestorsTable>;

const mockInvestors = [
	{
		id: "1",
		name: "Michael Scott",
		email: "michael.scott@dundermifflin.com",
		capitalClass: "MICCAP-FLMIC/0",
		unitsOwned: 250000,
		ownershipPercentage: 22.5,
		currentValue: 250000,
		accrualStatus: "up-to-date" as const,
		lastAccruedDate: "2024-12-01",
	},
	{
		id: "2",
		name: "Dwight Schrute",
		email: "dwight.schrute@schrutefarms.com",
		capitalClass: "MICCAP-FLMIC/0",
		unitsOwned: 850000,
		ownershipPercentage: 76.8,
		currentValue: 850000,
		accrualStatus: "behind" as const,
		lastAccruedDate: "2024-11-15",
	},
	{
		id: "3",
		name: "Pam Beesly",
		email: "pam.beesly@dundermifflin.com",
		capitalClass: "MICCAP-FLMIC/0",
		unitsOwned: 50000,
		ownershipPercentage: 4.5,
		currentValue: 50000,
		accrualStatus: "pending" as const,
		lastAccruedDate: "2024-11-30",
	},
	{
		id: "4",
		name: "Jim Halpert",
		email: "jim.halpert@athlead.com",
		capitalClass: "MICCAP-FLMIC/0",
		unitsOwned: 10000,
		ownershipPercentage: 0.9,
		currentValue: 10000,
		accrualStatus: "up-to-date" as const,
	},
];

export const Default: Story = {
	args: {
		data: mockInvestors,
	},
};

export const Empty: Story = {
	args: {
		data: [],
	},
};

export const ManyInvestors: Story = {
	args: {
		data: [
			...mockInvestors,
			...mockInvestors.map((i) => ({
				...i,
				id: `${i.id}-copy`,
				name: `${i.name} (Copy)`,
			})),
		],
	},
};

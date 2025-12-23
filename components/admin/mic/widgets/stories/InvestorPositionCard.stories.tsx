import type { Meta, StoryObj } from "@storybook/react";
import { InvestorPositionCard } from "../InvestorPositionCard";

const meta: Meta<typeof InvestorPositionCard> = {
	title: "Admin/MIC/Widgets/InvestorPositionCard",
	component: InvestorPositionCard,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [
		(StoryFn) => (
			<div className="w-[400px] bg-slate-50 p-4 dark:bg-slate-950">
				<StoryFn />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof InvestorPositionCard>;

export const Default: Story = {
	args: {
		investorName: "Michael Scott",
		capitalClass: "MICCAP-FLMIC/0",
		unitsOwned: 250000,
		ownershipPercentage: 22.5,
		currentValue: 250000,
		accrualStatus: "up-to-date",
		lastAccruedDate: "2024-12-01",
	},
};

export const MinorityStake: Story = {
	args: {
		investorName: "Pam Beesly",
		capitalClass: "MICCAP-FLMIC/0",
		unitsOwned: 50000,
		ownershipPercentage: 4.5,
		currentValue: 50000,
		accrualStatus: "pending",
		lastAccruedDate: "2024-11-30",
	},
};

export const MajorityStake: Story = {
	args: {
		investorName: "Dwight Schrute",
		capitalClass: "MICCAP-FLMIC/0",
		unitsOwned: 850000,
		ownershipPercentage: 76.8,
		currentValue: 850000,
		accrualStatus: "behind",
		lastAccruedDate: "2024-11-15",
	},
};

export const NewInvestor: Story = {
	args: {
		investorName: "Jim Halpert",
		capitalClass: "MICCAP-FLMIC/0",
		unitsOwned: 10000,
		ownershipPercentage: 0.9,
		currentValue: 10000,
		accrualStatus: "up-to-date",
	},
};

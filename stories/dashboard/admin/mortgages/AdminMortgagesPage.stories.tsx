import type { Meta, StoryObj } from "@storybook/react";
import AdminMortgagesPage from "@/app/dashboard/admin/mortgages/page";

const meta: Meta<typeof AdminMortgagesPage> = {
	title: "Dashboard/Admin/Mortgages/AdminMortgagesPage",
	component: AdminMortgagesPage,
	parameters: {
		layout: "fullscreen",
	},
};

export default meta;
type Story = StoryObj<typeof AdminMortgagesPage>;

export const Default: Story = {};

export const Loading: Story = {
	parameters: {
		mockData: {
			mortgages: undefined,
		},
	},
};

export const Empty: Story = {
	parameters: {
		mockData: {
			mortgages: [],
		},
	},
};


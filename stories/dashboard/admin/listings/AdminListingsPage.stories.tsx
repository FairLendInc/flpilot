import type { Meta, StoryObj } from "@storybook/react";
import AdminListingsPage from "@/app/dashboard/admin/listings/page";

const meta: Meta<typeof AdminListingsPage> = {
	title: "Dashboard/Admin/Listings/AdminListingsPage",
	component: AdminListingsPage,
	parameters: {
		layout: "fullscreen",
	},
};

export default meta;
type Story = StoryObj<typeof AdminListingsPage>;

export const Default: Story = {};

export const Loading: Story = {
	parameters: {
		mockData: {
			listings: undefined,
		},
	},
};

export const Empty: Story = {
	parameters: {
		mockData: {
			listings: [],
		},
	},
};


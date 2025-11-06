import type { Meta, StoryObj } from "@storybook/react";
import { ListingUpdateForm } from "@/app/dashboard/admin/listings/components/ListingUpdateForm";
import type { Id } from "@/convex/_generated/dataModel";

const meta: Meta<typeof ListingUpdateForm> = {
	title: "Dashboard/Admin/Listings/ListingUpdateForm",
	component: ListingUpdateForm,
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<div className="w-[600px]">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof ListingUpdateForm>;

export const Default: Story = {
	args: {
		listingId: "j1234567890abcdef" as Id<"listings">,
		initialVisible: true,
		initialLocked: false,
	},
};

export const Hidden: Story = {
	args: {
		listingId: "j1234567890abcdef" as Id<"listings">,
		initialVisible: false,
		initialLocked: false,
	},
};

export const Locked: Story = {
	args: {
		listingId: "j1234567890abcdef" as Id<"listings">,
		initialVisible: true,
		initialLocked: true,
	},
};

export const LockedAndHidden: Story = {
	args: {
		listingId: "j1234567890abcdef" as Id<"listings">,
		initialVisible: false,
		initialLocked: true,
	},
};


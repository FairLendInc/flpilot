import type { Meta, StoryObj } from "@storybook/react";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";

const meta = {
	title: "Navigation/BreadcrumbNav",
	component: BreadcrumbNav,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof BreadcrumbNav>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic breadcrumb with just home
 */
export const HomeOnly: Story = {
	args: {
		items: [],
	},
};

/**
 * Breadcrumb for listings page
 */
export const ListingsPage: Story = {
	args: {
		items: [{ label: "Listings" }],
	},
};

/**
 * Breadcrumb for listing detail page
 */
export const ListingDetailPage: Story = {
	args: {
		items: [
			{ label: "Listings", href: "/listings" },
			{ label: "123 Main St - Toronto Investment Property" },
		],
	},
};

/**
 * Deep navigation example
 */
export const DeepNavigation: Story = {
	args: {
		items: [
			{ label: "Portfolio", href: "/portfolio" },
			{ label: "Properties", href: "/portfolio/properties" },
			{ label: "Toronto", href: "/portfolio/properties/toronto" },
			{ label: "123 Main Street" },
		],
	},
};

/**
 * Long title that might wrap
 */
export const LongTitle: Story = {
	args: {
		items: [
			{ label: "Listings", href: "/listings" },
			{
				label:
					"Premium Waterfront Investment Property with Stunning Lake Views and Modern Amenities - Toronto Downtown Core",
			},
		],
	},
};

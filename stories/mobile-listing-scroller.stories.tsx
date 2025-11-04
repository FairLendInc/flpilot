import type { Meta, StoryObj } from "@storybook/react";
import type * as React from "react";
import { Horizontal } from "@/components/listing-card-horizontal";
import {
	MobileListingScroller,
	type MobileListingSection,
} from "@/components/mobile-listing-scroller";

const meta: Meta<typeof MobileListingScroller> = {
	title: "Components/MobileListingScroller",
	component: MobileListingScroller,
	parameters: {
		layout: "fullscreen",
		viewport: {
			defaultViewport: "mobile1",
		},
		docs: {
			description: {
				component:
					"An Airbnb-style mobile listing scroller with titled sections and horizontal scrolling. Groups mortgage listings by type (First, Second, Other) with smooth touch-based navigation.",
			},
		},
	},
};

type MobileListingScrollerProps<T> = {
	sections: MobileListingSection<T>[];
	renderCard: (item: T) => React.ReactNode;
};

export default meta;
type Story = StoryObj<typeof meta>;

type MockListing = {
	id: string;
	title: string;
	address: string;
	imageSrc: string;
	ltv: number;
	apr: number;
	principal: number;
	mortgageType: "first" | "second" | "other";
};

// Sample mortgage listings data
const firstMortgageListings: MockListing[] = [
	{
		id: "1",
		title: "Malibu Beach Detached",
		address: "Malibu, CA",
		imageSrc: "/house.jpg",
		ltv: 80,
		apr: 9.5,
		principal: 450000,
		mortgageType: "first",
	},
	{
		id: "2",
		title: "Downtown Loft",
		address: "Los Angeles, CA",
		imageSrc: "/house.jpg",
		ltv: 75,
		apr: 8.1,
		principal: 350000,
		mortgageType: "first",
	},
	{
		id: "3",
		title: "Santa Monica Townhome",
		address: "Santa Monica, CA",
		imageSrc: "/house.jpg",
		ltv: 72,
		apr: 7.9,
		principal: 525000,
		mortgageType: "first",
	},
	{
		id: "4",
		title: "Beverly Hills Estate",
		address: "Beverly Hills, CA",
		imageSrc: "/house.jpg",
		ltv: 70,
		apr: 8.5,
		principal: 750000,
		mortgageType: "first",
	},
];

const secondMortgageListings: MockListing[] = [
	{
		id: "5",
		title: "Pasadena Bungalow",
		address: "Pasadena, CA",
		imageSrc: "/house.jpg",
		ltv: 60,
		apr: 10.5,
		principal: 150000,
		mortgageType: "second",
	},
	{
		id: "6",
		title: "Glendale Condo",
		address: "Glendale, CA",
		imageSrc: "/house.jpg",
		ltv: 55,
		apr: 11.2,
		principal: 125000,
		mortgageType: "second",
	},
	{
		id: "7",
		title: "Burbank Townhouse",
		address: "Burbank, CA",
		imageSrc: "/house.jpg",
		ltv: 58,
		apr: 10.8,
		principal: 175000,
		mortgageType: "second",
	},
];

const otherMortgageListings: MockListing[] = [
	{
		id: "8",
		title: "Commercial Building",
		address: "Downtown LA, CA",
		imageSrc: "/house.jpg",
		ltv: 65,
		apr: 9.0,
		principal: 850000,
		mortgageType: "other",
	},
];

// Render card function
const renderCard = (item: unknown) => {
	const mockItem = item as MockListing;
	return (
		<Horizontal
			address={mockItem.address}
			apr={mockItem.apr}
			imageSrc={mockItem.imageSrc}
			key={mockItem.id}
			ltv={mockItem.ltv}
			principal={mockItem.principal}
			title={mockItem.title}
		/>
	);
};

// Default story showing all mortgage types
export const Default: Story = {
	args: {
		sections: [
			{ title: "First Mortgages", items: firstMortgageListings },
			{ title: "Second Mortgages", items: secondMortgageListings },
			{ title: "Other Mortgages", items: otherMortgageListings },
		],
		renderCard,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Default view showing all three mortgage types with multiple listings each. Scroll horizontally within each section to view more properties.",
			},
		},
	},
};

// Story with only first mortgages
export const FirstMortgagesOnly: Story = {
	args: {
		sections: [{ title: "First Mortgages", items: firstMortgageListings }],
		renderCard,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Display only first mortgage listings. Shows how the component handles a single section.",
			},
		},
	},
};

// Story with only second mortgages
export const SecondMortgagesOnly: Story = {
	args: {
		sections: [{ title: "Second Mortgages", items: secondMortgageListings }],
		renderCard,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Display only second mortgage listings with horizontal scrolling.",
			},
		},
	},
};

// Story with limited listings (fewer cards)
export const FewListings: Story = {
	args: {
		sections: [
			{
				title: "First Mortgages",
				items: [firstMortgageListings[0], firstMortgageListings[1]],
			},
			{ title: "Second Mortgages", items: [secondMortgageListings[0]] },
		],
		renderCard,
	},
	parameters: {
		docs: {
			description: {
				story: "Demonstrates the layout with minimal listings per section.",
			},
		},
	},
};

// Story with many listings to emphasize scrolling
export const ManyListings: Story = {
	args: {
		sections: [
			{
				title: "First Mortgages",
				items: [
					...firstMortgageListings,
					...firstMortgageListings.map((item, idx) => ({
						...item,
						id: `${item.id}-copy-${idx}`,
						title: `${item.title} (Copy ${idx + 1})`,
					})),
				],
			},
			{ title: "Second Mortgages", items: secondMortgageListings },
			{ title: "Other Mortgages", items: otherMortgageListings },
		],
		renderCard,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Demonstrates horizontal scrolling with many listings in the First Mortgages section. Scroll left and right to see all properties.",
			},
		},
	},
};

// Story with empty sections filtered out
export const EmptySectionsFiltered: Story = {
	args: {
		sections: [
			{ title: "First Mortgages", items: firstMortgageListings },
			{ title: "Second Mortgages", items: [] },
			{ title: "Other Mortgages", items: [] },
		],
		renderCard,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Shows how empty sections are automatically hidden. Only First Mortgages section is displayed.",
			},
		},
	},
};

// Desktop view (to show it's mobile-only in practice)
export const DesktopView: Story = {
	args: {
		sections: [
			{ title: "First Mortgages", items: firstMortgageListings },
			{ title: "Second Mortgages", items: secondMortgageListings },
			{ title: "Other Mortgages", items: otherMortgageListings },
		],
		renderCard,
	},
	parameters: {
		viewport: {
			defaultViewport: "desktop",
		},
		docs: {
			description: {
				story:
					"Desktop view - in production, this component would only be shown on mobile devices using the useIsMobile() hook.",
			},
		},
	},
};

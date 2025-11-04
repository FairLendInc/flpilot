import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import {
	type FilterableItem,
	ListingGridShell,
} from "@/components/ListingGridShell";
import { Horizontal } from "@/components/listing-card-horizontal";
import type { MobileListingSection } from "@/components/mobile-listing-scroller";
import type {
	MortgageType,
	PropertyType,
} from "@/components/types/listing-filters";

const meta: Meta<typeof ListingGridShell<MockListing>> = {
	title: "Listings/ListingGridShell",
	component: ListingGridShell,
	parameters: {
		layout: "fullscreen",
	},
};

export default meta;

type Story = StoryObj<typeof meta>;

interface MockListing extends FilterableItem {
	id: string;
	title: string;
	address: string;
	ltv: number;
	apr: number;
	principal: number;
	imageSrc: string;
	mortgageType: MortgageType;
	propertyType: PropertyType;
	maturityDate?: Date;
}

// Procedurally generate 100 mock listings with good spread across all filter dimensions
const generateMockListings = (count: number): MockListing[] => {
	const propertyTypes: PropertyType[] = [
		"Detached Home",
		"Duplex",
		"Triplex",
		"Apartment",
		"Condo",
		"Cottage",
		"Townhouse",
		"Commercial",
		"Mixed-Use",
	];

	const mortgageTypes: MortgageType[] = ["First", "Second", "Other"];

	const neighborhoods = [
		{ name: "Downtown LA", lat: 34.0407, lng: -118.2468 },
		{ name: "Santa Monica", lat: 34.0195, lng: -118.4912 },
		{ name: "Venice", lat: 33.9851, lng: -118.4695 },
		{ name: "Beverly Hills", lat: 34.0736, lng: -118.4004 },
		{ name: "Hollywood", lat: 34.0928, lng: -118.3287 },
		{ name: "Pasadena", lat: 34.1478, lng: -118.1445 },
		{ name: "Long Beach", lat: 33.7701, lng: -118.1937 },
		{ name: "Burbank", lat: 34.1808, lng: -118.309 },
		{ name: "Glendale", lat: 34.1425, lng: -118.255 },
		{ name: "Culver City", lat: 34.0211, lng: -118.3965 },
		{ name: "West Hollywood", lat: 34.09, lng: -118.3617 },
		{ name: "Silver Lake", lat: 34.0869, lng: -118.2706 },
		{ name: "Echo Park", lat: 34.0781, lng: -118.2606 },
		{ name: "Manhattan Beach", lat: 33.8847, lng: -118.4109 },
		{ name: "Redondo Beach", lat: 33.8492, lng: -118.3884 },
	];

	const listings: MockListing[] = [];

	for (let i = 0; i < count; i++) {
		const neighborhood =
			neighborhoods[Math.floor(Math.random() * neighborhoods.length)];

		// Good spread across LTV: 30-80% (matching filter bounds)
		const ltv = Math.floor(30 + Math.random() * 50);

		// Good spread across APR: 3-15% (matching filter bounds)
		const apr = Number.parseFloat((3 + Math.random() * 12).toFixed(2));

		// Good spread across principal: $100k - $5M, with logarithmic distribution for realism
		const principal = Math.floor(
			100000 * Math.exp(Math.random() * Math.log(50))
		);

		const propertyType =
			propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
		const mortgageType =
			mortgageTypes[Math.floor(Math.random() * mortgageTypes.length)];

		// Random offset from neighborhood center (within ~0.02 degrees, ~2km)
		const latOffset = (Math.random() - 0.5) * 0.04;
		const lngOffset = (Math.random() - 0.5) * 0.04;

		// Random maturity date in next 1-3 years
		const daysToMaturity = Math.floor(365 + Math.random() * 730);
		const maturityDate = new Date();
		maturityDate.setDate(maturityDate.getDate() + daysToMaturity);

		listings.push({
			id: `listing-${i + 1}`,
			title: `${neighborhood.name} ${propertyType}`,
			address: `${neighborhood.name}, CA`,
			ltv,
			apr,
			principal,
			lat: neighborhood.lat + latOffset,
			lng: neighborhood.lng + lngOffset,
			imageSrc: "/house.jpg",
			mortgageType,
			propertyType,
			maturityDate,
		});
	}

	return listings;
};

const mockListings = generateMockListings(8); // Keep original 8 for most stories

const renderCard = (item: MockListing) => (
	<Horizontal
		address={item.address}
		apr={item.apr}
		imageSrc={item.imageSrc}
		key={item.id}
		ltv={item.ltv}
		principal={item.principal}
		title={item.title}
	/>
);

const renderPopup = (item: MockListing) => (
	<div className="space-y-1 text-sm">
		<div className="font-semibold">{item.title}</div>
		<div className="text-muted-foreground">{item.address}</div>
		<div>LTV: {item.ltv}%</div>
		<div>APR: {item.apr}%</div>
		<div>${item.principal.toLocaleString()} principal</div>
		<div className="text-muted-foreground text-xs">
			{item.mortgageType} Mortgage • {item.propertyType}
		</div>
	</div>
);

// Group listings by mortgage type for mobile horizontal scrolling
const groupByMortgageType = (
	items: readonly MockListing[]
): MobileListingSection<MockListing>[] => {
	const grouped = items.reduce(
		(acc, item) => {
			const type = item.mortgageType || "Other";
			if (!acc[type]) acc[type] = [];
			acc[type].push(item);
			return acc;
		},
		{} as Record<string, MockListing[]>
	);

	const sections: MobileListingSection<MockListing>[] = [];

	if (grouped.First?.length > 0) {
		sections.push({ title: "First Mortgages", items: grouped.First });
	}
	if (grouped.Second?.length > 0) {
		sections.push({ title: "Second Mortgages", items: grouped.Second });
	}
	if (grouped.Other?.length > 0) {
		sections.push({ title: "Other Mortgages", items: grouped.Other });
	}

	return sections;
};

export const WithFilters: Story = {
	args: {
		items: mockListings,
		renderCard,
		renderMapPopup: renderPopup,
		groupItemsForMobile: groupByMortgageType,
		showFilters: true,
	},
};

export const FiltersDisabled: Story = {
	args: {
		items: mockListings,
		renderCard,
		renderMapPopup: renderPopup,
		groupItemsForMobile: groupByMortgageType,
		showFilters: false,
	},
};

export const DenseGridWithFilters: Story = {
	args: {
		items: generateMockListings(100),
		renderCard,
		renderMapPopup: renderPopup,
		groupItemsForMobile: groupByMortgageType,
		showFilters: true,
		mapProps: {
			initialCenter: { lat: 34.0522, lng: -118.2437 }, // Los Angeles
			initialZoom: 10,
		},
	},
};

export const HighValueListings: Story = {
	args: {
		items: mockListings.filter((item) => item.principal > 500000),
		renderCard,
		renderMapPopup: renderPopup,
		groupItemsForMobile: groupByMortgageType,
		showFilters: true,
	},
};

export const FirstMortgagesOnly: Story = {
	args: {
		items: mockListings.filter((item) => item.mortgageType === "First"),
		renderCard,
		renderMapPopup: renderPopup,
		groupItemsForMobile: groupByMortgageType,
		showFilters: true,
	},
};

export const CustomLayout: Story = {
	args: {
		items: mockListings,
		renderCard,
		renderMapPopup: renderPopup,
		groupItemsForMobile: groupByMortgageType,
		showFilters: true,
		classNames: {
			container: "grid gap-2 md:grid-cols-[2fr_1fr]",
			gridColumn: "space-y-2",
			mapWrapper: "sticky top-16 h-[600px]",
		},
	},
};

"use client";

import React from "react";

import type { FilterableItem } from "@/components/ListingGridShell";
import {
	DEFAULT_FILTERS,
	type FilterState,
} from "@/components/types/listing-filters";

// Note: This is a legacy story file that needs updating to work with current components
// For now, providing a simple placeholder

export function MapViewComponent({
	filteredListings,
}: {
	filteredListings: FilterableItem[];
}) {
	return (
		<div className="rounded-lg border p-4">
			<h3 className="mb-2 font-semibold text-lg">Map View Placeholder</h3>
			<p>Map component would show {filteredListings.length} listings</p>
			<div className="mt-2 text-gray-600 text-sm">
				Note: This story needs to be updated with current component interfaces
			</div>
		</div>
	);
}

// Simplified placeholder story for demonstration purposes
export default function PageShell() {
	const sampleListings: FilterableItem[] = Array.from(
		{ length: 10 },
		(_, i) => ({
			id: `property-${i}`,
			ltv: 50 + Math.random() * 30,
			apr: 4 + Math.random() * 6,
			principal: 200000 + Math.random() * 800000,
			mortgageType: ["First", "Second", "Other"][
				Math.floor(Math.random() * 3)
			] as string,
			propertyType: "Single Family",
			maturityDate: new Date(
				Date.now() + Math.random() * 5 * 365 * 24 * 60 * 60 * 1000
			),
			title: `Property ${i + 1}`,
			address: `${100 + i} Main St`,
			lat: 40.7128 + (Math.random() - 0.5) * 0.1,
			lng: -74.006 + (Math.random() - 0.5) * 0.1,
		})
	);

	const [_filters, setFilters] = React.useState<FilterState>(DEFAULT_FILTERS);

	const _handleFiltersChange = (newFilters: FilterState) => {
		setFilters(newFilters);
	};

	return (
		<div className="mx-auto max-w-4xl p-6">
			<h2 className="mb-4 font-bold text-2xl">Listing Grid Shell Demo</h2>
			<div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
				<p className="text-blue-800">
					<strong>Note:</strong> This is a simplified placeholder story. The
					original listing-grid-shell.tsx contained legacy code with outdated
					component interfaces. This demo shows the current FilterableItem
					structure and basic component integration.
				</p>
			</div>

			<div className="mt-6">
				<h3 className="mb-2 font-semibold text-lg">
					Sample Data ({sampleListings.length} items)
				</h3>
				<MapViewComponent filteredListings={sampleListings} />
			</div>
		</div>
	);
}

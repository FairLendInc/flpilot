import type { Metadata } from "next";
import { headers } from "next/headers";
import { ViewTransition } from "react";
import type { FilterableItem } from "@/components/ListingGridShell";
import { generateMultipleListings } from "@/lib/mock-data/generate-multiple-listings";
import type { MockListing } from "@/lib/mock-data/listings";
import { ListingsClient } from "./listings-client";

// Extended type with required fields for rendering
type ListingItem = FilterableItem & {
	id: string;
	imageSrc: string;
};

export const metadata: Metadata = {
	title: "Investment Listings",
	description: "Browse available real estate investment opportunities",
};

// Mortgage types for random assignment - must match listing-filters.ts
const MORTGAGE_TYPES = ["First", "Second", "Other"] as const;

// Property types for random assignment - must match listing-filters.ts
const PROPERTY_TYPES = [
	"Detached Home",
	"Duplex",
	"Triplex",
	"Apartment",
	"Condo",
	"Cottage",
	"Townhouse",
	"Commercial",
	"Mixed-Use",
] as const;

/**
 * Seeded random selection helper
 */
function selectFromArray<T>(arr: readonly T[], seed: string): T {
	let hash = 0;
	for (let i = 0; i < seed.length; i += 1) {
		hash = (hash << 5) - hash + seed.charCodeAt(i);
		hash &= hash;
	}
	const x = Math.sin(hash) * 10000;
	const random = x - Math.floor(x);
	return arr[Math.floor(random * arr.length)];
}

/**
 * Seeded random number generator for consistent results
 */
function seededRandomNumber(seed: string, min: number, max: number): number {
	let hash = 0;
	for (let i = 0; i < seed.length; i += 1) {
		hash = (hash << 5) - hash + seed.charCodeAt(i);
		hash &= hash;
	}
	const x = Math.sin(hash) * 10000;
	const random = x - Math.floor(x);
	return Math.floor(random * (max - min + 1)) + min;
}

/**
 * Transform MockListing to ListingItem for ListingGridShell
 */
function transformListing(listing: MockListing): ListingItem {
	const { financials, location, address, images } = listing;

	// Calculate LTV (Loan-to-Value ratio) within expected bounds (30-80%)
	// LTV = (Loan Amount / Property Value) * 100
	// Generate a realistic LTV within filter bounds for better filtering UX
	const ltv = seededRandomNumber(`${listing._id}-ltv`, 30, 80);

	// Select mortgage and property types based on listing ID for consistency
	const mortgageType = selectFromArray(MORTGAGE_TYPES, listing._id) as string;
	const propertyType = selectFromArray(PROPERTY_TYPES, listing._id) as string;

	return {
		id: listing._id,
		title: listing.title,
		address: `${address.city}, ${address.state}`,
		imageSrc: images.length > 0 ? images[0].url : "/house.jpg",
		lat: location.lat,
		lng: location.lng,
		ltv,
		apr: financials.interestRate,
		principal: financials.currentValue,
		mortgageType,
		propertyType,
		maturityDate: new Date(financials.maturityDate),
	};
}

/**
 * Listings page - displays all available investment properties
 */
export default async function ListingsPage() {
	// Access headers to opt-out of static rendering (required for new Date() in mock data)
	await headers();

	// Generate 50 mock listings for Toronto area
	const mockListings = generateMultipleListings(50);

	// Transform to ListingItem format
	const listings = mockListings.map(transformListing);
	return (
		<ViewTransition name="listings">
			<div className="min-h-screen">
				<div className="container mx-auto flex flex-col py-6">
					<div className="min-w-[90vw]">
						<ListingsClient listings={listings} />
					</div>
				</div>
			</div>
		</ViewTransition>
	);
}

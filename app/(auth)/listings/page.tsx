import { preloadedQueryResult, preloadQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { ViewTransition } from "react";
import type { FilterableItem } from "@/components/ListingGridShell";
import { api } from "@/convex/_generated/api";
import type { Mortgage } from "@/lib/types/convex";
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
const _MORTGAGE_TYPES = ["First", "Second", "Other"] as const;

// Property types for random assignment - must match listing-filters.ts
const _PROPERTY_TYPES = [
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
 * Map property type from schema to frontend display types
 */
function mapPropertyType(schemaType: string): string {
	const mapping: Record<string, string> = {
		"Residential - Single Family": "Detached Home",
		"Residential - Condo": "Condo",
		"Residential - Townhouse": "Townhouse",
		"Residential - Multi-Family": "Duplex",
	};
	return mapping[schemaType] ?? schemaType;
}

/**
 * Map mortgage type from database format to frontend display format
 */
function mapMortgageType(mortgageType: "1st" | "2nd" | "other"): string {
	switch (mortgageType) {
		case "1st":
			return "First";
		case "2nd":
			return "Second";
		case "other":
			return "Other";
		default:
			return "Other";
	}
}

/**
 * Transform Convex Mortgage to ListingItem for ListingGridShell
 * Uses pre-fetched signed URLs from Convex query
 */
function transformMortgage(mortgage: Mortgage): ListingItem {
	const {
		location,
		address,
		images,
		loanAmount,
		interestRate,
		maturityDate,
		mortgageType,
		appraisalMarketValue,
	} = mortgage;

	// Use real LTV and market value from database
	const ltv = mortgage.ltv;
	const marketValue = appraisalMarketValue;

	// Map mortgage type from database (1st, 2nd, other) to display format
	const mappedMortgageType = mapMortgageType(mortgageType);

	// Map property type from schema to frontend types
	const propertyType = mapPropertyType(mortgage.propertyType);

	// Get first image or use fallback - use pre-fetched signed URL
	// TypeScript doesn't know about the runtime-added 'url' property, so we use type assertion
	const imageSrc =
		images.length > 0
			? (images[0] as any).url || `/api/storage/${images[0].storageId}`
			: "/house.jpg";

	return {
		id: mortgage._id,
		title: `${address.street}`,
		address: `${address.city}, ${address.state}`,
		imageSrc,
		lat: location.lat,
		lng: location.lng,
		ltv,
		apr: interestRate,
		principal: loanAmount,
		marketValue,
		mortgageType: mappedMortgageType,
		propertyType,
		maturityDate: new Date(maturityDate),
	};
}

/**
 * Listings page - displays all available investment properties
 */
export default async function ListingsPage() {
	// Make this page dynamic by accessing headers
	// This prevents Next.js from trying to statically prerender during build
	await headers();

	// Preload Convex query for server-side rendering
	const preloadedListings = await preloadQuery(
		api.listings.getAvailableListingsWithMortgages
	);

	// Extract actual data from preloaded result
	const listingsWithMortgages = preloadedQueryResult(preloadedListings);

	// Transform Convex data to ListingItem format
	const listings = listingsWithMortgages.map(({ mortgage }) =>
		transformMortgage(mortgage)
	);

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

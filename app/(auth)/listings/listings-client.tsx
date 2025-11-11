"use client";

import { useConvexAuth } from "convex/react";
import {
	type FilterableItem,
	ListingGridShell,
} from "@/components/ListingGridShell";
import { Horizontal } from "@/components/listing-card-horizontal";
import { ListingMapPopup } from "@/components/listing-map-popup";
import { ListingsGridSkeleton } from "@/components/skeletons";
import { api } from "@/convex/_generated/api";
import { useAuthenticatedQuery } from "@/convex/lib/client";
import type {
	Mortgage,
	MortgageImage,
	MortgageWithUrls,
} from "@/lib/types/convex";

type ListingItem = FilterableItem & {
	id: string;
	imageSrc: string;
	locked?: boolean;
};

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

	const ltv = mortgage.ltv;
	const marketValue = appraisalMarketValue;
	const mappedMortgageType = mapMortgageType(mortgageType);
	const propertyType = mapPropertyType(mortgage.propertyType);

	// Get first image or use fallback - use pre-fetched signed URL
	const imageSrc =
		images.length > 0
			? (images[0] as MortgageImage).url ||
				`/api/storage/${images[0].storageId}`
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
 * Client component for the listings page
 * Uses client-side authenticated queries with explicit loading state handling
 */
export function ListingsClient() {
	const { isLoading } = useConvexAuth();

	const listingsWithMortgages = useAuthenticatedQuery(
		api.listings.getAvailableListingsWithMortgages,
		{}
	);

	// Only process listings if authenticated - prevents using empty array from query fallback
	const listings: ListingItem[] =
		listingsWithMortgages?.map((item) => ({
			...transformMortgage(item.mortgage as MortgageWithUrls),
			locked: item.listing.locked,
		})) ?? [];

	// Show skeleton while auth is loading OR while query data is still undefined
	if (isLoading || listingsWithMortgages === undefined) {
		return <ListingsGridSkeleton />;
	}

	return (
		<ListingGridShell
			items={listings}
			mapProps={{
				initialCenter: { lat: 43.6532, lng: -79.3832 }, // Toronto
				initialZoom: 11, // City-level view
			}}
			renderCard={(listing) => (
				<Horizontal
					address={listing.address}
					apr={listing.apr}
					id={listing.id}
					imageSrc={listing.imageSrc}
					locked={listing.locked}
					ltv={listing.ltv}
					marketValue={listing.marketValue}
					maturityDate={listing.maturityDate?.toLocaleDateString("en-US", {
						month: "2-digit",
						day: "2-digit",
						year: "numeric",
					})}
					principal={listing.principal}
					propertyType={listing.propertyType}
					title={listing.title}
				/>
			)}
			renderMapPopup={(listing) => (
				<ListingMapPopup
					address={listing.address ?? ""}
					apr={listing.apr ?? 0}
					id={listing.id ?? ""}
					imageSrc={listing.imageSrc}
					principal={listing.principal ?? 0}
					title={listing.title ?? ""}
				/>
			)}
			showFilters={true}
		/>
	);
}

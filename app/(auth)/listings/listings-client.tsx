"use client";

// import React from "react";
import { useEffect } from "react";
import {
	type FilterableItem,
	ListingGridShell,
} from "@/components/ListingGridShell";
import { Horizontal } from "@/components/listing-card-horizontal";
import { ListingMapPopup } from "@/components/listing-map-popup";

type ListingItem = FilterableItem & {
	id: string;
	imageSrc: string;
};

type ListingsClientProps = {
	listings: ListingItem[];
};

/**
 * Client wrapper for the listings page
 * Handles rendering of listing cards and map popups
 */
export function ListingsClient({ listings }: ListingsClientProps) {
	useEffect(() => {
		console.log("[ListingsClient] Received listings:", listings.length);
		console.log("[ListingsClient] First listing:", listings[0]);
	}, [listings]);

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

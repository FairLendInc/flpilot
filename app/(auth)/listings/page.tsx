import { withAuth } from "@workos-inc/authkit-nextjs";
import { preloadQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { ViewTransition } from "react";
import { api } from "@/convex/_generated/api";
import { ListingsClient } from "./listings-client";

export const metadata: Metadata = {
	title: "Investment Listings",
	description: "Browse available real estate investment opportunities",
};

/**
 * Listings page - displays all available investment properties
 */
export default async function ListingsPage() {
	const { accessToken } = await withAuth();

	// Preload Convex query for server-side rendering with auth token
	const preloadedListings = await preloadQuery(
		api.listings.getAvailableListingsWithMortgages,
		{},
		{ token: accessToken }
	);

	return (
		<ViewTransition name="listings">
			<div className="min-h-screen">
				<div className="container mx-auto flex flex-col py-6">
					<div className="min-w-[90vw]">
						<ListingsClient preloaded={preloadedListings} />
					</div>
				</div>
			</div>
		</ViewTransition>
	);
}

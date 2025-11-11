import type { Metadata } from "next";
import { ListingsClient } from "./listings-client";
export const metadata: Metadata = {
	title: "Investment Listings",
	description: "Browse available real estate investment opportunities",
};

/**
 * Listings page - displays all available investment properties
 */
export default async function ListingsPage() {
	// const { accessToken } = await withAuth();

	// // Preload Convex query for server-side rendering with auth token
	// const preloadedListings = await preloadQuery(
	// 	api.listings.getAvailableListingsWithMortgages,
	// 	{},
	// 	{ token: accessToken }
	// );

	// const data = preloadedQueryResult(preloadedListings);
	// console.log(data);

	return (
		<div className="container flex w-screen flex-col">
			<ListingsClient />
		</div>
	);
}

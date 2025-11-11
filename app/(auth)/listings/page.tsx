import type { Metadata } from "next";
import { ViewTransition } from "react";
import { ListingsClient } from "./listings-client";

export const metadata: Metadata = {
	title: "Investment Listings",
	description: "Browse available real estate investment opportunities",
};

/**
 * Listings page - displays all available investment properties
 */
export default function ListingsPage() {
	return (
		<ViewTransition name="listings">
			<div className="container flex w-screen flex-col">
				<ListingsClient />
			</div>
		</ViewTransition>
	);
}

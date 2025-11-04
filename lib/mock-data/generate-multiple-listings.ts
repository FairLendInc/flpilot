/**
 * Helper functions for generating multiple mock listings
 */

import { generateListing, type MockListing } from "./listings";

/**
 * Generate multiple mock listings with sequential IDs
 * @param count Number of listings to generate
 * @param prefix ID prefix (default: "listing")
 * @returns Array of mock listings
 */
export function generateMultipleListings(
	count: number,
	prefix = "listing"
): MockListing[] {
	const listings: MockListing[] = [];

	for (let i = 1; i <= count; i += 1) {
		const id = `${prefix}_${i}`;
		listings.push(generateListing(id));
	}

	return listings;
}

/**
 * Generate listings with specific IDs
 * @param ids Array of IDs to generate listings for
 * @returns Array of mock listings
 */
export function generateListingsFromIds(ids: string[]): MockListing[] {
	return ids.map((id) => generateListing(id));
}

/**
 * Test fixture helpers for creating listings and related data
 * 
 * These helpers create deterministic test data via Convex API calls
 * to ensure tests have the listings they need before running.
 */

import type { Page } from "@playwright/test";

/**
 * Test listing fixture data
 */
export interface TestListingFixture {
	listingId: string;
	mortgageId: string;
	borrowerId: string;
}

/**
 * Create a test listing via Convex HTTP API
 * 
 * Uses the /listings/create webhook endpoint with API key authentication.
 * Creates a deterministic listing that can be used across tests.
 */
export async function createTestListing(
	page: Page,
	options?: {
		visible?: boolean;
		address?: {
			street: string;
			city: string;
			state: string;
			zip: string;
			country: string;
		};
	}
): Promise<TestListingFixture> {
	const convexURL = process.env.NEXT_PUBLIC_CONVEX_URL;
	const apiKey = process.env.LISTINGS_WEBHOOK_API_KEY || "test-webhook-key";

	if (!convexURL) {
		throw new Error(
			"NEXT_PUBLIC_CONVEX_URL environment variable is required. " +
			"Set it to your Convex deployment URL (e.g., https://your-deployment.convex.cloud)"
		);
	}

	const payload = {
		borrower: {
			name: "Test Borrower",
			email: "borrower@test.com",
			rotessaCustomerId: `test-rotessa-${Date.now()}`,
		},
		mortgage: {
			loanAmount: 500000,
			interestRate: 5.5,
			originationDate: "2024-01-01",
			maturityDate: "2029-01-01",
			status: "active" as const,
			mortgageType: "1st" as const,
			address: options?.address || {
				street: "123 Test Street",
				city: "Toronto",
				state: "ON",
				zip: "M5H 2N2",
				country: "Canada",
			},
			propertyType: "Residential",
			appraisalMarketValue: 750000,
			ltv: 66.67,
			externalMortgageId: `test-mortgage-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
		},
		listing: {
			visible: options?.visible ?? true,
		},
	};

	try {
		// Use Convex HTTP endpoint (not Next.js API route)
		const convexURL = process.env.NEXT_PUBLIC_CONVEX_URL;
		if (!convexURL) {
			throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is required");
		}

		const response = await page.request.post(`${convexURL}/listings/create`, {
			headers: {
				"Content-Type": "application/json",
				"x-api-key": apiKey,
			},
			data: payload,
		});

		if (!response.ok()) {
			const errorText = await response.text();
			throw new Error(
				`Failed to create test listing: ${response.status()} ${errorText}`
			);
		}

		const result = (await response.json()) as {
			code: string;
			result: {
				borrowerId: string;
				mortgageId: string;
				listingId: string;
				created: boolean;
			};
		};

		if (!result.result?.listingId) {
			throw new Error("Listing creation response missing listingId");
		}

		// Note: Locking requires admin authentication, so we skip it here
		// Tests that need locked listings should lock them via UI or separate setup
		// if (options?.locked) {
		//   await lockTestListing(page, result.result.listingId);
		// }

		return {
			listingId: result.result.listingId,
			mortgageId: result.result.mortgageId,
			borrowerId: result.result.borrowerId,
		};
	} catch (error) {
		// Fallback: Try using Convex client directly if HTTP endpoint fails
		console.warn("HTTP endpoint failed, trying direct Convex call:", error);
		return await createTestListingViaClient(page, options);
	}
}

/**
 * Create a test listing via Convex client (fallback method)
 */
async function createTestListingViaClient(
	page: Page,
	options?: {
		visible?: boolean;
	}
): Promise<TestListingFixture> {
	// This would require setting up Convex client in test environment
	// For now, throw a helpful error
	throw new Error(
		"Could not create test listing. Ensure LISTINGS_WEBHOOK_API_KEY is set or Convex client is configured."
	);
}

/**
 * Lock a test listing
 */
async function lockTestListing(page: Page, listingId: string): Promise<void> {
	// Locking is handled via Convex mutations which require authentication
	// For test setup, we'll skip locking and let tests handle it if needed
	// This keeps the fixture simple and avoids auth complexity
	console.log(`Note: Listing ${listingId} should be locked via test setup if needed`);
}

/**
 * Create a deterministic test listing with a specific ID pattern
 * Useful for tests that reference specific listing IDs
 */
export async function createDeterministicTestListing(
	page: Page,
	listingIdSuffix: string,
	options?: {
		visible?: boolean;
	}
): Promise<TestListingFixture> {
	// Create listing first
	const fixture = await createTestListing(page, options);

	// Note: Convex doesn't allow setting custom IDs, so we return the generated ID
	// Tests should use the returned listingId instead of hardcoded values
	return fixture;
}

/**
 * Clean up test listing (optional - for afterEach hooks)
 */
export async function deleteTestListing(
	page: Page,
	listingId: string
): Promise<void> {
	const convexURL = process.env.NEXT_PUBLIC_CONVEX_URL;
	const apiKey = process.env.LISTINGS_WEBHOOK_API_KEY || "test-webhook-key";

	if (!convexURL) {
		console.warn("NEXT_PUBLIC_CONVEX_URL not set, skipping cleanup");
		return;
	}

	try {
		const response = await page.request.delete(`${convexURL}/listings/delete`, {
			headers: {
				"Content-Type": "application/json",
				"x-api-key": apiKey,
			},
			data: {
				listingId,
			},
		});

		if (!response.ok()) {
			console.warn(`Failed to delete test listing ${listingId}: ${response.status()}`);
		}
	} catch (error) {
		console.warn(`Error deleting test listing ${listingId}:`, error);
		// Don't throw - cleanup failures shouldn't fail tests
	}
}


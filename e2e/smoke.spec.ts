import { test, expect } from "./fixtures/auth";

test.describe("Listings Page - Broker", () => {
	test("authenticated broker can view listings page", async ({ brokerPage }) => {
		await brokerPage.goto("/listings");

		// Wait for the page to load - the ListingsClient component should render
		// The page should show either listings or an empty state
		// Check that the main content area is visible (not stuck on skeleton)
		const pageSection = brokerPage.getByTestId("listings-page");
		await expect(pageSection).toBeVisible({ timeout: 10000 });
	});

	test("listings page shows map component", async ({ brokerPage }) => {
		await brokerPage.goto("/listings");

		// The ListingGridShell renders a map in the right column on desktop
		// Wait for the map container to be visible
		await expect(
			brokerPage.getByTestId("listings-page").locator('[class*="col-span-4"]').first()
		).toBeVisible({ timeout: 10000 });
	});

	test("listings page shows grid layout", async ({ brokerPage }) => {
		await brokerPage.goto("/listings");

		// The ListingGridShell renders a grid with col-span-8 for the listings
		await expect(
			brokerPage.getByTestId("listings-page").locator('[class*="col-span-8"]').first()
		).toBeVisible({ timeout: 10000 });
	});
});

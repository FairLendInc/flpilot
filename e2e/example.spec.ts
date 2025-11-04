import { test, expect } from "@playwright/test";

test("homepage loads successfully", async ({ page }) => {
	await page.goto("/");

	await expect(page).toHaveTitle(/.*/);
	await expect(page.getByText("Welcome to FairLend")).toBeVisible();
});

test("navigation renders", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByRole("navigation")).toBeVisible();
	await expect(page.getByText("Home")).toBeVisible();
});

test("feature cards display", async ({ page }) => {
	await page.goto("/");

	const featureCards = page.getByRole("article");
	await expect(featureCards).toHaveCount(6);

	const firstCard = featureCards.first();
	await expect(firstCard.getByText("Feature 1")).toBeVisible();
});

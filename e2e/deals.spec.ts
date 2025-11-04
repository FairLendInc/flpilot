import { test, expect } from "@playwright/test";

test.describe("Deals Management", () => {
	test.beforeEach(async ({ page }) => {
		// Mock authentication before each test
		await page.addInitScript(() => {
			localStorage.setItem("workos-auth-token", "mock-token");
		});
	});

	test("deals page loads", async ({ page }) => {
		await page.goto("/dashboard/admin/deals");

		await expect(page).toHaveTitle(/Deals/);
		await expect(
			page.getByText("Deal Management", { exact: true })
		).toBeVisible();
	});

	test("documenso signing section renders", async ({ page }) => {
		await page.goto("/dashboard/admin/deals");

		await expect(page.getByText("Documenso Signing")).toBeVisible();
		await expect(
			page.getByText("Manage pending document signatures")
		).toBeVisible();
	});

	test("document selector dropdown renders", async ({ page }) => {
		await page.goto("/dashboard/admin/deals");

		const documentSelect = page.getByLabel("Select a document to sign");
		await expect(documentSelect).toBeVisible();

		// Click to open dropdown
		await documentSelect.click();

		// Dropdown should be interactable
		await expect(page.getByRole("combobox")).toBeVisible();
	});

	test("signatory selector renders", async ({ page }) => {
		await page.goto("/dashboard/admin/deals");

		const signatorySelect = page.getByLabel("Select a signatory");
		await expect(signatorySelect).toBeVisible();

		// Should be disabled until document is selected
		await expect(signatorySelect).toBeDisabled();
	});

	test("briefcase icon displays", async ({ page }) => {
		await page.goto("/dashboard/admin/deals");

		const briefcaseIcon = page.locator("svg[data-lucide='briefcase']");
		await expect(briefcaseIcon).toBeVisible();
	});

	test("loading state displays", async ({ page }) => {
		await page.goto("/dashboard/admin/deals");

		await expect(
			page.getByText("Loading documents from Documenso...")
		).toBeVisible();
	});

	test("empty state when no documents", async ({ page }) => {
		// Mock empty documents response
		await page.route("/api/documenso/documents", (route) => {
			route.fulfill({
				json: {
					documents: [],
					count: 0,
				},
			});
		});

		await page.goto("/dashboard/admin/deals");

		await expect(
			page.getByText("No documents are ready for signing.")
		).toBeVisible();
	});

	test("error state when API fails", async ({ page }) => {
		// Mock API error
		await page.route("/api/documenso/documents", (route) => {
			route.fulfill({
				status: 500,
				json: { error: "Internal server error" },
			});
		});

		await page.goto("/dashboard/admin/deals");

		await expect(
			page.getByText(/Documenso request failed/i)
		).toBeVisible();
	});
});

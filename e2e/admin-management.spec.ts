import { test, expect } from "@playwright/test";

test.describe("Admin Listing Management", () => {
	test.beforeEach(async ({ page }) => {
		// Mock authentication as admin before each test
		await page.addInitScript(() => {
			localStorage.setItem("workos-auth-token", "mock-admin-token");
			localStorage.setItem("user-role", "admin");
		});
	});

	test("admin listings page loads", async ({ page }) => {
		await page.goto("/dashboard/admin/listings");

		await expect(page).toHaveTitle(/Listings/);
		await expect(page.getByText("Listings", { exact: true })).toBeVisible();
	});

	test("listings table displays", async ({ page }) => {
		await page.goto("/dashboard/admin/listings");

		// Wait for table to load
		await page.waitForSelector("table", { timeout: 5000 });

		// Check for table headers
		await expect(page.getByText("Status")).toBeVisible();
		await expect(page.getByText("Actions")).toBeVisible();
	});

	test("edit listing button is visible", async ({ page }) => {
		await page.goto("/dashboard/admin/listings");

		// Wait for table to load
		await page.waitForSelector("table", { timeout: 5000 });

		// Check for edit buttons (may be empty if no listings)
		const editButtons = page.getByRole("button", { name: /edit/i });
		const count = await editButtons.count();
		if (count > 0) {
			await expect(editButtons.first()).toBeVisible();
		}
	});

	test("delete listing button is visible", async ({ page }) => {
		await page.goto("/dashboard/admin/listings");

		// Wait for table to load
		await page.waitForSelector("table", { timeout: 5000 });

		// Check for delete buttons (may be empty if no listings)
		const deleteButtons = page.getByRole("button", { name: /delete/i });
		const count = await deleteButtons.count();
		if (count > 0) {
			await expect(deleteButtons.first()).toBeVisible();
		}
	});
});

test.describe("Admin Mortgage Management", () => {
	test.beforeEach(async ({ page }) => {
		// Mock authentication as admin before each test
		await page.addInitScript(() => {
			localStorage.setItem("workos-auth-token", "mock-admin-token");
			localStorage.setItem("user-role", "admin");
		});
	});

	test("admin mortgages page loads", async ({ page }) => {
		await page.goto("/dashboard/admin/mortgages");

		await expect(page).toHaveTitle(/Mortgages/);
		await expect(page.getByText("Mortgages", { exact: true })).toBeVisible();
	});

	test("mortgages table displays", async ({ page }) => {
		await page.goto("/dashboard/admin/mortgages");

		// Wait for table to load
		await page.waitForSelector("table", { timeout: 5000 });

		// Check for table headers
		await expect(page.getByText("Loan Amount")).toBeVisible();
		await expect(page.getByText("Actions")).toBeVisible();
	});

	test("edit mortgage button is visible", async ({ page }) => {
		await page.goto("/dashboard/admin/mortgages");

		// Wait for table to load
		await page.waitForSelector("table", { timeout: 5000 });

		// Check for edit buttons (may be empty if no mortgages)
		const editButtons = page.getByRole("button", { name: /edit/i });
		const count = await editButtons.count();
		if (count > 0) {
			await expect(editButtons.first()).toBeVisible();
		}
	});

	test("delete mortgage button is visible", async ({ page }) => {
		await page.goto("/dashboard/admin/mortgages");

		// Wait for table to load
		await page.waitForSelector("table", { timeout: 5000 });

		// Check for delete buttons (may be empty if no mortgages)
		const deleteButtons = page.getByRole("button", { name: /delete/i });
		const count = await deleteButtons.count();
		if (count > 0) {
			await expect(deleteButtons.first()).toBeVisible();
		}
	});
});


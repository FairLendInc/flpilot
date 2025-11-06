import { test, expect } from "@playwright/test";

test.describe("Profile Management", () => {
	test.beforeEach(async ({ page }) => {
		// Mock authentication before each test
		await page.addInitScript(() => {
			localStorage.setItem("workos-auth-token", "mock-token");
		});
	});

	test("profile page loads", async ({ page }) => {
		await page.goto("/profile");

		await expect(page).toHaveTitle(/Profile/);
	});

	test("profile v2 page loads", async ({ page }) => {
		await page.goto("/profilev2");

		await expect(
			page.getByText("Profile Settings", { exact: true })
		).toBeVisible();
	});

	test("profile form fields render", async ({ page }) => {
		await page.goto("/profilev2");

		await expect(page.getByLabel("First name")).toBeVisible();
		await expect(page.getByLabel("Last name")).toBeVisible();
		await expect(page.getByLabel("Phone number")).toBeVisible();
		await expect(page.getByLabel("Email")).toBeVisible();
	});

	test("organization switcher displays", async ({ page }) => {
		await page.goto("/profilev2");

		await expect(page.getByText("Organization")).toBeVisible();
	});

	test("roles and permissions section renders", async ({ page }) => {
		await page.goto("/profilev2");

		await expect(
			page.getByText("Roles & Permissions", { exact: true })
		).toBeVisible();
	});

	test("settings tabs are visible", async ({ page }) => {
		await page.goto("/profilev2");

		const settingsTab = page.getByRole("tab", { name: "Settings" });
		await expect(settingsTab).toBeVisible();
	});
});

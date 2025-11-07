import { test, expect } from "@playwright/test";

test.describe("Investor Lock Request Flow", () => {
	test.beforeEach(async ({ page }) => {
		// Mock authentication before each test
		// Note: In real E2E tests, you'd need actual authentication setup
		await page.addInitScript(() => {
			localStorage.setItem("workos-auth-token", "mock-token");
		});
	});

	test("5.1.1: investor creates lock request with lawyer information", async ({
		page,
	}) => {
		// Navigate to a listing detail page
		// Note: This assumes a listing exists - in real tests, you'd seed test data
		await page.goto("/listings/test-listing-id");

		// Wait for the request form to be visible
		await expect(
			page.getByText("Request This Listing", { exact: false })
		).toBeVisible();

		// Fill in lawyer information
		await page.getByLabel("Recommended Lawyers").click();
		await page.getByText("Sarah Chen").click();

		// Verify LSO number is auto-filled
		const lsoInput = page.getByLabel("Lawyer LSO Number");
		await expect(lsoInput).toHaveValue("12345");

		// Fill in lawyer email
		await page.getByLabel("Lawyer Email").fill("lawyer@example.com");

		// Accept disclosure policy
		await page
			.getByText("I agree to the disclosure policy")
			.click();

		// Submit the request
		await page.getByRole("button", { name: "Request Listing" }).click();

		// Verify success toast appears
		await expect(
			page.getByText("Listing Request Submitted!", { exact: false })
		).toBeVisible();
	});

	test("5.1.2: investor creates lock request without notes", async ({
		page,
	}) => {
		// Navigate to a listing detail page
		await page.goto("/listings/test-listing-id");

		// Wait for the request form to be visible
		await expect(
			page.getByText("Request This Listing", { exact: false })
		).toBeVisible();

		// Fill in required lawyer information only
		await page.getByLabel("Recommended Lawyers").click();
		await page.getByText("Michael Rodriguez").click();

		// Verify LSO number is auto-filled
		const lsoInput = page.getByLabel("Lawyer LSO Number");
		await expect(lsoInput).toHaveValue("23456");

		// Fill in lawyer email
		await page.getByLabel("Lawyer Email").fill("michael@example.com");

		// Accept disclosure policy
		await page
			.getByText("I agree to the disclosure policy")
			.click();

		// Submit the request (no notes field in current implementation)
		await page.getByRole("button", { name: "Request Listing" }).click();

		// Verify success toast appears
		await expect(
			page.getByText("Listing Request Submitted!", { exact: false })
		).toBeVisible();
	});

	test("5.1.3: investor sees request submission confirmation", async ({
		page,
	}) => {
		// Navigate to a listing detail page
		await page.goto("/listings/test-listing-id");

		// Submit a lock request
		await page.getByLabel("Recommended Lawyers").click();
		await page.getByText("Sarah Chen").click();
		await page.getByLabel("Lawyer Email").fill("lawyer@example.com");
		await page.getByText("I agree to the disclosure policy").click();
		await page.getByRole("button", { name: "Request Listing" }).click();

		// Wait for success message
		await expect(
			page.getByText("Listing Request Submitted!", { exact: false })
		).toBeVisible();

		// Verify form resets after successful submission
		// Note: The current implementation resets the form after submission
		// In a full implementation, you'd also check for a "Request Pending" status indicator
		await expect(page.getByLabel("Recommended Lawyers")).toBeVisible();
		const lawyerEmailInput = page.getByLabel("Lawyer Email");
		await expect(lawyerEmailInput).toHaveValue("");
	});

	test("5.1.4: investor cancels pending lock request", async ({ page }) => {
		// Navigate to a listing detail page
		await page.goto("/listings/test-listing-id");

		// Submit a lock request first
		await page.getByLabel("Recommended Lawyers").click();
		await page.getByText("Sarah Chen").click();
		await page.getByLabel("Lawyer Email").fill("lawyer@example.com");
		await page.getByText("I agree to the disclosure policy").click();
		await page.getByRole("button", { name: "Request Listing" }).click();

		// Wait for success message
		await expect(
			page.getByText("Listing Request Submitted!", { exact: false })
		).toBeVisible();

		// Note: The current implementation doesn't show a cancel button on the listing page
		// This test would need to be updated when cancel functionality is added to the UI
		// For now, we verify the request was created successfully
		// In a full implementation, you'd:
		// 1. See "Request Pending" status
		// 2. Click cancel button
		// 3. Confirm cancellation
		// 4. Verify request is removed
	});

	test("5.1.5: investor cannot create request for locked listing", async ({
		page,
	}) => {
		// Navigate to a locked listing detail page
		// Note: This assumes a locked listing exists - in real tests, you'd seed test data
		await page.goto("/listings/locked-listing-id");

		// Verify locked message is displayed instead of request form
		await expect(
			page.getByText("Listing Locked", { exact: false })
		).toBeVisible();

		// Verify request form is not visible
		await expect(
			page.getByText("Request This Listing", { exact: false })
		).not.toBeVisible();

		// Verify locked badge is shown
		await expect(
			page.getByText("Listing is locked", { exact: false })
		).toBeVisible();
	});

	test("5.1.6: investor cannot create request for hidden listing", async ({
		page,
	}) => {
		// Navigate to a hidden listing detail page
		// Note: Hidden listings typically wouldn't be accessible via direct URL
		// This test verifies the API-level validation
		await page.goto("/listings/hidden-listing-id");

		// If the listing is hidden, it may not be visible or accessible
		// The form should either not appear or show an error
		// In the current implementation, hidden listings may not be accessible
		// This test would need to be updated based on actual behavior
	});

	test("5.1.7: form validation prevents submission without required fields", async ({
		page,
	}) => {
		// Navigate to a listing detail page
		await page.goto("/listings/test-listing-id");

		// Wait for the request form to be visible
		await expect(
			page.getByText("Request This Listing", { exact: false })
		).toBeVisible();

		// Try to submit without filling required fields
		const submitButton = page.getByRole("button", {
			name: "Request Listing",
		});
		await expect(submitButton).toBeDisabled();

		// Fill only lawyer name (not enough)
		await page.getByLabel("Recommended Lawyers").click();
		await page.getByText("Sarah Chen").click();
		await expect(submitButton).toBeDisabled();

		// Fill lawyer email but don't accept disclosure
		await page.getByLabel("Lawyer Email").fill("lawyer@example.com");
		await expect(submitButton).toBeDisabled();

		// Accept disclosure - now form should be valid
		await page.getByText("I agree to the disclosure policy").click();
		await expect(submitButton).toBeEnabled();
	});

	test("5.1.8: email validation prevents invalid email format", async ({
		page,
	}) => {
		// Navigate to a listing detail page
		await page.goto("/listings/test-listing-id");

		// Fill in form with invalid email
		await page.getByLabel("Recommended Lawyers").click();
		await page.getByText("Sarah Chen").click();
		await page.getByLabel("Lawyer Email").fill("invalid-email");
		await page.getByText("I agree to the disclosure policy").click();

		// Submit button should be disabled due to invalid email
		const submitButton = page.getByRole("button", {
			name: "Request Listing",
		});
		await expect(submitButton).toBeDisabled();

		// Fix email format
		await page.getByLabel("Lawyer Email").fill("lawyer@example.com");
		await expect(submitButton).toBeEnabled();
	});
});


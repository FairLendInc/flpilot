import { test, expect } from "@playwright/test";

/**
 * E2E tests for real-time updates in lock request workflow
 * 
 * These tests verify that Convex reactive queries update automatically
 * without requiring manual page refresh. Tests use multiple browser contexts
 * to simulate investor and admin users interacting simultaneously.
 * 
 * Prerequisites:
 * - Convex dev server running (`npx convex dev`)
 * - Next.js dev server running (`pnpm run dev`)
 * - Test users with investor and admin roles configured
 * - At least one visible, unlocked listing in the database
 */

test.describe("Lock Requests - Real-time Updates", () => {
	// Test data - these should match your test database setup
	const TEST_LISTING_ID = "test-listing-id"; // Replace with actual test listing ID
	const INVESTOR_EMAIL = "investor@test.com";
	const ADMIN_EMAIL = "admin@test.com";

	test.beforeEach(async ({ page }) => {
		// Note: In a real test environment, you would:
		// 1. Set up proper authentication tokens for test users
		// 2. Seed test data (listings, users)
		// 3. Configure Convex test deployment
		
		// For now, we'll use mock authentication
		// In production tests, use actual WorkOS auth tokens
		await page.addInitScript(() => {
			localStorage.setItem("workos-auth-token", "mock-token");
		});
	});

	test("5.3.1: Investor sees status update when admin approves request", async ({
		browser,
	}) => {
		// Create two browser contexts: one for investor, one for admin
		const investorContext = await browser.newContext();
		const adminContext = await browser.newContext();

		const investorPage = await investorContext.newPage();
		const adminPage = await adminContext.newPage();

		try {
			// Set up investor authentication
			await investorPage.addInitScript(() => {
				localStorage.setItem("workos-auth-token", "investor-token");
				localStorage.setItem("user-role", "investor");
			});

			// Set up admin authentication
			await adminPage.addInitScript(() => {
				localStorage.setItem("workos-auth-token", "admin-token");
				localStorage.setItem("user-role", "admin");
			});

			// Step 1: Investor navigates to listing detail page
			await investorPage.goto(`/listings/${TEST_LISTING_ID}`);
			
			// Wait for page to load
			await investorPage.waitForLoadState("networkidle");
			
			// Step 2: Investor creates a lock request
			// Find and click "Request to Lock Listing" button
			const requestButton = investorPage.getByRole("button", {
				name: /request.*lock/i,
			});
			await expect(requestButton).toBeVisible();
			await requestButton.click();

			// Fill in request form if needed (notes, etc.)
			// For this test, we'll assume minimal form submission
			const submitButton = investorPage.getByRole("button", {
				name: /submit|request listing/i,
			});
			await submitButton.click();

			// Step 3: Verify investor sees "Request Pending" status
			await expect(
				investorPage.getByText(/request.*pending/i)
			).toBeVisible({ timeout: 5000 });

			// Step 4: Admin navigates to lock requests dashboard
			await adminPage.goto("/dashboard/admin/lock-requests");
			await adminPage.waitForLoadState("networkidle");

			// Step 5: Admin sees the pending request
			await expect(
				adminPage.getByText(/pending/i)
			).toBeVisible();

			// Find the approve button for this request
			// This assumes the table shows the request with an approve button
			const approveButtons = adminPage.getByRole("button", {
				name: /approve/i,
			});
			const firstApproveButton = approveButtons.first();
			await expect(firstApproveButton).toBeVisible();

			// Step 6: Admin clicks approve
			await firstApproveButton.click();

			// Confirm approval dialog if present
			const confirmButton = adminPage.getByRole("button", {
				name: /confirm|yes/i,
			});
			if (await confirmButton.isVisible()) {
				await confirmButton.click();
			}

			// Step 7: Wait for approval to process
			await adminPage.waitForTimeout(1000); // Allow mutation to complete

			// Step 8: Verify investor's view updates automatically (real-time)
			// Investor should see "Listing locked by you" or similar
			await expect(
				investorPage.getByText(/listing.*locked|approved/i)
			).toBeVisible({ timeout: 10000 }); // Allow time for real-time update

			// Verify "Request Pending" is no longer visible
			await expect(
				investorPage.getByText(/request.*pending/i)
			).not.toBeVisible();
		} finally {
			await investorContext.close();
			await adminContext.close();
		}
	});

	test("5.3.2: Investor sees status update when admin rejects request", async ({
		browser,
	}) => {
		const investorContext = await browser.newContext();
		const adminContext = await browser.newContext();

		const investorPage = await investorContext.newPage();
		const adminPage = await adminContext.newPage();

		try {
			// Set up authentication
			await investorPage.addInitScript(() => {
				localStorage.setItem("workos-auth-token", "investor-token");
				localStorage.setItem("user-role", "investor");
			});

			await adminPage.addInitScript(() => {
				localStorage.setItem("workos-auth-token", "admin-token");
				localStorage.setItem("user-role", "admin");
			});

			// Step 1: Investor creates lock request
			await investorPage.goto(`/listings/${TEST_LISTING_ID}`);
			await investorPage.waitForLoadState("networkidle");

			const requestButton = investorPage.getByRole("button", {
				name: /request.*lock/i,
			});
			await requestButton.click();

			const submitButton = investorPage.getByRole("button", {
				name: /submit|request listing/i,
			});
			await submitButton.click();

			// Verify pending status
			await expect(
				investorPage.getByText(/request.*pending/i)
			).toBeVisible({ timeout: 5000 });

			// Step 2: Admin navigates to dashboard
			await adminPage.goto("/dashboard/admin/lock-requests");
			await adminPage.waitForLoadState("networkidle");

			// Step 3: Admin clicks reject button
			const rejectButtons = adminPage.getByRole("button", {
				name: /reject/i,
			});
			const firstRejectButton = rejectButtons.first();
			await expect(firstRejectButton).toBeVisible();
			await firstRejectButton.click();

			// Step 4: Admin enters rejection reason (optional)
			const reasonInput = adminPage.getByPlaceholder(/reason/i);
			if (await reasonInput.isVisible()) {
				await reasonInput.fill("Test rejection reason");
			}

			// Step 5: Admin confirms rejection
			const confirmRejectButton = adminPage.getByRole("button", {
				name: /confirm.*reject|reject.*request/i,
			});
			await confirmRejectButton.click();

			// Wait for rejection to process
			await adminPage.waitForTimeout(1000);

			// Step 6: Verify investor's view updates automatically
			// Investor should see "Lock request rejected" message
			await expect(
				investorPage.getByText(/rejected|denied/i)
			).toBeVisible({ timeout: 10000 });

			// Verify rejection reason is shown if provided
			await expect(
				investorPage.getByText(/test rejection reason/i)
			).toBeVisible({ timeout: 5000 });
		} finally {
			await investorContext.close();
			await adminContext.close();
		}
	});

	test("5.3.3: Admin dashboard updates when new request created", async ({
		browser,
	}) => {
		const investorContext = await browser.newContext();
		const adminContext = await browser.newContext();

		const investorPage = await investorContext.newPage();
		const adminPage = await adminContext.newPage();

		try {
			// Set up authentication
			await investorPage.addInitScript(() => {
				localStorage.setItem("workos-auth-token", "investor-token");
				localStorage.setItem("user-role", "investor");
			});

			await adminPage.addInitScript(() => {
				localStorage.setItem("workos-auth-token", "admin-token");
				localStorage.setItem("user-role", "admin");
			});

			// Step 1: Admin navigates to dashboard and notes initial count
			await adminPage.goto("/dashboard/admin/lock-requests");
			await adminPage.waitForLoadState("networkidle");

			// Get initial pending count from badge
			const pendingTab = adminPage.getByRole("tab", {
				name: /pending/i,
			});
			const initialTabText = await pendingTab.textContent();
			const initialCountMatch = initialTabText?.match(/\((\d+)\)/);
			const initialCount = initialCountMatch
				? parseInt(initialCountMatch[1], 10)
				: 0;

			// Step 2: Investor creates lock request
			await investorPage.goto(`/listings/${TEST_LISTING_ID}`);
			await investorPage.waitForLoadState("networkidle");

			const requestButton = investorPage.getByRole("button", {
				name: /request.*lock/i,
			});
			await requestButton.click();

			const submitButton = investorPage.getByRole("button", {
				name: /submit|request listing/i,
			});
			await submitButton.click();

			// Step 3: Verify admin dashboard updates automatically (real-time)
			// Wait for pending count to increase
			await expect(async () => {
				const updatedTabText = await pendingTab.textContent();
				const updatedCountMatch = updatedTabText?.match(/\((\d+)\)/);
				const updatedCount = updatedCountMatch
					? parseInt(updatedCountMatch[1], 10)
					: 0;
				expect(updatedCount).toBeGreaterThan(initialCount);
			}).toPass({ timeout: 10000 });

			// Verify new request appears in table
			await expect(
				adminPage.getByText(TEST_LISTING_ID)
			).toBeVisible({ timeout: 10000 });
		} finally {
			await investorContext.close();
			await adminContext.close();
		}
	});

	test("5.3.4: Admin dashboard updates when request approved/rejected", async ({
		browser,
	}) => {
		const investorContext = await browser.newContext();
		const adminContext = await browser.newContext();

		const investorPage = await investorContext.newPage();
		const adminPage = await adminContext.newPage();

		try {
			// Set up authentication
			await investorPage.addInitScript(() => {
				localStorage.setItem("workos-auth-token", "investor-token");
				localStorage.setItem("user-role", "investor");
			});

			await adminPage.addInitScript(() => {
				localStorage.setItem("workos-auth-token", "admin-token");
				localStorage.setItem("user-role", "admin");
			});

			// Step 1: Investor creates request
			await investorPage.goto(`/listings/${TEST_LISTING_ID}`);
			await investorPage.waitForLoadState("networkidle");

			const requestButton = investorPage.getByRole("button", {
				name: /request.*lock/i,
			});
			await requestButton.click();

			const submitButton = investorPage.getByRole("button", {
				name: /submit|request listing/i,
			});
			await submitButton.click();

			// Step 2: Admin navigates to dashboard
			await adminPage.goto("/dashboard/admin/lock-requests");
			await adminPage.waitForLoadState("networkidle");

			// Get initial counts
			const pendingTab = adminPage.getByRole("tab", {
				name: /pending/i,
			});
			const approvedTab = adminPage.getByRole("tab", {
				name: /approved/i,
			});

			const initialPendingText = await pendingTab.textContent();
			const initialPendingCount = parseInt(
				initialPendingText?.match(/\((\d+)\)/)?.[1] || "0",
				10
			);

			// Step 3: Admin approves request
			const approveButton = adminPage
				.getByRole("button", { name: /approve/i })
				.first();
			await approveButton.click();

			const confirmButton = adminPage.getByRole("button", {
				name: /confirm|yes/i,
			});
			if (await confirmButton.isVisible()) {
				await confirmButton.click();
			}

			await adminPage.waitForTimeout(1000);

			// Step 4: Verify pending count decreases
			await expect(async () => {
				const updatedPendingText = await pendingTab.textContent();
				const updatedPendingCount = parseInt(
					updatedPendingText?.match(/\((\d+)\)/)?.[1] || "0",
					10
				);
				expect(updatedPendingCount).toBeLessThan(initialPendingCount);
			}).toPass({ timeout: 10000 });

			// Step 5: Switch to Approved tab and verify request appears
			await approvedTab.click();
			await expect(
				adminPage.getByText(TEST_LISTING_ID)
			).toBeVisible({ timeout: 10000 });
		} finally {
			await investorContext.close();
			await adminContext.close();
		}
	});

	test("5.3.5: Pending count badge updates reactively", async ({
		browser,
	}) => {
		const investorContext = await browser.newContext();
		const adminContext = await browser.newContext();

		const investorPage = await investorContext.newPage();
		const adminPage = await adminContext.newPage();

		try {
			// Set up authentication
			await investorPage.addInitScript(() => {
				localStorage.setItem("workos-auth-token", "investor-token");
				localStorage.setItem("user-role", "investor");
			});

			await adminPage.addInitScript(() => {
				localStorage.setItem("workos-auth-token", "admin-token");
				localStorage.setItem("user-role", "admin");
			});

			// Step 1: Admin navigates to dashboard
			await adminPage.goto("/dashboard/admin/lock-requests");
			await adminPage.waitForLoadState("networkidle");

			// Step 2: Get initial pending count badge value
			const pendingTab = adminPage.getByRole("tab", {
				name: /pending/i,
			});
			const initialBadgeText = await pendingTab.textContent();
			const initialCount = parseInt(
				initialBadgeText?.match(/\((\d+)\)/)?.[1] || "0",
				10
			);

			// Step 3: Investor creates request
			await investorPage.goto(`/listings/${TEST_LISTING_ID}`);
			await investorPage.waitForLoadState("networkidle");

			const requestButton = investorPage.getByRole("button", {
				name: /request.*lock/i,
			});
			await requestButton.click();

			const submitButton = investorPage.getByRole("button", {
				name: /submit|request listing/i,
			});
			await submitButton.click();

			// Step 4: Verify badge count increases automatically
			await expect(async () => {
				const updatedBadgeText = await pendingTab.textContent();
				const updatedCount = parseInt(
					updatedBadgeText?.match(/\((\d+)\)/)?.[1] || "0",
					10
				);
				expect(updatedCount).toBe(initialCount + 1);
			}).toPass({ timeout: 10000 });

			// Step 5: Admin approves request
			await adminPage.bringToFront();
			const approveButton = adminPage
				.getByRole("button", { name: /approve/i })
				.first();
			await approveButton.click();

			const confirmButton = adminPage.getByRole("button", {
				name: /confirm|yes/i,
			});
			if (await confirmButton.isVisible()) {
				await confirmButton.click();
			}

			await adminPage.waitForTimeout(1000);

			// Step 6: Verify badge count decreases automatically
			await expect(async () => {
				const finalBadgeText = await pendingTab.textContent();
				const finalCount = parseInt(
					finalBadgeText?.match(/\((\d+)\)/)?.[1] || "0",
					10
				);
				expect(finalCount).toBe(initialCount);
			}).toPass({ timeout: 10000 });
		} finally {
			await investorContext.close();
			await adminContext.close();
		}
	});
});


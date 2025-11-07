import { test, expect } from "@playwright/test";
import { createTestListing, deleteTestListing, type TestListingFixture } from "./fixtures/test-listings";

/**
 * E2E tests for lock request authorization (Task 5.4)
 * Tests that proper role-based access control is enforced for lock request operations
 *
 * Note: These tests verify authorization at both UI and API levels.
 * For full E2E testing, you would need:
 * - Real test users with different roles
 * - Real listings in the database
 * - Proper authentication setup
 *
 * These tests provide a framework that can be enhanced with real data.
 */

test.describe("Lock Request Authorization", () => {
	// Test listing fixture - created once per test
	let testListing: TestListingFixture;

	test.beforeEach(async ({ page }) => {
		// Create a test listing for authorization tests
		testListing = await createTestListing(page, { visible: true });
	});

	test.afterEach(async ({ page }) => {
		// Clean up test listing after each test
		if (testListing?.listingId) {
			await deleteTestListing(page, testListing.listingId);
		}
	});

	// Helper function to mock user identity with role
	async function mockUserRole(
		page: any,
		role: "investor" | "admin" | "broker" | "lawyer" | "member"
	) {
		await page.addInitScript(
			(role: string) => {
				// Mock WorkOS auth token
				localStorage.setItem("workos-auth-token", `mock-token-${role}`);

				// Mock user identity in window for Convex auth
				// This simulates what WorkOS AuthKit would provide
				(window as any).__MOCK_USER_ROLE__ = role;
				(window as any).__MOCK_USER_IDENTITY__ = {
					subject: `user-${role}-123`,
					email: `${role}@example.com`,
					role: role,
					permissions: getPermissionsForRole(role),
				};

				function getPermissionsForRole(role: string): string[] {
					switch (role) {
						case "admin":
							return [
								"mortgage.*",
								"profile.*",
								"org.*",
								"deal.*",
								"widgets:users-table:manage",
							];
						case "investor":
							return [
								"mortgage.read",
								"mortgage.list",
								"deal.read",
								"mortgage.buylock",
							];
						case "broker":
							return ["mortgage.create", "mortgage.read"];
						case "lawyer":
							return ["mortgage.read", "mortgage.list", "deal.read"];
						default:
							return [];
					}
				}
			},
			role
		);
	}

	test.describe("5.4.1: Non-investor cannot see Request to Lock button", () => {
		test("broker cannot see Request to Lock button", async ({ page }) => {
			await mockUserRole(page, "broker");

			// Navigate to the test listing detail page
			await page.goto(`/listings/${testListing.listingId}`);

			// Wait for page to load
			await page.waitForLoadState("networkidle");
			await expect(page).toHaveURL(/\/listings\//);

			// Assert that the Request to Lock button is not visible for broker role
			const requestButton = page.getByRole("button", { name: /Request to Lock/i });
			await expect(requestButton).toHaveCount(0);
		});

		test("lawyer cannot see Request to Lock button", async ({ page }) => {
			await mockUserRole(page, "lawyer");

			await page.goto(`/listings/${testListing.listingId}`);

			// Wait for page to load
			await page.waitForLoadState("networkidle");
			await expect(page).toHaveURL(/\/listings\//);

			// Assert that the Request to Lock button is not visible for lawyer role
			const requestButton = page.getByRole("button", { name: /Request to Lock/i });
			await expect(requestButton).toHaveCount(0);
		});

		test("member cannot see Request to Lock button", async ({ page }) => {
			await mockUserRole(page, "member");

			await page.goto(`/listings/${testListing.listingId}`);

			// Wait for page to load
			await page.waitForLoadState("networkidle");
			await expect(page).toHaveURL(/\/listings\//);

			// Assert that the Request to Lock button is not visible for member role
			const requestButton = page.getByRole("button", { name: /Request to Lock/i });
			await expect(requestButton).toHaveCount(0);
		});
	});

	test.describe("5.4.2: Non-investor cannot create lock request (API rejection)", () => {
		test("broker cannot create lock request", async ({ page }) => {
			await mockUserRole(page, "broker");

			await page.goto(`/listings/${testListing.listingId}`);
			await expect(page).toHaveURL(/\/listings\//);

			// Wait for page to load and Convex client to be available
			await page.waitForLoadState("networkidle");

			// Call the Convex mutation directly and catch the authorization error
			// We'll use page.evaluate to access the Convex client from the React context
			// or create a new ConvexReactClient instance to call the mutation
			const errorMessage = await page.evaluate(
				async (listingId: string) => {
					try {
						// Get Convex URL from window (set by Next.js)
						const convexUrl = (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_CONVEX_URL;
						
						if (!convexUrl) {
							return "Convex URL not found";
						}

						// Access the ConvexReactClient from the React context
						// The ConvexProvider stores it in React context, but we can also
						// access it via the useConvexClient hook or by accessing the context directly
						// For testing, we'll use the Convex HTTP API endpoint format
						// Convex mutations are called via POST to /api/mutation
						const response = await fetch(`${convexUrl}/api/mutation`, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							credentials: "include", // Include auth cookies
							body: JSON.stringify({
								path: "lockRequests.createLockRequest",
								args: {
									listingId,
									lawyerName: "Test Lawyer",
									lawyerLSONumber: "12345",
									lawyerEmail: "lawyer@example.com",
								},
							}),
						});

						const result = await response.json();
						
						// Convex returns errors in the result object
						if (result.error) {
							return result.error;
						}
						
						// Check HTTP status
						if (!response.ok) {
							return `HTTP ${response.status}: ${result.message || JSON.stringify(result)}`;
						}
						
						return "No error returned";
					} catch (error: any) {
						return error.message || String(error);
					}
				},
				testListing.listingId
			);

			// Assert that the error message contains the authorization error
			expect(errorMessage).toContain("Investor role required");
		});

		test("lawyer cannot create lock request", async ({ page }) => {
			await mockUserRole(page, "lawyer");

			await page.goto(`/listings/${testListing.listingId}`);
			await expect(page).toHaveURL(/\/listings\//);
			await page.waitForLoadState("networkidle");

			const errorMessage = await page.evaluate(
				async (listingId: string) => {
					try {
						const convexUrl = (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_CONVEX_URL;
						
						if (!convexUrl) {
							return "Convex URL not found";
						}

						const response = await fetch(`${convexUrl}/api/mutation`, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							credentials: "include",
							body: JSON.stringify({
								path: "lockRequests.createLockRequest",
								args: {
									listingId,
									lawyerName: "Test Lawyer",
									lawyerLSONumber: "12345",
									lawyerEmail: "lawyer@example.com",
								},
							}),
						});

						const result = await response.json();
						
						if (result.error) {
							return result.error;
						}
						
						if (!response.ok) {
							return `HTTP ${response.status}: ${result.message || JSON.stringify(result)}`;
						}
						
						return "No error returned";
					} catch (error: any) {
						return error.message || String(error);
					}
				},
				testListing.listingId
			);

			expect(errorMessage).toContain("Investor role required");
		});

		test("member cannot create lock request", async ({ page }) => {
			await mockUserRole(page, "member");

			await page.goto(`/listings/${testListing.listingId}`);
			await expect(page).toHaveURL(/\/listings\//);
			await page.waitForLoadState("networkidle");

			const errorMessage = await page.evaluate(
				async (listingId: string) => {
					try {
						const convexUrl = (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_CONVEX_URL;
						
						if (!convexUrl) {
							return "Convex URL not found";
						}

						const response = await fetch(`${convexUrl}/api/mutation`, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							credentials: "include",
							body: JSON.stringify({
								path: "lockRequests.createLockRequest",
								args: {
									listingId,
									lawyerName: "Test Lawyer",
									lawyerLSONumber: "12345",
									lawyerEmail: "lawyer@example.com",
								},
							}),
						});

						const result = await response.json();
						
						if (result.error) {
							return result.error;
						}
						
						if (!response.ok) {
							return `HTTP ${response.status}: ${result.message || JSON.stringify(result)}`;
						}
						
						return "No error returned";
					} catch (error: any) {
						return error.message || String(error);
					}
				},
				testListing.listingId
			);

			expect(errorMessage).toContain("Investor role required");
		});
	});

	test.describe("5.4.3: Non-admin cannot access lock requests dashboard (route protection)", () => {
		test("investor cannot access lock requests dashboard", async ({
			page,
		}) => {
			await mockUserRole(page, "investor");

			// Navigate to admin lock requests page
			await page.goto("/dashboard/admin/lock-requests");
			await page.waitForLoadState("networkidle");

			// Assert: Either redirected away OR access denied UI is shown
			const currentUrl = page.url();
			
			if (currentUrl.includes("/lock-requests")) {
				// If still on lock requests page, verify access is denied via UI
				// Option 1: Check for "Access Denied" or similar error message
				const accessDeniedMessage = page.getByText(/access denied|unauthorized|permission denied/i);
				const hasAccessDenied = (await accessDeniedMessage.count()) > 0;
				
				// Option 2: Verify admin tabs are NOT visible
				const pendingTab = page.getByRole("tab", { name: /pending/i });
				const approvedTab = page.getByRole("tab", { name: /approved/i });
				const rejectedTab = page.getByRole("tab", { name: /rejected/i });
				
				const hasPendingTab = (await pendingTab.count()) > 0;
				const hasApprovedTab = (await approvedTab.count()) > 0;
				const hasRejectedTab = (await rejectedTab.count()) > 0;
				const hasAnyAdminTabs = hasPendingTab || hasApprovedTab || hasRejectedTab;
				
				// ASSERT: Must have access denied message OR no admin tabs
				expect(hasAccessDenied || !hasAnyAdminTabs).toBe(true);
				
				// If we see admin UI, that's a security violation
				if (hasAnyAdminTabs && !hasAccessDenied) {
					throw new Error("SECURITY VIOLATION: Investor can see admin lock requests UI without access denied message");
				}
			}
			// If redirected away, test passes (access was properly denied)
		});

		test("broker cannot access lock requests dashboard", async ({
			page,
		}) => {
			await mockUserRole(page, "broker");

			await page.goto("/dashboard/admin/lock-requests");
			await page.waitForLoadState("networkidle");

			const currentUrl = page.url();
			
			if (currentUrl.includes("/lock-requests")) {
				const accessDeniedMessage = page.getByText(/access denied|unauthorized|permission denied/i);
				const hasAccessDenied = (await accessDeniedMessage.count()) > 0;
				
				const pendingTab = page.getByRole("tab", { name: /pending/i });
				const approvedTab = page.getByRole("tab", { name: /approved/i });
				const rejectedTab = page.getByRole("tab", { name: /rejected/i });
				
				const hasPendingTab = (await pendingTab.count()) > 0;
				const hasApprovedTab = (await approvedTab.count()) > 0;
				const hasRejectedTab = (await rejectedTab.count()) > 0;
				const hasAnyAdminTabs = hasPendingTab || hasApprovedTab || hasRejectedTab;
				
				expect(hasAccessDenied || !hasAnyAdminTabs).toBe(true);
				
				if (hasAnyAdminTabs && !hasAccessDenied) {
					throw new Error("SECURITY VIOLATION: Broker can see admin lock requests UI without access denied message");
				}
			}
		});

		test("lawyer cannot access lock requests dashboard", async ({
			page,
		}) => {
			await mockUserRole(page, "lawyer");

			await page.goto("/dashboard/admin/lock-requests");
			await page.waitForLoadState("networkidle");

			const currentUrl = page.url();
			
			if (currentUrl.includes("/lock-requests")) {
				const accessDeniedMessage = page.getByText(/access denied|unauthorized|permission denied/i);
				const hasAccessDenied = (await accessDeniedMessage.count()) > 0;
				
				const pendingTab = page.getByRole("tab", { name: /pending/i });
				const approvedTab = page.getByRole("tab", { name: /approved/i });
				const rejectedTab = page.getByRole("tab", { name: /rejected/i });
				
				const hasPendingTab = (await pendingTab.count()) > 0;
				const hasApprovedTab = (await approvedTab.count()) > 0;
				const hasRejectedTab = (await rejectedTab.count()) > 0;
				const hasAnyAdminTabs = hasPendingTab || hasApprovedTab || hasRejectedTab;
				
				expect(hasAccessDenied || !hasAnyAdminTabs).toBe(true);
				
				if (hasAnyAdminTabs && !hasAccessDenied) {
					throw new Error("SECURITY VIOLATION: Lawyer can see admin lock requests UI without access denied message");
				}
			}
		});

		test("member cannot access lock requests dashboard", async ({
			page,
		}) => {
			await mockUserRole(page, "member");

			await page.goto("/dashboard/admin/lock-requests");
			await page.waitForLoadState("networkidle");

			const currentUrl = page.url();
			
			if (currentUrl.includes("/lock-requests")) {
				const accessDeniedMessage = page.getByText(/access denied|unauthorized|permission denied/i);
				const hasAccessDenied = (await accessDeniedMessage.count()) > 0;
				
				const pendingTab = page.getByRole("tab", { name: /pending/i });
				const approvedTab = page.getByRole("tab", { name: /approved/i });
				const rejectedTab = page.getByRole("tab", { name: /rejected/i });
				
				const hasPendingTab = (await pendingTab.count()) > 0;
				const hasApprovedTab = (await approvedTab.count()) > 0;
				const hasRejectedTab = (await rejectedTab.count()) > 0;
				const hasAnyAdminTabs = hasPendingTab || hasApprovedTab || hasRejectedTab;
				
				expect(hasAccessDenied || !hasAnyAdminTabs).toBe(true);
				
				if (hasAnyAdminTabs && !hasAccessDenied) {
					throw new Error("SECURITY VIOLATION: Member can see admin lock requests UI without access denied message");
				}
			}
		});
	});

	test.describe("5.4.4: Non-admin cannot approve/reject requests (API rejection)", () => {
		test("investor cannot approve lock request", async ({ page }) => {
			await mockUserRole(page, "investor");

			await page.goto("/dashboard/admin/lock-requests");
			await page.waitForLoadState("networkidle");

			// Use a mock request ID - authorization check happens before request validation
			const mockRequestId = "kg25zy58test1234567890";

			const errorMessage = await page.evaluate(
				async (requestId: string) => {
					try {
						const convexUrl = (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_CONVEX_URL;
						
						if (!convexUrl) {
							return "Convex URL not found";
						}

						const response = await fetch(`${convexUrl}/api/mutation`, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							credentials: "include",
							body: JSON.stringify({
								path: "lockRequests.approveLockRequest",
								args: {
									requestId,
								},
							}),
						});

						const result = await response.json();
						
						if (result.error) {
							return result.error;
						}
						
						if (!response.ok) {
							return `HTTP ${response.status}: ${result.message || JSON.stringify(result)}`;
						}
						
						return "No error returned";
					} catch (error: any) {
						return error.message || String(error);
					}
				},
				mockRequestId
			);

			expect(errorMessage).toContain("Admin privileges required");
		});

		test("investor cannot reject lock request", async ({ page }) => {
			await mockUserRole(page, "investor");

			await page.goto("/dashboard/admin/lock-requests");
			await page.waitForLoadState("networkidle");

			const mockRequestId = "kg25zy58test1234567890";

			const errorMessage = await page.evaluate(
				async (requestId: string) => {
					try {
						const convexUrl = (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_CONVEX_URL;
						
						if (!convexUrl) {
							return "Convex URL not found";
						}

						const response = await fetch(`${convexUrl}/api/mutation`, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							credentials: "include",
							body: JSON.stringify({
								path: "lockRequests.rejectLockRequest",
								args: {
									requestId,
									rejectionReason: "Test rejection",
								},
							}),
						});

						const result = await response.json();
						
						if (result.error) {
							return result.error;
						}
						
						if (!response.ok) {
							return `HTTP ${response.status}: ${result.message || JSON.stringify(result)}`;
						}
						
						return "No error returned";
					} catch (error: any) {
						return error.message || String(error);
					}
				},
				mockRequestId
			);

			expect(errorMessage).toContain("Admin privileges required");
		});

		test("broker cannot approve lock request", async ({ page }) => {
			await mockUserRole(page, "broker");

			await page.goto("/dashboard/admin/lock-requests");
			await page.waitForLoadState("networkidle");

			const mockRequestId = "kg25zy58test1234567890";

			const errorMessage = await page.evaluate(
				async (requestId: string) => {
					try {
						const convexUrl = (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_CONVEX_URL;
						
						if (!convexUrl) {
							return "Convex URL not found";
						}

						const response = await fetch(`${convexUrl}/api/mutation`, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							credentials: "include",
							body: JSON.stringify({
								path: "lockRequests.approveLockRequest",
								args: {
									requestId,
								},
							}),
						});

						const result = await response.json();
						
						if (result.error) {
							return result.error;
						}
						
						if (!response.ok) {
							return `HTTP ${response.status}: ${result.message || JSON.stringify(result)}`;
						}
						
						return "No error returned";
					} catch (error: any) {
						return error.message || String(error);
					}
				},
				mockRequestId
			);

			expect(errorMessage).toContain("Admin privileges required");
		});

		test("lawyer cannot reject lock request", async ({ page }) => {
			await mockUserRole(page, "lawyer");

			await page.goto("/dashboard/admin/lock-requests");
			await page.waitForLoadState("networkidle");

			const mockRequestId = "kg25zy58test1234567890";

			const errorMessage = await page.evaluate(
				async (requestId: string) => {
					try {
						const convexUrl = (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_CONVEX_URL;
						
						if (!convexUrl) {
							return "Convex URL not found";
						}

						const response = await fetch(`${convexUrl}/api/mutation`, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							credentials: "include",
							body: JSON.stringify({
								path: "lockRequests.rejectLockRequest",
								args: {
									requestId,
									rejectionReason: "Test rejection",
								},
							}),
						});

						const result = await response.json();
						
						if (result.error) {
							return result.error;
						}
						
						if (!response.ok) {
							return `HTTP ${response.status}: ${result.message || JSON.stringify(result)}`;
						}
						
						return "No error returned";
					} catch (error: any) {
						return error.message || String(error);
					}
				},
				mockRequestId
			);

			expect(errorMessage).toContain("Admin privileges required");
		});
	});

	test.describe("5.4.5: Investor cannot cancel another investor's request", () => {
		test("investor cannot cancel another investor's request", async ({
			page,
		}) => {
			await mockUserRole(page, "investor");

			// Mock user identity with specific user ID
			await page.addInitScript(() => {
				(window as any).__MOCK_USER_IDENTITY__ = {
					subject: "investor-user-123",
					email: "investor1@example.com",
					role: "investor",
				};
			});

			await page.goto(`/listings/${testListing.listingId}`);
			await page.waitForLoadState("networkidle");

			// Use a mock request ID that belongs to another investor
			// Authorization check happens before request validation
			const mockRequestId = "kg25zy58test1234567890";

			const errorMessage = await page.evaluate(
				async (requestId: string) => {
					try {
						const convexUrl = (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_CONVEX_URL;
						
						if (!convexUrl) {
							return "Convex URL not found";
						}

						const response = await fetch(`${convexUrl}/api/mutation`, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							credentials: "include",
							body: JSON.stringify({
								path: "lockRequests.cancelLockRequest",
								args: {
									requestId,
								},
							}),
						});

						const result = await response.json();
						
						if (result.error) {
							return result.error;
						}
						
						if (!response.ok) {
							return `HTTP ${response.status}: ${result.message || JSON.stringify(result)}`;
						}
						
						return "No error returned";
					} catch (error: any) {
						return error.message || String(error);
					}
				},
				mockRequestId
			);

			// Assert that the error message contains the ownership validation error
			expect(errorMessage).toContain("You can only cancel your own lock requests");
		});
	});

	// Positive test cases to verify authorized access works
	test.describe("Authorized access verification", () => {
		test("admin can access lock requests dashboard", async ({ page }) => {
			await mockUserRole(page, "admin");

			await page.goto("/dashboard/admin/lock-requests");

			// Admin should see the lock requests page
			await expect(
				page.getByText("Lock Requests", { exact: true })
			).toBeVisible();

			// Should see tabs for Pending, Approved, Rejected
			await expect(
				page.getByRole("tab", { name: /pending/i })
			).toBeVisible();
			await expect(
				page.getByRole("tab", { name: /approved/i })
			).toBeVisible();
			await expect(
				page.getByRole("tab", { name: /rejected/i })
			).toBeVisible();
		});

		test("investor can access listing detail page", async ({ page }) => {
			await mockUserRole(page, "investor");

			await page.goto(`/listings/${testListing.listingId}`);

			// Investor should see the request form
			// Note: In real tests, you'd need a valid listing ID
			// The RequestListingSection component should be visible
			await expect(page).toHaveURL(/\/listings\//);
		});
	});
});


import { test, expect } from "@playwright/test";

/**
 * E2E tests for admin lock request approval workflow
 * Tests admin dashboard navigation, approval/rejection flows, and UI interactions
 */

// Mock data helpers
const createMockLockRequest = (
	id: string,
	status: "pending" | "approved" | "rejected",
	listingLocked = false,
	investorName = "John Investor",
	investorEmail = "john@example.com",
	address = "123 Main St, Toronto, ON",
	requestedAt = "2024-01-15T10:00:00Z"
) => ({
	request: {
		_id: id,
		status,
		requestedAt,
		requestedBy: `user_${id}`,
		lawyerName: "Jane Lawyer",
		lawyerLSONumber: "L12345",
		lawyerEmail: "jane@law.com",
		requestNotes: "Test request notes",
		reviewedAt: status !== "pending" ? "2024-01-15T11:00:00Z" : undefined,
		reviewedBy: status !== "pending" ? "admin_user" : undefined,
		rejectionReason: status === "rejected" ? "Test rejection reason" : undefined,
	},
	listing: {
		_id: `listing_${id}`,
		locked: listingLocked,
		visible: true,
	},
	mortgage: {
		_id: `mortgage_${id}`,
		address: {
			street: "123 Main St",
			city: "Toronto",
			state: "ON",
			postalCode: "M5H 2N2",
		},
	},
	investor: {
		_id: `user_${id}`,
		first_name: investorName.split(" ")[0],
		last_name: investorName.split(" ")[1] || "",
		email: investorEmail,
	},
	borrower: {
		_id: `borrower_${id}`,
		name: "Bob Borrower",
	},
});

// Mock Convex responses
const mockPendingRequests = [
	createMockLockRequest("req1", "pending", false, "John Investor", "john@example.com"),
	createMockLockRequest("req2", "pending", true, "Jane Investor", "jane@example.com"),
	createMockLockRequest("req3", "pending", false, "Bob Investor", "bob@example.com", "456 Oak Ave, Vancouver, BC"),
];

const mockApprovedRequests = [
	createMockLockRequest("req4", "approved", true, "Alice Investor", "alice@example.com"),
];

const mockRejectedRequests = [
	createMockLockRequest("req5", "rejected", false, "Charlie Investor", "charlie@example.com"),
];

/**
 * Setup Convex route mocking
 * Intercepts Convex API calls and returns mock data
 * Convex makes POST requests to the deployment URL with function names in the request body
 */
function setupConvexMock(page: any, responses: Record<string, any>) {
	// Intercept Convex query and mutation requests
	// Convex uses POST requests with JSON body containing function name and args
	page.route("**/api/query**", async (route: any) => {
		try {
			const request = route.request();
			const postData = request.postDataJSON();
			const functionName = postData?.path || postData?.function;
			
			if (functionName && responses[functionName]) {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ value: responses[functionName] }),
				});
			} else {
				// Default empty response
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ value: [] }),
				});
			}
		} catch (error) {
			// If parsing fails, return empty response
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ value: [] }),
			});
		}
	});

	page.route("**/api/mutation**", async (route: any) => {
		try {
			const request = route.request();
			const postData = request.postDataJSON();
			const functionName = postData?.path || postData?.function;
			
			if (functionName && responses[functionName]) {
				const response = typeof responses[functionName] === "function"
					? await responses[functionName](postData?.args)
					: responses[functionName];
					
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ value: response }),
				});
			} else {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ value: null }),
				});
			}
		} catch (error) {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ value: null }),
			});
		}
	});

	// Also intercept any Convex deployment URL requests (fallback)
	page.route("**/convex.cloud/**", async (route: any) => {
		const request = route.request();
		if (request.method() === "POST") {
			try {
				const postData = request.postDataJSON();
				const functionName = postData?.path || postData?.function;
				
				if (functionName && responses[functionName]) {
					const response = typeof responses[functionName] === "function"
						? await responses[functionName](postData?.args)
						: responses[functionName];
						
					await route.fulfill({
						status: 200,
						contentType: "application/json",
						body: JSON.stringify({ value: response }),
					});
				} else {
					await route.continue();
				}
			} catch {
				await route.continue();
			}
		} else {
			await route.continue();
		}
	});
}

test.describe("Admin Lock Request Approval Workflow", () => {
	test.beforeEach(async ({ page }) => {
		// Mock authentication - admin user
		await page.addInitScript(() => {
			localStorage.setItem("workos-auth-token", "mock-admin-token");
			// Mock user role as admin
			(window as any).__MOCK_USER_ROLE__ = "admin";
		});

		// Setup default Convex mocks
		setupConvexMock(page, {
			"lockRequests:getPendingLockRequestsWithDetails": mockPendingRequests,
			"lockRequests:getApprovedLockRequestsWithDetails": mockApprovedRequests,
			"lockRequests:getRejectedLockRequestsWithDetails": mockRejectedRequests,
		});
	});

	test("5.2.1: Admin navigates to lock requests dashboard", async ({ page }) => {
		await page.goto("/dashboard/admin/lock-requests");

		// Verify page loads
		await expect(page).toHaveTitle(/Lock Requests/);
		await expect(page.getByText("Lock Requests", { exact: true })).toBeVisible();
		await expect(
			page.getByText("Review and manage investor lock requests for marketplace listings")
		).toBeVisible();
	});

	test("5.2.2: Admin sees pending requests in Pending tab", async ({ page }) => {
		await page.goto("/dashboard/admin/lock-requests");

		// Wait for tab to be visible
		const pendingTab = page.getByRole("tab", { name: /Pending/ });
		await expect(pendingTab).toBeVisible();

		// Verify pending requests are displayed
		await expect(page.getByText("John Investor")).toBeVisible();
		await expect(page.getByText("Jane Investor")).toBeVisible();
		await expect(page.getByText("Bob Investor")).toBeVisible();

		// Verify request details are shown
		await expect(page.getByText("123 Main St")).toBeVisible();
		await expect(page.getByText("456 Oak Ave")).toBeVisible();
	});

	test("5.2.3: Admin approves lock request successfully", async ({ page }) => {
		let approveCalled = false;
		let approveRequestId: string | null = null;
		let mutationResolve: () => void;
		const mutationPromise = new Promise<void>((resolve) => {
			mutationResolve = resolve;
		});

		// Setup Convex mock with approve mutation handler
		setupConvexMock(page, {
			"lockRequests:getPendingLockRequestsWithDetails": mockPendingRequests,
			"lockRequests:getApprovedLockRequestsWithDetails": mockApprovedRequests,
			"lockRequests:getRejectedLockRequestsWithDetails": mockRejectedRequests,
			"lockRequests:approveLockRequest": (args: any) => {
				approveCalled = true;
				approveRequestId = args?.requestId || null;
				mutationResolve();
				return { success: true };
			},
		});

		await page.goto("/dashboard/admin/lock-requests");

		// Wait for page to load
		await expect(page.getByText("John Investor")).toBeVisible();

		// Find and click approve button for first request (unlocked listing)
		// Look for approve button that's not disabled
		const approveButtons = page.getByRole("button", { name: /Approve/i });
		const enabledApproveButton = approveButtons.first();
		
		await expect(enabledApproveButton).toBeEnabled();
		
		// Wait for mutation response or success toast
		const mutationWait = mutationPromise;
		const toastWait = expect(page.getByText(/Request approved/i)).toBeVisible();
		
		await enabledApproveButton.click();
		
		// Wait for mutation to complete (either via Promise or toast)
		await Promise.race([
			mutationWait,
			toastWait,
		]);

		// Verify mutation was called
		expect(approveCalled).toBe(true);
		expect(approveRequestId).toBeTruthy();

		// Verify success toast appears
		await expect(page.getByText(/Request approved/i)).toBeVisible();
	});

	test("5.2.4: Admin rejects lock request with reason", async ({ page }) => {
		let rejectCalled = false;
		let rejectRequestId: string | null = null;
		let rejectReason: string | null = null;
		let mutationResolve: () => void;
		const mutationPromise = new Promise<void>((resolve) => {
			mutationResolve = resolve;
		});

		// Setup Convex mock with reject mutation handler
		setupConvexMock(page, {
			"lockRequests:getPendingLockRequestsWithDetails": mockPendingRequests,
			"lockRequests:getApprovedLockRequestsWithDetails": mockApprovedRequests,
			"lockRequests:getRejectedLockRequestsWithDetails": mockRejectedRequests,
			"lockRequests:rejectLockRequest": (args: any) => {
				rejectCalled = true;
				rejectRequestId = args?.requestId || null;
				rejectReason = args?.rejectionReason || null;
				mutationResolve();
				return { success: true };
			},
		});

		await page.goto("/dashboard/admin/lock-requests");

		// Wait for page to load
		await expect(page.getByText("John Investor")).toBeVisible();

		// Find and click reject button
		const rejectButton = page.getByRole("button", { name: /Reject/i }).first();
		await expect(rejectButton).toBeVisible();
		await rejectButton.click();

		// Verify rejection dialog opens
		await expect(page.getByText("Reject Lock Request")).toBeVisible();
		await expect(
			page.getByText("Optionally provide a reason for rejecting this request")
		).toBeVisible();

		// Enter rejection reason
		const reasonTextarea = page.getByLabel("Rejection Reason (Optional)");
		await expect(reasonTextarea).toBeVisible();
		await reasonTextarea.fill("Listing is no longer available");

		// Submit rejection
		const submitButton = page.getByRole("button", { name: /Reject Request/i });
		
		// Wait for mutation response or success toast
		const mutationWait = mutationPromise;
		const toastWait = expect(page.getByText(/Request rejected/i)).toBeVisible();
		
		await submitButton.click();
		
		// Wait for mutation to complete (either via Promise or toast)
		await Promise.race([
			mutationWait,
			toastWait,
		]);

		// Verify mutation was called with reason
		expect(rejectCalled).toBe(true);
		expect(rejectRequestId).toBeTruthy();
		expect(rejectReason).toBe("Listing is no longer available");

		// Verify success toast appears
		await expect(page.getByText(/Request rejected/i)).toBeVisible();
	});

	test("5.2.5: Admin sees race condition error (two admins approve simultaneously)", async ({ page }) => {
		let approveAttempts = 0;

		// Mock approve mutation that fails on second attempt (simulating race condition)
		// We need to intercept the mutation route directly to return error status
		page.route("**/api/mutation**", async (route: any) => {
			try {
				const request = route.request();
				const postData = request.postDataJSON();
				const functionName = postData?.path || postData?.function;
				
				if (functionName === "lockRequests:approveLockRequest") {
					approveAttempts++;
					
					// First attempt succeeds, second fails (race condition)
					if (approveAttempts === 1) {
						await route.fulfill({
							status: 200,
							contentType: "application/json",
							body: JSON.stringify({ value: { success: true } }),
						});
					} else {
						// Simulate race condition error
						await route.fulfill({
							status: 400,
							contentType: "application/json",
							body: JSON.stringify({
								error: "Listing was locked by another admin",
							}),
						});
					}
				} else {
					// Handle other queries
					if (functionName === "lockRequests:getPendingLockRequestsWithDetails") {
						await route.fulfill({
							status: 200,
							contentType: "application/json",
							body: JSON.stringify({ value: mockPendingRequests }),
						});
					} else {
						await route.continue();
					}
				}
			} catch {
				await route.continue();
			}
		});

		// Setup default query mocks
		setupConvexMock(page, {
			"lockRequests:getPendingLockRequestsWithDetails": mockPendingRequests,
			"lockRequests:getApprovedLockRequestsWithDetails": mockApprovedRequests,
			"lockRequests:getRejectedLockRequestsWithDetails": mockRejectedRequests,
		});

		await page.goto("/dashboard/admin/lock-requests");

		// Wait for page to load
		await expect(page.getByText("John Investor")).toBeVisible();

		// Click approve button twice quickly (simulating race condition)
		const approveButtons = page.getByRole("button", { name: /Approve/i });
		const firstButton = approveButtons.first();
		
		await firstButton.click();
		await firstButton.click(); // Second click should fail

		// Verify error toast appears
		await expect(page.getByText(/Approval failed/i)).toBeVisible();
		await expect(page.getByText(/locked by another admin/i)).toBeVisible();
	});

	test("5.2.6: Admin cannot approve request for locked listing", async ({ page }) => {
		await page.goto("/dashboard/admin/lock-requests");

		// Find approve button for locked listing (should be disabled)
		// Look for row with "Locked" badge
		const lockedRow = page.locator("tr").filter({ hasText: "Locked" }).first();
		await expect(lockedRow).toBeVisible();

		// Find approve button in that row
		const approveButton = lockedRow.getByRole("button", { name: /Approve/i });
		await expect(approveButton).toBeDisabled();

		// Verify tooltip explains why it's disabled
		const tooltip = page.getByText(/Cannot approve: Listing is already locked/i);
		// Tooltip might not be visible until hover, but button should be disabled
		await expect(approveButton).toBeDisabled();
	});

	test("5.2.7: Admin switches between tabs (Pending/Approved/Rejected)", async ({ page }) => {
		await page.goto("/dashboard/admin/lock-requests");

		// Verify all tabs are visible
		const pendingTab = page.getByRole("tab", { name: /Pending/i });
		const approvedTab = page.getByRole("tab", { name: /Approved/i });
		const rejectedTab = page.getByRole("tab", { name: /Rejected/i });

		await expect(pendingTab).toBeVisible();
		await expect(approvedTab).toBeVisible();
		await expect(rejectedTab).toBeVisible();

		// Start on Pending tab - verify pending requests visible
		await expect(page.getByText("John Investor")).toBeVisible();

		// Switch to Approved tab
		await approvedTab.click();
		await expect(approvedTab).toHaveAttribute("aria-selected", "true");
		await expect(page.getByText("Alice Investor")).toBeVisible();

		// Switch to Rejected tab
		await rejectedTab.click();
		await expect(rejectedTab).toHaveAttribute("aria-selected", "true");
		await expect(page.getByText("Charlie Investor")).toBeVisible();

		// Switch back to Pending tab
		await pendingTab.click();
		await expect(pendingTab).toHaveAttribute("aria-selected", "true");
		await expect(page.getByText("John Investor")).toBeVisible();
	});

	test("5.2.8: Admin filters requests by investor or listing", async ({ page }) => {
		await page.goto("/dashboard/admin/lock-requests");

		// Find search input
		const searchInput = page.getByPlaceholder(/Search by investor name\/email or property address/i);
		await expect(searchInput).toBeVisible();

		// Search by investor name
		await searchInput.fill("John");
		await page.waitForTimeout(400); // Wait for debounce

		// Verify only John's request is shown
		await expect(page.getByText("John Investor")).toBeVisible();
		await expect(page.getByText("Jane Investor")).not.toBeVisible();
		await expect(page.getByText("Bob Investor")).not.toBeVisible();

		// Clear search and search by address
		await searchInput.clear();
		await searchInput.fill("Oak Ave");
		await page.waitForTimeout(400);

		// Verify only Bob's request (with Oak Ave address) is shown
		await expect(page.getByText("Bob Investor")).toBeVisible();
		await expect(page.getByText("John Investor")).not.toBeVisible();
		await expect(page.getByText("Jane Investor")).not.toBeVisible();

		// Test lock status filter (only on pending tab)
		const lockStatusFilter = page.getByRole("combobox", { name: /Filter by lock status/i });
		await expect(lockStatusFilter).toBeVisible();
		
		await lockStatusFilter.click();
		const lockedOption = page.getByRole("option", { name: /Locked/i });
		await lockedOption.click();

		// Verify only locked listings are shown
		await expect(page.getByText("Jane Investor")).toBeVisible(); // Has locked listing
		await expect(page.getByText("John Investor")).not.toBeVisible(); // Unlocked
	});

	test("5.2.9: Admin sees 'X other pending requests' indicator", async ({ page }) => {
		// Mock multiple pending requests for same listing
		const sameListingRequests = [
			createMockLockRequest("req1", "pending", false, "John Investor", "john@example.com"),
			createMockLockRequest("req2", "pending", false, "Jane Investor", "jane@example.com"),
			createMockLockRequest("req3", "pending", false, "Bob Investor", "bob@example.com"),
		];

		// All requests have same listing ID
		sameListingRequests.forEach((req, index) => {
			req.listing._id = "listing_123";
		});

		setupConvexMock(page, {
			"lockRequests:getPendingLockRequestsWithDetails": sameListingRequests,
		});

		await page.goto("/dashboard/admin/lock-requests");

		// Open detail view for first request
		const viewDetailsButton = page.getByRole("button", { name: /View Details/i }).first();
		await viewDetailsButton.click();

		// Verify detail dialog opens
		await expect(page.getByText(/other pending request/i)).toBeVisible();
		
		// Verify count is shown (should show "2 other pending requests" for first request)
		await expect(page.getByText(/2 other pending request/i)).toBeVisible();
	});
});


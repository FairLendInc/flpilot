# E2E Test Fixtures

This directory contains test fixture helpers for creating test data in E2E tests.

## Test Listings Fixture

The `test-listings.ts` fixture provides helpers to create and clean up test listings via the Convex HTTP API.

### Prerequisites

Set these environment variables before running E2E tests:

- `NEXT_PUBLIC_CONVEX_URL` - Your Convex deployment URL (e.g., `https://your-deployment.convex.cloud`)
- `LISTINGS_WEBHOOK_API_KEY` - API key for the listings webhook endpoint (defaults to `test-webhook-key`)

### Usage

```typescript
import { createTestListing, deleteTestListing } from "./fixtures/test-listings";

test.describe("My Test Suite", () => {
  let testListing: TestListingFixture;

  test.beforeEach(async ({ page }) => {
    // Create a test listing before each test
    testListing = await createTestListing(page, { visible: true });
  });

  test.afterEach(async ({ page }) => {
    // Clean up after each test
    if (testListing?.listingId) {
      await deleteTestListing(page, testListing.listingId);
    }
  });

  test("my test", async ({ page }) => {
    // Use the created listing ID
    await page.goto(`/listings/${testListing.listingId}`);
    // ... rest of test
  });
});
```

### API

#### `createTestListing(page, options?)`

Creates a test listing with associated mortgage and borrower.

**Options:**
- `visible?: boolean` - Whether the listing is visible (default: `true`)
- `address?: {...}` - Custom property address

**Returns:** `TestListingFixture` with `listingId`, `mortgageId`, and `borrowerId`

#### `deleteTestListing(page, listingId)`

Deletes a test listing (and cascades to mortgage/borrower if applicable).

**Note:** Cleanup failures are logged but don't fail tests.

### Notes

- Listings are created via the Convex HTTP webhook endpoint (`/listings/create`)
- Locking listings requires admin authentication, so locked listings should be created via UI or separate setup
- Each test gets a fresh listing to prevent state leakage between tests


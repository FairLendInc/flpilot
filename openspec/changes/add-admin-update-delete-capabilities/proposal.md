## Why

Admins currently have the ability to create new listings and mortgages, but lack the ability to update or delete existing records. This creates operational gaps where:
- Property details, loan terms, or borrower information cannot be corrected after creation
- Listings cannot be removed or visibility cannot be adjusted as needed
- Dead or invalid records cannot be cleaned up
- Administrative data management is incomplete

## What Changes

- **Listings Capability**: Add admin-only UPDATE and DELETE operations
  - UPDATE: Modify visible state, locked state, and update related metadata
  - DELETE: Remove listings from marketplace (preserves underlying mortgage)

- **Mortgages Capability**: Add admin-only UPDATE and DELETE operations
  - UPDATE: Modify loan details, property information, borrower link, and status
  - DELETE: Remove mortgage and all associated data (listings, comparables, ownership records, payments)

- **Authorization**: Both operations restricted to users with admin role
  - Validates admin permission before executing mutations
  - Returns clear error messages for unauthorized access attempts

## Impact

- **Affected Specs**: listings, mortgages
- **Affected Code**:
  - Convex mutations in `convex/listings.ts` and `convex/mortgages.ts`
  - Admin UI components in `app/(auth)/dashboard/admin/`
  - API routes for webhook operations
  - Validation and error handling
- **Breaking Changes**: None
- **Dependencies**: None (builds on existing create/list capabilities)
- **Data Integrity**: DELETE operations include cascade validation and rollback on failure

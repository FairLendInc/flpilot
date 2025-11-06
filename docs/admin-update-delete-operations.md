# Admin Update and Delete Operations

This document describes the admin-only update and delete operations for listings and mortgages.

## Overview

Administrators can now update and delete listings and mortgages through:
- **Admin UI**: Management pages at `/dashboard/admin/listings` and `/dashboard/admin/mortgages`
- **Webhook API**: Authenticated HTTP endpoints for programmatic updates/deletes

## Authorization

All update and delete operations require admin privileges:
- **UI Operations**: Enforced via RBAC checks using `hasRbacAccess` with `required_roles: ["admin"]`
- **Webhook Operations**: Authenticated via API key (`x-api-key` header matching `LISTINGS_WEBHOOK_API_KEY`)

## Listings Operations

### Update Listing

**UI**: Use the `ListingUpdateForm` component on the admin listings page.

**Webhook**: `POST /listings/update`

```json
{
  "listingId": "j1234567890abcdef",
  "visible": true,
  "locked": false,
  "metadata": {}
}
```

**Fields**:
- `visible` (optional): Toggle marketplace visibility
- `locked` (optional): Lock/unlock the listing
- `metadata` (optional): Update internal metadata

**Cascade Effects**: None (listing updates don't affect related data)

### Delete Listing

**UI**: Use the `ListingDeleteDialog` component on the admin listings page.

**Webhook**: `POST /listings/delete`

```json
{
  "listingId": "j1234567890abcdef",
  "force": false
}
```

**Fields**:
- `force` (optional): If `true`, unlocks locked listings before deletion

**Cascade Effects**:
- Deletes all `appraisal_comparables` linked to the listing's mortgage
- Preserves the underlying mortgage record

**Locked Listing Handling**:
- If listing is locked and `force=false`: Operation fails with error
- If listing is locked and `force=true`: Listing is unlocked, then deleted

## Mortgages Operations

### Update Mortgage

**UI**: Use the `MortgageUpdateForm` component on the admin mortgages page.

**Webhook**: `POST /mortgages/update`

```json
{
  "mortgageId": "j1234567890abcdef",
  "loanAmount": 600000,
  "interestRate": 6.5,
  "status": "active",
  "mortgageType": "1st",
  "borrowerId": "j0987654321fedcba"
}
```

**Fields**:
- `loanAmount` (optional): Must be > 0
- `interestRate` (optional): Must be between 0 and 100
- `status` (optional): One of `active`, `renewed`, `closed`, `defaulted`
- `mortgageType` (optional): One of `1st`, `2nd`, `other`
- `borrowerId` (optional): Must reference an existing borrower

**Cascade Effects**: None (mortgage updates don't affect related data)

### Delete Mortgage

**UI**: Use the `MortgageDeleteDialog` component on the admin mortgages page.

**Webhook**: `POST /mortgages/delete`

```json
{
  "mortgageId": "j1234567890abcdef",
  "force": false
}
```

**Fields**:
- `force` (optional): If `true`, unlocks locked listings before deletion

**Cascade Effects** (all executed atomically):
- Deletes all `listings` linked to the mortgage
- Deletes all `appraisal_comparables` linked to the mortgage
- Deletes all `mortgage_ownership` records for the mortgage
- Deletes all `payments` linked to the mortgage
- **Preserves** the `borrowers` record

**Locked Listing Handling**:
- If any listing is locked and `force=false`: Operation fails with error
- If any listing is locked and `force=true`: All locked listings are unlocked, then deleted

**Transaction Safety**: All cascade deletions are executed within a single Convex transaction. If any deletion fails, the entire operation rolls back.

## Error Handling

### Authorization Errors
- **UI**: Returns 403 Forbidden, displays error message
- **Webhook**: Returns 401 Unauthorized if API key is missing/invalid

### Validation Errors
- **UI**: Displays field-level error messages
- **Webhook**: Returns 400 Bad Request with validation error details

### Locked Resource Errors
- **UI**: Shows confirmation dialog with force option
- **Webhook**: Returns 400 Bad Request with lock status details

## Audit Logging

All admin operations are logged for audit purposes:
- **UI Operations**: Logged with admin user ID
- **Webhook Operations**: Logged with `[WEBHOOK]` prefix

Logs include:
- Operation type (update/delete)
- Resource ID
- Cascade statistics (for deletions)
- Timestamp

## Testing

### Unit Tests
- `convex/tests/listingsAdmin.test.ts`: Tests for listing mutations
- `convex/tests/mortgagesAdmin.test.ts`: Tests for mortgage mutations

### E2E Tests
- `e2e/admin-management.spec.ts`: Tests for admin UI pages

### Webhook Tests
- Integration tests should verify API key authentication and payload validation

## Navigation

Admin navigation includes:
- **Listings**: `/dashboard/admin/listings` (existing)
- **Mortgages**: `/dashboard/admin/mortgages` (new)

Both pages are accessible via the admin sidebar navigation.


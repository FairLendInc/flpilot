# Admin Update and Delete Operations

This document describes the admin-only update and delete operations for listings and mortgages.

## Overview

Admin users have special privileges to update and delete listings and mortgages through both the UI and webhook API. These operations are protected by role-based access control (RBAC) and include comprehensive validation and cascade handling.

## Authorization

All update and delete operations require admin role. The system validates:

1. **Authentication**: User must be authenticated via WorkOS
2. **Authorization**: User must have `admin` role (checked via `hasRbacAccess` or `checkRbac`)
3. **API Key**: Webhook requests must include valid API key in `x-api-key` header

## Listing Operations

### Update Listing

**Convex Mutation**: `updateListing`
**Webhook Endpoint**: `PATCH /listings/update`
**Admin UI**: `/dashboard/admin/listings/manage`

**Permitted Fields**:
- `visible` (boolean): Toggle listing visibility on marketplace
- `locked` (boolean): Lock/unlock listing for editing
- `lockedBy` (Id<"users">): User ID who locked the listing (required when `locked: true`)

**Validation**:
- Admin role required
- Listing must exist
- When locking, `lockedBy` and `lockedAt` are set automatically
- When unlocking, `lockedBy` and `lockedAt` are cleared automatically

**Audit Trail**:
- All updates are logged with admin ID, listing ID, updates, and timestamp
- Console logs for development; TODO: Implement persistent audit trail

**Example Webhook Request**:
```json
{
  "listingId": "k17abc123...",
  "visible": false,
  "locked": true,
  "lockedBy": "k17def456..."
}
```

### Delete Listing

**Convex Mutation**: `deleteListing`
**Webhook Endpoint**: `DELETE /listings/delete`
**Admin UI**: `/dashboard/admin/listings/manage`

**Behavior**:
- Deletes the listing record
- Cascade deletes all associated comparables
- Preserves the underlying mortgage record
- Optional `force` flag bypasses locked listing check

**Validation**:
- Admin role required
- Listing must exist
- Listing must not be locked (unless `force: true`)

**Cascade Rules**:
- **Comparables**: All comparables linked to the listing's mortgage are deleted
- **Mortgage**: Preserved (not deleted)

**Rollback**:
- Automatic transaction rollback if any deletion fails
- Error message includes details of failure

**Example Webhook Request**:
```json
{
  "listingId": "k17abc123...",
  "force": false
}
```

## Mortgage Operations

### Update Mortgage

**Convex Mutation**: `updateMortgage`
**Webhook Endpoint**: `PATCH /mortgages/update`
**Admin UI**: `/dashboard/admin/mortgages/manage`

**Permitted Fields**:
- **Loan Details**:
  - `loanAmount` (number): Must be > 0
  - `interestRate` (number): Must be between 0 and 100
- **Dates**:
  - `originationDate` (string): ISO date string
  - `maturityDate` (string): ISO date string, must be after origination date
- **Status**:
  - `status` (enum): `active`, `renewed`, `closed`, `defaulted`
- **Property Information**:
  - `address` (object): All fields required (street, city, state, zip, country)
  - `location` (object): Coordinates (lat: -90 to 90, lng: -180 to 180)
  - `propertyType` (string): Property type description
- **Relationships**:
  - `borrowerId` (Id<"borrowers">): Link to borrower record (must exist)
- **Documents**:
  - `documents` (array): Document metadata (validated types: `appraisal`, `title`, `inspection`, `loan_agreement`, `insurance`)

**Validation**:
- Admin role required
- Mortgage must exist
- All numeric fields validated for positive values and ranges
- Date validation: maturity date must be after origination date
- Address validation: All fields required
- Coordinate validation: Lat/lng must be within valid ranges
- Document type validation: Only permitted document types accepted
- Borrower validation: Borrower ID must reference existing borrower

**Audit Trail**:
- All updates logged with admin ID, mortgage ID, changed fields, and timestamp

**Example Webhook Request**:
```json
{
  "mortgageId": "k17abc123...",
  "loanAmount": 500000,
  "interestRate": 5.5,
  "status": "renewed",
  "address": {
    "street": "456 Updated St",
    "city": "Toronto",
    "state": "ON",
    "zip": "M5J 2N1",
    "country": "Canada"
  }
}
```

### Delete Mortgage

**Convex Mutation**: `deleteMortgage`
**Webhook Endpoint**: `DELETE /mortgages/delete`
**Admin UI**: `/dashboard/admin/mortgages/manage`

**Behavior**:
- Deletes the mortgage record
- Cascade deletes all associated data
- Preserves the borrower record
- Optional `force` flag bypasses locked listing check
- Returns deleted counts for each data type

**Validation**:
- Admin role required
- Mortgage must exist
- No locked listings associated (unless `force: true`)

**Cascade Rules** (in order):
1. **Listings**: All listings linked to mortgage
2. **Comparables**: All comparables linked to mortgage
3. **Ownership**: All ownership records for mortgage
4. **Payments**: All payment records for mortgage
5. **Mortgage**: The mortgage record itself
6. **Borrower**: Preserved (not deleted)

**Rollback**:
- Automatic transaction rollback if any deletion fails
- Error message includes details of failure

**Response**:
```json
{
  "mortgageId": "k17abc123...",
  "deletedCounts": {
    "listings": 1,
    "comparables": 3,
    "ownership": 2,
    "payments": 12
  }
}
```

**Example Webhook Request**:
```json
{
  "mortgageId": "k17abc123...",
  "force": false
}
```

## Admin UI

### Listing Management Page

**Route**: `/dashboard/admin/listings/manage`
**Features**:
- Table view of all listings
- Inline edit/delete actions
- Filter and search capabilities
- Visual indicators for locked/visible status

**Actions**:
- **Edit**: Opens inline form to update `visible` and `locked` fields
- **Delete**: Shows confirmation dialog, performs cascade delete

### Mortgage Management Page

**Route**: `/dashboard/admin/mortgages/manage`
**Features**:
- Table view of all mortgages
- Inline edit/delete actions
- Filter and search capabilities
- Visual indicators for status and linked records

**Actions**:
- **Edit**: Opens comprehensive form to update mortgage details
- **Delete**: Shows confirmation dialog with cascade warning, performs cascade delete

## Webhook API

### Authentication

All webhook requests require:
1. **API Key**: Include in `x-api-key` header
2. **Environment Variable**: `LISTINGS_WEBHOOK_API_KEY` must be configured

### Response Codes

- **200**: Success (for updates and deletes)
- **201**: Created (for creates only)
- **400**: Bad request (validation error, missing required fields)
- **401**: Unauthorized (invalid/missing API key)
- **500**: Internal server error (configuration error)

### Error Responses

```json
{
  "code": "error_code",
  "message": "Human-readable error message",
  "errors": [
    {
      "code": "validation.field.error",
      "path": "field.name",
      "error": "ZodIssueCode"
    }
  ]
}
```

### CORS Configuration

All webhook endpoints support CORS:
- **Allowed Origins**: Configurable via `LISTINGS_WEBHOOK_ALLOWED_ORIGIN` (default: `*`)
- **Allowed Methods**: `POST`, `PATCH`, `DELETE`, `OPTIONS`
- **Allowed Headers**: `Content-Type`, `X-API-Key`
- **Max Age**: 86400 seconds

## Testing

### Unit Tests

**Listing Tests**: `/convex/tests/listingsAdminMutations.test.ts`
- Update listing as admin
- Delete listing as admin
- Authorization validation
- Field validation
- Cascade deletion

**Mortgage Tests**: `/convex/tests/mortgagesAdminMutations.test.ts`
- Update mortgage as admin
- Delete mortgage as admin
- Authorization validation
- Field validation
- Cascade deletion
- Rollback on failure

**Webhook Tests**: `/convex/tests/listingsWebhook.test.ts`
- All listing/mortgage update operations
- All listing/mortgage delete operations
- API key validation
- Payload validation
- Missing ID validation

### E2E Tests

**Coming Soon**: Playwright E2E tests for:
- Admin UI listing management
- Admin UI mortgage management
- Full update/delete workflows
- Error handling and validation

## Security Considerations

1. **Admin-Only Access**: All operations strictly enforce admin role
2. **Cascade Warnings**: UI warns users about cascade deletions before execution
3. **Locked Listings**: Protected from deletion unless force flag is used
4. **Audit Trail**: All operations logged with admin identity and timestamp
5. **Transactional**: All operations automatically rollback on failure
6. **API Key Protection**: Webhook endpoints protected by API key authentication

## Future Enhancements

1. **Persistent Audit Trail**: Implement database-backed audit log
2. **Soft Deletes**: Add soft delete option for recoverability
3. **Batch Operations**: Support bulk update/delete operations
4. **Advanced Filters**: Add more sophisticated filtering in admin UI
5. **Export**: Add CSV/JSON export for admin data
6. **Permissions**: Granular permissions beyond admin/non-admin binary

## Related Documentation

- [Ownership 100% Invariant](/docs/OWNERSHIP_100_PERCENT_INVARIANT.md)
- [Convex Rules](/convex/README.md)
- [RBAC Implementation](/convex/auth.config.ts)
- [OpenSpec Proposal](/openspec/changes/add-admin-update-delete-capabilities/proposal.md)


# Lock Request Approval Workflow

## Overview

The Lock Request Approval Workflow enables investors to request locks on marketplace listings, which admins then review and approve or reject. This provides controlled access to listings before payment integration is complete.

## Architecture

### Database Schema

The `lock_requests` table stores all lock requests with the following key fields:

- `listingId` - Reference to the listing being requested
- `requestedBy` - User ID of the investor making the request
- `status` - One of: `pending`, `approved`, `rejected`, `expired`
- `requestedAt` - Timestamp when request was created
- `reviewedAt` - Timestamp when admin reviewed (optional)
- `reviewedBy` - Admin user ID who reviewed (optional)
- `rejectionReason` - Optional reason for rejection
- `requestNotes` - Optional notes from investor (max 1000 characters)
- `lawyerName`, `lawyerLSONumber`, `lawyerEmail` - Required lawyer information

### Key Indexes

- `by_listing` - Fast lookup of all requests for a listing
- `by_status` - Fast filtering by status
- `by_requested_by` - Fast lookup of user's requests
- `by_status_requested_at` - Compound index for sorted status queries
- `by_listing_status` - Compound index for listing + status queries

## Workflow

### Investor Flow

1. **View Listing**: Investor browses marketplace and finds a listing
2. **Request Lock**: Investor clicks "Request to Lock Listing" button
3. **Fill Form**: Investor provides:
   - Optional notes (max 1000 characters)
   - Lawyer name (required)
   - Lawyer LSO number (required)
   - Lawyer email (required, validated format)
4. **Submit**: Request is created with status `pending`
5. **Wait for Review**: Request appears in admin dashboard
6. **Status Updates**: Investor sees real-time status updates:
   - `pending` - Awaiting admin review (can cancel)
   - `approved` - Listing is locked for this investor
   - `rejected` - Request was rejected (with optional reason)

### Admin Flow

1. **View Dashboard**: Admin navigates to `/dashboard/admin/lock-requests`
2. **Review Pending**: Admin sees all pending requests in "Pending" tab
3. **Review Details**: Admin can see:
   - Listing information (address, property type, market value)
   - Mortgage details (loan amount, APR, LTV)
   - Borrower information
   - Investor information
   - Lawyer information
   - Request notes
   - Other pending requests for same listing
4. **Approve or Reject**:
   - **Approve**: Locks listing for the investor, sets status to `approved`
   - **Reject**: Keeps listing available, sets status to `rejected` (with optional reason)
5. **History**: Admin can view approved/rejected requests in respective tabs

## Key Features

### Multiple Pending Requests

The system allows multiple investors to request the same listing simultaneously. Admins can see all pending requests and choose which one to approve. This provides flexibility without requiring queue management.

### Atomic Transactions

The `approveLockRequest` mutation uses atomic transactions to prevent race conditions:

- Reads request and listing together in single transaction
- Verifies listing is still available before updating
- If listing was locked by another admin, throws error instead of double-locking
- Only one approval can succeed per listing

**Example Race Condition Handling:**
```typescript
try {
  await approveLockRequest({ requestId: "..." });
} catch (error) {
  // Error: "Listing is no longer available"
  // Another admin approved a different request simultaneously
}
```

### Real-time Updates

All components use Convex React hooks (`useQuery`) for automatic real-time updates:

- Admin dashboard updates when new requests are created
- Investor sees status updates when admin approves/rejects
- No manual refresh needed
- No polling required

### Authorization

- **Create Request**: Requires `investor` role (admins can also create for testing)
- **Approve/Reject**: Requires `admin` role
- **Cancel Request**: User must own the request (`requestedBy === current user`)
- **Direct Lock**: `lockListing` mutation is admin-only (bypasses approval workflow)

### Listing Deletion Protection

Listings cannot be deleted if they have any lock requests (pending, approved, or rejected). This maintains audit trail and prevents orphaned requests. Admins must delete requests first before deleting listings.

## API Reference

### Mutations

#### `createLockRequest`

Creates a new lock request for a listing.

**Authorization**: Investor role required (admins can also create)

**Parameters**:
- `listingId` - ID of the listing
- `requestNotes` - Optional notes (max 1000 chars)
- `lawyerName` - Lawyer name (required)
- `lawyerLSONumber` - Lawyer LSO number (required)
- `lawyerEmail` - Lawyer email (required, validated)

**Returns**: Request ID

**Errors**:
- "Unauthorized: Investor role required"
- "Listing is already locked"
- "Listing is not visible"
- "Request notes exceed character limit of 1000"

#### `approveLockRequest`

Approves a lock request and locks the listing (atomic transaction).

**Authorization**: Admin role required

**Parameters**:
- `requestId` - ID of the request to approve

**Returns**: Request ID

**Errors**:
- "Unauthorized: Admin privileges required"
- "Request is not pending"
- "Listing is no longer available" (race condition)

#### `rejectLockRequest`

Rejects a lock request (listing remains available).

**Authorization**: Admin role required

**Parameters**:
- `requestId` - ID of the request to reject
- `rejectionReason` - Optional reason

**Returns**: Request ID

**Errors**:
- "Unauthorized: Admin privileges required"
- "Request is not pending"

#### `cancelLockRequest`

Cancels a pending request (investor can cancel their own).

**Authorization**: User must own the request

**Parameters**:
- `requestId` - ID of the request to cancel

**Returns**: Request ID

**Errors**:
- "Unauthorized: Not your request"
- "Request is not pending"

### Queries

#### `getPendingLockRequestsWithDetails`

Gets all pending requests with joined data (listing, mortgage, borrower, investor).

**Use Case**: Admin dashboard pending tab

**Returns**: Array of requests with full details

#### `getApprovedLockRequestsWithDetails`

Gets all approved requests with joined data.

**Use Case**: Admin dashboard approved tab

**Returns**: Array of approved requests with full details

#### `getRejectedLockRequestsWithDetails`

Gets all rejected requests with joined data.

**Use Case**: Admin dashboard rejected tab

**Returns**: Array of rejected requests with full details

#### `getLockRequestsByListing`

Gets all requests for a specific listing.

**Use Case**: Show request history for a listing

**Parameters**:
- `listingId` - ID of the listing

**Returns**: Array of requests

#### `getPendingLockRequestsByListing`

Gets count of pending requests for a listing.

**Use Case**: Show "X other pending requests" indicator

**Parameters**:
- `listingId` - ID of the listing

**Returns**: Number of pending requests

#### `getUserLockRequests`

Gets all requests created by the current user.

**Use Case**: Investor's request history

**Returns**: Array of user's requests

## Error Handling

### Common Errors

1. **"Listing is already locked"**
   - **Cause**: Listing was locked by another request or admin
   - **Solution**: Show "Locked" badge, disable request button

2. **"Listing is no longer available"** (Race Condition)
   - **Cause**: Another admin approved a different request simultaneously
   - **Solution**: Show error message, refresh dashboard

3. **"Unauthorized: Not your request"**
   - **Cause**: User trying to cancel someone else's request
   - **Solution**: Only show cancel button for user's own requests

4. **"Request notes exceed character limit of 1000"**
   - **Cause**: Notes field too long
   - **Solution**: Show character counter, disable submit

## Testing

### Unit Tests

- `createLockRequest` validation and authorization
- `approveLockRequest` atomic transaction and race conditions
- `rejectLockRequest` authorization
- `cancelLockRequest` ownership validation

### Integration Tests

- Listing deletion prevention with requests
- Multiple pending requests per listing
- Request status lifecycle

### E2E Tests

- Investor creates lock request
- Admin approves/rejects request
- Real-time status updates
- Authorization checks

## Future Enhancements (Phase 2)

- Automatic request expiration after configurable timeout
- Email notifications for approval/rejection
- Bulk approve/reject actions
- Request prioritization/queuing
- Payment integration (PayPal gating)
- Request comments/threading

## Related Documentation

- [Lock Listing Request Brainstorm](./LOCK_LISTING_REQUEST_BRAINSTORM.md)
- [Lock Listing Request Questions](./LOCK_LISTING_REQUEST_QUESTIONS.md)
- [OpenSpec Change Proposal](../openspec/changes/add-lock-listing-request-approval-workflow/proposal.md)


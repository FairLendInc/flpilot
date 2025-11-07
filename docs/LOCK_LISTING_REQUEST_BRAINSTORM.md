# Lock Listing Request Feature - Brainstorming & Requirements

## Overview

This document outlines the requirements and design for a **Lock Listing Request** feature that allows investors to request to lock a listing, which admins then approve. This is an interim solution before implementing PayPal payment gating.

## Current State Analysis

### Existing Schema
- **`listings` table** already has:
  - `locked: boolean` - Current lock state
  - `lockedBy: Id<"users">` - User who locked (optional)
  - `lockedAt: number` - Timestamp when locked (optional)
- **Current flow**: Direct lock via `lockListing` mutation (no approval process)

### Existing Admin Infrastructure
- Admin dashboard at `/dashboard/admin`
- Admin listings page at `/dashboard/admin/listings` (currently placeholder)
- RBAC authentication via WorkOS (`hasRbacAccess` helper)
- Admin navigation structure in place

### Data Relationships
- **Listing** → references `mortgageId` → **Mortgage**
- **Mortgage** → references `borrowerId` → **Borrower**
- **Listing** → `lockedBy` → **User** (investor who locked)
- **Users** table contains platform users (investors, admins, etc.)

## Feature Requirements

### Phase 1: Lock Request System (Current Focus)

#### 1.1 Database Schema

**New Table: `lock_requests`**

```typescript
lock_requests: defineTable({
  // Reference to listing being requested
  listingId: v.id("listings"),
  // Investor requesting the lock
  requestedBy: v.id("users"),
  // Request status
  status: v.union(
    v.literal("pending"),    // Awaiting admin approval
    v.literal("approved"),   // Admin approved, listing locked
    v.literal("rejected"),   // Admin rejected
    v.literal("expired")     // Request expired (future: auto-expire after X days)
  ),
  // Timestamps
  requestedAt: v.number(),   // When request was created
  reviewedAt: v.optional(v.number()), // When admin reviewed
  reviewedBy: v.optional(v.id("users")), // Admin who reviewed
  // Optional rejection reason
  rejectionReason: v.optional(v.string()),
  // Optional notes from investor (max 1000 characters)
  requestNotes: v.optional(v.string()),
})
  .index("by_listing", ["listingId"])
  .index("by_status", ["status"])
  .index("by_requested_by", ["requestedBy"])
  .index("by_status_requested_at", ["status", "requestedAt"]) // For admin queries
  .index("by_listing_status", ["listingId", "status"]) // For finding pending requests per listing
```

**Schema Considerations:**
- **Decision**: Allow MULTIPLE pending requests per listing
- Multiple investors can request the same listing simultaneously
- Admin selects which request to approve
- Once a listing is locked, other pending requests remain (admin can see them but can't approve)
- Atomic updates prevent race conditions when multiple admins approve different requests
- Request notes: Optional, max 1000 characters (enforced in application logic)

#### 1.2 Backend Functions (Convex)

**File: `convex/lockRequests.ts`**

**Queries:**
1. `getLockRequest` - Get single request by ID
2. `getPendingLockRequests` - Admin: Get all pending requests
3. `getPendingLockRequestsWithDetails` - Admin: Get all pending requests with joined data
4. `getApprovedLockRequests` - Admin: Get all approved requests
5. `getApprovedLockRequestsWithDetails` - Admin: Get all approved requests with joined data
6. `getRejectedLockRequests` - Admin: Get all rejected requests
7. `getRejectedLockRequestsWithDetails` - Admin: Get all rejected requests with joined data
8. `getLockRequestsByListing` - Get all requests (any status) for a listing
9. `getPendingLockRequestsByListing` - Get all pending requests for a listing
10. `getUserLockRequests` - Get all requests by an investor
11. `getLockRequestWithDetails` - Get single request with joined listing/mortgage/borrower/user data

**Mutations:**
1. `createLockRequest` - Investor creates a lock request
   - Validates listing exists and is available (visible && !locked)
   - Validates user is authenticated investor (has "investor" role via `hasRbacAccess`)
   - Admins can also create requests (useful for testing)
   - Validates request notes (if provided) are <= 1000 characters
   - Creates request with status "pending"
   - **Allows multiple pending requests per listing** (admin selects which to approve)
   
2. `approveLockRequest` - Admin approves request
   - Validates admin authorization (has "admin" role via `hasRbacAccess`)
   - Validates request is pending
   - **Atomic update**: Uses Convex transaction to prevent race conditions
     - **Step 1**: Read listing and request in same transaction
     - **Step 2**: Verify listing is still available (visible && !locked)
     - **Step 3**: Verify request is still pending (status === "pending")
     - **Step 4**: If both checks pass, atomically:
       - Update request status to "approved"
       - Set `reviewedAt` and `reviewedBy`
       - Lock the listing (set `locked: true`, `lockedBy`, `lockedAt`)
     - **Step 5**: If any check fails, throw error with clear message
   - **Race condition handling**: If two admins approve different requests simultaneously, only one succeeds
   - Other pending requests remain pending (can't be approved after listing locks)
   
3. `rejectLockRequest` - Admin rejects request
   - Validates admin authorization
   - Validates request is pending
   - Updates request status to "rejected"
   - Sets `reviewedAt`, `reviewedBy`, and `rejectionReason`
   - **Does NOT lock the listing**

4. `cancelLockRequest` - Investor cancels their own pending request
   - Validates user owns the request
   - Validates request is pending
   - Deletes request (or marks as cancelled if we want audit trail)
   - **Note**: If listing is already locked, investor can still cancel their pending request

**Business Rules:**
- Only users with "investor" role can create lock requests (checked via `hasRbacAccess({ required_roles: ["investor"] })`)
- Admins can also create lock requests (useful for testing)
- Only users with "admin" role can approve/reject (checked via `hasRbacAccess({ required_roles: ["admin"] })`)
- Admins can also directly lock listings using existing `lockListing` mutation (bypass approval workflow)
- Listing must be visible and unlocked to create request
- **Multiple pending requests per listing allowed** - Admin selects which to approve
- Once approved, listing becomes locked and unavailable for new requests
- Other pending requests remain pending (can't be approved after listing is locked)
- Rejected requests don't lock the listing
- **Atomic updates prevent race conditions**: When multiple admins approve different requests simultaneously, only one succeeds
- Request notes: Optional, max 1000 characters (enforced in validation)
- Request cancellation: Investors can cancel their own pending requests
- Listing deletion: Prevented if any requests exist (pending, approved, or rejected) - must delete requests first
- Locked listings: Show "Locked" badge in listings page (visible to all users)

#### 1.3 Frontend: Investor Lock Request Flow

**Location**: Listing detail page (`app/(auth)/listings/[id]/page.tsx`)

**UI Components:**
1. **Lock Request Button**
   - Only shown if listing is available (visible && !locked)
   - Only shown to authenticated users with "investor" role (or admins for testing)
   - Button: "Request to Lock Listing"
   - **Note**: If listing is locked, show "Locked" badge instead (see Q3 decision)
   
2. **Lock Request Modal/Dialog**
   - Form with optional notes field (max 1000 characters)
   - Character counter showing remaining characters
   - Confirmation message explaining approval process
   - Submit button: "Submit Lock Request"
   - On success: Show toast "Lock request submitted. Admin will review."
   
3. **Request Status Display**
   - If user has pending request: Show "Lock request pending admin approval" with cancel button
   - If user has approved request: Show "Listing locked by you"
   - If user has rejected request: Show "Lock request rejected" (with reason if provided)
   - If listing is locked by another user: Show "Locked" badge (visible to all users)

**User Flow:**
1. Investor views listing detail page
2. Clicks "Request to Lock Listing"
3. Fills optional notes (e.g., "Interested in purchasing 50%")
4. Submits request
5. Request appears in admin dashboard for approval
6. Admin approves/rejects
7. Investor sees status update

#### 1.4 Frontend: Admin Approval Dashboard

**Location**: `/dashboard/admin/lock-requests` (new page)

**Page Structure:**
```
/dashboard/admin/lock-requests/page.tsx
```

**UI Components:**

1. **Lock Requests Tabs**
   - **Pending Tab**: Shows all pending requests (default view)
   - **Approved Tab**: Shows all approved requests
   - **Rejected Tab**: Shows all rejected requests
   - Each tab shows count badge (e.g., "Pending (5)")

2. **Lock Requests Table** (within each tab)
   - Columns:
     - Request ID / Date
     - Listing Address (with link to listing)
     - **Lock Status** - Shows if listing is already locked (important for pending tab)
     - Investor Name & Email
     - Borrower Name & Email
     - Mortgage Details (Loan Amount, LTV, APR)
     - Request Notes (truncated, expandable)
     - Status Badge
     - Actions (Approve / Reject buttons - disabled if listing already locked)
   
3. **Request Detail View** (Modal or expandable row)
   - **Listing Information:**
     - Property address (full)
     - Property type
     - Images (thumbnail)
     - Market value
     - LTV
     - **Lock Status** - Shows if listing is currently locked and by whom
   
   - **Mortgage Information:**
     - Loan amount
     - Interest rate (APR)
     - Origination date
     - Maturity date
     - Mortgage type (1st, 2nd, other)
     - Status
   
   - **Borrower Information:**
     - Name
     - Email
     - Rotessa Customer ID
   
   - **Investor Information:**
     - Name (first_name + last_name)
     - Email
     - User ID
     - Account creation date
   
   - **Request Details:**
     - Request date/time
     - Request notes (full text, max 1000 chars)
     - Status
     - **Warning**: If listing is already locked, show warning that approval will fail
   
   - **Other Pending Requests** (for same listing)
     - Show count: "X other pending requests for this listing"
     - Link to view all pending requests for this listing
   
   - **Actions:**
     - Approve button (green) - Disabled if listing already locked
     - Reject button (red) - opens rejection reason dialog
     - View Full Listing link

4. **Filters & Search** (within each tab)
   - Search by investor name/email
   - Search by property address
   - Filter by listing lock status (for pending tab: show locked/unlocked)
   - Sort by request date (newest first)

5. **Bulk Actions** (Future - Phase 2)
   - Select multiple requests
   - Bulk approve/reject

**Admin Flow:**
1. Admin navigates to `/dashboard/admin/lock-requests`
2. Defaults to "Pending" tab showing all pending requests
3. Sees multiple pending requests per listing (if applicable)
4. Clicks on request to expand details
5. Reviews all information (listing, mortgage, borrower, investor)
6. Sees warning if listing is already locked (can't approve)
7. Sees count of other pending requests for same listing
8. Selects which request to approve (admin's choice)
9. Clicks "Approve" or "Reject"
10. If reject: Enters optional rejection reason
11. Atomic update prevents race conditions (if another admin approved simultaneously, shows error)
12. Request status updates
13. Listing locks (if approved) or remains available (if rejected)
14. Other pending requests remain pending (can't be approved after listing locks)
15. Investor sees status update

#### 1.5 Navigation Updates

**Admin Navigation** (`lib/navigation/role-navigation.ts`):
- Add new menu item: "Lock Requests" → `/dashboard/admin/lock-requests`
- Icon: `Lock` or `Clock` from lucide-react
- Position: After "Listings", before "Settings"

**Investor Navigation**:
- No new menu item needed
- Lock request is accessible from listing detail page

### Phase 2: Future PayPal Integration (Not in Scope)

When PayPal payment is implemented:
- Lock request creation will require payment
- Payment confirmation will auto-approve request
- Admin dashboard will show payment status
- Rejected requests may trigger refunds

## Technical Implementation Details

### Data Fetching Pattern

**Admin Dashboard Queries:**
```typescript
// Get all pending requests with full details
const pendingRequests = await ctx.runQuery(api.lockRequests.getPendingLockRequestsWithDetails);

// Get all approved requests with full details
const approvedRequests = await ctx.runQuery(api.lockRequests.getApprovedLockRequestsWithDetails);

// Get all rejected requests with full details
const rejectedRequests = await ctx.runQuery(api.lockRequests.getRejectedLockRequestsWithDetails);

// Returns for each:
{
  request: LockRequest,
  listing: Listing,
  mortgage: Mortgage,
  borrower: Borrower,
  investor: User,
  listingLocked: boolean, // Whether listing is currently locked
}[]
```

**Investor Query:**
```typescript
// Get user's lock requests
const myRequests = await ctx.runQuery(api.lockRequests.getUserLockRequests, {
  userId: currentUser._id
});
```

### Error Handling

**Create Request Errors:**
- "Listing not found"
- "Listing is already locked"
- "Listing is not visible"
- "Unauthorized: Investor role required"
- "Request notes exceed 1000 character limit"

**Approve/Reject Errors:**
- "Request not found"
- "Request is not pending"
- "Listing is no longer available" (already locked or not visible)
- "Unauthorized: Admin privileges required"
- "Race condition detected: Listing was locked by another admin" (atomic update failure)
- "Race condition detected: Request was already processed" (atomic update failure)

### State Management

**React Query / Convex React:**
- Use Convex React hooks for reactive data
- Auto-refresh when requests are approved/rejected
- Optimistic updates for better UX

### Notifications (Future)

- Email notification to investor when request approved/rejected
- Email notification to admin when new request created
- In-app notifications

## Final Decisions Summary

### ✅ Q1: Multiple Pending Requests
**Decision**: **Multiple pending requests allowed**
- Multiple investors can request the same listing simultaneously
- Admin selects which request to approve
- Other pending requests remain pending after approval (can't be approved)
- Admin UI shows all pending requests with lock status indicators
- Atomic updates prevent race conditions when multiple admins approve different requests

### ✅ Q2: Request Expiration
**Decision**: **No expiration in Phase 1**
- Admin manually reviews all requests
- No automatic cleanup needed
- Can add expiration in Phase 2 if needed

### ✅ Q3: Rejection Reason Required
**Decision**: **Optional reason**
- Faster admin workflow
- Some rejections may not need explanation
- Can encourage providing reason in UI

### ✅ Q4: Request History
**Decision**: **Keep all requests**
- Audit trail for compliance
- Analytics potential
- Minimal storage cost
- Important for understanding investor interest patterns

### ✅ Q5: Listing Detail Page Updates
**Decision**: **Show locked badge on listings**
- Locked listings appear in listings page with "Locked" badge
- All users can see locked listings (not hidden)
- Clear visual indicator of lock status
- Investors can see which listings are locked by others

### ✅ Q6: Investor Role Identification
**Decision**: **Check for "investor" role**
- Use `hasRbacAccess({ required_roles: ["investor"] })`
- Admins can also create requests (for testing)

### ✅ Q7: Existing `lockListing` Mutation
**Decision**: **Keep for admin use only**
- Admins can bypass approval workflow
- Useful for urgent cases or testing
- Document as admin-only feature

### ✅ Q8: Admin Multi-Role Access
**Decision**: **Admins can do both**
- Admins can create lock requests (useful for testing)
- Admins can directly lock listings (bypass approval)
- Full flexibility for admin users

### ✅ Q9: Request Cancellation
**Decision**: **Yes, investors can cancel**
- Investors can cancel their own pending requests
- Better UX and flexibility

### ✅ Q10: Admin Dashboard Default View
**Decision**: **Tabs for Pending/Approved/Rejected**
- Three tabs: Pending (default), Approved, Rejected
- Each tab shows count badge
- Clear organization of requests

### ✅ Q11: Request Notes Validation
**Decision**: **1000 character limit, not required**
- Optional field
- Max 1000 characters
- Character counter in UI

### ✅ Q12: Listing Deletion Edge Case
**Decision**: **Prevent deletion if requests exist**
- Cannot delete listing if any requests exist (pending, approved, or rejected)
- Must delete requests first
- Maintains data integrity

### ✅ Q13: Race Condition Prevention
**Decision**: **Atomic updates required**
- Use Convex transactions for atomic updates
- Prevent two admins approving different requests simultaneously
- Clear error messages for race condition failures

## Implementation Checklist

### Backend (Convex)
- [ ] Add `lock_requests` table to schema
- [ ] Create `convex/lockRequests.ts` file
- [ ] Implement `createLockRequest` mutation (with investor role check, 1000 char limit)
- [ ] Implement `approveLockRequest` mutation (with atomic updates for race condition prevention)
- [ ] Implement `rejectLockRequest` mutation
- [ ] Implement `cancelLockRequest` mutation
- [ ] Implement `getPendingLockRequests` query
- [ ] Implement `getPendingLockRequestsWithDetails` query
- [ ] Implement `getApprovedLockRequests` query
- [ ] Implement `getApprovedLockRequestsWithDetails` query
- [ ] Implement `getRejectedLockRequests` query
- [ ] Implement `getRejectedLockRequestsWithDetails` query
- [ ] Implement `getLockRequestsByListing` query
- [ ] Implement `getPendingLockRequestsByListing` query
- [ ] Implement `getUserLockRequests` query
- [ ] Implement `getLockRequestWithDetails` query
- [ ] Update `lockListing` mutation documentation (admin-only, bypasses approval)
- [ ] Update `deleteListing` mutation to prevent deletion if requests exist
- [ ] Add validation logic for request creation (investor role, 1000 char limit)
- [ ] Add admin authorization checks (for approve/reject)
- [ ] Add atomic update logic to prevent race conditions

### Frontend: Admin Dashboard
- [ ] Create `/dashboard/admin/lock-requests/page.tsx`
- [ ] Create `LockRequestsTabs` component (Pending/Approved/Rejected)
- [ ] Create `LockRequestsTable` component (for each tab)
- [ ] Create `LockRequestDetail` component/modal
- [ ] Create `ApproveLockRequestButton` component (with atomic update error handling)
- [ ] Create `RejectLockRequestDialog` component
- [ ] Add "Other Pending Requests" indicator in detail view
- [ ] Add listing lock status indicator in table
- [ ] Add navigation menu item ("Lock Requests")
- [ ] Add filters and search (within each tab)
- [ ] Add loading states
- [ ] Add error handling (especially race condition errors)
- [ ] Add empty states for each tab
- [ ] Add request count badges on tabs

### Frontend: Investor Flow
- [ ] Update listing detail page to show lock request button (only if available)
- [ ] Update listings page to show "Locked" badge on locked listings
- [ ] Create `LockRequestDialog` component (with 1000 char limit and counter)
- [ ] Create `LockRequestStatus` component (shows pending/approved/rejected status)
- [ ] Add request creation flow
- [ ] Add cancel request button (for pending requests)
- [ ] Add status display
- [ ] Add toast notifications
- [ ] Handle error states (especially "already locked" errors)

### Testing
- [ ] Unit tests for backend functions
- [ ] Integration tests for request flow
- [ ] E2E tests for admin approval workflow
- [ ] E2E tests for investor request creation

### Documentation
- [ ] Update API documentation
- [ ] Update admin user guide
- [ ] Update investor user guide
- [ ] Add OpenSpec change proposal (if required)

## Success Metrics

- **Admin Efficiency**: Time to approve/reject requests
- **Investor Satisfaction**: Request approval rate
- **System Health**: Request processing time
- **Data Quality**: Rejection reasons provided

## Future Enhancements

1. **Email Notifications**: Notify investors of approval/rejection
2. **Request Expiration**: Auto-expire stale requests
3. **Bulk Actions**: Approve/reject multiple requests
4. **Request Priority**: Priority queue for VIP investors
5. **Analytics Dashboard**: Request metrics and trends
6. **PayPal Integration**: Payment-gated lock requests
7. **Request Comments**: Threaded comments on requests
8. **SLA Tracking**: Track time to approval

## Related Files

- `convex/schema.ts` - Database schema
- `convex/listings.ts` - Listing management
- `convex/mortgages.ts` - Mortgage data
- `convex/borrowers.ts` - Borrower data
- `app/dashboard/admin/listings/page.tsx` - Admin listings page
- `app/(auth)/listings/[id]/page.tsx` - Listing detail page
- `lib/navigation/role-navigation.ts` - Navigation structure


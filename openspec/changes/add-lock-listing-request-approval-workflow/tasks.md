# Implementation Tasks - Lock Listing Request Approval Workflow

## 1. Backend Schema and Core Functions

- [x] 1.1 Add `lock_requests` table to `convex/schema.ts`
  - [x] 1.1.1 Define table with fields: listingId, requestedBy, status, requestedAt, reviewedAt, reviewedBy, rejectionReason, requestNotes
  - [x] 1.1.2 Add by_listing index on listingId
  - [x] 1.1.3 Add by_status index on status
  - [x] 1.1.4 Add by_requested_by index on requestedBy
  - [x] 1.1.5 Add by_status_requested_at compound index [status, requestedAt]
  - [x] 1.1.6 Add by_listing_status compound index [listingId, status]
  - [x] 1.1.7 Run `npx convex dev` to apply schema changes

- [x] 1.2 Create `convex/lockRequests.ts` with request management functions
  - [x] 1.2.1 Implement `createLockRequest` mutation (investor role check, 1000 char validation)
  - [x] 1.2.2 Implement `approveLockRequest` mutation (atomic transaction, race condition prevention)
  - [x] 1.2.3 Implement `rejectLockRequest` mutation (admin authorization)
  - [x] 1.2.4 Implement `cancelLockRequest` mutation (ownership validation)
  - [x] 1.2.5 Implement `getLockRequest` query (single request by ID)
  - [x] 1.2.6 Implement `getPendingLockRequests` query (admin dashboard)
  - [x] 1.2.7 Implement `getPendingLockRequestsWithDetails` query (joined data: listing, mortgage, borrower, investor)
  - [x] 1.2.8 Implement `getApprovedLockRequests` query (admin history)
  - [x] 1.2.9 Implement `getApprovedLockRequestsWithDetails` query (joined data)
  - [x] 1.2.10 Implement `getRejectedLockRequests` query (admin history)
  - [x] 1.2.11 Implement `getRejectedLockRequestsWithDetails` query (joined data)
  - [x] 1.2.12 Implement `getLockRequestsByListing` query (all requests for listing)
  - [x] 1.2.13 Implement `getPendingLockRequestsByListing` query (pending count display)
  - [x] 1.2.14 Implement `getUserLockRequests` query (investor's own requests)
  - [x] 1.2.15 Implement `getLockRequestWithDetails` query (single request with joined data)

- [x] 1.3 Update `convex/listings.ts` for admin-only lock and request validation
  - [x] 1.3.1 Add admin authorization check to `lockListing` mutation (hasRbacAccess)
  - [x] 1.3.2 Document `lockListing` as admin-only, bypass approval workflow
  - [x] 1.3.3 Update `deleteListing` to check for existing lock requests
  - [x] 1.3.4 Add helper query to count pending requests for listing
  - [x] 1.3.5 Add validation logic to prevent deletion if requests exist

- [x] 1.4 Add validation helpers and error messages
  - [x] 1.4.1 Create validation function for request notes (1000 char limit)
  - [x] 1.4.2 Create validation function for listing availability (visible && !locked)
  - [x] 1.4.3 Define error message constants for clarity
  - [x] 1.4.4 Add logging for all request operations

## 2. Backend Testing

- [ ] 2.1 Unit tests for `convex/lockRequests.ts`
  - [ ] 2.1.1 Test createLockRequest with valid investor
  - [ ] 2.1.2 Test createLockRequest validation errors (locked listing, hidden listing, notes too long)
  - [ ] 2.1.3 Test createLockRequest authorization (investor role, admin can create)
  - [ ] 2.1.4 Test approveLockRequest atomic transaction
  - [ ] 2.1.5 Test approveLockRequest race condition (two admins approve simultaneously)
  - [ ] 2.1.6 Test approveLockRequest validation (listing already locked, request not pending)
  - [ ] 2.1.7 Test rejectLockRequest with optional reason
  - [ ] 2.1.8 Test rejectLockRequest authorization (admin only)
  - [ ] 2.1.9 Test cancelLockRequest ownership validation
  - [ ] 2.1.10 Test cancelLockRequest for pending vs non-pending requests

- [ ] 2.2 Query tests for `convex/lockRequests.ts`
  - [ ] 2.2.1 Test getPendingLockRequests filtering
  - [ ] 2.2.2 Test getPendingLockRequestsWithDetails joins
  - [ ] 2.2.3 Test getApprovedLockRequests filtering
  - [ ] 2.2.4 Test getRejectedLockRequests filtering
  - [ ] 2.2.5 Test getLockRequestsByListing index usage
  - [ ] 2.2.6 Test getPendingLockRequestsByListing compound index
  - [ ] 2.2.7 Test getUserLockRequests filtering by requestedBy

- [ ] 2.3 Integration tests for listing-request relationship
  - [ ] 2.3.1 Test listing deletion prevention with pending requests
  - [ ] 2.3.2 Test listing deletion prevention with approved requests
  - [ ] 2.3.3 Test listing deletion prevention with rejected requests
  - [ ] 2.3.4 Test successful deletion after cleaning up requests
  - [ ] 2.3.5 Test multiple pending requests per listing
  - [ ] 2.3.6 Test auto-reject pending requests on lock (if implemented)

## 3. Frontend: Admin Dashboard

- [x] 3.1 Create admin lock requests page structure
  - [x] 3.1.1 Create `app/dashboard/admin/lock-requests/page.tsx`
  - [x] 3.1.2 Set up page layout with three tabs (Pending, Approved, Rejected)
  - [x] 3.1.3 Add page title "Lock Requests" with description
  - [x] 3.1.4 Add tab count badges (e.g., "Pending (5)")
  - [x] 3.1.5 Implement tab navigation and state management

- [x] 3.2 Create LockRequestsTable component (used in each tab)
  - [x] 3.2.1 Create `components/admin/lock-requests/LockRequestsTable.tsx` (created at `app/dashboard/admin/lock-requests/components/LockRequestsTable.tsx`)
  - [x] 3.2.2 Define table columns: Request ID/Date, Listing Address, Lock Status, Investor, Borrower, Mortgage Details, Notes, Status, Actions
  - [x] 3.2.3 Implement lock status indicator (show if listing already locked)
  - [x] 3.2.4 Add truncated notes with expandable view
  - [x] 3.2.5 Add approve/reject action buttons (disabled if listing locked)
  - [x] 3.2.6 Implement sorting (by requestedAt, newest first)
  - [x] 3.2.7 Add loading skeleton states
  - [x] 3.2.8 Add empty state ("No requests found")

- [ ] 3.3 Create LockRequestDetail component (modal or expandable row)
  - [ ] 3.3.1 Create `components/admin/lock-requests/LockRequestDetail.tsx`
  - [ ] 3.3.2 Display listing information (address, property type, images, market value, LTV, lock status)
  - [ ] 3.3.3 Display mortgage information (loan amount, APR, origination, maturity, type, status)
  - [ ] 3.3.4 Display borrower information (name, email, Rotessa customer ID)
  - [ ] 3.3.5 Display investor information (name, email, user ID, account creation date)
  - [ ] 3.3.6 Display request details (date, notes, status)
  - [ ] 3.3.7 Show warning if listing already locked ("Approval will fail")
  - [ ] 3.3.8 Show count of other pending requests ("X other pending requests")
  - [ ] 3.3.9 Add approve button (green, disabled if locked)
  - [ ] 3.3.10 Add reject button (red, opens rejection dialog)
  - [ ] 3.3.11 Add "View Full Listing" link
  **Note:** Basic table implementation complete. Detail view can be added later.

- [x] 3.4 Create ApproveLockRequestButton component
  - [x] 3.4.1 Create `components/admin/lock-requests/ApproveLockRequestButton.tsx` (integrated into LockRequestsTable)
  - [x] 3.4.2 Implement confirmation dialog ("Approve lock request?")
  - [x] 3.4.3 Call `approveLockRequest` mutation
  - [x] 3.4.4 Handle atomic update errors (race condition: "Listing was locked by another admin")
  - [x] 3.4.5 Show success toast ("Request approved, listing locked")
  - [x] 3.4.6 Show error toast with specific message
  - [x] 3.4.7 Disable button if listing already locked
  - [x] 3.4.8 Add loading state during approval

- [x] 3.5 Create RejectLockRequestDialog component
  - [x] 3.5.1 Create `components/admin/lock-requests/RejectLockRequestDialog.tsx` (integrated into LockRequestsTable)
  - [x] 3.5.2 Add optional rejection reason textarea
  - [x] 3.5.3 Add character counter (optional, no limit)
  - [x] 3.5.4 Call `rejectLockRequest` mutation
  - [x] 3.5.5 Show success toast ("Request rejected")
  - [x] 3.5.6 Show error toast if rejection fails
  - [x] 3.5.7 Add loading state during rejection

- [ ] 3.6 Add filters and search to admin dashboard
  - [ ] 3.6.1 Add search by investor name/email (client-side filter)
  - [ ] 3.6.2 Add search by property address (client-side filter)
  - [ ] 3.6.3 Add filter by listing lock status (for pending tab: locked/unlocked)
  - [ ] 3.6.4 Add sort controls (by date, investor, listing)
  - [ ] 3.6.5 Persist filter/search state in URL params (optional)
  **Note:** Basic table complete. Filters can be added as enhancement.

- [ ] 3.7 Add "Other Pending Requests" indicator in detail view
  - [ ] 3.7.1 Query pending requests count for same listing
  - [ ] 3.7.2 Display "X other pending requests for this listing"
  - [ ] 3.7.3 Add link to view all pending requests for listing (filter table)
  - [ ] 3.7.4 Update count reactively when requests change
  **Note:** Can be added when detail view is implemented.

- [x] 3.8 Add navigation menu item for Lock Requests
  - [x] 3.8.1 Update `lib/navigation/role-navigation.ts` (or similar)
  - [x] 3.8.2 Add "Lock Requests" menu item under admin section
  - [x] 3.8.3 Use `Lock` or `Clock` icon from lucide-react
  - [x] 3.8.4 Position after "Listings", before "Settings"
  - [ ] 3.8.5 Add badge with pending request count (optional)

## 4. Frontend: Investor Flow

- [x] 4.1 Update listing detail page for investors
  - [x] 4.1.1 Update `app/(auth)/listings/[id]/page.tsx`
  - [x] 4.1.2 Add "Request to Lock Listing" button (only if listing available)
  - [x] 4.1.3 Hide button if listing is locked or hidden
  - [x] 4.1.4 Hide button if user is not investor role
  - [x] 4.1.5 Show "Locked" badge if listing is locked (visible to all users)
  - [x] 4.1.6 Query investor's pending request for this listing
  - [x] 4.1.7 Show "Request Pending" status if investor has pending request
  - [x] 4.1.8 Add cancel button if investor has pending request

- [x] 4.2 Create LockRequestDialog component
  - [x] 4.2.1 Create `components/listing-detail/LockRequestDialog.tsx`
  - [x] 4.2.2 Add optional request notes textarea (max 1000 characters)
  - [x] 4.2.3 Add character counter showing remaining characters (1000 - length)
  - [x] 4.2.4 Add confirmation message explaining approval process
  - [x] 4.2.5 Implement "Submit Lock Request" button
  - [x] 4.2.6 Call `createLockRequest` mutation
  - [x] 4.2.7 Handle validation errors (listing locked, notes too long)
  - [x] 4.2.8 Show success toast ("Lock request submitted. Admin will review.")
  - [x] 4.2.9 Show error toast with specific message
  - [x] 4.2.10 Add loading state during submission

- [x] 4.3 Create LockRequestStatus component
  - [x] 4.3.1 Create `components/listing-detail/LockRequestStatus.tsx`
  - [x] 4.3.2 Show "Lock request pending admin approval" with cancel button (if pending)
  - [x] 4.3.3 Show "Listing locked by you" (if approved)
  - [x] 4.3.4 Show "Lock request rejected" with reason (if rejected)
  - [x] 4.3.5 Show "Locked" badge if listing locked by another user (visible to all)
  - [x] 4.3.6 Update reactively when status changes (Convex React hooks)

- [x] 4.4 Create CancelLockRequestButton component
  - [x] 4.4.1 Create `components/listing-detail/CancelLockRequestButton.tsx` (integrated into LockRequestStatus)
  - [x] 4.4.2 Add confirmation dialog ("Cancel lock request?")
  - [x] 4.4.3 Call `cancelLockRequest` mutation
  - [x] 4.4.4 Show success toast ("Request cancelled")
  - [x] 4.4.5 Show error toast if cancellation fails
  - [x] 4.4.6 Add loading state during cancellation

- [ ] 4.5 Update listings page to show "Locked" badge
  - [ ] 4.5.1 Update `app/(auth)/listings/page.tsx` (or listing card components)
  - [ ] 4.5.2 Show "Locked" badge on locked listings (all users can see)
  - [ ] 4.5.3 Use consistent badge styling (match design system)
  - [ ] 4.5.4 Locked listings remain visible (not hidden from marketplace)
  **Note:** Locked badge shown in LockRequestSection on detail page. Marketplace page enhancement can be added later.

## 5. Frontend Testing

- [ ] 5.1 E2E tests for investor lock request flow
  - [ ] 5.1.1 Test investor creates lock request with notes
  - [ ] 5.1.2 Test investor creates lock request without notes
  - [ ] 5.1.3 Test investor sees "Request Pending" status after submission
  - [ ] 5.1.4 Test investor cancels pending lock request
  - [ ] 5.1.5 Test investor cannot create request for locked listing
  - [ ] 5.1.6 Test investor cannot create request for hidden listing
  - [ ] 5.1.7 Test notes character limit enforcement (1000 chars)

- [ ] 5.2 E2E tests for admin approval workflow
  - [ ] 5.2.1 Test admin navigates to lock requests dashboard
  - [ ] 5.2.2 Test admin sees pending requests in Pending tab
  - [ ] 5.2.3 Test admin approves lock request successfully
  - [ ] 5.2.4 Test admin rejects lock request with reason
  - [ ] 5.2.5 Test admin sees race condition error (two admins approve simultaneously)
  - [ ] 5.2.6 Test admin cannot approve request for locked listing
  - [ ] 5.2.7 Test admin switches between tabs (Pending/Approved/Rejected)
  - [ ] 5.2.8 Test admin filters requests by investor or listing
  - [ ] 5.2.9 Test admin sees "X other pending requests" indicator

- [ ] 5.3 E2E tests for real-time updates
  - [ ] 5.3.1 Test investor sees status update when admin approves request
  - [ ] 5.3.2 Test investor sees status update when admin rejects request
  - [ ] 5.3.3 Test admin dashboard updates when new request created
  - [ ] 5.3.4 Test admin dashboard updates when request approved/rejected
  - [ ] 5.3.5 Test pending count badge updates reactively

- [ ] 5.4 E2E tests for authorization
  - [ ] 5.4.1 Test non-investor cannot see "Request to Lock" button
  - [ ] 5.4.2 Test non-investor cannot create lock request (API rejection)
  - [ ] 5.4.3 Test non-admin cannot access lock requests dashboard (route protection)
  - [ ] 5.4.4 Test non-admin cannot approve/reject requests (API rejection)
  - [ ] 5.4.5 Test investor cannot cancel another investor's request

## 6. Documentation and Polish

- [ ] 6.1 Update API documentation
  - [ ] 6.1.1 Document `convex/lockRequests.ts` functions with JSDoc
  - [ ] 6.1.2 Document `lockListing` as admin-only in comments
  - [ ] 6.1.3 Add README or doc explaining lock request workflow
  - [ ] 6.1.4 Document atomic transaction approach for race conditions

- [ ] 6.2 Update user guides
  - [ ] 6.2.1 Add admin guide: "How to approve/reject lock requests"
  - [ ] 6.2.2 Add investor guide: "How to request listing locks"
  - [ ] 6.2.3 Add troubleshooting: "What if my request is rejected?"
  - [ ] 6.2.4 Add FAQ: "Why do I need admin approval?"

- [ ] 6.3 Add status badge color consistency
  - [ ] 6.3.1 Define color tokens (Yellow/Orange for pending, Green for approved, Red for rejected)
  - [ ] 6.3.2 Use HeroUI design tokens for consistency
  - [ ] 6.3.3 Ensure accessibility (sufficient contrast ratios)
  - [ ] 6.3.4 Add status badge to Storybook with all variants

- [ ] 6.4 Polish UI/UX
  - [ ] 6.4.1 Add consistent loading states across all components
  - [ ] 6.4.2 Add consistent error states with retry actions
  - [ ] 6.4.3 Add empty states with helpful messages
  - [ ] 6.4.4 Add tooltips for action buttons
  - [ ] 6.4.5 Ensure mobile responsiveness (admin dashboard, investor flow)
  - [ ] 6.4.6 Add keyboard shortcuts (optional, e.g., approve with Cmd+Enter)

## 7. Deployment and Monitoring

- [ ] 7.1 Validate OpenSpec change
  - [ ] 7.1.1 Run `openspec validate add-lock-listing-request-approval-workflow --strict`
  - [ ] 7.1.2 Resolve any validation errors
  - [ ] 7.1.3 Ensure all requirements have at least one scenario
  - [ ] 7.1.4 Ensure scenario formatting is correct (#### Scenario:)

- [ ] 7.2 Deploy backend changes
  - [ ] 7.2.1 Run `npx convex dev` to apply schema changes
  - [ ] 7.2.2 Deploy `convex/lockRequests.ts` functions
  - [ ] 7.2.3 Deploy updated `convex/listings.ts` functions
  - [ ] 7.2.4 Verify Convex dashboard shows new table and functions

- [ ] 7.3 Deploy frontend changes
  - [ ] 7.3.1 Build Next.js app (`pnpm run build`)
  - [ ] 7.3.2 Deploy to Vercel or hosting platform
  - [ ] 7.3.3 Verify admin dashboard accessible at `/dashboard/admin/lock-requests`
  - [ ] 7.3.4 Verify investor flow on listing detail pages

- [ ] 7.4 Post-deployment validation
  - [ ] 7.4.1 Test lock request creation as investor
  - [ ] 7.4.2 Test lock request approval as admin
  - [ ] 7.4.3 Test lock request rejection as admin
  - [ ] 7.4.4 Test request cancellation as investor
  - [ ] 7.4.5 Test race condition handling (concurrent approvals)
  - [ ] 7.4.6 Verify real-time updates work in production

- [ ] 7.5 Monitoring and logging
  - [ ] 7.5.1 Set up logging for lock request operations (already using centralized logger)
  - [ ] 7.5.2 Monitor for errors in Convex dashboard
  - [ ] 7.5.3 Set up alerts for high volume of rejections (optional)
  - [ ] 7.5.4 Track request approval rates for analytics

## Notes

- **Parallel Work**: Items 1.1-1.3 (backend) and 3.1-4.5 (frontend) can be worked in parallel after schema is defined
- **Testing**: Complete unit tests (2.1-2.2) before integration tests (2.3)
- **Frontend Dependencies**: Admin dashboard (3.x) and investor flow (4.x) are independent and can be built in parallel
- **Validation**: Run `openspec validate --strict` before marking this change complete
- **Real-time Updates**: Use Convex React hooks (`useQuery`) for automatic updates, no polling needed
- **Race Conditions**: Atomic transactions in `approveLockRequest` prevent double-locking, critical for correctness


# Lock Requests Specification - ADDED

## ADDED Requirements

### Requirement: Lock Request Table Structure

The system SHALL define a `lock_requests` table for investor-initiated listing lock requests with admin approval workflow.

#### Scenario: Create lock request for listing
- **WHEN** an investor creates a lock request
- **THEN** the system stores listingId, requestedBy, status, requestedAt
- **AND** validates listingId references existing listing
- **AND** validates requestedBy references existing user
- **AND** defaults status = "pending"
- **AND** sets requestedAt = current timestamp

#### Scenario: Multiple pending requests per listing
- **WHEN** multiple investors request the same listing
- **THEN** the system allows multiple pending requests
- **AND** each request is independent
- **AND** admin selects which request to approve
- **AND** uses by_listing_status index for querying

#### Scenario: Request status lifecycle
- **WHEN** request is created
- **THEN** status starts as "pending"
- **WHEN** admin approves request
- **THEN** status changes to "approved"
- **WHEN** admin rejects request
- **THEN** status changes to "rejected"
- **WHEN** listing is deleted or locked by another request
- **THEN** status can become "expired"

### Requirement: Request Status Management

The system SHALL track request lifecycle through status field with four states.

#### Scenario: Pending status
- **WHEN** request status = "pending"
- **THEN** request awaits admin review
- **AND** investor can cancel request
- **AND** admin can approve or reject
- **AND** appears in admin pending queue

#### Scenario: Approved status
- **WHEN** request status = "approved"
- **THEN** listing becomes locked
- **AND** reviewedAt and reviewedBy are set
- **AND** investor gains access to locked listing
- **AND** no further actions needed

#### Scenario: Rejected status
- **WHEN** request status = "rejected"
- **THEN** listing remains available
- **AND** reviewedAt, reviewedBy, and rejectionReason are set
- **AND** investor sees rejection with reason
- **AND** investor can submit new request

#### Scenario: Expired status
- **WHEN** request status = "expired"
- **THEN** request is no longer actionable
- **AND** occurs when listing becomes locked or deleted
- **AND** maintains audit trail
- **AND** cannot be approved or rejected

### Requirement: Request Creation with Validation

The system SHALL provide mutation function for investors to create lock requests with validation.

#### Scenario: Investor creates valid lock request
- **WHEN** investor with "investor" role creates request
- **THEN** the system validates listing exists and is available
- **AND** validates requestNotes (if provided) <= 1000 characters
- **AND** creates request with status "pending"
- **AND** returns request ID for tracking
- **AND** makes request visible in admin dashboard

#### Scenario: Investor creates request with optional notes
- **WHEN** investor provides request notes
- **THEN** the system validates notes <= 1000 characters
- **AND** stores notes for admin review
- **AND** notes are optional (can be empty)

#### Scenario: Invalid request creation attempts
- **WHEN** investor attempts to create request for locked listing
- **THEN** the system rejects with error "Listing is already locked"
- **WHEN** investor attempts to create request for hidden listing
- **THEN** the system rejects with error "Listing is not visible"
- **WHEN** requestNotes exceed 1000 characters
- **THEN** the system rejects with error "Request notes exceed character limit"

#### Scenario: Non-investor attempts request creation
- **WHEN** user without "investor" role attempts to create request
- **THEN** the system rejects with error "Unauthorized: Investor role required"
- **AND** validates role via hasRbacAccess helper
- **AND** checks user_identity.role or user_identity.workosRole

#### Scenario: Admin creates request for testing
- **WHEN** admin user creates lock request
- **THEN** the system allows request creation
- **AND** admin can test approval workflow
- **AND** useful for QA and testing

### Requirement: Atomic Request Approval

The system SHALL provide admin mutation for approving requests with atomic updates to prevent race conditions.

#### Scenario: Admin approves pending request
- **WHEN** admin approves pending request
- **THEN** the system performs atomic transaction:
- **AND** reads listing and request in same transaction
- **AND** verifies listing is available (visible && !locked)
- **AND** verifies request is pending (status === "pending")
- **AND** if checks pass, atomically updates:
  - request status to "approved"
  - sets reviewedAt and reviewedBy
  - locks listing (locked: true, lockedBy, lockedAt)
- **AND** if any check fails, throws error with clear message
- **AND** returns success only if all updates succeed

#### Scenario: Race condition prevention
- **WHEN** two admins approve different requests simultaneously
- **THEN** only one approval succeeds
- **AND** atomic transaction ensures listing locked once
- **AND** failed approval shows error "Listing was locked by another admin"
- **AND** failed admin sees which request was approved
- **AND** pending requests remain pending (can't be approved after lock)

#### Scenario: Approve request for already-locked listing
- **WHEN** admin attempts to approve request for locked listing
- **THEN** the system rejects with error "Listing is no longer available"
- **AND** atomic check prevents approval
- **AND** admin sees listing lock status
- **AND** suggests rejecting request instead

#### Scenario: Approve request that's not pending
- **WHEN** admin attempts to approve non-pending request
- **THEN** the system rejects with error "Request is not pending"
- **AND** shows current request status
- **AND** prevents duplicate approvals

### Requirement: Request Rejection

The system SHALL provide admin mutation for rejecting requests with optional reason.

#### Scenario: Admin rejects pending request
- **WHEN** admin rejects pending request
- **THEN** the system validates admin authorization
- **AND** validates request is pending
- **AND** updates request status to "rejected"
- **AND** sets reviewedAt and reviewedBy
- **AND** sets rejectionReason (optional)
- **AND** does NOT lock the listing
- **AND** returns success confirmation

#### Scenario: Admin provides rejection reason
- **WHEN** admin rejects request with reason
- **THEN** the system stores reason in rejectionReason field
- **AND** investor sees reason in request status
- **AND** reason helps investor understand decision
- **AND** reason is optional (can be empty)

#### Scenario: Reject request that's not pending
- **WHEN** admin attempts to reject non-pending request
- **THEN** the system rejects with error "Request is not pending"
- **AND** shows current request status
- **AND** prevents duplicate rejections

### Requirement: Investor Request Cancellation

The system SHALL allow investors to cancel their own pending requests.

#### Scenario: Investor cancels pending request
- **WHEN** investor cancels their pending request
- **THEN** the system validates user owns the request
- **AND** validates request is pending
- **AND** deletes request from database
- **AND** removes from admin pending queue
- **AND** returns success confirmation

#### Scenario: Investor cancels request for locked listing
- **WHEN** investor cancels pending request for locked listing
- **THEN** the system still allows cancellation
- **AND** request was no longer actionable anyway
- **AND** cleans up pending queue

#### Scenario: Cancel request owned by another investor
- **WHEN** investor attempts to cancel another investor's request
- **THEN** the system rejects with error "Unauthorized: Not your request"
- **AND** validates requestedBy matches caller userId
- **AND** protects other investors' requests

#### Scenario: Cancel non-pending request
- **WHEN** investor attempts to cancel approved/rejected request
- **THEN** the system rejects with error "Request is not pending"
- **AND** only pending requests can be cancelled
- **AND** maintains audit trail for processed requests

### Requirement: Admin Lock Request Queries

The system SHALL provide query functions for admins to view and filter lock requests.

#### Scenario: Get all pending requests
- **WHEN** admin queries pending requests
- **THEN** the system filters by status = "pending"
- **AND** returns all pending requests
- **AND** sorted by requestedAt (newest first)
- **AND** includes request count for dashboard badge

#### Scenario: Get pending requests with full details
- **WHEN** admin queries pending requests with details
- **THEN** the system joins request with:
  - listing (property address, lock status)
  - mortgage (loan amount, LTV, APR)
  - borrower (name, email)
  - investor (name, email, userId)
- **AND** returns combined data for display
- **AND** includes listing lock status indicator
- **AND** enables informed approval decisions

#### Scenario: Get approved requests
- **WHEN** admin queries approved requests
- **THEN** the system filters by status = "approved"
- **AND** returns all approved requests
- **AND** includes reviewedAt, reviewedBy
- **AND** sorted by reviewedAt (newest first)

#### Scenario: Get rejected requests
- **WHEN** admin queries rejected requests
- **THEN** the system filters by status = "rejected"
- **AND** returns all rejected requests
- **AND** includes reviewedAt, reviewedBy, rejectionReason
- **AND** sorted by reviewedAt (newest first)

#### Scenario: Get requests for specific listing
- **WHEN** admin queries requests for listing
- **THEN** the system uses by_listing index
- **AND** returns all requests (any status) for listing
- **AND** shows how many pending requests exist
- **AND** helps admin see request history

#### Scenario: Get pending requests for specific listing
- **WHEN** admin queries pending requests for listing
- **THEN** the system uses by_listing_status index
- **AND** filters by listingId AND status = "pending"
- **AND** shows only actionable requests
- **AND** enables "X other pending requests" display

### Requirement: Investor Request Queries

The system SHALL provide query functions for investors to view their own requests.

#### Scenario: Get investor's own requests
- **WHEN** investor queries their requests
- **THEN** the system uses by_requested_by index
- **AND** filters by requestedBy = currentUserId
- **AND** returns all requests by investor (any status)
- **AND** sorted by requestedAt (newest first)

#### Scenario: Get request with full details
- **WHEN** investor views single request details
- **THEN** the system joins request with:
  - listing (property address, lock status)
  - mortgage (loan amount, LTV, APR, images)
- **AND** returns combined data for display
- **AND** shows current request status
- **AND** enables investor to track request progress

#### Scenario: Check if investor has pending request for listing
- **WHEN** investor views listing detail page
- **THEN** the system checks if investor has pending request
- **AND** shows "Request pending" status if exists
- **AND** shows cancel button if pending
- **AND** hides request button if pending

### Requirement: Request-Listing Relationship

The system SHALL maintain referential integrity between requests and listings.

#### Scenario: Request references valid listing
- **WHEN** creating lock request
- **THEN** the system validates listingId exists
- **AND** uses by_listing index for lookup
- **AND** rejects if listing not found
- **AND** ensures referential integrity

#### Scenario: Listing deletion with pending requests
- **WHEN** admin attempts to delete listing with requests
- **THEN** the system prevents deletion
- **AND** returns error "Cannot delete listing with existing requests"
- **AND** suggests deleting requests first
- **AND** maintains audit trail

#### Scenario: Auto-reject pending requests on listing lock
- **WHEN** listing becomes locked
- **THEN** the system auto-rejects all pending requests
- **AND** sets status = "expired"
- **AND** sets rejectionReason = "Listing was locked"
- **AND** cleans up actionable queue
- **AND** maintains audit trail

### Requirement: Authorization and Access Control

The system SHALL enforce role-based access control for all request operations.

#### Scenario: Admin authorization for approval/rejection
- **WHEN** admin approves or rejects request
- **THEN** the system validates admin role
- **AND** uses hasRbacAccess helper
- **AND** checks required_roles: ["admin"]
- **AND** uses ctx.auth.getUserIdentity() for verification
- **AND** rejects non-admins with 403 Forbidden

#### Scenario: Investor authorization for creation
- **WHEN** investor creates lock request
- **THEN** the system validates investor role
- **AND** uses hasRbacAccess helper
- **AND** checks required_roles: ["investor"]
- **AND** allows admins to create (useful for testing)
- **AND** rejects non-investors with 403 Forbidden

#### Scenario: Investor ownership for cancellation
- **WHEN** investor cancels request
- **THEN** the system validates requestedBy = caller userId
- **AND** prevents cancelling other investors' requests
- **AND** protects request ownership
- **AND** rejects with "Unauthorized" if mismatch

### Requirement: Indexing Strategy

The system SHALL provide indexed access patterns for efficient request queries.

#### Scenario: Index by listing
- **WHEN** schema defines by_listing index
- **THEN** the system creates index on listingId
- **AND** enables O(log n) lookup by listing
- **AND** supports "all requests for listing" queries
- **AND** supports "X other pending requests" count

#### Scenario: Index by status
- **WHEN** schema defines by_status index
- **THEN** the system creates index on status field
- **AND** enables efficient filtering by pending/approved/rejected
- **AND** supports admin dashboard tabs
- **AND** enables status-based queries

#### Scenario: Index by requested user
- **WHEN** schema defines by_requested_by index
- **THEN** the system creates index on requestedBy field
- **AND** enables user's request history queries
- **AND** supports "my requests" view
- **AND** enables investor dashboard

#### Scenario: Compound index for status and timestamp
- **WHEN** schema defines by_status_requested_at index
- **THEN** the system creates compound index [status, requestedAt]
- **AND** enables efficient sorted queries by status
- **AND** supports "pending requests, newest first"
- **AND** optimizes admin dashboard queries

#### Scenario: Compound index for listing and status
- **WHEN** schema defines by_listing_status index
- **THEN** the system creates compound index [listingId, status]
- **AND** enables "pending requests for listing" queries
- **AND** supports "X other pending requests" display
- **AND** optimizes listing detail page queries

### Requirement: Audit Trail and Logging

The system SHALL maintain comprehensive audit trail for all request operations.

#### Scenario: Track request creation
- **WHEN** request is created
- **THEN** the system records requestedAt timestamp
- **AND** tracks requestedBy userId
- **AND** logs creation event
- **AND** enables audit trail

#### Scenario: Track request approval
- **WHEN** request is approved
- **THEN** the system records reviewedAt timestamp
- **AND** tracks reviewedBy admin userId
- **AND** logs approval event with listing lock
- **AND** enables compliance tracking

#### Scenario: Track request rejection
- **WHEN** request is rejected
- **THEN** the system records reviewedAt timestamp
- **AND** tracks reviewedBy admin userId
- **AND** stores rejectionReason (optional)
- **AND** logs rejection event
- **AND** enables performance analytics

#### Scenario: Track request cancellation
- **WHEN** request is cancelled by investor
- **THEN** the system logs cancellation event
- **AND** tracks who cancelled and when
- **AND** enables behavior analytics
- **AND** request is deleted (not marked cancelled)

### Requirement: Real-time Updates

The system SHALL provide reactive query updates for request state changes.

#### Scenario: Admin dashboard auto-updates
- **WHEN** request status changes
- **THEN** Convex reactive queries update automatically
- **AND** admin dashboard reflects changes immediately
- **AND** no manual refresh needed
- **AND** uses Convex React hooks

#### Scenario: Investor request status auto-updates
- **WHEN** admin approves/rejects request
- **THEN** investor's request view updates automatically
- **AND** shows new status immediately
- **AND** no polling or manual refresh needed
- **AND** provides real-time feedback

#### Scenario: Listing lock status reflects in requests
- **WHEN** listing becomes locked
- **THEN** pending requests show lock status indicator
- **AND** admin sees "Listing locked" warning
- **AND** prevents approval of stale requests
- **AND** maintains data consistency

### Requirement: Error Handling and Validation

The system SHALL provide clear error messages for all failure scenarios.

#### Scenario: Create request errors
- **WHEN** request creation fails validation
- **THEN** the system returns specific error:
  - "Listing not found"
  - "Listing is already locked"
  - "Listing is not visible"
  - "Unauthorized: Investor role required"
  - "Request notes exceed 1000 character limit"
- **AND** error includes actionable guidance
- **AND** frontend displays user-friendly message

#### Scenario: Approve/reject request errors
- **WHEN** approval/rejection fails validation
- **THEN** the system returns specific error:
  - "Request not found"
  - "Request is not pending"
  - "Listing is no longer available"
  - "Unauthorized: Admin privileges required"
  - "Race condition: Listing was locked by another admin"
  - "Race condition: Request was already processed"
- **AND** error includes current state information
- **AND** admin can take corrective action

#### Scenario: Cancel request errors
- **WHEN** cancellation fails validation
- **THEN** the system returns specific error:
  - "Request not found"
  - "Unauthorized: Not your request"
  - "Request is not pending"
- **AND** error prevents invalid operations
- **AND** protects data integrity

### Requirement: Request Notes Validation

The system SHALL validate request notes for length and content.

#### Scenario: Valid request notes
- **WHEN** investor provides notes <= 1000 characters
- **THEN** the system accepts and stores notes
- **AND** notes are displayed to admin
- **AND** helps admin make approval decision

#### Scenario: Exceed character limit
- **WHEN** investor provides notes > 1000 characters
- **THEN** the system rejects with error
- **AND** frontend shows character counter
- **AND** prevents submission over limit
- **AND** validates server-side as well

#### Scenario: Optional notes field
- **WHEN** investor submits request without notes
- **THEN** the system accepts request
- **AND** notes field is empty/null
- **AND** no validation error
- **AND** admin sees "No notes provided"


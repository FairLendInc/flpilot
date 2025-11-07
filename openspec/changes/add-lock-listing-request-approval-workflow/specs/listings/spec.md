# Listings Specification - MODIFIED

## MODIFIED Requirements

### Requirement: Admin-Only Direct Lock Capability

The system SHALL restrict the existing `lockListing` mutation to admin-only use, bypassing the approval workflow for urgent cases.

#### Scenario: Admin directly locks listing
- **WHEN** admin with proper role directly locks listing
- **THEN** the system validates admin authorization via hasRbacAccess
- **AND** checks required_roles: ["admin"]
- **AND** sets locked = true, lockedBy, lockedAt
- **AND** bypasses approval workflow
- **AND** returns success confirmation
- **AND** logs admin action for audit

#### Scenario: Investor attempts direct lock
- **WHEN** investor attempts to use lockListing mutation
- **THEN** the system rejects with error "Unauthorized: Admin privileges required"
- **AND** investor must use lock request approval workflow
- **AND** returns 403 Forbidden status
- **AND** logs unauthorized attempt

#### Scenario: Admin direct lock overrides pending requests
- **WHEN** admin directly locks listing with pending requests
- **THEN** the system locks the listing successfully
- **AND** pending requests remain pending (not auto-rejected)
- **AND** pending requests become unapprovable (listing already locked)
- **AND** admin can manually reject pending requests

#### Scenario: Use case for direct lock
- **WHEN** admin needs urgent listing lock
- **THEN** admin can bypass approval workflow
- **AND** useful for emergency situations
- **AND** useful for testing and QA
- **AND** documented in function comments

### Requirement: Listing Deletion with Request Validation

The system SHALL prevent listing deletion if any lock requests exist, maintaining audit trail.

#### Scenario: Attempt to delete listing with pending requests
- **WHEN** admin attempts to delete listing with pending requests
- **THEN** the system validates no pending requests exist
- **AND** queries lock_requests by_listing index
- **AND** rejects deletion with error "Cannot delete listing with pending lock requests"
- **AND** returns count of pending requests
- **AND** suggests deleting requests first

#### Scenario: Attempt to delete listing with approved requests
- **WHEN** admin attempts to delete listing with approved requests
- **THEN** the system validates no approved requests exist
- **AND** rejects deletion with error "Cannot delete listing with approved lock requests"
- **AND** maintains audit trail of approvals
- **AND** suggests reviewing request history first

#### Scenario: Attempt to delete listing with rejected requests
- **WHEN** admin attempts to delete listing with rejected requests
- **THEN** the system validates no rejected requests exist
- **AND** rejects deletion with error "Cannot delete listing with rejected lock requests"
- **AND** maintains audit trail for compliance
- **AND** suggests archiving or reviewing requests

#### Scenario: Delete listing after cleaning up requests
- **WHEN** admin deletes all lock requests for listing first
- **THEN** listing deletion proceeds normally
- **AND** cascade deletes comparables
- **AND** preserves mortgage record
- **AND** returns success confirmation

### Requirement: Lock State Integration with Requests

The system SHALL coordinate lock state between listings and lock requests.

#### Scenario: Approved request locks listing
- **WHEN** admin approves lock request
- **THEN** the system atomically locks listing
- **AND** sets locked = true, lockedBy, lockedAt
- **AND** updates request status to "approved"
- **AND** prevents other requests from being approved
- **AND** maintains data consistency

#### Scenario: Locked listing prevents new requests
- **WHEN** investor attempts to create request for locked listing
- **THEN** the system rejects with error "Listing is already locked"
- **AND** checks listing.locked = true
- **AND** suggests waiting or contacting locked user
- **AND** prevents duplicate lock attempts

#### Scenario: Unlocking listing doesn't affect requests
- **WHEN** admin unlocks listing
- **THEN** the system clears lock state (locked = false, lockedBy = null, lockedAt = null)
- **AND** existing lock requests remain (don't delete)
- **AND** investors can create new requests
- **AND** approved request history preserved for audit

#### Scenario: Hidden listing prevents new requests
- **WHEN** investor attempts to create request for hidden listing
- **THEN** the system rejects with error "Listing is not visible"
- **AND** checks listing.visible = false
- **AND** only visible listings can have requests
- **AND** maintains marketplace integrity

## ADDED Requirements

### Requirement: Lock Request Validation on Listing Operations

The system SHALL validate lock request state during listing operations.

#### Scenario: Check for pending requests before lock
- **WHEN** admin directly locks listing
- **THEN** the system optionally warns about pending requests
- **AND** shows count of pending requests
- **AND** admin can decide to proceed or review requests first
- **AND** maintains admin flexibility

#### Scenario: Query listing with request count
- **WHEN** displaying listing in admin dashboard
- **THEN** the system optionally shows pending request count
- **AND** uses by_listing_status index for efficiency
- **AND** helps admin prioritize approvals
- **AND** indicates high-demand listings


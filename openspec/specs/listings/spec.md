# listings Specification

## Purpose
TBD - created by archiving change migrate-mock-data-to-convex-schemas. Update Purpose after archive.
## Requirements
### Requirement: Listing Table Structure

The system SHALL define a `listings` table for marketplace visibility and lock state management.

#### Scenario: Create listing for mortgage
- **WHEN** a listing record is created
- **THEN** the system stores mortgageId, visible, locked
- **AND** validates mortgageId references existing mortgage
- **AND** defaults visible = true if not specified
- **AND** defaults locked = false if not specified

#### Scenario: One listing per mortgage
- **WHEN** creating a listing
- **THEN** the system validates no existing listing for the mortgage
- **AND** rejects duplicate listings for same mortgageId
- **AND** uses by_mortgage unique index for enforcement

#### Scenario: Optional listing for mortgages
- **WHEN** querying mortgages
- **THEN** the system allows mortgages without listings
- **AND** listing is optional relationship
- **AND** mortgages can exist independently of marketplace

### Requirement: Visibility Control

The system SHALL control marketplace visibility via the visible field.

#### Scenario: Show listing in marketplace
- **WHEN** visible = true
- **THEN** the listing appears in marketplace queries
- **AND** users can view listing details
- **AND** listing can be locked for purchase

#### Scenario: Hide listing from marketplace
- **WHEN** visible = false
- **THEN** the listing does not appear in marketplace queries
- **AND** existing detail page access is blocked
- **AND** locked state is preserved but inactive

#### Scenario: Toggle visibility
- **WHEN** updating visible field
- **THEN** the system allows toggling true/false
- **AND** updates reactive queries immediately
- **AND** respects lock state (can hide locked listings)

### Requirement: Lock State Management

The system SHALL manage listing lock state for purchase workflows.

#### Scenario: Lock listing for purchase
- **WHEN** user initiates purchase
- **THEN** the system sets locked = true
- **AND** stores lockedBy = userId
- **AND** sets lockedAt = current timestamp
- **AND** prevents other users from locking

#### Scenario: Prevent double-locking
- **WHEN** attempting to lock already-locked listing
- **THEN** the system rejects lock with error
- **AND** returns existing lockedBy user
- **AND** suggests waiting or contacting locked user

#### Scenario: Unlock listing after cancellation
- **WHEN** deal is canceled
- **THEN** the system sets locked = false
- **AND** clears lockedBy to null
- **AND** clears lockedAt to null
- **AND** makes listing available again

#### Scenario: Remove listing after deal completion
- **WHEN** deal closes successfully
- **THEN** the system deletes listing record
- **AND** preserves mortgage record
- **AND** removes from marketplace permanently

#### Scenario: Lock timeout handling
- **WHEN** listing has been locked longer than timeout period
- **THEN** the system can identify stale locks via lockedAt timestamp
- **AND** application can auto-unlock expired locks
- **AND** notifies lockedBy user of timeout

### Requirement: Listing Queries

The system SHALL provide query functions for marketplace and lock management.

#### Scenario: List available listings
- **WHEN** querying available marketplace listings
- **THEN** the system filters by visible = true AND locked = false
- **AND** returns listings ready for purchase
- **AND** includes linked mortgage data

#### Scenario: Get listing by mortgage
- **WHEN** querying listing for a specific mortgage
- **THEN** the system uses by_mortgage index
- **AND** returns listing if exists
- **AND** returns null if mortgage not listed

#### Scenario: Get user's locked listings
- **WHEN** querying listings locked by specific user
- **THEN** the system uses by_locked_user index
- **AND** returns all listings locked by that user
- **AND** enables user's pending deals dashboard

#### Scenario: Get all locked listings
- **WHEN** querying all locked listings (admin)
- **THEN** the system filters by locked = true
- **AND** returns all currently-locked listings
- **AND** includes lockedBy and lockedAt data

#### Scenario: Check if listing is available
- **WHEN** validating listing availability before lock
- **THEN** the system checks visible = true AND locked = false
- **AND** returns boolean availability status
- **AND** provides reason if unavailable

### Requirement: Listing Mutations
The listing lifecycle SHALL support orchestrated creation that validates upstream mortgage and borrower data.

#### Scenario: Orchestrated listing creation with mortgage payload
- **WHEN** the platform receives a create-listing request (from admin UI or webhook)
- **THEN** the mutation SHALL validate borrower details (email format, Rotessa ID uniqueness) and create or reuse the borrower
- **AND** it SHALL create the mortgage with all required property, appraisal, and financial fields, applying the same business rules as `mortgages.createMortgage`
- **AND** it SHALL insert the listing referencing the new mortgage while ensuring the one-listing-per-mortgage invariant

### Requirement: Type Safety and Validation

The system SHALL enforce type safety and data validation at schema level.

#### Scenario: Validate required fields
- **WHEN** creating or updating listing
- **THEN** the system requires: mortgageId, visible, locked
- **AND** requires lockedBy and lockedAt if locked = true
- **AND** rejects invalid writes with clear errors

#### Scenario: Validate lock state consistency
- **WHEN** setting locked = true
- **THEN** the system requires lockedBy is non-null
- **AND** requires lockedAt is non-null
- **WHEN** setting locked = false
- **THEN** lockedBy and lockedAt must be null

#### Scenario: Auto-generate TypeScript types
- **WHEN** schema is defined
- **THEN** Convex generates Doc<"listings"> type
- **AND** generates Id<"listings"> for IDs
- **AND** enables compile-time type checking

### Requirement: Indexing Strategy

The system SHALL provide indexed access patterns for listing queries.

#### Scenario: Index by mortgage
- **WHEN** schema defines by_mortgage unique index
- **THEN** the system creates unique index on mortgageId
- **AND** enforces one listing per mortgage
- **AND** enables O(log n) lookup by mortgage

#### Scenario: Index by lock status
- **WHEN** schema defines by_locked_status index
- **THEN** the system creates index on locked field
- **AND** enables efficient filtering of available vs locked listings
- **AND** supports marketplace availability queries

#### Scenario: Index by locked user
- **WHEN** schema defines by_locked_user index
- **THEN** the system creates index on lockedBy field
- **AND** enables user's locked listings queries
- **AND** supports pending deals dashboard

### Requirement: Marketplace Integration

The system SHALL integrate listing state with mortgage and ownership data.

#### Scenario: Join listing with mortgage
- **WHEN** displaying listing in marketplace
- **THEN** the system joins listing.mortgageId with mortgages table
- **AND** returns combined listing + mortgage data
- **AND** includes property details, financials, images

#### Scenario: Verify ownership before listing
- **WHEN** creating listing
- **THEN** the system validates current owner permissions
- **AND** ensures owner has right to list mortgage
- **AND** checks ownership cap table

#### Scenario: Transfer ownership on deal close
- **WHEN** deal closes successfully
- **THEN** listing deletion triggers ownership transfer
- **AND** updates mortgage_ownership table
- **AND** maintains data consistency

### Requirement: Lock Timeout and Cleanup

The system SHALL support lock timeout and stale lock cleanup.

#### Scenario: Calculate lock duration
- **WHEN** querying locked listing
- **THEN** the system calculates duration using lockedAt timestamp
- **AND** compares to timeout threshold (configurable)
- **AND** identifies expired locks

#### Scenario: Auto-unlock expired locks
- **WHEN** cron job or background task runs
- **THEN** the system queries locks older than timeout
- **AND** unlocks expired listings
- **AND** notifies affected users

#### Scenario: Grace period for lock extension
- **WHEN** user is actively working on deal
- **THEN** the system allows extending lock before expiration
- **AND** updates lockedAt timestamp
- **AND** prevents unwanted timeout

### Requirement: Listing State Audit

The system SHALL maintain audit trail for listing state changes.

#### Scenario: Track listing creation
- **WHEN** listing is created
- **THEN** the system records creation timestamp
- **AND** tracks creator userId
- **AND** logs initial visible/locked state

#### Scenario: Track lock state changes
- **WHEN** listing is locked or unlocked
- **THEN** the system updates state fields atomically
- **AND** reactive queries reflect changes immediately
- **AND** preserves referential integrity

#### Scenario: Track visibility changes
- **WHEN** visibility is toggled
- **THEN** the system updates visible field
- **AND** logs change for audit
- **AND** enables marketplace analytics

### Requirement: Admin Listing Update Operations

The system SHALL provide admin-only mutation functions for updating listing properties.

#### Scenario: Admin updates listing visibility
- **WHEN** admin with proper role updates listing visible field
- **THEN** the system validates admin authorization
- **AND** updates visible = true or false
- **AND** triggers reactive query updates immediately
- **AND** returns success confirmation
- **AND** logs the change for audit trail

#### Scenario: Admin toggles listing lock state
- **WHEN** admin manually locks or unlocks a listing
- **THEN** the system validates admin authorization
- **AND** if locking: sets locked = true, lockedBy = admin.id, lockedAt = now
- **AND** if unlocking: clears locked, lockedBy, lockedAt
- **AND** overrides existing lock state if admin
- **AND** returns success confirmation

#### Scenario: Admin updates listing metadata
- **WHEN** admin updates listing metadata (notes, internal references)
- **THEN** the system validates admin authorization
- **AND** updates metadata fields
- **AND** preserves core listing properties (mortgageId, visible, locked)
- **AND** returns success confirmation

#### Scenario: Non-admin attempts update
- **WHEN** non-admin user attempts to update listing
- **THEN** the system rejects the operation with authorization error
- **AND** returns 403 Forbidden status
- **AND** logs unauthorized access attempt
- **AND** no listing data is modified

### Requirement: Admin Listing Deletion

The system SHALL provide admin-only mutation function for permanently deleting listings.

#### Scenario: Admin deletes listing
- **WHEN** admin initiates listing deletion
- **THEN** the system validates admin authorization
- **AND** validates listing is not currently locked by another user
- **AND** shows confirmation dialog with deletion impact
- **AND** on confirmation: deletes listing record
- **AND** preserves associated mortgage record
- **AND** triggers reactive query updates
- **AND** returns success confirmation
- **AND** logs deletion for audit trail

#### Scenario: Admin attempts to delete locked listing
- **WHEN** admin attempts to delete a listing locked by another user
- **THEN** the system validates admin authorization
- **AND** checks if locked = true
- **AND** presents option to force unlock and delete
- **AND** if admin confirms force delete: clears lock and deletes listing
- **AND** if admin cancels: operation is aborted
- **AND** returns appropriate success or cancellation message

#### Scenario: Delete listing with active deal
- **WHEN** admin attempts to delete listing with active deal in progress
- **THEN** the system validates admin authorization
- **AND** checks deal status
- **AND** prevents deletion if deal is in progress
- **AND** returns error message about active deal
- **AND** suggests alternative actions (hide listing, wait for deal completion)

#### Scenario: Cascade delete comparables
- **WHEN** listing is deleted
- **THEN** the system validates listing deletion is allowed
- **AND** deletes all appraisal_comparables linked to the mortgage
- **AND** deletes all comparables associated with the listing
- **AND** preserves other mortgage data (payments, ownership)
- **AND** rolls back all changes if any deletion fails
- **AND** returns success only if all cascade operations succeed

#### Scenario: Non-admin attempts deletion
- **WHEN** non-admin user attempts to delete listing
- **THEN** the system rejects the operation with authorization error
- **AND** returns 403 Forbidden status
- **AND** logs unauthorized deletion attempt
- **AND** listing remains unchanged

### Requirement: Admin Authorization Validation

The system SHALL validate admin permissions before executing listing mutations.

#### Scenario: Validate admin role for mutations
- **WHEN** any admin mutation is attempted on a listing
- **THEN** the system checks user has admin role
- **AND** uses ctx.auth.getUserIdentity() to verify authorization
- **AND** throws validation error if not admin
- **AND** allows mutation if admin

#### Scenario: Track admin actions
- **WHEN** admin performs listing mutations (update/delete)
- **THEN** the system logs the action with admin user ID
- **AND** records timestamp of the action
- **AND** includes the changes made or deletion performed
- **AND** enables audit trail for admin activities

#### Scenario: Audit trail for listing changes
- **WHEN** admin updates or deletes a listing
- **THEN** the system creates audit log entry
- **AND** includes: admin user ID, action type, timestamp, listing ID, changes
- **AND** stores audit logs for compliance and tracking
- **AND** audit logs are queryable by admin users

### Requirement: Admin Listing Management UI Components

The system SHALL provide comprehensive UI components for admin listing management with complete Storybook documentation.

#### Scenario: Listing update form component with stories
- **WHEN** admin listing update form component is created
- **THEN** the component includes fields for visible toggle, lock control, and metadata
- **AND** the component validates admin permissions before showing form
- **AND** Storybook stories demonstrate the form in default state
- **AND** Storybook stories demonstrate form with validation errors
- **AND** Storybook stories demonstrate form with success states
- **AND** all Storybook stories render without console errors

#### Scenario: Listing deletion confirmation UI with stories
- **WHEN** admin listing deletion confirmation component is created
- **THEN** the component displays listing details and impact warning
- **AND** provides confirm/cancel actions for admin
- **AND** Storybook stories demonstrate confirmation dialog for available listing
- **AND** Storybook stories demonstrate confirmation dialog for locked listing with force option
- **AND** Storybook stories demonstrate confirmation dialog with cascade delete warning
- **AND** all Storybook stories are interactive and accessible

#### Scenario: Listing management page with stories
- **WHEN** admin listing management page is created
- **THEN** the page displays all listings with edit and delete actions
- **AND** includes filtering and search capabilities
- **AND** shows loading states and empty states
- **AND** Storybook stories demonstrate the page with listings
- **AND** Storybook stories demonstrate the page in loading state
- **AND** Storybook stories demonstrate the page with no listings
- **AND** Storybook stories demonstrate admin actions on listings
- **AND** all Storybook stories pass accessibility tests

### Requirement: Listing Creation Webhook
Convex SHALL expose an authenticated HTTP endpoint that accepts a full listing payload and produces a marketplace listing.

#### Scenario: API key authentication
- **WHEN** an HTTP request hits `/listings/create`
- **THEN** the handler SHALL verify a shared secret provided via `x-api-key` header that matches a configured environment value
- **AND** it SHALL reject missing or invalid keys with a 401 response before reading or mutating data

#### Scenario: Payload validation and error reporting
- **WHEN** the webhook receives a JSON payload
- **THEN** it SHALL validate borrower, mortgage, and listing fields using application-level checks (email format, numeric ranges, coordinate bounds, date ordering, LTV within 0-100)
- **AND** any validation failure SHALL return a 400 response with machine-readable error codes
- **AND** the webhook SHALL NOT rely solely on Convex type validation to catch bad input

#### Scenario: Reuse borrower and enforce listing uniqueness
- **WHEN** the payload references a borrower email or Rotessa ID that already exists
- **THEN** the webhook SHALL reuse that borrower record
- **AND** it SHALL ensure that no listing already exists for the payload’s mortgage by checking an `externalMortgageId` identifier supplied in the payload
- **AND** duplicate submissions that reuse the same `externalMortgageId` SHALL return an idempotent success response without creating a second listing


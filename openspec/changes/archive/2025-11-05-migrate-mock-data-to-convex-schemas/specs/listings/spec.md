# Listings Schema Specification

## ADDED Requirements

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

The system SHALL provide mutation functions for listing lifecycle operations.

#### Scenario: Create new listing
- **WHEN** creating a listing
- **THEN** the system validates mortgageId exists
- **AND** validates no duplicate listing for mortgage
- **AND** sets default visible = true, locked = false
- **AND** returns new listing ID

#### Scenario: Lock listing
- **WHEN** user locks a listing
- **THEN** the system validates listing is available
- **AND** atomically updates locked, lockedBy, lockedAt
- **AND** returns success confirmation
- **AND** triggers reactive query updates

#### Scenario: Unlock listing
- **WHEN** unlocking a listing
- **THEN** the system validates user is lockedBy user or admin
- **AND** atomically clears locked, lockedBy, lockedAt
- **AND** returns success confirmation

#### Scenario: Update visibility
- **WHEN** changing listing visibility
- **THEN** the system updates visible field
- **AND** maintains lock state
- **AND** triggers marketplace query updates

#### Scenario: Delete listing
- **WHEN** removing listing from marketplace
- **THEN** the system validates no active lock or deal in progress
- **AND** deletes listing record
- **AND** preserves linked mortgage

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

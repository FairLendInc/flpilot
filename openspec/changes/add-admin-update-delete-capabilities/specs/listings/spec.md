## MODIFIED Requirements
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

## ADDED Requirements
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

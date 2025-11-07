## MODIFIED Requirements
### Requirement: Mortgage Mutations

The system SHALL provide mutation functions for mortgage lifecycle operations.

#### Scenario: Create new mortgage
- **WHEN** creating a mortgage
- **THEN** the system validates all required fields are present
- **AND** validates borrowerId references existing borrower
- **AND** sets status to "active" by default
- **AND** returns the new mortgage ID

#### Scenario: Update mortgage status
- **WHEN** updating a mortgage status
- **THEN** the system validates new status is valid enum value
- **AND** updates the status field atomically
- **AND** triggers reactive query updates for dependent UI

#### Scenario: Add document to mortgage
- **WHEN** adding a document to an existing mortgage
- **THEN** the system appends to documents array
- **AND** validates document structure and storageId
- **AND** preserves existing documents

#### Scenario: Prevent modification of closed mortgages
- **WHEN** attempting to modify a mortgage with status "closed"
- **THEN** the system rejects the modification with error
- **AND** provides clear error message about closed status
- **AND** allows status change from "closed" to "active" only via explicit reactivation

## ADDED Requirements
### Requirement: Admin Mortgage Update Operations

The system SHALL provide admin-only mutation function for updating mortgage properties.

#### Scenario: Admin updates mortgage loan details
- **WHEN** admin with proper role updates loanAmount or interestRate
- **THEN** the system validates admin authorization
- **AND** updates loanAmount (must be > 0)
- **AND** updates interestRate (must be > 0 and < 100)
- **AND** validates maturityDate is after originationDate
- **AND** returns success confirmation
- **AND** triggers reactive query updates

#### Scenario: Admin updates mortgage dates
- **WHEN** admin updates originationDate or maturityDate
- **THEN** the system validates admin authorization
- **AND** ensures maturityDate is after originationDate
- **AND** validates dates are in valid format
- **AND** updates the date fields atomically
- **AND** returns success confirmation

#### Scenario: Admin updates property information
- **WHEN** admin updates property details (address, coordinates, type)
- **THEN** the system validates admin authorization
- **AND** updates address fields (street, city, state, zip, country)
- **AND** updates coordinates (latitude between -90 and 90, longitude between -180 and 180)
- **AND** updates property type
- **AND** validates all required address fields are present
- **AND** returns success confirmation

#### Scenario: Admin relinks mortgage to different borrower
- **WHEN** admin updates borrowerId reference
- **THEN** the system validates admin authorization
- **AND** validates new borrowerId exists
- **AND** updates borrowerId reference
- **AND** maintains all other mortgage properties
- **AND** returns success confirmation

#### Scenario: Admin updates mortgage documents
- **WHEN** admin modifies mortgage document list
- **THEN** the system validates admin authorization
- **AND** can add new documents with valid structure
- **AND** can remove existing documents
- **AND** validates all document types are valid enum values
- **AND** preserves document array integrity
- **AND** returns success confirmation

#### Scenario: Non-admin attempts mortgage update
- **WHEN** non-admin user attempts to update mortgage
- **THEN** the system rejects the operation with authorization error
- **AND** returns 403 Forbidden status
- **AND** logs unauthorized access attempt
- **AND** mortgage data remains unchanged

### Requirement: Admin Mortgage Deletion

The system SHALL provide admin-only mutation function for permanently deleting mortgages.

#### Scenario: Admin deletes mortgage
- **WHEN** admin initiates mortgage deletion
- **THEN** the system validates admin authorization
- **AND** shows confirmation dialog with deletion impact warning
- **AND** on confirmation: begins cascade deletion
- **AND** deletes mortgage record and all associated data
- **AND** returns success confirmation
- **AND** logs deletion for audit trail

#### Scenario: Cascade delete mortgage dependencies
- **WHEN** mortgage deletion is initiated
- **THEN** the system validates admin authorization
- **AND** deletes all listings referencing the mortgage
- **AND** deletes all appraisal_comparables linked to the mortgage
- **AND** updates mortgage_ownership table (removes ownership records)
- **AND** deletes all payment records
- **AND** rolls back all changes if any deletion fails
- **AND** returns success only if all cascade operations succeed
- **AND** preserves borrower record (reusable for other mortgages)

#### Scenario: Admin attempts to delete mortgage with active listing
- **WHEN** admin attempts to delete mortgage that has active listing
- **THEN** the system validates admin authorization
- **AND** checks if mortgage has listings
- **AND** if listing exists: presents option to delete listing first or cancel
- **AND** if admin confirms: deletes listing, then deletes mortgage
- **AND** if admin cancels: operation is aborted
- **AND** returns appropriate success or cancellation message

#### Scenario: Admin attempts to delete mortgage with locked listing
- **WHEN** admin attempts to delete mortgage with locked listing
- **THEN** the system validates admin authorization
- **AND** checks if any listing is locked
- **AND** presents option to force unlock, delete listing, then delete mortgage
- **AND** if admin confirms force delete: clears locks, deletes listing, then deletes mortgage
- **AND** if admin cancels: operation is aborted
- **AND** warns about impact on any active deals

#### Scenario: Non-admin attempts mortgage deletion
- **WHEN** non-admin user attempts to delete mortgage
- **THEN** the system rejects the operation with authorization error
- **AND** returns 403 Forbidden status
- **AND** logs unauthorized deletion attempt
- **AND** mortgage and all associated data remain unchanged

#### Scenario: Rollback on cascade deletion failure
- **WHEN** mortgage deletion is in progress and a dependency deletion fails
- **THEN** the system detects the failure
- **AND** immediately rolls back all completed deletions
- **AND** restores all deleted records
- **AND** returns error with details of failed deletion
- **AND** ensures data consistency is maintained

### Requirement: Admin Authorization and Audit

The system SHALL validate admin permissions and maintain audit trail for mortgage mutations.

#### Scenario: Validate admin role for mortgage mutations
- **WHEN** any admin mutation is attempted on a mortgage
- **THEN** the system checks user has admin role
- **AND** uses ctx.auth.getUserIdentity() to verify authorization
- **AND** throws validation error if not admin
- **AND** allows mutation if admin

#### Scenario: Track admin actions on mortgages
- **WHEN** admin performs mortgage mutations (update/delete)
- **THEN** the system logs the action with admin user ID
- **AND** records timestamp of the action
- **AND** includes the changes made or deletion performed
- **AND** records all cascade operations for deletions
- **AND** enables audit trail for admin activities

#### Scenario: Audit trail for mortgage changes
- **WHEN** admin updates or deletes a mortgage
- **THEN** the system creates detailed audit log entry
- **AND** includes: admin user ID, action type, timestamp, mortgage ID, all changes
- **AND** for deletions: includes count of cascade deletions (listings, comparables, ownership, payments)
- **AND** stores audit logs for compliance and tracking
- **AND** audit logs are queryable by admin users

### Requirement: Admin Mortgage Management UI Components

The system SHALL provide comprehensive UI components for admin mortgage management with complete Storybook documentation.

#### Scenario: Mortgage update form component with stories
- **WHEN** admin mortgage update form component is created
- **THEN** the component includes sections for loan details, property info, and documents
- **AND** the component validates admin permissions before showing form
- **AND** Storybook stories demonstrate the form in default state with sample data
- **AND** Storybook stories demonstrate form with validation errors (invalid amounts, dates)
- **AND** Storybook stories demonstrate form with success states
- **AND** Storybook stories demonstrate document management (add/remove documents)
- **AND** all Storybook stories render without console errors

#### Scenario: Mortgage deletion confirmation UI with stories
- **WHEN** admin mortgage deletion confirmation component is created
- **THEN** the component displays mortgage details and comprehensive cascade delete warning
- **AND** provides confirm/cancel actions for admin
- **AND** Storybook stories demonstrate confirmation dialog for simple mortgage (no listings)
- **AND** Storybook stories demonstrate confirmation dialog for mortgage with listings
- **AND** Storybook stories demonstrate confirmation dialog for mortgage with locked listing and force option
- **AND** Storybook stories demonstrate warning about cascade deletion impact
- **AND** all Storybook stories are interactive and accessible

#### Scenario: Mortgage management page with stories
- **WHEN** admin mortgage management page is created
- **THEN** the page displays all mortgages with edit and delete actions
- **AND** includes filtering by status, borrower, and date ranges
- **AND** shows loading states and empty states
- **AND** Storybook stories demonstrate the page with mortgages
- **AND** Storybook stories demonstrate the page in loading state
- **AND** Storybook stories demonstrate the page with no mortgages
- **AND** Storybook stories demonstrate filtering capabilities
- **AND** Storybook stories demonstrate admin actions on mortgages including cascade delete
- **AND** all Storybook stories pass accessibility tests

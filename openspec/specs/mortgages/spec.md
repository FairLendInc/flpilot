# mortgages Specification

## Purpose

TBD - created by archiving change migrate-mock-data-to-convex-schemas. Update Purpose after archive.

## Requirements

### Requirement: Mortgage Table Structure

The mortgage data model SHALL accept an optional external identifier for upstream integrations.

#### Scenario: Store external mortgage identifier

- **WHEN** a mortgage is created through the listing creation flows
- **THEN** the system SHALL allow persisting an optional `externalMortgageId` string on the mortgage record
- **AND** if provided, the value SHALL be unique per mortgage and indexed for lookups
- **AND** the optional field SHALL NOT be required for existing internal workflows

### Requirement: Mortgage Renewal Tracking

The system SHALL support mortgage renewals by linking new mortgages to their predecessors.

#### Scenario: Create renewed mortgage

- **WHEN** an existing mortgage is renewed
- **THEN** the system creates a new mortgage record with new terms
- **AND** stores previousMortgageId linking to the original mortgage
- **AND** sets original mortgage status to "renewed"
- **AND** maintains independent ownership and payment records

#### Scenario: Query renewal chain

- **WHEN** querying a mortgage's renewal history
- **THEN** the system returns all mortgages in the renewal chain
- **AND** orders by originationDate chronologically
- **AND** indicates current vs historical mortgages

#### Scenario: Prevent circular renewal references

- **WHEN** creating a renewed mortgage
- **THEN** the system validates previousMortgageId is not the current mortgage
- **AND** prevents renewal chains that reference themselves

### Requirement: Document Storage Integration

The system SHALL store mortgage documents using Convex file storage.

#### Scenario: Link documents to mortgage

- **WHEN** documents are uploaded for a mortgage
- **THEN** the system stores an array of document references
- **AND** each reference includes name, type, storageId, uploadDate, fileSize
- **AND** validates storageId exists in Convex storage

#### Scenario: Document type validation

- **WHEN** a document is added
- **THEN** the system validates type is one of: "appraisal", "title", "inspection", "loan_agreement", "insurance"
- **AND** requires name and storageId fields
- **AND** auto-sets uploadDate to current timestamp

#### Scenario: Query documents by type

- **WHEN** filtering mortgage documents by type
- **THEN** the system returns only documents matching the specified type
- **AND** orders by uploadDate descending (newest first)

### Requirement: Mortgage Queries

The system SHALL provide query functions for accessing mortgage data.

#### Scenario: Get mortgage by ID

- **WHEN** querying a mortgage by its ID
- **THEN** the system returns the complete mortgage record
- **AND** includes all embedded property details
- **AND** returns null if ID doesn't exist

#### Scenario: List mortgages by borrower

- **WHEN** querying mortgages for a specific borrower
- **THEN** the system uses by_borrower index
- **AND** returns all mortgages for that borrower
- **AND** includes current and historical mortgages
- **AND** orders by originationDate descending

#### Scenario: Filter mortgages by status

- **WHEN** filtering mortgages by status
- **THEN** the system uses by_status index
- **AND** returns only mortgages matching the status
- **AND** supports multiple status filters via array parameter

#### Scenario: Get mortgages nearing maturity

- **WHEN** querying mortgages by maturity date range
- **THEN** the system uses by_maturity_date index
- **AND** returns mortgages with maturityDate within specified range
- **AND** orders by maturityDate ascending (earliest first)

### Requirement: Mortgage Mutations

Mortgage creation SHALL prevent duplicate records when an external identifier is provided.

#### Scenario: Idempotent mortgage creation

- **WHEN** the create mortgage mutation receives an `externalMortgageId`
- **THEN** it SHALL query for an existing mortgage with the same identifier
- **AND** if one exists, it SHALL reuse that mortgage instead of inserting a new row
- **AND** the mutation SHALL return the existing mortgage ID so downstream listing creation remains idempotent

### Requirement: Type Safety and Validation

The system SHALL enforce type safety and data validation at schema level.

#### Scenario: Validate required fields

- **WHEN** creating or updating a mortgage
- **THEN** the system requires: borrowerId, loanAmount, interestRate, originationDate, maturityDate, property address, status
- **AND** rejects writes with missing required fields
- **AND** provides clear validation error messages

#### Scenario: Validate numeric constraints

- **WHEN** setting numeric fields
- **THEN** the system validates loanAmount > 0
- **AND** validates interestRate > 0 and < 100
- **AND** validates latitude between -90 and 90
- **AND** validates longitude between -180 and 180

#### Scenario: Auto-generate TypeScript types

- **WHEN** the schema is defined
- **THEN** Convex generates Doc<"mortgages"> type
- **AND** generates Id<"mortgages"> for strongly-typed IDs
- **AND** provides full autocomplete in queries and mutations
- **AND** enables compile-time type checking

### Requirement: Indexing Strategy

The system SHALL provide indexed access patterns for common queries.

#### Scenario: Index by borrower

- **WHEN** schema defines by_borrower index
- **THEN** the system creates index on borrowerId field
- **AND** enables O(log n) lookups by borrower
- **AND** supports borrower portfolio queries

#### Scenario: Index by status

- **WHEN** schema defines by_status index
- **THEN** the system creates index on status field
- **AND** enables efficient filtering by status
- **AND** supports active/renewed/closed views

#### Scenario: Index by maturity date

- **WHEN** schema defines by_maturity_date index
- **THEN** the system creates index on maturityDate field
- **AND** enables range queries on maturity dates
- **AND** supports timeline and calendar views

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

## ADDED Requirements

### Requirement: Document Templates Field

The `mortgages` table MUST include a `documentTemplates` field to support multiple Documenso template configurations.

#### Scenario: Template Association

- **WHEN** an admin adds a Documenso template configuration
- **THEN** the template is stored in the `mortgages.documentTemplates` array
- **AND** each configuration includes:
  - `documensoTemplateId` (string): The Documenso envelope ID
  - `name` (string): Display name for the document type
  - `signatoryRoles` (array of strings): Required signatory roles (e.g., ["Broker", "Investor"])

#### Scenario: Multiple Templates

- **WHEN** viewing a mortgage's template configurations
- **THEN** all templates in the array are returned
- **AND** each template maintains its own configuration independently.

### Requirement: Template Configuration Management

The system MUST provide mutations to manage the `documentTemplates` array.

#### Scenario: Add Template Configuration

- **WHEN** an admin adds a new template configuration
- **THEN** the configuration is appended to `mortgages.documentTemplates`
- **AND** the configuration includes template ID, display name, and required roles.

#### Scenario: Remove Template Configuration

- **WHEN** an admin removes a template configuration
- **THEN** the configuration is removed from the array
- **AND** remaining configurations are unchanged.

#### Scenario: Update Template Configuration

- **WHEN** an admin updates the display name or roles
- **THEN** the specific configuration in the array is updated
- **AND** other configurations are unchanged.

### Requirement: Template ID Format

The system SHALL store Documenso template IDs in envelope string format.

**Source:** Research footguns #2

The system MUST store template IDs in Documenso's envelope string format.

#### Scenario: Template ID Storage

- **WHEN** a template configuration is saved
- **THEN** the `documensoTemplateId` field stores the string format
- **AND** the format is `"envelope_xxxxxxxxxxxxx"`
- **AND** NOT numeric format.

**Rationale:** String format is used by API endpoints; numeric format only for specific SDK methods.

### Requirement: Template Validation

The system MUST validate template configurations before saving.

#### Scenario: Validate Template Exists

- **WHEN** an admin adds a template configuration
- **THEN** the system MUST verify the template exists in Documenso
- **AND** throw an error if the template is not found (404)
- **AND** display user message "Template not found. Please select a valid template."

#### Scenario: Validate Signatory Roles

- **WHEN** an admin adds a template configuration
- **THEN** the system MUST validate that `signatoryRoles` is not empty
- **AND** each role is a valid string
- **AND** throw an error if validation fails.
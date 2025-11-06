## MODIFIED Requirements
### Requirement: Comprehensive Listing Form
The admin dashboard SHALL provide a single-page form that captures every data point needed to publish a marketplace listing.

#### Scenario: Capture borrower, mortgage, and listing data
- **WHEN** an admin opens the listing creation page
- **THEN** the form SHALL include grouped sections for borrower info (name, email, Rotessa ID), property & mortgage terms (address, coordinates, loan amount, interest rate, origination date, maturity date, LTV, appraisal details), optional comparable properties, and listing visibility defaults
- **AND** every field SHALL render with controlled inputs using HeroUI primitives where available
- **AND** the form SHALL support file uploads for property images, mortgage documents, and comparable property images
- **AND** the layout SHALL mirror the controlled form conventions established in `app/(auth)/profilev2`

## ADDED Requirements
### Requirement: Comparable Properties Section
The listing creation form SHALL include a dedicated section for adding appraisal comparables to provide investment context.

#### Scenario: Add comparable properties
- **WHEN** the admin clicks "Add Comparable" in the form
- **THEN** a new comparable entry form SHALL appear with fields for address (street, city, state, zip), sale amount, sale date, distance from subject property, and optional property characteristics (square feet, bedrooms, bathrooms, property type)
- **AND** the admin SHALL be able to add unlimited comparables (0 to N)
- **AND** each comparable SHALL support image upload for property photos
- **AND** comparables SHALL be displayed in a list with remove buttons for each entry

#### Scenario: Remove comparable properties
- **WHEN** the admin clicks the remove button on a comparable entry
- **THEN** that comparable SHALL be removed from the form
- **AND** the form SHALL re-render with remaining comparables
- **AND** form state SHALL be updated to reflect the removal

#### Scenario: Edit comparable properties
- **WHEN** the admin modifies comparable field values
- **THEN** changes SHALL be immediately reflected in the comparable list
- **AND** all updates SHALL be synchronized with the form state store

### Requirement: Form State Management with Comparables
The comprehensive form SHALL centralize its state (including comparables) in a dedicated Zustand store.

#### Scenario: Persist comparable data across sections
- **WHEN** the admin navigates between borrower, property, comparables, and listing sections
- **THEN** all comparable entries SHALL remain synchronized through the Zustand store
- **AND** adding, editing, or removing comparables SHALL update the store immediately
- **AND** submitting successfully SHALL reset the store including all comparables to initial values

#### Scenario: Validate comparable data
- **WHEN** comparables are present in the form
- **THEN** the store SHALL validate that required fields are present (address, sale amount, sale date, distance)
- **AND** the store SHALL validate numeric constraints (sale amount > 0, distance >= 0, positive values for optional numeric fields)
- **AND** validation errors SHALL be displayed inline for each comparable

### Requirement: Validation & Submission with Comparables
The admin listing form SHALL include comparables in validation and submission workflows.

#### Scenario: Client-side validation with comparables
- **WHEN** required comparable fields are empty, malformed, or violate domain constraints
- **THEN** the submit button SHALL be disabled
- **AND** inline error messages SHALL explain how to fix each comparable field
- **AND** the form SHALL allow submission with 0 comparables (optional feature)

#### Scenario: Successful submission with comparables
- **WHEN** the admin submits a valid form with comparables
- **THEN** the UI SHALL call a Convex mutation that creates or reuses the borrower, creates the mortgage with images/documents, creates all comparable properties using bulkCreateComparables, and finally inserts the listing referencing that mortgage
- **AND** all operations SHALL be atomic - if any step fails, no data SHALL be persisted
- **AND** the response SHALL confirm the new listing ID
- **AND** the UI SHALL display a success toast and navigate back to admin listings overview

#### Scenario: Failed comparable creation
- **WHEN** mortgage creation succeeds but comparable creation fails
- **THEN** the system SHALL roll back the mortgage creation
- **AND** the UI SHALL display an error message about comparable failure
- **AND** the form SHALL preserve all entered data for retry

### Requirement: Webhook Support for Comparables
The listing creation webhook SHALL support receiving and processing comparable properties.

#### Scenario: Webhook accepts comparables in payload
- **WHEN** external system sends `/listings/create` webhook with comparables field
- **THEN** the webhook SHALL validate the comparables array schema
- **AND** the webhook SHALL create all comparables using bulkCreateComparables
- **AND** the webhook SHALL return success with listing ID

#### Scenario: Webhook validates comparable data
- **WHEN** webhook receives comparables with missing required fields
- **THEN** the webhook SHALL return 400 validation error
- **AND** the error SHALL include field-specific validation messages
- **AND** no listing or comparables SHALL be created

#### Scenario: Webhook handles comparable creation failure
- **WHEN** mortgage is created but comparable creation fails
- **THEN** the webhook SHALL roll back the mortgage creation
- **AND** the webhook SHALL return 400 error with descriptive message
- **AND** no partial data SHALL be persisted

#### Scenario: Webhook processes zero comparables
- **WHEN** webhook receives payload without comparables field or with empty array
- **THEN** the webhook SHALL create listing successfully
- **AND** no comparables SHALL be created (optional feature)
- **AND** response SHALL indicate successful creation

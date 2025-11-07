# admin-listing-creation Specification

## Purpose
TBD - created by archiving change add-listing-creation-pathways. Update Purpose after archive.
## Requirements
### Requirement: Comprehensive Listing Form
The admin dashboard SHALL provide a single-page form that captures every data point needed to publish a marketplace listing.

#### Scenario: Capture borrower, mortgage, and listing data
- **WHEN** an admin opens the listing creation page
- **THEN** the form SHALL include grouped sections for borrower info (name, email, Rotessa ID), property & mortgage terms (address, coordinates, loan amount, interest rate, origination date, maturity date, LTV, appraisal details), and listing visibility defaults
- **AND** every field SHALL render with controlled inputs using HeroUI primitives where available
- **AND** the form SHALL support file uploads for property images and mortgage documents
- **AND** the layout SHALL mirror the controlled form conventions established in `app/(auth)/profilev2`

#### Scenario: Link to existing borrower
- **WHEN** the admin enters an email that matches an existing borrower
- **THEN** the form SHALL surface the existing borrower row for confirmation
- **AND** selecting the borrower SHALL reuse the record instead of creating a duplicate
- **AND** the form SHALL allow overriding with “Create new borrower” when needed

### Requirement: Form State Management
The comprehensive form SHALL centralize its state in a dedicated Zustand store.

#### Scenario: Persist progress across sections
- **WHEN** the admin navigates between borrower, property, and listing sections
- **THEN** field values SHALL remain synchronized through a Zustand store
- **AND** derived form status (dirty, valid, submission state) SHALL be computed from the store
- **AND** submitting successfully SHALL reset the store to initial values

#### Scenario: Prefill edits for validation errors
- **WHEN** the backend rejects submission with validation errors
- **THEN** the form SHALL preserve the previously entered values in the store
- **AND** the UI SHALL scroll or focus the offending inputs so the admin can correct them

### Requirement: Validation & Submission
The admin listing form SHALL enforce business validation locally and send a single payload to Convex when submitting.

#### Scenario: Client-side validation gates submission
- **WHEN** required fields are empty, malformed, or violate domain constraints (e.g., LTV outside 0-100, invalid email)
- **THEN** the submit button SHALL be disabled
- **AND** inline error messages SHALL explain how to fix each field

#### Scenario: Successful submission orchestrates creation
- **WHEN** the admin submits a valid form
- **THEN** the UI SHALL call a Convex mutation that creates or reuses the borrower, creates the mortgage with images/documents, and finally inserts the listing referencing that mortgage
- **AND** the response SHALL confirm the new listing ID
- **AND** the UI SHALL display a success toast and navigate back to admin listings overview

### Requirement: Component Selections
The form SHALL prefer HeroUI primitives and fall back to shadcn/ui only when HeroUI lacks equivalent components.

#### Scenario: HeroUI inputs by default
- **WHEN** rendering text, select, checkbox, or textarea inputs
- **THEN** the implementation SHALL use HeroUI form components
- **AND** styling SHALL follow the admin dashboard visual language

#### Scenario: Date and media controls
- **WHEN** the form needs date pickers, file uploads, or other controls missing from HeroUI
- **THEN** the implementation MAY use shadcn/ui components
- **AND** these fallbacks SHALL remain fully controlled via the Zustand store


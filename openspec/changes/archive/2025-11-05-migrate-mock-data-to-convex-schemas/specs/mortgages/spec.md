# Mortgages Schema Specification

## ADDED Requirements

### Requirement: Mortgage Table Structure

The system SHALL define a `mortgages` table with loan details, embedded property information, and borrower relationships.

#### Scenario: Create mortgage with core loan details
- **WHEN** a mortgage record is created
- **THEN** the system stores loanAmount, interestRate, originationDate, maturityDate
- **AND** validates loanAmount > 0 and interestRate > 0
- **AND** ensures maturityDate is after originationDate

#### Scenario: Store embedded property information
- **WHEN** a mortgage record is created with property details
- **THEN** the system stores address fields (street, city, state, zip, country)
- **AND** stores location coordinates (latitude, longitude)
- **AND** stores property type (detached, duplex, triplex, etc.)
- **AND** validates required address fields are non-empty

#### Scenario: Link borrower to mortgage
- **WHEN** a mortgage is created
- **THEN** the system requires a valid borrowerId reference
- **AND** validates the borrower exists in the borrowers table
- **AND** creates indexed reference for borrower lookups

#### Scenario: Store mortgage status
- **WHEN** a mortgage status is set
- **THEN** the system accepts values: "active", "renewed", "closed", "defaulted"
- **AND** defaults to "active" if not specified
- **AND** indexes status for filtering queries

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

# Borrowers Schema Specification

## ADDED Requirements

### Requirement: Borrower Table Structure

The system SHALL define a `borrowers` table with minimal profile information and Rotessa integration.

#### Scenario: Create borrower with core profile data
- **WHEN** a borrower record is created
- **THEN** the system stores name, email, rotessaCustomerId
- **AND** validates email format (contains @ and domain)
- **AND** validates name is non-empty
- **AND** validates rotessaCustomerId is non-empty

#### Scenario: Unique Rotessa customer mapping
- **WHEN** creating a borrower
- **THEN** the system enforces unique rotessaCustomerId per borrower
- **AND** rejects duplicate Rotessa customer IDs with clear error
- **AND** enables bidirectional sync with Rotessa

#### Scenario: Optional email uniqueness
- **WHEN** creating borrowers with the same email
- **THEN** the system allows multiple borrowers with same email
- **AND** does not enforce email uniqueness
- **AND** relies on rotessaCustomerId as primary identifier

### Requirement: Borrower Independence from Users

The system SHALL maintain separation between borrowers and platform users.

#### Scenario: Create borrower without user account
- **WHEN** a borrower record is created
- **THEN** the system does not require a userId reference
- **AND** does not validate against users table
- **AND** allows borrower tracking without platform access

#### Scenario: Borrower cannot access marketplace
- **WHEN** querying borrower capabilities
- **THEN** borrowers have no platform authentication
- **AND** cannot access listings or marketplace features
- **AND** are tracked for loan management only

#### Scenario: Future user account linking
- **WHEN** a borrower later creates a platform account
- **THEN** the system can optionally add userId field in future
- **AND** current schema remains valid
- **AND** no migration required for existing borrowers

### Requirement: Rotessa Integration

The system SHALL support integration with Rotessa payment processing.

#### Scenario: Store Rotessa customer ID
- **WHEN** a borrower is created or synced from Rotessa
- **THEN** the system stores rotessaCustomerId
- **AND** uses this ID for payment reconciliation
- **AND** enables payment queries by customer

#### Scenario: Bidirectional sync support
- **WHEN** borrower data is updated
- **THEN** the system maintains stable rotessaCustomerId
- **AND** enables sync of changes back to Rotessa
- **AND** preserves referential integrity with payments

#### Scenario: Query borrower by Rotessa ID
- **WHEN** looking up borrower via Rotessa customer ID
- **THEN** the system uses by_rotessa_customer_id index
- **AND** returns borrower in O(log n) time
- **AND** returns null if Rotessa ID not found

### Requirement: Borrower Queries

The system SHALL provide query functions for borrower data access.

#### Scenario: Get borrower by ID
- **WHEN** querying a borrower by ID
- **THEN** the system returns complete borrower record
- **AND** includes name, email, rotessaCustomerId
- **AND** returns null if ID doesn't exist

#### Scenario: Get borrower by Rotessa customer ID
- **WHEN** querying by rotessaCustomerId
- **THEN** the system uses indexed lookup
- **AND** returns matching borrower
- **AND** enables payment reconciliation workflows

#### Scenario: List all borrowers
- **WHEN** listing borrowers (admin operation)
- **THEN** the system returns all borrower records
- **AND** supports pagination for large datasets
- **AND** orders by creation time descending

#### Scenario: Search borrowers by email
- **WHEN** searching by email
- **THEN** the system uses by_email index
- **AND** returns all borrowers matching email
- **AND** supports partial email matches via filter function

### Requirement: Borrower Mutations

The system SHALL provide mutation functions for borrower lifecycle operations.

#### Scenario: Create new borrower
- **WHEN** creating a borrower
- **THEN** the system validates all required fields present
- **AND** validates email format
- **AND** validates unique rotessaCustomerId
- **AND** returns new borrower ID

#### Scenario: Update borrower profile
- **WHEN** updating borrower information
- **THEN** the system allows updating name and email
- **AND** prevents updating rotessaCustomerId (stable identifier)
- **AND** triggers reactive query updates

#### Scenario: Prevent orphaning mortgages
- **WHEN** attempting to delete a borrower
- **THEN** the system checks for linked mortgages
- **AND** rejects deletion if mortgages exist
- **AND** provides clear error about dependency
- **AND** requires mortgage resolution first

### Requirement: Type Safety and Validation

The system SHALL enforce type safety and data validation at schema level.

#### Scenario: Validate required fields
- **WHEN** creating or updating a borrower
- **THEN** the system requires: name, email, rotessaCustomerId
- **AND** rejects writes with missing fields
- **AND** provides validation error messages

#### Scenario: Email format validation
- **WHEN** setting email field
- **THEN** the system validates email contains @ symbol
- **AND** validates domain part exists after @
- **AND** rejects invalid email formats with clear error

#### Scenario: Auto-generate TypeScript types
- **WHEN** schema is defined
- **THEN** Convex generates Doc<"borrowers"> type
- **AND** generates Id<"borrowers"> for IDs
- **AND** enables compile-time type checking

### Requirement: Indexing Strategy

The system SHALL provide indexed access patterns for borrower lookups.

#### Scenario: Index by Rotessa customer ID
- **WHEN** schema defines by_rotessa_customer_id index
- **THEN** the system creates unique index on rotessaCustomerId
- **AND** enables O(log n) payment reconciliation lookups
- **AND** enforces uniqueness constraint

#### Scenario: Index by email
- **WHEN** schema defines by_email index
- **THEN** the system creates index on email field
- **AND** enables efficient email-based searches
- **AND** supports contact lookup workflows

### Requirement: Minimal Data Model

The system SHALL maintain minimal borrower data following YAGNI principles.

#### Scenario: Exclude unnecessary fields
- **WHEN** defining borrower schema
- **THEN** the system stores only: name, email, rotessaCustomerId
- **AND** does not store phone, address, or extended profile
- **AND** does not store authentication credentials
- **AND** keeps model as simple as possible

#### Scenario: Extensibility for future fields
- **WHEN** future requirements need additional fields
- **THEN** schema can add optional fields without migration
- **AND** existing records remain valid
- **AND** new fields default to undefined

#### Scenario: No premature optimization
- **WHEN** implementing borrower features
- **THEN** the system adds complexity only when needed
- **AND** validates requirements before adding fields
- **AND** maintains loose coupling with other tables

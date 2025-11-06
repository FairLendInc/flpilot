# Mortgages Capability - External Source Identifiers

## MODIFIED Requirements

### Requirement: Mortgage Table Structure
The mortgage data model SHALL accept an optional external identifier for upstream integrations.

#### Scenario: Store external mortgage identifier
- **WHEN** a mortgage is created through the listing creation flows
- **THEN** the system SHALL allow persisting an optional `externalMortgageId` string on the mortgage record
- **AND** if provided, the value SHALL be unique per mortgage and indexed for lookups
- **AND** the optional field SHALL NOT be required for existing internal workflows

### Requirement: Mortgage Mutations
Mortgage creation SHALL prevent duplicate records when an external identifier is provided.

#### Scenario: Idempotent mortgage creation
- **WHEN** the create mortgage mutation receives an `externalMortgageId`
- **THEN** it SHALL query for an existing mortgage with the same identifier
- **AND** if one exists, it SHALL reuse that mortgage instead of inserting a new row
- **AND** the mutation SHALL return the existing mortgage ID so downstream listing creation remains idempotent

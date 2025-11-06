# Mortgage Ownership Schema Specification

## ADDED Requirements

### Requirement: Ownership Cap Table Structure

The system SHALL define a `mortgage_ownership` table implementing a cap table for tracking ownership percentages.

#### Scenario: Create ownership entry
- **WHEN** an ownership record is created
- **THEN** the system stores mortgageId, ownerId, ownershipPercentage
- **AND** validates mortgageId references existing mortgage
- **AND** validates ownershipPercentage is between 0 and 100
- **AND** validates ownerId is non-empty string

#### Scenario: Support institutional ownership
- **WHEN** creating ownership for FairLend institution
- **THEN** the system accepts ownerId = "fairlend" string literal
- **AND** treats "fairlend" as valid owner identifier
- **AND** does not validate against users table

#### Scenario: Support individual investor ownership
- **WHEN** creating ownership for individual investor
- **THEN** the system accepts ownerId as userId from users table
- **AND** validates user exists when ownerId is not "fairlend"
- **AND** enables investor portfolio queries

#### Scenario: Track fractional ownership percentages
- **WHEN** creating or updating ownership
- **THEN** the system stores ownershipPercentage as decimal
- **AND** validates percentage is precise to 2 decimal places
- **AND** enables fractional ownership calculations

### Requirement: Ownership Validation

The system SHALL validate cap table integrity at application level.

#### Scenario: Validate 100% total ownership
- **WHEN** querying ownership for a mortgage
- **THEN** the application validates sum of ownershipPercentage = 100
- **AND** warns if sum is not exactly 100
- **AND** prevents ownership transfers that break this constraint

#### Scenario: Prevent duplicate owner entries
- **WHEN** creating ownership record
- **THEN** the system validates no existing record with same mortgageId + ownerId
- **AND** rejects duplicates with clear error
- **AND** suggests updating existing record instead

#### Scenario: Allow ownership percentage updates
- **WHEN** ownership percentage changes (future fractional transfers)
- **THEN** the system allows updating ownershipPercentage field
- **AND** validates new percentage is valid (0-100)
- **AND** triggers validation of total percentages

### Requirement: Owner Type Union Handling

The system SHALL support union type for owner references (user ID or institution string).

#### Scenario: Distinguish owner types
- **WHEN** querying ownership records
- **THEN** the system identifies "fairlend" as institutional owner
- **AND** validates other ownerIds as user references
- **AND** enables type-specific display logic in UI

#### Scenario: Future institution table migration
- **WHEN** institutions table is added in future
- **THEN** existing "fairlend" strings can be migrated to institution IDs
- **AND** ownerId validation can be updated to accept institution references
- **AND** no breaking changes to ownership records

#### Scenario: Application-level type safety
- **WHEN** application code accesses ownerId
- **THEN** code checks if ownerId === "fairlend"
- **AND** handles institutional vs user ownership separately
- **AND** type guards ensure safe owner data access

### Requirement: Ownership Transfer Operations

The system SHALL support ownership transfer workflows via cap table updates.

#### Scenario: Transfer full ownership
- **WHEN** transferring 100% ownership from one owner to another
- **THEN** the system updates existing ownership record
- **AND** changes ownerId and maintains 100% percentage
- **AND** logs transfer in audit trail

#### Scenario: Prepare for fractional transfers
- **WHEN** cap table supports multiple owners (future)
- **THEN** transfers can split ownership between multiple records
- **AND** system validates sum remains 100%
- **AND** creates new records for new fractional owners

#### Scenario: Initial ownership assignment
- **WHEN** mortgage is first created
- **THEN** the system creates ownership record with ownerId = "fairlend"
- **AND** sets ownershipPercentage = 100
- **AND** establishes baseline ownership

### Requirement: Ownership Queries

The system SHALL provide query functions for ownership data access.

#### Scenario: Get cap table for mortgage
- **WHEN** querying ownership for a specific mortgage
- **THEN** the system uses by_mortgage index
- **AND** returns all ownership records for that mortgage
- **AND** orders by ownershipPercentage descending (largest owners first)

#### Scenario: Get investor portfolio
- **WHEN** querying all mortgages owned by a user
- **THEN** the system uses by_owner index
- **AND** returns all ownership records for that ownerId
- **AND** enables portfolio value calculations

#### Scenario: Check if user owns mortgage
- **WHEN** validating ownership permissions
- **THEN** the system queries by both mortgageId and ownerId
- **AND** returns ownership percentage if found
- **AND** returns null if user doesn't own mortgage

#### Scenario: Get institutional portfolio
- **WHEN** querying FairLend-owned mortgages
- **THEN** the system queries by_owner with ownerId = "fairlend"
- **AND** returns all mortgages currently owned by institution
- **AND** supports institutional reporting

### Requirement: Ownership Mutations

The system SHALL provide mutation functions for cap table operations.

#### Scenario: Create ownership record
- **WHEN** creating new ownership entry
- **THEN** the system validates all required fields
- **AND** validates mortgage exists
- **AND** validates owner is valid (user or "fairlend")
- **AND** returns new ownership record ID

#### Scenario: Update ownership percentage
- **WHEN** modifying ownership percentage
- **THEN** the system validates new percentage is 0-100
- **AND** updates record atomically
- **AND** triggers validation of total percentages
- **AND** updates reactive queries

#### Scenario: Transfer ownership
- **WHEN** transferring ownership to new owner
- **THEN** the system updates ownerId field
- **AND** maintains ownership percentage
- **AND** validates new owner is valid
- **AND** logs transfer for audit

#### Scenario: Remove ownership record
- **WHEN** ownership percentage becomes 0 (future fractional transfers)
- **THEN** the system allows deleting ownership record
- **AND** validates this doesn't break 100% total constraint
- **AND** requires other owners to sum to 100%

### Requirement: Type Safety and Validation

The system SHALL enforce type safety and data validation at schema level.

#### Scenario: Validate required fields
- **WHEN** creating or updating ownership
- **THEN** the system requires: mortgageId, ownerId, ownershipPercentage
- **AND** rejects writes with missing fields
- **AND** provides validation error messages

#### Scenario: Validate percentage range
- **WHEN** setting ownershipPercentage
- **THEN** the system validates value >= 0
- **AND** validates value <= 100
- **AND** validates precision to 2 decimal places

#### Scenario: Auto-generate TypeScript types
- **WHEN** schema is defined
- **THEN** Convex generates Doc<"mortgage_ownership"> type
- **AND** generates Id<"mortgage_ownership"> for IDs
- **AND** ownerId typed as string (union handled in application)

### Requirement: Indexing Strategy

The system SHALL provide indexed access patterns for ownership queries.

#### Scenario: Index by mortgage
- **WHEN** schema defines by_mortgage index
- **THEN** the system creates index on mortgageId
- **AND** enables O(log n) cap table lookups
- **AND** supports ownership verification queries

#### Scenario: Index by owner
- **WHEN** schema defines by_owner index
- **THEN** the system creates index on ownerId
- **AND** enables O(log n) portfolio queries
- **AND** supports user and institutional portfolio views

#### Scenario: Compound index for ownership checks
- **WHEN** checking specific user ownership
- **THEN** the system uses compound index on [mortgageId, ownerId]
- **AND** enables single-query ownership validation
- **AND** optimizes permission checks

### Requirement: Extensibility for Fractional Ownership

The system SHALL prepare for future fractional ownership feature without implementing it now.

#### Scenario: Single-owner pattern (current)
- **WHEN** mortgages are currently owned
- **THEN** each mortgage has exactly one ownership record
- **AND** ownershipPercentage is always 100
- **AND** ownerId is either "fairlend" or single userId

#### Scenario: Multi-owner pattern (future)
- **WHEN** fractional ownership is implemented later
- **THEN** mortgages can have multiple ownership records
- **AND** each record has ownershipPercentage < 100
- **AND** sum of all percentages = 100
- **AND** no schema changes required

#### Scenario: Ownership split transactions
- **WHEN** implementing fractional sales (future)
- **THEN** transaction updates multiple ownership records atomically
- **AND** maintains 100% total constraint
- **AND** uses Convex transaction guarantees

#### Scenario: Ownership distribution logic
- **WHEN** distributing payments or proceeds (future)
- **THEN** application uses ownershipPercentage for calculations
- **AND** sends proportional amounts to each owner
- **AND** handles rounding to ensure total = 100%

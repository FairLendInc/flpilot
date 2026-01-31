## MODIFIED Requirements

### Requirement: Ownership Transfer Operations
The system SHALL support ownership transfer workflows via cap table updates with HITL review.

#### Scenario: Transfer full ownership
- **WHEN** transferring 100% ownership from one owner to another
- **THEN** the system creates a pending transfer record for review
- **AND** upon approval, updates existing ownership record
- **AND** changes ownerId and maintains percentage
- **AND** logs transfer in audit trail via event emission

#### Scenario: Prepare for fractional transfers
- **WHEN** cap table supports multiple owners (future)
- **THEN** transfers can split ownership between multiple records
- **AND** system validates sum remains 100%
- **AND** creates new records for new fractional owners
- **AND** each transfer requires HITL review

#### Scenario: Initial ownership assignment
- **WHEN** mortgage is first created
- **THEN** the system creates ownership record with ownerId = "fairlend"
- **AND** sets ownershipPercentage = 100
- **AND** establishes baseline ownership

#### Scenario: Ownership transfer via deal completion
- **WHEN** a deal's ownership transfer is approved
- **THEN** the system calls `createOwnershipInternal()` with:
  - `mortgageId` from the deal
  - `ownerId` as the investor's user ID
  - `ownershipPercentage` from the pending transfer record
- **AND** the 100% invariant is maintained automatically

## ADDED Requirements

### Requirement: Ownership Transfer Review Query
The system SHALL provide queries for ownership transfer review.

#### Scenario: Get current ownership for review
- **WHEN** admin views a pending ownership transfer
- **THEN** the system returns the current cap table for the mortgage
- **AND** includes all owners with their percentages
- **AND** calculates what the cap table will look like after transfer

#### Scenario: Preview ownership after transfer
- **WHEN** previewing an ownership transfer
- **THEN** the system calculates:
  - Current owner percentages (before)
  - Proposed transfer details (from, to, percentage)
  - Resulting owner percentages (after)
- **AND** validates the result maintains 100% total
- **AND** shows FairLend's remaining percentage (if any)

### Requirement: Ownership Transfer Validation
The system SHALL validate ownership transfers before approval.

#### Scenario: Validate sufficient source ownership
- **WHEN** approving an ownership transfer
- **AND** the source owner (fromOwnerId) does not have sufficient percentage
- **THEN** the transfer is rejected
- **AND** error indicates current vs requested percentage

#### Scenario: Validate target user exists
- **WHEN** approving an ownership transfer
- **AND** the target user (toOwnerId) does not exist
- **THEN** the transfer is rejected
- **AND** error indicates invalid user ID

#### Scenario: Validate mortgage exists
- **WHEN** approving an ownership transfer
- **AND** the mortgage does not exist
- **THEN** the transfer is rejected
- **AND** error indicates mortgage not found

### Requirement: Ownership Transfer Audit Trail
The system SHALL emit events for all ownership operations.

#### Scenario: Emit event on transfer approval
- **WHEN** an ownership transfer is approved and executed
- **THEN** an audit event is emitted with:
  - `eventType`: "ownership.transferred"
  - `entityType`: "mortgage_ownership"
  - `entityId`: The mortgage ID
  - `beforeState`: Cap table before transfer
  - `afterState`: Cap table after transfer
  - `metadata`: Transfer details (from, to, percentage, deal ID)

#### Scenario: Emit event on transfer rejection
- **WHEN** an ownership transfer is rejected
- **THEN** an audit event is emitted with:
  - `eventType`: "ownership.transfer_rejected"
  - `entityType`: "pending_ownership_transfers"
  - `entityId`: The pending transfer ID
  - `metadata`: Rejection reason, reviewer ID

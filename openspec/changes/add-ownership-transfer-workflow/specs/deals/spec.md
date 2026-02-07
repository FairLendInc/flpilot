## MODIFIED Requirements

### Requirement: Deals Table Schema
The system MUST create a `deals` table to track deal lifecycle with ownership transfer review.

#### Scenario: Deal Record Creation
Given an investor locks a listing
When the deal creation action is triggered
Then a new record is created in the `deals` table
And the record includes:
- `mortgageId`: Reference to the mortgage
- `listingId`: Reference to the listing
- `investorId`: Reference to the locking investor
- `currentState`: Initial state "locked"
- `purchasePercentage`: Percentage being purchased (100 for pilot)
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update

#### Scenario: Deal Status Transitions
Given a deal exists with status "pending_verification"
When funds are verified successfully
Then status transitions to "pending_ownership_review"
When admin approves the ownership transfer
Then status transitions to "completed"
And ownership is transferred to investor.

#### Scenario: Deal State Includes Ownership Review
Given a deal is in any active state
When querying deal states
Then the system returns all valid states including "pending_ownership_review"
And the state machine enforces this transition path.

## ADDED Requirements

### Requirement: Pending Ownership Review State
The system SHALL implement a `pending_ownership_review` state for human-in-the-loop approval before ownership transfers.

#### Scenario: Transition to Ownership Review
- **WHEN** a deal in `pending_verification` state has funds verified
- **THEN** the deal transitions to `pending_ownership_review`
- **AND** a pending ownership transfer record is created
- **AND** an audit event is emitted with type "deal.ownership_review_started"
- **AND** the investor sees "Finalizing Transfer" status

#### Scenario: Approve Ownership Transfer
- **WHEN** an admin reviews the pending ownership transfer
- **AND** clicks "Confirm Transfer"
- **THEN** the pending transfer record is marked "approved"
- **AND** ownership is transferred via `createOwnershipInternal()`
- **AND** the deal transitions to `completed` state
- **AND** an audit event is emitted with type "ownership.transferred"
- **AND** the deal's `completedAt` timestamp is set

#### Scenario: Reject Ownership Transfer
- **WHEN** an admin reviews the pending ownership transfer
- **AND** clicks "Reject Transfer" with a reason
- **THEN** the pending transfer record is marked "rejected"
- **AND** the deal returns to `pending_verification` state
- **AND** an audit event is emitted with type "deal.ownership_review_rejected"
- **AND** an alert is created for the admin with the rejection reason

### Requirement: Ownership Transfer Gating
The system SHALL gate ownership transfer behind deal prerequisites.

#### Scenario: Prerequisites Not Met
- **WHEN** attempting to transition to `pending_ownership_review`
- **AND** any prerequisite is not satisfied:
  - Deal not in `pending_verification` state
  - Not all documents signed
  - Funds not verified
- **THEN** the transition is rejected
- **AND** an error message indicates which prerequisite failed

#### Scenario: All Prerequisites Met
- **WHEN** attempting to transition to `pending_ownership_review`
- **AND** all prerequisites are satisfied:
  - Deal in `pending_verification` state
  - All `deal_documents` have status "signed"
  - Fund transfer proof uploaded
  - Admin has verified funds
- **THEN** the transition succeeds
- **AND** a pending ownership transfer record is created

### Requirement: Pending Ownership Transfers Table
The system SHALL store pending ownership transfers for review.

#### Scenario: Create Pending Transfer
- **WHEN** a deal enters `pending_ownership_review` state
- **THEN** a record is created in `pending_ownership_transfers` table with:
  - `dealId`: Reference to the deal
  - `mortgageId`: Reference to the mortgage
  - `fromOwnerId`: Current owner (typically "fairlend")
  - `toOwnerId`: Investor receiving ownership
  - `percentage`: Transfer percentage (100 for pilot)
  - `status`: "pending"
  - `createdAt`: Current timestamp

#### Scenario: Query Pending Transfers
- **WHEN** admin views the ownership review queue
- **THEN** the system returns all pending transfers with status "pending"
- **AND** includes joined deal, mortgage, and investor data
- **AND** orders by creation time (oldest first)

### Requirement: Deal State Machine Extension
The system SHALL extend the XState machine with ownership review state.

#### Scenario: State Machine Includes New State
- **WHEN** the deal state machine is defined
- **THEN** it includes the `pending_ownership_review` state
- **AND** transitions from `pending_verification` to `pending_ownership_review` via `VERIFY_COMPLETE` event
- **AND** transitions from `pending_ownership_review` to `completed` via `CONFIRM_TRANSFER` event
- **AND** transitions from `pending_ownership_review` back to `pending_verification` via `REJECT_TRANSFER` event

#### Scenario: Backward Compatibility
- **WHEN** existing deals are in states before `pending_ownership_review`
- **THEN** they continue to function with existing transitions
- **AND** only new deals or deals advancing past verification use the new state

### Requirement: Manual Resolution Escalation
The system SHALL escalate deals to manual resolution when ownership transfer fails after retry.

#### Scenario: Escalate after second rejection
- **WHEN** an ownership transfer is rejected
- **AND** the deal has already been rejected once before
- **THEN** the deal is flagged as requiring manual resolution
- **AND** a high-priority alert is created for admin
- **AND** an audit event is emitted with type "deal.manual_resolution_required"
- **AND** the deal remains in `pending_verification` state

#### Scenario: Manual resolution options
- **WHEN** an admin views a deal requiring manual resolution
- **THEN** they see the rejection history with reasons
- **AND** can choose: force approve transfer, cancel deal, or contact investor
- **AND** any action taken is logged in the audit trail

#### Scenario: Force approve transfer
- **WHEN** an admin force approves a transfer on a manual resolution deal
- **THEN** the transfer proceeds despite previous rejections
- **AND** the admin must provide a justification note
- **AND** an audit event is emitted with type "deal.manual_resolution_force_approved"

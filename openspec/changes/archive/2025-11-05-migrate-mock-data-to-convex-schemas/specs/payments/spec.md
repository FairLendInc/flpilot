# Payments Schema Specification

## ADDED Requirements

### Requirement: Payments Table Structure

The system SHALL define a `payments` table as a front-end view of Rotessa payment data.

#### Scenario: Create payment record
- **WHEN** a payment record is created
- **THEN** the system stores mortgageId, amount, processDate, status
- **AND** validates mortgageId references existing mortgage
- **AND** validates amount > 0
- **AND** validates processDate is valid ISO date string

#### Scenario: Store Rotessa payment identifiers
- **WHEN** syncing payment from Rotessa
- **THEN** the system stores paymentId (Rotessa payment identifier)
- **AND** stores customerId (Rotessa customer reference)
- **AND** stores transactionScheduleId (Rotessa schedule reference)
- **AND** enables payment reconciliation with Rotessa

#### Scenario: Track payment status
- **WHEN** payment status is set
- **THEN** the system accepts values: "pending", "cleared", "failed"
- **AND** defaults to "pending" for new payments
- **AND** indexes status for filtering queries

### Requirement: Interest-Only Payment Model

The system SHALL store interest-only payments without principal breakdown.

#### Scenario: Store single payment amount
- **WHEN** creating payment record
- **THEN** the system stores total payment amount
- **AND** does not break down principal, interest, escrow
- **AND** assumes all payments are interest-only

#### Scenario: Exclude payment type field
- **WHEN** defining payment schema
- **THEN** the system does not include type field
- **AND** does not track principal vs interest portions
- **AND** keeps model minimal for bridge loan structure

#### Scenario: Calculate interest amounts
- **WHEN** displaying payment details
- **THEN** application can calculate expected interest from mortgage.interestRate
- **AND** compares actual payment amount to expected
- **AND** identifies discrepancies

### Requirement: Payment-Mortgage Relationship

The system SHALL link payments to mortgages via mortgageId reference.

#### Scenario: Multiple payments per mortgage
- **WHEN** mortgage has payment schedule
- **THEN** the system allows multiple payment records per mortgageId
- **AND** supports monthly payment history
- **AND** enables payment timeline display

#### Scenario: Query payments for mortgage
- **WHEN** displaying payment history
- **THEN** the system uses by_mortgage index
- **AND** returns all payments for that mortgage
- **AND** orders by processDate descending (most recent first)

#### Scenario: Orphan payment prevention
- **WHEN** attempting to delete mortgage with payments
- **THEN** the system checks for linked payments
- **AND** cascades delete to remove payments
- **OR** rejects deletion with clear error

### Requirement: Rotessa Integration

The system SHALL support bidirectional sync with Rotessa payment processor.

#### Scenario: Sync payment from Rotessa webhook
- **WHEN** Rotessa webhook delivers payment event
- **THEN** the system creates or updates payment record
- **AND** uses paymentId as unique identifier
- **AND** updates status based on Rotessa event type

#### Scenario: Prevent duplicate payments
- **WHEN** receiving duplicate Rotessa webhook
- **THEN** the system checks for existing paymentId
- **AND** updates existing record instead of creating duplicate
- **AND** maintains idempotency

#### Scenario: Reconcile with Rotessa customer
- **WHEN** linking payment to borrower
- **THEN** the system uses customerId to find borrower via borrowers.rotessaCustomerId
- **AND** validates payment belongs to correct mortgage's borrower
- **AND** flags mismatches for review

#### Scenario: Link to Rotessa transaction schedule
- **WHEN** payment is part of recurring schedule
- **THEN** the system stores transactionScheduleId
- **AND** enables querying all payments for schedule
- **AND** supports schedule-based payment tracking

### Requirement: Payment Status Transitions

The system SHALL track payment lifecycle through status changes.

#### Scenario: Pending payment creation
- **WHEN** scheduled payment is created
- **THEN** the system sets status = "pending"
- **AND** payment awaits processing
- **AND** appears in upcoming payments view

#### Scenario: Payment clearance
- **WHEN** payment processes successfully
- **THEN** the system updates status = "cleared"
- **AND** updates processDate to actual clear date
- **AND** moves to payment history

#### Scenario: Payment failure
- **WHEN** payment fails to process
- **THEN** the system sets status = "failed"
- **AND** preserves original processDate
- **AND** triggers notification workflow

#### Scenario: Retry failed payment
- **WHEN** retrying failed payment
- **THEN** the system creates new pending payment
- **AND** preserves failed payment record for audit
- **AND** links retry to original via metadata or notes

### Requirement: Payment Queries

The system SHALL provide query functions for payment data access.

#### Scenario: Get payments for mortgage
- **WHEN** querying payment history
- **THEN** the system uses by_mortgage index
- **AND** returns payments ordered by processDate descending
- **AND** supports pagination for long histories

#### Scenario: Filter payments by status
- **WHEN** filtering by payment status
- **THEN** the system uses by_status index
- **AND** returns only payments matching status
- **AND** enables pending/cleared/failed views

#### Scenario: Get payments by date range
- **WHEN** querying payments in date range
- **THEN** the system uses by_process_date index
- **AND** returns payments within specified range
- **AND** supports monthly/quarterly reporting

#### Scenario: Get pending payments for portfolio
- **WHEN** viewing all pending payments
- **THEN** the system queries by status = "pending"
- **AND** joins with mortgages for context
- **AND** supports portfolio cash flow projections

#### Scenario: Get payment by Rotessa ID
- **WHEN** reconciling with Rotessa
- **THEN** the system queries by paymentId
- **AND** returns matching payment record
- **AND** enables webhook idempotency checks

### Requirement: Payment Mutations

The system SHALL provide mutation functions for payment lifecycle operations.

#### Scenario: Create payment record
- **WHEN** creating new payment
- **THEN** the system validates all required fields
- **AND** validates mortgage exists
- **AND** validates amount > 0
- **AND** returns new payment ID

#### Scenario: Update payment status
- **WHEN** payment status changes
- **THEN** the system validates new status is valid enum
- **AND** updates status field atomically
- **AND** triggers reactive query updates

#### Scenario: Bulk create scheduled payments
- **WHEN** creating payment schedule
- **THEN** the system accepts array of payment data
- **AND** creates all pending payments
- **AND** maintains atomic consistency

#### Scenario: Update payment from Rotessa sync
- **WHEN** Rotessa webhook updates payment
- **THEN** the system finds payment by paymentId
- **AND** updates status and processDate
- **AND** preserves other fields

### Requirement: Type Safety and Validation

The system SHALL enforce type safety and data validation at schema level.

#### Scenario: Validate required fields
- **WHEN** creating or updating payment
- **THEN** the system requires: mortgageId, amount, processDate, status, paymentId, customerId, transactionScheduleId
- **AND** rejects writes with missing fields
- **AND** provides validation error messages

#### Scenario: Validate payment amount
- **WHEN** setting amount field
- **THEN** the system validates amount > 0
- **AND** validates amount is reasonable for mortgage
- **AND** flags amounts exceeding expected interest by >10%

#### Scenario: Validate status enum
- **WHEN** setting status field
- **THEN** the system validates value is "pending", "cleared", or "failed"
- **AND** rejects invalid status values
- **AND** provides clear error message

#### Scenario: Auto-generate TypeScript types
- **WHEN** schema is defined
- **THEN** Convex generates Doc<"payments"> type
- **AND** generates Id<"payments"> for IDs
- **AND** provides status enum type definition

### Requirement: Indexing Strategy

The system SHALL provide indexed access patterns for payment queries.

#### Scenario: Index by mortgage
- **WHEN** schema defines by_mortgage index
- **THEN** the system creates index on mortgageId
- **AND** enables O(log n) payment history lookups
- **AND** supports efficient timeline displays

#### Scenario: Index by status
- **WHEN** schema defines by_status index
- **THEN** the system creates index on status field
- **AND** enables efficient pending/cleared/failed filtering
- **AND** supports payment status dashboards

#### Scenario: Index by process date
- **WHEN** schema defines by_process_date index
- **THEN** the system creates index on processDate
- **AND** enables temporal filtering and sorting
- **AND** supports date range queries

#### Scenario: Index by Rotessa payment ID
- **WHEN** schema defines by_payment_id index
- **THEN** the system creates unique index on paymentId
- **AND** enables idempotency checks
- **AND** supports webhook reconciliation

### Requirement: Payment Timeline Display

The system SHALL support payment history visualization features.

#### Scenario: Display payment timeline
- **WHEN** showing mortgage payment history
- **THEN** application displays payments ordered by processDate
- **AND** shows status indicators (cleared/pending/failed)
- **AND** groups by month or year

#### Scenario: Calculate payment statistics
- **WHEN** analyzing payment performance
- **THEN** application calculates total paid, on-time rate, late rate
- **AND** derives payment reliability metrics
- **AND** supports investor reporting

#### Scenario: Identify late payments
- **WHEN** payment processDate is past due date
- **THEN** application flags payment as late
- **AND** calculates days late
- **AND** triggers late payment workflow

#### Scenario: Project future payments
- **WHEN** displaying payment schedule
- **THEN** application uses pending payments + transactionScheduleId
- **AND** projects future payment dates
- **AND** shows expected vs actual payments

### Requirement: Front-End View Model

The system SHALL maintain payments as view data with Rotessa as source of truth.

#### Scenario: Read-only payment data
- **WHEN** displaying payments in UI
- **THEN** the system treats payment data as read-only view
- **AND** does not allow direct payment modifications by users
- **AND** updates only via Rotessa sync

#### Scenario: Sync lag handling
- **WHEN** Rotessa data updates
- **THEN** UI may show stale data briefly
- **AND** reactive queries update when sync completes
- **AND** displays sync timestamp for transparency

#### Scenario: Rotessa as authority
- **WHEN** payment data conflicts arise
- **THEN** Rotessa data is authoritative
- **AND** Convex data is overwritten on sync
- **AND** preserves audit trail of changes

### Requirement: Payment Data Integrity

The system SHALL maintain integrity between payments, mortgages, and borrowers.

#### Scenario: Validate payment belongs to mortgage
- **WHEN** creating payment
- **THEN** the system validates mortgageId is valid
- **AND** optionally validates amount matches mortgage.monthlyPayment
- **AND** flags significant discrepancies

#### Scenario: Validate customer matches borrower
- **WHEN** syncing payment from Rotessa
- **THEN** application validates customerId matches mortgage.borrower.rotessaCustomerId
- **AND** flags mismatched payments for review
- **AND** prevents payment misattribution

#### Scenario: Cascade delete payments with mortgage
- **WHEN** mortgage is deleted
- **THEN** the system deletes all linked payments
- **AND** maintains referential integrity
- **AND** optionally archives payments for audit

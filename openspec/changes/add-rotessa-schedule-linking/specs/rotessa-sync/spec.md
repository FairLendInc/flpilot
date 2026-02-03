# rotessa-sync Specification Delta

## ADDED Requirements

### Requirement: Manual Schedule Linking

The system SHALL allow admins to manually link orphaned Rotessa payment schedules to mortgages.

#### Scenario: Link schedule to mortgage
- **GIVEN** an admin on the schedule linking page
- **WHEN** they select an unlinked schedule and an available mortgage
- **AND** click the link button
- **THEN** the system sets `mortgage.rotessaScheduleId` to the schedule ID
- **AND** updates `mortgage.rotessaScheduleStatus` to "active"
- **AND** the schedule disappears from the unlinked list
- **AND** the mortgage disappears from the available list

#### Scenario: Exclude already-linked schedules
- **WHEN** fetching unlinked schedules from Rotessa
- **THEN** the system excludes schedules that have a corresponding `mortgage.rotessaScheduleId` in the database
- **AND** only displays truly orphaned schedules

#### Scenario: Exclude mortgages with schedules
- **WHEN** fetching available mortgages
- **THEN** the system excludes mortgages where `rotessaScheduleId` is set
- **AND** only displays mortgages needing schedule linkage

#### Scenario: Validate schedule exists in Rotessa
- **WHEN** attempting to link a schedule
- **THEN** the system validates the schedule exists via Rotessa API
- **AND** fails with error if schedule not found

#### Scenario: Warn on borrower mismatch
- **WHEN** the Rotessa schedule customer does not match the mortgage borrower
- **THEN** the system displays a warning to the admin
- **AND** allows the admin to proceed with linking

---

### Requirement: Historical Payment Backfill

The system SHALL backfill historical Approved payments to Formance Ledger when linking a schedule.

#### Scenario: Trigger backfill on link
- **GIVEN** an admin linking a schedule with backfill enabled
- **WHEN** the link is successful
- **THEN** the system schedules the backfill action
- **AND** creates a `backfill_log` entry with status "running"

#### Scenario: Backfill only Approved payments
- **WHEN** backfilling historical payments
- **THEN** the system fetches all transactions for the schedule from Rotessa
- **AND** filters to only "Approved" status transactions
- **AND** ignores "Future", "Pending", and "Declined" transactions

#### Scenario: Record payment with settlement date
- **WHEN** recording a historical payment to Formance
- **THEN** the system uses the Rotessa `settlement_date` as the Formance `timestamp`
- **AND** this enables bi-temporal queries showing when funds actually cleared

#### Scenario: Idempotent backfill
- **WHEN** a payment has already been recorded in Formance
- **THEN** the system detects the duplicate reference
- **AND** treats the 409 conflict as success
- **AND** does not create duplicate ledger entries

#### Scenario: Per-payment error isolation
- **WHEN** a single payment fails to record in Formance
- **THEN** the system logs the error for that payment
- **AND** continues processing remaining payments
- **AND** updates backfill_log metrics with error count

#### Scenario: Backfill completion
- **WHEN** all payments have been processed
- **THEN** the system updates backfill_log status to "completed" or "partial"
- **AND** records final metrics (transactionsFound, paymentsCreated, ledgerTransactionsCreated, errors)

---

### Requirement: Backfill Log Tracking

The system SHALL maintain logs of backfill operations for auditing.

#### Scenario: Create backfill log
- **WHEN** a backfill operation starts
- **THEN** the system creates a `backfill_log` entry
- **AND** records mortgageId, scheduleId, triggeredBy, startedAt
- **AND** sets status to "running"

#### Scenario: Update backfill log on completion
- **WHEN** backfill completes successfully
- **THEN** the system updates status to "completed"
- **AND** records completedAt timestamp
- **AND** records metrics (transactionsFound, paymentsCreated, ledgerTransactionsCreated, errors)

#### Scenario: Update backfill log on partial failure
- **WHEN** backfill completes with some errors
- **THEN** the system updates status to "partial"
- **AND** records both success and error metrics
- **AND** stores error details array

---

## MODIFIED Requirements

### Requirement: Ledger Integration

The system SHALL record approved payments in Formance Ledger.

#### Scenario: Record payment in ledger on approval
- **WHEN** transaction status is "Approved"
- **AND** payment.ledgerTransactionId is not set
- **THEN** the system executes payment collection Numscript
- **AND** stores ledgerTransactionId in payment record
- **AND** uses idempotency reference: "payment:{paymentId}:{mortgageId}"

#### Scenario: Ledger transaction structure
- **WHEN** recording payment in ledger
- **THEN** first posting: @world → borrower:{rotessaCustomerId}:rotessa
- **AND** second posting: borrower:{rotessaCustomerId}:rotessa → mortgage:{mortgageId}:trust
- **AND** amount is in cents (multiply by 100)
- **AND** metadata includes rotessaTransactionId, processDate

#### Scenario: Record payment with effective timestamp
- **WHEN** recording a payment with an effectiveTimestamp parameter
- **THEN** the system includes `timestamp` field in Formance API request
- **AND** the ledger entry uses the provided timestamp as effective date
- **AND** this enables bi-temporal backdating for historical payments

#### Scenario: Handle ledger API failure
- **WHEN** Formance API returns error
- **THEN** the system logs error with details
- **AND** does NOT update payment.ledgerTransactionId
- **AND** payment will be retried on next sync
- **AND** continues processing other transactions

#### Scenario: Idempotent ledger recording
- **WHEN** attempting to record same payment twice
- **THEN** Formance rejects with 409 conflict (duplicate reference)
- **AND** the system treats this as success
- **AND** does not create duplicate ledger transaction

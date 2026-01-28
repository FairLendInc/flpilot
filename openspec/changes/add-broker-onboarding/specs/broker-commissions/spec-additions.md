## MODIFIED Requirements

> **Screen References**: Key screens for this spec:
> - S6. Broker Portal Dashboard - Shows commissions earned KPI
> - S9. Client Detail Page - Displays adjusted returns to clients
> - S13. Client Portfolio Portal - Shows portfolio with adjusted return calculations
>
> See [`../design.md`](../design.md#screen-and-component-manifest) for complete screen and component specifications.

### Requirement: Broker Commission Tracking

The system SHALL track broker commissions as a percentage of capital deployed by broker clients using Formance ledger integration when deals close, providing an audit trail of commission calculations.

#### Scenario: Ledger records commission on deal closing

- **GIVEN** a broker client completing a deal with capital deployment of $100,000 and the broker's commission rate is 2.5%
- **WHEN** the deal reaches the `completed` state
- **THEN** the system executes a Formance numscript to record a commission credit of $2,500 to the broker's commission account

#### Scenario: Commission calculation uses broker rate

- **GIVEN** a broker with commission rate of 2.5% and a client completing a deal
- **WHEN** the commission is calculated
- **THEN** the system computes `capitalDeployed × 0.025` as the commission amount

#### Scenario: Ledger entry includes metadata for audit

- **GIVEN** a commission being recorded to the Formance ledger
- **WHEN** the numscript executes
- **THEN** the system attaches metadata including:
  - `type: "broker_commission"`
  - `brokerId`: The broker's Convex ID
  - `clientId`: The client's Convex ID
  - `dealId`: The deal's Convex ID
  - `capitalDeployed`: The capital deployment amount
  - `commissionRate`: The broker's commission rate as a percentage

#### Scenario: Idempotency key prevents duplicate commissions

- **GIVEN** a deal triggering commission recording
- **WHEN** the commission numscript executes with idempotency key `commission:{dealId}:{brokerId}:{timestamp}`
- **THEN** the system uses the Formance reference field to ensure the transaction is not duplicated if retried

#### Scenario: Client return adjustment is recorded

- **GIVEN** a broker with return adjustment rate of 0.5% and a client completing a deal
- **WHEN** the deal completes
- **THEN** the system records a return adjustment entry to the client's adjustment account reflecting the broker's adjustment rate

#### Scenario: Commission total is aggregatable by broker

- **GIVEN** a broker with multiple completed deals and recorded commissions
- **WHEN** querying the broker's total commissions
- **THEN** the system aggregates all commission ledger entries for the broker's commission account to provide a total earned

#### Scenario: Commission tracking is ledger-based only

- **GIVEN** a broker viewing their commission totals
- **WHEN** they request a commission report
- **THEN** the system calculates totals from Formance ledger balances, not from Convex database records (Convex is for configuration only)

---

## ADDED Requirements

### Requirement: Broker Rate History Tracking

The system SHALL maintain a history of commission rate and return adjustment rate changes for each broker, recording the effective date of each change to support non-retroactive rate calculations.

#### Scenario: Rate change records effective date

- **GIVEN** an admin modifying a broker's commission rate from 2.5% to 3.0%
- **WHEN** the change is saved
- **THEN** the system creates a `broker_rate_history` record with `type: "commission"`, `oldRate: 0.025`, `newRate: 0.030`, `effectiveAt: current_timestamp`

#### Scenario: Return adjustment change records effective date

- **GIVEN** an admin modifying a broker's return adjustment rate from 0.5% to 0.7%
- **WHEN** the change is saved
- **THEN** the system creates a `broker_rate_history` record with `type: "return_adjustment"`, `oldRate: 0.005`, `newRate: 0.007`, `effectiveAt: current_timestamp`

#### Scenario: Rate history query finds rate in effect at completion

- **GIVEN** a deal completed on January 15, 2026 and the broker had a return adjustment rate of 0.1% at that time
- **WHEN** querying the adjustment rate for that deal
- **THEN** the system searches `broker_rate_history` for the most recent adjustment rate entry with `effectiveAt` before the deal's completion date

#### Scenario: Historical rate applies to historical returns

- **GIVEN** a broker with adjustment rate history:
  - January 1, 2026: 0.1%
  - February 1, 2026: 0.2%
- **WHEN** displaying returns for a deal that completed on January 15, 2026
- **THEN** the system calculates and displays the adjustment as 0.1% (rate in effect at deal completion)

#### Scenario: Current rate applies to new returns

- **GIVEN** a broker with current adjustment rate of 0.2%
- **WHEN** a deal completes on March 1, 2026
- **THEN** the system calculates and records the adjustment as 0.2% (current rate at deal completion)

#### Scenario: No rate history uses current rate

- **GIVEN** a broker with no history entries for return adjustment rates
- **WHEN** querying the adjustment rate for a historical deal
- **THEN** the system uses the broker's current `commission.returnAdjustmentPercentage` from the `brokers` table

#### Scenario: Rate history includes admin attribution

- **GIVEN** a rate history record being created
- **WHEN** the record is saved
- **THEN** the system includes `changedBy` (the admin user ID who made the change) and `approvedAt` timestamp in the record

#### Scenario: Rate change generates notification

- **GIVEN** an admin changing a broker's rates
- **WHEN** the change is saved
- **THEN** the system sends a notification to the broker indicating their rates have been modified and the effective date

---

### Requirement: Non-Retroactive Return Adjustment Calculation

The system SHALL calculate return adjustments based on the rate in effect at the time each deal completed, not retroactively applying rate changes to historical returns.

#### Scenario: Historical deal uses historical rate

- **GIVEN** a broker with adjustment rate of 0.1% effective January 1, 2026, and increased to 0.2% effective February 1, 2026
- **WHEN** calculating returns for a deal that completed on January 15, 2026
- **THEN** the system uses the 0.1% rate permanently for that deal's return display

#### Scenario: Recent deal uses current rate

- **GIVEN** a broker with adjustment rate of 0.2% effective February 1, 2026
- **WHEN** calculating returns for a deal that completed on February 15, 2026
- **THEN** the system uses the 0.2% rate for that deal's return display

#### Scenario: Rate change does not affect old deals

- **GIVEN** a broker changing their adjustment rate from 0.1% to 0.2% on February 1, 2026
- **WHEN** displaying returns for deals that completed in January 2026
- **THEN** the system continues to show the 0.1% adjustment for those historical deals

#### Scenario: Return display shows historical rate

- **GIVEN** a client viewing a portfolio with deals from January and February, and the broker adjusted rate in February
- **WHEN** the portfolio renders
- **THEN** the system displays:
  - January 15 deal: "Return: 8.9% (Base: 9.0% - Adjustment: 0.1%)"
  - February 15 deal: "Return: 8.8% (Base: 9.0% - Adjustment: 0.2%)"

#### Scenario: Commission history query supports audit

- **GIVEN** an admin or broker requesting a rate change history report
- **WHEN** the report is generated
- **THEN** the system shows all rate changes chronologically with:
  - Old rate
  - New rate
  - Effective date
  - Changed by
  - Approvals

---

### Requirement: Commission Trigger Timing

The system SHALL record broker commissions in the Formance ledger when a deal reaches the `completed` state, not at deal creation or capital deployment.

#### Scenario: Commission records at deal completion

- **GIVEN** a deal in the `pending_ownership_review` state
- **WHEN** the state transitions to `completed` via `CONFIRM_TRANSFER` event
- **THEN** the system synchronously records the broker commission to the Formance ledger

#### Scenario: No commission recorded before completion

- **GIVEN** a deal moving through states such as `locked`, `pending_docs`, `pending_verification`
- **WHEN** these state transitions occur
- **THEN** the system does NOT record any commission entries (only at completion)

#### Scenario: Commission timestamp matches completion date

- **GIVEN** a deal completing with `completedAt: 2026-01-15T10:30:00Z`
- **WHEN** the commission is recorded
- **THEN** the ledger transaction timestamp uses the deal's `completedAt` value for accurate financial reporting

#### Scenario: Failed deal prevents commission

- **GIVEN** a deal transitioning to `cancelled` state instead of `completed`
- **WHEN** the cancellation occurs
- **THEN** the system does NOT record any commission commission (no deal completion, no commission earned)
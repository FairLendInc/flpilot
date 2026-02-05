## ADDED Requirements

**Screen References**: This specification references screens and components defined in the [Screen and Component Manifest](../../design.md#screen-and-component-manifest). Key screens for commission functionality:
- **S6**: Broker Portal Dashboard (for commission KPIs)
- **S9**: Client Detail Page (for adjusted returns display)
- **S13**: Client Portfolio Portal (for returns calculation)

### Requirement: Broker Commission Tracking

The system SHALL track broker commissions as a percentage of capital deployed by broker clients using Formance ledger integration, providing an audit trail of commission calculations.

#### Scenario: Ledger records commission on deal capital deployment

- **GIVEN** a broker client completing a deal with capital deployment of $100,000 and the broker's commission rate is 2.5%
- **WHEN** the deal reaches the `capital_deployed` state
- **THEN** the system executes a Formance numscript to record a commission credit of $2,500 to the broker's commission account

#### Scenario: Commission calculation uses broker rate

- **GIVEN** a broker with commission rate of 2.5% and a client deploying $50,000 in a new deal
- **WHEN** the commission is calculated
- **THEN** the system computes $50,000 × 0.025 = $1,250 as the commission amount

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

### Requirement: Broker Return Adjustment Calculation

The system SHALL calculate and display client returns adjusted by the broker's return adjustment rate, showing clients their net returns after broker fees.

#### Scenario: Return adjustment is subtracted from base return

- **GIVEN** a deal with base return of 9.0% and the broker's return adjustment rate is 0.5%
- **WHEN** the client views their returns display
- **THEN** the system calculates and displays the adjusted return as 9.0% - 0.5% = 8.5%

#### Scenario: Adjustment rate is per-broker configurable

- **GIVEN** a broker with return adjustment rate of 0.3% and another broker with adjustment rate of 0.7%
- **WHEN** clients of each broker view their returns
- **THEN** their respective displays show returns adjusted by their specific broker's rate

#### Scenario: Adjustment is portfolio-wide, not retroactive

- **GIVEN** a broker changing their return adjustment rate from 0.3% to 0.5%
- **WHEN** the new rate is applied
- **THEN** the adjustment only applies to new deals completed after the rate change; historical deals continue showing the adjustment in effect at the time of completion

#### Scenario: Adjusted return display shows calculation

- **GIVEN** a client viewing their portfolio with adjusted returns
- **WHEN** the return display renders
- **THEN** the system shows the calculation explicitly, e.g., "Return: 8.5% (Base: 9.0% - Adjustment: 0.5%)"

#### Scenario: Zero adjustment returns base return unchanged

- **GIVEN** a broker with return adjustment rate set to 0%
- **WHEN** clients view their returns
- **THEN** the system displays the base return without any adjustment

---

### Requirement: Broker Commission Configuration

The system SHALL allow the platform to configure broker commission rates and return adjustment rates, stored in the `brokers` table and applied to all client transactions.

#### Scenario: Platform sets broker commission rate

- **GIVEN** a new approved broker record being created
- **WHEN** the platform configures the commission rate to 2.5%
- **THEN** the system stores `commission.ratePercentage: 2.5` in the `brokers` table

#### Scenario: Platform sets broker return adjustment rate

- **GIVEN** a new approved broker record being created
- **WHEN** the platform configures the return adjustment rate to 0.5%
- **THEN** the system stores `commission.returnAdjustmentPercentage: 0.5` in the `brokers` table

#### Scenario: Broker cannot modify their own commission rate

- **GIVEN** a broker accessing their settings page
- **WHEN** they attempt to modify the commission rate or return adjustment percentage
- **THEN** the system displays the fields as read-only with an indication that rates are managed by FairLend

#### Scenario: Admin can modify broker commission rate

- **GIVEN** a platform admin viewing a broker's management record
- **WHEN** they update the commission rate or return adjustment percentage
- **THEN** the system updates the `brokers` table and logs the change in an audit record

#### Scenario: Commission rate validation

- **GIVEN** a platform admin configuring broker rates
- **WHEN** they attempt to set a commission rate outside the valid range (e.g., 0% to 10%)
- **THEN** the system displays a validation error and prevents the update

---

### Requirement: Broker Commission Reporting

The system SHALL provide interfaces for brokers and admins to view commission totals, transaction history, and reconciliation data.

#### Scenario: Broker views commission totals

- **GIVEN** an authenticated broker accessing their dashboard
- **WHEN** they view the commissions KPI card
- **THEN** the system displays the total commissions earned across all client deals

#### Scenario: Broker views commission transaction history

- **GIVEN** an authenticated broker accessing `https://{subdomain}.flpilot.com/commissions`
- **WHEN** the commissions page renders
- **THEN** the system displays a list of commission entries showing:
  - Deal name/listing
  - Client name
  - Capital deployed
  - Commission rate
  - Commission amount
  - Date earned

#### Scenario: Admin views broker commission summary

- **GIVEN** a platform admin viewing the broker management section
- **WHEN** they open a broker's record
- **THEN** the system displays the broker's commission rate, return adjustment rate, total commissions earned, and recent commission transactions

#### Scenario: Commission report supports date range filtering

- **GIVEN** a broker viewing commission transaction history
- **WHEN** they select a date range (e.g., "Last 30 days")
- **THEN** the system filters the commission entries to show only transactions within the specified date range

#### Scenario: Commission totals match ledger balances

- **GIVEN** a broker reporting discrepancy between displayed total and expected total
- **WHEN** they compare the display to Formance ledger balances
- **THEN** the system displays matching totals (ledger is the source of truth for calculations)

---

### Requirement: Ledger Integration Architecture

The system SHALL follow existing Formance ledger integration patterns for ownership tracking, using dedicated broker commission accounts and numscript execution with idempotency keys.

#### Scenario: Broker commission account follows naming convention

- **GIVEN** a broker with Convex ID `abc123`
- **WHEN** their commission account is accessed
- **THEN** the account name follows the pattern `broker:abc123:commission`

#### Scenario: Client adjustment account follows naming convention

- **GIVEN** a client with Convex ID `xyz789`
- **WHEN** their adjustment account is accessed
- **THEN** the account name follows the pattern `client:xyz789:adjustment`

#### Scenario: Ledger operations use dedicated ledger

- **GIVEN** a commission or adjustment being recorded
- **WHEN** the ledger operation executes
- **THEN** the system uses the default ledger name (e.g., `flpilot`) consistent with ownership ledger operations

#### Scenario: Numscript execution uses existing executeNumscript action

- **GIVEN** a commission being recorded
- **WHEN** the numscript executes
- **THEN** the system calls the `api.ledger.executeNumscript` action from `convex/ledger.ts`

#### Scenario: Idempotency reference format is consistent

- **GIVEN** a commission transaction for deal `deal123` with broker `broker456`
- **WHEN** the reference is generated
- **THEN** the reference follows the format `commission:{dealId}:{brokerId}:{timestamp}`

#### Scenario: Ledger operations are in actions, not mutations

- **GIVEN** the requirement to execute external API calls to Formance
- **WHEN** commission or adjustment operations are implemented
- **THEN** the system implements them as Convex actions, not mutations, to avoid blocking database operations

---

### Requirement: Commission Reconciliation

The system SHALL provide reconciliation functionality to validate that commission totals match expected calculations based on deal data and broker rates.

#### Scenario: Reconciliation query matches deal data

- **GIVEN** a broker with 5 completed deals totaling $500,000 in capital deployed and commission rate of 2.5%
- **WHEN** a reconciliation query runs
- **THEN** the system verifies that total commissions in the ledger equal $500,000 × 0.025 = $12,500

#### Scenario: Reconciliation identifies discrepancies

- **GIVEN** a discrepancy between expected commissions and ledger balances
- **WHEN** reconciliation runs
- **THEN** the system flags the discrepancy and provides details (deal IDs, expected amounts, recorded amounts)

#### Scenario: Admin can trigger reconciliation

- **GIVEN** a platform admin suspecting commission calculation errors
- **WHEN** they trigger a reconciliation for a specific broker
- **THEN** the system queries deal data, calculates expected commissions, and compares against ledger balances

#### Scenario: Reconciliation result is auditable

- **GIVEN** a completed reconciliation operation
- **WHEN** the result is queried
- **THEN** the system provides a detailed report showing:
  - Total expected commission
  - Total recorded commission
  - Discrepancy amount
  - Individual deal breakdown with calculated vs recorded amounts
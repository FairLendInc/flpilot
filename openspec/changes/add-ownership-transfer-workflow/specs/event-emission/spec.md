## ADDED Requirements

### Requirement: Audit Events Table
The system SHALL store audit events in a durable table before emission.

#### Scenario: Event record creation
- **WHEN** an audited operation occurs
- **THEN** an audit event record is created with:
  - `eventType`: Dot-notation event type (e.g., "ownership.transferred")
  - `entityType`: The entity being modified (e.g., "mortgage_ownership")
  - `entityId`: String ID of the entity
  - `userId`: ID of user who triggered the operation
  - `timestamp`: When the event occurred
  - `beforeState`: Optional snapshot of state before operation
  - `afterState`: Optional snapshot of state after operation
  - `metadata`: Additional context as JSON
- **AND** the `emittedAt` field is null (not yet emitted)

#### Scenario: Query unemitted events
- **WHEN** the event emission cron runs
- **THEN** it queries events where `emittedAt` is null
- **AND** processes them in chronological order
- **AND** limits batch size to prevent timeout

#### Scenario: Mark event as emitted
- **WHEN** an event is successfully emitted to external system
- **THEN** the `emittedAt` timestamp is set
- **AND** the event remains in the table for audit purposes

### Requirement: Event Emitter Abstraction
The system SHALL provide a stubbed event emitter interface for future integration.

#### Scenario: Emitter interface definition
- **WHEN** defining the event emitter
- **THEN** it exposes an `emit(event: AuditEvent)` method
- **AND** the method returns a Promise that resolves on success
- **AND** rejects with error on failure

#### Scenario: Stubbed implementation
- **WHEN** using the stubbed emitter in development
- **THEN** it logs the event to console with structured format
- **AND** marks the event as emitted
- **AND** does not fail (simulates success)

#### Scenario: Future integration point
- **WHEN** integrating with Apache Pulsar or similar
- **THEN** the stubbed implementation can be replaced
- **AND** no changes required to calling code
- **AND** the adapter pattern isolates integration details

### Requirement: Event Schema Definition
The system SHALL define a consistent schema for all audit events.

#### Scenario: Standard event fields
- **WHEN** creating any audit event
- **THEN** it includes these required fields:
  - `eventType`: String in dot-notation (e.g., "deal.created")
  - `entityType`: String identifying the entity type
  - `entityId`: String ID of the affected entity
  - `userId`: ID of the acting user
  - `timestamp`: Unix milliseconds
- **AND** these optional fields:
  - `beforeState`: Any (JSON serializable)
  - `afterState`: Any (JSON serializable)
  - `metadata`: Any (JSON serializable)

#### Scenario: Event type naming convention
- **WHEN** naming event types
- **THEN** follow the pattern: `{domain}.{action}`
- **AND** use lowercase with dots as separators
- **AND** examples include:
  - "deal.created"
  - "deal.state_changed"
  - "ownership.transferred"
  - "ownership.transfer_rejected"
  - "document.signed"

### Requirement: Audited Mutation Wrapper
The system SHALL provide a mutation wrapper that auto-captures events.

#### Scenario: Wrap mutation with auditing
- **WHEN** defining a mutation that should emit events
- **THEN** use `createAuditedMutation` wrapper
- **AND** specify `eventType` and `entityType` in config
- **AND** the wrapper captures before/after state automatically

#### Scenario: Access event context in handler
- **WHEN** inside an audited mutation handler
- **THEN** `ctx.emitEvent()` method is available
- **AND** it accepts optional additional metadata
- **AND** it creates the audit event record

#### Scenario: Automatic state capture
- **WHEN** an audited mutation modifies an entity
- **THEN** the wrapper queries the entity before the handler runs
- **AND** queries the entity after the handler completes
- **AND** includes both snapshots in the event record

### Requirement: Event Emission Cron Job
The system SHALL run a cron job to emit pending events.

#### Scenario: Cron job execution
- **WHEN** the event emission cron runs
- **THEN** it fetches unemitted events (emittedAt is null)
- **AND** processes up to 100 events per run
- **AND** calls the event emitter for each event
- **AND** marks successful events as emitted

#### Scenario: Emission failure handling
- **WHEN** event emission fails
- **THEN** the `emitFailures` counter is incremented
- **AND** the event is retried on the next cron run
- **AND** after 5 failures, the event is logged as failed
- **AND** admin is alerted about persistent failures

#### Scenario: Cron schedule
- **WHEN** configuring the event emission cron
- **THEN** it runs every minute
- **AND** is idempotent (safe to run multiple times)
- **AND** does not process already-emitted events

### Requirement: Event Types for Deal Workflow
The system SHALL emit events for key deal workflow operations.

#### Scenario: Deal created event
- **WHEN** a deal is created
- **THEN** emit event with type "deal.created"
- **AND** include deal details in afterState
- **AND** include related entity IDs in metadata

#### Scenario: Deal state changed event
- **WHEN** a deal transitions between states
- **THEN** emit event with type "deal.state_changed"
- **AND** include fromState and toState in metadata
- **AND** include triggered_by user ID

#### Scenario: Ownership review started event
- **WHEN** a deal enters pending_ownership_review state
- **THEN** emit event with type "deal.ownership_review_started"
- **AND** include pending transfer details in metadata

#### Scenario: Ownership transferred event
- **WHEN** ownership is successfully transferred
- **THEN** emit event with type "ownership.transferred"
- **AND** include cap table before/after in state snapshots
- **AND** include deal ID and transfer percentage in metadata

#### Scenario: Ownership transfer rejected event
- **WHEN** ownership transfer is rejected
- **THEN** emit event with type "ownership.transfer_rejected"
- **AND** include rejection reason in metadata
- **AND** include reviewer ID

### Requirement: Event Query API
The system SHALL provide queries for viewing audit events.

#### Scenario: Get events for entity
- **WHEN** querying events for a specific entity
- **THEN** return all events matching entityType and entityId
- **AND** order by timestamp descending
- **AND** support pagination

#### Scenario: Get events by type
- **WHEN** querying events by event type
- **THEN** return all events matching the eventType
- **AND** support date range filtering
- **AND** support pagination

#### Scenario: Get events by user
- **WHEN** querying events triggered by a user
- **THEN** return all events where userId matches
- **AND** order by timestamp descending
- **AND** support pagination

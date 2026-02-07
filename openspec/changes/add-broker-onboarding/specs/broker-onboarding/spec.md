## ADDED Requirements

**Screen References**: All scenarios in this specification reference screens and components defined in [design.md](../../design.md#screen-and-component-manifest). Key screens include:
- **S1-S5**: Broker onboarding and admin review screens
- **S3**: Broker Application Timeline (component embedded in S5)
- **S4**: Admin Broker Applications Queue

### Requirement: Broker Onboarding Journey State Machine

The system SHALL provide a resumable, auditable broker onboarding flow modeled as an XState state machine with explicit state transitions and rollback support before final approval.

#### Scenario: Broker starts onboarding journey

- **GIVEN** a user with `member` role
- ** Screens**: S1. Broker Application Landing, S2. Broker Application Workspace
- **WHEN** the user selects "broker" as their persona in the onboarding flow
- **THEN** the system creates an `onboarding_journeys` record with `persona: "broker"`, `status: "draft"`, and initial `stateValue: "broker.intro"`

#### Scenario: Broker progresses through onboarding steps

- **GIVEN** an active broker onboarding journey
- **WHEN** the broker completes the current step and advances to the next step
- **THEN** the system updates `stateValue` to the new step (e.g., "broker.company_info" → "broker.licensing") and persists the step's form data in `context.broker`

#### Scenario: Broker onboarding supports resumption

- **GIVEN** a partial broker onboarding journey with `status: "draft"`
- **WHEN** the broker returns to the onboarding page
- **THEN** the system loads the journey from Convex and rehydrates the XState machine to the previous `stateValue` with all persisted context restored

#### Scenario: Admin requests additional information from broker

- **GIVEN** a broker onboarding journey with `status: "awaiting_admin"`
- **WHEN** an admin sends a follow-up request with a message
- **THEN** the system adds a new entry to `context.broker.adminRequestTimeline` with `type`, `requestedBy`, `requestedAt`, `message`, and `resolved: false`

#### Scenario: Broker responds to admin request

- **GIVEN** a broker onboarding journey with an unresolved admin request in the timeline
- **WHEN** the broker submits a response with optional document uploads
- **THEN** the system updates the timeline entry with `response`, `responseDocuments`, `resolved: true`, and `resolvedAt`

#### Scenario: Admin can rollback broker to earlier state

- **GIVEN** a broker onboarding journey with `status: "awaiting_admin"` and multiple completed steps
- **WHEN** an admin triggers a rollback to a previous step (e.g., "broker.licensing")
- **THEN** the system sets `stateValue` to the target step and clears all form data for steps after the rollback point in `context.broker`, while preserving admin request timeline

#### Scenario: Admin approves broker onboarding

- **GIVEN** a broker onboarding journey with `status: "awaiting_admin"` and all required steps completed
- **WHEN** an admin approves the application
- **THEN** the system sets `status: "approved"`, records `adminDecision` with `decidedBy`, `decidedAt`, and optional `notes`, provisions a WorkOS organization, creates a `brokers` table record, and assigns the `broker` role

#### Scenario: Admin rejects broker onboarding

- **GIVEN** a broker onboarding journey with `status: "awaiting_admin"`
- **WHEN** an admin rejects the application with a reason
- **THEN** the system sets `status: "rejected"`, records `adminDecision` with `decidedBy`, `decidedAt`, and `notes`, and notifies the broker via the onboarding UI

#### Scenario: Broker subdomain validated before approval

- **GIVEN** a broker onboarding journey with a `proposedSubdomain` in context
- **WHEN** the admin attempts to approve the application
- **THEN** the system verifies the subdomain is not already in use in the `brokers` table before proceeding

---

### Requirement: Broker Onboarding Data Persistence

The system SHALL persist all broker onboarding data in the `onboarding_journeys` table with a structured `broker` context branch that captures company info, licensing, representatives, documents, timeline, and proposed subdomain.

#### Scenario: Broker saves company information

- **GIVEN** a broker onboarding journey at "broker.company_info" state
- **WHEN** the broker submits company name, entity type, registration number, address, jurisdiction (default "Ontario"), and contact info
- **THEN** the system persists the data in `context.broker.companyInfo` with all required fields including jurisdiction

#### Scenario: Jurisdiction field is collected for future expansion

- **GIVEN** a broker onboarding journey at "broker.company_info" state
- **WHEN** the broker completes the company information form
- **THEN** the system requires a jurisdiction field (default: "Ontario" for initial scope, extensible to other provinces in future)

#### Scenario: Broker saves licensing information

- **GIVEN** a broker onboarding journey at "broker.licensing" state
- **WHEN** the broker submits license type, license number, issuer, issuance date, expiry date, and jurisdictions
- **THEN** the system persists the data in `context.broker.licensing` with all required fields

#### Scenario: Broker uploads documents

- **GIVEN** a broker onboarding journey at "broker.documents" state
- **WHEN** the broker uploads documents with labels (e.g., "license", "insurance")
- **THEN** the system stores file metadata (storage ID, label, type, uploadedAt) in `context.broker.documents`

#### Scenario: Broker journey maintains lastTouchedAt timestamp

- **GIVEN** any state transition or data save in a broker onboarding journey
- **WHEN** the update is applied
- **THEN** the system updates `lastTouchedAt` to the current ISO timestamp

#### Scenario: Approved broker journey is archived

- **GIVEN** a broker onboarding journey with `status: "approved"`
- **WHEN** the broker record is created in the `brokers` table
- **THEN** the onboarding journey remains read-only for audit purposes, and all future broker interactions use the `brokers` table

---

### Requirement: Broker Onboarding Admin Visibility

The system SHALL provide admin interfaces to review all broker onboarding journeys, view application data, see the complete timeline of requests and responses, and approve or reject applications.

#### Scenario: Admin views pending broker applications queue

- **GIVEN** an admin user with appropriate permissions
- **WHEN** they navigate to the admin broker onboarding queue
- **THEN** the system displays a list of all journeys with `persona: "broker"` and `status: "awaiting_admin"` showing broker name, submitted date, and current step

#### Scenario: Admin views broker application detail

- **GIVEN** an admin user viewing a specific broker onboarding journey
- **WHEN** they open the application detail view
- **THEN** the system displays all collected data (company info, licensing, representatives, documents) and the admin request timeline in chronological order

#### Scenario: Admin sends information request

- **GIVEN** an admin user reviewing a broker onboarding journey
- **WHEN** they type a message and click "Request Additional Information"
- **THEN** the system adds a new entry to `context.broker.adminRequestTimeline` with `type: "info_request"` and sends an in-app notification to the broker

#### Scenario: Admin sees new broker response alert

- **GIVEN** an admin who previously sent an information request
- **WHEN** the broker responds to the request
- **THEN** the system displays an alert or notification indicating the broker has responded to the pending request

#### Scenario: Admin approves broker

- **GIVEN** an admin user reviewing a complete broker onboarding journey
- **WHEN** they click "Approve" and confirm the action
- **THEN** the system calls the approval function, which transitions status, provisions WorkOS org, creates broker record, and assigns role

#### Scenario: Admin rejects broker with reason

- **GIVEN** an admin user reviewing a broker onboarding journey
- **WHEN** they click "Reject" and provide a rejection reason
- **THEN** the system transitions the journey to `status: "rejected"` and displays the reason to the broker

---

### Requirement: Broker Onboarding Rollback Mechanism

The system SHALL support sending a broker back to a previous onboarding state before final approval, clearing form data collected after the rollback point while preserving the admin request timeline.

#### Scenario: Admin initiates rollback

- **GIVEN** a broker onboarding journey at "broker.review" state with completed steps for "company_info", "licensing", "documents", and "review"
- **WHEN** an admin selects "Send back to licensing" from the rollback menu
- **THEN** the system reverts `stateValue` to "broker.licensing" and clears data in `context.broker.documents` and `context.broker.review`

#### Scenario: Rollback clears only post-rollback step data

- **GIVEN** a broker journey with steps A → B → C → D completed and admin rolling back to step C
- **WHEN** the rollback is executed
- **THEN** the system preserves data for steps A, B, and C, but clears data for step D only

#### Scenario: Rollback preserves admin request timeline

- **GIVEN** a broker journey with an admin request timeline containing 3 entries
- **WHEN** an admin performs a rollback
- **THEN** the system keeps all timeline entries intact for audit purposes

#### Scenario: Rollback prevented after approval

- **GIVEN** a broker onboarding journey with `status: "approved"`
- **WHEN** an admin attempts to rollback the journey to a previous state
- **THEN** the system rejects the rollback request with an error message indicating rollback is only available before final approval

#### Scenario: Broker sees rollback notification

- **GIVEN** a broker whose application was rolled back by an admin
- **WHEN** they access the onboarding page
- **THEN** the system displays a notification indicating the admin sent the application back to a specific step and instructs the broker to complete the required information
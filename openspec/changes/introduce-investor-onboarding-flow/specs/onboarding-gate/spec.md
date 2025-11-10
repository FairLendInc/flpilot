# Onboarding Gate Capability

## ADDED Requirements

### Requirement: Redirect Incomplete Members
Members without an approved onboarding journey SHALL be redirected to `/onboarding` no matter which authenticated page they visit.

#### Scenario: Member hits dashboard without approval
- **GIVEN** a signed-in user whose WorkOS role slug is `member`
- **AND** their onboarding journey status is `draft` or `awaiting_admin`
- **WHEN** they request any route within the authenticated app shell
- **THEN** the middleware SHALL redirect them to `/onboarding`
- **AND** the requested route SHALL NOT render

#### Scenario: Approved user bypasses onboarding
- **GIVEN** a signed-in user whose onboarding journey status is `approved`
- **WHEN** they visit `/onboarding`
- **THEN** they SHALL be redirected to the primary dashboard route

### Requirement: Journey Persistence & Creation
The system SHALL auto-create and persist an onboarding journey per user so progress survives refreshes and new devices.

#### Scenario: First visit creates journey
- **GIVEN** a signed-in `member` without an existing journey row
- **WHEN** they land on `/onboarding`
- **THEN** the system SHALL insert a new journey with `status = "draft"`, `stateValue = "personaSelection"`, and `lastTouchedAt` set to the current timestamp

#### Scenario: Returning user resumes prior state
- **GIVEN** a signed-in `member` with an existing journey whose `stateValue = "investor.preferences"`
- **WHEN** they return to `/onboarding`
- **THEN** the client SHALL hydrate the XState machine to `investor.preferences`
- **AND** previously saved form fields SHALL pre-populate from the stored context

### Requirement: Admin Approval Gate
Admins SHALL be able to approve or reject submitted journeys, and only approved journeys unlock the rest of the app.

#### Scenario: Submission awaits admin action
- **GIVEN** a user who completed their flow and triggered submission
- **THEN** the journey status SHALL transition to `awaiting_admin`
- **AND** the user SHALL see a "pending review" screen when visiting `/onboarding`
- **AND** they SHALL remain blocked from other routes until approval

#### Scenario: Admin approves investor journey
- **GIVEN** an admin with `org.member.update` permission
- **WHEN** they approve an `awaiting_admin` journey
- **THEN** the journey status SHALL change to `approved`
- **AND** the system SHALL promote the user to the persona-specific WorkOS role (e.g., `investor`)
- **AND** future visits to app routes SHALL no longer redirect to `/onboarding`

#### Scenario: Admin rejects journey
- **GIVEN** an admin who rejects an `awaiting_admin` journey with notes
- **THEN** the journey status SHALL change to `rejected`
- **AND** the user SHALL see the rejection notes plus support instructions the next time they land on `/onboarding`
- **AND** the user SHALL remain blocked from the app until an admin resets their journey manually

### Requirement: Persona Locking & Switching Rules
Persona choice SHALL lock once a journey is submitted for approval to keep audit history consistent.

#### Scenario: Persona can change during draft only
- **GIVEN** a journey with `status = "draft"`
- **WHEN** the user navigates back to the persona selector
- **THEN** they SHALL be able to pick a different persona, which resets `stateValue` and persona-specific context

#### Scenario: Persona locked after submission
- **GIVEN** a journey with `status = "awaiting_admin"` or `"approved"`
- **WHEN** the user attempts to switch persona
- **THEN** the UI SHALL block the action and display instructions to contact support

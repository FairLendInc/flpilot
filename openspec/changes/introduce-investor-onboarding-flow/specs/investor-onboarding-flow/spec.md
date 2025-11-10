# Investor Onboarding Flow Capability

## ADDED Requirements

### Requirement: Persona Selection Supports Investor Flow
The onboarding experience SHALL present broker, investor, and lawyer personas, and selecting investor SHALL launch the investor-specific state machine.

#### Scenario: Member chooses investor
- **GIVEN** the persona selection screen is visible
- **WHEN** the user clicks "Investor"
- **THEN** the system SHALL call `startJourney` with `persona = "investor"`
- **AND** the investor flow SHALL start at the `intro` state with the progress indicator showing 6 total steps

### Requirement: Investor Profile Capture
The investor flow SHALL collect foundational profile data before continuing.

#### Scenario: Profile step validates inputs
- **GIVEN** the machine is in the `investor.profile` state
- **WHEN** the user submits the form
- **THEN** the system SHALL require legal name, entity type (individual / corporation / trust / fund), and preferred contact email
- **AND** valid submissions SHALL persist to the journey context and move to the `preferences` state

#### Scenario: Prefilled profile when returning
- **GIVEN** saved profile data exists in the journey
- **WHEN** the user re-enters the `investor.profile` state
- **THEN** the form SHALL display the previously saved values without additional fetches

### Requirement: Investment Preferences Step
The machine SHALL capture investment preferences to help admins evaluate the applicant.

#### Scenario: Preferences data collection
- **GIVEN** the machine is in the `investor.preferences` state
- **WHEN** the user submits the form
- **THEN** the system SHALL require minimum ticket size, maximum ticket size, risk profile (conservative / balanced / growth), and liquidity horizon (in months)
- **AND** optional focus regions SHALL be stored as an array of ISO province/state codes
- **AND** successful submission SHALL persist and advance to `investor.kycStub`

### Requirement: KYC Stub Step
Even without a full KYC form, the flow SHALL include a dedicated step that records acknowledgement and blocks progression until the user confirms.

#### Scenario: Stub acknowledgement required
- **GIVEN** the machine is in the `investor.kycStub` state
- **WHEN** the user clicks the CTA to continue
- **THEN** the system SHALL set `context.investor.kycPlaceholder.status = "blocked"` until the user acknowledges the future KYC requirement
- **AND** once acknowledged, the status SHALL move to `"submitted"` and the machine SHALL advance to `investor.documentsStub`

### Requirement: Documents Stub Step
The investor flow SHALL offer optional document uploads even though they are not enforced yet.

#### Scenario: Optional upload handling
- **GIVEN** the machine is in the `investor.documentsStub` state
- **WHEN** the user uploads supporting docs (e.g., accreditation letter)
- **THEN** the files SHALL be saved in Convex storage and referenced inside `context.investor.documents`
- **AND** the user SHALL be able to continue without uploads

### Requirement: Review & Submission
Completing the investor flow SHALL present a review screen and require final confirmation before submission.

#### Scenario: Review displays aggregated data
- **GIVEN** the machine is in the `investor.review` state
- **THEN** the screen SHALL show read-only summaries of profile, preferences, KYC stub status, and uploaded documents
- **AND** the user SHALL be able to edit any section, returning to that state without losing saved data

#### Scenario: Submission transitions to pending admin
- **GIVEN** the user confirms submission on the review screen
- **THEN** the system SHALL call `submitInvestorJourney`
- **AND** the journey status SHALL change to `awaiting_admin`
- **AND** the machine SHALL transition to the `pendingAdmin` state showing a "We'll email you once approved" message

### Requirement: Resume + Version Handling
The investor flow SHALL resume gracefully even if the app deploys a new machine version.

#### Scenario: Resume from persisted state value
- **GIVEN** the persisted `stateValue` is `investor.documentsStub`
- **WHEN** the user returns after refreshing
- **THEN** the machine SHALL hydrate directly into `documentsStub` with the current context data

#### Scenario: Unknown state fallback
- **GIVEN** the persisted `stateValue` is not recognized by the current machine version
- **WHEN** the user returns
- **THEN** the system SHALL reset the machine to `personaSelection`
- **AND** it SHALL display a banner explaining that onboarding restarted due to an update

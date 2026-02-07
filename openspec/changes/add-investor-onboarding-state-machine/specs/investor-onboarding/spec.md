## ADDED Requirements

### Requirement: Investor Onboarding State Machine

The system SHALL provide a resumable investor onboarding flow modeled as an XState state machine with hierarchical states, explicit transitions, and support for swappable step definitions.

#### Scenario: Investor starts onboarding journey

- **GIVEN** a user with `member` role
- **WHEN** the user selects "investor" as their persona in the onboarding flow
- **THEN** the system creates an `onboarding_journeys` record with `persona: "investor"`, `status: "draft"`, and initial `stateValue: "investor.intro"`
- **AND** the system initializes `context.investor` with empty step data and `brokerCode: null`

#### Scenario: Investor progresses through onboarding steps

- **GIVEN** an active investor onboarding journey
- **WHEN** the investor completes the current step and advances to the next step
- **THEN** the system updates `stateValue` to the new step (e.g., "investor.broker_selection" → "investor.profile") and persists the step's form data in `context.investor`

#### Scenario: Investor onboarding supports resumption

- **GIVEN** a partial investor onboarding journey with `status: "draft"`
- **WHEN** the investor returns to the onboarding page
- **THEN** the system loads the journey from Convex and rehydrates the XState machine to the previous `stateValue` with all persisted context restored

#### Scenario: Investor onboarding step order is configurable

- **GIVEN** an investor onboarding journey configuration defining step order: `["intro", "broker_selection", "profile", "preferences", "kyc_documents", "review"]`
- **WHEN** the system initializes the state machine
- **THEN** the machine SHALL transition through steps in the configured order
- **AND** changing the configuration SHALL update the flow for new journeys without breaking in-progress journeys

#### Scenario: Unknown state value falls back gracefully

- **GIVEN** a persisted `stateValue` that is not recognized by the current machine version (e.g., a removed step)
- **WHEN** the investor returns to onboarding
- **THEN** the system SHALL reset the machine to the nearest valid parent state
- **AND** display a notification explaining the onboarding flow was updated

---

### Requirement: Broker Code Entry and Resolution

The system SHALL allow investors to enter an optional broker code during onboarding, validate the code, and display broker information. If no code is entered, the investor is assigned to FairLend.

#### Scenario: Investor enters valid broker code

- **GIVEN** an investor at the "investor.broker_selection" step
- **WHEN** the investor enters a valid broker code (e.g., "ABC123")
- **THEN** the system SHALL validate the code against the `broker_codes` table
- **AND** display the broker's name, logo, contact email, and phone number
- **AND** persist the broker ID in `context.investor.brokerId`

#### Scenario: Investor enters invalid broker code

- **GIVEN** an investor at the "investor.broker_selection" step
- **WHEN** the investor enters an invalid or expired broker code
- **THEN** the system SHALL display an error message: "Invalid broker code. Please check the code and try again."
- **AND** prevent progression to the next step until a valid code is entered or the field is left empty

#### Scenario: Investor proceeds without broker code

- **GIVEN** an investor at the "investor.broker_selection" step
- **WHEN** the investor leaves the broker code field empty and clicks "Continue"
- **THEN** the system SHALL assign the investor to FairLend brokerage
- **AND** set `context.investor.brokerId` to the FairLend broker ID
- **AND** display "FairLend Direct" as the selected broker

#### Scenario: Broker code lookup is case-insensitive

- **GIVEN** a broker code "ABC123" exists in the database
- **WHEN** an investor enters "abc123" or "ABC123"
- **THEN** the system SHALL resolve both to the same broker

#### Scenario: Broker code displays broker branding

- **GIVEN** an investor has entered a valid broker code
- **WHEN** the broker information is displayed
- **THEN** the system SHALL show the broker's configured branding (logo, primary color)
- **AND** display the broker's custom subdomain URL

---

### Requirement: Swappable Step Architecture

The system SHALL implement the investor onboarding flow with a swappable step architecture where individual steps can be added, removed, or reordered without modifying the core state machine logic.

#### Scenario: Step definitions are injectable

- **GIVEN** a step registry containing step definitions with `id`, `component`, `validate`, and `persist` functions
- **WHEN** the state machine transitions to a step
- **THEN** the system SHALL look up the step definition from the registry
- **AND** render the associated component
- **AND** use the step's validation and persistence logic

#### Scenario: Adding a new step to the flow

- **GIVEN** an existing investor onboarding flow with steps: `[intro, broker_selection, profile, preferences, review]`
- **WHEN** a developer adds a new step definition for "accreditation" to the step registry
- **AND** updates the step order configuration to: `[intro, broker_selection, profile, preferences, accreditation, review]`
- **THEN** new investor journeys SHALL include the accreditation step
- **AND** existing in-progress journeys SHALL continue with their original step order

#### Scenario: Removing a step from the flow

- **GIVEN** an existing investor onboarding flow with a "kyc_stub" step
- **WHEN** a developer removes the "kyc_stub" step from the step registry and configuration
- **THEN** new investor journeys SHALL skip the kyc_stub step
- **AND** existing journeys at kyc_stub SHALL transition to the next valid step on next advancement

#### Scenario: Steps define their own validation logic

- **GIVEN** a step definition with a `validate` function
- **WHEN** the investor attempts to advance from that step
- **THEN** the system SHALL call the step's `validate` function with the current form data
- **AND** only allow advancement if validation passes
- **AND** display validation errors returned by the function

#### Scenario: Steps define their own persistence logic

- **GIVEN** a step definition with a `persist` function
- **WHEN** the investor completes the step and advances
- **THEN** the system SHALL call the step's `persist` function
- **AND** the function SHALL return the data to be stored in `context.investor[stepId]`
- **AND** the system SHALL save the data to the database via Convex mutation

---

### Requirement: Differentiated Onboarding Based on Broker Assignment

The system SHALL support different onboarding step configurations based on whether the investor is assigned to FairLend or an external broker, allowing FairLend investors to have additional compliance steps.

#### Scenario: FairLend investors see KYC document upload step

- **GIVEN** an investor assigned to FairLend (no broker code or FairLend code entered)
- **WHEN** the investor reaches the KYC step in the flow
- **THEN** the system SHALL display the KYC document upload interface
- **AND** require at least one document upload before allowing progression

#### Scenario: External broker investors skip KYC document upload

- **GIVEN** an investor assigned to an external broker
- **WHEN** the investor reaches the KYC step in the flow
- **THEN** the system SHALL display a simplified KYC acknowledgement stub
- **AND** allow progression without document upload

#### Scenario: Step configuration is determined by broker assignment

- **GIVEN** a step configuration registry with entries for "fairlend" and "external_broker"
- **WHEN** an investor selects a broker
- **THEN** the system SHALL load the appropriate step configuration
- **AND** apply it to the current onboarding journey

#### Scenario: Broker-specific step variations

- **GIVEN** a broker has configured custom onboarding requirements
- **WHEN** an investor enters that broker's code
- **THEN** the system SHALL load the broker's custom step configuration
- **AND** display any broker-specific fields or agreements

---

### Requirement: Broker Landing Page for Subdomain Access

The system SHALL display a branded landing page when an unauthenticated user accesses a broker's subdomain, providing broker information and sign-up/sign-in options.

#### Scenario: Unauthenticated user accesses broker subdomain

- **GIVEN** an unauthenticated user accessing `broker-slug.flpilot.com`
- **WHEN** the request is handled by the subdomain routing system
- **THEN** the system SHALL resolve the subdomain to a broker
- **AND** render the broker's landing page with their branding

#### Scenario: Broker landing page displays branding

- **GIVEN** a broker landing page is being rendered
- **WHEN** the page loads
- **THEN** the system SHALL display the broker's logo, brand name, primary color theme
- **AND** show the broker's tagline or description if configured

#### Scenario: Broker landing page shows sign-up and sign-in CTAs

- **GIVEN** a broker landing page for an unauthenticated user
- **WHEN** the page renders
- **THEN** the system SHALL display prominent "Sign Up" and "Sign In" buttons
- **AND** clicking "Sign Up" SHALL redirect to onboarding with the broker code pre-filled
- **AND** clicking "Sign In" SHALL redirect to the WorkOS login flow

#### Scenario: Broker landing page displays contact information

- **GIVEN** a broker landing page
- **WHEN** the page renders
- **THEN** the system SHALL display the broker's contact email and phone number
- **AND** optionally display the broker's physical address if configured

#### Scenario: Authenticated broker client accesses subdomain

- **GIVEN** an authenticated user who is a client of the broker
- **WHEN** they access the broker's subdomain
- **THEN** the system SHALL redirect them to their client dashboard
- **AND** apply the broker's branding to the dashboard

#### Scenario: Authenticated non-client accesses broker subdomain

- **GIVEN** an authenticated user who is NOT a client of the broker
- **WHEN** they access the broker's subdomain
- **THEN** the system SHALL display the landing page with a message: "You are not registered with this broker"
- **AND** provide options to contact the broker or return to the main site

---

### Requirement: Investor Onboarding Data Persistence

The system SHALL persist all investor onboarding data in the `onboarding_journeys` table with a structured `investor` context branch that captures broker selection, profile data, preferences, step-specific data, and KYC documents.

#### Scenario: Investor saves broker selection

- **GIVEN** an investor onboarding journey at "investor.broker_selection" state
- **WHEN** the investor submits a broker code or proceeds without one
- **THEN** the system persists the broker ID and broker code in `context.investor.brokerSelection`

#### Scenario: Investor saves profile information

- **GIVEN** an investor onboarding journey at "investor.profile" state
- **WHEN** the investor submits legal name, entity type, contact email, and phone number
- **THEN** the system persists the data in `context.investor.profile` with all required fields

#### Scenario: Investor saves investment preferences

- **GIVEN** an investor onboarding journey at "investor.preferences" state
- **WHEN** the investor submits minimum/maximum ticket sizes, risk profile, and liquidity horizon
- **THEN** the system persists the data in `context.investor.preferences`

#### Scenario: Investor uploads KYC documents

- **GIVEN** an investor onboarding journey at "investor.kyc_documents" state (FairLend flow)
- **WHEN** the investor uploads identity verification documents
- **THEN** the system stores file metadata (storage ID, document type, uploadedAt) in `context.investor.kycDocuments`

#### Scenario: Investor journey maintains lastTouchedAt timestamp

- **GIVEN** any state transition or data save in an investor onboarding journey
- **WHEN** the update is applied
- **THEN** the system updates `lastTouchedAt` to the current ISO timestamp

---

### Requirement: Admin Review Integration

The system SHALL integrate investor onboarding with the existing admin review queue, allowing admins to review, approve, or reject investor applications.

#### Scenario: Investor submits application for review

- **GIVEN** an investor at the "investor.review" step
- **WHEN** the investor confirms submission
- **THEN** the system calls `submitInvestorJourney`
- **AND** the journey status changes to `awaiting_admin`
- **AND** the machine transitions to `pendingAdmin` state

#### Scenario: Admin views pending investor applications

- **GIVEN** an admin user with appropriate permissions
- **WHEN** they navigate to the admin investor onboarding queue
- **THEN** the system displays a list of all journeys with `persona: "investor"` and `status: "awaiting_admin"`

#### Scenario: Admin approves investor onboarding

- **GIVEN** an admin user reviewing a complete investor onboarding journey
- **WHEN** they approve the application
- **THEN** the system sets `status: "approved"`, assigns the `investor` role, and creates an investor record

#### Scenario: Admin rejects investor onboarding

- **GIVEN** an admin user reviewing an investor onboarding journey
- **WHEN** they reject the application with a reason
- **THEN** the system sets `status: "rejected"` and displays the reason to the investor

# Lawyer Onboarding Capability

## ADDED Requirements

### Requirement: Lawyer Onboarding Journey State Machine
The system SHALL provide a resumable lawyer onboarding flow modeled as an XState state machine with explicit state transitions stored in `onboarding_journeys`.

#### Scenario: Lawyer starts onboarding journey
- **GIVEN** a user with `member` role
- **WHEN** the user selects the "lawyer" persona in the onboarding flow
- **THEN** the system creates an `onboarding_journeys` record with `persona: "lawyer"`, `status: "draft"`, and initial `stateValue: "lawyer.intro"`

#### Scenario: Lawyer resumes saved progress
- **GIVEN** a lawyer onboarding journey with `status: "draft"` and `stateValue: "lawyer.identity_verification"`
- **WHEN** the user returns to onboarding
- **THEN** the system rehydrates the machine to `lawyer.identity_verification` with the saved context restored

---

### Requirement: Lawyer Profile Capture
The system SHALL collect and persist lawyer profile data required for verification and review.

#### Scenario: Lawyer saves profile details
- **GIVEN** a lawyer onboarding journey at `lawyer.profile`
- **WHEN** the user submits legal name, LSO number, firm name, email, phone, and jurisdiction
- **THEN** the system persists the data to `context.lawyer.profile` and advances to `lawyer.identity_verification`

---

### Requirement: Mocked Identity Verification with Strict Name Matching
The system SHALL verify a lawyer's government ID via a mocked identity verification provider and compare the extracted name to the user-entered name using a strict matching strategy before allowing progression.

#### Scenario: Mock inquiry created with prefilled name
- **GIVEN** a lawyer onboarding journey with profile data saved
- **WHEN** the user enters the `lawyer.identity_verification` step
- **THEN** the system creates a mock inquiry record using the injected identity verification provider
- **AND** the inquiry is created with prefilled legal name fields from `context.lawyer.profile`
- **AND** the inquiry ID is stored in `context.lawyer.identityVerification`

#### Scenario: Name mismatch blocks verification
- **GIVEN** a completed mock inquiry linked to the journey
- **WHEN** the system compares the extracted ID name to the user-entered legal name
- **THEN** a mismatch sets `context.lawyer.identityVerification.status = "mismatch"`
- **AND** the user cannot advance until verification passes or an admin overrides

#### Scenario: Name match allows progression
- **GIVEN** a completed mock inquiry with matching name
- **WHEN** the system records the verification result
- **THEN** `context.lawyer.identityVerification.status` is set to `"verified"`
- **AND** the journey can advance to the next step

#### Scenario: Strict matcher is swappable
- **GIVEN** a strict name match strategy is configured
- **WHEN** the identity verification provider evaluates a name comparison
- **THEN** the system uses the injected matcher implementation to produce the match result

---

### Requirement: Identity Verification Inquiry Lifecycle
The system SHALL create identity verification inquiries server-side and resume pending inquiries using `inquiryId` + `sessionToken` without template IDs, to avoid duplicate inquiries and preserve strict matching controls.

#### Scenario: Server-side inquiry creation is required
- **GIVEN** a lawyer onboarding journey that needs identity verification
- **WHEN** the system initiates identity verification
- **THEN** the system creates the inquiry via the server-side identity provider adapter and stores the `inquiryId`
- **AND** client-side inquiry creation is not used to avoid creating a new inquiry on each visit or exposing prefill values in query parameters. citeturn1view0

#### Scenario: Resume pending inquiry without template IDs
- **GIVEN** a pending inquiry associated with a journey
- **WHEN** the user resumes identity verification
- **THEN** the system supplies `inquiryId` and `sessionToken` (if pending) to the client
- **AND** it does not pass `templateId`/`templateVersionId` when resuming. citeturn5view0turn5view2

---

### Requirement: LSO Registry Matching via Injected Store
The system SHALL verify the provided LSO number and legal name against a registry provider accessed through a dependency-injected interface.

#### Scenario: Registry lookup succeeds
- **GIVEN** a lawyer onboarding journey with profile data
- **WHEN** the registry provider finds a matching LSO record with the same legal name
- **THEN** `context.lawyer.lsoVerification.status` is set to `"verified"`

#### Scenario: Registry lookup fails
- **GIVEN** a lawyer onboarding journey with profile data
- **WHEN** the registry provider finds no matching LSO record or name mismatch
- **THEN** `context.lawyer.lsoVerification.status` is set to `"failed"`
- **AND** the user is blocked from submission until resolved

---

### Requirement: Swappable Lawyer Onboarding Steps
The lawyer onboarding flow SHALL read its step order and metadata from a single step registry configuration to allow steps to be added, removed, or reordered with minimal changes.

#### Scenario: Step registry drives progress
- **GIVEN** a defined `LAWYER_ONBOARDING_STEPS` registry
- **WHEN** the lawyer onboarding UI renders the progress indicator
- **THEN** the step count and labels are derived from the registry
- **AND** navigation between steps uses the registry ordering

---

### Requirement: Lawyer Submission and Admin Review
The system SHALL support submitting a lawyer onboarding journey for review and an admin approval decision.

#### Scenario: Lawyer submits onboarding
- **GIVEN** a lawyer onboarding journey with identity and LSO verification passing
- **WHEN** the user submits the review step
- **THEN** the system sets `status: "awaiting_admin"` and moves to `lawyer.pending_admin`

#### Scenario: Verification passing does not auto-approve
- **GIVEN** a lawyer onboarding journey with identity and LSO verification passing
- **WHEN** the journey is submitted
- **THEN** the system SHALL NOT mark the journey as approved without an explicit approval transition

#### Scenario: Admin approves lawyer onboarding
- **GIVEN** a lawyer onboarding journey with `status: "awaiting_admin"`
- **WHEN** an admin approves the journey
- **THEN** the system sets `status: "approved"`, records `adminDecision` with `decisionSource: "admin"`, and assigns the `lawyer` role

#### Scenario: Admin rejects lawyer onboarding
- **GIVEN** a lawyer onboarding journey with `status: "awaiting_admin"`
- **WHEN** an admin rejects the journey with a reason
- **THEN** the system sets `status: "rejected"`, records `adminDecision` with `decisionSource: "admin"`, and displays the reason in the onboarding UI

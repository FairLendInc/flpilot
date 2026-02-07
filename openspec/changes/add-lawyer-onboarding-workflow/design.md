## Context
- The onboarding system already supports broker and investor flows via an XState machine with persisted `onboarding_journeys` state.
- Lawyer onboarding is currently a UI placeholder with no verification or workflow.
- We need ID verification and LSO registry validation, but the registry storage is expected to change (local JSON now, Redis later).

## Goals / Non-Goals
- Goals:
  - Implement a resumable lawyer onboarding flow driven by the state machine
  - Provide a mocked Persona-style identity verification step with strict name matching
  - Validate LSO number + name against a dependency-injected registry store
  - Make lawyer steps configurable so steps can be added/reordered with minimal changes
  - Require admin approval while keeping a clean path for future auto-approval
- Non-Goals:
  - Refactor broker/investor onboarding flows beyond shared utilities
  - Build the Redis-backed registry store in this change (design for it only)
  - Replace existing admin review UX for other personas

## Decisions
- **Identity verification provider**: Introduce an `IdentityVerificationProvider` interface with a mocked Persona adapter as the default implementation. The mock provider simulates inquiry creation and completion without external API calls, and can be swapped later for a real Persona adapter.
- **Strict name matching strategy**: Introduce a `NameMatchStrategy` interface with a strict matcher as the default implementation. Keep the matcher injected so we can later swap to normalized or fuzzy matching without changing state transitions.
- **Registry DI**: Introduce `LawyerRegistryStore` interface. Implement `LocalJsonLawyerRegistryStore` for initial data and keep a future Redis store behind a resolver (e.g., `getLawyerRegistryStore()`).
- **Step registry**: Define a `LAWYER_ONBOARDING_STEPS` registry that lists state IDs, labels, and next/previous transitions. Generate machine routing and progress UI from this registry to allow swapping steps without rewriting flow logic.
- **Persistence**: Extend `onboarding_journeys.context` with a `lawyer` branch that stores profile data, verification results, documents, and admin decisions.
- **Approval strategy**: Persist `adminDecision` with a `decisionSource` field (`admin` today, `system` in the future). The state machine keeps an explicit transition for approval so auto-approval can be enabled later without altering state structure.

## Alternatives Considered
- Manual document upload + admin review only (rejected; high manual overhead, weak verification)
- Another IDV vendor (e.g., Veriff/Trulioo) (deferred; Persona appears flexible and fits inquiry-driven workflow)

## Risks / Trade-offs
- Config-driven machine generation adds complexity and must be tested carefully.
- Mocked identity verification could mask edge cases that real Persona integration would surface.

## Migration Plan
- Add schema fields for `context.lawyer` with optional defaults to avoid breaking existing records.
- Add local JSON registry dataset for initial lookup.
- Add mock identity verification provider with a clear extension point for Persona integration.

## Open Questions
- Hosted Persona flow vs embedded SDK: which UX do we want for the onboarding page when we integrate for real?
- What is the authoritative LSO registry source and update cadence for production?

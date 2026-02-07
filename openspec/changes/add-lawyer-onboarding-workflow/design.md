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

## API Integration Patterns (Persona, Future)
- Prefer server-side inquiry creation to control prefill fields and avoid creating a new inquiry on every client visit. citeturn1view0
- Use Dynamic Flow inquiry templates (`itmpl_`) rather than legacy `tmpl_` templates. citeturn1view1
- When resuming an inquiry, pass `inquiryId` and `sessionToken` (if pending) and do not pass template IDs. citeturn5view0turn5view2
- Pending inquiries require session tokens; tokens live in session storage and are lost across new windows. citeturn2view2turn5view4
- Inquiries expire after 24 hours by default; resuming resets expiration and invalidates existing sessions and one-time links. citeturn4view5

## Security Implementation (Persona, Future)
- Verify webhook signatures (`Persona-Signature` with timestamp + `v1` HMAC) before processing. citeturn4view4
- Process webhooks idempotently and order events using `data.attributes.created-at` due to duplicates and reordering. citeturn4view4
- Do not store sensitive/internal data in Persona fields; they are intended for customer-supplied values. citeturn4view0
- Keep API keys secret and scoped to required permissions. citeturn2view1

## Configuration (Persona, Future)
- `PERSONA_API_KEY`: server-side only, environment-specific, scoped permissions. citeturn2view1
- `PERSONA_INQUIRY_TEMPLATE_ID`: Dynamic Flow `itmpl_` ID for lawyer onboarding. citeturn1view1
- `PERSONA_WEBHOOK_SECRET`: used to verify `Persona-Signature` on webhooks. citeturn4view4
- `LAWYER_IDENTITY_PROVIDER`: selects identity provider (`mock_persona` default, `persona` reserved for future integration).

## Local Registry Data (Mock)
- Local test data lives in `convex/lawyers/lsoRegistry.json`.
- Each record includes: `lsoNumber`, `firstName`, `lastName`, `firmName`, `jurisdiction`, and optional `status`.
- The mock registry adapter matches on `lsoNumber` first, then uses the injected name matcher for strict name checks.

## Deprecated Methods / Migrations
- Legacy templates (`tmpl_`) are deprecated; use Dynamic Flow templates and migrate SDKs as required (JS SDK v4; iOS/Android v2). citeturn1view1

## Testing Guidance (Persona, Future)
- Test inquiry resume flows that require `sessionToken` and handle lost session storage. citeturn2view2turn5view4
- Test inquiry expiration behavior (24-hour default) and re-resume after expiry. citeturn4view5
- When webhooks are enabled, test duplicate/out-of-order event handling and signature verification. citeturn4view4

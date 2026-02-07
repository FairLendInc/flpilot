# Blast Radius: Lawyer Onboarding + Mock Persona

Fetch timestamp (UTC): 2026-01-31T04:20:01Z
Change ID: add-lawyer-onboarding-workflow

## External Dependencies (Future Integration)
- Persona API keys per environment; keep keys secret and scope permissions. citeturn2view1
- Persona inquiry templates (Dynamic Flow `itmpl_` IDs; legacy `tmpl_` deprecated). citeturn1view1

## Backend (Convex)
- `convex/onboarding.ts`: new mutations/actions for lawyer onboarding (start, save profile, identity verification, LSO verification, submit).
- `convex/schema.ts`: extend `onboarding_journeys.context.lawyer` with profile, identityVerification, lsoVerification, documents, adminDecision.
- `convex/http.ts` (future): Persona webhook endpoint for inquiry updates and signature verification.
- `convex/_generated/api.d.ts`: regenerated types for new Convex functions.

## Frontend
- `components/onboarding/OnboardingExperience.tsx`: add lawyer flow router + steps and remove placeholder.
- `components/onboarding/machine.ts`: add lawyer state values and transitions tied to a `LAWYER_ONBOARDING_STEPS` registry.
- `components/onboarding/useOnboardingMachine.ts`: support hydration of new lawyer states.
- New lawyer step components (likely under `components/onboarding/`).

## Shared Utilities / DI
- New interfaces and adapters under `lib/` (or `convex/lib/`) for:
  - `IdentityVerificationProvider` (mock Persona now, real adapter later)
  - `NameMatchStrategy` (strict now, swappable later)
  - `LawyerRegistryStore` (local JSON now, Redis later)

## Data & Config
- New local JSON registry dataset (e.g., `data/lso-registry.json`).
- `.env` additions for Persona integration (future), including API keys and template IDs. citeturn2view1turn1view1

## Tests
- `convex/tests/onboarding.test.ts`: add lawyer onboarding flow tests.
- New unit tests for registry lookup and identity verification strategy.
- Future webhook handler tests if Persona integration goes live.

## API Surface / Permissions
- New Convex APIs for lawyer onboarding actions.
- Admin approval/rejection mutation updates to include `decisionSource`.

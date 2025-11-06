# Implementation Tasks

## 1. Data Model & Convex Orchestration
- [x] 1.1 Extend `convex/schema.ts` and related types to add optional `externalMortgageId` with index coverage.
- [x] 1.2 Update `mortgages.createMortgage` to accept `externalMortgageId`, enforce uniqueness, and reuse an existing mortgage when provided.
- [x] 1.3 Add a new Convex action/mutation (e.g., `listings.createFromPayload`) that validates borrower, mortgage, and listing inputs, creates/reuses borrower & mortgage, and inserts the listing atomically.
- [x] 1.4 Add unit coverage in `convex/tests` verifying borrower reuse, mortgage idempotency, and listing uniqueness behavior.

## 2. HTTP Webhook
- [x] 2.1 Introduce `/listings/create` route in `convex/http.ts` that enforces API-key authentication and CORS preflight handling.
- [x] 2.2 Implement request parsing + validation (Zod or manual checks) before invoking the orchestration mutation, returning structured error payloads on failure.
- [x] 2.3 Document required environment variable(s) for the webhook secret and update deployment configuration.
- [x] 2.4 Add integration-style tests (Convex http action tests) covering successful submission, invalid key, and payload validation failures.

## 3. Admin Dashboard Form
- [x] 3.1 Add an admin route (e.g., `/dashboard/admin/listings/new`) that renders a comprehensive listing form following `app/(auth)/profilev2` layout patterns.
- [x] 3.2 Implement a dedicated Zustand store to manage borrower/property/listing state, validation status, and submission loading flags.
- [x] 3.3 Build form sections with HeroUI components (text, selects, toggle) and shadcn/ui fallbacks for date pickers and uploads, keeping inputs fully controlled.
- [x] 3.4 Wire the form submission to the new Convex mutation, handle borrower lookup suggestions, display inline errors, and show success navigation/toast.
- [x] 3.5 Add Storybook/Vitest coverage for the store and critical components to exercise validation and error presentation.

## 4. QA & Rollout
- [x] 4.1 Smoke test UI and webhook flows in development with representative payloads.
- [x] 4.2 Update onboarding/runbooks with instructions for configuring the listing webhook API key.
- [x] 4.3 Capture screenshots or Loom demo for stakeholders once form and webhook paths are validated.

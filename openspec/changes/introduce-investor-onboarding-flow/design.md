# Design: Role-Gated Onboarding with Investor Flow

## Overview
All WorkOS users start as `member`. We need to block access until admins approve a persona-specific onboarding journey. An XState machine drives the UI, while Convex persists the canonical journey snapshot so users resume exactly where they left off. Admins review completed journeys and promote users into their permanent role, e.g., `investor`.

```
member hits app → middleware sends them to /onboarding
             ↓
     XState machine (persona → flow steps)
             ↓                                   
 Convex `onboarding_journeys` table persists state + draft data
             ↓
   user submits → status = awaiting_admin
             ↓
 admin queue reads same table → approve → update WorkOS role + mark journey complete
             ↓
 user gets investor role → middleware allows rest of app
```

## Data Model Changes (Convex)
Add `onboarding_journeys` table:
```
{
  userId: v.id("users"),
  persona: v.union("broker","investor","lawyer"),
  stateValue: v.string(),              // e.g., "investor.preferences"
  context: v.object({                  // nested draft data per persona
    investor: v.optional(v.object({
      profile: v.optional(v.object({ legalName: v.string(), entityType: v.string(), contactEmail: v.string(), phone: v.optional(v.string()) })),
      preferences: v.optional(v.object({ minTicket: v.number(), maxTicket: v.number(), focusRegions: v.array(v.string()), riskProfile: v.string(), liquidityHorizonMonths: v.number() })),
      kycPlaceholder: v.optional(v.object({ status: v.union("not_started","blocked","submitted"), notes: v.optional(v.string()) })),
      documents: v.optional(v.array(v.object({ storageId: v.id("_storage"), label: v.string() }))),
    })),
  }),
  status: v.union("draft","awaiting_admin","approved","rejected"),
  adminDecision: v.optional(v.object({ decidedBy: v.id("users"), decidedAt: v.string(), notes: v.optional(v.string()) })),
  lastTouchedAt: v.string(),
}
```
Indexes:
- `by_user` on `userId` (one active journey per user)
- `by_status` on `status` (admin queue)

This keeps journey snapshots separate from WorkOS user records, aligning with `convex_rules.mdc` guidance to isolate schema concerns per domain.

## Convex Functions
- `onboarding:getJourney` (query) → returns existing row or `null`.
- `onboarding:startJourney` (mutation) → idempotently creates/updates the row when a member picks a persona.
- `onboarding:saveInvestorStep` (mutation) → validates XState context fragments per step and patches `stateValue`, `context.investor.*`, `status = draft`, and `lastTouchedAt`.
- `onboarding:submitInvestorJourney` (mutation) → validates that required investor fields are populated, transitions `status` to `awaiting_admin`, records `stateValue = "investor.review"`.
- `onboarding:listPending` (query, admin-only) → lists `awaiting_admin` journeys with persona + snapshot summary.
- `onboarding:approveJourney` / `rejectJourney` (mutations, admin-only) → check `status`, update `status`, record `adminDecision`, and invoke existing WorkOS/roles mutations to promote the user (e.g., call `internal.roles.assignRole`).

All functions use `ctx.auth.getUserIdentity()` to determine caller identity, satisfying the Convex auth guidelines.

## Middleware & Routing
- Extend the Next.js auth middleware (currently in `proxy.ts`) or top-level layout loader to fetch the current membership. If the active role is `member` and their onboarding journey is not `approved`, redirect to `/onboarding`.
- `/onboarding` is a client route containing the XState-driven UI. Once a user is `approved`, attempts to hit `/onboarding` redirect back to the dashboard.

## XState Machine
- Root machine `onboardingMachine` tracks `personaSelection` → `investorFlow` | `brokerFlow` (stub) | `lawyerFlow` (stub) → `pendingAdmin` → `done`.
- Each persona state loads persisted context via `onboarding:getJourney`. After every transition, the machine invokes `onboarding:saveInvestorStep` to snapshot `stateValue` + context.
- Investor child machine states:
  1. `intro` – investor overview + CTA.
  2. `profile` – collect legal name, entity type (individual / corp / trust), preferred contact.
  3. `preferences` – capture ticket size, focus geos, risk tolerance, timeline.
  4. `kycStub` – static screen explaining KYC is coming; toggles `kycPlaceholder.status = "blocked"` and requires acknowledgement.
  5. `documentsStub` – optional uploads (stored as metadata but not required).
  6. `review` – display collected data, gather final confirmation.
  7. `pendingAdmin` – read-only state once submitted.

The machine rehydrates using the persisted `stateValue`. If storage and machine version drift, fallback logic sends the user back to `personaSelection` with a banner.

## Admin Review UX
- Reuse the existing admin dashboard shell. Add a tab "Onboarding" that fetches `onboarding:listPending` and displays persona, submitted data, and timestamps.
- Approve action calls `onboarding:approveJourney`, which:
  - Validates caller has `org.member.update` (admins only).
  - Updates Convex journey to `approved` with decision metadata.
  - Calls WorkOS (or local role assignment) to swap the user to matching persona role (`investor`).
- Rejection sets `status = rejected` with notes; the member sees a rejection screen on `/onboarding` with instructions to contact support.

## Error Handling & Resilience
- If mutations fail (e.g., network loss), the machine displays inline errors and leaves the machine in the previous state. Users can retry; since data is persisted per step, no progress is lost.
- Idle journeys older than 30 days remain `draft`; admins aren’t notified until submission. We can later add reminders but not in this change.
- All client-side calls guard against `null` journeys and recreate them if missing, ensuring WorkOS webhook replays won’t orphan the onboarding state.

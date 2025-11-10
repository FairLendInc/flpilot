# Implementation Tasks

## 1. Convex Data + Auth
- [x] 1.1 Extend schema with `onboarding_journeys` table and indexes (`by_user`, `by_status`).
- [x] 1.2 Add helper to fetch Convex user by WorkOS subject (reuse existing `userByExternalId`).
- [x] 1.3 Implement `onboarding:getJourney`, `startJourney`, `saveInvestorStep`, and `submitInvestorJourney` using the new table and validators.
- [x] 1.4 Implement admin-only mutations `onboarding:approveJourney` and `rejectJourney` that enforce role checks via `ctx.auth.getUserIdentity()` and update WorkOS roles/admin metadata.
- [x] 1.5 Write Convex unit tests covering draft save, resume, submission, approval, and rejection paths (include race-condition test for double approval).

## 2. Middleware + Routing Guard
- [x] 2.1 Update the authenticated layout/middleware to redirect any `member` without an `approved` journey to `/onboarding`.
- [x] 2.2 Prevent `/onboarding` access for already approved users (redirect to dashboard).
- [x] 2.3 Display a "pending admin review" holding screen for users whose journey status is `awaiting_admin`.

## 3. Frontend Onboarding Experience
- [x] 3.1 Scaffold `/onboarding` route with shared layout / progress indicator and load journey data via Convex query.
- [x] 3.2 Build persona selector (broker, investor, lawyer) that calls `startJourney` and hydrates the XState machine.
- [x] 3.3 Implement investor XState machine (intro → profile → preferences → KYC stub → documents stub → review → pending). Persist state/context after each transition via `saveInvestorStep`.
- [x] 3.4 Implement UI screens for each investor state, including the KYC placeholder acknowledgement and ability to resume with prefilled inputs.
- [x] 3.5 Disable navigation to other personas once a journey is submitted; show rejection messaging with CTA to contact support.
- [x] 3.6 Add optimistic loading/error handling for network failures so progress indicators reflect save status.

## 4. Admin Review UI
- [x] 4.1 Add an "Onboarding" tab/panel in the existing admin dashboard that lists `awaiting_admin` journeys with persona + timestamps.
- [x] 4.2 Build detail drawer/modal to inspect investor submissions (profile + preferences + stub states).
- [x] 4.3 Wire Approve / Reject buttons to the new Convex mutations, updating the list reactively.

## 5. Testing & Validation
- [ ] 5.1 Add React component tests and XState logic tests (e.g., using `@xstate/test`) to ensure transitions persist correctly.
- [ ] 5.2 Add Playwright flow that signs in as a member, completes investor onboarding, verifies persistence after refresh, and confirms redirect once an admin approves.
- [ ] 5.3 Add Playwright admin test covering approve/reject flows and resulting UI states for the member.

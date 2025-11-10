# Gate Default Members Into Role-Based Onboarding

## Why
New users arrive via WorkOS with the `member` role and immediately see production data. Because this pilot is closed, admins must review every registrant before enabling broker, investor, or lawyer permissions. Without an onboarding gate, "member" users can browse the marketplace with no context, and we have no structured way to capture the data admins need for approval. We also cannot resume partially completed onboarding when someone leaves mid-flow.

## What Changes
- Force all `member` users who have not been approved into a dedicated onboarding route regardless of which page they visit.
- Persist onboarding progress, persona choice, and draft answers inside Convex so XState can resume the correct state on refresh or new devices.
- Implement a persona selector (broker / investor / lawyer) with an initial investor-specific flow that captures investment profile basics, preferences, and a stubbed KYC stage.
- Surface an admin review queue that lets admins approve or reject completed journeys, automatically granting the correct WorkOS role when approved.
- Show pending / rejected states so users know whether they can access the rest of the app.

## Success Criteria
- Default members can never reach app routes without completing onboarding and being approved.
- Investors can leave during any onboarding step and return to the exact state with their previous answers intact.
- Admins can see which persona a user selected, review their submitted data, and grant them the investor role in one action.
- KYC/AML remains a stub screen + state, but the machine already reserves the step so the real form can drop in later.

## Non-Goals
- Building the actual broker or lawyer flows (only persona scaffolding plus investor path for now).
- Implementing real KYC vendors or document collection—the stub just blocks navigation and records a `pending` status.
- Auto-approving users or bypassing WorkOS role management.

## Risks / Open Questions
1. Do we always want admins to assign the final role manually, even after onboarding captures persona intent? (Assumption: yes—WorkOS remains the source of truth.)
2. Should users be able to switch persona after they submit for approval? (Assumption: no; they must contact support once a journey is `awaiting_admin`.)
3. Does the pilot require additional agreements or DocuSign steps before approval? (Assumption: not yet; capture interest + preferences only.)

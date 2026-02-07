## Why
Lawyer onboarding is currently a placeholder, which blocks legal reviewers from joining and leaves compliance checks (ID + LSO validation) manual. We need a resumable, auditable onboarding flow comparable to broker onboarding, plus identity verification and registry matching that can evolve as requirements change.

## What Changes
- Add a lawyer onboarding state machine with explicit states, resumable progress, and persisted context
- Add a mocked Persona-style identity verification step with strict name matching via an injected strategy
- Validate LSO number + name against a dependency-injected registry provider (local JSON now, Redis later)
- Make lawyer onboarding steps swappable via a centralized step registry
- Require admin review/approval paths while preserving a clean upgrade path to auto-approval later

## Impact
- Affected specs: lawyer-onboarding
- Affected code: components/onboarding/*, convex/onboarding.ts, convex/schema.ts, convex/http.ts, lib/*, data/*, unit-tests/*

## 1. Implementation
- [ ] 1.1 Extend `onboarding_journeys` schema to include `context.lawyer` with profile, verification, documents, and admin decision fields
- [ ] 1.2 Add lawyer state values to the onboarding state machine and introduce a `LAWYER_ONBOARDING_STEPS` registry for configurable step order
- [ ] 1.3 Implement `LawyerRegistryStore`, `IdentityVerificationProvider`, and `NameMatchStrategy` interfaces with a local JSON adapter and mocked Persona provider
- [ ] 1.4 Add Convex mutations/actions to start lawyer onboarding, save profile data, create mock Persona inquiry, and persist verification results
- [ ] 1.5 Add a future-ready Persona integration surface (adapter + config hooks) without live API calls
- [ ] 1.6 Build lawyer onboarding UI steps and integrate Persona flow into the onboarding page
- [ ] 1.7 Add admin review/approval actions for lawyer journeys and wire them into admin UI, recording `decisionSource`
- [ ] 1.8 Add tests for lawyer onboarding state transitions, registry matching, and mock identity verification outcomes
- [ ] 1.9 Document required environment variables and local registry data format

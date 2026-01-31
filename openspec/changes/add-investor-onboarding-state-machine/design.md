## Context

This design document outlines the technical architecture for the investor onboarding state machine with broker code support and swappable steps. The implementation follows the established broker onboarding patterns while introducing new architectural patterns for step composability and dependency injection.

### Background

The existing broker onboarding uses an XState state machine with hierarchical states (`broker.intro`, `broker.company_info`, etc.) and persists progress to Convex. The investor onboarding currently exists as a stub with basic steps but lacks:

1. Broker code entry and resolution
2. Differentiated flows based on broker assignment
3. Swappable step architecture for compliance flexibility
4. Broker landing pages for subdomain access

### Constraints

- Must use existing XState patterns from broker onboarding
- Must integrate with existing `onboarding_journeys` table
- Must support subdomain routing already in place
- Must maintain backward compatibility with existing journeys
- Must allow steps to be added/removed without code changes to the state machine

### Stakeholders

- Investors: Self-directed onboarding with optional broker assignment
- Brokers: Receive investors via codes, branded landing pages
- Admins: Review investor applications, manage broker codes
- Compliance: Ability to modify onboarding requirements

## Goals / Non-Goals

### Goals

- Create a state machine-driven investor onboarding flow
- Implement broker code entry with real-time validation
- Support differentiated flows for FairLend vs. external brokers
- Design swappable step architecture for compliance flexibility
- Build beautiful broker landing pages for subdomain access
- Maintain resumable progress across sessions

### Non-Goals

- Real KYC vendor integration (document upload only, verification stubbed)
- Real-time broker code validation during typing (on-submit validation only)
- Multi-language support for landing pages
- Advanced broker customization beyond colors/logo
- Automated investor approval (admin review required)

## Decisions

### Decision 1: Swappable Step Architecture via Registry Pattern

**What**: Steps are defined as injectable objects with a standard interface, registered in a central registry, and loaded dynamically by the state machine.

**Why**: 
- Allows steps to be added/removed without modifying state machine code
- Enables different step configurations per broker
- Supports A/B testing of onboarding flows
- Makes compliance changes deployable without code changes

**Interface**:
```typescript
interface OnboardingStep {
  id: string;
  component: React.ComponentType<StepProps>;
  validate: (data: unknown) => ValidationResult;
  persist: (data: unknown) => Promise<PersistResult>;
  isRequired: boolean;
}
```

**Alternatives considered**:
- Hardcoded state machine states: Too rigid, requires code changes for new steps
- Plugin system with dynamic imports: Overly complex for current needs
- JSON-based step definitions: Loses type safety and validation logic

### Decision 2: Step Configuration per Broker Type

**What**: Store step order and step-specific settings in database configuration records keyed by broker type ("fairlend", "external_broker", or specific broker ID).

**Why**:
- FairLend investors need KYC document upload
- External broker investors may skip certain steps
- Future: Individual brokers may customize their flows

**Configuration Schema**:
```typescript
interface StepConfiguration {
  id: string; // "fairlend", "external_broker", or brokerId
  stepOrder: string[];
  stepSettings: Record<string, StepSettings>;
  version: number;
}
```

**Alternatives considered**:
- Hardcoded if/else logic: Not flexible enough
- Broker-specific state machines: Too much duplication
- Feature flags: Doesn't handle step ordering

### Decision 3: Dependency Injection via React Context

**What**: Provide step registry and configuration via React Context, injected at the onboarding page level.

**Why**:
- Makes components agnostic to step implementation
- Enables testing with mock steps
- Allows different configurations per route (FairLend vs. broker subdomain)
- Follows existing patterns in the codebase

**Pattern**:
```typescript
// OnboardingProvider.tsx
<OnboardingConfigProvider 
  stepRegistry={investorStepRegistry}
  getStepConfiguration={getStepConfigurationForBroker}
>
  <OnboardingExperience />
</OnboardingConfigProvider>
```

**Alternatives considered**:
- Global singleton registry: Harder to test, less flexible
- Props drilling: Too verbose for deeply nested components
- Module-level imports: Loses ability to swap implementations

### Decision 4: Database-Agnostic Persistence Layer

**What**: Step persistence functions accept a `persistFn` callback that abstracts the actual storage mechanism.

**Why**:
- Steps don't need to know about Convex or database schema
- Enables testing with in-memory storage
- Future: Could support offline-first with localStorage fallback

**Pattern**:
```typescript
// Step definition
const profileStep: OnboardingStep = {
  id: "profile",
  persist: async (data, { persistFn }) => {
    const validated = validateProfile(data);
    await persistFn("profile", validated);
    return validated;
  }
};

// In component
const { persistStep } = useOnboarding();
await step.persist(formData, { persistFn: persistStep });
```

### Decision 5: Broker Landing Page as Standalone Route

**What**: Broker landing pages are served from a dedicated route (`/[subdomain]/landing`) with middleware-based subdomain resolution.

**Why**:
- Clean separation from authenticated app routes
- Easier to implement public access without auth checks
- Simplifies caching and CDN configuration
- Can be statically generated with broker data

**Flow**:
```
User visits broker.flpilot.com
↓
proxy.ts resolves subdomain to broker ID
↓
If authenticated: redirect to dashboard
If unauthenticated: render landing page
```

**Alternatives considered**:
- Same route with conditional rendering: More complex auth logic
- Separate subdomain app: Overkill for current scope

### Decision 6: Broker Code Case-Insensitive with Normalization

**What**: Store broker codes in uppercase, normalize user input to uppercase before lookup.

**Why**:
- Prevents confusion from case sensitivity
- Simple implementation
- Consistent with most referral code patterns

## Risks / Trade-offs

### Risk: Step Configuration Versioning

**Risk**: When step configurations change, in-progress journeys may reference removed steps.

**Mitigation**:
- Store configuration version with each journey
- On hydration, check if current step exists in new configuration
- If not, transition to nearest valid parent or step
- Display notification to user about flow update

### Risk: Broker Code Security

**Risk**: Broker codes could be guessed or brute-forced.

**Mitigation**:
- Use sufficiently long codes (8+ alphanumeric characters)
- Rate limit code validation attempts
- Consider adding expiration dates to codes
- Monitor for suspicious validation patterns

### Risk: State Machine Complexity

**Risk**: Dynamic step transitions make the state machine harder to reason about.

**Mitigation**:
- Keep core state machine simple (just tracks current step)
- Step transitions handled by configuration, not hardcoded in machine
- Comprehensive logging of state transitions
- Visual state machine debugging tools

### Risk: Landing Page Performance

**Risk**: Broker landing pages with dynamic data may be slow to load.

**Mitigation**:
- Cache broker data aggressively
- Use static generation where possible
- Optimize images (logo) with Next.js Image component
- Consider edge caching for landing pages

### Risk: Compliance Step Changes

**Risk**: Adding/removing compliance steps may invalidate in-progress journeys.

**Mitigation**:
- Never remove steps, only deprecate (hide from new journeys)
- Store complete step history for audit
- Allow admins to manually transition stuck journeys
- Clear communication to users when flows change

## Migration Plan

### Phase 1: Foundation (Week 1)

1. Create database schema changes
2. Implement step registry and base interfaces
3. Build broker code resolution system
4. Create investor state machine structure

### Phase 2: Core Flow (Week 2)

1. Implement investor step components
2. Build broker selection step with code lookup
3. Create differentiated flows for FairLend vs. external
4. Integrate with admin review queue

### Phase 3: Landing Pages (Week 3)

1. Build broker landing page components
2. Update subdomain routing
3. Implement branding application
4. Add sign-up/sign-in CTAs

### Phase 4: Testing & Polish (Week 4)

1. Write comprehensive tests
2. Test swappable step behavior
3. Performance optimization
4. Documentation and runbooks

### Rollback Plan

- Feature flags for new onboarding flow
- Keep existing investor stub as fallback
- Database migrations are additive only
- Can disable broker landing pages via config

## Open Questions

1. **Should broker codes expire?** Currently not required, but may be needed for time-limited promotions.

2. **Can brokers customize their landing page content?** Currently limited to logo, colors, contact info. Full CMS may be future scope.

3. **How do we handle investors who start on FairLend but want to switch brokers?** Currently requires admin intervention. Self-service transfer may be future scope.

4. **Should we support multiple broker codes per broker?** Currently 1:1 mapping. May need multiple codes for different campaigns.

5. **What happens to in-progress journeys when a broker is suspended?** Need to define policy for handling active applications.

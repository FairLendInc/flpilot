# Add Investor Onboarding State Machine with Broker Code Support

## Why

The platform needs a production-ready investor onboarding workflow that mirrors the broker onboarding state machine pattern but with investor-specific requirements. Unlike the basic investor stub currently in place, this implementation needs to support broker code entry during onboarding, different onboarding paths based on broker selection (FairLend vs. external broker), and a swappable step architecture that allows compliance requirements to evolve without rewriting the entire flow.

Key requirements:
1. **Self-directed onboarding**: Investors sign up independently and can optionally enter a broker code
2. **Broker code lookup**: When entering a broker code, display the broker's name and contact information
3. **Default broker assignment**: Empty broker code assigns investor to FairLend brokerage
4. **Differentiated workflows**: FairLend investors have additional KYC document upload requirements (currently stubbed, swappable)
5. **Broker portal landing**: Accessing a broker subdomain without authentication shows a branded landing page with sign-up/sign-in
6. **Swappable steps**: Architecture must support adding, removing, or reordering onboarding steps without breaking existing journeys

## What Changes

- **Investor Onboarding State Machine**: Extend the existing XState machine with investor-specific states using the same hierarchical pattern as broker onboarding (`investor.intro`, `investor.broker_selection`, `investor.profile`, etc.)
- **Broker Code Resolution System**: Create a lookup mechanism to validate broker codes and retrieve broker metadata (name, contact info, branding)
- **Swappable Step Architecture**: Design the state machine with composable step definitions that can be injected/configured, allowing steps to be swapped without changing core state machine logic
- **Dependency Injection Pattern**: Implement the onboarding flow with clear interfaces between the state machine (orchestration), step handlers (business logic), and persistence layer (database), making the system agnostic to storage implementation
- **Broker Landing Page**: Create a beautiful, branded landing page for broker subdomains that handles unauthenticated visitors with sign-up/sign-in CTAs
- **FairLend vs. Broker Differentiation**: Implement conditional step injection based on broker assignment (KYC document upload for FairLend investors)
- **Progress Persistence**: Save onboarding progress at each step, allowing resumption across sessions and devices
- **Admin Review Integration**: Connect to existing admin review queue for investor applications

## Impact

- **Affected Specs**:
  - New capabilities: `investor-onboarding`, `broker-code-resolution`, `broker-landing-page`
  - Modified capabilities: `investor-onboarding-flow` (replace stub with full implementation), `broker-onboarding` (add broker code field)

- **Affected Code**:
  - Convex schema: Extend `onboarding_journeys` table with investor context, add `broker_codes` table for code-to-broker mapping
  - Convex functions: Create investor onboarding mutations, broker code resolution queries, broker landing page data fetch
  - XState machine: Extend `components/onboarding/machine.ts` with investor flow states following broker pattern
  - Frontend components: Create investor onboarding steps, broker code input with lookup, broker landing page
  - Routing: Extend subdomain handling in `proxy.ts` to serve broker landing pages

- **Dependencies**:
  - Existing onboarding journey infrastructure (XState machine, `onboarding_journeys` table)
  - Existing broker management system (`brokers` table, broker onboarding)
  - Existing subdomain routing (`lib/subdomains.ts`, `proxy.ts`)
  - Existing admin review queue patterns

- **Risks**:
  - Compliance requirements may change frequently; swappable step architecture must be robust
  - Broker code collisions or validation edge cases need careful handling
  - Landing page branding must apply consistently across all broker subdomains
  - State machine versioning must handle in-flight journeys when steps are added/removed

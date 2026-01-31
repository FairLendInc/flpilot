## 1. Architecture & Design

- [ ] 1.1 Design the swappable step architecture with clear interfaces
- [ ] 1.2 Define the step registry pattern and dependency injection structure
- [ ] 1.3 Design the broker code resolution system
- [ ] 1.4 Design the broker landing page component structure
- [ ] 1.5 Create architecture diagram showing state machine, step registry, and persistence layers

## 2. Database Schema

- [ ] 2.1 Create `broker_codes` table with code, brokerId, expiresAt, isActive fields
- [ ] 2.2 Extend `onboarding_journeys` table with investor context schema
- [ ] 2.3 Create `investor_onboarding_configs` table for step order configurations
- [ ] 2.4 Add indexes for broker code lookups and investor journey queries

## 3. Backend Implementation

- [ ] 3.1 Implement broker code resolution queries (`getBrokerByCode`, `validateBrokerCode`)
- [ ] 3.2 Create investor onboarding mutations following broker onboarding pattern
  - [ ] 3.2.1 `startInvestorJourney`
  - [ ] 3.2.2 `saveInvestorBrokerSelection`
  - [ ] 3.2.3 `saveInvestorProfile`
  - [ ] 3.2.4 `saveInvestorPreferences`
  - [ ] 3.2.5 `saveInvestorKycDocuments`
  - [ ] 3.2.6 `submitInvestorJourney`
- [ ] 3.3 Implement step configuration loading based on broker assignment
- [ ] 3.4 Create broker landing page data query (`getBrokerLandingPageData`)
- [ ] 3.5 Add admin review functions for investor journeys

## 4. State Machine Extension

- [ ] 4.1 Extend XState machine with investor hierarchical states
- [ ] 4.2 Implement investor state types and context schema
- [ ] 4.3 Add investor-specific guards and actions
- [ ] 4.4 Implement state hydration for investor journeys
- [ ] 4.5 Add support for dynamic step transitions based on configuration

## 5. Step Registry & Swappable Steps

- [ ] 5.1 Create step registry with injectable step definitions
- [ ] 5.2 Implement base step interface (id, component, validate, persist)
- [ ] 5.3 Create investor step definitions:
  - [ ] 5.3.1 Intro step
  - [ ] 5.3.2 Broker selection step
  - [ ] 5.3.3 Profile step
  - [ ] 5.3.4 Preferences step
  - [ ] 5.3.5 KYC documents step (FairLend)
  - [ ] 5.3.6 KYC stub step (external broker)
  - [ ] 5.3.7 Review step
- [ ] 5.4 Implement step configuration loader
- [ ] 5.5 Create step order configuration for FairLend and external broker flows

## 6. Frontend Components

- [ ] 6.1 Create investor onboarding flow router component
- [ ] 6.2 Implement broker code input with real-time validation
- [ ] 6.3 Create broker information display component
- [ ] 6.4 Build investor profile form component
- [ ] 6.5 Build investment preferences form component
- [ ] 6.6 Create KYC document upload component (FairLend)
- [ ] 6.7 Create KYC stub component (external broker)
- [ ] 6.8 Build investor review step component
- [ ] 6.9 Create pending admin state component

## 7. Broker Landing Page

- [ ] 7.1 Create broker landing page layout component
- [ ] 7.2 Implement broker branding application (logo, colors)
- [ ] 7.3 Build sign-up CTA with broker code pre-fill
- [ ] 7.4 Build sign-in CTA with redirect handling
- [ ] 7.5 Create broker contact information display
- [ ] 7.6 Implement subdomain resolution middleware updates

## 8. Integration & Routing

- [ ] 8.1 Update subdomain routing to handle broker landing pages
- [ ] 8.2 Integrate investor onboarding with existing onboarding gate
- [ ] 8.3 Connect investor onboarding to admin review queue
- [ ] 8.4 Implement redirect logic for authenticated users on broker subdomains

## 9. Testing

- [ ] 9.1 Write unit tests for step registry and step definitions
- [ ] 9.2 Write unit tests for broker code resolution
- [ ] 9.3 Write unit tests for state machine transitions
- [ ] 9.4 Write integration tests for complete onboarding flows
- [ ] 9.5 Write E2E tests for broker landing page
- [ ] 9.6 Test swappable step behavior (add/remove/reorder steps)

## 10. Documentation

- [ ] 10.1 Document the swappable step architecture
- [ ] 10.2 Create guide for adding new onboarding steps
- [ ] 10.3 Document broker code management for admins
- [ ] 10.4 Update API documentation for new mutations/queries
- [ ] 10.5 Create runbook for modifying step configurations

## 11. Deployment & Migration

- [ ] 11.1 Create migration for new database tables
- [ ] 11.2 Seed initial broker codes for existing brokers
- [ ] 11.3 Create default step configurations for FairLend and external brokers
- [ ] 11.4 Deploy and verify in staging environment
- [ ] 11.5 Monitor for errors and onboarding completion rates

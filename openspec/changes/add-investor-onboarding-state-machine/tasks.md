## 1. Architecture & Design

- [x] 1.1 Design the swappable step architecture with clear interfaces
- [x] 1.2 Define the step registry pattern and dependency injection structure
- [x] 1.3 Design the broker code resolution system
- [x] 1.4 Design the broker landing page component structure
- [x] 1.5 Create architecture diagram showing state machine, step registry, and persistence layers

## 2. Database Schema

- [x] 2.1 Create `broker_codes` table with code, brokerId, expiresAt, isActive fields
- [x] 2.2 Extend `onboarding_journeys` table with investor context schema
- [x] 2.3 Create `investor_onboarding_configs` table for step order configurations
- [x] 2.4 Add indexes for broker code lookups and investor journey queries

## 3. Backend Implementation

- [x] 3.1 Implement broker code resolution queries (`getBrokerByCode`, `validateBrokerCode`)
- [x] 3.2 Create investor onboarding mutations following broker onboarding pattern
  - [x] 3.2.1 `startInvestorJourney`
  - [x] 3.2.2 `saveInvestorBrokerSelection`
  - [x] 3.2.3 `saveInvestorProfile`
  - [x] 3.2.4 `saveInvestorPreferences`
  - [x] 3.2.5 `saveInvestorKycDocuments`
  - [x] 3.2.6 `submitInvestorJourney`
- [x] 3.3 Implement step configuration loading based on broker assignment
- [x] 3.4 Create broker landing page data query (`getBrokerLandingPageData`)
- [x] 3.5 Add admin review functions for investor journeys

## 4. State Machine Extension

- [x] 4.1 Extend XState machine with investor hierarchical states
- [x] 4.2 Implement investor state types and context schema
- [x] 4.3 Add investor-specific guards and actions
- [x] 4.4 Implement state hydration for investor journeys
- [x] 4.5 Add support for dynamic step transitions based on configuration

## 5. Step Registry & Swappable Steps

- [x] 5.1 Create step registry with injectable step definitions
- [x] 5.2 Implement base step interface (id, component, validate, persist)
- [x] 5.3 Create investor step definitions:
  - [x] 5.3.1 Intro step
  - [x] 5.3.2 Broker selection step
  - [x] 5.3.3 Profile step
  - [x] 5.3.4 Preferences step
  - [x] 5.3.5 KYC documents step (FairLend)
  - [x] 5.3.6 KYC stub step (external broker)
  - [x] 5.3.7 Review step
- [x] 5.4 Implement step configuration loader
- [x] 5.5 Create step order configuration for FairLend and external broker flows

## 6. Frontend Components

- [x] 6.1 Create investor onboarding flow router component
- [x] 6.2 Implement broker code input with real-time validation
- [x] 6.3 Create broker information display component
- [x] 6.4 Build investor profile form component
- [x] 6.5 Build investment preferences form component
- [x] 6.6 Create KYC document upload component (FairLend)
- [x] 6.7 Create KYC stub component (external broker)
- [x] 6.8 Build investor review step component
- [x] 6.9 Create pending admin state component

## 7. Broker Landing Page

- [x] 7.1 Create broker landing page layout component
- [x] 7.2 Implement broker branding application (logo, colors)
- [x] 7.3 Build sign-up CTA with broker code pre-fill
- [x] 7.4 Build sign-in CTA with redirect handling
- [x] 7.5 Create broker contact information display
- [x] 7.6 Implement subdomain resolution middleware updates

## 8. Integration & Routing

- [x] 8.1 Update subdomain routing to handle broker landing pages
- [x] 8.2 Integrate investor onboarding with existing onboarding gate
- [x] 8.3 Connect investor onboarding to admin review queue
- [x] 8.4 Implement redirect logic for authenticated users on broker subdomains

## 9. Testing

- [x] 9.1 Write unit tests for step registry and step definitions
- [x] 9.2 Write unit tests for broker code resolution
- [x] 9.3 Write unit tests for state machine transitions
- [x] 9.4 Write integration tests for complete onboarding flows
- [x] 9.5 Write E2E tests for broker landing page
- [x] 9.6 Test swappable step behavior (add/remove/reorder steps)

## 10. Documentation

- [x] 10.1 Document the swappable step architecture
- [x] 10.2 Create guide for adding new onboarding steps
- [x] 10.3 Document broker code management for admins
- [x] 10.4 Update API documentation for new mutations/queries
- [x] 10.5 Create runbook for modifying step configurations

## 11. Deployment & Migration

- [x] 11.1 Create migration for new database tables
- [x] 11.2 Seed initial broker codes for existing brokers
- [x] 11.3 Create default step configurations for FairLend and external brokers
- [x] 11.4 Deploy and verify in staging environment
- [x] 11.5 Monitor for errors and onboarding completion rates

# Add Broker Onboarding and Portal Management

## Why

> **Screen References**: The complete screen and component manifest for this feature is defined in [`design.md`](./design.md#screen-and-component-manifest). This proposal references screens S1-S13 which are documented in detail in the design document.

The platform needs a structured, auditable process for onboarding brokers with vanity subdomains, branding, WorkOS organization provisioning, client management, and commission tracking. Currently, broker functionality exists only as stubs in the onboarding journey and hardcoded constants. The broker onboarding flow must be resumable and modifiable as compliance requirements evolve, modeled as an XState state machine with rollback support before final approval.

## What Changes

- **Broker Onboarding State Machine**: Extend the existing `onboarding_journeys` table with broker-specific context to handle a linear compliance flow (intro, company info, licensing, documents, review) with explicit state transitions and rollback mechanisms to earlier steps before finalization.
- **Broker Portal with Vanity Subdomain**: Provision unique vanity subdomains (e.g., `broker.flpilot.com`) per broker and integrate with existing subdomain routing (`lib/subdomains.ts`, `proxy.ts`) to route broker and client traffic to branded portals.
- **Broker Branding Configuration**: Add broker-level branding configuration (logo, colors) stored in Convex and applied to all pages under broker subdomains, including broker dashboard and their clients' portals.
- **WorkOS Organization Strategy**: Provision dedicated WorkOS organizations for brokers (for their team) and for broker-managed clients (for login/RBAC isolation), extending existing WorkOS integration patterns.
- **Broker-Facilitated Client Onboarding**: Create a client onboarding workflow where brokers invite clients, configure listing filters (min/max ranges for key financial metrics), and approve clients before granting access. Clients receive a WorkOS org and are linked to their broker.
- **Admin Broker Management**: Add admin dashboards to review broker applications, view complete application history with timeline of admin requests and broker responses, approve/reject brokers, manage broker status (suspend/revoke), and view broker stats (AUM, client count, deal volume, commissions).
- **Commission and Return Tracking**: Integrate with Formance ledger to track broker commissions as a percentage of capital deployed and apply per-broker return adjustments visible to clients. Ledger-only tracking (no money movement orchestration).
- **Broker Dashboards**: Provide broker portal with dashboard showing KPIs, client list management, client onboarding workspace, and portfolio overview.
- **Page-Based Navigation**: Implement a Notion/Twenty-style navigation where each entity (broker, client, deal, listing) is a page with links to related entity pages.

## Impact

- **Affected Specs**:
  - New capabilities: `broker-onboarding`, `broker-portal`, `broker-commissions`, `tenant-branding`, `broker-client-workflow`
  - Modified capabilities: `investor-onboarding-flow` (extend personae), multi-tenancy (add broker tenant model)

- **Affected Code**:
  - Convex schema: extend `onboarding_journeys` table with broker context, add `brokers`, `broker_applications`, `broker_clients` tables
  - Convex functions: create broker onboarding, branding, client management, commission tracking functions in `convex/brokers/`
  - Frontend routing: extend `proxy.ts` subdomain handling, add broker and client routes under subdomains
  - XState machine: extend `components/onboarding/machine.ts` with broker flow states
  - WorkOS integration: extend org provisioning logic for broker and client workflows
  - Formance integration: extend `convex/lib/ownershipLedger.ts` with broker commission and adjustment tracking
  - Admin UI: add broker management, application review, and stats dashboards in `app/(auth)/dashboard/admin/brokers/`
  - Broker UI: create broker portal pages in `app/(auth)/dashboard/broker/` and client pages

- **Dependencies**:
  - Existing onboarding journey infrastructure (XState machine, `onboarding_journeys` table)
  - Existing subdomain routing (`lib/subdomains.ts`)
  - Existing WorkOS integration (organizations, memberships)
  - Existing Formance ledger integration (`convex/lib/ownershipLedger.ts`)
  - Existing investor onboarding patterns

- **Risks**:
  - Compliance requirements may evolve heavily; state machine architecture must be flexible for future changes
  - Subdomain routing complexity increases; need careful edge case handling for fallback routing
  - Broker branding configuration must apply consistently across broker and client pages
  - Ledger integration must maintain idempotency and prevent duplicate commission records
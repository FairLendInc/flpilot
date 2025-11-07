# Proposal: Add Listing Creation Pathways

## Why

Marketplace listings are currently seeded data with no production-grade path for administrators or integrations to publish properties. Operations teams need a comprehensive UI workflow to onboard real mortgages with validated borrower details, while partners require an authenticated webhook to programmatically deliver new deals. Without these pathways, FairLend cannot ingest real inventory or guarantee that incoming data meets business rules.

## What Changes

- Add an admin dashboard listing creation experience that mirrors the `@profilev2` controlled form conventions, captures borrower/property/mortgage inputs, and manages state with a dedicated Zustand store.
- Extend Convex mutations to orchestrate borrower reuse/creation, mortgage creation (including optional media uploads), and listing insertion in a single atomic flow used by both UI and webhook callers.
- Introduce an authenticated `/listings/create` webhook secured by an API key that performs full payload validation and reuses the orchestration mutation.
- Allow mortgages to persist an optional `externalMortgageId` so webhook submissions can be idempotent across retries.

## Impact

- Unlocks internal ability to launch and manage live listings without manual database work.
- Provides a secure integration surface for upstream systems to push new deals with validation parity to the admin flow.
- Requires schema updates (optional identifier + index) and new mutation/action coverage that existing listings UI will consume once listings enter the system via these pathways.

## Why

The current deal closing workflow transfers 100% ownership directly without admin review, and the system lacks event emission infrastructure for external integrations. As FairLend scales toward fractional ownership and needs CRM/ledger integration (Apache Pulsar or similar), the ownership transfer process requires:

1. A human-in-the-loop (HITL) review step before ownership transfers
2. Extensible fractional ownership support (100% purchases now, fractional future)
3. Event emission infrastructure for audit trails and external system integration

## UI/UX Skill Requirement

When creating any new UI component for this change, use `@.cursor/commands/ui-ux-pro-max.md`.

## What Changes

### Ownership Transfer Workflow

- **BREAKING**: Add `pending_ownership_review` state between `pending_verification` and `completed`
- Add ownership transfer review component showing before/after ownership state
- Gate ownership transfer behind: deal completed, all docs signed, funds verified
- Admin must approve ownership transfer after reviewing the details

### Fractional Ownership Extensibility

- Add `purchasePercentage` field to deal context (defaults to 100)
- Store transfer details (from/to owner, percentage) for review
- Maintain 100% ownership invariant with FairLend as remainder owner

### Event Emission Infrastructure

- Add stubbed event emitter abstraction (`lib/events/emitter.ts`)
- Define event schema with: eventType, entityId, userId, timestamp, beforeState, afterState
- Extend `createAuthorizedMutation` wrapper to emit events on CRUD operations
- Store events in new `audit_events` table for durability before external emission

### Admin Review Component

- Create `OwnershipTransferReview` component for admin dashboard
- Show: mortgage details, current ownership cap table, proposed transfer, investor info
- Reuse in deal portal admin view
- Require explicit "Confirm Transfer" action

## Impact

- **Affected specs**: `mortgage-ownership`, `deals`
- **New spec**: `event-emission`
- **Affected code**:
  - `convex/deals.ts` - new state and transfer review flow
  - `convex/dealStateMachine.ts` - add `pending_ownership_review` state
  - `convex/ownership.ts` - add pending transfer tracking
  - `convex/schema.ts` - new `audit_events` and `pending_ownership_transfers` tables
  - `lib/events/` - new event emitter abstraction
  - `components/admin/deals/` - new review components
  - `app/(auth)/dashboard/admin/deals/` - integration of review flow
  - `app/(auth)/dealportal/` - admin view with review capability

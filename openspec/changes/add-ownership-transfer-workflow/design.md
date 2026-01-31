## Context

FairLend's deal closing workflow currently transfers ownership immediately when `completeDeal()` is called. As the platform matures toward:

1. Fractional ownership (multiple investors per mortgage)
2. External ledger integration (Formance, Apache Pulsar)
3. CRM record keeping and audit compliance

...we need a more deliberate ownership transfer process with human review and event emission for external systems.

> **📚 Research References**
>
> - [blastradius.md](research/blastradius.md) - Full impact analysis (MODERATE risk, well-defined boundaries)
> - [footguns.md](research/footguns.md) - 14 potential pitfalls with mitigations
> - [research.md](research/research.md) - Implementation patterns from Convex, Formance, OWASP

**Stakeholders**: Admin users, investors, compliance/audit, external integration systems

**Constraints**:

- Must maintain 100% ownership invariant at all times
- Current deals use 100% purchases; fractional is future state
- Event destination (Pulsar vs alternatives) not yet decided
- Must not break existing deal flow for in-progress deals

> **⚠️ CRITICAL Footgun**: [footguns.md #1](research/footguns.md) - **NEVER directly insert/update `mortgage_ownership`**. Always use `createOwnershipInternal()` which automatically:
>
> 1. Reduces FairLend ownership by transfer amount
> 2. Deletes FairLend record if percentage becomes 0
> 3. Validates FairLend has sufficient ownership
>
> Direct inserts will break the 100% invariant and cause data corruption.

## Goals / Non-Goals

### Goals

- Add HITL review step before any ownership transfer executes
- Create reusable admin review component for deal portal and admin dashboard
- Implement stubbed event emitter that can be wired to any message broker
- Store events durably in Convex before emission (at-least-once delivery pattern)
- Support fractional percentages in data model (100% initially)

### Non-Goals

- Implement actual Apache Pulsar integration (just the abstraction)
- Add fractional purchase UI (future change)
- Modify investor-facing deal portal experience significantly
- Implement rollback/undo of ownership transfers

## UI/UX Skill Requirement

When creating any new UI component for this change, use `@.cursor/commands/ui-ux-pro-max.md`.

## Decisions

### 1. New Deal State: `pending_ownership_review`

**Decision**: Insert a new XState state between `pending_verification` and `completed`.

**Rationale**:

- The `completed` state currently has dual meaning (funds verified AND ownership transferred)
- Separating these allows explicit admin confirmation
- Matches real-world workflow where legal/compliance reviews before final transfer

**State Machine Changes**:

```
pending_verification --[VERIFY_COMPLETE]--> pending_ownership_review --[CONFIRM_TRANSFER]--> completed
                                                |
                                                +--[REJECT_TRANSFER]--> pending_verification
```

> **⚠️ Footgun Reference**: [footguns.md #6](research/footguns.md) - State machine state must be explicitly persisted after every transition. XState runs in memory; forgetting to serialize to DB will lose state on restart.
>
> **📊 Blast Radius**: [blastradius.md §2](research/blastradius.md) - Modifies `dealStateMachine.ts` and `deals.ts`; requires updating `DealStateValue` type, `getNextState()`, `getPreviousState()` helpers.
>
> **💡 Research Pattern**: [research.md §1.1](research/research.md) - All state transitions should be atomic mutations with single-transaction guarantees.

### 2. Pending Transfer Record

**Decision**: Create `pending_ownership_transfers` table to stage transfers before execution.

**Schema**:

```typescript
pending_ownership_transfers: defineTable({
  dealId: v.id("deals"),
  mortgageId: v.id("mortgages"),
  fromOwnerId: v.union(v.literal("fairlend"), v.id("users")),
  toOwnerId: v.id("users"),
  percentage: v.number(),
  status: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected"),
  ),
  createdAt: v.number(),
  reviewedAt: v.optional(v.number()),
  reviewedBy: v.optional(v.id("users")),
  reviewNotes: v.optional(v.string()),
});
```

**Rationale**:

- Provides clear audit trail of proposed vs executed transfers
- Allows rejection with notes
- Captures snapshot of transfer intent before execution

> **💡 Research Pattern**: [research.md §3.3](research/research.md) - Implements the **Maker-Checker pattern** from financial best practices. System creates pending record (maker), admin reviews and approves/rejects (checker).
>
> **📊 Blast Radius**: [blastradius.md §1](research/blastradius.md) - New table requires indexes: `by_deal`, `by_status`, `by_mortgage` for efficient queries.
>
> **⚠️ Footgun Reference**: [footguns.md #8](research/footguns.md) - Ensure all query patterns have corresponding indexes before deployment to avoid full table scans.

### 3. Event Emission Architecture

**Decision**: Implement a stubbed adapter pattern for event emission.

**Architecture**:

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│ Convex Mutation │──────│ audit_events     │──────│ Event Emitter   │
│ (with wrapper)  │      │ table (durable)  │      │ (stubbed)       │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                │
                                ▼
                         ┌──────────────────┐
                         │ Future: Pulsar   │
                         │ Kafka, etc.      │
                         └──────────────────┘
```

**Event Schema**:

```typescript
audit_events: defineTable({
  eventType: v.string(), // e.g., "ownership.transfer.created"
  entityType: v.string(), // e.g., "mortgage_ownership"
  entityId: v.string(),
  userId: v.id("users"), // who triggered
  timestamp: v.number(),
  beforeState: v.optional(v.any()), // snapshot before
  afterState: v.optional(v.any()), // snapshot after
  metadata: v.optional(v.any()), // additional context
  emittedAt: v.optional(v.number()), // null = not yet emitted
  emitFailures: v.optional(v.number()), // retry tracking
});
```

**Rationale**:

- Write-ahead pattern ensures no events lost
- Stubbed emitter can log to console in dev
- Easy to wire real Pulsar/Kafka client later
- Supports batch emission via cron job

> **⚠️ Footgun Reference**: [footguns.md #4](research/footguns.md) - **CRITICAL**: Never log PII (email, SSN), credentials, or financial details in audit events. Create sanitization helper that strips known sensitive fields.
>
> **⚠️ Footgun Reference**: [footguns.md #7](research/footguns.md) - Cron job error handling: wrap individual event emissions in try-catch, log failures, continue processing. Never let one failure block the entire batch.
>
> **⚠️ Footgun Reference**: [footguns.md #10](research/footguns.md) - Event retention: implement archival cron for 7-year compliance. Use `by_timestamp` index for cleanup queries.
>
> **💡 Research Pattern**: [research.md §1.3](research/research.md) - See cron job implementation pattern with per-item error handling and `emitFailures` counter.
>
> **💡 Research Pattern**: [research.md §3.1](research/research.md) - OWASP logging requirements: log entity IDs (not sensitive), sanitize before/after state, never log passwords/tokens.

### 4. Mutation Wrapper for Event Emission

**Decision**: Create `createAuditedMutation` wrapper that auto-captures state changes.

**Usage**:

```typescript
export const transferOwnership = createAuditedMutation({
  eventType: "ownership.transferred",
  entityType: "mortgage_ownership",
  // ...existing mutation config
  handler: async (ctx, args) => {
    // handler code - ctx has emitEvent() available
  },
});
```

**Rationale**:

- Consistent event format across all audited operations
- Opt-in per mutation (not all mutations need auditing)
- Captures before/after state automatically
- Works with existing `createAuthorizedMutation` pattern

> **💡 Research Pattern**: [research.md §1.2](research/research.md) - Use `internalMutation` for audit event creation - not client-callable, ensuring security.
>
> **⚠️ Footgun Reference**: [footguns.md #3](research/footguns.md) - **CRITICAL**: Mutations must be deterministic. External API calls (Formance ledger) CANNOT be in mutations. Schedule actions from mutations for external calls.
>
> **💡 Research Pattern**: [research.md §6.2](research/research.md) - See `emitAuditEvent()` implementation with sanitization helper.

### 5. Review Component Design

**Decision**: Create a single `OwnershipTransferReview` component that works in both contexts.

**Props Interface**:

```typescript
interface OwnershipTransferReviewProps {
  dealId: Id<"deals">;
  transferId: Id<"pending_ownership_transfers">;
  mode: "inline" | "sheet" | "modal";
  onApprove?: () => void;
  onReject?: () => void;
}
```

**Sections**:

1. **Mortgage Summary**: Address, loan amount, current status
2. **Current Ownership**: Cap table visualization (FairLend 100%)
3. **Proposed Transfer**: From, To, Percentage, Resulting cap table
4. **Deal Context**: Investor info, lawyer info, fund verification
5. **Action Buttons**: Approve Transfer, Reject (with reason input)

**Rationale**:

- Single source of truth for transfer review UI
- `mode` prop allows reuse in different layouts
- Callbacks enable integration with different navigation patterns

## Risks / Trade-offs

| Risk                            | Mitigation                                                                         | Research Reference                                                                                 |
| ------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| New state breaks existing deals | Migration: deals in `pending_verification` stay there; new flow only for new deals | [blastradius.md §9](research/blastradius.md) - Risk: Low likelihood, High impact; use feature flag |
| Event table grows unbounded     | Add TTL/archival cron job; implement `emittedAt` tracking for cleanup              | [footguns.md #10](research/footguns.md) - 7-year retention, archive to cold storage                |
| Review step slows deal closing  | Make it a quick action; provide "bulk approve" for admin efficiency later          | [blastradius.md §4](research/blastradius.md) - Low frontend risk                                   |
| Fractional ownership complexity | Keep at 100% for now; data model supports fractional when needed                   | [footguns.md #1](research/footguns.md) - Always use `createOwnershipInternal()`                    |
| State machine transition errors | Comprehensive tests, XState guards                                                 | [footguns.md #6](research/footguns.md) - Persist state after every transition                      |
| Formance API failures           | Idempotent operations, retry logic                                                 | [footguns.md #5](research/footguns.md) - Always include `reference` field                          |

> **📊 Full Risk Assessment**: See [blastradius.md §9](research/blastradius.md) for complete risk matrix with likelihood/impact analysis.

## Migration Plan

1. **Phase 1 - Schema**: Add new tables (`pending_ownership_transfers`, `audit_events`)
2. **Phase 2 - State Machine**: Add `pending_ownership_review` state with feature flag
3. **Phase 3 - Backend**: Implement transfer staging, review mutations, event emission
4. **Phase 4 - Frontend**: Add review component, integrate into deal portal and admin
5. **Phase 5 - Rollout**: Enable feature flag, monitor, clean up flag

### Ownership Ledger Migration (Formance as Source of Truth)

**Objective**: Migrate all ownership creation, assignment, and reassignment flows to Formance so ledger balances are the single source of truth for mortgage ownership.

1. **Phase A - Dual Run**
   - Keep existing `mortgage_ownership` reads/writes temporarily.
   - Emit ledger transactions for every ownership transfer via scheduled actions.
   - Add reconciliation reports to compare ledger vs DB snapshots.
2. **Phase B - Read Cutover**
   - Update ownership read paths (`getMortgageOwnership`, `getUserPortfolio`, `checkOwnership`, `getTotalOwnership`, `getInstitutionalPortfolio`) to read from Formance balances.
   - Normalize rounding and validate the 100% invariant from ledger-derived totals.
3. **Phase C - Write Cutover**
   - Replace direct DB writes in `createOwnershipInternal`, `createOwnership`, `transferOwnership`, `updateOwnershipPercentage`, `deleteOwnership`, and mortgage creation with ledger actions.
   - Remove or guard UI/manual flows that mutate `mortgage_ownership` directly (e.g., "Transfer Ownership" button).
4. **Phase D - Legacy Decommission**
   - Freeze `mortgage_ownership` table (read-only snapshot) and remove inserts/patches.
   - Update seed/migration scripts to use ledger-only flows or dev mocks.
   - Retire legacy migrations after validation window.

**Rollback**: Feature flag can disable new state; existing deals unaffected

## Resolved Questions

1. **Q**: Should rejected transfers auto-cancel the deal or allow retry?
   **A**: Allow retry - rejection returns to `pending_verification`. If retry also fails, provide alert and admin interface for manual resolution.

2. **Q**: How long should audit events be retained?
   **A**: 7 years (financial compliance); implement archival to cold storage.

3. **Q**: Should investors see the pending review state?
   **A**: Yes - investors should see accurate, up-to-date state. Display as "Finalizing Transfer" during ownership review.

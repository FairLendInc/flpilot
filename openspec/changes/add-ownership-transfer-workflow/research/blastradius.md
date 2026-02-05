# Blast Radius Analysis: Ownership Transfer Workflow

**Change ID:** `add-ownership-transfer-workflow`
**Analysis Date:** 2026-01-23

---

## Summary

This change has **MODERATE** blast radius with well-defined boundaries. The primary impact areas are:

| Area | Risk | Files Affected |
|------|------|----------------|
| Database Schema | Medium | 1 file, 2 new tables |
| State Machine | Medium | 2 files, new state + events |
| Backend Mutations | High | 3 files, new + modified functions |
| Frontend Components | Low | New components, minimal existing changes |
| Cron Jobs | Low | 1 new cron job |
| Tests | Medium | 4+ new test files |

---

## 1. Database Schema Impact

### New Tables Required

```
convex/schema.ts
├── pending_ownership_transfers (NEW)
│   ├── dealId: Id<"deals">
│   ├── mortgageId: Id<"mortgages">
│   ├── fromOwnerId: union("fairlend", Id<"users">)
│   ├── toOwnerId: Id<"users">
│   ├── percentage: number
│   ├── status: "pending" | "approved" | "rejected"
│   ├── createdAt, reviewedAt, reviewedBy, reviewNotes
│   └── INDEXES: by_deal, by_status, by_mortgage
│
└── audit_events (NEW)
    ├── eventType, entityType, entityId, userId
    ├── timestamp, beforeState, afterState, metadata
    ├── emittedAt, emitFailures
    └── INDEXES: by_entity, by_type, by_emitted, by_user, by_timestamp
```

### Modified Tables

```
convex/schema.ts
└── deals (MODIFIED)
    └── currentState union: ADD "pending_ownership_review"

convex/schema.ts
└── alerts (MODIFIED)
    └── type union: ADD "ownership_review_required", "manual_resolution_required"
```

### Migration Considerations

- **No data migration required**: New tables start empty
- **Schema extension only**: Adding to union types is non-breaking
- **Index creation**: Automatic on deploy

---

## 2. State Machine Impact

### Files Affected

```
convex/dealStateMachine.ts
├── DealStateValue type: ADD "pending_ownership_review"
├── Machine states: ADD pending_ownership_review state definition
├── Events: ADD VERIFY_COMPLETE, CONFIRM_TRANSFER, REJECT_TRANSFER
├── Transitions: MODIFY pending_verification.on
└── Helper functions: UPDATE getNextState(), getPreviousState()

convex/deals.ts
├── transitionDealState: MODIFY to handle new events
├── approveOwnershipTransfer: NEW mutation
├── rejectOwnershipTransfer: NEW mutation
├── escalateToManualResolution: NEW mutation
└── completeDeal: MODIFY to work with new flow
```

### State Transition Changes

```
BEFORE:
  pending_verification --[COMPLETE_DEAL]--> completed

AFTER:
  pending_verification --[VERIFY_COMPLETE]--> pending_ownership_review
  pending_ownership_review --[CONFIRM_TRANSFER]--> completed
  pending_ownership_review --[REJECT_TRANSFER]--> pending_verification
```

### Backward Compatibility

- Existing deals in `completed` state: **UNAFFECTED**
- Deals in `pending_verification`: Continue using old flow OR transition to new
- Recommendation: Feature flag for gradual rollout

---

## 3. Backend Mutation Impact

### New Files

```
convex/pendingOwnershipTransfers.ts (NEW)
├── createPendingTransfer: internalMutation
├── approvePendingTransfer: adminMutation
├── rejectPendingTransfer: adminMutation
├── getPendingTransfer: authenticatedQuery
├── getPendingTransferByDeal: authenticatedQuery
├── getPendingTransfersForReview: adminQuery
└── getOwnershipPreview: authenticatedQuery

convex/auditEvents.ts (NEW)
├── createAuditEventInternal: internalMutation
├── markEventEmitted: internalMutation
├── getUnemittedEvents: internalQuery
├── getEventsForEntity: authenticatedQuery
├── getEventsByType: adminQuery
└── getRecentEvents: adminQuery

convex/lib/events/emitter.ts (NEW)
├── EventEmitter interface
├── StubEventEmitter class (console logging)
└── emitEvent helper function
```

### Modified Files

```
convex/deals.ts (MODIFIED)
├── transitionDealState: Add VERIFY_COMPLETE handling
├── completeDeal: Modify to check for new flow
├── NEW: approveOwnershipTransfer
├── NEW: rejectOwnershipTransfer
└── NEW: escalateToManualResolution

convex/ownership.ts (NO CHANGES)
└── createOwnershipInternal: Used as-is by new flow

convex/crons.ts (MODIFIED)
└── ADD: emit-pending-audit-events cron job
```

### API Surface Changes

| Endpoint | Change | Breaking? |
|----------|--------|-----------|
| `api.deals.transitionDealState` | New event types accepted | No |
| `api.deals.completeDeal` | Behavior change (requires review step) | Yes* |
| `api.deals.approveOwnershipTransfer` | NEW | No |
| `api.deals.rejectOwnershipTransfer` | NEW | No |
| `api.pendingOwnershipTransfers.*` | NEW | No |
| `api.auditEvents.*` | NEW | No |

*Breaking for automation - human workflow unchanged

---

## 4. Frontend Component Impact

### New Components

```
components/admin/deals/
├── OwnershipTransferReview.tsx (NEW)
│   ├── Props: dealId, transferId, mode, onApprove, onReject
│   ├── Sections: MortgageSummary, CapTable, TransferPreview, Actions
│   └── Used in: Admin dashboard, Deal portal
│
├── OwnershipCapTable.tsx (NEW)
│   ├── Props: mortgageId, owners[]
│   └── Visualization: Pie chart or table of ownership
│
├── TransferPreview.tsx (NEW)
│   ├── Props: before, after, transfer
│   └── Shows: Arrow from→to with percentage
│
└── ManualResolutionPanel.tsx (NEW)
    ├── Props: dealId
    └── Actions: Force approve, Cancel deal, Contact investor
```

### Modified Pages

```
app/(auth)/dashboard/admin/deals/page.tsx
├── ADD: Ownership Review tab/section
└── ADD: Badge with pending review count

app/(auth)/dashboard/admin/deals/[id]/page.tsx
├── ADD: OwnershipTransferReview component for pending_ownership_review state
└── MODIFY: State transition buttons

app/(auth)/dashboard/admin/deals/components/DealKanbanBoard.tsx
├── ADD: "Ownership Review" column
└── ADD: Pending count badge

app/(auth)/dealportal/[dealId]/page.tsx
├── ADD: Admin check for review component
├── ADD: Investor "Finalizing Transfer" status
└── MODIFY: Progress indicator
```

### UI State Changes

| Current State | Display | Actions |
|---------------|---------|---------|
| pending_verification | "Verifying Funds" | Verify Funds button |
| pending_ownership_review (NEW) | "Ready for Transfer Review" (admin) / "Finalizing Transfer" (investor) | Approve/Reject (admin only) |
| completed | "Deal Complete" | Archive |

---

## 5. Integration Points

### Formance Ledger

```
convex/ledger.ts
└── ADD: executeOwnershipTransfer action
    ├── Calls: executeNumscript with ownership transfer script
    ├── Reference: Deal ID + Transfer ID for idempotency
    └── Accounts: fairlend:inventory → investor:{id}:inventory

lib/formance/numscripts.ts (or inline)
└── ADD: OWNERSHIP_TRANSFER_SCRIPT
```

### Alert System

```
convex/alerts.ts
└── New alert types needed:
    ├── "ownership_review_required"
    └── "manual_resolution_required"
```

### Logging

```
lib/logger.ts
└── No changes - use existing patterns
    ├── logger.info() for successful operations
    └── logger.error() for failures with context
```

---

## 6. Test Impact

### New Test Files Required

```
convex/tests/pendingOwnershipTransfers.test.ts (NEW)
├── Create pending transfer
├── Approve transfer
├── Reject transfer
├── Validation failures
└── Edge cases (duplicate, insufficient ownership)

convex/tests/auditEvents.test.ts (NEW)
├── Event creation
├── Event queries by entity, type, user
├── Emission marking
└── Cron processing

convex/tests/dealOwnershipReviewFlow.test.ts (NEW)
├── Full flow: verification → review → completion
├── Rejection and retry
├── Manual escalation
└── Formance ledger integration (mocked)

stories/admin/deals/OwnershipTransferReview.stories.tsx (NEW)
├── Pending state
├── Approval confirmation
├── Rejection with reason
└── Manual resolution panel
```

### Modified Test Files

```
convex/tests/dealStateTransitions.test.ts
├── ADD: VERIFY_COMPLETE transition tests
├── ADD: CONFIRM_TRANSFER transition tests
├── ADD: REJECT_TRANSFER transition tests
└── MODIFY: Existing completion tests

convex/tests/dealCompletionOwnership.test.ts
└── MODIFY: Test new flow vs old flow
```

---

## 7. Configuration Impact

### Environment Variables

No new environment variables required. Uses existing:
- `FORMANCE_CLIENT_ID`, `FORMANCE_CLIENT_SECRET`, `FORMANCE_SERVER_URL`

### Feature Flags

Recommend adding:
```typescript
// convex/featureFlags.ts or existing mechanism
{
  key: "ownership_review_required",
  description: "Require admin review before ownership transfer",
  defaultValue: true,  // Enable for new deals
}
```

---

## 8. Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐   │
│  │ Admin Deals   │  │ Deal Portal   │  │ OwnershipReview   │   │
│  │ Page          │──│ Page          │──│ Component         │   │
│  └───────────────┘  └───────────────┘  └───────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Convex API                                │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐   │
│  │ deals.ts      │  │ pendingOwner- │  │ auditEvents.ts    │   │
│  │ (mutations)   │──│ shipTransfers │──│ (new)             │   │
│  └───────────────┘  │ (new)         │  └───────────────────┘   │
│         │           └───────────────┘           │               │
│         ▼                   │                   ▼               │
│  ┌───────────────┐          │           ┌───────────────────┐   │
│  │ ownership.ts  │◄─────────┘           │ crons.ts          │   │
│  │ (unchanged)   │                      │ (new cron)        │   │
│  └───────────────┘                      └───────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Systems                            │
│  ┌───────────────┐  ┌───────────────────────────────────────┐   │
│  │ Formance      │  │ Future: Apache Pulsar / Event Bus     │   │
│  │ Ledger        │  │ (stubbed for now)                     │   │
│  └───────────────┘  └───────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing deal flow | Low | High | Feature flag for gradual rollout |
| State machine transition errors | Medium | High | Comprehensive tests, XState guards |
| Formance API failures | Medium | Medium | Idempotent operations, retry logic |
| Audit event table growth | Low | Low | Retention cron, archival strategy |
| Frontend component bugs | Medium | Low | Storybook stories, E2E tests |

---

## 10. Rollback Plan

1. **Feature Flag Off**: Disable `ownership_review_required` flag
2. **Revert Schema**: Union types are additive, no revert needed
3. **Revert Code**: Standard git revert of PRs
4. **Data Cleanup**: Pending transfers can be marked rejected
5. **Audit Events**: Keep for compliance (do not delete)

---

## Summary Checklist

- [ ] Schema: Add 2 new tables, modify 2 union types
- [ ] State Machine: Add 1 state, 3 events
- [ ] Backend: 3 new files, modify 3 existing
- [ ] Frontend: 4 new components, modify 4 pages
- [ ] Cron: 1 new job
- [ ] Tests: 4 new test files, modify 2
- [ ] Integration: Formance ledger entries
- [ ] Config: 1 feature flag (optional)

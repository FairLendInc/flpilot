# Footguns & Gotchas: Ownership Transfer Workflow

**Change ID:** `add-ownership-transfer-workflow`
**Analysis Date:** 2026-01-23

---

## Critical Footguns (Must Avoid)

### 1. ❌ Breaking the 100% Ownership Invariant

**Problem**: The ownership system MUST maintain exactly 100% total ownership per mortgage. Any operation that creates orphaned percentages will cause data corruption.

**Existing Pattern** (`ownership.ts:137-243`):
```typescript
// createOwnershipInternal automatically:
// 1. Reduces FairLend ownership by the transfer amount
// 2. Deletes FairLend record if percentage becomes 0
// 3. Validates FairLend has sufficient ownership
```

**Footgun**:
```typescript
// ❌ WRONG: Manual ownership operations without using the helper
await ctx.db.insert("mortgage_ownership", {
  mortgageId,
  ownerId: investorId,
  ownershipPercentage: 100, // Creates 200% total!
});

// ✅ CORRECT: Always use createOwnershipInternal
await createOwnershipInternal(ctx, {
  mortgageId,
  ownerId: investorId,
  ownershipPercentage: 100,
});
```

**Mitigation**: NEVER directly insert/update `mortgage_ownership`. Always use `createOwnershipInternal()` or the authorized mutations.

---

### 2. ❌ Mutations in Loops Within Actions

**Problem**: Convex actions that call `ctx.runMutation()` in a loop lose atomicity guarantees. Each mutation runs independently and can fail individually.

**From [Convex Best Practices](https://docs.convex.dev/understanding/best-practices)**:
```typescript
// ❌ WRONG: Each mutation is separate transaction
for (const transfer of transfers) {
  await ctx.runMutation(internal.ownership.createTransfer, transfer);
}

// ✅ CORRECT: Single mutation handles all transfers
await ctx.runMutation(internal.ownership.createTransfers, { transfers });
```

**Mitigation**: Batch operations into single internal mutations.

---

### 3. ❌ Calling External APIs from Mutations

**Problem**: Mutations must be deterministic. External API calls (like Formance) in mutations will cause failures.

**From [Convex Mutations](https://docs.convex.dev/functions/mutation-functions)**:
```typescript
// ❌ WRONG: External API call in mutation
export const approveTransfer = mutation({
  handler: async (ctx, args) => {
    await formanceClient.executeNumscript(...); // FAILS!
  },
});

// ✅ CORRECT: Mutation writes to DB, then schedules action
export const approveTransfer = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.transferId, { status: "approved" });
    // Schedule action for external API call
    await ctx.scheduler.runAfter(0, internal.ledger.recordOwnershipTransfer, {
      transferId: args.transferId,
    });
  },
});
```

**Mitigation**: Use actions for external API calls, schedule them from mutations.

---

### 4. ❌ Logging Sensitive Data in Audit Events

**Problem**: Audit events may be exposed to external systems or logs. PII, credentials, and financial details must be sanitized.

**From [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)**:
```typescript
// ❌ WRONG: Logging sensitive data
await emitAuditEvent({
  eventType: "ownership.transferred",
  metadata: {
    investorEmail: "john@example.com",  // PII
    investorSSN: "123-45-6789",         // Sensitive
    accessToken: "abc123",              // Credential
  },
});

// ✅ CORRECT: Sanitized audit event
await emitAuditEvent({
  eventType: "ownership.transferred",
  entityId: mortgageId,
  userId: investorId, // Opaque ID, not email
  metadata: {
    transferPercentage: 100,
    dealId: dealId,
    // NO PII, credentials, or financial details
  },
});
```

**Mitigation**: Create sanitization helper that strips known sensitive fields.

---

### 5. ❌ Non-Idempotent Formance Transactions

**Problem**: Without idempotency keys, retrying a failed Formance transaction can cause double-entry corruption.

**From [Formance Documentation](https://docs.formance.com/modules/ledger/introduction)**:
```typescript
// ❌ WRONG: No idempotency key
await executeNumscript({
  script: ownershipTransferScript,
  variables: { ... },
  // Missing reference!
});

// ✅ CORRECT: Always include reference for idempotency
await executeNumscript({
  script: ownershipTransferScript,
  variables: { ... },
  reference: `ownership-transfer:${dealId}:${transferId}`,
});
```

**Mitigation**: Always include deterministic `reference` field derived from immutable IDs.

---

## Medium Priority Gotchas

### 6. ⚠️ State Machine State Not Persisted

**Problem**: XState machines run in memory. State must be explicitly serialized and stored in the database.

**Current Pattern** (`deals.ts`):
```typescript
// State machine runs transiently
const actor = createActor(dealMachine, { input: context });
actor.start();
actor.send(event);

// MUST serialize and store
await ctx.db.patch(dealId, {
  stateMachineState: JSON.stringify(actor.getSnapshot()),
  currentState: actor.getSnapshot().value as DealStateValue,
});
actor.stop();
```

**Footgun**: Forgetting to persist state after transitions.

**Mitigation**: Ensure every transition mutation ends with state persistence.

---

### 7. ⚠️ Cron Job Error Handling

**Problem**: Cron jobs that throw errors are silently retried. Unhandled exceptions can cause infinite retry loops.

**From [Convex Cron Jobs](https://docs.convex.dev/scheduling/cron-jobs)**:
```typescript
// ❌ WRONG: Throwing in cron
export const emitEvents = internalMutation({
  handler: async (ctx) => {
    for (const event of events) {
      await emitToExternal(event); // If this throws, entire cron fails and retries
    }
  },
});

// ✅ CORRECT: Handle errors per-item
export const emitEvents = internalMutation({
  handler: async (ctx) => {
    for (const event of events) {
      try {
        await emitToExternal(event);
        await ctx.db.patch(event._id, { emittedAt: Date.now() });
      } catch (error) {
        logger.error("Event emission failed", { eventId: event._id, error });
        await ctx.db.patch(event._id, {
          emitFailures: (event.emitFailures ?? 0) + 1,
        });
        // Continue processing other events
      }
    }
  },
});
```

**Mitigation**: Wrap individual operations in try-catch, log failures, continue.

---

### 8. ⚠️ Missing Index on Query Fields

**Problem**: Queries without indexes do full table scans. On tables with thousands of records, this hits Convex limits.

**From [Convex Indexes](https://docs.convex.dev/database/reading-data/indexes/indexes-and-query-perf)**:
```typescript
// ❌ WRONG: Querying without index (full scan)
const pendingTransfers = await ctx.db
  .query("pending_ownership_transfers")
  .filter((q) => q.eq(q.field("status"), "pending"))
  .collect();

// ✅ CORRECT: Use indexed query
const pendingTransfers = await ctx.db
  .query("pending_ownership_transfers")
  .withIndex("by_status", (q) => q.eq("status", "pending"))
  .collect();
```

**Mitigation**: Create indexes for ALL query patterns before deployment.

---

### 9. ⚠️ Forgetting Alert Creation

**Problem**: State transitions without alerts leave users unaware of required actions.

**Current Pattern**: Every state change creates alerts for relevant parties.

```typescript
// ❌ WRONG: No alert
await ctx.db.patch(dealId, { currentState: "pending_ownership_review" });

// ✅ CORRECT: Create alert for admin
await ctx.db.patch(dealId, { currentState: "pending_ownership_review" });
await ctx.db.insert("alerts", {
  userId: /* find admins */,
  type: "ownership_review_required",
  severity: "info",
  title: "Ownership Transfer Ready for Review",
  message: `Deal requires ownership transfer review`,
  relatedDealId: dealId,
  read: false,
  createdAt: Date.now(),
});
```

**Mitigation**: Create checklist of alert types per state transition.

---

### 10. ⚠️ Audit Event Retention Explosion

**Problem**: Without cleanup, audit events table grows unbounded. Financial compliance requires 7 years retention, but not infinite.

```typescript
// ❌ WRONG: No retention strategy
// Events accumulate forever

// ✅ CORRECT: Add archival cron
crons.weekly(
  "archive-old-audit-events",
  { dayOfWeek: "sunday", hourUTC: 3, minuteUTC: 0 },
  internal.auditEvents.archiveOldEvents,
);

export const archiveOldEvents = internalMutation({
  handler: async (ctx) => {
    const sevenYearsAgo = Date.now() - (7 * 365 * 24 * 60 * 60 * 1000);
    const oldEvents = await ctx.db
      .query("audit_events")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", sevenYearsAgo))
      .take(1000);

    for (const event of oldEvents) {
      // Archive to cold storage, then delete
      await archiveToS3(event);
      await ctx.db.delete(event._id);
    }
  },
});
```

**Mitigation**: Implement archival cron from day one.

---

## Low Priority / Nice-to-Know

### 11. 💡 Union Type Extension in Schema

**Not a footgun**: Adding values to union types is non-breaking. Existing data remains valid.

```typescript
// Adding "pending_ownership_review" to DealStateValue is safe
// Existing deals with old states are unaffected
```

---

### 12. 💡 Internal Function Security

Internal functions (`internalMutation`, `internalQuery`) cannot be called from clients. They're safe for sensitive operations.

```typescript
// ✅ Safe: Can't be called from client
export const createAuditEventInternal = internalMutation({
  // No auth check needed - only callable from server
});
```

---

### 13. 💡 Formance Accounts Auto-Create

Formance Ledger creates accounts on first use. No need to pre-create investor accounts.

```typescript
// Account investor:abc123:inventory is created automatically
// when first transaction touches it
```

---

### 14. 💡 Scheduled Functions for Delayed Operations

Use `ctx.scheduler.runAfter()` for operations that should happen after a mutation completes.

```typescript
// Schedule ledger update to run 0ms after mutation commits
await ctx.scheduler.runAfter(0, internal.ledger.recordTransfer, { ... });

// Schedule follow-up notification after 1 hour
await ctx.scheduler.runAfter(3600000, internal.notifications.sendReminder, { ... });
```

---

## Checklist Before Implementation

- [ ] All ownership operations use `createOwnershipInternal()`
- [ ] No external API calls in mutations (use actions)
- [ ] All audit events sanitized (no PII/credentials)
- [ ] Formance transactions have idempotency keys (`reference`)
- [ ] State machine state persisted after every transition
- [ ] Cron jobs have try-catch error handling per item
- [ ] All query patterns have corresponding indexes
- [ ] Alerts created for all user-facing state changes
- [ ] Audit event retention/archival strategy defined
- [ ] Batch operations use single mutations (not loops)

---

## Testing Checklist

- [ ] Test 100% ownership invariant is maintained after all operations
- [ ] Test double-submission of approval (idempotency)
- [ ] Test rejection and retry flow
- [ ] Test manual escalation after second rejection
- [ ] Test audit events contain no sensitive data
- [ ] Test cron job continues after individual failures
- [ ] Test state machine persistence across restarts
- [ ] Test Formance transaction failure and retry

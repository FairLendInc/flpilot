# Research: Ownership Transfer Workflow Implementation Guide

**Change ID:** `add-ownership-transfer-workflow`
**Fetched:** 2026-01-23
**Sources:** Convex Documentation, Formance Ledger, OWASP Guidelines, Modern Treasury Best Practices

---

## 1. Convex Patterns for State Management & Audit Trails

### 1.1 Transaction Atomicity

Convex mutations run transactionally with strong guarantees ([source](https://docs.convex.dev/functions/mutation-functions)):

- All database reads get a consistent view
- All writes commit together (or none do)
- Mutations must be deterministic (no third-party API calls)

**Pattern for Ownership Transfer:**
```typescript
// ✅ Correct: Single mutation for atomic operations
export const approveOwnershipTransfer = internalMutation({
  args: { transferId: v.id("pending_ownership_transfers") },
  handler: async (ctx, args) => {
    const transfer = await ctx.db.get(args.transferId);
    if (!transfer) throw new Error("Transfer not found");

    // Atomic: both operations succeed or fail together
    await ctx.db.patch(args.transferId, { status: "approved", reviewedAt: Date.now() });
    await createOwnershipInternal(ctx, {
      mortgageId: transfer.mortgageId,
      ownerId: transfer.toOwnerId,
      ownershipPercentage: transfer.percentage,
    });
  },
});
```

### 1.2 Internal Functions for Security

Use `internalMutation` for operations that should not be client-callable ([source](https://docs.convex.dev/understanding/best-practices)):

```typescript
// ✅ Internal function for audit event creation
export const createAuditEventInternal = internalMutation({
  args: {
    eventType: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    userId: v.id("users"),
    beforeState: v.optional(v.any()),
    afterState: v.optional(v.any()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("audit_events", {
      ...args,
      timestamp: Date.now(),
      emittedAt: null,
      emitFailures: 0,
    });
  },
});
```

### 1.3 Cron Jobs for Event Emission

Event emission cron should handle failures gracefully ([source](https://docs.convex.dev/scheduling/cron-jobs)):

```typescript
// convex/crons.ts
crons.interval(
  "emit-pending-audit-events",
  { minutes: 1 },
  internal.auditEvents.emitPendingEvents,
);

// ❌ Don't throw - cron will retry silently
// ✅ Log errors and continue
export const emitPendingEvents = internalMutation({
  handler: async (ctx) => {
    const events = await ctx.db
      .query("audit_events")
      .withIndex("by_emitted", (q) => q.eq("emittedAt", null))
      .take(100);

    for (const event of events) {
      try {
        await emitToExternalSystem(event);
        await ctx.db.patch(event._id, { emittedAt: Date.now() });
      } catch (error) {
        logger.error("Event emission failed", { eventId: event._id, error });
        await ctx.db.patch(event._id, {
          emitFailures: (event.emitFailures ?? 0) + 1
        });
      }
    }
  },
});
```

### 1.4 Index Design for Audit Events

Efficient querying requires proper indexes ([source](https://docs.convex.dev/database/reading-data/indexes/indexes-and-query-perf)):

```typescript
audit_events: defineTable({
  eventType: v.string(),
  entityType: v.string(),
  entityId: v.string(),
  userId: v.id("users"),
  timestamp: v.number(),
  beforeState: v.optional(v.any()),
  afterState: v.optional(v.any()),
  metadata: v.optional(v.any()),
  emittedAt: v.optional(v.number()),
  emitFailures: v.optional(v.number()),
})
  .index("by_entity", ["entityType", "entityId"])
  .index("by_type", ["eventType"])
  .index("by_emitted", ["emittedAt"])  // For cron job queries
  .index("by_user", ["userId"])
  .index("by_timestamp", ["timestamp"]) // For retention cleanup
```

---

## 2. Formance Ledger Integration Patterns

### 2.1 Account Naming Conventions

Based on existing `lib/formance/client.ts` patterns:

```typescript
// Existing patterns (maintain consistency)
ACCOUNTS = {
  mortgageIssuance: (mortgageId) => `mortgage:${mortgageId}:issuance`,
  investorInventory: (userId) => `investor:${userId}:inventory`,
  platformInventory: "fairlend:inventory",
}

// New accounts for ownership tracking
ACCOUNTS_OWNERSHIP = {
  // Track ownership shares per mortgage per investor
  mortgageOwnership: (mortgageId, ownerId) =>
    `mortgage:${mortgageId}:ownership:${ownerId}`,

  // Platform holding account for pre-transfer staging
  ownershipEscrow: (mortgageId) =>
    `mortgage:${mortgageId}:ownership:escrow`,
}
```

### 2.2 Numscript for Ownership Transfer

Based on [Formance Numscript documentation](https://docs.formance.com/modules/ledger/introduction):

```numscript
// Transfer ownership shares from FairLend to investor
vars {
  account $source      // fairlend:inventory
  account $destination // investor:{userId}:inventory
  monetary $amount     // M{mortgageId}/SHARE {percentage}
}

send $amount (
  source = $source
  destination = $destination
)
```

### 2.3 Transaction Idempotency

Formance supports idempotency via `reference` field. Use deal ID + transfer ID:

```typescript
const reference = `ownership-transfer:${dealId}:${transferId}`;

await executeNumscript({
  ledgerName: "flpilot",
  script: ownershipTransferScript,
  variables: {
    source: ACCOUNTS.platformInventory,
    destination: ACCOUNTS.investorInventory(investorId),
    amount: `M${mortgageId}/SHARE ${percentage}`,
  },
  reference, // Prevents duplicate execution
  metadata: {
    dealId,
    transferId,
    approvedBy: adminId,
    timestamp: Date.now().toString(),
  },
});
```

---

## 3. Security & Audit Trail Best Practices

### 3.1 OWASP Logging Requirements

From [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html):

**Events to Log:**
- Authentication successes/failures
- Authorization failures
- Data addition, modification, deletion
- High-value transactions
- Use of higher-risk functionality

**What NOT to Log:**
- Passwords, access tokens, encryption keys
- Session IDs (use hashed replacements)
- Database connection strings
- PII unless legally required

**Audit Event Schema (compliant):**
```typescript
interface AuditEvent {
  eventType: string;           // "ownership.transferred"
  entityType: string;          // "mortgage_ownership"
  entityId: string;            // Mortgage ID (not sensitive)
  userId: string;              // Actor ID (hashed in external logs)
  timestamp: number;           // Both creation and event time
  beforeState: object | null;  // Sanitized - no PII
  afterState: object | null;   // Sanitized - no PII
  metadata: {
    dealId?: string;
    transferPercentage?: number;
    // NO: investor email, SSN, financial details
  };
}
```

### 3.2 Financial Audit Trail Immutability

From [Modern Treasury Best Practices](https://www.moderntreasury.com/journal/enforcing-immutability-in-your-double-entry-ledger):

**Key Principles:**
1. **Immutability**: Once posted, ledger entries cannot be edited—only reversed
2. **Double-Entry**: Every transaction has corresponding debit and credit
3. **Auditability**: Any historical state can be reconstructed

**Correction Pattern:**
```typescript
// ❌ Never modify existing records
await ctx.db.patch(ownershipId, { percentage: newPercentage });

// ✅ Create reversal + new entry
await ctx.db.insert("ownership_adjustments", {
  originalId: ownershipId,
  type: "reversal",
  amount: -originalPercentage,
  reason: "Correction",
  timestamp: Date.now(),
});
await ctx.db.insert("ownership_adjustments", {
  originalId: ownershipId,
  type: "correction",
  amount: correctedPercentage,
  reason: "Correction",
  timestamp: Date.now(),
});
```

### 3.3 Maker-Checker Pattern

The ownership transfer review implements maker-checker:

```
MAKER: System creates pending_ownership_transfer on deal completion
CHECKER: Admin reviews and approves/rejects

Workflow:
1. Maker's input saved in PENDING state
2. Checker reviews details
3. Checker authorizes OR rejects
4. Only upon authorization does it post to ledger
```

---

## 4. Existing Codebase Integration Patterns

### 4.1 State Machine Extension

Current `dealStateMachine.ts` pattern:

```typescript
// Add new state to type
export type DealStateValue =
  | "locked"
  | "pending_lawyer"
  | "pending_docs"
  | "pending_transfer"
  | "pending_verification"
  | "pending_ownership_review"  // NEW
  | "completed"
  | "cancelled"
  | "archived";

// Add to machine definition
pending_verification: {
  on: {
    VERIFY_COMPLETE: {  // NEW event
      target: "pending_ownership_review",
      guard: "canTransitionForward",
      actions: "logTransition",
    },
    // ... existing transitions
  },
},

pending_ownership_review: {  // NEW state
  on: {
    CONFIRM_TRANSFER: {
      target: "completed",
      guard: "canTransitionForward",
      actions: "logTransition",
    },
    REJECT_TRANSFER: {
      target: "pending_verification",
      guard: "canTransitionBackward",
      actions: "logTransition",
    },
    CANCEL: {
      target: "cancelled",
      guard: "canCancel",
      actions: "logTransition",
    },
  },
},
```

### 4.2 Alert Creation Pattern

Follow existing pattern in `deals.ts`:

```typescript
// Create alerts for both admin and investor
await ctx.db.insert("alerts", {
  userId: adminUserId,
  type: "ownership_review_required",  // New type needed in schema
  severity: "info",
  title: "Ownership Transfer Ready for Review",
  message: `Deal ${dealId} is ready for ownership transfer review`,
  relatedDealId: dealId,
  relatedListingId: deal.listingId,
  read: false,
  createdAt: Date.now(),
});
```

### 4.3 Authorization Pattern

Follow `createAuthorizedMutation` pattern:

```typescript
import { adminMutation } from "./lib/authorizedFunctions";

export const approveOwnershipTransfer = adminMutation({
  args: {
    transferId: v.id("pending_ownership_transfers"),
    notes: v.optional(v.string()),
  },
  returns: v.id("deals"),
  handler: async (ctx, args) => {
    // ctx automatically has: role, subject, email, org_id, permissions
    const adminUserId = ctx.subject as Id<"users">;
    // ... implementation
  },
});
```

---

## 5. Recommended Implementation Sequence

1. **Schema First**: Add tables with proper indexes
2. **State Machine**: Add new state and transitions
3. **Internal Mutations**: Implement transfer staging and approval
4. **Event Infrastructure**: Add audit event table and cron
5. **Formance Integration**: Add ledger entries on approval
6. **Frontend**: Add review component
7. **Testing**: Cover all paths including error cases

---

## 6. Code Examples for Key Operations

### 6.1 Create Pending Transfer

```typescript
export const createPendingTransferInternal = internalMutation({
  args: {
    dealId: v.id("deals"),
    mortgageId: v.id("mortgages"),
    fromOwnerId: v.union(v.literal("fairlend"), v.id("users")),
    toOwnerId: v.id("users"),
    percentage: v.number(),
  },
  handler: async (ctx, args) => {
    // Validate mortgage exists
    const mortgage = await ctx.db.get(args.mortgageId);
    if (!mortgage) throw new Error("Mortgage not found");

    // Validate source has sufficient ownership
    const sourceOwnership = await ctx.db
      .query("mortgage_ownership")
      .withIndex("by_mortgage_owner", (q) =>
        q.eq("mortgageId", args.mortgageId).eq("ownerId", args.fromOwnerId)
      )
      .first();

    if (!sourceOwnership || sourceOwnership.ownershipPercentage < args.percentage) {
      throw new Error("Insufficient source ownership");
    }

    return await ctx.db.insert("pending_ownership_transfers", {
      dealId: args.dealId,
      mortgageId: args.mortgageId,
      fromOwnerId: args.fromOwnerId,
      toOwnerId: args.toOwnerId,
      percentage: args.percentage,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});
```

### 6.2 Emit Audit Event

```typescript
async function emitAuditEvent(
  ctx: MutationCtx,
  event: {
    eventType: string;
    entityType: string;
    entityId: string;
    userId: Id<"users">;
    beforeState?: unknown;
    afterState?: unknown;
    metadata?: Record<string, unknown>;
  }
) {
  // Sanitize state - remove sensitive fields
  const sanitize = (state: unknown) => {
    if (!state || typeof state !== 'object') return state;
    const { email, phone, ssn, ...safe } = state as Record<string, unknown>;
    return safe;
  };

  await ctx.db.insert("audit_events", {
    eventType: event.eventType,
    entityType: event.entityType,
    entityId: event.entityId,
    userId: event.userId,
    timestamp: Date.now(),
    beforeState: sanitize(event.beforeState),
    afterState: sanitize(event.afterState),
    metadata: event.metadata,
    emittedAt: null,
    emitFailures: 0,
  });
}
```

---

## References

- [Convex Mutations & Transactions](https://docs.convex.dev/functions/mutation-functions)
- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices)
- [Convex Cron Jobs](https://docs.convex.dev/scheduling/cron-jobs)
- [Formance Ledger Introduction](https://docs.formance.com/modules/ledger/introduction)
- [Formance Numscript](https://github.com/formancehq/numscript)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [Modern Treasury: Enforcing Immutability](https://www.moderntreasury.com/journal/enforcing-immutability-in-your-double-entry-ledger)
- [Modern Treasury: Ledger Best Practices](https://www.moderntreasury.com/journal/best-practices-for-maintaining-a-ledger)

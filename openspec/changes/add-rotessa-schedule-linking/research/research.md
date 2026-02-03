# Research: Rotessa Schedule Linking & Historical Payment Backfill

**Research Date:** 2026-02-03
**Change ID:** `add-rotessa-schedule-linking`

## Sources

- Formance Ledger documentation via Context7 (`/formancehq/ledger`)
- Rotessa SDK types: `lib/rotessa/types.ts`
- Rotessa API manifest: `lib/rotessa/manifest.ts`
- Existing codebase: `convex/ledger.ts`, `convex/rotessaSync.ts`

---

## 1. Formance Bi-Temporal Transaction Timestamps

### Key Finding

Formance Ledger v2 supports a `timestamp` field in the transaction creation request body for backdating transactions.

### API Structure

```typescript
// POST /v2/{ledger}/transactions
{
  "timestamp": "2019-08-24T14:15:22Z",  // ISO 8601 - effective date
  "postings": [...],
  "script": { "plain": "...", "vars": {...} },
  "reference": "ref:001",  // Idempotency key
  "metadata": {...}
}
```

### Implementation Pattern

```typescript
// In recordPaymentCollection action
const body = {
  script: {
    plain: PAYMENT_COLLECTION_NUMSCRIPT,
    vars: {
      amount: `CAD/100 ${amountCents}`,
      borrower_account: borrowerAccount,
      mortgage_trust: mortgageTrust,
    },
  },
  reference,
  metadata: {...},
  // Only include timestamp for backdating
  ...(args.effectiveTimestamp && { timestamp: args.effectiveTimestamp }),
};
```

### Timestamp Format

- **Format:** ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`)
- **Timezone:** UTC recommended
- **Example:** `"2025-06-15T00:00:00Z"` for June 15, 2025

### Source Citation

> "Returns a new Transaction with the specified timestamp. This is the effective time of the transaction."
> — Formance Ledger Go SDK, `internal/README.md`

---

## 2. Formance Idempotency & Conflict Handling

### Key Finding

Formance uses `reference` field for idempotency. Duplicate references return HTTP 409 with `ErrTransactionReferenceConflict`.

### Error Types

| Error | HTTP Status | Meaning |
|-------|-------------|---------|
| `ErrIdempotencyKeyConflict` | 409 | Idempotency key (IK) already used |
| `ErrTransactionReferenceConflict` | 409 | Transaction reference already exists |

### Implementation Pattern (Already Exists)

```typescript
// convex/ledger.ts:1614-1624
if (apiResponse.status === 409) {
  logger.warn("recordPaymentCollection: Duplicate reference (idempotent)", {
    reference,
    paymentId,
  });
  return { success: true };  // Treat as success
}
```

### Reference Format Recommendation

For backfill, use distinct prefix to differentiate from regular sync:

```
backfill:{paymentId}:{mortgageId}  // Backfill payments
payment:{paymentId}:{mortgageId}   // Regular sync payments
```

---

## 3. Rotessa Transaction Report API

### Key Finding

The Rotessa transaction report includes `settlement_date` field which represents when funds cleared.

### Response Structure

```typescript
// lib/rotessa/types.ts:203-222
type RotessaTransactionReportItem = {
  id: number;
  customer_id: number;
  transaction_schedule_id: number;
  amount: string;
  status: RotessaTransactionStatus;      // "Approved" for cleared
  status_reason: RotessaStatusReason | null;
  process_date: string;                   // When debit initiated
  settlement_date: string | null;         // When funds cleared (USE THIS)
  // ... other fields
};
```

### Status Flow

```
Future → Pending (process_date) → Approved (settlement_date set)
                               → Declined (settlement_date null)
```

### API Call Pattern

```typescript
// Fetch all transactions for a schedule
const transactions = await client.transactionReport.list({
  start_date: "2024-01-01",  // Go back ~1 year
  end_date: "2026-02-03",
  status: "Approved",        // Only cleared payments
});

// Filter to specific schedule
const scheduleTransactions = transactions.filter(
  t => t.transaction_schedule_id === scheduleId
);
```

### Important Notes

1. `settlement_date` can be `null` for non-Approved transactions
2. For Approved transactions, `settlement_date` is always set
3. Date format is `YYYY-MM-DD` (needs conversion to ISO 8601 for Formance)

---

## 4. Timestamp Conversion

### Pattern

```typescript
// Convert Rotessa settlement_date to Formance timestamp
function toFormanceTimestamp(settlementDate: string): string {
  // settlementDate format: "2025-06-15"
  // Formance requires: "2025-06-15T00:00:00Z"
  return `${settlementDate}T00:00:00Z`;
}
```

### Usage in Backfill

```typescript
for (const transaction of approvedTransactions) {
  if (transaction.settlement_date) {
    await recordPaymentCollection({
      paymentId: payment._id,
      mortgageId: mortgage._id,
      rotessaCustomerId: borrower.rotessaCustomerId,
      amountCents,
      reference: `backfill:${payment._id}:${mortgage._id}`,
      effectiveTimestamp: toFormanceTimestamp(transaction.settlement_date),
    });
  }
}
```

---

## 5. Existing Codebase Patterns

### Linking Mortgages to Schedules

Currently, `mortgage.rotessaScheduleId` stores the Rotessa schedule ID:

```typescript
// convex/schema.ts (mortgages table)
rotessaScheduleId: v.optional(v.number()),
rotessaScheduleStatus: v.optional(v.union(...)),
rotessaScheduleLastSyncAt: v.optional(v.number()),
```

### Finding Unlinked Schedules

Need to:
1. Fetch all schedules from Rotessa (via customer list + schedules)
2. Query mortgages for all `rotessaScheduleId` values
3. Filter out schedules that appear in that set

### Finding Available Mortgages

```typescript
// Query pattern
const mortgagesWithoutSchedule = await ctx.db
  .query("mortgages")
  .filter(q => q.eq(q.field("rotessaScheduleId"), undefined))
  .collect();
```

---

## 6. Recommended Implementation Sequence

1. **Modify `recordPaymentCollection`** - Add optional `effectiveTimestamp` parameter
2. **Add `getUnlinkedSchedules` action** - Fetches schedules, filters linked
3. **Add `getMortgagesWithoutSchedule` query** - Returns linkable mortgages
4. **Add `linkScheduleToMortgage` mutation** - Links + optionally triggers backfill
5. **Add `backfillHistoricalPayments` action** - Processes historical transactions
6. **Build Admin UI** - Two-panel linking interface

---

## 7. Testing Considerations

### Unit Tests

- Mock Rotessa API responses with various transaction states
- Verify only Approved transactions with settlement_date are processed
- Verify timestamp format conversion

### Integration Tests

- Mock Formance API to verify timestamp is passed correctly
- Verify 409 handling for duplicate references
- Verify backfill_log metrics accuracy

### Manual QA

- Use Rotessa sandbox with historical test data
- Verify ledger transactions show correct effective dates
- Verify idempotency (run backfill twice, no duplicates)

# Design: Rotessa Schedule Linking & Historical Payment Backfill

## Context

Historical Rotessa payment schedules with ~1 year of data predate the current system. No automatic matching criteria exist - admin judgment is required. Once linked, historical payments must be recorded in Formance with proper bi-temporal timestamps.

## Goals / Non-Goals

**Goals:**
- Enable admins to manually link Rotessa schedules to mortgages
- Backfill historical Approved payments to Formance with correct settlement dates
- Maintain idempotency and error isolation during backfill

**Non-Goals:**
- Automatic schedule matching
- Backfilling Pending/Future payments
- Changes to ongoing sync behavior

## Decisions

### Decision 1: Single action with optional timestamp

Modify existing `recordPaymentCollection` to accept optional `effectiveTimestamp` rather than creating separate backfill action.

**Rationale:** Simpler, reuses existing logic, same code path for both ongoing sync and backfill.

### Decision 2: Settlement date as effective timestamp

For backfill, use the Rotessa `settlement_date` as Formance `timestamp`.

**Rationale:** Settlement date represents when funds cleared - the financially meaningful date for ledger accounting.

### Decision 3: Two-panel linking UI

Side-by-side panels showing unlinked schedules and available mortgages.

**Rationale:** Allows admin to compare and match visually. More intuitive than dropdown selections.

## Data Flow

```
1. Admin opens link-schedules page
2. UI fetches unlinked schedules (Rotessa API) and available mortgages (Convex)
3. Admin selects schedule + mortgage + backfill checkbox
4. linkScheduleToMortgage mutation:
   a. Validates schedule exists and isn't linked
   b. Validates mortgage doesn't have a schedule
   c. Sets mortgage.rotessaScheduleId
   d. If backfill checked, schedules backfillHistoricalPayments action
5. backfillHistoricalPayments action:
   a. Creates backfill_log entry (status: running)
   b. Fetches all transactions for schedule from Rotessa
   c. Filters to Approved only
   d. For each: creates payment record + records to Formance with settlementDate
   e. Updates backfill_log with metrics
```

## Account Paths (Chart of Accounts)

Payment collection uses:
```
@world → borrower:{rotessaCustomerId}:rotessa  (Payment ingress)
borrower:{rotessaCustomerId}:rotessa → mortgage:{mortgageId}:trust  (Clear to trust)
```

Same accounts for backfill, with `timestamp` set to settlement date.

## Error Handling

| Error | Handling |
|-------|----------|
| Schedule not in Rotessa | Fail link with error message |
| Mortgage already has schedule | Excluded from UI (query filter) |
| Schedule already linked | Excluded from UI (query filter) |
| Borrower mismatch | Warning, allow override |
| Single payment fails in backfill | Log error, continue with others |
| Duplicate ledger reference | Treat as success (idempotent) |

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Admin links wrong schedule | UI shows customer name/amount for verification |
| Backfill takes too long | Async action with progress tracking via backfill_log |
| Partial backfill failure | Per-item isolation, can retry via manual sync |

## Migration Plan

No migration needed - additive changes only.

## Open Questions

None - all resolved during brainstorming.

---

## API Integration Patterns

*Added from research findings (2026-02-03)*

### Timestamp Format Conversion

Rotessa returns `settlement_date` as `YYYY-MM-DD`. Formance requires ISO 8601.

```typescript
// CRITICAL: Convert before passing to Formance
function toFormanceTimestamp(settlementDate: string): string {
  return `${settlementDate}T00:00:00Z`;
}

// Usage
const effectiveTimestamp = toFormanceTimestamp(transaction.settlement_date);
```

**Source:** Formance Ledger API, Context7 `/formancehq/ledger`

### Reference Format

Use distinct prefixes to differentiate backfill from regular sync:

```typescript
// Backfill payments
const reference = `backfill:${paymentId}:${mortgageId}`;

// Regular sync payments (existing)
const reference = `payment:${paymentId}:${mortgageId}`;
```

### Rotessa Pagination

Transaction report may return multiple pages. Must iterate:

```typescript
const allTransactions: RotessaTransactionReportItem[] = [];
let page = 1;

while (true) {
  const batch = await client.transactionReport.list({
    start_date: startDate,
    end_date: endDate,
    page,
  });

  if (batch.length === 0) break;
  allTransactions.push(...batch);
  page++;
}
```

---

## Implementation Footguns

*Critical mistakes to avoid - see `research/footguns.md` for details*

1. **Timestamp format** - Must convert `YYYY-MM-DD` → `YYYY-MM-DDTHH:mm:ssZ`
2. **Null settlement_date** - Filter `status === "Approved" && settlement_date !== null`
3. **Pagination** - Iterate all pages, don't assume single page
4. **Mutation/Action boundary** - Use `ctx.scheduler.runAfter()`, not `ctx.runAction()`
5. **Log creation order** - Create `backfill_log` BEFORE processing starts
6. **409 handling** - Treat as success, not error

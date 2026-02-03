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

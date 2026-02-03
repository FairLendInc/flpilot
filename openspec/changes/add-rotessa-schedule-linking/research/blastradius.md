# Blast Radius: Rotessa Schedule Linking & Historical Payment Backfill

**Research Date:** 2026-02-03
**Change ID:** `add-rotessa-schedule-linking`

---

## 1. Files Modified

| File | Change | Risk |
|------|--------|------|
| `convex/ledger.ts` | Add `effectiveTimestamp` parameter to `recordPaymentCollection` | Low - additive, optional param |
| `convex/rotessaAdmin.ts` | Add linking functions | Low - new functions |
| `convex/rotessaSync.ts` | Add backfill action | Low - new function |
| `convex/schema.ts` | Add `backfill_log` table | Low - new table |
| `lib/navigation/role-navigation.ts` | Add nav item | Low - UI only |

## 2. Files Created

| File | Purpose |
|------|---------|
| `app/(auth)/dashboard/admin/rotessa/link-schedules/page.tsx` | Admin UI page |
| `components/admin/rotessa/UnlinkedSchedulesPanel.tsx` | Schedule selector |
| `components/admin/rotessa/AvailableMortgagesPanel.tsx` | Mortgage selector |

---

## 3. Integration Points

### Formance Ledger (`convex/ledger.ts`)

**Current:** `recordPaymentCollection` doesn't pass timestamp to Formance API

**After:** Optionally includes `timestamp` field when `effectiveTimestamp` provided

**Impact:**
- Existing sync flow unchanged (no `effectiveTimestamp` passed)
- Only backfill uses the new parameter
- No breaking changes to existing ledger entries

### Rotessa SDK (`lib/rotessa/`)

**Current:** Used by `rotessaAdmin.ts` and `rotessaSync.ts`

**After:** Same usage, no changes to SDK

**Impact:** None - we're using existing APIs

### Mortgages Table

**Current:** `rotessaScheduleId` field exists, set during schedule creation

**After:** Same field, now also set during manual linking

**Impact:**
- Queries filtering by `rotessaScheduleId` unaffected
- Index `by_rotessa_schedule` continues to work

### Payments Table

**Current:** Created by sync process

**After:** Also created by backfill process

**Impact:**
- Same schema, same fields
- Backfill payments indistinguishable from sync payments (by design)
- `ledgerTransactionId` set for all recorded payments

---

## 4. Data Model Impact

### New Table: `backfill_log`

```typescript
backfill_log: defineTable({
  mortgageId: v.id("mortgages"),
  scheduleId: v.number(),
  triggeredBy: v.id("users"),
  status: v.union(...),
  metrics: v.object({...}),
  errors: v.optional(v.array({...})),
  startedAt: v.number(),
  completedAt: v.optional(v.number()),
})
```

**Index Requirements:**
- `by_mortgage` - Query backfill history for a mortgage
- `by_status` - Find running/failed backfills

### Existing Tables Affected

| Table | Field | Change |
|-------|-------|--------|
| `mortgages` | `rotessaScheduleId` | No schema change, new values written |
| `payments` | All | No schema change, new records created |

---

## 5. API Surface Changes

### New Public Queries

| Query | Role | Returns |
|-------|------|---------|
| `getMortgagesWithoutSchedule` | admin | Mortgages without `rotessaScheduleId` |

### New Public Actions

| Action | Role | Purpose |
|--------|------|---------|
| `getUnlinkedSchedules` | admin | Fetch schedules from Rotessa, filter linked |
| `linkScheduleToMortgage` | admin | Link + optionally trigger backfill |

### Modified Internal Actions

| Action | Change |
|--------|--------|
| `recordPaymentCollection` | Add optional `effectiveTimestamp` param |

---

## 6. External System Dependencies

### Rotessa API

**Endpoints Used:**
- `GET /customers` - List all customers
- `GET /customers/{id}` - Get customer with schedules
- `GET /transaction_report` - Fetch transactions by date range

**Rate Limits:**
- Not documented, but existing sync respects reasonable delays
- Backfill is one-time operation per mortgage

### Formance Ledger API

**Endpoints Used:**
- `POST /v2/{ledger}/transactions` - Create transaction (existing)

**New Parameter:**
- `timestamp` field for backdating (supported by API)

---

## 7. Configuration Requirements

No new environment variables or configuration needed.

Existing config sufficient:
- `FORMANCE_CLIENT_ID`
- `FORMANCE_CLIENT_SECRET`
- `FORMANCE_SERVER_URL`
- `ROTESSA_API_KEY` (or equivalent)

---

## 8. Rollback Strategy

### If Linking Fails

- `linkScheduleToMortgage` is atomic - either sets `rotessaScheduleId` or doesn't
- Failed link doesn't create partial state

### If Backfill Fails Partially

- `backfill_log` records what succeeded
- Idempotency via reference prevents duplicates on retry
- Manual sync can handle remaining payments

### If Feature Needs to be Removed

1. Remove UI (no impact on data)
2. Leave backend functions (unused is harmless)
3. `backfill_log` table can remain (audit history)
4. Linked mortgages remain linked (valid state)

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Wrong schedule linked | Low | Medium | UI shows customer name/amount for verification |
| Duplicate ledger entries | Very Low | Low | Idempotency via reference field |
| Backfill takes too long | Low | Low | Async action with progress tracking |
| Formance timestamp rejected | Very Low | Medium | Use standard ISO 8601 format |
| Rotessa API rate limited | Low | Low | One-time operation, can retry |

---

## 10. Testing Strategy

### Unit Tests Needed

1. `linkScheduleToMortgage` validation logic
2. Timestamp format conversion
3. Schedule filtering (linked vs unlinked)

### Integration Tests Needed

1. Backfill with mocked Rotessa/Formance
2. Idempotency (duplicate reference handling)
3. Partial failure recovery

### Manual QA Needed

1. Link workflow with real Rotessa sandbox data
2. Verify Formance ledger shows correct dates
3. Verify UI updates correctly after linking

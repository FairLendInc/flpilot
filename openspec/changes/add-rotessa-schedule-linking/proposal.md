# Proposal: Rotessa Schedule Linking & Historical Payment Backfill

## Why

Historical Rotessa payment schedules (dozens) with ~1 year of payment data predate the current system. These schedules cannot be automatically matched to mortgages and require admin judgment to link correctly. Once linked, historical Approved payments need to be backfilled into Formance Ledger with correct bi-temporal timestamps.

## What Changes

- **Admin UI for manual schedule linking** - Two-panel interface to associate orphaned Rotessa schedules with mortgages
- **Historical payment backfill** - Sync past Approved payments to Formance with settlement date as effective timestamp
- **Ledger enhancement** - Modify `recordPaymentCollection` to accept optional effective timestamp for bi-temporal recording
- **Backfill tracking** - New `backfill_log` table to track backfill operations

## Impact

- Affected specs: `rotessa-sync`
- Affected code:
  - `convex/ledger.ts` - Add `effectiveTimestamp` parameter
  - `convex/rotessaAdmin.ts` - Add linking functions
  - `convex/rotessaSync.ts` - Add backfill action
  - `convex/schema.ts` - Add `backfill_log` table
  - New admin UI page at `/dashboard/admin/rotessa/link-schedules`

## Guardrails

- Mortgages with existing `rotessaScheduleId` excluded from UI
- Schedules already linked to a mortgage excluded from UI
- Backfill is idempotent via reference field
- Per-payment error isolation during backfill

## Dependencies

- `@lib/rotessa` SDK (existing)
- `convex/ledger.ts` Formance integration (existing)
- `convex/rotessaSync.ts` sync infrastructure (existing)

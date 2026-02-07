# Tasks: Rotessa Schedule Linking & Historical Payment Backfill

## 1. Backend Foundation

- [x] 1.1 Modify `recordPaymentCollection` in `convex/ledger.ts` to accept optional `effectiveTimestamp` parameter
- [x] 1.2 Add `getUnlinkedSchedules` action to `convex/rotessaAdmin.ts` - fetches schedules from Rotessa, filters out those already linked
- [x] 1.3 Add/verify `getMortgagesWithoutSchedule` query in `convex/mortgages.ts`
- [x] 1.4 Add `linkScheduleToMortgage` action to `convex/rotessaAdmin.ts` with validation

## 2. Backfill Infrastructure

- [x] 2.1 Add `backfill_log` table to `convex/schema.ts`
- [x] 2.2 Add `backfillHistoricalPayments` action to `convex/rotessaSync.ts`
- [x] 2.3 Integrate backfill trigger into `linkScheduleToMortgage` action
- [x] 2.4 Add `createBackfillLog` and `updateBackfillLog` internal mutations

## 3. Admin UI

- [x] 3.1 Create page at `app/(auth)/dashboard/admin/rotessa/link-schedules/page.tsx`
- [x] 3.2 Build UnlinkedSchedulesPanel - inline in page component
- [x] 3.3 Build AvailableMortgagesPanel - inline in page component
- [x] 3.4 Add link action with backfill checkbox and progress feedback
- [x] 3.5 Add navigation item to admin sidebar

## 4. Testing & Validation

- [ ] 4.1 Unit test for `linkScheduleToMortgage` validation logic
- [ ] 4.2 Unit test for `backfillHistoricalPayments` with mocked Rotessa/Formance
- [ ] 4.3 Manual QA with real Rotessa test data

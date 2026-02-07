# Footguns: Rotessa Schedule Linking & Historical Payment Backfill

**Research Date:** 2026-02-03
**Change ID:** `add-rotessa-schedule-linking`

---

## 1. Timestamp Format Mismatch

### The Problem

Rotessa returns `settlement_date` as `YYYY-MM-DD` but Formance requires ISO 8601 with time component.

### Wrong

```typescript
// Will fail or use wrong time
await recordPaymentCollection({
  effectiveTimestamp: transaction.settlement_date,  // "2025-06-15"
});
```

### Right

```typescript
// Convert to ISO 8601
const effectiveTimestamp = `${transaction.settlement_date}T00:00:00Z`;
await recordPaymentCollection({
  effectiveTimestamp,  // "2025-06-15T00:00:00Z"
});
```

### Why It Matters

Formance may reject invalid timestamps or interpret them incorrectly, causing backfill to fail.

---

## 2. Processing Non-Approved Transactions

### The Problem

Only "Approved" transactions have valid `settlement_date`. Other statuses will have `null`.

### Wrong

```typescript
for (const tx of transactions) {
  // settlement_date is null for non-Approved!
  await recordPayment(tx.settlement_date);
}
```

### Right

```typescript
const approvedTransactions = transactions.filter(
  tx => tx.status === "Approved" && tx.settlement_date !== null
);

for (const tx of approvedTransactions) {
  await recordPayment(tx.settlement_date);
}
```

### Why It Matters

Processing non-Approved transactions will either fail (null timestamp) or record incorrect data.

---

## 3. Missing Reference Uniqueness

### The Problem

Backfill and regular sync could generate the same reference, causing false "duplicate" errors.

### Wrong

```typescript
// Both backfill and sync use same format
const reference = `payment:${paymentId}:${mortgageId}`;
```

### Right

```typescript
// Backfill uses distinct prefix
const reference = `backfill:${paymentId}:${mortgageId}`;

// Regular sync continues using
const reference = `payment:${paymentId}:${mortgageId}`;
```

### Why It Matters

If a payment was already recorded by regular sync, backfill should recognize it (409) and skip. But if references differ, you'll get duplicates.

**Note:** Actually, this is fine if the payment was already recorded - 409 is treated as success. The concern is if you accidentally use a different reference for the same payment in a retry scenario.

---

## 4. Not Handling 409 as Success

### The Problem

Formance returns 409 for duplicate references. This is expected for idempotent operations.

### Wrong

```typescript
if (!apiResponse.ok) {
  throw new Error("Ledger error");  // Throws on 409!
}
```

### Right

```typescript
if (apiResponse.ok) {
  return { success: true, transactionId };
}

// 409 = duplicate, treat as success
if (apiResponse.status === 409) {
  return { success: true };
}

// Only other statuses are real errors
throw new Error(`Ledger error: ${apiResponse.status}`);
```

### Why It Matters

Without 409 handling, retrying a failed backfill will fail on already-processed payments.

---

## 5. Calling Actions from Mutations

### The Problem

Convex mutations cannot directly call actions (external APIs). Must schedule.

### Wrong

```typescript
// In linkScheduleToMortgage mutation
await ctx.runAction(internal.rotessaSync.backfillHistoricalPayments, {...});
```

### Right

```typescript
// Schedule the action
await ctx.scheduler.runAfter(0, internal.rotessaSync.backfillHistoricalPayments, {...});
```

### Why It Matters

Direct action calls from mutations will fail with Convex runtime error.

---

## 6. Forgetting to Update Mortgage After Linking

### The Problem

Linking must set `rotessaScheduleId` on the mortgage, not just trigger backfill.

### Wrong

```typescript
async function linkScheduleToMortgage(mortgageId, scheduleId) {
  // Forgot to update mortgage!
  await ctx.scheduler.runAfter(0, internal.rotessaSync.backfillHistoricalPayments, {...});
}
```

### Right

```typescript
async function linkScheduleToMortgage(mortgageId, scheduleId) {
  // Update mortgage first
  await ctx.db.patch(mortgageId, {
    rotessaScheduleId: scheduleId,
    rotessaScheduleStatus: "active",
    rotessaScheduleLastSyncAt: Date.now(),
  });

  // Then trigger backfill
  await ctx.scheduler.runAfter(0, internal.rotessaSync.backfillHistoricalPayments, {...});
}
```

### Why It Matters

Without updating the mortgage, the schedule won't be excluded from "unlinked" list and regular sync won't work.

---

## 7. Fetching All Transactions Without Pagination

### The Problem

Rotessa transaction report may return many pages. Must handle pagination.

### Wrong

```typescript
const transactions = await client.transactionReport.list({
  start_date: "2024-01-01",
  end_date: "2026-02-03",
});
// Only gets first page!
```

### Right

```typescript
const allTransactions = [];
let page = 1;
let hasMore = true;

while (hasMore) {
  const batch = await client.transactionReport.list({
    start_date: "2024-01-01",
    end_date: "2026-02-03",
    page,
  });

  allTransactions.push(...batch);
  hasMore = batch.length > 0;  // Check if more pages
  page++;
}
```

### Why It Matters

Missing pagination means missing historical payments in backfill.

---

## 8. Not Validating Schedule Exists Before Linking

### The Problem

Admin could try to link a schedule that doesn't exist in Rotessa (stale UI data).

### Wrong

```typescript
async function linkScheduleToMortgage(mortgageId, scheduleId) {
  // Assume schedule exists
  await ctx.db.patch(mortgageId, { rotessaScheduleId: scheduleId });
}
```

### Right

```typescript
async function linkScheduleToMortgage(mortgageId, scheduleId) {
  // Validate schedule exists
  const schedule = await rotessaClient.transactionSchedules.get(scheduleId);
  if (!schedule) {
    throw new Error(`Schedule ${scheduleId} not found in Rotessa`);
  }

  await ctx.db.patch(mortgageId, { rotessaScheduleId: scheduleId });
}
```

### Why It Matters

Linking to non-existent schedule will cause sync failures later.

---

## 9. Ignoring Borrower Mismatch

### The Problem

Rotessa schedule belongs to a customer, mortgage belongs to a borrower. These should match.

### Wrong

```typescript
// Just link without checking
await ctx.db.patch(mortgageId, { rotessaScheduleId: scheduleId });
```

### Better

```typescript
// Validate or warn on mismatch
const schedule = await getSchedule(scheduleId);
const mortgage = await ctx.db.get(mortgageId);
const borrower = await ctx.db.get(mortgage.borrowerId);

if (borrower.rotessaCustomerId !== String(schedule.customer_id)) {
  // Log warning but allow (admin override)
  logger.warn("Borrower mismatch when linking schedule", {
    mortgageId,
    scheduleId,
    borrowerRotessaId: borrower.rotessaCustomerId,
    scheduleCustomerId: schedule.customer_id,
  });
}
```

### Why It Matters

Mismatch might indicate wrong pairing, but admin should make final call.

---

## 10. Not Creating backfill_log Before Starting

### The Problem

If backfill fails immediately, there's no record it was attempted.

### Wrong

```typescript
async function backfillHistoricalPayments(args) {
  // Start processing immediately
  const transactions = await fetchTransactions();
  // ... crashes here, no log created
}
```

### Right

```typescript
async function backfillHistoricalPayments(args) {
  // Create log first
  const logId = await ctx.runMutation(internal.rotessaSync.createBackfillLog, {
    mortgageId: args.mortgageId,
    scheduleId: args.scheduleId,
    triggeredBy: args.triggeredBy,
  });

  try {
    const transactions = await fetchTransactions();
    // ... process
    await updateBackfillLog(logId, { status: "completed" });
  } catch (error) {
    await updateBackfillLog(logId, { status: "failed", error: error.message });
    throw error;
  }
}
```

### Why It Matters

Audit trail is critical for debugging and compliance.

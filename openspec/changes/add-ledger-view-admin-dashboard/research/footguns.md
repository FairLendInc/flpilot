# Footguns and Gotchas: Formance Ledger Implementation

**Change ID:** `add-ledger-view-admin-dashboard`
**Analysis Date:** 2026-01-30
**Sources:**
- https://www.formance.com/blog/engineering/how-not-to-build-a-ledger (Common mistakes)
- https://docs.formance.com/modules/ledger/accounting-model/source-destination-accounting-model (API gotchas)
- Existing codebase analysis (`convex/lib/ownershipLedger.ts`, `convex/ledger.ts`)

---

## Executive Summary

This document catalogs **critical mistakes to avoid** when implementing the Ledger View admin dashboard and working with Formance's source-destination accounting model. Many of these footguns are **already mitigated** in the existing codebase—this document ensures we don't regress.

---

## 1. Ledger Anti-Patterns (From Formance Blog)

### 🔴 FOOTGUN #1: Storing Only Balances (Zero-Entry Ledger)

**What NOT to Do:**
```typescript
// ❌ NEVER DO THIS
const investorBalances = {
  "investor:userId1": { CAD: 100000 },
  "investor:userId2": { CAD: 250000 }
};

// Update balance directly (NO TRANSACTION HISTORY)
investorBalances["investor:userId1"].CAD -= 50000;
```

**Why It's Bad:**
- **No audit trail** - Cannot trace where money came from or went
- **Mutable state** - Bugs can silently corrupt balances
- **Impossible reconciliation** - Drift goes undetected until external reconciliation
- **Compliance failure** - Regulators require transaction history

**Correct Approach (Formance):**
```typescript
// ✅ ALWAYS record transactions, not just balances
await executeNumscript(ctx, {
  script: `send [CAD 50000] (
    source = @investor:userId1:cash:available
    destination = @fairlend:receivables
  )`,
  reference: `purchase:dealId:${Date.now()}`,
  metadata: { type: "share_purchase", dealId }
});

// Balance is DERIVED from transaction history, not stored
```

**How We Avoid This:**
- ✅ All ownership changes via `recordOwnershipTransfer` (transaction-based)
- ✅ All cash movements via `executeNumscript` (append-only ledger)
- ✅ Balances queried from ledger, never cached in mutable state

---

### 🔴 FOOTGUN #2: Single-Entry Ledger (No Balance Enforcement)

**What NOT to Do:**
```typescript
// ❌ Recording only one side of a transaction
await db.insert("transactions", {
  account: "investor:userId:cash",
  amount: -50000,
  type: "withdrawal"
});
// Where did the money go? No destination recorded!
```

**Why It's Bad:**
- **No structural enforcement** - Entry errors go undetected
- **Cannot generate balance sheets** - Missing liabilities
- **Reconciliation requires business logic** - No built-in checks

**Correct Approach (Formance):**
```typescript
// ✅ ALWAYS specify source AND destination
send [CAD 50000] (
  source = @investor:userId:cash:available
  destination = @world  // Withdrawal to external bank
)
// Formance enforces: sum(sources) = sum(destinations)
```

**How We Avoid This:**
- ✅ Formance **structurally enforces** balance constraints (cannot create unbalanced transactions)
- ✅ All NumScript requires explicit source + destination

---

### 🔴 FOOTGUN #3: Mutable Transaction History

**What NOT to Do:**
```typescript
// ❌ Updating or deleting transactions
await db.update("transactions", { id: 123 }, { amount: 60000 }); // Changed from 50k to 60k
await db.delete("transactions", { id: 456 }); // Removed transaction
```

**Why It's Bad:**
- **Audit trail corruption** - Cannot trust historical data
- **Regulatory violation** - Immutability required for compliance
- **Debugging impossible** - Cannot reconstruct state at past timestamps

**Correct Approach (Formance):**
```typescript
// ✅ Transactions are IMMUTABLE (append-only)
// To "reverse" a transaction, create a new reversal transaction:
await executeNumscript(ctx, {
  script: `send [CAD 50000] (
    source = @fairlend:receivables
    destination = @investor:userId:cash:available
  )`,
  reference: `reversal:original-ref:${Date.now()}`,
  metadata: { type: "reversal", originalRef: "purchase:dealId:123" }
});
```

**How We Avoid This:**
- ✅ Formance ledger is **append-only by design** (no update/delete API)
- ✅ Reversals handled via new transactions (not modifications)

---

## 2. Formance-Specific Gotchas

### 🟡 GOTCHA #1: Balance = Destination - Source (Inverted Formula)

**What's Confusing:**
```typescript
// Traditional accounting: Assets = Debits - Credits
// Formance: Balance = Destination - Source

// Example: Investor deposits $100k
send [CAD 100000] (
  source = @world
  destination = @investor:userId:cash:available
)

// Account state:
// - source: 0 (no funds removed FROM this account)
// - destination: 100000 (funds received BY this account)
// - balance = 100000 - 0 = 100000 ✅
```

**Why It's Confusing:**
- **Counterintuitive naming** - "Source" sounds like where money comes FROM, but it's actually where it GOES TO in postings
- **Inverted mental model** - Traditional accounting uses Assets = Liabilities + Equity

**How to Remember:**
- Think of **"destination"** as "funds added to my account"
- Think of **"source"** as "funds removed from my account"

**How We Avoid This:**
- ✅ Use high-level NumScript (not raw postings)
- ✅ NumScript `send` hides the destination/source complexity

---

### 🟡 GOTCHA #2: `@world` is NOT an Account (It's Infinite Source/Sink)

**What NOT to Do:**
```typescript
// ❌ Querying @world balance (meaningless)
const worldBalance = await getBalance(ledger, "@world");
console.log(worldBalance); // Always infinite (not useful)
```

**Why It's Confusing:**
- `@world` represents **external systems** (banks, Rotessa, etc.)
- It has **infinite balance** (can source/sink unlimited funds)
- Cannot be queried like a normal account

**Correct Usage:**
```typescript
// ✅ Use @world for external fund movements
// Investor deposits from bank
send [CAD 100000] (
  source = @world
  destination = @investor:userId:cash:pending
)

// Investor withdraws to bank
send [CAD 50000] (
  source = @investor:userId:cash:available
  destination = @world
)
```

**How We Avoid This:**
- ✅ Document `@world` as "external banking system"
- ✅ Never query `@world` balance (meaningless)

---

### 🟡 GOTCHA #3: Idempotency Keys MUST Be Unique Per Transaction

**What NOT to Do:**
```typescript
// ❌ Reusing the same reference for different transactions
const reference = `transfer:${dealId}`; // Same for all mortgages in deal

await transferShares(mortgageId1, reference); // OK
await transferShares(mortgageId2, reference); // ⚠️ CONFLICT! Same reference
```

**Why It Breaks:**
- Formance **enforces idempotency** via `reference` field
- Duplicate references return **409 CONFLICT** (transaction rejected)

**Correct Approach:**
```typescript
// ✅ Include timestamp + unique identifiers
const reference = `transfer:${dealId}:${mortgageId}:${Date.now()}`;
```

**How We Avoid This:**
- ✅ `generateOwnershipReference()` already includes `dealId`, `mortgageId`, `timestamp`
- ✅ All ownership transfers use unique references

---

### 🟡 GOTCHA #4: NumScript Variables are STRING-TYPED

**What NOT to Do:**
```typescript
// ❌ Passing numbers directly
await executeNumscript(ctx, {
  script: "send [$asset 10000] (...)",
  variables: {
    asset: "M123/SHARE",
    amount: 10000  // ⚠️ NUMBER, but Formance expects STRING
  }
});
// Error: "Expected string, got number"
```

**Correct Approach:**
```typescript
// ✅ Convert all variables to strings
variables: {
  asset: shareAsset,
  amount: amount.toString()  // Convert number to string
}
```

**How We Avoid This:**
- ✅ Existing code already converts amounts to strings (line 268 in `ownershipLedger.ts`)
- ⚠️ **WATCH OUT** when adding new NumScript calls

---

### 🟡 GOTCHA #5: Account Auto-Creation is NOT Atomic with Transactions

**What's Confusing:**
```typescript
// First transaction to an account auto-creates it
send [CAD 100000] (
  source = @world
  destination = @investor:newUserId:cash:available  // Account doesn't exist yet
)
// ✅ Account created automatically on first transaction
```

**Why It's Confusing:**
- **No explicit `createAccount` API call needed**
- Accounts are **lazily created** on first use
- Can lead to **unexpected account creation** if typos in account paths

**Best Practice:**
```typescript
// OPTION A: Explicit provisioning (recommended for visibility)
async function provisionInvestorAccounts(userId) {
  // Create accounts explicitly (even if auto-created on first transaction)
  // This provides audit trail and admin visibility
  await executeNumscript(ctx, {
    script: `send [CAD 0] (
      source = @world
      destination = @investor:${userId}:cash:pending
    )`,
    reference: `provision:${userId}:${Date.now()}`
  });
}

// OPTION B: Lazy creation (simpler, but less visible)
// Just start using accounts, they'll be created automatically
```

**How We Avoid This:**
- ✅ Explicit provisioning via `provisionInvestorAccounts` action (recommended in `blastradius.md`)
- ✅ Prevents typos causing phantom accounts

---

## 3. Codebase-Specific Footguns

### 🔴 FOOTGUN #4: Never Call External APIs from Mutations

**What NOT to Do:**
```typescript
// ❌ NEVER call Formance API from mutation
export const transferOwnership = mutation({
  handler: async (ctx, args) => {
    // ⚠️ WRONG! External API call in mutation
    const result = await fetch("https://formance.cloud/api/...");
    // Mutations MUST be deterministic (no external calls)
  }
});
```

**Why It's Bad:**
- **Non-deterministic** - External APIs can fail, introducing randomness
- **Convex constraint** - Mutations must be pure functions
- **Race conditions** - External state changes not atomically coordinated

**Correct Approach:**
```typescript
// ✅ Use scheduled actions for external API calls
export const transferOwnership = mutation({
  handler: async (ctx, args) => {
    // Update Convex state
    await ctx.db.patch(dealId, { status: "ownership_transferring" });

    // Schedule external API call
    await ctx.scheduler.runAfter(0, internal.ledger.recordOwnershipTransfer, {
      mortgageId,
      fromOwnerId,
      toOwnerId,
      percentage,
      reference
    });
  }
});

// Separate action for external API
export const recordOwnershipTransfer = internalAction({
  handler: async (ctx, args) => {
    // NOW we can call Formance API
    await executeNumscript(ctx, { ... });
  }
});
```

**How We Avoid This:**
- ✅ All Formance API calls are in **actions** (not mutations)
- ✅ Ownership transfers use `ctx.scheduler.runAfter()` pattern

---

### 🔴 FOOTGUN #5: Never Skip Idempotency Keys

**What NOT to Do:**
```typescript
// ❌ Omitting reference field
await executeNumscript(ctx, {
  script: "send [CAD 100000] (...)",
  variables: { ... },
  // ⚠️ NO REFERENCE - allows duplicate transactions!
});
```

**Why It's Bad:**
- **Duplicate transactions** - Same operation executed multiple times (e.g., retry on timeout)
- **Double-charging** - Investor charged twice for same purchase
- **Audit nightmare** - Cannot detect duplicates

**Correct Approach:**
```typescript
// ✅ ALWAYS include reference
await executeNumscript(ctx, {
  script: "...",
  variables: { ... },
  reference: generateOwnershipReference("transfer", dealId, mortgageId)
  // Formance rejects duplicates (returns 409 CONFLICT)
});
```

**How We Avoid This:**
- ✅ All ownership functions **require** `reference` parameter
- ✅ `generateOwnershipReference()` helper ensures uniqueness

---

### 🟡 GOTCHA #6: Balance Queries Return BigInt (Not Number)

**What NOT to Do:**
```typescript
// ❌ Treating balances as numbers directly
const balances = await getBalances(ledger, "investor:userId:*");
const total = balances["investor:userId:cash:available"]["CAD"];
console.log(total + 100); // ⚠️ BigInt + Number = ERROR
```

**Why It's Confusing:**
- Formance returns **BigInt** for precise monetary amounts
- JavaScript BigInt **cannot mix with Number** in arithmetic

**Correct Approach:**
```typescript
// ✅ Convert to Number for display, keep BigInt for calculations
const balance = Number(balances["investor:userId:cash:available"]["CAD"]);
const totalCents = balances["investor:userId:cash:available"]["CAD"] + BigInt(10000);
```

**How We Avoid This:**
- ✅ `parseOwnershipBalances()` converts BigInt to Number (line 90 in `ownershipLedger.ts`)
- ⚠️ **WATCH OUT** when displaying raw balance queries

---

## 4. UI/UX Footguns

### 🟡 GOTCHA #7: Don't Display Raw Ledger Balances (Use Derived Values)

**What NOT to Do:**
```typescript
// ❌ Showing raw share units to users
<p>Shares: {balance["Mjx9x8y7/SHARE"]}</p>
// Displays: "Shares: 2500" (confusing - user expects percentage)
```

**Correct Approach:**
```typescript
// ✅ Convert share units to percentage
const percentage = fromShareUnits(balance["Mjx9x8y7/SHARE"]);
<p>Ownership: {percentage}%</p>
// Displays: "Ownership: 25%"
```

**How We Avoid This:**
- ✅ Use `fromShareUnits()` helper for display
- ✅ UI components show percentages, not raw share counts

---

### 🟡 GOTCHA #8: Account Paths are Case-Sensitive

**What NOT to Do:**
```typescript
// ❌ Inconsistent casing
const account1 = "investor:UserId123:inventory";
const account2 = "investor:userid123:inventory";
// These are DIFFERENT accounts!
```

**Correct Approach:**
```typescript
// ✅ Use consistent casing (lowercase recommended)
const account = `investor:${userId.toLowerCase()}:inventory`;
```

**How We Avoid This:**
- ✅ Use template functions (`OWNERSHIP_ACCOUNTS.investorInventory(userId)`)
- ✅ Enforce lowercase in account path generation

---

## 5. Performance Footguns

### 🟡 GOTCHA #9: Avoid Querying All Accounts Without Filters

**What NOT to Do:**
```typescript
// ❌ Fetching ALL accounts (can be thousands)
const allAccounts = await listAccounts(ledger);
// Slow, memory-intensive, poor UX
```

**Correct Approach:**
```typescript
// ✅ Use address patterns to filter
const investorAccounts = await listAccounts(ledger, {
  address: "investor:*:*"  // Only investor accounts
});

// ✅ Use pagination
const page1 = await listAccounts(ledger, { pageSize: 100, cursor: null });
const page2 = await listAccounts(ledger, { pageSize: 100, cursor: page1.cursor });
```

**How We Avoid This:**
- ✅ Accounts table uses **grouping by namespace** (collapsible)
- ✅ Pagination enforced (max 100 items per page)

---

### 🟡 GOTCHA #10: Don't Poll Ledger for Real-Time Updates

**What NOT to Do:**
```typescript
// ❌ Polling every second
setInterval(async () => {
  const balances = await getBalances(ledger, "investor:userId:*");
  updateUI(balances);
}, 1000); // Hammers Formance API
```

**Correct Approach:**
```typescript
// ✅ Use Formance webhooks (future)
// ✅ Poll at reasonable intervals (e.g., every 30 seconds)
// ✅ Use Convex reactivity for cached state (if using Option B)
```

**How We Avoid This:**
- ✅ Use Convex reactive queries (not direct Formance polling)
- ✅ Admin dashboard is not real-time (manual refresh acceptable)

---

## 6. Security Footguns

### 🔴 FOOTGUN #6: Never Expose Formance API Keys to Client

**What NOT to Do:**
```typescript
// ❌ Client-side Formance API call
"use client";
const formanceClient = new SDK({
  serverURL: process.env.NEXT_PUBLIC_FORMANCE_URL, // ⚠️ EXPOSED!
  security: {
    clientID: process.env.NEXT_PUBLIC_CLIENT_ID, // ⚠️ EXPOSED!
    clientSecret: process.env.NEXT_PUBLIC_SECRET  // ⚠️ EXPOSED!
  }
});
```

**Why It's Bad:**
- **Credential leak** - API keys visible in browser
- **Unauthorized access** - Anyone can manipulate ledger

**Correct Approach:**
```typescript
// ✅ Server-side only (Convex actions)
export const getBalances = action({
  handler: async (ctx, args) => {
    const sdk = getFormanceClient(); // Server-side SDK initialization
    const result = await sdk.ledger.v2.getBalancesAggregated(...);
    return sanitizeResponse(result);
  }
});

// Client fetches via Convex action (no direct API access)
const balances = await ctx.runAction(api.ledger.getBalances, { ... });
```

**How We Avoid This:**
- ✅ All Formance API calls in **Convex actions** (server-side)
- ✅ Environment variables are **server-only** (not `NEXT_PUBLIC_*`)

---

### 🔴 FOOTGUN #7: Never Log PII in Transaction Metadata

**What NOT to Do:**
```typescript
// ❌ Including sensitive data in metadata
await executeNumscript(ctx, {
  script: "...",
  metadata: {
    investorEmail: "john@example.com",  // ⚠️ PII!
    investorSSN: "123-45-6789"          // ⚠️ PII!
  }
});
```

**Why It's Bad:**
- **Compliance violation** - PII should not be in transaction logs
- **Data leak risk** - Metadata is immutable (cannot redact)

**Correct Approach:**
```typescript
// ✅ Use non-PII identifiers
metadata: {
  type: "ownership_transfer",
  mortgageId: "jx9x8y7",
  fromOwnerId: "fairlend",
  toOwnerId: "userId123",  // Convex user ID (not email/SSN)
  dealId: "kx1x2x3"
}
```

**How We Avoid This:**
- ✅ Existing code uses **user IDs**, not PII
- ✅ `sanitizeState()` helper removes sensitive fields before logging

---

## 7. Debugging Tips

### ✅ TIP #1: Use Formance Console for Transaction Inspection

**Where:** https://orgID-stackID.sandbox.formance.cloud/console

**What to Check:**
- Transaction history (chronological view)
- Account balances (live state)
- NumScript errors (syntax validation)

**How We Use This:**
- ✅ Admin dashboard links to Formance Console
- ✅ Transaction IDs are logged for easy lookup

---

### ✅ TIP #2: Always Test with Dry-Run First

**Pattern:**
```typescript
// Step 1: Dry-run (validate without committing)
const dryRun = await executeNumscript(ctx, {
  script: "...",
  variables: { ... },
  dryRun: true  // Validate only
});

if (!dryRun.success) {
  console.error("NumScript validation failed:", dryRun.error);
  return;
}

// Step 2: Execute for real
const result = await executeNumscript(ctx, {
  script: "...",
  variables: { ... },
  dryRun: false  // Commit transaction
});
```

**How We Use This:**
- ✅ Test NumScript syntax before production deployment
- ✅ Validate variable substitution

---

## 8. Migration Checklist (Avoiding Footguns)

Before deploying ledger changes, verify:

- [ ] ✅ All transactions include `reference` (idempotency)
- [ ] ✅ All external API calls are in **actions** (not mutations)
- [ ] ✅ All NumScript variables are **strings** (not numbers)
- [ ] ✅ All account paths use **lowercase** (consistent casing)
- [ ] ✅ No PII in transaction metadata
- [ ] ✅ No Formance API keys exposed to client
- [ ] ✅ Balances displayed as percentages (not raw share units)
- [ ] ✅ Pagination enforced for large queries
- [ ] ✅ Test with `dryRun: true` before production
- [ ] ✅ Daily reconciliation scripts enabled

---

## 9. Conclusion

**Most Critical Footguns (Never Do These):**

1. 🔴 **#1**: Storing only balances (use transaction-based ledger)
2. 🔴 **#4**: Calling external APIs from mutations (use actions)
3. 🔴 **#5**: Skipping idempotency keys (always include `reference`)
4. 🔴 **#6**: Exposing Formance API keys to client (server-side only)
5. 🔴 **#7**: Logging PII in transaction metadata (use non-PII IDs)

**Good News:** The existing codebase **already avoids most footguns** ✅

**Watch Out For:** New features (investor cash accounts, fee collection) must follow existing patterns to maintain safety.

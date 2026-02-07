# Formance Ledger Research: Chart of Accounts for Fractional Mortgage Ownership

**Research Date:** 2026-01-30
**Change ID:** `add-ledger-view-admin-dashboard`
**Sources:**
- https://docs.formance.com/modules/ledger/accounting-model/source-destination-accounting-model (fetched 2026-01-30)
- https://www.formance.com/blog/engineering/how-not-to-build-a-ledger (fetched 2026-01-30)
- https://docs.formance.com/modules/ledger/tutorial (fetched 2026-01-30)
- Existing codebase: `convex/lib/ownershipLedger.ts`, `convex/ledger.ts`, `convex/schema.ts`

---

## Executive Summary

This research establishes a comprehensive **Chart of Accounts** for FairLend's fractional mortgage marketplace using Formance's source-destination accounting model. The existing codebase already implements fractional ownership brilliantly via **share tokens** (`M{mortgageId}/SHARE`). This research extends that foundation to support:

1. **Multi-ledger architecture** (operational vs. marketplace ledgers)
2. **Investor cash management** (pre-funding, settlements, distributions)
3. **Fee tracking** (platform fees, transaction fees)
4. **Complete audit trail** for regulatory compliance

---

## 1. Formance Source-Destination Accounting Model

### 1.1 Core Principles

**Unlike traditional double-entry bookkeeping**, Formance uses an **inverted balance equation**:

```
Balance = Destination - Source
```

**Key Concepts:**
- **Source component**: Add-only counter representing funds added to (or removed from) an account
- **Destination component**: Add-only counter representing funds received by an account
- **Postings**: Triplets of `(account, component, amount)` that modify account state
- **Transactions**: Atomic collections of postings where `sum(sources) = sum(destinations)`

**Critical Constraint (enforced by Formance):**
```
∀ transaction: Σ(source postings) = Σ(destination postings)
```

This constraint **structurally prevents phantom money creation** (unlike zero-entry or single-entry ledgers).

### 1.2 How It Differs from Traditional Accounting

| Aspect | Traditional Double-Entry | Formance Source-Destination |
|--------|-------------------------|----------------------------|
| **Balance Formula** | `Assets = Liabilities + Equity` | `Balance = Destination - Source` |
| **Account Types** | Debit-normal vs. Credit-normal | All accounts are uniform |
| **Debit/Credit** | Explicit debit/credit notation | Implicit via source/destination |
| **Money Creation** | Requires business logic enforcement | Structurally impossible |
| **Immutability** | Append-only ledger | Append-only components |

**Formance Advantage**: "You make sure your pay-in is correct, then the ledger makes sure you don't use more than you have available."

### 1.3 Account Structure and Naming Conventions

Formance does not enforce strict account hierarchies but **semantic naming patterns** are recommended:

```
{entity-type}:{identifier}:{purpose}
```

**Examples from Documentation:**
- `order:1234:paid` - Payment account for order 1234
- `payment-method:credit-card` - Credit card clearing account
- `rider:42:ride:99:payment` - Ride payment for rider 42, ride 99

**Our Existing Pattern (already follows best practices):**
- `mortgage:{mortgageId}:issuance` ✅
- `fairlend:inventory` ✅
- `investor:{userId}:inventory` ✅

---

## 2. Fractional Ownership with Source-Destination Model

### 2.1 Current Implementation (Existing Codebase)

The codebase **already solves fractional ownership** via **synthetic share assets**:

**Share Asset Naming:**
```typescript
// Asset: M{mortgageId}/SHARE
// Example: "Mjx9x8y7/SHARE"
```

**Share Units:**
```typescript
const SHARE_UNIT_SCALE = 100;
const TOTAL_SHARE_UNITS = 100 * SHARE_UNIT_SCALE; // 10,000 shares = 100%
```

**Ownership Accounts:**
```typescript
{
  mortgageIssuance: (mortgageId) => `mortgage:${mortgageId}:issuance`, // Infinite source (@world)
  fairlendInventory: "fairlend:inventory",                            // FairLend holdings
  investorInventory: (userId) => `investor:${userId}:inventory`       // Investor holdings
}
```

**Ownership Transfer Flow:**
```
1. Mint shares:      @world → mortgage:{id}:issuance → fairlend:inventory [10,000 shares]
2. Investor purchase: fairlend:inventory → investor:{userId}:inventory [X shares]
3. Query ownership:   SUM(investor:*:inventory[M{id}/SHARE]) = cap table
```

**Key Insight:** This pattern mirrors **tokenized securities** in DeFi—each mortgage is a "token contract" issuing 10,000 fungible shares.

### 2.2 Why This Model Works

**Advantages over Alternative Approaches:**

| Approach | Pros | Cons |
|----------|------|------|
| **Share Tokens (Current)** ✅ | Ledger-native, atomic transfers, audit trail, no custom logic | Requires namespace per mortgage asset |
| Sub-accounts per investor | Simple queries | Violates 100% invariant, complex reconciliation |
| Metadata-only tracking | Flexible | No ledger enforcement, drift risk |

**Formance Documentation Silence:** The docs **do not address fractional ownership**, but our share token approach aligns with **RideShare tutorial** (using assets like `[USD/2 2000]` for monetary units).

---

## 3. Complete Chart of Accounts

### 3.1 Design Principles

1. **Separation of Concerns**: Operational ledger (`flpilot`) vs. Marketplace ledger (`flmarketplace`)
2. **Asset Isolation**: Each mortgage has a unique share asset (`M{mortgageId}/SHARE`)
3. **Cash Segregation**: Investor cash separate from share holdings
4. **Fee Transparency**: Explicit accounts for platform fees
5. **Audit Compliance**: All transactions metadata-tagged for regulatory reporting

### 3.2 Ledger Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FairLend Ledger System                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐      ┌─────────────────────────┐  │
│  │  flpilot (Ops)      │      │  flmarketplace (Assets) │  │
│  │                     │      │                         │  │
│  │  • Borrower loans   │      │  • Share ownership     │  │
│  │  • Payments         │      │  • Investor cash       │  │
│  │  • Servicing fees   │      │  • Marketplace fees    │  │
│  └─────────────────────┘      └─────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Account Categories and Structure

#### A. Share Ownership Accounts (Marketplace Ledger)

**Purpose:** Track fractional mortgage ownership via share tokens

| Account Path | Asset Type | Description | Balance Interpretation |
|--------------|-----------|-------------|----------------------|
| `mortgage:{mortgageId}:issuance` | `M{id}/SHARE` | Infinite share source (mint account) | Should be 0 (all shares distributed) |
| `fairlend:inventory` | `M{id}/SHARE` | FairLend's unsold share holdings | Shares owned by FairLend |
| `investor:{userId}:inventory` | `M{id}/SHARE` | Investor's share holdings | Shares owned by investor |

**100% Ownership Invariant:**
```typescript
SUM(fairlend:inventory[M{id}/SHARE]) +
SUM(investor:*:inventory[M{id}/SHARE]) = 10,000 shares (100%)
```

**Example Transaction (Investor Purchase):**
```numscript
// Transfer 25% (2,500 shares) to investor
vars {
  asset $shareAsset = "Mjx9x8y7/SHARE"
}

send [$shareAsset 2500] (
  source = @fairlend:inventory
  destination = @investor:userId123:inventory
)
```

---

#### B. Investor Cash Accounts (Marketplace Ledger)

**Purpose:** Manage investor cash balances for purchasing shares and receiving distributions

| Account Path | Asset Type | Description | Balance Interpretation |
|--------------|-----------|-------------|----------------------|
| `investor:{userId}:cash:pending` | `CAD` | Funds in transit (not yet cleared) | Pre-funding for purchases |
| `investor:{userId}:cash:available` | `CAD` | Cleared funds ready for investment | Spendable balance |
| `investor:{userId}:cash:reserved` | `CAD` | Locked for pending transactions | Reserved for active deals |
| `investor:{userId}:distributions` | `CAD` | Interest/principal distributions received | Lifetime earnings |

**Cash Flow Example:**
```
1. Investor deposits $100k:
   @world → investor:{id}:cash:pending [$CAD 100000]

2. Funds clear (2-3 days):
   investor:{id}:cash:pending → investor:{id}:cash:available [$CAD 100000]

3. Investor purchases mortgage share (25% of $400k = $100k):
   investor:{id}:cash:available → investor:{id}:cash:reserved [$CAD 100000]
   fairlend:inventory → investor:{id}:inventory [M{id}/SHARE 2500]

4. Deal completes (transfer ownership):
   investor:{id}:cash:reserved → fairlend:receivables [$CAD 100000]
   (Share tokens already transferred in step 3)

5. Monthly interest distribution ($500):
   mortgage:{id}:income → investor:{id}:distributions [$CAD 500]
```

---

#### C. FairLend Operating Accounts (Marketplace Ledger)

**Purpose:** Platform operations, fee collection, and capital management

| Account Path | Asset Type | Description | Balance Interpretation |
|--------------|-----------|-------------|----------------------|
| `fairlend:receivables` | `CAD` | Investor payments for share purchases | Cash inflow from sales |
| `fairlend:operating` | `CAD` | General operating account | Working capital |
| `fairlend:fees:platform` | `CAD` | Platform usage fees collected | Revenue from marketplace |
| `fairlend:fees:transaction` | `CAD` | Transaction fees (e.g., 0.5% per trade) | Revenue from trading |
| `fairlend:payables` | `CAD` | Outgoing obligations | Amounts owed to investors/brokers |

**Fee Collection Example:**
```numscript
// 1% platform fee on $100k purchase
vars {
  monetary $purchase = [CAD 100000]
  monetary $fee = [CAD 1000]
  monetary $netProceeds = [CAD 99000]
}

send $purchase (
  source = @investor:userId:cash:reserved
  destination = {
    90% to @fairlend:receivables   // $90k net
    10% to @fairlend:fees:platform // $10k fee (actual 1%)
  }
)
```

---

#### D. Mortgage Income and Payment Accounts (Operational Ledger `flpilot`)

**Purpose:** Track loan payments, interest income, and distributions to investors

| Account Path | Asset Type | Description | Balance Interpretation |
|--------------|-----------|-------------|----------------------|
| `mortgage:{mortgageId}:payments:pending` | `CAD` | Expected payments (via Rotessa) | Payments in transit |
| `mortgage:{mortgageId}:payments:cleared` | `CAD` | Cleared borrower payments | Confirmed cash |
| `mortgage:{mortgageId}:income:interest` | `CAD` | Interest income collected | Distributable to investors |
| `mortgage:{mortgageId}:income:principal` | `CAD` | Principal repayments | Reduces outstanding balance |
| `mortgage:{mortgageId}:fees:servicing` | `CAD` | Servicing fees withheld | Platform servicing revenue |

**Payment Distribution Flow:**
```
1. Borrower pays $1,500 interest + $500 principal:
   @world → mortgage:{id}:payments:pending [$CAD 2000]

2. Payment clears (Rotessa webhook):
   mortgage:{id}:payments:pending → mortgage:{id}:payments:cleared [$CAD 2000]

3. Split payment (10% servicing fee):
   mortgage:{id}:payments:cleared → mortgage:{id}:income:interest [$CAD 1350]
   mortgage:{id}:payments:cleared → mortgage:{id}:fees:servicing [$CAD 150]
   mortgage:{id}:payments:cleared → mortgage:{id}:income:principal [$CAD 500]

4. Distribute to investors (based on ownership %):
   mortgage:{id}:income:interest → investor:A:distributions [$CAD 337.50] // 25%
   mortgage:{id}:income:interest → investor:B:distributions [$CAD 675]    // 50%
   mortgage:{id}:income:interest → fairlend:operating [$CAD 337.50]       // 25% (FairLend)
```

---

#### E. External World Accounts (Special Accounts)

**Purpose:** Represent external systems (banks, Rotessa, investors' external accounts)

| Account Path | Asset Type | Description | Balance Interpretation |
|--------------|-----------|-------------|----------------------|
| `@world` | `*` | Infinite source/sink for external funds | External banking system |
| `@rotessa:clearing` | `CAD` | Rotessa payment processor | Pre-settlement holding |

**Usage:**
```numscript
// Investor deposits via bank transfer
send [CAD 50000] (
  source = @world
  destination = @investor:userId:cash:pending
)

// Borrower payment via Rotessa
send [CAD 2000] (
  source = @rotessa:clearing
  destination = @mortgage:{id}:payments:pending
)
```

---

### 3.4 Asset Types Registry

| Asset Symbol | Description | Use Case |
|--------------|-------------|----------|
| `CAD` | Canadian Dollars | Cash, payments, fees |
| `USD` | US Dollars | (Future) Cross-border investments |
| `M{mortgageId}/SHARE` | Mortgage share tokens | Fractional ownership (10,000 = 100%) |

---

### 3.5 Complete Chart Summary

```
MARKETPLACE LEDGER (flmarketplace)
├── Share Ownership
│   ├── mortgage:{id}:issuance         [M{id}/SHARE] (mint source)
│   ├── fairlend:inventory             [M{id}/SHARE] (unsold shares)
│   └── investor:{userId}:inventory    [M{id}/SHARE] (investor holdings)
│
├── Investor Cash
│   ├── investor:{userId}:cash:pending     [CAD] (deposits in transit)
│   ├── investor:{userId}:cash:available   [CAD] (cleared funds)
│   ├── investor:{userId}:cash:reserved    [CAD] (locked for deals)
│   └── investor:{userId}:distributions    [CAD] (earnings received)
│
├── FairLend Operations
│   ├── fairlend:receivables           [CAD] (investor payments)
│   ├── fairlend:operating             [CAD] (working capital)
│   ├── fairlend:fees:platform         [CAD] (platform fees)
│   ├── fairlend:fees:transaction      [CAD] (trading fees)
│   └── fairlend:payables              [CAD] (outgoing obligations)
│
└── External
    ├── @world                         [*] (external banking)
    └── @rotessa:clearing              [CAD] (Rotessa settlement)

OPERATIONAL LEDGER (flpilot)
└── Mortgage Payments
    ├── mortgage:{id}:payments:pending     [CAD] (expected payments)
    ├── mortgage:{id}:payments:cleared     [CAD] (confirmed payments)
    ├── mortgage:{id}:income:interest      [CAD] (interest collected)
    ├── mortgage:{id}:income:principal     [CAD] (principal repayments)
    └── mortgage:{id}:fees:servicing       [CAD] (servicing fees)
```

---

## 4. Implementation Patterns

### 4.1 Investor Account Provisioning

**When:** Investor completes KYC/onboarding
**What:** Create all required investor accounts

```typescript
// Action: provisionInvestorAccounts(userId: string)
async function provisionInvestorAccounts(ctx: ActionCtx, userId: string) {
  const ledger = "flmarketplace";

  // Create cash accounts
  await initializeAccount(ctx, ledger, `investor:${userId}:cash:pending`);
  await initializeAccount(ctx, ledger, `investor:${userId}:cash:available`);
  await initializeAccount(ctx, ledger, `investor:${userId}:cash:reserved`);
  await initializeAccount(ctx, ledger, `investor:${userId}:distributions`);

  // Inventory account created on first share purchase (no pre-creation needed)

  // Emit audit event
  await emitAuditEvent(ctx, {
    eventType: "investor_accounts_provisioned",
    entityType: "user",
    entityId: userId,
    metadata: { ledger }
  });
}
```

**Note:** Formance **auto-creates accounts** on first transaction, so explicit provisioning is optional but recommended for visibility.

### 4.2 Mortgage Ownership Minting

**When:** Mortgage is created (already implemented in codebase)
**What:** Mint 10,000 shares to `fairlend:inventory`

```numscript
vars {
  asset $asset = "Mjx9x8y7/SHARE"
}

send [$asset 10000] (
  source = @world
  destination = @fairlend:inventory
)
```

**Idempotency:** Reference = `init:${dealId}:${mortgageId}:${timestamp}`

### 4.3 Ownership Transfer (Deal Completion)

**When:** Deal transitions from `pending_ownership_review` → `completed`
**What:** Transfer shares from `fairlend:inventory` → `investor:{userId}:inventory`

```typescript
// Already implemented in convex/lib/ownershipLedger.ts
await recordOwnershipTransfer(ctx, {
  mortgageId,
  fromOwnerId: "fairlend",
  toOwnerId: investorUserId,
  percentage: 100, // Full purchase
  reference: `transfer:${dealId}:${mortgageId}:${Date.now()}`,
  dealId
});
```

### 4.4 Cash Deposit and Clearing

**Pattern:** Two-step clearing (pending → available)

```numscript
// Step 1: Investor initiates deposit
send [CAD 100000] (
  source = @world
  destination = @investor:userId:cash:pending
)

// Step 2: Bank confirms (2-3 days later, via webhook)
send [CAD 100000] (
  source = @investor:userId:cash:pending
  destination = @investor:userId:cash:available
)
```

### 4.5 Interest Distribution (Proportional to Ownership)

**Pattern:** Query ownership snapshot, distribute proportionally

```typescript
// Get ownership breakdown from ledger
const ownership = await getOwnershipFromLedger(ctx, mortgageId);

// Distribution script per owner
for (const { ownerId, percentage } of ownership) {
  const amount = Math.round(totalInterest * (percentage / 100));

  await executeNumscript(ctx, {
    ledger: "flpilot",
    script: `send [CAD ${amount}] (
      source = @mortgage:${mortgageId}:income:interest
      destination = @investor:${ownerId}:distributions
    )`,
    reference: `dist:${mortgageId}:${paymentDate}:${ownerId}`,
    metadata: { type: "interest_distribution", mortgageId, ownerId, percentage }
  });
}
```

---

## 5. Integration with Existing Codebase

### 5.1 Current State (What Already Works)

✅ **Share token minting** (`initializeMortgageOwnership`)
✅ **Ownership transfers** (`recordOwnershipTransfer`)
✅ **Ownership queries** (`getOwnershipFromLedger`, `getOwnershipSnapshot`)
✅ **Idempotency** (reference-based duplicate prevention)
✅ **Audit events** (metadata on all transactions)

### 5.2 Required Extensions

❌ **Investor cash accounts** (not yet implemented)
❌ **Fee tracking** (no dedicated accounts)
❌ **Payment distribution** (no automated interest distribution)
❌ **Multi-ledger support** (currently hardcoded to `flmarketplace`)

### 5.3 Backward Compatibility

**No breaking changes** - The existing share token system remains unchanged. New cash/fee accounts are additive.

---

## 6. Regulatory and Compliance Considerations

### 6.1 Audit Trail Requirements

**Every transaction includes:**
- `reference` - Unique idempotency key (format: `{operation}:{dealId}:{mortgageId}:{timestamp}`)
- `metadata` - Structured data:
  ```json
  {
    "type": "ownership_transfer | interest_distribution | fee_collection",
    "mortgageId": "jx9x8y7",
    "fromOwnerId": "fairlend | userId",
    "toOwnerId": "userId",
    "percentage": "25.00",
    "dealId": "kx1x2x3" // Optional
  }
  ```

### 6.2 Balance Verification

**Daily Reconciliation Checks:**
```typescript
// 1. 100% Ownership Invariant
const totalShares = await sumBalances(ledger, `*:inventory`, `M${mortgageId}/SHARE`);
assert(totalShares === 10000, "Ownership invariant violated");

// 2. Cash Conservation (no phantom money)
const totalCash = await sumBalances(ledger, `*`, `CAD`);
const expectedCash = await sumTransactions(ledger, `CAD`);
assert(totalCash === expectedCash, "Cash mismatch detected");
```

### 6.3 Investor Reporting

**Monthly Statements:**
- **Holdings:** Query `investor:{userId}:inventory` for all `M*/SHARE` assets
- **Distributions:** Query `investor:{userId}:distributions` balance
- **Transactions:** List all transactions involving investor accounts

---

## 7. Performance and Scalability

### 7.1 Query Patterns

**Efficient Queries:**
```typescript
// Get single investor's portfolio
const balances = await getBalances(ledger, `investor:${userId}:*`);

// Get all ownership for one mortgage
const ownership = await getBalances(ledger, `*:inventory`, { asset: `M${mortgageId}/SHARE` });
```

**Avoid:** Scanning all accounts for all assets (use specific address patterns)

### 7.2 Asset Namespace Scaling

**Current:** ~100 mortgages = 100 unique share assets
**Scale to:** 10,000 mortgages = 10,000 share assets

**Formance handles this natively** - No performance degradation with distinct assets.

### 7.3 Transaction Volume

**Estimated Volume:**
- Ownership mints: ~10/day (new mortgages)
- Ownership transfers: ~5/day (deals complete)
- Interest distributions: ~1,000/month (monthly payments × investors)
- Cash deposits: ~20/day

**Total:** ~50,000 transactions/year - Well within Formance limits.

---

## 8. Testing Strategy

### 8.1 Unit Tests (NumScript Validation)

```typescript
test("Ownership transfer does not violate 100% invariant", async () => {
  await mintShares(mortgageId); // 10,000 → fairlend:inventory
  await transferShares(mortgageId, "fairlend", investorA, 25); // 2,500 → A
  await transferShares(mortgageId, "fairlend", investorB, 75); // 7,500 → B

  const total = await getTotalShares(mortgageId);
  expect(total).toBe(10000);
});
```

### 8.2 Integration Tests (Ledger API)

```typescript
test("Cash deposit flow (pending → available)", async () => {
  await depositCash(userId, 100000); // pending
  await clearDeposit(userId, 100000); // available

  const pending = await getBalance(`investor:${userId}:cash:pending`);
  const available = await getBalance(`investor:${userId}:cash:available`);

  expect(pending).toBe(0);
  expect(available).toBe(100000);
});
```

### 8.3 E2E Tests (Full Deal Lifecycle)

```typescript
test("Full deal lifecycle with ownership transfer", async () => {
  // 1. Create mortgage
  const mortgageId = await createMortgage({ principal: 400000 });
  await mintShares(mortgageId);

  // 2. Investor deposits cash
  await depositCash(investorId, 100000);
  await clearDeposit(investorId, 100000);

  // 3. Purchase shares (25%)
  await purchaseShares(investorId, mortgageId, 25);

  // 4. Verify ownership
  const ownership = await getOwnership(mortgageId);
  expect(ownership).toMatchObject([
    { ownerId: investorId, percentage: 25 },
    { ownerId: "fairlend", percentage: 75 }
  ]);

  // 5. Distribute interest
  await distributeInterest(mortgageId, 1000); // $1k interest

  // 6. Verify distributions
  const investorDist = await getBalance(`investor:${investorId}:distributions`);
  expect(investorDist).toBe(250); // 25% of $1k
});
```

---

## 9. Next Steps

### 9.1 Implementation Priorities

1. **Investor Cash Accounts** (P0)
   - Implement `provisionInvestorAccounts` action
   - Add cash deposit/withdrawal flows
   - UI for viewing cash balances

2. **Fee Collection** (P1)
   - Create `fairlend:fees:*` accounts
   - Add fee deduction to purchase transactions
   - Fee reporting dashboard

3. **Interest Distribution** (P1)
   - Automated monthly distribution via scheduler
   - Proportional allocation based on ownership
   - Investor notifications

4. **Multi-Ledger Support** (P2)
   - Refactor hardcoded `flmarketplace` references
   - Add ledger selector to admin UI
   - Cross-ledger reconciliation

### 9.2 Questions to Resolve

1. **Cash account pre-creation?** Should we pre-create all investor cash accounts on onboarding, or lazy-create on first deposit?
2. **Fee structure?** What % platform fee, transaction fee, servicing fee?
3. **Distribution frequency?** Monthly vs. quarterly interest distributions?
4. **Withdrawal flow?** How do investors withdraw cash from `distributions` account back to bank?

---

## 10. Conclusion

The existing **share token model** for fractional ownership is architecturally sound and aligns with Formance best practices. The proposed **Chart of Accounts** extends this foundation to support:

- ✅ **Complete investor lifecycle** (cash in, buy shares, receive distributions, cash out)
- ✅ **Platform operations** (fee collection, working capital management)
- ✅ **Regulatory compliance** (audit trail, balance verification)
- ✅ **Scalability** (handles 10k+ mortgages, 50k+ transactions/year)

**Key Recommendation:** Proceed with investor cash account implementation (P0) as it unlocks the full marketplace workflow.

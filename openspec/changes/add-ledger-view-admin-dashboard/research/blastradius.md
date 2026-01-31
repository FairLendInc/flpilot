# Blast Radius Analysis: Ledger View Admin Dashboard

**Change ID:** `add-ledger-view-admin-dashboard`
**Analysis Date:** 2026-01-30

---

## Executive Summary

This change introduces a **comprehensive admin dashboard** for viewing and managing Formance Ledger state, including the new **Chart of Accounts** defined in `research.md`. The blast radius is **moderate** with:

- ✅ **No breaking changes** to existing ledger operations
- ✅ **Additive** new backend functions (investor account provisioning)
- ✅ **Frontend-heavy** implementation (new UI components + routes)
- ⚠️ **Requires schema updates** if adding investor cash tracking to Convex

---

## 1. Affected Modules

### 1.1 Backend (Convex)

#### **convex/ledger.ts** (MODIFY)

**Current State:** Contains actions for:
- ✅ Ledger management (`listLedgers`, `createLedger`)
- ✅ Account management (`listAccounts`, `getAccount`, `getBalances`)
- ✅ Transaction management (`listTransactions`, `getTransaction`)
- ✅ Ownership operations (`initializeMortgageOwnership`, `recordOwnershipTransfer`, `getOwnershipSnapshot`)

**Required Changes:**
```typescript
// NEW: Provision investor cash accounts
export const provisionInvestorAccounts = internalAction({
  args: { userId: v.id("users") },
  returns: v.object({
    success: v.boolean(),
    accountsCreated: v.optional(v.array(v.string())),
    error: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    // Create investor cash accounts in flmarketplace ledger:
    // - investor:{userId}:cash:pending
    // - investor:{userId}:cash:available
    // - investor:{userId}:cash:reserved
    // - investor:{userId}:distributions
  }
});

// NEW: Get investor account provisioning status
export const getInvestorAccountStatus = action({
  args: { userId: v.id("users") },
  returns: v.object({
    success: v.boolean(),
    provisioned: v.boolean(),
    missingAccounts: v.optional(v.array(v.string())),
    error: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    // Query ledger for expected accounts, return missing list
  }
});
```

**Impact:** LOW - Additive changes, no modifications to existing functions

---

#### **convex/lib/ownershipLedger.ts** (NO CHANGES REQUIRED)

**Current State:** Already implements share token ownership model perfectly
**Impact:** NONE - Existing functions remain unchanged

---

#### **convex/schema.ts** (POTENTIAL MODIFY)

**Decision Point:** Do we track investor cash balances in Convex or query Formance ledger only?

**Option A: Ledger-Only (Recommended)**
- ✅ Single source of truth (Formance)
- ✅ No schema changes required
- ✅ No sync issues
- ⚠️ Requires Formance API calls for every balance check

**Option B: Convex Cache**
- Add `investor_balances` table to cache ledger state
- ⚠️ Requires sync logic (webhook from Formance or polling)
- ⚠️ Risk of drift between Convex and Formance

**Recommendation:** **Option A** (Ledger-Only) - Query Formance directly for balances, no Convex caching

**Impact:** NONE if Option A, MEDIUM if Option B

---

### 1.2 Frontend (Next.js + Components)

#### **lib/navigation/role-navigation.ts** (MODIFY)

**Current State:** Defines admin navigation with sections like:
- Dashboard
- MIC Management (with sub-pages)
- Approvals
- Reports

**Required Changes:**
```typescript
// ADD: New "Ledger View" section
{
  label: "Ledger View",
  icon: Database,
  items: [
    { label: "Accounts", href: "/dashboard/admin/ledger/accounts" },
    { label: "Transactions", href: "/dashboard/admin/ledger/transactions" },
    { label: "Investors", href: "/dashboard/admin/ledger/investors" },
    { label: "Mortgages", href: "/dashboard/admin/ledger/mortgages" }
  ]
}
```

**Impact:** LOW - Single configuration object addition

---

#### **app/(auth)/dashboard/admin/ledger/** (NEW ROUTES)

**New Files to Create:**
```
app/(auth)/dashboard/admin/ledger/
├── layout.tsx                    (Ledger selector + section header)
├── page.tsx                      (Redirect to /accounts)
├── accounts/
│   └── page.tsx                  (Accounts overview with balances)
├── transactions/
│   └── page.tsx                  (Transaction list with filters)
├── investors/
│   └── page.tsx                  (Investor account status + provisioning)
└── mortgages/
    └── page.tsx                  (Mortgage ownership + minting)
```

**Impact:** MEDIUM - 6 new route files (all greenfield, no conflicts)

---

#### **components/admin/ledger/** (NEW COMPONENTS)

**New Components to Create:**
```
components/admin/ledger/
├── LedgerSelector.tsx            (Dropdown to select active ledger)
├── AccountsTable.tsx             (Grouped account list with balances)
├── TransactionCard.tsx           (Single transaction visualization)
├── TransactionList.tsx           (Paginated transaction list)
├── InvestorAccountStatus.tsx     (Provisioning status indicator)
├── MortgageOwnershipTable.tsx    (Cap table visualization)
├── ProvisionAccountsDialog.tsx   (Dialog to provision missing accounts)
└── MintOwnershipDialog.tsx       (Dialog to mint shares for mortgage)
```

**Impact:** HIGH - 8 new components (all new, no modifications to existing)

---

### 1.3 Data Model Impacts

#### **Formance Ledger State** (MODIFY)

**New Accounts to Be Created:**
- `investor:{userId}:cash:pending`
- `investor:{userId}:cash:available`
- `investor:{userId}:cash:reserved`
- `investor:{userId}:distributions`

**Creation Trigger:** Admin clicks "Provision Accounts" for investor

**Impact:** MEDIUM - Ledger state changes, but additive (no deletions)

---

#### **Convex Database** (NO CHANGES)

**Impact:** NONE - No new tables, no schema modifications (if using Option A)

---

## 2. Integration Points

### 2.1 Existing Ledger Operations (No Changes)

**Unaffected Functions:**
- ✅ `initializeMortgageOwnership` - Still mints shares to `fairlend:inventory`
- ✅ `recordOwnershipTransfer` - Still transfers shares between accounts
- ✅ `getOwnershipSnapshot` - Still queries all mortgage ownership
- ✅ `listAccounts`, `listTransactions` - Used by new UI, no changes

**Impact:** NONE - Backward compatible

---

### 2.2 New Dependencies

**Backend:**
- Formance SDK (already installed and configured)
- No new external APIs

**Frontend:**
- Existing UI libraries (HeroUI, Radix UI, Lucide icons)
- No new dependencies

**Impact:** NONE - Uses existing infrastructure

---

## 3. API Surface Changes

### 3.1 New Convex Actions

```typescript
// Investor account management
api.ledger.provisionInvestorAccounts(userId: Id<"users">)
api.ledger.getInvestorAccountStatus(userId: Id<"users">)
```

**Impact:** ADDITIVE - New public API surface (no breaking changes)

---

### 3.2 Existing API (Unchanged)

**No modifications to:**
- `api.ledger.listLedgers`
- `api.ledger.listAccounts`
- `api.ledger.listTransactions`
- `api.ledger.getOwnershipSnapshot`
- `api.ledger.initializeMortgageOwnership`

**Impact:** NONE

---

## 4. Configuration Requirements

### 4.1 Environment Variables (No Changes)

**Existing (already configured):**
```bash
FORMANCE_CLIENT_ID=xxx
FORMANCE_CLIENT_SECRET=xxx
FORMANCE_SERVER_URL=https://orgID-stackID.sandbox.formance.cloud
```

**Impact:** NONE - Uses existing Formance credentials

---

### 4.2 Ledger Configuration (Additive)

**Current Ledgers:**
- `flpilot` (operational ledger)
- `flmarketplace` (marketplace ledger)

**New Ledger Required?** NO - Reuses existing `flmarketplace` ledger

**Impact:** NONE

---

## 5. Security and Access Control

### 5.1 Route Protection

**New Routes:** All under `/dashboard/admin/ledger/*`

**Access Control:** Middleware already protects `/dashboard/admin/*` routes

**Required Role:** `admin` (WorkOS RBAC)

**Impact:** NONE - Existing middleware handles authorization

---

### 5.2 Data Sensitivity

**Exposed Data:**
- Account balances (investor cash, share holdings)
- Transaction history (sources, destinations, amounts)
- Investor PII (user IDs, names)

**Protection:**
- ✅ Admin-only routes
- ✅ Server-side actions (no client-side ledger API keys)
- ✅ Audit logging via `emitAuditEvent`

**Impact:** LOW - Standard admin dashboard security posture

---

## 6. Performance Considerations

### 6.1 Query Load

**New Queries:**
- List all accounts (paginated, max 100/page)
- List all transactions (paginated, max 100/page)
- Get balances for all `*:inventory` accounts (for ownership snapshot)

**Estimated Load:**
- Accounts: ~500 accounts (100 mortgages × 2 investors/mortgage + FairLend + cash accounts)
- Transactions: ~5,000/month (50k/year ÷ 12)

**Formance Limits:** ✅ Well within capacity (designed for 10k+ req/sec)

**Impact:** LOW - Pagination prevents excessive data fetching

---

### 6.2 Frontend Rendering

**Large Lists:**
- Accounts table: ~500 rows (grouped by namespace, collapsible)
- Transactions list: Infinite scroll or pagination

**Optimization:**
- Use virtualization for long lists (e.g., `react-window`)
- Server-side pagination (cursor-based from Formance API)

**Impact:** MEDIUM - May require virtualization for smooth UX

---

## 7. Testing Impact

### 7.1 New Tests Required

**Backend Tests:**
```typescript
// convex/tests/ledger.test.ts
test("provisionInvestorAccounts creates all required accounts")
test("getInvestorAccountStatus detects missing accounts")
test("provisionInvestorAccounts is idempotent (no duplicates)")
```

**Frontend Tests:**
```typescript
// e2e/admin-ledger.spec.ts
test("Admin can view accounts grouped by namespace")
test("Admin can filter transactions by date range")
test("Admin can provision investor accounts")
test("Admin can mint mortgage ownership")
```

**Impact:** MEDIUM - ~10 new tests to write

---

### 7.2 Existing Tests (Unaffected)

**No changes to:**
- Ownership transfer tests
- Deal completion tests
- Mortgage creation tests

**Impact:** NONE

---

## 8. Documentation Impact

### 8.1 New Documentation Required

**User Docs:**
- Admin guide: "How to use Ledger View"
- Investor account provisioning workflow
- Mortgage ownership minting procedure

**Developer Docs:**
- Chart of Accounts reference (already in `research.md`)
- Ledger API usage examples

**Impact:** MEDIUM - ~3 new doc pages

---

### 8.2 Existing Docs (Updates)

**Update:**
- `openspec/specs/mortgages/spec.md` - Add investor cash accounts
- `convex/README.md` - Document new ledger actions

**Impact:** LOW - Minor additions to existing docs

---

## 9. Deployment Considerations

### 9.1 Migration Steps

**No database migrations required** (if using Option A: Ledger-Only)

**Deployment Checklist:**
1. ✅ Deploy backend changes (`convex/ledger.ts` actions)
2. ✅ Deploy frontend changes (new routes + components)
3. ✅ Update navigation config (`role-navigation.ts`)
4. ✅ Test ledger connectivity (verify Formance API access)
5. ✅ Provision test investor accounts (smoke test)

**Impact:** LOW - Standard deployment, no downtime

---

### 9.2 Rollback Plan

**If issues occur:**
1. Hide navigation link to "Ledger View" (soft disable)
2. Revert backend changes (remove new actions)
3. No data rollback needed (ledger state unchanged)

**Impact:** LOW - Easy rollback (feature toggle)

---

## 10. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Formance API downtime** | LOW | HIGH | Cache critical balances in Convex (Option B) |
| **Performance issues with large account lists** | MEDIUM | MEDIUM | Implement virtualization, server-side pagination |
| **Investor PII exposure** | LOW | HIGH | Strict RBAC enforcement, audit logging |
| **Ledger state drift** | LOW | MEDIUM | Daily reconciliation scripts |
| **UI complexity (too many features)** | MEDIUM | LOW | Phased rollout (accounts first, then transactions) |

---

## 11. Affected Teams and Stakeholders

| Team | Impact | Action Required |
|------|--------|-----------------|
| **Engineering** | HIGH | Implement new routes, components, backend actions |
| **Design** | MEDIUM | Review UI/UX for new admin pages |
| **QA** | MEDIUM | Test new admin flows, ledger connectivity |
| **Product** | LOW | Review feature scope, prioritize sub-pages |
| **Support** | LOW | Learn new admin tools for troubleshooting |

---

## 12. Timeline and Effort Estimate

| Task | Estimated Effort | Dependencies |
|------|-----------------|--------------|
| Backend actions (`provisionInvestorAccounts`) | 4 hours | None |
| Frontend routes (6 pages) | 12 hours | Backend complete |
| UI components (8 components) | 16 hours | Design approval |
| Testing (unit + E2E) | 8 hours | All implementation complete |
| Documentation | 4 hours | Testing complete |
| **Total** | **~44 hours** (~1 week) | - |

---

## 13. Conclusion

**Overall Blast Radius:** MEDIUM

**Key Highlights:**
- ✅ **No breaking changes** - Fully backward compatible
- ✅ **Additive only** - New features, no modifications to existing
- ⚠️ **Frontend-heavy** - Majority of work in new UI components
- ⚠️ **Performance monitoring** - Watch for slow queries on large ledgers

**Go/No-Go Decision:** ✅ **GO** - Low risk, high value, manageable scope

**Next Steps:** Proceed with implementation in priority order:
1. Backend actions (provisionInvestorAccounts, getInvestorAccountStatus)
2. Accounts overview page (highest value)
3. Transactions page
4. Investors + Mortgages pages (administrative tools)

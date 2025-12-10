# Fractional Mortgage Ownership with Formance Ledger
## Technical Design Document

**Date:** December 8, 2025
**Version:** 1.0
**Status:** Draft

---

## 1. Executive Summary

This document details the technical design for migrating the fractional mortgage ownership system from a database-centric model (Convex tables) to a **Ledger-centric model** using **Formance Ledger**.

The core objective is to establish the Ledger as the **immutable, single source of truth** for:
1.  **Ownership State:** Who owns what percentage of each mortgage at any given second.
2.  **Interest Accruals:** Exact calculation of interest obligations based on time-weighted ownership.
3.  **Distributions:** Auditable history of all funds collected and paid out.

We expressly adopt the **"Logic in Ledger"** strategy (Option 2/Advanced), ensuring that the Ledger tracks not just the final payouts, but the *accrual of liability* over time. This minimizes application-side state management and maximizes auditability.

---

## 2. System Architecture

### 2.1 High-Level Components

*   **Convex (Application Layer):** Handles user management, deal state machines, and orchestration. It acts as the "Client" to the Ledger.
*   **Formance Ledger (Core System):** Stores all accounts, assets, and transaction history. Executes atomic multi-posting transactions via Numscript.
*   **Rotessa (Payment Processor):** Handles incoming borrower payments and signals cash availability via webhooks.

### 2.2 Integration Pattern

Convex will interact with Formance via a new internal module (e.g., `lib/ledger.ts`) which wraps the Formance API.

*   **Reads:** The application will query Formance balances to render the "Cap Table" and "My Portfolio" views. The Convex `mortgage_ownership` table will be deprecated or maintained strictly as a read-only cache.
*   **Writes:** All mutations involving ownership changes or money movement will be executed as **atomic Numscript transactions**.

---

## 3. Ledger Data Model

We will utilize Formance's multi-asset and multi-currency capabilities to track Shares and Cash simultaneously.

### 3.1 Assets

| Asset Symbol | Description | Precision | Notes |
| :--- | :--- | :--- | :--- |
| `M{id}/SHARE` | Fractional ownership of Mortgage `{id}` | 0 | Fixed Supply: **10,000** units (1 unit = 0.01% or 1 bps). |
| `CAD` | Canadian Dollar | 2 | Standard currency for payments. |

### 3.2 Account Structure

We define a structured account hierarchy to segregate responsibilities.

| Account Path | Purpose |
| :--- | :--- |
| `mortgage:{id}:issuance` | The source of the share tokens (World state). |
| `mortgage:{id}:liquidity` | Holding account for incoming borrower payments before distribution. |
| `mortgage:{id}:interest_payable` | Liability account tracking interest owed to investors. |
| `fairlend:inventory` | Holds the unsold portion of mortgage shares. |
| `fairlend:receivables` | Tracks interest accrued but not yet paid to FairLend. |
| `investor:{user_id}:inventory` | Holds shares owned by a specific investor. |
| `investor:{user_id}:receivables` | Tracks interest accrued but not yet paid to the investor. |
| `investor:{user_id}:cash` | External liability representing cash ready for withdrawal/payout. |

---

## 4. Core Workflows & Logic

The fundamental principle is **Event-Based Accrual**. We do not wait for the end of the month to calculate who is owed what. Instead, every time ownership changes (a "Transfer Event"), we "book" the interest accrued *up to that moment* for the seller.

### 4.1 Mortgage Initialization (Minting)

**Trigger:** `createMortgage` in Convex.

**Logic:**
1.  Define the `M{id}/SHARE` asset.
2.  Issue 100% (10,000 units) to FairLend.

**Numscript:**
```numscript
vars {
  monetary $amount = { "M123/SHARE": 10000 }
}
send $amount (
  source = @mortgage:M123:issuance
  destination = @fairlend:inventory
)
```

### 4.2 Deal Completion (Investment)

**Trigger:** `completeDeal` in Convex.
**Context:** Investor buys 10% (1,000 shares) from FairLend on Day 15.

**Logic:**
1.  **Calculate Accrual:** Determine interest earned by FairLend (the seller) since the last event (Day 1 to Day 15).
    *   *Formula:* `Principal * Rate * (Days / 365)`
2.  **Atomic Transaction:**
    *   **Post 1:** Book the accrued interest to FairLend.
    *   **Post 2:** Transfer the shares to the Investor.

**Numscript:**
```numscript
vars {
  monetary $accrued_interest = { "CAD": 5000 } // $50.00
  monetary $shares = { "M123/SHARE": 1000 }
}

// 1. Book Interest earned by Seller so far
send $accrued_interest (
  source = @mortgage:M123:interest_payable
  destination = @fairlend:receivables
)

// 2. Transfer Ownership
send $shares (
  source = @fairlend:inventory
  destination = @investor:USER_123:inventory
)
```

**Outcome:**
*   FairLend's `receivables` increases (they locked in their earnings for those 15 days).
*   Ownership shifts. Future interest will now implicitly accrue to the new owner (because they hold the shares).

### 4.3 Payment Collection & Distribution

**Trigger:** Rotessa Webhook (Monthly Payment Received).
**Context:** Day 30. Payment of $100 arrives.

**Logic:**
1.  **Ingest Cash:** Record the incoming cash.
2.  **Final Accrual:** Calculate interest for *all current holders* for the remaining period (Day 15 to Day 30).
    *   FairLend (90%): 15 days.
    *   Investor (10%): 15 days.
3.  **Payout:** Distribute cash to satisfy *all* `receivables` balances.

**Numscript:**
```numscript
vars {
  monetary $incoming_cash = { "CAD": 10000 } // $100.00
  monetary $fairlend_final_accrual = { "CAD": 4500 } // $45.00
  monetary $investor_final_accrual = { "CAD": 500 }  // $5.00
}

// 1. Receive Cash
send $incoming_cash (
  source = @world
  destination = @mortgage:M123:liquidity
)

// 2. Book Final Interest for the period
send $fairlend_final_accrual (
  source = @mortgage:M123:interest_payable
  destination = @fairlend:receivables
)
send $investor_final_accrual (
  source = @mortgage:M123:interest_payable
  destination = @investor:USER_123:receivables
)

// 3. Distribute Cash to clear Receivables
// Note: This requires knowing the total receivable balance. 
// Ideally, we flush the exact balance.
send [CAD *] (
  source = @mortgage:M123:liquidity
  destination = {
    // We payout to match the receivable/liability
    // In practice, this step might need two transactions if strictly clearing
    // or we map the calculated totals directly here.
    1/2 to @fairlend:cash
    1/2 to @investor:USER_123:cash
  }
)
```

*Refinement on Payout:* The "Payout" step essentially converts the `Receivable` (an accounting asset) into `Cash`. In double-entry, we effectively swap the liability.
A cleaner flow for the payout transaction:
1.  Move Cash from `Liquidity` to `Investor:Cash`.
2.  Simultaneously reduce `Interest_Payable`? No, `Interest_Payable` was the liability source.
    *   When we paid into `Receivables`, we debited `Interest_Payable` (making it negative/debit balance? No. Expense accounts are debited. `Interest_Payable` is a Liability, so it should be Credited).
    *   *Correction on Accrual:*
        *   Debit: `Expense:Interest`
        *   Credit: `Investor:Receivable`
    *   *Correction on Payout:*
        *   Debit: `Investor:Receivable` (Clearing it)
        *   Credit: `Asset:Cash`

**Final Payout Transaction Design:**
We will use a specialized Numscript that pulls the specific amounts owed.

---

## 5. Integration Plan

### 5.1 Convex Modules
We will create a new Convex directory `convex/ledger/` to isolate this logic.

*   `convex/ledger/client.ts`: Wraps `fetch` calls to Formance API.
*   `convex/ledger/actions.ts`: Exposes internal actions for `create_transaction`, `get_balance`.
*   `convex/ownership.ts`: REFACTOR.
    *   **Read Paths:** Update `getMortgageOwnership` to query Formance `GET /balances?address=mortgage:M123...`.
    *   **Write Paths:** Update `createOwnershipInternal` to call `ledger:actions:transfer_shares`.

### 5.2 API Security
*   Formance API credentials will be stored in Convex Environment Variables (`FORMANCE_URL`, `FORMANCE_CLIENT_ID`, `FORMANCE_CLIENT_SECRET`).
*   All Ledger calls happen server-side within Convex Actions.

### 5.3 Migration Strategy
1.  **Dual Run (Phase 1):** Keep existing DB logic. Add Ledger calls asynchronously (fire-and-forget) to build parallel history.
2.  **Reconciliation:** Verify Ledger balances match DB `mortgage_ownership`.
3.  **Cutover (Phase 2):** Switch read paths to Ledger. Disable DB writes.

---

## 6. Implementation Checklist

- [ ] **Environment:** Set up Formance Cloud instance and configure secrets in Convex.
- [ ] **Ledger Init:** Create the `mortgage` ledger.
- [ ] **Convex Action:** Implement `convex/actions/ledger.ts` with authentication and `postTransaction`.
- [ ] **Refactor Minting:** Update `createMortgage` to mint initial shares.
- [ ] **Refactor Trading:** Update `completeDeal` to calculate accrual and swap shares.
- [ ] **Refactor Payment:** Create `processPayment` action to handle webhook and distribution.


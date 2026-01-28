Below is a **self-contained MIC module section** that you can drop into the TDD.
It is written to be **ledger-centric**, consistent with your accepted design decisions, and deliberately avoids re-explaining the mortgage module except where the MIC is the counterparty.

I am **not** redefining the whole document—this is **only the MIC section**, but it is complete in itself.

---

# MIC Module — Ledger-Centric Design (v1)

## Scope & Intent

This section defines how **Formance Ledger** is used to model and operate a **Mortgage Investment Corporation (MIC)** as a first-class financial entity, including:

- MIC investor capital & cap table (capital-share model),
- cash inflows/outflows between MIC and AUMs (mortgages),
- fee recognition and settlement (listing, lending, servicing, fund management),
- monthly distributions to MIC investors at **net-zero cash policy**,
- interaction boundaries between:
  - MIC ↔ mortgage module,
  - MIC ↔ marketplace,
  - MIC ↔ management/admin providers.

**Design invariants**

1. **Ledger is the source of truth**
   - MIC ownership, entitlements, fees, and payouts are _ledger state_, not derived.

2. **Capital-share unit model**
   - One economic unit defines MIC ownership for distributions & redemptions.

3. **Accrual-basis expense recognition**
   - All MIC-level and AUM-attached fees accrue when earned/incurred.

4. **Boundary-based accruals**
   - Ownership and economic state changes force explicit accrual boundaries.

5. **Net-zero fund operation**
   - At distribution time, MIC cash is driven to zero (no retained buffer).

6. **MIC is the investor until sale**
   - MIC initially owns 100% of mortgage AUMs and receives all economics until sold.

---

## 1. Assets (MIC)

### 1.1 Fiat

- **`CAD/2`**
  - Base currency for all MIC cash flows.

---

### 1.2 MIC Capital Units (Economic)

- **Asset:** `MICCAP-<MIC_ID>/0`
  Example: `MICCAP-FLMIC/0`

- **Meaning:**
  - Represents proportional economic ownership of the MIC.
  - Used **exclusively** for:
    - dividend distributions,
    - capital redemption calculations.

- **Unit model:** **capital-share**
  - Units minted = capital contributed (in cents or chosen scale).
  - No NAV math required for v1.

> **Invariant:**
> All MIC investor cash distributions are proportional to balances of `MICCAP-<MIC_ID>/0`.

---

### 1.3 MIC Governance Units (Non-Economic)

- **Asset:** `MICGOV-<MIC_ID>-PREF/0` (or similar)

- **Meaning:**
  - Governance / control rights only.
  - **Never** participates in:
    - monthly distributions,
    - capital redemptions,
    - fee allocation.

- **Future use:**
  - MIC sale proceeds,
  - voting rights,
  - board control.

---

## 2. Accounts (MIC Registry)

### 2.1 MIC Cash Accounts

```
mic:<MIC_ID>:cash             (CAD/2) - Capital / Principal
mic:<MIC_ID>:cash:income      (CAD/2) - Income Collection
```

- **Capital Account (`mic:<MIC_ID>:cash`)**:
  - Inflows: Investor subscriptions, Mortgage principal repayments.
  - Outflows: Funding new mortgages, Investor capital redemptions.
  - **Strict Invariant**: `Balance(mic:cash) + Balance(AUM_positions) == Total_Investor_Capital`
  - **Rule**: NEVER used for distributions.

- **Income Account (`mic:<MIC_ID>:cash:income`)**:
  - Inflows: Mortgage interest payments, Origination/Lending fees.
  - Outflows: Expense payments (listing, mgmt), Investor distributions.
  - **Invariant**: Fully distributed at period close (Net-Zero).

> Reserve semantics should be implemented via sub-accounts if needed.

---

### 2.2 MIC Capital Positions

```
mic:<MIC_ID>:capital:investor:<INV_ID>    (MICCAP-<MIC_ID>/0)
```

- Holds economic ownership units per investor.

```
mic:<MIC_ID>:capital:treasury             (MICCAP-<MIC_ID>/0)
```

- Temporary issuance / redemption source.

---

### 2.3 MIC Governance Positions

```
mic:<MIC_ID>:governance:investor:<INV_ID> (MICGOV-<MIC_ID>-PREF/0)
```

---

### 2.4 MIC Fee & Expense Accrual Accounts

#### Lending / Origination Fee (Income)

```
mic:<MIC_ID>:income:lending_fee_accrued   (CAD/2)
```

- 1% of principal.
- Netted from borrower proceeds at origination.
- Accrued immediately at origination boundary.

---

#### Listing Fee (Expense)

```
mic:<MIC_ID>:expense:listing_fee_accrued  (CAD/2)
```

- 0.5% of principal.
- Incurred when AUM is listed.

---

#### Fund Management Fee (Expense)

```
mic:<MIC_ID>:expense:fund_mgmt_accrued    (CAD/2)
```

- Dynamic:
  - typically 1% of AUM,
  - may be zero,
  - may include discretionary performance bonus.

- Accrual timing TBD → **monthly boundary** assumed.

---

### 2.5 MIC as Investor in Mortgage Module

When MIC owns mortgage economics:

```
investors:MIC_<MIC_ID>:mortgage:<MORT_ID>:position   (MORT-<MORT_ID>/0)
accrued:mortgage:<MORT_ID>:investor:MIC_<MIC_ID>    (CAD/2)
```

- These are **standard mortgage module accounts**.
- MIC is treated as a normal investor from the mortgage ledger’s perspective.

---

## 3. Metadata Schema

### 3.1 MIC Metadata Carrier

```
mic:<MIC_ID>:meta
```

**Required metadata**

```json
{
  "mic_id": "FLMIC",
  "unit_model": "capital-share",
  "distribution_policy": "net_zero",
  "governance_asset": "MICGOV-FLMIC-PREF/0",
  "economic_asset": "MICCAP-FLMIC/0",
  "listing_fee_bps": 50,
  "lending_fee_bps": 100,
  "management_fee_model": "dynamic",
  "servicing_fee_attached_to_mortgage": true
}
```

---

## 4. MIC ↔ AUM Economic Rules

### 4.1 Origination (MIC funds mortgage)

**Reality chosen:**
Borrower receives `P - lending_fee`, principal booked at full `P`.

**Ledger pattern (single atomic transaction)**

- `mic:FLMIC:cash → external:borrower:M123:principal` : `CAD P`
- `external:borrower:M123:principal → mic:FLMIC:income:lending_fee_accrued` : `CAD (1% of P)`

> Net MIC cash outflow = `P - fee`.

---

### 4.2 Listing Fee

- Accrued when mortgage is listed.

```
mic:FLMIC:expense:listing_fee_accrued → external:platform   (CAD fee)
```

- Settled later from MIC cash.

---

### 4.3 Interest & Servicing Fee Rule

- **Servicing fee follows the mortgage.**
- Paid **monthly**, directly from borrower interest.

| Mortgage owner    | Servicing fee recipient |
| ----------------- | ----------------------- |
| MIC               | MIC                     |
| Any fraction sold | FairLend Management     |

**Accrual logic**

At each accrual boundary:

- Gross interest accrued as usual.
- Servicing fee carved out **before** investor allocations.
- Recipient depends on ownership snapshot at boundary.

---

## 5. Ownership Transitions & Boundaries

### 5.1 Sale of Mortgage Fraction

**Invariant:**

> _All interest and servicing fees are fully accrued to the sale timestamp before ownership transfer._

**Flow**

1. Force `accrue_interest_until(T_sale)`
2. Transfer mortgage share units:
   - MIC → buyer(s)

3. Sale proceeds:
   - `external:marketplace → mic:<MIC_ID>:cash`

4. MIC ownership percentage updates immediately.

---

## 6. Monthly MIC Close & Distribution

### 6.1 Preconditions

Before MIC distribution run:

- All AUM PAD interest payments processed.
- All mortgage-level accruals complete.
- No partial ownership periods un-accrued.

---

### 6.2 Settlement Order (Deterministic)

1. **Mortgage-level settlements**
   - Borrower interest → mortgage collect.
   - Servicing fees paid:
     - to MIC (if MIC owned),
     - or to management (if sold).

   - Remaining interest settles accrued investor balances.
   - MIC’s accrued mortgage interest settles into `mic:<MIC_ID>:cash`.

2. **MIC-level expenses**
   - Listing fees paid.
   - Fund management fees accrued & paid.

3. **Net-zero invariant check**
   - `distributable = mic_cash_balance`

4. **MIC investor distributions**
   - For each MIC investor `i`:

```
mic:<MIC_ID>:cash →
investors:<INV_ID>:wallet
= distributable * (MICCAP_i / total_MICCAP)
```

5. **Post-condition**
   - `mic:<MIC_ID>:cash == 0`

---

## 7. Core Workflows & User Stories

### 7.1 Add MIC Investor (Admin)

**Goal:** Investor contributes capital, receives MIC units.

**Steps**

1. Bank confirms deposit.
2. Ledger:
   - `external:bank → mic:<MIC_ID>:cash`
   - Mint `MICCAP` units → investor position.
   - (Optional) Mint governance units.

3. MIC cap table updated automatically.

---

### 7.2 Remove MIC Investor (Capital Redemption)

**Goal:** Investor exits MIC.

**Steps**

1. Determine redeemable capital (policy-driven).
2. Boundary:
   - Ensure all accruals complete to redemption date.

3. Ledger:
   - Burn investor MICCAP units.
   - `mic:<MIC_ID>:cash → investors:<INV>:wallet`

4. Wallet → payout rails handled via standard payout state machine.

---

### 7.3 Add New AUM (Admin / System)

**Goal:** Deploy MIC capital into a mortgage.

**Steps**

1. Origination approval.
2. Ledger:
   - MIC funds borrower (netted lending fee).
   - Lending fee accrued.
   - MIC receives 100% mortgage shares.

---

### 7.4 Sell AUM Fraction / Full (System)

**Goal:** Convert AUM back into MIC cash.

**Steps**

1. Accrue interest + servicing fees to sale boundary.
2. Transfer mortgage shares.
3. Sale proceeds → MIC cash.
4. Servicing fee recipient flips automatically.

---

### 7.5 AUM State Transitions (Missed / Default / Recovery)

**Missed payment**

- No PAD received.
- Interest continues to accrue into receivable.
- No settlement occurs.

**In default**

- Accrual policy may freeze (policy-driven).
- Asset remains on books.

**Recovery**

1. Recovery payment received.
2. Apply:
   - missed interest,
   - principal (if applicable).

3. Resume normal accrual boundaries.

---

### 7.6 Pre-Disbursement Review & CSV Export (Admin)

**Goal:** Confirm payouts before execution.

**Ledger queries**

- MIC distributable cash.
- MICCAP balances per investor.
- Outstanding accruals (should be zero post-settlement).

**Output**

- Deterministic CSV:
  - investor_id,
  - amount,
  - wallet_account,
  - reference_period.

---

## 8. MIC-Level Invariants (Auditable)

1. **Single economic ownership asset**

   ```
   Σ MICCAP balances = total MIC ownership
   ```

2. **Net-zero distribution**

   ```
   mic:<MIC_ID>:cash == 0 after monthly run
   ```

3. **Servicing fee locality**
   - Fee always charged at mortgage level.
   - Recipient determined by ownership snapshot.

4. **Boundary safety**
   - No ownership change without prior accrual.

---

## Open Items (Confirm Before v2)

We don't have the answer to these yet. Design and implement with the expectation that the requirements here will be emergent.

1. Fund management fee accrual cadence:
   - monthly flat?
   - daily AUM-weighted?
2. Performance bonus:
   - discretionary manual entry or formula-driven?

3. MIC sale event:
   - do governance units participate differently than MICCAP?

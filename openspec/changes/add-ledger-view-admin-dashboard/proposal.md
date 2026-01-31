## Why

The admin dashboard currently lacks a dedicated, comprehensive view into the Formance Ledger state. While there's a "Ledger View" under MIC Management at `/dashboard/admin/mic/ledger`, it's scoped only to MIC-specific accounts and lacks the full feature set needed for:

1. **Multi-ledger support** - The system may have multiple ledgers (e.g., `flpilot`, `flmarketplace`, MIC ledger), and admins need to switch between them
2. **Investor account provisioning** - The ownership transfer workflow requires investors to have specific Formance accounts (cash, mortgage positions), many currently do not have said accounts; admins need visibility into which investors are properly provisioned
3. **Mortgage ownership source of truth** - As per the ownership transfer workflow, Formance is the source of truth for fractional mortgage ownership; admins need a dedicated view to see ownership breakdown and "mint" mortgages that don't yet have ledger ownership data
4. **Full transaction audit** - Chronological transaction history with metadata for debugging and compliance

## UI/UX Skill Requirement

When creating any new UI component for this change, use `@.cursor/commands/ui-ux-pro-max.md`.

## What Changes

### New Sidebar Section: Ledger View

- **NEW**: Add "Ledger View" collapsible section to admin navigation (same pattern as MIC Management)
- Routes will be under `/dashboard/admin/ledger`
- Section icon: `Database` (from lucide-react)

### Global Ledger Selector

- **NEW**: Dropdown in section header to select active ledger
- Persists selection in local storage / URL state
- All sub-pages respect the selected ledger
- Lists ledgers from `api.ledger.listLedgers`

### Sub-Page 1: Accounts Overview (`/dashboard/admin/ledger/accounts`)

- **NEW**: Display ALL accounts in the selected ledger with current balances
- Group accounts by namespace (first segment before `:`)
- Collapsible namespace groups
- Search/filter by account address
- Balance display with proper currency formatting
- Click to expand account details (metadata, volumes)

### Sub-Page 2: Transactions (`/dashboard/admin/ledger/transactions`)

- **NEW**: Chronological list of ALL transactions in the selected ledger
- Each transaction displayed as a card showing:
  - Transaction ID
  - Source/destination accounts with arrow visualization
  - Amount and currency
  - Timestamp (formatted)
  - Metadata (collapsible)
- Pagination/infinite scroll
- Filter by date range, account, asset

### Sub-Page 3: Investors (`/dashboard/admin/ledger/investors`)

- **NEW**: List ALL investors from Convex with their associated Formance accounts
- Expected accounts per investor (as per ownership transfer workflow):
  - `investor:{userId}:inventory` - Share holdings
  - (Future: cash account, other positions)
- Status indicator: ✅ Fully provisioned, ⚠️ Missing accounts
- **Account Provisioning Interface**:
  - For investors with missing accounts, show "Provision Accounts" action
  - Creates required Formance accounts via numscript
  - Emits audit event on provisioning

### Sub-Page 4: Mortgages Ownership (`/dashboard/admin/ledger/mortgages`)

- **NEW**: List ALL mortgages from Convex with their ledger ownership state
- Query ownership from Formance via `getOwnershipSnapshot` action
- Display ownership breakdown (cap table visualization):
  - FairLend percentage
  - Investor percentages
  - Total verification (must equal 100%)
- Status indicator: ✅ Has ledger ownership, ⚠️ Not minted
- **Mint Mortgage Interface**:
  - For mortgages without ledger ownership, show "Mint Ownership" action
  - Calls `initializeMortgageOwnership` to create 100% FairLend ownership
  - Emits audit event on minting

### Layout

- **NEW**: Create `/dashboard/admin/ledger/layout.tsx` with:
  - Ledger selector dropdown in header
  - Section title
  - Consistent styling with MIC Management section

## Impact

- **Affected navigation**: `lib/navigation/role-navigation.ts` - Add "Ledger View" section to admin nav
- **New routes**:
  - `app/(auth)/dashboard/admin/ledger/page.tsx` (redirects to `/accounts`)
  - `app/(auth)/dashboard/admin/ledger/accounts/page.tsx`
  - `app/(auth)/dashboard/admin/ledger/transactions/page.tsx`
  - `app/(auth)/dashboard/admin/ledger/investors/page.tsx`
  - `app/(auth)/dashboard/admin/ledger/mortgages/page.tsx`
  - `app/(auth)/dashboard/admin/ledger/layout.tsx`
- **New components**:
  - `components/admin/ledger/LedgerSelector.tsx`
  - `components/admin/ledger/AccountsTable.tsx`
  - `components/admin/ledger/TransactionCard.tsx`
  - `components/admin/ledger/TransactionList.tsx`
  - `components/admin/ledger/InvestorAccountStatus.tsx`
  - `components/admin/ledger/MortgageOwnershipTable.tsx`
  - `components/admin/ledger/ProvisionAccountsDialog.tsx`
  - `components/admin/ledger/MintOwnershipDialog.tsx`
- **Existing backend used**:
  - `convex/ledger.ts` - `listLedgers`, `listAccounts`, `listTransactions`
  - `convex/ledger.ts` - `getOwnershipSnapshot`, `initializeMortgageOwnership`
  - `convex/lib/ownershipLedger.ts` - Account naming conventions
- **New backend required**:
  - `convex/ledger.ts` - `provisionInvestorAccounts(userId)` action
  
## Questions to Clarify

1. **Investor expected accounts**: Currently only `investor:{userId}:inventory` is used. Are there other accounts needed (cash, etc.)?
2. **Multiple ledger use cases**: Should we support viewing multiple ledgers simultaneously, or is single-ledger selection sufficient?
3. **Permissions**: Should any of these views be restricted beyond the admin role?

# Ledger View Admin Dashboard - Implementation Tasks

> **UI/UX Skill Requirement**
> When creating any new UI component for this change, use `@.cursor/commands/ui-ux-pro-max.md`.

---

## 1. Navigation & Layout

- [x] 1.1 Update `lib/navigation/role-navigation.ts`
  - Add "Ledger View" section to admin navigation
  - Use `Database` icon from lucide-react
  - Add sub-items: Accounts, Transactions, Investors, Mortgages
  - Pattern: Same structure as MIC Management

- [x] 1.2 Create `app/(auth)/dashboard/admin/ledger/layout.tsx`
  - Header with SidebarTrigger, Separator, section title
  - LedgerSelector dropdown component in header
  - LedgerProvider context wrapper for children
  - Pattern: Mirror `app/(auth)/dashboard/admin/mic/layout.tsx`

- [x] 1.3 Create `app/(auth)/dashboard/admin/ledger/page.tsx`
  - Redirect to `/dashboard/admin/ledger/accounts`
  - Use `redirect()` from next/navigation

- [x] 1.4 Create `components/admin/ledger/LedgerContext.tsx`
  - `LedgerProvider` component with ledger selection state
  - `useLedger()` hook for children to access selected ledger
  - Sync with URL params and localStorage

- [x] 1.5 Create `components/admin/ledger/LedgerSelector.tsx`
  - Dropdown (Select) showing available ledgers
  - Fetch ledgers via `api.ledger.listLedgers`
  - Loading state while fetching
  - Compact design for header placement

## 2. Accounts Overview Page

- [x] 2.1 Create `app/(auth)/dashboard/admin/ledger/accounts/page.tsx`
  - Page header with search input
  - Stats cards: Total accounts, Total assets, etc.
  - AccountsTable component

- [x] 2.2 Create `components/admin/ledger/AccountsTable.tsx`
  - Fetch accounts via `api.ledger.listAccounts` with `expand: "volumes"`
  - Group accounts by namespace (use `getNamespace` helper)
  - Collapsible namespace groups (Collapsible from Radix)
  - Display: address, balance(s), metadata badge
  - Search/filter by address
  - Pagination with cursor

- [x] 2.3 Create `components/admin/ledger/AccountCard.tsx`
  - Display individual account details
  - Address with copy button
  - Balance list per asset
  - Metadata (collapsible if present)
  - Volumes: input/output if available

- [x] 2.4 Create `lib/ledger/utils.ts`
  - `getNamespace(address: string): string` - Extract namespace from address
  - `formatBalance(amount: bigint | number, asset: string): string` - Currency formatting
  - `getAccountIcon(namespace: string): LucideIcon` - Icon mapping
  - `getAccountColor(namespace: string): string` - Color class mapping

## 3. Transactions Page

- [x] 3.1 Create `app/(auth)/dashboard/admin/ledger/transactions/page.tsx`
  - Page header with filter controls
  - Date range picker (optional)
  - TransactionList component

- [x] 3.2 Create `components/admin/ledger/TransactionList.tsx`
  - Fetch transactions via `api.ledger.listTransactions`
  - Paginated list with "Load More" button
  - Filter by account (optional)

- [x] 3.3 Create `components/admin/ledger/TransactionCard.tsx`
  - Card layout for single transaction
  - Transaction ID with copy button
  - Timestamp (formatted with date-fns)
  - Postings list with source → destination arrows
  - Amount and asset per posting
  - Reference (if present)
  - Metadata (collapsible accordion)

- [x] 3.4 Create `components/admin/ledger/PostingRow.tsx`
  - Source account (truncated, tooltip for full)
  - Arrow icon (ArrowRight)
  - Destination account
  - Amount badge with asset

## 4. Investors Page

- [x] 4.1 Create `app/(auth)/dashboard/admin/ledger/investors/page.tsx`
  - Page header with stats
  - Stats: Total investors, Fully provisioned, Missing accounts
  - InvestorAccountsList component

- [x] 4.2 Create `components/admin/ledger/InvestorAccountsList.tsx`
  - Fetch all users from Convex via `api.users.listAllUsers`
  - Fetch ledger accounts via `api.ledger.listAccounts`
  - Match investors to their expected accounts
  - Display: investor name/email, account status, actions

- [x] 4.3 Create `components/admin/ledger/InvestorAccountStatus.tsx`
  - Expected accounts display with status icons
  - ✅ Account exists (with balance)
  - ⚠️ Account missing
  - "Provision" button for missing accounts

- [x] 4.4 Create `components/admin/ledger/ProvisionAccountsDialog.tsx`
  - AlertDialog confirming provisioning
  - Shows which accounts will be created
  - Calls provisioning action
  - Success/error toast

- [x] 4.5 Create `convex/ledger.ts` - `provisionInvestorAccounts` action
  - Args: `userId: string`
  - Creates `investor:{userId}:inventory` account if not exists
  - Uses metadata update to provision account
  - Returns success/error

- [ ] 4.6 Update `convex/auditEvents.ts`
  - Add `INVESTOR_ACCOUNTS_PROVISIONED` event type
  - Include userId, accounts created, admin user
  - **Note:** Deferred - audit events can be added in follow-up

## 5. Mortgages Ownership Page

- [x] 5.1 Create `app/(auth)/dashboard/admin/ledger/mortgages/page.tsx`
  - Page header with stats
  - Stats: Total mortgages, Minted in ledger, Not minted
  - MortgageOwnershipTable component

- [x] 5.2 Create `components/admin/ledger/MortgageOwnershipTable.tsx`
  - Fetch mortgages from Convex via `api.mortgages.listAllMortgagesWithBorrowers`
  - Fetch ownership snapshot from ledger via `api.ledger.getOwnershipSnapshot`
  - Match mortgage IDs to ownership data
  - Display: mortgage address, ownership cap table, status, actions

- [x] 5.3 Create `components/admin/ledger/MortgageOwnershipRow.tsx`
  - Mortgage identifier (address or ID)
  - Ownership bar visualization
  - Status badge: "Minted" or "Not Minted"
  - "Mint" action button for unminted

- [x] 5.4 Create `components/admin/ledger/MintOwnershipDialog.tsx`
  - AlertDialog confirming mint operation
  - Shows mortgage details
  - Explains: "100% ownership will be assigned to FairLend"
  - Calls `api.ledger.executeNumscript` with mint script
  - Success/error toast

- [x] 5.5 Create `components/admin/ledger/OwnershipCapTable.tsx`
  - Reusable cap table display
  - Lists owners with percentages
  - Bar visualization
  - Totals verification (should = 100%)

- [ ] 5.6 Update `convex/auditEvents.ts`
  - Add `MORTGAGE_OWNERSHIP_MINTED` event type
  - Include mortgageId, admin user, timestamp
  - **Note:** Deferred - audit events can be added in follow-up

## 6. Shared Components

- [x] 6.1 Create `components/admin/ledger/EmptyState.tsx`
  - Reusable empty state for no data
  - Icon, message, optional action button

- [x] 6.2 Create `components/admin/ledger/RefreshButton.tsx`
  - Button to manually refresh data
  - Loading spinner while refreshing

- [x] 6.3 Create `components/admin/ledger/CopyButton.tsx`
  - Small button to copy text to clipboard
  - Toast on copy

## 7. Testing

- [ ] 7.1 Create `stories/admin/ledger/LedgerSelector.stories.tsx`
  - Default state
  - Loading state
  - Multiple ledgers

- [ ] 7.2 Create `stories/admin/ledger/AccountsTable.stories.tsx`
  - With accounts grouped by namespace
  - Empty state
  - Loading state

- [ ] 7.3 Create `stories/admin/ledger/TransactionCard.stories.tsx`
  - Single posting transaction
  - Multiple postings
  - With metadata
  - Without reference

- [ ] 7.4 Create `stories/admin/ledger/InvestorAccountStatus.stories.tsx`
  - Fully provisioned
  - Missing accounts
  - Provisioning in progress

- [ ] 7.5 Create `stories/admin/ledger/MortgageOwnershipRow.stories.tsx`
  - Minted with FairLend 100%
  - Minted with fractional ownership
  - Not minted

- [ ] 7.6 Create unit tests for `lib/ledger/utils.ts`
  - Test `getNamespace` with various account formats
  - Test `formatBalance` with different assets

## 8. Documentation & Cleanup

- [ ] 8.1 Update CLAUDE.md with Ledger View section
  - Document new routes
  - Document component patterns

- [ ] 8.2 Add JSDoc comments to new components
  - Props documentation
  - Usage examples

---

## Implementation Order

**Phase 1: Foundation** ✅ COMPLETE
1. Tasks 1.1 - 1.5 (Navigation & Layout)
2. Task 2.4 (Utils)

**Phase 2: Core Views** ✅ COMPLETE
3. Tasks 2.1 - 2.3 (Accounts)
4. Tasks 3.1 - 3.4 (Transactions)

**Phase 3: Domain-Specific Views** ✅ COMPLETE
5. Tasks 5.1 - 5.5 (Mortgages)
6. Tasks 4.1 - 4.5 (Investors)

**Phase 4: Polish** 🔄 PARTIAL
7. Tasks 6.1 - 6.3 (Shared Components) ✅ COMPLETE
8. Tasks 7.1 - 7.6 (Testing) - Deferred
9. Tasks 8.1 - 8.2 (Documentation) - Deferred

---

## Dependencies

| Task | Depends On |
|------|------------|
| 2.1-2.3 | 1.1-1.5 (layout), 2.4 (utils) |
| 3.1-3.4 | 1.1-1.5, 2.4 |
| 4.1-4.4 | 1.1-1.5, 4.5 (new action) |
| 5.1-5.4 | 1.1-1.5, existing `getOwnershipSnapshot` |
| 7.* | Respective component implementations |

---

## Files Created

### Routes
- `app/(auth)/dashboard/admin/ledger/layout.tsx`
- `app/(auth)/dashboard/admin/ledger/page.tsx`
- `app/(auth)/dashboard/admin/ledger/accounts/page.tsx`
- `app/(auth)/dashboard/admin/ledger/transactions/page.tsx`
- `app/(auth)/dashboard/admin/ledger/investors/page.tsx`
- `app/(auth)/dashboard/admin/ledger/mortgages/page.tsx`

### Components
- `components/admin/ledger/LedgerContext.tsx`
- `components/admin/ledger/LedgerSelector.tsx`
- `components/admin/ledger/AccountsTable.tsx`
- `components/admin/ledger/AccountCard.tsx`
- `components/admin/ledger/TransactionList.tsx`
- `components/admin/ledger/TransactionCard.tsx`
- `components/admin/ledger/PostingRow.tsx`
- `components/admin/ledger/InvestorAccountsList.tsx`
- `components/admin/ledger/InvestorAccountStatus.tsx`
- `components/admin/ledger/ProvisionAccountsDialog.tsx`
- `components/admin/ledger/MortgageOwnershipTable.tsx`
- `components/admin/ledger/MortgageOwnershipRow.tsx`
- `components/admin/ledger/MintOwnershipDialog.tsx`
- `components/admin/ledger/OwnershipCapTable.tsx`
- `components/admin/ledger/EmptyState.tsx`
- `components/admin/ledger/RefreshButton.tsx`
- `components/admin/ledger/CopyButton.tsx`

### Utilities
- `lib/ledger/utils.ts`

### Backend
- `convex/ledger.ts` - Added `provisionInvestorAccounts` action
- `convex/users.ts` - Added `listAllUsers` admin query

### Navigation
- `lib/navigation/role-navigation.ts` - Added Ledger View section

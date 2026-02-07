# ledger-admin-dashboard Specification

## Purpose

This specification defines the Ledger View section of the admin dashboard, providing comprehensive visibility into Formance Ledger state, investor account provisioning, and mortgage ownership management.

## ADDED Requirements

### Requirement: Ledger View Navigation

The system SHALL provide a dedicated Ledger View section in the admin sidebar navigation.

#### Scenario: Display ledger section in admin navigation
- **GIVEN** user is logged in with admin role
- **WHEN** viewing the admin dashboard sidebar
- **THEN** the system displays "Ledger View" as a collapsible section
- **AND** the section uses the Database icon
- **AND** expanding reveals sub-items: Accounts, Transactions, Investors, Mortgages

#### Scenario: Navigate to ledger sub-pages
- **GIVEN** admin has expanded the Ledger View section
- **WHEN** clicking on a sub-item (e.g., "Accounts")
- **THEN** the system navigates to `/dashboard/admin/ledger/accounts`
- **AND** the sub-item is highlighted as active

### Requirement: Ledger Selector

The system SHALL provide a global ledger selector in the Ledger View section header.

#### Scenario: Display available ledgers
- **GIVEN** admin is viewing any Ledger View page
- **WHEN** the page loads
- **THEN** the system fetches available ledgers from Formance
- **AND** displays a dropdown selector in the header
- **AND** shows the currently selected ledger

#### Scenario: Switch between ledgers
- **GIVEN** admin has multiple ledgers available
- **WHEN** selecting a different ledger from the dropdown
- **THEN** the system updates the URL with ledger parameter
- **AND** refreshes the page data for the selected ledger
- **AND** persists selection in localStorage

#### Scenario: Remember ledger selection
- **GIVEN** admin has previously selected a ledger
- **WHEN** returning to any Ledger View page
- **THEN** the system restores the previously selected ledger
- **AND** falls back to default "flpilot" if no selection stored

### Requirement: Accounts Overview

The system SHALL display all accounts in the selected ledger with their balances.

#### Scenario: Display accounts grouped by namespace
- **GIVEN** admin is viewing `/dashboard/admin/ledger/accounts`
- **WHEN** the page loads
- **THEN** the system fetches accounts from Formance with volumes
- **AND** groups accounts by namespace (first segment before `:`)
- **AND** displays each group as a collapsible section

#### Scenario: Search accounts by address
- **GIVEN** admin is viewing the accounts page
- **WHEN** entering text in the search input
- **THEN** the system filters accounts whose address contains the search text
- **AND** updates the displayed groups accordingly

#### Scenario: Display account balances
- **GIVEN** an account has one or more asset balances
- **WHEN** displaying the account
- **THEN** the system shows each asset balance with proper formatting
- **AND** handles decimal places based on asset convention
- **AND** displays the asset name/symbol

### Requirement: Transaction History

The system SHALL display all transactions in chronological order.

#### Scenario: Display transaction list
- **GIVEN** admin is viewing `/dashboard/admin/ledger/transactions`
- **WHEN** the page loads
- **THEN** the system fetches recent transactions from Formance
- **AND** displays each transaction as a card
- **AND** orders transactions by timestamp (newest first)

#### Scenario: Display transaction details
- **GIVEN** a transaction is displayed
- **WHEN** viewing the transaction card
- **THEN** the system shows: transaction ID, timestamp
- **AND** shows each posting with source → destination → amount
- **AND** shows reference if present
- **AND** shows metadata in a collapsible section

#### Scenario: Paginate transactions
- **GIVEN** more transactions exist than displayed
- **WHEN** clicking "Load More" button
- **THEN** the system fetches the next page using cursor
- **AND** appends transactions to the existing list

### Requirement: Investor Account Status

The system SHALL display all investors with their Formance account provisioning status.

#### Scenario: Display investor list with account status
- **GIVEN** admin is viewing `/dashboard/admin/ledger/investors`
- **WHEN** the page loads
- **THEN** the system fetches all investors with investor role from Convex
- **AND** fetches all investor accounts from Formance ledger
- **AND** matches investors to their expected accounts
- **AND** displays status: ✅ Fully provisioned or ⚠️ Missing accounts

#### Scenario: Identify expected accounts
- **GIVEN** displaying an investor's account status
- **WHEN** checking for required accounts
- **THEN** the system expects: `investor:{userId}:inventory`
- **AND** marks account as "exists" if found in ledger
- **AND** marks account as "missing" if not found

#### Scenario: Provision missing accounts
- **GIVEN** an investor has missing required accounts
- **WHEN** admin clicks "Provision Accounts" button
- **THEN** the system displays a confirmation dialog
- **AND** on confirmation, calls `provisionInvestorAccounts` action
- **AND** creates the missing accounts in Formance
- **AND** displays success or error toast
- **AND** refreshes the investor list

#### Scenario: Emit audit event on provisioning
- **GIVEN** admin provisions investor accounts
- **WHEN** the provisioning succeeds
- **THEN** the system emits an `INVESTOR_ACCOUNTS_PROVISIONED` audit event
- **AND** includes: userId, accounts created, admin user, timestamp

### Requirement: Mortgage Ownership View

The system SHALL display all mortgages with their ledger ownership status.

#### Scenario: Display mortgage ownership list
- **GIVEN** admin is viewing `/dashboard/admin/ledger/mortgages`
- **WHEN** the page loads
- **THEN** the system fetches all mortgages from Convex
- **AND** fetches ownership snapshot from Formance
- **AND** matches mortgage IDs to ownership data
- **AND** displays each mortgage with status and cap table

#### Scenario: Display ownership cap table
- **GIVEN** a mortgage has ownership data in the ledger
- **WHEN** displaying the mortgage
- **THEN** the system shows a cap table with owner percentages
- **AND** visualizes ownership with a stacked bar
- **AND** verifies total equals 100%

#### Scenario: Identify unminted mortgages
- **GIVEN** a mortgage exists in Convex but not in ledger
- **WHEN** displaying the mortgage
- **THEN** the system marks it as "Not Minted"
- **AND** displays a "Mint Ownership" action button

#### Scenario: Mint mortgage ownership
- **GIVEN** a mortgage is not minted in the ledger
- **WHEN** admin clicks "Mint Ownership" button
- **THEN** the system displays a confirmation dialog
- **AND** explains that 100% ownership will be assigned to FairLend
- **AND** on confirmation, calls `initializeMortgageOwnership` action
- **AND** creates 100 share tokens for FairLend
- **AND** displays success or error toast
- **AND** refreshes the mortgage list

#### Scenario: Emit audit event on minting
- **GIVEN** admin mints mortgage ownership
- **WHEN** the minting succeeds
- **THEN** the system emits a `MORTGAGE_OWNERSHIP_MINTED` audit event
- **AND** includes: mortgageId, admin user, timestamp

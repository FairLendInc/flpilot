# Ledger View Admin Dashboard - Design Document

## Overview

This document captures architectural decisions for the Ledger View admin dashboard section. The feature provides comprehensive visibility into Formance Ledger state across multiple ledgers, with special focus on investor account provisioning and mortgage ownership management.

## Architecture Decisions

### 1. Route Structure

**Decision**: Create a new top-level admin section at `/dashboard/admin/ledger` rather than nesting under MIC Management.

**Rationale**:
- Ledger operations are not MIC-specific; they span the entire platform
- The ownership transfer workflow uses `flpilot` ledger, not the MIC ledger
- Clean separation of concerns allows future expansion
- Matches the existing pattern of other admin sections (Deals, Listings, etc.)

**Structure**:
```
/dashboard/admin/ledger
├── layout.tsx           # Header with ledger selector
├── page.tsx             # Redirects to /accounts
├── accounts/
│   └── page.tsx         # Account balances view
├── transactions/
│   └── page.tsx         # Transaction history
├── investors/
│   └── page.tsx         # Investor account status
└── mortgages/
    └── page.tsx         # Mortgage ownership view
```

### 2. Ledger Selection State

**Decision**: Use URL search params for ledger selection with localStorage fallback.

**Rationale**:
- URL params enable shareable links to specific ledger views
- localStorage remembers last selection across sessions
- Layout component manages state, passes to children via context

**Implementation**:
```typescript
// LedgerProvider context
const [selectedLedger, setSelectedLedger] = useState<string>(() => {
  const urlParam = searchParams.get('ledger');
  const stored = localStorage.getItem('admin_ledger_selection');
  return urlParam || stored || 'flpilot';  // Default ledger
});
```

### 3. Data Fetching Pattern

**Decision**: Use Convex actions for all Formance API calls, with client-side caching.

**Rationale**:
- Formance API calls must be in actions, not mutations (footguns.md #3)
- `useAction` with manual refetch for data that changes infrequently
- Consider React Query wrapper for automatic stale-while-revalidate

**Pattern**:
```typescript
// In component
const listAccounts = useAction(api.ledger.listAccounts);
const [accounts, setAccounts] = useState<Account[]>([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  async function fetch() {
    const result = await listAccounts({ ledgerName: selectedLedger });
    if (result.success) setAccounts(result.data);
    setIsLoading(false);
  }
  fetch();
}, [selectedLedger]);
```

### 4. Account Namespace Grouping

**Decision**: Parse account addresses to extract namespace prefix for grouping.

**Account Patterns**:
| Pattern | Namespace | Example |
|---------|-----------|---------|
| `fairlend:*` | `fairlend` | `fairlend:inventory` |
| `investor:{userId}:*` | `investor` | `investor:abc123:inventory` |
| `mortgage:{mortgageId}:*` | `mortgage` | `mortgage:xyz789:issuance` |
| `mic:{micId}:*` | `mic` | `mic:FLMIC:cash` |
| `@world` | `world` | `@world` |

**Implementation**:
```typescript
function getNamespace(address: string): string {
  if (address.startsWith('@')) return 'system';
  const colonIndex = address.indexOf(':');
  return colonIndex > 0 ? address.slice(0, colonIndex) : 'other';
}
```

### 5. Investor Account Provisioning

**Decision**: Create a new action `provisionInvestorAccounts` that creates required accounts.

**Required Accounts Per Investor** (from ownership transfer workflow):
- `investor:{userId}:inventory` - Holds share tokens

**Future Accounts** (deferred):
- `investor:{userId}:cash` - CAD cash balance
- `investor:{userId}:proceeds` - Distribution proceeds

**Provisioning Script**:
```numscript
vars {
  account $inventory
}

// Account is created implicitly when first touched
// We create a zero-balance entry via metadata update
```

**Note**: Formance accounts are created implicitly on first transaction. "Provisioning" may simply mean recording that the account is expected in our system.

### 6. Mortgage Ownership Minting

**Decision**: Reuse existing `initializeMortgageOwnership` action from ownership transfer workflow.

**Flow**:
1. Query all mortgages from Convex
2. Query ownership snapshot from Formance via `getOwnershipSnapshot`
3. Compare: mortgages without ledger entries are "not minted"
4. Admin clicks "Mint" → calls `initializeMortgageOwnership`
5. Creates 100% FairLend ownership in ledger

**Idempotency**:
- Reference format: `init:mint-ui:{mortgageId}:{timestamp}`
- Duplicate mints return success (409 conflict handled gracefully)

### 7. Component Reuse

**Decision**: Create reusable components that could be used in MIC section as well.

**Shared Components**:
- `TransactionCard` - Already similar to existing MIC ledger display
- `OwnershipBar` - Reuse from `OwnershipTransferReview`
- `AccountsTable` - New, can be used for MIC-specific accounts too

**Prop Patterns**:
```typescript
// Filter/scope via props, not separate components
<AccountsTable 
  ledger={selectedLedger}
  filter={{ namespace: 'investor' }}
/>

<TransactionList
  ledger={selectedLedger}
  pageSize={50}
/>
```

## Security Considerations

### Access Control

- All routes require admin role (enforced by middleware)
- Ledger actions use Formance client credentials (server-side)
- No PII in transaction metadata (enforced by audit patterns)

### Audit Trail

- All provisioning/minting actions emit audit events
- Event types: `investor_accounts_provisioned`, `mortgage_ownership_minted`
- Events include: userId, mortgageId, timestamp, admin user

## Performance Considerations

### Pagination

- Accounts: Use cursor-based pagination from Formance API
- Transactions: Use cursor-based pagination, default 50 per page
- Consider virtual scrolling for large account lists

### Caching

- Ledger list: Cache for session (rarely changes)
- Account balances: Refresh on tab focus or explicit refresh
- Ownership snapshot: Expensive action, cache for 5 minutes

## Trade-offs

| Decision | Pros | Cons |
|----------|------|------|
| Separate section (not under MIC) | Clean separation, multi-ledger | More navigation items |
| URL-based ledger selection | Shareable, bookmarkable | Extra complexity |
| Server-side Formance calls | Secure, no token exposure | Slower than direct API |
| Implicit account creation | Simple, matches Formance model | Less explicit control |

## Open Questions

1. **Ledger default**: Should we auto-detect the "primary" ledger or always default to `flpilot`?
2. **Account provisioning**: Do we need actual account creation, or just tracking in Convex?
3. **Real-time updates**: Should we poll for transaction updates or is manual refresh sufficient?

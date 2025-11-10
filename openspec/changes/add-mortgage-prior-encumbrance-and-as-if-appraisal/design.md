# Design: Prior Encumbrance and As-If Appraisal Support

## Architecture Overview

This change spans four layers of the application:
1. **Schema Layer**: Add `asIf` field to comparables table
2. **Backend Layer**: Add validators and mutation support
3. **State Management**: Extend admin form store
4. **UI Layer**: Add form sections and display components

## Design Decisions

### 1. Schema Changes

#### Decision: Add `asIf` boolean to `appraisal_comparables`
**Rationale**:
- Enables filtering comparables into as-is vs as-if sections
- Backward compatible (optional field, defaults to false/undefined = as-is)
- Minimal schema change, maximum flexibility
- Allows same mortgage to have both types of comparables

**Alternatives Considered**:
- Create separate `as_if_comparables` table → Rejected: unnecessary duplication
- Add `appraisalType` enum → Rejected: overkill for binary choice
- Link comparables to appraisal documents → Rejected: too complex for MVP

**Schema Definition**:
```typescript
asIf: v.optional(v.boolean())
```

#### Decision: No changes to `mortgages` schema
**Rationale**:
- `priorEncumbrance` and `asIfAppraisal` already defined correctly
- Schema matches requirements exactly
- No migration needed

### 2. Validation Strategy

#### Decision: Conditional validation based on field presence
**Rationale**:
- Optional fields should not cause errors when absent
- When present, must be complete and valid
- Prevents partial data corruption

**Validation Rules**:
```typescript
priorEncumbrance (if present):
  - amount > 0 (number)
  - lender non-empty (string)

asIfAppraisal (if present):
  - marketValue > 0 (number)
  - method non-empty (string)
  - company non-empty (string)
  - date valid ISO date string
```

**Implementation Location**:
- Client-side: `useMortgageUpdateStore.validate()`
- Server-side: Convex mutation validators in `convex/mortgages.ts`

### 3. UI/UX Patterns

#### Decision: Toggle-based optional sections
**Rationale**:
- Reduces cognitive load for simple mortgages (common case)
- Makes optional nature explicit
- Familiar pattern from existing UI
- Easy to add/remove without data loss

**Flow**:
1. Default state: "Add Prior Encumbrance" button visible
2. User clicks → Form fields appear + "Remove" button
3. User fills fields → Validation on save
4. User clicks "Remove" → Data cleared, returns to button state

**Visual Design**:
- Prior Encumbrance: Red/pink theme (matches existing in financial metrics)
- As-If Appraisal: Blue/cyan theme (differentiation)
- Icons: shield-alert for prior encumbrance, building for as-if appraisal

#### Decision: Mirror as-is/as-if comparables sections
**Rationale**:
- Consistency reduces learning curve
- Users understand pattern immediately
- Same component, just filtered data
- Clear visual separation with headings

**Section Structure**:
```
┌─ As-Is Appraisal Comparables ────────────────┐
│ [Comparable cards filtered by !asIf]          │
└───────────────────────────────────────────────┘

┌─ As-If Complete Appraisal Comparables ───────┐
│ [Comparable cards filtered by asIf === true]  │
│ [Only renders if as-if comparables exist]     │
└───────────────────────────────────────────────┘
```

### 4. State Management

#### Decision: Extend Zustand store with optional fields
**Rationale**:
- Consistent with existing pattern
- Centralized validation logic
- Type-safe state updates
- Easy integration with existing form

**Store Shape**:
```typescript
{
  priorEncumbrance: { amount: number; lender: string } | null
  asIfAppraisal: {
    marketValue: number;
    method: string;
    company: string;
    date: string
  } | null
}
```

**Methods**:
- `setPriorEncumbrance(data | null)` - Toggle add/remove
- `setAsIfAppraisal(data | null)` - Toggle add/remove
- `loadFromMortgage(mortgage)` - Populate from existing data
- `validate()` - Updated with new conditional rules

### 5. Backend Integration

#### Decision: Add fields to `mortgageDetailsFields` validator
**Rationale**:
- Centralizes validation logic
- Used by both create and update mutations
- Type-safe with Convex validators
- Automatic TypeScript type generation

**Validator Structure**:
```typescript
priorEncumbrance: v.optional(v.object({
  amount: v.number(),
  lender: v.string(),
})),
asIfAppraisal: v.optional(v.object({
  marketValue: v.number(),
  method: v.string(),
  company: v.string(),
  date: v.string(),
}))
```

### 6. Display Logic

#### Decision: Conditional rendering in financial metrics
**Rationale**:
- Only show sections when data exists
- Prevents empty/confusing UI
- Consistent with existing prior encumbrance display
- Clear visual hierarchy

**Financial Metrics Layout**:
```
┌─ Key Financials ─────────────────┐
│ [Existing metrics]                │
│ [Prior Encumbrance (if present)]  │ ← Already implemented
│ [As-If Appraisal (if present)]    │ ← New section
└───────────────────────────────────┘
```

**As-If Appraisal Card Fields**:
- Market Value: `$XXX,XXX` (formatted currency)
- Method: Free text (e.g., "Sales Comparison Approach")
- Company: Free text (e.g., "ABC Appraisal Group")
- Date: Formatted date (e.g., "March 15, 2024")

### 7. Data Flow

#### Decision: Top-down data flow from Convex to UI
**Rationale**:
- Leverages Convex reactivity
- Single source of truth
- Automatic UI updates on data changes
- Type-safe end-to-end

**Flow Diagram**:
```
Convex DB (mortgages table)
  ↓ (reactive query)
Admin Page (server preload)
  ↓ (props)
Client Component (usePreloadedQuery)
  ↓ (state)
MortgageUpdateSheet (Zustand store)
  ↓ (form state)
Form Fields (controlled inputs)
  ↓ (user edits)
useMortgageUpdateStore.validate()
  ↓ (if valid)
Convex Mutation (updateMortgage)
  ↓ (DB write)
Convex DB (updated)
  ↓ (reactive propagation)
UI Updates (automatic)
```

### 8. Mock Data Generation

#### Decision: 20% chance for as-if appraisal, 30% chance for prior encumbrance
**Rationale**:
- Prior encumbrance more common (2nd/3rd position mortgages)
- As-if appraisal less common (construction/renovation loans)
- Ensures good test coverage
- Realistic distribution

**As-If Appraisal Data**:
- Market Value: Current value × (1.10 to 1.20) [10-20% higher]
- Method: Random from ["Cost Approach", "Sales Comparison", "Income Approach"]
- Company: Random appraisal company names
- Date: Within last 6 months

**As-If Comparables**:
- When mortgage has as-if appraisal, 30% of comparables should have `asIf: true`
- Ensures test data shows both sections

## Error Handling

### Client-Side Validation Errors
**Display**: Inline below each field with red text
**Behavior**: Prevent form submission, focus first error

**Example Messages**:
- "Prior encumbrance amount must be greater than 0"
- "Lender name is required when prior encumbrance is specified"
- "Market value must be greater than 0"
- "Appraisal date is required"

### Server-Side Mutation Errors
**Display**: Toast notification (sonner)
**Behavior**: Log error, show user-friendly message

**Example**:
```typescript
try {
  await updateMortgage({ ... })
  toast.success("Mortgage updated successfully")
} catch (error) {
  logger.error("Failed to update mortgage", { error })
  toast.error("Failed to save changes. Please try again.")
}
```

## Testing Strategy

### Unit Tests
1. **Validation logic**: Test conditional validation rules
2. **Store methods**: Test setPriorEncumbrance, setAsIfAppraisal
3. **Data formatting**: Test currency, date formatting

### Integration Tests
1. **Mutation testing**: Test backend with optional fields present/absent
2. **Query testing**: Test comparables filtering by asIf flag

### Storybook Stories
1. **Prior Encumbrance Form**: Default, filled, error states
2. **As-If Appraisal Form**: Default, filled, error states
3. **Financial Metrics**: With/without prior encumbrance, with/without as-if appraisal
4. **Comparables Sections**: As-is only, both sections, edge cases

### Manual Testing Checklist
- [ ] Create mortgage without optional fields
- [ ] Add prior encumbrance, validate amount and lender
- [ ] Add as-if appraisal, validate all fields
- [ ] Edit existing mortgage with both fields
- [ ] Remove optional fields (should not cause errors)
- [ ] Verify display in financial metrics
- [ ] Verify comparables section separation
- [ ] Test with mock data

## Performance Considerations

### Query Performance
- **Impact**: Minimal (comparables already queried)
- **Optimization**: Filter by `asIf` field in memory (fast for typical 3-10 comparables)
- **Indexing**: No new index needed (small result set)

### UI Performance
- **Impact**: Minimal (conditional rendering)
- **Optimization**: React Compiler auto-optimizes
- **Bundle Size**: No new dependencies

## Security Considerations

### Authorization
- **Admin-only**: All mutations require admin role
- **Validation**: Server-side validation prevents malicious data
- **Audit**: Existing audit logging captures all changes

### Data Integrity
- **Optional fields**: Cannot corrupt existing data
- **Validation**: Prevents partial or invalid data
- **Backward compatibility**: Existing mortgages work unchanged

## Migration Strategy

### No Migration Required ✅
- Schema fields already exist
- Optional fields default to undefined
- Existing data remains valid
- New features opt-in

## Rollback Plan

### If Issues Arise:
1. **Backend**: Remove validators (keeps data, hides UI)
2. **UI**: Hide form sections and display cards
3. **Data**: Optionally clear fields via mutation (data cleanup)
4. **Schema**: Fields remain optional, can deprecate later

### Risk Level: **LOW**
- All changes are additive
- No breaking changes
- Easy to disable UI without data loss

## Future Enhancements

### Out of Scope for This Change:
1. **Automated prior encumbrance lookup** from public records
2. **Historical appraisal tracking** (multiple as-if appraisals over time)
3. **Subordination agreement storage** for prior liens
4. **Automated comparable classification** (ML-based as-is vs as-if detection)
5. **Construction draw tracking** linked to as-if appraisals
6. **Prior encumbrance payment tracking** (integrated with payments table)

These can be added later as separate changes without breaking this implementation.

## Appendix: File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `convex/schema.ts` | MODIFY | Add `asIf` to appraisal_comparables |
| `convex/mortgages.ts` | MODIFY | Add validators, update mutation |
| `useMortgageUpdateStore.ts` | MODIFY | Add fields, methods, validation |
| `MortgageUpdateSheet.tsx` | MODIFY | Add form sections (2 tabs) |
| `financial-metrics.tsx` | MODIFY | Add as-if appraisal card |
| `[comparables-component].tsx` | MODIFY | Split into as-is/as-if sections |
| `lib/mock-data/listings.ts` | MODIFY | Generate new fields |

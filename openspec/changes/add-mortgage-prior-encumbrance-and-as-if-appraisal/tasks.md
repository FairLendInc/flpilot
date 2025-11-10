# Tasks: Add Mortgage Prior Encumbrance and As-If Appraisal Support

## Phase 1: Schema & Backend (Foundation)

### Task 1.1: Add `asIf` field to appraisal_comparables schema
**File**: `convex/schema.ts`
- [ ] Add `asIf: v.optional(v.boolean())` to `appraisal_comparables` table definition
- [ ] Verify schema compiles without errors
- [ ] Run `npx convex dev` to deploy schema changes

**Verification**: Schema deploys successfully, no TypeScript errors.

---

### Task 1.2: Add validators for priorEncumbrance and asIfAppraisal
**File**: `convex/mortgages.ts`
- [ ] Add `priorEncumbrance` validator to `mortgageDetailsFields` object around line 58-77
- [ ] Add `asIfAppraisal` validator to `mortgageDetailsFields` object
- [ ] Both should use `v.optional(v.object({...}))` pattern
- [ ] Include all required subfields with appropriate v.number() and v.string() validators

**Verification**: Run `pnpm run check-types`, no errors. Convex deploys successfully.

---

### Task 1.3: Verify updateMortgage mutation includes new fields
**File**: `convex/mortgages.ts`
- [ ] Check that `updateMortgage` mutation (line 762+) args include validators from `mortgageDetailsFields`
- [ ] Confirm both new fields are passed through to `updateMortgageCore` helper
- [ ] Verify no additional changes needed (should work automatically via validators)

**Verification**: Inspect mutation args, confirm fields are included. No build errors.

---

## Phase 2: State Management (Admin Forms)

### Task 2.1: Add fields to useMortgageUpdateStore type
**File**: `app/(auth)/dashboard/admin/mortgages/manage/useMortgageUpdateStore.ts`
- [ ] Add to store type: `priorEncumbrance: { amount: number; lender: string } | null`
- [ ] Add to store type: `asIfAppraisal: { marketValue: number; method: string; company: string; date: string } | null`

**Verification**: TypeScript compiles without errors.

---

### Task 2.2: Update createInitialMortgage() with default values
**File**: `app/(auth)/dashboard/admin/mortgages/manage/useMortgageUpdateStore.ts`
- [ ] Set `priorEncumbrance: null` in default state
- [ ] Set `asIfAppraisal: null` in default state

**Verification**: Form loads without errors, fields initialize as null.

---

### Task 2.3: Update loadFromMortgage() to map new fields
**File**: `app/(auth)/dashboard/admin/mortgages/manage/useMortgageUpdateStore.ts`
- [ ] Add mapping for `priorEncumbrance: mortgage.priorEncumbrance ?? null`
- [ ] Add mapping for `asIfAppraisal: mortgage.asIfAppraisal ?? null`

**Verification**: Editing existing mortgage loads fields correctly. Test with mock data.

---

### Task 2.4: Add setter functions for new fields
**File**: `app/(auth)/dashboard/admin/mortgages/manage/useMortgageUpdateStore.ts`
- [ ] Add `setPriorEncumbrance: (data: { amount: number; lender: string } | null) => void`
- [ ] Add `setAsIfAppraisal: (data: { marketValue: number; method: string; company: string; date: string } | null) => void`
- [ ] Implement setters to update store state

**Verification**: Call setters, verify state updates correctly.

---

### Task 2.5: Add validation rules for new fields
**File**: `app/(auth)/dashboard/admin/mortgages/manage/useMortgageUpdateStore.ts`
- [ ] Update `validate()` function to check priorEncumbrance if present:
  - `amount > 0` → error: "Prior encumbrance amount must be greater than 0"
  - `lender` non-empty → error: "Lender name is required"
- [ ] Add validation for asIfAppraisal if present:
  - `marketValue > 0` → error: "Market value must be greater than 0"
  - `method` non-empty → error: "Appraisal method is required"
  - `company` non-empty → error: "Appraisal company is required"
  - `date` non-empty → error: "Appraisal date is required"

**Verification**: Test form validation with invalid data, verify errors appear correctly.

---

## Phase 3: Admin UI Components (Form Sections)

### Task 3.1: Add Prior Encumbrance section to Loan Details tab
**File**: `components/admin/mortgages/MortgageUpdateSheet.tsx`
- [ ] Locate "Loan Details" tab content
- [ ] Add "Prior Encumbrance" section after existing loan fields
- [ ] Implement toggle pattern:
  - Show "Add Prior Encumbrance" button when `priorEncumbrance === null`
  - Show form fields + "Remove" button when `priorEncumbrance !== null`
- [ ] Add Amount field (number input, currency formatted)
- [ ] Add Lender field (text input)
- [ ] Wire up to `useMortgageUpdateStore` state
- [ ] Display validation errors below each field

**Verification**: Open admin form, test add/remove prior encumbrance. Verify state updates and validation works.

---

### Task 3.2: Add As-If Appraisal section to Property Info tab
**File**: `components/admin/mortgages/MortgageUpdateSheet.tsx`
- [ ] Locate "Property Info" tab content
- [ ] Add "As-If Complete Appraisal" section after existing property fields
- [ ] Implement toggle pattern:
  - Show "Add As-If Complete Appraisal" button when `asIfAppraisal === null`
  - Show form fields + "Remove" button when `asIfAppraisal !== null`
- [ ] Add Market Value field (number input, currency formatted)
- [ ] Add Method field (text input)
- [ ] Add Company field (text input)
- [ ] Add Date field (date picker component)
- [ ] Add helper text: "Appraisal value if property improvements are completed"
- [ ] Wire up to `useMortgageUpdateStore` state
- [ ] Display validation errors below each field

**Verification**: Open admin form, test add/remove as-if appraisal. Verify all fields work correctly, date picker functions.

---

## Phase 4: Financial Metrics Display

### Task 4.1: Update FinancialMetricsProps type
**File**: `components/listing-detail/financial-metrics.tsx`
- [ ] Add to `financials` type (around lines 8-26):
  ```typescript
  asIfAppraisal?: {
    marketValue: number;
    method: string;
    company: string;
    date: string;
  } | null;
  ```

**Verification**: TypeScript compiles without errors.

---

### Task 4.2: Add As-If Appraisal display card
**File**: `components/listing-detail/financial-metrics.tsx`
- [ ] Find location after prior encumbrance card (around line 368)
- [ ] Add conditional render: `{financials.asIfAppraisal && (...)}`
- [ ] Create 2-column card layout matching prior encumbrance style
- [ ] Use blue/cyan theme colors (differentiate from red/pink prior encumbrance)
- [ ] Add icon: building or file-check from lucide-react
- [ ] Display fields:
  - Market Value: formatted as currency (`formatCurrency(asIfAppraisal.marketValue)`)
  - Method: as-is text
  - Company: as-is text
  - Date: formatted date (`format(parseISO(asIfAppraisal.date), 'MMMM d, yyyy')`)

**Verification**: View listing detail with mock data, verify card displays correctly with proper formatting and styling.

---

## Phase 5: Comparables Section Split

### Task 5.1: Find comparables display component
**Goal**: Locate where comparables are currently displayed
- [ ] Search codebase for comparable card rendering (likely in listing-detail area)
- [ ] Identify component file path
- [ ] Document current structure for modification

**Verification**: Component file identified, rendering logic understood.

---

### Task 5.2: Add "As-Is Appraisal Comparables" heading
**File**: [Component identified in Task 5.1]
- [ ] Above existing comparables display, add section heading: "As-Is Appraisal Comparables"
- [ ] Filter comparables: `comparables.filter(c => !c.asIf)`
- [ ] Maintain existing card layout and styling
- [ ] Order by distance ascending (existing pattern)

**Verification**: As-is section displays with heading, shows only comparables where asIf is false/undefined.

---

### Task 5.3: Add "As-If Complete Appraisal Comparables" section
**File**: [Component identified in Task 5.1]
- [ ] Below as-is section, add conditional section: `{asIfComparables.length > 0 && (...)}`
- [ ] Add section heading: "As-If Complete Appraisal Comparables"
- [ ] Filter comparables: `comparables.filter(c => c.asIf === true)`
- [ ] Mirror as-is section layout exactly
- [ ] Order by distance ascending
- [ ] Only render if as-if comparables exist

**Verification**: View listing with mock as-if comparables, verify both sections display correctly. Verify section hidden when no as-if comparables.

---

### Task 5.4: Update backend comparables query (if needed)
**Goal**: Ensure `asIf` field is returned in queries
- [ ] Check comparables query function (likely in `convex/comparables.ts` or similar)
- [ ] Verify `asIf` field is included in query results (should be automatic if schema is updated)
- [ ] Test query returns field correctly

**Verification**: Query results include `asIf` field. TypeScript types are correct.

---

## Phase 6: Mock Data Updates

### Task 6.1: Add asIfAppraisal to mock mortgage generation
**File**: `lib/mock-data/listings.ts`
- [ ] Find mortgage object creation (around line 200+)
- [ ] Add asIfAppraisal generation with 20% chance:
  ```typescript
  asIfAppraisal: Math.random() < 0.2 ? {
    marketValue: currentValue * (1.1 + Math.random() * 0.1), // 10-20% higher
    method: faker.helpers.arrayElement(['Cost Approach', 'Sales Comparison', 'Income Approach']),
    company: `${faker.company.name()} Appraisal`,
    date: faker.date.recent({ days: 180 }).toISOString(),
  } : undefined
  ```

**Verification**: Generate mock data, verify ~20% of mortgages have asIfAppraisal.

---

### Task 6.2: Add asIf field to mock comparables generation
**File**: `lib/mock-data/listings.ts`
- [ ] Find comparables generation code (around line 223+)
- [ ] Add `asIf` field to each comparable:
  ```typescript
  asIf: mortgage.asIfAppraisal && Math.random() < 0.3, // 30% chance if as-if appraisal exists
  ```
- [ ] Only set `asIf: true` if mortgage has `asIfAppraisal`

**Verification**: Generate mock data, verify comparables have `asIf` field. When mortgage has as-if appraisal, ~30% of comparables should have `asIf: true`.

---

## Phase 7: Testing & Validation

### Task 7.1: Type checking
- [ ] Run `pnpm run check-types`
- [ ] Resolve any TypeScript errors

**Verification**: Zero type errors reported.

---

### Task 7.2: Linting and formatting
- [ ] Run `npx biome check`
- [ ] Fix any linting issues

**Verification**: Zero linting errors reported.

---

### Task 7.3: Manual testing - Prior Encumbrance
- [ ] Create new mortgage without prior encumbrance → saves successfully
- [ ] Edit mortgage, add prior encumbrance → displays in financial metrics
- [ ] Try invalid data (negative amount, empty lender) → validation errors show
- [ ] Remove prior encumbrance → card disappears from financial metrics
- [ ] Edit existing mortgage with prior encumbrance → loads correctly in form

**Verification**: All scenarios work as expected, no console errors.

---

### Task 7.4: Manual testing - As-If Appraisal
- [ ] Create new mortgage without as-if appraisal → saves successfully
- [ ] Edit mortgage, add as-if appraisal → displays in financial metrics
- [ ] Try invalid data (negative market value, empty fields) → validation errors show
- [ ] Remove as-if appraisal → card disappears from financial metrics
- [ ] Edit existing mortgage with as-if appraisal → loads correctly in form
- [ ] Test date picker functionality

**Verification**: All scenarios work as expected, no console errors.

---

### Task 7.5: Manual testing - Comparables Section Split
- [ ] View listing with only as-is comparables → only as-is section displays
- [ ] View listing with both types → both sections display with correct headings
- [ ] Verify comparables filter correctly to appropriate sections
- [ ] Verify visual separation is clear

**Verification**: Comparables display in correct sections, layout mirrors between sections.

---

### Task 7.6: Build verification
- [ ] Run `pnpm run build`
- [ ] Verify build completes without errors
- [ ] Check bundle size (should not increase significantly)

**Verification**: Production build succeeds, no warnings or errors.

---

### Task 7.7: Mock data verification
- [ ] Generate fresh mock data with `pnpm run [generate-mock-command]`
- [ ] Verify ~20% of mortgages have asIfAppraisal
- [ ] Verify ~30% of prior encumbrance exists on mortgages
- [ ] Verify comparables have asIf field appropriately set
- [ ] View multiple listings to see variety of configurations

**Verification**: Mock data generates correctly with expected distributions.

---

## Phase 8: Documentation & Cleanup

### Task 8.1: Update implementation plan status
**File**: `Implementation-plan-Prior-Encomberance-as-if-appraisal-support.md`
- [ ] Mark completed phases
- [ ] Document any deviations from plan
- [ ] Note any issues encountered and resolutions

**Verification**: Documentation is up to date.

---

### Task 8.2: Verify all success criteria
**Check against proposal.md**:
- [ ] Admin can add/edit/remove prior encumbrance via UI
- [ ] Admin can add/edit/remove as-if appraisal via UI
- [ ] Prior encumbrance displays in financial metrics when present
- [ ] As-if appraisal displays in financial metrics when present
- [ ] Comparables split into as-is and as-if sections
- [ ] Validation prevents invalid data
- [ ] All type checks pass
- [ ] Existing mortgages without these fields continue to work
- [ ] Mock data generates realistic test cases

**Verification**: All criteria met.

---

## Dependency Notes

**Can be parallelized**:
- Phase 1 (Schema & Backend) - all tasks can run in parallel after Task 1.1
- Phase 2 (State Management) - tasks 2.1-2.4 can run in parallel, 2.5 depends on 2.1-2.4
- Phase 4 (Financial Metrics) - both tasks can run in parallel
- Phase 6 (Mock Data) - both tasks can run in parallel

**Sequential dependencies**:
- Phase 3 requires Phase 2 complete (needs store)
- Phase 5 requires Phase 1 complete (needs schema with asIf field)
- Phase 7 requires all previous phases complete

**Estimated time**: 6-8 hours total for all phases.

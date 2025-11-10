Implementation Plan: Prior Encumbrance & As-If Appraisal Support
Overview
Add full CRUD support for prior encumbrance and as-if appraisal fields in the mortgage admin interface, with enhanced display in financial metrics and separate comparable sections for as-is vs as-if appraisals.
Phase 1: Schema Updates
File: convex/schema.ts
✅ Prior encumbrance already defined (lines 235-238)
✅ As-if appraisal already defined (lines 253-258)
➕ Add asIf: v.optional(v.boolean()) field to appraisals table
Used to differentiate as-is vs as-if comparables
Default false/undefined = as-is appraisal
Phase 2: Backend Validation & Mutations
File: convex/mortgages.ts
Add to validators (around line 58-77):
Add priorEncumbrance to mortgageDetailsFields
Add asIfAppraisal to mortgageDetailsFields
Update updateMortgage mutation (line 762+):
Ensure both fields are in args validator
Pass through to updateMortgageCore
Phase 3: Admin Edit Interface - State Management
File: app/(auth)/dashboard/admin/mortgages/manage/useMortgageUpdateStore.ts
Add to store type:
priorEncumbrance: { amount: number; lender: string } | null
asIfAppraisal: { marketValue: number; method: string; company: string; date: string } | null
Update createInitialMortgage():
Set both to null as default
Update loadFromMortgage():
Map priorEncumbrance from mortgage data
Map asIfAppraisal from mortgage data
Add setter functions:
setPriorEncumbrance(data | null) - toggle add/remove
setAsIfAppraisal(data | null) - toggle add/remove
Update validate():
If priorEncumbrance exists:
amount must be > 0
lender must be non-empty string
Phase 4: Admin Edit Interface - UI Components
File: components/admin/mortgages/MortgageUpdateSheet.tsx
A. Prior Encumbrance (Loan Details Tab)
Add section after existing loan fields:
When hidden (default):
Button: "Add Prior Encumbrance" with plus icon
When visible:
Section heading: "Prior Encumbrance"
Amount field (number input, currency formatted)
Lender field (text input)
Remove button
Validation errors displayed below fields
B. As-If Appraisal (Property Info Tab)
Add section after existing property fields:
When hidden (default):
Button: "Add As-If Complete Appraisal" with plus icon
When visible:
Section heading: "As-If Complete Appraisal"
Market Value field (number input, currency formatted)
Method field (text input)
Company field (text input)
Date field (date picker component)
Remove button
Helper text: "Appraisal value if property improvements are completed"
Phase 5: Financial Metrics Display
File: components/listing-detail/financial-metrics.tsx
Update type definition (lines 8-26):
Add asIfAppraisal to financials type:
asIfAppraisal?: {
  marketValue: number;
  method: string;
  company: string;
  date: string;
} | null;
Add As-If Appraisal card (after prior encumbrance section):
Conditional render: {financials.asIfAppraisal && (...)}
2-column card layout matching prior encumbrance style
Blue/cyan theme (to differentiate from prior encumbrance's red/pink)
Icon: building or file-check
Display fields:
Market Value (formatted currency)
Appraisal Method
Appraisal Company
Appraisal Date (formatted)
Phase 6: Comparables Sections (Major Feature)
Current State: Single comparables section showing all appraisals New State: Two separate sections based on asIf field
Files to Modify:
Find and update the comparables display component (likely in listing-detail or similar)
Changes:
As-Is Appraisal Section:
Add heading: "As-Is Appraisal Comparables"
Filter: comparables.filter(c => !c.asIf)
Keep all existing styling/layout
As-If Appraisal Section (NEW):
Add heading: "As-If Complete Appraisal Comparables"
Filter: comparables.filter(c => c.asIf === true)
Conditionally render only if as-if comparables exist
Mirror exact layout/styling of as-is section
Same component, just filtered data
Update backend queries:
Ensure appraisal queries return asIf field
Update any joins or data fetching logic
Phase 7: Mock Data Updates
File: lib/mock-data/listings.ts
Add asIfAppraisal generation (around line 236):
20% chance to include as-if appraisal
Generate realistic data:
Market value: 10-20% higher than current value
Method: random from ["Cost Approach", "Sales Comparison", "Income Approach"]
Company: random appraisal company name
Date: within last 6 months
Update appraisals generation:
Add asIf: boolean to generated comparables
30% of comparables should be as-if (when as-if appraisal exists)
Phase 8: Testing & Validation
Manual Testing Checklist:
✓ Create mortgage without optional fields
✓ Add prior encumbrance, validate errors
✓ Add as-if appraisal, validate all fields
✓ Edit existing mortgage with both fields
✓ Remove optional fields
✓ Verify display in financial metrics
✓ Verify comparables section separation
✓ Test with mock data
Type Safety:
Run pnpm run check-types after changes
Build Verification:
Run pnpm run build to ensure no runtime errors
Implementation Order
Schema (convex/schema.ts) - Add asIf field
Backend (convex/mortgages.ts) - Add validators
State Management (useMortgageUpdateStore.ts) - Add fields & logic
UI Form (MortgageUpdateSheet.tsx) - Add form sections
Financial Display (financial-metrics.tsx) - Add as-if card
Comparables Sections - Split into as-is/as-if
Mock Data (listings.ts) - Add generation
Testing - Verify all functionality
Key Design Decisions
★ Insight ─────────────────────────────────────
Optional by default: Both features hidden until user adds them, reducing cognitive load for simple mortgages
Validation on presence: Only validate if user has added the fields, avoiding unnecessary errors
Mirrored UI patterns: As-if appraisal section mirrors as-is section for consistency and familiarity
Schema-driven filtering: Using asIf boolean on comparables enables clean separation without changing existing data ─────────────────────────────────
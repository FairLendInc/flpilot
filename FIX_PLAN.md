# Onboarding Fixes - Implementation Plan

## Overview
This document outlines the changes needed to fix three issues in the onboarding workflow:
1. Split "Legal Name" into First/Middle/Last Name fields
2. Remove Contact Email field (use authenticated email instead)
3. Fix step progress tracking to show completed steps when in "Pending Admin" state

---

## Issue #1: Split Legal Name into First/Middle/Last Name

### Impact Analysis
- **Schema Changes**: Modify `onboarding_journeys.context.investor.profile`
- **Frontend Components**: Update profile form and review step
- **Backend Validators**: Update validation logic
- **Tests**: Update all test fixtures
- **Migration**: No migration needed (new field structure, backward compatible reads)

### Changes Required

#### 1. Database Schema (`convex/schema.ts`)
**File**: `flpilot/convex/schema.ts` (Lines ~130-140)

```typescript
// BEFORE
profile: v.optional(
  v.object({
    legalName: v.string(),
    entityType: v.union(...),
    contactEmail: v.string(),
    phone: v.optional(v.string()),
  })
)

// AFTER
profile: v.optional(
  v.object({
    firstName: v.string(),
    middleName: v.optional(v.string()),
    lastName: v.string(),
    entityType: v.union(...),
    // contactEmail removed (see Issue #2)
    phone: v.optional(v.string()),
  })
)
```

#### 2. Backend Validator (`convex/onboarding.ts`)
**File**: `flpilot/convex/onboarding.ts` (Lines ~23-30)

```typescript
// BEFORE
const investorProfileValidator = v.object({
  legalName: v.string(),
  entityType: v.union(...),
  contactEmail: v.string(),
  phone: v.optional(v.string()),
});

// AFTER
const investorProfileValidator = v.object({
  firstName: v.string(),
  middleName: v.optional(v.string()),
  lastName: v.string(),
  entityType: v.union(...),
  // contactEmail removed (see Issue #2)
  phone: v.optional(v.string()),
});
```

#### 3. TypeScript Types (`components/onboarding/OnboardingExperience.tsx`)
**File**: `flpilot/components/onboarding/OnboardingExperience.tsx` (Lines ~123-128)

```typescript
// BEFORE
type InvestorProfileValues = {
  legalName: string;
  entityType: (typeof ENTITY_TYPES)[number];
  contactEmail: string;
  phone?: string;
};

// AFTER
type InvestorProfileValues = {
  firstName: string;
  middleName?: string;
  lastName: string;
  entityType: (typeof ENTITY_TYPES)[number];
  // contactEmail removed (see Issue #2)
  phone?: string;
};
```

#### 4. Profile Form Component (`components/onboarding/OnboardingExperience.tsx`)
**File**: `flpilot/components/onboarding/OnboardingExperience.tsx` (Lines ~580-680)

**Updates needed**:
- Replace single "Legal Name" input with three fields: First Name, Middle Name (optional), Last Name
- Update form state initialization
- Update validation logic to check firstName && lastName (instead of legalName && contactEmail)
- Use grid layout: First Name (full width), Middle Name + Last Name (2 columns)

```typescript
// Form initialization
const [formValues, setFormValues] = useState<InvestorProfileValues>(
  defaultValues ?? {
    firstName: "",
    middleName: "",
    lastName: "",
    entityType: "individual",
    phone: "",
  }
);

// Validation
const disabled = !(formValues.firstName && formValues.lastName);

// Layout structure
<div className="grid gap-4">
  <div>
    <Label htmlFor="firstName">First name *</Label>
    <Input id="firstName" ... />
  </div>
  <div className="grid gap-4 md:grid-cols-2">
    <div>
      <Label htmlFor="middleName">Middle name (optional)</Label>
      <Input id="middleName" ... />
    </div>
    <div>
      <Label htmlFor="lastName">Last name *</Label>
      <Input id="lastName" ... />
    </div>
  </div>
</div>
```

#### 5. Review Step Display (`components/onboarding/OnboardingExperience.tsx`)
**File**: `flpilot/components/onboarding/OnboardingExperience.tsx` (Lines ~1001-1003)

```typescript
// BEFORE
<p className="text-muted-foreground text-sm">
  {investor?.profile?.legalName}
</p>

// AFTER
<p className="text-muted-foreground text-sm">
  {[
    investor?.profile?.firstName,
    investor?.profile?.middleName,
    investor?.profile?.lastName
  ].filter(Boolean).join(' ')}
</p>
```

#### 6. Test Fixtures (`convex/tests/onboarding.test.ts`)
**File**: `flpilot/convex/tests/onboarding.test.ts`

Update ALL test fixtures (7 occurrences):

```typescript
// BEFORE
profile: {
  legalName: "Investor One",
  entityType: "individual",
  contactEmail: "investor@example.com",
  phone: "555-1212",
}

// AFTER
profile: {
  firstName: "Investor",
  lastName: "One",
  entityType: "individual",
  phone: "555-1212",
}
```

---

## Issue #2: Remove Contact Email (Use Auth Email)

### Impact Analysis
- **Schema Changes**: Remove `contactEmail` from profile
- **Frontend Components**: Remove email input field
- **Backend**: Access email from `identity.email` when needed
- **Data Display**: Fetch email from user identity/users table
- **No Migration Needed**: Old data with contactEmail will be ignored

### Changes Required

#### 1. Remove from Schema
Already covered in Issue #1 schema changes above.

#### 2. Remove from Form
**File**: `flpilot/components/onboarding/OnboardingExperience.tsx` (Lines ~630-645)

**Action**: Delete the entire "Contact email" input div (Lines ~630-645)

#### 3. Update Form Validation
**File**: `flpilot/components/onboarding/OnboardingExperience.tsx` (Line ~605)

```typescript
// BEFORE
const disabled = !(formValues.legalName && formValues.contactEmail);

// AFTER (combined with Issue #1)
const disabled = !(formValues.firstName && formValues.lastName);
```

#### 4. Display Email in Review/Admin (Optional Enhancement)
If we want to show the user's email anywhere for reference:

**Create helper function** in `convex/onboarding.ts`:
```typescript
export const getJourneyWithUserEmail = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
      .unique();

    if (!user) return null;

    const journey = await getJourneyForUser(ctx, user._id);

    return {
      ...journey,
      userEmail: user.email, // Email from auth
    };
  },
});
```

**Note**: This is optional. The admin can already see user emails from the users table.

---

## Issue #3: Fix Step Progress - Show Checkmarks When Pending Admin

### Impact Analysis
- **Component Logic**: Update `InvestorProgress` to handle "pendingAdmin" state
- **Visual Display**: Show all steps as completed when submission is complete
- **No Schema Changes**: Pure UI logic change
- **No Backend Changes**: Frontend-only fix

### Root Cause
The `InvestorProgress` component uses `activeIndex` based on `currentState`:
- When `currentState = "pendingAdmin"`, the state is NOT in `INVESTOR_STEPS` array
- `findIndex` returns `-1` (not found)
- No steps show as completed (`index < -1` is never true)

### Solution
When the journey status is `"awaiting_admin"`, `"approved"`, or `"rejected"`, all steps should show as completed.

### Changes Required

#### 1. Update InvestorProgress Component
**File**: `flpilot/components/onboarding/OnboardingExperience.tsx` (Lines ~1101-1135)

```typescript
// BEFORE
function InvestorProgress({
  currentState,
}: {
  currentState: OnboardingStateValue;
}) {
  const activeIndex = INVESTOR_STEPS.findIndex(
    (step) => step.id === currentState
  );

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {INVESTOR_STEPS.map((step, index) => {
        const completed = index < activeIndex;
        const isActive = index === activeIndex;
        // ... render logic
      })}
    </div>
  );
}

// AFTER
function InvestorProgress({
  currentState,
  status,
}: {
  currentState: OnboardingStateValue;
  status: JourneyDoc["status"];
}) {
  const activeIndex = INVESTOR_STEPS.findIndex(
    (step) => step.id === currentState
  );

  // If submitted/approved/rejected, all steps are completed
  const allCompleted = status === "awaiting_admin" ||
                       status === "approved" ||
                       status === "rejected";

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {INVESTOR_STEPS.map((step, index) => {
        const completed = allCompleted || index < activeIndex;
        const isActive = !allCompleted && index === activeIndex;
        // ... render logic (unchanged)
      })}
    </div>
  );
}
```

#### 2. Pass Status Prop
**File**: `flpilot/components/onboarding/OnboardingExperience.tsx` (Line ~376-378)

```typescript
// BEFORE
<InvestorProgress currentState={currentState} />

// AFTER
<InvestorProgress currentState={currentState} status={status} />
```

---

## Testing Strategy

### Manual Testing Checklist

#### Issue #1 & #2: Profile Form
- [ ] Open onboarding, select "Investor"
- [ ] Verify intro step works
- [ ] On profile step:
  - [ ] Verify "First Name" field exists and is required
  - [ ] Verify "Middle Name" field exists and is optional
  - [ ] Verify "Last Name" field exists and is required
  - [ ] Verify "Contact Email" field is REMOVED
  - [ ] Verify cannot submit without first + last name
  - [ ] Fill form and submit
- [ ] On review step:
  - [ ] Verify full name displays as "First Middle Last" (or "First Last" if no middle)
- [ ] Submit for review
- [ ] Reload page - verify data persists

#### Issue #3: Progress Tracking
- [ ] Complete onboarding and submit for review
- [ ] Verify all 6 steps show checkmarks when on "Hang Tight" screen
- [ ] Reload page
- [ ] Verify all 6 steps STILL show checkmarks (persistence)
- [ ] Admin approves journey
- [ ] Verify all steps still show as completed

### Automated Testing

#### Update Test Suite
**File**: `flpilot/convex/tests/onboarding.test.ts`

All 7 test fixtures need updating (already listed in Issue #1, section 6).

Run tests:
```bash
npm test -- onboarding.test.ts
```

Expected: All tests pass with new field structure.

---

## Migration Strategy

### No Database Migration Required
- New fields are additive (firstName, middleName, lastName)
- Old field (legalName) will be ignored if present
- Old field (contactEmail) will be ignored if present
- Since onboarding is a draft/transient flow, users can re-enter data if needed

### Handling Existing Drafts
If you want to preserve existing draft data:

**Option A**: Let users re-enter (recommended)
- Drafts are temporary
- User can re-fill the form
- Simplest approach

**Option B**: Migration script (if needed)
```typescript
// Create migration mutation if needed
export const migrateProfileFields = internalMutation({
  handler: async (ctx) => {
    const journeys = await ctx.db.query("onboarding_journeys").collect();

    for (const journey of journeys) {
      const profile = journey.context?.investor?.profile;
      if (profile && 'legalName' in profile) {
        // Parse legalName into parts (best effort)
        const nameParts = profile.legalName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts[nameParts.length - 1] || '';
        const middleName = nameParts.slice(1, -1).join(' ') || undefined;

        await ctx.db.patch(journey._id, {
          context: {
            ...journey.context,
            investor: {
              ...journey.context.investor,
              profile: {
                ...profile,
                firstName,
                middleName,
                lastName,
                // Remove old fields
                legalName: undefined,
                contactEmail: undefined,
              }
            }
          }
        });
      }
    }
  }
});
```

---

## Implementation Order

### Phase 1: Backend Changes
1. Update `convex/schema.ts` (Issues #1 & #2)
2. Update `convex/onboarding.ts` validators (Issues #1 & #2)
3. Update `convex/tests/onboarding.test.ts` fixtures (Issues #1 & #2)
4. Run tests to verify backend

### Phase 2: Frontend Types
5. Update `InvestorProfileValues` type (Issues #1 & #2)

### Phase 3: Frontend Components
6. Update `InvestorProfileForm` component (Issues #1 & #2)
7. Update `InvestorReviewStep` display (Issue #1)
8. Update `InvestorProgress` component (Issue #3)
9. Pass `status` prop to `InvestorProgress` (Issue #3)

### Phase 4: Testing
10. Run automated tests
11. Manual testing (use checklist above)
12. Fix any issues

### Phase 5: Deployment
13. Deploy to staging
14. Smoke test on staging
15. Deploy to production

---

## Rollback Plan

If issues arise:
1. **Git Revert**: All changes are in one commit, easy to revert
2. **No Data Loss**: No destructive migrations, old data preserved
3. **Quick Recovery**: Can redeploy previous version immediately

---

## Blast Radius Summary

### Low Risk Areas ✅
- Schema changes are additive (new fields)
- No migrations needed
- Frontend-only changes for Issue #3
- Existing approved journeys unaffected

### Medium Risk Areas ⚠️
- Form validation logic (thoroughly test)
- Data display in review step (test with/without middle name)
- Progress tracking logic (test all states)

### No Impact Areas 🟢
- Other personas (broker/lawyer)
- Admin approval flow
- User authentication
- Other parts of the application

---

## Files to Modify

1. `flpilot/convex/schema.ts` - Schema updates
2. `flpilot/convex/onboarding.ts` - Validator updates
3. `flpilot/convex/tests/onboarding.test.ts` - Test fixture updates (7 locations)
4. `flpilot/components/onboarding/OnboardingExperience.tsx` - Multiple sections:
   - Type definitions (~Line 123)
   - Profile form component (~Line 580)
   - Review step display (~Line 1001)
   - Progress component (~Line 1101)
   - Progress component usage (~Line 376)

**Total Files**: 4 files
**Total Locations**: ~15 discrete changes

---

## Success Criteria

### Issue #1: Name Fields
✅ User can enter first, middle (optional), and last name separately
✅ Form validation requires first and last name
✅ Full name displays correctly in review step
✅ Data persists correctly in database

### Issue #2: Email Removal
✅ Contact email field is removed from form
✅ User's authenticated email is available from identity/users table
✅ No errors or missing data

### Issue #3: Progress Tracking
✅ All steps show checkmarks when status is "awaiting_admin"
✅ All steps show checkmarks when status is "approved" or "rejected"
✅ Progress persists after page reload
✅ In-progress steps still work correctly (partial completion)

---

## Timeline Estimate

- **Backend Changes**: 30 minutes
- **Frontend Changes**: 45 minutes
- **Testing**: 30 minutes
- **Total**: ~2 hours

---

## Questions/Decisions Needed

1. **Middle name format**: Should it be a single field or multiple fields?
   - **Decision**: Single optional field (simplest)

2. **Name display format**: How to format when middle name is present?
   - **Decision**: "First Middle Last" with space separator

3. **Existing draft journeys**: Migrate or let users re-enter?
   - **Decision**: Let users re-enter (drafts are temporary)

4. **Entity types**: Should corporation/trust/fund still use name fields?
   - **Decision**: Yes, keep same fields for consistency (represents primary contact)

---

## Notes

- All changes are backward compatible for read operations
- No breaking changes to approved journeys
- Consider adding email display in admin view (separate enhancement)
- Consider adding name validation (e.g., min length, special chars)

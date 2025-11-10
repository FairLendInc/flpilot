# Implementation Checklist - Onboarding Fixes

Quick reference checklist for implementing the three onboarding fixes.

## Pre-Implementation

- [ ] Read `FIX_PLAN.md` for detailed context
- [ ] Review `VISUAL_CHANGES.md` for UI changes
- [ ] Create feature branch: `git checkout -b fix/onboarding-name-fields-and-progress`
- [ ] Backup current database (if applicable)

---

## Phase 1: Backend Changes (30 min)

### 1.1 Schema Update
- [ ] Open `flpilot/convex/schema.ts`
- [ ] Navigate to `onboarding_journeys.context.investor.profile` (Line ~130)
- [ ] Replace `legalName: v.string()` with:
  - [ ] `firstName: v.string()`
  - [ ] `middleName: v.optional(v.string())`
  - [ ] `lastName: v.string()`
- [ ] Remove `contactEmail: v.string()` line
- [ ] Save file

### 1.2 Validator Update
- [ ] Open `flpilot/convex/onboarding.ts`
- [ ] Navigate to `investorProfileValidator` (Line ~23)
- [ ] Replace `legalName: v.string()` with:
  - [ ] `firstName: v.string()`
  - [ ] `middleName: v.optional(v.string())`
  - [ ] `lastName: v.string()`
- [ ] Remove `contactEmail: v.string()` line
- [ ] Save file

### 1.3 Test Fixtures Update
- [ ] Open `flpilot/convex/tests/onboarding.test.ts`
- [ ] Find all 7 occurrences of `legalName` and `contactEmail`
- [ ] Replace each with firstName/lastName pattern:
  ```typescript
  profile: {
    firstName: "First",
    lastName: "Last",
    entityType: "individual",
    phone: "555-1212",
  }
  ```
- [ ] Locations to update:
  - [ ] Line ~66 (investor flow test)
  - [ ] Line ~132 (min ticket validation test)
  - [ ] Line ~175 (approval test - investor 1)
  - [ ] Line ~234 (rejection test)
  - [ ] Line ~285 (double approval test)
- [ ] Save file
- [ ] Run tests: `npm test -- onboarding.test.ts`
- [ ] Verify all tests pass

---

## Phase 2: Frontend Types (5 min)

### 2.1 Update Type Definition
- [ ] Open `flpilot/components/onboarding/OnboardingExperience.tsx`
- [ ] Navigate to `InvestorProfileValues` type (Line ~123)
- [ ] Replace:
  ```typescript
  type InvestorProfileValues = {
    firstName: string;
    middleName?: string;
    lastName: string;
    entityType: (typeof ENTITY_TYPES)[number];
    phone?: string;
  };
  ```
- [ ] Save file

---

## Phase 3: Frontend Components (45 min)

### 3.1 Profile Form Component
- [ ] Open `flpilot/components/onboarding/OnboardingExperience.tsx`
- [ ] Navigate to `InvestorProfileForm` (Line ~580)

#### 3.1.1 Update Form State
- [ ] Find `useState<InvestorProfileValues>` initialization
- [ ] Replace with:
  ```typescript
  defaultValues ?? {
    firstName: "",
    middleName: "",
    lastName: "",
    entityType: "individual",
    phone: "",
  }
  ```

#### 3.1.2 Update Validation
- [ ] Find validation line: `const disabled = ...`
- [ ] Replace with: `const disabled = !(formValues.firstName && formValues.lastName);`

#### 3.1.3 Update Form JSX
- [ ] Find the "Legal name" input div (Line ~610)
- [ ] Replace entire first grid with:
  ```tsx
  <div className="grid gap-4">
    <div>
      <Label htmlFor="firstName">First name</Label>
      <Input
        id="firstName"
        onChange={(event) =>
          setFormValues((prev) => ({
            ...prev,
            firstName: event.target.value,
          }))
        }
        value={formValues.firstName}
      />
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <Label htmlFor="middleName">Middle name (optional)</Label>
        <Input
          id="middleName"
          onChange={(event) =>
            setFormValues((prev) => ({
              ...prev,
              middleName: event.target.value,
            }))
          }
          value={formValues.middleName ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="lastName">Last name</Label>
        <Input
          id="lastName"
          onChange={(event) =>
            setFormValues((prev) => ({
              ...prev,
              lastName: event.target.value,
            }))
          }
          value={formValues.lastName}
        />
      </div>
    </div>
  </div>
  ```

#### 3.1.4 Remove Email Field
- [ ] Find "Contact email" input div (Line ~630-645)
- [ ] Delete entire div block
- [ ] Save file

### 3.2 Review Step Display
- [ ] Navigate to `InvestorReviewStep` (Line ~1001)
- [ ] Find `{investor?.profile?.legalName}`
- [ ] Replace with:
  ```tsx
  {[
    investor?.profile?.firstName,
    investor?.profile?.middleName,
    investor?.profile?.lastName
  ].filter(Boolean).join(' ')}
  ```
- [ ] Save file

### 3.3 Progress Component - Issue #3 Fix
- [ ] Navigate to `InvestorProgress` function (Line ~1101)

#### 3.3.1 Update Function Signature
- [ ] Add `status` parameter:
  ```typescript
  function InvestorProgress({
    currentState,
    status,
  }: {
    currentState: OnboardingStateValue;
    status: JourneyDoc["status"];
  }) {
  ```

#### 3.3.2 Add Completion Logic
- [ ] After `activeIndex` calculation, add:
  ```typescript
  const allCompleted = status === "awaiting_admin" ||
                       status === "approved" ||
                       status === "rejected";
  ```

#### 3.3.3 Update Render Logic
- [ ] In the `map` function, update:
  ```typescript
  const completed = allCompleted || index < activeIndex;
  const isActive = !allCompleted && index === activeIndex;
  ```
- [ ] Save file

### 3.4 Pass Status Prop
- [ ] Navigate to where `InvestorProgress` is used (Line ~376)
- [ ] Update to: `<InvestorProgress currentState={currentState} status={status} />`
- [ ] Save file

---

## Phase 4: Build & Test (30 min)

### 4.1 Type Check
- [ ] Run: `npx tsc --noEmit`
- [ ] Fix any TypeScript errors

### 4.2 Build
- [ ] Run: `npm run build`
- [ ] Verify build succeeds

### 4.3 Manual Testing - Profile Form
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to `/onboarding`
- [ ] Select "Investor" persona
- [ ] On profile step:
  - [ ] Verify "First name" field exists
  - [ ] Verify "Middle name (optional)" field exists
  - [ ] Verify "Last name" field exists
  - [ ] Verify "Contact email" field is GONE
  - [ ] Try to submit without first name → should be disabled
  - [ ] Try to submit without last name → should be disabled
  - [ ] Fill all required fields → should enable submit
  - [ ] Submit form

### 4.4 Manual Testing - Data Flow
- [ ] Continue through preferences step
- [ ] Continue through KYC step
- [ ] Continue through documents step
- [ ] On review step:
  - [ ] Verify name displays as "First Middle Last" (or "First Last")
  - [ ] Verify no email shown
  - [ ] Submit for review

### 4.5 Manual Testing - Progress Tracking
- [ ] After submission, verify "Hang Tight" card appears
- [ ] Verify progress cards show:
  - [ ] Welcome ✓
  - [ ] Profile ✓
  - [ ] Preferences ✓
  - [ ] KYC ✓
  - [ ] Documents ✓
  - [ ] Review ✓
- [ ] Reload the page
- [ ] Verify all checkmarks persist

### 4.6 Test Edge Cases
- [ ] Test without middle name (leave empty)
- [ ] Verify review shows "First Last" (no extra space)
- [ ] Test with middle name
- [ ] Verify review shows "First Middle Last"

### 4.7 Run Automated Tests
- [ ] Run: `npm test`
- [ ] Verify all tests pass

---

## Phase 5: Code Review & Commit

### 5.1 Self Review
- [ ] Review all changes using `git diff`
- [ ] Check for console errors in browser
- [ ] Check for any hardcoded test values

### 5.2 Commit Changes
- [ ] Stage changes: `git add .`
- [ ] Commit with descriptive message:
  ```
  fix(onboarding): split name fields, remove email, fix progress tracking

  - Split legal name into firstName, middleName, lastName
  - Remove contact email field (use authenticated email)
  - Fix progress tracking to show completed steps in pending state
  - Update schema, validators, and tests

  Fixes: #[issue-number]
  ```

### 5.3 Push & Create PR
- [ ] Push branch: `git push origin fix/onboarding-name-fields-and-progress`
- [ ] Create Pull Request
- [ ] Link to `FIX_PLAN.md` in PR description
- [ ] Request review

---

## Phase 6: Post-Deployment Verification

### 6.1 Staging Environment
- [ ] Deploy to staging
- [ ] Test complete onboarding flow
- [ ] Verify progress tracking works
- [ ] Check database for correct schema

### 6.2 Production Deployment
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Verify new users can complete onboarding
- [ ] Check existing pending journeys still display

### 6.3 Monitoring
- [ ] Monitor Sentry/error logs for 24 hours
- [ ] Check user feedback channels
- [ ] Verify no regression in onboarding completion rate

---

## Rollback Procedure (if needed)

- [ ] Revert commit: `git revert [commit-hash]`
- [ ] Deploy revert to production
- [ ] Notify team
- [ ] Investigate issues
- [ ] Plan fix

---

## Success Criteria Verification

### Issue #1 & #2: Name Fields
- [ ] ✅ User can enter first, middle, last name separately
- [ ] ✅ Middle name is optional
- [ ] ✅ First and last names are required
- [ ] ✅ Contact email field removed
- [ ] ✅ Full name displays correctly in review
- [ ] ✅ Data saves correctly to database

### Issue #3: Progress Tracking
- [ ] ✅ All steps show checkmarks in "awaiting_admin" state
- [ ] ✅ All steps show checkmarks in "approved" state
- [ ] ✅ All steps show checkmarks in "rejected" state
- [ ] ✅ Checkmarks persist after page reload
- [ ] ✅ In-progress states still work correctly

---

## Files Modified Summary

- [x] `flpilot/convex/schema.ts`
- [x] `flpilot/convex/onboarding.ts`
- [x] `flpilot/convex/tests/onboarding.test.ts`
- [x] `flpilot/components/onboarding/OnboardingExperience.tsx`

**Total**: 4 files, ~15 discrete changes

---

## Estimated Time

- Backend: 30 minutes
- Frontend: 45 minutes
- Testing: 30 minutes
- **Total: ~2 hours**

---

## Notes

- No database migration required
- Changes are backward compatible for reads
- Existing draft journeys may need re-entry (acceptable for drafts)
- All changes in this single feature branch

---

## Support Contacts

- **Questions on changes**: See `FIX_PLAN.md`
- **Visual reference**: See `VISUAL_CHANGES.md`
- **Schema questions**: Check Convex docs
- **UI questions**: Check design system

---

**Good luck! 🚀**

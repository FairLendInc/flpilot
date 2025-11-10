# Quick Start - Onboarding Fixes Implementation

**Ready to fix the onboarding issues? Follow these steps.**

---

## 🎯 What We're Fixing

1. **Split Name Field**: Legal Name → First Name + Middle Name + Last Name
2. **Remove Email Field**: Delete Contact Email (use auth email instead)
3. **Fix Progress Tracking**: Show checkmarks on all steps when pending/approved/rejected

**Time Required**: ~2 hours

---

## 🚀 Quick Start

### Step 1: Prepare
```bash
git checkout -b fix/onboarding-improvements
```

### Step 2: Backend (Schema + Validators)

**File**: `convex/schema.ts` (Line ~130)
```typescript
// In profile object, replace:
legalName: v.string(),
contactEmail: v.string(),

// With:
firstName: v.string(),
middleName: v.optional(v.string()),
lastName: v.string(),
// (remove contactEmail line)
```

**File**: `convex/onboarding.ts` (Line ~23)
```typescript
// In investorProfileValidator, replace:
legalName: v.string(),
contactEmail: v.string(),

// With:
firstName: v.string(),
middleName: v.optional(v.string()),
lastName: v.string(),
// (remove contactEmail line)
```

**File**: `convex/tests/onboarding.test.ts`
```typescript
// Find all 7 profile objects and replace:
profile: {
  legalName: "Name",
  contactEmail: "email@example.com",
  // ...
}

// With:
profile: {
  firstName: "First",
  lastName: "Last",
  // ...
}
```

### Step 3: Frontend (Types)

**File**: `components/onboarding/OnboardingExperience.tsx` (Line ~123)
```typescript
type InvestorProfileValues = {
  firstName: string;
  middleName?: string;
  lastName: string;
  entityType: (typeof ENTITY_TYPES)[number];
  phone?: string;
};
```

### Step 4: Frontend (Form)

**File**: `components/onboarding/OnboardingExperience.tsx` (Line ~588)

**Form initialization**:
```typescript
const [formValues, setFormValues] = useState<InvestorProfileValues>(
  defaultValues ?? {
    firstName: "",
    middleName: "",
    lastName: "",
    entityType: "individual",
    phone: "",
  }
);
```

**Validation** (Line ~605):
```typescript
const disabled = !(formValues.firstName && formValues.lastName);
```

**Form fields** (Line ~610) - Replace entire first grid section:
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
<div className="grid gap-4 md:grid-cols-2">
  <div>
    <Label>Entity type</Label>
    <Select
      onValueChange={(value) =>
        setFormValues((prev) => ({
          ...prev,
          entityType: value as InvestorProfileValues["entityType"],
        }))
      }
      value={formValues.entityType}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select entity" />
      </SelectTrigger>
      <SelectContent>
        {ENTITY_TYPES.map((type) => (
          <SelectItem key={type} value={type}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
  <div>
    <Label htmlFor="phone">Phone (optional)</Label>
    <Input
      id="phone"
      onChange={(event) =>
        setFormValues((prev) => ({
          ...prev,
          phone: event.target.value,
        }))
      }
      value={formValues.phone ?? ""}
    />
  </div>
</div>
```

**Delete the Contact Email div** (Lines ~630-645) - Remove entirely

### Step 5: Frontend (Review Display)

**File**: `components/onboarding/OnboardingExperience.tsx` (Line ~1001)
```tsx
// Replace:
{investor?.profile?.legalName}

// With:
{[
  investor?.profile?.firstName,
  investor?.profile?.middleName,
  investor?.profile?.lastName
].filter(Boolean).join(' ')}
```

### Step 6: Frontend (Progress Tracking)

**File**: `components/onboarding/OnboardingExperience.tsx` (Line ~1101)

**Function signature**:
```typescript
function InvestorProgress({
  currentState,
  status,
}: {
  currentState: OnboardingStateValue;
  status: JourneyDoc["status"];
}) {
```

**Add logic after activeIndex**:
```typescript
const activeIndex = INVESTOR_STEPS.findIndex(
  (step) => step.id === currentState
);

// Add this:
const allCompleted = status === "awaiting_admin" ||
                     status === "approved" ||
                     status === "rejected";
```

**Update map logic**:
```typescript
{INVESTOR_STEPS.map((step, index) => {
  const completed = allCompleted || index < activeIndex;
  const isActive = !allCompleted && index === activeIndex;
  // ... rest unchanged
})}
```

**Update usage** (Line ~376):
```tsx
<InvestorProgress currentState={currentState} status={status} />
```

---

## ✅ Test

```bash
# Type check
npx tsc --noEmit

# Build
npm run build

# Run tests
npm test

# Manual test
npm run dev
# Navigate to /onboarding and test complete flow
```

### Manual Test Checklist
- [ ] Select Investor persona
- [ ] Fill first name, last name (required)
- [ ] Middle name is optional
- [ ] No email field present
- [ ] Complete all steps
- [ ] Review shows "First Middle Last" format
- [ ] Submit for review
- [ ] All progress steps show checkmarks ✓
- [ ] Reload page - checkmarks persist

---

## 📝 Commit

```bash
git add .
git commit -m "fix(onboarding): split name fields, remove email, fix progress tracking

- Split legal name into firstName, middleName, lastName
- Remove contact email field (use authenticated email)
- Fix progress tracking to show completed steps in pending state
- Update schema, validators, and tests"

git push origin fix/onboarding-improvements
```

---

## 📚 Need More Details?

- **Full Plan**: See `FIX_PLAN.md`
- **Visual Guide**: See `VISUAL_CHANGES.md`
- **Detailed Checklist**: See `IMPLEMENTATION_CHECKLIST.md`

---

## 🆘 Common Issues

**TypeScript errors?**
- Make sure all 7 test fixtures are updated
- Check InvestorProfileValues type matches form state

**Tests failing?**
- Update all `legalName` and `contactEmail` references
- Check validator matches schema

**Progress not showing checkmarks?**
- Verify `status` prop is passed to InvestorProgress
- Check `allCompleted` logic includes all three states

**Build failing?**
- Run `npx tsc --noEmit` to find type errors
- Check all imports are correct

---

**Done! 🎉**

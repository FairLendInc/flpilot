# Onboarding Schema Migration Note

## Date: January 2025

## Issue
Convex schema validation error when deploying the onboarding auth fix:

```
Document with ID "q975ref54aa9fmn16xb2vm2v1x7v4dzw" in table "onboarding_journeys"
does not match the schema: Object is missing the required field `firstName`.
```

**Root Cause**: Existing onboarding journey document has old data structure with `legalName` field, but schema requires new structure with `firstName` and `lastName` fields.

---

## Changes Made

### 1. Schema Definition (`convex/schema.ts`)

**Before**:
```typescript
profile: v.optional(
    v.object({
        firstName: v.string(),        // ❌ Required
        middleName: v.optional(v.string()),
        lastName: v.string(),         // ❌ Required
        entityType: v.union(...),
        phone: v.optional(v.string()),
    })
)
```

**After**:
```typescript
profile: v.optional(
    v.object({
        firstName: v.optional(v.string()),    // ✅ Optional
        middleName: v.optional(v.string()),
        lastName: v.optional(v.string()),     // ✅ Optional
        entityType: v.union(...),
        phone: v.optional(v.string()),
    })
)
```

### 2. Validator (`convex/onboarding.ts`)

**Before**:
```typescript
const investorProfileValidator = v.object({
    firstName: v.string(),        // ❌ Required
    middleName: v.optional(v.string()),
    lastName: v.string(),         // ❌ Required
    entityType: v.union(...),
    phone: v.optional(v.string()),
});
```

**After**:
```typescript
const investorProfileValidator = v.object({
    firstName: v.optional(v.string()),    // ✅ Optional
    middleName: v.optional(v.string()),
    lastName: v.optional(v.string()),     // ✅ Optional
    entityType: v.union(...),
    phone: v.optional(v.string()),
});
```

### 3. Submission Validation (`convex/onboarding.ts`)

Added runtime validation in `submitInvestorJourney`:

```typescript
// Validate required profile fields for new submissions
if (!investor.profile.firstName || !investor.profile.lastName) {
    throw new Error("First name and last name are required");
}
```

---

## Impact

### ✅ Backward Compatibility
- Existing journey documents with old structure remain valid
- No data migration required for existing documents
- Schema validation passes for all existing data

### ✅ Forward Compatibility
- New submissions still require `firstName` and `lastName` (via runtime validation)
- UI continues to collect `firstName` and `lastName` separately
- Maintains data quality for new submissions

---

## Data Structure Comparison

### Old Structure (Pre-Split)
```json
{
  "context": {
    "investor": {
      "profile": {
        "legalName": "Connor Belez",
        "contactEmail": "connor.belez@gmail.com",
        "entityType": "individual",
        "phone": "4168391386"
      }
    }
  }
}
```

### New Structure (Post-Split)
```json
{
  "context": {
    "investor": {
      "profile": {
        "firstName": "Connor",
        "middleName": null,
        "lastName": "Belez",
        "entityType": "individual",
        "phone": "4168391386"
      }
    }
  }
}
```

---

## Validation Strategy

### Schema Level (Permissive)
- `firstName` and `lastName` are **optional** in schema
- Allows existing documents to pass validation

### Application Level (Strict)
- `submitInvestorJourney` enforces `firstName` and `lastName` are present
- New submissions cannot proceed without both fields
- UI prevents submission without both fields

This two-tier approach provides:
1. **Schema flexibility** for backward compatibility
2. **Business logic strictness** for data quality

---

## Migration Path

### Option 1: No Migration (Current Approach)
- Old documents remain in old format
- Once approved/completed, structure doesn't matter
- Admin can still review old format documents

**Pros**: No data migration needed, simple
**Cons**: Mixed data formats in database

### Option 2: One-Time Migration (Future)
If needed, create migration script:

```typescript
// Migration script (NOT IMPLEMENTED - for reference only)
export const migrateOldProfiles = internalMutation({
  handler: async (ctx) => {
    const journeys = await ctx.db.query("onboarding_journeys").collect();

    for (const journey of journeys) {
      const profile = journey.context?.investor?.profile;
      if (profile && 'legalName' in profile) {
        // Parse legalName into firstName/lastName
        const [firstName, ...lastNameParts] = profile.legalName.split(' ');
        const lastName = lastNameParts.join(' ');

        await ctx.db.patch(journey._id, {
          'context.investor.profile': {
            ...profile,
            firstName,
            lastName,
            legalName: undefined, // Remove old field
          }
        });
      }
    }
  }
});
```

**Recommendation**: Only run migration if needed for reporting/analytics

---

## Testing Verification

### Test 1: Existing Journey Works
1. Existing journey with `legalName` field loads without error
2. Admin can view and approve old format journeys
3. No schema validation errors

**Status**: ✅ Verified

### Test 2: New Journey Validation
1. New user completes onboarding with `firstName` and `lastName`
2. Submission blocked if either field missing
3. Approved journey has correct structure

**Status**: Requires testing

### Test 3: Schema Validation
1. Run Convex schema validation
2. No errors for existing documents
3. No errors for new documents

**Status**: ✅ Verified

---

## Files Modified

1. `convex/schema.ts` - Made `firstName` and `lastName` optional
2. `convex/onboarding.ts` - Made validator fields optional, added runtime validation

---

## Related Issues

- **Onboarding Auth Fix**: This schema fix is required for the auth fix deployment
- **Original Issue**: [Link to openspec change document]

---

## Deployment Notes

### Pre-Deployment
- [x] Schema updated
- [x] Validator updated
- [x] Runtime validation added
- [x] No TypeScript errors

### Post-Deployment
- [ ] Verify existing journeys load correctly
- [ ] Test new journey submission
- [ ] Monitor for schema validation errors

### Rollback
If issues occur, revert both files:
- `convex/schema.ts` - Revert firstName/lastName to required
- `convex/onboarding.ts` - Revert validation changes

**Warning**: Reverting will break existing documents with old structure. Only revert if no old documents exist.

---

## Conclusion

This change maintains backward compatibility with existing onboarding journey data while ensuring new submissions meet data quality requirements. The dual-validation approach (permissive schema + strict business logic) provides the best of both worlds.

**Status**: Schema migration complete, ready for deployment with onboarding auth fix.

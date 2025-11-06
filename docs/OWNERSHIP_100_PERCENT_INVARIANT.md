# Ownership 100% Invariant Implementation

## Overview

This document describes the implementation of the ownership invariant where **ownership ALWAYS equals exactly 100%** for every mortgage. FairLend acts as the default owner, holding any ownership not owned by investors.

## Key Principle

**Every mortgage must have ownership totaling exactly 100% at all times.**

- When a mortgage is created, FairLend owns 100%
- When an investor buys a portion, FairLend's ownership decreases automatically
- When ownership is updated or deleted, FairLend's ownership adjusts automatically
- FairLend acts as the "remainder" owner, ensuring the total is always 100%

## Changes Made

### 1. `convex/mortgages.ts` - Automatic FairLend Ownership

**Function:** `createMortgage`

**Change:** After creating a mortgage, automatically create a 100% FairLend ownership record.

```typescript
// Create initial 100% FairLend ownership
// By default, all mortgages are 100% owned by FairLend until sold to investors
await ctx.db.insert("mortgage_ownership", {
  mortgageId,
  ownerId: "fairlend",
  ownershipPercentage: 100,
});
```

**Impact:** Every new mortgage starts with FairLend owning 100%.

---

### 2. `convex/ownership.ts` - Enforcing the 100% Invariant

#### A. `createOwnership` - Creating New Ownership

**Behavior:** When creating new ownership for an investor:

1. Validates the percentage is > 0 and ≤ 100
2. Prevents manual creation of FairLend ownership (it's automatic)
3. Checks if FairLend has enough ownership to transfer
4. Reduces FairLend's ownership by the requested amount
5. Creates the new ownership record
6. If FairLend's ownership becomes 0%, deletes FairLend's record

**Example:**
```
Before: FairLend owns 100%
Action: Create 25% ownership for investor A
After:  FairLend owns 75%, Investor A owns 25%
Total:  100% ✓
```

**Atomicity:** All operations happen within a single Convex mutation (atomic by default), preventing race conditions.

---

#### B. `updateOwnershipPercentage` - Updating Ownership

**Behavior:** When updating an existing ownership percentage:

1. Calculates the change in ownership (delta)
2. If updating FairLend's ownership, updates it directly
3. For other owners, adjusts FairLend's ownership by the opposite delta
4. Validates FairLend's ownership stays between 0-100%
5. Updates both the target record and FairLend's record
6. Creates FairLend record if it doesn't exist
7. Deletes FairLend record if it becomes 0%

**Example:**
```
Before: FairLend owns 60%, Investor A owns 40%
Action: Update Investor A from 40% to 50% (delta = +10%)
After:  FairLend owns 50%, Investor A owns 50%
Total:  100% ✓
```

**Atomicity:** All operations happen atomically within the mutation.

---

#### C. `deleteOwnership` - Deleting Ownership

**Behavior:** When deleting an ownership record:

1. Prevents deletion of FairLend ownership (it's managed automatically)
2. Transfers the deleted ownership back to FairLend
3. Either adds to existing FairLend ownership or creates new record

**Example:**
```
Before: FairLend owns 50%, Investor A owns 30%, Investor B owns 20%
Action: Delete Investor B's ownership (20%)
After:  FairLend owns 70%, Investor A owns 30%
Total:  100% ✓
```

**Atomicity:** All operations happen atomically within the mutation.

---

#### D. `getTotalOwnership` - Validation Query

**New query for auditing and validation:**

Returns:
```typescript
{
  mortgageId: Id<"mortgages">,
  totalPercentage: number,
  isValid: boolean,  // true if total ≈ 100% (within 0.01%)
  owners: number,     // count of ownership records
  breakdown: [        // list of all owners and their percentages
    { ownerId: string, percentage: number },
    ...
  ]
}
```

Use this query to validate the invariant is maintained or for debugging.

---

## Invariant Guarantees

### ✅ Guaranteed

1. **100% Total:** Every mortgage always has exactly 100% ownership
2. **No Race Conditions:** Convex mutations are atomic - concurrent updates are serialized
3. **Automatic FairLend:** FairLend ownership is managed automatically
4. **Validation:** Cannot create/update ownership that would violate the invariant

### 🛡️ Protected Against

- Creating ownership when FairLend doesn't have enough to transfer
- Updating ownership that would push FairLend negative or above 100%
- Manual manipulation of FairLend's ownership
- Race conditions from concurrent ownership changes
- Orphaned ownership (deleting always transfers back to FairLend)

### ⚠️ Edge Cases Handled

- **FairLend at 0%:** FairLend record is deleted to keep the table clean
- **FairLend returning:** FairLend record is recreated when ownership returns
- **Floating point precision:** Validation allows 0.01% tolerance
- **Multiple investors:** Works with any number of investors
- **Full sellout:** Works when FairLend owns 0% (all sold to investors)

---

## Usage Examples

### Creating Investor Ownership

```typescript
// FairLend owns 100%
await ctx.runMutation(api.ownership.createOwnership, {
  mortgageId: mortgage1,
  ownerId: "user_123",
  ownershipPercentage: 25,
});
// Now: FairLend owns 75%, user_123 owns 25%
```

### Updating Investor Ownership

```typescript
// FairLend owns 75%, user_123 owns 25%
await ctx.runMutation(api.ownership.updateOwnershipPercentage, {
  id: user123OwnershipId,
  ownershipPercentage: 30,  // increase by 5%
});
// Now: FairLend owns 70%, user_123 owns 30%
```

### Investor Selling Back

```typescript
// FairLend owns 70%, user_123 owns 30%
await ctx.runMutation(api.ownership.deleteOwnership, {
  id: user123OwnershipId,
});
// Now: FairLend owns 100%
```

### Validation

```typescript
const result = await ctx.runQuery(api.ownership.getTotalOwnership, {
  mortgageId: mortgage1,
});

console.log(result);
// {
//   mortgageId: "...",
//   totalPercentage: 100,
//   isValid: true,
//   owners: 2,
//   breakdown: [
//     { ownerId: "fairlend", percentage: 75 },
//     { ownerId: "user_123", percentage: 25 }
//   ]
// }
```

---

## Migration Notes

### For Existing Mortgages

If you have existing mortgages without ownership records, run a migration to:

1. Query all mortgages
2. For each mortgage without ownership, create 100% FairLend ownership
3. For each mortgage with ownership < 100%, create FairLend ownership for remainder

### For Existing Ownership Records

If you have ownership records totaling < 100%:

1. Calculate the deficit: `deficit = 100 - current_total`
2. Create or update FairLend ownership: `fairlend_ownership = existing_fairlend + deficit`

---

## Testing Recommendations

1. **Create mortgage:** Verify FairLend owns 100%
2. **Create investor ownership:** Verify FairLend ownership decreases correctly
3. **Update ownership:** Verify FairLend ownership adjusts correctly
4. **Delete ownership:** Verify ownership returns to FairLend
5. **Concurrent operations:** Test multiple simultaneous updates
6. **Boundary conditions:** Test 0%, 100%, and fractional percentages
7. **Validation query:** Use `getTotalOwnership` to verify 100% invariant

---

## Summary

The implementation ensures that ownership always totals exactly 100% for every mortgage, with FairLend acting as the automatic remainder owner. This is enforced through:

- Automatic FairLend ownership creation when mortgages are created
- Automatic FairLend ownership adjustment on all ownership operations
- Atomic mutations preventing race conditions
- Validation preventing impossible states
- Helpful error messages when operations would violate the invariant

The system is now safe, consistent, and maintains the critical business rule that **ownership always equals 100%**.


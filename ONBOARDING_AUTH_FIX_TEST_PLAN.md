# Onboarding Auth Fix Test Plan

## Overview

This test plan validates the fix for the critical bug where users with admin (or other elevated) roles were being forced through the investor onboarding flow when they didn't exist in the Convex database.

**Fix Date**: [Date of Implementation]
**Files Modified**:
- `components/onboarding/OnboardingGate.tsx`
- `app/onboarding/page.tsx`
- `convex/auth.config.ts`
- `types/workos.ts` (new file)

**Key Change**: The system now checks WorkOS role (source of truth) BEFORE checking Convex DB state.

---

## Test Environment Setup

### Prerequisites
- Access to WorkOS Dashboard
- Access to Convex Dashboard
- Admin access to create/modify user roles
- Ability to clear browser cookies/sessions

### Test Users Required
Create the following test users in WorkOS:

1. **Admin User** (`test-admin@example.com`) - Role: `admin`
2. **Broker User** (`test-broker@example.com`) - Role: `broker`
3. **Investor User** (`test-investor@example.com`) - Role: `investor`
4. **Lawyer User** (`test-lawyer@example.com`) - Role: `lawyer`
5. **Member User** (`test-member@example.com`) - Role: `member`

---

## Test Scenarios

### Scenario 1: Admin User Without Convex DB Record

**Purpose**: Verify admins are NOT forced through onboarding when missing from Convex DB

**Setup**:
1. Create admin user in WorkOS with role `admin`
2. Ensure user does NOT exist in Convex `users` table
3. Ensure NO `onboarding_journeys` record exists

**Steps**:
1. Log in as `test-admin@example.com`
2. Observe redirect behavior
3. Check current URL
4. Verify dashboard access

**Expected Result**:
- ✅ User redirects to `/dashboard` (or `/dashboard/admin`)
- ✅ NO redirect to `/onboarding`
- ✅ Full admin functionality accessible
- ✅ User record auto-provisioned in Convex DB (optional, check DB)

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass ⬜ Fail

---

### Scenario 2: Broker User Without Convex DB Record

**Purpose**: Verify brokers skip onboarding when missing from Convex DB

**Setup**:
1. Create broker user in WorkOS with role `broker`
2. Ensure user does NOT exist in Convex `users` table
3. Ensure NO `onboarding_journeys` record exists

**Steps**:
1. Log in as `test-broker@example.com`
2. Observe redirect behavior
3. Check current URL

**Expected Result**:
- ✅ User redirects to `/dashboard` (or broker dashboard)
- ✅ NO redirect to `/onboarding`
- ✅ Broker functionality accessible

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass ⬜ Fail

---

### Scenario 3: Investor User Without Convex DB Record

**Purpose**: Verify approved investors skip onboarding

**Setup**:
1. Create investor user in WorkOS with role `investor`
2. Ensure user does NOT exist in Convex `users` table

**Steps**:
1. Log in as `test-investor@example.com`
2. Observe redirect behavior

**Expected Result**:
- ✅ User redirects to `/dashboard`
- ✅ NO redirect to `/onboarding`
- ✅ Investor dashboard accessible

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass ⬜ Fail

---

### Scenario 4: Lawyer User Without Convex DB Record

**Purpose**: Verify lawyers skip onboarding

**Setup**:
1. Create lawyer user in WorkOS with role `lawyer`
2. Ensure user does NOT exist in Convex `users` table

**Steps**:
1. Log in as `test-lawyer@example.com`
2. Observe redirect behavior

**Expected Result**:
- ✅ User redirects to `/dashboard`
- ✅ NO redirect to `/onboarding`
- ✅ Lawyer functionality accessible

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass ⬜ Fail

---

### Scenario 5: Member User Without Journey (New User)

**Purpose**: Verify members ARE sent through onboarding

**Setup**:
1. Create member user in WorkOS with role `member`
2. Ensure NO `onboarding_journeys` record exists

**Steps**:
1. Log in as `test-member@example.com`
2. Observe redirect behavior
3. Verify onboarding flow accessible

**Expected Result**:
- ✅ User redirects to `/onboarding`
- ✅ Onboarding flow displays correctly
- ✅ Can select persona (investor/broker/lawyer)

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass ⬜ Fail

---

### Scenario 6: Member User With Draft Journey

**Purpose**: Verify members with incomplete onboarding are sent back to onboarding

**Setup**:
1. Create member user in WorkOS with role `member`
2. Create `onboarding_journeys` record with `status: "draft"`

**Steps**:
1. Log in as `test-member@example.com`
2. Try to navigate to `/dashboard`
3. Observe redirect behavior

**Expected Result**:
- ✅ User redirects to `/onboarding`
- ✅ Previous progress restored (if journey has data)

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass ⬜ Fail

---

### Scenario 7: Member User With Approved Journey

**Purpose**: Verify members with approved journeys can access dashboard

**Setup**:
1. Create member user in WorkOS with role `member`
2. Create `onboarding_journeys` record with `status: "approved"`

**Steps**:
1. Log in as `test-member@example.com`
2. Observe redirect behavior
3. Try to manually navigate to `/onboarding`

**Expected Result**:
- ✅ User redirects to `/dashboard`
- ✅ Dashboard accessible
- ✅ Manually navigating to `/onboarding` redirects back to `/dashboard`

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass ⬜ Fail

---

### Scenario 8: Member User With Rejected Journey

**Purpose**: Verify members with rejected applications are sent to onboarding

**Setup**:
1. Create member user in WorkOS with role `member`
2. Create `onboarding_journeys` record with `status: "rejected"`

**Steps**:
1. Log in as `test-member@example.com`
2. Observe redirect behavior

**Expected Result**:
- ✅ User redirects to `/onboarding`
- ✅ Can see rejection message (if implemented)
- ✅ Can resubmit application

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass ⬜ Fail

---

### Scenario 9: Admin Trying to Access Onboarding

**Purpose**: Verify admins cannot access onboarding page

**Setup**:
1. Admin user logged in

**Steps**:
1. Navigate directly to `/onboarding`
2. Observe redirect behavior

**Expected Result**:
- ✅ Immediate redirect to `/dashboard`
- ✅ Onboarding page never displays

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass ⬜ Fail

---

### Scenario 10: Role Change During Session

**Purpose**: Verify behavior when user role changes in WorkOS

**Setup**:
1. User logged in as `member`
2. In onboarding flow

**Steps**:
1. Admin changes user role to `investor` in WorkOS
2. User refreshes page
3. Observe behavior

**Expected Result**:
- ✅ User redirected to dashboard (after token refresh)
- ✅ No longer forced through onboarding

**Note**: May require token expiry or manual sign out/in

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass ⬜ Fail

---

## Edge Cases

### Edge Case 1: User With No Role

**Setup**: User exists in WorkOS but has no role assigned

**Expected**: Treated as member, sent to onboarding

**Status**: ⬜ Pass ⬜ Fail

---

### Edge Case 2: Concurrent User Provisioning

**Setup**: Multiple tabs open during first login

**Expected**: No race conditions, consistent behavior across tabs

**Status**: ⬜ Pass ⬜ Fail

---

### Edge Case 3: Allowlisted Routes

**Setup**: User accessing `/sign-in`, `/sign-up`, `/callback`

**Expected**: No onboarding checks, normal auth flow

**Status**: ⬜ Pass ⬜ Fail

---

## Regression Testing

### Test 1: Existing Member Onboarding Flow

**Purpose**: Ensure existing onboarding flow still works for members

**Steps**:
1. Create new member user
2. Complete entire onboarding flow
3. Submit for approval
4. Admin approves
5. User logs back in

**Expected**: All steps work as before, no breaking changes

**Status**: ⬜ Pass ⬜ Fail

---

### Test 2: Admin Dashboard Access

**Purpose**: Ensure admin functionality unchanged

**Steps**:
1. Log in as admin (existing user with DB records)
2. Access admin dashboard
3. Approve/reject onboarding applications
4. Manage users

**Expected**: All admin functions work normally

**Status**: ⬜ Pass ⬜ Fail

---

### Test 3: Broker/Investor/Lawyer Workflows

**Purpose**: Ensure elevated role workflows unchanged

**Steps**:
1. Log in as each elevated role
2. Access role-specific features
3. Verify no onboarding interference

**Expected**: All role-specific features accessible

**Status**: ⬜ Pass ⬜ Fail

---

## Performance Testing

### Test 1: OnboardingGate Performance

**Purpose**: Ensure gate doesn't slow down page loads

**Steps**:
1. Log in as various user types
2. Navigate between pages
3. Monitor redirect times

**Expected**: Redirects happen within <100ms, no noticeable delay

**Status**: ⬜ Pass ⬜ Fail

---

## Security Testing

### Test 1: Direct URL Access

**Purpose**: Verify security when directly accessing routes

**Steps**:
1. As member, try accessing `/dashboard/admin`
2. As member in onboarding, try accessing `/dashboard`
3. As admin, try accessing `/onboarding`

**Expected**: Proper redirects, no unauthorized access

**Status**: ⬜ Pass ⬜ Fail

---

### Test 2: Token Manipulation

**Purpose**: Verify server-side checks prevent client-side bypass

**Steps**:
1. Attempt to modify WorkOS token in browser
2. Try accessing protected routes

**Expected**: Server-side withAuth() validates token, prevents access

**Status**: ⬜ Pass ⬜ Fail

---

## Browser Compatibility

Test on:
- ⬜ Chrome (latest)
- ⬜ Firefox (latest)
- ⬜ Safari (latest)
- ⬜ Edge (latest)

---

## Database State Verification

After testing, verify in Convex Dashboard:

1. **Users Table**:
   - ⬜ Admin user record created (if auto-provisioning enabled)
   - ⬜ Member user record created
   - ⬜ All records have correct `idp_id`

2. **Onboarding Journeys Table**:
   - ⬜ Member users have journey records
   - ⬜ Admin/broker/investor/lawyer have NO journey records (or old ones ignored)
   - ⬜ Journey statuses are correct

---

## Test Results Summary

**Total Tests**: 23
**Passed**: ___
**Failed**: ___
**Skipped**: ___

**Critical Failures**: ___
**Date Tested**: ___________
**Tested By**: ___________

---

## Known Issues

_Document any issues discovered during testing:_

1. Issue: _______________
   - Severity: High/Medium/Low
   - Workaround: _______________
   - Ticket: _______________

---

## Sign-Off

- [ ] All critical tests passed
- [ ] No security vulnerabilities introduced
- [ ] Performance acceptable
- [ ] Documentation updated
- [ ] Ready for production deployment

**Approved By**: ___________
**Date**: ___________

# Onboarding Auth Fix - Deployment Checklist

## Date: January 2025

---

## Pre-Deployment Verification

### Code Quality
- [x] All modified files have no TypeScript errors
- [x] All modified files have no ESLint warnings (project-specific)
- [x] Code follows project conventions from `.rules`
- [x] Type safety improved with new helper functions
- [x] Backward compatibility maintained for existing data

### Files Modified (Review)
- [x] `components/onboarding/OnboardingGate.tsx` - Client-side role check
- [x] `app/onboarding/page.tsx` - Server-side role check
- [x] `types/workos.ts` - NEW: Type-safe helpers
- [x] `convex/auth.config.ts` - Using type-safe helpers
- [x] `convex/onboarding.ts` - Optional fields + runtime validation
- [x] `convex/schema.ts` - Optional firstName/lastName for backward compat

### Documentation Complete
- [x] `ONBOARDING_AUTH_BUG_ANALYSIS.md` - Root cause analysis
- [x] `ONBOARDING_AUTH_FIX_IMPLEMENTATION.md` - Implementation details
- [x] `ONBOARDING_AUTH_FIX_TEST_PLAN.md` - 23+ test scenarios
- [x] `ONBOARDING_AUTH_FIX_SUMMARY.md` - Quick reference
- [x] `ONBOARDING_SCHEMA_MIGRATION_NOTE.md` - Schema compatibility
- [x] `DEPLOYMENT_CHECKLIST.md` - This document

### Git Status
- [ ] All changes committed to feature branch
- [ ] Commit messages are clear and descriptive
- [ ] No untracked files that should be committed
- [ ] Branch is up to date with main/develop

---

## Local Testing

### Test 1: Schema Validation
```bash
npx convex dev
# Watch for schema validation errors
# Should see NO errors about missing firstName/lastName
```
- [ ] Convex dev starts without schema errors
- [ ] Existing journey documents load correctly

### Test 2: Admin Without DB Record (Critical)
**Setup**: Create admin in WorkOS, ensure not in Convex DB

**Expected**: Direct access to `/dashboard`, no `/onboarding` redirect

- [ ] Admin can log in successfully
- [ ] Admin redirects to dashboard (not onboarding)
- [ ] Admin can access admin functions

### Test 3: Member User Flow
**Setup**: Create member in WorkOS

**Expected**: Redirect to `/onboarding`, complete flow works

- [ ] Member redirects to onboarding
- [ ] Can select persona
- [ ] Can complete profile
- [ ] Can submit for approval

### Test 4: Elevated Roles
**Setup**: Test broker/investor/lawyer accounts

**Expected**: All skip onboarding, access dashboards

- [ ] Broker skips onboarding
- [ ] Investor skips onboarding
- [ ] Lawyer skips onboarding

### Test 5: Admin Accessing Onboarding
**Setup**: Log in as admin, navigate to `/onboarding`

**Expected**: Immediate redirect to `/dashboard`

- [ ] Admin cannot access `/onboarding` page
- [ ] Redirects to dashboard immediately

---

## Staging Deployment

### Deploy to Staging
```bash
# Push to staging branch
git checkout staging
git merge feature/onboarding-auth-fix
git push origin staging

# Convex will auto-deploy or use:
npx convex deploy --prod
```

- [ ] Code deployed to staging environment
- [ ] Convex schema updated successfully
- [ ] No deployment errors

### Staging Verification

#### Critical Tests (Must Pass)
- [ ] Admin without Convex record → Dashboard access ✅
- [ ] Member without journey → Onboarding flow ✅
- [ ] Admin accessing /onboarding → Redirect to dashboard ✅
- [ ] Broker/Investor/Lawyer → Skip onboarding ✅

#### Regression Tests (Must Pass)
- [ ] Existing member onboarding flow works end-to-end
- [ ] Admin can approve/reject applications
- [ ] All elevated role dashboards accessible
- [ ] No authentication errors in logs

#### Data Verification
- [ ] Check Convex dashboard for existing journey documents
- [ ] Verify old format documents (with legalName) load without errors
- [ ] Verify new journey submissions have firstName/lastName
- [ ] No schema validation errors in Convex logs

### Performance Check
- [ ] Page load times normal (<2s for dashboard)
- [ ] OnboardingGate redirect happens quickly (<100ms)
- [ ] No console errors in browser
- [ ] No infinite redirect loops

---

## Production Deployment

### Pre-Production Checks
- [ ] All staging tests passed
- [ ] No critical issues discovered
- [ ] Product owner/stakeholders notified
- [ ] Maintenance window scheduled (if needed)
- [ ] Rollback plan reviewed and ready

### Deploy to Production
```bash
# Merge to main/production branch
git checkout main
git merge staging
git push origin main

# Deploy Convex
npx convex deploy --prod
```

- [ ] Code deployed to production
- [ ] Convex schema updated
- [ ] Deployment completed successfully

### Post-Deployment Verification (First 15 minutes)

#### Immediate Checks
- [ ] Check Convex logs for errors
- [ ] Check browser console for JavaScript errors
- [ ] Test login flow with test account
- [ ] Verify admin access works

#### Critical Path Testing
- [ ] Admin user can access dashboard
- [ ] Member user sent to onboarding
- [ ] Onboarding submission works
- [ ] Admin can approve applications

#### Monitor For (First Hour)
- [ ] Authentication errors
- [ ] Redirect loops
- [ ] Schema validation errors
- [ ] Users reporting access issues
- [ ] Convex function errors

### Smoke Tests in Production
- [ ] Test with real admin account (your account)
- [ ] Create test member account and complete onboarding
- [ ] Verify elevated roles work (if test accounts available)
- [ ] Check existing approved users still have access

---

## Post-Deployment

### Documentation Updates
- [ ] Update deployment log with date and version
- [ ] Note any issues discovered and resolutions
- [ ] Update internal wiki/docs if applicable

### Team Communication
- [ ] Notify team deployment is complete
- [ ] Share test results
- [ ] Document any workarounds needed
- [ ] Update status in project management tool

### Monitoring (First 24 Hours)
- [ ] Monitor Convex error logs
- [ ] Watch for user-reported issues
- [ ] Check analytics for unusual patterns
- [ ] Verify no increase in error rates

---

## Rollback Plan

### Indicators for Rollback
- Admins cannot access dashboards
- Infinite redirect loops
- Schema validation errors blocking system
- Critical auth bypass discovered
- High volume of user complaints

### Rollback Steps
```bash
# Option 1: Revert Git commit
git revert <commit-hash>
git push origin main
npx convex deploy --prod

# Option 2: Checkout previous version
git checkout <previous-commit>
git push origin main --force
npx convex deploy --prod
```

### Files to Revert
1. `components/onboarding/OnboardingGate.tsx`
2. `app/onboarding/page.tsx`
3. `convex/auth.config.ts`
4. `convex/onboarding.ts`
5. `convex/schema.ts`
6. Delete `types/workos.ts`

### Post-Rollback Actions
- [ ] Verify system returns to previous behavior
- [ ] Notify team of rollback
- [ ] Document reason for rollback
- [ ] Create incident report
- [ ] Plan fix for discovered issue

---

## Success Criteria

### Must Have (Go/No-Go)
- ✅ Admin users with elevated roles skip onboarding
- ✅ Member users go through onboarding as expected
- ✅ No authentication errors
- ✅ No schema validation errors
- ✅ All existing functionality works

### Nice to Have
- ✅ Improved type safety with helpers
- ✅ Comprehensive documentation
- ✅ Clear test plan for future changes

---

## Notes Section

### Issues Discovered
_Document any issues found during testing:_

1. Issue: ____________________
   - Severity: High/Medium/Low
   - Resolution: ____________________
   - Time to Resolve: ____________________

### Performance Metrics
- Average page load time: ______ ms
- OnboardingGate redirect time: ______ ms
- Convex query response time: ______ ms

### User Feedback
_Document any user feedback received:_

---

## Sign-Off

### Development
- [ ] Developer: __________________ Date: __________
- [ ] Code Review: ________________ Date: __________

### Testing
- [ ] QA Lead: ___________________ Date: __________
- [ ] Test Results: Pass / Fail / Conditional

### Deployment
- [ ] DevOps: ____________________ Date: __________
- [ ] Deployment Status: Success / Rolled Back

### Product
- [ ] Product Owner: ______________ Date: __________
- [ ] Approved for Production: Yes / No

---

## Contact Information

**Escalation Path**:
1. Developer on-call: _______________
2. Team Lead: _______________
3. Engineering Manager: _______________

**Emergency Rollback Authority**: _______________

---

## Appendix

### Related Documents
- `ONBOARDING_AUTH_BUG_ANALYSIS.md` - Root cause analysis
- `ONBOARDING_AUTH_FIX_IMPLEMENTATION.md` - Technical details
- `ONBOARDING_AUTH_FIX_TEST_PLAN.md` - Full test scenarios
- `ONBOARDING_SCHEMA_MIGRATION_NOTE.md` - Schema changes

### Git Commits
- Auth Fix Commit: _______________
- Schema Fix Commit: _______________
- Documentation Commit: _______________

### Deployment Times
- Staging Deploy: _______________
- Production Deploy: _______________
- Total Downtime: _______________

---

**Status**: Ready for deployment
**Last Updated**: January 2025

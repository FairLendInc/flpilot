# Task Completion Checklist

## Pre-Commit Checklist

### 1. Code Quality
- [ ] Run `pnpm run check` to lint and format code
- [ ] Run `pnpm run check-types` to verify TypeScript types
- [ ] Ensure all new code follows project conventions
- [ ] Remove any `console.log` statements (use logger instead)
- [ ] Check for proper error handling

### 2. Testing
- [ ] Unit tests pass: `pnpm run test:once`
- [ ] E2E tests pass: `pnpm run e2e`
- [ ] Add/update unit tests for new functionality
- [ ] Test edge cases and error scenarios
- [ ] Verify integration with WorkOS and Convex

### 3. Security & Authentication
- [ ] Verify all Convex functions have proper authentication checks
- [ ] Use `ctx.auth.getUserIdentity()` where needed
- [ ] Validate all user inputs with Convex validators
- [ ] No sensitive data in client-side code
- [ ] Environment variables properly configured

### 4. Performance
- [ ] Check bundle size doesn't increase significantly
- [ ] Verify React Compiler optimizations are effective
- [ ] Database queries use proper indexes
- [ ] Loading states implemented where needed

### 5. Accessibility
- [ ] Proper ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Color contrast meets standards
- [ ] Screen reader compatibility

## Post-Implementation Checklist

### 1. Documentation
- [ ] Update relevant documentation in CLAUDE.md
- [ ] Add/update Storybook stories for new components
- [ ] Document any new environment variables
- [ ] Update API documentation if needed

### 2. Convex Backend
- [ ] Verify database schema changes are properly implemented
- [ ] Check that all indexes are properly defined
- [ ] Test queries with various data conditions
- [ ] Verify 100% ownership invariant where applicable

### 3. Frontend Integration
- [ ] Test with both authenticated and unauthenticated users
- [ ] Verify theme switching works correctly
- [ ] Test responsive design on mobile/tablet
- [ ] Verify toast notifications display properly

### 4. Build & Deployment
- [ ] Build passes: `pnpm run build`
- [ ] No build warnings or errors
- [ ] TypeScript compilation successful
- [ ] Bundle analyzer shows acceptable size

## Feature-Specific Checklist

### New Components
- [ ] Storybook story created
- [ ] Unit tests written
- [ ] Props properly typed
- [ ] Accessible markup
- [ ] Responsive design

### New API Endpoints
- [ ] Proper authentication checks
- [ ] Input validation implemented
- [ ] Error handling tested
- [ ] Documentation added
- [ ] E2E tests cover the flow

### Database Changes
- [ ] Schema properly updated
- [ ] Migrations created if needed
- [ ] Backward compatibility maintained
- [ ] Indexes optimized
- [ ] Data integrity preserved

## Convex-Specific Checklist

### Queries
- [ ] Proper error handling
- [ ] Authentication checks where needed
- [ ] Indexes used for performance
- [ ] Return type matches validator
- [ ] Edge cases handled

### Mutations
- [ ] Authentication required
- [ ] Input validation strict
- [ ] Data integrity maintained
- [ ] Idempotent where possible
- [ ] Proper error messages

### Actions
- [ ] External API error handling
- [ ] Timeout handling
- [ ] Retry logic where appropriate
- [ ] Logging of important operations

## Pre-Deployment Checklist

### Final Validation
- [ ] All tests passing
- [ ] Build successful
- [ ] TypeScript compilation clean
- [ ] No lint errors
- [ ] Security scan passed (if configured)

### Production Readiness
- [ ] Environment variables set
- [ ] Convex deployment configured
- [ ] WorkOS configuration verified
- [ ] Logging configured
- [ ] Monitoring setup

### Communication
- [ ] Team notified of changes
- [ ] Documentation updated
- [ ] Release notes prepared (if needed)
- [ ] Changelog updated

## Common Issues to Check

1. **Type Errors**: Run `pnpm run check-types` before committing
2. **Build Failures**: Run `pnpm run build` to verify
3. **Test Failures**: Run full test suite before submitting
4. **Missing Dependencies**: Verify all imports resolve
5. **Environment Variables**: Check `.env.local` configuration
6. **Convex Schema**: Verify schema matches implementation
7. **Theme Consistency**: Test light/dark mode switching
8. **Auth Flows**: Test sign-in, sign-out, and protected routes

## Emergency Rollback

If issues are found after deployment:

1. Identify the problematic commit
2. Revert to last known good state
3. Notify team immediately
4. Document the issue
5. Plan fix in follow-up PR

## Tools for Verification

```bash
# Quick verification
pnpm run check && pnpm run test:once

# Full verification
pnpm run check-types && pnpm run build && pnpm run test:once && pnpm run e2e

# Performance check
pnpm run build && npx @next/bundle-analyzer
```
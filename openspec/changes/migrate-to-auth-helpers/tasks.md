## 1. Backend Migration - Core Authentication Functions

- [ ] 1.1 Migrate `convex/profile.ts` - Convert `getCurrentUserProfile` and `getUserIdentity` to `authQuery`
- [ ] 1.2 Migrate `convex/profile.ts` - Convert `updateProfile`, `setActiveOrganization`, `saveProfilePicture` to `authMutation`
- [ ] 1.3 Migrate `convex/profile.ts` - Convert `generateUploadUrl`, `syncOrganizationsFromWorkOS` to `authAction`
- [ ] 1.4 Migrate `convex/users.ts` - Convert `getUserTheme` to `authQuery` (or create `publicQuery` if truly public)
- [ ] 1.5 Migrate `convex/users.ts` - Convert `setUserTheme` to `authMutation`
- [ ] 1.6 Migrate `convex/users.ts` - Convert `provisionCurrentUser` to `authAction`
- [ ] 1.7 Migrate `convex/roles.ts` - Convert `getPermissionsForCurrentUser` to `authQuery`
- [ ] 1.8 Test: Verify profile page loads correctly with new auth helpers
- [ ] 1.9 Test: Verify RBAC context is available in migrated functions

## 2. Backend Migration - Listings Domain

- [ ] 2.1 Migrate `convex/listings.ts` - Convert all 7 query functions to `authQuery`
- [ ] 2.2 Migrate `convex/listings.ts` - Convert all 7 mutation functions to `authMutation`
- [ ] 2.3 Test: Verify listings page loads with authenticated queries
- [ ] 2.4 Test: Verify listing creation/update/lock operations work
- [ ] 2.5 Test: Verify RBAC permissions are enforced (admin-only operations)

## 3. Backend Migration - Mortgages Domain

- [ ] 3.1 Migrate `convex/mortgages.ts` - Convert all 5 query functions to `authQuery`
- [ ] 3.2 Migrate `convex/mortgages.ts` - Convert all 5 mutation functions to `authMutation`
- [ ] 3.3 Test: Verify mortgage detail pages load correctly
- [ ] 3.4 Test: Verify mortgage CRUD operations work with auth

## 4. Backend Migration - Borrowers Domain

- [ ] 4.1 Migrate `convex/borrowers.ts` - Convert all 4 query functions to `authQuery`
- [ ] 4.2 Migrate `convex/borrowers.ts` - Convert `createBorrower`, `updateBorrower` to `authMutation`
- [ ] 4.3 Test: Verify borrower search and management work

## 5. Backend Migration - Payments Domain

- [ ] 5.1 Migrate `convex/payments.ts` - Convert all 5 query functions to `authQuery`
- [ ] 5.2 Migrate `convex/payments.ts` - Convert all 4 mutation functions to `authMutation`
- [ ] 5.3 Test: Verify payment history displays correctly
- [ ] 5.4 Test: Verify payment creation/updates work

## 6. Backend Migration - Comparables Domain

- [ ] 6.1 Migrate `convex/comparables.ts` - Convert all 3 query functions to `authQuery`
- [ ] 6.2 Migrate `convex/comparables.ts` - Convert all 4 mutation functions to `authMutation`
- [ ] 6.3 Test: Verify comparables display on listing detail pages

## 7. Backend Migration - Ownership Domain

- [ ] 7.1 Migrate `convex/ownership.ts` - Convert all 5 query functions to `authQuery`
- [ ] 7.2 Migrate `convex/ownership.ts` - Convert all 4 mutation functions to `authMutation`
- [ ] 7.3 Test: Verify ownership queries return correct data
- [ ] 7.4 Test: Verify ownership transfers work with auth

## 8. Backend Migration - Lock Requests Domain

- [ ] 8.1 Migrate `convex/lockRequests.ts` - Convert all 10 query functions to `authQuery`
- [ ] 8.2 Migrate `convex/lockRequests.ts` - Convert all 4 mutation functions to `authMutation`
- [ ] 8.3 Test: Verify lock request workflows work end-to-end

## 9. Backend Migration - Deals Domain

- [ ] 9.1 Migrate `convex/deals.ts` - Convert all 7 query functions to `authQuery`
- [ ] 9.2 Migrate `convex/deals.ts` - Convert all 5 mutation functions to `authMutation`
- [ ] 9.3 Test: Verify deal kanban board loads correctly
- [ ] 9.4 Test: Verify deal state transitions work

## 10. Backend Migration - Alerts Domain

- [ ] 10.1 Migrate `convex/alerts.ts` - Convert all 5 query functions to `authQuery`
- [ ] 10.2 Migrate `convex/alerts.ts` - Convert all 5 mutation functions to `authMutation`
- [ ] 10.3 Test: Verify alerts page displays correctly
- [ ] 10.4 Test: Verify alert read/unread operations work

## 11. Backend Migration - Onboarding Domain

- [ ] 11.1 Migrate `convex/onboarding.ts` - Convert `getJourney`, `listPending` to `authQuery`
- [ ] 11.2 Migrate `convex/onboarding.ts` - Convert all 5 mutation functions to `authMutation`
- [ ] 11.3 Migrate `convex/onboarding.ts` - Convert `generateDocumentUploadUrl` to `authAction`
- [ ] 11.4 Test: Verify onboarding flow works end-to-end

## 12. Backend Migration - Organizations Domain

- [ ] 12.1 Migrate `convex/organizations.ts` - Convert `listOrganizations` to `authQuery`
- [ ] 12.2 Test: Verify organization listing works

## 13. Backend Migration - Storage Domain

- [ ] 13.1 Review `convex/storage.ts` - Determine if functions should be public or authenticated
- [ ] 13.2 Migrate authenticated storage functions to `authQuery`/`authMutation` if needed
- [ ] 13.3 Test: Verify file upload/download works

## 14. Frontend Migration - Profile Pages

- [ ] 14.1 Migrate `app/(auth)/profile/page.tsx` - Replace `useQuery` with `useAuthenticatedQuery`
- [ ] 14.2 Migrate `app/(auth)/profilev2/page.tsx` - Remove `preloadQuery`, use reactive query in client component
- [ ] 14.3 Migrate `app/(auth)/profilev2/ProfileForm.tsx` - Use `useAuthenticatedQuery` instead of preloaded data
- [ ] 14.4 Test: Verify profile pages load and update correctly

## 15. Frontend Migration - Listings Pages

- [ ] 15.1 Migrate `app/(auth)/listings/page.tsx` - Remove `preloadQuery` pattern
- [ ] 15.2 Migrate `app/(auth)/listings/listings-client.tsx` - Already using `useAuthenticatedQuery`, verify it works correctly
- [ ] 15.3 Migrate `app/(auth)/listings/[id]/page.tsx` - Remove all `preloadQuery` calls, convert to client component with reactive queries
- [ ] 15.4 Test: Verify listings page loads correctly
- [ ] 15.5 Test: Verify listing detail page loads correctly

## 16. Frontend Migration - Dashboard Pages

- [ ] 16.1 Migrate `app/(auth)/dashboard/alerts/page.tsx` - Replace `useQuery` with `useAuthenticatedQuery` or `useAuthenticatedQueryWithStatus`
- [ ] 16.2 Migrate `app/(auth)/dashboard/admin/deals/[id]/page.tsx` - Replace `useQuery` with `useAuthenticatedQuery`
- [ ] 16.3 Migrate `app/(auth)/dashboard/admin/deals/components/DealKanbanBoard.tsx` - Replace `useQuery` calls
- [ ] 16.4 Migrate `app/(auth)/dashboard/admin/lock-requests/page.tsx` - Replace `useQuery` calls
- [ ] 16.5 Migrate `app/(auth)/dashboard/admin/lock-requests/components/LockRequestsTable.tsx` - Replace `useQuery` calls
- [ ] 16.6 Migrate `app/(auth)/dashboard/admin/lock-requests/components/LockRequestDetail.tsx` - Replace `useQuery` calls
- [ ] 16.7 Migrate `app/(auth)/dashboard/admin/onboarding/queue.tsx` - Replace `useQuery` calls
- [ ] 16.8 Migrate `app/(auth)/dashboard/admin/listings/manage/page.tsx` - Remove `preloadQuery`, use reactive query
- [ ] 16.9 Migrate `app/(auth)/dashboard/admin/listings/new/ListingCreationForm.tsx` - Replace `useQuery` calls
- [ ] 16.10 Test: Verify all dashboard pages load correctly

## 17. Frontend Migration - Onboarding Pages

- [ ] 17.1 Migrate `app/onboarding/page.tsx` - Remove `preloadQuery`, convert to client component with reactive query
- [ ] 17.2 Test: Verify onboarding flow works correctly

## 18. Frontend Migration - Server Pages

- [ ] 18.1 Migrate `app/server/page.tsx` - Remove `preloadQuery` if it requires auth, or document as public example
- [ ] 18.2 Migrate `app/server/inner.tsx` - Update to use reactive query if needed

## 19. Testing & Validation

- [ ] 19.1 Run E2E tests for all authenticated flows
- [ ] 19.2 Verify no `preloadQuery` calls remain for authenticated data
- [ ] 19.3 Verify all `useQuery` calls requiring auth use authenticated hooks
- [ ] 19.4 Verify RBAC context is accessible in all migrated backend functions
- [ ] 19.5 Performance test: Verify no regressions from removing preloading
- [ ] 19.6 Security audit: Verify authentication is enforced everywhere
- [ ] 19.7 Type check: Ensure no TypeScript errors from migration

## 20. Documentation & Cleanup

- [ ] 20.1 Update `CLAUDE.md` with new auth patterns
- [ ] 20.2 Add examples to `convex/lib/server.ts` and `convex/lib/client.ts` documentation
- [ ] 20.3 Remove any deprecated auth helper code
- [ ] 20.4 Update migration guide if needed


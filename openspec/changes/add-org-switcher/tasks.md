# Implementation Tasks

## 1. Backend - Convex Queries
- [ ] 1.1 Add `getUserOrganizations` query in `convex/organizations.ts` to fetch organizations for a user
- [ ] 1.2 Add `getCurrentOrganization` query to get the active organization context
- [ ] 1.3 Add unit tests for new queries

## 2. Frontend - UI Components
- [ ] 2.1 Update UserAvatarMenu to fetch user's organizations
- [ ] 2.2 Add organization list section in dropdown menu
- [ ] 2.3 Add visual indicator for current/active organization
- [ ] 2.4 Display organization name in menu header when applicable
- [ ] 2.5 Handle loading and empty states for organizations list

## 3. Organization Context Management
- [ ] 3.1 Implement organization switching logic (update active org in session/context)
- [ ] 3.2 Add organization context to ConvexClientProvider or create new context provider
- [ ] 3.3 Ensure organization changes trigger necessary re-fetches/updates

## 4. Testing & Polish
- [ ] 4.1 Add Storybook story for UserAvatarMenu with multiple organizations
- [ ] 4.2 Add E2E test for organization switching flow
- [ ] 4.3 Test with users who have 0, 1, and multiple organizations
- [ ] 4.4 Verify accessibility (keyboard navigation, screen readers)
- [ ] 4.5 Add visual feedback for organization switch action


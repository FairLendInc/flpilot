# Implementation Tasks

**Note:** Implementation deviated from original plan. Organization switcher was built as a standalone component in the profile page (`/profilev2`) rather than integrated into UserAvatarMenu dropdown. Full UserAvatarMenu integration remains pending.

## 1. Backend - Convex Queries
- [x] 1.1 Add query to fetch organizations for a user (implemented in `convex/profile.ts::getCurrentUserProfile`)
- [x] 1.2 Add query to get the active organization context (tracked via `user.active_organization_id`)
- [ ] 1.3 Add unit tests for new queries

## 2. Frontend - UI Components (Profile Page Implementation)
- [x] 2.1 Create OrganizationSwitcher component (`app/(auth)/profilev2/components/OrganizationSwitcher.tsx`)
- [x] 2.2 Add organization list section in component
- [x] 2.3 Add visual indicator for current/active organization
- [x] 2.4 Display organization name and role details
- [x] 2.5 Handle loading and empty states for organizations list

## 2-B. Frontend - UserAvatarMenu Integration (NOT COMPLETED)
- [ ] 2-B.1 Update UserAvatarMenu to fetch user's organizations
- [ ] 2-B.2 Add organization list section in UserAvatarMenu dropdown
- [ ] 2-B.3 Add visual indicator for current/active organization in dropdown
- [ ] 2-B.4 Display organization name in UserAvatarMenu header when applicable

## 3. Organization Context Management
- [x] 3.1 Implement organization switching logic (implemented in ProfileForm with `updateActiveOrganization` mutation)
- [x] 3.2 Organization data managed through Convex user profile query
- [x] 3.3 Organization changes trigger re-fetches via Convex reactive queries

## 4. Testing & Polish
- [x] 4.1 Add Storybook story for OrganizationSwitcher component (`OrganizationSwitcher.stories.tsx`)
- [ ] 4.2 Add E2E test for organization switching flow
- [x] 4.3 Component handles users with 0, 1, and multiple organizations
- [x] 4.4 Component uses accessible Select primitive (keyboard navigation, ARIA)
- [x] 4.5 Visual feedback via loading states and role badges


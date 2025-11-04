# Organization Switcher in User Avatar Menu

## Why
Users who belong to multiple WorkOS organizations need an intuitive way to switch between organizations without navigating away from the current page or signing out. Currently, there's no visible UI for switching between organizations.

## What Changes
- Add organization switching functionality to the UserAvatarMenu dropdown component
- Display list of user's organizations with current organization highlighted
- Create Convex query to fetch user's organizations based on WorkOS user ID
- Switch active organization context when user selects a different organization
- Show organization name/info in the dropdown menu header when user is part of an organization

## Impact
- **Affected specs**: New capability `user-interface` (no existing specs)
- **Affected code**:
  - `components/auth/UserAvatarMenu.tsx` - Add organization switcher UI
  - `convex/organizations.ts` - Add query to fetch user organizations
  - Potentially `ConvexClientProvider.tsx` or auth context for managing active organization state


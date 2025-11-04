# Profile Picture Strategy

## Priority Order

1. **WorkOS OAuth Picture** (Highest Priority)
   - Source: Google, Microsoft, GitHub, etc.
   - Read-only, cannot be modified via WorkOS API
   - Always shown when available

2. **Custom Uploaded Picture** (Fallback)
   - Source: User uploads via our app
   - Stored in Convex
   - Only shown when no OAuth picture exists

3. **Initials** (Default)
   - Generated from user's name or email
   - Shown when no pictures are available

## Why This Approach?

- **Trust**: OAuth pictures come from verified providers
- **Consistency**: User sees same picture across all OAuth-connected apps
- **Simplicity**: No confusion about which picture to use
- **API Limitation**: WorkOS doesn't support updating OAuth pictures anyway

## Implementation Details

- WorkOS picture checked via: `workOsIdentity.profile_picture_url`
- Custom picture stored in: `users.profile_picture_url` (Convex)
- Upload disabled when: WorkOS picture is present
- Components affected:
  - `app/(auth)/profilev2/profileForm.tsx`
  - `components/auth/UserAvatarMenu.tsx`

## Code Implementation

### ProfileForm Component

```typescript
// Compute WorkOS picture availability
const workosImageUrl = (userProfileData.workOsIdentity as any)?.profile_picture_url || null;
const hasWorkOSPicture = !!workosImageUrl;

// Priority order
const imageUrl =
    workosImageUrl ||
    userProfileData.user?.profile_picture_url ||
    userProfileData.user?.profile_picture ||
    "";
```

### UserAvatarMenu Component

```typescript
const imageUrl = useMemo(() => {
  // 1. WorkOS OAuth picture (highest priority)
  const workosUrl = (user as any)?.profilePictureUrl;
  if (workosUrl) return workosUrl;
  
  // 2. Custom uploaded picture (fallback)
  if (userProfile?.user?.profile_picture_url) {
    return userProfile.user.profile_picture_url;
  }
  if (userProfile?.user?.profile_picture) {
    return userProfile.user.profile_picture;
  }
  
  return null;
}, [user, userProfile]);
```

## UI Behavior

- When WorkOS picture exists:
  - Edit button is hidden
  - Message displayed: "Using OAuth provider picture"
  - Upload functionality is disabled

- When no WorkOS picture:
  - Edit button is shown
  - User can upload custom picture
  - Custom picture stored in Convex only

## Future Considerations

If we want to allow custom pictures even with OAuth:
1. Add UI toggle to "override OAuth picture"
2. Update priority logic to check override flag
3. Consider UX implications of picture inconsistency
4. Add database field: `override_oauth_picture: boolean`

## Testing Checklist

- [ ] Verify WorkOS picture shows when present
- [ ] Verify upload button is hidden when WorkOS picture exists
- [ ] Verify custom picture shows when no WorkOS picture
- [ ] Verify initials show when no pictures at all
- [ ] Verify both components use same priority logic
- [ ] Test switching between organizations with different picture setups
- [ ] Test uploading picture when no OAuth picture exists
- [ ] Verify uploaded picture persists across sessions


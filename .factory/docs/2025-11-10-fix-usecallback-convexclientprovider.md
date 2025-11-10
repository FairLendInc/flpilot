## Fix: Remove useCallback usage in ConvexClientProvider.tsx

### Problem
The `ConvexClientProvider.tsx` file contains a `useCallback` usage (lines 41-62) that conflicts with the project's React Compiler guidelines. This project uses React Compiler for automatic performance optimization, which renders manual `useCallback` usage unnecessary and against established patterns.

### Solution
Remove the `useCallback` wrapper and convert `fetchAccessToken` to a plain function to comply with React Compiler best practices.

### Changes Required
1. Remove `useCallback` import from React
2. Convert `fetchAccessToken` from a `useCallback` wrapped function to a plain function
3. Remove manual dependency array tracking
4. Let React Compiler handle optimization automatically

### Code Changes
**Before:**
```typescript
const fetchAccessToken = useCallback(
  async ({ forceRefreshToken }: { forceRefreshToken?: boolean } = {}): Promise<string | null> => {
    // ... function logic
  },
  [user, refresh, getAccessToken]
);
```

**After:**
```typescript
function fetchAccessToken({
  forceRefreshToken,
}: {
  forceRefreshToken?: boolean;
} = {}): Promise<string | null> {
  // ... function logic
}
```

### Benefits
- Aligns with project React Compiler guidelines
- Removes unnecessary manual optimization
- Cleaner, more readable code
- Leverages React Compiler's automatic performance optimization

This is a minimal, focused change that improves code quality and maintains consistency with project patterns.
# Property Map Zoom Center Displacement Fix

## Problem

The `PropertyMap` component had an issue where when users zoomed in on the map, the center point of the zoom was displaced up and to the left, causing disorienting behavior.

## Root Cause

The issue was caused by the popup being automatically toggled (shown) immediately after map initialization:

```typescript
// PROBLEMATIC CODE (removed)
marker.togglePopup(); // This caused the center displacement!
```

When the popup was shown on load, Mapbox would adjust the map's view to accommodate the popup, which displaced the center point. This affected all subsequent zoom operations, causing them to be offset from the expected center.

## Solution

The fix involved three key changes:

### 1. Removed Automatic Popup Toggle

**Before:**
```typescript
// Add marker and show popup immediately
const marker = new mapboxgl.Marker({ color: "#ef4444" })
  .setLngLat([location.lng, location.lat])
  .setPopup(/* popup config */)
  .addTo(map.current);

// This line caused the issue!
marker.togglePopup();
```

**After:**
```typescript
// Add marker without showing popup
const marker = new mapboxgl.Marker({ color: "#ef4444" })
  .setLngLat([location.lng, location.lat])
  .setPopup(/* popup config */)
  .addTo(map.current);

// Don't toggle popup immediately
// User can click marker to show popup when needed
```

### 2. Added `preserveDrawingBuffer` Option

Added `preserveDrawingBuffer: true` to the map initialization to improve zoom behavior and maintain visual state:

```typescript
map.current = new mapboxgl.Map({
  container: mapContainer.current,
  style: "mapbox://styles/mapbox/streets-v12",
  center: [location.lng, location.lat],
  zoom: 14,
  interactive: true,
  attributionControl: true,
  // Improve zoom behavior and prevent center displacement
  preserveDrawingBuffer: true,
});
```

### 3. Fixed Popup Positioning

Set consistent popup anchor positioning:

```typescript
new mapboxgl.Popup({
  offset: 25,
  closeOnClick: false,
  closeButton: true,
  // Position popup consistently
  anchor: "bottom",
})
```

## User Experience Changes

### Before Fix
- ❌ Zoom center displaced up and left
- ❌ Popup shown by default (not user-initiated)
- ❌ Disorienting zoom behavior

### After Fix
- ✅ Zoom centers properly on clicked location
- ✅ Popup only shows when user clicks marker
- ✅ Smooth, expected zoom behavior
- ✅ User has control over when to view property details

## Technical Details

### Why `preserveDrawingBuffer` Helps

The `preserveDrawingBuffer` option helps maintain:
- Map rendering state during interactions
- Proper center calculations for zoom operations
- Visual consistency during map transitions

### Why Removing `togglePopup()` Fixes the Issue

When `togglePopup()` was called immediately:
1. Map initialized with correct center
2. Popup automatically opened
3. Map adjusted view to fit popup (位移开始!)
4. Subsequent zoom operations used the displaced center

By removing the automatic popup:
1. Map initializes with correct center
2. No automatic view adjustment
3. Center point remains stable
4. Zoom operations work as expected

## Testing

To verify the fix:

1. **Zoom In Test:**
   - Click zoom in button multiple times
   - Verify center point stays stable
   - Check that marker remains in center

2. **Zoom Out Test:**
   - Zoom in, then zoom out
   - Verify returns to original center
   - Check no cumulative displacement

3. **Popup Test:**
   - Click marker to open popup
   - Verify popup shows property details
   - Click X or outside to close popup
   - Verify map center remains stable

## Benefits

- ✅ **Better UX**: Zoom works as users expect
- ✅ **User Control**: Popup shows only when user wants it
- ✅ **Performance**: `preserveDrawingBuffer` improves rendering
- ✅ **Maintainability**: Clearer code with explanatory comments

## Files Modified

- `components/listing-detail/property-map.tsx`

## Backward Compatibility

- ✅ No breaking changes
- ✅ Same API interface
- ✅ Same visual appearance (except popup behavior)
- ✅ All existing functionality preserved

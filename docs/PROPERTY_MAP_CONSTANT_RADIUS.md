# Property Map - Constant 0.5km Radius Fix

## Problem

The radius circle was **growing as you zoom out** instead of maintaining a constant 0.5km visual size. This made it unusable as a reference for property location and area.

## Root Cause

In Mapbox GL JS, when you set `circle-radius` in meters, it **scales exponentially with zoom level**:

- Each zoom level doubles the scale
- At zoom 14: 500 meters = 0.5km visual size
- At zoom 13: 500 meters = 1.0km visual size (doubles!)
- At zoom 15: 500 meters = 0.25km visual size (halves!)

This is why the circle appeared to grow when zooming out.

## Solution: Zoom-Based Expression

To maintain a **constant 0.5km visual radius** regardless of zoom, we use a **zoom-based interpolation expression** that adjusts the radius in meters for each zoom level.

### The Formula

```typescript
const calculateRadiusMeters = (zoomLevel: number, targetKm: number = 0.5): number => {
  const baseZoom = 14;
  const baseMeters = targetKm * 1000; // Convert km to meters
  return baseMeters * Math.pow(2, baseZoom - zoomLevel);
};
```

**How it works:**
- **Base case** (zoom 14): 500 meters = 0.5km ✓
- **Zoom out** (zoom 13): 500 × 2^(14-13) = 1000 meters
- **Zoom in** (zoom 15): 500 × 2^(14-15) = 250 meters

### Implementation

```typescript
map.current?.addLayer({
  id: "property-radius",
  type: "circle",
  source: "property-location",
  paint: {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      0, calculateRadiusMeters(0, 0.5),   // Very zoomed out
      5, calculateRadiusMeters(5, 0.5),
      10, calculateRadiusMeters(10, 0.5),
      14, calculateRadiusMeters(14, 0.5), // Baseline zoom
      15, calculateRadiusMeters(15, 0.5), // Zoomed in
      20, calculateRadiusMeters(20, 0.5), // Very zoomed in
    ] as any,
    "circle-color": "#ef4444",
    "circle-opacity": 0.2,
    "circle-stroke-width": 2,
    "circle-stroke-color": "#ef4444",
    "circle-stroke-opacity": 0.5,
  },
});
```

## Zoom Level Examples

| Zoom Level | Radius (meters) | Visual Size | Calculation |
|------------|----------------|-------------|-------------|
| 13 | 1000m | 0.5km | 500 × 2^1 |
| 14 | 500m | 0.5km | 500 × 2^0 (baseline) |
| 15 | 250m | 0.5km | 500 × 2^-1 |
| 16 | 125m | 0.5km | 500 × 2^-2 |

The formula `2^(baseZoom - currentZoom)` ensures that as zoom changes, the meter value adjusts to maintain constant visual size.

## Visual Result

```
Zoom 13 (Zoomed Out)
┌─────────────────────────────────┐
│    ● ← 1000m radius (0.5km)    │
│   ●●●                           │
│  ●●●●●                          │
│ ●●●●●●●                         │
│  ●●●●●                          │
│   ●●●                           │
│    ●                            │
└─────────────────────────────────┘

Zoom 14 (Baseline)
┌─────────────────────────────────┐
│     ○ ← 500m radius (0.5km)     │
│    ●●●                          │
│   ●●●●●                         │
│  ●●●●●●●                        │
│   ●●●●●                         │
│    ●●●                          │
│     ○                           │
└─────────────────────────────────┘

Zoom 15 (Zoomed In)
┌─────────────────────────────────┐
│      ● ← 250m radius (0.5km)    │
│     ●●●                         │
│    ●●●●●                        │
│   ●●●●●●●                       │
│    ●●●●●                        │
│     ●●●                         │
│      ●                          │
└─────────────────────────────────┘
```

All three show **0.5km radius** visually, despite different meter values!

## Benefits

✅ **Constant visual size** - Always 0.5km regardless of zoom
✅ **Accurate reference** - Users can gauge property area easily
✅ **Consistent UX** - No surprises when zooming
✅ **Better context** - Circle shows meaningful area around property
✅ **No growth/shrink** - Stable appearance during zoom operations

## Technical Details

### Mapbox Zoom Scaling

Mapbox uses exponential scaling for zoom levels:
- Zoom N+1 = 2× zoom N scale
- At zoom 14: 1 meter ≈ 1 unit
- At zoom 15: 1 meter ≈ 2 units
- At zoom 13: 1 meter ≈ 0.5 units

### Why This Works

By adjusting the meter value inversely proportional to the zoom scale:
- **Higher zoom** (15) → **Smaller meters** (250) → Same visual size
- **Lower zoom** (13) → **Larger meters** (1000) → Same visual size
- Visual size remains constant at 0.5km

### Expression Interpolation

The Mapbox expression interpolates between the defined zoom levels:
- Between 14 and 15: linearly interpolates between 500m and 250m
- Outside range (e.g., zoom 12): extrapolates using same formula
- Smooth transitions during zoom animations

## Customization

### Change Radius

To use different radius (e.g., 1km):

```typescript
const targetKm = 1.0; // Change this value
calculateRadiusMeters(zoom, targetKm)
```

### Add More Zoom Levels

For smoother interpolation, add more zoom levels:

```typescript
"circle-radius": [
  "interpolate",
  ["linear"],
  ["zoom"],
  10, calculateRadiusMeters(10, 0.5),
  11, calculateRadiusMeters(11, 0.5),
  12, calculateRadiusMeters(12, 0.5),
  13, calculateRadiusMeters(13, 0.5),
  14, calculateRadiusMeters(14, 0.5),
  15, calculateRadiusMeters(15, 0.5),
  16, calculateRadiusMeters(16, 0.5),
  17, calculateRadiusMeters(17, 0.5),
]
```

## Testing

### Manual Test
1. Load map with property location
2. **Zoom out** from zoom 14 to zoom 10
3. Verify circle radius **stays the same** visually
4. **Zoom in** from zoom 14 to zoom 18
5. Verify circle radius **stays the same** visually
6. Use zoom controls (+/- buttons)
7. Observe smooth transitions with constant size

### Expected Behavior
- ✅ Circle appears 0.5km radius at ALL zoom levels
- ✅ No visible growth when zooming out
- ✅ No visible shrink when zooming in
- ✅ Smooth interpolation during zoom animations

## Files Modified

- `components/listing-detail/property-map.tsx`

## Backward Compatibility

- ✅ Same component API
- ✅ Same visual design (just better sizing)
- ✅ Same performance characteristics
- ✅ Same cleanup and error handling

## Browser Support

Works in all modern browsers that support:
- Mapbox GL JS
- Canvas rendering
- JavaScript Math.pow()

## Performance Impact

- ✅ **Negligible** - Expression evaluated on GPU
- ✅ **Smooth animations** - Hardware accelerated
- ✅ **No re-renders** - Mapbox handles zoom internally

The constant radius makes the map much more useful as a reference tool for understanding property location and surrounding area!

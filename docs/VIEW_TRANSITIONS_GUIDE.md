# View Transitions Guide 🎨

A comprehensive guide to using the view transitions available in this project.

## Quick Start

Visit the demo pages to see all transitions in action:
- **Interactive Demo**: `/transitions-demo` - Click buttons to see each transition
- **Page Navigation Demo**: `/page-transitions` - Navigate between pages to see transitions

## Available Transitions

### Basic Transitions

#### 1. Cross Fade ✨
**CSS Name**: `cross-fade`
**Duration**: 300ms
**Best for**: Simple content changes, general navigation

```tsx
<div style={{ viewTransitionName: "cross-fade" }}>
  Your content
</div>
```

#### 2. Zoom 🔍
**CSS Name**: `zoom-out` (for old content) / `zoom-in` (for new content)
**Duration**: 350ms
**Best for**: Modal dialogs, detail views, focus states

```tsx
<div style={{ viewTransitionName: "zoom-out" }}>
  Your content
</div>
```

#### 3. Blur Fade 🌫️
**CSS Name**: `blur-fade`
**Duration**: 300ms
**Best for**: Modern content changes, smooth navigation

```tsx
<div style={{ viewTransitionName: "blur-fade" }}>
  Your content
</div>
```

#### 4. 3D Flip 🔄
**CSS Name**: `flip`
**Duration**: 400ms
**Best for**: Card reveals, dramatic transitions

```tsx
<div style={{ viewTransitionName: "flip" }}>
  Your content
</div>
```

#### 5. Bounce 🎾
**CSS Name**: `bounce-in`
**Duration**: 600ms (with elastic easing)
**Best for**: Playful interactions, attention-grabbing

```tsx
<div style={{ viewTransitionName: "bounce-in" }}>
  Your content
</div>
```

### Directional Transitions

#### 6. Slide Left ⬅️
**CSS Name**: `slide-left`
**Duration**: 300ms
**Best for**: Navigation backward, left-to-right languages

```tsx
<div style={{ viewTransitionName: "slide-left" }}>
  Your content
</div>
```

#### 7. Slide Right ➡️
**CSS Name**: `slide-right`
**Duration**: 300ms
**Best for**: Navigation forward, left-to-right languages

```tsx
<div style={{ viewTransitionName: "slide-right" }}>
  Your content
</div>
```

#### 8. Slide + Fade ↗️
**CSS Name**: `slide-fade-out`
**Duration**: 300ms
**Best for**: Subtle directional changes with depth

```tsx
<div style={{ viewTransitionName: "slide-fade-out" }}>
  Your content
</div>
```

#### 9. Wipe Left ◀️
**CSS Name**: `wipe-left`
**Duration**: 350ms
**Best for**: Revealing new content from left

```tsx
<div style={{ viewTransitionName: "wipe-left" }}>
  Your content
</div>
```

#### 10. Wipe Right ▶️
**CSS Name**: `wipe-right`
**Duration**: 350ms
**Best for**: Revealing new content from right

```tsx
<div style={{ viewTransitionName: "wipe-right" }}>
  Your content
</div>
```

### Special Effects

#### 11. Rotate 🌀
**CSS Name**: `rotate-out`
**Duration**: 400ms
**Best for**: Unique attention-grabbing transitions

```tsx
<div style={{ viewTransitionName: "rotate-out" }}>
  Your content
</div>
```

#### 12. Iris/Circle Expand ⭕
**CSS Name**: `iris`
**Duration**: 400ms
**Best for**: Modal dialogs, spotlight focus, dramatic reveals

```tsx
<div style={{ viewTransitionName: "iris" }}>
  Your content
</div>
```

#### 13. Dissolve 💫
**CSS Name**: `dissolve`
**Duration**: 400ms
**Best for**: Dream sequences, fantasy themes, soft transitions

```tsx
<div style={{ viewTransitionName: "dissolve" }}>
  Your content
</div>
```

#### 14. Stack 📚
**CSS Name**: `stack-out`
**Duration**: 350ms
**Best for**: Card interfaces, layer management, depth emphasis

```tsx
<div style={{ viewTransitionName: "stack-out" }}>
  Your content
</div>
```

#### 15. Glitch ⚡
**CSS Name**: `glitch`
**Duration**: 300ms (stepped animation)
**Best for**: Error states, tech themes, cyberpunk aesthetics

```tsx
<div style={{ viewTransitionName: "glitch" }}>
  Your content
</div>
```

## Usage Patterns

### Pattern 1: Page Navigation

For page-to-page transitions, add the `viewTransitionName` style to your main container:

```tsx
export default function MyPage() {
  return (
    <div style={{ viewTransitionName: "blur-fade" }}>
      {/* Your page content */}
    </div>
  );
}
```

### Pattern 2: Component Transitions

For component-level transitions with React state:

```tsx
"use client";

import { useState, startTransition } from "react";

export function MyComponent() {
  const [content, setContent] = useState(0);

  const handleChange = () => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        startTransition(() => {
          setContent(prev => prev + 1);
        });
      });
    } else {
      startTransition(() => {
        setContent(prev => prev + 1);
      });
    }
  };

  return (
    <div>
      <div style={{ viewTransitionName: "zoom-out" }}>
        Content {content}
      </div>
      <button onClick={handleChange}>Change</button>
    </div>
  );
}
```

### Pattern 3: Using with React Router/Next.js Links

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition } from "react";

export function NavLink({ href, children }) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        startTransition(() => {
          router.push(href);
        });
      });
    } else {
      router.push(href);
    }
  };

  return (
    <Link href={href} onClick={handleClick}>
      {children}
    </Link>
  );
}
```

## Browser Support

View Transitions API is currently supported in:
- ✅ Chrome 111+
- ✅ Edge 111+
- ✅ Opera 97+
- ❌ Firefox (in development)
- ❌ Safari (not yet supported)

### Fallback Handling

The code includes automatic fallback for unsupported browsers. In browsers without View Transitions API support, content will change instantly without animation.

```tsx
if (document.startViewTransition) {
  // Use view transitions
  document.startViewTransition(() => {
    // Update state
  });
} else {
  // Direct update without transition
  // Update state
}
```

## Accessibility

All transitions respect the user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none;
    transition: none;
  }
}
```

Users who have enabled "Reduce Motion" in their system settings will see instant content changes without animations.

## Performance Tips

1. **Keep it Simple**: Use transitions sparingly for better performance
2. **Unique Names**: Each transitioning element should have a unique `viewTransitionName`
3. **Avoid Nesting**: Don't nest view transition names
4. **Test on Devices**: Always test on mobile devices for smooth 60fps performance

## Customization

All transition CSS is in `app/globals.css`. To modify a transition:

1. Find the transition in `globals.css` (search for the CSS name)
2. Modify the keyframes or animation properties
3. Changes will apply immediately in development

## Examples in the Codebase

- **Interactive Demo**: `app/(auth)/transitions-demo/page.tsx`
- **Page Transitions**: `app/(auth)/page-transitions/*/page.tsx`
- **Transition Wrapper**: `components/transitions/ViewTransitionWrapper.tsx`
- **Hook**: `components/transitions/useNavigationTransition.ts`

## Best Practices

1. **Match Context**: Choose transitions that match the user's mental model
2. **Consistency**: Use similar transitions for similar actions
3. **Duration**: Keep transitions under 500ms for responsiveness
4. **Meaning**: Directional transitions should match navigation direction
5. **Test**: Always test with real content and on target devices

## Troubleshooting

### Transition Not Working?
- Check browser support (Chrome 111+)
- Ensure `viewTransitionName` is unique
- Verify `startTransition` is being used
- Check console for errors

### Transition Too Fast/Slow?
- Modify duration in `globals.css`
- Look for the `animation:` property with the duration value
- Example: `300ms` can be changed to `500ms`

### Content Flashing?
- Make sure only the specific changing content has `viewTransitionName`
- Avoid applying it to parent containers that don't change

## Further Reading

- [MDN: View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
- [Chrome Developers: Smooth transitions](https://developer.chrome.com/docs/web-platform/view-transitions/)
- [CSS Tricks: View Transitions](https://css-tricks.com/view-transitions/)


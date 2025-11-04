# HeroUI v3 > design-principles > Design Principles
URL: /docs/design-principles
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/design-principles.mdx

Core principles that guide HeroUI v3's design and development
        
***

title: Design Principles
description: Core principles that guide HeroUI v3's design and development
icon: book
----------

## Overview

HeroUI v3 follows 10 core principles that prioritize clarity, accessibility, customization, and developer experience.

## Core Principles

### 1. Semantic Intent Over Visual Style

Components use semantic naming (primary, secondary, tertiary) instead of visual descriptions (solid, flat, bordered).

Inspired by [Uber's Base design system](https://base.uber.com/6d2425e9f/p/756216-button), our variants follow a clear hierarchy:

<DocsImage src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/semantic-intent.jpg" darkSrc="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/semantic-intent-dark.jpg" alt="Semantic Intent Hierarchy" />

```tsx
// ✅ Semantic variants communicate hierarchy
<Button variant="primary">Save</Button>
<Button variant="secondary">Edit</Button>
<Button variant="tertiary">Cancel</Button>
```

| Variant       | Purpose                           | Usage            |
| ------------- | --------------------------------- | ---------------- |
| **Primary**   | Main action to move forward       | 1 per context    |
| **Secondary** | Alternative actions               | Multiple allowed |
| **Tertiary**  | Dismissive actions (cancel, skip) | Sparingly        |
| **Danger**    | Destructive actions               | When needed      |

### 2. Accessibility as Foundation

Built on [React Aria Components](https://react-spectrum.adobe.com/react-aria/) for WCAG 2.1 AA compliance, keyboard navigation, and screen reader support.

```tsx
// Automatic ARIA attributes, keyboard navigation, and focus management
import { Tabs, TabList, Tab, TabPanel } from '@heroui/react';

<Tabs defaultSelectedKey="profile">
  <TabList aria-label="Settings">
    <Tab id="profile">Profile</Tab>
    <Tab id="security">Security</Tab>
  </TabList>
  <TabPanel id="profile">Content</TabPanel>
  <TabPanel id="security">Content</TabPanel>
</Tabs>
```

### 3. Composition Over Configuration

Compound components let you rearrange, customize, or omit parts as needed.

```tsx
// Compose parts to build exactly what you need
import {
  Accordion,
  AccordionItem,
  AccordionHeading,
  AccordionTrigger,
  AccordionIndicator,
  AccordionPanel,
  AccordionBody
} from '@heroui/react';

<Accordion>
  <AccordionItem id="1">
    <AccordionHeading>
      <AccordionTrigger>
        Question Text
        <AccordionIndicator />
      </AccordionTrigger>
    </AccordionHeading>
    <AccordionPanel>
      <AccordionBody>Answer content</AccordionBody>
    </AccordionPanel>
  </AccordionItem>
</Accordion>
```

### 4. Progressive Disclosure

Start simple, add complexity only when needed.

```tsx
// Level 1: Minimal
<Button>Click me</Button>

// Level 2: Enhanced
<Button variant="primary" size="lg">
  <Icon icon="gravity-ui:check" className="mr-2" />
  Submit
</Button>

// Level 3: Advanced
<Button variant="primary" isDisabled={isLoading}>
  {isLoading ? <><Spinner size="sm" className="mr-2" /> Loading...</> : 'Submit'}
</Button>
```

### 5. Predictable Behavior

Consistent patterns across all components: sizes (`sm`, `md`, `lg`), variants, className support, and data attributes.

```tsx
// All components follow the same patterns
<Button size="lg" variant="primary" className="custom" data-pressed="true" />
<Chip size="lg" variant="success" className="custom" />
<Avatar size="lg" className="custom" />

// Compound components support both named exports and dot notation
import { Alert, AlertIcon, CardHeader, AccordionTrigger } from '@heroui/react';

// Named exports
<Alert>
  <AlertIcon />
</Alert>

// Dot notation (requires .Root)
<Alert.Root>
  <Alert.Icon />
</Alert.Root>
```

### 6. Type Safety First

Full TypeScript support with IntelliSense, auto-completion, and compile-time error detection.

```tsx
import type { ButtonProps } from '@heroui/react';

// Type-safe props and event handlers
<Button
  variant="primary"  // Autocomplete: primary | secondary | tertiary | danger | ghost
  size="md"          // Type checked: sm | md | lg
  onPress={(e) => {  // e is properly typed as PressEvent
    console.log(e.target);
  }}
/>

// Extend types for custom components
interface CustomButtonProps extends Omit<ButtonProps, 'variant'> {
  intent: 'save' | 'cancel' | 'delete';
}
```

### 7. Separation of Styles and Logic

Styles (`@heroui/styles`) are separate from logic (`@heroui/react`), enabling use with any framework or vanilla HTML.

Full Example: [Tailwind Play](https://play.tailwindcss.com/Ioomj2xdce)

```html
<!-- Use with plain HTML -->
<button class="button button--primary">Click me</button>
```

or with React:

```tsx
// Apply styles to any component
import { buttonVariants } from '@heroui/react';

<Link className={buttonVariants({ variant: "primary" })} href="/home">
  Home
</Link>
```

### 8. Developer Experience Excellence

Clear APIs, descriptive errors, IntelliSense, AI-friendly markdown docs, and Storybook for visual testing.

### 9. Complete Customization

Beautiful defaults out-of-the-box. Transform the entire look with CSS variables or BEM classes.

```css
/* Theme-wide changes with variables */
:root {
  --accent: oklch(0.7 0.25 260);
  --radius: 0.375rem;
  --spacing: 0.5rem;
}

/* Component-specific customization */
@layer components {
  .button {
    @apply uppercase tracking-wider;
  }
  .button--primary {
    @apply bg-gradient-to-r from-purple-500 to-pink-500;
  }
}
```

### 10. Open and Extensible

Wrap, extend, and customize components to match your needs.

```tsx
// Custom wrapper component
const CTAButton = ({
  intent = 'primary-cta',
  children,
  ref,
  ...props
}: CTAButtonProps) => {
  const variantMap = {
    'primary-cta': 'primary',
    'secondary-cta': 'secondary',
    'minimal': 'ghost'
  };

  return (
    <Button ref={ref} variant={variantMap[intent]} {...props}>
      {children}
    </Button>
  );
};
```

Or extend with Tailwind Variants:

```tsx
import { Button, buttonVariants } from '@heroui/react';
import { tv } from 'tailwind-variants';

// Extend button styles with custom variants
const myButtonVariants = tv({
  extend: buttonVariants,
  variants: {
    variant: {
      'primary-cta': 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg',
      'secondary-cta': 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50',
    }
  }
});

// Use the custom variants
function CustomButton({ variant, className, ...props }) {
  return <Button className={myButtonVariants({ variant, className })} {...props} />;
}

// Usage
<CustomButton variant="primary-cta">Get Started</CustomButton>
<CustomButton variant="secondary-cta">Learn More</CustomButton>
```

## Comparison with HeroUI v2

| Aspect                       | HeroUI v2                            | HeroUI v3                                 |
| ---------------------------- | ------------------------------------ | ----------------------------------------- |
| **Animations**               | Framer Motion                        | CSS + GPU accelerated                     |
| **Component Pattern**        | Single components with many props    | Compound components                       |
| **Variants**                 | Visual-based (solid, bordered, flat) | Semantic (primary, secondary, tertiary)   |
| **Styling**                  | Tailwind v4 partially supported      | Tailwind v4 fully supported               |
| **Accessibility**            | Excellent (React Aria powered)       | Excellent (React Aria powered)            |
| **Bundle Size**              | Larger (Bundle)                      | Smaller (tree-shakeable)                  |
| **Customization Difficulty** | Medium (Props-based)                 | Simple (Compound components + Native CSS) |


# HeroUI v3 > introduction > Introduction
URL: /docs/introduction
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/introduction.mdx

An open-source UI component library for building beautiful and accessible user interfaces.
        
***

title: Introduction
description: An open-source UI component library for building beautiful and accessible user interfaces.
icon: book-open
---------------

HeroUI is a UI library for React that helps you build beautiful and accessible user interfaces. Created on top of [Tailwind CSS v4](https://tailwindcss.com/) and [React Aria Components](https://react-spectrum.adobe.com/react-aria/index.html).

<DocsImage src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/docs-intro-cover.jpg" darkSrc="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/docs-intro-cover-dark.jpg" alt="HeroUI v3 Introduction" />

Every component is designed with care: smooth animations, polished details, and accessibility built in. It works out of the box, yet gives you the freedom to make it your own.

We believe design should not be copied and pasted. It should evolve. HeroUI gives you components that grow with you, always improving, always up to date.

## Why HeroUI?

### Beautiful by Default

Looks professional the moment you use it. No extra styling required.

### Accessible

Accessibility is not optional. With [React Aria Components](https://react-spectrum.adobe.com/react-aria/components.html), we handle focus management, keyboard navigation, and screen readers support.

### Flexible Architecture

Each component is made of parts you can control. Change what you need. Leave the rest.

### Developer Experience

Typed APIs. Predictable patterns. Autocompletion that just works.

### Ship Faster

We maintain the library so you can focus on your product. Just update the package to get bug fixes, new features, and more. No manual code changes needed.

### Optimized & Lightweight

Tree-shaken. Only what you use goes into your app.

### AI-Ready

HeroUI v3 is designed for a future where AI writes code. Components are simple for humans and AI agents to assemble into great products.

### Future-Proof

Built for [React 19](https://react.dev/blog/2024/12/05/react-19) and [Tailwind v4](https://tailwindcss.com/blog/tailwindcss-v4). Always improving with the web.

## Mission

We want to make world-class interfaces available to everyone. HeroUI turns complexity into simplicity. It helps you build apps that are beautiful, accessible, and effortless to use.

When you use HeroUI, you are not just moving faster. You are giving your users something that feels and performs better.

## Vision

The future of UI should not be tied to one framework. HeroUI v3 begins with React, but the goal is bigger: React Native, AI-driven design tools, and more.

We are building an ecosystem where interfaces are alive. Maintained, improved, and ready for whatever comes next.

### Why not copy-paste?

Copy-paste looks like control, but it is an illusion.
You paste code, it works for a while, then it breaks. You are left maintaining a pile of dependencies.

Most copy-paste UIs end up looking the same. They age. They stop evolving.

HeroUI is different. It is a living library:

* Updates and fixes flow to you automatically
* New features arrive without extra work
* Components stay current with React, Tailwind, and browsers
* You get deep customization, not shallow theme tweaks
* AI can generate clean, efficient code with HeroUI

HeroUI v3 is not a snapshot. It is a garden that keeps growing. 🌱

## HeroUI Ecosystem

Explore the full HeroUI platform:

* **🌐 HeroUI v3** (web) - You're here! React components with Tailwind CSS v4
* **📱 [HeroUI Native](https://link.heroui.com/native)** (mobile) - Beautiful components for React Native
* **🤖 [HeroUI Chat](https://heroui.chat?ref=heroui-v3)** (text-to-app) - Create beautiful apps with natural language
* **🧠 UI for LLMs** - New platform & MCPs coming soon

### Why React Aria over Radix?

We chose React Aria because it solves accessibility at scale with a strong community behind it.\
We've used it since HeroUI v2 (via hooks) and v3 keeps API conventions like `isDisabled` and `onPress`.

Huge thanks to [Devon Govett](https://x.com/devongovett) and the Adobe team for their work here.

## FAQ

### Is HeroUI free?

Yes, completely free and open source under the MIT license.

### Is it production-ready?

Currently in alpha. We're actively working towards a stable release with community feedback.

### Can I customize the components?

Yes! Use Tailwind utilities, CSS variables, BEM modifiers, or compose component parts differently. Every slot is customizable.

### Does it work with TypeScript?

Fully typed with excellent IDE support and autocompletion.

### What about accessibility?

Built on React Aria Components for WCAG compliance. Keyboard navigation, focus management, and screen reader support included.

### Can I use the styles without React?

Yes, the CSS can be applied to plain HTML. See our [Tailwind Play example](https://play.tailwindcss.com/Ioomj2xdce).

### Is there a Figma file?

Yes! You can access our Figma design system at [HeroUI Figma Kit V3](https://www.figma.com/community/file/1546526812159103429).

## Community

We're excited to see the community adopt HeroUI, raise issues, and provide feedback. Whether it's a feature request, bug report, or a project to showcase, please get involved!

* [GitHub Discussions](https://github.com/heroui-inc/heroui/discussions)
* [Discord](https://discord.gg/9b6yyZKmH4)
* [X/Twitter](https://x.com/hero_ui)

## Contributing

PRs on HeroUI are always welcome, please see our [contribution guidelines](https://github.com/heroui-inc/heroui/blob/main/CONTRIBUTING.md) to learn how you can contribute to this project.

## License

HeroUI is released under the [MIT License](https://github.com/heroui-inc/heroui/blob/main/LICENSE).


# HeroUI v3 > quick-start > Quick Start
URL: /docs/quick-start
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/quick-start.mdx

Get started with HeroUI v3 in minutes
        
***

title: Quick Start
description: Get started with HeroUI v3 in minutes
icon: rocket
------------

## Requirements

* [React 19+](https://reactjs.org/)
* [Tailwind CSS v4](https://tailwindcss.com/docs/installation/framework-guides)

## Quick Install

Install HeroUI and required dependencies:

<Tabs items={["npm", "pnpm", "yarn", "bun"]}>
  <Tab value="npm">
    ```bash
    npm i @heroui/styles@alpha @heroui/react@alpha
    ```
  </Tab>

  <Tab value="pnpm">
    ```bash
    pnpm add @heroui/styles@alpha @heroui/react@alpha
    ```
  </Tab>

  <Tab value="yarn">
    ```bash
    yarn add @heroui/styles@alpha @heroui/react@alpha
    ```
  </Tab>

  <Tab value="bun">
    ```bash
    bun add @heroui/styles@alpha @heroui/react@alpha
    ```
  </Tab>
</Tabs>

## Import Styles

Add to your main CSS file `globals.css`:

```css
@import "tailwindcss";
@import "@heroui/styles"; /* [!code highlight]*/
```

<Callout type="warning">
  Import order matters. Always import `tailwindcss` first.
</Callout>

## Use Components

```tsx
import { Button } from '@heroui/react';

function App() {
  return (
    <Button>
      My Button
    </Button>
  );
}
```

## What's Next?

* [Browse Components](/docs/components) - See all available components
* [Learn Styling](/docs/handbook/styling) - Customize with Tailwind CSS
* [Explore Patterns](/docs/handbook/composition) - Master compound components


# HeroUI v3 > changelog > Changelog
URL: /docs/changelog
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/changelog/index.mdx

All updates and changes to HeroUI v3, including new features, fixes, and breaking changes.
        
***

title: Changelog
description: All updates and changes to HeroUI v3, including new features, fixes, and breaking changes.
index: true
icon: clock-arrow-rotate-left
-----------------------------

<Callout type="info">
  **Using AI assistants?** Simply prompt "Hey Cursor, update HeroUI to the latest version" and your AI assistant will automatically compare versions and apply the necessary changes. Learn more about the [HeroUI MCP Server](/docs/ui-for-agents/mcp-server).
</Callout>

## Latest Release

### v3.0.0-alpha.35

**October 21, 2025**

#### React Server Components Support

* Fixed critical issue where compound components didn't work in React Server Components (RSC)
* Moved compound pattern logic from components to index files, resolving `"use client"` conflicts
* **(⚠️ Breaking change)**: Main component now requires `.Root` suffix (e.g., `<Avatar>` → `<Avatar.Root>`)
* Named exports remain unchanged and fully supported

#### React 19 Improvements

* Removed `forwardRef` (now native in [React 19](https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop))
* Simplified Context usage (`Context.Provider` → [React 19](https://react.dev/blog/2024/12/05/react-19#context-as-a-provider))

#### Switch Component Refactoring

* **(⚠️ Breaking change)**: Split Switch and SwitchGroup into separate components
* Cleaner API: `<SwitchGroup>` replaces `<Switch.Group>` and `<Switch.GroupItems>`
* Matches Radio/RadioGroup pattern for consistency
* Separate styles, types, and implementations

#### Affected Components

All compound components now require `.Root` suffix: `Accordion`, `Avatar`, `Card`, `Disclosure`, `Fieldset`, `Kbd`, `Link`, `Popover`, `Radio`, `Switch`, `Tabs`, `Tooltip`

[Read full release notes →](/docs/changelog/v3-0-0-alpha-35)

***

## Previous Releases

### v3.0.0-alpha.34

**October 15, 2025**

* Added Form-based components: [Description](/docs/components/description), [FieldError](/docs/components/field-error), [Fieldset](/docs/components/fieldset), [Form](/docs/components/form), [Input](/docs/components/input), [Label](/docs/components/label), [RadioGroup](/docs/components/radio-group), [TextField](/docs/components/text-field), and [TextArea](/docs/components/textarea).
* Introduced form field tokens `--field-*`
* Reorganized Storybook by category
* **(Breaking change)**: Renamed `--skeleton-default-animation-type` to `--skeleton-animation` in [Skeleton](/docs/components/skeleton)
* Aligned data-slot markers across components
* Improved documentation

[Read full release notes →](/docs/changelog/v3-0-0-alpha-34)

### v3.0.0-alpha.33

**October 5, 2025**

* Upgraded RAC with [October 2, 2025 Release](https://react-spectrum.adobe.com/releases/2025-10-02.html)
* Reordered [Tabs](/docs/components/tabs) Indicator (**Breaking change**)
* Updated [Tabs](/docs/components/tabs) component to use React Aria's `SelectionIndicator`, now supports SSR
* Updated [Disclosure](/docs/components/disclosure) and [Disclosure Group](/docs/components/disclosure-group) components to use RAC CSS variables for the expand and collapse animations
* Updated [Switch](/docs/components/switch) component styles and animations
* Added `size` variants and added demo in [Switch](/docs/components/switch#sizes)
* Added related showcases in [Button](/docs/components/button), [Tabs](/docs/components/tabs), [Disclosure](/docs/components/disclosure), [Disclosure Group](/docs/components/disclosure-group)
* Improved documentation

[Read full release notes →](/docs/changelog/v3-0-0-alpha-33)

### v3.0.0-alpha.32

**October 1, 2025**

Card component redesigned with [new variants](/docs/components/card), added [CloseButton](/docs/components/close-button) component, [MCP Server](/docs/ui-for-agents/mcp-server) for AI coding assistants, and improved documentation.

[Read full release notes →](/docs/changelog/v3-0-0-alpha-32)

### v3.0.0-alpha.31

**September 22, 2025**

* 🎨 **Showcases page** - Gallery of sites built with HeroUI
* 🌀 **DisclosureGroup component** - Groups multiple disclosures together
* 📇 **Card component** (preview) - First version of card component
* 🔀 **Switch component** (preview) - Toggle switch for settings

***

## Release Schedule

HeroUI v3 follows a regular release cycle:

* **Alpha releases**: Weekly to bi-weekly during active development - In progress
* **Beta releases**: Monthly stabilization releases (once first beta release is made)
* **Stable releases**: Quarterly major versions (once first stable release is made)

## Contributing

Found an issue or want to contribute? Check out our [GitHub repository](https://github.com/heroui-inc/heroui).


# HeroUI v3 > changelog > v3.0.0-alpha.32
URL: /docs/changelog/v3-0-0-alpha-32
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/changelog/v3-0-0-alpha-32.mdx

Card component redesign, CloseButton, MCP Server for AI assistants
        
***

title: v3.0.0-alpha.32
description: Card component redesign, CloseButton, MCP Server for AI assistants
-------------------------------------------------------------------------------

<div className="flex items-center gap-3 mb-6">
  <span className="text-sm text-muted">October 1, 2025</span>
</div>

This release adds AI development tools, updates the [Card component](/docs/components/card) API, and improves the developer experience.

## Installation

Update to the latest version:

<Tabs items={["npm", "pnpm", "yarn", "bun"]}>
  <Tab value="npm">
    ```bash
    npm i @heroui/styles@alpha @heroui/react@alpha
    ```
  </Tab>

  <Tab value="pnpm">
    ```bash
    pnpm add @heroui/styles@alpha @heroui/react@alpha
    ```
  </Tab>

  <Tab value="yarn">
    ```bash
    yarn add @heroui/styles@alpha @heroui/react@alpha
    ```
  </Tab>

  <Tab value="bun">
    ```bash
    bun add @heroui/styles@alpha @heroui/react@alpha
    ```
  </Tab>
</Tabs>

## What's New

### MCP Server

HeroUI now includes an [MCP server](/docs/ui-for-agents/mcp-server) that lets AI assistants like Cursor, Claude Code, and VS Code Copilot access HeroUI v3 documentation and component information directly.

**Quick Setup:**

### Cursor

<div className="flex items-center gap-3 mb-4">
  <a href="https://link.heroui.com/mcp-cursor-install" className="button button--tertiary button--sm no-underline bg-default/50 dark:bg-default/30">
    <svg viewBox="0 0 466.73 532.09" className="w-5 h-5 fill-current">
      <path d="M457.43,125.94L244.42,2.96c-6.84-3.95-15.28-3.95-22.12,0L9.3,125.94c-5.75,3.32-9.3,9.46-9.3,16.11v247.99c0,6.65,3.55,12.79,9.3,16.11l213.01,122.98c6.84,3.95,15.28,3.95,22.12,0l213.01-122.98c5.75-3.32,9.3-9.46,9.3-16.11v-247.99c0-6.65-3.55-12.79-9.3-16.11h-.01ZM444.05,151.99l-205.63,356.16c-1.39,2.4-5.06,1.42-5.06-1.36v-233.21c0-4.66-2.49-8.97-6.53-11.31L24.87,145.67c-2.4-1.39-1.42-5.06,1.36-5.06h411.26c5.84,0,9.49,6.33,6.57,11.39h-.01Z" />
    </svg>

    <span className="text-accent">Install in Cursor</span>
  </a>
</div>

Or manually add to **Cursor Settings** → **Tools** → **MCP Servers**:

```json
{
  "mcpServers": {
    "heroui-react": {
      "command": "npx",
      "args": ["-y", "@heroui/react-mcp@latest"]
    }
  }
}
```

### Claude Code

Run this command in your terminal:

```bash
claude mcp add heroui-react -- npx -y @heroui/react-mcp@latest
```

[Learn more](/docs/ui-for-agents/mcp-server)

### Card Component API Redesign

The [Card component](/docs/components/card) has been updated with a new variant system that makes it more flexible.

**Breaking Changes:**

* Replaced `surface` prop with new `variant` system
* Removed `Card.Image`, `Card.Details`, and `Card.CloseButton` (use composition instead)
* New variants: `flat`, `outlined`, `elevated`, `filled`

**Before:**

```tsx
<Card surface="1">
  <Card.Image src="/image.jpg" />
  <Card.Details>
    <Card.Title>Old Card</Card.Title>
  </Card.Details>
</Card>
```

**After:**

```tsx
<Card variant="outlined">
  <Card.Header>
    <img src="/image.jpg" alt="Card image" />
  </Card.Header>
  <Card.Body>
    <Card.Title>New Card</Card.Title>
  </Card.Body>
</Card>
```

**New Features:**

* Horizontal layout support
* Avatar integration
* Background image support
* Improved accessibility with semantic HTML

[View Card documentation](/docs/components/card)

### CloseButton Component

Added a [CloseButton component](/docs/components/close-button) for closing dialogs, modals, and other dismissible elements.

```tsx
import {CloseButton} from "@heroui/react";

// Basic usage
<CloseButton onPress={() => console.log("Closed")} />

// With custom icon
<CloseButton>
  <XMarkIcon className="size-4" />
</CloseButton>
```

## Documentation Improvements

### UI for Agents

* **[MCP Server documentation](/docs/ui-for-agents/mcp-server)** for development with AI assistants
* **[llms.txt](/docs/ui-for-agents/llms-txt)** file for LLM-friendly documentation
* Setup guides for popular AI coding tools

### Component Documentation

* **[Card](/docs/components/card)**: Rewrote documentation with anatomy, variants, and more examples
* **[Switch](/docs/components/switch)**: Added anatomy diagrams and better examples
* **[CloseButton](/docs/components/close-button)**: New documentation with usage examples

## Migration Guide

### Card Component Migration

1. **Update variant prop:**
   * `surface="1"` → `variant="flat"`
   * `surface="2"` → `variant="outlined"`
   * `surface="3"` → `variant="elevated"`
   * `surface="4"` → `variant="filled"`
   * Custom surfaces → Use new variant system

2. **Update component structure:**
   * Replace `Card.Image` with `<img>` in `Card.Header`
   * Replace `Card.Details` with `Card.Body`
   * Move `Card.CloseButton` to use new `CloseButton` component

3. **Update imports:**
   ```tsx
   // Add CloseButton if needed
   import {Card, CloseButton} from "@heroui/react";
   ```

## Links

* [GitHub PR #5747](https://github.com/heroui-inc/heroui/pull/5747)
* [MCP Server Documentation](/docs/ui-for-agents/mcp-server)
* [Card Component Guide](/docs/components/card)
* [CloseButton Component](/docs/components/close-button)

## Contributors

Thanks to everyone who contributed to this release!


# HeroUI v3 > changelog > v3.0.0-alpha.33
URL: /docs/changelog/v3-0-0-alpha-33
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/changelog/v3-0-0-alpha-33.mdx

RAC upgrade, Tabs indicator redesign, Switch size variant, Related showcase
        
***

title: v3.0.0-alpha.33
description: RAC upgrade, Tabs indicator redesign, Switch size variant, Related showcase
----------------------------------------------------------------------------------------

<div className="flex items-center gap-3 mb-6">
  <span className="text-sm text-muted">October 5, 2025</span>
</div>

This release upgrades React Aria Components, redesigns the Tabs indicator, adds Switch sizes, and includes component showcases.

## Installation

Update to the latest version:

<Tabs items={["npm", "pnpm", "yarn", "bun"]}>
  <Tab value="npm">
    ```bash
    npm i @heroui/styles@alpha @heroui/react@alpha
    ```
  </Tab>

  <Tab value="pnpm">
    ```bash
    pnpm add @heroui/styles@alpha @heroui/react@alpha
    ```
  </Tab>

  <Tab value="yarn">
    ```bash
    yarn add @heroui/styles@alpha @heroui/react@alpha
    ```
  </Tab>

  <Tab value="bun">
    ```bash
    bun add @heroui/styles@alpha @heroui/react@alpha
    ```
  </Tab>
</Tabs>

## What's New

### RAC Upgrade

Upgraded React Aria Components to the [October 2, 2025 Release](https://react-spectrum.adobe.com/releases/2025-10-02.html).

This release includes:

* CSS variables for animations
* Better SSR support
* Performance improvements for selection indicators

### Disclosure and Disclosure Group Updates

[Disclosure](/docs/components/disclosure) and [Disclosure Group](/docs/components/disclosure-group) now use React Aria's CSS variables for animations. The components use `--disclosure-panel-width` and `--disclosure-panel-height` variables that track the panel's actual size during expand/collapse.

### Tabs Indicator Redesign

[Tabs](/docs/components/tabs) now uses React Aria's `SelectionIndicator` and supports SSR. This fixes layout shifts on initial render.

**🚧 Breaking Changes:**

* Moved `Tabs.Indicator` inside each `Tabs.Tab`

**Before:**

```diff tsx
<Tabs>
  <Tabs.ListWrapper>
    <Tabs.List aria-label="Options">
      <Tabs.Tab>
+       <Tabs.Indicator />
      </Tabs.Tab>
    </Tabs.List>
-   <Tabs.Indicator />
  </Tabs.ListWrapper>
  <Tabs.Panel/>
</Tabs>
```

### Switch Updates

[Switch](/docs/components/switch) has updated styles and animations. Added `size` prop with options: `sm`, `md`, `lg`.

<ComponentPreview name="switch-sizes" />

### Related showcases

Related showcases have been added in [Button](/docs/components/button), [Disclosure](/docs/components/disclosure), [Disclosure Group](/docs/components/disclosure-group) and [Tabs](/docs/components/tabs).

## Documentation Improvements

### Component Documentation

* **[Tabs](/docs/components/tabs)**: Updated anatomy, revised examples with new indicator design and added related showcase
* **[Switch](/docs/components/switch)**: Added size example and revised with-icon example
* **[Button](/docs/components/button)**, **[Disclosure](/docs/components/disclosure)**, **[Disclosure Group](/docs/components/disclosure-group)**: Added related showcase

## Migration Guide

### Tabs Component Migration

1. **Update component structure:**
   * move `<Tabs.Indicator />` inside each `<Tabs.Tab />`

## Links

* [GitHub PR #5777](https://github.com/heroui-inc/heroui/pull/5777)
* [Tabs Component](/docs/components/tabs)
* [Switch Component](/docs/components/switch)
* [Button Component](/docs/components/button)
* [Disclosure Component](/docs/components/disclosure)
* [Disclosure Group Component](/docs/components/disclosure-group)

## Contributors

Thanks to everyone who contributed to this release!


# HeroUI v3 > changelog > v3.0.0-alpha.34
URL: /docs/changelog/v3-0-0-alpha-34
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/changelog/v3-0-0-alpha-34.mdx

Essentials for building forms with a clean API Form, TextField, RadioGroup, Label, Input, Fieldset and more.
        
***

title: v3.0.0-alpha.34
description: Essentials for building forms with a clean API Form, TextField, RadioGroup, Label, Input, Fieldset and more.
-------------------------------------------------------------------------------------------------------------------------

<div className="flex items-center gap-3 mb-6">
  <span className="text-sm text-muted">October 15, 2025</span>
</div>

This release introduces Form-based components, form field tokens, reorganizes Storybook, and aligns data-slot markers across components.

## Installation

Update to the latest version:

<Tabs items={["npm", "pnpm", "yarn", "bun"]}>
  <Tab value="npm">
    ```bash
    npm i @heroui/styles@alpha @heroui/react@alpha
    ```
  </Tab>

  <Tab value="pnpm">
    ```bash
    pnpm add @heroui/styles@alpha @heroui/react@alpha
    ```
  </Tab>

  <Tab value="yarn">
    ```bash
    yarn add @heroui/styles@alpha @heroui/react@alpha
    ```
  </Tab>

  <Tab value="bun">
    ```bash
    bun add @heroui/styles@alpha @heroui/react@alpha
    ```
  </Tab>
</Tabs>

<Callout type="info">
  **Using AI assistants?** Simply prompt "Hey Cursor, update HeroUI to the latest version" and your AI assistant will automatically compare versions and apply the necessary changes. Learn more about the [HeroUI MCP Server](/docs/ui-for-agents/mcp-server).
</Callout>

## What's New

### Form-based Components

We've introduced a comprehensive set of form-based components built on React Aria Components, providing accessible and composable building blocks for creating forms. These components include [Description](/docs/components/description), [FieldError](/docs/components/field-error), [Fieldset](/docs/components/fieldset), [Form](/docs/components/form), [Input](/docs/components/input), [Label](/docs/components/label), [RadioGroup](/docs/components/radio-group), [TextField](/docs/components/text-field), and [TextArea](/docs/components/textarea).

#### Description

<ComponentPreview name="description-basic" />

#### FieldError

<ComponentPreview name="field-error-basic" />

#### Fieldset

<ComponentPreview name="fieldset-basic" />

#### Form

<ComponentPreview name="form-basic" />

#### Input

<ComponentPreview name="input-basic" />

#### Label

<ComponentPreview name="label-basic" />

#### RadioGroup

<ComponentPreview name="radio-group-basic" />

#### TextField

<ComponentPreview name="text-field-basic" />

#### TextArea

<ComponentPreview name="textarea-basic" />

### Form Field Tokens

Introduced form field tokens `--field-*` for consistent styling across form components. See [Theming](/docs/handbook/theming#calculated-variables-tailwind) for the `--field-*` variables.

### Storybook Organization

Reorganized Storybook by category for better navigation and component discovery.

### Skeleton Animation Token

**🚧 Breaking Changes:** Renamed `--skeleton-default-animation-type` to `--skeleton-animation` in [Skeleton](/docs/components/skeleton) for consistency with other component tokens.

### Data-Slot Alignment

Aligned data-slot markers across components for consistent styling and customization. This standardization makes it easier to target specific component parts with CSS selectors and improves the overall developer experience when customizing component styles.

Components now use consistent `data-slot` attributes like:

* `data-slot="base"` for the root element
* `data-slot="label"` for label text
* `data-slot="description"` for description text
* `data-slot="error"` for error messages

This allows for predictable CSS targeting across all form components:

```css
.radio {
  [data-slot="label"] {
    /* Styles apply to radio labels */
  }
}
```

## Documentation Improvements

### Component Documentation

* **[Link](/docs/components/link)**: Added Anatomy, and examples with Icon. Updated Link and Link.Icon props section.
* **[Description](/docs/components/description)**, **[FieldError](/docs/components/field-error)**, **[Fieldset](/docs/components/fieldset)**, **[Form](/docs/components/form)**, **[Input](/docs/components/input)**, **[Label](/docs/components/label)**, **[RadioGroup](/docs/components/radio-group)**, **[TextField](/docs/components/text-field)**, and **[TextArea](/docs/components/textarea)**: New documentation with usage examples

## Migration Guide

### Skeleton Component Migration

1. **Update animation token:**
   * Replace `--skeleton-default-animation-type` with `--skeleton-animation`

## Links

* [GitHub PR #5780](https://github.com/heroui-inc/heroui/pull/5780)
* [Description Component](/docs/components/description)
* [FieldError Component](/docs/components/field-error)
* [Fieldset Component](/docs/components/fieldset)
* [Form Component](/docs/components/form)
* [Input Component](/docs/components/input)
* [Label Component](/docs/components/label)
* [RadioGroup Component](/docs/components/radio-group)
* [TextField Component](/docs/components/text-field)
* [TextArea Component](/docs/components/textarea)
* [Skeleton Component](/docs/components/skeleton)

## Contributors

Thanks to everyone who contributed to this release!


# HeroUI v3 > changelog > v3.0.0-alpha.35
URL: /docs/changelog/v3-0-0-alpha-35
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/changelog/v3-0-0-alpha-35.mdx

React Server Components support for compound components, React 19 improvements, and critical bug fixes.
        
***

title: v3.0.0-alpha.35
description: React Server Components support for compound components, React 19 improvements, and critical bug fixes.
--------------------------------------------------------------------------------------------------------------------

<div className="flex items-center gap-3 mb-6">
  <span className="text-sm text-muted">October 21, 2025</span>
</div>

This release fixes a critical issue where **compound components didn't work correctly in React Server Components (RSC)**. Additionally, this release adopts React 19 best practices by removing `forwardRef` and simplifying context usage. The Switch component has been refactored to match the Radio/RadioGroup pattern, providing a cleaner and more consistent API.

## Installation

Update to the latest version:

<Tabs items={["npm", "pnpm", "yarn", "bun"]}>
  <Tab value="npm">
    ```bash
    npm i @heroui/styles@alpha @heroui/react@alpha
    ```
  </Tab>

  <Tab value="pnpm">
    ```bash
    pnpm add @heroui/styles@alpha @heroui/react@alpha
    ```
  </Tab>

  <Tab value="yarn">
    ```bash
    yarn add @heroui/styles@alpha @heroui/react@alpha
    ```
  </Tab>

  <Tab value="bun">
    ```bash
    bun add @heroui/styles@alpha @heroui/react@alpha
    ```
  </Tab>
</Tabs>

<Callout type="info">
  **Using AI assistants?** Simply prompt "Hey Cursor, update HeroUI to the latest version" and your AI assistant will automatically compare versions and apply the necessary changes. Learn more about the [HeroUI MCP Server](/docs/ui-for-agents/mcp-server).
</Callout>

## What's New

### React Server Components Support

Compound components now work correctly in React Server Components. The previous implementation had the compound pattern logic inside components, which conflicted with the `"use client"` directive. This has been fixed by moving the pattern logic to component index files.

### React 19 Improvements

This release adopts React 19 best practices:

1. **Removed `forwardRef`**: No longer needed in React 19, where `ref` is now a prop ([React 19 docs](https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop))
2. **Simplified Context**: `Context.Provider` replaced with just `Context` ([React 19 docs](https://react.dev/blog/2024/12/05/react-19#context-as-a-provider))

### Switch Component Architecture Improvement

The Switch component has been refactored to follow the same clean separation pattern as Radio/RadioGroup:

* **Separate Components**: Switch and SwitchGroup are now independent components (previously combined)
* **Cleaner API**: `<SwitchGroup>` replaces the nested `<Switch.Group>` and `<Switch.GroupItems>` pattern
* **Better Organization**: Separate styles, types, and implementations for each component
* **Consistent Pattern**: Matches the Radio/RadioGroup architecture for a more predictable API

**Before:**

```tsx
<Switch.Group>
  <Switch.GroupItems>
    <Switch.Root>...</Switch.Root>
  </Switch.GroupItems>
</Switch.Group>
```

**After:**

```tsx
<SwitchGroup>
  <Switch.Root>...</Switch.Root>
  <Switch.Root>...</Switch.Root>
</SwitchGroup>
```

## ⚠️ Breaking Changes

### Main Component Requires `.Root` Suffix

To support React Server Components, the compound component pattern has been restructured. The main component now requires the `.Root` suffix when using the compound pattern.

**Before:**

```tsx
import { Avatar } from "@heroui/react"

<Avatar>
  <Avatar.Image src="/images/avatar.jpeg" alt="Junior Garcia" />
  <Avatar.Fallback>JR</Avatar.Fallback>
</Avatar>
```

**After:**

```tsx
import { Avatar } from "@heroui/react"

<Avatar.Root>
  <Avatar.Image src="/images/avatar.jpeg" alt="Junior Garcia" />
  <Avatar.Fallback>JR</Avatar.Fallback>
</Avatar.Root>
```

**Note:** Named exports (e.g., `<Avatar>`, `<AvatarImage>`, `<AvatarFallback>`) remain unchanged and fully supported.

### Switch Component API Changes

The Switch component grouping API has been restructured to match the Radio/RadioGroup pattern:

**Before:**

```tsx
import { Switch } from "@heroui/react"

<Switch.Group orientation="horizontal">
  <Switch.GroupItems>
    <Switch.Root name="notifications">
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
      <Label>Notifications</Label>
    </Switch.Root>
    <Switch.Root name="marketing">
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
      <Label>Marketing</Label>
    </Switch.Root>
  </Switch.GroupItems>
</Switch.Group>
```

**After:**

```tsx
import { Switch, SwitchGroup } from "@heroui/react"

<SwitchGroup orientation="horizontal">
  <Switch.Root name="notifications">
    <Switch.Control>
      <Switch.Thumb />
    </Switch.Control>
    <Label>Notifications</Label>
  </Switch.Root>
  <Switch.Root name="marketing">
    <Switch.Control>
      <Switch.Thumb />
    </Switch.Control>
    <Label>Marketing</Label>
  </Switch.Root>
</SwitchGroup>
```

This change helps to:

* **Separate Components**: Switch and SwitchGroup are now independent components (previously combined)
* **Cleaner API**: `<SwitchGroup>` replaces the nested `<Switch.Group>` and `<Switch.GroupItems>` pattern
* **Better Organization**: Separate styles, types, and implementations for each component
* **Consistent Pattern**: Matches the Radio/RadioGroup architecture for a more predictable API

**Migration Steps:**

1. Import `SwitchGroup` separately: `import { Switch, SwitchGroup } from "@heroui/react"`
2. Replace `<Switch.Group>` with `<SwitchGroup>`
3. Remove the nested `<Switch.GroupItems>` wrapper
4. Individual `Switch.Root` components remain unchanged

#### Affected Components

All compound components are affected:

* `Accordion` → `Accordion.Root`
* `Avatar` → `Avatar.Root`
* `Card` → `Card.Root`
* `Disclosure` → `Disclosure.Root`
* `Fieldset` → `Fieldset.Root`
* `Kbd` → `Kbd.Root`
* `Link` → `Link.Root`
* `Popover` → `Popover.Root`
* `RadioGroup` → `RadioGroup.Root`
* `Switch` → `Switch.Root`
* `Tabs` → `Tabs.Root`
* `Tooltip` → `Tooltip.Root`

## Migration Guide

You have two options for using HeroUI compound components:

### Option 1: Update to Use `.Root` (Compound Pattern)

If you're using the compound pattern (dot notation), update your code to use `.Root` for the main component:

**Card Example:**

```tsx
import { Card } from "@heroui/react"

<Card.Root>
  <Card.Header>
    <Card.Title>Card Title</Card.Title>
    <Card.Description>Card description</Card.Description>
  </Card.Header>
  <Card.Content>
    Card content
  </Card.Content>
  <Card.Footer>
    Card footer
  </Card.Footer>
</Card.Root>
```

**Tabs Example:**

```tsx
import { Tabs } from "@heroui/react"

<Tabs.Root>
  <Tabs.ListWrapper>
    <Tabs.List>
      <Tabs.Tab id="tab1">Tab 1<Tabs.Indicator /></Tabs.Tab>
      <Tabs.Tab id="tab2">Tab 2<Tabs.Indicator /></Tabs.Tab>
    </Tabs.List>
  </Tabs.ListWrapper>
  <Tabs.Panel id="tab1">Panel 1</Tabs.Panel>
  <Tabs.Panel id="tab2">Panel 2</Tabs.Panel>
</Tabs.Root>
```

[See more examples in the documentation](/docs/components/card)

**Avatar Example:**

```tsx
import { Avatar } from "@heroui/react"

<Avatar.Root>
  <Avatar.Image alt="John Doe" src="..." />
  <Avatar.Fallback>JD</Avatar.Fallback>
</Avatar.Root>
```

[See more examples in the documentation](/docs/components/avatar)

### Option 2: Use Named Exports

We added support for named exports for all compound components. You can use them like this:

**Card Example:**

```tsx
import {
  CardRoot,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@heroui/react"

<CardRoot>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    Card content
  </CardContent>
  <CardFooter>
    Card footer
  </CardFooter>
</CardRoot>
```

**Tabs Example:**

```tsx
import { TabsRoot, TabListWrapper, TabList, Tab, TabIndicator, TabPanel } from "@heroui/react"

<TabsRoot>
  <TabListWrapper>
    <TabList>
      <Tab id="tab1">Tab 1<TabIndicator /></Tab>
      <Tab id="tab2">Tab 2<TabIndicator /></Tab>
    </TabList>
  </TabListWrapper>
  <TabPanel id="tab1">Panel 1</TabPanel>
  <TabPanel id="tab2">Panel 2</TabPanel>
</TabsRoot>
```

**Avatar Example:**

```tsx
import { Avatar, AvatarImage, AvatarFallback } from "@heroui/react"

<Avatar>
  <AvatarImage alt="John Doe" src="..." />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

### Migration Steps

If you're using the compound pattern, you only need to update the main component to use `.Root`:

1. **Find all instances of compound components** (e.g., `<Avatar>` with `<Avatar.Image>` inside)

2. **Add `.Root` to the main component**:
   ```tsx
   // Before
   <Avatar>
     <Avatar.Image ... />
   </Avatar>

   // After
   <Avatar.Root>
     <Avatar.Image ... />
   </Avatar.Root>
   ```

3. **That's it!** All child components (e.g., `Avatar.Image`, `Avatar.Fallback`) remain unchanged.

### Complete Migration Reference

| Component      | Named Export Pattern            | Compound Pattern (with `.Root`)       | Additional Changes                                      |
| -------------- | ------------------------------- | ------------------------------------- | ------------------------------------------------------- |
| **Accordion**  | `<Accordion>`                   | `<Accordion.Root>`                    | -                                                       |
| **Avatar**     | `<Avatar>`                      | `<Avatar.Root>`                       | -                                                       |
| **Card**       | `<Card>`                        | `<Card.Root>`                         | -                                                       |
| **Disclosure** | `<Disclosure>`                  | `<Disclosure.Root>`                   | -                                                       |
| **Fieldset**   | `<Fieldset>`                    | `<Fieldset.Root>`                     | -                                                       |
| **Kbd**        | `<Kbd>`                         | `<Kbd.Root>`                          | -                                                       |
| **Link**       | `<Link>`                        | `<Link.Root>`                         | -                                                       |
| **Popover**    | `<Popover>`                     | `<Popover.Root>`                      | -                                                       |
| **Radio**      | `<Radio>`                       | `<Radio.Root>`                        | -                                                       |
| **Switch**     | `<Switch>`, `<SwitchControl>`   | `<Switch.Root>`, `<Switch.Control>`   | `<Switch.Group>` → `<SwitchGroup>` (separate component) |
| **Tabs**       | `<Tabs>`, `<TabList>`           | `<Tabs.Root>`, `<Tabs.List>`          | -                                                       |
| **Tooltip**    | `<Tooltip>`, `<TooltipTrigger>` | `<Tooltip.Root>`, `<Tooltip.Trigger>` | -                                                       |

### Automated Migration

For large codebases using the compound pattern, you can use find-and-replace:

```bash
# Example for Avatar component
# Update the main component to use .Root
sed -i 's/<Avatar>/<Avatar.Root>/g' **/*.tsx
sed -i 's/<\/Avatar>/<\/Avatar.Root>/g' **/*.tsx

# Switch component requires additional steps
# First, ensure SwitchGroup is imported
# Then replace Switch.Group with SwitchGroup
sed -i 's/<Switch\.Group/<SwitchGroup/g' **/*.tsx
sed -i 's/<\/Switch\.Group>/<\/SwitchGroup>/g' **/*.tsx

# Remove Switch.GroupItems wrapper
sed -i 's/<Switch\.GroupItems>//g' **/*.tsx
sed -i 's/<\/Switch\.GroupItems>//g' **/*.tsx

# Repeat for other compound components (Card, Tabs, etc.)
# Note: This only affects files using the compound pattern
```

**Important:**

* Be careful with automated replacements. Make sure you're only replacing compound pattern usage, not named exports.
* For Switch migrations, verify that `SwitchGroup` is imported: `import { Switch, SwitchGroup } from "@heroui/react"`
* Test your code after running automated migrations to ensure all changes are correct.

## Why This Change?

This change was necessary to fix React Server Components compatibility. The previous implementation had architectural limitations:

1. **RSC Compatibility**: Compound pattern logic conflicted with `"use client"` directives
2. **React 19 Readiness**: Removes deprecated patterns like `forwardRef` and `Context.Provider`
3. **Cleaner Architecture**: Pattern logic is now in index files, not component files
4. **Better Separation**: Server and client components can now work together seamlessly

## Documentation Updates

Component documentation will be updated to reflect the new patterns:

* Examples will show the compound pattern with `.Root`
* Named export examples remain valid and supported
* Migration guides will help you transition smoothly
* Both patterns are fully supported and work identically

## Need Help?

If you encounter any issues during migration:

1. **Compound pattern users**: Update the main component to use `.Root` (e.g., `<Avatar>` → `<Avatar.Root>`)
2. **Named export users**: No changes needed - your code continues to work as-is
3. Check the component documentation for examples
4. Report issues at: [GitHub Issues](https://github.com/heroui-inc/heroui/issues)

## Links

* [Component Documentation](https://heroui.com/docs/components)
* [React Server Components](https://react.dev/reference/rsc/server-components)
* [React 19 Release](https://react.dev/blog/2024/12/05/react-19)
* [GitHub Repository](https://github.com/heroui-inc/heroui)

## Contributors

Thanks to everyone who contributed to this release, improving React Server Components support and React 19 compatibility!


# HeroUI v3 > components > Accordion
URL: /docs/components/accordion
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/accordion.mdx

A collapsible content panel for organizing information in a compact space
        
***

title: Accordion
description: A collapsible content panel for organizing information in a compact space
icon: updated
links:
rac: Disclosure
source: accordion/accordion.tsx
styles: accordion.css
storybook: accordion
figma: true
-----------

## Import

```tsx
import { Accordion } from '@heroui/react';
```

### Usage

<ComponentPreview name="accordion-basic" />

### Anatomy

Import the Accordion component and access all parts using dot notation.

```tsx
import { Accordion } from '@heroui/react';

export default () => (
  <Accordion.Root>
    <Accordion.Item>
      <Accordion.Heading>
        <Accordion.Trigger>
          <Accordion.Indicator />
        </Accordion.Trigger>
      </Accordion.Heading>
      <Accordion.Panel>
        <Accordion.Body/>
      </Accordion.Panel>
    </Accordion.Item>
  </Accordion.Root>
)
```

### Outline

<ComponentPreview name="accordion-outline" />

### Multiple Expanded

<ComponentPreview name="accordion-multiple" />

### Custom Indicator

<ComponentPreview name="accordion-custom-indicator" />

### Disabled State

<ComponentPreview name="accordion-disabled" />

### FAQ Layout

<ComponentPreview name="accordion-faq" />

### Custom Styles

<ComponentPreview name="accordion-custom-styles" />

<RelatedComponents component="accordion" />

## Styling

### Passing Tailwind CSS classes

<CollapsibleCode
  lang="tsx"
  code={`"use client";

import { Accordion, cn } from "@heroui/react";
import {Icon} from "@iconify/react";

const items = [
{
  content:
    "Stay informed about your account activity with real-time notifications. You'll receive instant alerts for important events like transactions, new messages, security updates, and system announcements. ",
  iconUrl: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/3dicons/bell-small.png",
  title: "Set Up Notifications",
  subtitle: "Receive account activity updates",
},
{
  content:
    "Enhance your browsing experience by installing our official browser extension. The extension provides seamless integration with your account, allowing you to receive notifications directly in your browser, quickly access your dashboard, and interact with web3 applications securely. Compatible with Chrome, Firefox, Edge, and Brave browsers.",
  iconUrl: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/3dicons/compass-small.png",
  title: "Set up Browser Extension",
  subtitle: "Connect you browser to your account",
},
{
  content:
    "Begin your journey into the world of digital collectibles by creating your first NFT. Our intuitive minting process guides you through uploading your artwork, setting metadata, choosing royalty percentages, and deploying to the blockchain. Whether you're an artist, creator, or collector, you'll find all the tools you need to bring your digital assets to life. Your collectibles are stored on IPFS for permanent decentralized storage.",
  iconUrl:
    "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/3dicons/mint-collective-small.png",
  title: "Mint Collectible",
  subtitle: "Create your first collectible",
},
];

export function CustomStyles() {
return (
  <Accordion.Root className="bg-surface-1 w-full max-w-md rounded-2xl" variant="outline">
    {items.map((item, index) => (
      <Accordion.Item
        key={index}
        className={cn(
          "group/item",
          "first:[&_[data-slot=accordion-trigger]]:rounded-t-2xl", // First trigger we want to round the top
          "last:[&:not(:has([data-slot=accordion-trigger][aria-expanded='true']))_[data-slot=accordion-trigger]]:rounded-b-2xl", // Last trigger we want to round the bottom
        )}
      >
        <Accordion.Heading>
          <Accordion.Trigger className="hover:bg-surface-2 group flex items-center gap-2">
            {item.iconUrl ? (
              <img
                alt={item.title}
                className="group-hover/item:scale-120 group-hover/item:-rotate-10 h-11 w-11 transition-[scale,rotate] duration-300 ease-out group-hover/item:drop-shadow-lg"
                src={item.iconUrl}
              />
            ) : null}
            <div className="flex flex-col gap-0">
              <span className="font-medium leading-5">{item.title}</span>
              <span className="text-muted/80 font-normal leading-6">{item.subtitle}</span>
            </div>
            <Accordion.Indicator className="text-muted/50 [&>svg]:size-4">
              <Icon icon="gravity-ui:chevron-down" />
            </Accordion.Indicator>
          </Accordion.Trigger>
        </Accordion.Heading>
        <Accordion.Panel>
          <Accordion.Body className="text-muted/80">{item.content}</Accordion.Body>
        </Accordion.Panel>
      </Accordion.Item>
    ))}
  </Accordion.Root>
);
}`}
/>

### Customizing the component classes

To customize the Accordion component classes, you can use the `@layer components` directive.
<br />[Learn more](https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes).

```css
@layer components {
  .accordion {
    @apply rounded-xl bg-gray-50;
  }

  .accordion__trigger {
    @apply font-semibold text-lg;
  }

  .accordion--outline {
    @apply shadow-lg border-2;
  }
}
```

HeroUI follows the [BEM](https://getbem.com/) methodology to ensure component variants and states are reusable and easy to customize.

### CSS Classes

The Accordion component uses these CSS classes ([View source styles](https://github.com/heroui-inc/heroui/blob/v3/packages/styles/components/accordion.css)):

#### Base Classes

* `.accordion` - Base accordion container
* `.accordion__body` - Content body container
* `.accordion__heading` - Heading wrapper
* `.accordion__indicator` - Expand/collapse indicator icon
* `.accordion__item` - Individual accordion item
* `.accordion__panel` - Collapsible panel container
* `.accordion__trigger` - Clickable trigger button

#### Variant Classes

* `.accordion--outline` - Outline variant with border and background

#### State Classes

* `.accordion__trigger[aria-expanded="true"]` - Expanded state
* `.accordion__panel[aria-hidden="false"]` - Panel visible state

### Interactive States

The component supports both CSS pseudo-classes and data attributes for flexibility:

* **Hover**: `:hover` or `[data-hovered="true"]` on trigger
* **Focus**: `:focus-visible` or `[data-focus-visible="true"]` on trigger
* **Disabled**: `:disabled` or `[aria-disabled="true"]` on trigger
* **Expanded**: `[aria-expanded="true"]` on trigger

## API Reference

### Accordion.Root Props

| Prop                     | Type                       | Default     | Description                                    |
| ------------------------ | -------------------------- | ----------- | ---------------------------------------------- |
| `allowsMultipleExpanded` | `boolean`                  | `false`     | Whether multiple items can be expanded at once |
| `defaultExpandedKeys`    | `Iterable<Key>`            | -           | The initial expanded keys                      |
| `expandedKeys`           | `Iterable<Key>`            | -           | The controlled expanded keys                   |
| `onExpandedChange`       | `(keys: Set<Key>) => void` | -           | Handler called when expanded keys change       |
| `isDisabled`             | `boolean`                  | `false`     | Whether the entire accordion is disabled       |
| `variant`                | `"default" \| "outline"`   | `"default"` | The visual variant of the accordion            |
| `className`              | `string`                   | -           | Additional CSS classes                         |
| `children`               | `ReactNode`                | -           | The accordion items                            |

### Accordion.Item Props

| Prop               | Type                            | Default | Description                        |
| ------------------ | ------------------------------- | ------- | ---------------------------------- |
| `id`               | `Key`                           | -       | Unique identifier for the item     |
| `isDisabled`       | `boolean`                       | `false` | Whether this item is disabled      |
| `defaultExpanded`  | `boolean`                       | `false` | Whether item is initially expanded |
| `isExpanded`       | `boolean`                       | -       | Controlled expanded state          |
| `onExpandedChange` | `(isExpanded: boolean) => void` | -       | Handler for expanded state changes |
| `className`        | `string`                        | -       | Additional CSS classes             |
| `children`         | `ReactNode`                     | -       | The item content                   |

### Accordion.Trigger Props

| Prop         | Type                          | Default | Description                        |
| ------------ | ----------------------------- | ------- | ---------------------------------- |
| `className`  | `string`                      | -       | Additional CSS classes             |
| `children`   | `ReactNode \| RenderFunction` | -       | Trigger content or render function |
| `onPress`    | `() => void`                  | -       | Additional press handler           |
| `isDisabled` | `boolean`                     | -       | Whether trigger is disabled        |

### Accordion.Panel Props

| Prop        | Type        | Default | Description            |
| ----------- | ----------- | ------- | ---------------------- |
| `className` | `string`    | -       | Additional CSS classes |
| `children`  | `ReactNode` | -       | Panel content          |

### Accordion.Indicator Props

| Prop        | Type        | Default | Description            |
| ----------- | ----------- | ------- | ---------------------- |
| `className` | `string`    | -       | Additional CSS classes |
| `children`  | `ReactNode` | -       | Custom indicator icon  |

### Accordion.Body Props

| Prop        | Type        | Default | Description            |
| ----------- | ----------- | ------- | ---------------------- |
| `className` | `string`    | -       | Additional CSS classes |
| `children`  | `ReactNode` | -       | Body content           |


# HeroUI v3 > components > Avatar
URL: /docs/components/avatar
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/avatar.mdx

Display user profile images with customizable fallback content
        
***

title: Avatar
description: Display user profile images with customizable fallback content
icon: updated
links:
radix: avatar
source: avatar/avatar.tsx
styles: avatar.css
storybook: avatar
figma: true
-----------

## Import

```tsx
import { Avatar } from '@heroui/react';
```

### Usage

<ComponentPreview name="avatar-basic" />

### Anatomy

Import the Avatar component and access all parts using dot notation.

```tsx
import { Avatar } from '@heroui/react';

export default () => (
  <Avatar.Root>
    <Avatar.Image/>
    <Avatar.Fallback/>
  </Avatar.Root>
)
```

### Sizes

<ComponentPreview name="avatar-sizes" />

### Colors

<ComponentPreview name="avatar-colors" />

### Fallback Content

<ComponentPreview name="avatar-fallback" />

### Avatar Group

<ComponentPreview name="avatar-group" />

### Custom Styles

<ComponentPreview name="avatar-custom-styles" />

## Styling

### Passing Tailwind CSS classes

```tsx
import { Avatar } from '@heroui/react';

function CustomAvatar() {
  return (
    <Avatar.Root className="size-20">
      <Avatar.Image src="..." alt="..." />
      <Avatar.Fallback>XL</Avatar.Fallback>
    </Avatar.Root>
  );
}
```

### Customizing the component classes

To customize the Avatar component classes, you can use the `@layer components` directive.
<br />[Learn more](https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes).

```css
@layer components {
  .avatar {
    @apply size-16 border-2 border-primary;
  }

  .avatar__fallback {
    @apply bg-gradient-to-br from-purple-500 to-pink-500;
  }
}
```

HeroUI follows the [BEM](https://getbem.com/) methodology to ensure component variants and states are reusable and easy to customize.

### CSS Classes

The Avatar component uses these CSS classes ([View source styles](https://github.com/heroui-inc/heroui/blob/v3/packages/styles/components/avatar.css)):

#### Base Classes

* `.avatar` - Base container with default size (size-10)
* `.avatar__image` - Image element with aspect-square sizing
* `.avatar__fallback` - Fallback container with centered content

#### Size Modifiers

* `.avatar--sm` - Small avatar (size-8)
* `.avatar--md` - Medium avatar (default, no additional styles)
* `.avatar--lg` - Large avatar (size-12)

#### Color Modifiers

* `.avatar__fallback--default` - Default text color
* `.avatar__fallback--accent` - Accent text color
* `.avatar__fallback--success` - Success text color
* `.avatar__fallback--warning` - Warning text color
* `.avatar__fallback--danger` - Danger text color

## API Reference

### Avatar.Root Props

| Prop        | Type                                                          | Default     | Description             |
| ----------- | ------------------------------------------------------------- | ----------- | ----------------------- |
| `size`      | `'sm' \| 'md' \| 'lg'`                                        | `'md'`      | Avatar size             |
| `color`     | `'default' \| 'accent' \| 'success' \| 'warning' \| 'danger'` | `'default'` | Fallback color theme    |
| `className` | `string`                                                      | -           | Additional CSS classes  |
| `asChild`   | `boolean`                                                     | `false`     | Render as child element |

### Avatar.Image Props

| Prop                    | Type                                                               | Default | Description                                                               |
| ----------------------- | ------------------------------------------------------------------ | ------- | ------------------------------------------------------------------------- |
| `src`                   | `string`                                                           | -       | Image source URL                                                          |
| `srcSet`                | `string`                                                           | -       | The image `srcset` attribute for responsive images                        |
| `sizes`                 | `string`                                                           | -       | The image `sizes` attribute for responsive images                         |
| `alt`                   | `string`                                                           | -       | Alternative text for the image                                            |
| `onLoad`                | `(event: SyntheticEvent<HTMLImageElement>) => void`                | -       | Callback when the image loads successfully                                |
| `onError`               | `(event: SyntheticEvent<HTMLImageElement>) => void`                | -       | Callback when there's an error loading the image                          |
| `onLoadingStatusChange` | `(status: 'loading' \| 'loaded' \| 'pending' \| 'failed') => void` | -       | Callback for loading status changes                                       |
| `ignoreFallback`        | `boolean`                                                          | `false` | If `true`, opt out of the fallback logic and use as regular `img`         |
| `shouldBypassImageLoad` | `boolean`                                                          | `false` | If `true`, image load will be bypassed and handled by `asChild` component |
| `crossOrigin`           | `'anonymous' \| 'use-credentials'`                                 | -       | CORS setting for the image request                                        |
| `loading`               | `'eager' \| 'lazy'`                                                | -       | Native lazy loading attribute                                             |
| `className`             | `string`                                                           | -       | Additional CSS classes                                                    |
| `asChild`               | `boolean`                                                          | `false` | Render as child element                                                   |

### Avatar.Fallback Props

| Prop        | Type                                                          | Default | Description                                    |
| ----------- | ------------------------------------------------------------- | ------- | ---------------------------------------------- |
| `delayMs`   | `number`                                                      | -       | Delay before showing fallback (prevents flash) |
| `color`     | `'default' \| 'accent' \| 'success' \| 'warning' \| 'danger'` | -       | Override color from parent                     |
| `className` | `string`                                                      | -       | Additional CSS classes                         |
| `asChild`   | `boolean`                                                     | `false` | Render as child element                        |


# HeroUI v3 > components > Button
URL: /docs/components/button
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/button.mdx

A clickable button component with multiple variants and states
        
***

title: Button
description: A clickable button component with multiple variants and states
links:
rac: Button
source: button/button.tsx
styles: button.css
storybook: button
figma: true
-----------

## Import

```tsx
import { Button } from '@heroui/react';
```

### Usage

<ComponentPreview name="button-basic" />

### Variants

<ComponentPreview name="button-variants" />

### With Icons

<ComponentPreview name="button-with-icons" />

### Icon Only

<ComponentPreview name="button-icon-only" />

### Loading

<ComponentPreview name="button-loading" />

### Loading State

<ComponentPreview name="button-loading-state" />

### Sizes

<ComponentPreview name="button-sizes" />

### Disabled State

<ComponentPreview name="button-disabled" />

### Social Buttons

<ComponentPreview name="button-social" />

<RelatedComponents component="button" />

<RelatedShowcases component="Button" />

## Styling

### Passing Tailwind CSS classes

```tsx
import { Button } from '@heroui/react';

function CustomButton() {
  return (
    <Button className="bg-purple-500 text-white hover:bg-purple-600">
      Purple Button
    </Button>
  );
}
```

### Customizing the component classes

To customize the Button component classes, you can use the `@layer components` directive.
<br />[Learn more](https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes).

```css
@layer components {
  .button {
    @apply bg-purple-500 text-white hover:bg-purple-600;
  }

  .button--icon-only {
    @apply rounded-lg bg-blue-500;
  }
}
```

HeroUI follows the [BEM](https://getbem.com/) methodology to ensure component variants and states are reusable and easy to customize.

### Adding custom variants

You can extend HeroUI components by wrapping them and adding your own custom variants.

<ComponentPreview name="button-custom-variants" />

### CSS Classes

The Button component uses these CSS classes ([View source styles](https://github.com/heroui-inc/heroui/blob/v3/packages/styles/components/button.css)):

#### Base & Size Classes

* `.button` - Base button styles
* `.button--sm` - Small size variant
* `.button--md` - Medium size variant
* `.button--lg` - Large size variant

#### Variant Classes

* `.button--primary`
* `.button--secondary`
* `.button--tertiary`
* `.button--ghost`
* `.button--danger`

#### Modifier Classes

* `.button--icon-only`
* `.button--icon-only.button--sm`
* `.button--icon-only.button--lg`

### Interactive States

The button supports both CSS pseudo-classes and data attributes for flexibility:

* **Hover**: `:hover` or `[data-hovered="true"]`
* **Active/Pressed**: `:active` or `[data-pressed="true"]` (includes scale transform)
* **Focus**: `:focus-visible` or `[data-focus-visible="true"]` (shows focus ring)
* **Disabled**: `:disabled` or `[aria-disabled="true"]` (reduced opacity, no pointer events)
* **Pending**: `[data-pending]` (no pointer events during loading)

## API Reference

### Button Props

| Prop         | Type                                                                | Default     | Description                               |
| ------------ | ------------------------------------------------------------------- | ----------- | ----------------------------------------- |
| `variant`    | `'primary' \| 'secondary' \| 'tertiary' \| 'ghost' \| 'danger'`     | `'primary'` | Visual style variant                      |
| `size`       | `'sm' \| 'md' \| 'lg'`                                              | `'md'`      | Size of the button                        |
| `isDisabled` | `boolean`                                                           | `false`     | Whether the button is disabled            |
| `isPending`  | `boolean`                                                           | `false`     | Whether the button is in a loading state  |
| `isIconOnly` | `boolean`                                                           | `false`     | Whether the button contains only an icon  |
| `onPress`    | `(e: PressEvent) => void`                                           | -           | Handler called when the button is pressed |
| `children`   | `React.ReactNode \| (values: ButtonRenderProps) => React.ReactNode` | -           | Button content or render prop             |

### ButtonRenderProps

When using the render prop pattern, these values are provided:

| Prop             | Type      | Description                                    |
| ---------------- | --------- | ---------------------------------------------- |
| `isPending`      | `boolean` | Whether the button is in a loading state       |
| `isPressed`      | `boolean` | Whether the button is currently pressed        |
| `isHovered`      | `boolean` | Whether the button is hovered                  |
| `isFocused`      | `boolean` | Whether the button is focused                  |
| `isFocusVisible` | `boolean` | Whether the button should show focus indicator |
| `isDisabled`     | `boolean` | Whether the button is disabled                 |


# HeroUI v3 > components > Card
URL: /docs/components/card
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/card.mdx

Flexible container component for grouping related content and actions
        
***

title: Card
description: Flexible container component for grouping related content and actions
icon: updated
links:
source: card/card.tsx
styles: card.css
storybook: card
---------------

## Import

```tsx
import { Card } from "@heroui/react";
```

### Usage

<ComponentPreview name="card-default" />

### Anatomy

Import the Card component and access all parts using dot notation.

```tsx
import { Card } from "@heroui/react";

export default () => (
  <Card.Root>
    <Card.Header>
      <Card.Title />
      <Card.Description />
    </Card.Header>
    <Card.Content />
    <Card.Footer />
  </Card.Root>
);
```

### Variants

<ComponentPreview name="card-variants" />

### Horizontal Layout

<ComponentPreview name="card-horizontal" />

### With Avatar

<ComponentPreview name="card-with-avatar" />

### With Image

<ComponentPreview name="card-with-image" />

### With Background Image

<ComponentPreview name="card-with-background-image" />

### With Form

<ComponentPreview name="card-with-form" />

## Accessibility

```tsx
// Semantic markup
<Card.Root role="article" aria-labelledby="card-title">
  <Card.Header>
    <Card.Title id="card-title">Article Title</Card.Title>
  </Card.Header>
</Card.Root>

// Interactive cards
<Card.Root asChild>
  <a href="/details" aria-label="View product details">
    <Card.Title>Product Name</Card.Title>
  </a>
</Card.Root>
```

## Styling

### Component Customization

```tsx
<Card.Root className="border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50">
  <Card.Header>
    <Card.Title className="text-blue-900">Custom Styled Card</Card.Title>
    <Card.Description className="text-blue-700">Custom colors applied</Card.Description>
  </Card.Header>
  <Card.Content>
    <p className="text-blue-800">Content with custom styling</p>
  </Card.Content>
</Card.Root>
```

### CSS Variable Overrides

```css
/* Override specific variants */
.card--variant-elevated {
  @apply bg-gradient-to-br from-blue-50 to-purple-50;
}

/* Custom element styles */
.card__title {
  @apply text-xl font-bold;
}
```

## CSS Classes

Card uses BEM naming for predictable styling, ([View source styles](https://github.com/heroui-inc/heroui/blob/v3/packages/styles/components/card.css)):

#### Base Classes

* `.card` - Base container with padding and border
* `.card__header` - Header section container
* `.card__title` - Title with base font size and weight
* `.card__description` - Muted description text
* `.card__content` - Flexible content container
* `.card__footer` - Footer with row layout

#### Variant Classes

* `.card--variant-flat` - Transparent background, no border
* `.card--variant-outlined` - Border with subtle background (default)
* `.card--variant-elevated` - Slightly elevated with medium background
* `.card--variant-filled` - Prominently filled with stronger background

## API Reference

### Card.Root

| Prop        | Type                                             | Default      | Description                |
| ----------- | ------------------------------------------------ | ------------ | -------------------------- |
| `variant`   | `"flat" \| "outlined" \| "elevated" \| "filled"` | `"outlined"` | Visual variant of the card |
| `asChild`   | `boolean`                                        | `false`      | Render as a child element  |
| `className` | `string`                                         | -            | Additional CSS classes     |
| `children`  | `React.ReactNode`                                | -            | Card content               |

### Card.Header

| Prop        | Type              | Default | Description               |
| ----------- | ----------------- | ------- | ------------------------- |
| `asChild`   | `boolean`         | `false` | Render as a child element |
| `className` | `string`          | -       | Additional CSS classes    |
| `children`  | `React.ReactNode` | -       | Header content            |

### Card.Title

| Prop        | Type              | Default | Description                     |
| ----------- | ----------------- | ------- | ------------------------------- |
| `asChild`   | `boolean`         | `false` | Render as a child element       |
| `className` | `string`          | -       | Additional CSS classes          |
| `children`  | `React.ReactNode` | -       | Title content (renders as `h3`) |

### Card.Description

| Prop        | Type              | Default | Description                          |
| ----------- | ----------------- | ------- | ------------------------------------ |
| `asChild`   | `boolean`         | `false` | Render as a child element            |
| `className` | `string`          | -       | Additional CSS classes               |
| `children`  | `React.ReactNode` | -       | Description content (renders as `p`) |

### Card.Content

| Prop        | Type              | Default | Description               |
| ----------- | ----------------- | ------- | ------------------------- |
| `asChild`   | `boolean`         | `false` | Render as a child element |
| `className` | `string`          | -       | Additional CSS classes    |
| `children`  | `React.ReactNode` | -       | Main content              |

### Card.Footer

| Prop        | Type              | Default | Description               |
| ----------- | ----------------- | ------- | ------------------------- |
| `asChild`   | `boolean`         | `false` | Render as a child element |
| `className` | `string`          | -       | Additional CSS classes    |
| `children`  | `React.ReactNode` | -       | Footer content            |


# HeroUI v3 > components > Chip
URL: /docs/components/chip
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/chip.mdx

Small informational badges for displaying labels, statuses, and categories
        
***

title: Chip
description: Small informational badges for displaying labels, statuses, and categories
links:
source: chip/chip.tsx
styles: chip.css
storybook: chip
figma: true
-----------

## Import

```tsx
import { Chip } from '@heroui/react';
```

### Usage

<ComponentPreview name="chip-basic" />

### Variants

<ComponentPreview name="chip-variants" />

### With Icons

<ComponentPreview name="chip-with-icon" />

### Statuses

<ComponentPreview name="chip-statuses" />

## Styling

### Passing Tailwind CSS classes

```tsx
import {Chip} from '@heroui/react';

function CustomChip() {
  return (
    <Chip className="rounded-full px-4 py-2 font-bold">
      Custom Styled
    </Chip>
  );
}
```

### Customizing the component classes

To customize the Chip component classes, you can use the `@layer components` directive.
<br />[Learn more](https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes).

```css
@layer components {
  .chip {
    @apply rounded-full text-xs;
  }

  .chip--accent {
    @apply border-accent/20;
  }
}
```

HeroUI follows the [BEM](https://getbem.com/) methodology to ensure component variants and states are reusable and easy to customize.

### CSS Classes

The Chip component uses these CSS classes ([View source styles](https://github.com/heroui-inc/heroui/blob/v3/packages/styles/components/chip.css)):

#### Base Classes

* `.chip` - Base chip styles

#### Type Classes

* `.chip--accent` - Accent type variant
* `.chip--danger` - Danger type variant
* `.chip--default` - Default type variant
* `.chip--success` - Success type variant
* `.chip--warning` - Warning type variant

#### Variant Classes

* `.chip--primary` - Primary variant with filled background
* `.chip--secondary` - Secondary variant with border
* `.chip--tertiary` - Tertiary variant with transparent background

#### Compound Variant Classes

* `.chip--primary.chip--accent` - Primary accent combination
* `.chip--primary.chip--success` - Primary success combination
* `.chip--primary.chip--warning` - Primary warning combination
* `.chip--primary.chip--danger` - Primary danger combination

### Interactive States

The component supports focus visibility:

* **Focus**: `:focus-visible` or `[data-focus-visible="true"]`

## API Reference

### Chip Props

| Prop        | Type                                                          | Default       | Description                        |
| ----------- | ------------------------------------------------------------- | ------------- | ---------------------------------- |
| `children`  | `React.ReactNode`                                             | -             | Content to display inside the chip |
| `className` | `string`                                                      | -             | Additional CSS classes             |
| `type`      | `"default" \| "accent" \| "success" \| "warning" \| "danger"` | `"default"`   | Type variant of the chip           |
| `variant`   | `"primary" \| "secondary" \| "tertiary"`                      | `"secondary"` | Visual style variant               |


# HeroUI v3 > components > CloseButton
URL: /docs/components/close-button
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/close-button.mdx

Button component for closing dialogs, modals, or dismissing content
        
***

title: CloseButton
description: Button component for closing dialogs, modals, or dismissing content
links:
rac: Button
source: close-button/close-button.tsx
styles: close-button.css
storybook: close-button
-----------------------

## Import

```tsx
import {CloseButton} from "@heroui/react";
```

### Usage

<ComponentPreview name="close-button-default" />

### With Custom Icon

<ComponentPreview name="close-button-with-custom-icon" />

### Interactive

<ComponentPreview name="close-button-interactive" />

## Styling

### Passing Tailwind CSS classes

```tsx
import {CloseButton} from "@heroui/react";

function CustomCloseButton() {
  return <CloseButton className="text-red-600 hover:bg-red-100">Close</CloseButton>;
}
```

### Customizing the component classes

To customize the CloseButton component classes, you can use the `@layer components` directive.
<br />[Learn more](https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes).

```css
@layer components {
  .close-button {
    @apply bg-red-100 text-red-800 hover:bg-red-200;
  }

  .close-button--custom {
    @apply rounded-full border-2 border-red-300;
  }
}
```

HeroUI follows the [BEM](https://getbem.com/) methodology to ensure component variants and states are reusable and easy to customize.

### CSS Classes

The CloseButton component uses these CSS classes ([View source styles](https://github.com/heroui-inc/heroui/blob/v3/packages/styles/components/close-button.css)):

#### Base Classes

* `.close-button` - Base component styles

#### Variant Classes

* `.close-button--default` - Default variant

### Interactive States

The component supports both CSS pseudo-classes and data attributes for flexibility:

* **Hover**: `:hover` or `[data-hovered="true"]`
* **Active/Pressed**: `:active` or `[data-pressed="true"]`
* **Focus**: `:focus-visible` or `[data-focus-visible="true"]`
* **Disabled**: `:disabled` or `[aria-disabled="true"]`

## API Reference

### CloseButton Props

| Prop         | Type                    | Default         | Description                                 |
| ------------ | ----------------------- | --------------- | ------------------------------------------- |
| `variant`    | `"default"`             | `"default"`     | Visual variant of the button                |
| `asChild`    | `boolean`               | `false`         | Render as child element                     |
| `children`   | `ReactNode \| function` | `<CloseIcon />` | Content to display (defaults to close icon) |
| `onPress`    | `() => void`            | -               | Handler called when the button is pressed   |
| `isDisabled` | `boolean`               | `false`         | Whether the button is disabled              |

### React Aria Button Props

CloseButton extends all React Aria Button props. Common props include:

| Prop               | Type     | Description                             |
| ------------------ | -------- | --------------------------------------- |
| `aria-label`       | `string` | Accessible label for screen readers     |
| `aria-labelledby`  | `string` | ID of element that labels the button    |
| `aria-describedby` | `string` | ID of element that describes the button |

### RenderProps

When using the render prop pattern, these values are provided:

| Prop         | Type      | Description                    |
| ------------ | --------- | ------------------------------ |
| `isHovered`  | `boolean` | Whether the button is hovered  |
| `isPressed`  | `boolean` | Whether the button is pressed  |
| `isFocused`  | `boolean` | Whether the button is focused  |
| `isDisabled` | `boolean` | Whether the button is disabled |


# HeroUI v3 > components > Description
URL: /docs/components/description
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/description.mdx

Provides supplementary text for form fields and other components
        
***

title: Description
description: Provides supplementary text for form fields and other components
links:
rac: TextField
source: description/description.tsx
styles: description.css
storybook: description
----------------------

## Import

```tsx
import { Description } from '@heroui/react';
```

## Usage

<ComponentPreview name="description-basic" />

<RelatedComponents component="description" />

## API

### Description Props

| Prop        | Type        | Default | Description                    |
| ----------- | ----------- | ------- | ------------------------------ |
| `className` | `string`    | -       | Additional CSS classes         |
| `children`  | `ReactNode` | -       | The content of the description |

## Accessibility

The Description component enhances accessibility by:

* Using semantic HTML that screen readers can identify
* Providing the `slot="description"` attribute for React Aria integration
* Supporting proper text contrast ratios

## Styling

The Description component uses the following CSS classes:

* `.description` - Base description styles with `muted` text color

## Examples

### With Form Fields

```tsx
<div className="flex flex-col gap-1">
  <Label htmlFor="password">Password</Label>
  <Input id="password" type="password" aria-describedby="password-description" />
  <Description id="password-description">
    Must be at least 8 characters with one uppercase letter
  </Description>
</div>
```

### Integration with TextField

```tsx
import {TextField, Label, Input, Description} from '@heroui/react';

<TextField type="email">
  <Label>Email</Label>
  <Input placeholder="Enter your email" />
  <Description>We'll never share your email</Description>
</TextField>
```

When using the [TextField](./text-field) component, accessibility attributes are automatically applied to the label and description.


# HeroUI v3 > components > DisclosureGroup
URL: /docs/components/disclosure-group
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/disclosure-group.mdx

Container that manages multiple Disclosure items with coordinated expanded states
        
***

title: DisclosureGroup
description: Container that manages multiple Disclosure items with coordinated expanded states
icon: updated
links:
rac: DisclosureGroup
source: disclosure-group/disclosure-group.tsx
styles: disclosure-group.css
storybook: disclosure-group
---------------------------

## Import

```tsx
import {DisclosureGroup} from '@heroui/react';
```

### Usage

<ComponentPreview name="disclosure-group-basic" />

### Anatomy

Import all parts and piece them together.

```tsx
import {DisclosureGroup, Disclosure} from '@heroui/react';

export default () => (
  <DisclosureGroup>
    <Disclosure.Root id="item1">
      <Disclosure.Heading>
        <Disclosure.Trigger>
          <Disclosure.Indicator />
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content />
    </Disclosure.Root>
  </DisclosureGroup>
)
```

### Controlled

You can control which disclosures are expanded with external navigation controls using the `expandedKeys` and `onExpandedChange` props.

<ComponentPreview name="disclosure-group-controlled" />

<RelatedShowcases component="DisclosureGroup" />

## Styling

### Passing Tailwind CSS classes

```tsx
import {
  DisclosureGroup,
  Disclosure,
  DisclosureTrigger,
  DisclosurePanel
} from '@heroui/react';

function CustomDisclosureGroup() {
  return (
    <DisclosureGroup className="border rounded-lg p-4 space-y-2">
      <Disclosure id="first" className="border-b pb-2">
        <DisclosureTrigger>Item 1</DisclosureTrigger>
        <DisclosurePanel>Content 1</DisclosurePanel>
      </Disclosure>
      <Disclosure id="second">
        <DisclosureTrigger>Item 2</DisclosureTrigger>
        <DisclosurePanel>Content 2</DisclosurePanel>
      </Disclosure>
    </DisclosureGroup>
  );
}
```

### Customizing the component classes

To customize the DisclosureGroup component classes, you can use the `@layer components` directive.
<br />[Learn more](https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes).

```css
@layer components {
  .disclosure-group {
    @apply w-full;

    /* Performance optimization */
    contain: layout style;
  }
}
```

HeroUI follows the [BEM](https://getbem.com/) methodology to ensure component variants and states are reusable and easy to customize.

### CSS Classes

The DisclosureGroup component uses these CSS classes ([View source styles](https://github.com/heroui-inc/heroui/blob/v3/packages/styles/components/disclosure-group.css)):

#### Base Classes

* `.disclosure-group` - Base container styles with layout containment

### Interactive States

The component supports both CSS pseudo-classes and data attributes for flexibility:

* **Disabled**: `:disabled` or `[aria-disabled="true"]` on entire group
* **Expanded Management**: Automatically manages `[data-expanded]` states on child Disclosure items

## API Reference

### DisclosureGroup Props

| Prop                     | Type                          | Default | Description                                           |
| ------------------------ | ----------------------------- | ------- | ----------------------------------------------------- |
| `expandedKeys`           | `Set<Key>`                    | -       | The currently expanded items (controlled)             |
| `defaultExpandedKeys`    | `Iterable<Key>`               | -       | The initially expanded items (uncontrolled)           |
| `onExpandedChange`       | `(keys: Set<Key>) => void`    | -       | Handler called when expanded items change             |
| `allowsMultipleExpanded` | `boolean`                     | `false` | Whether multiple items can be expanded simultaneously |
| `isDisabled`             | `boolean`                     | `false` | Whether all disclosures in the group are disabled     |
| `children`               | `ReactNode \| RenderFunction` | -       | Disclosure items to render                            |
| `className`              | `string`                      | -       | Additional CSS classes                                |

### RenderProps

When using the render prop pattern, these values are provided:

| Prop           | Type       | Description                   |
| -------------- | ---------- | ----------------------------- |
| `expandedKeys` | `Set<Key>` | Currently expanded item keys  |
| `isDisabled`   | `boolean`  | Whether the group is disabled |


# HeroUI v3 > components > Disclosure
URL: /docs/components/disclosure
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/disclosure.mdx

A disclosure is a collapsible section with a header containing a heading and a trigger button, and a panel that wraps the content.
        
***

title: Disclosure
description: A disclosure is a collapsible section with a header containing a heading and a trigger button, and a panel that wraps the content.
icon: updated
links:
rac: Disclosure
source: disclosure/disclosure.tsx
styles: disclosure.css
storybook: disclosure
figma: true
-----------

## Import

```tsx
import { Disclosure } from '@heroui/react';
```

### Usage

<ComponentPreview name="disclosure-basic" />

### Anatomy

Import the Disclosure component and access all parts using dot notation.

```tsx
import { Disclosure } from '@heroui/react';

export default () => (
  <Disclosure.Root>
    <Disclosure.Heading>
      <Disclosure.Trigger>
        <Disclosure.Indicator />
      </Disclosure.Trigger>
    </Disclosure.Heading>
    <Disclosure.Content/>
  </Disclosure.Root>
)
```

<RelatedShowcases component="Disclosure" />

## Styling

### Passing Tailwind CSS classes

```tsx
import { Disclosure } from '@heroui/react';

function CustomDisclosure() {
  return (
    <Disclosure.Root className="border rounded-lg p-4">
      <Disclosure.Heading>
        <Disclosure.Trigger className="text-lg font-semibold">
          Click to expand
          <Disclosure.Indicator />
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content>
        <Disclosure.Body className="mt-4 text-gray-600">
          Hidden content
        </Disclosure.Body>
      </Disclosure.Content>
    </Disclosure.Root>
  );
}
```

### Customizing the component classes

To customize the Disclosure component classes, you can use the `@layer components` directive.
<br />[Learn more](https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes).

```css
@layer components {
  .disclosure {
    @apply relative;
  }
  
  .disclosure__trigger {
    @apply cursor-pointer;
  }
  
  .disclosure__indicator {
    @apply transition-transform duration-300;
  }
  
  .disclosure__content {
    @apply overflow-hidden transition-all;
  }
}
```

HeroUI follows the [BEM](https://getbem.com/) methodology to ensure component variants and states are reusable and easy to customize.

### CSS Classes

The Disclosure component uses these CSS classes ([View source styles](https://github.com/heroui-inc/heroui/blob/v3/packages/styles/components/disclosure.css)):

#### Base Classes

* `.disclosure` - Base container styles
* `.disclosure__heading` - Heading wrapper
* `.disclosure__trigger` - Trigger button styles
* `.disclosure__indicator` - Chevron indicator styles
* `.disclosure__content` - Content container with animations

### Interactive States

The component supports both CSS pseudo-classes and data attributes for flexibility:

* **Expanded**: `[data-expanded="true"]` on indicator for rotation
* **Focus**: `:focus-visible` or `[data-focus-visible="true"]` on trigger
* **Disabled**: `:disabled` or `[aria-disabled="true"]` on trigger
* **Hidden**: `[aria-hidden="false"]` on content for visibility

## API Reference

### Disclosure.Root Props

| Prop               | Type                            | Default | Description                          |
| ------------------ | ------------------------------- | ------- | ------------------------------------ |
| `isExpanded`       | `boolean`                       | `false` | Controls the expanded state          |
| `onExpandedChange` | `(isExpanded: boolean) => void` | -       | Callback when expanded state changes |
| `isDisabled`       | `boolean`                       | `false` | Whether the disclosure is disabled   |
| `children`         | `ReactNode \| RenderFunction`   | -       | Content to render                    |
| `className`        | `string`                        | -       | Additional CSS classes               |

### DisclosureTrigger Props

| Prop        | Type                          | Default | Description            |
| ----------- | ----------------------------- | ------- | ---------------------- |
| `children`  | `ReactNode \| RenderFunction` | -       | Trigger content        |
| `className` | `string`                      | -       | Additional CSS classes |

### DisclosurePanel Props

| Prop        | Type        | Default | Description            |
| ----------- | ----------- | ------- | ---------------------- |
| `children`  | `ReactNode` | -       | Content to show/hide   |
| `className` | `string`    | -       | Additional CSS classes |

### RenderProps

When using the render prop pattern, these values are provided:

| Prop         | Type      | Description                    |
| ------------ | --------- | ------------------------------ |
| `isExpanded` | `boolean` | Current expanded state         |
| `isDisabled` | `boolean` | Whether disclosure is disabled |


# HeroUI v3 > components > FieldError
URL: /docs/components/field-error
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/field-error.mdx

Displays validation error messages for form fields
        
***

title: FieldError
description: Displays validation error messages for form fields
links:
rac: FieldError
source: field-error/field-error.tsx
styles: field-error.css
storybook: field-error
----------------------

## Import

```tsx
import { FieldError } from '@heroui/react';
```

## Usage

The FieldError component displays validation error messages for form fields. It automatically appears when the parent field is marked as invalid and provides smooth opacity transitions.

<ComponentPreview name="field-error-basic" />

<RelatedComponents component="fielderror" />

## API

### FieldError Props

| Prop        | Type                                                         | Default | Description                              |
| ----------- | ------------------------------------------------------------ | ------- | ---------------------------------------- |
| `className` | `string`                                                     | -       | Additional CSS classes                   |
| `children`  | `ReactNode \| ((validation: ValidationResult) => ReactNode)` | -       | Error message content or render function |

## Accessibility

The FieldError component ensures accessibility by:

* Using proper ARIA attributes for error announcement
* Supporting screen readers with semantic HTML
* Providing visual and programmatic error indication
* Automatically managing visibility based on validation state

## Styling

The FieldError component uses the following CSS classes:

* `.field-error` - Base error styles with danger color
* Only shows when the `data-visible` attribute is present
* Text is truncated with ellipsis for long messages

## Examples

### Basic Validation

```tsx
export function Basic() {
  const [value, setValue] = useState("");
  const isInvalid = value.length > 0 && value.length < 3;

  return (
    <TextField className="w-64" isInvalid={isInvalid}>
      <Label htmlFor="username">Username</Label>
      <Input
        id="username"
        placeholder="Enter username"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <FieldError>Username must be at least 3 characters</FieldError>
    </TextField>
  );
}
```

### With Dynamic Messages

```tsx
<TextField isInvalid={errors.length > 0}>
  <Label>Password</Label>
  <Input type="password" />
  <FieldError>
    {(validation) => validation.validationErrors.join(', ')}
  </FieldError>
</TextField>
```

### Custom Validation Logic

```tsx
function EmailField() {
  const [email, setEmail] = useState('');
  const isInvalid = email.length > 0 && !email.includes('@');

  return (
    <TextField isInvalid={isInvalid}>
      <Label>Email</Label>
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <FieldError>Email must include @ symbol</FieldError>
    </TextField>
  );
}
```

### Multiple Error Messages

```tsx
<TextField isInvalid={hasErrors}>
  <Label>Username</Label>
  <Input />
  <FieldError>
    {errors.map((error, i) => (
      <div key={i}>{error}</div>
    ))}
  </FieldError>
</TextField>
```


# HeroUI v3 > components > Fieldset
URL: /docs/components/fieldset
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/fieldset.mdx

Group related form controls with legends, descriptions, and actions
        
***

title: Fieldset
description: Group related form controls with legends, descriptions, and actions
icon: updated
links:
source: fieldset/fieldset.tsx
styles: fieldset.css
storybook: fieldset
-------------------

## Import

```tsx
import { Fieldset } from '@heroui/react';
```

### Usage

<ComponentPreview name="fieldset-basic" />

### Anatomy

Import the Fieldset component and access all parts using dot notation.

```tsx
import { Fieldset } from '@heroui/react';

export default () => (
  <Fieldset.Root>
    <Fieldset.Legend />
    <Fieldset.Group>
      {/* form fields go here */}
    </Fieldset.Group>
    <Fieldset.Actions>
      {/* action buttons go here */}
    </Fieldset.Actions>
  </Fieldset.Root>
)
```

<RelatedComponents component="fieldset" />

<RelatedShowcases component="Fieldset" />

## Styling

### Passing Tailwind CSS classes

```tsx
import { Fieldset, TextField, Label, Input } from '@heroui/react';

function CustomFieldset() {
  return (
    <Fieldset.Root className="rounded-xl border border-border bg-surface-2 p-6 shadow-sm">
      <Fieldset.Legend className="text-lg font-semibold">Team members</Fieldset.Legend>
      <Fieldset.Group className="grid gap-4 md:grid-cols-2">
        <TextField>
          <Label>First name</Label>
          <Input className="rounded-full border-border/60" placeholder="Jane" />
        </TextField>
        <TextField>
          <Label>Last name</Label>
          <Input className="rounded-full border-border/60" placeholder="Doe" />
        </TextField>
      </Fieldset.Group>
      <Fieldset.Actions className="justify-end gap-3">
        {/* Action buttons */}
      </Fieldset.Actions>
    </Fieldset.Root>
  );
}
```

### Customizing the component classes

Use the `@layer components` directive to target Fieldset BEM-style classes.

```css
@layer components {
  .fieldset {
    @apply gap-5 rounded-xl border border-border/60 bg-surface-2 p-6 shadow-field;
  }

  .fieldset__legend {
    @apply text-lg font-semibold;
  }

  .fieldset_field_group {
    @apply gap-3 md:grid md:grid-cols-2;
  }

  .fieldset_actions {
    @apply flex justify-end gap-2 pt-2;
  }
}
```

### CSS Classes

The Fieldset compound component exposes these CSS selectors:

* `.fieldset` – Root container
* `.fieldset__legend` – Legend element
* `.fieldset_field_group` – Wrapper for grouped fields
* `.fieldset_actions` – Action bar below the fields

## API Reference

### Fieldset.Root Props

| Prop          | Type                                        | Default                                         | Description                                               |
| ------------- | ------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------- |
| `asChild`     | `boolean`                                   | `false`                                         | Render the fieldset as a custom component via `Slot`.     |
| `className`   | `string`                                    | -                                               | Tailwind CSS classes applied to the root element.         |
| `children`    | `React.ReactNode`                           | -                                               | Fieldset content (legend, groups, descriptions, actions). |
| `nativeProps` | `React.HTMLAttributes<HTMLFieldSetElement>` | Supports native fieldset attributes and events. |                                                           |

### Fieldset.Legend Props

| Prop          | Type                                      | Default | Description                                         |
| ------------- | ----------------------------------------- | ------- | --------------------------------------------------- |
| `asChild`     | `boolean`                                 | `false` | Render the legend as another component with `Slot`. |
| `className`   | `string`                                  | -       | Tailwind classes for the legend element.            |
| `children`    | `React.ReactNode`                         | -       | Legend content, usually plain text.                 |
| `nativeProps` | `React.HTMLAttributes<HTMLLegendElement>` | -       | Native legend attributes.                           |

### Fieldset.Group Props

| Prop          | Type                                   | Default | Description                                    |
| ------------- | -------------------------------------- | ------- | ---------------------------------------------- |
| `asChild`     | `boolean`                              | `false` | Render the group as a different component.     |
| `className`   | `string`                               | -       | Layout and spacing classes for grouped fields. |
| `children`    | `React.ReactNode`                      | -       | Form controls to group inside the fieldset.    |
| `nativeProps` | `React.HTMLAttributes<HTMLDivElement>` | -       | Native div attributes.                         |

### Fieldset.Actions Props

| Prop          | Type                                   | Default | Description                                         |
| ------------- | -------------------------------------- | ------- | --------------------------------------------------- |
| `asChild`     | `boolean`                              | `false` | Render the actions container as a custom component. |
| `className`   | `string`                               | -       | Tailwind classes to align action buttons or text.   |
| `children`    | `React.ReactNode`                      | -       | Action buttons or helper text.                      |
| `nativeProps` | `React.HTMLAttributes<HTMLDivElement>` | -       | Native div attributes.                              |


# HeroUI v3 > components > Form
URL: /docs/components/form
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/form.mdx

Wrapper component for form validation and submission handling
        
***

title: Form
description: Wrapper component for form validation and submission handling
links:
source: form/form.tsx
rac: [https://react-spectrum.adobe.com/react-aria/Form.html](https://react-spectrum.adobe.com/react-aria/Form.html)
-------------------------------------------------------------------------------------------------------------------

## Import

```tsx
import { Form } from '@heroui/react';
```

### Usage

<ComponentPreview name="form-basic" />

### Anatomy

Import all parts and piece them together.

```tsx
import {Form, Button} from '@heroui/react';

export default () => (
  <Form>
    {/* Form fields go here */}
    <Button type="submit"/>
    <Button type="reset"/>
  </Form>
)
```

<RelatedComponents component="form" />

<RelatedShowcases component="Form" />

## Styling

### Passing Tailwind CSS classes

```tsx
import {Form, TextField, Label, Input, FieldError, Button} from '@heroui/react';

function CustomForm() {
  return (
    <Form className="w-full max-w-md space-y-4 rounded-lg border border-border bg-surface-2 p-6">
      <TextField>
        <Label className="text-sm font-medium">Email</Label>
        <Input className="rounded-full border-border/60" placeholder="Enter your email" />
        <FieldError className="text-xs" />
      </TextField>
      <Button type="submit" className="w-full">
        Submit
      </Button>
    </Form>
  );
}
```

## API Reference

### Form Props

The Form component is a wrapper around React Aria's Form primitive that provides form validation and submission handling capabilities.

| Prop                 | Type                                                                           | Default    | Description                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`             | `string \| FormHTMLAttributes['action']`                                       | -          | The URL to submit the form data to.                                                                                                                     |
| `className`          | `string`                                                                       | -          | Tailwind CSS classes applied to the form element.                                                                                                       |
| `children`           | `React.ReactNode`                                                              | -          | Form content (fields, buttons, etc.).                                                                                                                   |
| `encType`            | `'application/x-www-form-urlencoded' \| 'multipart/form-data' \| 'text/plain'` | -          | The encoding type for form data submission.                                                                                                             |
| `method`             | `'get' \| 'post'`                                                              | -          | The HTTP method to use when submitting the form.                                                                                                        |
| `onInvalid`          | `(event: FormEvent<HTMLFormElement>) => void`                                  | -          | Handler called when the form validation fails. By default, the first invalid field will be focused. Use `preventDefault()` to customize focus behavior. |
| `onReset`            | `(event: FormEvent<HTMLFormElement>) => void`                                  | -          | Handler called when the form is reset.                                                                                                                  |
| `onSubmit`           | `(event: FormEvent<HTMLFormElement>) => void`                                  | -          | Handler called when the form is submitted.                                                                                                              |
| `target`             | `'_self' \| '_blank' \| '_parent' \| '_top'`                                   | -          | Where to display the response after submitting the form.                                                                                                |
| `validationBehavior` | `'native' \| 'aria'`                                                           | `'native'` | Whether to use native HTML validation or ARIA validation. 'native' blocks form submission, 'aria' displays errors in realtime.                          |
| `validationErrors`   | `ValidationErrors`                                                             | -          | Server-side validation errors mapped by field name. Displayed immediately and cleared when user modifies the field.                                     |
| `aria-label`         | `string`                                                                       | -          | Accessibility label for the form.                                                                                                                       |
| `aria-labelledby`    | `string`                                                                       | -          | ID of element that labels the form. Creates a form landmark when provided.                                                                              |

### Form Validation

The Form component integrates with React Aria's validation system, allowing you to:

* Use built-in HTML5 validation attributes (`required`, `minLength`, `pattern`, etc.)
* Provide custom validation functions on TextField components
* Display validation errors with FieldError components
* Handle form submission with proper validation
* Provide server-side validation errors via `validationErrors` prop

#### Validation Behavior

The `validationBehavior` prop controls how validation is displayed:

* **`native`** (default): Uses native HTML validation, blocks form submission on errors
* **`aria`**: Uses ARIA attributes for validation, displays errors in realtime as user types, doesn't block submission

This behavior can be set at the form level or overridden at individual field level.

### Form Submission

Forms can be submitted in several ways:

* **Traditional submission**: Set the `action` prop to submit to a URL
* **JavaScript handling**: Use the `onSubmit` handler to process form data
* **FormData API**: Access form data using the FormData API in your submit handler

Example with FormData:

```tsx
function handleSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const data = Object.fromEntries(formData);
  console.log('Form data:', data);
}
```

### Integration with Form Fields

The Form component works seamlessly with HeroUI's form field components:

* **TextField**: For text inputs with labels and validation
* **Checkbox**: For boolean selections
* **RadioGroup**: For single selection from multiple options
* **Switch**: For toggle controls
* **Button**: For form submission and reset actions

All field components automatically integrate with the Form's validation and submission behavior when placed inside it.

### Accessibility

Forms are accessible by default when using React Aria components. Key features include:

* Native `<form>` element semantics
* Form landmark creation with `aria-label` or `aria-labelledby`
* Automatic focus management on validation errors
* ARIA validation attributes when using `validationBehavior="aria"`

### Advanced Usage

For more advanced use cases including:

* Custom validation context
* Form context providers
* Integration with third-party libraries
* Custom focus management on validation errors

Please refer to the [React Aria Form documentation](https://react-spectrum.adobe.com/react-aria/Form.html).


# HeroUI v3 > components > Input
URL: /docs/components/input
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/input.mdx

Primitive single-line text input component that accepts standard HTML attributes
        
***

title: Input
description: Primitive single-line text input component that accepts standard HTML attributes
links:
rac: Input
source: input/input.tsx
styles: input.css
storybook: input
----------------

## Import

```tsx
import { Input } from '@heroui/react';
```

<Callout>
  For validation, labels, and error messages, see **[TextField](/docs/components/text-field)**.
</Callout>

### Usage

<ComponentPreview name="input-basic" />

### Input Types

<ComponentPreview name="input-types" />

### Controlled

<ComponentPreview name="input-controlled" />

<RelatedComponents component="input" />

## Styling

### Passing Tailwind CSS classes

```tsx
import {Input, Label} from '@heroui/react';

function CustomInput() {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="custom-input">Project name</Label>
      <Input
        id="custom-input"
        className="rounded-xl border border-border/70 bg-surface-2 px-4 py-2 text-sm shadow-sm focus-visible:border-primary"
        placeholder="New web app"
      />
    </div>
  );
}
```

### Customizing the component classes

The base class `.input` powers every instance. Override it once with `@layer components`.

```css
@layer components {
  .input {
    @apply rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm shadow-sm transition-colors;

    &:hover,
    &[data-hovered="true"] {
      @apply bg-surface-3 border-border/80;
    }

    &:focus-visible,
    &[data-focus-visible="true"] {
      @apply border-primary ring-2 ring-primary/20;
    }

    &[data-invalid="true"] {
      @apply border-danger bg-danger-50/10 text-danger;
    }
  }
}
```

### CSS Classes

* `.input` – Native input element styling

### Interactive States

* **Hover**: `:hover` or `[data-hovered="true"]`
* **Focus Visible**: `:focus-visible` or `[data-focus-visible="true"]`
* **Invalid**: `[data-invalid="true"]` (also syncs with `aria-invalid`)
* **Disabled**: `:disabled` or `[aria-disabled="true"]`
* **Read Only**: `[aria-readonly="true"]`

## API Reference

### Input Props

Input accepts all standard HTML `<input>` attributes plus the following:

| Prop           | Type                                                   | Default  | Description                                        |
| -------------- | ------------------------------------------------------ | -------- | -------------------------------------------------- |
| `className`    | `string`                                               | -        | Tailwind classes merged with the component styles. |
| `type`         | `string`                                               | `"text"` | Input type (text, email, password, number, etc.).  |
| `value`        | `string`                                               | -        | Controlled value.                                  |
| `defaultValue` | `string`                                               | -        | Uncontrolled initial value.                        |
| `onChange`     | `(event: React.ChangeEvent<HTMLInputElement>) => void` | -        | Change handler.                                    |
| `placeholder`  | `string`                                               | -        | Placeholder text.                                  |
| `disabled`     | `boolean`                                              | `false`  | Disables the input.                                |
| `readOnly`     | `boolean`                                              | `false`  | Makes the input read-only.                         |
| `required`     | `boolean`                                              | `false`  | Marks the input as required.                       |
| `name`         | `string`                                               | -        | Name for form submission.                          |
| `autoComplete` | `string`                                               | -        | Autocomplete hint for the browser.                 |
| `maxLength`    | `number`                                               | -        | Maximum number of characters.                      |
| `minLength`    | `number`                                               | -        | Minimum number of characters.                      |
| `pattern`      | `string`                                               | -        | Regex pattern for validation.                      |
| `min`          | `number \| string`                                     | -        | Minimum value (for number/date inputs).            |
| `max`          | `number \| string`                                     | -        | Maximum value (for number/date inputs).            |
| `step`         | `number \| string`                                     | -        | Stepping interval (for number inputs).             |

> For validation props like `isInvalid`, `isRequired`, and error handling, use **[TextField](/docs/components/text-field)** with Input as a child component.


# HeroUI v3 > components > Kbd
URL: /docs/components/kbd
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/kbd.mdx

Display keyboard shortcuts and key combinations
        
***

title: Kbd
description: Display keyboard shortcuts and key combinations
icon: updated
links:
source: kbd/kbd.tsx
styles: kbd.css
storybook: kbd
figma: true
-----------

## Import

```tsx
import { Kbd } from "@heroui/react";
```

### Usage

<ComponentPreview name="kbd-basic" />

### Anatomy

Import the Kbd component and access all parts using dot notation.

```tsx
import { Kbd } from "@heroui/react";

export default () => (
  <Kbd.Root>
    <Kbd.Abbr title="Command">⌘</Kbd.Abbr>
    <Kbd.Content>K</Kbd.Content>
  </Kbd.Root>
);
```

### Navigation Keys

<ComponentPreview name="kbd-navigation-keys" />

### Inline Usage

<ComponentPreview name="kbd-inline-usage" />

### Instructional Text

<ComponentPreview name="kbd-instructional-text" />

### Special Keys

<ComponentPreview name="kbd-special-keys" />

## Styling

### Passing Tailwind CSS classes

```tsx
import { Kbd } from "@heroui/react";

function CustomKbd() {
  return (
    <Kbd.Root className="bg-gray-100 dark:bg-gray-800">
      <Kbd.Content>K</Kbd.Content>
    </Kbd.Root>
  );
}
```

### Customizing the component classes

To customize the Kbd component classes, you can use the `@layer components` directive.
<br />[Learn more](https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes).

```css
@layer components {
  .kbd {
    @apply bg-gray-100 dark:bg-gray-800 border-gray-300;
  }

  .kbd__abbr {
    @apply font-bold;
  }

  .kbd__content {
    @apply text-sm;
  }
}
```

HeroUI follows the [BEM](https://getbem.com/) methodology to ensure component variants and states are reusable and easy to customize.

### CSS Classes

The Kbd component uses these CSS classes ([View source styles](https://github.com/heroui-inc/heroui/blob/v3/packages/styles/components/kbd.css)):

#### Base Classes

* `.kbd` - Base keyboard key styles with background, border, and spacing
* `.kbd__abbr` - Abbreviation element for modifier keys
* `.kbd__content` - Content wrapper for key text

## API Reference

### Kbd.Root Props

| Prop        | Type              | Default | Description        |
| ----------- | ----------------- | ------- | ------------------ |
| `children`  | `React.ReactNode` | -       | Content of the key |
| `className` | `string`          | -       | Custom CSS classes |

### Kbd.Abbr Props

| Prop        | Type              | Default | Description                                               |
| ----------- | ----------------- | ------- | --------------------------------------------------------- |
| `title`     | `string`          | -       | Title attribute for accessibility (e.g., "Command" for ⌘) |
| `children`  | `React.ReactNode` | -       | The symbol or text to display (e.g., ⌘, ⌥, ⇧)             |
| `className` | `string`          | -       | Custom CSS classes                                        |

### Kbd.Key Props

| Prop        | Type              | Default | Description             |
| ----------- | ----------------- | ------- | ----------------------- |
| `children`  | `React.ReactNode` | -       | Text content of the key |
| `className` | `string`          | -       | Custom CSS classes      |

### Kbd.Content Type

Available key values for the `keyValue` prop:

| Modifier Keys | Special Keys | Navigation Keys | Function Keys |
| ------------- | ------------ | --------------- | ------------- |
| `command`     | `enter`      | `up`            | `fn`          |
| `shift`       | `delete`     | `down`          |               |
| `ctrl`        | `escape`     | `left`          |               |
| `option`      | `tab`        | `right`         |               |
| `alt`         | `space`      | `pageup`        |               |
| `win`         | `capslock`   | `pagedown`      |               |
|               | `help`       | `home`          |               |
|               |              | `end`           |               |


# HeroUI v3 > components > Label
URL: /docs/components/label
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/label.mdx

Renders an accessible label associated with form controls
        
***

title: Label
description: Renders an accessible label associated with form controls
links:
rac: TextField
source: label/label.tsx
styles: label.css
storybook: label
----------------

## Import

```tsx
import { Label } from '@heroui/react';
```

## Usage

<ComponentPreview name="label-basic" />

<RelatedComponents component="label" />

## API

### Label Props

| Prop         | Type        | Default | Description                                        |
| ------------ | ----------- | ------- | -------------------------------------------------- |
| `htmlFor`    | `string`    | -       | The id of the element the label is associated with |
| `isRequired` | `boolean`   | `false` | Whether to display a required indicator            |
| `isDisabled` | `boolean`   | `false` | Whether the label is in a disabled state           |
| `isInvalid`  | `boolean`   | `false` | Whether the label is in an invalid state           |
| `className`  | `string`    | -       | Additional CSS classes                             |
| `children`   | `ReactNode` | -       | The content of the label                           |

## Accessibility

The Label component is built on the native HTML `<label>` element ([MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label)) and follows WAI-ARIA best practices:

* Associates with form controls using the `htmlFor` attribute
* Provides semantic HTML `<label>` element
* Supports keyboard navigation when associated with form controls
* Communicates required and invalid states to screen readers
* Clicking the label focuses/activates the associated form control

## Styling

### CSS Classes

The Label component uses these CSS classes ([View source styles](https://github.com/heroui-inc/heroui/blob/v3/packages/styles/components/label.css)):

#### Base Classes

* `.label` - Base label styles with text styling

#### State Modifier Classes

* `.label--required` or `[data-required="true"] > .label` - Shows required asterisk indicator
* `.label--disabled` or `[data-disabled="true"] .label` - Disabled state styling
* `.label--invalid` or `[data-invalid="true"] .label` or `[aria-invalid="true"] .label` - Invalid state styling (danger/red text color)

**Note**: The required asterisk is smartly applied using role and data-slot detection. It excludes:

* Elements with `role="group"`, `role="radiogroup"`, or `role="checkboxgroup"`
* Elements with `data-slot="radio"` or `data-slot="checkbox"`

This prevents duplicate asterisks when using group components with required fields.

## Examples

### With Required Indicator

```tsx
<Label htmlFor="email" isRequired>
  Email Address
</Label>
<Input id="email" type="email" />
```

### With Disabled State

```tsx
<Label htmlFor="username" isDisabled>
  Username
</Label>
<Input id="username" isDisabled />
```

### With Invalid State

```tsx
<Label htmlFor="password" isInvalid>
  Password
</Label>
<Input id="password" isInvalid />
```


# HeroUI v3 > components > Link
URL: /docs/components/link
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/link.mdx

A styled anchor component for navigation with built-in icon support
        
***

title: Link
description: A styled anchor component for navigation with built-in icon support
icon: updated
links:
rac: Link
source: link/link.tsx
styles: link.css
storybook: link
figma: true
-----------

## Import

```tsx
import { Link } from '@heroui/react';
```

### Usage

<ComponentPreview name="link-basic" />

### Anatomy

Import the Link component and access all parts using dot notation.

```tsx
import { Link } from '@heroui/react';

export default () => (
  <Link.Root href="#">
    Call to action
    <Link.Icon />
  </Link.Root>
);
```

### Custom Icon

<ComponentPreview name="link-custom-icon" />

### Icon Placement

<ComponentPreview name="link-icon-placement" />

## Styling

### Passing Tailwind CSS classes

```tsx
import { Link } from '@heroui/react';

function CustomLink() {
  return (
    <Link.Root
      href="#"
      className="text-lg font-bold text-accent hover:text-accent/80"
    >
      Custom styled link
    </Link.Root>
  );
}
```

### Customizing the component classes

To customize the Link component classes, you can use the `@layer components` directive.
<br />[Learn more](https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes).

```css
@layer components {
  .link {
    @apply font-semibold no-underline hover:underline;
  }
}
```

HeroUI follows the [BEM](https://getbem.com/) methodology to ensure component variants and states are reusable and easy to customize.

### CSS Classes

The Link component uses these CSS classes ([View source styles](https://github.com/heroui-inc/heroui/blob/v3/packages/styles/components/link.css)):

#### Base Classes

* `.link` - Base link styles with underline on hover

### Interactive States

The component supports both CSS pseudo-classes and data attributes for flexibility:

* **Focus**: `:focus-visible` or `[data-focus-visible="true"]`
* **Disabled**: `:disabled` or `[aria-disabled="true"]`

## API Reference

### Link.Root Props

| Prop         | Type                      | Default   | Description                                           |
| ------------ | ------------------------- | --------- | ----------------------------------------------------- |
| `href`       | `string`                  | -         | Destination URL for the anchor                        |
| `target`     | `string`                  | `"_self"` | Controls where to open the linked document            |
| `rel`        | `string`                  | -         | Relationship between the current and linked documents |
| `download`   | `boolean \| string`       | -         | Prompts file download instead of navigation           |
| `isDisabled` | `boolean`                 | `false`   | Disables pointer and keyboard interaction             |
| `className`  | `string`                  | -         | Custom classes merged with the default styles         |
| `children`   | `React.ReactNode`         | -         | Content rendered inside the link                      |
| `onPress`    | `(e: PressEvent) => void` | -         | Fired when the link is activated                      |
| `autoFocus`  | `boolean`                 | -         | Whether the element should receive focus on render    |

### Link.Icon Props

| Prop        | Type              | Default | Description                                                           |
| ----------- | ----------------- | ------- | --------------------------------------------------------------------- |
| `asChild`   | `boolean`         | `false` | Merge props with child element                                        |
| `children`  | `React.ReactNode` | -       | Custom icon element; defaults to the built-in arrow icon when omitted |
| `className` | `string`          | -       | Additional CSS classes                                                |


# HeroUI v3 > components > Popover
URL: /docs/components/popover
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/popover.mdx

Displays rich content in a portal triggered by a button or any custom element
        
***

title: Popover
description: Displays rich content in a portal triggered by a button or any custom element
icon: updated
links:
rac: Popover
source: popover/popover.tsx
styles: popover.css
storybook: popover
------------------

## Import

```tsx
import { Popover } from '@heroui/react';
```

### Usage

<ComponentPreview name="popover-basic" />

### Anatomy

Import the Popover component and access all parts using dot notation.

```tsx
import { Popover } from '@heroui/react';

export default () => (
  <Popover.Root>
    <Popover.Trigger/>
    <Popover.Content>
      <Popover.Arrow />
      <Popover.Dialog>
        <Popover.Heading/>
        {/* content goes here */}
      </Popover.Dialog>
    </Popover.Content>
  </Popover.Root>
)
```

### With Arrow

<ComponentPreview name="popover-with-arrow" />

### Placement

<ComponentPreview name="popover-placement" />

### Interactive Content

<ComponentPreview name="popover-interactive" />

## Styling

### Passing Tailwind CSS classes

```tsx
import { Popover, Button } from '@heroui/react';

function CustomPopover() {
  return (
    <Popover.Root>
      <Popover.Trigger>
        <Button>Open</Button>
      </Popover.Trigger>
      <Popover.Content className="bg-accent text-accent-foreground">
        <Popover.Dialog>
          <h3>Custom Styled</h3>
          <p>This popover has custom styling</p>
        </Popover.Dialog>
      </Popover.Content>
    </Popover.Root>
  );
}
```

### Customizing the component classes

To customize the Popover component classes, you can use the `@layer components` directive.
<br />[Learn more](https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes).

```css
@layer components {
  .popover {
    @apply rounded-xl shadow-2xl;
  }

  .popover__dialog {
    @apply p-4;
  }

  .popover__heading {
    @apply text-lg font-bold;
  }
}
```

HeroUI follows the [BEM](https://getbem.com/) methodology to ensure component variants and states are reusable and easy to customize.

### CSS Classes

The Popover component uses these CSS classes ([View source styles](https://github.com/heroui-inc/heroui/blob/v3/packages/styles/components/popover.css)):

#### Base Classes

* `.popover` - Base popover container styles
* `.popover__dialog` - Dialog content wrapper
* `.popover__heading` - Heading text styles
* `.popover__trigger` - Trigger element styles

### Interactive States

The component supports animation states:

* **Entering**: `[data-entering]` - Applied during popover appearance
* **Exiting**: `[data-exiting]` - Applied during popover disappearance
* **Placement**: `[data-placement="*"]` - Applied based on popover position
* **Focus**: `:focus-visible` or `[data-focus-visible="true"]`

## API Reference

### Popover.Root Props

| Prop           | Type                        | Default | Description                              |
| -------------- | --------------------------- | ------- | ---------------------------------------- |
| `children`     | `React.ReactNode`           | -       | Trigger and content elements             |
| `isOpen`       | `boolean`                   | -       | Controls popover visibility (controlled) |
| `defaultOpen`  | `boolean`                   | `false` | Initial open state (uncontrolled)        |
| `onOpenChange` | `(isOpen: boolean) => void` | -       | Called when open state changes           |

### Popover.Content Props

| Prop         | Type                                                    | Default    | Description                                   |
| ------------ | ------------------------------------------------------- | ---------- | --------------------------------------------- |
| `children`   | `React.ReactNode`                                       | -          | Content to display in the popover             |
| `placement`  | `"top" \| "bottom" \| "left" \| "right"` (and variants) | `"bottom"` | Placement of the popover                      |
| `offset`     | `number`                                                | `8`        | Distance from the trigger element             |
| `shouldFlip` | `boolean`                                               | `true`     | Whether popover can change orientation to fit |
| `className`  | `string`                                                | -          | Additional CSS classes                        |

### Popover.Dialog Props

| Prop        | Type              | Default | Description            |
| ----------- | ----------------- | ------- | ---------------------- |
| `children`  | `React.ReactNode` | -       | Dialog content         |
| `className` | `string`          | -       | Additional CSS classes |

### Popover.Trigger Props

| Prop        | Type              | Default | Description                       |
| ----------- | ----------------- | ------- | --------------------------------- |
| `children`  | `React.ReactNode` | -       | Element that triggers the popover |
| `className` | `string`          | -       | Additional CSS classes            |

### Popover.Arrow Props

| Prop        | Type              | Default | Description            |
| ----------- | ----------------- | ------- | ---------------------- |
| `children`  | `React.ReactNode` | -       | Custom arrow element   |
| `className` | `string`          | -       | Additional CSS classes |


# HeroUI v3 > components > RadioGroup
URL: /docs/components/radio-group
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/radio-group.mdx

Radio group for selecting a single option from a list
        
***

title: RadioGroup
description: Radio group for selecting a single option from a list
icon: updated
links:
rac: RadioGroup
source: radio-group/radio-group.tsx
styles: radio-group.css
storybook: radio-group
----------------------

## Import

```tsx
import { RadioGroup, Radio } from '@heroui/react';
```

### Usage

<ComponentPreview name="radio-group-basic" />

### Anatomy

Import the RadioGroup component and access all parts using dot notation.

```tsx
import {RadioGroup, Radio, Label, Description, FieldError} from '@heroui/react';

export default () => (
  <RadioGroup>
    <Label />
    <Description />
    <Radio.Root value="option1">
      <Radio.Control>
        <Radio.Indicator>
          <span>✓</span> {/* Custom indicator (optional) */}
        </Radio.Indicator>
      </Radio.Control>
      <Radio.Content>
        <Label />
        <Description />
      </Radio.Content>
    </Radio.Root>
    <FieldError />
  </RadioGroup>
)
```

### Custom Indicator

<ComponentPreview name="radio-group-custom-indicator" />

### Horizontal Orientation

<ComponentPreview name="radio-group-horizontal" />

### Controlled

<ComponentPreview name="radio-group-controlled" />

### Uncontrolled

Combine `defaultValue` with `onChange` when you only need to react to updates.

<ComponentPreview name="radio-group-uncontrolled" />

### Validation

<ComponentPreview name="radio-group-validation" />

### Disabled

<ComponentPreview name="radio-group-disabled" />

### Delivery & Payment

<ComponentPreview isBgSolid align="start" name="radio-group-delivery-and-payment" />

<RelatedShowcases component="RadioGroup" />

## Styling

### Passing Tailwind CSS classes

```tsx
import { RadioGroup, Radio } from '@heroui/react';

export default () => (
  <RadioGroup defaultValue="premium" name="plan">
    <Radio.Root
      className="border-border group cursor-pointer rounded-xl border-2 p-4 hover:border-blue-300 data-[selected=true]:border-blue-500 data-[selected=true]:bg-blue-500/10"
      value="basic"
    >
      <Radio.Indicator className="border-border border-2 group-hover:border-blue-400 group-data-[selected=true]:border-blue-500 group-data-[selected=true]:bg-blue-500" />
      Basic Plan
    </Radio.Root>
    <Radio.Root
      className="border-border group cursor-pointer rounded-xl border-2 p-4 hover:border-purple-300 data-[selected=true]:border-purple-500 data-[selected=true]:bg-purple-500/10"
      value="premium"
    >
      <Radio.Indicator className="border-border border-2 group-hover:border-purple-400 group-data-[selected=true]:border-purple-500 group-data-[selected=true]:bg-purple-500" />
      Premium Plan
    </Radio.Root>
    <Radio.Root
      className="border-border group cursor-pointer rounded-xl border-2 p-4 hover:border-emerald-300 data-[selected=true]:border-emerald-500 data-[selected=true]:bg-emerald-500/10"
      value="business"
    >
      <Radio.Indicator className="border-border border-2 group-hover:border-emerald-400 group-data-[selected=true]:border-emerald-500 group-data-[selected=true]:bg-emerald-500" />
      Business Plan
    </Radio.Root>
  </RadioGroup>
);
```

### Customizing the component classes

To customize the RadioGroup component classes, you can use the `@layer components` directive.
<br />[Learn more](https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes).

```css
@layer components {
  .radio-group {
    @apply gap-2;
  }

  .radio {
    @apply gap-4 rounded-lg border border-border p-3 hover:bg-surface-hovered;
  }

  .radio__control {
    @apply border-2 border-primary;
  }

  .radio__indicator {
    @apply bg-primary;
  }

  .radio__content {
    @apply gap-1;
  }
}
```

HeroUI follows the [BEM](https://getbem.com/) methodology to ensure component variants and states are reusable and easy to customize.

### CSS Classes

The RadioGroup component uses these CSS classes ([View source styles](https://github.com/heroui-inc/heroui/blob/v3/packages/styles/components/radio-group.css)):

#### Base Classes

* `.radio-group` - Base radio group container
* `.radio` - Individual radio item
* `.radio__control` - Radio control (circular button)
* `.radio__indicator` - Radio indicator (inner dot)
* `.radio__content` - Radio content wrapper

#### Modifier Classes

* `.radio--disabled` - Disabled radio state

### Interactive States

The radio supports both CSS pseudo-classes and data attributes for flexibility:

* **Selected**: `[aria-checked="true"]` or `[data-selected="true"]` (indicator appears)
* **Hover**: `:hover` or `[data-hovered="true"]` (border color changes)
* **Focus**: `:focus-visible` or `[data-focus-visible="true"]` (shows focus ring)
* **Pressed**: `:active` or `[data-pressed="true"]` (scale transform)
* **Disabled**: `:disabled` or `[aria-disabled="true"]` (reduced opacity, no pointer events)
* **Invalid**: `[data-invalid="true"]` or `[aria-invalid="true"]` (error border color)

## API Reference

### RadioGroup Props

| Prop           | Type                                                                    | Default      | Description                                                    |
| -------------- | ----------------------------------------------------------------------- | ------------ | -------------------------------------------------------------- |
| `value`        | `string`                                                                | -            | The current value (controlled)                                 |
| `defaultValue` | `string`                                                                | -            | The default value (uncontrolled)                               |
| `onChange`     | `(value: string) => void`                                               | -            | Handler called when the value changes                          |
| `isDisabled`   | `boolean`                                                               | `false`      | Whether the radio group is disabled                            |
| `isRequired`   | `boolean`                                                               | `false`      | Whether the radio group is required                            |
| `isReadOnly`   | `boolean`                                                               | `false`      | Whether the radio group is read only                           |
| `isInvalid`    | `boolean`                                                               | `false`      | Whether the radio group is in an invalid state                 |
| `name`         | `string`                                                                | -            | The name of the radio group, used when submitting an HTML form |
| `orientation`  | `'horizontal' \| 'vertical'`                                            | `'vertical'` | The orientation of the radio group                             |
| `children`     | `React.ReactNode \| (values: RadioGroupRenderProps) => React.ReactNode` | -            | Radio group content or render prop                             |

### Radio.Root Props

| Prop         | Type                                                               | Default | Description                                                     |
| ------------ | ------------------------------------------------------------------ | ------- | --------------------------------------------------------------- |
| `value`      | `string`                                                           | -       | The value of the radio button                                   |
| `isDisabled` | `boolean`                                                          | `false` | Whether the radio button is disabled                            |
| `name`       | `string`                                                           | -       | The name of the radio button, used when submitting an HTML form |
| `children`   | `React.ReactNode \| (values: RadioRenderProps) => React.ReactNode` | -       | Radio content or render prop                                    |

### Radio.Control Props

Extends `React.HTMLAttributes<HTMLSpanElement>`.

| Prop       | Type              | Default | Description                                                                  |
| ---------- | ----------------- | ------- | ---------------------------------------------------------------------------- |
| `children` | `React.ReactNode` | -       | The content to render inside the control wrapper (typically Radio.Indicator) |

### Radio.Indicator Props

Extends `React.HTMLAttributes<HTMLSpanElement>`.

| Prop       | Type                                                               | Default | Description                                                            |
| ---------- | ------------------------------------------------------------------ | ------- | ---------------------------------------------------------------------- |
| `children` | `React.ReactNode \| (values: RadioRenderProps) => React.ReactNode` | -       | Optional content or render prop that receives the current radio state. |

### Radio.Content Props

Extends `React.HTMLAttributes<HTMLDivElement>`.

| Prop       | Type              | Default | Description                                                                        |
| ---------- | ----------------- | ------- | ---------------------------------------------------------------------------------- |
| `children` | `React.ReactNode` | -       | The content to render inside the content wrapper (typically Label and Description) |

### RadioRenderProps

When using the render prop pattern, these values are provided:

| Prop             | Type      | Description                              |
| ---------------- | --------- | ---------------------------------------- |
| `isSelected`     | `boolean` | Whether the radio is currently selected  |
| `isHovered`      | `boolean` | Whether the radio is hovered             |
| `isPressed`      | `boolean` | Whether the radio is currently pressed   |
| `isFocused`      | `boolean` | Whether the radio is focused             |
| `isFocusVisible` | `boolean` | Whether the radio is keyboard focused    |
| `isDisabled`     | `boolean` | Whether the radio is disabled            |
| `isReadOnly`     | `boolean` | Whether the radio is read only           |
| `isInvalid`      | `boolean` | Whether the radio is in an invalid state |


# HeroUI v3 > components > Separator
URL: /docs/components/separator
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/separator.mdx

Visually divide content sections
        
***

title: Separator
description: Visually divide content sections
links:
rac: Separator
source: separator/separator.tsx
styles: separator.css
storybook: separator
figma: true
-----------

## Import

```tsx
import { Separator } from '@heroui/react';
```

### Usage

<ComponentPreview name="separator-basic" />

### Vertical

<ComponentPreview name="separator-vertical" />

### With Content

<ComponentPreview name="separator-with-content" />

## Styling

### Passing Tailwind CSS classes

```tsx
import {Separator} from '@heroui/react';

function CustomSeparator() {
  return (
    <Separator className="my-8 bg-gradient-to-r from-transparent via-default-500 to-transparent" />
  );
}
```

### Customizing the component classes

To customize the Separator component classes, you can use the `@layer components` directive.
<br />[Learn more](https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes).

```css
@layer components {
  .separator {
    @apply bg-accent h-[2px];
  }
  
  .separator--vertical {
    @apply bg-accent w-[2px];
  }
}
```

HeroUI follows the [BEM](https://getbem.com/) methodology to ensure component variants and states are reusable and easy to customize.

### CSS Classes

The Separator component uses these CSS classes ([View source styles](https://github.com/heroui-inc/heroui/blob/v3/packages/styles/components/separator.css)):

#### Base & Orientation Classes

* `.separator` - Base separator styles with default horizontal orientation
* `.separator--horizontal` - Horizontal orientation (full width, 1px height)
* `.separator--vertical` - Vertical orientation (full height, 1px width)

## API Reference

### Separator Props

| Prop          | Type                         | Default        | Description                      |
| ------------- | ---------------------------- | -------------- | -------------------------------- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | The orientation of the separator |
| `className`   | `string`                     | -              | Additional CSS classes           |


# HeroUI v3 > components > Skeleton
URL: /docs/components/skeleton
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/skeleton.mdx

Skeleton is a placeholder to show a loading state and the expected shape of a component.
        
***

title: Skeleton
description: Skeleton is a placeholder to show a loading state and the expected shape of a component.
links:
source: skeleton/skeleton.tsx
styles: skeleton.css
storybook: skeleton
figma: true
-----------

## Import

```tsx
import { Skeleton } from '@heroui/react';
```

### Usage

<ComponentPreview name="skeleton-basic" />

### Text Content

<ComponentPreview name="skeleton-text-content" />

### User Profile

<ComponentPreview name="skeleton-user-profile" />

### List Items

<ComponentPreview name="skeleton-list" />

### Animation Types

<ComponentPreview name="skeleton-animation-types" />

## Styling

### Global Animation Configuration

You can set a default animation type for all Skeleton components in your application by defining the `--skeleton-animation` CSS variable:

```css
/* In your global CSS file */
:root {
  /* Possible values: shimmer, pulse, none */
  --skeleton-animation: pulse;
}

/* You can also set different values for light/dark themes */
.light, [data-theme="light"] {
  --skeleton-animation: shimmer;
}

.dark, [data-theme="dark"] {
  --skeleton-animation: pulse;
}
```

This global setting will be overridden by the `animationType` prop when specified on individual components.

### Passing Tailwind CSS classes

```tsx
import { Skeleton } from '@heroui/react';

function CustomSkeleton() {
  return (
    <Skeleton className="h-20 w-32 rounded-full" />
  );
}
```

### Customizing the component classes

To customize the Skeleton component classes, you can use the `@layer components` directive.
<br />[Learn more](https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes).

```css
@layer components {
  /* Base skeleton styles */
  .skeleton {
    @apply bg-surface-3/50; /* Change base background */
  }

  /* Shimmer animation gradient */
  .skeleton--shimmer:before {
    @apply via-surface-2; /* Change shimmer gradient color */
  }

  /* Pulse animation */
  .skeleton--pulse {
    @apply animate-pulse opacity-75; /* Customize pulse animation */
  }

  /* No animation variant */
  .skeleton--none {
    @apply opacity-50; /* Style for static skeleton */
  }
}
```

HeroUI follows the [BEM](https://getbem.com/) methodology to ensure component variants and states are reusable and easy to customize.

### CSS Classes

The Skeleton component uses these CSS classes ([View source styles](https://github.com/heroui-inc/heroui/blob/v3/packages/styles/components/skeleton.css)):

#### Base Class

`.skeleton` - Base skeleton styles with background and rounded corners

#### Animation Variant Classes

* `.skeleton--shimmer` - Adds shimmer animation with gradient effect (default)
* `.skeleton--pulse` - Adds pulse animation using Tailwind's animate-pulse
* `.skeleton--none` - No animation, static skeleton

### Animation

The Skeleton component supports three animation types, each with different visual effects:

#### Shimmer Animation

The shimmer effect creates a gradient that moves across the skeleton element:

```css
.skeleton--shimmer:before {
  @apply animate-skeleton via-surface-3 absolute inset-0 -translate-x-full
         bg-gradient-to-r from-transparent to-transparent content-[''];
}
```

The shimmer animation is defined in the theme using:

```css
@theme inline {
  --animate-skeleton: skeleton 2s linear infinite;

  @keyframes skeleton {
    100% {
      transform: translateX(200%);
    }
  }
}
```

#### Pulse Animation

The pulse animation uses Tailwind's built-in `animate-pulse` utility:

```css
.skeleton--pulse {
  @apply animate-pulse;
}
```

#### No Animation

For static skeletons without any animation:

```css
.skeleton--none {
  /* No animation styles applied */
}
```

## API Reference

### Skeleton Props

| Prop            | Type                             | Default                     | Description                                                                                             |
| --------------- | -------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------- |
| `animationType` | `"shimmer" \| "pulse" \| "none"` | `"shimmer"` or CSS variable | The animation type for the skeleton. Can be globally configured via `--skeleton-animation` CSS variable |
| `className`     | `string`                         | -                           | Additional CSS classes                                                                                  |


# HeroUI v3 > components > Spinner
URL: /docs/components/spinner
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/spinner.mdx

A loading indicator component to show pending states
        
***

title: Spinner
description: A loading indicator component to show pending states
links:
source: spinner/spinner.tsx
styles: spinner.css
storybook: spinner
figma: true
-----------

## Import

```tsx
import { Spinner } from '@heroui/react';
```

### Usage

<ComponentPreview name="spinner-basic" />

### Colors

<ComponentPreview name="spinner-colors" />

### Sizes

<ComponentPreview name="spinner-sizes" />

## Styling

### Passing Tailwind CSS classes

```tsx
import {Spinner} from '@heroui/react';

function CustomSpinner() {
  return (
    <Spinner className="text-blue-500" />
  );
}
```

### Customizing the component classes

To customize the Spinner component classes, you can use the `@layer components` directive.
<br />[Learn more](https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes).

```css
@layer components {
  .spinner {
    @apply animate-spin;
  }

  .spinner--accent {
    color: var(--accent);
  }
}
```

HeroUI follows the [BEM](https://getbem.com/) methodology to ensure component variants and states are reusable and easy to customize.

### CSS Classes

The Spinner component uses these CSS classes ([View source styles](https://github.com/heroui-inc/heroui/blob/v3/packages/styles/components/spinner.css)):

#### Base & Size Classes

* `.spinner` - Base spinner styles with default size
* `.spinner--sm` - Small size variant
* `.spinner--md` - Medium size variant (default)
* `.spinner--lg` - Large size variant
* `.spinner--xl` - Extra large size variant

#### Color Classes

* `.spinner--current` - Inherits current text color
* `.spinner--accent` - Accent color variant
* `.spinner--danger` - Danger color variant
* `.spinner--success` - Success color variant
* `.spinner--warning` - Warning color variant

## API Reference

### Spinner Props

| Prop        | Type                                                          | Default     | Description                  |
| ----------- | ------------------------------------------------------------- | ----------- | ---------------------------- |
| `size`      | `"sm" \| "md" \| "lg" \| "xl"`                                | `"md"`      | Size of the spinner          |
| `color`     | `"current" \| "accent" \| "success" \| "warning" \| "danger"` | `"current"` | Color variant of the spinner |
| `className` | `string`                                                      | -           | Additional CSS classes       |


# HeroUI v3 > components > Switch
URL: /docs/components/switch
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/switch.mdx

A toggle switch component for boolean states
        
***

title: Switch
description: A toggle switch component for boolean states
icon: updated
links:
rac: Switch
source: switch/switch.tsx
styles: switch.css
storybook: switch
figma: true
-----------

## Import

```tsx
import { Switch, SwitchGroup, Label } from '@heroui/react';
```

### Usage

<ComponentPreview name="switch-basic" />

### Anatomy

Import the Switch component and access all parts using dot notation.

```tsx
import { Switch, Label } from '@heroui/react';

export default () => (
  <Switch.Root>
    <Switch.Control>
      <Switch.Thumb>
        <Switch.Icon/> {/* Optional */}
      </Switch.Thumb>
    </Switch.Control>
    <Label/> {/* Optional */}
  </Switch.Root>
);
```

For grouping multiple switches, use the `SwitchGroup` component:

```tsx
import { Switch, SwitchGroup, Label } from '@heroui/react';

export default () => (
  <SwitchGroup>
    <Switch.Root>
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
      <Label>Option 1</Label>
    </Switch.Root>
    <Switch.Root>
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
      <Label>Option 2</Label>
    </Switch.Root>
  </SwitchGroup>
);
```

### Disabled

<ComponentPreview name="switch-disabled" />

### Default Selected

<ComponentPreview name="switch-default-selected" />

### Controlled

<ComponentPreview name="switch-controlled" />

### Without Label

<ComponentPreview name="switch-without-label" />

### Sizes

<ComponentPreview name="switch-sizes" />

### Label Position

<ComponentPreview name="switch-label-position" />

### With Icons

<ComponentPreview name="switch-with-icons" />

### With Description

<ComponentPreview name="switch-with-description" />

### Group

<ComponentPreview name="switch-group" />

### Group Horizontal

<ComponentPreview name="switch-group-horizontal" />

### Render Props

<ComponentPreview name="switch-render-props" />

### Form Integration

<ComponentPreview name="switch-form" />

### Custom Styles

<ComponentPreview name="switch-custom-styles" />

## Styling

### Passing Tailwind CSS classes

You can customize individual Switch components:

```tsx
import { Switch, Label } from '@heroui/react';

function CustomSwitch() {
  return (
    <Switch.Root>
      {({isSelected}) => (
        <>
          <Switch.Control
            className={`h-[31px] w-[51px] bg-blue-500 ${isSelected ? "bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]" : ""}`}
          >
            <Switch.Thumb
              className={`size-[27px] bg-white shadow-sm ${isSelected ? "translate-x-5 shadow-lg" : ""}`}
            />
          </Switch.Control>
          <Label>Custom Switch</Label>
        </>
      )}
    </Switch.Root>
  );
}
```

Or customize the SwitchGroup layout:

```tsx
import { Switch, SwitchGroup, Label } from '@heroui/react';

function CustomSwitchGroup() {
  return (
    <SwitchGroup className="gap-8" orientation="horizontal">
      <Switch.Root>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Label>Option 1</Label>
      </Switch.Root>
      <Switch.Root>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Label>Option 2</Label>
      </Switch.Root>
    </SwitchGroup>
  );
}
```

### Customizing the component classes

To customize the Switch component classes, you can use the `@layer components` directive.
<br />[Learn more](https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes).

```css
@layer components {
  .switch {
    @apply inline-flex gap-3 items-center;
  }

  .switch__control {
    @apply h-5 w-8 bg-gray-400 data-[selected=true]:bg-blue-500;
  }

  .switch__thumb {
    @apply bg-white shadow-sm;
  }

  .switch__icon {
    @apply h-3 w-3 text-current;
  }
}
```

HeroUI follows the [BEM](https://getbem.com/) methodology to ensure component variants and states are reusable and easy to customize.

### CSS Classes

#### Switch Classes

The Switch component uses these CSS classes ([View source styles](https://github.com/heroui-inc/heroui/blob/v3/packages/styles/components/switch.css)):

* `.switch` - Base switch container
* `.switch__control` - Switch control track
* `.switch__thumb` - Switch thumb that moves
* `.switch__icon` - Optional icon inside the thumb
* `.switch--sm` - Small size variant
* `.switch--md` - Medium size variant (default)
* `.switch--lg` - Large size variant

#### SwitchGroup Classes

The SwitchGroup component uses these CSS classes ([View source styles](https://github.com/heroui-inc/heroui/blob/v3/packages/styles/components/switch-group.css)):

* `.switch-group` - Switch group container
* `.switch-group__items` - Container for switch items
* `.switch-group--horizontal` - Horizontal layout
* `.switch-group--vertical` - Vertical layout (default)

### Interactive States

The switch supports both CSS pseudo-classes and data attributes for flexibility:

* **Selected**: `[data-selected="true"]` (thumb position and background color change)
* **Hover**: `:hover` or `[data-hovered="true"]`
* **Focus**: `:focus-visible` or `[data-focus-visible="true"]` (shows focus ring)
* **Disabled**: `:disabled` or `[aria-disabled="true"]` (reduced opacity, no pointer events)
* **Pressed**: `:active` or `[data-pressed="true"]`

## API Reference

### Switch.Root Props

Inherits from [React Aria Switch](https://react-spectrum.adobe.com/react-aria/Switch.html).

| Prop              | Type                                                                | Default | Description                                                       |
| ----------------- | ------------------------------------------------------------------- | ------- | ----------------------------------------------------------------- |
| `size`            | `'sm' \| 'md' \| 'lg'`                                              | `'md'`  | The size of the switch                                            |
| `isSelected`      | `boolean`                                                           | `false` | Whether the switch is on                                          |
| `defaultSelected` | `boolean`                                                           | `false` | Whether the switch is on by default (uncontrolled)                |
| `isDisabled`      | `boolean`                                                           | `false` | Whether the switch is disabled                                    |
| `name`            | `string`                                                            | -       | The name of the input element, used when submitting an HTML form  |
| `value`           | `string`                                                            | -       | The value of the input element, used when submitting an HTML form |
| `onChange`        | `(isSelected: boolean) => void`                                     | -       | Handler called when the switch value changes                      |
| `onPress`         | `(e: PressEvent) => void`                                           | -       | Handler called when the switch is pressed                         |
| `children`        | `React.ReactNode \| (values: SwitchRenderProps) => React.ReactNode` | -       | Switch content or render prop                                     |

### SwitchRenderProps

When using the render prop pattern, these values are provided:

| Prop             | Type      | Description                             |
| ---------------- | --------- | --------------------------------------- |
| `isSelected`     | `boolean` | Whether the switch is currently on      |
| `isHovered`      | `boolean` | Whether the switch is hovered           |
| `isPressed`      | `boolean` | Whether the switch is currently pressed |
| `isFocused`      | `boolean` | Whether the switch is focused           |
| `isFocusVisible` | `boolean` | Whether the switch is keyboard focused  |
| `isDisabled`     | `boolean` | Whether the switch is disabled          |
| `isReadOnly`     | `boolean` | Whether the switch is read only         |
| `state`          | `-`       | State of the switch.                    |

### SwitchGroup Props

| Prop          | Type                         | Default      | Description                         |
| ------------- | ---------------------------- | ------------ | ----------------------------------- |
| `orientation` | `'horizontal' \| 'vertical'` | `'vertical'` | The orientation of the switch group |
| `children`    | `React.ReactNode`            | -            | The switch items to render          |
| `className`   | `string`                     | -            | Additional CSS class names          |


# HeroUI v3 > components > Tabs
URL: /docs/components/tabs
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/tabs.mdx

Tabs organize content into multiple sections and allow users to navigate between them.
        
***

title: Tabs
description: Tabs organize content into multiple sections and allow users to navigate between them.
icon: updated
links:
rac: Tabs
source: tabs/tabs.tsx
styles: tabs.css
storybook: tabs
figma: true
-----------

## Import

```tsx
import { Tabs } from '@heroui/react';
```

### Usage

<ComponentPreview isBgSolid name="tabs-basic" />

### Anatomy

Import the Tabs component and access all parts using dot notation.

```tsx
import { Tabs } from '@heroui/react';

export default () => (
  <Tabs.Root>
    <Tabs.ListWrapper>
      <Tabs.List aria-label="Options">
        <Tabs.Tab>
          <Tabs.Indicator />
        </Tabs.Tab>
      </Tabs.List>
    </Tabs.ListWrapper>
    <Tabs.Panel/>
  </Tabs.Root>
)
```

### Vertical

<ComponentPreview isBgSolid name="tabs-vertical" />

### Disabled Tab

<ComponentPreview isBgSolid name="tabs-disabled" />

### Custom Styles

<ComponentPreview isBgSolid name="tabs-custom-styles" />

<RelatedShowcases component="Tabs" />

## Styling

### Passing Tailwind CSS classes

<CollapsibleCode
  lang="tsx"
  code={`
import { Tabs } from '@heroui/react';

function CustomTabs() {
return (
  <Tabs.Root className="w-full max-w-lg text-center">
    <Tabs.ListWrapper>
      <Tabs.List
        aria-label="Options"
        className="*:data-[selected=true]:text-accent-foreground w-fit *:h-6 *:w-fit *:px-3 *:text-sm *:font-normal"
      >
        <Tabs.Tab id="daily">Daily<Tabs.Indicator /></Tabs.Tab>
        <Tabs.Tab id="weekly">Weekly<Tabs.Indicator /></Tabs.Tab>
        <Tabs.Tab id="bi-weekly">Bi-Weekly<Tabs.Indicator /></Tabs.Tab>
        <Tabs.Tab id="monthly">Monthly<Tabs.Indicator /></Tabs.Tab>
      </Tabs.List>
    </Tabs.ListWrapper>
    <Tabs.Panel className="px-4" id="daily">
      <h3 className="mb-2 font-semibold">Daily</h3>
      <p className="text-sm text-gray-600">Manage your daily tasks and goals.</p>
    </Tabs.Panel>
    <Tabs.Panel className="px-4" id="weekly">
      <h3 className="mb-2 font-semibold">Weekly</h3>
      <p className="text-sm text-gray-600">Manage your weekly tasks and goals.</p>
    </Tabs.Panel>
    <Tabs.Panel className="px-4" id="bi-weekly">
      <h3 className="mb-2 font-semibold">Bi-Weekly</h3>
      <p className="text-sm text-gray-600">Manage your bi-weekly tasks and goals.</p>
    </Tabs.Panel>
    <Tabs.Panel className="px-4" id="monthly">
      <h3 className="mb-2 font-semibold">Monthly</h3>
      <p className="text-sm text-gray-600">Manage your monthly tasks and goals.</p>
    </Tabs.Panel>
  </Tabs.Root>
);
}
`}
/>

### CSS Classes

The Tabs component uses these CSS classes:

#### Base Classes

* `.tabs` - Base tabs container
* `.tabs__list-wrapper` - Tab list wrapper
* `.tabs__list` - Tab list container
* `.tabs__tab` - Individual tab button
* `.tabs__panel` - Tab panel content
* `.tabs__indicator` - Tab indicator

#### Orientation Attributes

* `.tabs[data-orientation="horizontal"]` - Horizontal tab layout (default)
* `.tabs[data-orientation="vertical"]` - Vertical tab layout

### Interactive States

The component supports both CSS pseudo-classes and data attributes:

* **Selected**: `[aria-selected="true"]`
* **Hover**: `:hover` or `[data-hovered="true"]`
* **Focus**: `:focus-visible` or `[data-focus-visible="true"]`
* **Disabled**: `[aria-disabled="true"]`

## API Reference

### Tabs.Root Props

| Prop                 | Type                         | Default        | Description                 |
| -------------------- | ---------------------------- | -------------- | --------------------------- |
| `orientation`        | `"horizontal" \| "vertical"` | `"horizontal"` | Tab layout orientation      |
| `selectedKey`        | `string`                     | -              | Controlled selected tab key |
| `defaultSelectedKey` | `string`                     | -              | Default selected tab key    |
| `onSelectionChange`  | `(key: Key) => void`         | -              | Selection change handler    |
| `className`          | `string`                     | -              | Additional CSS classes      |

### Tabs.List Props

| Prop         | Type     | Default | Description                      |
| ------------ | -------- | ------- | -------------------------------- |
| `aria-label` | `string` | -       | Accessibility label for tab list |
| `className`  | `string` | -       | Additional CSS classes           |

### Tabs.Tab Props

| Prop         | Type      | Default | Description             |
| ------------ | --------- | ------- | ----------------------- |
| `id`         | `string`  | -       | Unique tab identifier   |
| `isDisabled` | `boolean` | `false` | Whether tab is disabled |
| `className`  | `string`  | -       | Additional CSS classes  |

### Tabs.Panel Props

| Prop        | Type     | Default | Description                      |
| ----------- | -------- | ------- | -------------------------------- |
| `id`        | `string` | -       | Panel identifier matching tab id |
| `className` | `string` | -       | Additional CSS classes           |


# HeroUI v3 > components > TextField
URL: /docs/components/text-field
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/text-field.mdx

Composition-friendly text fields with labels, descriptions, and inline validation
        
***

title: TextField
description: Composition-friendly text fields with labels, descriptions, and inline validation
links:
rac: TextField
source: text-field/text-field.tsx
styles: text-field.css
storybook: text-field
figma: true
-----------

## Import

```tsx
import { TextField } from '@heroui/react';
```

### Usage

<ComponentPreview name="text-field-basic" />

### Anatomy

```tsx
import {TextField, Label, Input, Description, FieldError} from '@heroui/react';

export default function Example() {
  return (
    <TextField isRequired>
      <Label>Display name</Label>
      <Input placeholder="Jane" />
      <Description>Visible to other team members.</Description>
      <FieldError />
    </TextField>
  );
}
```

> **TextField** combines label, input, description, and error into a single accessible component.\
> For standalone inputs, use **[Input](/docs/components/input)** or **[TextArea](/docs/components/textarea)**.

### With Description

<ComponentPreview name="text-field-with-description" />

### Required Field

<ComponentPreview name="text-field-required" />

### Validation

Use `isInvalid` together with `FieldError` to surface validation messages.

<ComponentPreview name="text-field-validation" />

### Controlled

Control the value to synchronize counters, previews, or formatting.

<ComponentPreview name="text-field-controlled" />

### Error Message

<ComponentPreview name="text-field-with-error" />

### Disabled State

<ComponentPreview name="text-field-disabled" />

### TextArea

Use [TextArea](/docs/components/textarea) instead of [Input](/docs/components/input) for multiline content.

<ComponentPreview name="text-field-textarea" />

### Input Types

<ComponentPreview name="text-field-input-types" />

<RelatedComponents component="textfield" />

<RelatedShowcases component="TextField" />

## Styling

### Passing Tailwind CSS classes

```tsx
import {TextField, Label, Input, Description} from '@heroui/react';

function CustomTextField() {
  return (
    <TextField className="gap-2 rounded-xl border border-border/60 bg-surface-2 p-4 shadow-sm">
      <Label className="text-sm font-semibold text-default-700">
        Project name
      </Label>
      <Input className="rounded-lg border border-border/60 bg-surface-2 px-3 py-2" />
      <Description className="text-xs text-default-500">
        Keep it short and memorable.
      </Description>
    </TextField>
  );
}
```

### Customizing the component classes

TextField has minimal default styling. Override the `.text-field` class to customize the container styling.

```css
@layer components {
  .text-field {
    @apply flex flex-col gap-1;
  }

  /* When invalid, the description is hidden automatically */
  .text-field[data-invalid="true"] [data-slot="description"],
  .text-field[aria-invalid="true"] [data-slot="description"] {
    @apply hidden;
  }

  /* Description has default padding */
  .text-field [data-slot="description"] {
    @apply px-1;
  }
}
```

### CSS Classes

* `.text-field` – Root container with minimal styling (`flex flex-col gap-1`)

> **Note:** Child components ([Label](/docs/components/label), [Input](/docs/components/input), [TextArea](/docs/components/textarea), [Description](/docs/components/description), [FieldError](/docs/components/field-error)) have their own CSS classes and styling. See their respective documentation for customization options.

### Interactive States

TextField automatically manages these data attributes based on its state:

* **Invalid**: `[data-invalid="true"]` or `[aria-invalid="true"]` - Automatically hides the description slot when invalid
* **Disabled**: `[data-disabled="true"]` - Applied when `isDisabled` is true
* **Focus Within**: `[data-focus-within="true"]` - Applied when any child input is focused
* **Focus Visible**: `[data-focus-visible="true"]` - Applied when focus is visible (keyboard navigation)

Additional attributes are available through render props (see TextFieldRenderProps below).

## API Reference

### TextField Props

TextField inherits all props from React Aria's [TextField](https://react-spectrum.adobe.com/react-aria/TextField.html) component.

#### Base Props

| Prop        | Type                                                                           | Default | Description                                               |
| ----------- | ------------------------------------------------------------------------------ | ------- | --------------------------------------------------------- |
| `children`  | `React.ReactNode \| (values: TextFieldRenderProps) => React.ReactNode`         | -       | Child components (Label, Input, etc.) or render function. |
| `className` | `string \| (values: TextFieldRenderProps) => string`                           | -       | CSS classes for styling, supports render props.           |
| `style`     | `React.CSSProperties \| (values: TextFieldRenderProps) => React.CSSProperties` | -       | Inline styles, supports render props.                     |
| `id`        | `string`                                                                       | -       | The element's unique identifier.                          |

#### Validation Props

| Prop                 | Type                                                              | Default    | Description                                                    |
| -------------------- | ----------------------------------------------------------------- | ---------- | -------------------------------------------------------------- |
| `isRequired`         | `boolean`                                                         | `false`    | Whether user input is required before form submission.         |
| `isInvalid`          | `boolean`                                                         | -          | Whether the value is invalid.                                  |
| `validate`           | `(value: string) => ValidationError \| true \| null \| undefined` | -          | Custom validation function.                                    |
| `validationBehavior` | `'native' \| 'aria'`                                              | `'native'` | Whether to use native HTML form validation or ARIA attributes. |
| `validationErrors`   | `string[]`                                                        | -          | Server-side validation errors.                                 |

#### Value Props

| Prop           | Type                      | Default | Description                            |
| -------------- | ------------------------- | ------- | -------------------------------------- |
| `value`        | `string`                  | -       | Current value (controlled).            |
| `defaultValue` | `string`                  | -       | Default value (uncontrolled).          |
| `onChange`     | `(value: string) => void` | -       | Handler called when the value changes. |

#### State Props

| Prop         | Type      | Default | Description                                        |
| ------------ | --------- | ------- | -------------------------------------------------- |
| `isDisabled` | `boolean` | -       | Whether the input is disabled.                     |
| `isReadOnly` | `boolean` | -       | Whether the input can be selected but not changed. |

#### Form Props

| Prop        | Type      | Default | Description                                          |
| ----------- | --------- | ------- | ---------------------------------------------------- |
| `name`      | `string`  | -       | Name of the input element, for HTML form submission. |
| `autoFocus` | `boolean` | -       | Whether the element should receive focus on render.  |

#### Accessibility Props

| Prop               | Type     | Default | Description                                           |
| ------------------ | -------- | ------- | ----------------------------------------------------- |
| `aria-label`       | `string` | -       | Accessibility label when no visible label is present. |
| `aria-labelledby`  | `string` | -       | ID of elements that label this field.                 |
| `aria-describedby` | `string` | -       | ID of elements that describe this field.              |
| `aria-details`     | `string` | -       | ID of elements with additional details.               |

### Composition Components

TextField works with these separate components that should be imported and used directly:

* **Label** - Field label component from `@heroui/react`
* **Input** - Single-line text input from `@heroui/react`
* **TextArea** - Multi-line text input from `@heroui/react`
* **Description** - Helper text component from `@heroui/react`
* **FieldError** - Validation error message from `@heroui/react`

Each of these components has its own props API. Use them directly within TextField for composition:

```tsx
<TextField isRequired isInvalid={hasError}>
  <Label>Email Address</Label>
  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
  <Description>We'll never share your email.</Description>
  <FieldError>Please enter a valid email address.</FieldError>
</TextField>
```

### TextFieldRenderProps

When using render props with `className`, `style`, or `children`, these values are available:

| Prop             | Type      | Description                                                                |
| ---------------- | --------- | -------------------------------------------------------------------------- |
| `isDisabled`     | `boolean` | Whether the field is disabled.                                             |
| `isInvalid`      | `boolean` | Whether the field is currently invalid.                                    |
| `isReadOnly`     | `boolean` | Whether the field is read-only.                                            |
| `isRequired`     | `boolean` | Whether the field is required.                                             |
| `isFocused`      | `boolean` | Whether the field is currently focused (DEPRECATED - use `isFocusWithin`). |
| `isFocusWithin`  | `boolean` | Whether any child element is focused.                                      |
| `isFocusVisible` | `boolean` | Whether focus is visible (keyboard navigation).                            |


# HeroUI v3 > components > TextArea
URL: /docs/components/textarea
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/textarea.mdx

Primitive multiline text input component that accepts standard HTML attributes
        
***

title: TextArea
description: Primitive multiline text input component that accepts standard HTML attributes
links:
rac: TextArea
source: textarea/textarea.tsx
styles: textarea.css
storybook: textarea
-------------------

## Import

```tsx
import { TextArea } from '@heroui/react';
```

<Callout>
  For validation, labels, and error messages, see **[TextField](/docs/components/text-field)**.
</Callout>

### Usage

<ComponentPreview name="textarea-basic" />

### Controlled

<ComponentPreview name="textarea-controlled" />

### Rows and Resizing

<ComponentPreview name="textarea-rows" />

<RelatedComponents component="textarea" />

<RelatedShowcases component="TextArea" />

## Styling

### Passing Tailwind CSS classes

```tsx
import {Label, TextArea} from '@heroui/react';

function CustomTextArea() {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="custom-textarea">Message</Label>
      <TextArea
        id="custom-textarea"
        className="rounded-xl border border-border/70 bg-surface-2 px-4 py-3 text-sm leading-6 shadow-sm"
        placeholder="Let us know how we can help..."
        rows={5}
        style={{resize: "vertical"}}
      />
    </div>
  );
}
```

### Customizing the component classes

Override the shared `.textarea` class once with Tailwind's `@layer components`.

```css
@layer components {
  .textarea {
    @apply rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm leading-6 shadow-sm;

    &:hover,
    &[data-hovered="true"] {
      @apply bg-surface-3 border-border/80;
    }

    &:focus-visible,
    &[data-focus-visible="true"] {
      @apply border-primary ring-2 ring-primary/20;
    }

    &[data-invalid="true"] {
      @apply border-danger bg-danger-50/10 text-danger;
    }
  }
}
```

### CSS Classes

* `.textarea` – Underlying `<textarea>` element styling

### Interactive States

* **Hover**: `:hover` or `[data-hovered="true"]`
* **Focus Visible**: `:focus-visible` or `[data-focus-visible="true"]`
* **Invalid**: `[data-invalid="true"]`
* **Disabled**: `:disabled` or `[aria-disabled="true"]`

## API Reference

### TextArea Props

TextArea accepts all standard HTML `<textarea>` attributes plus the following:

| Prop           | Type                                                      | Default | Description                                   |
| -------------- | --------------------------------------------------------- | ------- | --------------------------------------------- |
| `className`    | `string`                                                  | -       | Tailwind classes merged with the base styles. |
| `rows`         | `number`                                                  | `3`     | Number of visible text lines.                 |
| `cols`         | `number`                                                  | -       | Visible width of the text control.            |
| `value`        | `string`                                                  | -       | Controlled value for the textarea.            |
| `defaultValue` | `string`                                                  | -       | Initial uncontrolled value.                   |
| `onChange`     | `(event: React.ChangeEvent<HTMLTextAreaElement>) => void` | -       | Change handler.                               |
| `placeholder`  | `string`                                                  | -       | Placeholder text.                             |
| `disabled`     | `boolean`                                                 | `false` | Disables the textarea.                        |
| `readOnly`     | `boolean`                                                 | `false` | Makes the textarea read-only.                 |
| `required`     | `boolean`                                                 | `false` | Marks the textarea as required.               |
| `name`         | `string`                                                  | -       | Name for form submission.                     |
| `autoComplete` | `string`                                                  | -       | Autocomplete hint for the browser.            |
| `maxLength`    | `number`                                                  | -       | Maximum number of characters.                 |
| `minLength`    | `number`                                                  | -       | Minimum number of characters.                 |
| `wrap`         | `'soft' \| 'hard'`                                        | -       | How text wraps when submitted.                |

> For validation props like `isInvalid`, `isRequired`, and error handling, use **[TextField](/docs/components/text-field)** with TextArea as a child component.


# HeroUI v3 > components > Tooltip
URL: /docs/components/tooltip
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/components/tooltip.mdx

Displays informative text when users hover over or focus on an element
        
***

title: Tooltip
description: Displays informative text when users hover over or focus on an element
icon: updated
links:
rac: Tooltip
source: tooltip/tooltip.tsx
styles: tooltip.css
storybook: tooltip
figma: true
-----------

## Import

```tsx
import { Tooltip } from '@heroui/react';
```

### Usage

<ComponentPreview name="tooltip-basic" />

### Anatomy

Import the Tooltip component and access all parts using dot notation.

```tsx
import { Tooltip } from '@heroui/react';

export default () => (
  <Tooltip.Root>
    <Tooltip.Trigger>
      <button>Hover for tooltip</button>
    </Tooltip.Trigger>
    <Tooltip.Content>
      <Tooltip.Arrow />
      Helpful information about this element
    </Tooltip.Content>
  </Tooltip.Root>
)
```

### With Arrow

<ComponentPreview name="tooltip-with-arrow" />

### Placement

<ComponentPreview name="tooltip-placement" />

### Custom Triggers

<ComponentPreview name="tooltip-custom-trigger" />

## Styling

### Passing Tailwind CSS classes

```tsx
import { Tooltip, Button } from '@heroui/react';

function CustomTooltip() {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger>
        <Button>Hover me</Button>
      </Tooltip.Trigger>
      <Tooltip.Content className="bg-accent text-accent-foreground">
        <p>Custom styled tooltip</p>
      </Tooltip.Content>
    </Tooltip.Root>
  );
}
```

### Customizing the component classes

To customize the Tooltip component classes, you can use the `@layer components` directive.
<br />[Learn more](https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes).

```css
@layer components {
  .tooltip {
    @apply rounded-xl shadow-lg;
  }

  .tooltip__trigger {
    @apply cursor-help;
  }
}
```

HeroUI follows the [BEM](https://getbem.com/) methodology to ensure component variants and states are reusable and easy to customize.

### CSS Classes

The Tooltip component uses these CSS classes ([View source styles](https://github.com/heroui-inc/heroui/blob/v3/packages/styles/components/tooltip.css)):

#### Base Classes

* `.tooltip` - Base tooltip styles with animations
* `.tooltip__trigger` - Trigger element styles

### Interactive States

The component supports animation states:

* **Entering**: `[data-entering]` - Applied during tooltip appearance
* **Exiting**: `[data-exiting]` - Applied during tooltip disappearance
* **Placement**: `[data-placement="*"]` - Applied based on tooltip position

## API Reference

### Tooltip.Root Props

| Prop         | Type                 | Default   | Description                                  |
| ------------ | -------------------- | --------- | -------------------------------------------- |
| `children`   | `React.ReactNode`    | -         | Trigger element and content                  |
| `delay`      | `number`             | `700`     | Delay in milliseconds before showing tooltip |
| `closeDelay` | `number`             | `0`       | Delay in milliseconds before hiding tooltip  |
| `trigger`    | `"hover" \| "focus"` | `"hover"` | How the tooltip is triggered                 |
| `isDisabled` | `boolean`            | `false`   | Whether the tooltip is disabled              |

### Tooltip.Content Props

| Prop        | Type                                                    | Default            | Description                         |
| ----------- | ------------------------------------------------------- | ------------------ | ----------------------------------- |
| `children`  | `React.ReactNode`                                       | -                  | Content to display in the tooltip   |
| `showArrow` | `boolean`                                               | `false`            | Whether to show the arrow indicator |
| `offset`    | `number`                                                | `3` (7 with arrow) | Distance from the trigger element   |
| `placement` | `"top" \| "bottom" \| "left" \| "right"` (and variants) | `"top"`            | Placement of the tooltip            |
| `className` | `string`                                                | -                  | Additional CSS classes              |

### Tooltip.Trigger Props

| Prop        | Type              | Default | Description                       |
| ----------- | ----------------- | ------- | --------------------------------- |
| `children`  | `React.ReactNode` | -       | Element that triggers the tooltip |
| `className` | `string`          | -       | Additional CSS classes            |

### Tooltip.Arrow Props

| Prop        | Type              | Default | Description            |
| ----------- | ----------------- | ------- | ---------------------- |
| `children`  | `React.ReactNode` | -       | Custom arrow element   |
| `className` | `string`          | -       | Additional CSS classes |


# HeroUI v3 > handbook > Animation
URL: /docs/handbook/animation
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/handbook/animation.mdx

Add smooth animations and transitions to HeroUI v3 components
        
***

title: Animation
description: Add smooth animations and transitions to HeroUI v3 components
icon: copy-transparent
----------------------

## Overview

HeroUI components are built on React Aria and support multiple animation approaches:

* **Built-in animations** - Components come with default CSS transitions
* **CSS animations** - Customize with Tailwind utilities or custom CSS
* **JavaScript libraries** - Integrate with Framer Motion, React Spring, etc.

## Built-in Animations

HeroUI components use data attributes to expose their state for animation:

```css
/* Popover entrance/exit */
.popover[data-entering] {
  @apply animate-in zoom-in-90 fade-in-0 duration-200;
}

.popover[data-exiting] {
  @apply animate-out zoom-out-95 fade-out duration-150;
}

/* Button press effect */
.button:active,
.button[data-pressed="true"] {
  transform: scale(0.97);
}

/* Accordion expansion */
.accordion__panel[aria-hidden="false"] {
  @apply h-[var(--panel-height)] opacity-100;
}
```

### State Attributes

Components expose these states for styling:

* `[data-hovered="true"]` - Hover state
* `[data-pressed="true"]` - Active/pressed state
* `[data-focus-visible="true"]` - Keyboard focus
* `[data-disabled="true"]` - Disabled state
* `[data-entering]` / `[data-exiting]` - Transition states
* `[aria-expanded="true"]` - Expanded state

## CSS Animations

### Using Tailwind Utilities

```tsx
// Pulse on hover
<Button className="hover:animate-pulse">
  Hover me
</Button>

// Fade in entrance
<Alert className="animate-fade-in">
  Welcome message
</Alert>

// Staggered list
<div className="space-y-2">
  <Card className="animate-fade-in animate-delay-100">Item 1</Card>
  <Card className="animate-fade-in animate-delay-200">Item 2</Card>
</div>
```

### Custom Transitions

Override default component animations:

```css
/* Slower accordion */
.accordion__panel {
  @apply transition-all duration-500;
}

/* Bouncy button */
.button:active {
  animation: bounce 0.3s;
}

@keyframes bounce {
  50% { transform: scale(0.95); }
}
```

## Framer Motion

HeroUI components work seamlessly with Framer Motion for advanced animations.

### Basic Usage

```tsx
import { motion } from 'framer-motion';
import { Button } from '@heroui/react';

const MotionButton = motion(Button);

<MotionButton
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Animated Button
</MotionButton>
```

### Entrance Animations

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  <Alert>
    <Alert.Title>Welcome!</Alert.Title>
  </Alert>
</motion.div>
```

### Layout Animations

```tsx
import { AnimatePresence, motion } from 'framer-motion';

function Tabs({ items, selected }) {
  return (
    <div className="flex gap-2">
      {items.map((item, i) => (
        <Button key={i} onPress={() => setSelected(i)}>
          {item}
          {selected === i && (
            <motion.div
              layoutId="active"
              className="absolute inset-0 bg-accent"
              transition={{ type: "spring", bounce: 0.2 }}
            />
          )}
        </Button>
      ))}
    </div>
  );
}
```

## Render Props

Use render props to apply dynamic animations based on component state:

```tsx
<Button>
  {({ isPressed, isHovered }) => (
    <motion.span
      animate={{
        scale: isPressed ? 0.95 : isHovered ? 1.05 : 1
      }}
    >
      Interactive Button
    </motion.span>
  )}
</Button>
```

## Accessibility

### Respecting Motion Preferences

Always respect user motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  .button {
    transition: none;
  }

  .animate-* {
    animation: none !important;
  }
}
```

With Framer Motion:

```tsx
import { useReducedMotion } from 'framer-motion';

function AnimatedCard() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
    >
      <Card>Content</Card>
    </motion.div>
  );
}
```

## Performance Tips

### Use GPU-Accelerated Properties

Prefer `transform` and `opacity` for smooth animations:

```css
/* Good - GPU accelerated */
.slide-in {
  transform: translateX(-100%);
  transition: transform 0.3s;
}

/* Avoid - Triggers layout */
.slide-in {
  left: -100%;
  transition: left 0.3s;
}
```

### Will-Change Optimization

```css
.button {
  will-change: transform;
}

.button:not(:hover) {
  will-change: auto;
}
```

## Next Steps

* Learn about [Styling](/docs/handbook/styling) approaches
* Explore [Component](/docs/components) examples
* View [Theming](/docs/handbook/theming) documentation


# HeroUI v3 > handbook > Colors
URL: /docs/handbook/colors
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/handbook/colors.mdx

Color palette and theming system for HeroUI v3
        
***

title: Colors
description: Color palette and theming system for HeroUI v3
icon: bucket-paint
links:
themes: true
tailwind: theme
---------------

import {ColorSwatch, ColorPalette} from "@/components/color-swatch";

HeroUI uses CSS variables for colors that automatically switch between light and dark themes. All colors use the `oklch` color space for better color transitions.

## How It Works

HeroUI's color system is built on top of Tailwind CSS v4's theme. When you import `@heroui/styles`, it uses Tailwind's built-in color palettes (like `--color-neutral-*`) and maps them to semantic variables.

Add a theme class to your HTML and apply colors to the body:

```html
<html class="light" data-theme="light">
  <body class="bg-background text-foreground">
    <!-- Your app -->
  </body>
</html>
```

We follow a simple naming pattern:

* Colors without a suffix are backgrounds (e.g., `--accent`)
* Colors with `-foreground` are for text on that background (e.g., `--accent-foreground`)

```tsx
// This gives you the right background and text colors
<div className="bg-accent text-accent-foreground">Hello</div>
```

## Available Colors

### Base Colors

These four colors stay the same in all themes:

<div className="flex flex-wrap gap-4 sm:gap-6">
  <ColorSwatch name="White" variable="--white" />

  <ColorSwatch name="Black" variable="--black" />

  <ColorSwatch name="Snow" variable="--snow" />

  <ColorSwatch name="Eclipse" variable="--eclipse" />
</div>

### Background & Surface

<ColorPalette
  colors={[
  { name: "Background", variable: "--background", foreground: "--foreground" },
  { name: "Foreground", variable: "--foreground" },
  { name: "Panel", variable: "--panel", foreground: "--panel-foreground" },
  { name: "Panel Foreground", variable: "--panel-foreground" },
  { name: "Surface 1", variable: "--surface-1", foreground: "--foreground" },
  { name: "Surface 2", variable: "--surface-2", foreground: "--foreground" },
  { name: "Surface 3", variable: "--surface-3", foreground: "--foreground" },
]}
/>

### Primary Colors

* **Accent**: Your main brand color (used for primary actions)
* **Accent Soft**: A lighter version for secondary actions

<ColorPalette
  colors={[
  { name: "Accent", variable: "--accent", foreground: "--accent-foreground" },
  { name: "Accent Foreground", variable: "--accent-foreground" },
  { name: "Accent Soft", variable: "--accent-soft", foreground: "--accent-soft-foreground" },
  { name: "Accent Soft Foreground", variable: "--accent-soft-foreground" },
]}
/>

### Status Colors

For alerts, validation, and status messages:

<ColorPalette
  colors={[
  { name: "Success", variable: "--success", foreground: "--success-foreground" },
  { name: "Success Foreground", variable: "--success-foreground" },
  { name: "Warning", variable: "--warning", foreground: "--warning-foreground" },
  { name: "Warning Foreground", variable: "--warning-foreground" },
  { name: "Danger", variable: "--danger", foreground: "--danger-foreground" },
  { name: "Danger Foreground", variable: "--danger-foreground" },
]}
/>

### Form Field Colors

For consistent form field styling across input components:

<ColorPalette
  colors={[
  { name: "Field Background", variable: "--field-background", foreground: "--field-foreground" },
  { name: "Field Foreground", variable: "--field-foreground" },
  { name: "Field Placeholder", variable: "--field-placeholder" },
  { name: "Field Border", variable: "--field-border" },
]}
/>

> **Note**: These variables default to existing colors but can be overridden for specialized form styling without affecting other components.

### Other Colors

<ColorPalette
  colors={[
  { name: "Default", variable: "--default", foreground: "--default-foreground" },
  { name: "Default Foreground", variable: "--default-foreground" },
  { name: "Muted", variable: "--muted", foreground: "--foreground" },
  { name: "Border", variable: "--border" },
  { name: "Focus", variable: "--focus" },
  { name: "Link", variable: "--link" },
  { name: "Scrollbar", variable: "--scrollbar" },
]}
/>

## How to Use Colors

### In Your Components

```jsx
// Use Tailwind classes
<div className="bg-background text-foreground">
  <button className="bg-accent text-accent-foreground hover:bg-accent-hover">
    Click me
  </button>
</div>
```

### In CSS Files

```css title="global.css"
/* Direct CSS variables */
.my-component {
  background: var(--accent);
  color: var(--accent-foreground);
  border: 1px solid var(--border);
}

/* With @apply and @layer */
@layer components {
  .button {
    @apply bg-accent text-accent-foreground;

    &:hover,
    &[data-hovered="true"] {
      @apply bg-accent-hover;
    }

    &:active,
    &[data-pressed="true"] {
      @apply bg-accent-hover;
      transform: scale(0.97);
    }
  }
}
```

## Default Theme

The complete theme definition can be found in ([default.css](https://github.com/heroui-inc/heroui/blob/v3/packages/styles/themes/default/index.css)). This theme automatically switches between light and dark modes based on the `class="dark"` or `data-theme="dark"` attributes.

<CollapsibleCode
  lang="css"
  code={`  @layer base {
  /* HeroUI Default Theme */
  :root {
    color-scheme: light;

    /* Primitive Colors (Do not change between light and dark) */
    --white: oklch(100% 0 0);
    --black: oklch(0% 0 0);
    --snow: oklch(0.9911 0 0);
    --eclipse: oklch(0.2221 0 0);

    /* Spacing scale */
    --spacing: 0.25rem;

    /* Border */
    --border-width: 1px;
    --field-border-width: var(--border-width);
    --disabled-opacity: 0.5;

    /* Radius */
    --radius: 0.5rem;
    --field-radius: calc(var(--radius) * 1.5);

    /* Panel specific radius */
    --radius-panel: 0.5rem;
    --radius-panel-inner: calc(var(--radius-panel) * 0.5);

    /* Small radius for compact components */
    --radius-sm: 0.375rem;

    /* Ring offset - Used for focus ring */
    --ring-offset-width: 2px;

    /* Typography */
    --font-size-base: 1rem;
    --font-size-scale-desktop: 0.875;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;

    /* Cursor */
    --cursor-interactive: pointer;
    --cursor-disabled: not-allowed;

    /* Base Colors */
    --background: var(--white);
    --foreground: var(--eclipse);
    --panel: var(--white);
    --panel-foreground: var(--foreground);

    --radius: 1rem;

    --muted: var(--color-neutral-500);

    --scrollbar: var(--color-neutral-300);

    --default: var(--color-neutral-50);
    --default-foreground: var(--eclipse);

    --surface-1: var(--background);
    --surface-2: var(--color-neutral-100);
    --surface-3: var(--color-neutral-200);

    --accent: var(--color-neutral-950);
    --accent-foreground: var(--snow);

    --accent-soft: var(--color-neutral-200);
    --accent-soft-foreground: var(--color-neutral-900);

    /* Form Field Defaults */
    --field-background: var(--default);
    --field-foreground: var(--foreground);
    --field-placeholder: var(--muted);
    --field-border: var(--border);

    /* Status Colors */
    --success: oklch(0.5503 0.1244 153.56);
    --success-foreground: var(--snow);

    --warning: oklch(0.7186 0.1521 64.85);
    --warning-foreground: var(--eclipse);

    --danger: oklch(0.6259 0.1908 29.19);
    --danger-foreground: var(--snow);

    /* Component Colors */
    --segment: var(--white);
    --segment-foreground: var(--foreground);

    /* Misc Colors */
    --border: oklch(0 0 0 / 15%);
    --divider: var(--color-neutral-200);
    --focus: oklch(0% 0 0 / 20%);
    --link: var(--foreground);

    /* Shadows */
    --panel-shadow: 0 0 1px 0 rgba(0, 0, 0, 0.3) inset, 0 2px 8px 0 rgba(0, 0, 0, 0.08);
    /* Shadow used for form fields */
    --field-shadow: 0 0 0 0 rgba(255, 255, 255, 0.1) inset, 0 1px 2px 0 rgba(0, 0, 0, 0.05);

    /* Skeleton Default Global Animation */
    --skeleton-animation: shimmer; /* shimmer, pulse, none */
  }

  .dark,
  [data-theme="dark"] {
    color-scheme: dark;

    /* Base Colors */
    --background: var(--black);
    --foreground: var(--snow);
    --panel: var(--eclipse);

    --muted: var(--color-neutral-400);

    --scrollbar: var(--color-neutral-800);

    --default: var(--color-neutral-900);
    --default-foreground: var(--snow);

    --surface-1: var(--background);
    --surface-2: var(--color-neutral-900);
    --surface-3: var(--color-neutral-800);

    --accent: var(--color-neutral-50);
    --accent-foreground: var(--eclipse);

    --accent-soft: var(--color-neutral-800);
    --accent-soft-foreground: var(--color-neutral-200);

    /* Status Colors */
    --success: oklch(0.5503 0.1244 153.56);
    --success-foreground: var(--snow);

    --warning: oklch(85% 0.1414 77.88);
    --warning-foreground: var(--eclipse);

    --danger: oklch(0.5798 0.1635 30.83);
    --danger-foreground: var(--snow);

    /* Component Colors */
    --segment: oklch(1 0 0 / 16%);
    --segment-foreground: var(--foreground);

    /* Misc Colors */
    --border: oklch(1 0 0 / 12%);
    --divider: var(--color-neutral-800);
    --focus: oklch(100% 0 0 / 50%);
    --link: var(--foreground);

    /* Shadows */
    --panel-shadow: 0 0 1px 0 rgba(255, 255, 255, 0.3) inset, 0 2px 8px 0 rgba(0, 0, 0, 0.08);
    --field-shadow: 0 0 0 0 rgba(255, 255, 255, 0.1) inset, 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }
}
`}
/>

> **Note**: Colors like `--color-neutral-*`, `--color-white`, and `--color-black` come from [Tailwind CSS v4's built-in theme](https://tailwindcss.com/docs/colors).

## Customizing Colors

### Add Your Own Colors

```css
:root, 
[data-theme="light"] {
  --info: oklch(0.6 0.15 210);
  --info-foreground: oklch(0.98 0 0);
}

.dark,
[data-theme="dark"] {
  --info: oklch(0.7 0.12 210);
  --info-foreground: oklch(0.15 0 0);
}

/* Make the color available to Tailwind */
@theme inline {
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
}
```

Now you can use it:

```tsx
<div className="bg-info text-info-foreground">Info message</div>
```

> **Note**: To learn more about theme variables and how they work in Tailwind CSS v4, see the [Tailwind CSS Theme documentation](https://tailwindcss.com/docs/theme).

### Override Existing Colors

```css
:root {
  /* Override default colors */
  --accent: oklch(0.7 0.15 250);
  --success: oklch(0.65 0.15 155);
}

[data-theme="dark"] {
  /* Override dark theme colors */
  --accent: oklch(0.8 0.12 250);
  --success: oklch(0.75 0.12 155);
}
```

**Tip**: Convert colors at [oklch.com](https://oklch.com)

## Quick Tips

* Always use color variables, not hard-coded values
* Use foreground/background pairs for good contrast
* Test in both light and dark modes
* The system respects user's theme preference automatically

## Related

* [Theming](/docs/handbook/theming) - Learn about the theming system
* [Styling](/docs/handbook/styling) - Styling components with CSS
* [Design Principles](/docs/design-principles) - Understanding HeroUI's design philosophy


# HeroUI v3 > handbook > Composition
URL: /docs/handbook/composition
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/handbook/composition.mdx

Build flexible UI with component composition patterns
        
***

title: Composition
description: Build flexible UI with component composition patterns
icon: layers
------------

## Overview

HeroUI uses composition patterns to create flexible, customizable components. This allows you to:

* Change the rendered element or component
* Compose components together
* Maintain full control over markup

## The asChild Prop

The `asChild` prop lets you change what element a component renders. When `asChild` is true, HeroUI won't render its default element - instead, it clones the child element and merges props.

### Basic Usage

```tsx
import { Button } from '@heroui/react';
import Link from 'next/link';

// Renders as a Next.js Link
<Button asChild>
  <Link href="/about">About</Link>
</Button>

// Renders as a regular anchor
<Button asChild>
  <a href="https://example.com">External Link</a>
</Button>
```

### Available Components

These components support `asChild`:

* `Button` - Change button element
* `Alert` and its parts - `Alert`, `AlertIcon`, `AlertContent`, `AlertTitle`, `AlertDescription`, `AlertAction`, `AlertClose`
* `Avatar` and its parts - `Avatar`, `AvatarImage`, `AvatarFallback`
* More components coming soon

## Compound Components

HeroUI components are built as compound components - they export multiple parts that work together. You can use them in two ways:

### Option 1: Named Exports (Recommended)

Import each part separately:

```tsx
import {
  Alert,
  AlertIcon,
  AlertContent,
  AlertTitle,
  AlertDescription,
  AlertClose
} from '@heroui/react';

<Alert>
  <AlertIcon />
  <AlertContent>
    <AlertTitle>Success</AlertTitle>
    <AlertDescription>Your changes have been saved.</AlertDescription>
  </AlertContent>
  <AlertClose />
</Alert>
```

### Option 2: Dot Notation (Compound Pattern)

Import the main component and access parts via dot notation:

```tsx
import { Alert } from '@heroui/react';

<Alert.Root>
  <Alert.Icon />
  <Alert.Content>
    <Alert.Title>Success</Alert.Title>
    <Alert.Description>Your changes have been saved.</Alert.Description>
  </Alert.Content>
  <Alert.Close />
</Alert.Root>
```

**Note:** When using dot notation, the main component requires `.Root` suffix (e.g., `<Alert.Root>` instead of `<Alert>`).

### Benefits of Compound Components

Both patterns provide:

* **Flexibility** - Arrange parts as needed
* **Customization** - Style each part independently
* **Control** - Add or remove parts

## Style Variants

HeroUI exports variant functions that can be applied to any component. This allows you to use HeroUI's design system with any element or component:

### Using buttonVariants

Apply button styles to any component:

```tsx
import { Link, LinkIcon, buttonVariants } from '@heroui/react';

// Link styled as a tertiary button
<Link
  className={buttonVariants({
    size: "md",
    variant: "tertiary",
    className: "px-3"
  })}
  href="https://heroui.com"
  target="_blank"
>
  HeroUI
  <LinkIcon className="h-2 w-2" />
</Link>

// Native anchor styled as primary button
<a
  className={buttonVariants({ variant: "primary" })}
  href="/dashboard"
>
  Go to Dashboard
</a>
```

### Available Variant Functions

Each component exports its variant function:

* `buttonVariants` - Button styles
* `chipVariants` - Chip styles
* `linkVariants` - Link styles
* `spinnerVariants` - Spinner styles
* More variant functions for each component

## Custom Components

Create your own components by composing HeroUI primitives:

```tsx
import { Button, Tooltip } from '@heroui/react';

// Link button component
function LinkButton({ href, children, ...props }) {
  return (
    <Button asChild {...props}>
      <a href={href}>{children}</a>
    </Button>
  );
}

// Icon button with tooltip
function IconButton({ icon, label, ...props }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger>
        <Button isIconOnly {...props}>
          <Icon icon={icon} />
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip.Root>
  );
}
```

## Custom Variants

You can create your own custom variants by extending the component's variant function.

```tsx
import type {ButtonProps} from "@heroui/react";
import type {VariantProps} from "tailwind-variants";

import {Button, buttonVariants} from "@heroui/react";
import {tv} from "tailwind-variants";

const myButtonVariants = tv({
  extend: buttonVariants,
  base: "text-md text-shadow-lg font-semibold shadow-md data-[pending=true]:opacity-40",
  variants: {
    radius: {
      lg: "rounded-lg",
      md: "rounded-md",
      sm: "rounded-sm",
      full: "rounded-full",
    },
    size: {
      sm: "h-10 px-4",
      md: "h-11 px-6",
      lg: "h-12 px-8",
      xl: "h-13 px-10",
    },
    variant: {
      primary: "text-white dark:bg-white/10 dark:text-white dark:hover:bg-white/15",
    },
  },
  defaultVariants: {
    radius: "full",
    variant: "primary",
  },
});

type MyButtonVariants = VariantProps<typeof myButtonVariants>;
export type MyButtonProps = Omit<ButtonProps, "className"> &
  MyButtonVariants & {className?: string};

function CustomButton({className, radius, variant, ...props}: MyButtonProps) {
  return <Button className={myButtonVariants({className, radius, variant})} {...props} />;
}

export function CustomVariants() {
  return <CustomButton>Custom Button</CustomButton>;
}
```

## With Next.js

Use `asChild` to integrate with Next.js:

```tsx
import Link from 'next/link';
import { Button } from '@heroui/react';

<Button asChild variant="primary">
  <Link href="/dashboard">Dashboard</Link>
</Button>
```

## With React Router

Use `asChild` to integrate with routing libraries:

```tsx
import { Link } from 'react-router-dom';
import { Button } from '@heroui/react';

<Button asChild variant="primary">
  <Link to="/dashboard">Dashboard</Link>
</Button>
```

## Next Steps

* Learn about [Styling](/docs/handbook/styling) components
* Explore [Animation](/docs/handbook/animation) options
* Browse [Components](/docs/components) for more examples


# HeroUI v3 > handbook > Styling
URL: /docs/handbook/styling
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/handbook/styling.mdx

Style HeroUI components with CSS, Tailwind, or CSS-in-JS
        
***

title: Styling
description: Style HeroUI components with CSS, Tailwind, or CSS-in-JS
icon: brush
links:
themes: true
tailwind: theme
---------------

## Overview

HeroUI components are built on React Aria and provide flexible styling options:

* **Tailwind CSS** - Use utility classes directly
* **CSS** - Target BEM classes or data attributes
* **CSS-in-JS** - Integrate with styled-components, Emotion, etc.
* **Render props** - Dynamic styling based on component state

## Basic Styling

### Using className

All HeroUI components accept `className` props:

```tsx
<Button className="bg-purple-500 hover:bg-purple-600">
  Custom Button
</Button>

<Accordion className="border-2 border-gray-200 rounded-xl">
  {/* content */}
</Accordion>
```

### Using style

Components also accept inline styles:

```tsx
<Button style={{ backgroundColor: '#8B5CF6' }}>
  Styled Button
</Button>
```

## State-Based Styling

HeroUI components expose their state through data attributes, similar to CSS pseudo-classes:

```css
/* Target different states */
.button[data-hovered="true"], .button:hover {
  background: var(--accent-hover);
}

.button[data-pressed="true"], .button:active {
  transform: scale(0.97);
}

.button[data-focus-visible="true"], .button:focus-visible {
  outline: 2px solid var(--focus);
}
```

## Render Props

Use render props for dynamic styling based on component state:

```tsx
// Dynamic classes
<Button
  className={({ isPressed }) =>
    isPressed ? 'bg-blue-600' : 'bg-blue-500'
  }
>
  Press me
</Button>

// Dynamic content
<Button>
  {({ isHovered, isPressed }) => (
    <>
      <Icon
        icon="gravity-ui:heart"
        className={isPressed ? 'text-red-500' : 'text-neutral-400'}
      />
      <span className={isHovered ? 'underline' : ''}>
        Like
      </span>
    </>
  )}
</Button>
```

## BEM Classes

HeroUI uses [BEM methodology](https://getbem.com/) for consistent class naming:

```css
/* Block */
.button { }
.accordion { }

/* Element */
.accordion__trigger { }
.accordion__panel { }

/* Modifier */
.button--primary { }
.button--lg { }
.accordion--outline { }
```

### Customizing Components Globally

```css
/* global.css */

@layer components {
  /* Override button styles */
  .button {
    @apply font-semibold uppercase;
  }

  .button--primary {
    @apply bg-indigo-600 hover:bg-indigo-700;
  }

  /* Add custom variant */
  .button--gradient {
    @apply bg-gradient-to-r from-purple-500 to-pink-500;
  }
}
```

## Creating Wrapper Components

For reusable custom components, create wrappers using [tailwind-variants](https://tailwind-variants.org/) - a Tailwind CSS first-class variant API created by us as well:

```tsx
import { Button as HeroButton, buttonVariants, type ButtonProps } from '@heroui/react';
import { tv, type VariantProps } from 'tailwind-variants';

const customButtonVariants = tv({
  extend: buttonVariants,
  base: 'font-medium transition-all',
  variants: {
    intent: {
      primary: 'bg-blue-500 hover:bg-blue-600 text-white',
      secondary: 'bg-gray-200 hover:bg-gray-300',
      danger: 'bg-red-500 hover:bg-red-600 text-white',
    },
    size: {
      small: 'text-sm px-2 py-1',
      medium: 'text-base px-4 py-2',
      large: 'text-lg px-6 py-3',
    },
  },
  defaultVariants: {
    intent: 'primary',
    size: 'medium',
  },
});

type CustomButtonVariants = VariantProps<typeof customButtonVariants>;
interface CustomButtonProps
  extends Omit<ButtonProps, 'className'>,
  CustomButtonVariants {
  className?: string;
}

export function CustomButton({ intent, size, className, ...props }: CustomButtonProps) {
  return (
    <HeroButton
      className={customButtonVariants({ intent, size, className })}
      {...props}
    />
  );
}
```

## CSS-in-JS Integration

### Styled Components

```tsx
import styled from 'styled-components';
import { Button } from '@heroui/react';

const StyledButton = styled(Button)`
  background: linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%);
  border-radius: 8px;
  color: white;
  padding: 12px 24px;

  &:hover {
    box-shadow: 0 3px 10px rgba(255, 105, 135, 0.3);
  }
`;
```

### Emotion

```tsx
import { css } from '@emotion/css';
import { Button } from '@heroui/react';

const buttonStyles = css`
  background: linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%);
  border-radius: 8px;
  color: white;
  padding: 12px 24px;

  &:hover {
    box-shadow: 0 3px 10px rgba(255, 105, 135, 0.3);
  }
`;

<Button className={buttonStyles}>
  Emotion Button
</Button>
```

## Responsive Design

Use Tailwind's responsive utilities:

```tsx
<Button className="text-sm md:text-base lg:text-lg px-3 md:px-4 lg:px-6">
  Responsive Button
</Button>
```

Or with CSS:

```css
.button {
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
}

@media (min-width: 768px) {
  .button {
    font-size: 1rem;
    padding: 0.75rem 1.5rem;
  }
}
```

## CSS Modules

For scoped styles, use CSS Modules:

```css
/* Button.module.css */
.button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
}

.button:hover {
  transform: translateY(-2px);
}

.button--primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
}
```

```tsx
import styles from './Button.module.css';
import { Button } from '@heroui/react';

<Button className={styles.button}>
  Scoped Button
</Button>
```

## Component Classes Reference

### Button

* `.button` - Base
* `.button--{variant}` - Variants
* `.button--{size}` - Sizes
* `.button--icon-only` - Icon button

> **Note**: See [Button](/docs/components/button#css-classes) for more information on button classes.

### Accordion

* `.accordion` - Container
* `.accordion__item` - Item
* `.accordion__trigger` - Header
* `.accordion__panel` - Content
* `.accordion--outline` - Variant

> **Note**: See [Accordion](/docs/components/accordion#css-classes) for more information on accordion classes.

View all component classes in [@heroui/styles/components](https://github.com/heroui-inc/heroui/tree/main/packages/styles/components).

## Next Steps

* Learn about [Animation](/docs/handbook/animation) techniques
* Explore [Theming](/docs/handbook/theming) system
* Browse [Component](/docs/components) examples


# HeroUI v3 > handbook > Theming
URL: /docs/handbook/theming
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/handbook/theming.mdx

Customize HeroUI's design system with CSS variables and global styles
        
***

title: Theming
description: Customize HeroUI's design system with CSS variables and global styles
icon: palette
links:
themes: true
tailwind: theme
---------------

## Overview

HeroUI uses CSS variables and [BEM](https://getbem.com/) classes for theming. You can customize everything from colors to component styles using standard CSS.

## How It Works

HeroUI's theming system is built on top of [Tailwind CSS v4](https://tailwindcss.com/docs/theme)'s theme. When you import `@heroui/styles`, it:

1. Uses Tailwind's built-in color palettes (like `--color-neutral-*`)
2. Maps them to semantic variables for easier use
3. Automatically switches between light and dark themes
4. Uses CSS layers and the `@theme` directive for organization

The system follows a simple naming pattern:

* Colors without a suffix are backgrounds (e.g., `--accent`)
* Colors with `-foreground` are for text on that background (e.g., `--accent-foreground`)

## Quick Start

### Apply a Theme

Add a theme class to your HTML and apply colors to the body:

```html
<html class="light" data-theme="light">
  <body class="bg-background text-foreground">
    <!-- Your app -->
  </body>
</html>
```

### Switch Themes

```html
<!-- Light theme -->
<html class="light" data-theme="light">

<!-- Dark theme -->
<html class="dark" data-theme="dark">
```

### Override Colors

```css
/* app/globals.css */
@import "tailwindcss";
@import "@heroui/styles";

:root {
  /* Override any color variable */
  --accent: oklch(0.7 0.25 260);
  --success: oklch(0.65 0.15 155);
}
```

> **Note**: See [Colors](/docs/handbook/colors) for the complete color palette and visual reference.

### Create your own theme

<CollapsibleCode
  lang="css"
  code={`/* src/themes/ocean.css */
@layer base {
  /* Ocean Light */
  [data-theme="ocean"] {
    color-scheme: light;

    /* Base */
    --background: oklch(0.985 0.015 225);
    --foreground: var(--eclipse);
    --panel: var(--white);
    --panel-foreground: var(--foreground);

    --radius: 0.75rem;

    --muted: var(--color-neutral-500);
    --scrollbar: var(--color-neutral-300);

    --default: var(--color-white);
    --default-foreground: var(--color-neutral-600);

    --surface-1: var(--background);
    --surface-2: oklch(0.965 0.020 225);
    --surface-3: oklch(0.930 0.030 225);

    /* Ocean accent */
    --accent: oklch(0.450 0.150 230);
    --accent-foreground: var(--snow);

    --accent-soft: oklch(0.920 0.040 230);
    --accent-soft-foreground: oklch(0.280 0.080 230);

    /* Status (kept compatible) */
    --success: oklch(0.5503 0.1244 153.56);
    --success-foreground: var(--snow);

    --warning: oklch(0.7186 0.1521 64.85);
    --warning-foreground: var(--eclipse);

    --danger: oklch(0.6259 0.1908 29.19);
    --danger-foreground: var(--snow);

    /* Component Colors */
    --segment: var(--white);
    --segment-foreground: var(--foreground);

    /* Misc */
    --border: oklch(0.50 0.060 230 / 22%);
    --divider: var(--color-neutral-200);
    --focus: oklch(0.60 0.150 230 / 35%);
    --link: var(--accent);

    --shadow-with-border:
      0 0px 5px 0px rgba(0, 10, 40, 0.03),
      0 2px 10px 0px rgba(0, 10, 40, 0.07),
      0 0px 1px 0px rgba(0, 0, 0, 0.25);

    /* Skeleton Default Global Animation */
    --skeleton-animation: shimmer; /* Possible values: shimmer, pulse, none */
  }

  /* Ocean Dark */
  [data-theme="ocean-dark"] {
    color-scheme: dark;

    /* Base */
    --background: oklch(0.140 0.020 230);
    --foreground: var(--snow);
    --panel: oklch(0.180 0.020 230);

    --muted: var(--color-neutral-400);
    --scrollbar: var(--color-neutral-800);

    --default: var(--color-neutral-900);
    --default-foreground: var(--color-neutral-200);

    --surface-1: var(--background);
    --surface-2: oklch(0.220 0.030 230);
    --surface-3: oklch(0.280 0.030 230);

    /* Ocean accent */
    --accent: oklch(0.860 0.080 230);
    --accent-foreground: var(--eclipse);

    --accent-soft: oklch(0.300 0.050 230);
    --accent-soft-foreground: var(--color-neutral-200);

    /* Status */
    --success: oklch(80% 0.1561 154);
    --success-foreground: var(--eclipse);

    --warning: oklch(85% 0.1414 77.88);
    --warning-foreground: var(--eclipse);

    --danger: oklch(0.5798 0.1635 30.83);
    --danger-foreground: var(--snow);

    /* Component Colors */
    --segment: oklch(1 0 0 / 16%);
    --segment-foreground: var(--foreground);

    /* Misc */
    --border: oklch(1 0 0 / 12%);
    --divider: var(--color-neutral-800);
    --focus: oklch(0.860 0.080 230 / 40%);
    --link: var(--accent);

    --shadow-with-border:
      0 0 0 1px var(--border),
      0 5px 10px -3px rgba(0, 10, 40, 0.35),
      0 3px 4px -2px rgba(0, 0, 0, 0.12); 
  }
}
`}
/>

Use your theme:

```css
/* app/globals.css */
@layer theme, base, components, utilities;

@import "tailwindcss";
@import "@heroui/styles";

@import "./src/themes/ocean.css" layer(theme); /* [!code highlight]*/
```

Apply your theme:

```html
<!-- index.html -->

<!-- Light ocean -->
<html data-theme="ocean">

<!-- Dark ocean -->
<html data-theme="ocean-dark">
```

## Customize Components

### Global Component Styles

Override any component using BEM classes:

```css
@layer components {
  /* Customize buttons */
  .button {
    @apply font-semibold tracking-wide;
  }

  .button--primary {
    @apply bg-blue-600 hover:bg-blue-700;
  }

  /* Customize accordions */
  .accordion__trigger {
    @apply text-lg font-bold;
  }
}
```

> **Note**: See [Styling](/docs/handbook/styling) for the complete styling reference.

### Find Component Classes

Each component docs page lists all available classes:

* **Base classes**: `.button`, `.accordion`
* **Modifiers**: `.button--primary`, `.button--icon-only`
* **Elements**: `.accordion__trigger`, `.accordion__panel`
* **States**: `[data-hovered="true"]`, `[aria-expanded="true"]`

Example: [Button classes](/docs/components/button#css-classes)

## Import Strategies

### Full Import (Recommended)

Get everything with two lines:

```css
@import "tailwindcss";
@import "@heroui/styles";
```

### Selective Import

Import only what you need:

```css
/* Define layers */
@layer theme, base, components, utilities;

/* Base requirements */
@import "tailwindcss";
@import "@heroui/styles/base/base.css" layer(base);
@import "@heroui/styles/themes/theme.css" layer(theme);
@import "@heroui/styles/themes/default.css" layer(theme);

/* Components (all components) */
@import "@heroui/styles/components/index.css" layer(components);
/* OR specific components */
@import "@heroui/styles/components/button.css" layer(components);
@import "@heroui/styles/components/accordion.css" layer(components);
```

### Headless Mode

Build your own styles from scratch:

```css
@import "tailwindcss";
@import "@heroui/styles/base/base.css";

/* Your custom styles */
.button {
  /* Your button styles */
}
```

## Adding Custom Colors

You can add your own semantic colors to the theme:

```css
/* Define in both light and dark themes */
:root, 
[data-theme="light"] {
  --info: oklch(0.6 0.15 210);
  --info-foreground: oklch(0.98 0 0);
}

.dark,
[data-theme="dark"] {
  --info: oklch(0.7 0.12 210);
  --info-foreground: oklch(0.15 0 0);
}

/* Make the color available to Tailwind */
@theme inline {
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
}
```

Now use it in your components:

```tsx
<div className="bg-info text-info-foreground">Info message</div>
```

## Variables Reference

HeroUI defines three types of variables:

1. **Base Variables**: Non-changing values like `--white`, `--black`, spacing, and typography
2. **Theme Variables**: Colors that change between light/dark themes
3. **Calculated Variables**: Automatically generated hover states and size variants

For a complete reference of all variables and their values, see:

* [Colors Documentation](/docs/handbook/colors) - Visual color palette and base variables
* [Default Theme Source](https://github.com/heroui-inc/heroui/blob/v3/packages/styles/themes/default/index.css) - Complete theme implementation

### Calculated Variables (Tailwind)

We use Tailwind's `@theme` directive to automatically create calculated variables for hover states and radius variants:

<CollapsibleCode
  lang="css"
  code={`  @theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-panel: var(--panel);
  --color-panel-foreground: var(--panel-foreground);

  --color-muted: var(--muted);

  --color-surface: var(--surface-1);
  --color-surface-foreground: var(--foreground);

  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);

  --color-accent-soft: var(--accent-soft);
  --color-accent-soft-foreground: var(--accent-soft-foreground);

  --color-segment: var(--segment);
  --color-segment-foreground: var(--segment-foreground);

  --color-border: var(--border);
  --color-divider: var(--divider);
  --color-focus: var(--focus);
  --color-link: var(--link);

  --color-default: var(--default);
  --color-default-foreground: var(--default-foreground);
  --color-field: var(--field-background, var(--color-default));
  --color-field-foreground: var(--field-foreground, var(--color-foreground));
  --color-field-placeholder: var(--field-placeholder, var(--color-muted));
  --color-field-border: var(--field-border, var(--color-border));

  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);

  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);

  --color-danger: var(--danger);
  --color-danger-foreground: var(--danger-foreground);

  --shadow-panel: var(--panel-shadow);
  --shadow-field: var(--field-shadow);
  --radius-field: var(--field-radius, var(--radius-xl));
  --border-width-field: var(--field-border-width, var(--border-width));

  /* Calculated Variables */

  /* Colors */
  --color-panel-hover: color-mix(
    in oklab,
    var(--color-panel) 90%,
    var(--color-panel-foreground) 5%
  );
  --color-default-hover: color-mix(
    in oklab,
    var(--color-default) 90%,
    var(--color-default-foreground) 2%
  );
  --color-field-hover: color-mix(
    in oklab,
    var(--color-field) 88%,
    var(--color-field-foreground) 8%
  );
  --color-field-focus: color-mix(
    in oklab,
    var(--color-field) 80%,
    var(--color-field-foreground) 14%
  );
  --color-accent-hover: color-mix(
    in oklab,
    var(--color-accent) 90%,
    var(--color-accent-foreground) 20%
  );
  --color-accent-soft-hover: color-mix(
    in oklab,
    var(--color-accent-soft) 10%,
    var(--color-accent-soft-foreground) 18%
  );
  --color-success-hover: color-mix(
    in oklab,
    var(--color-success) 90%,
    var(--color-success-foreground) 10%
  );
  --color-warning-hover: color-mix(
    in oklab,
    var(--color-warning) 90%,
    var(--color-warning-foreground) 10%
  );
  --color-danger-hover: color-mix(
    in oklab,
    var(--color-danger) 90%,
    var(--color-danger-foreground) 10%
  );
  --color-field-border-hover: color-mix(
    in oklab,
    var(--color-field-border) 88%,
    var(--color-field-foreground) 8%
  );
  --color-field-border-focus: color-mix(
    in oklab,
    var(--color-field-border) 74%,
    var(--color-field-foreground) 22%
  );

  /* Surface Colors */
  --color-surface-1: var(--surface-1);
  --color-surface-1-foreground: color-mix(
    in oklab,
    var(--color-surface-1) 80%,
    var(--color-foreground) 3.5%
  );
  --color-surface-2: var(--surface-2);
  --color-surface-2-foreground: color-mix(
    in oklab,
    var(--color-surface-2) 80%,
    var(--color-foreground) 3.5%
  );
  --color-surface-3: var(--surface-3);
  --color-surface-3-foreground: color-mix(
    in oklab,
    var(--color-surface-3) 80%,
    var(--color-foreground) 3.5%
  );

  /* Radius */
  --radius-xs: calc(var(--radius) * 0.25);
  --radius-sm: calc(var(--radius) * 0.5);
  --radius-md: calc(var(--radius) * 0.75);
  --radius-lg: calc(var(--radius) * 1);
  --radius-xl: calc(var(--radius) * 1.5);
  --radius-2xl: calc(var(--radius) * 2);
  --radius-3xl: calc(var(--radius) * 3);
  --radius-4xl: calc(var(--radius) * 4);
  --radius-panel: var(--radius-xl);
  --radius-panel-inner: var(--radius-2xl);

  /* Transition Timing Functions  */
  --ease-smooth: ease; /* same as transition: ease; */
  /* These custom curves are made by https://twitter.com/bdc */

  /* From smoother to faster */
  --ease-in-quad: cubic-bezier(0.55, 0.085, 0.68, 0.53);
  --ease-in-cubic: cubic-bezier(0.55, 0.055, 0.675, 0.19);
  --ease-in-quart: cubic-bezier(0.895, 0.03, 0.685, 0.22);
  --ease-in-quint: cubic-bezier(0.755, 0.05, 0.855, 0.06);
  --ease-in-expo: cubic-bezier(0.95, 0.05, 0.795, 0.035);
  --ease-in-circ: cubic-bezier(0.6, 0.04, 0.98, 0.335);
  /* From slower to faster */
  --ease-out-quad: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-out-cubic: cubic-bezier(0.215, 0.61, 0.355, 1);
  --ease-out-quart: cubic-bezier(0.165, 0.84, 0.44, 1);
  --ease-out-quint: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
  --ease-out-circ: cubic-bezier(0.075, 0.82, 0.165, 1);
  /* Custom smooth-out curve: fast start, smooth stop - Apple style */
  --ease-fluid-out: cubic-bezier(0.32, 0.72, 0, 1);
  /* From slower to faster */
  --ease-in-out-quad: cubic-bezier(0.455, 0.03, 0.515, 0.955);
  --ease-in-out-cubic: cubic-bezier(0.645, 0.045, 0.355, 1);
  --ease-in-out-quart: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-in-out-quint: cubic-bezier(0.86, 0, 0.07, 1);
  --ease-in-out-expo: cubic-bezier(1, 0, 0, 1);
  --ease-in-out-circ: cubic-bezier(0.785, 0.135, 0.15, 0.86);

  /* Animations */
  --animate-spin-fast: spin 0.75s linear infinite;
  --animate-skeleton: skeleton 2s linear infinite;

  @keyframes skeleton {
    100% {
      transform: translateX(200%);
    }
  }
}
`}
/>

Form controls now rely on the `--field-*` variables and their calculated hover/focus variants. Update them in your theme to restyle inputs, checkboxes, radios, and OTP slots without impacting surfaces like buttons or cards.

## Resources

* [Colors Documentation](/docs/handbook/colors)
* [Styling Guide](/docs/handbook/styling)
* [Tailwind CSS v4 Theming](https://tailwindcss.com/docs/theme)
* [BEM Methodology](https://getbem.com/)
* [OKLCH Color Tool](https://oklch.com)


# HeroUI v3 > ui-for-agents > LLMs.txt
URL: /docs/ui-for-agents/llms-txt
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/ui-for-agents/llms-txt.mdx

Enable AI assistants like Claude, Cursor, and Windsurf to understand HeroUI v3
        
***

title: LLMs.txt
description: Enable AI assistants like Claude, Cursor, and Windsurf to understand HeroUI v3
-------------------------------------------------------------------------------------------

We provide [LLMs.txt](https://llmstxt.org/) files to make HeroUI v3 documentation accessible to AI coding assistants.

## Available Files

### Core Documentation

* [/llms.txt](https://v3.heroui.com/llms.txt) - Quick reference index
* [/llms-full.txt](https://v3.heroui.com/llms-full.txt) - Complete HeroUI v3 documentation

### Coming Soon

For limited context windows:

* `/llms-components.txt` - Component documentation only
* `/llms-patterns.txt` - Common patterns and recipes
* `/llms-migration.txt` - Migration guide from v2

## Integration

### Claude Code

Tell Claude to reference the documentation:

```
Use HeroUI v3 documentation from https://v3.heroui.com/llms.txt
```

Or add to your project's `.claude` file for automatic loading.

### Cursor

Use the `@Docs` feature to add HeroUI documentation:

```
@Docs https://v3.heroui.com/llms-full.txt
```

[Learn more](https://docs.cursor.com/context/@-symbols/@-docs)

### Windsurf

Add to your `.windsurfrules` file:

```
#docs https://v3.heroui.com/llms-full.txt
```

[Learn more](https://docs.codeium.com/windsurf/memories#memories-and-rules)

### Other AI Tools

Most AI assistants can reference documentation by URL. Simply provide:

```
https://v3.heroui.com/llms.txt
```

## Contributing

Found an issue with AI-generated code? Help us improve our LLMs.txt files on [GitHub](https://github.com/heroui-inc/heroui).


# HeroUI v3 > ui-for-agents > MCP Server
URL: /docs/ui-for-agents/mcp-server
Source: https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/content/docs/ui-for-agents/mcp-server.mdx

Access HeroUI v3 documentation directly in your AI assistant
        
***

title: MCP Server
description: Access HeroUI v3 documentation directly in your AI assistant
icon: preview
-------------

The HeroUI MCP Server gives AI assistants direct access to HeroUI v3 component documentation, making it easier to build with HeroUI in AI-powered development environments.

<DocsImage src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/hero-react-mcp-light-3.jpg" darkSrc="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/hero-react-mcp-dark-2.jpg" alt="HeroUI v3 MCP Server" />

The MCP server currently supports **@heroui/react v3** only and [stdio transport](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#stdio) and is published at `@heroui/react-mcp` on npm. View the source code on [GitHub](https://github.com/heroui-inc/heroui-mcp).

<Callout>
  As we add more components to HeroUI v3, they'll be available in the MCP server too.
</Callout>

## Quick Setup

### Cursor

<div className="flex items-center gap-3 mb-4">
  <a href="https://link.heroui.com/mcp-cursor-install" className="button button--tertiary button--sm no-underline bg-default/50 dark:bg-default/30">
    <svg viewBox="0 0 466.73 532.09" className="w-5 h-5 fill-current">
      <path d="M457.43,125.94L244.42,2.96c-6.84-3.95-15.28-3.95-22.12,0L9.3,125.94c-5.75,3.32-9.3,9.46-9.3,16.11v247.99c0,6.65,3.55,12.79,9.3,16.11l213.01,122.98c6.84,3.95,15.28,3.95,22.12,0l213.01-122.98c5.75-3.32,9.3-9.46,9.3-16.11v-247.99c0-6.65-3.55-12.79-9.3-16.11h-.01ZM444.05,151.99l-205.63,356.16c-1.39,2.4-5.06,1.42-5.06-1.36v-233.21c0-4.66-2.49-8.97-6.53-11.31L24.87,145.67c-2.4-1.39-1.42-5.06,1.36-5.06h411.26c5.84,0,9.49,6.33,6.57,11.39h-.01Z" />
    </svg>

    <span className="text-accent">Install in Cursor</span>
  </a>
</div>

Or manually add to **Cursor Settings** → **Tools** → **MCP Servers**:

```json title=".cursor/mcp.json"
{
  "mcpServers": {
    "heroui-react": {
      "command": "npx",
      "args": ["-y", "@heroui/react-mcp@latest"]
    }
  }
}
```

Alternatively, add the following to your `~/.cursor/mcp.json` file. To learn more, see the [Cursor documentation](https://cursor.com/docs/context/mcp).

### Claude Code

Run this command in your terminal:

```bash
claude mcp add heroui-react -- npx -y @heroui/react-mcp@latest
```

Or manually add to your project's `.mcp.json` file:

```json title=".mcp.json"
{
  "mcpServers": {
    "heroui-react": {
      "command": "npx",
      "args": ["-y", "@heroui/react-mcp@latest"]
    }
  }
}
```

After adding the configuration, restart Claude Code and run `/mcp` to see the HeroUI MCP server in the list. If you see **Connected**, you're ready to use it.

See the [Claude Code MCP documentation](https://docs.claude.com/en/docs/claude-code/mcp) for more details.

### Windsurf

Add the HeroUI server to your project's `.windsurf/mcp.json` configuration file:

```json title=".windsurf/mcp.json"
{
  "mcpServers": {
    "heroui-react": {
      "command": "npx",
      "args": ["-y", "@heroui/react-mcp@latest"]
    }
  }
}
```

After adding the configuration, restart Windsurf to activate the MCP server.

See the [Windsurf MCP documentation](https://docs.windsurf.com/windsurf/cascade/mcp) for more details.

### VS Code

To configure MCP in VS Code with GitHub Copilot, add the HeroUI server to your project's `.vscode/mcp.json` configuration file:

```json title=".vscode/mcp.json"
{
  "mcpServers": {
    "heroui-react": {
      "command": "npx",
      "args": ["-y", "@heroui/react-mcp@latest"]
    }
  }
}
```

After adding the configuration, open `.vscode/mcp.json` and click **Start** next to the heroui-react server.

See the [VS Code MCP documentation](https://code.visualstudio.com/docs/copilot/customization/mcp-servers) for more details.

## Usage

Once configured, ask your AI assistant questions like:

* "Help me install HeroUI v3 in my Next.js/Vite/Astro app"
* "Show me all HeroUI components"
* "What props does the Button component have?"
* "Give me an example of using the Card component"
* "Get the source code for the Button component"
* "Show me the CSS styles for Card"
* "What are the theme variables for dark mode?"

### Automatic Updates

The MCP server can help you upgrade to the latest HeroUI version:

```bash
"Hey Cursor, update HeroUI to the latest version"
```

Your AI assistant will automatically:

* Compare your current version with the latest release
* Review the changelog for breaking changes
* Apply the necessary code updates to your project

This works for any version upgrade, whether you're updating to the latest alpha, beta, or stable release.

## Available Tools

The MCP server provides these tools to AI assistants:

| Tool                          | Description                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `installation`                | Get complete installation instructions for your specific framework (Next.js, Vite, etc.) and package manager |
| `list_components`             | List all available HeroUI v3 components                                                                      |
| `get_component_info`          | Get detailed documentation, anatomy, props, and examples for specific components                             |
| `get_component_props`         | Get detailed props information for HeroUI components                                                         |
| `get_component_examples`      | Get usage examples for HeroUI components                                                                     |
| `get_component_source_code`   | Access the React/TypeScript source code (.tsx files) for components                                          |
| `get_component_source_styles` | View the CSS styles (.css files) for components                                                              |
| `get_theme_info`              | Access theme variables for colors, typography, spacing with light/dark mode support                          |
| `get_docs`                    | Browse the full HeroUI v3 documentation including guides and principles                                      |

## Troubleshooting

### Requirements

* Node.js 18 or higher
* The package will be automatically downloaded when using `npx`

### Need Help?

* [GitHub Issues](https://github.com/heroui-inc/heroui-mcp/issues)
* [Discord Community](https://discord.gg/heroui)

## Links

* [npm Package](https://www.npmjs.com/package/@heroui/react-mcp@latest)
* [GitHub Repository](https://github.com/heroui-inc/heroui-mcp)
* [Contributing Guide](https://github.com/heroui-inc/heroui-mcp/blob/main/CONTRIBUTING.md)

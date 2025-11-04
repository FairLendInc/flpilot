# Critical Issues Action Plan

**Date**: November 4, 2025  
**Priority**: URGENT - Production Blockers  

---

## 🚨 Critical Issues Summary

### 1. Test Coverage: 3% (CRITICAL - Production Blocker)
**Current State**: Only 3 unit tests, 2 E2E tests  
**Risk**: HIGH - Cannot deploy to production  
**Effort**: HIGH (2 weeks)  
**Priority**: 1  

### 2. React 19 Canary in Production (HIGH RISK)
**Current State**: Using unstable version  
**Risk**: HIGH - Potential production instability  
**Effort**: LOW (1 day)  
**Priority**: 2  

### 3. ProfileForm Component Size (MAINTENANCE RISK)
**Current State**: 200+ lines in single component  
**Risk**: MEDIUM - Difficult to maintain  
**Effort**: MEDIUM (3 days)  
**Priority**: 3  

---

## 📋 Implementation Guide

### Week 1-2: Testing Strategy

#### Day 1-2: Setup Test Infrastructure
```bash
# Install testing dependencies
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @vitest/coverage-v8 \
  jsdom

# Update package.json scripts
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

#### Day 3-5: Convex Function Tests
```bash
# Create test structure
mkdir -p convex/tests
mkdir -p tests/unit/components

# Test profile functions
cat > convex/tests/profile.test.ts << 'TEST'
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "../schema";

test("getCurrentUserProfile returns user data", async () => {
  const t = convexTest(schema);
  // Test implementation
});
TEST

# Test organizations functions
cat > convex/tests/organizations.test.ts << 'TEST'
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "../schema";

test("setActiveOrganization updates user", async () => {
  const t = convexTest(schema);
  // Test implementation
});
TEST
```

#### Day 6-8: Component Tests
```bash
# Test ProfileForm components
cat > tests/unit/components/ProfileForm.test.tsx << 'TEST'
import { render, screen, fireEvent } from "@testing-library/react";
import { ProfileForm } from "@/app/(auth)/profilev2/ProfileForm";
import { describe, it, expect, vi } from "vitest";

describe("ProfileForm", () => {
  it("renders profile form", () => {
    render(<ProfileForm userData={mockUserData} />);
    expect(screen.getByText("Profile Settings")).toBeInTheDocument();
  });
});
TEST

# Test Navigation
cat > tests/unit/components/Navigation.test.tsx << 'TEST'
import { render } from "@testing-library/react";
import { TwoLevelNav } from "@/components/navigation/two-level-nav";
import { describe, it, expect } from "vitest";

describe("TwoLevelNav", () => {
  it("renders navigation correctly", () => {
    render(<TwoLevelNav breadcrumbs={[]} />);
    // Test implementation
  });
});
TEST
```

#### Day 9-12: Integration Tests
```bash
# Test auth flow
cat > tests/integration/auth-flow.test.ts << 'TEST'
import { test, expect } from "vitest";
import { chromium } from "playwright";

test("authentication flow works", async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto("/sign-in");
  await page.click('[data-testid="sign-in-button"]');
  
  // Test implementation
  await browser.close();
});
TEST

# Test profile management
cat > tests/integration/profile-management.test.ts << 'TEST'
import { test, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "@/convex/schema";

test("profile update flow", async () => {
  const t = convexTest(schema);
  // Test implementation
});
TEST
```

#### Day 13-14: E2E Tests
```bash
# E2E auth flow
cat > e2e/auth-flow.spec.ts << 'TEST'
import { test, expect } from "@playwright/test";

test("complete auth flow", async ({ page }) => {
  await page.goto("/sign-in");
  await page.click("button:has-text('Sign In')");
  // Test implementation
});

test("profile management", async ({ page }) => {
  await page.goto("/profile");
  // Test implementation
});
TEST

# E2E deals page
cat > e2e/deals.spec.ts << 'TEST'
import { test, expect } from "@playwright/test";

test("document signing flow", async ({ page }) => {
  await page.goto("/dashboard/admin/deals");
  // Test implementation
});
TEST
```

---

### Week 3: React Version Fix

#### Day 1: Pin to Stable Version
```bash
# Update package.json
npm install react@^18.2.0 react-dom@^18.2.0

# Or use exact version
npm install react@18.2.0 react-dom@18.2.0

# Remove canary
npm uninstall react react-dom

# Run tests to verify
npm run test:run
npm run build
```

#### Day 2-3: Verify Compatibility
```bash
# Run full test suite
npm run test:coverage

# Build application
npm run build

# Test locally
npm run dev
```

---

### Week 3-4: Component Decomposition

#### ProfileForm Refactoring
```bash
# Current structure
app/(auth)/profilev2/
├── ProfileForm.tsx  # 200+ lines

# Target structure
app/(auth)/profilev2/
├── ProfileForm.tsx           # Main orchestrator (~50 lines)
├── components/
│   ├── ProfileHeader.tsx     # Hero banner
│   ├── ProfileFormFields.tsx # Form inputs
│   ├── OrganizationSwitcher.tsx
│   ├── RolesPermissions.tsx  # Roles display
│   └── SettingsTabs.tsx      # Settings tabs
├── hooks/
│   ├── useProfileForm.ts     # Form logic
│   ├── useAvatarUpload.ts    # Upload logic
│   └── useOrganizationSwitch.ts
└── types.ts                  # TypeScript types
```

#### Step-by-Step Decomposition

**1. Extract ProfileHeader**
```typescript
// components/ProfileHeader.tsx
export function ProfileHeader(props: ProfileHeaderProps) {
  const {
    activeRoleName,
    displayName,
    email,
    getInitials,
    hasWorkOSPicture,
    imageUrl,
    onPickAvatar,
    orgCount,
    uploading,
    userData,
  } = props;

  return (
    <div className="relative">
      {/* Hero banner implementation */}
    </div>
  );
}
```

**2. Extract ProfileFormFields**
```typescript
// components/ProfileFormFields.tsx
export function ProfileFormFields(props: ProfileFormFieldsProps) {
  const {
    email,
    firstName,
    isSaving,
    lastName,
    onFirstNameChange,
    onLastNameChange,
    onPhoneChange,
    onSubmit,
    phone,
  } = props;

  return (
    <form onSubmit={onSubmit}>
      {/* Form implementation */}
    </form>
  );
}
```

**3. Create Custom Hooks**
```typescript
// hooks/useProfileForm.ts
export function useProfileForm(initialData: ProfileFormData) {
  const [formState, setFormState] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  const setFirstName = (value: string) => {
    setFormState(prev => ({ ...prev, firstName: value }));
  };

  const setLastName = (value: string) => {
    setFormState(prev => ({ ...prev, lastName: value }));
  };

  const setPhone = (value: string) => {
    setFormState(prev => ({ ...prev, phone: value }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Submit logic
    } finally {
      setIsSaving(false);
    }
  };

  return {
    formState,
    isSaving,
    setFirstName,
    setLastName,
    setPhone,
    onSubmit,
  };
}
```

**4. Update Main Component**
```typescript
// ProfileForm.tsx
export default function ProfileForm({ userData }: ProfileFormProps) {
  const userProfileData = usePreloadedQuery(userData);
  
  // Custom hooks
  const { formState, isSaving, setFirstName, setLastName, setPhone, onSubmit } =
    useProfileForm({
      firstName: userProfileData.user?.first_name || "",
      lastName: userProfileData.user?.last_name || "",
      phone: userProfileData.user?.phone || "",
    });

  const { uploading, uploadAvatar } = useAvatarUpload();
  const { isSwitching, switchOrganization } = useOrganizationSwitch(
    userProfileData.activeOrganizationId
  );

  return (
    <div className="space-y-8">
      <ProfileHeader {...derivedData} />
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <OrganizationSwitcher {...organizationData} />
          <ProfileFormFields {...formData} />
        </div>
        
        <div>
          <RolesPermissions {...rolesData} />
        </div>
      </div>
      
      <SettingsTabs {...settingsData} />
    </div>
  );
}
```

---

## 🎯 Quick Wins (Can Do Today)

### 1. Fix Profile Picture Duplication
```typescript
// lib/profile.ts
export function getProfilePictureUrl(
  workOSIdentity: WorkOSIdentity,
  user: UserData
): string {
  return (
    workOSIdentity?.profile_picture_url ||
    user?.profile_picture_url ||
    user?.profile_picture ||
    ""
  );
}
```

### 2. Add Error Boundaries
```typescript
// components/ErrorBoundary.tsx
import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            Please refresh the page or contact support.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 3. Improve Types
```typescript
// Instead of
const identity = await ctx.auth.getUserIdentity();
const workosUserId = identity.subject; // any type

// Use proper type
interface WorkOSIdentity {
  subject: string;
  profile_picture_url?: string;
  permissions?: string[];
  org_id?: string;
  role?: string;
}

const identity = await ctx.auth.getUserIdentity() as WorkOSIdentity;
const workosUserId = identity.subject;
```

---

## 📊 Success Metrics

### Testing Coverage
- [ ] Unit tests: 80% coverage
- [ ] Integration tests: 70% coverage
- [ ] E2E tests: All critical paths covered
- [ ] Overall coverage: ≥75%

### Quality Metrics
- [ ] ProfileForm component: <100 lines
- [ ] React version: Stable (18.2.x)
- [ ] All tests passing
- [ ] Build successful
- [ ] Type checking: No errors

### Performance Metrics
- [ ] Build time: <60s
- [ ] Bundle size: <2MB initial
- [ ] LCP: <2.5s
- [ ] FID: <100ms
- [ ] CLS: <0.1

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Coverage ≥75%
- [ ] React version pinned
- [ ] Build successful
- [ ] Type checking clean
- [ ] Lint clean (`npm run lint`)
- [ ] Formatter clean (`npm run format`)
- [ ] No console.log in production code

### Deployment
- [ ] Environment variables configured
- [ ] WorkOS configured
- [ ] Convex deployed
- [ ] Documenso API key configured
- [ ] Monitoring setup
- [ ] Error tracking (Sentry)

### Post-Deployment
- [ ] Smoke tests passing
- [ ] Authentication flow working
- [ ] Profile management working
- [ ] Document signing working
- [ ] Error rates <1%
- [ ] Response times <500ms

---

## 📞 Support Resources

### Documentation
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Guide](https://vitest.dev/guide/)
- [Playwright Docs](https://playwright.dev/docs/intro)
- [Convex Testing](https://docs.convex.dev/testing)

### Dependencies to Install
```bash
# Testing
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @vitest/coverage-v8 \
  jsdom

# Utilities
npm install --save-dev \
  @next/bundle-analyzer \
  @sentry/nextjs
```

---

**Created**: November 4, 2025  
**Last Updated**: November 4, 2025  
**Owner**: Engineering Team  
**Review Date**: Weekly until completion

# Essential Development Commands

## Starting Development

```bash
# Start full development environment (frontend + backend)
pnpm run dev

# Start only frontend (Next.js)
pnpm run dev:frontend

# Start only backend (Convex)
pnpm run dev:backend

# Initial setup - starts Convex and opens dashboard
pnpm run predev
```

## Building and Deployment

```bash
# Build for production
pnpm run build

# Start production server
pnpm run start
```

## Testing

```bash
# Run unit tests in watch mode
pnpm run test

# Run unit tests once
pnpm run test:once

# Run tests with coverage
pnpm run test:coverage

# Run tests with HTML coverage report
pnpm run test:coverage:html

# Debug tests with inspector
pnpm run test:debug

# Run E2E tests
pnpm run e2e

# Run E2E tests with UI
pnpm run e2e:ui
```

## Code Quality

```bash
# Lint code with Biome
pnpm run lint

# Format code with Biome
pnpm run format

# Run all checks (lint + format)
pnpm run check

# Type checking
pnpm run check-types

# Generate TypeScript types for Convex
pnpm run tsgo
```

## Storybook (Component Development)

```bash
# Start Storybook development server
pnpm run storybook

# Build Storybook for production
pnpm run build-storybook
```

## Convex-Specific Commands

```bash
# Start Convex development server
npx convex dev

# Open Convex dashboard
npx convex dashboard

# Add Convex auth provider
npx convex auth add workos

# Deploy to Convex
npx convex deploy
```

## Git Commands

```bash
# Stage all changes
git add .

# Commit with conventional format
git commit -m "type: description"

# Push to remote
git push origin <branch-name>
```

## Utility Commands

```bash
# Install dependencies
pnpm install

# Clean install (remove node_modules and reinstall)
rm -rf node_modules pnpm-lock.yaml && pnpm install

# Clean build artifacts
rm -rf .next

# Check disk usage
du -sh node_modules

# List available scripts
cat package.json | grep -A 20 "scripts"
```

## System-Specific Notes (Darwin/macOS)

```bash
# Check Node version
node --version

# Check pnpm version
pnpm --version

# Clear pnpm store
pnpm store prune

# View package dependencies
pnpm list --depth=0
```

## Troubleshooting

```bash
# Reset Convex development environment
npx convex dev --reconfigure

# Clear TypeScript build cache
rm -rf tsconfig.tsbuildinfo

# Full clean rebuild
rm -rf node_modules .next tsconfig.tsbuildinfo
pnpm install
pnpm run build
```

## Performance Monitoring

```bash
# Analyze bundle size
pnpm run build
npx @next/bundle-analyzer

# Check for unused dependencies
pnpm run check
```
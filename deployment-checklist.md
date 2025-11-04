# Deployment Checklist

## Pre-Deployment ✅

- [x] Production build completed successfully
- [x] TypeScript compilation passed
- [x] All routes generated correctly
- [x] Static assets optimized
- [x] Middleware bundle created
- [x] Build manifests generated

## Environment Configuration

- [ ] Copy environment template:
  ```bash
  cp .env.local.example .env.local
  ```

- [ ] Configure required environment variables in `.env.local`:
  - [ ] `WORKOS_CLIENT_ID` - Your WorkOS client ID
  - [ ] `WORKOS_API_KEY` - Your WorkOS API key
  - [ ] `WORKOS_COOKIE_PASSWORD` - 32+ character password
  - [ ] `NEXT_PUBLIC_WORKOS_REDIRECT_URI` - Auth callback URL
  - [ ] `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL
  - [ ] `CONVEX_DEPLOYMENT` - Production deployment ID
  - [ ] `LOG_LEVEL` - Logging level (info, debug, etc.)
  - [ ] `LOG_PRETTY` - Pretty print logs (true/false)

## Backend Deployment

- [ ] Deploy Convex functions:
  ```bash
  npx convex deploy
  ```
  
- [ ] Verify Convex dashboard access

## Frontend Deployment

- [ ] Run production build verification:
  ```bash
  pnpm run build
  ```

- [ ] Start production server:
  ```bash
  pnpm run start
  ```

- [ ] Access application at `http://localhost:3000`

## Testing

- [ ] Run unit tests:
  ```bash
  pnpm run test:once
  ```

- [ ] Run E2E tests:
  ```bash
  pnpm run e2e
  ```

- [ ] Verify authentication flow:
  - [ ] Sign in page loads correctly
  - [ ] Sign up page loads correctly
  - [ ] WorkOS authentication works
  - [ ] Protected routes redirect properly

## Production Deployment

### Vercel (Recommended)

- [ ] Install Vercel CLI:
  ```bash
  npm i -g vercel
  ```

- [ ] Deploy to Vercel:
  ```bash
  vercel --prod
  ```

- [ ] Set environment variables in Vercel dashboard

### Other Platforms

- [ ] Build output ready in `.next/` directory
- [ ] Configure build command: `pnpm run build`
- [ ] Configure start command: `pnpm run start`
- [ ] Set all required environment variables

## Post-Deployment

- [ ] Verify all routes are accessible
- [ ] Test authentication flow end-to-end
- [ ] Check application logs for errors
- [ ] Verify Convex backend connectivity
- [ ] Test protected routes functionality

## Optional Optimizations

- [ ] Address Biome linting issues for better code quality:
  ```bash
  pnpm run check --write
  ```

- [ ] Review bundle sizes and optimize if needed
- [ ] Set up monitoring and error tracking
- [ ] Configure CDN for static assets

---

## Quick Reference

**Build ID:** vsjzjNOl3Iyu2bdk2sT4J  
**Build Size:** 683MB  
**Build Time:** 5.4s  
**Static Pages:** 11 pages generated in 754.7ms

**Main Commands:**
- Development: `pnpm run dev`
- Build: `pnpm run build`
- Production: `pnpm run start`
- Tests: `pnpm run test:once && pnpm run e2e`
- Lint: `pnpm run lint`


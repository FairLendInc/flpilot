# Welcome to your Convex + Next.js + WorkOS AuthKit app

This is a [Convex](https://convex.dev/) project migrated to use WorkOS AuthKit for authentication.

After the initial setup (<2 minutes) you'll have a working full-stack app using:

- Convex as your backend (database, server logic)
- [React](https://react.dev/) as your frontend (web page interactivity)
- [Next.js](https://nextjs.org/) for optimized web hosting and page routing
- [Tailwind](https://tailwindcss.com/) for building great looking accessible UI
- [WorkOS AuthKit](https://authkit.com/) for authentication

## Get started

1. Clone this repository and install dependencies:

   ```bash
   npm install
   ```

2. Set up your environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
3. Configure WorkOS AuthKit:
   - Create a [WorkOS account](https://workos.com/)
   - Get your Client ID and API Key from the WorkOS dashboard
   - In the WorkOS dashboard, add redirect URIs:
     - `http://localhost:3000/callback` (for local development)
     - `https://your-domain.com/callback` (for production - add after deployment)
   - Generate a secure password for cookie encryption (minimum 32 characters)
   - Update your `.env.local` file with these values:
     - `WORKOS_CLIENT_ID`
     - `WORKOS_API_KEY`
     - `WORKOS_COOKIE_PASSWORD` (32+ characters)
     - `NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/callback` (local development only)
   - Add a strong `LISTINGS_WEBHOOK_API_KEY` value for the `/listings/create` webhook (share this secret with upstream integrations)
   - Optionally set `LISTINGS_WEBHOOK_ALLOWED_ORIGIN` if the webhook should only accept requests from a specific origin

   **Note:** For production deployments:
   - On Vercel: `VERCEL_URL` is automatically set (no action needed)
   - For custom domains: Set `NEXT_PUBLIC_SITE_URL=https://your-domain.com`
   - The redirect URI is automatically constructed from these values

4. Configure Convex:

   ```bash
   npx convex dev
   ```

   This will:
   - Set up your Convex deployment
   - Add your Convex URL to `.env.local`
   - Open the Convex dashboard

   Then configure WorkOS authentication in Convex:

   ```bash
   npx convex auth add workos
   ```

   This creates `convex/auth.config.ts` with WorkOS integration

5. Run the development server:

   ```bash
   npm run dev
   ```

   This starts both the Next.js frontend and Convex backend in parallel

6. Open [http://localhost:3000](http://localhost:3000) to see your app

## WorkOS AuthKit Setup

This app uses WorkOS AuthKit for authentication. Key features:

- **Redirect-based authentication**: Users are redirected to WorkOS for sign-in/sign-up
- **Session management**: Automatic token refresh and session handling
- **Middleware protection**: Routes are protected using Next.js middleware
- **Client and server hooks**: `useAuth()` for client components, `withAuth()` for server components

## Features

### Listing Detail Page

View comprehensive property investment details at `/listings/[id]`:

- **Image carousel** with keyboard navigation and thumbnails
- **Interactive Mapbox map** centered on property location
- **Financial metrics** including purchase price, current value, monthly payment, interest rate, loan term, and maturity countdown
- **Payment history** timeline with status indicators
- **Appraisal data** with value change comparison
- **Comparable properties** showing similar investments nearby

**Testing the feature:**

1. Add Mapbox token to `.env.local`:
   ```bash
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_access_token_here
   ```

2. Seed sample data:
   ```bash
   npx convex run seed:seedListingDetailData
   ```

3. Navigate to one of the created listings (IDs returned by seed function)

For detailed testing instructions, see [docs/listing-detail-testing.md](docs/listing-detail-testing.md)

## Learn more

To learn more about developing your project with Convex, check out:

- The [Tour of Convex](https://docs.convex.dev/get-started) for a thorough introduction to Convex principles.
- The rest of [Convex docs](https://docs.convex.dev/) to learn about all Convex features.
- [Stack](https://stack.convex.dev/) for in-depth articles on advanced topics.

## Join the community

Join thousands of developers building full-stack apps with Convex:

- Join the [Convex Discord community](https://convex.dev/community) to get help in real-time.
- Follow [Convex on GitHub](https://github.com/get-convex/), star and contribute to the open-source implementation of Convex.

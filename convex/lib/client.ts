import { makeUseQueryWithStatus} from 'convex-helpers/react';
import { useQueries, useQuery, usePaginatedQuery } from 'convex-helpers/react/cache/hooks';
import { useMutation, type PaginatedQueryArgs } from 'convex/react';

import { FunctionReference } from 'convex/server';
import {
  OptionalRestArgsOrSkip,
  useConvexAuth,
} from 'convex/react';



export const useQueryWithStatus_ = makeUseQueryWithStatus(useQueries);


/**
 * A wrapper around `useQueryWithStatus` that automatically checks authentication state
 * and skips the query if the user is not authenticated.
 * 
 * This hook combines authentication-aware querying with enhanced status tracking,
 * making it ideal for protected content that needs explicit loading/error states.
 * 
 * **What Makes This Different from Standard `useQuery`?**
 * 
 * Standard Convex `useQuery` returns:
 * - `data | undefined` (undefined while loading)
 * - No explicit error handling (errors are thrown)
 * - No loading state indicator
 * 
 * This hook (via `makeUseQueryWithStatus`) returns:
 * - `{ status, data, error, isSuccess, isPending, isError }`
 * - Explicit status tracking: "success" | "pending" | "error"
 * - Error object instead of throwing
 * - Boolean flags for easy conditional rendering
 * 
 * **Authentication Behavior:**
 * - Automatically skips the query when `isAuthenticated` is false
 * - Returns `{ status: "pending", isPending: true }` when not authenticated
 * - Seamlessly resumes querying when user becomes authenticated
 * - Prevents unnecessary API calls for unauthenticated users
 * 
 * @template Query - The Convex query function reference type
 * @param query - A FunctionReference to the public query (e.g., `api.users.getProfile`)
 * @param args - Query arguments or "skip" to skip the query
 * 
 * @returns An object with status tracking:
 * - `status` - One of: "success" | "pending" | "error"
 * - `data` - The query result (undefined if pending or error)
 * - `error` - Error object if query failed (undefined otherwise)
 * - `isSuccess` - `true` if query succeeded
 * - `isPending` - `true` if query is loading or skipped
 * - `isError` - `true` if query threw an error
 * 
 * @example
 * // Basic usage with status tracking
 * ```ts
 * function UserProfile({ userId }: { userId: string }) {
 *   const { status, data, error, isPending } = useAuthenticatedQueryWithStatus(
 *     api.users.getProfile,
 *     { userId }
 *   );
 * 
 *   if (isPending) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   if (!data) return <div>No profile found</div>;
 * 
 *   return (
 *     <div>
 *       <h1>{data.name}</h1>
 *       <p>{data.email}</p>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * // Using status for conditional rendering
 * ```ts
 * function Dashboard() {
 *   const stats = useAuthenticatedQueryWithStatus(
 *     api.analytics.getStats,
 *     {}
 *   );
 * 
 *   return (
 *     <div>
 *       {stats.status === "success" && (
 *         <StatsDisplay data={stats.data} />
 *       )}
 *       {stats.status === "pending" && (
 *         <StatsSkeleton />
 *       )}
 *       {stats.status === "error" && (
 *         <Alert variant="error">
 *           Failed to load stats: {stats.error.message}
 *         </Alert>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * // Skip query conditionally
 * ```ts
 * function ConditionalData({ shouldLoad }: { shouldLoad: boolean }) {
 *   const result = useAuthenticatedQueryWithStatus(
 *     api.data.getData,
 *     shouldLoad ? { filter: "active" } : "skip"
 *   );
 * 
 *   if (!shouldLoad) {
 *     return <p>Enable loading to see data</p>;
 *   }
 * 
 *   if (result.isPending) return <LoadingSpinner />;
 *   if (result.isError) return <ErrorDisplay error={result.error} />;
 * 
 *   return <DataList items={result.data} />;
 * }
 * ```
 * 
 * @example
 * // Comparison: Standard useQuery vs useAuthenticatedQueryWithStatus
 * ```ts
 * // Standard useQuery (no status tracking)
 * function StandardComponent() {
 *   const data = useQuery(api.users.getProfile, { userId: "123" });
 *   
 *   // Have to check for undefined (loading) and handle errors manually
 *   if (!data) return <LoadingSpinner />;
 *   // Errors would be thrown, need try/catch or error boundary
 *   
 *   return <Profile data={data} />;
 * }
 * 
 * // useAuthenticatedQueryWithStatus (explicit status)
 * function StatusComponent() {
 *   const { status, data, error, isPending, isError } = 
 *     useAuthenticatedQueryWithStatus(api.users.getProfile, { userId: "123" });
 *   
 *   // Clear, explicit state handling
 *   if (isPending) return <LoadingSpinner />;
 *   if (isError) return <ErrorDisplay error={error} />;
 *   
 *   return <Profile data={data} />;
 * }
 * ```
 * 
 * @example
 * // Error handling with retry
 * ```ts
 * function ResilientComponent() {
 *   const [retryCount, setRetryCount] = useState(0);
 *   const result = useAuthenticatedQueryWithStatus(
 *     api.data.fetchData,
 *     { attempt: retryCount }
 *   );
 * 
 *   if (result.isError && result.error.message.includes("retryable")) {
 *     return (
 *       <div>
 *         <p>Error: {result.error.message}</p>
 *         <button onClick={() => setRetryCount(c => c + 1)}>
 *           Retry
 *         </button>
 *       </div>
 *     );
 *   }
 * 
 *   if (result.isPending) return <LoadingSpinner />;
 *   return <DataDisplay data={result.data} />;
 * }
 * ```
 * 
 * @remarks
 * **When to Use This Hook:**
 * - When you need explicit loading/error states (better UX)
 * - When building error-resilient UIs with retry logic
 * - When you want to avoid try/catch blocks or error boundaries
 * - When authentication state should control query execution
 * - When you prefer boolean flags (`isPending`, `isError`) over undefined checks
 * 
 * **When to Use Standard `useQuery`:**
 * - When you don't need explicit status tracking
 * - When you're fine with `undefined` for loading state
 * - When you prefer error boundaries for error handling
 * - When the query doesn't require authentication
 * 
 * **Performance:**
 * - Skips query execution when not authenticated (saves API calls)
 * - Automatically resumes when authentication state changes
 * - No performance overhead compared to standard `useQuery`
 * 
 * @see {@link useAuthenticatedPaginatedQuery} - For paginated authenticated queries
 * @see https://github.com/get-convex/convex-helpers - convex-helpers package documentation
 */
export function useAuthenticatedQueryWithStatus<
  Query extends FunctionReference<'query'>,
>(query: Query, args: OptionalRestArgsOrSkip<Query>[0] | 'skip') {
  const { isAuthenticated } = useConvexAuth();
  return useQueryWithStatus_(query, isAuthenticated ? args : 'skip');
}




/**
 * Authenticated query hook with automatic auth-gating and RBAC context.
 * 
 * **Context includes:** User identity + WorkOS roles/permissions (server-side via `authQuery`)
 * 
 * **⚠️ CRITICAL: For REACTIVE data with AUTH, use this hook (NOT preload patterns)**
 * 
 * ## What This Hook Does
 * 
 * - ✅ Automatically skips query when user is not authenticated
 * - ✅ Returns `undefined` while loading (standard Convex behavior)
 * - ✅ Seamlessly resumes when user authenticates
 * - ✅ RBAC context available server-side: `ctx.role`, `ctx.roles`, `ctx.permissions`, `ctx.org_id`
 * 
 * ## Pattern: Reactive Auth Query
 * 
 * ```ts
 * // ✅ CORRECT - Reactive, respects auth state
 * import { useConvexAuth } from "convex/react";
 * import { useAuthenticatedQuery } from "@/convex/lib/client";
 * 
 * function ProfileComponent() {
 *   const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
 *   const profile = useAuthenticatedQuery(api.users.getProfile, {});
 *   
 *   // Always check authLoading FIRST (prevents race condition)
 *   if (authLoading) return <LoadingSpinner />;
 *   if (!isAuthenticated) return <SignInPrompt />;
 *   if (!profile) return <LoadingData />;
 *   
 *   return <ProfileCard {...profile} />;
 * }
 * ```
 * 
 * ## Anti-Pattern: Preload with Auth
 * 
 * ```ts
 * // ❌ WRONG - Prevents static rendering, stale data
 * // Server Component
 * export default async function Page() {
 *   const { accessToken } = await withAuth();
 *   const preloaded = await preloadQuery(
 *     api.users.getProfile,
 *     {},
 *     { token: accessToken }
 *   );
 *   return <Client preloaded={preloaded} />;
 * }
 * 
 * // Client Component
 * "use client";
 * function Client({ preloaded }) {
 *   // ⚠️ Forces dynamic rendering, no reactivity
 *   const data = usePreloadedQuery(preloaded);
 *   return <div>{data.email}</div>;
 * }
 * 
 * // Why This Fails:
 * // - Prevents Next.js static optimization
 * // - Data frozen at server render time
 * // - Doesn't react to auth changes (logout, refresh)
 * // - Creates security vulnerability (stale auth data)
 * ```
 * 
 * ## Server-Side RBAC Context
 * 
 * When using with `authQuery` server functions, your handler has automatic RBAC access:
 * 
 * ```ts
 * // convex/users.ts
 * import { authQuery } from "./lib/server";
 * 
 * export const getProfile = authQuery({
 *   args: {},
 *   returns: v.object({ name: v.string(), role: v.string() }),
 *   handler: async (ctx) => {
 *     // RBAC context automatically available:
 *     const { role, roles, permissions, org_id } = ctx;
 *     
 *     // Check permission
 *     if (!permissions?.includes("read:profile")) {
 *       throw new Error("Permission denied");
 *     }
 *     
 *     return { name: ctx.name, role: ctx.role };
 *   }
 * });
 * ```
 * 
 * ## When to Use This vs `useAuthenticatedQueryWithStatus`
 * 
 * **Use `useAuthenticatedQuery` when:**
 * - ✅ You prefer standard Convex patterns (`undefined` = loading)
 * - ✅ You're okay with checking `if (!data)` for loading state
 * - ✅ You handle errors via error boundaries
 * - ✅ You want minimal boilerplate
 * 
 * **Use `useAuthenticatedQueryWithStatus` when:**
 * - ✅ You need explicit status tracking (`status`, `isPending`, `isError`)
 * - ✅ You want granular error handling without error boundaries
 * - ✅ You need retry logic or complex loading states
 * - ✅ You prefer boolean flags over undefined checks
 * 
 * ## When to Use `useQueries` vs `useQuery`
 * 
 * Both `useQuery` and `useQueries` are from `convex-helpers/react/cache/hooks` and provide
 * client-side caching. **This hook uses `useQuery`** (standard pattern). Here's when each matters:
 * 
 * ### Use `useQuery` (what this hook uses):
 * - ✅ **Standard caching** - Shares query results across components
 * - ✅ **Single query** - Loading one piece of data at a time
 * - ✅ **Simple use case** - Most common pattern
 * - ✅ **Better DX** - Works with standard Convex types
 * 
 * ### Use `useQueries` (for advanced batching):
 * - ✅ **Batch loading** - Load multiple queries in parallel with single hook call
 * - ✅ **Dynamic query lists** - Number of queries determined at runtime
 * - ✅ **Advanced caching** - When building custom status tracking (like `makeUseQueryWithStatus`)
 * - ⚠️ **More complex** - Returns array of results, harder to type
 * 
 * ### Example: When `useQueries` Matters
 * 
 * ```ts
 * // ❌ Multiple separate hooks (works but verbose)
 * function Dashboard() {
 *   const user = useAuthenticatedQuery(api.users.get, { id: userId });
 *   const posts = useAuthenticatedQuery(api.posts.list, { userId });
 *   const comments = useAuthenticatedQuery(api.comments.list, { userId });
 *   
 *   if (!user || !posts || !comments) return <Loading />;
 *   return <DashboardView user={user} posts={posts} comments={comments} />;
 * }
 * 
 * // ✅ Batch with useQueries (advanced, more efficient)
 * function Dashboard() {
 *   const { isAuthenticated } = useConvexAuth();
 *   const results = useQueries(
 *     isAuthenticated ? [
 *       { query: api.users.get, args: { id: userId } },
 *       { query: api.posts.list, args: { userId } },
 *       { query: api.comments.list, args: { userId } }
 *     ] : []
 *   );
 *   
 *   const [user, posts, comments] = results;
 *   if (results.some(r => r === undefined)) return <Loading />;
 *   return <DashboardView user={user} posts={posts} comments={comments} />;
 * }
 * ```
 * 
 * **⚠️ Note:** For most use cases, stick with `useQuery` (via `useAuthenticatedQuery`).
 * Only use `useQueries` when you need dynamic batching or are building custom hooks.
 * 
 * @template Query - The Convex query function reference type
 * @param query - A FunctionReference to the public authQuery (e.g., `api.users.getProfile`)
 * @param args - Query arguments or "skip" to skip the query
 * 
 * @returns Query result (undefined while loading, data when complete)
 * 
 * @example
 * // Basic usage
 * ```ts
 * function UserProfile() {
 *   const { isLoading: authLoading } = useConvexAuth();
 *   const profile = useAuthenticatedQuery(api.users.getProfile, {});
 *   
 *   if (authLoading) return <LoadingAuth />;
 *   if (!profile) return <LoadingData />;
 *   return <div>{profile.name}</div>;
 * }
 * ```
 * 
 * @example
 * // With error boundary
 * ```ts
 * function UserProfile() {
 *   const profile = useAuthenticatedQuery(api.users.getProfile, {});
 *   
 *   if (!profile) return <LoadingSpinner />;
 *   return <ProfileCard {...profile} />;
 * }
 * // Errors automatically caught by nearest error boundary
 * ```
 * 
 * @example
 * // Conditional loading
 * ```ts
 * function ConditionalData({ enabled }: { enabled: boolean }) {
 *   const data = useAuthenticatedQuery(
 *     api.data.fetch,
 *     enabled ? { filter: "active" } : "skip"
 *   );
 *   
 *   if (!enabled) return <p>Enable to load data</p>;
 *   if (!data) return <LoadingSpinner />;
 *   return <DataDisplay items={data.items} />;
 * }
 * ```
 * 
 * @see {@link useAuthenticatedQueryWithStatus} - For explicit status tracking
 * @see {@link useAuthenticatedPaginatedQuery} - For paginated queries
 */
export function useAuthenticatedQuery<
  Query extends FunctionReference<'query'>,
>(query: Query, args: OptionalRestArgsOrSkip<Query>[0] | 'skip') {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(query, isAuthenticated ? args : 'skip');
}




/**
 * Options for authenticated paginated query with status tracking
 */
export type UseAuthenticatedPaginatedQuery = {
  /** 
   * Number of items to load in the first page.
   * Subsequent pages will attempt to load the same number of items.
   * @example 10, 25, 50
   */
  initialNumItems: number;
  
  /** 
   * Enable gapless pagination for server-side `stream` or `paginator` helpers.
   * 
   * **IMPORTANT: This is a boolean flag, NOT a callback function!**
   * 
   * **What is Custom Pagination?**
   * 
   * The term "custom" refers to using custom **server-side** pagination helpers 
   * (`stream()` or `paginator()`) instead of Convex's built-in `.paginate()`.
   * 
   * When you set `customPagination: true`, it changes how the **client-side** 
   * pagination library internally manages page boundaries to work properly with 
   * these server-side helpers. You don't provide any custom behavior - the flag 
   * tells the library which internal strategy to use.
   * 
   * **What Changes When `customPagination: true`?**
   * 
   * 1. **Page Linking:** When calling `loadMore()`, the library explicitly connects
   *    the last page to the next page by setting `endCursor` values. This prevents
   *    gaps/overlaps as data changes in real-time.
   * 
   * 2. **Eager Page Splitting:** Pages split at ~1x `initialNumItems` instead of 
   *    waiting until ~2x. This keeps pages consistently sized but causes more splits.
   * 
   * 3. **End Cursor Tracking:** The library tracks and passes `endCursor` to your
   *    server query to ensure contiguous pages.
   * 
   * **Server-Side vs Client-Side:**
   * 
   * ```ts
   * // SERVER: Choose your pagination implementation
   * // Option A: Built-in (requires customPagination: false)
   * return await ctx.db.query("messages").paginate(opts);
   * 
   * // Option B: Custom helpers (requires customPagination: true)
   * return await paginator(ctx.db, schema)
   *   .query("messages")
   *   .paginate(opts);
   * 
   * // CLIENT: Tell the library which server implementation you used
   * const result = useAuthenticatedPaginatedQueryWithStatus(
   *   api.messages.list,
   *   {},
   *   { 
   *     initialNumItems: 20,
   *     customPagination: false  // or true, depending on server code
   *   }
   * );
   * ```
   * 
   * **When to use `customPagination: true`:**
   * - When using `stream()` helper from `convex-helpers/server/stream`
   * - When using `paginator()` helper from `convex-helpers/server/pagination`
   * - When you need guaranteed gapless pagination (no items appear/disappear between pages)
   * - When building infinite scroll UIs that must maintain consistency
   * 
   * **When to use `customPagination: false` (default):**
   * - When using standard `ctx.db.query().paginate()` (Convex's built-in pagination)
   * - When small gaps between pages are acceptable
   * - When you don't need `stream` or `paginator` features (multi-table queries, complex filtering)
   * 
   * **Why Use Custom Server Helpers?**
   * 
   * The `stream()` and `paginator()` helpers enable advanced use cases that 
   * built-in `.paginate()` can't handle:
   * - Paginating across multiple tables (joins)
   * - Merging results from multiple queries
   * - Complex filtering that can't be expressed with indexes
   * - Multiple pagination calls in one query/mutation
   * 
   * @default false
   * @see https://stack.convex.dev/fully-reactive-pagination - Convex reactive pagination guide
   * @see https://stack.convex.dev/pagination - General pagination patterns
   * @see https://github.com/get-convex/convex-helpers - Server pagination helpers docs
   */
  customPagination?: boolean;

  /**
   * Whether to check authentication state and skip the query if the user is not authenticated.
   * @default true
   */
  withAuth?: boolean;
};

/**
 * A wrapper around `usePaginatedQuery` that automatically checks authentication state
 * and skips the query if the user is not authenticated.
 * 
 * This hook combines authentication-aware querying with pagination support, making it
 * ideal for protected paginated content like user-specific lists, feeds, or dashboards.
 * 
 * **How It Works (The Full Flow):**
 * 
 * ```
 * CLIENT                           SERVER
 * ┌─────────────────────┐         ┌──────────────────────┐
 * │ Your Component      │         │ Convex Query         │
 * │                     │         │                      │
 * │ useAuthenticated... │────1───▶│ Choose pagination:  │
 * │   customPagination  │         │                      │
 * │   = true/false      │         │ A) Built-in:         │
 * └─────────────────────┘         │    .paginate()       │
 *          │                      │                      │
 *          │                      │ B) Custom helpers:   │
 *          │                      │    paginator()       │
 *          │                      │    stream()          │
 *          │                      └──────────────────────┘
 *          │                               │
 *          ▼                               │
 * ┌─────────────────────┐                 │
 * │ Pagination Library  │◀────────2───────┘
 * │ (convex-helpers)    │     Returns data
 * │                     │     + cursors
 * │ customPagination    │
 * │ flag tells library  │
 * │ HOW to manage       │
 * │ page boundaries     │
 * └─────────────────────┘
 *          │
 *          │ 3. Returns results,
 *          │    status, loadMore()
 *          ▼
 * ┌─────────────────────┐
 * │ Your UI renders     │
 * │ with pagination     │
 * └─────────────────────┘
 * ```
 * 
 * **The Key Point:** 
 * - SERVER chooses pagination implementation (built-in vs custom helpers)
 * - CLIENT must set `customPagination` flag to match server's choice
 * - The flag tells the client library which internal page management strategy to use
 * 
 * @template Query - The Convex query function reference type
 * @param query - A FunctionReference to the public query (e.g., `api.messages.list`)
 * @param args - Query arguments (excluding `paginationOpts`) or "skip" to skip the query
 * @param options - Configuration for pagination behavior
 * 
 * @returns A pagination result object containing:
 * - `results` - Array of loaded items (undefined while loading)
 * - `status` - Pagination status: "CanLoadMore" | "LoadingMore" | "LoadingFirstPage" | "Exhausted"
 * - `isLoading` - Boolean indicating if any page is currently loading
 * - `loadMore(numItems)` - Function to load the next page with specified number of items
 * 
 * @example 
 * // Basic usage with standard pagination (default)
 * ```ts
 * function MessageList() {
 *   const { results, status, loadMore } = useAuthenticatedPaginatedQueryWithStatus(
 *     api.messages.list,
 *     { channelId: "123" },
 *     { initialNumItems: 20 }
 *   );
 * 
 *   if (!results) return <LoadingSpinner />;
 * 
 *   return (
 *     <div>
 *       {results.map(msg => <Message key={msg._id} {...msg} />)}
 *       {status === "CanLoadMore" && (
 *         <button onClick={() => loadMore(20)}>Load More</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example 
 * // Using custom pagination with `stream` helper (server-side)
 * ```ts
 * // convex/messages.ts
 * import { stream } from "convex-helpers/server/stream";
 * import { paginationOptsValidator } from "convex/server";
 * 
 * export const listByMultipleAuthors = query({
 *   args: { 
 *     authorIds: v.array(v.id("users")),
 *     paginationOpts: paginationOptsValidator 
 *   },
 *   handler: async (ctx, { authorIds, paginationOpts }) => {
 *     // Merge streams from multiple authors
 *     const streams = authorIds.map(id =>
 *       stream(ctx.db, schema)
 *         .query("messages")
 *         .withIndex("by_author", q => q.eq("author", id))
 *         .order("desc")
 *     );
 *     return await mergedStream(streams).paginate(paginationOpts);
 *   }
 * });
 * 
 * // Client component
 * function MultiAuthorFeed() {
 *   const { results, loadMore, status } = useAuthenticatedPaginatedQueryWithStatus(
 *     api.messages.listByMultipleAuthors,
 *     { authorIds: ["user1", "user2", "user3"] },
 *     { 
 *       initialNumItems: 25,
 *       customPagination: true  // Required for gapless pagination with stream
 *     }
 *   );
 *   // ... render infinite scroll UI
 * }
 * ```
 * 
 * @example
 * // Using custom pagination with `paginator` helper (server-side)
 * ```ts
 * // convex/listings.ts
 * import { paginator } from "convex-helpers/server/pagination";
 * 
 * export const listActive = query({
 *   args: { paginationOpts: paginationOptsValidator },
 *   handler: async (ctx, { paginationOpts }) => {
 *     return await paginator(ctx.db, schema)
 *       .query("listings")
 *       .withIndex("by_status", q => q.eq("status", "active"))
 *       .order("desc")
 *       .paginate(paginationOpts);
 *   }
 * });
 * 
 * // Client component
 * function ActiveListings() {
 *   const { results, loadMore, status } = useAuthenticatedPaginatedQueryWithStatus(
 *     api.listings.listActive,
 *     {},
 *     { 
 *       initialNumItems: 10,
 *       customPagination: true  // Prevents gaps when listings are added/removed
 *     }
 *   );
 *   // ... render listings
 * }
 * ```
 * 
 * @example
 * // Infinite scroll with intersection observer
 * ```ts
 * function InfiniteScrollList() {
 *   const { results, loadMore, status, isLoading } = 
 *     useAuthenticatedPaginatedQueryWithStatus(
 *       api.items.list,
 *       {},
 *       { initialNumItems: 20, customPagination: true }
 *     );
 *   
 *   const loaderRef = useRef<HTMLDivElement>(null);
 *   
 *   useEffect(() => {
 *     if (!loaderRef.current || status !== "CanLoadMore") return;
 *     
 *     const observer = new IntersectionObserver(([entry]) => {
 *       if (entry.isIntersecting) loadMore(20);
 *     });
 *     
 *     observer.observe(loaderRef.current);
 *     return () => observer.disconnect();
 *   }, [loadMore, status]);
 *   
 *   return (
 *     <div>
 *       {results?.map(item => <Item key={item._id} {...item} />)}
 *       {status === "CanLoadMore" && <div ref={loaderRef}>Loading...</div>}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example 
 * // Skip query conditionally (e.g., based on filter state)
 * ```ts
 * function FilteredList({ filter }: { filter: string | null }) {
 *    const { results, loadMore, status, isLoading } = 
 *     useAuthenticatedPaginatedQueryWithStatus(
 *     api.items.search,
 *     filter ? { searchTerm: filter } : "skip",  // Skip if no filter
 *     { initialNumItems: 15 }
 *   );
 * 
 *   
 *   if (!filter) return <p>Enter a search term</p>;
 *   if (!results) return <LoadingSpinner />;
 *   return <ul>{results.map(item => <li key={item._id}>{item.name}</li>)}</ul>;
 * }
 * ```
 * 
 * @example
 * // ❌ WRONG: Mismatch between server and client
 * ```ts
 * // SERVER: Using custom helper (paginator)
 * export const listItems = query({
 *   args: { paginationOpts: paginationOptsValidator },
 *   handler: async (ctx, { paginationOpts }) => {
 *     return await paginator(ctx.db, schema)  // Using paginator
 *       .query("items")
 *       .paginate(paginationOpts);
 *   }
 * });
 * 
 * // CLIENT: NOT setting customPagination flag
 * function ItemList() {
 *   const { results } = useAuthenticatedPaginatedQueryWithStatus(
 *     api.items.listItems,
 *     {},
 *     { 
 *       initialNumItems: 20,
 *       customPagination: false  // ❌ WRONG! Should be true
 *     }
 *   );
 *   // Result: Gaps may appear between pages as data changes
 * }
 * ```
 * 
 * @example
 * // ✅ CORRECT: Server and client match
 * ```ts
 * // SERVER: Using custom helper (paginator)
 * export const listItems = query({
 *   args: { paginationOpts: paginationOptsValidator },
 *   handler: async (ctx, { paginationOpts }) => {
 *     return await paginator(ctx.db, schema)
 *       .query("items")
 *       .paginate(paginationOpts);
 *   }
 * });
 * 
 * // CLIENT: Setting customPagination flag to match
 * function ItemList() {
 *   const { results } = useAuthenticatedPaginatedQueryWithStatus(
 *     api.items.listItems,
 *     {},
 *     { 
 *       initialNumItems: 20,
 *       customPagination: true  // ✅ CORRECT! Matches server
 *     }
 *   );
 *   // Result: Gapless pagination, pages stay contiguous
 * }
 * ```
 * 
 * @remarks
 * **Authentication Behavior:**
 * - Automatically skips the query when `isAuthenticated` is false
 * - Returns to the loading state when authentication state changes
 * - Seamlessly resumes pagination when user becomes authenticated
 * 
 * **Performance Considerations:**
 * - First page loads with `initialNumItems` documents
 * - Without custom pagination, pages can grow to ~2x initial size before splitting
 * - With custom pagination, pages split eagerly at ~1x initial size
 * - Use custom pagination for consistent UX but standard for better performance
 * 
 * **Comparison: Standard vs Custom Pagination:**
 * 
 * | Feature | Standard | Custom (Gapless) |
 * |---------|----------|------------------|
 * | Server Helper | `ctx.db.query().paginate()` | `stream()` or `paginator()` |
 * | Gaps Between Pages | Possible | Never |
 * | Page Growth | Up to 2x before split | Splits at ~1x |
 * | Performance | Faster (fewer splits) | Slightly slower |
 * | Use Case | General lists | Critical UX (feeds, notifications) |
 * 
 * @see {@link useAuthenticatedQueryWithStatus} - For non-paginated authenticated queries
 * @see https://docs.convex.dev/client/react/pagination - Official Convex pagination docs
 * @see https://github.com/get-convex/convex-helpers - convex-helpers package
 */
export function useAuthenticatedPaginatedQuery<
  Query extends FunctionReference<'query'>,
>(query: Query, args: PaginatedQueryArgs<Query> | 'skip', options: UseAuthenticatedPaginatedQuery, withAuth: boolean = true) {
  const { isAuthenticated } = useConvexAuth();
  const {initialNumItems, customPagination, withAuth: withAuthOption } = options;
  return usePaginatedQuery(query, withAuthOption ? (isAuthenticated ? args : 'skip') : args, {
    initialNumItems: initialNumItems,
    customPagination: customPagination,
  });
}





import type { UserIdentity } from "convex/server";
import { v } from "convex/values";
import {
	customAction,
	customCtx,
	customCtxAndArgs,
	customMutation,
	customQuery,
} from "convex-helpers/server/customFunctions";
import { createError } from "../../lib/errors";
import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";
import { action, mutation, query } from "../_generated/server";
import { resolveTelemetryConfig, shouldSample } from "./telemetry/config";
import { endSpan, endSpanFromAction } from "./telemetry/spanWriter";
import type { OtelEnvelope, TelemetryConfig } from "./telemetry/types";
import { generateSpanId, generateTraceId } from "./telemetry/types";

// ============================================================================
// AUTHENTICATION HELPERS - PREVENTING RACE CONDITIONS
// ============================================================================
//
// ⚠️ CRITICAL: These functions enforce authentication at the Convex backend layer.
// They are designed to work with client-side hooks from `convex/lib/client.ts` to
// prevent authentication race conditions.
//
// 📖 MUST READ: https://stack.convex.dev/authentication-best-practices-convex-clerk-and-nextjs
//
// TODO: Logging, telemetry and audit trail layers to be added here
// ============================================================================

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Custom query builder that enforces authentication before execution.
 *
 * This type represents a query function that automatically validates user
 * authentication via WorkOS before allowing the query to execute.
 *
 * @example
 * ```ts
 * import { authQuery } from "./lib/server";
 * import { v } from "convex/values";
 *
 * export const getProfile: AuthQuery = authQuery({
 *   args: {},
 *   returns: v.object({ name: v.string(), email: v.string() }),
 *   handler: async (ctx) => {
 *     // Authentication already validated
 *     const identity = await ctx.auth.getUserIdentity();
 *     return { name: identity.name, email: identity.email };
 *   }
 * });
 * ```
 */
export type AuthQuery = ReturnType<typeof customQuery>;

/**
 * Custom mutation builder that enforces authentication before execution.
 *
 * This type represents a mutation function that automatically validates user
 * authentication via WorkOS before allowing the mutation to execute.
 *
 * @example
 * ```ts
 * import { authMutation } from "./lib/server";
 * import { v } from "convex/values";
 *
 * export const createPost: AuthMutation = authMutation({
 *   args: { title: v.string(), content: v.string() },
 *   returns: v.id("posts"),
 *   handler: async (ctx, { title, content }) => {
 *     // Authentication already validated
 *     const identity = await ctx.auth.getUserIdentity();
 *     return await ctx.db.insert("posts", {
 *       title,
 *       content,
 *       authorId: identity.subject
 *     });
 *   }
 * });
 * ```
 */
export type AuthMutation = ReturnType<typeof customMutation>;

/**
 * Custom action builder that enforces authentication before execution.
 *
 * This type represents an action function that automatically validates user
 * authentication via WorkOS before allowing the action to execute. Actions
 * run in Node.js environment and can call external APIs.
 *
 * @example
 * ```ts
 * import { authAction } from "./lib/server";
 * import { v } from "convex/values";
 *
 * export const sendEmail: AuthAction = authAction({
 *   args: { to: v.string(), subject: v.string() },
 *   returns: v.null(),
 *   handler: async (ctx, { to, subject }) => {
 *     // Authentication already validated
 *     const identity = await ctx.auth.getUserIdentity();
 *
 *     // Call external API
 *     await fetch("https://api.email.com/send", {
 *       method: "POST",
 *       body: JSON.stringify({ to, subject })
 *     });
 *
 *     return null;
 *   }
 * });
 * ```
 */
export type AuthAction = ReturnType<typeof customAction>;

/**
 * Parameters for the AuthenticationRequired function.
 *
 * This type represents the context parameter needed to perform authentication
 * validation. It accepts any Convex context type (query, mutation, or action).
 *
 * @example
 * ```ts
 * async function requireAdmin(ctx: QueryCtx) {
 *   // First check authentication
 *   const params: AuthenticationRequiredParams = { ctx };
 *   await AuthenticationRequired(params);
 *
 *   // Then check admin role
 *   const identity = await ctx.auth.getUserIdentity();
 *   // ... admin validation logic
 * }
 * ```
 */
export type AuthenticationRequiredParams = {
	/** The Convex context from a query, mutation, or action */
	ctx: QueryCtx | MutationCtx | ActionCtx;
};

// ============================================================================
// AUTHENTICATED CONTEXT TYPES
// ============================================================================

export type AuthorizedIdentity = {
	role?: string;
	subject?: string;
	email?: string | null;
	org_id?: string | null;
	permissions?: string[] | null;
	roles?: string[] | null;
};

export type TelemetryCtx = {
	_telemetry?: {
		traceId: string;
		spanId: string;
		parentSpanId?: string;
		requestId?: string;
		sampled: boolean;
	};
};

export type AuthorizedQueryCtx = QueryCtx & AuthorizedIdentity & TelemetryCtx;
export type AuthorizedMutationCtx = MutationCtx &
	AuthorizedIdentity &
	TelemetryCtx;
export type AuthorizedActionCtx = ActionCtx & AuthorizedIdentity & TelemetryCtx;

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Authenticated query with automatic RBAC context extension.
 *
 * **Context includes:** User identity + WorkOS roles/permissions automatically loaded
 *
 * **⚠️ CRITICAL: For REACTIVE data with AUTH, DO NOT USE PRELOAD**
 *
 * # RBAC Context Extension
 *
 * All auth functions automatically extend `ctx` with WorkOS identity data:
 * ```ts
 * export const myQuery = authQuery({
 *   handler: async (ctx) => {
 *     // Automatically available from WorkOS:
 *     const { role, roles, permissions, org_id } = ctx;
 *
 *     // Check permissions
 *     if (!permissions?.includes("read:data")) {
 *       throw new Error("Permission denied");
 *     }
 *   }
 * });
 * ```
 *
 * # Authentication Race Condition Problem
 *
 * Client queries can execute before authentication completes, creating a security window
 *
 * ## ❌ WRONG: Preloading Authenticated Data
 *
 * ```ts
 * // Server: Preloading with auth token
 * const preloaded = await preloadQuery(api.users.get, {}, { token });
 *
 * // Client: Using preloaded data
 * const data = usePreloadedQuery(preloaded); // ⚠️ WRONG!
 * ```
 *
 * **Why this fails:**
 * - Prevents static rendering (forces dynamic)
 * - Data frozen at server render time
 * - No reactivity to auth changes (logout/refresh)
 * - Security vulnerability (stale auth data)
 *
 * ## ✅ CORRECT: Reactive Query with Auth Check
 *
 * ```ts
 * "use client";
 * import { useConvexAuth } from "convex/react";
 * import { useAuthenticatedQueryWithStatus } from "@/convex/lib/client";
 *
 * function Profile() {
 *   const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
 *   const { data, isPending } = useAuthenticatedQueryWithStatus(api.users.get, {});
 *
 *   if (authLoading) return <Spinner />;
 *   if (!isAuthenticated) return <Navigate to="/sign-in" />;
 *   if (isPending) return <Loading />;
 *
 *   return <div>{data.name}</div>;
 * }
 * ```
 *
 * **Why this works:**
 * - Checks `authLoading` before rendering (prevents race condition)
 * - Data updates reactively on auth changes
 * - Handles token refresh automatically
 * - Allows static rendering
 *
 * ## Server-Side with RBAC
 *
 * ```ts
 * import { authQuery } from "./lib/server";
 *
 * export const getProfile = authQuery({
 *   handler: async (ctx) => {
 *     // RBAC context automatically available:
 *     const { role, roles, permissions, org_id } = ctx;
 *
 *     // Check permission before proceeding
 *     if (!permissions?.includes("read:profile")) {
 *       throw new Error("Permission denied");
 *     }
 *
 *     // Query data scoped to user's org
 *     return await ctx.db.query("profiles")
 *       .withIndex("by_org", q => q.eq("orgId", org_id))
 *       .unique();
 *   },
 * });
 * ```
 *
 * @see https://stack.convex.dev/authentication-best-practices-convex-clerk-and-nextjs
 * @see {@link AuthenticationRequired} - Core auth check
 * @see {@link authMutation}, {@link authAction} - For mutations/actions
 */
export const authQuery = customQuery(
	query,
	customCtx(async (ctx) => await AuthenticationRequired({ ctx }))
);

/**
 * Authenticated mutation with automatic RBAC context extension.
 *
 * **Context includes:** User identity + WorkOS roles/permissions automatically loaded
 *
 * **⚠️ CRITICAL: Always check auth state on client before calling mutations**
 *
 * ## ❌ WRONG: No Client Auth Check
 *
 * ```ts
 * const deleteItem = useMutation(api.items.delete);
 *
 * function handleDelete() {
 *   deleteItem({ id }); // ⚠️ No auth check!
 * }
 * ```
 *
 * ## ✅ CORRECT: Auth Check Before Mutation
 *
 * ```ts
 * const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
 * const deleteItem = useMutation(api.items.delete);
 *
 * async function handleDelete() {
 *   if (authLoading) return toast.error("Please wait");
 *   if (!isAuthenticated) return toast.error("Sign in required");
 *
 *   await deleteItem({ id });
 * }
 * ```
 *
 * ## Server-Side with RBAC
 *
 * ```ts
 * import { authMutation } from "./lib/server";
 *
 * export const deleteItem = authMutation({
 *   handler: async (ctx, { id }) => {
 *     // RBAC context automatically available:
 *     const { role, permissions, org_id } = ctx;
 *
 *     // Check permission
 *     if (!permissions?.includes("delete:items")) {
 *       throw new Error("Permission denied");
 *     }
 *
 *     // Verify ownership
 *     const item = await ctx.db.get(id);
 *     if (item.orgId !== org_id) {
 *       throw new Error("Unauthorized");
 *     }
 *
 *     await ctx.db.delete(id);
 *   },
 * });
 * ```
 *
 * @see {@link authQuery}, {@link authAction}
 */
export const authMutation = customMutation(
	mutation,
	customCtx(async (ctx) => await AuthenticationRequired({ ctx }))
);

/**
 * Authenticated action with automatic RBAC context extension.
 *
 * **Context includes:** User identity + WorkOS roles/permissions automatically loaded
 *
 * **⚠️ CRITICAL: Actions run in Node.js and can call external APIs - always check auth on client**
 *
 * Actions are for external integrations (payments, emails, webhooks, etc.) and run in Node.js,
 * not the V8 isolate. They cannot directly access the database - use `ctx.runQuery/runMutation`.
 *
 * ## ❌ WRONG: No Client Auth Check
 *
 * ```ts
 * const sendEmail = useAction(api.emails.send);
 *
 * function handleClick() {
 *   sendEmail({ to, subject }); // ⚠️ No auth check!
 * }
 * ```
 *
 * ## ✅ CORRECT: Auth Check Before Action
 *
 * ```ts
 * const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
 * const sendEmail = useAction(api.emails.send);
 *
 * async function handleClick() {
 *   if (authLoading) return toast.error("Please wait");
 *   if (!isAuthenticated) return toast.error("Sign in required");
 *
 *   await sendEmail({ to, subject });
 * }
 * ```
 *
 * ## Server-Side with RBAC
 *
 * ```ts
 * import { authAction } from "./lib/server";
 *
 * export const sendEmail = authAction({
 *   handler: async (ctx, { to, subject }) => {
 *     // RBAC context automatically available:
 *     const { role, permissions, email } = ctx;
 *
 *     // Check permission
 *     if (!permissions?.includes("send:emails")) {
 *       throw new Error("Permission denied");
 *     }
 *
 *     // Call external API
 *     await fetch("https://api.emailprovider.com/send", {
 *       method: "POST",
 *       headers: { "Authorization": `Bearer ${process.env.EMAIL_KEY}` },
 *       body: JSON.stringify({ to, subject, from: email })
 *     });
 *   },
 * });
 * ```
 *
 * **Common use cases:** Stripe payments, SendGrid emails, Twilio SMS, webhooks, heavy computation
 *
 * @see {@link authQuery}, {@link authMutation}
 */
export const authAction = customAction(
	action,
	customCtx(async (ctx) => await AuthenticationRequired({ ctx }))
);

/**
 * Core authentication check with RBAC context extension.
 *
 * Validates user identity and returns WorkOS identity data including roles/permissions.
 * Automatically called by `authQuery`, `authMutation`, and `authAction`.
 *
 * **Returns WorkOS Identity Data:**
 * - `tokenIdentifier` - Unique user token
 * - `subject` - User ID
 * - `email` - User email
 * - `role` - Primary role string
 * - `roles` - Array of role objects
 * - `permissions` - Array of permission strings
 * - `org_id` - Organization ID
 * - Profile fields: `first_name`, `last_name`, `profile_picture_url`, `email_verified`
 *
 * @param ctx - Convex context from query/mutation/action
 * @returns RBAC context object with user identity, roles, and permissions
 * @throws {Error} "Authentication required" if no valid session
 *
 * @example
 * ```ts
 * // ✅ Use authQuery/authMutation/authAction (calls this automatically)
 * export const myQuery = authQuery({
 *   handler: async (ctx) => {
 *     // RBAC data automatically in ctx
 *     const { role, permissions, org_id } = ctx;
 *   }
 * });
 * ```
 *
 * @see {@link authQuery}, {@link authMutation}, {@link authAction}
 */
export async function AuthenticationRequired({
	ctx,
}: {
	ctx: QueryCtx | MutationCtx | ActionCtx;
}) {
	const identity = await ctx.auth.getUserIdentity();
	if (identity === null) {
		//TODO: Implement custom error types for Convex, should capture caller
		throw new Error("Authentication required");
	}

	return {
		tokenIdentifier: identity.tokenIdentifier,
		subject: identity.subject,
		email: identity.email,
		email_verified: identity.email_verified,
		first_name: identity.first_name,
		last_name: identity.last_name,
		profile_picture_url: identity.profile_picture_url,
		org_id: identity.org_id,
		permissions: identity.permissions,
		role: identity.role,
		roles: identity.roles,
	};
}

// ============================================================================
// TELEMETRY HELPERS
// ============================================================================

/** Convex validator for the consumed `_otel` envelope arg. */
const otelEnvelopeValidator = v.optional(
	v.object({
		traceId: v.string(),
		spanId: v.string(),
		parentSpanId: v.optional(v.string()),
		requestId: v.optional(v.string()),
		functionName: v.optional(v.string()),
		sampled: v.boolean(),
		debugMode: v.optional(v.boolean()),
	})
);

/** Resolved telemetry state — null if tracing is disabled or not sampled. */
type TelemetryState = {
	traceId: string;
	spanId: string;
	parentSpanId?: string;
	requestId?: string;
	functionName?: string;
	sampled: true;
	startedAt: number;
	/** Auth attributes attached after input resolves (for error spans). */
	attributes?: Record<string, unknown>;
};

/**
 * Resolve whether this request should be traced, combining the client
 * envelope (if present) with server-side config/sampling.
 */
function resolveTelemetryState(
	envelope: OtelEnvelope | undefined,
	config: TelemetryConfig
): TelemetryState | null {
	if (!config.enabled) return null;

	const sampled = envelope?.sampled ?? shouldSample(config);
	if (!sampled) return null;

	return {
		traceId: envelope?.traceId ?? generateTraceId(),
		spanId: envelope?.spanId ?? generateSpanId(),
		parentSpanId: envelope?.parentSpanId,
		requestId: envelope?.requestId,
		functionName: envelope?.functionName,
		sampled: true,
		startedAt: Date.now(),
	};
}

/**
 * Build auth-related span attributes based on sampling mode.
 * Dev mode includes high-cardinality data; prod mode is minimal.
 */
function buildAuthAttributes(
	identity: UserIdentity,
	config: TelemetryConfig,
	requiredRoles: string[],
	requiredPermissions: string[],
	authenticated: boolean
): Record<string, unknown> {
	const attrs: Record<string, unknown> = {
		"fairlend.auth.role": identity.role,
		"fairlend.auth.org_id": identity.org_id,
		"fairlend.function.authenticated": authenticated,
	};

	if (config.samplingMode === "full-dev") {
		attrs["fairlend.auth.subject"] = identity.subject;
		attrs["fairlend.auth.email"] = identity.email;
		attrs["fairlend.auth.permissions"] = identity.permissions;
		attrs["fairlend.auth.roles"] = identity.roles;
		attrs["fairlend.function.requiredRoles"] = requiredRoles;
		attrs["fairlend.function.requiredPermissions"] = requiredPermissions;
	}

	return attrs;
}

/** Convert an unknown thrown value into a SpanError shape. */
function extractSpanError(err: unknown): {
	message: string;
	code?: string;
	stack?: string;
} {
	if (err instanceof Error) {
		return {
			message: err.message,
			code: err.name,
			stack: err.stack,
		};
	}
	return { message: String(err) };
}

/**
 * Internal symbol-like key for stashing telemetry state on the original ctx.
 * Used to pass state from `input` to the error-catching wrapper.
 */
const TEL_STATE_KEY = "__telState";

/**
 * Wrap the base `mutation` builder to add try/catch for error span recording.
 *
 * How it works:
 * 1. `customCtxAndArgs.input` runs → stashes TelemetryState on `ctx.__telState`
 * 2. User handler runs inside the try block
 * 3. On success → `onSuccess` fires and records success span (handled by customCtxAndArgs)
 * 4. On error → catch block reads `ctx.__telState` and records error span
 *
 * This preserves TypeScript inference because `customMutation` derives its
 * generic types from the Customization, not the base builder.
 */
const instrumentedMutation = ((fnDef: {
	args?: Record<string, unknown>;
	returns?: unknown;
	handler: (
		ctx: MutationCtx,
		args: Record<string, unknown>
	) => Promise<unknown>;
}) =>
	mutation({
		...fnDef,
		handler: async (ctx: MutationCtx, args: Record<string, unknown>) => {
			try {
				return await fnDef.handler(ctx, args);
			} catch (err) {
				const telState = (ctx as unknown as Record<string, unknown>)[
					TEL_STATE_KEY
				] as TelemetryState | undefined;
				if (telState?.sampled) {
					try {
						await endSpan(
							ctx,
							{
								traceId: telState.traceId,
								spanId: telState.spanId,
								parentSpanId: telState.parentSpanId,
								requestId: telState.requestId,
								sampled: true,
								functionName: telState.functionName ?? "unknown.mutation",
								kind: "mutation",
								startedAt: telState.startedAt,
								attributes: telState.attributes,
							},
							extractSpanError(err)
						);
					} catch {
						// Telemetry failures must never mask business errors
					}
				}
				throw err;
			}
		},
	} as Parameters<typeof mutation>[0])) as typeof mutation;

/**
 * Wrap the base `action` builder to add try/catch for error span recording.
 * Same pattern as instrumentedMutation but uses `endSpanFromAction` (scheduled writes).
 */
const instrumentedAction = ((fnDef: {
	args?: Record<string, unknown>;
	returns?: unknown;
	handler: (ctx: ActionCtx, args: Record<string, unknown>) => Promise<unknown>;
}) =>
	action({
		...fnDef,
		handler: async (ctx: ActionCtx, args: Record<string, unknown>) => {
			try {
				return await fnDef.handler(ctx, args);
			} catch (err) {
				const telState = (ctx as unknown as Record<string, unknown>)[
					TEL_STATE_KEY
				] as TelemetryState | undefined;
				if (telState?.sampled) {
					try {
						await endSpanFromAction(
							ctx,
							{
								traceId: telState.traceId,
								spanId: telState.spanId,
								parentSpanId: telState.parentSpanId,
								requestId: telState.requestId,
								sampled: true,
								functionName: telState.functionName ?? "unknown.action",
								kind: "action",
								startedAt: telState.startedAt,
								attributes: telState.attributes,
							},
							extractSpanError(err)
						);
					} catch {
						// Telemetry failures must never mask business errors
					}
				}
				throw err;
			}
		},
	} as Parameters<typeof action>[0])) as typeof action;

// ============================================================================
// ROLE & PERMISSION CHECKS
// ============================================================================

const _fairLendRoles = v.union(
	v.literal("admin"),
	v.literal("member"),
	v.literal("investor"),
	v.literal("lawyer"),
	v.literal("broker")
);

export function roleCheck({
	identity,
	roles,
}: {
	identity: UserIdentity;
	roles?: string[];
}) {
	if (!roles) return true;
	const roleSet = new Set(roles);

	if (roleSet.size === 0 || roleSet.has("any")) return true;

	const userRole = identity.role;
	if (!userRole) return false;

	if (userRole === "admin") return true;
	if (roleSet.has(userRole as string)) return true;
	return false;
}

export async function permissionsCheck({
	identity,
	permissions,
}: {
	identity: UserIdentity;
	permissions: string[];
}) {
	const permissionSet = new Set(permissions);

	if (permissionSet.size === 0 || permissionSet.has("any")) return true;

	const userPermissionsValue = identity.permissions;
	const userPermissions = Array.isArray(userPermissionsValue)
		? new Set(userPermissionsValue as string[])
		: new Set<string>();

	if ([...permissionSet].every((permission) => userPermissions.has(permission)))
		return true;

	return false;
}

const authorizedQueryContextAndArgs = customCtxAndArgs({
	args: {
		roles: v.array(v.string()),
		permissions: v.array(v.string()),
		orgs: v.optional(v.string()),
	},
	input: async (ctx, args) => {
		//ensure authentication
		const identity = await ctx.auth.getUserIdentity();
		if (identity === null) {
			throw createError({
				code: "auth",
				status: 401,
				devMessage: "Authentication required",
				context: { location: "authorizedQueryContextAndArgs" },
			});
		}

		if (!roleCheck({ identity, roles: args.roles })) {
			throw createError({
				code: "auth",
				status: 403,
				devMessage: `Not authorized! Required Role(s): ${args.roles.join(", ")}`,
				context: { userRoles: identity.roles, requiredRoles: args.roles },
			});
		}
		if (!permissionsCheck({ identity, permissions: args.permissions })) {
			throw createError({
				code: "auth",
				status: 403,
				devMessage: `Not authorized! Required Permission(s): ${args.permissions.join(", ")}`,
				context: {
					userPermissions: identity.permissions,
					requiredPermissions: args.permissions,
				},
			});
		}

		return {
			ctx,
			args: {
				roles: args.roles,
				permissions: args.permissions,
			},
		};
	},
});

export const authorizedQuery = customQuery(
	query,
	authorizedQueryContextAndArgs
);

export const createAuthorizedQuery = (
	requiredRoles: string[] = [],
	requiredPermissions: string[] = [],
	auth = true
) =>
	customQuery(
		query,
		customCtxAndArgs({
			args: {
				orgs: v.optional(v.string()),
				_otel: otelEnvelopeValidator,
			},
			input: async (ctx, args) => {
				// Strip _otel from forwarded args
				const { _otel, ...restArgs } = args;

				if (!auth) {
					return { ctx, args: restArgs };
				}

				const identity = await ctx.auth.getUserIdentity();
				if (identity === null) {
					throw createError({
						code: "auth",
						status: 401,
						devMessage: "Authentication required",
						context: { location: "createAuthorizedQuery" },
					});
				}

				if (!roleCheck({ identity, roles: requiredRoles })) {
					throw createError({
						code: "auth",
						status: 403,
						devMessage: `Not authorized! Required Role(s): ${requiredRoles.join(", ")}`,
						context: { userRoles: identity.roles, requiredRoles },
					});
				}

				if (!permissionsCheck({ identity, permissions: requiredPermissions })) {
					throw createError({
						code: "auth",
						status: 403,
						devMessage: `Not authorized! Required Permission(s): ${requiredPermissions.join(", ")}`,
						context: {
							userPermissions: identity.permissions,
							requiredPermissions,
						},
					});
				}

				// Resolve telemetry state (queries don't record spans server-side)
				const config = resolveTelemetryConfig();
				const telState = resolveTelemetryState(
					_otel as OtelEnvelope | undefined,
					config
				);

				return {
					ctx: {
						...ctx,
						role: identity.role,
						subject: identity.subject,
						email: identity.email,
						org_id: identity.org_id,
						permissions: identity.permissions,
						roles: identity.roles,
						_telemetry: telState
							? {
									traceId: telState.traceId,
									spanId: telState.spanId,
									parentSpanId: telState.parentSpanId,
									requestId: telState.requestId,
									sampled: telState.sampled,
								}
							: undefined,
					},
					args: restArgs,
				};
			},
		})
	);

export const createAuthorizedMutation = (
	requiredRoles: string[] = [],
	requiredPermissions: string[] = [],
	auth = true
) =>
	customMutation(
		instrumentedMutation,
		customCtxAndArgs({
			args: {
				orgs: v.optional(v.string()),
				_otel: otelEnvelopeValidator,
			},
			input: async (ctx, args) => {
				const { _otel, ...restArgs } = args;

				if (!auth) {
					return { ctx, args: restArgs };
				}

				const identity = await ctx.auth.getUserIdentity();
				if (identity === null) {
					throw createError({
						code: "auth",
						status: 401,
						devMessage: "Authentication required",
						context: { location: "createAuthorizedMutation" },
					});
				}

				if (!roleCheck({ identity, roles: requiredRoles })) {
					throw createError({
						code: "auth",
						status: 403,
						devMessage: `Not authorized! Required Role(s): ${requiredRoles.join(", ")}`,
						context: { userRoles: identity.roles, requiredRoles },
					});
				}

				if (!permissionsCheck({ identity, permissions: requiredPermissions })) {
					throw createError({
						code: "auth",
						status: 403,
						devMessage: `Not authorized! Required Permission(s): ${requiredPermissions.join(", ")}`,
						context: {
							userPermissions: identity.permissions,
							requiredPermissions,
						},
					});
				}

				// Resolve telemetry
				const config = resolveTelemetryConfig();
				const telState = resolveTelemetryState(
					_otel as OtelEnvelope | undefined,
					config
				);

				const authAttrs =
					telState && config.samplingMode !== "errors-only"
						? buildAuthAttributes(
								identity,
								config,
								requiredRoles,
								requiredPermissions,
								auth
							)
						: undefined;

				// Stash telemetry state on the original ctx so the
				// instrumentedMutation try/catch can record error spans.
				if (telState) {
					(ctx as unknown as Record<string, unknown>)[TEL_STATE_KEY] = {
						...telState,
						attributes: authAttrs,
					};
				}

				// Build onSuccess callback via closure over original ctx
				const onSuccess = telState
					? async ({
							ctx: originalCtx,
						}: {
							ctx: MutationCtx;
							args: Record<string, unknown>;
							result: unknown;
						}) => {
							try {
								await endSpan(originalCtx, {
									traceId: telState.traceId,
									spanId: telState.spanId,
									parentSpanId: telState.parentSpanId,
									requestId: telState.requestId,
									sampled: true,
									functionName: telState.functionName ?? "unknown.mutation",
									kind: "mutation",
									startedAt: telState.startedAt,
									attributes: authAttrs,
								});
							} catch {
								// Telemetry failures must never break business logic
							}
						}
					: undefined;

				return {
					ctx: {
						...ctx,
						role: identity.role,
						subject: identity.subject,
						email: identity.email,
						org_id: identity.org_id,
						permissions: identity.permissions,
						roles: identity.roles,
						_telemetry: telState
							? {
									traceId: telState.traceId,
									spanId: telState.spanId,
									parentSpanId: telState.parentSpanId,
									requestId: telState.requestId,
									sampled: telState.sampled,
								}
							: undefined,
					},
					args: restArgs,
					onSuccess,
				};
			},
		})
	);

export const createAuthorizedAction = (
	requiredRoles: string[] = [],
	requiredPermissions: string[] = [],
	auth = true
) =>
	customAction(
		instrumentedAction,
		customCtxAndArgs({
			args: {
				orgs: v.optional(v.string()),
				_otel: otelEnvelopeValidator,
			},
			input: async (ctx, args) => {
				const { _otel, ...restArgs } = args;

				if (!auth) {
					return { ctx, args: restArgs };
				}

				const identity = await ctx.auth.getUserIdentity();
				if (identity === null) {
					throw createError({
						code: "auth",
						status: 401,
						devMessage: "Authentication required",
						context: { location: "createAuthorizedAction" },
					});
				}

				if (!roleCheck({ identity, roles: requiredRoles })) {
					throw createError({
						code: "auth",
						status: 403,
						devMessage: `Not authorized! Required Role(s): ${requiredRoles.join(", ")}`,
						context: { userRoles: identity.roles, requiredRoles },
					});
				}

				if (!permissionsCheck({ identity, permissions: requiredPermissions })) {
					throw createError({
						code: "auth",
						status: 403,
						devMessage: `Not authorized! Required Permission(s): ${requiredPermissions.join(", ")}`,
						context: {
							userPermissions: identity.permissions,
							requiredPermissions,
						},
					});
				}

				// Resolve telemetry
				const config = resolveTelemetryConfig();
				const telState = resolveTelemetryState(
					_otel as OtelEnvelope | undefined,
					config
				);

				const authAttrs =
					telState && config.samplingMode !== "errors-only"
						? buildAuthAttributes(
								identity,
								config,
								requiredRoles,
								requiredPermissions,
								auth
							)
						: undefined;

				// Stash telemetry state on the original ctx so the
				// instrumentedAction try/catch can record error spans.
				if (telState) {
					(ctx as unknown as Record<string, unknown>)[TEL_STATE_KEY] = {
						...telState,
						attributes: authAttrs,
					};
				}

				// Build onSuccess callback — actions schedule writes via scheduler
				const onSuccess = telState
					? async ({
							ctx: originalCtx,
						}: {
							ctx: ActionCtx;
							args: Record<string, unknown>;
							result: unknown;
						}) => {
							try {
								await endSpanFromAction(originalCtx, {
									traceId: telState.traceId,
									spanId: telState.spanId,
									parentSpanId: telState.parentSpanId,
									requestId: telState.requestId,
									sampled: true,
									functionName: telState.functionName ?? "unknown.action",
									kind: "action",
									startedAt: telState.startedAt,
									attributes: authAttrs,
								});
							} catch {
								// Telemetry failures must never break business logic
							}
						}
					: undefined;

				return {
					ctx: {
						...ctx,
						role: identity.role,
						subject: identity.subject,
						email: identity.email,
						org_id: identity.org_id,
						permissions: identity.permissions,
						roles: identity.roles,
						_telemetry: telState
							? {
									traceId: telState.traceId,
									spanId: telState.spanId,
									parentSpanId: telState.parentSpanId,
									requestId: telState.requestId,
									sampled: telState.sampled,
								}
							: undefined,
					},
					args: restArgs,
					onSuccess,
				};
			},
		})
	);

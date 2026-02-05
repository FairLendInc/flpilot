/**
 * Traced Function Builders
 *
 * Drop-in replacements for createAuthorizedQuery/Mutation/Action that
 * automatically record execution spans with full payload capture.
 *
 * Usage:
 *   // Before (existing):
 *   import { createAuthorizedMutation } from "./lib/server";
 *   const myMutation = createAuthorizedMutation(["admin"]);
 *
 *   // After (traced):
 *   import { createTracedMutation } from "./lib/tracedFunctions";
 *   const myMutation = createTracedMutation(["admin"]);
 *
 * The traced versions preserve all RBAC behavior and additionally
 * record trace spans when TRACING_ENABLED=true.
 *
 * LIMITATION: Queries cannot write to the database, so traced queries
 * log spans to console instead of persisting them. Mutations and actions
 * persist spans to the trace_spans table.
 */

import type { UserIdentity } from "convex/server";
import { v } from "convex/values";
import {
	customAction,
	customCtxAndArgs,
	customMutation,
	customQuery,
} from "convex-helpers/server/customFunctions";
import { createError } from "../../lib/errors";
import type { ActionCtx, MutationCtx, } from "../_generated/server";
import { action, mutation, query } from "../_generated/server";
import {
	buildSpanData,
	createTraceContext,
	isTracingEnabled,
	type TraceContext,
} from "./tracing";

// ============================================================================
// INTERNAL HELPERS (duplicated from server.ts to avoid circular deps)
// ============================================================================

function roleCheck({
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

function permissionsCheck({
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
	if ([...permissionSet].every((p) => userPermissions.has(p))) return true;
	return false;
}

function extractAuthContext(identity: UserIdentity) {
	return {
		subject: identity.subject,
		role: identity.role as string | undefined,
		org_id: identity.org_id as string | undefined,
		permissions: Array.isArray(identity.permissions)
			? (identity.permissions as string[])
			: undefined,
	};
}

// ============================================================================
// TRACED QUERY
// ============================================================================

/**
 * Create a traced query builder with RBAC enforcement.
 *
 * Since queries cannot write to the database, spans are logged to console
 * in a structured format when tracing is enabled.
 *
 * @param requiredRoles - Roles allowed to execute this query
 * @param requiredPermissions - Permissions required
 * @param auth - Whether authentication is required (default: true)
 */
export const createTracedQuery = (
	requiredRoles: string[] = [],
	requiredPermissions: string[] = [],
	auth = true
) =>
	customQuery(
		query,
		customCtxAndArgs({
			args: {
				orgs: v.optional(v.string()),
				_trace: v.optional(
					v.object({
						traceId: v.string(),
						spanId: v.string(),
						parentSpanId: v.optional(v.string()),
						requestId: v.optional(v.string()),
					})
				),
			},
			input: async (ctx, args) => {
				const startTime = Date.now();
				const enabled = isTracingEnabled();

				if (!auth) {
					if (enabled) {
						// Log span for unauthenticated query
						const trace = createTraceContext(
							"unknown_query",
							"query",
							args._trace as TraceContext | undefined
						);
						const span = buildSpanData({
							trace,
							functionName: "unknown_query",
							functionType: "query",
							startTime,
							status: "started",
							args: stripTraceFromArgs(args),
						});
						console.log("[TRACE:QUERY]", JSON.stringify(span));
					}
					return { ctx, args: stripTraceFromArgs(args) };
				}

				const identity = await ctx.auth.getUserIdentity();
				if (identity === null) {
					throw createError({
						code: "auth",
						status: 401,
						devMessage: "Authentication required",
						context: { location: "createTracedQuery" },
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

				if (enabled) {
					const trace = createTraceContext(
						"query",
						"query",
						args._trace as TraceContext | undefined
					);
					const span = buildSpanData({
						trace,
						functionName: "query",
						functionType: "query",
						startTime,
						status: "started",
						args: stripTraceFromArgs(args),
						authContext: extractAuthContext(identity),
					});
					console.log("[TRACE:QUERY]", JSON.stringify(span));
				}

				return {
					ctx: {
						...ctx,
						role: identity.role,
						subject: identity.subject,
						email: identity.email,
						org_id: identity.org_id,
						permissions: identity.permissions,
						roles: identity.roles,
					},
					args: stripTraceFromArgs(args),
				};
			},
		})
	);

// ============================================================================
// TRACED MUTATION
// ============================================================================

/**
 * Create a traced mutation builder with RBAC enforcement.
 *
 * When tracing is enabled, persists a span to the trace_spans table
 * via ctx.scheduler.runAfter(0, ...) to avoid blocking the mutation.
 *
 * @param requiredRoles - Roles allowed to execute this mutation
 * @param requiredPermissions - Permissions required
 * @param auth - Whether authentication is required (default: true)
 */
export const createTracedMutation = (
	requiredRoles: string[] = [],
	requiredPermissions: string[] = [],
	auth = true
) =>
	customMutation(
		mutation,
		customCtxAndArgs({
			args: {
				orgs: v.optional(v.string()),
				_trace: v.optional(
					v.object({
						traceId: v.string(),
						spanId: v.string(),
						parentSpanId: v.optional(v.string()),
						requestId: v.optional(v.string()),
					})
				),
			},
			input: async (ctx, args) => {
				const startTime = Date.now();
				const enabled = isTracingEnabled();

				let traceCtx: TraceContext | undefined;
				let authCtx: ReturnType<typeof extractAuthContext> | undefined;

				if (!auth) {
					if (enabled) {
						traceCtx = createTraceContext(
							"unknown_mutation",
							"mutation",
							args._trace as TraceContext | undefined
						);
					}
					return {
						ctx:
							enabled && traceCtx
								? extendCtxWithTracing(ctx, traceCtx, startTime, authCtx)
								: ctx,
						args: stripTraceFromArgs(args),
					};
				}

				const identity = await ctx.auth.getUserIdentity();
				if (identity === null) {
					throw createError({
						code: "auth",
						status: 401,
						devMessage: "Authentication required",
						context: { location: "createTracedMutation" },
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

				authCtx = extractAuthContext(identity);

				if (enabled) {
					traceCtx = createTraceContext(
						"mutation",
						"mutation",
						args._trace as TraceContext | undefined
					);
				}

				return {
					ctx: {
						...ctx,
						role: identity.role,
						subject: identity.subject,
						email: identity.email,
						org_id: identity.org_id,
						permissions: identity.permissions,
						roles: identity.roles,
						...(enabled && traceCtx
							? {
									_tracing: {
										enabled: true,
										trace: traceCtx,
										startTime,
										authContext: authCtx,
									},
								}
							: {}),
					},
					args: stripTraceFromArgs(args),
				};
			},
		})
	);

// ============================================================================
// TRACED ACTION
// ============================================================================

/**
 * Create a traced action builder with RBAC enforcement.
 *
 * Actions run in Node.js and can call external APIs. When tracing is enabled,
 * persists spans via ctx.runMutation to the trace_spans table.
 *
 * @param requiredRoles - Roles allowed to execute this action
 * @param requiredPermissions - Permissions required
 * @param auth - Whether authentication is required (default: true)
 */
export const createTracedAction = (
	requiredRoles: string[] = [],
	requiredPermissions: string[] = [],
	auth = true
) =>
	customAction(
		action,
		customCtxAndArgs({
			args: {
				orgs: v.optional(v.string()),
				_trace: v.optional(
					v.object({
						traceId: v.string(),
						spanId: v.string(),
						parentSpanId: v.optional(v.string()),
						requestId: v.optional(v.string()),
					})
				),
			},
			input: async (ctx, args) => {
				const startTime = Date.now();
				const enabled = isTracingEnabled();

				let traceCtx: TraceContext | undefined;
				let authCtx: ReturnType<typeof extractAuthContext> | undefined;

				if (!auth) {
					if (enabled) {
						traceCtx = createTraceContext(
							"unknown_action",
							"action",
							args._trace as TraceContext | undefined
						);
					}
					return {
						ctx:
							enabled && traceCtx
								? extendActionCtxWithTracing(
										ctx,
										traceCtx,
										startTime,
										authCtx
									)
								: ctx,
						args: stripTraceFromArgs(args),
					};
				}

				const identity = await ctx.auth.getUserIdentity();
				if (identity === null) {
					throw createError({
						code: "auth",
						status: 401,
						devMessage: "Authentication required",
						context: { location: "createTracedAction" },
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

				authCtx = extractAuthContext(identity);

				if (enabled) {
					traceCtx = createTraceContext(
						"action",
						"action",
						args._trace as TraceContext | undefined
					);
				}

				return {
					ctx: {
						...ctx,
						role: identity.role,
						subject: identity.subject,
						email: identity.email,
						org_id: identity.org_id,
						permissions: identity.permissions,
						roles: identity.roles,
						...(enabled && traceCtx
							? {
									_tracing: {
										enabled: true,
										trace: traceCtx,
										startTime,
										authContext: authCtx,
									},
								}
							: {}),
					},
					args: stripTraceFromArgs(args),
				};
			},
		})
	);

// ============================================================================
// EXPLICIT TRACING HELPERS (for use inside handlers)
// ============================================================================

/**
 * Record a trace span from within a mutation handler.
 *
 * Call this at the end of your handler to persist the span.
 * The _tracing metadata is available on ctx when using createTracedMutation.
 *
 * @example
 * ```ts
 * const myMutation = createTracedMutation(["admin"]);
 * export const doThing = myMutation({
 *   args: { id: v.string() },
 *   handler: async (ctx, args) => {
 *     const result = await doWork(ctx, args);
 *     await recordMutationSpan(ctx, { functionName: "deals.doThing", args, result });
 *     return result;
 *   }
 * });
 * ```
 */
export async function recordMutationSpan(
	ctx: MutationCtx & { _tracing?: TracingMetadata },
	opts: { functionName: string; args?: unknown; result?: unknown; error?: Error }
) {
	const tracing = ctx._tracing;
	if (!tracing?.enabled) return;

	const endTime = Date.now();
	const span = buildSpanData({
		trace: tracing.trace,
		functionName: opts.functionName,
		functionType: "mutation",
		startTime: tracing.startTime,
		endTime,
		status: opts.error ? "error" : "completed",
		args: opts.args,
		result: opts.error ? undefined : opts.result,
		error: opts.error,
		authContext: tracing.authContext,
	});

	// Use scheduler to avoid blocking the mutation
	const { internal } = await import("../_generated/api");
	await ctx.scheduler.runAfter(0, internal.traces.recordSpan, span);
}

/**
 * Record a trace span from within an action handler.
 */
export async function recordActionSpan(
	ctx: ActionCtx & { _tracing?: TracingMetadata },
	opts: { functionName: string; args?: unknown; result?: unknown; error?: Error }
) {
	const tracing = ctx._tracing;
	if (!tracing?.enabled) return;

	const endTime = Date.now();
	const span = buildSpanData({
		trace: tracing.trace,
		functionName: opts.functionName,
		functionType: "action",
		startTime: tracing.startTime,
		endTime,
		status: opts.error ? "error" : "completed",
		args: opts.args,
		result: opts.error ? undefined : opts.result,
		error: opts.error,
		authContext: tracing.authContext,
	});

	const { internal } = await import("../_generated/api");
	await ctx.runMutation(internal.traces.recordSpan, span);
}

/**
 * Get the trace context from a traced mutation/action context.
 * Use this to propagate trace context to child function calls.
 *
 * @example
 * ```ts
 * const childArgs = {
 *   ...args,
 *   _trace: getTraceFromCtx(ctx),
 * };
 * await ctx.runMutation(internal.other.doThing, childArgs);
 * ```
 */
export function getTraceFromCtx(ctx: {
	_tracing?: TracingMetadata;
}): TraceContext | undefined {
	if (!ctx._tracing?.enabled) return ;
	return {
		traceId: ctx._tracing.trace.traceId,
		spanId: ctx._tracing.trace.spanId,
		parentSpanId: ctx._tracing.trace.parentSpanId,
		requestId: ctx._tracing.trace.requestId,
	};
}

// ============================================================================
// INTERNAL UTILITIES
// ============================================================================

type TracingMetadata = {
	enabled: boolean;
	trace: TraceContext;
	startTime: number;
	authContext?: {
		subject?: string;
		role?: string;
		org_id?: string;
		permissions?: string[];
	};
};

/** Strip the _trace field from args before passing to handler */
function stripTraceFromArgs<T extends Record<string, unknown>>(
	args: T
): Omit<T, "_trace"> {
	const { _trace, ...rest } = args;
	return rest as Omit<T, "_trace">;
}

/** Extend mutation ctx with tracing metadata */
function extendCtxWithTracing(
	ctx: MutationCtx,
	trace: TraceContext,
	startTime: number,
	authContext?: TracingMetadata["authContext"]
) {
	return {
		...ctx,
		_tracing: {
			enabled: true,
			trace,
			startTime,
			authContext,
		},
	};
}

/** Extend action ctx with tracing metadata */
function extendActionCtxWithTracing(
	ctx: ActionCtx,
	trace: TraceContext,
	startTime: number,
	authContext?: TracingMetadata["authContext"]
) {
	return {
		...ctx,
		_tracing: {
			enabled: true,
			trace,
			startTime,
			authContext,
		},
	};
}

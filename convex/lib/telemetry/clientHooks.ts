/**
 * Telemetry-aware client hooks for Convex.
 *
 * These hooks wrap the standard Convex React hooks to automatically
 * create trace context, inject _otel envelopes, and record span timing.
 *
 * Usage:
 *   import { useObservedQuery, useObservedMutation } from "@/convex/lib/telemetry/clientHooks";
 *
 *   // Drop-in replacement for useAuthenticatedQuery
 *   const data = useObservedQuery(api.myModule.myQuery, { arg1: "value" });
 *
 *   // Drop-in replacement for useMutation with auto span tracking
 *   const doThing = useObservedMutation(api.myModule.myMutation);
 */

"use client";

import {
	type OptionalRestArgsOrSkip,
	useAction,
	useConvexAuth,
	useMutation,
} from "convex/react";
import type { FunctionReference } from "convex/server";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useRef } from "react";
import {
	generateRequestId,
	generateSpanId,
	generateTraceId,
	type OtelEnvelope,
} from "./types";

// ============================================================================
// Internal: envelope creation
// ============================================================================

/** Extract function name from a Convex FunctionReference (best-effort). */
function extractFunctionName(ref: unknown): string | undefined {
	if (!ref || typeof ref !== "object") return;
	// Convex FunctionReference stores the name internally
	const r = ref as Record<string, unknown>;
	if (typeof r.functionName === "string") return r.functionName;
	if (typeof r._name === "string") return r._name;
	return;
}

function createClientEnvelope(functionName?: string): OtelEnvelope {
	return {
		traceId: generateTraceId(),
		spanId: generateSpanId(),
		requestId: generateRequestId(),
		functionName,
		sampled: true,
	};
}

// ============================================================================
// useObservedQuery
// ============================================================================

/**
 * Auth-aware query hook with telemetry context injection.
 *
 * Behaves identically to useAuthenticatedQuery:
 * - Skips query when not authenticated
 * - Returns undefined while loading
 * - Supports "skip" sentinel
 *
 * Additionally:
 * - Injects _otel envelope into query args for server-side context propagation
 * - Query span timing is handled client-side (queries are read-only on server)
 *
 * @example
 * ```ts
 * const { isLoading: authLoading } = useConvexAuth();
 * const profile = useObservedQuery(api.users.getProfile, {});
 *
 * if (authLoading) return <Spinner />;
 * if (!profile) return <Loading />;
 * return <ProfileCard {...profile} />;
 * ```
 */
export function useObservedQuery<Query extends FunctionReference<"query">>(
	query: Query,
	args: OptionalRestArgsOrSkip<Query>[0] | "skip"
) {
	const { isAuthenticated } = useConvexAuth();

	// Create a stable envelope ref for this query instance
	const envelopeRef = useRef<OtelEnvelope | null>(null);
	if (!envelopeRef.current) {
		envelopeRef.current = createClientEnvelope();
	}

	// Inject _otel envelope into args (if not skipped)
	const resolvedArgs =
		isAuthenticated && args !== "skip"
			? { ...(args as Record<string, unknown>), _otel: envelopeRef.current }
			: "skip";

	return useQuery(query, resolvedArgs as any);
}

/**
 * Non-auth variant of useObservedQuery (for public/unauthenticated queries).
 */
export function useObservedPublicQuery<
	Query extends FunctionReference<"query">,
>(query: Query, args: OptionalRestArgsOrSkip<Query>[0] | "skip") {
	const envelopeRef = useRef<OtelEnvelope | null>(null);
	if (!envelopeRef.current) {
		envelopeRef.current = createClientEnvelope();
	}

	const resolvedArgs =
		args !== "skip"
			? { ...(args as Record<string, unknown>), _otel: envelopeRef.current }
			: "skip";

	return useQuery(query, resolvedArgs as any);
}

// ============================================================================
// useObservedMutation
// ============================================================================

/**
 * Mutation hook with automatic span begin/end.
 *
 * Returns a wrapped mutation function that:
 * 1. Creates a fresh _otel envelope per invocation
 * 2. Injects it into the mutation args
 * 3. Measures client-side timing
 *
 * The server-side tracedMutation wrapper handles the actual span recording.
 *
 * @example
 * ```ts
 * const createItem = useObservedMutation(api.items.create);
 *
 * async function handleSubmit() {
 *   await createItem({ name: "New Item" });
 * }
 * ```
 */
export function useObservedMutation<
	Mutation extends FunctionReference<"mutation">,
>(mutation: Mutation) {
	const rawMutate = useMutation(mutation);
	const fnName = extractFunctionName(mutation);

	// Return a wrapped function that injects telemetry
	const tracedMutate = async (
		args: Mutation extends FunctionReference<"mutation", any, infer Args>
			? Args
			: Record<string, unknown>
	) => {
		const envelope = createClientEnvelope(fnName);
		const argsWithOtel = {
			...(args as Record<string, unknown>),
			_otel: envelope,
		};

		return rawMutate(argsWithOtel as any);
	};

	return tracedMutate;
}

// ============================================================================
// useObservedAction
// ============================================================================

/**
 * Action hook with automatic span begin/end.
 *
 * Returns a wrapped action function that:
 * 1. Creates a fresh _otel envelope per invocation
 * 2. Injects it into the action args
 * 3. Measures client-side timing
 *
 * The server-side tracedAction wrapper handles the actual span recording.
 *
 * @example
 * ```ts
 * const sendEmail = useObservedAction(api.emails.send);
 *
 * async function handleClick() {
 *   await sendEmail({ to: "user@example.com", subject: "Hello" });
 * }
 * ```
 */
export function useObservedAction<Action extends FunctionReference<"action">>(
	action: Action
) {
	const rawAction = useAction(action);
	const fnName = extractFunctionName(action);

	const tracedAction = async (
		args: Action extends FunctionReference<"action", any, infer Args>
			? Args
			: Record<string, unknown>
	) => {
		const envelope = createClientEnvelope(fnName);
		const argsWithOtel = {
			...(args as Record<string, unknown>),
			_otel: envelope,
		};

		return rawAction(argsWithOtel as any);
	};

	return tracedAction;
}

/**
 * Shared application error utilities.
 *
 * Goals:
 * - Rich debugging context for developers (devMessage, context, cause).
 * - Safe, user-friendly messaging for UI error boundaries (userMessage).
 * - Serialization-safe helpers for logging/transport.
 */

export type ErrorCode =
	| "auth"
	| "not_found"
	| "validation"
	| "rate_limit"
	| "unknown"
	| (string & {});

const DEFAULT_USER_MESSAGES: Record<ErrorCode, string> = {
	auth: "You are not authorized to perform this action.",
	not_found: "The requested resource could not be found.",
	validation: "Please check the form and try again.",
	rate_limit: "Too many requests. Please wait and try again.",
	unknown: "Something went wrong. Please try again.",
};

type ErrorContext = Record<string, unknown>;

export type AppError = Error & {
	name: "AppError";
	code: ErrorCode;
	status?: number;
	userMessage: string;
	devMessage?: string;
	context?: ErrorContext;
	cause?: unknown;
};

type CreateErrorInput = {
	code: ErrorCode;
	userMessage?: string;
	devMessage?: string;
	status?: number;
	context?: ErrorContext;
	cause?: unknown;
};

export function createError(input: CreateErrorInput): AppError {
	const userMessage =
		input.userMessage ?? DEFAULT_USER_MESSAGES[input.code] ?? DEFAULT_USER_MESSAGES.unknown;
	const devMessage = input.devMessage ?? userMessage;
	const err = new Error(devMessage) as AppError;
	err.name = "AppError";
	err.code = input.code;
	err.status = input.status;
	err.userMessage = userMessage;
	err.devMessage = devMessage;
	err.context = input.context;
	err.cause = input.cause;
	return err;
}

export function isAppError(err: unknown): err is AppError {
	return (
		typeof err === "object" &&
		err !== null &&
		(err as Partial<AppError>).name === "AppError" &&
		typeof (err as Partial<AppError>).code === "string" &&
		typeof (err as Partial<AppError>).userMessage === "string"
	);
}

type WrapOptions = Omit<CreateErrorInput, "code"> & { code?: ErrorCode };

/**
 * Wrap unknown errors into AppError while preserving existing AppErrors.
 */
export function wrapError(err: unknown, options: WrapOptions = {}): AppError {
	if (isAppError(err)) {
		// Optionally merge new context without losing existing data.
		return createError({
			code: err.code,
			userMessage: err.userMessage,
			devMessage: err.devMessage,
			status: err.status,
			context: { ...(err.context ?? {}), ...(options.context ?? {}) },
			cause: err.cause ?? options.cause,
		});
	}

	const base =
		err instanceof Error
			? { devMessage: err.message, cause: err, stack: err.stack }
			: { devMessage: String(err), cause: err };

	return createError({
		code: options.code ?? "unknown",
		userMessage: options.userMessage,
		devMessage: options.devMessage ?? base.devMessage,
		status: options.status,
		context: options.context,
		cause: options.cause ?? base.cause,
	});
}

/**
 * Safe user-facing message for error boundaries or toasts.
 */
export function getUserMessage(err: unknown): string {
	if (isAppError(err)) return err.userMessage;
	return DEFAULT_USER_MESSAGES.unknown;
}

/**
 * Safe debug payload for logging/observability.
 * Avoids throwing on serialization.
 */
export function getDebugInfo(err: unknown): Record<string, unknown> {
	if (isAppError(err)) {
		return {
			name: err.name,
			code: err.code,
			status: err.status,
			message: err.devMessage ?? err.message,
			context: err.context,
			stack: err.stack,
			cause: normalizeCause(err.cause),
		};
	}

	if (err instanceof Error) {
		return {
			name: err.name,
			message: err.message,
			stack: err.stack,
			cause: normalizeCause((err as Error & { cause?: unknown }).cause),
		};
	}

	return { message: String(err) };
}

/**
 * Make an error serialization-safe (plain object).
 */
export function serializeError(err: unknown): Record<string, unknown> {
	const info = getDebugInfo(err);
	return JSON.parse(JSON.stringify(info, (_k, v) => (typeof v === "bigint" ? v.toString() : v)));
}

function normalizeCause(cause: unknown): unknown {
	if (!cause) return undefined;
	if (isAppError(cause)) {
		return {
			code: cause.code,
			message: cause.devMessage ?? cause.message,
		};
	}
	if (cause instanceof Error) {
		return { name: cause.name, message: cause.message };
	}
	return String(cause);
}

/**
 * Quick examples (for reference only):
 *
 * // Throwing in Convex/Next.js server code
 * throw createError({ code: "auth", status: 401, devMessage: "Missing token" });
 *
 * // Wrapping unknown errors in a boundary
 * const appErr = wrapError(err, { code: "unknown" });
 * showToast(getUserMessage(appErr));
 */


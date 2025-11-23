// Logger adapter that wraps Pino for server-side logging
// This module provides a standardized logging interface compatible with the logger abstraction

import type { Logger } from "./logger";

export function createPinoAdapter(): Logger {
	// In a real implementation, this would create a proper Pino logger instance
	// For now, we provide a console-based implementation that matches the expected interface

	const baseLogger = {
		trace: (msg: string | Error, meta?: Record<string, unknown>) => {
			if (process.env.NODE_ENV === "development") {
				console.debug("[trace]", msg, meta);
			}
		},
		debug: (msg: string | Error, meta?: Record<string, unknown>) => {
			if (process.env.NODE_ENV === "development") {
				console.debug("\u001b[36m🐞 [debug]\u001b[0m", msg, meta);
			}
		},
		info: (msg: string | Error, meta?: Record<string, unknown>) => {
			console.info("\u001b[32mℹ️ [info]\u001b[0m", msg, meta);
		},
		warn: (msg: string | Error, meta?: Record<string, unknown>) => {
			console.warn("\u001b[33m⚠️ [warn]\u001b[0m", msg, meta);
		},
		error: (msg: string | Error, meta?: Record<string, unknown>) => {
			console.error("\u001b[31m🔥 [error]\u001b[0m", msg, meta);
		},
		child: (ctx: Record<string, unknown>): Logger => {
			// Return a new logger with the context merged
			return {
				...baseLogger,
				trace: (msg: string | Error, meta?: Record<string, unknown>) =>
					baseLogger.trace(msg, { ...ctx, ...meta }),
				debug: (msg: string | Error, meta?: Record<string, unknown>) =>
					baseLogger.debug(msg, { ...ctx, ...meta }),
				info: (msg: string | Error, meta?: Record<string, unknown>) =>
					baseLogger.info(msg, { ...ctx, ...meta }),
				warn: (msg: string | Error, meta?: Record<string, unknown>) =>
					baseLogger.warn(msg, { ...ctx, ...meta }),
				error: (msg: string | Error, meta?: Record<string, unknown>) =>
					baseLogger.error(msg, { ...ctx, ...meta }),
			};
		},
	};

	return baseLogger;
}

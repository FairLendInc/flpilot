// Lightweight logger shim for Convex server functions. Writes to stdout via console but
// exposes the same `logger` contract so Convex functions can import it and remain
// compatible with the central `lib/logger` in future.

export type Logger = {
	trace: (msg: string | Error, meta?: Record<string, any>) => void;
	debug: (msg: string | Error, meta?: Record<string, any>) => void;
	info: (msg: string | Error, meta?: Record<string, any>) => void;
	warn: (msg: string | Error, meta?: Record<string, any>) => void;
	error: (msg: string | Error, meta?: Record<string, any>) => void;
	child: (ctx: Record<string, any>) => Logger;
};

const base: Logger = {
	trace: (m, meta) => console.debug("[trace]", m, meta),
	debug: (m, meta) => console.debug("🐞 [debug]", m, meta),
	info: (m, meta) => console.info("ℹ️ [info]", m, meta),
	warn: (m, meta) => console.warn("⚠️ [warn]", m, meta),
	error: (m, meta) => console.error("🔥 [error]", m, meta),
	child: () => base,
};

export const logger = base;
export default logger;

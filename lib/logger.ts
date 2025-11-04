// Centralized logger abstraction used across server, client and Convex functions.
// The logger exposes: trace/debug/info/warn/error and child()
// On server we attempt to use a pino adapter (lazy require). On client we fall back
// to a batching beacon adapter (clientAdapter).

type LogMeta = Record<string, any> | undefined;

export type Logger = {
	trace: (msg: string | Error, meta?: LogMeta) => void;
	debug: (msg: string | Error, meta?: LogMeta) => void;
	info: (msg: string | Error, meta?: LogMeta) => void;
	warn: (msg: string | Error, meta?: LogMeta) => void;
	error: (msg: string | Error, meta?: LogMeta) => void;
	child: (ctx: Record<string, any>) => Logger;
};

let adapter: Logger | null = null;

const consoleAdapter: Logger = {
	trace: (m: string | Error, meta?: LogMeta) =>
		console.debug("[trace]", m, meta),
	debug: (m: string | Error, meta?: LogMeta) =>
		console.debug("\u001b[36m🐞 [debug]\u001b[0m", m, meta),
	info: (m: string | Error, meta?: LogMeta) =>
		console.info("\u001b[32mℹ️ [info]\u001b[0m", m, meta),
	warn: (m: string | Error, meta?: LogMeta) =>
		console.warn("\u001b[33m⚠️ [warn]\u001b[0m", m, meta),
	error: (m: string | Error, meta?: LogMeta) =>
		console.error("\u001b[31m🔥 [error]\u001b[0m", m, meta),
	child: (_ctx: Record<string, any>) => consoleAdapter,
};

export function setLoggerAdapter(a: Logger) {
	adapter = a;
}

function ensureAdapter(): Logger {
	if (adapter) return adapter;

	// Attempt to wire a server-side pino adapter when running under Node
	if (typeof window === "undefined") {
		try {
			// Use require to avoid bundling pino into client bundles.
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const { createPinoAdapter } = require("./pinoAdapter");
			const p = createPinoAdapter();
			adapter = p;
			return p;
		} catch (e) {
			// Fall back to console adapter if pino isn't available or fails to initialize
			// (do not throw)
			// eslint-disable-next-line no-console
			console.warn(
				"pino adapter not available, falling back to console adapter",
				e
			);
			adapter = consoleAdapter;
			return adapter;
		}
	}

	// Client-side: try to lazy-require the client adapter if present.
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { createClientAdapter } = require("./clientAdapter");
		const clientAdapter = createClientAdapter();
		adapter = clientAdapter;
		return clientAdapter;
	} catch (_e) {
		adapter = consoleAdapter;
		return adapter;
	}
}

export const logger = {
	trace: (m: string | Error, meta?: LogMeta) => ensureAdapter().trace(m, meta),
	debug: (m: string | Error, meta?: LogMeta) => ensureAdapter().debug(m, meta),
	info: (m: string | Error, meta?: LogMeta) => ensureAdapter().info(m, meta),
	warn: (m: string | Error, meta?: LogMeta) => ensureAdapter().warn(m, meta),
	error: (m: string | Error, meta?: LogMeta) => ensureAdapter().error(m, meta),
	child: (ctx: Record<string, any>) => ensureAdapter().child(ctx),
};

export default logger;

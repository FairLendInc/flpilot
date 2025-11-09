// Use runtime require for pino to avoid TypeScript/compile-time dependency when pino isn't installed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pino: typeof import("pino") | null = null;
try {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	pino = require("pino");
} catch (_e) {
	pino = null;
}

const DEFAULT_SERVICE = process.env.LOG_SERVICE_NAME || "convex-next-authkit";
const LOG_PRETTY =
	process.env.LOG_PRETTY === "true" || process.env.NODE_ENV !== "production";
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

function levelToEmoji(levelNum: number) {
	switch (levelNum) {
		case 10:
			return "🔍";
		case 20:
			return "🐞";
		case 30:
			return "ℹ️";
		case 40:
			return "⚠️";
		case 50:
			return "🔥";
		case 60:
			return "💀";
		default:
			return "";
	}
}

function createConsoleAdapter() {
	const make = (prefix?: string) => ({
		trace: (m: string | Error, meta?: Record<string, unknown>) =>
			console.debug(prefix ?? "", m, meta),
		debug: (m: string | Error, meta?: Record<string, unknown>) =>
			console.debug(prefix ?? "", m, meta),
		info: (m: string | Error, meta?: Record<string, unknown>) =>
			console.info(prefix ?? "", m, meta),
		warn: (m: string | Error, meta?: Record<string, unknown>) =>
			console.warn(prefix ?? "", m, meta),
		error: (m: string | Error, meta?: Record<string, unknown>) =>
			console.error(prefix ?? "", m, meta),
		child: (ctx: Record<string, unknown>) => make(`${JSON.stringify(ctx)}`),
	});
	return make();
}

export function createPinoAdapter() {
	// If pino isn't available, return a console-based adapter compatible with expected methods.
	if (!pino) return createConsoleAdapter();

	// Pino logger instance - dynamically typed since pino is optional dependency
	// biome-ignore lint/suspicious/noExplicitAny: pino is runtime-loaded optional dependency, complex types
	let instance: any;
	try {
		if (LOG_PRETTY && typeof pino.transport === "function") {
			const transport = pino.transport({
				target: "pino-pretty",
				options: {
					colorize: true,
					ignore: "pid,hostname",
					translateTime: "SYS:standard",
					singleLine: false,
					messageFormat: (log: Record<string, unknown>, messageKey: string) => {
						const emoji = levelToEmoji(log.level);
						const msg = log[messageKey] ?? "";
						const maybeErr = log.err
							? `\n${log.err.stack || JSON.stringify(log.err)}`
							: "";
						const meta = Object.keys(log).filter(
							(k) => ![messageKey, "level", "time", "err"].includes(k)
						).length
							? ` ${JSON.stringify(Object.fromEntries(Object.entries(log).filter(([k]) => ![messageKey, "level", "time", "err"].includes(k))))}`
							: "";
						return `${emoji} ${msg}${maybeErr}${meta}`;
					},
				},
			});
			instance = pino(
				{
					level: LOG_LEVEL,
					base: { service: DEFAULT_SERVICE },
					timestamp: pino.stdTimeFunctions.isoTime,
				},
				transport
			);
		} else {
			instance = pino({
				level: LOG_LEVEL,
				base: { service: DEFAULT_SERVICE },
				timestamp: pino.stdTimeFunctions.isoTime,
			});
		}
	} catch (_err) {
		// On any error while configuring pino, fall back to console adapter
		return createConsoleAdapter();
	}

	const adapter = {
		trace: (msg: string | Error, meta?: Record<string, unknown>) => {
			if (msg instanceof Error)
				instance.trace({ err: msg, ...meta }, msg.message);
			else instance.trace({ ...meta }, msg);
		},
		debug: (msg: string | Error, meta?: Record<string, unknown>) => {
			if (msg instanceof Error)
				instance.debug({ err: msg, ...meta }, msg.message);
			else instance.debug({ ...meta }, msg);
		},
		info: (msg: string | Error, meta?: Record<string, unknown>) => {
			if (msg instanceof Error)
				instance.info({ err: msg, ...meta }, msg.message);
			else instance.info({ ...meta }, msg);
		},
		warn: (msg: string | Error, meta?: Record<string, unknown>) => {
			if (msg instanceof Error)
				instance.warn({ err: msg, ...meta }, msg.message);
			else instance.warn({ ...meta }, msg);
		},
		error: (msg: string | Error, meta?: Record<string, unknown>) => {
			if (msg instanceof Error)
				instance.error({ err: msg, ...meta }, msg.message);
			else instance.error({ ...meta }, msg);
		},
		child: (ctx: Record<string, unknown>) => {
			const child = instance.child(ctx);
			return {
				trace: (m: string | Error, meta?: Record<string, unknown>) => {
					if (m instanceof Error) child.trace({ err: m, ...meta }, m.message);
					else child.trace({ ...meta }, m);
				},
				debug: (m: string | Error, meta?: Record<string, unknown>) => {
					if (m instanceof Error) child.debug({ err: m, ...meta }, m.message);
					else child.debug({ ...meta }, m);
				},
				info: (m: string | Error, meta?: Record<string, unknown>) => {
					if (m instanceof Error) child.info({ err: m, ...meta }, m.message);
					else child.info({ ...meta }, m);
				},
				warn: (m: string | Error, meta?: Record<string, unknown>) => {
					if (m instanceof Error) child.warn({ err: m, ...meta }, m.message);
					else child.warn({ ...meta }, m);
				},
				error: (m: string | Error, meta?: Record<string, unknown>) => {
					if (m instanceof Error) child.error({ err: m, ...meta }, m.message);
					else child.error({ ...meta }, m);
				},
				child: (c: Record<string, unknown>) => adapter.child({ ...ctx, ...c }),
			};
		},
	};

	return adapter;
}

export default createPinoAdapter;

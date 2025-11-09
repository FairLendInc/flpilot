// Client-side logger adapter: batches logs and sends to /api/logs
type LogEntry = {
	level: string;
	msg: string;
	meta?: Record<string, unknown>;
	time?: string;
};

export function createClientAdapter() {
	const queue: LogEntry[] = [];
	let timer: number | undefined;
	const FLUSH_INTERVAL = 1000;
	const MAX_BATCH = 50;

	function flush() {
		if (!queue.length) return;
		const payload = queue.splice(0, queue.length);
		const body = JSON.stringify(payload);
		// Try sendBeacon first (best-effort, non-blocking) then fetch fallback
		try {
			if (navigator && "sendBeacon" in navigator && navigator.sendBeacon) {
				navigator.sendBeacon("/api/logs", body);
				return;
			}
		} catch (_e) {
			// ignore
		}
		fetch("/api/logs", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body,
		}).catch(() => {
			// ignore
			console.error("Failed to send logs to server");
		});
	}

	function scheduleFlush() {
		if (timer) return;
		timer = window.setTimeout(() => {
			flush();
			timer = undefined;
		}, FLUSH_INTERVAL);
	}

	const adapter = {
		trace: (m: string | Error, meta?: Record<string, unknown>) => {
			queue.push({
				level: "trace",
				msg: typeof m === "string" ? m : m.message,
				meta,
				time: new Date().toISOString(),
			});
			if (queue.length >= MAX_BATCH) flush();
			else scheduleFlush();
		},
		debug: (m: string | Error, meta?: Record<string, unknown>) => {
			queue.push({
				level: "debug",
				msg: typeof m === "string" ? m : m.message,
				meta,
				time: new Date().toISOString(),
			});
			if (queue.length >= MAX_BATCH) flush();
			else scheduleFlush();
		},
		info: (m: string | Error, meta?: Record<string, unknown>) => {
			queue.push({
				level: "info",
				msg: typeof m === "string" ? m : m.message,
				meta,
				time: new Date().toISOString(),
			});
			if (queue.length >= MAX_BATCH) flush();
			else scheduleFlush();
		},
		warn: (m: string | Error, meta?: Record<string, unknown>) => {
			queue.push({
				level: "warn",
				msg: typeof m === "string" ? m : m.message,
				meta,
				time: new Date().toISOString(),
			});
			if (queue.length >= MAX_BATCH) flush();
			else scheduleFlush();
		},
		error: (m: string | Error, meta?: Record<string, unknown>) => {
			queue.push({
				level: "error",
				msg: typeof m === "string" ? m : m.message,
				meta,
				time: new Date().toISOString(),
			});
			if (queue.length >= MAX_BATCH) flush();
			else scheduleFlush();
		},
		child: (_ctx: Record<string, unknown>) => adapter,
	};

	return adapter;
}

export default createClientAdapter;

import { NextResponse } from "next/server";
import { logger } from "../../../lib/logger";

export async function POST(req: Request) {
	const body = await req.json().catch(() => null);
	if (!body) return NextResponse.json({ ok: false }, { status: 400 });

	const logs = Array.isArray(body) ? body : [body];
	for (const l of logs) {
		const level = (l.level || "info").toLowerCase();
		const msg = l.msg || l.message || "client-log";
		const meta = { ...l.meta, _client: true };
		try {
			switch (level) {
				case "trace":
					logger.trace(msg, meta);
					break;
				case "debug":
					logger.debug(msg, meta);
					break;
				case "warn":
				case "warning":
					logger.warn(msg, meta);
					break;
				case "error":
					logger.error(msg, meta);
					break;
				default:
					logger.info(msg, meta);
			}
		} catch (e) {
			// swallow errors - ingestion should be best-effort
			try {
				logger.warn("Failed to ingest client log", { err: e });
			} catch (err) {
				// swallow errors - ingestion should be best-effort
				console.error("Failed to ingest client log", { err });
			}
		}
	}

	return NextResponse.json({ ok: true });
}

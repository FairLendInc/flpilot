import { env } from "./env";

/**
 * Ownership source configuration.
 *
 * Defaults to ledger unless explicitly set to "legacy".
 * Set OWNERSHIP_LEDGER_SOURCE=legacy to force DB source of truth.
 */
export function isLedgerSourceOfTruth(): boolean {
	const source = env.OWNERSHIP_LEDGER_SOURCE;
	return source === "ledger";
}

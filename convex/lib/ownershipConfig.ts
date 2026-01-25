/**
 * Ownership source configuration.
 *
 * Defaults to legacy DB reads unless explicitly set to "ledger".
 * Set OWNERSHIP_LEDGER_SOURCE=ledger to enable ledger source of truth.
 */
export function isLedgerSourceOfTruth(): boolean {
	const source = process.env.OWNERSHIP_LEDGER_SOURCE ?? "ledger";
	return source === "ledger";
}

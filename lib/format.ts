// Formatting helpers for numeric-heavy UI

export function formatUsdAbbrev(cents: number): string {
	if (!Number.isFinite(cents)) return "$0";
	const dollars = cents / 100;
	const abs = Math.abs(dollars);

	const sign = dollars < 0 ? "-" : "";
	const fmt = (n: number) =>
		new Intl.NumberFormat("en-US", {
			minimumFractionDigits: n % 1 === 0 ? 0 : 1,
			maximumFractionDigits: 1,
		}).format(Math.abs(n));

	if (abs >= 1_000_000_000) return `${sign}$${fmt(dollars / 1_000_000_000)}B`;
	if (abs >= 1_000_000) return `${sign}$${fmt(dollars / 1_000_000)}M`;
	if (abs >= 10_000) return `${sign}$${fmt(Math.round(dollars / 100) / 10)}k`; // one decimal for 10k+
	if (abs >= 1_000) return `${sign}$${Math.round(abs / 1000)}k`;

	return `${sign}${new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(abs)}`.replace("US$", "$");
}

export function formatUsdFull(cents: number): string {
	const dollars = cents / 100;
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(dollars);
}

export function formatPercent(
	value: number,
	opts?: { decimals?: number; suffix?: string }
) {
	const decimals = opts?.decimals ?? (value < 10 ? 1 : 0);
	const suffix = opts?.suffix ?? "%";
	return `${value.toFixed(decimals)}${suffix}`;
}

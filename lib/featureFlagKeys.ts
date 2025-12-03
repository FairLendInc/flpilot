export const featureFlagKeys = {
	demoFlag: "demo-flag",
} as const;

export type FeatureFlagKey = keyof typeof featureFlagKeys;

export function resolveFeatureFlagKey(key: FeatureFlagKey): string {
	return featureFlagKeys[key];
}

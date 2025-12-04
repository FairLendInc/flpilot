"use client";

import type { FeatureFlagKey } from "@/lib/featureFlagKeys";

type UseFeatureFlagResult = {
	value: boolean;
	isPending: boolean;
	error: unknown;
};

export function useFeatureFlag(
	_key: FeatureFlagKey,
	initialValue?: boolean
): UseFeatureFlagResult {
	return {
		value: initialValue ?? false,
		isPending: initialValue === undefined,
		error: null,
	};
}

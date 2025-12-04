import "server-only";

import { fetchQuery } from "convex/nextjs";
import { flag } from "flags/next";

import { api } from "@/convex/_generated/api";
import { type FeatureFlagKey, featureFlagKeys } from "@/lib/featureFlagKeys";

type FlagEntities = {
	userId?: string;
	role?: string;
	accessToken?: string;
};

async function evaluateFlagFromConvex(
	key: FeatureFlagKey,
	accessToken?: string
): Promise<boolean | null> {
	try {
		const value = await fetchQuery(
			api.flags.evaluateFlag,
			{
				key: featureFlagKeys[key],
			},
			accessToken ? { token: accessToken } : undefined
		);

		return value;
	} catch {
		return null;
	}
}

export async function getFeatureFlag(
	key: FeatureFlagKey,
	options?: {
		accessToken?: string;
		defaultValue?: boolean;
	}
): Promise<boolean> {
	const evaluated = await evaluateFlagFromConvex(key, options?.accessToken);
	if (evaluated !== null) {
		return evaluated;
	}

	return options?.defaultValue ?? false;
}

export const demoFlag = flag<boolean, FlagEntities>({
	key: featureFlagKeys.demoFlag,
	description: "Demo flag to verify Convex + Flags integration.",
	identify: ({ headers }) => {
		const userId = headers?.get("x-user-id") ?? undefined;
		const role = headers?.get("x-user-role") ?? undefined;
		const authHeader = headers?.get("authorization");
		const accessToken = authHeader?.replace("Bearer ", "") ?? undefined;

		return {
			userId,
			role,
			accessToken,
		} satisfies FlagEntities;
	},
	decide: async ({ entities }) =>
		(await evaluateFlagFromConvex("demoFlag", entities?.accessToken)) ?? false,
});

export const precomputeFlags = [demoFlag] as const;

export const flagRegistry = {
	demoFlag,
} as const;

export async function getFlags(options?: { accessToken?: string }): Promise<
	{
		key: string;
		description?: string;
		defaultValue: boolean;
		rules: {
			type: "global" | "user" | "role" | "percentage";
			value?: string | number;
			enabled: boolean;
		}[];
		updatedAt: number;
	}[]
> {
	const flags = await fetchQuery(
		api.flags.listFlags,
		{},
		options?.accessToken ? { token: options.accessToken } : undefined
	);

	return flags;
}

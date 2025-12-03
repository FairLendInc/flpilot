import { createFlagsDiscoveryEndpoint, getProviderData } from "flags/next";
import { NextResponse } from "next/server";

import { flagRegistry, getFlags } from "../../../../lib/flags";

const buildProviderData = async () => {
	const providerData = await getProviderData(flagRegistry);
	const storedFlags = await getFlags();

	const merged = { ...providerData.definitions };
	for (const flag of storedFlags) {
		const existing = merged[flag.key];
		if (existing) {
			merged[flag.key] = {
				...existing,
				description: existing.description || flag.description,
			};
		}
	}

	return { ...providerData, definitions: merged };
};

const handler = process.env.FLAGS_SECRET
	? createFlagsDiscoveryEndpoint(async () => buildProviderData(), {
			secret: process.env.FLAGS_SECRET,
		})
	: null;

export const GET =
	handler ??
	(() =>
		NextResponse.json(
			{ error: "FLAGS_SECRET is not configured" },
			{ status: 500 }
		));

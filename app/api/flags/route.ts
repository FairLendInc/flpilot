import { verifyAccess, version } from "flags";
import { getProviderData } from "flags/next";
import { type NextRequest, NextResponse } from "next/server";

import { flagRegistry, getFlags } from "@/lib/flags";

export async function GET(request: NextRequest) {
	if (!process.env.FLAGS_SECRET) {
		return NextResponse.json(
			{ error: "FLAGS_SECRET is not configured" },
			{ status: 500 }
		);
	}

	const access = await verifyAccess(request.headers.get("Authorization"));
	if (!access) {
		return NextResponse.json(null, { status: 401 });
	}

	const [providerData, storedFlags] = await Promise.all([
		getProviderData(flagRegistry),
		getFlags(),
	]);

	const mergedDefinitions = { ...providerData.definitions };
	for (const flag of storedFlags) {
		const definition = mergedDefinitions[flag.key];
		if (definition && !definition.description && flag.description) {
			mergedDefinitions[flag.key] = {
				...definition,
				description: flag.description,
			};
		}
	}

	return NextResponse.json(
		{ ...providerData, definitions: mergedDefinitions },
		{
			headers: { "x-flags-sdk-version": version },
		}
	);
}

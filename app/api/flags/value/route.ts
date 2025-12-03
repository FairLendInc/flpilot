import { verifyAccess } from "flags";
import { type NextRequest, NextResponse } from "next/server";

import { flagRegistry } from "@/lib/flags";

type FlagRegistryKey = keyof typeof flagRegistry;

export async function GET(request: NextRequest) {
	const access = await verifyAccess(request.headers.get("Authorization"));
	if (!access) {
		return NextResponse.json(null, { status: 401 });
	}

	const key = request.nextUrl.searchParams.get("key");

	if (!(key && key in flagRegistry)) {
		return NextResponse.json(
			{ error: "Unknown flag key" },
			{ status: 400, statusText: "Unknown flag key" }
		);
	}

	try {
		// Type narrowing: at this point we know key is a valid FlagRegistryKey
		const flag = flagRegistry[key as FlagRegistryKey];
		// biome-ignore lint/suspicious/noExplicitAny: NextRequest vs IncomingMessage mismatch
		const value = await flag(request as any);

		return NextResponse.json({ value });
	} catch (error) {
		return NextResponse.json(
			{ error: `Failed to retrieve flag value, error: ${error}` },
			{ status: 500 }
		);
	}
}

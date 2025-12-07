"use server";

import { saveSession } from "@workos-inc/authkit-nextjs";
import { AuthenticateWithPasswordOptions, WorkOS } from "@workos-inc/node";
import { NextRequest, NextResponse } from "next/server";
// import type { AuthenticateWithPasswordInput } from "@workos-inc/authkit-nextjs";

const workos = new WorkOS(process.env.WORKOS_API_KEY ?? "");
const RATE_LIMIT_WINDOW_MS = 5_000;
let lastAuthTimestamp = 0;

const isProd = process.env.NODE_ENV === "production";
const isEnabled = process.env.E2E_AUTH_ENABLED === "true";
const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD;
const authSecret = process.env.E2E_AUTH_SECRET;

const missingWorkosConfig =
	!process.env.WORKOS_CLIENT_ID ||
	!process.env.WORKOS_API_KEY ||
	!cookiePassword ||
	cookiePassword.length < 32;

type AuthRequestBody = {
	email?: string;
	password?: string;
	organizationId?: string;
};

function rateLimitGuard() {
	const now = Date.now();
	const diff = now - lastAuthTimestamp;
	if (diff < RATE_LIMIT_WINDOW_MS) {
		return {
			blocked: true,
			retryAfter: Math.ceil((RATE_LIMIT_WINDOW_MS - diff) / 1000),
		};
	}
	lastAuthTimestamp = now;
	return { blocked: false, retryAfter: 0 };
}

function forbidden(message: string, retryAfter?: number) {
	return NextResponse.json(
		{ error: message },
		{
			status: 403,
			headers: retryAfter ? { "Retry-After": `${retryAfter}` } : undefined,
		},
	);
}

export async function POST(req: NextRequest) {
	console.log("[e2e/auth] HIT POST /api/e2e/auth");
	// Allow in tests when explicitly enabled, block prod unless enabled.
	if (isProd && !isEnabled) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	if (!isEnabled) {
		return forbidden("E2E authentication helper disabled");
	}

	if (!authSecret) {
		return forbidden("Missing E2E auth secret");
	}

	const providedSecret = req.headers.get("x-e2e-auth-secret");
	if (!providedSecret || providedSecret !== authSecret) {
		return forbidden("Forbidden");
	}

	const { blocked, retryAfter } = rateLimitGuard();
	if (blocked) {
		return NextResponse.json(
			{ error: "Too many requests" },
			{ status: 429, headers: { "Retry-After": `${retryAfter}` } },
		);
	}

	if (missingWorkosConfig) {
		return NextResponse.json(
			{ error: "WorkOS configuration incomplete" },
			{ status: 500 },
		);
	}

	let body: AuthRequestBody;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const { email, password, organizationId } = body;
	if (!email || !password) {
		return NextResponse.json(
			{ error: "Email and password are required" },
			{ status: 400 },
		);
	}

	try {
		const authOptions: Record<string, unknown> = {
			clientId: process.env.WORKOS_CLIENT_ID!,
			email,
			password,
			...(organizationId ? { organizationId } : {}),
		};

		console.log(
			"[e2e/auth] authenticating",
			JSON.stringify(
				{
					email,
					hasPassword: Boolean(password),
					clientId: process.env.WORKOS_CLIENT_ID
						? "[set]"
						: "[missing]",
					organizationId: organizationId || "[none]",
					envEnabled: isEnabled,
					nodeEnv: process.env.NODE_ENV,
				},
				null,
				2
			)
		);

		const authOptionsTyped: AuthenticateWithPasswordOptions = {
			email,
			password,
			clientId: authOptions.clientId as string,
			// WorkOS requires the organizationId when the org enforces specific
			// authentication methods. We already logged it above, but the typed
			// object was dropping it, triggering `organization_authentication_methods_required`.
			...(organizationId ? { organizationId } : {}),
		};

		const authResponse =
			await workos.userManagement.authenticateWithPassword(
				authOptionsTyped as Parameters<
					typeof workos.userManagement.authenticateWithPassword
				>[0]
			);
		console.log("AUTH RESPONSE: ", authResponse);

		await saveSession(authResponse, req);

		const { user } = authResponse;
		const role =
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(user as any).role ??
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(user as any).workosRole ??
			null;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const permissions = ((user as any).permissions ?? []) as string[];

		return NextResponse.json(
			{
				ok: true,
				user: {
					id: user.id,
					email: user.email,
					role,
					permissions,
				},
			},
			{ status: 200 },
		);
	} catch (error) {
		const status =
			error instanceof Error && /invalid/i.test(error.message) ? 401 : 500;
		// Capture more details from WorkOS error (if present)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const err = error as any;
		const message =
			err?.message ??
			err?.rawData?.message ??
			err?.rawData?.error ??
			"Authentication failed";
		const code = err?.rawData?.code;
		console.error("[e2e/auth] error", { message, code, status });
		return NextResponse.json({ error: err }, { status });
	}
}

export async function GET() {
	return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}


"use strict";

import { request } from "@playwright/test";
import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";

// Load test/local env vars for Playwright runs
dotenv.config({ path: ".env.test.local" });
dotenv.config({ path: ".env.local", override: false });

type TestRole =
	| "lawyer"
	| "investor"
	| "broker"
	| "member";

type RoleConfig = {
	role: TestRole;
	emailEnv: string;
	passwordEnv: string;
};

// Single shared test account (set these to reuse one account for all roles)
const SHARED_E2E_EMAIL = process.env.E2E_SHARED_EMAIL;
const SHARED_E2E_PASSWORD = process.env.E2E_SHARED_PASSWORD;

const ROLES: RoleConfig[] = [
	// { role: "lawyer", emailEnv: "TEST_LAWYER", passwordEnv: "TEST_LAWYER_PASSWORD" },
	// {
	// 	role: "investor",
	// 	emailEnv: "TEST_INVESTOR",
	// 	passwordEnv: "TEST_INVESTOR_PASSWORD",
	// },
	{ role: "broker", emailEnv: "TEST_BROKER", passwordEnv: "TEST_BROKER_PASSWORD" },
	// { role: "member", emailEnv: "TEST_MEMBER", passwordEnv: "TEST_MEMBER_PASSWORD" },
];

const STORAGE_DIR = path.join(process.cwd(), ".playwright");
const SHARED_STORAGE_STATE =
	process.env.E2E_SHARED_STORAGE ??
	path.join(STORAGE_DIR, "shared.json");
const BASE_URL = "http://localhost:3000";
	// process.env.PLAYWRIGHT_BASE_URL ??
	// process.env.NEXT_PUBLIC_SITE_URL ??
	// "http://127.0.0.1:3000";
const E2E_SECRET = process.env.E2E_AUTH_SECRET ?? process.env.E2E_SECRET;
// Organization-scoped auth is disabled for e2e tests because WorkOS org policies
// can restrict auth methods (e.g., password disabled). For e2e, we authenticate
// at the project level which respects the project-wide auth settings.
const E2E_ORG_ID = null;
const RATE_LIMIT_PADDING_MS = 200;
const PLAYWRIGHT_FORCE_LOGIN = process.env.PLAYWRIGHT_FORCE_LOGIN === "true";

function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function authenticateRole(config: RoleConfig) {
	const email = SHARED_E2E_EMAIL ?? process.env[config.emailEnv];
	const password = SHARED_E2E_PASSWORD ?? process.env[config.passwordEnv];

	if (!email || !password) {
		throw new Error(
			`Missing credentials for role ${config.role}. Set E2E_SHARED_EMAIL and E2E_SHARED_PASSWORD to use the shared account for all roles.`,
		);
	}

	const context = await request.newContext({ baseURL: BASE_URL });
	const headers = { "x-e2e-auth-secret": E2E_SECRET ?? "" };
	console.log("email and pw: ", email, password);
	console.log("CONFIG: ", config);

	console.log(
		"[global-setup] authenticate",
		JSON.stringify(
			{
				role: config.role,
				email,
				// orgId: E2E_ORG_ID || "[none]",
				baseURL: BASE_URL,
				hasSecret: Boolean(E2E_SECRET),
			},
			null,
			2
		)
	);

	const payload = E2E_ORG_ID
		? { email, password, organizationId: E2E_ORG_ID }
		: { email, password };
	// const payload = { email, password };

	const postAuth = async () =>
		context.post("/api/e2e/auth", {
			data: payload,
			headers,
		});

	let response = await postAuth();
	if (response.status() === 429) {
		const retrySeconds =
			Number(response.headers()["retry-after"]) || 5;
		await delay(retrySeconds * 1000 + RATE_LIMIT_PADDING_MS);
		response = await postAuth();
	}

	if (!response.ok()) {
		const status = response.status();
		const payload = await response
			.json()
			.catch(async () => {
				try {
					const text = await response.text();
					return { error: text || "unknown" };
				} catch {
					return { error: "unknown" };
				}
			});
		console.error(
			"[global-setup] auth failed",
			JSON.stringify(
				{
					role: config.role,
					status,
					payload,
				},
				null,
				2
			)
		);
		throw new Error(
			`Authentication failed for ${config.role}: ${payload.error ?? "unknown error"}`,
		);
	}

	// Save to role-specific file for fixtures to load
	const roleStoragePath = path.join(STORAGE_DIR, `${config.role}.json`);
	await context.storageState({
		path: roleStoragePath,
	});
	// Also save to shared for backward compatibility
	await context.storageState({
		path: SHARED_STORAGE_STATE,
	});
	await context.dispose();
}

export default async function globalSetup() {
	await fs.mkdir(STORAGE_DIR, { recursive: true });

	const brokerStatePath = path.join(STORAGE_DIR, "broker.json");
	const brokerStateExists = await fs
		.access(brokerStatePath)
		.then(() => true)
		.catch(() => false);

	if (!PLAYWRIGHT_FORCE_LOGIN && brokerStateExists) {
		// Reuse existing state to avoid requiring credentials every run
		return;
	}

	if (!SHARED_E2E_EMAIL || !SHARED_E2E_PASSWORD) {
		throw new Error(
			"E2E_SHARED_EMAIL and E2E_SHARED_PASSWORD are required for global setup (shared account for all roles).",
		);
	}

	if (!E2E_SECRET) {
		throw new Error("E2E_AUTH_SECRET is required for global setup");
	}

	for (let i = 0; i < ROLES.length; i += 1) {
		// Respect the endpoint's rate limit window (5 seconds) before the next login.
		if (i > 0) {
			await delay(5_000 + RATE_LIMIT_PADDING_MS);
		}
		// eslint-disable-next-line no-await-in-loop
		await authenticateRole(ROLES[i]);
	}
}


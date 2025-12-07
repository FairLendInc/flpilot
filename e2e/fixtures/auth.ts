import { test as base } from "@playwright/test";
import path from "node:path";

type AuthFixtures = {
	lawyerPage: Awaited<ReturnType<typeof base["newPage"]>>;
	investorPage: Awaited<ReturnType<typeof base["newPage"]>>;
	brokerPage: Awaited<ReturnType<typeof base["newPage"]>>;
	memberPage: Awaited<ReturnType<typeof base["newPage"]>>;
};

const storageDir = path.join(process.cwd(), ".playwright");

async function useRolePage(
	role: "lawyer" | "investor" | "broker" | "member",
	browser: Parameters<typeof base.extend>[0]["browser"],
	use: (page: Awaited<ReturnType<typeof base["newPage"]>>) => Promise<void>,
) {
	const context = await browser.newContext({
		storageState: path.join(storageDir, `${role}.json`),
	});
	const page = await context.newPage();
	await use(page);
	await context.close();
}

export const test = base.extend<AuthFixtures>({
	lawyerPage: async ({ browser }, use) =>
		useRolePage("lawyer", browser, use),
	investorPage: async ({ browser }, use) =>
		useRolePage("investor", browser, use),
	brokerPage: async ({ browser }, use) => useRolePage("broker", browser, use),
	memberPage: async ({ browser }, use) => useRolePage("member", browser, use),
});

export const expect = test.expect;


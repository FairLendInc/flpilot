import { test as base, Browser, Page } from "@playwright/test";
import path from "node:path";

type AuthFixtures = {
	lawyerPage: Page;
	investorPage: Page;
	brokerPage: Page;
	memberPage: Page;
};

const storageDir = path.join(process.cwd(), ".playwright");

async function useRolePage(
	role: "lawyer" | "investor" | "broker" | "member",
	browser: Browser,
	use: (page: Page) => Promise<void>,
) {
	const context = await browser.newContext({
		storageState: path.join(storageDir, `${role}.json`),
	});
	const page = await context.newPage();
	await use(page);
	await context.close();
}

export const test = base.extend<AuthFixtures>({
	lawyerPage: async ({ browser }: { browser: Browser }, use: (page: Page) => Promise<void>) =>
		useRolePage("lawyer", browser, use),
	investorPage: async ({ browser }: { browser: Browser }, use: (page: Page) => Promise<void>) =>
		useRolePage("investor", browser, use),
	brokerPage: async ({ browser }: { browser: Browser }, use: (page: Page) => Promise<void>) => useRolePage("broker", browser, use),
	memberPage: async ({ browser }: { browser: Browser }, use: (page: Page) => Promise<void>) => useRolePage("member", browser, use),
});

export const expect = test.expect;


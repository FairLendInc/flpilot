// @vitest-environment node
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import type { ListingCreationPayload } from "../listings";
import schema from "../schema";

// @ts-ignore
const modules = import.meta.glob("../**/*.{ts,js,tsx,jsx}", { eager: false });
const createTest = () => convexTest(schema, modules);

const BASE_BORROWER = {
	name: "Taylor Fairlend",
	email: "taylor@example.com",
	rotessaCustomerId: "rotessa-abc",
};

const BASE_MORTGAGE = {
	loanAmount: 450000,
	interestRate: 6.1,
	originationDate: "2023-01-01",
	maturityDate: "2028-01-01",
	status: "active" as const,
	mortgageType: "1st" as const,
	address: {
		street: "123 Market St",
		city: "Toronto",
		state: "ON",
		zip: "M5J2N1",
		country: "Canada",
	},
	location: {
		lat: 43.6426,
		lng: -79.3871,
	},
	propertyType: "Single Family",
	appraisalMarketValue: 600000,
	appraisalMethod: "Sales Comparison",
	appraisalCompany: "Fair Appraisals Co",
	appraisalDate: "2023-12-15",
	ltv: 75,
	images: [] as ListingCreationPayload["mortgage"]["images"],
	documents: [] as ListingCreationPayload["mortgage"]["documents"],
	externalMortgageId: "external-mortgage-base",
};

const BASE_LISTING = {
	visible: true,
};

type OverrideOptions = {
	borrower?: Partial<ListingCreationPayload["borrower"]>;
	mortgage?: Partial<ListingCreationPayload["mortgage"]>;
	listing?: Partial<ListingCreationPayload["listing"]>;
};

const makePayload = (
	overrides: OverrideOptions = {}
): ListingCreationPayload => {
	const borrower = { ...BASE_BORROWER, ...(overrides.borrower ?? {}) };
	const mortgageOverrides = overrides.mortgage ?? {};
	const mortgage = {
		...BASE_MORTGAGE,
		...mortgageOverrides,
		address: {
			...BASE_MORTGAGE.address,
			...(mortgageOverrides.address ?? {}),
		},
		location: {
			...BASE_MORTGAGE.location,
			...(mortgageOverrides.location ?? {}),
		},
		images: mortgageOverrides.images ?? BASE_MORTGAGE.images,
		documents: mortgageOverrides.documents ?? BASE_MORTGAGE.documents,
	};
	const listing = { ...BASE_LISTING, ...(overrides.listing ?? {}) };
	return {
		borrower,
		mortgage,
		listing,
	};
};

const withAdminIdentity = (t: ReturnType<typeof createTest>) =>
	t.withIdentity({
		subject: "admin-user",
		tokenIdentifier: "test|admin-user",
		role: "admin",
	});

describe("listings.createFromPayload", () => {
	test("reuses borrower records when rotessa ID already exists", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);

		const firstPayload = makePayload({
			mortgage: { externalMortgageId: "borrower-reuse-1" },
		});
		const firstResult = await admin.mutation(
			api.listings.createFromPayload,
			firstPayload
		);

		const secondPayload = makePayload({
			mortgage: { externalMortgageId: "borrower-reuse-2" },
			listing: { visible: false },
		});
		const secondResult = await admin.mutation(
			api.listings.createFromPayload,
			secondPayload
		);

		expect(secondResult.borrowerId).toEqual(firstResult.borrowerId);

		const borrowers = await admin.run(
			async (ctx) => await ctx.db.query("borrowers").collect()
		);

		expect(borrowers).toHaveLength(1);
	});

	test("reuses mortgage when externalMortgageId repeats", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);

		const firstPayload = makePayload({
			mortgage: { externalMortgageId: "mortgage-idempotent" },
		});
		const firstResult = await admin.mutation(
			api.listings.createFromPayload,
			firstPayload
		);

		const secondPayload = makePayload({
			mortgage: {
				externalMortgageId: "mortgage-idempotent",
				loanAmount: 525000,
				appraisalMarketValue: 640000,
			},
			listing: { visible: false },
		});
		const secondResult = await admin.mutation(
			api.listings.createFromPayload,
			secondPayload
		);

		expect(secondResult.mortgageId).toEqual(firstResult.mortgageId);

		const mortgages = await admin.run(
			async (ctx) => await ctx.db.query("mortgages").collect()
		);

		expect(mortgages).toHaveLength(1);
		expect(mortgages[0]?.loanAmount).toBe(525000);
		expect(mortgages[0]?.appraisalMarketValue).toBe(640000);
	});

	test("returns existing listing on duplicate submissions", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);

		const payload = makePayload({
			mortgage: { externalMortgageId: "listing-idempotent" },
		});
		const firstResult = await admin.mutation(
			api.listings.createFromPayload,
			payload
		);

		const duplicatePayload = makePayload({
			mortgage: { externalMortgageId: "listing-idempotent" },
			listing: { visible: false },
		});
		const secondResult = await admin.mutation(
			api.listings.createFromPayload,
			duplicatePayload
		);

		expect(secondResult.created).toBe(false);
		expect(secondResult.listingId).toEqual(firstResult.listingId);

		const listings = await admin.run(
			async (ctx) => await ctx.db.query("listings").collect()
		);

		expect(listings).toHaveLength(1);
		expect(listings[0]?.visible).toBe(false);
	});
});

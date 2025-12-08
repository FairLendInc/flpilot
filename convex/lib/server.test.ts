import type { FunctionReference } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

// @ts-ignore
const modules = import.meta.glob("../**/*.{ts,js,tsx,jsx}", { eager: false });
const createTest = () => convexTest(schema, modules) as any;

// const NOT_AUTHENTICATED_ERROR_MESSAGE = "Authentication required";
const NOT_AUTHENTICATED_ERROR = /Authentication required/;
const FAIR_LEND_UNAUTHORIZED_MESSAGE =
	"Not authorized! Required Role(s): investor, lawyer, broker, admin, padmin, orgadmin";
const DEFAULT_ARGS = { id: "test" as const };
const DEFAULT_UNAUTHORIZED_REGEX = /Not authorized/;

type RoleKey =
	| "unauthenticated"
	| "member"
	| "investor"
	| "lawyer"
	| "broker"
	| "admin";
const identitiesByRole: Record<
	RoleKey,
	{ subject: string; role?: string } | undefined
> = {
	unauthenticated: undefined,
	member: { subject: "user-123", role: "member" },
	investor: { subject: "user-123", role: "investor" },
	lawyer: { subject: "user-123", role: "lawyer" },
	broker: { subject: "user-123", role: "broker" },
	admin: { subject: "user-123", role: "admin" },
};

type BaseCase = {
	label: string;
	expectedResult: string;
	successRoles: readonly RoleKey[];
	authRequired: boolean;
	unauthorizedRoles?: readonly RoleKey[];
	unauthorizedMessage?: string | RegExp;
};

type QueryCase = BaseCase & {
	kind: "query";
	fn: FunctionReference<"query", any, any, any, any>;
};

type MutationCase = BaseCase & {
	kind: "mutation";
	fn: FunctionReference<"mutation", any, any, any, any>;
};

type ActionCase = BaseCase & {
	kind: "action";
	fn: FunctionReference<"action", any, any, any, any>;
};

type MatrixEntry = QueryCase | MutationCase | ActionCase;

const equivalenceMatrix: readonly MatrixEntry[] = [
	{
		label: "Unauthenticated query",
		kind: "query",
		fn: api.authTests.testUnauthenticatedQuery,
		expectedResult: "DONE",
		successRoles: [
			"unauthenticated",
			"member",
			"investor",
			"lawyer",
			"broker",
			"admin",
		] as const,
		authRequired: false,
	},
	{
		label: "Authenticated query",
		kind: "query",
		fn: api.authTests.testAuthenticatedQuery,
		expectedResult: "DONE",
		successRoles: ["member", "investor", "lawyer", "broker", "admin"] as const,
		authRequired: true,
	},
	{
		label: "Fair lend role query",
		kind: "query",
		fn: api.authTests.testFairLendRoleQuery,
		expectedResult: "DONE",
		successRoles: ["investor", "lawyer", "broker", "admin"] as const,
		unauthorizedRoles: ["member"] as const,
		unauthorizedMessage: FAIR_LEND_UNAUTHORIZED_MESSAGE,
		authRequired: true,
	},
	{
		label: "Admin query",
		kind: "query",
		fn: api.authTests.testAdminQuery,
		expectedResult: "DONE",
		successRoles: ["admin"] as const,
		unauthorizedRoles: ["member", "broker"] as const,
		authRequired: true,
	},
	{
		label: "Broker query",
		kind: "query",
		fn: api.authTests.testBrokerQuery,
		expectedResult: "DONE",
		successRoles: ["broker", "admin"] as const,
		unauthorizedRoles: ["member", "investor"] as const,
		authRequired: true,
	},
	{
		label: "Unauthenticated mutation",
		kind: "mutation",
		fn: api.authTests.testUnauthenticatedMutation,
		expectedResult: "DONE",
		successRoles: [
			"unauthenticated",
			"member",
			"investor",
			"lawyer",
			"broker",
			"admin",
		] as const,
		authRequired: false,
	},
	{
		label: "Authenticated mutation",
		kind: "mutation",
		fn: api.authTests.testAuthenticatedMutation,
		expectedResult: "DONE",
		successRoles: ["member", "investor", "lawyer", "broker", "admin"] as const,
		authRequired: true,
	},
	{
		label: "Admin mutation",
		kind: "mutation",
		fn: api.authTests.testAdminMutation,
		expectedResult: "DONE",
		successRoles: ["admin"] as const,
		unauthorizedRoles: ["member", "investor"] as const,
		authRequired: true,
	},
	{
		label: "Broker mutation",
		kind: "mutation",
		fn: api.authTests.testBrokerMutation,
		expectedResult: "DONE",
		successRoles: ["broker", "admin"] as const,
		unauthorizedRoles: ["member", "investor"] as const,
		authRequired: true,
	},
	{
		label: "Investor mutation",
		kind: "mutation",
		fn: api.authTests.testInvestorMutation,
		expectedResult: "DONE",
		successRoles: ["investor", "admin"] as const,
		unauthorizedRoles: ["member", "broker"] as const,
		authRequired: true,
	},
	{
		label: "Fair lend role mutation",
		kind: "mutation",
		fn: api.authTests.testFairLendRoleMutation,
		expectedResult: "DONE",
		successRoles: ["investor", "lawyer", "broker", "admin"] as const,
		unauthorizedRoles: ["member"] as const,
		unauthorizedMessage: FAIR_LEND_UNAUTHORIZED_MESSAGE,
		authRequired: true,
	},
	{
		label: "Unauthenticated action",
		kind: "action",
		fn: api.authTests.testUnauthenticatedAction,
		expectedResult: "DONE",
		successRoles: [
			"unauthenticated",
			"member",
			"investor",
			"lawyer",
			"broker",
			"admin",
		] as const,
		authRequired: false,
	},
	{
		label: "Authenticated action",
		kind: "action",
		fn: api.authTests.testAuthenticatedAction,
		expectedResult: "DONE",
		successRoles: ["member", "investor", "lawyer", "broker", "admin"] as const,
		authRequired: true,
	},
	{
		label: "Admin action",
		kind: "action",
		fn: api.authTests.testAdminAction,
		expectedResult: "DONE",
		successRoles: ["admin"] as const,
		unauthorizedRoles: ["member", "investor"] as const,
		authRequired: true,
	},
	{
		label: "Broker action",
		kind: "action",
		fn: api.authTests.testBrokerAction,
		expectedResult: "DONE",
		successRoles: ["broker", "admin"] as const,
		unauthorizedRoles: ["member", "investor"] as const,
		authRequired: true,
	},
	{
		label: "Investor action",
		kind: "action",
		fn: api.authTests.testInvestorAction,
		expectedResult: "DONE",
		successRoles: ["investor", "admin"] as const,
		unauthorizedRoles: ["member", "broker"] as const,
		authRequired: true,
	},
	{
		label: "Fair lend role action",
		kind: "action",
		fn: api.authTests.testWithFairLendRoleAction,
		expectedResult: "DONE",
		successRoles: ["investor", "lawyer", "broker", "admin"] as const,
		unauthorizedRoles: ["member"] as const,
		unauthorizedMessage: FAIR_LEND_UNAUTHORIZED_MESSAGE,
		authRequired: true,
	},
] as const;

type TestContext = ReturnType<typeof createTest>;

const createClientForRole = (role: RoleKey): TestContext => {
	const base = createTest();
	const identity = identitiesByRole[role];

	if (!identity) {
		return base;
	}

	return base.withIdentity(identity);
};

const runOperation = (matrixEntry: MatrixEntry, testContext: TestContext) => {
	switch (matrixEntry.kind) {
		case "query":
			return testContext.query(matrixEntry.fn, DEFAULT_ARGS);
		case "mutation":
			return testContext.mutation(matrixEntry.fn, DEFAULT_ARGS);
		case "action":
			return testContext.action(matrixEntry.fn, DEFAULT_ARGS);
		default: {
			const _exhaustive: never = matrixEntry;
			throw new Error(`Unsupported operation kind: ${String(_exhaustive)}`);
		}
	}
};

describe("serverHelpers", () => {
	describe("equivalence and boundary coverage", () => {
		for (const matrixEntry of equivalenceMatrix) {
			const {
				kind,
				expectedResult,
				label,
				successRoles,
				authRequired,
				unauthorizedRoles,
				unauthorizedMessage,
			} = matrixEntry;

			describe(`${kind} | ${label}`, () => {
				test("accepts valid equivalence classes", async () => {
					for (const role of successRoles) {
						const client = createClientForRole(role);
						await expect(runOperation(matrixEntry, client)).resolves.toEqual(
							expectedResult
						);
					}
				});

				if (authRequired) {
					test("rejects unauthenticated boundary", async () => {
						const client = createClientForRole("unauthenticated");
						await expect(runOperation(matrixEntry, client)).rejects.toThrow(
							NOT_AUTHENTICATED_ERROR
						);
					});
				}

				if (unauthorizedRoles && unauthorizedRoles.length > 0) {
					test("rejects unauthorized boundary roles", async () => {
						const expectedError =
							unauthorizedMessage ?? DEFAULT_UNAUTHORIZED_REGEX;
						for (const role of unauthorizedRoles) {
							const client = createClientForRole(role);
							await expect(runOperation(matrixEntry, client)).rejects.toThrow(
								expectedError
							);
						}
					});
				}
			});
		}
	});
});

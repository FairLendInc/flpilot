import {
	createAuthorizedAction,
	createAuthorizedMutation,
	createAuthorizedQuery,
} from "./server";

/**
 * Pre-configured authorized Convex helpers.
 *
 * These instances are created once at module load so serverless cold starts
 * can reuse the same wrapped functions instead of rebuilding them in every
 * handler file.
 */
export const authenticatedQuery = createAuthorizedQuery(["any"]);
export const authenticatedMutation = createAuthorizedMutation(["any"]);
export const authenticatedAction = createAuthorizedAction(["any"]);

export const unauthenticatedQuery = createAuthorizedQuery(["any"], [], false);
export const unauthenticatedMutation = createAuthorizedMutation(
	["any"],
	[],
	false
);
export const unauthenticatedAction = createAuthorizedAction(["any"], [], false);

export const adminQuery = createAuthorizedQuery(["admin"]);
export const adminMutation = createAuthorizedMutation(["admin"]);
export const adminAction = createAuthorizedAction(["admin"]);

export const brokerQuery = createAuthorizedQuery(["broker"]);
export const brokerMutation = createAuthorizedMutation(["broker"]);
export const brokerAction = createAuthorizedAction(["broker"]);

export const investorMutation = createAuthorizedMutation(["investor"]);
export const investorAction = createAuthorizedAction(["investor"]);

export const investorLawyerAdminMutation = createAuthorizedMutation([
	"investor",
	"lawyer",
	"admin",
]);
export const investorLawyerAdminAction = createAuthorizedAction([
	"investor",
	"lawyer",
	"admin",
]);

export const withFairLendRoleQuery = createAuthorizedQuery([
	"investor",
	"lawyer",
	"broker",
	"admin",
	"padmin",
	"orgadmin",
]);
export const withFairLendRoleMutation = createAuthorizedMutation([
	"investor",
	"lawyer",
	"broker",
	"admin",
	"padmin",
	"orgadmin",
]);
export const withFairLendRoleAction = createAuthorizedAction([
	"investor",
	"lawyer",
	"broker",
	"admin",
	"padmin",
	"orgadmin",
]);

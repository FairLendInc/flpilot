import { v } from "convex/values";
import {
	adminAction,
	adminMutation,
	adminQuery,
	authenticatedAction,
	authenticatedMutation,
	authenticatedQuery,
	brokerAction,
	brokerMutation,
	brokerQuery,
	investorAction,
	investorMutation,
	unauthenticatedAction,
	unauthenticatedMutation,
	unauthenticatedQuery,
	withFairLendRoleAction,
	withFairLendRoleMutation,
	withFairLendRoleQuery,
} from "./lib/authorizedFunctions";

const ensureIdProvided = (id: string) => {
	if (!id) {
		throw new Error("id is required");
	}
};

export const testFairLendRoleMutation = withFairLendRoleMutation({
	args: { id: v.string() },
	returns: v.string(),
	handler: async (_ctx, { id }) => {
		ensureIdProvided(id);
		return "DONE";
	},
});

export const testWithFairLendRoleAction = withFairLendRoleAction({
	args: { id: v.string() },
	returns: v.string(),
	handler: async (_ctx, { id }) => {
		ensureIdProvided(id);
		return "DONE";
	},
});

export const testFairLendRoleQuery = withFairLendRoleQuery({
	args: { id: v.string() },
	returns: v.string(),
	handler: async (_ctx, { id }) => {
		ensureIdProvided(id);
		return "DONE";
	},
});

export const testAuthenticatedQuery = authenticatedQuery({
	args: { id: v.string() },
	returns: v.string(),
	handler: async (_ctx, { id }) => {
		ensureIdProvided(id);
		return "DONE";
	},
});

export const testUnauthenticatedQuery = unauthenticatedQuery({
	args: { id: v.string() },
	returns: v.string(),
	handler: async (_ctx, { id }) => {
		ensureIdProvided(id);
		return "DONE";
	},
});

export const testAdminQuery = adminQuery({
	args: { id: v.string() },
	returns: v.string(),
	handler: async (_ctx, { id }) => {
		ensureIdProvided(id);
		return "DONE";
	},
});

export const testBrokerQuery = brokerQuery({
	args: { id: v.string() },
	returns: v.string(),
	handler: async (_ctx, { id }) => {
		ensureIdProvided(id);
		return "DONE";
	},
});

export const testAuthenticatedMutation = authenticatedMutation({
	args: { id: v.string() },
	returns: v.string(),
	handler: async (_ctx, { id }) => {
		ensureIdProvided(id);
		return "DONE";
	},
});

export const testUnauthenticatedMutation = unauthenticatedMutation({
	args: { id: v.string() },
	returns: v.string(),
	handler: async (_ctx, { id }) => {
		ensureIdProvided(id);
		return "DONE";
	},
});

export const testAdminMutation = adminMutation({
	args: { id: v.string() },
	returns: v.string(),
	handler: async () => "DONE",
});

export const testBrokerMutation = brokerMutation({
	args: { id: v.string() },
	returns: v.string(),
	handler: async (_ctx, { id }) => {
		ensureIdProvided(id);
		return "DONE";
	},
});

export const testInvestorMutation = investorMutation({
	args: { id: v.string() },
	returns: v.string(),
	handler: async (_ctx, { id }) => {
		ensureIdProvided(id);
		return "DONE";
	},
});

export const testAuthenticatedAction = authenticatedAction({
	args: { id: v.string() },
	returns: v.string(),
	handler: async (_ctx, { id }) => {
		ensureIdProvided(id);
		return "DONE";
	},
});

export const testUnauthenticatedAction = unauthenticatedAction({
	args: { id: v.string() },
	returns: v.string(),
	handler: async (_ctx, { id }) => {
		ensureIdProvided(id);
		return "DONE";
	},
});

export const testAdminAction = adminAction({
	args: { id: v.string() },
	returns: v.string(),
	handler: async (_ctx, { id }) => {
		ensureIdProvided(id);
		return "DONE";
	},
});

export const testBrokerAction = brokerAction({
	args: { id: v.string() },
	returns: v.string(),
	handler: async (_ctx, { id }) => {
		ensureIdProvided(id);
		return "DONE";
	},
});

export const testInvestorAction = investorAction({
	args: { id: v.string() },
	returns: v.string(),
	handler: async (_ctx, { id }) => {
		ensureIdProvided(id);
		return "DONE";
	},
});

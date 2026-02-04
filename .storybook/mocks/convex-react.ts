import type { ReactNode } from "react";

type MockConfig = {
	queries?: Record<string, unknown>;
	actions?: Record<string, (...args: unknown[]) => unknown>;
	mutations?: Record<string, (...args: unknown[]) => unknown>;
	defaultQueryResult?: unknown;
	defaultActionResult?: unknown;
	defaultMutationResult?: unknown;
	auth?: { isLoading?: boolean; isAuthenticated?: boolean };
};

const getConfig = (): MockConfig =>
	((globalThis as typeof globalThis & { __STORYBOOK_CONVEX__?: MockConfig })
		.__STORYBOOK_CONVEX__ ?? {});

const getKey = (fn: unknown): string | undefined => {
	if (typeof fn === "string") return fn;
	if (fn && typeof fn === "object") {
		const maybePath = (fn as { path?: string }).path;
		if (maybePath) return maybePath;
		const maybeName = (fn as { name?: string }).name;
		if (maybeName) return maybeName;
	}
	if (typeof fn === "function" && fn.name) return fn.name;
	return undefined;
};

export const useQuery = (query: unknown, args?: unknown) => {
	if (args === "skip") return undefined;
	const config = getConfig();
	const key = getKey(query);
	if (key && config.queries && key in config.queries) {
		return config.queries[key];
	}
	return config.defaultQueryResult ?? [];
};

export const useMutation = (mutation: unknown) => {
	const config = getConfig();
	const key = getKey(mutation);
	return async (..._args: unknown[]) => {
		if (key && config.mutations && key in config.mutations) {
			const handler = config.mutations[key];
			if (typeof handler === "function") return handler(..._args);
			return handler;
		}
		return config.defaultMutationResult ?? {};
	};
};

export const useAction = (action: unknown) => {
	const config = getConfig();
	const key = getKey(action);
	return async (..._args: unknown[]) => {
		if (key && config.actions && key in config.actions) {
			const handler = config.actions[key];
			if (typeof handler === "function") return handler(..._args);
			return handler;
		}
		return config.defaultActionResult ?? {};
	};
};

export const useConvexAuth = () => {
	const config = getConfig();
	return {
		isLoading: config.auth?.isLoading ?? false,
		isAuthenticated: config.auth?.isAuthenticated ?? true,
	};
};

export const ConvexProvider = ({
	children,
}: {
	children: ReactNode;
}) => children;

export const ConvexProviderWithAuth = ({
	children,
}: {
	children: ReactNode;
}) => children;

export class ConvexReactClient {
	constructor(_url: string) {}
}

export const usePreloadedQuery = () => null;
export const usePaginatedQuery = () => ({
	results: [],
	status: "Idle",
	loadMore: async () => {},
});

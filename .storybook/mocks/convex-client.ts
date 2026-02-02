type MockConfig = {
	authenticatedQueries?: Record<string, unknown>;
	defaultAuthenticatedQueryResult?: unknown;
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

export const useAuthenticatedQuery = (query: unknown, args?: unknown) => {
	if (args === "skip") return undefined;
	const config = getConfig();
	const key = getKey(query);
	if (key && config.authenticatedQueries && key in config.authenticatedQueries) {
		return config.authenticatedQueries[key];
	}
	return config.defaultAuthenticatedQueryResult ?? null;
};

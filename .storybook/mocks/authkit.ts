type AuthConfig = {
	user?: {
		id?: string;
		email?: string;
		firstName?: string;
		lastName?: string;
	};
	loading?: boolean;
};

const getConfig = (): AuthConfig =>
	((globalThis as typeof globalThis & { __STORYBOOK_AUTH__?: AuthConfig })
		.__STORYBOOK_AUTH__ ?? {});

export const useAuth = () => {
	const config = getConfig();
	return {
		user: config.user ?? {
			id: "story-user",
			email: "storybook@example.com",
			firstName: "Story",
			lastName: "User",
		},
		loading: config.loading ?? false,
	};
};

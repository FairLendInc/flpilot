import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
	stories: [
		"../stories/**/*.mdx",
		"../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
		"../app/components/**/*.stories.@(js|jsx|mjs|ts|tsx)",
		"../app/components/admin/mic/stories/*.stories.@(js|jsx|mjs|ts|tsx)",
		"../components/admin/mic/stories/*.stories.@(js|jsx|mjs|ts|tsx)",
		"../components/admin/mic/widgets/stories/*.stories.@(js|jsx|mjs|ts|tsx)",
		"../components/admin/mic/**/stories/*.stories.@(js|jsx|mjs|ts|tsx)",
	],
	addons: [
		"@chromatic-com/storybook",
		"@storybook/addon-docs",
		"@storybook/addon-onboarding",
		"@storybook/addon-a11y",
	],
	framework: {
		name: "@storybook/nextjs-vite",
		options: {},
	},
	staticDirs: ["../public"],
	docs: {
		autodocs: "tag",
	},
	swc: () => ({
		jsc: {
			transform: {
				react: {
					runtime: "automatic",
					throwIfNamespace: false,
				},
			},
		},
	}),
};
export default config;

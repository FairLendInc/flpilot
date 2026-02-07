import type { StorybookConfig } from "@storybook/nextjs-vite";
import path from "node:path";

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
	viteFinal: async (config) => {
		config.resolve = config.resolve ?? {};
		config.resolve.alias = {
			...(config.resolve.alias ?? {}),
			"convex/react": path.resolve(__dirname, "mocks/convex-react.ts"),
			"@/convex/lib/client": path.resolve(__dirname, "mocks/convex-client.ts"),
			"@workos-inc/authkit-nextjs/components": path.resolve(
				__dirname,
				"mocks/authkit.ts"
			),
			"@workos-inc/authkit-nextjs": path.resolve(
				__dirname,
				"mocks/authkit-nextjs.ts"
			),
			"next/navigation": path.resolve(__dirname, "mocks/next-navigation.ts"),
		};
		return config;
	},
};
export default config;

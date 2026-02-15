import type { Preview } from "@storybook/nextjs-vite";
import "../app/globals.css";

const preview: Preview = {
	decorators: [
		(Story, context) => {
			(globalThis as typeof globalThis & {
				__STORYBOOK_CONVEX__?: unknown;
				__STORYBOOK_AUTH__?: unknown;
			}).__STORYBOOK_CONVEX__ = context.parameters?.convex ?? {};
			(globalThis as typeof globalThis & {
				__STORYBOOK_AUTH__?: unknown;
			}).__STORYBOOK_AUTH__ = context.parameters?.auth ?? {};
			return Story();
		},
	],
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		backgrounds: {
			default: "light",
			values: [
				{
					name: "light",
					value: "#ffffff",
				},
				{
					name: "dark",
					value: "#09090b",
				},
			],
		},
	},
	// Configure stories to find test utilities from twentycomponents
	globalTypes: {
		theme: {
			description: 'Global theme for components',
			defaultValue: 'light',
			toolbar: {
				title: 'Theme',
				icon: 'circlehollow',
				items: [
					{ value: 'light', icon: 'circlehollow', title: 'Light' },
					{ value: 'dark', icon: 'circle', title: 'Dark' },
				],
				dynamicTitle: true,
			},
		},
	},
};

export default preview;

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
};

export default preview;

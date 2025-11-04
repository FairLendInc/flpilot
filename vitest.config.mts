/// <reference types="vitest/config" />

import { fileURLToPath } from "node:url";
import path from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const dirname =
	typeof __dirname !== "undefined"
		? __dirname
		: path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
	test: {
		environment: "jsdom",
		setupFiles: ["./vitest.setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/**",
				"dist/**",
				"e2e/**",
				".next/**",
				"convex/_generated/**",
				"stories/**",
				"**/*.stories.tsx",
				"**/*.stories.ts",
				"vitest.config.mts",
				"vitest.setup.ts",
			],
			thresholds: {
				global: {
					branches: 50,
					functions: 50,
					lines: 50,
					statements: 50,
				},
			},
		},
		server: {
			deps: {
				inline: ["convex-test"],
			},
		},
		exclude: ["e2e/**", "node_modules/**", "dist/**", ".next/**"],
	},
	resolve: {
		alias: {
			"@": path.resolve(dirname, "./"),
			"next/cache": path.resolve(dirname, "./next/cache.js"),
		},
	},
	plugins: [react()],
	// Avoid aliasing the "convex" npm package name to the local directory,
	// since it can break imports like `import { v } from "convex/values"`.
});

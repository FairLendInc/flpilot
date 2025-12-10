import type { NextConfig } from "next";

const createWithVercelToolbar = require("@vercel/toolbar/plugins/next");
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
	reactCompiler: true,
	turbopack: {
		root: process.cwd(),
	},
	cacheComponents: true,
	experimental: {
		viewTransition: true,
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "picsum.photos",
			},
			{
				protocol: "https",
				hostname: "*.convex.cloud",
			},
			{
				protocol: "https",
				hostname: "images.unsplash.com",
			},
			{
				protocol: "https",
				hostname: "assets.aceternity.com",
			},
			{
				protocol: "https",
				hostname: "alt.tailus.io",
			},
			{
				protocol: "https",
				hostname: "i.pravatar.cc",
			},
		],
	},
	async redirects() {
		if (!isProd) {
			return [];
		}
		return [
			{
				source: "/api/e2e/auth",
				destination: "/404",
				permanent: false,
			},
		];
	},
};
const withVercelToolbar = createWithVercelToolbar();
module.exports = withVercelToolbar(nextConfig);

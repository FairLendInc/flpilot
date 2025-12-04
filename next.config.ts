import type { NextConfig } from "next";

const createWithVercelToolbar = require("@vercel/toolbar/plugins/next");

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
};
const withVercelToolbar = createWithVercelToolbar();
module.exports = withVercelToolbar(nextConfig);

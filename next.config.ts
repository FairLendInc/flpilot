import type { NextConfig } from "next";

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
		],
	},
};

export default nextConfig;

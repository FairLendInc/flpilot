import { authkitMiddleware } from "@workos-inc/authkit-nextjs";
import type { NextRequest, NextResponse } from "next/server";

/**
 * Get the redirect URI for WorkOS authentication.
 * Priority:
 * 1. VERCEL_URL (automatically set by Vercel)
 * 2. NEXT_PUBLIC_SITE_URL (for custom domains)
 * 3. NEXT_PUBLIC_WORKOS_REDIRECT_URI (for local development)
 * 4. Fallback to localhost:3000
 */
function getRedirectUri(): string {
	// Production: Use VERCEL_URL or construct from environment
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}/callback`;
	}

	// Custom production URL
	if (process.env.NEXT_PUBLIC_SITE_URL) {
		return `${process.env.NEXT_PUBLIC_SITE_URL}/callback`;
	}

	// Development fallback
	return (
		process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ||
		"http://localhost:3000/callback"
	);
}

const redirectUri = getRedirectUri();

const base = authkitMiddleware({
	eagerAuth: true,

	redirectUri,
	middlewareAuth: {
		enabled: true,
		unauthenticatedPaths: ["/", "/sign-in", "/sign-up"],
	},
});

// function generateRequestId() {
// 	try {
// 		// Prefer Web Crypto API when available (Edge-safe)
// 		// @ts-ignore
// 		if (
// 			typeof crypto !== "undefined" &&
// 			typeof crypto.randomUUID === "function"
// 		)
// 			return crypto.randomUUID();
// 	} catch (e) {
// 		// ignore
// 	}
// 	// fallback small random id
// 	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
// }

export default async function proxy(req: NextRequest) {
	// call the authkit middleware first
	const headers = new Headers(req.headers);
	headers.set("x-current-path", req.nextUrl.pathname);
	// console.info("HEADERS", { headers });
	// console.info("REQUEST", {
	// 	url: req.url,
	// 	pathname: req.nextUrl.pathname,
	// 	search: req.nextUrl.search,
	// });
	// console.info("PATHNAME", { pathname: req.nextUrl.pathname });
	// WorkOS middleware expects NextRequest and NextMiddlewareEvent
	// Using type assertions since WorkOS types may not perfectly match Next.js types
	const res = (await base(
		req as Parameters<typeof base>[0],
		{} as Parameters<typeof base>[1]
	)) as NextResponse;
	res.headers.set("x-current-path", req.nextUrl.pathname);
	// try {
	// 	// const existing = req.headers.get('x-request-id');
	// 	// const requestId = existing ?? generateRequestId();
	// 	// res.headers.set('x-request-id', requestId);
	// } catch (e) {
	// 	// swallow - logging should not break middleware
	// }
	return res;
}

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!.*\\..*|_next).*)",
		"/(api|trpc)(.*)",
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};

// import { authkitMiddleware } from '@workos-inc/authkit-nextjs';
// import { NextResponse, type NextRequest } from 'next/server';
// import { precompute } from 'flags/next';
// import { marketingFlags } from './flags';

// const redirectUri = process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI;
// if (!redirectUri) {
//   // Throwing here gives a clearer error during middleware initialization
//   throw new Error(
//     'Missing NEXT_PUBLIC_WORKOS_REDIRECT_URI environment variable. Please set it to your app callback URL (e.g. http://localhost:3000/callback)'
//   );
// }

// const base = authkitMiddleware({
//   eagerAuth: true,

//   redirectUri,
//   middlewareAuth: {
//     enabled: true,
//     unauthenticatedPaths: ['/', '/sign-in', '/sign-up'],
//   },
// });

// function generateRequestId() {
//   try {
//     // Prefer Web Crypto API when available (Edge-safe)
//     // @ts-ignore
//     if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
//   } catch (e) {
//     // ignore
//   }
//   // fallback small random id
//   return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
// }

// export default async function proxy(req: NextRequest) {
//   // call the authkit middleware first
//   const authRes = (await base(req as any, {} as any)) as NextResponse;
//     // If authkit returned a redirect or other response, return it
//     if (authRes.status !== 200 || authRes.headers.get('x-middleware-rewrite')) {
//       return authRes;
//     }

//   const code = await precompute(marketingFlags);
//   console.log("COMPUTED FLAGS", code);
//   console.log("REQUEST", {url: req.url, pathname: req.nextUrl.pathname, search: req.nextUrl.search});

//   // rewrites the request to include the precomputed code for this flag combination
//   const nextUrl = new URL(
//     `/${code}${req.nextUrl.pathname}${req.nextUrl.search}`,
//     req.url,
//   );
//   // const res = (await base(nextUrl as any, {} as any)) as NextResponse;
//   const res = NextResponse.rewrite(nextUrl, { request:req });
//   console.info("Request: ", {req: req, nextUrl: nextUrl});
//   try {
//     const existing = req.headers.get('x-request-id');
//     const requestId = existing ?? generateRequestId();
//     res.headers.set('x-request-id', requestId);
//     authRes.headers.forEach((value, key) => {
//       if (key.startsWith('x-workos') || key === 'set-cookie') {
//         res.headers.set(key, value);
//       }
//     });
//   } catch (e) {
//     // swallow - logging should not break middleware
//   }
//   return res;
// }

// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
//     // Always run for API routes
//     '/(api|trpc)(.*)',
//   ],
// };

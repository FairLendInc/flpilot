import { authkit, authkitMiddleware } from "@workos-inc/authkit-nextjs";
import { precompute } from "flags/next";
import { type NextRequest, NextResponse } from "next/server";
import { precomputeFlags } from "@/lib/flags";
import logger from "@/lib/logger";
import { dashboardRedirectForPath } from "./lib/auth/dashboardRoutes";
import {
	buildRedirectContext,
	evaluateSubdomainRules,
} from "./lib/routing/subdomainRules";
import { ROOT_DOMAIN } from "./lib/siteurl";
import { getSubdomain } from "./lib/subdomains";

export default async function proxy(req: NextRequest) {
	const url = req.nextUrl;
	const hostname = req.headers.get("host") || "";
	const subdomain = getSubdomain(hostname, ROOT_DOMAIN);

	// Dynamic redirect URI based on the current request's host to support subdomains
	// This ensures the auth callback returns to the correct subdomain (e.g. app.localhost:3000)
	const protocol = url.protocol;
	const redirectUri = `${protocol}//${hostname}/callback`;

	const mw = authkitMiddleware({
		redirectUri,
		eagerAuth: true,
		middlewareAuth: {
			enabled: true,
			unauthenticatedPaths: [
				"/",
				"/sign-in",
				"/sign-up",
				"/tenant",
				"/blog",
				"/contact",
				"/about",
				"/underconstruction",
				"/api/e2e/auth",
			],
		},
	});

	const res = (await mw(
		req as Parameters<typeof mw>[0],
		{} as Parameters<typeof mw>[1]
	)) as NextResponse;

	// If WorkOS already issued a redirect (e.g., login flow), honor it immediately.
	if (res.headers.get("location")) {
		return res;
	}

	// Precompute flags for the demo page and attach to headers
	let flagsCode: string | null = null;
	if (
		process.env.FLAGS_SECRET &&
		req.nextUrl.pathname.startsWith("/flags-demo")
	) {
		try {
			// biome-ignore lint/suspicious/noExplicitAny: flags library type mismatch
			flagsCode = await (precompute as any)(precomputeFlags, req);
		} catch (e) {
			logger.error("precomputeFlags failed", {
				error: e instanceof Error ? e.message : String(e),
			});
			flagsCode = null;
		}
	}

	let finalRes = res;

	// Handle "mic" subdomain - restrict to landing page only
	// Users on mic.* can ONLY access the landing page, no auth rules apply
	if (subdomain === "mic") {
		// If not on landing page, redirect to landing page on same subdomain
		if (url.pathname !== "/") {
			const landingUrl = new URL(`${protocol}//${hostname}/`);
			console.log("[proxy] mic subdomain restricting to landing:", {
				from: `${protocol}//${hostname}${url.pathname}`,
				to: landingUrl.toString(),
			});
			return NextResponse.redirect(landingUrl.toString());
		}
		// Already on landing page - serve with subdomain header (like other subdomains)
		// but skip auth rules
		const suburl = req.nextUrl.clone();
		const rewriteRes = NextResponse.rewrite(suburl, {
			request: {
				headers: new Headers({
					...Object.fromEntries(req.headers),
					"x-subdomain": subdomain,
				}),
			},
		});
		// Preserve auth headers from AuthKit response
		res.headers.forEach((val, key) => {
			rewriteRes.headers.set(key, val);
		});
		console.log(
			"[proxy] mic subdomain serving landing page with x-subdomain header"
		);
		return rewriteRes;
	}

	if (subdomain) {
		// Rewrite root to the tenant directory: app/tenant/page.tsx
		// We map the root subdomain traffic to this placeholder for now
		// For other paths, we keep the path but inject the subdomain header
		const suburl = req.nextUrl.clone();
		const rewriteRes = NextResponse.rewrite(suburl, {
			request: {
				headers: new Headers({
					...Object.fromEntries(req.headers),
					"x-subdomain": subdomain,
					...(flagsCode ? { "x-precomputed-flags": flagsCode } : {}),
				}),
			},
		});

		// Preserve headers from AuthKit response (e.g. Set-Cookie)
		res.headers.forEach((val, key) => {
			rewriteRes.headers.set(key, val);
		});

		finalRes = rewriteRes;

		// If we rewrote to /tenant (root path), return immediately
		if (suburl.pathname === "/tenant") {
			return finalRes;
		}
	}

	//Details in session isn't changin between reloads.
	const { session } = await authkit(req);

	// AuthKit returns a session object even for unauthenticated users
	// Check for session.user to determine actual authentication state
	const isAuthenticated = !!session?.user;

	// Evaluate subdomain-based redirect rules
	// Construct full URL from Host header since req.url doesn't include subdomain
	const fullRequestUrl = new URL(
		`${protocol}//${hostname}${url.pathname}${url.search}`
	);
	const redirectContext = buildRedirectContext({
		subdomain,
		pathname: url.pathname,
		isAuthenticated,
		role: session?.role ?? null,
		requestUrl: fullRequestUrl,
	});

	const subdomainRedirect = evaluateSubdomainRules(redirectContext);
	console.log("[proxy] subdomain redirect check:", {
		pathname: url.pathname,
		subdomain,
		isAuthenticated,
		hasUser: !!session?.user,
		role: session?.role,
		redirect: subdomainRedirect,
	});
	if (subdomainRedirect) {
		const redirectRes = NextResponse.redirect(subdomainRedirect);
		// Only preserve essential headers (like auth cookies), not all headers
		// which may include internal rewrite headers that cause issues
		const setCookie = finalRes.headers.get("set-cookie");
		if (setCookie) {
			redirectRes.headers.set("set-cookie", setCookie);
		}
		console.log("[proxy] RETURNING REDIRECT:", {
			to: subdomainRedirect,
			status: redirectRes.status,
		});
		return redirectRes;
	}

	const dashboardRedirect = maybeRedirectDashboard(req, session, finalRes);
	if (dashboardRedirect) {
		return dashboardRedirect;
	}

	// Attach precomputed flags to the final response headers (for non-rewrite paths)
	if (flagsCode) {
		finalRes.headers.set("x-precomputed-flags", flagsCode);
	}

	return finalRes;
}

type Session = Awaited<ReturnType<typeof authkit>>["session"];

const maybeRedirectDashboard = (
	req: NextRequest,
	session: Session,
	baseResponse: NextResponse
) => {
	const pathname = req.nextUrl.pathname;
	const destination = dashboardRedirectForPath(pathname, session?.role);

	if (!destination) {
		return null;
	}

	const redirectResponse = NextResponse.redirect(new URL(destination, req.url));

	baseResponse.headers.forEach((value, key) => {
		redirectResponse.headers.set(key, value);
	});

	return redirectResponse;
};

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!.*\\..*|_next).*)",
		"/(api|trpc)(.*)",
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
	],
};

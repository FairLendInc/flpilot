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
import { getSubdomain } from "./lib/subdomains";

export default async function proxy(req: NextRequest) {
	const url = req.nextUrl;
	const forwardedHost = req.headers.get("x-forwarded-host");
	const hostname =
		forwardedHost?.split(",")[0]?.trim() || req.headers.get("host") || "";
	const { subdomain } = getSubdomain(hostname);
	const protocol = url.protocol;

	// 1. Run AuthKit Middleware
	// This ensures the auth callback returns to the correct subdomain
	const redirectUri = `${protocol}//${hostname}/callback`;
	const res = await runAuthMiddleware(req, redirectUri);

	// If WorkOS already issued a redirect (e.g., login flow), honor it immediately.
	if (res.headers.get("location")) {
		return res;
	}

	// 2. Precompute Flags
	const flagsCode = await getPrecomputedFlags(req);

	let finalRes = res;

	// 3. Handle "mic" subdomain restriction
	const micResponse = handleMicSubdomain(req, res, {
		subdomain,
		hostname,
		protocol,
	});
	if (micResponse) {
		// If it's a redirect, return it.
		// If it's a rewrite (landing page), return it.
		return micResponse;
	}

	// 4. Handle generic subdomain rewrites (e.g. tenant pages)
	const rewriteRes = handleSubdomainRewrite(req, subdomain, res, flagsCode);
	if (rewriteRes) {
		finalRes = rewriteRes;
		// If we rewrote to /tenant (root path check logic preserved from original), return immediately
		if (req.nextUrl.pathname === "/tenant") {
			return finalRes;
		}
	}

	// 5. Check Auth Session
	const { session } = await authkit(req);
	const isAuthenticated = !!session?.user;

	// 6. Evaluate Subdomain Redirect Rules
	const rulesRedirect = evaluateRedirectRules(req, finalRes, {
		subdomain,
		hostname,
		protocol,
		isAuthenticated,
		session,
	});
	if (rulesRedirect) {
		return rulesRedirect;
	}

	// 7. Dashboard Redirects
	const dashboardRedirect = maybeRedirectDashboard(req, session, finalRes);
	if (dashboardRedirect) {
		return dashboardRedirect;
	}

	// 8. Final Header Attachments
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

// --- Helper Functions ---

/**
 * Executes AuthKit middleware to handle authentication state and redirects.
 */
async function runAuthMiddleware(
	req: NextRequest,
	redirectUri: string
): Promise<NextResponse> {
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

	if (res.headers.get("location")) {
		return res;
	}

	const requestHeaders = new Headers(req.headers);
	requestHeaders.set("x-pathname", req.nextUrl.pathname);

	// Inject request ID for trace correlation across the request lifecycle.
	// Preserves existing x-request-id if already set by upstream proxy/load balancer.
	if (!requestHeaders.has("x-request-id")) {
		requestHeaders.set("x-request-id", crypto.randomUUID());
	}

	const nextRes = NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	});

	res.headers.forEach((value, key) => {
		nextRes.headers.set(key, value);
	});

	return nextRes;
}

/**
 * Precomputes feature flags for demo pages.
 */
async function getPrecomputedFlags(req: NextRequest): Promise<string | null> {
	if (
		process.env.FLAGS_SECRET &&
		req.nextUrl.pathname.startsWith("/flags-demo")
	) {
		try {
			// biome-ignore lint/suspicious/noExplicitAny: flags library type mismatch
			return await (precompute as any)(precomputeFlags, req);
		} catch (e) {
			logger.error("precomputeFlags failed", {
				error: e instanceof Error ? e.message : String(e),
			});
		}
	}
	return null;
}

/**
 * Handles logic for the "mic" subdomain, which is restricted to the landing page.
 */
function handleMicSubdomain(
	req: NextRequest,
	baseRes: NextResponse,
	context: {
		subdomain: string | null;
		hostname: string;
		protocol: string;
	}
): NextResponse | null {
	const { subdomain, hostname, protocol } = context;
	if (subdomain !== "mic") return null;

	const url = req.nextUrl;
	// If not on landing page, redirect to landing page on same subdomain
	if (url.pathname !== "/") {
		const landingUrl = new URL(`${protocol}//${hostname}/`);
		logger.debug("[proxy] mic subdomain restricting to landing:", {
			protocol,
			hostname,
			pathname: url.pathname,
			to: landingUrl.toString(),
		});
		return NextResponse.redirect(landingUrl.toString());
	}

	// Already on landing page - serve with subdomain header
	const suburl = req.nextUrl.clone();
	const rewriteRes = NextResponse.rewrite(suburl, {
		request: {
			headers: new Headers({
				...Object.fromEntries(req.headers),
				"x-subdomain": subdomain,
				"x-pathname": req.nextUrl.pathname,
			}),
		},
	});

	// Preserve auth headers from AuthKit response
	baseRes.headers.forEach((val, key) => {
		rewriteRes.headers.set(key, val);
	});

	logger.debug(
		"[proxy] mic subdomain serving landing page with x-subdomain header",
		{ subdomain: "mic", header: "x-subdomain" }
	);
	return rewriteRes;
}

/**
 * Handles generic subdomain rewrites (injecting x-subdomain header).
 */
function handleSubdomainRewrite(
	req: NextRequest,
	subdomain: string | null,
	baseRes: NextResponse,
	flagsCode: string | null
): NextResponse | null {
	if (!subdomain) return null;

	const suburl = req.nextUrl.clone();
	const rewriteRes = NextResponse.rewrite(suburl, {
		request: {
			headers: new Headers({
				...Object.fromEntries(req.headers),
				"x-subdomain": subdomain,
				"x-pathname": req.nextUrl.pathname,
				...(flagsCode ? { "x-precomputed-flags": flagsCode } : {}),
			}),
		},
	});

	// Preserve headers from AuthKit response (e.g. Set-Cookie)
	baseRes.headers.forEach((val, key) => {
		rewriteRes.headers.set(key, val);
	});

	return rewriteRes;
}

/**
 * Evaluates redirection rules based on subdomain, auth status, and path.
 */
function evaluateRedirectRules(
	req: NextRequest,
	finalRes: NextResponse,
	context: {
		subdomain: string | null;
		hostname: string;
		protocol: string;
		isAuthenticated: boolean;
		session: Session;
	}
): NextResponse | null {
	const { subdomain, hostname, protocol, isAuthenticated, session } = context;
	const url = req.nextUrl;
	if (url.pathname.startsWith("/onboarding")) {
		return null;
	}
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

	if (subdomainRedirect) {
		const redirectRes = NextResponse.redirect(subdomainRedirect);
		// Only preserve essential headers (like auth cookies)
		const setCookie = finalRes.headers.get("set-cookie");
		if (setCookie) {
			redirectRes.headers.set("set-cookie", setCookie);
		}
		return redirectRes;
	}

	return null;
}

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!.*\\..*|_next).*)",
		"/(api|trpc)(.*)",
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
	],
};

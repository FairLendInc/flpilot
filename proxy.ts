import { authkit, authkitMiddleware } from "@workos-inc/authkit-nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { ROOT_DOMAIN } from "./lib/siteurl";
import { getSubdomain } from "./lib/subdomains";
import { dashboardRedirectForPath } from "./lib/auth/dashboardRoutes";

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

	let finalRes = res;

	if (subdomain) {
		// Rewrite root to the tenant directory: app/tenant/page.tsx
		// We map the root subdomain traffic to this placeholder for now
		// For other paths, we keep the path but inject the subdomain header
		const suburl = req.nextUrl.clone();
		if (suburl.pathname === "/") {
			suburl.pathname = "/tenant";
		}

		const rewriteRes = NextResponse.rewrite(suburl, {
			request: {
				headers: new Headers({
					...Object.fromEntries(req.headers),
					"x-subdomain": subdomain,
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

	const dashboardRedirect = maybeRedirectDashboard(req, session, finalRes);
	if (dashboardRedirect) {
		return dashboardRedirect;
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

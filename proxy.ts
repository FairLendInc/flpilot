import { authkit, authkitMiddleware } from "@workos-inc/authkit-nextjs";
import { type NextRequest, NextResponse } from "next/server";

const ROLES = new Set(["admin", "broker", "lawyer", "member", "investor"]);
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

const base = authkitMiddleware({
	redirectUri: getRedirectUri(),
	eagerAuth: true,
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
	const res = (await base(
		req as Parameters<typeof base>[0],
		{} as Parameters<typeof base>[1]
	)) as NextResponse;

	// If WorkOS already issued a redirect (e.g., login flow), honor it immediately.
	if (res.headers.get("location")) {
		return res;
	}

	//Details in session isn't changin between reloads.
	const { session } = await authkit(req);

	const dashboardRedirect = maybeRedirectDashboard(req, session);
	if (dashboardRedirect) {
		return dashboardRedirect;
	}

	return res;
}

type Session = Awaited<ReturnType<typeof authkit>>["session"];

const maybeRedirectDashboard = (req: NextRequest, session: Session) => {
	// console.log("session", session);

	const pathname = req.nextUrl.pathname;
	if (!pathname.startsWith("/dashboard")) {
		return null;
	}

	if (!session?.role) {
		return NextResponse.redirect(new URL("/sign-in", req.url));
	}

	if (session.role === "member") {
		console.log("ROLE IS MEMBER");
		return NextResponse.redirect(new URL("/profile", req.url));
	}

	const pathSet = new Set(pathname.split("/"));
	console.log("ROLES", ROLES.isDisjointFrom(pathSet));
	if (ROLES.isDisjointFrom(pathSet)) {
		return null;
	}
	//TODO: figure out how to handle padmin. Temp hardcode to handle padmin
	const segment = session.role === "org-admin" ? "admin" : session.role;
	const updatedPath = replaceUrlSegment(pathname, 2, segment);
	if (updatedPath !== pathname) {
		return NextResponse.redirect(new URL(updatedPath, req.url));
	}

	return null;
};

const replaceUrlSegment = (
	url: string,
	segmentIndex: number,
	newSegment: string
) => {
	const urlParts = url.split("/");
	urlParts[segmentIndex] = newSegment;
	return urlParts.join("/");
};

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!.*\\..*|_next).*)",
		"/(api|trpc)(.*)",
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
	],
};

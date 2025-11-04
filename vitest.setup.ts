import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Mock Next.js router
vi.mock("next/navigation", () => ({
	usePathname: vi.fn(() => "/"),
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
		forwardRef: vi.fn(),
	}),
}));

// Mock WorkOS
vi.mock("@workos-inc/authkit-nextjs", () => ({
	withAuth: vi.fn(),
	useAuth: vi.fn(() => ({
		user: null,
		loading: false,
	})),
	useAccessToken: vi.fn(() => ({
		getAccessToken: vi.fn(),
		refresh: vi.fn(),
	})),
}));

// Mock Convex
vi.mock("convex/react", () => ({
	ConvexProviderWithAuth: ({ children }: any) => children,
	ConvexReactClient: vi.fn(),
	usePreloadedQuery: vi.fn(),
	preloadQuery: vi.fn(),
	api: {},
}));

// Mock environment variables
process.env.NEXT_PUBLIC_CONVEX_URL = "http://localhost:3000";
process.env.WORKOS_API_KEY = "test-api-key";
process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI = "http://localhost:3000/callback";
process.env.WORKOS_CLIENT_ID = "test-client-id";

// runs a cleanup after each test case
afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NavigationProvider from "@/components/navigation/navigation-provider";
import { TwoLevelNav } from "@/components/navigation/two-level-nav";

vi.mock("next/navigation", () => ({
	usePathname: () => "/dashboard",
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		refresh: vi.fn(),
		prefetch: vi.fn(),
	}),
	useSearchParams: () => new URLSearchParams(),
	useParams: () => ({}),
}));

// Mock UserAvatarMenu to avoid pulling in WorkOS AuthKit
vi.mock("@/components/auth/UserAvatarMenu", () => ({
	UserAvatarMenu: () => <div data-testid="user-avatar">User Menu</div>,
}));

vi.mock("../contexts/pathNameContext", () => ({
	usePathNameStore: () => ({
		pathname: "/dashboard",
		breadcrumbs: [{ label: "Home", href: "/" }, { label: "Dashboard" }],
		setPathname: vi.fn(),
	}),
}));

// Mock Convex React hooks
vi.mock("convex/react", () => ({
	useQuery: () => undefined,
	useMutation: () => vi.fn(),
	useAction: () => vi.fn(),
	useConvex: () => ({}),
	useConvexAuth: () => ({ isLoading: false, isAuthenticated: false }),
}));

describe("Navigation", () => {
	describe("TwoLevelNav", () => {
		const defaultBreadcrumbs = [
			{ label: "Home", href: "/" },
			{ label: "Dashboard", href: "/dashboard" },
			{ label: "Profile" },
		];

		it("renders navigation with breadcrumbs", () => {
			render(
				<TwoLevelNav
					breadcrumbs={defaultBreadcrumbs}
					pathname="/dashboard/profile"
				/>
			);

			expect(screen.getAllByText("Home").length).toBeGreaterThan(0);
			expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
			expect(screen.getByText("Profile")).toBeInTheDocument();
		});

		it("renders navigation without pathname", () => {
			render(
				<TwoLevelNav breadcrumbs={defaultBreadcrumbs} pathname={undefined} />
			);

			expect(screen.getAllByText("Home").length).toBeGreaterThan(0);
			expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
		});

		it("renders navigation with empty breadcrumbs", () => {
			render(<TwoLevelNav breadcrumbs={[]} pathname="/" />);

			expect(screen.queryByText("Home")).not.toBeInTheDocument();
		});

		it("renders navigation with single breadcrumb", () => {
			const singleBreadcrumb = [{ label: "Home", href: "/" }];

			render(<TwoLevelNav breadcrumbs={singleBreadcrumb} pathname="/" />);

			expect(screen.getByText("Home")).toBeInTheDocument();
		});

		it("handles breadcrumbs with href", () => {
			render(
				<TwoLevelNav
					breadcrumbs={[
						{ label: "Home", href: "/" },
						{ label: "Settings", href: "/settings" },
					]}
					pathname="/settings"
				/>
			);

			const homeLink = screen.getByText("Home");
			expect(homeLink.closest("a")).toHaveAttribute("href", "/");
		});

		it("handles breadcrumbs without href (current page)", () => {
			render(
				<TwoLevelNav
					breadcrumbs={[{ label: "Home", href: "/" }, { label: "Profile" }]}
					pathname="/profile"
				/>
			);

			const profileText = screen.getByText("Profile");
			// Should not be a link
			expect(profileText.closest("a")).toBeNull();
		});
	});

	describe("NavigationProvider", () => {
		it("renders children components", () => {
			render(
				<NavigationProvider>
					<div data-testid="child-component">Test Child</div>
				</NavigationProvider>
			);

			expect(screen.getByTestId("child-component")).toBeInTheDocument();
			expect(screen.getByText("Test Child")).toBeInTheDocument();
		});

		it("wraps children with navigation", () => {
			render(
				<NavigationProvider>
					<div>Content</div>
				</NavigationProvider>
			);

			// Navigation should be rendered - check for multiple occurrences since breadcrumb and nav item both exist
			expect(screen.getAllByText("Home").length).toBeGreaterThan(0);
			expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
		});
	});
});

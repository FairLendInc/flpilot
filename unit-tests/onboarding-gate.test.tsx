import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { useAuthenticatedQuery } from "@/convex/lib/client";
import { useConvexAuth } from "convex/react";
import { usePathname, useRouter } from "next/navigation";

vi.mock("@/convex/lib/client", () => ({
	useAuthenticatedQuery: vi.fn(),
}));

vi.mock("convex/react", () => ({
	useConvexAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
	useRouter: vi.fn(),
}));

vi.mock("@/convex/_generated/api", () => ({
	api: {
		onboarding: {
			getJourney: "onboarding.getJourney",
		},
		profile: {
			getCurrentUserProfile: "profile.getCurrentUserProfile",
		},
	},
}));

const mockedUseAuthenticatedQuery = useAuthenticatedQuery as unknown as Mock;
const mockedUseConvexAuth = useConvexAuth as unknown as Mock;
const mockedUsePathname = usePathname as unknown as Mock;
const mockedUseRouter = useRouter as unknown as Mock;

describe("OnboardingGate", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedUsePathname.mockReturnValue("/dashboard");
	});

	it("does not redirect when unauthenticated", () => {
		const replaceMock = vi.fn();
		mockedUseRouter.mockReturnValue({ replace: replaceMock });
		mockedUseConvexAuth.mockReturnValue({
			isLoading: false,
			isAuthenticated: false,
		});
		mockedUseAuthenticatedQuery.mockReturnValue(undefined);

		render(<OnboardingGate />);

		expect(replaceMock).not.toHaveBeenCalled();
	});
});

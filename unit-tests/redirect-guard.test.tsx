import { render } from "@testing-library/react";
import { usePathname, useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { RedirectGuard } from "@/components/auth/redirect-guard";

vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
	useRouter: vi.fn(),
}));

const mockedUsePathname = usePathname as unknown as Mock;
const mockedUseRouter = useRouter as unknown as Mock;
const pushMock = vi.fn();

describe("RedirectGuard", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedUseRouter.mockReturnValue({ push: pushMock });
	});

	it("skips redirect on allowlisted paths", () => {
		mockedUsePathname.mockReturnValue("/onboarding");

		render(
			<RedirectGuard
				redirectTo="/profile"
				shouldRedirect={true}
				skipPaths={["/onboarding"]}
			/>
		);

		expect(pushMock).not.toHaveBeenCalled();
	});

	it("redirects when path is not allowlisted", () => {
		mockedUsePathname.mockReturnValue("/dashboard");

		render(
			<RedirectGuard
				redirectTo="/profile"
				shouldRedirect={true}
				skipPaths={["/onboarding"]}
			/>
		);

		expect(pushMock).toHaveBeenCalledWith("/profile");
	});
});

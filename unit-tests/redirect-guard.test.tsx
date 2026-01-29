import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { RedirectGuard } from "@/components/auth/redirect-guard";
import { usePathname, useRouter } from "next/navigation";

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
				shouldRedirect={true}
				redirectTo="/profile"
				skipPaths={["/onboarding"]}
			/>
		);

		expect(pushMock).not.toHaveBeenCalled();
	});

	it("redirects when path is not allowlisted", () => {
		mockedUsePathname.mockReturnValue("/dashboard");

		render(
			<RedirectGuard
				shouldRedirect={true}
				redirectTo="/profile"
				skipPaths={["/onboarding"]}
			/>
		);

		expect(pushMock).toHaveBeenCalledWith("/profile");
	});
});

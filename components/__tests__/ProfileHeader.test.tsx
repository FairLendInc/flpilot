import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("convex/react", () => ({
	usePreloadedQuery: vi.fn(),
}));

vi.mock("@/app/(auth)/profilev2/hooks", () => ({
	useAvatarUpload: () => ({
		uploading: false,
		uploadAvatar: vi.fn(),
	}),
	useOrganizationSwitch: () => ({
		isSwitching: false,
		switchOrganization: vi.fn(),
	}),
	useProfileForm: () => ({
		formState: {
			firstName: "John",
			lastName: "Doe",
			phone: "",
		},
		isSaving: false,
		setFirstName: vi.fn(),
		setLastName: vi.fn(),
		setPhone: vi.fn(),
		onSubmit: vi.fn(),
	}),
}));

import { ProfileHeader } from "@/app/(auth)/profilev2/components/ProfileHeader";

describe("ProfileHeader", () => {
	const mockUserData = {
		user: {
			email: "john@example.com",
			first_name: "John",
			last_name: "Doe",
			profile_picture_url: "https://example.com/avatar.jpg",
		},
		memberships: [
			{
				organizationId: "org_1",
				organizationName: "Acme Corp",
				roleDetails: [
					{ slug: "admin", name: "Administrator", permissions: [] },
				],
			},
		],
	};

	const defaultProps = {
		userData: mockUserData as any,
		uploading: false,
		hasWorkOSPicture: false,
		imageUrl: "https://example.com/avatar.jpg",
		displayName: "John Doe",
		email: "john@example.com",
		orgCount: 1,
		activeRoleName: "Administrator",
		onPickAvatar: vi.fn(),
		getInitials: (first: string, last: string, email: string) => {
			if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
			if (email) return email[0].toUpperCase();
			return "U";
		},
	};

	it("renders profile header with user information", () => {
		render(<ProfileHeader {...defaultProps} />);

		expect(screen.getByText("John Doe")).toBeInTheDocument();
		expect(screen.getByText("john@example.com")).toBeInTheDocument();
		expect(screen.getByText("Administrator")).toBeInTheDocument();
		expect(screen.getByText(/1 organization/i)).toBeInTheDocument();
	});

	it("displays user initials when no image is available", () => {
		const propsWithoutImage = {
			...defaultProps,
			imageUrl: "",
			displayName: "John Doe",
		};

		render(<ProfileHeader {...propsWithoutImage} />);

		const avatarFallback = screen.getByTestId("avatar-fallback");
		expect(avatarFallback).toBeInTheDocument();
	});

	it("shows uploading state when uploading avatar", () => {
		render(<ProfileHeader {...defaultProps} uploading={true} />);

		const uploader = screen.getByLabelText("Change profile picture");
		expect(uploader).toHaveAttribute("aria-busy", "true");
	});

	it("shows WorkOS OAuth notice when using OAuth picture", () => {
		render(<ProfileHeader {...defaultProps} hasWorkOSPicture={true} />);

		expect(
			screen.getByText("Using OAuth provider picture")
		).toBeInTheDocument();
	});

	it("calls onPickAvatar when avatar is clicked", async () => {
		const user = userEvent.setup();
		render(<ProfileHeader {...defaultProps} />);

		const uploader = screen.getByLabelText("Change profile picture");
		const input = uploader.querySelector(
			'input[type="file"]'
		) as HTMLInputElement;

		// Create a mock file
		const mockFile = new File([""], "test.jpg", { type: "image/jpeg" });
		fireEvent.change(input!, { target: { files: [mockFile] } });

		expect(defaultProps.onPickAvatar).toHaveBeenCalled();
	});

	it("hides edit button when using WorkOS OAuth picture", () => {
		render(<ProfileHeader {...defaultProps} hasWorkOSPicture={true} />);

		expect(
			screen.queryByLabelText("Change profile picture")
		).not.toBeInTheDocument();
	});

	it("displays organization count correctly", () => {
		const propsWithMultipleOrgs = {
			...defaultProps,
			orgCount: 5,
		};

		render(<ProfileHeader {...propsWithMultipleOrgs} />);

		expect(screen.getByText(/5 organizations/i)).toBeInTheDocument();
	});

	it("formats display name correctly when only email is available", () => {
		const propsWithEmailOnly = {
			...defaultProps,
			displayName: "john@example.com",
		};

		render(<ProfileHeader {...propsWithEmailOnly} />);

		const emailElements = screen.getAllByText("john@example.com");
		expect(emailElements.length).toBeGreaterThan(0);
	});
});

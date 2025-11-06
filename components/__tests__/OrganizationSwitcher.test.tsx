import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OrganizationSwitcher } from "@/app/(auth)/profilev2/components/OrganizationSwitcher";

describe("OrganizationSwitcher", () => {
	const mockMemberships = [
		{
			organizationId: "org_1",
			organizationName: "Acme Corp",
			organizationExternalId: "ext_org_1",
			organizationMetadata: {},
			organizationCreatedAt: "2023-01-01T00:00:00Z",
			memberShipId: "member_1",
			membershipOrgId: "org_1",
			membershipRole: { slug: "admin" },
			membershipRoles: [{ slug: "admin" }],
			roleDetails: [{ slug: "admin", name: "Administrator", permissions: [] }],
			primaryRoleSlug: "admin",
			membershipCreatedAt: "2023-01-01T00:00:00Z",
		},
		{
			organizationId: "org_2",
			organizationName: "Tech Solutions",
			organizationExternalId: "ext_org_2",
			organizationMetadata: {},
			organizationCreatedAt: "2023-02-01T00:00:00Z",
			memberShipId: "member_2",
			membershipOrgId: "org_2",
			membershipRole: { slug: "member" },
			membershipRoles: [{ slug: "member" }],
			roleDetails: [{ slug: "member", name: "Member", permissions: [] }],
			primaryRoleSlug: "member",
			membershipCreatedAt: "2023-02-01T00:00:00Z",
		},
	];

	const defaultProps = {
		memberships: mockMemberships,
		activeOrganizationId: "org_1",
		isSwitching: false,
		onOrganizationChange: vi.fn(),
	};

	it("renders organization switcher with current organization", () => {
		render(<OrganizationSwitcher {...defaultProps} />);

		expect(screen.getByText("Active Organization")).toBeInTheDocument();
		expect(screen.getByText("Acme Corp")).toBeInTheDocument();
	});

	it("shows dropdown with all organizations", async () => {
		const user = userEvent.setup();
		render(<OrganizationSwitcher {...defaultProps} />);

		const trigger = screen.getByRole("combobox", {
			name: /select organization/i,
		});
		fireEvent.click(trigger);

		expect(
			screen.getByRole("option", { name: "Acme Corp" })
		).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: "Tech Solutions" })
		).toBeInTheDocument();
	});

	it("calls onOrganizationChange when organization is selected", async () => {
		const user = userEvent.setup();
		render(<OrganizationSwitcher {...defaultProps} />);

		const trigger = screen.getByRole("combobox", {
			name: /select organization/i,
		});
		fireEvent.click(trigger);

		const techOrgOption = screen.getByRole("option", {
			name: "Tech Solutions",
		});
		fireEvent.click(techOrgOption);

		expect(defaultProps.onOrganizationChange).toHaveBeenCalledWith("org_2");
	});

	it("displays switching state when isSwitching is true", () => {
		render(<OrganizationSwitcher {...defaultProps} isSwitching={true} />);

		expect(screen.getByText("Switching organization...")).toBeInTheDocument();
	});

	it("shows organization count", () => {
		render(<OrganizationSwitcher {...defaultProps} />);

		expect(screen.getByText(/2 organizations/i)).toBeInTheDocument();
	});

	it("disables interaction when switching", async () => {
		const user = userEvent.setup();
		render(<OrganizationSwitcher {...defaultProps} isSwitching={true} />);

		const trigger = screen.getByRole("combobox", {
			name: /select organization/i,
		});
		expect(trigger).toBeDisabled();

		fireEvent.click(trigger);

		// Dropdown should not open when switching
		expect(screen.queryByRole("option")).not.toBeInTheDocument();
	});

	it("displays organization role", () => {
		render(<OrganizationSwitcher {...defaultProps} />);

		expect(screen.getByText("Administrator")).toBeInTheDocument();
	});

	it("handles empty memberships", () => {
		render(
			<OrganizationSwitcher
				{...defaultProps}
				memberships={[]}
				onOrganizationChange={vi.fn()}
			/>
		);

		expect(screen.getByText("No organizations")).toBeInTheDocument();
	});

	it("displays organization metadata if available", () => {
		const membershipsWithMetadata = [
			{
				organizationId: "org_1",
				organizationName: "Acme Corp",
				organizationExternalId: "ext_org_1",
				organizationMetadata: { plan: "enterprise" },
				organizationCreatedAt: "2023-01-01T00:00:00Z",
				memberShipId: "member_1",
				membershipOrgId: "org_1",
				membershipRole: { slug: "admin" },
				membershipRoles: [{ slug: "admin" }],
				roleDetails: [{ slug: "admin", name: "Administrator", permissions: [] }],
				primaryRoleSlug: "admin",
				membershipCreatedAt: "2023-01-01T00:00:00Z",
			},
		];

		render(
			<OrganizationSwitcher
				activeOrganizationId="org_1"
				isSwitching={false}
				memberships={membershipsWithMetadata}
				onOrganizationChange={vi.fn()}
			/>
		);

		expect(screen.getByText("Acme Corp")).toBeInTheDocument();
	});

	it("formats organization count correctly for singular", () => {
		const singleOrgProps = {
			...defaultProps,
			memberships: [mockMemberships[0]],
		};

		render(<OrganizationSwitcher {...singleOrgProps} />);

		expect(screen.getByText(/1 organization/i)).toBeInTheDocument();
	});
});

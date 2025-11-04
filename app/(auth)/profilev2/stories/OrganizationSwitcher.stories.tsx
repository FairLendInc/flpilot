import type { Meta, StoryObj } from "@storybook/react";
import { OrganizationSwitcher } from "../components/OrganizationSwitcher";

const meta: Meta<typeof OrganizationSwitcher> = {
	title: "Profile/OrganizationSwitcher",
	component: OrganizationSwitcher,
};

export default meta;
type Story = StoryObj<typeof OrganizationSwitcher>;

// Mock data
const mockMemberships = [
	{
		organizationId: "org_1",
		organizationName: "Acme Corp",
		organizationExternalId: "acme",
		organizationMetadata: {},
		organizationCreatedAt: "2024-01-01",
		memberShipId: "member_1",
		membershipOrgId: "org_1",
		roleDetails: [],
		primaryRoleSlug: "admin",
		membershipCreatedAt: "2024-01-01",
	},
	{
		organizationId: "org_2",
		organizationName: "Tech Solutions",
		organizationExternalId: "tech",
		organizationMetadata: {},
		organizationCreatedAt: "2024-02-01",
		memberShipId: "member_2",
		membershipOrgId: "org_2",
		roleDetails: [],
		primaryRoleSlug: "member",
		membershipCreatedAt: "2024-02-01",
	},
	{
		organizationId: "org_3",
		organizationName: "Global Enterprises",
		organizationExternalId: "global",
		organizationMetadata: {},
		organizationCreatedAt: "2024-03-01",
		memberShipId: "member_3",
		membershipOrgId: "org_3",
		roleDetails: [],
		primaryRoleSlug: "viewer",
		membershipCreatedAt: "2024-03-01",
	},
];

export const Default: Story = {
	args: {
		memberships: mockMemberships,
		activeOrganizationId: "org_1",
		isSwitching: false,
		onOrganizationChange: (orgId: string) => console.log("Switch to:", orgId),
	},
};

export const Switching: Story = {
	args: {
		memberships: mockMemberships,
		activeOrganizationId: "org_1",
		isSwitching: true,
		onOrganizationChange: (orgId: string) => console.log("Switch to:", orgId),
	},
};

export const NoSelection: Story = {
	args: {
		memberships: mockMemberships,
		activeOrganizationId: "",
		isSwitching: false,
		onOrganizationChange: (orgId: string) => console.log("Switch to:", orgId),
	},
};

export const SingleOrganization: Story = {
	args: {
		memberships: [mockMemberships[0]],
		activeOrganizationId: "org_1",
		isSwitching: false,
		onOrganizationChange: (orgId: string) => console.log("Switch to:", orgId),
	},
};

export const ManyOrganizations: Story = {
	args: {
		memberships: [
			...mockMemberships,
			...Array.from({ length: 10 }, (_, i) => ({
				organizationId: `org_${i + 4}`,
				organizationName: `Organization ${i + 4}`,
				organizationExternalId: `org_${i + 4}`,
				organizationMetadata: {},
				organizationCreatedAt: `2024-${String(i + 4).padStart(2, "0")}-01`,
				memberShipId: `member_${i + 4}`,
				membershipOrgId: `org_${i + 4}`,
				roleDetails: [],
				primaryRoleSlug: "member",
				membershipCreatedAt: `2024-${String(i + 4).padStart(2, "0")}-01`,
			})),
		],
		activeOrganizationId: "org_1",
		isSwitching: false,
		onOrganizationChange: (orgId: string) => console.log("Switch to:", orgId),
	},
};

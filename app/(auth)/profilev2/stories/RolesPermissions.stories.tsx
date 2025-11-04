import type { Meta, StoryObj } from "@storybook/react";
import { RolesPermissions } from "../components/RolesPermissions";

const meta: Meta<typeof RolesPermissions> = {
	title: "Profile/RolesPermissions",
	component: RolesPermissions,
};

export default meta;
type Story = StoryObj<typeof RolesPermissions>;

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
		roleDetails: [
			{
				slug: "admin",
				name: "Administrator",
				permissions: ["read", "write", "delete", "manage_users"],
			},
			{
				slug: "member",
				name: "Member",
				permissions: ["read", "write"],
			},
		],
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
		roleDetails: [
			{
				slug: "viewer",
				name: "Viewer",
				permissions: ["read"],
			},
		],
		primaryRoleSlug: "viewer",
		membershipCreatedAt: "2024-02-01",
	},
];

export const WithRoles: Story = {
	args: {
		memberships: mockMemberships,
		activeOrganizationId: "org_1",
		workosPermissions: ["read", "write", "delete", "manage_users", "admin"],
		workosOrgId: "org_1",
		workosRole: "admin",
	},
};

export const WithoutRoles: Story = {
	args: {
		memberships: [
			{
				...mockMemberships[0],
				roleDetails: [],
			},
		],
		activeOrganizationId: "org_1",
		workosPermissions: [],
		workosOrgId: "org_1",
		workosRole: "admin",
	},
};

export const NoOrganization: Story = {
	args: {
		memberships: mockMemberships,
		activeOrganizationId: "",
		workosPermissions: [],
		workosOrgId: null,
		workosRole: null,
	},
};

export const MultipleRoles: Story = {
	args: {
		memberships: [
			{
				organizationId: "org_3",
				organizationName: "Global Enterprises",
				organizationExternalId: "global",
				organizationMetadata: {},
				organizationCreatedAt: "2024-03-01",
				memberShipId: "member_3",
				membershipOrgId: "org_3",
				roleDetails: [
					{
						slug: "super_admin",
						name: "Super Admin",
						permissions: [
							"read",
							"write",
							"delete",
							"manage_users",
							"manage_orgs",
							"billing",
						],
					},
					{
						slug: "admin",
						name: "Admin",
						permissions: ["read", "write", "delete", "manage_users"],
					},
					{
						slug: "manager",
						name: "Manager",
						permissions: ["read", "write"],
					},
					{
						slug: "member",
						name: "Member",
						permissions: ["read"],
					},
				],
				primaryRoleSlug: "super_admin",
				membershipCreatedAt: "2024-03-01",
			},
		],
		activeOrganizationId: "org_3",
		workosPermissions: [
			"read",
			"write",
			"delete",
			"manage_users",
			"manage_orgs",
			"billing",
			"super_admin",
		],
		workosOrgId: "org_3",
		workosRole: "super_admin",
	},
};

export const WorkOSPermissions: Story = {
	args: {
		memberships: mockMemberships,
		activeOrganizationId: "org_2",
		workosPermissions: ["read", "comment", "share"],
		workosOrgId: "org_2",
		workosRole: "viewer",
	},
};

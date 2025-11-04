import type { Meta, StoryObj } from "@storybook/react";
import { ProfileHeader } from "../components/ProfileHeader";

const meta: Meta<typeof ProfileHeader> = {
	title: "Profile/ProfileHeader",
	component: ProfileHeader,
	parameters: {
		layout: "fullscreen",
	},
};

export default meta;
type Story = StoryObj<typeof ProfileHeader>;

// Mock data
const mockUserData = {
	user: {
		first_name: "John",
		last_name: "Doe",
		email: "john.doe@example.com",
		phone: "+1 (555) 123-4567",
		profile_picture_url: undefined,
		profile_picture: undefined,
	},
	workOsIdentity: {
		profile_picture_url: undefined,
		permissions: [],
		org_id: "org_123",
		role: "admin",
	},
	memberships: [],
	activeOrganizationId: null,
	workosPermissions: ["read", "write"],
	workosOrgId: "org_123",
	workosRole: "admin",
};

export const WithPicture: Story = {
	args: {
		userData: {
			...mockUserData,
			user: {
				...mockUserData.user,
				profile_picture_url: "https://via.placeholder.com/128",
			},
		},
		uploading: false,
		hasWorkOSPicture: false,
		imageUrl: "https://via.placeholder.com/128",
		displayName: "John Doe",
		email: "john.doe@example.com",
		orgCount: 3,
		activeRoleName: "Administrator",
		onPickAvatar: () => console.log("Pick avatar"),
		getInitials: (firstName: string, lastName: string) =>
			`${firstName[0]}${lastName[0]}`,
	},
};

export const WithoutPicture: Story = {
	args: {
		userData: mockUserData,
		uploading: false,
		hasWorkOSPicture: false,
		imageUrl: "",
		displayName: "John Doe",
		email: "john.doe@example.com",
		orgCount: 3,
		activeRoleName: "Administrator",
		onPickAvatar: () => console.log("Pick avatar"),
		getInitials: (firstName: string, lastName: string) =>
			`${firstName[0]}${lastName[0]}`,
	},
};

export const WithWorkOSPicture: Story = {
	args: {
		userData: {
			...mockUserData,
			workOsIdentity: {
				...mockUserData.workOsIdentity,
				profile_picture_url: "https://via.placeholder.com/128",
			},
		},
		uploading: false,
		hasWorkOSPicture: true,
		imageUrl: "https://via.placeholder.com/128",
		displayName: "John Doe",
		email: "john.doe@example.com",
		orgCount: 3,
		activeRoleName: "Administrator",
		onPickAvatar: () => console.log("Pick avatar"),
		getInitials: (firstName: string, lastName: string) =>
			`${firstName[0]}${lastName[0]}`,
	},
};

export const Uploading: Story = {
	args: {
		userData: mockUserData,
		uploading: true,
		hasWorkOSPicture: false,
		imageUrl: "",
		displayName: "John Doe",
		email: "john.doe@example.com",
		orgCount: 3,
		activeRoleName: "Administrator",
		onPickAvatar: () => console.log("Pick avatar"),
		getInitials: (firstName: string, lastName: string) =>
			`${firstName[0]}${lastName[0]}`,
	},
};

export const NoName: Story = {
	args: {
		userData: {
			...mockUserData,
			user: {
				first_name: "",
				last_name: "",
				email: "user@example.com",
				phone: "",
				profile_picture_url: undefined,
				profile_picture: undefined,
			},
		},
		uploading: false,
		hasWorkOSPicture: false,
		imageUrl: "",
		displayName: "User",
		email: "user@example.com",
		orgCount: 1,
		activeRoleName: "Member",
		onPickAvatar: () => console.log("Pick avatar"),
		getInitials: () => "U",
	},
};

export const MultipleOrganizations: Story = {
	args: {
		userData: {
			...mockUserData,
			memberships: [
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
			],
		},
		uploading: false,
		hasWorkOSPicture: false,
		imageUrl: "",
		displayName: "John Doe",
		email: "john.doe@example.com",
		orgCount: 2,
		activeRoleName: "Administrator",
		onPickAvatar: () => console.log("Pick avatar"),
		getInitials: (firstName: string, lastName: string) =>
			`${firstName[0]}${lastName[0]}`,
	},
};

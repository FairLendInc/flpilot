import type { Preloaded } from "convex/react";
import type { api } from "@/convex/_generated/api";

// WorkOS Identity type - replaces (any)
export type WorkOSIdentity = {
	profile_picture_url?: string;
	permissions?: string[];
	org_id?: string;
	role?: string;
	[key: string]: unknown;
};

// User type from profile data
export type UserData = {
	first_name?: string;
	last_name?: string;
	email?: string;
	phone?: string;
	profile_picture_url?: string;
	profile_picture?: string;
};

// Role details from membership
export type RoleDetails = {
	slug: string;
	name: string;
	permissions: string[];
};

// Organization membership data
export type MembershipData = {
	organizationId: string;
	organizationName: string;
	organizationExternalId: string;
	organizationMetadata: Record<string, unknown>;
	organizationCreatedAt: string;
	memberShipId: string;
	membershipOrgId: string;
	membershipRole?: {
		slug: string;
	};
	membershipRoles?: Array<{
		slug: string;
	}>;
	roleDetails: RoleDetails[];
	primaryRoleSlug: string;
	membershipCreatedAt: string;
};

// Complete profile data structure
export type ProfileData = {
	user: UserData | null;
	workOsIdentity: WorkOSIdentity | null;
	memberships: MembershipData[];
	activeOrganizationId: string | null;
	workosPermissions?: string[];
	workosOrgId?: string | null;
	workosRole?: string | null;
};

// Props type for ProfileForm component
export type ProfileFormProps = {
	userData: Preloaded<typeof api.profile.getCurrentUserProfile>;
};

// Props for ProfileHeader component
export type ProfileHeaderProps = {
	userData: ProfileData;
	uploading: boolean;
	hasWorkOSPicture: boolean;
	imageUrl: string;
	displayName: string;
	email: string;
	orgCount: number;
	activeRoleName: string;
	onPickAvatar: (file: File) => void;
	getInitials: (firstName: string, lastName: string, email: string) => string;
};

// Props for OrganizationSwitcher component
export type OrganizationSwitcherProps = {
	memberships: MembershipData[];
	activeOrganizationId: string;
	isSwitching: boolean;
	onOrganizationChange: (orgId: string) => void;
};

// Props for ProfileFormFields component
export type ProfileFormFieldsProps = {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	isSaving: boolean;
	onFirstNameChange: (value: string) => void;
	onLastNameChange: (value: string) => void;
	onPhoneChange: (value: string) => void;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

// Props for RolesPermissions component
export type RolesPermissionsProps = {
	memberships: MembershipData[];
	activeOrganizationId: string;
	activeMembershipData?: MembershipData;
	workosPermissions?: string[];
	workosOrgId?: string | null;
	workosRole?: string | null;
};

// Props for SettingsTabs component
export type SettingsTabsProps = {
	onNotificationToggle: (type: string, checked: boolean) => void;
};

// Form state type
export type FormState = {
	firstName: string;
	lastName: string;
	phone: string;
};

// Avatar upload state
export type AvatarUploadState = {
	uploading: boolean;
};

// Organization switch state
export type OrganizationSwitchState = {
	isSwitching: boolean;
};

// Profile save state
export type ProfileSaveState = {
	isSaving: boolean;
};

// Validation result type
export type ValidationResult = {
	isValid: boolean;
	message?: string;
};

// File validation result
export type FileValidationResult = {
	isValid: boolean;
	error?: string;
};

// Active membership data (derived type)
export type ActiveMembershipData = MembershipData | undefined;

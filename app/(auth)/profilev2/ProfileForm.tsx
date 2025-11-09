"use client";

import { usePreloadedQuery } from "convex/react";
import { useProvisionCurrentUser } from "@/hooks/useProvisionCurrentUser";
import { OrganizationSwitcher } from "./components/OrganizationSwitcher";
import { ProfileFormFields } from "./components/ProfileFormFields";
import { ProfileHeader } from "./components/ProfileHeader";
import { RolesPermissions } from "./components/RolesPermissions";
import { SettingsTabs } from "./components/SettingsTabs";
import {
	useAvatarUpload,
	useOrganizationSwitch,
	useProfileForm,
} from "./hooks";
import type { ProfileData, ProfileFormProps } from "./types";

// React Compiler handles all memoization, state tracking, and dead code elimination automatically
// No need for manual useMemo, useCallback, or explicit optimization patterns

export default function ProfileForm({ userData }: ProfileFormProps) {
	const userProfileData = usePreloadedQuery(userData);
	useProvisionCurrentUser(userProfileData);

	// Create a properly typed version of the data
	const typedUserProfileData: ProfileData = {
		...userProfileData,
		activeOrganizationId:
			typeof userProfileData.activeOrganizationId === "string"
				? userProfileData.activeOrganizationId
				: userProfileData.activeOrganizationId
					? String(userProfileData.activeOrganizationId)
					: null,
	};

	// Derived data - React Compiler will automatically memoize
	function getDerivedData(data: ProfileData) {
		const workOSIdentity = data.workOsIdentity as any;
		const workosImageUrl = workOSIdentity?.profile_picture_url || null;
		const hasWorkOSPicture = !!workosImageUrl;

		const imageUrl =
			workosImageUrl ||
			data.user?.profile_picture_url ||
			data.user?.profile_picture ||
			"";
		const email = data.user?.email || "";
		const displayName =
			[data.user?.first_name, data.user?.last_name].filter(Boolean).join(" ") ||
			email ||
			"User";

		const orgCount = data.memberships.length;
		const activeOrganizationId = data.activeOrganizationId || "";

		const activeMembershipData = data.memberships.find(
			(m) => m.organizationId === activeOrganizationId
		);
		const activeRoleName =
			activeMembershipData?.roleDetails.find(
				(r) => r.slug === activeMembershipData.primaryRoleSlug
			)?.name || "Member";

		return {
			workosImageUrl,
			hasWorkOSPicture,
			imageUrl,
			email,
			displayName,
			orgCount,
			activeOrganizationId,
			activeMembershipData,
			activeRoleName,
		};
	}

	const derivedData = getDerivedData(typedUserProfileData);

	// Utility function - React Compiler optimizes automatically
	function getInitials(firstName: string, lastName: string, email: string) {
		if (firstName && lastName) {
			return `${firstName[0]}${lastName[0]}`.toUpperCase();
		}
		if (email) return email[0].toUpperCase();
		return "U";
	}

	// Custom hooks for business logic
	const { formState, isSaving, setFirstName, setLastName, setPhone, onSubmit } =
		useProfileForm({
			firstName: userProfileData.user?.first_name || "",
			lastName: userProfileData.user?.last_name || "",
			phone: userProfileData.user?.phone || "",
		});

	const { uploading, uploadAvatar } = useAvatarUpload();
	const { isSwitching, switchOrganization } = useOrganizationSwitch(
		typedUserProfileData.activeOrganizationId
	);

	// Handlers - React Compiler handles automatic memoization
	async function handleOrganizationChange(orgId: string) {
		await switchOrganization(orgId);
	}

	async function handlePickAvatar(file: File) {
		await uploadAvatar(file);
	}

	function handleNotificationToggle(type: string, checked: boolean) {
		console.log("Notification toggle", type, checked);
	}

	return (
		<div className="space-y-8">
			{/* HERO BANNER - Full width with dramatic gradient */}
			<ProfileHeader
				activeRoleName={derivedData.activeRoleName}
				displayName={derivedData.displayName}
				email={derivedData.email}
				getInitials={getInitials}
				hasWorkOSPicture={derivedData.hasWorkOSPicture}
				imageUrl={derivedData.imageUrl}
				onPickAvatar={handlePickAvatar}
				orgCount={derivedData.orgCount}
				uploading={uploading}
				userData={typedUserProfileData}
			/>

			{/* TWO COLUMN LAYOUT */}
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
				{/* LEFT COLUMN */}
				<div className="space-y-8">
					{/* Organization Switcher */}
					<OrganizationSwitcher
						activeOrganizationId={derivedData.activeOrganizationId}
						isSwitching={isSwitching}
						memberships={typedUserProfileData.memberships}
						onOrganizationChange={handleOrganizationChange}
					/>

					{/* Profile Form */}
					<ProfileFormFields
						email={derivedData.email}
						firstName={formState.firstName}
						isSaving={isSaving}
						lastName={formState.lastName}
						onFirstNameChange={setFirstName}
						onLastNameChange={setLastName}
						onPhoneChange={setPhone}
						onSubmit={onSubmit}
						phone={formState.phone}
					/>
				</div>

				{/* RIGHT COLUMN - Roles & Permissions */}
				<div>
					<RolesPermissions
						activeMembershipData={derivedData.activeMembershipData}
						activeOrganizationId={derivedData.activeOrganizationId}
						memberships={typedUserProfileData.memberships}
						workosOrgId={typedUserProfileData.workosOrgId}
						workosPermissions={typedUserProfileData.workosPermissions}
						workosRole={typedUserProfileData.workosRole}
					/>
				</div>
			</div>

			{/* FULL WIDTH - Settings Tabs */}
			<SettingsTabs onNotificationToggle={handleNotificationToggle} />
		</div>
	);
}

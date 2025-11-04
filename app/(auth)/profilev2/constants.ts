// File upload configuration
export const FILE_UPLOAD = {
	MAX_SIZE: 5 * 1024 * 1024, // 5MB
	ALLOWED_TYPES: ["image/*"],
} as const;

// Form validation constants
export const VALIDATION = {
	MIN_NAME_LENGTH: 3,
	PHONE_REGEX: /^\+?[1-9]\d{1,14}$/,
} as const;

// Toast messages
export const TOAST_MESSAGES = {
	ORG_SWITCH: {
		loading: "Switching organization...",
		success: "Organization switched successfully",
		error: "Failed to switch organization",
	},
	AVATAR_UPLOAD: {
		loading: "Uploading profile picture...",
		success: "Profile picture updated successfully",
		error: "Failed to upload profile picture",
	},
	PROFILE_UPDATE: {
		loading: "Saving profile changes...",
		success: (synced: boolean) =>
			synced
				? "Profile updated successfully"
				: "Saved locally. WorkOS sync will retry later.",
		error: "Failed to save profile",
	},
	SETTINGS: {
		twoFactor: "Two-factor authentication coming soon",
		password: "Password management coming soon",
		sessions: "Session management coming soon",
		pushNotifications: "Push notifications coming soon",
	},
	NOTIFICATIONS: {
		accountUpdates: {
			enabled: "Account updates enabled",
			disabled: "Account updates disabled",
		},
		securityAlerts: {
			enabled: "Security alerts enabled",
			disabled: "Security alerts disabled",
		},
		productUpdates: {
			enabled: "Product updates enabled",
			disabled: "Product updates disabled",
		},
	},
} as const;

// UI constants
export const UI = {
	AVATAR_SIZE: {
		hero: "h-32 w-32",
		fallback: "bg-linear-to-br from-blue-100 to-purple-100",
	},
	BADGE_COLORS: {
		organization:
			"bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
		role: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
	},
	GRADIENTS: {
		primary: "bg-linear-to-br from-blue-600 to-purple-600",
		secondary: "bg-linear-to-br from-purple-600 to-pink-600",
		cardHeader:
			"bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950",
		cardHeaderAlt:
			"bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950",
	},
} as const;

// Error messages
export const ERROR_MESSAGES = {
	INVALID_FILE_TYPE: "Please select an image file",
	FILE_TOO_LARGE: "Image must be ≤ 5MB",
	NO_ORGANIZATION: "None selected",
	NO_ROLES_ASSIGNED: "No roles assigned",
	NO_PERMISSIONS: "No permissions defined",
} as const;

// Accessibility labels
export const A11Y = {
	AVATAR_INPUT: "Change profile picture",
	ORG_SELECT: "Select organization",
	SECURITY_TAB: "Security",
	NOTIFICATIONS_TAB: "Notifications",
	CHECKBOXES: {
		accountUpdates: "Enable account updates notifications",
		securityAlerts: "Enable security alerts notifications",
		productUpdates: "Enable product updates notifications",
	},
} as const;

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useAction, useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
	ERROR_MESSAGES,
	FILE_UPLOAD,
	TOAST_MESSAGES,
	VALIDATION,
} from "../constants";
import type {
	FileValidationResult,
	FormState,
	ValidationResult,
} from "../types";

/**
 * Hook for managing profile form state, validation, and submission
 * React Compiler automatically optimizes all functions and state updates
 */
export function useProfileForm(initialUserData: {
	firstName: string;
	lastName: string;
	phone: string;
}) {
	const updateProfile = useMutation(api.profile.updateProfile);
	const [isSaving, setIsSaving] = useState(false);

	// Form state
	const [formState, setFormState] = useState<FormState>({
		firstName: initialUserData.firstName,
		lastName: initialUserData.lastName,
		phone: initialUserData.phone,
	});

	// Validation functions - React Compiler handles automatic memoization
	function validateName(value: string): ValidationResult {
		if (value.length < VALIDATION.MIN_NAME_LENGTH) {
			return {
				isValid: false,
				message: `Name must be at least ${VALIDATION.MIN_NAME_LENGTH} characters`,
			};
		}
		return { isValid: true };
	}

	function validatePhone(value: string): ValidationResult {
		if (value && !VALIDATION.PHONE_REGEX.test(value)) {
			return { isValid: false, message: "Please enter a valid phone number" };
		}
		return { isValid: true };
	}

	// Form field handlers - React Compiler optimizes
	function setFirstName(value: string) {
		setFormState((prev) => ({ ...prev, firstName: value }));
	}

	function setLastName(value: string) {
		setFormState((prev) => ({ ...prev, lastName: value }));
	}

	function setPhone(value: string) {
		setFormState((prev) => ({ ...prev, phone: value }));
	}

	// Form submission handler - React Compiler handles optimization
	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setIsSaving(true);

		const promise = updateProfile({
			first_name: formState.firstName,
			last_name: formState.lastName,
			phone: formState.phone,
		});

		toast.promise(promise, {
			loading: TOAST_MESSAGES.PROFILE_UPDATE.loading,
			success: (res: any) => {
				if (res.synced) {
					return TOAST_MESSAGES.PROFILE_UPDATE.success(true);
				}
				return TOAST_MESSAGES.PROFILE_UPDATE.success(false);
			},
			error: TOAST_MESSAGES.PROFILE_UPDATE.error,
		});

		try {
			await promise;
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			console.error("Profile update failed:", errorMessage);
		} finally {
			setIsSaving(false);
		}
	}

	return {
		// State
		formState,
		isSaving,
		// Setters
		setFirstName,
		setLastName,
		setPhone,
		// Handlers
		onSubmit,
		// Validation
		validateName,
		validatePhone,
	};
}

/**
 * Hook for managing avatar upload functionality
 * React Compiler optimizes file validation and upload logic automatically
 */
export function useAvatarUpload() {
	const [uploading, setUploading] = useState(false);
	const generateUploadUrl = useAction(api.profile.generateUploadUrl);
	const saveProfilePicture = useMutation(api.profile.saveProfilePicture);

	// File validation - React Compiler handles memoization
	function validateFile(file: File): FileValidationResult {
		if (!file) {
			return { isValid: false, error: "No file selected" };
		}

		if (!FILE_UPLOAD.ALLOWED_TYPES.some((type) => file.type.match(type))) {
			return { isValid: false, error: ERROR_MESSAGES.INVALID_FILE_TYPE };
		}

		if (file.size > FILE_UPLOAD.MAX_SIZE) {
			return { isValid: false, error: ERROR_MESSAGES.FILE_TOO_LARGE };
		}

		return { isValid: true };
	}

	// Upload avatar - React Compiler optimizes async operations
	async function uploadAvatar(file: File) {
		const validation = validateFile(file);
		if (!validation.isValid) {
			toast.error(validation.error);
			return;
		}

		setUploading(true);

		const promise = (async () => {
			const uploadUrl = await generateUploadUrl({});
			const res = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": file.type },
				body: file,
			});
			const json = await res.json();
			const storageId = json.storageId as Id<"_storage">;
			await saveProfilePicture({ storageId });
		})();

		toast.promise(promise, {
			loading: TOAST_MESSAGES.AVATAR_UPLOAD.loading,
			success: TOAST_MESSAGES.AVATAR_UPLOAD.success,
			error: TOAST_MESSAGES.AVATAR_UPLOAD.error,
		});

		try {
			await promise;
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			console.error("Avatar upload failed:", errorMessage);
		} finally {
			setUploading(false);
		}
	}

	return {
		uploading,
		uploadAvatar,
		validateFile,
	};
}

/**
 * Hook for managing organization switching
 * React Compiler handles all state transitions and async operations
 */
export function useOrganizationSwitch(
	_initialOrgId: string | null,
	onOrgSwitchComplete?: (orgId: string) => void
) {
	const [isSwitching, setIsSwitching] = useState(false);
	const setActiveOrgMutation = useMutation(api.profile.setActiveOrganization);
	const { switchToOrganization } = useAuth();

	// Switch organization - React Compiler optimizes async operations
	async function switchOrganization(orgId: string) {
		setIsSwitching(true);

		const promise = (async () => {
			// Update Convex DB first
			await setActiveOrgMutation({ organization_id: orgId });
			// Then switch in WorkOS (handles re-auth if needed)
			await switchToOrganization(orgId);
		})();

		toast.promise(promise, {
			loading: TOAST_MESSAGES.ORG_SWITCH.loading,
			success: TOAST_MESSAGES.ORG_SWITCH.success,
			error: TOAST_MESSAGES.ORG_SWITCH.error,
		});

		try {
			await promise;
			onOrgSwitchComplete?.(orgId);
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			console.error("Failed to switch organization:", errorMessage);
		} finally {
			setIsSwitching(false);
		}
	}

	return {
		isSwitching,
		switchOrganization,
	};
}

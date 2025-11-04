"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SettingsDialog } from "@/components/settings-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/convex/_generated/api";

// Regex for splitting on whitespace (defined at module level for performance)
const WHITESPACE_REGEX = /\s+/;

function getInitials(name?: string | null, email?: string | null) {
	if (name?.trim()) {
		const parts = name.trim().split(WHITESPACE_REGEX);
		const first = parts[0]?.[0] ?? "";
		const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "";
		const initials = `${first}${last}`.toUpperCase();
		return initials || "GU";
	}
	if (email && email.length > 0) {
		return email[0]?.toUpperCase() ?? "U";
	}
	return "GU";
}

export function UserAvatarMenu() {
	const { user, loading, signOut } = useAuth();
	const [showSettings, setShowSettings] = useState(false);
	const [settingsKey, setSettingsKey] = useState(0);
	const router = useRouter();

	// Query user profile from Convex to get custom profile picture
	const userProfile = useQuery(api.profile.getCurrentUserProfile);

	const displayName = useMemo(() => {
		if (!user) return "Guest User";
		const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
		return name || user.email || "User";
	}, [user]);

	const email = user?.email ?? null;

	// Priority: WorkOS OAuth picture > Custom uploaded picture > null (shows initials)
	// This matches the priority in profileForm.tsx to ensure consistency
	const imageUrl = useMemo(() => {
		// 1. WorkOS OAuth picture (highest priority)
		const workosUrl = (user as any)?.profilePictureUrl;
		if (workosUrl) return workosUrl;

		// 2. Custom uploaded picture (fallback when no OAuth picture)
		if (userProfile?.user?.profile_picture_url) {
			return userProfile.user.profile_picture_url;
		}
		if (userProfile?.user?.profile_picture) {
			return userProfile.user.profile_picture;
		}

		// 3. No picture - will show initials
		return null;
	}, [user, userProfile]);

	const initials = getInitials(displayName, email);

	if (loading) {
		return (
			<div
				aria-label="Loading user"
				className="h-8 w-8 animate-pulse rounded-full bg-muted"
				role="status"
			/>
		);
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger aria-label="Open user menu" asChild>
					<button
						className="inline-flex items-center justify-center rounded-full outline-hidden"
						type="button"
					>
						<Avatar>
							{imageUrl ? (
								<AvatarImage alt={displayName} src={imageUrl} />
							) : (
								<AvatarFallback>{initials}</AvatarFallback>
							)}
						</Avatar>
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="z-200" sideOffset={8}>
					<DropdownMenuLabel>
						<div className="flex min-w-40 flex-col">
							<span className="font-medium text-sm">{displayName}</span>
							{email ? (
								<span className="text-muted-foreground text-xs">{email}</span>
							) : null}
						</div>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onSelect={(e) => {
							e.preventDefault();
							router.push("/profile");
						}}
					>
						Profile
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={() => {
							if (!showSettings) setShowSettings(true);
							setSettingsKey((k) => k + 1);
						}}
					>
						Admin Panel
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onSelect={async (e) => {
							e.preventDefault();
							await signOut();
							router.push("/");
						}}
					>
						Logout
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			{showSettings ? <SettingsDialog key={settingsKey} /> : null}
		</>
	);
}

export default UserAvatarMenu;

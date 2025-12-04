"use client";

import {
	Description,
	Header,
	Label,
	ListBox,
	Popover,
	Separator,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";
import { SettingsDialog } from "@/components/settings-dialog";
import {
	getBaseTheme,
	isDarkTheme,
	type Theme,
} from "@/components/theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { api } from "@/convex/_generated/api";
import { useAuthenticatedQuery } from "@/convex/lib/client";
import { useProvisionCurrentUser } from "@/hooks/useProvisionCurrentUser";

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
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);
	const { theme, setTheme } = useTheme();
	const currentTheme = (theme || "default") as Theme;
	const isDark = isDarkTheme(currentTheme);
	const router = useRouter();

	// Query user profile from Convex to get custom profile picture
	const userProfile = useAuthenticatedQuery(
		api.profile.getCurrentUserProfile,
		{}
	);
	useProvisionCurrentUser(userProfile);

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
		const workosUrl = (user as { profilePictureUrl?: string } | undefined)
			?.profilePictureUrl;
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

	function handleAction(key: string | number) {
		if (key === "theme-toggle") {
			// Toggle between light and dark mode of the current base theme
			const baseTheme = getBaseTheme(currentTheme);
			const isCurrentlyDark = isDarkTheme(currentTheme);
			const newTheme = isCurrentlyDark
				? (baseTheme as Theme) // Switch to light mode
				: (`${baseTheme}-dark` as Theme); // Switch to dark mode
			setTheme(newTheme);
			return;
		}
		if (key === "profile") {
			setIsPopoverOpen(false);
			router.push("/profile");
		} else if (key === "admin-panel") {
			setIsPopoverOpen(false);
			if (!showSettings) setShowSettings(true);
			setSettingsKey((k) => k + 1);
		} else if (key === "logout") {
			setIsPopoverOpen(false);
			// WorkOS AuthKit signOut() clears session and redirects to WorkOS logout URL
			// Use returnTo to redirect back to home page after logout completes
			// This ensures Google's session is also cleared via WorkOS logout flow
			signOut({ returnTo: "/" }).catch((error) => {
				console.error("Failed to sign out:", error);
				// Fallback redirect if signOut fails
				window.location.href = "/";
			});
		}
	}

	return (
		<>
			<Popover.Root isOpen={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
				<Popover.Trigger>
					<button
						aria-label="Open user menu"
						className="inline-flex cursor-pointer items-center justify-center rounded-full outline-hidden"
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
				</Popover.Trigger>
				<Popover.Content
					className="bg-opacity-100"
					offset={8}
					placement="bottom end"
					style={{ zIndex: 200 }}
				>
					<Popover.Dialog>
						<Popover.Arrow />
						<ListBox
							aria-label="User menu"
							className="w-full border-none shadow-none"
							onAction={handleAction}
							selectionMode="none"
						>
							<ListBox.Section>
								<Header>
									<div className="flex min-w-40 flex-col">
										<Label className="font-semibold text-foreground text-sm">
											{displayName}
										</Label>
										{email ? (
											<Description className="text-foreground/70 text-xs">
												{email}
											</Description>
										) : null}
									</div>
								</Header>
							</ListBox.Section>
							<Separator />
							<ListBox.Section>
								<Header className="font-semibold text-foreground/60 text-xs uppercase tracking-wider">
									Appearance
								</Header>
								<ListBox.Item id="theme-toggle" textValue="Theme">
									<div className="flex h-8 items-start justify-center pt-px">
										<Icon
											className="size-4 shrink-0 text-foreground/70"
											icon={isDark ? "gravity-ui:moon" : "gravity-ui:sun"}
										/>
									</div>
									<div className="flex w-full items-center justify-between gap-4">
										<div className="flex flex-col">
											<Label className="font-medium text-foreground">
												Theme
											</Label>
											<Description className="text-foreground/60 text-xs">
												{isDark ? "Dark mode" : "Light mode"}
											</Description>
										</div>
										<Switch aria-label="Toggle dark mode" checked={isDark} />
									</div>
								</ListBox.Item>
							</ListBox.Section>
							<Separator />
							<ListBox.Section>
								<Header className="font-semibold text-foreground/60 text-xs uppercase tracking-wider">
									Account
								</Header>
								<ListBox.Item id="profile" textValue="Profile">
									<div className="flex h-8 items-start justify-center pt-px">
										<Icon
											className="size-4 shrink-0 text-foreground/70"
											icon="gravity-ui:person"
										/>
									</div>
									<div className="flex flex-col">
										<Label className="font-medium text-foreground">
											Profile
										</Label>
										<Description className="text-foreground/60 text-xs">
											View your profile
										</Description>
									</div>
								</ListBox.Item>
								<ListBox.Item id="admin-panel" textValue="Admin Panel">
									<div className="flex h-8 items-start justify-center pt-px">
										<Icon
											className="size-4 shrink-0 text-foreground/70"
											icon="gravity-ui:gear"
										/>
									</div>
									<div className="flex flex-col">
										<Label className="font-medium text-foreground">
											Admin Panel
										</Label>
										<Description className="text-foreground/60 text-xs">
											Manage settings
										</Description>
									</div>
								</ListBox.Item>
							</ListBox.Section>
							<Separator />
							<ListBox.Section>
								<Header className="font-semibold text-foreground/60 text-xs uppercase tracking-wider">
									Session
								</Header>
								<ListBox.Item
									className="flex items-center hover:bg-destructive/10"
									id="logout"
									textValue="Logout"
									variant="danger"
								>
									<div className="flex h-8 items-start justify-center pt-px">
										<Icon
											className="size-4 shrink-0 text-destructive"
											icon="gravity-ui:arrow-right-from-square"
										/>
									</div>
									<div className="flex flex-col">
										<Label className="font-medium text-destructive">
											Logout
										</Label>
										<Description className="text-destructive/70 text-xs">
											Sign out of your account
										</Description>
									</div>
								</ListBox.Item>
							</ListBox.Section>
						</ListBox>
					</Popover.Dialog>
				</Popover.Content>
			</Popover.Root>
			{showSettings ? <SettingsDialog key={settingsKey} /> : null}
		</>
	);
}

export default UserAvatarMenu;

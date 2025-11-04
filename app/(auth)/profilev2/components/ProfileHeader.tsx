"use client";

import { Icon } from "@iconify/react";
import { Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { A11Y } from "../constants";
import type { ProfileHeaderProps } from "../types";

export function ProfileHeader({
	userData,
	uploading,
	hasWorkOSPicture,
	imageUrl,
	displayName,
	email,
	orgCount,
	activeRoleName,
	onPickAvatar,
	getInitials,
}: ProfileHeaderProps) {
	return (
		<div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-600 via-purple-600 to-pink-600 p-1 shadow-2xl">
			<div className="relative rounded-[22px] bg-background p-8 sm:p-12">
				<div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
					{/* Avatar - Large and prominent */}
					<div className="relative">
						<div className="rounded-full bg-linear-to-br from-blue-500 to-purple-500 p-1 shadow-2xl">
							<Avatar className="h-32 w-32 border-4 border-background">
								{imageUrl ? (
									<AvatarImage alt={displayName} src={imageUrl} />
								) : (
									<AvatarFallback
										className="bg-linear-to-br from-blue-100 to-purple-100 font-bold text-3xl text-purple-900"
										data-testid="avatar-fallback"
									>
										{getInitials(
											userData.user?.first_name || "",
											userData.user?.last_name || "",
											email
										)}
									</AvatarFallback>
								)}
							</Avatar>
						</div>
						{!hasWorkOSPicture && (
							<label
								aria-busy={uploading}
								aria-label={A11Y.AVATAR_INPUT}
								className="-bottom-2 -right-2 absolute flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-purple-600 text-white shadow-xl transition-all hover:scale-110 hover:shadow-2xl active:scale-95"
							>
								<input
									accept="image/*"
									className="hidden"
									disabled={uploading}
									onChange={(e) => {
										const f = e.target.files?.[0];
										if (f) onPickAvatar(f);
									}}
									type="file"
								/>
								{uploading ? (
									<Icon
										className="h-6 w-6 animate-spin"
										icon="svg-spinners:ring-resize"
									/>
								) : (
									<Pencil className="h-6 w-6" />
								)}
							</label>
						)}
					</div>

					{/* User Info */}
					<div className="flex-1 space-y-4 text-center sm:text-left">
						<div>
							<h1 className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text font-bold text-4xl text-transparent tracking-tight sm:text-5xl">
								{displayName}
							</h1>
							<p className="mt-2 text-lg text-muted-foreground">{email}</p>
							{hasWorkOSPicture && (
								<p className="mt-1 text-muted-foreground text-sm">
									Using OAuth provider picture
								</p>
							)}
						</div>

						<div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
							<div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 font-semibold text-blue-700 text-sm dark:bg-blue-950 dark:text-blue-300">
								<Icon className="h-5 w-5" icon="gravity-ui:building" />
								<span>{orgCount} Organizations</span>
							</div>
							<div className="flex items-center gap-2 rounded-full bg-purple-50 px-4 py-2 font-semibold text-purple-700 text-sm dark:bg-purple-950 dark:text-purple-300">
								<Icon className="h-5 w-5" icon="gravity-ui:shield-check" />
								<span>{activeRoleName}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

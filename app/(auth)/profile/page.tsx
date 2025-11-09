"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useAction, useMutation, useQuery } from "convex/react";
import { Pencil, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useProvisionCurrentUser } from "@/hooks/useProvisionCurrentUser";

// Regex for splitting names by whitespace - defined at top level for performance
const NAME_SPLIT_REGEX = /\s+/;

type ProfileData = {
	user: any;
	roles: { slug: string; name?: string }[];
	organizations: any[];
	memberships: any[];
	activeOrganizationId: string | null;
};

function getInitials(
	first?: string | null,
	last?: string | null,
	email?: string | null
) {
	const name = [first, last].filter(Boolean).join(" ");
	if (name.trim()) {
		const parts = name.trim().split(NAME_SPLIT_REGEX);
		return (
			`${parts[0]?.[0] ?? ""}${parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : ""}`.toUpperCase() ||
			"U"
		);
	}
	if (email && email.length > 0) return email[0]?.toUpperCase() ?? "U";
	return "U";
}

export default function ProfilePage() {
	const { user: authUser } = useAuth();
	const data = useQuery(api.profile.getCurrentUserProfile);
	useProvisionCurrentUser(data);
	console.log("PROFILE DATA", { data });

	const updateProfile = useMutation(api.profile.updateProfile);
	const setActiveOrg = useMutation(api.profile.setActiveOrganization);
	const generateUploadUrl = useAction(api.profile.generateUploadUrl);
	const saveProfilePicture = useMutation(api.profile.saveProfilePicture);
	const syncOrganizations = useAction(api.profile.syncOrganizationsFromWorkOS);

	const [firstName, setFirstName] = useState<string>("");
	const [lastName, setLastName] = useState<string>("");
	const [phone, setPhone] = useState<string>("");
	const [activeOrg, setActiveOrgLocal] = useState<string>("");
	const [isSaving, setIsSaving] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [usingMocks, setUsingMocks] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);

	const composed: ProfileData | undefined = useMemo(() => {
		if (!data) return;
		const organizations =
			data.memberships.map((m) => ({
				id: m.organizationId,
				name: m.organizationName,
				created_at: m.organizationCreatedAt,
			})) ?? [];
		const memberships = data.memberships ?? [];
		const roles = memberships.map((m) => ({
			slug: m.membershipRole?.slug ?? "",
			name: m.membershipRole?.slug ?? "",
		}));
		return {
			...data,
			organizations,
			roles,
			memberships,
			activeOrganizationId: data.activeOrganizationId,
		} as ProfileData;
	}, [data]);

	console.log("COMPOSED", { composed });

	useEffect(() => {
		if (!data) return;
		setFirstName(data.user?.first_name ?? "");
		setLastName(data.user?.last_name ?? "");
		setPhone(data.user?.phone ?? "");
		setActiveOrgLocal(
			typeof data.activeOrganizationId === "string"
				? data.activeOrganizationId
				: data.activeOrganizationId
					? String(data.activeOrganizationId)
					: ""
		);
		setUsingMocks((data.memberships?.length ?? 0) === 0);
	}, [data]);

	const dirty = useMemo(() => {
		if (!data?.user) return false;
		return (
			firstName !== (data.user.first_name ?? "") ||
			lastName !== (data.user.last_name ?? "") ||
			phone !== (data.user.phone ?? "") ||
			activeOrg !== (data.activeOrganizationId ?? "")
		);
	}, [data, firstName, lastName, phone, activeOrg]);

	const displayName =
		[firstName || data?.user?.first_name, lastName || data?.user?.last_name]
			.filter(Boolean)
			.join(" ") ||
		authUser?.email ||
		"User";

	async function onSave() {
		if (!data?.user) return;
		setIsSaving(true);
		try {
			const res = await updateProfile({
				first_name: firstName,
				last_name: lastName,
				phone,
			});
			if (res.synced) {
				toast.success("Profile updated");
			} else {
				toast.warning("Saved locally. WorkOS sync will retry later.");
			}
		} catch (e: any) {
			toast.error(e?.message || "Failed to save profile");
		} finally {
			setIsSaving(false);
		}
	}

	async function onChangeOrg(value: string) {
		setActiveOrgLocal(value);
		try {
			await setActiveOrg({ organization_id: value });
			toast.success("Organization updated");
		} catch (e: any) {
			toast.error(e?.message || "Unable to change organization");
		}
	}

	async function onPickAvatar(file: File) {
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toast.error("Please select an image file");
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			toast.error("Image must be ≤ 5MB");
			return;
		}
		setUploading(true);
		try {
			const uploadUrl = await generateUploadUrl({});
			const res = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": file.type },
				body: file,
			});
			const json = await res.json();
			const storageId = json.storageId as Id<"_storage">;
			await saveProfilePicture({ storageId });
			toast.success("Profile picture updated");
		} catch (e: any) {
			toast.error(e?.message || "Upload failed");
		} finally {
			setUploading(false);
		}
	}

	async function onSyncOrganizations() {
		setIsSyncing(true);
		try {
			const result = await syncOrganizations();
			if (result.success) {
				toast.success(result.message);
				// Invalidate the current query to refetch data
				window.location.reload();
			} else {
				toast.error(result.message);
			}
		} catch (e: any) {
			toast.error(e?.message || "Failed to sync organizations");
		} finally {
			setIsSyncing(false);
		}
	}

	if (data === undefined) {
		return (
			<div className="mx-auto w-full max-w-[1120px] space-y-6 px-4 py-8">
				<Skeleton className="h-40 w-full" />
				<div className="grid gap-6 lg:grid-cols-12">
					<Skeleton className="h-80 w-full lg:col-span-4" />
					<Skeleton className="h-80 w-full lg:col-span-8" />
				</div>
			</div>
		);
	}

	// Priority: WorkOS OAuth picture > Custom uploaded picture > Initials
	// This matches the priority in profileForm.tsx and UserAvatarMenu.tsx
	const workosImageUrl =
		(data?.workOsIdentity as any)?.profile_picture_url ||
		(authUser as any)?.profilePictureUrl ||
		null;
	const hasWorkOSPicture = !!workosImageUrl;

	const imageUrl =
		workosImageUrl ||
		data?.user?.profile_picture_url ||
		data?.user?.profile_picture ||
		"";
	const email = data?.user?.email ?? authUser?.email ?? "";
	const roles = (composed?.roles ?? []) as Array<{
		slug: string;
		name?: string;
	}>;

	return (
		<div className="mx-auto w-full max-w-[1180px] space-y-6 px-4 py-8">
			<Toaster />

			{/* Hero Header */}
			<Card className="relative overflow-hidden border bg-linear-to-br from-muted/40 via-background to-background p-6">
				<div className="flex items-center gap-5">
					{hasWorkOSPicture ? (
						// WorkOS OAuth picture - no edit button
						<div className="flex flex-col items-center gap-2">
							<Avatar className="h-20 w-20 border">
								{imageUrl ? (
									<AvatarImage alt={displayName} src={imageUrl} />
								) : (
									<AvatarFallback className="text-lg">
										{getInitials(firstName, lastName, email)}
									</AvatarFallback>
								)}
							</Avatar>
							<p className="text-center text-muted-foreground text-xs">
								Using OAuth provider picture
							</p>
						</div>
					) : (
						// Custom picture - show edit button
						<div className="relative">
							<Avatar className="h-20 w-20 border">
								{imageUrl ? (
									<AvatarImage alt={displayName} src={imageUrl} />
								) : (
									<AvatarFallback className="text-lg">
										{getInitials(firstName, lastName, email)}
									</AvatarFallback>
								)}
							</Avatar>
							<label
								aria-label="Change profile picture"
								className="-bottom-1 -right-1 absolute inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border bg-background shadow"
							>
								<input
									accept="image/*"
									className="hidden"
									onChange={(e) => {
										const f = e.target.files?.[0];
										if (f) onPickAvatar(f);
									}}
									type="file"
								/>
								{uploading ? (
									<Upload className="h-4 w-4" />
								) : (
									<Pencil className="h-4 w-4" />
								)}
							</label>
						</div>
					)}
					<div className="min-w-0">
						<div className="truncate font-semibold text-xl tracking-tight">
							{displayName}
						</div>
						<div className="truncate text-muted-foreground text-sm">
							{email}
						</div>
					</div>
				</div>
			</Card>

			{usingMocks ? (
				<Card className="border border-dashed p-4 text-sm">
					Using demo organizations for preview. Connect WorkOS orgs to see real
					memberships.
				</Card>
			) : null}

			<div className="grid gap-6 lg:grid-cols-12">
				{/* Left rail (≈38%) */}
				<div className="space-y-6 lg:col-span-4">
					<Card className="p-5">
						<div className="mb-3 font-medium text-sm">Roles</div>
						<div className="flex flex-wrap gap-2">
							{roles.length === 0 ? (
								<span className="text-muted-foreground text-sm">No roles</span>
							) : null}
							{roles.map((r) => (
								<Badge className="capitalize" key={r.slug} variant="secondary">
									{r.name || r.slug}
								</Badge>
							))}
						</div>
					</Card>

					<Card className="p-5">
						<div className="mb-3 font-medium text-sm">Organization</div>
						<Select onValueChange={(v) => onChangeOrg(v)} value={activeOrg}>
							<SelectTrigger>
								<SelectValue placeholder="Select organization" />
							</SelectTrigger>
							<SelectContent>
								{(composed?.organizations ?? []).map((o) => (
									<SelectItem key={o.id} value={o.id}>
										{o.name}
										{o.isMock ? " (Demo)" : ""}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{usingMocks && (
							<div className="mt-3">
								<Button
									className="w-full"
									disabled={isSyncing}
									onClick={() => onSyncOrganizations()}
									size="sm"
									variant="outline"
								>
									{isSyncing ? "Syncing..." : "Sync Organizations from WorkOS"}
								</Button>
							</div>
						)}
					</Card>
				</div>

				{/* Right content (≈62%) */}
				<div className="space-y-6 lg:col-span-8">
					<Card className="p-5">
						<div className="mb-4 font-medium text-sm">Personal Information</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="first">First name</Label>
								<Input
									id="first"
									onChange={(e) => setFirstName(e.target.value)}
									placeholder="First name"
									value={firstName}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="last">Last name</Label>
								<Input
									id="last"
									onChange={(e) => setLastName(e.target.value)}
									placeholder="Last name"
									value={lastName}
								/>
							</div>
							<div className="space-y-2 sm:col-span-2">
								<Label htmlFor="email">Email (read-only)</Label>
								<Input disabled id="email" readOnly value={email} />
							</div>
							<div className="space-y-2 sm:col-span-2">
								<Label htmlFor="phone">Phone</Label>
								<Input
									id="phone"
									onChange={(e) => setPhone(e.target.value)}
									placeholder="e.g. +1 415 555 2671"
									value={phone}
								/>
							</div>
						</div>
						<div className="mt-5 flex items-center gap-3">
							<Button disabled={!dirty || isSaving} onClick={() => onSave()}>
								{isSaving ? "Saving..." : "Save changes"}
							</Button>
							{dirty ? null : (
								<span className="text-muted-foreground text-sm">
									All changes saved
								</span>
							)}
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
}

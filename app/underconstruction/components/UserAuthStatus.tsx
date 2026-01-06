"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { motion } from "framer-motion";
import { Building2, Loader2, LogOut, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useAuthenticatedQuery } from "@/convex/lib/client";

export function UserAuthStatus() {
	const { user: authUser, loading: authLoading, signOut } = useAuth();

	const profileData = useAuthenticatedQuery(
		api.profile.getCurrentUserProfile,
		authUser ? {} : "skip"
	);

	if (authLoading) {
		return (
			<div className="flex flex-col items-center gap-2 py-4">
				<Loader2 className="h-6 w-6 animate-spin text-amber-500/50" />
				<span className="text-slate-500 text-sm">Verifying session...</span>
			</div>
		);
	}

	if (!authUser) {
		return (
			<div className="flex flex-col items-center gap-4">
				<div className="flex gap-4 font-medium text-sm">
					<a
						className="rounded-full border border-amber-500/10 bg-amber-500/5 px-4 py-2 text-amber-500 transition-colors hover:text-amber-400"
						href="/sign-in"
					>
						Sign In
					</a>
					<span className="flex items-center text-slate-600">or</span>
					<a
						className="rounded-full border border-amber-500/10 bg-amber-500/5 px-4 py-2 text-amber-500 transition-colors hover:text-amber-400"
						href="/sign-up"
					>
						Sign Up
					</a>
				</div>
			</div>
		);
	}

	const activeOrgName =
		profileData?.memberships?.find(
			(m) => m.organizationId === profileData.activeOrganizationId
		)?.organizationName || "No active organization";

	const userRole = profileData?.workosRole || "Member";

	return (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1 shadow-2xl backdrop-blur-xl"
			initial={{ opacity: 0, y: 10 }}
			transition={{ duration: 0.5, ease: "easeOut" }}
		>
			<div className="relative flex flex-col gap-4 p-6">
				{/* Header Gradient */}
				<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

				{/* User Info Section */}
				<div className="space-y-4">
					<div className="flex items-start gap-4">
						<div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 shadow-inner">
							<User className="size-5 text-amber-500" />
						</div>
						<div className="flex min-w-0 flex-col">
							<span className="font-semibold text-slate-500 text-xs uppercase tracking-wider">
								Signed in as
							</span>
							<span className="truncate font-medium text-sm text-white">
								{authUser?.email}
							</span>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3 pb-2">
						<div className="flex flex-col gap-1 rounded-xl border border-white/5 bg-white/[0.03] p-3">
							<div className="flex items-center gap-2 text-slate-400">
								<Building2 className="size-3.5" />
								<span className="font-bold text-[10px] uppercase tracking-widest">
									Organization
								</span>
							</div>
							<span className="truncate font-medium text-slate-200 text-xs">
								{profileData ? (
									activeOrgName
								) : (
									<Loader2 className="ml-1 inline size-3 animate-spin" />
								)}
							</span>
						</div>
						<div className="flex flex-col gap-1 rounded-xl border border-white/5 bg-white/[0.03] p-3">
							<div className="flex items-center gap-2 text-slate-400">
								<ShieldCheck className="size-3.5" />
								<span className="font-bold text-[10px] uppercase tracking-widest">
									Role
								</span>
							</div>
							<span className="truncate font-medium text-slate-200 text-xs capitalize">
								{profileData ? (
									userRole
								) : (
									<Loader2 className="ml-1 inline size-3 animate-spin" />
								)}
							</span>
						</div>
					</div>
				</div>

				{/* Sign Out Action */}
				<Button
					className="group relative h-11 w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 px-4 text-slate-400 transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
					onClick={() => signOut({ returnTo: "/" })}
					variant="ghost"
				>
					<div className="flex items-center justify-center gap-2">
						<LogOut className="group-hover:-translate-x-1 size-4 transition-transform" />
						<span className="font-semibold tracking-wide">Sign Out</span>
					</div>
					<div className="-translate-x-full absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
				</Button>
			</div>
		</motion.div>
	);
}

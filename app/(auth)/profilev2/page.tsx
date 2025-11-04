import { withAuth } from "@workos-inc/authkit-nextjs";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import ProfileForm from "./ProfileForm";

export default async function ProfileV2Page() {
	const { accessToken } = await withAuth();
	const profileDataPreLoad = await preloadQuery(
		api.profile.getCurrentUserProfile,
		{},
		{ token: accessToken }
	);

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-8">
			<ProfileForm userData={profileDataPreLoad} />
		</div>
	);
}

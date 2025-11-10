import { withAuth } from "@workos-inc/authkit-nextjs";
import { preloadQuery } from "convex/nextjs";
import { AdminListingsManagePageClient } from "@/components/admin/listings/AdminListingsManagePageClient";
import { api } from "@/convex/_generated/api";

export default async function AdminListingsManagePage() {
	const { accessToken } = await withAuth();

	// Preload all listings with mortgage information
	const preloaded = await preloadQuery(
		api.listings.getAvailableListingsWithMortgages,
		{},
		{ token: accessToken }
	);

	// Pass preloaded data to client component
	return <AdminListingsManagePageClient preloaded={preloaded} />;
}

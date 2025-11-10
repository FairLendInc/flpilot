import { withAuth } from "@workos-inc/authkit-nextjs";
import { preloadQuery } from "convex/nextjs";
import { AdminMortgagesManagePageClient } from "@/components/admin/mortgages/AdminMortgagesManagePageClient";
import { api } from "@/convex/_generated/api";

export default async function AdminMortgagesManagePage() {
	const { accessToken } = await withAuth();

	// Preload all mortgages with borrower information
	const preloaded = await preloadQuery(
		api.mortgages.listAllMortgagesWithBorrowers,
		{},
		{ token: accessToken }
	);

	// Pass preloaded data to client component
	return <AdminMortgagesManagePageClient preloaded={preloaded} />;
}

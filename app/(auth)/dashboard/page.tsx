import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { dashboardHome } from "@/lib/auth/dashboardRoutes";

export default async function DashboardPage() {
	const user = await withAuth();
	const destination = dashboardHome(user?.role);

	redirect(destination);
}

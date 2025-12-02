import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
export default async function DashboardPage() {
	const user = await withAuth();
	console.log("USER FROM DASHBOARD PAGE", user);

	const role = user?.role;

	// Handle member role - redirect to profile
	if (role === "member") {
		redirect("/profile");
	}

	// Map roles to their dashboard routes
	// org-admin maps to admin dashboard
	if (role === "org-admin") {
		redirect("/dashboard/admin");
	}

	// Other roles that have dedicated dashboards
	if (role === "broker") {
		redirect("/dashboard/broker");
	}

	if (role === "lawyer") {
		redirect("/dashboard/lawyer");
	}

	if (role === "investor") {
		redirect("/dashboard/investor");
	}

	// Fallback for undefined/null or unrecognized roles
	// Prevents invalid redirects like /dashboard/undefined
	redirect("/profile");
}

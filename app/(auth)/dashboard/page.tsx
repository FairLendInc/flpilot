import { redirect } from "next/navigation";

export default function DashboardPage() {
	// Redirect to admin dashboard as default
	// In production, this would check user's role and redirect accordingly
	redirect("/dashboard/admin");
}

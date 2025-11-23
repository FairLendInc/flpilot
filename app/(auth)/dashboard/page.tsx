import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
export default async function DashboardPage() {
	const user = await withAuth();
	console.log("USER FROM DASHBOARD PAGE", user);
	if (user?.role === "member") {
		redirect("/profile");
	}

	redirect(`/dashboard/${user.role}`);
}

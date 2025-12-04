// import { fetchQuery } from "convex/nextjs";
// import { api } from "@/convex/_generated/api";
export default async function adminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// const user = await fetchQuery(api.profile.getUserIdentity, {});
	// const permissions = user?.permissions;
	// const role = user?.role;

	return <>{children}</>;
}

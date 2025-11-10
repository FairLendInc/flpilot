import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

export async function GET() {
	// Get the base authorization URL from WorkOS
	const authorizationUrl = await getSignInUrl({
		prompt: "consent",
	});

	// Append prompt=select_account to force Google account selection
	// This ensures users see the account picker even if Google has a cached session
	const url = new URL(authorizationUrl);
	url.searchParams.set("prompt", "select_account");

	return redirect(url.toString());
}

import { withAuth } from "@workos-inc/authkit-nextjs";
import { Suspense } from "react";
import { PreloadedOnboardingQueue } from "./queue";

export default async function AdminOnboardingPage() {
	await withAuth();
	return (
		<Suspense
			fallback={
				<div className="p-6 text-muted-foreground text-sm">
					Loading onboarding queue…
				</div>
			}
		>
			<PreloadedOnboardingQueue />
		</Suspense>
	);
}

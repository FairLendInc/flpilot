import { withAuth } from "@workos-inc/authkit-nextjs";
import { headers } from "next/headers";
import { resolveFeatureFlagKey } from "@/lib/featureFlagKeys";
import { demoFlag, getFeatureFlag, precomputeFlags } from "@/lib/flags";
import { FlagDemoClient } from "./flag-demo-client";

export default async function FlagsDemoPage() {
	let accessToken: string | undefined;
	try {
		const auth = await withAuth();
		accessToken = auth.accessToken;
	} catch {
		accessToken = undefined;
	}

	const requestHeaders = await headers();
	const precomputedCode = requestHeaders.get("x-precomputed-flags");
	const demoFlagValue = precomputedCode
		? await demoFlag(precomputedCode, precomputeFlags)
		: await getFeatureFlag("demoFlag", { accessToken });

	return (
		<div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
			<div className="space-y-2">
				<h1 className="font-semibold text-2xl text-gray-900">
					Feature Flags Demo
				</h1>
				<p className="text-gray-600 text-sm">
					Flags are defined in <code>lib/flags.ts</code> and stored in Convex
					for evaluation. Use the Convex dashboard to toggle{" "}
					<code>{resolveFeatureFlagKey("demoFlag")}</code> or apply a developer
					override via the Vercel Toolbar.
				</p>
			</div>

			<div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
				<div className="flex items-center justify-between">
					<p className="font-medium text-gray-700 text-sm">Server value</p>
					<span
						className={`rounded-full px-2 py-0.5 font-semibold text-xs ${
							demoFlagValue
								? "bg-blue-100 text-blue-800"
								: "bg-gray-100 text-gray-700"
						}`}
					>
						{demoFlagValue ? "On" : "Off"}
					</span>
				</div>
				<p className="text-gray-600 text-sm">
					This value is resolved on the server with Convex and passed to the
					client as an initial render hint.
				</p>
			</div>

			<FlagDemoClient initialValue={demoFlagValue} />
		</div>
	);
}

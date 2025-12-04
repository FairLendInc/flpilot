"use client";

import { useFeatureFlag } from "@/hooks/useFeatureFlag";

type FlagDemoClientProps = {
	initialValue: boolean;
};

export function FlagDemoClient({ initialValue }: FlagDemoClientProps) {
	const { value, isPending, error } = useFeatureFlag("demoFlag", initialValue);
	const resolved = value;

	return (
		<div className="space-y-3 rounded-lg border border-gray-200 bg-white/80 p-4 shadow-sm">
			<div className="flex items-center justify-between">
				<p className="font-medium text-gray-700 text-sm">Client value</p>
				<div className="flex items-center gap-2">
					<span className="text-gray-500 text-xs uppercase tracking-wide">
						{isPending ? "Loading" : "Resolved"}
					</span>
					<span
						className={`rounded-full px-2 py-0.5 font-semibold text-xs ${
							resolved
								? "bg-green-100 text-green-800"
								: "bg-gray-100 text-gray-700"
						}`}
					>
						{resolved ? "On" : "Off"}
					</span>
				</div>
			</div>
			<p className="text-gray-600 text-sm">
				This value hydrates from the server. Reload after toggling in the
				Toolbar to see the override take effect.
			</p>
			{error ? (
				<p className="text-red-600 text-sm">
					Error loading flag:{" "}
					{error instanceof Error
						? error.message
						: String(error ?? "Unknown error")}
				</p>
			) : null}
		</div>
	);
}

import { headers } from "next/headers";

export default async function TenantPage() {
	const headerList = await headers();
	const subdomain = headerList.get("x-subdomain");

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
			<div className="w-full max-w-md space-y-8 text-center">
				<h1 className="font-bold text-4xl text-gray-900 tracking-tight">
					{subdomain ? `${subdomain} Domain` : "Tenant Domain"}
				</h1>
				<p className="text-gray-600 text-lg">
					This is a placeholder page for the subdomain.
				</p>
				<div className="mt-8 rounded-lg border border-gray-200 bg-white p-4 shadow">
					<p className="mb-2 text-gray-500 text-sm">Debug Info:</p>
					<code className="block overflow-auto rounded bg-gray-100 p-2 text-left text-xs">
						Subdomain: {subdomain || "None detected"}
					</code>
				</div>
			</div>
		</div>
	);
}

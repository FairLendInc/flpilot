import { headers } from "next/headers";

export default async function TenantPage() {
  const headerList = await headers();
  const subdomain = headerList.get("x-subdomain");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          {subdomain ? `${subdomain} Domain` : "Tenant Domain"}
        </h1>
        <p className="text-lg text-gray-600">
          This is a placeholder page for the subdomain.
        </p>
        <div className="mt-8 p-4 bg-white rounded-lg shadow border border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Debug Info:</p>
          <code className="block bg-gray-100 p-2 rounded text-left text-xs overflow-auto">
            Subdomain: {subdomain || "None detected"}
          </code>
        </div>
      </div>
    </div>
  );
}


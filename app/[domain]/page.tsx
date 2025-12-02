export default async function TenantPage({
	params,
}: {
	params: Promise<{ domain: string }>;
}) {
	const { domain } = await params;

	return (
		<div className="flex min-h-screen flex-col items-center justify-center">
			<h1 className="font-bold text-4xl">Tenant Domain: {domain}</h1>
			<p className="mt-4 text-muted-foreground">
				This is a dynamic tenant page served via Vercel Platforms.
			</p>
		</div>
	);
}

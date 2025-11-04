import { withAuth } from "@workos-inc/authkit-nextjs";
import { preloadedQueryResult, preloadQuery } from "convex/nextjs";
import { ViewTransition } from "react";
import { api } from "@/convex/_generated/api";
import Home from "./inner";

export default async function ServerPage() {
	const { accessToken } = await withAuth();
	const preloaded = await preloadQuery(
		api.myFunctions.listNumbers,
		{
			count: 3,
		},
		{ token: accessToken }
	);

	const data = preloadedQueryResult(preloaded);

	return (
		<ViewTransition>
			<main className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
				<h1 className="text-center font-bold text-4xl">Convex + Next.js</h1>
				<div className="flex flex-col gap-4 rounded-md bg-slate-200 p-4 dark:bg-slate-800">
					<h2 className="font-bold text-xl">Non-reactive server-loaded data</h2>
					<code>
						<pre>{JSON.stringify(data, null, 2)}</pre>
					</code>
				</div>
				<Home preloaded={preloaded} />
				<code>
					<pre>{JSON.stringify(preloaded, null, 2)}</pre>
				</code>
			</main>
		</ViewTransition>
	);
}

"use cache";

export default function StaticContent() {
	return (
		<div className="mx-auto flex max-w-lg flex-col gap-8">
			<p>
				Click the button below and open this page in another window - this data
				is persisted in the Convex cloud database!
			</p>
			<p>
				Edit{" "}
				<code className="rounded-md bg-slate-200 px-1 py-0.5 font-bold font-mono text-sm dark:bg-slate-800">
					convex/myFunctions.ts
				</code>{" "}
				to change your backend
			</p>
			<p>
				Edit{" "}
				<code className="rounded-md bg-slate-200 px-1 py-0.5 font-bold font-mono text-sm dark:bg-slate-800">
					app/page.tsx
				</code>{" "}
				to change your frontend
			</p>
			<p>
				See the{" "}
				<a className="underline hover:no-underline" href="/server">
					/server route
				</a>{" "}
				for an example of loading data in a server component
			</p>
		</div>
	);
}

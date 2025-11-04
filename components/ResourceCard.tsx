"use client";

import Link from "next/link";

export function ResourceCard({
	title,
	description,
	href,
}: {
	title: string;
	description: string;
	href: string;
}) {
	return (
		<div className="flex h-28 flex-col gap-2 overflow-auto rounded-md bg-slate-200 p-4 dark:bg-slate-800">
			<Link className="text-sm underline hover:no-underline" href={href}>
				{title}
			</Link>
			<p className="text-xs">{description}</p>
		</div>
	);
}

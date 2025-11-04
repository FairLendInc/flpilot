"use client";

import { ResourceCard } from "./ResourceCard";

export function ResourceLinks() {
	return (
		<div className="flex flex-col">
			<p className="font-bold text-lg">Useful resources:</p>
			<div className="flex gap-2">
				<div className="flex w-1/2 flex-col gap-2">
					<ResourceCard
						description="Read comprehensive documentation for all Convex features."
						href="https://docs.convex.dev/home"
						title="Convex docs"
					/>
					<ResourceCard
						description="Learn about best practices, use cases, and more from a growing
            collection of articles, videos, and walkthroughs."
						href="https://www.typescriptlang.org/docs/handbook/2/basic-types.html"
						title="Stack articles"
					/>
				</div>
				<div className="flex w-1/2 flex-col gap-2">
					<ResourceCard
						description="Browse our collection of templates to get started quickly."
						href="https://www.convex.dev/templates"
						title="Templates"
					/>
					<ResourceCard
						description="Join our developer community to ask questions, trade tips & tricks,
            and show off your projects."
						href="https://www.convex.dev/community"
						title="Discord"
					/>
				</div>
			</div>
		</div>
	);
}

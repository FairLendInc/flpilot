import { ArrowRight } from "lucide-react";
import Image from "next/image";

import { Card } from "@/components/ui/card";

type Post = {
	id: string;
	title: string;
	summary: string;
	label: string;
	author: string;
	published: string;
	url: string;
	image: string;
	tags?: string[];
};

type Blog8Props = {
	heading?: string;
	description?: string;
	posts?: Post[];
};

const Blog8 = ({
	heading = "FairLend Insights",
	description = "Ideas on the private mortgage exchange: broker distribution economics, AI‑driven underwriting and servicing, and 12–18× capital velocity.",
	posts = [
		{
			id: "post-1",
			title: "MLS for Private Mortgages: Why Brokers Win on FairLend",
			summary:
				"FairLend gives brokers white‑label investor portals, a 0.5% trailer on deployed capital, and on‑rails origination via our MIC—shifting from deal‑by‑deal hustle to durable distribution.",
			label: "Brokers",
			author: "FairLend Team",
			published: "07 Nov 2025",
			url: "/blog",
			image: "/house.jpg",
			tags: ["Brokers", "Distribution"],
		},
		{
			id: "post-2",
			title: "AI‑Driven Underwriting and Servicing: The Data Flywheel",
			summary:
				"A hybrid automation stack with human‑in‑the‑loop powers underwriting, appraisal checks, renewals, and collections. RLHF on real decisions compounds accuracy and coverage over time.",
			label: "AI",
			author: "FairLend Team",
			published: "07 Nov 2025",
			url: "/blog",
			image: "/house.jpg",
			tags: ["AI", "Automation"],
		},
		{
			id: "post-3",
			title: "12–18× Capital Velocity: Redeploying MIC Capital in 15–30 Days",
			summary:
				"Originate with the MIC → offload to marketplace investors → redeploy. Faster cycles reduce lockups, unlock liquidity options for investors, and scale AUM without being capital‑constrained.",
			label: "Scale",
			author: "FairLend Team",
			published: "07 Nov 2025",
			url: "/blog",
			image: "/house.jpg",
			tags: ["Scale", "Capital"],
		},
	],
}: Blog8Props) => (
	<section className="py-32">
		<div className="container flex flex-col items-center gap-16">
			<div className="text-center">
				<h2 className="mx-auto mb-6 text-pretty font-semibold text-3xl md:text-4xl lg:max-w-3xl">
					{heading}
				</h2>
				<p className="mx-auto max-w-2xl text-muted-foreground md:text-lg">
					{description}
				</p>
			</div>

			<div className="grid gap-y-10 sm:grid-cols-12 sm:gap-y-12 md:gap-y-16 lg:gap-y-20">
				{posts.map((post) => (
					<Card
						className="order-last border-0 bg-transparent shadow-none sm:order-first sm:col-span-12 lg:col-span-10 lg:col-start-2"
						key={post.id}
					>
						<div className="grid gap-y-6 sm:grid-cols-10 sm:gap-x-5 sm:gap-y-0 md:items-center md:gap-x-8 lg:gap-x-12">
							<div className="sm:col-span-5">
								<div className="mb-4 md:mb-6">
									<div className="flex flex-wrap gap-3 text-muted-foreground text-xs uppercase tracking-wider md:gap-5 lg:gap-6">
										{post.tags?.map((tag) => (
											<span key={tag}>{tag}</span>
										))}
									</div>
								</div>
								<h3 className="font-semibold text-xl md:text-2xl lg:text-3xl">
									<a
										className="hover:underline"
										href={post.url}
										rel="noopener"
										target="_blank"
									>
										{post.title}
									</a>
								</h3>
								<p className="mt-4 text-muted-foreground md:mt-5">
									{post.summary}
								</p>
								<div className="mt-6 flex items-center space-x-4 text-sm md:mt-8">
									<span className="text-muted-foreground">{post.author}</span>
									<span className="text-muted-foreground">•</span>
									<span className="text-muted-foreground">
										{post.published}
									</span>
								</div>
								<div className="mt-6 flex items-center space-x-2 md:mt-8">
									<a
										className="inline-flex items-center font-semibold hover:underline md:text-base"
										href={post.url}
										target="_blank"
									>
										<span>Read more</span>
										<ArrowRight className="ml-2 size-4 transition-transform" />
									</a>
								</div>
							</div>
							<div className="order-first sm:order-last sm:col-span-5">
								<a
									className="block"
									href={post.url}
									rel="noopener"
									target="_blank"
								>
									<div className="aspect-[16/9] overflow-clip rounded-lg border border-border">
										<Image
											alt={post.title}
											className="fade-in h-full w-full object-cover transition-opacity duration-200 hover:opacity-70"
											height={400}
											src={post.image}
											width={600}
										/>
									</div>
								</a>
							</div>
						</div>
					</Card>
				))}
			</div>
		</div>
	</section>
);

export { Blog8 };

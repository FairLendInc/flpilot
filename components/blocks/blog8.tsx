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
	heading = "Blog Posts",
	description = "Discover the latest insights and tutorials about modern web development, UI design, and component-driven architecture.",
	posts = [
		{
			id: "post-1",
			title:
				"Building Modern UIs: A Deep Dive into Shadcn and React Components",
			summary:
				"Join us for an in-depth exploration of building modern user interfaces using shadcn/ui and React. Learn best practices and advanced techniques.",
			label: "Web Design",
			author: "Sarah Chen",
			published: "15 Feb 2024",
			url: "https://shadcnblocks.com",
			image: "/images/block/placeholder-dark-1.svg",
			tags: ["Web Design", "UI Development"],
		},
		{
			id: "post-2",
			title: "Mastering Tailwind CSS: From Basics to Advanced Techniques",
			summary:
				"Discover how to leverage the full power of Tailwind CSS to create beautiful, responsive websites with clean and maintainable code.",
			label: "Web Design",
			author: "Michael Park",
			published: "22 Feb 2024",
			url: "https://shadcnblocks.com",
			image: "/images/block/placeholder-dark-1.svg",
			tags: ["Web Design", "CSS"],
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
								<a className="block" href={post.url} target="_blank">
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

import { IconArrowLeft } from "@tabler/icons-react";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import type { BlogWithSlug } from "../../../lib/blog";
import { Container } from "./container";
import { Logo } from "./logo";
export function BlogLayout({
	blog,
	children,
}: {
	blog: BlogWithSlug;
	children: React.ReactNode;
}) {
	return (
		<Container className="mt-16 lg:mt-32">
			<div className="flex items-center justify-between px-2 py-8">
				<Link className="flex items-center space-x-2" href="/blog">
					<IconArrowLeft className="h-4 w-4 text-muted" />
					<span className="text-muted text-sm">Back</span>
				</Link>
			</div>
			<div className="mx-auto w-full">
				{blog.image ? (
					<Image
						alt={blog.title}
						className="aspect-square h-40 w-full rounded-3xl object-cover [mask-image:radial-gradient(circle,white,transparent)] md:h-96"
						height="800"
						src={blog.image}
						width="800"
					/>
				) : (
					<div className="flex aspect-squace h-40 w-full items-center justify-center rounded-3xl bg-neutral-900 shadow-derek md:h-96">
						<Logo />
					</div>
				)}
			</div>
			<div className="xl:relative">
				<div className="mx-auto max-w-2xl">
					<article className="pb-8">
						<header className="flex flex-col">
							<h1 className="mt-8 font-bold text-4xl text-neutral-200 tracking-tight sm:text-5xl">
								{blog.title}
							</h1>
						</header>
						<div className="prose prose-sm prose-invert mt-8" data-mdx-content>
							{children}
						</div>
						<div className="mt-12 flex items-center space-x-2 border-neutral-800 border-t pt-12">
							<div className="flex items-center space-x-2">
								<Image
									alt={blog.author.name}
									className="h-5 w-5 rounded-full"
									height={20}
									src={blog.author.src}
									width={20}
								/>
								<p className="font-normal text-muted text-sm">
									{blog.author.name}
								</p>
							</div>
							<div className="h-5 w-0.5 rounded-lg bg-neutral-700" />
							<time
								className="flex items-center text-base"
								dateTime={blog.date}
							>
								<span className="text-muted text-sm">
									{format(new Date(blog.date), "MMMM dd, yyyy")}
								</span>
							</time>
						</div>
					</article>
				</div>
			</div>
		</Container>
	);
}

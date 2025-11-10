import Image from "next/image";
import { Link } from "next-view-transitions";
import Balancer from "react-wrap-balancer";
import type { BlogWithSlug } from "@/lib/blog";
import { truncate } from "@/lib/utils";
import { BlurImage } from "./blur-image";
import { Logo } from "./logo";

export const BlogCard = ({ blog }: { blog: BlogWithSlug }) => (
	<Link
		className="group w-full overflow-hidden rounded-3xl border border-transparent shadow-derek transition duration-200 hover:scale-[1.02] hover:border-neutral-800 hover:bg-neutral-900"
		href={`/blog/${blog.slug}`}
	>
		{blog.image ? (
			<BlurImage
				alt={blog.title}
				className="h-72 w-full rounded-3xl object-cover object-top"
				height="800"
				src={blog.image || ""}
				width="800"
			/>
		) : (
			<div className="flex h-72 items-center justify-center group-hover:bg-neutral-900">
				<Logo />
			</div>
		)}
		<div className="p-4 group-hover:bg-neutral-900 md:p-8">
			<p className="mb-4 font-bold text-lg">
				<Balancer>{blog.title}</Balancer>
			</p>
			<p className="mt-2 text-left text-muted text-sm">
				{truncate(blog.description, 100)}
			</p>
			<div className="mt-6 flex items-center space-x-2">
				<Image
					alt={blog.author.name}
					className="h-5 w-5 rounded-full"
					height={20}
					src={blog.author.src}
					width={20}
				/>
				<p className="font-normal text-muted text-sm">{blog.author.name}</p>
			</div>
		</div>
	</Link>
);

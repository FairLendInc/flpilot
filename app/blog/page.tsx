"use client";
import { format } from "date-fns";
import FuzzySearch from "fuzzy-search";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	startTransition,
	useEffect,
	useMemo,
	useState,
	ViewTransition,
} from "react";
import { Card } from "@/components/ui/card";

export default function BlogWithSearch() {
	const featuredBlog = blogs[0];
	const remainingBlogs = blogs.slice(1);

	return (
		<ViewTransition name="blog-list">
			<div className="relative flex w-screen flex-col items-center justify-center overflow-hidden">
				<div className="flex w-full max-w-7xl flex-col items-center justify-between pb-20">
					<div className="relative z-20 py-10 md:pt-40">
						<h1 className="mt-4 font-bold text-black text-xl tracking-tight md:text-3xl lg:text-5xl dark:text-white">
							Resources bank
						</h1>
					</div>

					{featuredBlog && <BlogCard blog={featuredBlog} />}

					<BlogPostRows blogs={remainingBlogs} />
				</div>
			</div>
		</ViewTransition>
	);
}

export const BlogPostRows = ({ blogs: blogPosts }: { blogs: Blog[] }) => {
	const router = useRouter();
	const [search, setSearch] = useState("");

	const searcher = useMemo(
		() =>
			new FuzzySearch(blogPosts, ["title", "description"], {
				caseSensitive: false,
			}),
		[blogPosts]
	);

	const [results, setResults] = useState(blogPosts);
	useEffect(() => {
		const searchResults = searcher.search(search);
		setResults(searchResults);
	}, [search, searcher]);

	const handleBlogClick = (slug: string) => {
		if (document.startViewTransition) {
			document.startViewTransition(() => {
				startTransition(() => {
					router.push(`/blog/${slug}`);
				});
			});
		} else {
			router.push(`/blog/${slug}`);
		}
	};

	return (
		<section className="w-full py-20">
			<div className="container flex flex-col items-center gap-16">
				<div className="mb-10 flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
					<h2 className="font-bold text-2xl text-neutral-800 dark:text-white">
						More Posts
					</h2>
					<input
						className="placeholder:neutral-700 w-full max-w-xl rounded-md border border-neutral-200 bg-white p-2 text-neutral-700 text-sm shadow-sm outline-none focus:border-neutral-200 focus:outline-none focus:ring-0 sm:min-w-96 dark:border-transparent dark:bg-neutral-800 dark:text-neutral-200 dark:placeholder-neutral-400"
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search blogs"
						type="text"
						value={search}
					/>
				</div>

				{results.length === 0 ? (
					<p className="p-4 text-center text-neutral-400">No results found</p>
				) : (
					<div className="grid w-full gap-y-10 sm:grid-cols-12 sm:gap-y-12 md:gap-y-16 lg:gap-y-20">
						{results.map((blog) => (
							<ViewTransition key={blog.slug} name={`blog-${blog.slug}`}>
								<Card className="order-last border-0 bg-transparent shadow-none sm:order-first sm:col-span-12 lg:col-span-10 lg:col-start-2">
									<div className="grid gap-y-6 sm:grid-cols-10 sm:gap-x-5 sm:gap-y-0 md:items-center md:gap-x-8 lg:gap-x-12">
										<div className="sm:col-span-5">
											<div className="mb-4 md:mb-6">
												<div className="flex flex-wrap gap-3 text-muted-foreground text-xs uppercase tracking-wider md:gap-5 lg:gap-6">
													<span>Blog</span>
												</div>
											</div>
											<h3 className="font-semibold text-xl md:text-2xl lg:text-3xl">
												<Link
													className="hover:underline"
													href={`/blog/${blog.slug}`}
													onClick={(e) => {
														e.preventDefault();
														handleBlogClick(blog.slug);
													}}
													style={{
														viewTransitionName: `blog-title-${blog.slug}`,
													}}
												>
													{blog.title}
												</Link>
											</h3>
											<p
												className="mt-4 text-muted-foreground md:mt-5"
												style={{
													viewTransitionName: `blog-description-${blog.slug}`,
												}}
											>
												{truncate(blog.description, 200)}
											</p>
											<div className="mt-6 flex items-center space-x-4 text-sm md:mt-8">
												<span className="text-muted-foreground">
													{blog.author}
												</span>
												<span className="text-muted-foreground">•</span>
												<span className="text-muted-foreground">
													{format(new Date(blog.date), "MMMM dd, yyyy")}
												</span>
											</div>
											<div className="mt-6 flex items-center space-x-2 md:mt-8">
												<Link
													className="inline-flex items-center font-semibold hover:underline md:text-base"
													href={`/blog/${blog.slug}`}
													onClick={(e) => {
														e.preventDefault();
														handleBlogClick(blog.slug);
													}}
												>
													<span>Read more</span>
													<ArrowRight className="ml-2 size-4 transition-transform" />
												</Link>
											</div>
										</div>
										<div className="order-first sm:order-last sm:col-span-5">
											<Link
												className="block"
												href={`/blog/${blog.slug}`}
												onClick={(e) => {
													e.preventDefault();
													handleBlogClick(blog.slug);
												}}
											>
												<div className="aspect-video overflow-clip rounded-lg border border-border">
													{blog.image ? (
														<Image
															alt={blog.title}
															className="fade-in h-full w-full object-cover transition-opacity duration-200 hover:opacity-70"
															height={400}
															src={blog.image}
															style={{
																viewTransitionName: `blog-image-${blog.slug}`,
															}}
															width={700}
														/>
													) : (
														<div className="flex h-full w-full items-center justify-center bg-muted">
															<span className="text-muted-foreground text-sm">
																No image
															</span>
														</div>
													)}
												</div>
											</Link>
										</div>
									</div>
								</Card>
							</ViewTransition>
						))}
					</div>
				)}
			</div>
		</section>
	);
};

const Logo = () => (
	<Link
		className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 font-normal text-black text-sm"
		href="/"
	>
		<div className="h-5 w-6 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
		<span className="font-medium text-black dark:text-white">DevStudio</span>
	</Link>
);

export const BlogCard = ({ blog }: { blog: Blog }) => {
	const router = useRouter();

	const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault();
		if (document.startViewTransition) {
			document.startViewTransition(() => {
				startTransition(() => {
					router.push(`/blog/${blog.slug}`);
				});
			});
		} else {
			router.push(`/blog/${blog.slug}`);
		}
	};

	return (
		<ViewTransition name={`blog-${blog.slug}`}>
			<Link
				className="group/blog grid w-full grid-cols-1 overflow-hidden rounded-3xl border border-transparent shadow-derek transition duration-200 hover:scale-[1.02] hover:border-neutral-200 hover:bg-neutral-100 md:grid-cols-2 dark:hover:border-neutral-800 dark:hover:bg-neutral-900"
				href={`/blog/${blog.slug}`}
				onClick={handleClick}
			>
				<div className="">
					{blog.image ? (
						<Image
							alt={blog.title}
							className="h-full max-h-96 w-full rounded-3xl object-cover object-top"
							height={800}
							src={blog.image}
							style={{ viewTransitionName: `blog-image-${blog.slug}` }}
							width={800}
						/>
					) : (
						<div className="flex h-full items-center justify-center group-hover/blog:bg-neutral-100 dark:group-hover/blog:bg-neutral-900">
							<Logo />
						</div>
					)}
				</div>
				<div className="flex flex-col justify-between p-4 group-hover/blog:bg-neutral-100 md:p-8 dark:group-hover/blog:bg-neutral-900">
					<div>
						<p
							className="mb-4 font-bold text-lg text-neutral-800 md:text-4xl dark:text-neutral-100"
							style={{ viewTransitionName: `blog-title-${blog.slug}` }}
						>
							{blog.title}
						</p>
						<p
							className="mt-2 text-left text-base text-neutral-600 md:text-xl dark:text-neutral-400"
							style={{ viewTransitionName: `blog-description-${blog.slug}` }}
						>
							{truncate(blog.description, 500)}
						</p>
					</div>
					<div className="mt-6 flex items-center space-x-2">
						<Image
							alt={blog.author}
							className="h-5 w-5 rounded-full"
							height={20}
							src={blog.authorAvatar}
							width={20}
						/>
						<p className="font-normal text-black text-sm dark:text-white">
							{blog.author}
						</p>
						<div className="h-1 w-1 rounded-full bg-neutral-300" />
						<p className="max-w-xl text-neutral-600 text-sm transition duration-200 dark:text-neutral-300">
							{format(new Date(blog.date), "MMMM dd, yyyy")}
						</p>
					</div>
				</div>
			</Link>
		</ViewTransition>
	);
};

// Ideally fetched from a headless CMS or MDX files
type Blog = {
	title: string;
	description: string;
	date: string;
	slug: string;
	image: string;
	author: string;
	authorAvatar: string;
};
const blogs: Blog[] = [
	{
		title: "Changelog for 2024",
		description:
			"Explore the latest updates and enhancements in our 2024 changelog. Discover new features and improvements that enhance user experience.",
		date: "2021-01-01",
		slug: "changelog-for-2024",
		image:
			"https://images.unsplash.com/photo-1696429175928-793a1cdef1d3?q=80&w=3000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		author: "Manu Arora",
		authorAvatar: "https://assets.aceternity.com/manu.png",
	},
	{
		title: "Understanding React Hooks",
		description:
			"A comprehensive guide to understanding and using React Hooks in your projects.",
		date: "2021-02-15",
		slug: "understanding-react-hooks",
		image:
			"https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=3542&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		author: "Manu Arora",
		authorAvatar: "https://assets.aceternity.com/manu.png",
	},
	{
		title: "CSS Grid Layout",
		description: "Learn how to create complex layouts easily with CSS Grid.",
		date: "2021-03-10",
		slug: "css-grid-layout",
		image:
			"https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=3542&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		author: "Manu Arora",
		authorAvatar: "https://assets.aceternity.com/manu.png",
	},
	{
		title: "JavaScript ES2021 Features",
		description:
			"An overview of the new features introduced in JavaScript ES2021.",
		date: "2021-04-05",
		slug: "javascript-es2021-features",
		image:
			"https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=3542&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		author: "Manu Arora",
		authorAvatar: "https://assets.aceternity.com/manu.png",
	},
	{
		title: "Building RESTful APIs with Node.js",
		description:
			"Step-by-step guide to building RESTful APIs using Node.js and Express.",
		date: "2021-05-20",
		slug: "building-restful-apis-with-nodejs",
		image:
			"https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=3542&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		author: "Manu Arora",
		authorAvatar: "https://assets.aceternity.com/manu.png",
	},
];

export const truncate = (text: string, length: number) =>
	text.length > length ? `${text.slice(0, length)}...` : text;

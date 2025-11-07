"use client";
import { format } from "date-fns";
import { Menu } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, ViewTransition } from "react";

const dummyContentMarkdown = `

## Introduction

Artificial Intelligence (AI) has been rapidly evolving, transforming various aspects of our lives. From voice assistants to autonomous vehicles, AI is becoming increasingly integrated into our daily routines.

### Key Areas of AI Development

1. **Machine Learning**
   - Deep Learning
   - Neural Networks
   - Reinforcement Learning

2. **Natural Language Processing**
   - Language Translation
   - Sentiment Analysis
   - Chatbots and Virtual Assistants

3. **Computer Vision**
   - Image Recognition
   - Facial Recognition
   - Autonomous Vehicles

## Ethical Considerations

As AI continues to advance, it's crucial to address ethical concerns:

- Privacy and data protection
- Bias in AI algorithms
- Job displacement due to automation

## Conclusion

The future of AI is both exciting and challenging. As we continue to push the boundaries of what's possible, it's essential to balance innovation with responsible development and implementation.

> "The development of full artificial intelligence could spell the end of the human race." - Stephen Hawking

*This quote reminds us of the importance of careful consideration in AI advancement.*

![AI Concept Image](https://images.unsplash.com/photo-1719716136369-59ecf938a911?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)

For more information, visit [AI Research Center](https://example.com/ai-research).
`;

type Blog = {
	title: string;
	summary?: string;
	date: string;
	slug: string;
	image: string;
	author: string;
	authorAvatar: string;
	content: string;
};

// Import blog data - in a real app, this would come from a CMS or API
const blogs: Blog[] = [
	{
		title: "Changelog for 2024",
		summary:
			"Explore the latest updates and enhancements in our 2024 changelog. Discover new features and improvements that enhance user experience.",
		date: "2021-01-01",
		slug: "changelog-for-2024",
		image:
			"https://images.unsplash.com/photo-1696429175928-793a1cdef1d3?q=80&w=3000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		author: "Manu Arora",
		authorAvatar: "https://assets.aceternity.com/manu.png",
		content: dummyContentMarkdown,
	},
	{
		title: "Understanding React Hooks",
		summary:
			"A comprehensive guide to understanding and using React Hooks in your projects.",
		date: "2021-02-15",
		slug: "understanding-react-hooks",
		image:
			"https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=3542&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		author: "Manu Arora",
		authorAvatar: "https://assets.aceternity.com/manu.png",
		content: dummyContentMarkdown,
	},
	{
		title: "CSS Grid Layout",
		summary: "Learn how to create complex layouts easily with CSS Grid.",
		date: "2021-03-10",
		slug: "css-grid-layout",
		image:
			"https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=3542&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		author: "Manu Arora",
		authorAvatar: "https://assets.aceternity.com/manu.png",
		content: dummyContentMarkdown,
	},
	{
		title: "JavaScript ES2021 Features",
		summary: "An overview of the new features introduced in JavaScript ES2021.",
		date: "2021-04-05",
		slug: "javascript-es2021-features",
		image:
			"https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=3542&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		author: "Manu Arora",
		authorAvatar: "https://assets.aceternity.com/manu.png",
		content: dummyContentMarkdown,
	},
	{
		title: "Building RESTful APIs with Node.js",
		summary:
			"Step-by-step guide to building RESTful APIs using Node.js and Express.",
		date: "2021-05-20",
		slug: "building-restful-apis-with-nodejs",
		image:
			"https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=3542&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		author: "Manu Arora",
		authorAvatar: "https://assets.aceternity.com/manu.png",
		content: dummyContentMarkdown,
	},
];

export function BlogContentWithToc() {
	const params = useParams();
	const slug = params?.id as string;
	const blog = blogs.find((b) => b.slug === slug) || blogs[0];

	if (!blog) {
		return <div>Blog not found</div>;
	}

	return (
		<ViewTransition name={`blog-${blog.slug}`}>
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 md:flex-row md:px-8">
				<Toc />
				<div className="flex max-w-2xl flex-1 flex-col">
					<Image
						alt={blog.title}
						className="h-60 w-full rounded-3xl object-cover md:h-120"
						height={720}
						src={blog.image}
						style={{ viewTransitionName: `blog-image-${blog.slug}` }}
						width={1024}
					/>
					<h2
						className="mt-6 mb-2 font-bold text-2xl text-black tracking-tight dark:text-white"
						style={{ viewTransitionName: `blog-title-${blog.slug}` }}
					>
						{blog.title}
					</h2>
					{blog.summary && (
						<p
							className="mt-4 text-lg text-muted-foreground"
							style={{ viewTransitionName: `blog-description-${blog.slug}` }}
						>
							{blog.summary}
						</p>
					)}

					<div className="prose prose-sm dark:prose-invert mt-10">
						<div className="whitespace-pre-wrap">{blog.content}</div>
					</div>

					<div className="mt-10 max-w-2xl">
						<div className="h-px w-full bg-neutral-200 dark:bg-neutral-900" />
						<div className="h-px w-full bg-neutral-100 dark:bg-neutral-800" />
					</div>
					<div className="mt-10 flex items-center">
						<Image
							alt={blog.author}
							className="h-5 w-5 rounded-full"
							height={20}
							src={blog.authorAvatar}
							width={20}
						/>
						<p className="pl-2 text-neutral-600 text-sm dark:text-neutral-400">
							{blog.author}
						</p>
						<div className="mx-2 h-1 w-1 rounded-full bg-neutral-200 dark:bg-neutral-700" />
						<p className="pl-1 text-neutral-600 text-sm dark:text-neutral-400">
							{format(new Date(blog.date), "LLLL d, yyyy")}
						</p>
					</div>
				</div>
			</div>
		</ViewTransition>
	);
}

const Toc = () => {
	const links = [
		{ title: "Introduction", href: "#introduction" },
		{
			title: "Key Areas of AI Development",
			href: "#key-areas-of-ai-development",
		},
		{ title: "Ethical Considerations", href: "#ethical-considerations" },
		{ title: "Conclusion", href: "#conclusion" },
	];
	const [hovered, setHovered] = useState<number | null>(null);
	const [open, setOpen] = useState(false);
	return (
		<>
			<div className="sticky top-20 left-0 hidden max-w-xs flex-col self-start pr-10 md:flex">
				{links.map((link, index) => (
					<Link
						className="group/toc-link relative rounded-lg px-2 py-1 text-neutral-700 text-sm dark:text-neutral-200"
						href={link.href}
						key={link.href}
						onMouseEnter={() => setHovered(index)}
						onMouseLeave={() => setHovered(null)}
					>
						{hovered === index && (
							<motion.span
								className="absolute top-0 left-0 h-full w-1 rounded-tr-full rounded-br-full bg-neutral-200 dark:bg-neutral-700"
								layoutId="toc-indicator"
							/>
						)}
						<span className="inline-block transition duration-200 group-hover/toc-link:translate-x-1">
							{link.title}
						</span>
					</Link>
				))}
			</div>
			<div className="sticky top-20 right-2 flex w-full flex-col items-end justify-end self-start md:hidden">
				<button
					className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-neutral-900"
					onClick={() => setOpen(!open)}
					type="button"
				>
					<Menu className="h-6 w-6 text-black dark:text-white" />
				</button>
				<AnimatePresence>
					{open && (
						<motion.div
							animate={{ opacity: 1 }}
							className="mt-2 flex flex-col items-end rounded-3xl border border-neutral-100 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
							exit={{ opacity: 0 }}
							initial={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
						>
							{links.map((link, index) => (
								<Link
									className="group/toc-link relative rounded-lg px-2 py-1 text-right text-neutral-700 text-sm dark:text-neutral-200"
									href={link.href}
									key={link.href}
									onMouseEnter={() => setHovered(index)}
									onMouseLeave={() => setHovered(null)}
								>
									{hovered === index && (
										<motion.span
											className="absolute top-0 left-0 h-full w-1 rounded-tr-full rounded-br-full bg-neutral-200 dark:bg-neutral-700"
											layoutId="toc-indicator"
										/>
									)}
									<span className="inline-block transition duration-200 group-hover/toc-link:translate-x-1">
										{link.title}
									</span>
								</Link>
							))}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</>
	);
};

export default function BlogPage() {
	return <BlogContentWithToc />;
}

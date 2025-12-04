"use client";
import { format } from "date-fns";
import { Menu } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, ViewTransition } from "react";

const dummyContentMarkdown = `
## Overview

FairLend is the MLS for private mortgages—an end‑to‑end exchange where brokers originate with our MIC, investors buy fully‑managed, fractionalized mortgages, and servicing is automated from disbursal to default.

### The Three‑Layer Model

1. **Origination (MIC)**  
   Consistent capital, proprietary underwriting tools, third‑party valuations, and streamlined borrower vetting.

2. **Marketplace (Distribution)**  
   Pre‑funded, pre‑vetted, fractionalized deals listed through white‑labeled investor portals for brokers and advisors.

3. **Servicing (Automation)**  
   PAD payments, renewals, default management, and recoveries with legal partners—minimal manual overhead.

### AI & Data Flywheel

- Hybrid automation with human‑in‑the‑loop for underwriting assistance, appraisal checks, renewals, and collections.  
- Every human correction feeds RLHF, compounding accuracy and coverage.  
- Owning the full transaction stack yields rich labeled datasets: borrower profiles, credit outcomes, appraisals, and servicing trajectories.

## Capital Velocity

Our MIC originates → offloads to marketplace investors → redeploys within 15–30 days—recycling capital **12–18×** annually. That reduces investor lockups (≈7–30 days liquidity options) and scales AUM without being capital‑constrained.

## Compliance

Investor onboarding includes automated KYC/AML and suitability. Distribution through licensed brokers/advisors keeps marketplace activity within FSRA guidelines, while the MIC follows the standard OSC path.

## Conclusion

FairLend turns a fragmented, analog market into a digital exchange with on‑rails compliance and AI‑driven automation—unlocking better terms for borrowers, recurring passive income for brokers, and transparent, liquid exposure for investors.

![Mortgage marketplace](https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=3000&auto=format&fit=crop)
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
		title: "MLS for Private Mortgages: Why Brokers Win on FairLend",
		summary:
			"White‑label investor portals, a 0.5% trailer on deployed capital, and on‑rails MIC origination turn broker distribution into durable recurring revenue.",
		date: "2025-11-07",
		slug: "mls-for-private-mortgages",
		image:
			"https://images.unsplash.com/photo-1592496431122-2349e0fbc666?q=80&w=3000&auto=format&fit=crop",
		author: "FairLend Team",
		authorAvatar: "https://assets.aceternity.com/manu.png",
		content: dummyContentMarkdown,
	},
	{
		title: "AI‑Driven Underwriting and Servicing: The Data Flywheel",
		summary:
			"Hybrid automation with human‑in‑the‑loop powers underwriting, appraisal checks, renewals, and collections. RLHF on real decisions compounds accuracy over time.",
		date: "2025-11-07",
		slug: "ai-data-flywheel",
		image: "/house.jpg",
		author: "FairLend Team",
		authorAvatar: "https://assets.aceternity.com/manu.png",
		content: dummyContentMarkdown,
	},
	{
		title: "12–18× Capital Velocity: Redeploying MIC Capital in 15–30 Days",
		summary:
			"Originate with the MIC → offload to marketplace investors → redeploy. Faster cycles reduce lockups and scale AUM without being capital‑constrained.",
		date: "2025-11-07",
		slug: "capital-velocity-mic",
		image:
			"https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=3000&auto=format&fit=crop",
		author: "FairLend Team",
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
		{ title: "Overview", href: "#overview" },
		{ title: "Three‑Layer Model", href: "#the-three-layer-model" },
		{ title: "AI & Data Flywheel", href: "#ai-data-flywheel" },
		{ title: "Capital Velocity", href: "#capital-velocity" },
		{ title: "Compliance", href: "#compliance" },
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

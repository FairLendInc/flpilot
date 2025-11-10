"use client";
import {
	IconMailForward,
	IconSocial,
	IconTerminal,
	IconTool,
} from "@tabler/icons-react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import type React from "react";
import { useRef, useState } from "react";
import { BlurImage } from "./blur-image";
import { FeatureIconContainer } from "./features/feature-icon-container";
import { Heading } from "./heading";
import { Subheading } from "./subheading";
import { StickyScroll } from "./ui/sticky-scroll";

export const Tools = () => {
	const content = [
		{
			icon: <IconMailForward className="h-8 w-8 text-secondary" />,
			title: "Email Automation",
			description:
				"With our best in class email automation, you can automate your entire emailing process.",
			content: (
				<ImageContainer>
					<BlurImage
						alt="dashboard"
						className="w-full rounded-lg shadow-brand/[0.2] shadow-xl"
						height="1000"
						src="/first.png"
						width="1000"
					/>
				</ImageContainer>
			),
		},
		{
			icon: <IconSocial className="h-8 w-8 text-secondary" />,
			title: "Cross Platform Marketing",
			description:
				"With our cross platform marketing, you can reach your audience on all the platforms they use.",
			content: (
				<ImageContainer>
					<BlurImage
						alt="dashboard"
						className="w-full rounded-lg shadow-brand/[0.2] shadow-xl"
						height="1000"
						src="/second-backup.png"
						width="1000"
					/>
				</ImageContainer>
			),
		},
		{
			icon: <IconTerminal className="h-8 w-8 text-secondary" />,
			title: "Managed CRM",
			description:
				"With our managed CRM, you can manage your leads and contacts in one place.",
			content: (
				<ImageContainer>
					<BlurImage
						alt="dashboard"
						className="w-full rounded-lg shadow-brand/[0.2] shadow-xl"
						height="1000"
						src="/fourth-backup.png"
						width="1000"
					/>
				</ImageContainer>
			),
		},
		{
			icon: <IconTerminal className="h-8 w-8 text-secondary" />,
			title: "Apps Automation",
			description:
				"We have cloned zapier and built our very own apps automation platform.",
			content: (
				<ImageContainer>
					<BlurImage
						alt="dashboard"
						className="w-full rounded-lg shadow-brand/[0.2] shadow-xl"
						height="1000"
						src="/third.png"
						width="1000"
					/>
				</ImageContainer>
			),
		},
	];
	const ref = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ["start end", "end start"],
	});
	const backgrounds = [
		"var(--charcoal)",
		"var(--neutral-900)",
		"var(--gray-900)",
	];
	const index = Math.round(scrollYProgress.get() * (backgrounds.length - 1));

	const [gradient, setGradient] = useState(backgrounds[0]);

	useMotionValueEvent(scrollYProgress, "change", (latest) => {
		const cardsBreakpoints = content.map((_, index) => index / content.length);
		const closestBreakpointIndex = cardsBreakpoints.reduce(
			(acc, breakpoint, index) => {
				const distance = Math.abs(latest - breakpoint);
				if (distance < Math.abs(latest - cardsBreakpoints[acc])) {
					return index;
				}
				return acc;
			},
			0
		);
		setGradient(backgrounds[closestBreakpointIndex % backgrounds.length]);
	});
	return (
		<motion.div
			animate={{
				background: gradient,
			}}
			className="relative h-full w-full pt-20 md:pt-40"
			ref={ref}
			transition={{
				duration: 0.5,
			}}
		>
			<div className="px-6">
				<FeatureIconContainer className="flex items-center justify-center overflow-hidden">
					<IconTool className="h-6 w-6 text-cyan-500" />
				</FeatureIconContainer>
				<Heading className="mt-4">Perfect set of tools</Heading>
				<Subheading>
					Proactiv comes with perfect tools for the perfect jobs out there.
				</Subheading>
			</div>
			<StickyScroll content={content} />
		</motion.div>
	);
};

const ImageContainer = ({ children }: { children: React.ReactNode }) => (
	<div className="relative rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-2xl">
		{children}
		<div className="absolute inset-x-0 bottom-0 h-px w-full bg-gradient-to-r from-transparent via-secondary to-transparent" />
		<div className="absolute inset-x-10 bottom-0 mx-auto h-px w-40 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
	</div>
);

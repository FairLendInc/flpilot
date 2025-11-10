"use client";
import { motion, useScroll, useTransform } from "motion/react";
import type React from "react";
import { useRef } from "react";

export const StickyScroll = ({
	content,
}: {
	content: {
		title: string;
		description: string;
		icon?: React.ReactNode;
	}[];
}) => {
	const backgroundColors = [
		"var(--slate-900)",
		"var(--black)",
		"var(--neutral-900)",
	];
	const linearGradients = [
		"linear-gradient(to bottom right, var(--cyan-500), var(--emerald-500))",
		"linear-gradient(to bottom right, var(--pink-500), var(--indigo-500))",
		"linear-gradient(to bottom right, var(--orange-500), var(--yellow-500))",
	];
	return (
		<div className="py-4 md:py-20">
			<motion.div className="relative mx-auto hidden h-full max-w-7xl flex-col justify-between p-10 lg:flex">
				{content.map((item, index) => (
					<ScrollContent index={index} item={item} key={item.title + index} />
				))}
			</motion.div>
			<motion.div className="relative mx-auto flex max-w-7xl flex-col justify-between p-10 lg:hidden">
				{content.map((item, index) => (
					<ScrollContentMobile
						index={index}
						item={item}
						key={item.title + index}
					/>
				))}
			</motion.div>
		</div>
	);
};

export const ScrollContent = ({
	item,
	index,
}: {
	item: {
		title: string;
		description: string;
		icon?: React.ReactNode;
		content?: React.ReactNode;
	};
	index: number;
}) => {
	const ref = useRef<any>(null);
	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ["start end", "end start"],
	});
	const translate = useTransform(scrollYProgress, [0, 1], [0, 250]);
	const translateContent = useTransform(scrollYProgress, [0, 1], [0, -200]);
	const opacity = useTransform(
		scrollYProgress,
		[0, 0.05, 0.5, 0.7, 1],
		[0, 1, 1, 0, 0]
	);

	const opacityContent = useTransform(
		scrollYProgress,
		[0, 0.2, 0.5, 0.8, 1],
		[0, 0, 1, 1, 0]
	);

	const linearGradients = [
		"linear-gradient(to bottom right, var(--cyan-500), var(--emerald-500))",
		"linear-gradient(to bottom right, var(--pink-500), var(--indigo-500))",
		"linear-gradient(to bottom right, var(--orange-500), var(--yellow-500))",
	];

	return (
		<motion.div
			className="relative my-40 grid grid-cols-3 gap-8"
			key={item.title + index}
			ref={ref}
			transition={{
				duration: 0.3,
			}}
		>
			<div className="w-full">
				<motion.div
					className=""
					style={{
						y: translate,
						opacity,
					}}
				>
					<div>{item.icon}</div>
					<motion.h2 className="mt-2 inline-block bg-gradient-to-b from-white to-white bg-clip-text text-left font-bold text-2xl text-transparent lg:text-4xl">
						{item.title}
					</motion.h2>

					<motion.p className="mt-2 max-w-sm font-bold text-lg text-neutral-500">
						{item.description}
					</motion.p>
				</motion.div>
			</div>

			<motion.div
				className="col-span-2 h-full w-full self-start rounded-md"
				key={item.title + index}
				style={{
					y: translateContent,
					opacity: index === 0 ? opacityContent : 1,
				}}
			>
				{item.content && item.content}
			</motion.div>
		</motion.div>
	);
};

export const ScrollContentMobile = ({
	item,
	index,
}: {
	item: {
		title: string;
		description: string;
		icon?: React.ReactNode;
		content?: React.ReactNode;
	};
	index: number;
}) => {
	const linearGradients = [
		"linear-gradient(to bottom right, var(--cyan-500), var(--emerald-500))",
		"linear-gradient(to bottom right, var(--pink-500), var(--indigo-500))",
		"linear-gradient(to bottom right, var(--orange-500), var(--yellow-500))",
	];
	return (
		<motion.div
			className="relative my-10 flex flex-col md:flex-row md:space-x-4"
			key={item.title + index}
			transition={{
				duration: 0.3,
			}}
		>
			<div className="w-full">
				<motion.div className="mb-6">
					<div>{item.icon}</div>
					<motion.h2 className="mt-2 inline-block bg-gradient-to-b from-white to-white bg-clip-text text-left font-bold text-2xl text-transparent lg:text-4xl">
						{item.title}
					</motion.h2>

					<motion.p className="mt-2 max-w-sm font-bold text-neutral-500 text-sm md:text-base">
						{item.description}
					</motion.p>
				</motion.div>
			</div>

			<motion.div
				className="w-full self-start rounded-md"
				key={item.title + index}
			>
				{item.content && item.content}
			</motion.div>
		</motion.div>
	);
};

"use client";

import {
	AnimatePresence,
	animate,
	motion,
	stagger,
	useMotionValue,
	useSpring,
	useTransform,
} from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { BsStarFill } from "react-icons/bs";
import { twMerge } from "tailwind-merge";
import { testimonials } from "../constants/testimonials";
import { cn } from "@/lib/utils";

const STAR_IDS = ["star-0", "star-1", "star-2", "star-3", "star-4"];

export const FeaturedImages = ({
	textClassName,
	className,
	showStars = false,
	containerClassName,
}: {
	textClassName?: string;
	className?: string;
	showStars?: boolean;
	containerClassName?: string;
}) => {
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

	const springConfig = { stiffness: 100, damping: 5 };
	const x = useMotionValue(0);
	const translateX = useSpring(
		useTransform(x, [-100, 100], [-50, 50]),
		springConfig
	);

	const handleMouseMove = (event: React.MouseEvent<HTMLImageElement>) => {
		const target = event.currentTarget;
		const halfWidth = target.offsetWidth / 2;
		x.set(event.nativeEvent.offsetX - halfWidth);
	};

	useEffect(() => {
		animate(
			".animation-container",
			{
				scale: [1.1, 1, 0.9, 1],
				opacity: [0, 1],
			},
			{ duration: 0.4, delay: stagger(0.1) }
		);
	}, []);
	return (
		<div
			className={cn(
				"mt-10 mb-10 flex flex-col items-center",
				containerClassName
			)}
		>
			<div
				className={twMerge(
					"mb-2 flex flex-col items-center justify-center sm:flex-row",
					className
				)}
			>
				<div className="mb-4 flex flex-row items-center sm:mb-0">
					{testimonials.map((testimonial: { name: string; designation: string; image: string }, idx: number) => (
						// biome-ignore lint/a11y/noNoninteractiveElementInteractions lint/a11y/noStaticElementInteractions: Hover-only interaction for tooltip display
						<div
							className="-mr-4 group relative"
							key={testimonial.name}
							onMouseEnter={() => setHoveredIndex(idx)}
							onMouseLeave={() => setHoveredIndex(null)}
						>
							<AnimatePresence>
								{hoveredIndex === idx && (
									<motion.div
										animate={{
											opacity: 1,
											y: 0,
											scale: 1,
											transition: {
												type: "spring",
												stiffness: 160,
												damping: 20,
											},
										}}
										className="-top-16 -left-1/2 absolute z-50 flex translate-x-1/2 flex-col items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-xs shadow-xl"
										exit={{ opacity: 0, y: 20, scale: 0.6 }}
										initial={{ opacity: 0, y: 20, scale: 0.6 }}
										style={{
											translateX,

											whiteSpace: "nowrap",
										}}
									>
										<div className="-bottom-px absolute inset-x-0 z-30 mx-auto h-px w-[20%] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
										<div className="-bottom-px absolute inset-x-0 z-30 mx-auto h-px w-[70%] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
										<div className="flex items-center gap-2">
											<div className="relative z-30 font-bold text-sm text-white">
												{testimonial.name}
											</div>
											<div className="rounded-sm bg-neutral-950 px-1 py-0.5 text-neutral-300 text-xs">
												{testimonial.designation}
											</div>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
							<div className="animation-container">
								<motion.div
									animate={{
										rotate: `${Math.random() * 15 - 5}deg`,
										scale: 1,
										opacity: 1,
									}}
									className="relative overflow-hidden rounded-2xl border-2 border-neutral-200"
									initial={{
										opacity: 0,
									}}
									transition={{
										duration: 0.2,
									}}
									whileHover={{
										scale: 1.05,
										zIndex: 30,
									}}
								>
									<Image
										alt={testimonial.name}
										className="h-14 w-14 object-cover object-top"
										height={100}
										onMouseMove={handleMouseMove}
										src={testimonial.image}
										width={100}
									/>
								</motion.div>
							</div>
						</div>
					))}
				</div>

				<div className="ml-6 flex justify-center">
					{STAR_IDS.map((id) => (
						<BsStarFill
							className={showStars ? "mx-1 h-4 w-4 text-yellow-400" : "hidden"}
							key={id}
						/>
					))}
				</div>
			</div>
			<p
				className={twMerge(
					"relative z-40 ml-8 text-center text-neutral-400 text-sm",
					textClassName
				)}
			>
				Trusted by 27,000+ creators
			</p>
		</div>
	);
};

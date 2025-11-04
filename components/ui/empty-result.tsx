"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { Card, CardContent } from "./card";

const MotionCard = motion(Card);

const EmptyResult = () => {
	const textVariants = {
		initial: { opacity: 0, y: 20 },
		animate: { opacity: 1, y: 0 },
	};

	return (
		<MotionCard
			animate="animate"
			className="mx-auto max-w-sm shadow-lg"
			initial="initial"
		>
			<CardContent className="flex flex-col items-center p-6">
				<div className="h-32 w-32">
					<DotLottieReact autoplay loop src="/dot-lottie/empty.lottie" />
				</div>

				{/* Animated Heading */}
				<motion.h2
					animate="animate"
					className="mt-4 text-center font-semibold text-xl"
					initial="initial"
					transition={{ duration: 0.6, ease: "easeOut" }}
					variants={textVariants}
				>
					No Data Found
				</motion.h2>

				{/* Animated Description */}
				<motion.p
					animate="animate"
					className="mt-2 text-center text-gray-600"
					initial="initial"
					transition={{
						duration: 0.8,
						ease: "easeOut",
						delay: 0.2,
					}}
					variants={textVariants}
				>
					It looks like there&apos;s nothing here yet!
				</motion.p>
			</CardContent>
		</MotionCard>
	);
};

const MotionCardError = motion(Card);

const ErrorResult = () => {
	const textVariants = {
		initial: { opacity: 0, y: 20 },
		animate: { opacity: 1, y: 0 },
	};

	const cardShake = {
		initial: { x: 0 },
		animate: {
			x: [0, -10, 10, -10, 0],
			rotate: [0, -5, 5, -5, 0],
			transition: {
				duration: 0.6,
				// repeat: Infinity,
				// repeatType: "loop" as const,
			},
		},
	};

	return (
		<MotionCardError
			animate="animate"
			className="mx-auto max-w-sm shadow-lg"
			initial="initial"
			variants={cardShake}
		>
			<CardContent className="flex flex-col items-center p-6">
				<div className="h-32 w-32">
					<DotLottieReact autoplay loop src="/dot-lottie/error.lottie" />
				</div>

				{/* Animated Heading */}
				<motion.h2
					animate="animate"
					className="mt-4 text-center font-semibold text-red-600 text-xl"
					initial="initial"
					transition={{ duration: 0.6, ease: "easeOut" }}
					variants={textVariants}
				>
					Error Occurred!
				</motion.h2>

				{/* Animated Description */}
				<motion.p
					animate="animate"
					className="mt-2 text-center text-gray-600"
					initial="initial"
					transition={{
						duration: 0.8,
						ease: "easeOut",
						delay: 0.2,
					}}
					variants={textVariants}
				>
					There was a problem processing your request. Please try again.
				</motion.p>
			</CardContent>
		</MotionCardError>
	);
};

const SuccessResult: React.FC = () => {
	// Animation variants for reusability
	const textVariants = {
		initial: { opacity: 0, y: 20 },
		animate: { opacity: 1, y: 0 },
	};

	return (
		<AnimatePresence>
			<Card className="mx-auto max-w-sm shadow-lg">
				<CardContent className="flex flex-col items-center p-6">
					<div className="h-32 w-32">
						<DotLottieReact autoplay loop src="/dot-lottie/success.lottie" />
					</div>

					{/* Animated Heading */}
					<motion.h2
						animate="animate"
						className="mt-4 text-center font-semibold text-blue-600 text-xl"
						initial="initial"
						transition={{ duration: 0.6, ease: "easeOut" }}
						variants={textVariants}
					>
						Success!
					</motion.h2>

					{/* Animated Description */}
					<motion.p
						animate="animate"
						className="mt-2 text-center text-gray-600"
						initial="initial"
						transition={{
							duration: 0.8,
							ease: "easeOut",
							delay: 0.2, // Staggered animation
						}}
						variants={textVariants}
					>
						Your operation was completed successfully.
					</motion.p>
				</CardContent>
			</Card>
		</AnimatePresence>
	);
};

export { EmptyResult, ErrorResult, SuccessResult };

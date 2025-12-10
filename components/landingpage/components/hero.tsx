"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { WaitlistModal } from "@/components/landingpage/components/waitlist-modal";

export const Hero = () => {
	const ref = useRef<HTMLDivElement>(null);
	const [showWaitlistModal, setShowWaitlistModal] = useState(false);
	const [email, setEmail] = useState("");
	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ["start start", "end start"],
	});

	// Background moves the slowest (appears farthest away)
	const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

	// Midground moves slightly faster
	const midgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

	// Foreground moves with the scroll or slightly slower, creates depth
	const foregroundY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

	// Text moves up slightly faster to fade out
	const textY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
	const textOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
	const ctaOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0.6]);

	return (
		<div
			ref={ref}
			className="relative h-[120vh] w-screen overflow-hidden flex items-center justify-center bg-gray-900"
		>
			{/* Background Layer - Sky/Distant */}
			<motion.div 
				className="absolute inset-0 z-0" 
				style={{ y: backgroundY }}
				initial={{ scale: 1.1, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ duration: 1.5, ease: "easeOut" }}
			>
				<Image
					src="/heroParralax1.png"
					alt="Background Landscape"
					fill
					className="object-cover"
					priority
					quality={100}
				/>
			</motion.div>

			{/* Midground Layer */}
			<motion.div 
				className="absolute inset-0 z-10" 
				style={{ y: midgroundY }}
				initial={{ scale: 1.1, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
			>
				<Image
					src="/heroParralax2.png"
					alt="Midground Landscape"
					fill
					className="object-cover"
					priority
					quality={100}
				/>
			</motion.div>

			{/* Overlay content */}
			<motion.div
				className="absolute inset-0 -top-[35vh] z-25 flex flex-col items-center justify-center gap-8 px-6 text-center text-white pointer-events-none"
				style={{ y: textY }}
			>
				<motion.div
					className="max-w-5xl pointer-events-auto space-y-4"
					style={{ opacity: textOpacity }}
				>
					<motion.h1 
						className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight drop-shadow-md drop-shadow-black/50"
						initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
						animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
						transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
					>
						<span className="text-white drop-shadow-md drop-shadow-black/50">

						Fairlend: Smarter Mortgage Investing.
						</span>
					</motion.h1>
					<motion.p 
						className="text-lg md:text-2xl font-medium text-gray-100 drop-shadow-md drop-shadow-black/70"
						initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
						animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
						transition={{ duration: 1, ease: "easeOut", delay: 0.7 }}
					>
						<p className="text-gray-100 drop-shadow-md drop-shadow-black/70">
						Earn lending fees like private equity. Without the hassle.
						</p>
					</motion.p>
				</motion.div>

				{/* CTA buttons */}
				<motion.div
					className="pointer-events-auto flex flex-col items-center gap-4 max-w-2xl w-full"
					style={{ opacity: ctaOpacity }}
				>
					<motion.div 
						className="flex w-full items-center gap-3 rounded-full border-3 border-green-500/50 bg-black/30 px-4 py-3 shadow-2xl backdrop-blur-lg"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5, ease: "easeOut", delay: 0.9 }}
					>
						<input
							className="w-full bg-transparent shadow-2xl shadow-black/50 text-base md:text-lg text-white placeholder:text-white outline-none"
							placeholder="Enter your email"
							type="email"
							aria-label="Email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') setShowWaitlistModal(true);
							}}
						/>
						<button
							type="button"
							onClick={() => setShowWaitlistModal(true)}
							className="flex size-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700 cursor-pointer"
						>
							<ArrowRight className="size-5" />
						</button>
					</motion.div>
				</motion.div>
			</motion.div>
			
			<WaitlistModal 
				open={showWaitlistModal} 
				onOpenChange={setShowWaitlistModal}
				defaultEmail={email}
			/>

			{/* Foreground Layer - Immediate view */}
			<motion.div 
				className="absolute inset-0 z-30 pointer-events-none" 
				style={{ y: foregroundY }}
				initial={{ scale: 1.1, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
			>
				<Image
					src="/Heroparralax3.png"
					alt="Foreground Landscape"
					fill
					className="object-cover"
					priority
					quality={100}
				/>
			</motion.div>

			{/* Gradient Overlays for readability and smooth transition */}
			<div className="absolute inset-x-0 top-0 h-48 bg-linear-to-b from-black/40 to-transparent z-40 pointer-events-none" />
			<div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-background to-transparent z-40 pointer-events-none" />
		</div>
	);
};

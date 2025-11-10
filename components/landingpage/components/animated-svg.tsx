"use client";
import { motion } from "motion/react";

export const AnimatedSvg = () => {
	const paths = [
		"M-3 105L103.361 83.8902C249.231 54.9388 399.494 56.2615 544.832 87.7761V87.7761C656.429 111.974 772.815 100.368 877.436 54.6082L1000 1",
		"M-14 104.5V104.5C134.472 44.9157 297.569 31.9583 453.587 67.352L545.705 88.2494C649.932 111.894 758.811 104.384 858.805 66.654L1001 13",
		"M-3 130L103.361 108.89C249.231 79.9388 399.494 81.2615 544.832 112.776V112.776C656.429 136.974 772.815 125.368 877.436 79.6082L1000 26",
		"M-14 129.5V129.5C134.472 69.9157 297.569 56.9583 453.587 92.352L545.705 113.249C649.932 136.894 758.811 129.384 858.805 91.654L1001 38",
		"M-4 117L102.361 95.8902C248.231 66.9388 398.494 68.2615 543.832 99.7761V99.7761C655.429 123.974 771.815 112.368 876.436 66.6082L999 13",
		"M-14 125.5V125.5C134.109 60.8645 299.007 45.2843 456.601 81.0357L555.836 103.548C653.631 125.733 755.697 119.918 850.339 86.7695L1001 34.0001",
		"M-4 142L102.361 120.89C248.231 91.9388 398.494 93.2615 543.832 124.776V124.776C655.429 148.974 771.815 137.368 876.436 91.6082L999 38",
		"M-15 141.5V141.5C133.472 81.9157 296.569 68.9583 452.587 104.352L544.705 125.249C648.932 148.894 757.811 141.384 857.805 103.654L1000 50",
		"M-4 167L102.361 145.89C248.231 116.939 398.494 118.261 543.832 149.776V149.776C655.429 173.974 771.815 162.368 876.436 116.608L999 63",
		"M-15 166.5V166.5C133.472 106.916 296.569 93.9583 452.587 129.352L544.705 150.249C648.932 173.894 757.811 166.384 857.805 128.654L1000 75",
	];

	return (
		<div
			className="pointer-events-none absolute inset-0"
			style={{
				perspective: "100px",
			}}
		>
			<motion.svg
				className="-z-10 pointer-events-none relative inset-0 mt-40 h-full w-full flex-shrink-0 transform text-neutral-900 md:scale-100 dark:opacity-100"
				fill="none"
				height="430"
				viewBox="0 0 1003 430"
				width="1003"
				xmlns="http://www.w3.org/2000/svg"
			>
				{/* Main Path */}
				{paths.map((path, idx) => (
					<motion.path
						d={path}
						key={`path-${idx}`}
						stroke={"currentColor"}
						strokeWidth={0.5}
					/>
				))}

				{/* gradient Path */}
				{paths.map((path, idx) => (
					<motion.path
						d={path}
						key={`gradient-path-${idx}`}
						stroke={`url(#gradient_${idx})`}
						strokeWidth={0.5}
					/>
				))}

				<defs>
					<filter height="120%" id="blur" width="120%" x="-10%" y="-10%">
						<feGaussianBlur in="SourceGraphic" stdDeviation="1" />
					</filter>
					<linearGradient id="path_gradient_hero">
						<stop stopColor="#6DD4F5" />
						<stop offset="0.5" stopColor="#20FFFF" />
						<stop offset="1" stopColor="#00A3FF" stopOpacity="0" />
					</linearGradient>
					{paths.map((_, idx) => (
						<motion.linearGradient
							animate={{
								x1: "100%",
								y1: "0%",
								x2: "120%",
								y2: "0%",
							}}
							gradientUnits="userSpaceOnUse"
							id={`gradient_${idx}`}
							initial={{
								x1: "0%",
								y1: "0%",
								x2: "0%",
								y2: "0%",
							}}
							key={`gradient-def-${idx}`}
							transition={{
								duration: Math.random() * (7 - 2) + 2,
								ease: "linear",
								repeat: Number.POSITIVE_INFINITY,
								repeatDelay: Math.random() * (5 - 2) + 2,
							}}
						>
							<stop stopColor="#001AFF" stopOpacity={"0"} />
							<stop offset="1" stopColor="#6DD4F5" />
							<stop offset="1" stopColor="#6DD4F5" stopOpacity="0" />
						</motion.linearGradient>
					))}
				</defs>
			</motion.svg>
		</div>
	);
};

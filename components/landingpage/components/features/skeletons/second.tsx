"use client";
import { motion, useAnimate } from "motion/react";
import { useState } from "react";

export const SkeletonTwo = () => {
	const [scope, animate] = useAnimate();
	const [animating, setAnimating] = useState(false);
	const enterAnimation = async () => {
		if (animating) return;

		setAnimating(true);
		await animate(
			".message",
			{
				scale: [0, 1],
			},
			{
				duration: 0.4,
			}
		);
		setAnimating(false);
	};

	return (
		<div
			className="h-full overflow-hidden p-8"
			onMouseEnter={enterAnimation}
			ref={scope}
		>
			<div className="relative flex h-full flex-col items-center justify-center gap-4">
				<div className="message absolute top-10 left-10 rounded-full px-4 py-2 shadow-[0px_0px_8px_0px_rgba(248,248,248,0.25)_inset,0px_32px_24px_-16px_rgba(0,0,0,0.40)_inset]">
					<p className="text-xs">+200 connections</p>
				</div>
				<svg
					className="text-neutral-600"
					fill="none"
					height="163"
					viewBox="0 0 335 163"
					width="335"
					xmlns="http://www.w3.org/2000/svg"
				>
					<g filter="url(#graph-line)" opacity="0.75">
						<path
							d="M335 151L317.491 36.2214C317.166 34.0879 316.477 32.0245 315.57 30.0659C307.713 13.0898 308.853 1 284 1C257.738 1 244.262 37.1622 218 37.1622C191.738 37.1622 195.262 67.5 169 67.5C142.738 67.5 141.262 37.1622 115 37.1622C88.7381 37.1622 88.7141 76.5675 62.4522 76.5675C36.1902 76.5675 36.1902 54.6756 9.9283 54.6756H0"
							stroke="currentColor"
							strokeWidth="1.5"
						/>
					</g>
					<path
						d="M335 151L317.491 36.2214C317.166 34.0879 316.477 32.0245 315.57 30.0659C307.713 13.0898 308.853 1 284 1C257.738 1 244.262 37.1622 218 37.1622C191.738 37.1622 195.262 67.5 169 67.5C142.738 67.5 141.262 37.1622 115 37.1622C88.7381 37.1622 88.7141 76.5675 62.4522 76.5675C36.1902 76.5675 36.1902 54.6756 9.9283 54.6756H0"
						stroke="url(#gradient-3)"
						strokeWidth="1.5"
					/>
					<defs>
						<filter
							colorInterpolationFilters="sRGB"
							filterUnits="userSpaceOnUse"
							height="190.863"
							id="graph-line"
							width="351.741"
							x="-8"
							y="0.25"
						>
							<feFlood floodOpacity="0" result="BackgroundImageFix" />
							<feColorMatrix
								in="SourceAlpha"
								result="hardAlpha"
								type="matrix"
								values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
							/>
							<feMorphology
								in="SourceAlpha"
								operator="erode"
								radius="16"
								result="effect1_dropShadow_1_60235"
							/>
							<feOffset dy="32" />
							<feGaussianBlur stdDeviation="12" />
							<feComposite in2="hardAlpha" operator="out" />
							<feColorMatrix
								type="matrix"
								values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.4 0"
							/>
							<feBlend
								in2="BackgroundImageFix"
								mode="multiply"
								result="effect1_dropShadow_1_60235"
							/>
							<feBlend
								in="SourceGraphic"
								in2="effect1_dropShadow_1_60235"
								mode="normal"
								result="shape"
							/>
							<feColorMatrix
								in="SourceAlpha"
								result="hardAlpha"
								type="matrix"
								values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
							/>
							<feOffset />
							<feGaussianBlur stdDeviation="4" />
							<feComposite
								in2="hardAlpha"
								k2="-1"
								k3="1"
								operator="arithmetic"
							/>
							<feColorMatrix
								type="matrix"
								values="0 0 0 0 0.972549 0 0 0 0 0.972549 0 0 0 0 0.972549 0 0 0 0.25 0"
							/>
							<feBlend
								in2="shape"
								mode="normal"
								result="effect2_innerShadow_1_60235"
							/>
						</filter>
						<motion.linearGradient
							animate={{
								x1: "100%",
								y1: "0%",
								x2: "120%",
								y2: "0%",
							}}
							id="gradient-3"
							initial={{
								x1: "0%",
								y1: "0%",
								x2: "0%",
								y2: "0%",
							}}
							transition={{
								duration: Math.random() * (7 - 2) + 2,
								ease: "linear",
								repeat: Number.POSITIVE_INFINITY,
							}}
						>
							<stop stopColor="#001AFF" stopOpacity={"0"} />
							<stop offset="1" stopColor="#6DD4F5" />
							<stop offset="1" stopColor="#6DD4F5" stopOpacity="0" />
						</motion.linearGradient>
					</defs>
				</svg>
				<svg
					className="-left-[4.4rem] absolute top-12"
					fill="none"
					height="162"
					viewBox="0 0 335 162"
					width="335"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M62.4522 74.8549C36.1902 74.8549 36.1902 53.1412 9.9283 53.1412H0V162H335V148.682L317.457 36.1367C316.834 32.1397 314.854 28.4689 313.175 24.7886C308.579 14.7151 307.984 0 286 0C259.738 0 247.762 35.7703 221.5 35.7703C195.238 35.7703 196.762 66.5 170.5 66.5C144.238 66.5 141.262 35.7704 115 35.7704C88.7381 35.7704 88.7141 74.8549 62.4522 74.8549Z"
						fill="url(#paint0_linear_1_60234)"
						opacity="0.1"
					/>
					<defs>
						<linearGradient
							gradientUnits="userSpaceOnUse"
							id="paint0_linear_1_60234"
							x1="167.5"
							x2="183.302"
							y1="148.4"
							y2="-107.424"
						>
							<stop stopColor="white" stopOpacity="0" />
							<stop offset="0.571573" stopColor="white" stopOpacity="0.9" />
							<stop offset="1" stopColor="white" />
						</linearGradient>
					</defs>
				</svg>

				<svg
					className="-top-2 vertical-dots absolute inset-x-0 h-full w-full"
					fill="none"
					height="320"
					viewBox="0 0 36 320"
					width="36"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M18.75 4.5C18.75 4.08579 18.4142 3.75 18 3.75C17.5858 3.75 17.25 4.08579 17.25 4.5L18.75 4.5ZM17.25 4.5L17.25 8.56522L18.75 8.56522L18.75 4.5L17.25 4.5ZM17.25 16.6957L17.25 24.8261L18.75 24.8261L18.75 16.6957L17.25 16.6957ZM17.25 32.9565L17.25 41.087L18.75 41.087L18.75 32.9565L17.25 32.9565ZM17.25 49.2174L17.25 57.3478L18.75 57.3478L18.75 49.2174L17.25 49.2174ZM17.25 65.4783L17.25 73.6087L18.75 73.6087L18.75 65.4783L17.25 65.4783ZM17.25 81.7391L17.25 89.8696L18.75 89.8696L18.75 81.7391L17.25 81.7391ZM17.25 98L17.25 106.13L18.75 106.13L18.75 98L17.25 98ZM17.25 114.261L17.25 122.391L18.75 122.391L18.75 114.261L17.25 114.261ZM17.25 130.522L17.25 138.652L18.75 138.652L18.75 130.522L17.25 130.522ZM17.25 146.783L17.25 154.913L18.75 154.913L18.75 146.783L17.25 146.783ZM17.25 163.043L17.25 171.174L18.75 171.174L18.75 163.043L17.25 163.043ZM17.25 179.304L17.25 187.435L18.75 187.435L18.75 179.304L17.25 179.304ZM17.25 195.565L17.25 203.696L18.75 203.696L18.75 195.565L17.25 195.565ZM17.25 211.826L17.25 219.956L18.75 219.956L18.75 211.826L17.25 211.826ZM17.25 228.087L17.25 236.217L18.75 236.217L18.75 228.087L17.25 228.087ZM17.25 244.348L17.25 252.478L18.75 252.478L18.75 244.348L17.25 244.348ZM17.25 260.609L17.25 268.739L18.75 268.739L18.75 260.609L17.25 260.609ZM17.25 276.87L17.25 285L18.75 285L18.75 276.87L17.25 276.87ZM17.25 293.13L17.25 301.261L18.75 301.261L18.75 293.13L17.25 293.13ZM17.25 309.391L17.25 317.522L18.75 317.522L18.75 309.391L17.25 309.391ZM17.25 325.652L17.25 333.783L18.75 333.783L18.75 325.652L17.25 325.652ZM17.25 341.913L17.25 350.043L18.75 350.043L18.75 341.913L17.25 341.913ZM17.25 358.174L17.25 366.304L18.75 366.304L18.75 358.174L17.25 358.174ZM17.25 374.435L17.25 378.5L18.75 378.5L18.75 374.435L17.25 374.435Z"
						fill="#F8F8F8"
						opacity="0.1"
					/>
					<g filter="url(#filter0_bdi_1_60257)">
						<circle
							cx="18"
							cy="154"
							fill="#F8F8F8"
							fillOpacity="0.01"
							r="10"
							shapeRendering="crispEdges"
						/>
						<circle
							cx="18"
							cy="154"
							fill="#121212"
							fillOpacity="0.3"
							r="10"
							shapeRendering="crispEdges"
						/>
						<circle
							cx="18"
							cy="154"
							r="9.5"
							shapeRendering="crispEdges"
							stroke="url(#paint0_linear_1_60257)"
							stroke-opacity="0.25"
						/>
					</g>
					<circle cx="18" cy="154" fill="#F8F8F8" r="5" />
					<defs>
						<filter
							colorInterpolationFilters="sRGB"
							filterUnits="userSpaceOnUse"
							height="72"
							id="filter0_bdi_1_60257"
							width="44"
							x="-4"
							y="132"
						>
							<feFlood floodOpacity="0" result="BackgroundImageFix" />
							<feGaussianBlur in="BackgroundImageFix" stdDeviation="6" />
							<feComposite
								in2="SourceAlpha"
								operator="in"
								result="effect1_backgroundBlur_1_60257"
							/>
							<feColorMatrix
								in="SourceAlpha"
								result="hardAlpha"
								type="matrix"
								values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
							/>
							<feMorphology
								in="SourceAlpha"
								operator="erode"
								radius="16"
								result="effect2_dropShadow_1_60257"
							/>
							<feOffset dy="32" />
							<feGaussianBlur stdDeviation="12" />
							<feComposite in2="hardAlpha" operator="out" />
							<feColorMatrix
								type="matrix"
								values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.4 0"
							/>
							<feBlend
								in2="effect1_backgroundBlur_1_60257"
								mode="multiply"
								result="effect2_dropShadow_1_60257"
							/>
							<feBlend
								in="SourceGraphic"
								in2="effect2_dropShadow_1_60257"
								mode="normal"
								result="shape"
							/>
							<feColorMatrix
								in="SourceAlpha"
								result="hardAlpha"
								type="matrix"
								values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
							/>
							<feOffset />
							<feGaussianBlur stdDeviation="4" />
							<feComposite
								in2="hardAlpha"
								k2="-1"
								k3="1"
								operator="arithmetic"
							/>
							<feColorMatrix
								type="matrix"
								values="0 0 0 0 0.972549 0 0 0 0 0.972549 0 0 0 0 0.972549 0 0 0 0.25 0"
							/>
							<feBlend
								in2="shape"
								mode="normal"
								result="effect3_innerShadow_1_60257"
							/>
						</filter>
						<linearGradient
							gradientUnits="userSpaceOnUse"
							id="paint0_linear_1_60257"
							x1="18"
							x2="26.7004"
							y1="144"
							y2="165.962"
						>
							<stop stopColor="white" stopOpacity="0.4" />
							<stop offset="0.4" stopColor="white" stopOpacity="0.01" />
							<stop offset="0.6" stopColor="white" stopOpacity="0.01" />
							<stop offset="1" stopColor="white" stopOpacity="0.1" />
						</linearGradient>
					</defs>
				</svg>

				<svg
					className="cursor absolute inset-0 m-auto h-4 w-4 translate-x-4"
					fill="none"
					height="19"
					viewBox="0 0 19 19"
					width="19"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M3.08365 1.18326C2.89589 1.11581 2.70538 1.04739 2.54453 1.00558C2.39192 0.965918 2.09732 0.900171 1.78145 1.00956C1.41932 1.13497 1.13472 1.41956 1.00932 1.78169C0.899927 2.09756 0.965674 2.39216 1.00533 2.54477C1.04714 2.70562 1.11557 2.89613 1.18301 3.0839L5.9571 16.3833C6.04091 16.6168 6.12128 16.8408 6.2006 17.0133C6.26761 17.1591 6.42 17.4781 6.75133 17.6584C7.11364 17.8555 7.54987 17.8612 7.91722 17.6737C8.25317 17.5021 8.41388 17.1873 8.48469 17.0433C8.56852 16.8729 8.65474 16.6511 8.74464 16.4198L10.8936 10.8939L16.4196 8.74489C16.6509 8.655 16.8726 8.56879 17.043 8.48498C17.187 8.41416 17.5018 8.25346 17.6734 7.91751C17.8609 7.55016 17.8552 7.11392 17.6581 6.75162C17.4778 6.42029 17.1589 6.2679 17.0131 6.20089C16.8405 6.12157 16.6165 6.0412 16.383 5.9574L3.08365 1.18326Z"
						fill="var(--blue-900)"
						stroke="var(--blue-500)"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="1.5"
					/>
				</svg>
			</div>
		</div>
	);
};

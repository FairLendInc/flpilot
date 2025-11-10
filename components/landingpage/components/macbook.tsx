"use client";
import {
	IconBrightnessDown,
	IconBrightnessUp,
	IconCaretDownFilled,
	IconCaretLeftFilled,
	IconCaretRightFilled,
	IconCaretUpFilled,
	IconChevronUp,
	IconCommand,
	IconMicrophone,
	IconMoon,
	IconPlayerSkipForward,
	IconPlayerTrackNext,
	IconPlayerTrackPrev,
	IconSearch,
	IconTable,
	IconVolume,
	IconVolume2,
	IconVolume3,
	IconWorld,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import Image from "next/image";
import type React from "react";
import { cn } from "@/lib/utils";

const lidContainerVariants = {
	hover: {
		rotateX: -35,
		perspective: "200px",
	},
};

const imageVariants = {
	hover: {
		opacity: 1,
	},
};

export const MacbookScroll = ({
	src,
	showGradient,
	badge,
}: {
	src?: string;
	showGradient?: boolean;
	badge?: React.ReactNode;
}) => {
	return (
		<motion.div
			className="group -mt-20 sm:-mt-10 md:-mt-0 mx-auto flex max-w-2xl flex-shrink-0 scale-[0.45] transform flex-col items-center justify-start py-0 [perspective:800px] sm:scale-[0.7] md:scale-100 md:py-20"
			whileHover="hover"
			whileTap="hover"
		>
			{/* Lid */}
			<Lid src={src} />
			{/* Base area */}
			<div className="-z-10 relative h-[22rem] w-[32rem] overflow-hidden rounded-2xl bg-[#272729]">
				{/* above keyboard bar */}
				<div className="relative h-10 w-full">
					<div className="absolute inset-x-0 mx-auto h-4 w-[80%] bg-[#050505]" />
				</div>
				<div className="relative flex">
					<div className="mx-auto h-full w-[10%] overflow-hidden">
						<SpeakerGrid />
					</div>
					<div className="mx-auto h-full w-[80%]">
						<Keypad />
					</div>
					<div className="mx-auto h-full w-[10%] overflow-hidden">
						<SpeakerGrid />
					</div>
				</div>
				<Trackpad />
				<div className="absolute inset-x-0 bottom-0 mx-auto h-2 w-20 rounded-tl-3xl rounded-tr-3xl bg-gradient-to-t from-[#272729] to-[#050505]" />
				{showGradient && (
					<div className="absolute inset-x-0 bottom-0 z-50 h-40 w-full bg-gradient-to-t from-charcoal via-charcoal to-transparent" />
				)}
				{badge && <div className="absolute bottom-4 left-4">{badge}</div>}
			</div>
		</motion.div>
	);
};

export const Lid = ({ src }: { src?: string }) => (
	<motion.div className="relative z-50 [perspective:800px]">
		<motion.div
			className="relative h-[12rem] w-[32rem] overflow-hidden rounded-2xl bg-[#010101] p-2"
			style={{
				perspective: "1000px",
				rotateX: -65,
				translateZ: 0,
				transformOrigin: "bottom",
				transformStyle: "preserve-3d",
				boxShadow: "0px 2px 0px 2px var(--neutral-800) inset",
			}}
			transition={{
				duration: 0.6,
				ease: "easeInOut",
			}}
			variants={lidContainerVariants}
		>
			<motion.div
				className="absolute inset-0 m-auto flex h-[95%] w-[98.5%] items-center justify-center overflow-hidden rounded-xl bg-[#010101]"
				style={{
					boxShadow: "0px 2px 0px 2px var(--neutral-800) inset",
					opacity: 0.2,
				}}
				transition={{
					duration: 0.6,
					ease: "easeInOut",
					delay: 0.2,
				}}
				variants={imageVariants}
			>
				<Image
					alt="aceternity logo"
					className="inset-0 h-full w-full rounded-lg object-cover object-left-top"
					fill
					src={src as string}
				/>
			</motion.div>
		</motion.div>
	</motion.div>
);

export const Trackpad = () => (
	<div
		className="mx-auto my-1 h-32 w-[40%] rounded-xl"
		style={{
			boxShadow: "0px 0px 1px 1px #00000020 inset",
		}}
	/>
);

export const Keypad = () => {
	return (
		<div className="mx-1 h-full rounded-md bg-[#050505] p-1">
			{/* First Row */}
			<Row>
				<KBtn
					childrenClassName="items-start"
					className="w-10 items-end justify-start pb-[2px] pl-[4px]"
				>
					esc
				</KBtn>
				<KBtn>
					<IconBrightnessDown className="h-[6px] w-[6px]" />
					<span className="mt-1 inline-block">F1</span>
				</KBtn>

				<KBtn>
					<IconBrightnessUp className="h-[6px] w-[6px]" />
					<span className="mt-1 inline-block">F2</span>
				</KBtn>
				<KBtn>
					<IconTable className="h-[6px] w-[6px]" />
					<span className="mt-1 inline-block">F3</span>
				</KBtn>
				<KBtn>
					<IconSearch className="h-[6px] w-[6px]" />
					<span className="mt-1 inline-block">F4</span>
				</KBtn>
				<KBtn>
					<IconMicrophone className="h-[6px] w-[6px]" />
					<span className="mt-1 inline-block">F5</span>
				</KBtn>
				<KBtn>
					<IconMoon className="h-[6px] w-[6px]" />
					<span className="mt-1 inline-block">F6</span>
				</KBtn>
				<KBtn>
					<IconPlayerTrackPrev className="h-[6px] w-[6px]" />
					<span className="mt-1 inline-block">F7</span>
				</KBtn>
				<KBtn>
					<IconPlayerSkipForward className="h-[6px] w-[6px]" />
					<span className="mt-1 inline-block">F8</span>
				</KBtn>
				<KBtn>
					<IconPlayerTrackNext className="h-[6px] w-[6px]" />
					<span className="mt-1 inline-block">F8</span>
				</KBtn>
				<KBtn>
					<IconVolume3 className="h-[6px] w-[6px]" />
					<span className="mt-1 inline-block">F10</span>
				</KBtn>
				<KBtn>
					<IconVolume2 className="h-[6px] w-[6px]" />
					<span className="mt-1 inline-block">F11</span>
				</KBtn>
				<KBtn>
					<IconVolume className="h-[6px] w-[6px]" />
					<span className="mt-1 inline-block">F12</span>
				</KBtn>
				<KBtn>
					<div className="h-4 w-4 rounded-full bg-gradient-to-b from-20% from-neutral-900 via-50% via-black to-95% to-neutral-900 p-px">
						<div className="h-full w-full rounded-full bg-black" />
					</div>
				</KBtn>
			</Row>

			{/* Second row */}
			<Row>
				<KBtn>
					<span className="block">~</span>
					<span className="mt-1 block">`</span>
				</KBtn>

				<KBtn>
					<span className="block">!</span>
					<span className="block">1</span>
				</KBtn>
				<KBtn>
					<span className="block">@</span>
					<span className="block">2</span>
				</KBtn>
				<KBtn>
					<span className="block">#</span>
					<span className="block">3</span>
				</KBtn>
				<KBtn>
					<span className="block">$</span>
					<span className="block">4</span>
				</KBtn>
				<KBtn>
					<span className="block">%</span>
					<span className="block">5</span>
				</KBtn>
				<KBtn>
					<span className="block">^</span>
					<span className="block">6</span>
				</KBtn>
				<KBtn>
					<span className="block">&</span>
					<span className="block">7</span>
				</KBtn>
				<KBtn>
					<span className="block">*</span>
					<span className="block">8</span>
				</KBtn>
				<KBtn>
					<span className="block">(</span>
					<span className="block">9</span>
				</KBtn>
				<KBtn>
					<span className="block">)</span>
					<span className="block">0</span>
				</KBtn>
				<KBtn>
					<span className="block">&mdash;</span>
					<span className="block">_</span>
				</KBtn>
				<KBtn>
					<span className="block">+</span>
					<span className="block"> = </span>
				</KBtn>
				<KBtn
					childrenClassName="items-end"
					className="w-10 items-end justify-end pr-[4px] pb-[2px]"
				>
					delete
				</KBtn>
			</Row>

			{/* Third row */}
			<Row>
				<KBtn
					childrenClassName="items-start"
					className="w-10 items-end justify-start pb-[2px] pl-[4px]"
				>
					tab
				</KBtn>
				<KBtn>
					<span className="block">Q</span>
				</KBtn>

				<KBtn>
					<span className="block">W</span>
				</KBtn>
				<KBtn>
					<span className="block">E</span>
				</KBtn>
				<KBtn>
					<span className="block">R</span>
				</KBtn>
				<KBtn>
					<span className="block">T</span>
				</KBtn>
				<KBtn>
					<span className="block">Y</span>
				</KBtn>
				<KBtn>
					<span className="block">U</span>
				</KBtn>
				<KBtn>
					<span className="block">I</span>
				</KBtn>
				<KBtn>
					<span className="block">O</span>
				</KBtn>
				<KBtn>
					<span className="block">P</span>
				</KBtn>
				<KBtn>
					<span className="block">{"{"}</span>
					<span className="block">{"["}</span>
				</KBtn>
				<KBtn>
					<span className="block">{"}"}</span>
					<span className="block">{"]"}</span>
				</KBtn>
				<KBtn>
					<span className="block">{"|"}</span>
					<span className="block">{"\\"}</span>
				</KBtn>
			</Row>

			{/* Fourth Row */}
			<Row>
				<KBtn
					childrenClassName="items-start"
					className="w-[2.8rem] items-end justify-start pb-[2px] pl-[4px]"
				>
					caps lock
				</KBtn>
				<KBtn>
					<span className="block">A</span>
				</KBtn>

				<KBtn>
					<span className="block">S</span>
				</KBtn>
				<KBtn>
					<span className="block">D</span>
				</KBtn>
				<KBtn>
					<span className="block">F</span>
				</KBtn>
				<KBtn>
					<span className="block">G</span>
				</KBtn>
				<KBtn>
					<span className="block">H</span>
				</KBtn>
				<KBtn>
					<span className="block">J</span>
				</KBtn>
				<KBtn>
					<span className="block">K</span>
				</KBtn>
				<KBtn>
					<span className="block">L</span>
				</KBtn>
				<KBtn>
					<span className="block">{":"}</span>
					<span className="block">{";"}</span>
				</KBtn>
				<KBtn>
					<span className="block">{`"`}</span>
					<span className="block">{`'`}</span>
				</KBtn>
				<KBtn
					childrenClassName="items-end"
					className="w-[2.85rem] items-end justify-end pr-[4px] pb-[2px]"
				>
					return
				</KBtn>
			</Row>

			{/* Fifth Row */}
			<Row>
				<KBtn
					childrenClassName="items-start"
					className="w-[3.65rem] items-end justify-start pb-[2px] pl-[4px]"
				>
					shift
				</KBtn>
				<KBtn>
					<span className="block">Z</span>
				</KBtn>
				<KBtn>
					<span className="block">X</span>
				</KBtn>
				<KBtn>
					<span className="block">C</span>
				</KBtn>
				<KBtn>
					<span className="block">V</span>
				</KBtn>
				<KBtn>
					<span className="block">B</span>
				</KBtn>
				<KBtn>
					<span className="block">N</span>
				</KBtn>
				<KBtn>
					<span className="block">M</span>
				</KBtn>
				<KBtn>
					<span className="block">{"<"}</span>
					<span className="block">{","}</span>
				</KBtn>
				<KBtn>
					<span className="block">{">"}</span>
					<span className="block">{"."}</span>
				</KBtn>{" "}
				<KBtn>
					<span className="block">{"?"}</span>
					<span className="block">{"/"}</span>
				</KBtn>
				<KBtn
					childrenClassName="items-end"
					className="w-[3.65rem] items-end justify-end pr-[4px] pb-[2px]"
				>
					shift
				</KBtn>
			</Row>

			{/* sixth Row */}
			<Row>
				<KBtn childrenClassName="h-full justify-between py-[4px]" className="">
					<div className="flex w-full justify-end pr-1">
						<span className="block">fn</span>
					</div>
					<div className="flex w-full justify-start pl-1">
						<IconWorld className="h-[6px] w-[6px]" />
					</div>
				</KBtn>
				<KBtn childrenClassName="h-full justify-between py-[4px]" className="">
					<div className="flex w-full justify-end pr-1">
						<IconChevronUp className="h-[6px] w-[6px]" />
					</div>
					<div className="flex w-full justify-start pl-1">
						<span className="block">control</span>
					</div>
				</KBtn>
				<KBtn childrenClassName="h-full justify-between py-[4px]" className="">
					<div className="flex w-full justify-end pr-1">
						<OptionKey className="h-[6px] w-[6px]" />
					</div>
					<div className="flex w-full justify-start pl-1">
						<span className="block">option</span>
					</div>
				</KBtn>
				<KBtn
					childrenClassName="h-full justify-between py-[4px]"
					className="w-8"
				>
					<div className="flex w-full justify-end pr-1">
						<IconCommand className="h-[6px] w-[6px]" />
					</div>
					<div className="flex w-full justify-start pl-1">
						<span className="block">command</span>
					</div>
				</KBtn>
				<KBtn className="w-[8.2rem]" />
				<KBtn
					childrenClassName="h-full justify-between py-[4px]"
					className="w-8"
				>
					<div className="flex w-full justify-start pl-1">
						<IconCommand className="h-[6px] w-[6px]" />
					</div>
					<div className="flex w-full justify-start pl-1">
						<span className="block">command</span>
					</div>
				</KBtn>
				<KBtn childrenClassName="h-full justify-between py-[4px]" className="">
					<div className="flex w-full justify-start pl-1">
						<OptionKey className="h-[6px] w-[6px]" />
					</div>
					<div className="flex w-full justify-start pl-1">
						<span className="block">option</span>
					</div>
				</KBtn>
				<div className="mt-[2px] flex h-6 w-[4.9rem] flex-col items-center justify-end rounded-[4px] p-[0.5px]">
					<KBtn className="h-3 w-6">
						<IconCaretUpFilled className="h-[6px] w-[6px]" />
					</KBtn>
					<div className="flex">
						<KBtn className="h-3 w-6">
							<IconCaretLeftFilled className="h-[6px] w-[6px]" />
						</KBtn>
						<KBtn className="h-3 w-6">
							<IconCaretDownFilled className="h-[6px] w-[6px]" />
						</KBtn>
						<KBtn className="h-3 w-6">
							<IconCaretRightFilled className="h-[6px] w-[6px]" />
						</KBtn>
					</div>
				</div>
			</Row>
		</div>
	);
};
export const KBtn = ({
	className,
	children,
	childrenClassName,
	backlit = true,
}: {
	className?: string;
	children?: React.ReactNode;
	childrenClassName?: string;
	backlit?: boolean;
}) => (
	<div
		className={cn(
			"rounded-[4px] p-[0.5px]",
			backlit && "bg-white/[0.2] shadow-white shadow-xl"
		)}
	>
		<div
			className={cn(
				"flex h-6 w-6 items-center justify-center rounded-[3.5px] bg-[#0A090D]",
				className
			)}
			style={{
				boxShadow:
					"0px -0.5px 2px 0 #0D0D0F inset, -0.5px 0px 2px 0 #0D0D0F inset",
			}}
		>
			<div
				className={cn(
					"flex w-full flex-col items-center justify-center text-[5px] text-neutral-200",
					childrenClassName,
					backlit && "text-white"
				)}
			>
				{children}
			</div>
		</div>
	</div>
);

export const Row = ({ children }: { children: React.ReactNode }) => (
	<div className="mb-[2px] flex w-full flex-shrink-0 gap-[2px]">{children}</div>
);

export const SpeakerGrid = () => (
	<div
		className="mt-2 flex h-40 gap-[2px] px-[0.5px]"
		style={{
			backgroundImage:
				"radial-gradient(circle, #08080A 0.5px, transparent 0.5px)",
			backgroundSize: "3px 3px",
		}}
	/>
);

export const OptionKey = ({ className }: { className: string }) => (
	<svg
		className={className}
		fill="none"
		id="icon"
		version="1.1"
		viewBox="0 0 32 32"
		xmlns="http://www.w3.org/2000/svg"
	>
		<rect
			height="2"
			stroke="currentColor"
			strokeWidth={2}
			width="10"
			x="18"
			y="5"
		/>
		<polygon
			points="10.6,5 4,5 4,7 9.4,7 18.4,27 28,27 28,25 19.6,25 "
			stroke="currentColor"
			strokeWidth={2}
		/>
		<rect
			className="st0"
			height="32"
			id="_Transparent_Rectangle_"
			stroke="none"
			width="32"
		/>
	</svg>
);

const AceternityLogo = () => (
	<svg
		className="h-3 w-3 text-white"
		fill="none"
		height="65"
		viewBox="0 0 66 65"
		width="66"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M8 8.05571C8 8.05571 54.9009 18.1782 57.8687 30.062C60.8365 41.9458 9.05432 57.4696 9.05432 57.4696"
			stroke="currentColor"
			strokeLinecap="round"
			strokeMiterlimit="3.86874"
			strokeWidth="15"
		/>
	</svg>
);

"use client";
import type React from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

export const SkeletonFour = () => (
	<div className="group relative flex h-full flex-col overflow-hidden p-8">
		<div className="absolute inset-0 flex h-full w-full flex-shrink-0 flex-row justify-center gap-4">
			<CircleWithLine />
			<CircleWithLine />
			<CircleWithLine />
			<CircleWithLine />
			<CircleWithLine />
			<CircleWithLine />
			<CircleWithLine />
			<CircleWithLine />
			<CircleWithLine />
		</div>
		<Container className="mt-10 ml-4">Twitter post</Container>
		<Container className="mt-4 ml-10 transition duration-200 group-hover:scale-[1.02] group-hover:border-secondary">
			Email Campaign
		</Container>
		<Container className="mt-4 ml-4">Newsletter Campaign</Container>
		<Cursor
			className="top-20 left-40 group-hover:left-32"
			textClassName="group-hover:text-secondary"
		/>
		<Cursor
			className="top-60 left-12 group-hover:top-44 group-hover:left-32"
			text="Tyler Durden"
			textClassName="group-hover:text-white"
		/>
	</div>
);

const Cursor = ({
	className,
	textClassName,
	text,
}: {
	className?: string;
	textClassName?: string;
	text?: string;
}) => (
	<div
		className={cn("absolute h-4 w-4 transition-all duration-200", className)}
	>
		<svg
			className={cn("h-4 w-4 transition duration-200", className)}
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
		<div
			className={cn(
				"absolute top-3 left-3 whitespace-pre rounded-md p-1 text-[10px] text-neutral-500 transition duration-200",
				textClassName
			)}
		>
			{text ?? "Manu Arora"}
		</div>
	</div>
);

const Container = ({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) => (
	<div
		className={cn(
			"w-fit rounded-lg border border-neutral-600 p-0.5",
			className
		)}
	>
		<div
			className={cn(
				"flex h-10 items-center justify-center rounded-[5px] bg-[rgba(248,248,248,0.01)] px-2 text-neutral-400 text-xs shadow-[0px_0px_8px_0px_rgba(248,248,248,0.25)_inset,0px_32px_24px_-16px_rgba(0,0,0,0.40)]"
			)}
		>
			{children}
		</div>
	</div>
);

const CircleWithLine = ({ className }: { className?: string }) => {
	const id = useId();
	return (
		<div className={cn("flex flex-col items-center justify-center", className)}>
			<div
				className={cn(
					"h-3 w-3 rounded-full border border-[rgba(255,255,255,0.2)] bg-[rgba(248,248,248,0.02)] shadow-[2px_4px_16px_0px_rgba(248,248,248,0.06)_inset]"
				)}
			/>
			<svg
				fill="none"
				height="265"
				viewBox="0 0 2 265"
				width="2"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M1 265V1"
					stroke={`url(#${id})`}
					strokeLinecap="round"
					strokeOpacity="0.1"
					strokeWidth="1.5"
				/>
				<defs>
					<linearGradient
						gradientUnits="userSpaceOnUse"
						id={id}
						x1="1.5"
						x2="1.5"
						y1="1"
						y2="265"
					>
						<stop stopColor="#F8F8F8" stopOpacity="0.05" />
						<stop offset="0.530519" stopColor="#F8F8F8" stopOpacity="0.5" />
						<stop offset="1" stopColor="#F8F8F8" stopOpacity="0.05" />
					</linearGradient>
				</defs>
			</svg>
		</div>
	);
};

"use client";
import { animate } from "motion/react";
import type React from "react";
import { useEffect, useState } from "react";
import { GoCopilot } from "react-icons/go";
import {
	ClaudeLogo,
	GeminiLogo,
	MetaIconOutline,
	OpenAILogo,
} from "@/components/icons/illustrations";
import { SparklesCore } from "@/components/ui/sparkles";
import { cn } from "@/lib/utils";

export const SkeletonThree = () => {
	const [animating, setAnimating] = useState(false);

	const scale = [1, 1.1, 1];
	const transform = ["translateY(0px)", "translateY(-4px)", "translateY(0px)"];
	const sequence = [
		[
			".circle-1",
			{
				scale,
				transform,
			},
			{ duration: 0.8 },
		],
		[
			".circle-2",
			{
				scale,
				transform,
			},
			{ duration: 0.8 },
		],
		[
			".circle-3",
			{
				scale,
				transform,
			},
			{ duration: 0.8 },
		],
		[
			".circle-4",
			{
				scale,
				transform,
			},
			{ duration: 0.8 },
		],
		[
			".circle-5",
			{
				scale,
				transform,
			},
			{ duration: 0.8 },
		],
	];

	useEffect(() => {
		// @ts-ignore
		animate(sequence, {
			// @ts-ignore
			repeat: Number.POSITIVE_INFINITY,
			repeatDelay: 1,
		});
	}, []);
	return (
		<div className="relative flex h-full items-center justify-center overflow-hidden p-8">
			<div className="flex flex-shrink-0 flex-row items-center justify-center gap-2">
				<Container className="circle-1 h-8 w-8">
					<ClaudeLogo className="h-4 w-4" />
				</Container>
				<Container className="circle-2 h-12 w-12">
					<GoCopilot className="h-6 w-6" />
				</Container>
				<Container className="circle-3">
					<OpenAILogo className="h-8 w-8" />
				</Container>
				<Container className="circle-4 h-12 w-12">
					<MetaIconOutline className="h-6 w-6" />
				</Container>
				<Container className="circle-5 h-8 w-8">
					<GeminiLogo className="h-4 w-4" />
				</Container>
			</div>

			<div className="absolute top-20 z-40 m-auto h-40 w-px animate-move bg-gradient-to-b from-transparent via-secondary to-transparent">
				<div className="-translate-y-1/2 -left-10 absolute top-1/2 h-32 w-10">
					<SparklesCore
						background="transparent"
						className="h-full w-full"
						maxSize={1}
						minSize={0.4}
						particleColor="#FFFFFF"
						particleDensity={1200}
					/>
				</div>
			</div>
		</div>
	);
};

const Container = ({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) => (
	<div
		className={cn(
			"flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(248,248,248,0.01)] shadow-[0px_0px_8px_0px_rgba(248,248,248,0.25)_inset,0px_32px_24px_-16px_rgba(0,0,0,0.40)]",
			className
		)}
	>
		{children}
	</div>
);

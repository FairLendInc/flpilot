"use client";
import Image from "next/image";
import type React from "react";
import Marquee from "react-fast-marquee";
import { TbLocationBolt } from "react-icons/tb";
import { testimonials } from "@/constants/page-testimonials";
import { cn } from "@/lib/utils";
import { FeatureIconContainer } from "../features/feature-icon-container";
import { Heading } from "../heading";
import { Subheading } from "../subheading";

export const TestimonialsMarquee = () => (
	<div className="relative pb-40">
		<div className="pb-20">
			<FeatureIconContainer className="flex items-center justify-center overflow-hidden">
				<TbLocationBolt className="h-6 w-6 text-cyan-500" />
			</FeatureIconContainer>
			<Heading className="pt-4">Used by entreprenurs</Heading>
			<Subheading>
				Proactiv is used by serial entrepreneurs and overachievers.
			</Subheading>
		</div>

		<div className="relative">
			<div className="pointer-events-none absolute inset-y-0 left-0 z-40 h-full w-10 bg-gradient-to-r from-charcoal to-transparent md:w-80" />
			<div className="pointer-events-none absolute inset-y-0 right-0 z-40 h-full w-10 bg-gradient-to-l from-charcoal to-transparent md:w-80" />
			<Marquee className="h-full" pauseOnHover>
				{testimonials.map((testimonial, index) => (
					<Card key={`testimonial-${testimonial.src}-${index}`}>
						<Quote>{testimonial.quote}</Quote>
						<div className="mt-8 flex items-center gap-2">
							<Image
								alt="Manu Arora"
								className="rounded-full"
								height={40}
								src={testimonial.src}
								width={40}
							/>
							<div className="flex flex-col">
								<QuoteDescription className="text-neutral-300">
									{testimonial.name}
								</QuoteDescription>
								<QuoteDescription className="text-neutral-400">
									{testimonial.designation}
								</QuoteDescription>
							</div>
						</div>
					</Card>
				))}
			</Marquee>
			<Marquee
				className="mt-8 h-full"
				direction="right"
				pauseOnHover
				speed={40}
			>
				{testimonials.map((testimonial, index) => (
					<Card key={`testimonial-${testimonial.src}-${index}`}>
						<Quote>{testimonial.quote}</Quote>
						<div className="mt-8 flex items-center gap-2">
							<Image
								alt="Manu Arora"
								className="rounded-full"
								height={40}
								src={testimonial.src}
								width={40}
							/>
							<div className="flex flex-col">
								<QuoteDescription className="text-neutral-300">
									{testimonial.name}
								</QuoteDescription>
								<QuoteDescription className="text-neutral-400">
									{testimonial.designation}
								</QuoteDescription>
							</div>
						</div>
					</Card>
				))}
			</Marquee>
		</div>
	</div>
);

export const Card = ({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) => (
	<div
		className={cn(
			"group mx-2 h-full max-w-lg rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(40,40,40,0.30)] p-8 shadow-[2px_4px_16px_0px_rgba(248,248,248,0.06)_inset]",
			className
		)}
	>
		{children}
	</div>
);

export const Quote = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => (
	<h3 className={cn("py-2 font-semibold text-base text-white", className)}>
		{children}
	</h3>
);

export const QuoteDescription = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => (
	<p className={cn("max-w-sm font-normal text-neutral-400 text-sm", className)}>
		{children}
	</p>
);

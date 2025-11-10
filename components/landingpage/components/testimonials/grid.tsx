"use client";
import Image from "next/image";
import type React from "react";
import { cn } from "@/lib/utils";
import { testimonials } from "../constants/page-testimonials";

export const TestimonialsGrid = () => {
	const first = testimonials.slice(0, 4);
	const second = testimonials.slice(4, 8);
	const third = testimonials.slice(8, 12);
	const fourth = testimonials.slice(12, 16);

	const grid = [first, second, third, fourth];
	return (
		<div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
			{grid.map((testimonialsCol, index) => (
				<div className="grid gap-4" key={`testimonials-col-${index}`}>
					{testimonialsCol.map((testimonial) => (
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
				</div>
			))}
		</div>
	);
};
export const Card = ({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) => (
	<div
		className={cn(
			"group rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(40,40,40,0.30)] p-8 shadow-[2px_4px_16px_0px_rgba(248,248,248,0.06)_inset]",
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

"use client";
import { motion } from "motion/react";
import { HiArrowRight } from "react-icons/hi2";
import { AmbientColor } from "./ambient-color";
import { Button } from "./button";
import { Container } from "./container";
import { FeaturedImages } from "./featured-images";
import { MacbookScroll } from "./macbook";

export const CTA = () => (
	<div className="relative">
		<AmbientColor />
		<Container className="flex w-full flex-col items-center justify-between px-8 md:flex-row">
			<div className="flex flex-col">
				<motion.h2 className="mx-auto max-w-xl text-center font-bold text-white text-xl md:mx-0 md:text-left md:text-3xl">
					Get started today with Proactiv to kickstart your marketing efforts
				</motion.h2>
				<p className="mx-auto mt-8 max-w-md text-center text-neutral-400 text-sm md:mx-0 md:text-left md:text-base">
					Proactiv houses the best in class software tools to kickstart your
					marketing journey. Join 127,000+ other users to get started.
				</p>
				<FeaturedImages
					className="items-center justify-start lg:justify-start"
					containerClassName="md:items-start"
					showStars
					textClassName="lg:text-left text-center"
				/>
			</div>
			<Button className="group !text-lg flex items-center space-x-2">
				<span>Book a demo</span>
				<HiArrowRight className="mt-0.5 h-3 w-3 stroke-[1px] text-black transition-transform duration-200 group-hover:translate-x-1" />
			</Button>
		</Container>
		<MacbookScroll showGradient={true} src={"/dashboard.png"} />
	</div>
);

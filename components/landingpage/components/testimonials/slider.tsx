"use client";

import { Transition } from "@headlessui/react";
import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { testimonials as pageTestimonials } from "../constants/page-testimonials";
import { SparklesCore } from "../ui/sparkles";

// import Particles from './particles'

interface Item {
	src: StaticImageData;
	quote: string;
	name: string;
	designation?: string;
}

export const TestimonialsSlider = () => {
	const [active, setActive] = useState<number>(0);
	const [autorotate, setAutorotate] = useState<boolean>(true);
	const testimonialsRef = useRef<HTMLDivElement>(null);

	const testimonials = pageTestimonials.slice(0, 3);

	useEffect(() => {
		if (!autorotate) return;
		const interval = setInterval(() => {
			setActive(
				active + 1 === testimonials.length ? 0 : (active) => active + 1
			);
		}, 7000);
		return () => clearInterval(interval);
	}, [active, autorotate, testimonials.length]);

	const heightFix = () => {
		if (testimonialsRef.current && testimonialsRef.current.parentElement)
			testimonialsRef.current.parentElement.style.height = `${testimonialsRef.current.clientHeight}px`;
	};

	useEffect(() => {
		heightFix();

		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				heightFix();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, []);

	return (
		<section>
			<div className="relative z-40 mx-auto h-80 max-w-3xl">
				<div className="relative pb-12 md:pb-20">
					{/* Particles animation */}
					<div className="-translate-x-1/2 -top-2 -z-10 -mt-6 absolute left-1/2 h-20 w-80">
						<SparklesCore
							background="transparent"
							className="h-full w-full"
							id="new-particles"
							maxSize={1}
							minSize={0.4}
							particleColor="#FFFFFF"
							particleDensity={100}
						/>
					</div>

					{/* Carousel */}
					<div className="text-center">
						{/* Testimonial image */}
						<div className="relative h-40 [mask-image:_linear-gradient(0deg,transparent,#FFFFFF_30%,#FFFFFF)] md:[mask-image:_linear-gradient(0deg,transparent,#FFFFFF_40%,#FFFFFF)]">
							<div className="-translate-x-1/2 -z-10 before:-z-20 after:-z-20 pointer-events-none absolute top-0 left-1/2 h-[480px] w-[480px] rounded-full before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-neutral-400/20 before:to-20% before:to-transparent after:absolute after:inset-0 after:m-px after:rounded-full after:bg-neutral-900">
								{testimonials.map((item, index) => (
									<Transition
										beforeEnter={() => heightFix()}
										enter="transition ease-[cubic-bezier(0.68,-0.3,0.32,1)] duration-700 order-first"
										enterFrom="opacity-0 -rotate-[60deg]"
										enterTo="opacity-100 rotate-0"
										key={index}
										leave="transition ease-[cubic-bezier(0.68,-0.3,0.32,1)] duration-700"
										leaveFrom="opacity-100 rotate-0"
										leaveTo="opacity-0 rotate-[60deg]"
										show={active === index}
									>
										<div className="-z-10 absolute inset-0 h-full">
											<Image
												alt={item.name}
												className="-translate-x-1/2 relative top-11 left-1/2 rounded-full"
												height={56}
												src={item.src}
												width={56}
											/>
										</div>
									</Transition>
								))}
							</div>
						</div>
						{/* Text */}
						<div className="mb-10 px-8 transition-all delay-300 duration-150 ease-in-out sm:px-6">
							<div className="relative flex flex-col" ref={testimonialsRef}>
								{testimonials.map((item, index) => (
									<Transition
										beforeEnter={() => heightFix()}
										enter="transition ease-in-out duration-500 delay-200 order-first"
										enterFrom="opacity-0 -translate-x-4"
										enterTo="opacity-100 translate-x-0"
										key={index}
										leave="transition ease-out duration-300 delay-300 absolute"
										leaveFrom="opacity-100 translate-x-0"
										leaveTo="opacity-0 translate-x-4"
										show={active === index}
									>
										<div className="bg-gradient-to-r from-neutral-200/60 via-neutral-200 to-neutral-200/60 bg-clip-text font-bold text-base text-transparent md:text-xl">
											{item.quote}
										</div>
									</Transition>
								))}
							</div>
						</div>
						{/* Buttons */}
						<div className="-m-1.5 flex flex-wrap justify-center px-8 sm:px-6">
							{testimonials.map((item, index) => (
								<button
									className={cn(
										`relative m-1.5 rounded-full border border-transparent px-2 py-1 text-neutral-300 text-xs transition duration-150 ease-in-out [background:linear-gradient(theme(colors.neutral.900),_theme(colors.neutral.900))_padding-box,_conic-gradient(theme(colors.neutral.400),_theme(colors.neutral.700)_25%,_theme(colors.neutral.700)_75%,_theme(colors.neutral.400)_100%)_border-box] before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:bg-neutral-800/30 ${
											active === index
												? "border-secondary/50"
												: "border-transparent opacity-70"
										}`
									)}
									key={index}
									onClick={() => {
										setActive(index);
										setAutorotate(false);
									}}
								>
									<span className="relative">
										<span className="font-bold text-neutral-50">
											{item.name}
										</span>{" "}
										<br className="block sm:hidden" />
										<span className="hidden text-neutral-600 sm:inline-block">
											-
										</span>{" "}
										<span className="hidden sm:inline-block">
											{item.designation}
										</span>
									</span>
								</button>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

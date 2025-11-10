"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

type HeroSectionProps = {
	children: ReactNode;
};

export function HeroSection({ children }: HeroSectionProps) {
	const [isHeroVisible, setIsHeroVisible] = useState(true);
	const heroRef = useRef<HTMLElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				setIsHeroVisible(entry.isIntersecting);
			},
			{ threshold: 0.5 }
		);

		if (heroRef.current) {
			observer.observe(heroRef.current);
		}

		return () => {
			if (heroRef.current) {
				observer.unobserve(heroRef.current);
			}
		};
	}, []);

	return (
		<section
			className="sticky top-0 z-0 h-screen snap-start scroll-mt-0"
			ref={heroRef}
		>
			<main
				className={`relative flex h-full w-screen items-end justify-end bg-black transition-opacity duration-700 ease-in-out ${
					isHeroVisible ? "opacity-100" : "pointer-events-none opacity-0"
				}`}
			>
				{/* 3D background */}
				<div className="pointer-events-auto h-[calc(100vh-6rem)] w-full place-self-end">
					{children}
				</div>
				{/* Overlay content */}

				<div className="pointer-events-none absolute inset-0 z-10">
					<div className="flex h-full w-full flex-col justify-end">
						<div className="grid w-full grid-cols-12 gap-6 px-6 pb-10 sm:px-10 md:px-14 lg:px-20">
							{/* Left headline */}
							<div className="col-span-12 md:col-span-8">
								<h1
									className="pointer-events-none text-balance text-left font-semibold text-white leading-[0.9] drop-shadow-[0_0_30px_rgba(255,255,255,0.15)] md:font-bold"
									style={{
										fontSize: "clamp(2.5rem, 8vw, 7rem)",
									}}
								>
									Canada&apos;s Private
									<br />
									Mortgage Ecosystem
								</h1>
							</div>
							{/* Right subcopy and actions */}
							<div className="col-span-12 flex flex-col items-start justify-end gap-6 md:col-span-4 md:items-end">
								<p className="pointer-events-none max-w-sm text-pretty text-sm text-zinc-300 leading-relaxed md:text-right md:text-base">
									Connecting Brokers, Investors, and Borrowers
									<br className="hidden md:block" />
									Seamlessly
								</p>
								<div className="pointer-events-auto flex w-full flex-wrap items-center justify-start gap-4 md:justify-end">
									<a
										className="rounded-full border border-white/25 bg-transparent px-6 py-3 font-medium text-sm text-white backdrop-blur transition hover:border-white/40 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
										href="/sign-up"
									>
										Contact Us
									</a>
									<a
										className="inline-flex items-center gap-3 rounded-full border border-white/25 bg-transparent px-6 py-3 font-medium text-sm text-white backdrop-blur transition hover:border-white/40 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
										href="/sign-up"
									>
										Get Started
										<span className="grid h-7 w-7 place-items-center rounded-full bg-lime-400 text-black">
											+
										</span>
									</a>
								</div>
							</div>
						</div>
						{/* Bottom left tags */}
						<div className="flex w-full items-center justify-between px-6 pb-4 sm:px-10 md:px-14 lg:px-20">
							<div className="pointer-events-none select-none text-[10px] text-zinc-300/80 tracking-[0.25em] sm:text-xs">
								AI Native&nbsp; \ &nbsp;e2e Automated Servicing&nbsp; \
								&nbsp;Fractional Marketplace&nbsp;
							</div>
							{/* Spacer to avoid overlapping the small iOS home bar area */}
							<div className="h-5 w-10 opacity-0 md:hidden" />
						</div>
					</div>
				</div>
			</main>
		</section>
	);
}

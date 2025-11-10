"use client";

import { useEffect, useRef, useState } from "react";
import LightRays from "@/components/LightRays";
import { cn } from "@/lib/utils";

export const CTASection = () => {
	const [isVisible, setIsVisible] = useState(false);
	const [hasAnimated, setHasAnimated] = useState(false);
	const sectionRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && !hasAnimated) {
					setIsVisible(true);
					setHasAnimated(true);
				}
			},
			{ threshold: 0.5 }
		);

		if (sectionRef.current) {
			observer.observe(sectionRef.current);
		}

		return () => {
			if (sectionRef.current) {
				observer.unobserve(sectionRef.current);
			}
		};
	}, [hasAnimated]);

	return (
		<div
			className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black"
			ref={sectionRef}
		>
			{/* Light Rays Background */}
			<div
				className={cn(
					"absolute inset-0 transition-opacity duration-1000",
					isVisible ? "opacity-100" : "opacity-0"
				)}
				style={{
					animation: isVisible
						? "lightTurnOn 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
						: "none",
				}}
			>
				<LightRays
					className="custom-rays"
					distortion={0.0}
					followMouse={true}
					lightSpread={0.5}
					mouseInfluence={0.1}
					noiseAmount={0.0}
					rayLength={1.2}
					raysColor="#ffffff"
					raysOrigin="top-center"
					raysSpeed={0.5}
					saturation={1}
				/>
			</div>

			{/* Content */}
			<div
				className={cn(
					"relative z-10 flex flex-col items-center gap-8 px-6 text-center transition-all duration-1000",
					isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
				)}
				style={{
					transitionDelay: isVisible ? "1s" : "0s",
				}}
			>
				<div className="relative">
					<h2 className="relative z-10 px-8 py-6 font-bold text-5xl text-white leading-tight md:text-6xl lg:text-7xl">
						Ready to Transform
						<br />
						Private Lending?
					</h2>
				</div>

				<div className="relative">
					<p className="relative z-10 max-w-2xl px-6 py-4 text-lg text-zinc-200 leading-relaxed md:text-xl">
						Join the future of private mortgages. Transparent, efficient, and
						built for the modern era.
					</p>
				</div>

				<div className="mt-4 flex flex-wrap items-center justify-center gap-4">
					<a
						className="group relative overflow-hidden rounded-full px-8 py-4 font-semibold text-black text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(167,239,158,0.5)]"
						href="/sign-up"
					>
						<div className="absolute inset-0 bg-lime-400 transition-transform duration-300 group-hover:scale-110" />
						<span className="relative z-10 flex items-center gap-2">
							Get Started Today
							<span className="transition-transform duration-300 group-hover:translate-x-1">
								→
							</span>
						</span>
					</a>
					<a
						className="group relative overflow-hidden rounded-full border border-lime-400/30 px-8 py-4 font-semibold text-lg transition-all duration-300 hover:scale-105 hover:border-lime-400/50"
						href="/sign-up"
					>
						<div className="absolute inset-0 bg-lime-400/10 backdrop-blur-sm transition-opacity duration-300 group-hover:bg-lime-400/20" />
						<span className="relative z-10 text-lime-400">Learn More</span>
					</a>
				</div>
			</div>

			<style jsx>{`
				@keyframes lightTurnOn {
					0% {
						opacity: 0;
						filter: brightness(0) blur(20px);
					}
					15% {
						opacity: 0.3;
						filter: brightness(0.3) blur(15px);
					}
					30% {
						opacity: 0.5;
						filter: brightness(0.8) blur(10px);
					}
					50% {
						opacity: 0.7;
						filter: brightness(1) blur(5px);
					}
					70% {
						opacity: 0.85;
						filter: brightness(1) blur(2px);
					}
					85% {
						opacity: 0.95;
						filter: brightness(1) blur(1px);
					}
					100% {
						opacity: 1;
						filter: brightness(1) blur(0px);
					}
				}
			`}</style>
		</div>
	);
};

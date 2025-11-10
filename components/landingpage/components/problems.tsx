"use client";

import { useRef } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import { cn } from "@/lib/utils";

const ProblemCard = ({
	title,
	description,
	className,
	isVisible,
	turnOff,
}: {
	title: string;
	description: string;
	className?: string;
	isVisible: boolean;
	turnOff: boolean;
}) => (
	<div
		className={cn(
			"group relative overflow-hidden rounded-2xl border border-red-500/20 bg-black/80 p-8 backdrop-blur-sm transition-all duration-300 hover:border-red-500/40 hover:bg-black/50",
			className
		)}
		style={{
			opacity: isVisible && !turnOff ? 1 : 0,
			animation: turnOff
				? "crtTurnOff 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards"
				: isVisible
					? "crtTurnOn 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards"
					: "none",
		}}
	>
		<div
			className="absolute inset-0 rounded-2xl bg-black/40 blur-lg"
			id="blur"
		/>
		<div className="relative z-10">
			<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
				<FaExclamationTriangle className="h-6 w-6 text-red-400" />
			</div>
			<h3 className="mb-3 font-semibold text-2xl text-white">{title}</h3>
			<p className="text-zinc-400 leading-relaxed">{description}</p>
		</div>
	</div>
);

type ProblemsProps = {
	isVisible?: boolean;
	turnOff?: boolean;
};

export const Problems = ({
	isVisible = true,
	turnOff = false,
}: ProblemsProps) => {
	const sectionRef = useRef<HTMLDivElement>(null);

	return (
		<div
			className="relative z-10 flex h-full w-full items-start justify-center px-6 pt-12 sm:px-10 md:px-14 lg:px-20"
			ref={sectionRef}
		>
			<div className="w-full max-w-7xl">
				<div style={{ filter: "none", backdropFilter: "inherit" }}>
					{/* Header */}
					<div
						className="mb-16 text-center"
						style={{
							opacity: isVisible && !turnOff ? 1 : 0,
							animation: turnOff
								? "crtTurnOff 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards"
								: isVisible
									? "crtTurnOn 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards"
									: "none",
						}}
					>
						<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 backdrop-blur-sm">
							<FaExclamationTriangle className="h-4 w-4 text-red-400" />
							<span className="font-medium text-red-300 text-sm uppercase tracking-wider">
								The Problem
							</span>
						</div>
						<div className="mx-auto max-w-2xl rounded-2xl bg-black/80 p-2 backdrop-blur-md">
							<h2 className="mb-6 text-balance font-bold text-4xl text-white leading-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.9)] [text-shadow:0_0_40px_rgb(0_0_0/80%)] md:text-5xl lg:text-5xl">
								A $60B+ Broken Industry
							</h2>
							<p className="text-balance text-lg text-white leading-relaxed md:text-xl">
								operating like it's the 90s
							</p>
						</div>
					</div>

					{/* Problem Cards Grid */}
					<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
						<ProblemCard
							description="High fees, hidden costs, and opaque pricing structures that favor intermediaries over investors and borrowers."
							isVisible={isVisible}
							title="Predatory"
							turnOff={turnOff}
						/>
						<ProblemCard
							description="Disconnected systems, manual processes, and siloed information that create inefficiencies and increase risk."
							isVisible={isVisible}
							title="Fragmented"
							turnOff={turnOff}
						/>
						<ProblemCard
							description="Capital is locked up for extended periods with no secondary market, leaving investors with limited exit options."
							isVisible={isVisible}
							title="Illiquid"
							turnOff={turnOff}
						/>
					</div>

					{/* Bottom tagline */}
					<div
						className="mt-16 text-center"
						style={{
							opacity: isVisible && !turnOff ? 1 : 0,
							animation: turnOff
								? "crtTurnOff 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards"
								: isVisible
									? "crtTurnOn 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards"
									: "none",
						}}
					>
						<div className="inline-block rounded-full bg-black/70 px-6 py-3 backdrop-blur-md">
							<p className="text-sm text-zinc-200 uppercase tracking-[0.3em]">
								It&apos;s time for change
							</p>
						</div>
					</div>
				</div>
			</div>

			<style jsx>{`
				@keyframes crtTurnOn {
					0% {
						transform: scaleY(0.01) scaleX(1);
						opacity: 0;
						filter: brightness(3) contrast(2);
					}
					10% {
						transform: scaleY(0.1) scaleX(1);
						opacity: 0.5;
					}
					20% {
						transform: scaleY(0.3) scaleX(0.95);
						opacity: 0.7;
						filter: brightness(2.5) contrast(1.8);
					}
					40% {
						transform: scaleY(0.7) scaleX(0.98);
						opacity: 0.9;
						filter: brightness(2) contrast(1.5);
					}
					60% {
						transform: scaleY(0.95) scaleX(1);
						opacity: 1;
						filter: brightness(1.5) contrast(1.2);
					}
					80% {
						transform: scaleY(1) scaleX(1);
						filter: brightness(1.2) contrast(1.1);
					}
					100% {
						transform: scaleY(1) scaleX(1);
						opacity: 1;
						filter: brightness(1) contrast(1);
					}
				}

				@keyframes crtTurnOff {
					0% {
						transform: scaleY(1) scaleX(1);
						opacity: 1;
						filter: brightness(1) contrast(1);
					}
					20% {
						transform: scaleY(1) scaleX(1);
						opacity: 1;
						filter: brightness(1.5) contrast(1.3);
					}
					40% {
						transform: scaleY(0.95) scaleX(1.02);
						opacity: 0.9;
						filter: brightness(2) contrast(1.5);
					}
					60% {
						transform: scaleY(0.1) scaleX(1);
						opacity: 0.5;
						filter: brightness(3) contrast(2);
					}
					80% {
						transform: scaleY(0.01) scaleX(1);
						opacity: 0.1;
						filter: brightness(5) contrast(3);
					}
					100% {
						transform: scaleY(0.001) scaleX(1);
						opacity: 0;
						filter: brightness(10) contrast(5);
					}
				}
			`}</style>
		</div>
	);
};

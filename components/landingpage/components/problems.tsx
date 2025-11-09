"use client";

import { FaExclamationTriangle } from "react-icons/fa";
import { cn } from "@/lib/utils";

const ProblemCard = ({
	title,
	description,
	className,
}: {
	title: string;
	description: string;
	className?: string;
}) => (
	<div
		className={cn(
			"group relative overflow-hidden rounded-2xl border border-red-500/20 bg-black/40 p-8 backdrop-blur-sm transition-all duration-300 hover:border-red-500/40 hover:bg-black/50",
			className
		)}
	>
		<div className="absolute inset-0 bg-linear-to-br from-red-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
		<div className="relative z-10">
			<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
				<FaExclamationTriangle className="h-6 w-6 text-red-400" />
			</div>
			<h3 className="mb-3 font-semibold text-2xl text-white">{title}</h3>
			<p className="text-zinc-400 leading-relaxed">{description}</p>
		</div>
	</div>
);

export const Problems = () => {
	return (
		<div className="relative z-10 flex h-full w-full items-center justify-center px-6 py-20 sm:px-10 md:px-14 lg:px-20">
			<div className="w-full max-w-7xl">
				{/* Header */}
				<div className="mb-16 text-center">
					<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 backdrop-blur-sm">
						<FaExclamationTriangle className="h-4 w-4 text-red-400" />
						<span className="font-medium text-red-300 text-sm uppercase tracking-wider">
							The Problem
						</span>
					</div>
					<div className="mx-auto max-w-2xl rounded-2xl bg-black/60 p-2 backdrop-blur-md">
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
						title="Predatory"
					/>
					<ProblemCard
						description="Disconnected systems, manual processes, and siloed information that create inefficiencies and increase risk."
						title="Fragmented"
					/>
					<ProblemCard
						description="Capital is locked up for extended periods with no secondary market, leaving investors with limited exit options."
						title="Illiquid"
					/>
				</div>

				{/* Bottom tagline */}
				<div className="mt-16 text-center">
					<div className="inline-block rounded-full bg-black/70 px-6 py-3 backdrop-blur-md">
						<p className="text-sm text-zinc-200 uppercase tracking-[0.3em]">
							It&apos;s time for change
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

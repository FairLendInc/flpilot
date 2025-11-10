"use client";

import { GridPattern } from "./grid-pattern";

export const Grid = ({
	pattern,
	size,
}: {
	pattern?: [number, number][];
	size?: number;
}) => {
	const p: [number, number][] = pattern ?? [
		[Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
		[Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
		[Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
		[Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
		[Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
	];
	return (
		<div className="-ml-20 -mt-2 pointer-events-none absolute top-0 left-1/2 h-full w-full [mask-image:linear-gradient(white,transparent)]">
			<div className="absolute inset-0 bg-gradient-to-r from-zinc-900/30 to-zinc-900/30 opacity-100 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
				<GridPattern
					className="absolute inset-0 h-full w-full fill-white/10 stroke-white/10 mix-blend-overlay"
					height={size ?? 20}
					squares={p}
					width={size ?? 20}
					x={-12}
					y={4}
				/>
			</div>
		</div>
	);
};

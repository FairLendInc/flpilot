import { useId } from "react";

type GridPatternProps = {
	width: number;
	height: number;
	x: number;
	y: number;
	squares?: [number, number][];
} & React.SVGProps<SVGSVGElement>;

export function GridPattern({
	width,
	height,
	x,
	y,
	squares,
	...props
}: GridPatternProps) {
	const patternId = useId();

	return (
		<svg aria-hidden="true" {...props}>
			<defs>
				<pattern
					height={height}
					id={patternId}
					patternUnits="userSpaceOnUse"
					width={width}
					x={x}
					y={y}
				>
					<path d={`M.5 ${height}V.5H${width}`} fill="none" />
				</pattern>
			</defs>
			<rect
				fill={`url(#${patternId})`}
				height="100%"
				strokeWidth={0}
				width="100%"
			/>
			{squares && (
				<svg className="overflow-visible" x={x} y={y}>
					<title>Grid pattern squares</title>
					{squares.map(([squareX, squareY]) => (
						<rect
							height={height + 1}
							key={`${squareX}-${squareY}`}
							strokeWidth="0"
							width={width + 1}
							x={squareX * width}
							y={squareY * height}
						/>
					))}
				</svg>
			)}
		</svg>
	);
}

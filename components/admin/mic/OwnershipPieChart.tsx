"use client";

import { Label, Pie, PieChart } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

type OwnershipPieChartProps = {
	/**
	 * Percentage of ownership (0 to 100)
	 */
	percentage: number;
	/**
	 * Label for the ownership portion (e.g., "MIC Ownership")
	 */
	label?: string;
	/**
	 * Sub-label to display under the percentage (e.g., "of Total AUM")
	 */
	subLabel?: string;
	/**
	 * Custom color for the ownership portion (hex or tailwind-like variable)
	 */
	color?: string;
	/**
	 * Whether to show the legend
	 */
	showLegend?: boolean;
	/**
	 * Optional className for the container
	 */
	className?: string;
	/**
	 * Size of the donut chart (inner radius)
	 */
	innerRadius?: number;
	/**
	 * Size of the donut chart (outer radius)
	 */
	outerRadius?: number;
};

/**
 * A beautiful donut chart representing MIC ownership percentage.
 * Follows premium design principles with centered labels and smooth aesthetics.
 */
export function OwnershipPieChart({
	percentage,
	label = "MIC Ownership",
	subLabel = "Ownership",
	color = "hsl(var(--primary))",
	className,
	innerRadius = 60,
	outerRadius = 80,
}: OwnershipPieChartProps) {
	// Normalize percentage to 0-100 range
	const normalizedValue = Math.min(100, Math.max(0, percentage));

	const data = [
		{ name: label, value: normalizedValue, fill: color },
		{ name: "Others", value: 100 - normalizedValue, fill: "hsl(var(--muted))" },
	];

	const chartConfig = {
		ownership: {
			label,
			color,
		},
		others: {
			label: "Others",
			color: "hsl(var(--muted))",
		},
	} satisfies ChartConfig;

	return (
		<div
			className={cn(
				"relative flex h-full min-h-[200px] w-full flex-col items-center justify-center",
				className
			)}
		>
			<ChartContainer
				className="mx-auto aspect-square max-h-[250px] w-full"
				config={chartConfig}
			>
				<PieChart>
					<ChartTooltip
						content={<ChartTooltipContent hideLabel />}
						cursor={false}
					/>
					<Pie
						cornerRadius={10}
						data={data}
						dataKey="value"
						endAngle={-270}
						innerRadius={innerRadius}
						nameKey="name"
						outerRadius={outerRadius}
						paddingAngle={
							normalizedValue === 100 || normalizedValue === 0 ? 0 : 5
						}
						startAngle={90}
						strokeWidth={0}
					>
						<Label
							content={({ viewBox }) => {
								if (viewBox && "cx" in viewBox && "cy" in viewBox) {
									return (
										<text
											dominantBaseline="middle"
											textAnchor="middle"
											x={viewBox.cx}
											y={viewBox.cy}
										>
											<tspan
												className="fill-foreground font-bold text-3xl tracking-tight"
												x={viewBox.cx}
												y={viewBox.cy}
											>
												{normalizedValue}%
											</tspan>
											<tspan
												className="fill-muted-foreground font-medium text-[10px] uppercase tracking-wider"
												x={viewBox.cx}
												y={(viewBox.cy || 0) + 24}
											>
												{subLabel}
											</tspan>
										</text>
									);
								}
							}}
						/>
					</Pie>
				</PieChart>
			</ChartContainer>
		</div>
	);
}

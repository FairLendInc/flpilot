"use client";
import { motion } from "framer-motion";
import type React from "react";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

type RangeSliderWithHistogramProps = {
	min?: number;
	max?: number;
	step?: number;
	histogramData?: number[];
	onValueChange?: (values: [number, number]) => void;
	title?: string;
	formatValue?: (value: number) => string;
	minLabel?: string;
	maxLabel?: string;
	bufferPercentage?: number;
	inRangeClass?: string;
	outOfRangeClass?: string;
	className?: string;
	defaultValue?: [number, number];
	renderTooltip?: (count: number, value: number) => React.ReactNode;
	variant?: "compact" | "full";
	targetBarCount?: number;
	showCard?: boolean;
	showTitle?: boolean;
};

const RangeSliderWithHistogram: React.FC<RangeSliderWithHistogramProps> = ({
	min = 50000,
	max = 5000000,
	step = 100000,
	histogramData,
	onValueChange,
	title = "Budget",
	formatValue = (value) => `₹${value.toLocaleString("en-IN")}`,
	minLabel = "Minimum",
	maxLabel = "Maximum",
	bufferPercentage = 0,
	inRangeClass = "bg-[#0A6EFF]",
	outOfRangeClass = "bg-gray-300",
	className,
	defaultValue = [min, max],
	renderTooltip,
	variant = "full",
	targetBarCount = 20,
	showCard = true,
	showTitle = true,
}) => {
	const [minValue, setMinValue] = useState(defaultValue[0]);
	const [maxValue, setMaxValue] = useState(defaultValue[1]);

	// Use fixed bar count instead of step-based calculation
	const numBars = targetBarCount;
	const bucketSize = (max - min) / numBars;

	// Use histogram data directly (already bucketed) or generate demo data
	const histogramDataToUse = useMemo(() => {
		if (histogramData && histogramData.length === numBars) {
			// If histogram data is already bucketed to the correct size, use it directly
			return histogramData;
		}
		// Generate random data for demo
		return Array.from({ length: numBars }, () =>
			Math.floor(Math.random() * 6000)
		);
	}, [histogramData, numBars]);

	const maxCount = useMemo(() => {
		const maxVal = Math.max(...histogramDataToUse);
		return maxVal === 0 ? 1 : maxVal;
	}, [histogramDataToUse]);

	const bufferRange = (maxValue - minValue) * bufferPercentage;
	const viewMin = Math.max(min, minValue - bufferRange);
	const viewMax = Math.min(max, maxValue + bufferRange);

	// Compact variant styling
	const isCompact = variant === "compact";
	const containerClass = isCompact
		? `space-y-2 ${className}`
		: `p-8 rounded-lg shadow-lg w-full max-w-lg ${className}`;
	const titleClass = isCompact
		? "text-sm font-semibold mb-1"
		: "text-2xl font-bold mb-4";
	const valueClass = isCompact
		? "text-primary text-sm font-medium"
		: "text-primary text-xl";
	const histogramHeight = isCompact ? "h-28" : "h-32";

	const content = (
		<>
			{showTitle && <h2 className={titleClass}>{title}</h2>}

			<div className="mb-2 flex justify-between">
				<span className={valueClass}>{formatValue(minValue)}</span>
				<span className={valueClass}>{formatValue(maxValue)}</span>
			</div>

			<div className={`relative ${histogramHeight} overflow-hidden`}>
				<div className="flex h-full items-end">
					{histogramDataToUse.map((count, index) => {
						// Calculate bucket range for this bar
						const bucketStart = min + index * bucketSize;
						const bucketEnd = min + (index + 1) * bucketSize;
						const currentValue = (bucketStart + bucketEnd) / 2; // Use midpoint for display
						const isInRange =
							currentValue >= minValue && currentValue <= maxValue;
						const isInView = currentValue >= viewMin && currentValue <= viewMax;
						const barColor =
							isInRange || isInView ? inRangeClass : outOfRangeClass;

						return (
							<TooltipProvider key={index}>
								<Tooltip>
									<TooltipTrigger asChild>
										<motion.div
											animate={{ height: `${(count / maxCount) * 100}%` }}
											className={`mx-[1px] flex-1 rounded-sm ${barColor}`}
											initial={{ height: 0 }}
											transition={{ duration: 0.3 }}
										/>
									</TooltipTrigger>
									<TooltipContent className="z-200">
										{renderTooltip ? (
											renderTooltip(count, currentValue)
										) : (
											<p>
												Count: {count} <br />
												{formatValue(currentValue)}
											</p>
										)}
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						);
					})}
				</div>
			</div>

			<div className="relative mt-2">
				<Slider
					defaultValue={[minValue, maxValue]}
					max={max}
					min={min}
					onValueChange={(values) => {
						const [newMin, newMax] = values;
						setMinValue(newMin);
						setMaxValue(newMax);
						onValueChange?.([newMin, newMax]);
					}}
					step={step}
				/>
				<div className="mt-2 flex justify-between">
					<span className="text-gray-400">{minLabel}</span>
					<span className="text-gray-400">{maxLabel}</span>
				</div>
			</div>
		</>
	);

	return showCard ? (
		<Card className={containerClass}>{content}</Card>
	) : (
		<div className={containerClass}>{content}</div>
	);
};

export default RangeSliderWithHistogram;

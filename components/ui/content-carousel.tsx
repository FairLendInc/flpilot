"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export type CarouselItem = {
	name: string;
	description: string;
	[key: string]: unknown;
};

type ContentCarouselProps = {
	items: CarouselItem[];
	className?: string;
	onItemChange?: (item: CarouselItem, index: number) => void;
};

export const ContentCarousel = ({
	items,
	className = "",
	onItemChange,
}: ContentCarouselProps) => {
	const [currentIndex, setCurrentIndex] = useState(0);

	useEffect(() => {
		if (items.length === 0) return;
		const clampedIndex = Math.min(Math.max(currentIndex, 0), items.length - 1);
		if (clampedIndex !== currentIndex) setCurrentIndex(clampedIndex);
	}, [items.length, currentIndex]);

	const handleIndexChange = (newIndex: number) => {
		const validIndex = Math.min(Math.max(newIndex, 0), items.length - 1);
		setCurrentIndex(validIndex);
		onItemChange?.(items[validIndex], validIndex);
	};

	const handleSelectChange = (value: string) => {
		const index = items.findIndex((item) => item.name === value);
		if (index !== -1) handleIndexChange(index);
	};

	if (items.length === 0) return null;

	return (
		<div className={`relative overflow-hidden ${className}`}>
			<div className="relative z-10 flex h-full flex-col items-center justify-center px-4">
				<div className="mb-8 text-center">
					<motion.h1
						animate={{ opacity: 1, y: 0 }}
						className="font-bold text-4xl text-primary drop-shadow-md sm:text-5xl md:text-6xl"
						initial={{ opacity: 0, y: -20 }}
						transition={{ duration: 0.5 }}
					>
						{items[currentIndex].name}
					</motion.h1>

					<motion.p
						animate={{ opacity: 1, y: 0 }}
						className="mt-4 text-lg text-muted-foreground sm:text-xl md:text-2xl"
						initial={{ opacity: 0, y: 20 }}
						transition={{ duration: 0.5 }}
					>
						{items[currentIndex].description}
					</motion.p>
				</div>

				<div className="flex items-center gap-2 rounded-full border border-primary/10 bg-background/80 p-2 backdrop-blur-md">
					<div className="flex items-center gap-2">
						<Button
							className="rounded-full"
							disabled={currentIndex === 0}
							onClick={() => handleIndexChange(currentIndex - 1)}
							size="icon"
							variant="outline"
						>
							<ChevronLeft className="h-4 w-4" />
						</Button>

						<Select
							onValueChange={handleSelectChange}
							value={items[currentIndex].name}
						>
							<SelectTrigger className="w-[180px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{items.map((item) => (
									<SelectItem key={item.name} value={item.name}>
										{item.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button className="rounded-full" size="icon" variant="ghost">
									<Info className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="top">
								<p>{items[currentIndex].description}</p>
							</TooltipContent>
						</Tooltip>

						<Button
							className="rounded-full"
							disabled={currentIndex === items.length - 1}
							onClick={() => handleIndexChange(currentIndex + 1)}
							size="icon"
							variant="outline"
						>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

"use client";

import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type ImageCarouselProps = {
	images: Array<{
		url: string;
		alt?: string;
		order: number;
	}>;
	propertyTitle: string;
};

export function ImageCarousel({ images, propertyTitle }: ImageCarouselProps) {
	const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
	const [selectedIndex, setSelectedIndex] = useState(0);
	// const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

	const scrollPrev = useCallback(() => {
		if (emblaApi) emblaApi.scrollPrev();
	}, [emblaApi]);

	const scrollNext = useCallback(() => {
		if (emblaApi) emblaApi.scrollNext();
	}, [emblaApi]);

	const scrollTo = useCallback(
		(index: number) => {
			if (emblaApi) emblaApi.scrollTo(index);
		},
		[emblaApi]
	);

	const onSelect = useCallback(() => {
		if (!emblaApi) return;
		setSelectedIndex(emblaApi.selectedScrollSnap());
	}, [emblaApi]);

	useEffect(() => {
		if (!emblaApi) return;

		onSelect();
		// setScrollSnaps(emblaApi.scrollSnapList());
		emblaApi.on("select", onSelect);
		emblaApi.on("reInit", onSelect);

		return () => {
			emblaApi.off("select", onSelect);
			emblaApi.off("reInit", onSelect);
		};
	}, [emblaApi, onSelect]);

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "ArrowLeft") {
				event.preventDefault();
				scrollPrev();
			} else if (event.key === "ArrowRight") {
				event.preventDefault();
				scrollNext();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [scrollPrev, scrollNext]);

	// Sort images by order
	const sortedImages = [...images].sort((a, b) => a.order - b.order);

	// Handle single image case
	if (sortedImages.length === 0) {
		return (
			<div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
				<div className="flex h-full items-center justify-center">
					<Icon className="h-16 w-16 text-gray-400" icon="lucide:image-off" />
					<p className="ml-3 text-gray-500">No images available</p>
				</div>
			</div>
		);
	}

	const showNavigation = sortedImages.length > 1;

	return (
		<div
			aria-label="Property image carousel"
			className="relative w-full"
			role="region"
		>
			{/* Main carousel */}
			<div className="overflow-hidden rounded-lg" ref={emblaRef}>
				<div className="flex touch-pan-y">
					{sortedImages.map((image, index) => (
						<div
							className="relative min-w-0 flex-[0_0_100%]"
							key={`${image.url}-${index}`}
						>
							<div className="relative aspect-4/3 w-full">
								<Image
									alt={image.alt || `${propertyTitle} - Image ${index + 1}`}
									className="object-cover"
									fill
									priority={index === 0}
									quality={index === 0 ? 90 : 75}
									sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
									src={image.url}
								/>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Navigation arrows */}
			{showNavigation && (
				<>
					<Button
						aria-label="Previous image"
						className="-translate-y-1/2 absolute top-1/2 left-4 z-10 bg-white/90 shadow-lg hover:bg-white dark:bg-gray-900/90 dark:hover:bg-gray-900"
						isIconOnly
						onClick={scrollPrev}
					>
						<Icon className="h-6 w-6" icon="lucide:chevron-left" />
					</Button>
					<Button
						aria-label="Next image"
						className="-translate-y-1/2 absolute top-1/2 right-4 z-10 bg-white/90 shadow-lg hover:bg-white dark:bg-gray-900/90 dark:hover:bg-gray-900"
						isIconOnly
						onClick={scrollNext}
					>
						<Icon className="h-6 w-6" icon="lucide:chevron-right" />
					</Button>
				</>
			)}

			{/* Image counter */}
			{showNavigation && (
				<div className="absolute top-4 right-4 z-10 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
					{selectedIndex + 1} / {sortedImages.length}
				</div>
			)}

			{/* Thumbnail navigation */}
			{showNavigation && (
				<div className="mt-4 flex gap-2 overflow-x-auto pb-2">
					{sortedImages.map((image, index) => (
						<button
							aria-current={index === selectedIndex}
							aria-label={`View image ${index + 1}`}
							className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-md transition-all ${
								index === selectedIndex
									? "ring-2 ring-primary ring-offset-2"
									: "opacity-60 hover:opacity-100"
							}`}
							key={`thumb-${image.url}-${index}`}
							onClick={() => scrollTo(index)}
							type="button"
						>
							<Image
								alt={image.alt || `Thumbnail ${index + 1}`}
								className="object-cover"
								fill
								sizes="80px"
								src={image.url}
							/>
						</button>
					))}
				</div>
			)}

			{/* Screen reader announcements */}
			<div
				aria-atomic="true"
				aria-live="polite"
				className="sr-only"
				role="status"
			>
				Viewing image {selectedIndex + 1} of {sortedImages.length}
			</div>
		</div>
	);
}

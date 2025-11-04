"use client";

import { Heart, Star } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ListingProps = {
	id: string;
	title: string;
	location: string;
	host: string;
	images: string[];
	rating: number;
	reviewCount: number;
	price: number;
	perNight: boolean;
	dates: string;
	isSuperhost?: boolean;
	isNew?: boolean;
	category?: string;
};

export function AirbnbListingCard({
	title,
	location,
	host,
	images,
	rating,
	reviewCount,
	price,
	perNight = true,
	dates,
	isSuperhost = false,
	isNew = false,
	category,
}: ListingProps) {
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [isFavorite, setIsFavorite] = useState(false);
	const [touchStartX, setTouchStartX] = useState(0);
	const [touchEndX, setTouchEndX] = useState(0);

	// Handle next image navigation
	const nextImage = () => {
		setCurrentImageIndex((prev) => (prev + 1) % images.length);
	};

	// Handle previous image navigation
	const prevImage = () => {
		setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
	};

	// Touch event handlers for mobile swipe
	const handleTouchStart = (e: React.TouchEvent) => {
		setTouchStartX(e.touches[0].clientX);
		setTouchEndX(e.touches[0].clientX);
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		setTouchEndX(e.touches[0].clientX);
	};

	const handleTouchEnd = () => {
		if (!(touchStartX && touchEndX)) return;

		const distance = touchStartX - touchEndX;
		const swipeThreshold = 50; // Minimum swipe distance in pixels

		if (Math.abs(distance) < swipeThreshold) return;

		if (distance > 0) {
			nextImage(); // Swipe left
		} else {
			prevImage(); // Swipe right
		}
	};

	return (
		<div className="group w-[200px] sm:w-[300px] md:w-[400px] lg:w-[400px] xl:w-[400px]">
			<div
				className="relative mb-2 aspect-square overflow-hidden rounded-xl"
				onTouchEnd={handleTouchEnd}
				onTouchMove={handleTouchMove}
				onTouchStart={handleTouchStart}
			>
				{/* Image carousel container with sliding animation */}
				<div
					className="absolute inset-0 flex transition-transform duration-500 ease-in-out"
					style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
				>
					{images.map((image, index) => (
						<div
							className="relative h-full min-w-full flex-shrink-0"
							key={index}
						>
							<Image
								alt={`${title} - Image ${index + 1}`}
								className="object-cover"
								fill
								src={image || "/placeholder.svg"}
							/>
						</div>
					))}
				</div>

				{images.length > 1 && (
					<>
						{/* Navigation buttons */}
						<button
							aria-label="Previous image"
							className="-translate-y-1/2 absolute top-1/2 left-2 rounded-full bg-white p-1 opacity-0 shadow-md transition-opacity group-hover:opacity-100"
							onClick={prevImage}
						>
							<svg
								className="text-black"
								fill="none"
								height="16"
								viewBox="0 0 16 16"
								width="16"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M10 12L6 8L10 4"
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
								/>
							</svg>
						</button>
						<button
							aria-label="Next image"
							className="-translate-y-1/2 absolute top-1/2 right-2 rounded-full bg-white p-1 opacity-0 shadow-md transition-opacity group-hover:opacity-100"
							onClick={nextImage}
						>
							<svg
								className="text-black"
								fill="none"
								height="16"
								viewBox="0 0 16 16"
								width="16"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M6 12L10 8L6 4"
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
								/>
							</svg>
						</button>

						{/* Image position indicators */}
						<div className="-translate-x-1/2 absolute bottom-2 left-1/2 flex gap-1">
							{images.map((_, index) => (
								<div
									className={cn(
										"h-1.5 rounded-full transition-all",
										currentImageIndex === index
											? "w-6 bg-white"
											: "w-1.5 bg-white/60"
									)}
									key={index}
								/>
							))}
						</div>
					</>
				)}

				{/* Favorite button */}
				<button
					aria-label={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
					className="absolute top-3 right-3 text-white transition-transform hover:scale-110"
					onClick={() => setIsFavorite(!isFavorite)}
				>
					<Heart
						className="h-7 w-7 drop-shadow-md"
						fill={isFavorite ? "#FF385C" : "transparent"}
						stroke={isFavorite ? "#FF385C" : "white"}
						strokeWidth={2}
					/>
				</button>

				{/* Badges for superhost/new listing */}
				{(isSuperhost || isNew) && (
					<div className="absolute top-3 left-3">
						{isSuperhost && (
							<Badge className="mb-2 bg-white font-medium text-black text-xs">
								Superhost
							</Badge>
						)}
						{isNew && (
							<Badge className="bg-white font-medium text-black text-xs">
								New
							</Badge>
						)}
					</div>
				)}
			</div>

			{/* Listing details */}
			<div className="space-y-1">
				<div className="flex justify-between">
					<h3 className="font-medium text-gray-900 dark:text-white">
						{location}
					</h3>
					<div className="flex items-center">
						<Star className="h-4 w-4 fill-current" />
						<span className="ml-1">{rating}</span>
						{reviewCount > 0 && (
							<span className="ml-1 text-gray-500 dark:text-gray-400">
								({reviewCount})
							</span>
						)}
					</div>
				</div>

				<p className="text-gray-500 text-sm dark:text-gray-400">
					{category ? `${category} • ` : ""}Hosted by {host}
				</p>
				<p className="text-gray-500 text-sm dark:text-gray-400">{dates}</p>

				<p className="pt-1">
					<span className="font-semibold">${price}</span>
					{perNight && (
						<span className="text-gray-900 dark:text-white"> night</span>
					)}
				</p>
			</div>
		</div>
	);
}

"use client";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type IBlurImage = {
	height?: number | string;
	width?: number | string;
	src?: string;
	objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
	className?: string;
	alt?: string;
	layout?: "fill" | "fixed" | "intrinsic" | "responsive";
	[x: string]: unknown;
};

export const BlurImage = ({
	height,
	width,
	src,
	className,
	objectFit,
	alt,
	layout,
	...rest
}: IBlurImage) => {
	const [isLoading, setLoading] = useState(true);
	
	// Convert height/width to numbers if they're strings
	const heightNum = typeof height === "string" ? Number.parseInt(height, 10) : height;
	const widthNum = typeof width === "string" ? Number.parseInt(width, 10) : width;
	
	// Ensure src is defined
	if (!src) {
		return null;
	}
	
	return (
		<Image
			alt={alt ? alt : "Avatar"}
			blurDataURL={src}
			className={cn(
				"transition duration-300",
				isLoading ? "blur-sm" : "blur-0",
				className
			)}
			decoding="async"
			height={heightNum}
			layout={layout}
			loading="lazy"
			onLoadingComplete={() => setLoading(false)}
			src={src}
			width={widthNum}
			{...rest}
		/>
	);
};

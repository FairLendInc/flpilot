"use client";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface IBlurImage {
	height?: any;
	width?: any;
	src?: string | any;
	objectFit?: any;
	className?: string | any;
	alt?: string | undefined;
	layout?: any;
	[x: string]: any;
}

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
			height={height}
			layout={layout}
			loading="lazy"
			onLoadingComplete={() => setLoading(false)}
			src={src}
			width={width}
			{...rest}
		/>
	);
};

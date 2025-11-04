"use client";

import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";

type ListingMapPopupProps = {
	id: string;
	title: string;
	address: string;
	principal: number;
	apr: number;
	imageSrc?: string;
};

/**
 * Compact popup component for map markers
 * Displays essential listing information with a link to the detail page
 */
export function ListingMapPopup({
	id,
	title,
	address,
	principal,
	apr,
	imageSrc,
}: ListingMapPopupProps) {
	return (
		<div className="w-[280px] overflow-hidden rounded-lg bg-background shadow-lg">
			{/* Image thumbnail */}
			{imageSrc && (
				<div className="relative h-32 w-full">
					<Image
						alt={title}
						className="h-full w-full object-cover"
						fill
						src={imageSrc}
					/>
				</div>
			)}

			{/* Content */}
			<div className="space-y-2 p-3">
				<div>
					<h3 className="line-clamp-1 font-semibold text-sm">{title}</h3>
					<p className="flex items-center gap-1 text-muted-foreground text-xs">
						<Icon className="h-3 w-3" icon="lucide:map-pin" />
						{address}
					</p>
				</div>

				{/* Quick stats */}
				<div className="flex items-center gap-4 text-xs">
					<div className="flex items-center gap-1">
						<Icon className="h-4 w-4" icon="lucide:circle-dollar-sign" />
						<span className="font-semibold">
							${(principal / 1000).toFixed(0)}K
						</span>
					</div>
					<div className="flex items-center gap-1">
						<Icon className="h-4 w-4" icon="lucide:percent-circle" />
						<span className="font-semibold">{apr}% APR</span>
					</div>
				</div>

				{/* View details button */}
				<Link className="block" href={`/listings/${id}`}>
					<Button className="w-full" size="sm" variant="primary">
						View Details
					</Button>
				</Link>
			</div>
		</div>
	);
}

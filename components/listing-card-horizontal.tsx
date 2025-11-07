"use client";

import { Button, Card } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { Badge } from "@/components/ui/badge";

export type HorizontalProps = {
	id?: string;
	title?: string;
	address?: string;
	imageSrc?: string;
	ltv?: number;
	apr?: number;
	principal?: number;
	marketValue?: number;
	propertyType?: string;
	maturityDate?: string;
	locked?: boolean; // Add locked status prop
};

export function Horizontal({
	id,
	title = "Malibu Beach Detached",
	address = "Malibu, CA",
	imageSrc = "/house.jpg",
	ltv = 80,
	apr = 9.5,
	principal = 350000,
	marketValue = 500000,
	propertyType,
	maturityDate = "01/01/2026",
	locked = false,
}: HorizontalProps = {}) {
	const CardContent = (
		<Card.Root
			className="w-full items-stretch transition-all duration-300 hover:scale-103 hover:shadow-black/10 hover:shadow-lg md:flex-row"
			variant="transparent"
		>
			<div className="relative aspect-video w-full overflow-hidden rounded-panel md:aspect-square md:max-w-[180px] xl:aspect-auto">
				<Image
					alt={`${title} thumbnail`}
					className="pointer-events-none select-none rounded-xl object-cover transition-all duration-300 hover:scale-105"
					fill
					sizes="(max-width: 640px) 100vw, 180px"
					src={imageSrc}
				/>
				{/* Locked badge overlay */}
				{locked && (
					<div className="absolute top-2 left-2">
						<Badge className="gap-1" variant="destructive">
							<Lock className="h-3 w-3" />
							Locked
						</Badge>
					</div>
				)}
			</div>
			<div className="flex flex-1 flex-col gap-3">
				<Card.Header className="gap-1">
					<Card.Title>{title}</Card.Title>
					<Card.Description className="flex w-full items-center gap-2 text-nowrap align-middle text-foreground/70">
						<Icon className="h-4 w-4" icon="lucide:map-pin" />
						{address}
						{propertyType && ` • ${propertyType}`}
					</Card.Description>
				</Card.Header>
				<Card.Content className="text-muted-foreground text-sm">
					<div className="flex 84rem:grid 84rem:grid-cols-2 items-center justify-around lg:gap-2 xl:flex">
						<span className="flex items-center">
							<Icon className="h-5 w-5" icon="lucide:percent-circle" />
							<span className="ml-2 flex flex-col justify-around py-1 align-middle">
								<p className="text-xs">LTV</p>
								<p className="font-bold text-sm">{ltv}</p>
							</span>
						</span>
						<div className="84rem:hidden h-8 w-px shrink-0 bg-foreground/30 xl:block" />
						<span className="flex items-center">
							<Icon className="h-5 w-5" icon="lucide:percent-circle" />
							<span className="ml-2 flex flex-col justify-around py-1 align-middle">
								<p className="text-xs">APR</p>
								<p className="font-bold text-sm">{apr}</p>
							</span>
						</span>
						<div className="84rem:hidden h-8 w-px shrink-0 bg-foreground/30 xl:block" />
						<span className="flex items-center">
							<Icon className="h-5 w-5" icon="lucide:circle-dollar-sign" />
							<span className="ml-2 flex flex-col justify-around py-1 align-middle">
								<p className="text-xs">Principal</p>
								<p className="font-bold text-sm">
									{(principal / 1000).toFixed(0)}K
								</p>
							</span>
						</span>
						<div className="84rem:hidden hidden h-8 w-px shrink-0 bg-foreground/30 lg:block xl:block" />
						<span className="hidden lg:flex lg:items-center">
							<Icon className="h-5 w-5" icon="lucide:circle-dollar-sign" />
							<span className="ml-2 flex flex-col justify-around py-1 align-middle">
								<p className="text-xs">Market Value</p>
								<p className="font-bold text-sm">
									{(marketValue / 1000).toFixed(0)}K
								</p>
							</span>
						</span>
					</div>
				</Card.Content>
				<Card.Footer className="mt-auto flex w-full flex-row items-center justify-between">
					<div className="flex flex-col">
						<span className="flex items-center text-foreground/50 text-sm">
							<Icon className="mr-1 h-4 w-4" icon="lucide:calendar" />
							Maturity
						</span>
						<span className="font-medium text-foreground/60 text-sm">
							{maturityDate}
						</span>
					</div>
					<Button className="ml-6 w-full" variant="primary">
						View details
					</Button>
				</Card.Footer>
			</div>
		</Card.Root>
	);

	// Wrap in Link if id is provided, otherwise return card directly
	if (id) {
		return (
			<Link className="block" href={`/listings/${id}`}>
				<ViewTransition name={`listing-card-${id}`}>
					{CardContent}
				</ViewTransition>
			</Link>
		);
	}

	return (
		<ViewTransition name={`listing-card-${id}`}>{CardContent}</ViewTransition>
	);
}

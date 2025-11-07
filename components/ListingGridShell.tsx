"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Map as MapIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	ListingMap,
	type ListingMapProps,
	type ViewportBounds,
} from "@/components/ListingMap";
import {
	MobileListingScroller,
	type MobileListingSection,
} from "@/components/mobile-listing-scroller";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
// import React from "react";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { WithLatLng } from "@/hooks/use-filtered-listings";
import { useViewportFilteredItems } from "@/hooks/use-filtered-listings";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFiltersStore } from "./contexts/listingContext";
import type { FilterState } from "./types/listing-filters";

type ClassNames = {
	container?: string;
	gridColumn?: string;
	mapColumn?: string;
	mapWrapper?: string;
};

export interface FilterableItem extends WithLatLng {
	ltv?: number;
	apr?: number;
	principal?: number;
	marketValue?: number;
	mortgageType?: string;
	propertyType?: string;
	maturityDate?: Date;
	title?: string;
	address?: string;
}

export type ListingGridShellProps<T extends WithLatLng> = {
	items: readonly T[];
	renderCard: (item: T) => React.ReactNode;
	renderMapPopup: ListingMapProps<T>["renderPopup"];
	classNames?: ClassNames;
	mapProps?: Partial<
		Omit<ListingMapProps<T>, "items" | "renderPopup" | "onViewportChange">
	>;
	/** Optional function to group items into sections for mobile horizontal scrolling */
	groupItemsForMobile?: (items: readonly T[]) => MobileListingSection<T>[];
	/** Show filter bar (default: true) */
	showFilters?: boolean;
	/** Custom filter bounds (optional) */
};

function applyFilters<T extends FilterableItem>(
	items: readonly T[],
	filters: FilterState
): readonly T[] {
	const filteredItems = items.filter((item) => {
		// LTV filter
		if (
			item.ltv !== undefined &&
			(item.ltv < filters.ltvRange[0] || item.ltv > filters.ltvRange[1])
		) {
			return false;
		}

		// Interest rate filter
		if (
			item.apr !== undefined &&
			(item.apr < filters.interestRateRange[0] ||
				item.apr > filters.interestRateRange[1])
		) {
			return false;
		}

		// Loan amount filter
		if (
			item.principal !== undefined &&
			(item.principal < filters.loanAmountRange[0] ||
				item.principal > filters.loanAmountRange[1])
		) {
			return false;
		}

		// Mortgage type filter
		if (
			filters.mortgageTypes.length > 0 &&
			item.mortgageType &&
			!filters.mortgageTypes.includes(item.mortgageType as any)
		) {
			return false;
		}

		// Property type filter
		if (
			filters.propertyTypes.length > 0 &&
			item.propertyType &&
			!filters.propertyTypes.includes(item.propertyType as any)
		) {
			return false;
		}

		// Search query filter
		if (filters.searchQuery) {
			const query = filters.searchQuery.toLowerCase();
			const matchesTitle = item.title?.toLowerCase().includes(query);
			const matchesAddress = item.address?.toLowerCase().includes(query);
			if (!(matchesTitle || matchesAddress)) {
				return false;
			}
		}

		// Maturity date filter
		if (filters.maturityDate && item.maturityDate) {
			const filterDate = new Date(filters.maturityDate);
			const itemDate = new Date(item.maturityDate);
			if (itemDate > filterDate) {
				return false;
			}
		}

		return true;
	});

	return filteredItems;
}

// Animation variants from smooth-drawer
const drawerVariants = {
	hidden: {
		y: "100%",
		opacity: 0,
		rotateX: 5,
		transition: {
			type: "spring",
			stiffness: 300,
			damping: 30,
		},
	},
	visible: {
		y: 0,
		opacity: 1,
		rotateX: 0,
		transition: {
			type: "spring",
			stiffness: 300,
			damping: 30,
			mass: 0.8,
			staggerChildren: 0.07,
			delayChildren: 0.2,
		},
	},
};

const itemVariants = {
	hidden: {
		y: 20,
		opacity: 0,
		transition: {
			type: "spring",
			stiffness: 300,
			damping: 30,
		},
	},
	visible: {
		y: 0,
		opacity: 1,
		transition: {
			type: "spring",
			stiffness: 300,
			damping: 30,
			mass: 0.8,
		},
	},
};

export function ListingGridShell<T extends WithLatLng>({
	items,
	renderCard,
	renderMapPopup,
	classNames,
	mapProps,
	groupItemsForMobile,
	showFilters = true,
}: ListingGridShellProps<T>) {
	const isMobile = useIsMobile();
	const [viewportBounds, setViewportBounds] = useState<
		ViewportBounds | undefined
	>(undefined);
	const { filters, setItems } = useFiltersStore();
	const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);

	// Apply user filters first
	const userFilteredItems = useMemo(() => {
		if (!showFilters) return items;
		return applyFilters(
			items as readonly FilterableItem[],
			filters
		) as readonly T[];
	}, [items, filters, showFilters]);

	// Then apply viewport filtering
	const filteredItems = useViewportFilteredItems(
		userFilteredItems,
		viewportBounds
	);

	const onViewportChange = (bounds: ViewportBounds) => {
		setViewportBounds(bounds);
	};

	// Group items for mobile horizontal scrolling
	const mobileSections = useMemo(() => {
		// Ensure we always have a valid array
		if (!filteredItems || filteredItems.length === 0) {
			return [];
		}

		if (groupItemsForMobile) {
			const grouped = groupItemsForMobile(filteredItems);
			// Ensure grouping function returns valid array
			return grouped && Array.isArray(grouped)
				? grouped
				: [{ title: "All Listings", items: filteredItems }];
		}

		// Default: single section with all items
		return [{ title: "All Listings", items: filteredItems }];
	}, [filteredItems, groupItemsForMobile]);

	useEffect(() => {
		setItems(filteredItems);
	}, [filteredItems, setItems]);

	if (isMobile) {
		return (
			<div className={classNames?.container}>
				{/* {showFilters && (
          <FilterBar />
        )} */}
				<div className="px-4">
					{/* Main listing scroller */}
					<div className={classNames?.gridColumn}>
						<MobileListingScroller
							renderCard={renderCard}
							sections={mobileSections}
						/>
					</div>

					{/* Floating map button */}
					<div className="fixed right-6 bottom-6 z-40">
						<Drawer onOpenChange={setIsMapDrawerOpen} open={isMapDrawerOpen}>
							<DrawerTrigger asChild>
								<Button
									className="h-14 w-14 rounded-full p-0 shadow-lg"
									size="lg"
								>
									<MapIcon className="h-6 w-6" />
								</Button>
							</DrawerTrigger>
							<DrawerContent className="h-[85vh] rounded-t-2xl">
								<motion.div
									animate="visible"
									className="flex h-full flex-col"
									initial="hidden"
									variants={drawerVariants as any}
								>
									<motion.div variants={itemVariants as any}>
										<DrawerHeader>
											<DrawerTitle>Map View</DrawerTitle>
										</DrawerHeader>
									</motion.div>
									<motion.div
										className="min-h-0 flex-1 px-4 pb-4"
										variants={itemVariants as any}
									>
										<div className="h-full">
											<ListingMap
												className="h-full w-full rounded-lg"
												items={filteredItems}
												onViewportChange={onViewportChange}
												renderPopup={renderMapPopup}
												{...mapProps}
											/>
										</div>
									</motion.div>
								</motion.div>
							</DrawerContent>
						</Drawer>
					</div>
				</div>
			</div>
		);
	}

	return (
		<section
			className={
				classNames?.container ?? "grid w-screen grid-cols-12 gap-x-4 pt-4 pr-4"
			}
		>
			<div className={classNames?.gridColumn ?? "col-span-8"}>
				<ScrollArea className="relative h-[calc(100vh-7rem)]">
					<ProgressiveBlur height="15%" position="bottom" />
					<div className="grid 84rem:grid-cols-2 grid-cols-1 pr-4">
						<AnimatePresence mode="popLayout">
							{filteredItems.map((item) => (
								<motion.div
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, scale: 0.95 }}
									initial={{ opacity: 0, y: 20 }}
									key={
										(item as { id?: string | number }).id ??
										JSON.stringify(item)
									}
									layout
									transition={{ duration: 0.2 }}
								>
									{renderCard(item)}
								</motion.div>
							))}
						</AnimatePresence>
					</div>
				</ScrollArea>
			</div>
			<div className={classNames?.mapColumn ?? "col-span-4"}>
				<div
					className={
						classNames?.mapWrapper ?? "sticky top-30 h-[calc(100vh-8rem)]"
					}
				>
					<ListingMap
						className="mt-4 h-[calc(100vh-9rem)]"
						items={filteredItems}
						onViewportChange={onViewportChange}
						renderPopup={renderMapPopup}
						{...mapProps}
					/>
				</div>
			</div>
		</section>
	);
}

ListingGridShell.displayName = "ListingGridShell";

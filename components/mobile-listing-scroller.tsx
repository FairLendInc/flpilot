"use client";

import type * as React from "react";

export type MobileListingSection<T> = {
	title: string;
	items: readonly T[];
};

type MobileListingScrollerProps<T> = {
	sections: MobileListingSection<T>[];
	renderCard: (item: T) => React.ReactNode;
};

export function MobileListingScroller<T>({
	sections,
	renderCard,
}: MobileListingScrollerProps<T>) {
	// Guard against undefined or empty sections
	if (!sections || sections.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-col gap-8 pb-4">
			{sections.map((section) => {
				// Skip if no items in this section
				if (!section.items || section.items.length === 0) return null;

				return (
					<section className="mt-8 flex flex-col gap-3" key={section.title}>
						{/* Section Title */}
						<h2 className="pl-6 font-semibold text-lg">{section.title}</h2>

						{/* Horizontally Scrollable Container */}
						<div
							className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto pr-4 pb-2 pl-6"
							style={{
								scrollbarWidth: "none",
								msOverflowStyle: "none",
							}}
						>
							{section.items.map((item) => (
								<div
									className="w-[280px] flex-shrink-0 snap-start"
									key={JSON.stringify(item)}
								>
									{renderCard(item as T)}
								</div>
							))}
						</div>
					</section>
				);
			})}
		</div>
	);
}

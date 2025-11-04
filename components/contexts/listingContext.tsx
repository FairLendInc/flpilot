// "use client";

import { create } from "zustand";
import type { FilterableItem } from "../ListingGridShell";
import type { FilterState } from "../types/listing-filters";
import { DEFAULT_FILTERS } from "../types/listing-filters";

// const useFiltersStore = create((set) => ({
//   filters: DEFAULT_FILTERS,
//   setFilters: (filters: FilterState) => set({ filters: filters }),
//   items: [] as ReadonlyArray<FilterableItem>,
//   setItems: (items: ReadonlyArray<FilterableItem>) => set({ items: items }),
// }))

type State = {
	filters: FilterState;
	items: readonly FilterableItem[];
};

type Actions = {
	setFilters: (filters: FilterState) => void;
	setItems: (items: readonly FilterableItem[]) => void;
};

export const useFiltersStore = create<State & Actions>((set) => ({
	filters: DEFAULT_FILTERS,
	items: [] as readonly FilterableItem[],
	setFilters: (filters: FilterState) => set({ filters }),
	setItems: (items: readonly FilterableItem[]) => set({ items }),
}));

// const useFiltersStore = create(combine(
//     {
//         filters: DEFAULT_FILTERS,
//         items: [] as ReadonlyArray<FilterableItem>,
//     },
//     (set, get) => ({
//         setFilters: (filters: FilterState) => set({ filters: filters }),
//         setItems: (items: ReadonlyArray<FilterableItem>) => set({ items: items }),
//     })
// ))

// interface FilterContextValue {
//   filters: FilterState;
//   setFilters: (filters: FilterState) => void;
//   // Optional: store items for histogram data
//   items?: ReadonlyArray<FilterableItem>;
//   setItems?: (items: ReadonlyArray<FilterableItem>) => void;
// }

// const FilterContext = React.createContext<FilterContextValue | undefined>(
//   undefined
// );

// export function FilterProvider({ children }: { children: React.ReactNode }) {
//   const [filters, setFilters] = React.useState<FilterState>(DEFAULT_FILTERS);
//   const [items, setItems] = React.useState<ReadonlyArray<any>>([]);

//   return (
//     <FilterContext.Provider value={{ filters, setFilters, items, setItems }}>
//       {children}
//     </FilterContext.Provider>
//   );
// }

// export function useFilters() {
//   const context = React.useContext(FilterContext);
//   if (context === undefined) {
//     throw new Error("useFilters must be used within a FilterProvider");
//   }
//   return context;
// }

// // Optional: Hook that returns null if no provider exists (for pages without filters)
// export function useOptionalFilters() {
//   return React.useContext(FilterContext);
// }

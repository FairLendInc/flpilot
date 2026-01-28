"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

export type BrandingContextType = {
	// Broker information
	brokerId: Id<"brokers"> | null;
	subdomain: string | null;
	isBranded: boolean;

	// Branding configuration
	branding: {
		brandName?: string;
		primaryColor?: string;
		secondaryColor?: string;
		logoStorageId?: Id<"_storage">;
	};

	// Commission configuration
	commission: {
		ratePercentage: number;
		returnAdjustmentPercentage: number;
	};

	// Actions
	setBranding: (branding: Partial<BrandingContextType["branding"]>) => void;
	clearBranding: () => void;
};

const defaultContext: BrandingContextType = {
	brokerId: null,
	subdomain: null,
	isBranded: false,
	branding: {},
	commission: {
		ratePercentage: 0,
		returnAdjustmentPercentage: 0,
	},
	setBranding: () => {
		// Default no-op implementation
	},
	clearBranding: () => {
		// Default no-op implementation
	},
};

const BrandingContext = createContext<BrandingContextType>(defaultContext);

export function BrandingProvider({
	children,
	initialBranding,
}: {
	children: ReactNode;
	initialBranding?: Partial<BrandingContextType>;
}) {
	const [brandingState, setBrandingState] =
		useState<BrandingContextType>(defaultContext);

	const setBranding = (
		newBranding: Partial<BrandingContextType["branding"]>
	) => {
		setBrandingState((prev) => ({
			...prev,
			branding: {
				...prev.branding,
				...newBranding,
			},
		}));
	};

	const clearBranding = () => {
		setBrandingState(defaultContext);
	};

	const value: BrandingContextType = {
		...brandingState,
		...initialBranding,
		setBranding,
		clearBranding,
	};

	return (
		<BrandingContext.Provider value={value}>
			{children}
		</BrandingContext.Provider>
	);
}

export function useBranding() {
	const context = useContext(BrandingContext);
	if (!context) {
		throw new Error("useBranding must be used within a BrandingProvider");
	}
	return context;
}

export function useBrandingColors() {
	const { branding } = useBranding();

	return {
		primary: branding.primaryColor || "#F59E0B",
		secondary: branding.secondaryColor || "#FBBF24",
	};
}

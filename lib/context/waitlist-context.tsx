"use client";

import { createContext, useContext } from "react";

type WaitlistContextType = {
	showWaitlistModal: boolean;
	setShowWaitlistModal: (show: boolean) => void;
};

export const WaitlistContext = createContext<WaitlistContextType | undefined>(
	undefined
);

export function useWaitlist() {
	const context = useContext(WaitlistContext);
	if (!context) {
		throw new Error("useWaitlist must be used within a LandingPageWrapper");
	}
	return context;
}

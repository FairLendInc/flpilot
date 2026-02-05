"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";

const STORAGE_KEY = "admin_ledger_selection";
const DEFAULT_LEDGER = "flmarketplace";

type LedgerContextValue = {
	selectedLedger: string;
	setSelectedLedger: (ledger: string) => void;
	isLoading: boolean;
};

const LedgerContext = createContext<LedgerContextValue | null>(null);

export function LedgerProvider({ children }: { children: ReactNode }) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const [isLoading, setIsLoading] = useState(true);

	// Initialize from URL params or localStorage
	const [selectedLedger, setSelectedLedgerState] = useState<string>(() => {
		if (typeof window === "undefined") return DEFAULT_LEDGER;

		const urlParam = searchParams.get("ledger");
		if (urlParam) return urlParam;

		const stored = localStorage.getItem(STORAGE_KEY);
		return stored || DEFAULT_LEDGER;
	});

	// Sync with localStorage and URL
	function setSelectedLedger(ledger: string) {
		setSelectedLedgerState(ledger);

		// Persist to localStorage
		if (typeof window !== "undefined") {
			localStorage.setItem(STORAGE_KEY, ledger);
		}

		// Update URL without navigation
		const params = new URLSearchParams(searchParams.toString());
		params.set("ledger", ledger);
		router.replace(`${pathname}?${params.toString()}`);
	}

	// Mark as loaded after initial hydration
	useEffect(() => {
		setIsLoading(false);
	}, []);

	return (
		<LedgerContext.Provider
			value={{ selectedLedger, setSelectedLedger, isLoading }}
		>
			{children}
		</LedgerContext.Provider>
	);
}

export function useLedger() {
	const context = useContext(LedgerContext);
	if (!context) {
		throw new Error("useLedger must be used within a LedgerProvider");
	}
	return context;
}

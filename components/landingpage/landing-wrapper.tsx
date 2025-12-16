"use client";

import { useState } from "react";
import { LandingNavbar } from "@/components/landingpage/components/navbar/landing-navbar";
import { WaitlistModal } from "@/components/landingpage/components/waitlist-modal";
import { WaitlistContext } from "@/lib/context/waitlist-context";

export function LandingPageWrapper({ children }: { children: React.ReactNode }) {
	const [showWaitlistModal, setShowWaitlistModal] = useState(false);

	return (
		<WaitlistContext.Provider value={{ showWaitlistModal, setShowWaitlistModal }}>
			<div className="min-h-screen bg-background font-sans selection:bg-emerald-100 selection:text-emerald-900">
				<LandingNavbar />
				{children}
				<WaitlistModal
					onOpenChange={setShowWaitlistModal}
					open={showWaitlistModal}
				/>
			</div>
		</WaitlistContext.Provider>
	);
}

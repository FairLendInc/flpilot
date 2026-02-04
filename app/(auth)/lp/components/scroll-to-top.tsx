"use client";

import { ChevronsUp } from "lucide-react";

export function ScrollToTop() {
	return (
		<button
			className="swiss-border lp-hover-raise flex h-10 w-10 cursor-pointer items-center justify-center border lg:h-12 lg:w-12"
			onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
			type="button"
		>
			<ChevronsUp className="h-5 w-5" />
		</button>
	);
}

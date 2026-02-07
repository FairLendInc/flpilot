"use client";

import { useEffect } from "react";

export function ScrollReveal() {
	useEffect(() => {
		const root = document.documentElement;
		root.classList.add("lp-reveal-ready");
		const elements = document.querySelectorAll<HTMLElement>("[data-reveal]");
		if (elements.length === 0) {
			return () => {
				root.classList.remove("lp-reveal-ready");
			};
		}

		const prefersReducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)"
		).matches;

		if (prefersReducedMotion) {
			for (const element of elements) {
				element.classList.add("lp-reveal--in");
			}
			return () => {
				root.classList.remove("lp-reveal-ready");
			};
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					const element = entry.target as HTMLElement;
					element.classList.add("lp-reveal--in");
					observer.unobserve(element);
				}
			},
			{
				rootMargin: "0px 0px -10% 0px",
				threshold: 0.15,
			}
		);

		for (const element of elements) {
			observer.observe(element);
		}
		return () => {
			observer.disconnect();
			root.classList.remove("lp-reveal-ready");
		};
	}, []);

	return null;
}

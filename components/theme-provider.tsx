"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";
import "@/app/theme.css";

// Theme configuration
export const THEMES = {
	// Default/Minimal Themes
	"default": { colors: ["#0f766e", "#34d399"], name: "Default" },
	"default-dark": { colors: ["#34d399", "#0f766e"], name: "Default Dark" },
	"modernMinimal": { colors: ["oklch(0.6231 0.188 259.8145)", "oklch(0.9514 0.025 236.8242)"], name: "Modern Minimal" },
	"modernMinimal-dark": { colors: ["oklch(0.6231 0.188 259.8145)", "oklch(0.9514 0.025 236.8242)"], name: "Modern Minimal Dark" },
	"cleanslate": { colors: ["oklch(0.5854 0.2041 277.1173)", "oklch(0.9299 0.0334 272.7879)"], name: "Clean Slate" },
	"cleanslate-dark": { colors: ["oklch(0.5854 0.2041 277.1173)", "oklch(0.9299 0.0334 272.7879)"], name: "Clean Slate Dark" },

	// Colorful Themes
	"amber": { colors: ["oklch(0.7686 0.1647 70.0804)", "oklch(0.9869 0.0214 95.2774)"], name: "Amber" },
	"amber-dark": { colors: ["oklch(0.7686 0.1647 70.0804)", "oklch(0.9869 0.0214 95.2774)"], name: "Amber Dark" },
	"amethyst": { colors: ["oklch(0.6104 0.0767 299.7335)", "oklch(0.7889 0.0802 359.9375)"], name: "Amethyst" },
	"amethyst-dark": { colors: ["oklch(0.6104 0.0767 299.7335)", "oklch(0.7889 0.0802 359.9375)"], name: "Amethyst Dark" },
	"bloom": { colors: ["oklch(0.8677 0.0735 7.0855)", "oklch(0.968 0.211 109.7692)"], name: "Bloom" },
	"bloom-dark": { colors: ["oklch(0.8677 0.0735 7.0855)", "oklch(0.968 0.211 109.7692)"], name: "Bloom Dark" },
	"bubblegum": { colors: ["oklch(0.5676 0.2021 283.0838)", "oklch(0.6475 0.0642 117.426)"], name: "Bubblegum" },
	"bubblegum-dark": { colors: ["oklch(0.5676 0.2021 283.0838)", "oklch(0.6475 0.0642 117.426)"], name: "Bubblegum Dark" },
	"candyland": { colors: ["oklch(0.8677 0.0735 7.0855)", "oklch(0.968 0.211 109.7692)"], name: "Candyland" },
	"candyland-dark": { colors: ["oklch(0.8677 0.0735 7.0855)", "oklch(0.968 0.211 109.7692)"], name: "Candyland Dark" },

	// Blue/Purple Themes
	"catppuccin": { colors: ["oklch(0.5547 0.2503 297.0156)", "oklch(0.682 0.1448 235.3822)"], name: "Catppuccin" },
	"catppuccin-dark": { colors: ["oklch(0.5547 0.2503 297.0156)", "oklch(0.682 0.1448 235.3822)"], name: "Catppuccin Dark" },
	"boldtech": { colors: ["oklch(0.6056 0.2189 292.7172)", "oklch(0.9319 0.0316 255.5855)"], name: "Bold Tech" },
	"boldtech-dark": { colors: ["oklch(0.6056 0.2189 292.7172)", "oklch(0.9319 0.0316 255.5855)"], name: "Bold Tech Dark" },
	"claymorphism": { colors: ["oklch(0.5854 0.2041 277.1173)", "oklch(0.9376 0.026 321.9388)"], name: "Claymorphism" },
	"claymorphism-dark": { colors: ["oklch(0.5854 0.2041 277.1173)", "oklch(0.9376 0.026 321.9388)"], name: "Claymorphism Dark" },
	"cosmic": { colors: ["oklch(0.5417 0.179 288.0332)", "oklch(0.9221 0.0373 262.141)"], name: "Cosmic" },
	"cosmic-dark": { colors: ["oklch(0.5417 0.179 288.0332)", "oklch(0.9221 0.0373 262.141)"], name: "Cosmic Dark" },
	"cyberpunk": { colors: ["oklch(0.6726 0.2904 341.4084)", "oklch(0.8903 0.1739 171.269)"], name: "Cyberpunk" },
	"cyberpunk-dark": { colors: ["oklch(0.6726 0.2904 341.4084)", "oklch(0.8903 0.1739 171.269)"], name: "Cyberpunk Dark" },

	// Neutral/Warm Themes
	"caffeine": { colors: ["oklch(0.4341 0.0392 41.9938)", "oklch(0.931 0 0)"], name: "Caffeine" },
	"caffeine-dark": { colors: ["oklch(0.4341 0.0392 41.9938)", "oklch(0.931 0 0)"], name: "Caffeine Dark" },
	"luxury": { colors: ["oklch(0.465 0.147 24.9381)", "oklch(0.9619 0.058 95.6174)"], name: "Luxury" },
	"luxury-dark": { colors: ["oklch(0.465 0.147 24.9381)", "oklch(0.9619 0.058 95.6174)"], name: "Luxury Dark" },
	"mocha": { colors: ["oklch(0.205 0 0)", "oklch(0.97 0 0)"], name: "Mocha" },
	"mocha-dark": { colors: ["oklch(0.205 0 0)", "oklch(0.97 0 0)"], name: "Mocha Dark" },
	"doom": { colors: ["oklch(0.5016 0.1887 27.4816)", "oklch(0.588 0.0993 245.7394)"], name: "Doom" },
	"doom-dark": { colors: ["oklch(0.5016 0.1887 27.4816)", "oklch(0.588 0.0993 245.7394)"], name: "Doom Dark" },
	"darkmatter": { colors: ["oklch(0.6716 0.1368 48.513)", "oklch(0.9491 0 0)"], name: "Dark Matter" },
	"darkmatter-dark": { colors: ["oklch(0.6716 0.1368 48.513)", "oklch(0.9491 0 0)"], name: "Dark Matter Dark" },
	"kodama": { colors: ["oklch(0.4891 0 0)", "oklch(0.8078 0 0)"], name: "Kodama" },
	"kodama-dark": { colors: ["oklch(0.4891 0 0)", "oklch(0.8078 0 0)"], name: "Kodama Dark" },

	// Special Themes
	"claude": { colors: ["oklch(0.6171 0.1375 39.0427)", "oklch(0.9245 0.0138 92.9892)"], name: "Claude" },
	"claude-dark": { colors: ["oklch(0.6171 0.1375 39.0427)", "oklch(0.9245 0.0138 92.9892)"], name: "Claude Dark" },
} as const;

export type Theme = keyof typeof THEMES;

// Helper function to get the base theme name (without -dark suffix)
export function getBaseTheme(theme: Theme): string {
	return theme.replace("-dark", "");
}

// Helper function to check if a theme is dark mode
export function isDarkTheme(theme: Theme): boolean {
	return theme.endsWith("-dark");
}

type ThemeProviderProps = {
	children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
	return (
		<NextThemesProvider
			attribute="data-theme"
			defaultTheme="default"
			enableSystem={false}
			themes={[
				// Default/Minimal
				"default", "default-dark",
				"modernMinimal", "modernMinimal-dark",
				"cleanslate", "cleanslate-dark",
				// Colorful
				"amber", "amber-dark",
				"amethyst", "amethyst-dark",
				"bloom", "bloom-dark",
				"bubblegum", "bubblegum-dark",
				"candyland", "candyland-dark",
				// Blue/Purple
				"catppuccin", "catppuccin-dark",
				"boldtech", "boldtech-dark",
				"claymorphism", "claymorphism-dark",
				"cosmic", "cosmic-dark",
				"cyberpunk", "cyberpunk-dark",
				// Neutral/Warm
				"caffeine", "caffeine-dark",
				"luxury", "luxury-dark",
				"mocha", "mocha-dark",
				"doom", "doom-dark",
				"darkmatter", "darkmatter-dark",
				"kodama", "kodama-dark",
				// Special
				"claude", "claude-dark",
			]}
		>
			{children}
		</NextThemesProvider>
	);
}

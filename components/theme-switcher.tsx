"use client";

import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { THEMES, type Theme } from "./theme-provider";

export function ThemeSwitcher() {
	const { theme, setTheme } = useTheme();

	const handleThemeChange = (newTheme: Theme) => {
		setTheme(newTheme);
		toast.success(`Theme changed to ${THEMES[newTheme].name}`);
	};

	// Group themes by category
	const themeCategories = {
		"Default & Minimal": ["default", "modernMinimal", "cleanslate", "mocha"],
		Colorful: ["amber", "amethyst", "bloom", "bubblegum", "candyland"],
		"Blue & Purple": [
			"catppuccin",
			"boldtech",
			"claymorphism",
			"cosmic",
			"cyberpunk",
		],
		"Warm & Neutral": ["caffeine", "luxury", "doom", "darkmatter", "kodama"],
		Special: ["claude"],
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Theme Preference</CardTitle>
				<CardDescription>Choose your preferred color theme</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{Object.entries(themeCategories).map(([category, baseThemes]) => (
					<div className="space-y-3" key={category}>
						<h3 className="font-medium text-sm">{category}</h3>
						<div className="grid grid-cols-2 gap-4">
							{baseThemes.map((baseTheme) => {
								const lightTheme = baseTheme as Theme;
								const darkTheme = `${baseTheme}-dark` as Theme;

								return (
									<div className="space-y-2" key={baseTheme}>
										{/* Light Theme */}
										<button
											className={`group relative h-20 w-full rounded-lg border-2 p-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
												theme === lightTheme
													? "border-primary"
													: "border-border hover:border-primary"
											}`}
											onClick={() => handleThemeChange(lightTheme)}
											type="button"
										>
											<div
												className="h-full w-full rounded-md"
												style={{
													background: `linear-gradient(135deg, ${THEMES[lightTheme].colors[0]} 0%, ${THEMES[lightTheme].colors[1]} 100%)`,
												}}
											/>
											<div className="absolute inset-x-0 bottom-0 rounded-b-md bg-gradient-to-t from-black/60 to-transparent p-1.5">
												<span className="font-medium text-white text-xs">
													{THEMES[lightTheme].name}
												</span>
											</div>
										</button>

										{/* Dark Theme */}
										<button
											className={`group relative h-20 w-full rounded-lg border-2 p-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
												theme === darkTheme
													? "border-primary"
													: "border-border hover:border-primary"
											}`}
											onClick={() => handleThemeChange(darkTheme)}
											type="button"
										>
											<div
												className="h-full w-full rounded-md"
												style={{
													background: `linear-gradient(135deg, ${THEMES[darkTheme].colors[0]} 0%, ${THEMES[darkTheme].colors[1]} 100%)`,
												}}
											/>
											<div className="absolute inset-x-0 bottom-0 rounded-b-md bg-gradient-to-t from-black/60 to-transparent p-1.5">
												<span className="font-medium text-white text-xs">
													{THEMES[darkTheme].name}
												</span>
											</div>
										</button>
									</div>
								);
							})}
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);
}

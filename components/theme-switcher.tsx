"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { THEMES, type Theme, getBaseTheme, isDarkTheme } from "./theme-provider";

export function ThemeSwitcher() {
	const { theme, setTheme } = useTheme();

	const handleThemeChange = (theme: Theme) => {
		setTheme(theme);
		toast.success(`Theme changed to ${THEMES[theme].name}`);
	};

	// Group themes by category
	const themeCategories = {
		"Default & Minimal": ["default", "modernMinimal", "cleanslate", "mocha"],
		"Colorful": ["amber", "amethyst", "bloom", "bubblegum", "candyland"],
		"Blue & Purple": ["catppuccin", "boldtech", "claymorphism", "cosmic", "cyberpunk"],
		"Warm & Neutral": ["caffeine", "luxury", "doom", "darkmatter", "kodama"],
		"Special": ["claude"],
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Theme Preference</CardTitle>
				<CardDescription>Choose your preferred color theme</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{Object.entries(themeCategories).map(([category, baseThemes]) => (
					<div key={category} className="space-y-3">
						<h3 className="text-sm font-medium">{category}</h3>
						<div className="grid grid-cols-2 gap-4">
							{baseThemes.map((baseTheme) => {
								const lightTheme = baseTheme as Theme;
								const darkTheme = `${baseTheme}-dark` as Theme;

								return (
									<div key={baseTheme} className="space-y-2">
										{/* Light Theme */}
										<button
											onClick={() => handleThemeChange(lightTheme)}
											className={`group relative h-20 w-full rounded-lg border-2 p-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
												theme === lightTheme ? "border-primary" : "border-border hover:border-primary"
											}`}
										>
											<div
												className="h-full w-full rounded-md"
												style={{
													background: `linear-gradient(135deg, ${THEMES[lightTheme].colors[0]} 0%, ${THEMES[lightTheme].colors[1]} 100%)`,
												}}
											/>
											<div className="absolute inset-x-0 bottom-0 rounded-b-md bg-gradient-to-t from-black/60 to-transparent p-1.5">
												<span className="text-xs font-medium text-white">
													{THEMES[lightTheme].name}
												</span>
											</div>
										</button>

										{/* Dark Theme */}
										<button
											onClick={() => handleThemeChange(darkTheme)}
											className={`group relative h-20 w-full rounded-lg border-2 p-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
												theme === darkTheme ? "border-primary" : "border-border hover:border-primary"
											}`}
										>
											<div
												className="h-full w-full rounded-md"
												style={{
													background: `linear-gradient(135deg, ${THEMES[darkTheme].colors[0]} 0%, ${THEMES[darkTheme].colors[1]} 100%)`,
												}}
											/>
											<div className="absolute inset-x-0 bottom-0 rounded-b-md bg-gradient-to-t from-black/60 to-transparent p-1.5">
												<span className="text-xs font-medium text-white">
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

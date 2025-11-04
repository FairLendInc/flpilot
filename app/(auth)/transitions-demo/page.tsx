"use client";

import { startTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

type TransitionType =
	| "cross-fade"
	| "zoom-out"
	| "blur-fade"
	| "flip"
	| "bounce-in"
	| "slide-fade-out"
	| "rotate-out"
	| "wipe-left"
	| "wipe-right"
	| "iris"
	| "dissolve"
	| "stack-out"
	| "glitch"
	| "slide-left"
	| "slide-right";

type TransitionInfo = {
	name: string;
	description: string;
	cssName: string;
	emoji: string;
};

const transitions: Record<TransitionType, TransitionInfo> = {
	"cross-fade": {
		name: "Cross Fade",
		description: "Classic smooth fade between content",
		cssName: "cross-fade",
		emoji: "✨",
	},
	"zoom-out": {
		name: "Zoom",
		description: "Scale up/down with bounce effect",
		cssName: "zoom-out",
		emoji: "🔍",
	},
	"blur-fade": {
		name: "Blur Fade",
		description: "Modern blur while fading",
		cssName: "blur-fade",
		emoji: "🌫️",
	},
	flip: {
		name: "3D Flip",
		description: "Card flip with perspective",
		cssName: "flip",
		emoji: "🔄",
	},
	"bounce-in": {
		name: "Bounce",
		description: "Elastic spring animation",
		cssName: "bounce-in",
		emoji: "🎾",
	},
	"slide-fade-out": {
		name: "Slide + Fade",
		description: "Combined slide and fade effect",
		cssName: "slide-fade-out",
		emoji: "↗️",
	},
	"rotate-out": {
		name: "Rotate",
		description: "Spinning transformation",
		cssName: "rotate-out",
		emoji: "🌀",
	},
	"wipe-left": {
		name: "Wipe Left",
		description: "Directional reveal from left",
		cssName: "wipe-left",
		emoji: "◀️",
	},
	"wipe-right": {
		name: "Wipe Right",
		description: "Directional reveal from right",
		cssName: "wipe-right",
		emoji: "▶️",
	},
	iris: {
		name: "Iris",
		description: "Circular expand/contract",
		cssName: "iris",
		emoji: "⭕",
	},
	dissolve: {
		name: "Dissolve",
		description: "Brightness-enhanced fade",
		cssName: "dissolve",
		emoji: "💫",
	},
	"stack-out": {
		name: "Stack",
		description: "Card stacking effect",
		cssName: "stack-out",
		emoji: "📚",
	},
	glitch: {
		name: "Glitch",
		description: "Digital distortion effect",
		cssName: "glitch",
		emoji: "⚡",
	},
	"slide-left": {
		name: "Slide Left",
		description: "Horizontal slide to left",
		cssName: "slide-left",
		emoji: "⬅️",
	},
	"slide-right": {
		name: "Slide Right",
		description: "Horizontal slide to right",
		cssName: "slide-right",
		emoji: "➡️",
	},
};

const demoContent = [
	{
		title: "Mountain Vista",
		description: "Breathtaking mountain peaks covered in fresh snow",
		gradient: "from-blue-500 to-purple-600",
		number: 1,
	},
	{
		title: "Ocean Sunset",
		description: "Golden hour over the peaceful ocean waves",
		gradient: "from-orange-500 to-pink-600",
		number: 2,
	},
	{
		title: "Forest Path",
		description: "Misty morning trail through ancient woods",
		gradient: "from-green-500 to-teal-600",
		number: 3,
	},
	{
		title: "City Lights",
		description: "Vibrant downtown skyline at night",
		gradient: "from-purple-500 to-indigo-600",
		number: 4,
	},
	{
		title: "Desert Dunes",
		description: "Rolling sand dunes under a blazing sun",
		gradient: "from-yellow-500 to-red-600",
		number: 5,
	},
];

export default function TransitionsDemoPage() {
	const [currentContent, setCurrentContent] = useState(0);
	const [selectedTransition, setSelectedTransition] =
		useState<TransitionType>("cross-fade");

	const handleTransition = (transition: TransitionType) => {
		setSelectedTransition(transition);

		// Use View Transition API if available
		if (
			document.startViewTransition &&
			typeof document.startViewTransition === "function"
		) {
			document.startViewTransition(() => {
				startTransition(() => {
					setCurrentContent((prev) => (prev + 1) % demoContent.length);
				});
			});
		} else {
			// Fallback for browsers without View Transition API
			startTransition(() => {
				setCurrentContent((prev) => (prev + 1) % demoContent.length);
			});
		}
	};

	const content = demoContent[currentContent];

	return (
		<div className="container mx-auto max-w-7xl p-8">
			{/* Header */}
			<div className="mb-12 text-center">
				<h1 className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-bold text-5xl text-transparent">
					View Transitions Playground 🎨
				</h1>
				<p className="text-muted-foreground text-xl">
					Click any transition below to see it in action!
				</p>
			</div>

			{/* Demo Content Area */}
			<div className="mb-12 flex justify-center">
				<div
					className="w-full max-w-2xl"
					style={{
						viewTransitionName: transitions[selectedTransition].cssName,
					}}
				>
					<Card className="overflow-hidden shadow-2xl">
						<div
							className={`h-64 bg-gradient-to-br ${content.gradient} flex items-center justify-center`}
						>
							<div className="text-center text-white">
								<div className="mb-4 font-bold text-8xl">{content.number}</div>
								<div className="font-semibold text-2xl">{content.title}</div>
							</div>
						</div>
						<CardHeader>
							<CardTitle className="text-3xl">{content.title}</CardTitle>
							<CardDescription className="text-lg">
								{content.description}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex items-center justify-between">
								<div className="text-muted-foreground text-sm">
									Current Transition:{" "}
									<span className="font-bold">
										{transitions[selectedTransition].name}
									</span>
								</div>
								<div className="text-muted-foreground text-sm">
									{currentContent + 1} / {demoContent.length}
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Transition Buttons */}
			<div className="space-y-8">
				<div>
					<h2 className="mb-4 font-bold text-2xl">Basic Transitions</h2>
					<div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
						{(
							[
								"cross-fade",
								"zoom-out",
								"blur-fade",
								"flip",
								"bounce-in",
							] as TransitionType[]
						).map((type) => (
							<Button
								className="flex h-auto flex-col gap-2 py-4"
								key={type}
								onClick={() => handleTransition(type)}
								variant={selectedTransition === type ? "default" : "outline"}
							>
								<span className="text-3xl">{transitions[type].emoji}</span>
								<span className="font-semibold text-sm">
									{transitions[type].name}
								</span>
							</Button>
						))}
					</div>
				</div>

				<div>
					<h2 className="mb-4 font-bold text-2xl">Directional Transitions</h2>
					<div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
						{(
							[
								"slide-left",
								"slide-right",
								"slide-fade-out",
								"wipe-left",
								"wipe-right",
							] as TransitionType[]
						).map((type) => (
							<Button
								className="flex h-auto flex-col gap-2 py-4"
								key={type}
								onClick={() => handleTransition(type)}
								variant={selectedTransition === type ? "default" : "outline"}
							>
								<span className="text-3xl">{transitions[type].emoji}</span>
								<span className="font-semibold text-sm">
									{transitions[type].name}
								</span>
							</Button>
						))}
					</div>
				</div>

				<div>
					<h2 className="mb-4 font-bold text-2xl">Special Effects</h2>
					<div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
						{(
							[
								"rotate-out",
								"iris",
								"dissolve",
								"stack-out",
								"glitch",
							] as TransitionType[]
						).map((type) => (
							<Button
								className="flex h-auto flex-col gap-2 py-4"
								key={type}
								onClick={() => handleTransition(type)}
								variant={selectedTransition === type ? "default" : "outline"}
							>
								<span className="text-3xl">{transitions[type].emoji}</span>
								<span className="font-semibold text-sm">
									{transitions[type].name}
								</span>
							</Button>
						))}
					</div>
				</div>
			</div>

			{/* Info Section */}
			<div className="mt-12 rounded-lg bg-muted p-6">
				<h3 className="mb-2 font-bold text-xl">
					{transitions[selectedTransition].emoji}{" "}
					{transitions[selectedTransition].name}
				</h3>
				<p className="mb-4 text-muted-foreground">
					{transitions[selectedTransition].description}
				</p>
				<code className="rounded bg-background px-3 py-1 text-sm">
					view-transition-name: {transitions[selectedTransition].cssName}
				</code>
			</div>

			{/* Browser Support Notice */}
			<div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
				<p className="text-sm text-yellow-800 dark:text-yellow-200">
					<strong>Note:</strong> View Transitions API is currently supported in
					Chrome/Edge 111+. Other browsers will fall back to instant
					transitions.
				</p>
			</div>
		</div>
	);
}

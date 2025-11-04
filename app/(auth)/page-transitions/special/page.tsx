"use client";

import { ArrowLeft, Circle, Layers, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function SpecialEffectsPage() {
	return (
		<div
			className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-8 dark:from-orange-900 dark:to-red-900"
			style={{ viewTransitionName: "glitch" }}
		>
			<div className="container mx-auto max-w-4xl">
				{/* Navigation */}
				<div className="mb-8 flex items-center justify-between">
					<Link href="/page-transitions/flip">
						<Button size="lg" variant="outline">
							<ArrowLeft className="mr-2 h-5 w-5" />
							Prev: Flip
						</Button>
					</Link>
					<Link href="/page-transitions">
						<Button size="lg">
							Back to Home
							<ArrowLeft className="ml-2 h-5 w-5" />
						</Button>
					</Link>
				</div>

				{/* Main Content */}
				<div className="space-y-8">
					<div className="text-center">
						<div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-orange-500">
							<Sparkles className="h-12 w-12 text-white" />
						</div>
						<h1 className="mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text font-bold text-5xl text-transparent">
							Special Effects ⚡
						</h1>
						<p className="text-muted-foreground text-xl">
							Unique transitions for special moments
						</p>
					</div>

					{/* Effect Cards */}
					<div className="grid gap-6 md:grid-cols-2">
						<Card className="shadow-xl transition-shadow hover:shadow-2xl">
							<CardHeader>
								<div className="mb-2 flex items-center gap-3">
									<Zap className="h-8 w-8 text-yellow-500" />
									<CardTitle className="text-2xl">Glitch Effect</CardTitle>
								</div>
								<CardDescription>Digital distortion animation</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="mb-3 text-sm">
									Step-based animation creating a digital glitch effect
								</p>
								<div className="rounded bg-yellow-50 p-3 text-xs dark:bg-yellow-900/20">
									<strong>Use cases:</strong> Error states, tech themes,
									cyberpunk aesthetics
								</div>
							</CardContent>
						</Card>

						<Card className="shadow-xl transition-shadow hover:shadow-2xl">
							<CardHeader>
								<div className="mb-2 flex items-center gap-3">
									<Circle className="h-8 w-8 text-purple-500" />
									<CardTitle className="text-2xl">Iris Expand</CardTitle>
								</div>
								<CardDescription>Circular reveal effect</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="mb-3 text-sm">
									Circular clip-path animation from/to center
								</p>
								<div className="rounded bg-purple-50 p-3 text-xs dark:bg-purple-900/20">
									<strong>Use cases:</strong> Modal dialogs, spotlight focus,
									dramatic reveals
								</div>
							</CardContent>
						</Card>

						<Card className="shadow-xl transition-shadow hover:shadow-2xl">
							<CardHeader>
								<div className="mb-2 flex items-center gap-3">
									<Sparkles className="h-8 w-8 text-blue-500" />
									<CardTitle className="text-2xl">Dissolve</CardTitle>
								</div>
								<CardDescription>Brightness-enhanced fade</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="mb-3 text-sm">
									Combines blur and brightness for ethereal effect
								</p>
								<div className="rounded bg-blue-50 p-3 text-xs dark:bg-blue-900/20">
									<strong>Use cases:</strong> Dream sequences, fantasy themes,
									soft transitions
								</div>
							</CardContent>
						</Card>

						<Card className="shadow-xl transition-shadow hover:shadow-2xl">
							<CardHeader>
								<div className="mb-2 flex items-center gap-3">
									<Layers className="h-8 w-8 text-green-500" />
									<CardTitle className="text-2xl">Stack Effect</CardTitle>
								</div>
								<CardDescription>Card stacking animation</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="mb-3 text-sm">
									Vertical movement with scale for depth perception
								</p>
								<div className="rounded bg-green-50 p-3 text-xs dark:bg-green-900/20">
									<strong>Use cases:</strong> Card interfaces, layer management,
									depth emphasis
								</div>
							</CardContent>
						</Card>
					</div>

					{/* All Effects Summary */}
					<Card className="border-0 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-2xl">
						<CardHeader>
							<CardTitle className="text-3xl text-white">
								Available Transitions
							</CardTitle>
							<CardDescription className="text-orange-100">
								Complete list of all transition effects
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 text-sm md:grid-cols-3">
								<div>
									<h4 className="mb-2 font-bold text-white">Basic</h4>
									<ul className="space-y-1 text-white/90">
										<li>✨ Cross Fade</li>
										<li>🔍 Zoom</li>
										<li>🌫️ Blur Fade</li>
										<li>🔄 3D Flip</li>
										<li>🎾 Bounce</li>
									</ul>
								</div>
								<div>
									<h4 className="mb-2 font-bold text-white">Directional</h4>
									<ul className="space-y-1 text-white/90">
										<li>⬅️ Slide Left</li>
										<li>➡️ Slide Right</li>
										<li>↗️ Slide + Fade</li>
										<li>◀️ Wipe Left</li>
										<li>▶️ Wipe Right</li>
									</ul>
								</div>
								<div>
									<h4 className="mb-2 font-bold text-white">Special</h4>
									<ul className="space-y-1 text-white/90">
										<li>🌀 Rotate</li>
										<li>⭕ Iris</li>
										<li>💫 Dissolve</li>
										<li>📚 Stack</li>
										<li>⚡ Glitch</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

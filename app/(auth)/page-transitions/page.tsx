"use client";

import { ArrowRight, Rocket, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function PageTransitionsHome() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 dark:from-gray-900 dark:to-gray-800">
			<div className="container mx-auto max-w-6xl">
				{/* Header */}
				<div className="mb-12 text-center">
					<h1 className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-bold text-6xl text-transparent">
						Page Transitions Demo 🚀
					</h1>
					<p className="text-muted-foreground text-xl">
						Navigate between these pages to see transitions in action
					</p>
				</div>

				{/* Navigation Grid */}
				<div className="mb-12 grid gap-6 md:grid-cols-2">
					<Link className="group block" href="/page-transitions/zoom">
						<Card className="h-full border-0 bg-gradient-to-br from-purple-500 to-pink-500 text-white transition-shadow duration-300 hover:shadow-2xl">
							<CardHeader>
								<div className="flex items-center justify-between">
									<Zap className="h-12 w-12" />
									<ArrowRight className="h-8 w-8 transition-transform group-hover:translate-x-2" />
								</div>
								<CardTitle className="text-3xl text-white">
									Zoom Effect
								</CardTitle>
								<CardDescription className="text-purple-100">
									Scale and bounce animations
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-white/90">
									Experience smooth zoom in/out transitions with elastic easing
								</p>
							</CardContent>
						</Card>
					</Link>

					<Link className="group block" href="/page-transitions/blur">
						<Card className="h-full border-0 bg-gradient-to-br from-blue-500 to-cyan-500 text-white transition-shadow duration-300 hover:shadow-2xl">
							<CardHeader>
								<div className="flex items-center justify-between">
									<Sparkles className="h-12 w-12" />
									<ArrowRight className="h-8 w-8 transition-transform group-hover:translate-x-2" />
								</div>
								<CardTitle className="text-3xl text-white">Blur Fade</CardTitle>
								<CardDescription className="text-blue-100">
									Modern blur transitions
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-white/90">
									Smooth blur effect while fading between pages
								</p>
							</CardContent>
						</Card>
					</Link>

					<Link className="group block" href="/page-transitions/flip">
						<Card className="h-full border-0 bg-gradient-to-br from-green-500 to-emerald-500 text-white transition-shadow duration-300 hover:shadow-2xl">
							<CardHeader>
								<div className="flex items-center justify-between">
									<Rocket className="h-12 w-12" />
									<ArrowRight className="h-8 w-8 transition-transform group-hover:translate-x-2" />
								</div>
								<CardTitle className="text-3xl text-white">3D Flip</CardTitle>
								<CardDescription className="text-green-100">
									Perspective transforms
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-white/90">
									3D card flip with perspective depth
								</p>
							</CardContent>
						</Card>
					</Link>

					<Link className="group block" href="/page-transitions/special">
						<Card className="h-full border-0 bg-gradient-to-br from-orange-500 to-red-500 text-white transition-shadow duration-300 hover:shadow-2xl">
							<CardHeader>
								<div className="flex items-center justify-between">
									<Sparkles className="h-12 w-12" />
									<ArrowRight className="h-8 w-8 transition-transform group-hover:translate-x-2" />
								</div>
								<CardTitle className="text-3xl text-white">
									Special FX
								</CardTitle>
								<CardDescription className="text-orange-100">
									Unique effects gallery
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-white/90">
									Explore glitch, iris, dissolve, and more
								</p>
							</CardContent>
						</Card>
					</Link>
				</div>

				{/* Instructions */}
				<Card className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
					<CardHeader>
						<CardTitle>How to Use This Demo</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-start gap-3">
							<div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 font-bold text-white">
								1
							</div>
							<div>
								<h3 className="mb-1 font-semibold">Click any card above</h3>
								<p className="text-muted-foreground text-sm">
									Navigate to a demo page to see the transition in action
								</p>
							</div>
						</div>
						<div className="flex items-start gap-3">
							<div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-500 font-bold text-white">
								2
							</div>
							<div>
								<h3 className="mb-1 font-semibold">Watch the transition</h3>
								<p className="text-muted-foreground text-sm">
									Notice how the page smoothly transitions between views
								</p>
							</div>
						</div>
						<div className="flex items-start gap-3">
							<div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500 font-bold text-white">
								3
							</div>
							<div>
								<h3 className="mb-1 font-semibold">Navigate between pages</h3>
								<p className="text-muted-foreground text-sm">
									Use the navigation buttons on each page to try different
									transitions
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Back to main app */}
				<div className="mt-8 text-center">
					<Link href="/dashboard">
						<Button size="lg" variant="outline">
							Back to Dashboard
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}

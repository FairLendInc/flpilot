"use client";

import { ArrowLeft, ArrowRight, RotateCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function FlipTransitionPage() {
	return (
		<div
			className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8 dark:from-green-900 dark:to-emerald-900"
			style={{ viewTransitionName: "flip" }}
		>
			<div className="container mx-auto max-w-4xl">
				{/* Navigation */}
				<div className="mb-8 flex items-center justify-between">
					<Link href="/page-transitions/blur">
						<Button size="lg" variant="outline">
							<ArrowLeft className="mr-2 h-5 w-5" />
							Prev: Blur
						</Button>
					</Link>
					<Link href="/page-transitions/special">
						<Button size="lg">
							Next: Special FX
							<ArrowRight className="ml-2 h-5 w-5" />
						</Button>
					</Link>
				</div>

				{/* Main Content */}
				<div className="space-y-8">
					<div className="text-center">
						<div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-green-500">
							<RotateCw className="h-12 w-12 text-white" />
						</div>
						<h1 className="mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text font-bold text-5xl text-transparent">
							3D Flip 🔄
						</h1>
						<p className="text-muted-foreground text-xl">
							Card flip with perspective depth
						</p>
					</div>

					<Card className="shadow-2xl">
						<CardHeader>
							<CardTitle className="text-3xl">How It Works</CardTitle>
							<CardDescription>
								Understanding the 3D flip transition
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-4">
								<div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
									<h3 className="mb-2 font-bold">Animation Details</h3>
									<ul className="space-y-2 text-sm">
										<li>
											• <strong>Duration:</strong> 400ms
										</li>
										<li>
											• <strong>Easing:</strong> ease-in-out
										</li>
										<li>
											• <strong>Effect:</strong> 3D perspective rotation
										</li>
										<li>
											• <strong>Best for:</strong> Card reveals, dramatic
											transitions
										</li>
									</ul>
								</div>

								<div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-900/20">
									<h3 className="mb-2 font-bold">CSS Implementation</h3>
									<pre className="overflow-x-auto rounded bg-white p-3 text-xs dark:bg-gray-800">
										{`::view-transition-old(flip) {
  animation: 400ms ease-in-out flip-out;
  transform-style: preserve-3d;
}

@keyframes flip-out {
  from { transform: perspective(800px) rotateY(0deg); }
  to { transform: perspective(800px) rotateY(90deg); }
}`}
									</pre>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Demo Cards */}
					<div className="grid gap-4 md:grid-cols-2">
						<Card className="border-0 bg-gradient-to-br from-green-500 to-green-600 text-white">
							<CardHeader>
								<CardTitle className="text-white">Outgoing Content</CardTitle>
							</CardHeader>
							<CardContent>
								<p>Rotates 90° with perspective depth</p>
							</CardContent>
						</Card>

						<Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
							<CardHeader>
								<CardTitle className="text-white">Incoming Content</CardTitle>
							</CardHeader>
							<CardContent>
								<p>Rotates from -90° to complete flip</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}

"use client";

import { ArrowLeft, ArrowRight, Wind } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function BlurTransitionPage() {
	return (
		<div
			className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-8 dark:from-blue-900 dark:to-cyan-900"
			style={{ viewTransitionName: "blur-fade" }}
		>
			<div className="container mx-auto max-w-4xl">
				{/* Navigation */}
				<div className="mb-8 flex items-center justify-between">
					<Link href="/page-transitions/zoom">
						<Button size="lg" variant="outline">
							<ArrowLeft className="mr-2 h-5 w-5" />
							Prev: Zoom
						</Button>
					</Link>
					<Link href="/page-transitions/flip">
						<Button size="lg">
							Next: Flip
							<ArrowRight className="ml-2 h-5 w-5" />
						</Button>
					</Link>
				</div>

				{/* Main Content */}
				<div className="space-y-8">
					<div className="text-center">
						<div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-blue-500">
							<Wind className="h-12 w-12 text-white" />
						</div>
						<h1 className="mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text font-bold text-5xl text-transparent">
							Blur Fade 🌫️
						</h1>
						<p className="text-muted-foreground text-xl">
							Modern blur effect during transitions
						</p>
					</div>

					<Card className="shadow-2xl">
						<CardHeader>
							<CardTitle className="text-3xl">How It Works</CardTitle>
							<CardDescription>
								Understanding the blur fade transition
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-4">
								<div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
									<h3 className="mb-2 font-bold">Animation Details</h3>
									<ul className="space-y-2 text-sm">
										<li>
											• <strong>Duration:</strong> 300ms
										</li>
										<li>
											• <strong>Easing:</strong> ease-in / ease-out
										</li>
										<li>
											• <strong>Effect:</strong> Content blurs while fading
										</li>
										<li>
											• <strong>Best for:</strong> Content changes, smooth
											navigation
										</li>
									</ul>
								</div>

								<div className="rounded-lg bg-cyan-50 p-4 dark:bg-cyan-900/20">
									<h3 className="mb-2 font-bold">CSS Implementation</h3>
									<pre className="overflow-x-auto rounded bg-white p-3 text-xs dark:bg-gray-800">
										{`::view-transition-old(blur-fade) {
  animation: 300ms ease-out blur-out;
}

::view-transition-new(blur-fade) {
  animation: 300ms ease-in blur-in;
}

@keyframes blur-out {
  from { opacity: 1; filter: blur(0px); }
  to { opacity: 0; filter: blur(10px); }
}`}
									</pre>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Demo Cards */}
					<div className="grid gap-4 md:grid-cols-2">
						<Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
							<CardHeader>
								<CardTitle className="text-white">Outgoing Content</CardTitle>
							</CardHeader>
							<CardContent>
								<p>Blurs to 10px while fading out</p>
							</CardContent>
						</Card>

						<Card className="border-0 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
							<CardHeader>
								<CardTitle className="text-white">Incoming Content</CardTitle>
							</CardHeader>
							<CardContent>
								<p>Unblurs from 10px while fading in</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}

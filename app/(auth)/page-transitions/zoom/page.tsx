"use client";

import { ArrowLeft, ArrowRight, Maximize2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function ZoomTransitionPage() {
	return (
		<div
			className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8 dark:from-purple-900 dark:to-pink-900"
			style={{ viewTransitionName: "zoom-out" }}
		>
			<div className="container mx-auto max-w-4xl">
				{/* Navigation */}
				<div className="mb-8 flex items-center justify-between">
					<Link href="/page-transitions">
						<Button size="lg" variant="outline">
							<ArrowLeft className="mr-2 h-5 w-5" />
							Back
						</Button>
					</Link>
					<Link href="/page-transitions/blur">
						<Button size="lg">
							Next: Blur
							<ArrowRight className="ml-2 h-5 w-5" />
						</Button>
					</Link>
				</div>

				{/* Main Content */}
				<div className="space-y-8">
					<div className="text-center">
						<div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-purple-500">
							<Maximize2 className="h-12 w-12 text-white" />
						</div>
						<h1 className="mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text font-bold text-5xl text-transparent">
							Zoom Effect 🔍
						</h1>
						<p className="text-muted-foreground text-xl">
							Scale transformations with elastic easing
						</p>
					</div>

					<Card className="shadow-2xl">
						<CardHeader>
							<CardTitle className="text-3xl">How It Works</CardTitle>
							<CardDescription>
								Understanding the zoom transition
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-4">
								<div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
									<h3 className="mb-2 font-bold">Animation Details</h3>
									<ul className="space-y-2 text-sm">
										<li>
											• <strong>Duration:</strong> 350ms
										</li>
										<li>
											• <strong>Easing:</strong> cubic-bezier(0.34, 1.56, 0.64,
											1)
										</li>
										<li>
											• <strong>Effect:</strong> Content scales with elastic
											bounce
										</li>
										<li>
											• <strong>Best for:</strong> Modal dialogs, detail views,
											focus states
										</li>
									</ul>
								</div>

								<div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
									<h3 className="mb-2 font-bold">CSS Implementation</h3>
									<pre className="overflow-x-auto rounded bg-white p-3 text-xs dark:bg-gray-800">
										{`::view-transition-old(zoom-out) {
  animation: 350ms ease-out zoom-out;
}

::view-transition-new(zoom-in) {
  animation: 350ms cubic-bezier(0.34, 1.56, 0.64, 1) zoom-in;
}`}
									</pre>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Demo Cards */}
					<div className="grid gap-4 md:grid-cols-2">
						<Card className="border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
							<CardHeader>
								<CardTitle className="text-white">Outgoing Content</CardTitle>
							</CardHeader>
							<CardContent>
								<p>Scales up to 120% while fading out</p>
							</CardContent>
						</Card>

						<Card className="border-0 bg-gradient-to-br from-pink-500 to-pink-600 text-white">
							<CardHeader>
								<CardTitle className="text-white">Incoming Content</CardTitle>
							</CardHeader>
							<CardContent>
								<p>Scales from 80% with elastic bounce</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}

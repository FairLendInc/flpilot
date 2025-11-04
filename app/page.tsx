import { TwoLevelNav } from "@/components/navigation/two-level-nav";

export default function Home() {
	return (
		<div className="min-h-screen">
			<TwoLevelNav
				breadcrumbs={[
					{ label: "Home", href: "/" },
					{ label: "Listings", href: "/listings" },
					{ label: "Listing Details" },
				]}
			/>

			{/* Main Content */}
			<main className="px-6 py-12 pt-[104px]">
				<div className="mx-auto max-w-7xl">
					<h1 className="mb-4 text-balance font-bold text-4xl">
						Welcome to FairLend
					</h1>
					<p className="max-w-2xl text-pretty text-lg text-muted-foreground">
						Experience our professional two-level navigation system inspired by
						Vercel's design. Try the search with{" "}
						<kbd className="rounded bg-muted px-2 py-1 text-xs">⌘K</kbd> or
						click through the navigation tabs to see the tubelight effect in
						action.
					</p>

					<div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{[1, 2, 3, 4, 5, 6].map((i) => (
							<div
								className="rounded-lg border border-border bg-card p-6 transition-colors hover:bg-accent/50"
								key={i}
							>
								<h3 className="mb-2 font-semibold text-lg">Feature {i}</h3>
								<p className="text-muted-foreground text-sm">
									Explore the capabilities of our lending platform with this
									demo card.
								</p>
							</div>
						))}
					</div>
				</div>
			</main>
		</div>
	);
}

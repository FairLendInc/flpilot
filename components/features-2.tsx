import { Settings2, Sparkles, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { GradientHeading } from "@/components/ui/gradient-heading";

export default function Features() {
	return (
		<section className="py-16 md:py-32">
			<div className="@container mx-auto max-w-5xl px-6">
				<div className="text-center">
					<GradientHeading
						className="text-balance font-semibold text-4xl lg:text-5xl"
						size="xxl"
						variant="default"
						weight="black"
					>
						The industry is stuck in the 90s
					</GradientHeading>
					<p className="mt-4">
						Libero sapiente aliquam quibusdam aspernatur, praesentium iusto
						repellendus.
					</p>
				</div>
				<div className="mx-auto mt-8 grid @min-4xl:max-w-full max-w-sm @min-4xl:grid-cols-3 gap-6 [--color-background:var(--color-muted)] [--color-card:var(--color-muted)] *:text-center md:mt-16 dark:[--color-muted:var(--color-zinc-900)]">
					<Card className="group border-0 shadow-none">
						<CardHeader className="pb-3">
							<CardDecorator>
								<Zap aria-hidden className="size-6" />
							</CardDecorator>

							<h3 className="mt-6 font-medium">Customizable</h3>
						</CardHeader>

						<CardContent>
							<p className="text-sm">
								Extensive customization options, allowing you to tailor every
								aspect to meet your specific needs.
							</p>
						</CardContent>
					</Card>

					<Card className="group border-0 shadow-none">
						<CardHeader className="pb-3">
							<CardDecorator>
								<Settings2 aria-hidden className="size-6" />
							</CardDecorator>

							<h3 className="mt-6 font-medium">You have full control</h3>
						</CardHeader>

						<CardContent>
							<p className="mt-3 text-sm">
								From design elements to functionality, you have complete control
								to create a unique and personalized experience.
							</p>
						</CardContent>
					</Card>

					<Card className="group border-0 shadow-none">
						<CardHeader className="pb-3">
							<CardDecorator>
								<Sparkles aria-hidden className="size-6" />
							</CardDecorator>

							<h3 className="mt-6 font-medium">Powered By AI</h3>
						</CardHeader>

						<CardContent>
							<p className="mt-3 text-sm">
								Elements to functionality, you have complete control to create a
								unique experience.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
	<div className="mask-radial-from-40% mask-radial-to-60% relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-zinc-950)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-zinc-950)20%,transparent)] dark:[--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)] dark:group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)]">
		<div
			aria-hidden
			className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px] dark:opacity-50"
		/>

		<div className="absolute inset-0 m-auto flex size-12 items-center justify-center border-t border-l bg-background">
			{children}
		</div>
	</div>
);

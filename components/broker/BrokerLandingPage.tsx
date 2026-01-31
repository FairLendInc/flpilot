"use client";

import { ArrowRight, Building2, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Id } from "@/convex/_generated/dataModel";

type BrokerLandingPageProps = {
	broker: {
		_id: Id<"brokers">;
		brandName: string;
		subdomain: string;
		customDomain?: string;
		branding: {
			logoStorageId?: Id<"_storage">;
			primaryColor?: string;
			secondaryColor?: string;
		};
		contactEmail?: string;
		contactPhone?: string;
	};
	brokerCode?: string;
};

export function BrokerLandingPage({
	broker,
	brokerCode,
}: BrokerLandingPageProps) {
	const primaryColor = broker.branding.primaryColor || "#0F172A";
	const secondaryColor = broker.branding.secondaryColor || "#3B82F6";

	const signUpUrl = brokerCode
		? `/onboarding?brokerCode=${encodeURIComponent(brokerCode)}`
		: "/onboarding";

	return (
		<div className="flex min-h-screen flex-col">
			{/* Header */}
			<header
				className="border-b px-4 py-4"
				style={{ borderColor: `${primaryColor}20` }}
			>
				<div className="mx-auto flex max-w-6xl items-center justify-between">
					<div className="flex items-center gap-2">
						<div
							className="flex size-10 items-center justify-center rounded-lg"
							style={{ backgroundColor: `${primaryColor}15` }}
						>
							<Building2 className="size-5" style={{ color: primaryColor }} />
						</div>
						<span
							className="font-semibold text-xl"
							style={{ color: primaryColor }}
						>
							{broker.brandName}
						</span>
					</div>
					<div className="flex items-center gap-3">
						<Link href="/sign-in">
							<Button variant="ghost">Sign In</Button>
						</Link>
						<Link href={signUpUrl}>
							<Button
								style={{
									backgroundColor: secondaryColor,
									borderColor: secondaryColor,
								}}
							>
								Sign Up
								<ArrowRight className="ml-2 size-4" />
							</Button>
						</Link>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<main className="flex-1">
				<section
					className="px-4 py-20"
					style={{
						background: `linear-gradient(135deg, ${primaryColor}05 0%, ${secondaryColor}08 100%)`,
					}}
				>
					<div className="mx-auto max-w-4xl text-center">
						<h1
							className="mb-6 font-bold text-4xl tracking-tight md:text-6xl"
							style={{ color: primaryColor }}
						>
							Invest in Premium Mortgages
						</h1>
						<p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
							Join {broker.brandName} on FairLend to access curated mortgage
							investment opportunities. Build your portfolio with confidence.
						</p>
						<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
							<Link href={signUpUrl}>
								<Button
									className="px-8"
									size="lg"
									style={{
										backgroundColor: secondaryColor,
										borderColor: secondaryColor,
									}}
								>
									Get Started
									<ArrowRight className="ml-2 size-5" />
								</Button>
							</Link>
							<Link href="/sign-in">
								<Button className="px-8" size="lg" variant="outline">
									Sign In
								</Button>
							</Link>
						</div>
					</div>
				</section>

				{/* Features Section */}
				<section className="px-4 py-16">
					<div className="mx-auto max-w-6xl">
						<div className="grid gap-8 md:grid-cols-3">
							<div className="rounded-lg border p-6">
								<div
									className="mb-4 flex size-12 items-center justify-center rounded-lg"
									style={{ backgroundColor: `${secondaryColor}15` }}
								>
									<Building2
										className="size-6"
										style={{ color: secondaryColor }}
									/>
								</div>
								<h3 className="mb-2 font-semibold">Curated Listings</h3>
								<p className="text-muted-foreground text-sm">
									Access pre-vetted mortgage investment opportunities matched to
									your criteria.
								</p>
							</div>
							<div className="rounded-lg border p-6">
								<div
									className="mb-4 flex size-12 items-center justify-center rounded-lg"
									style={{ backgroundColor: `${secondaryColor}15` }}
								>
									<Mail className="size-6" style={{ color: secondaryColor }} />
								</div>
								<h3 className="mb-2 font-semibold">Expert Support</h3>
								<p className="text-muted-foreground text-sm">
									Work directly with {broker.brandName} for personalized
									guidance and support.
								</p>
							</div>
							<div className="rounded-lg border p-6">
								<div
									className="mb-4 flex size-12 items-center justify-center rounded-lg"
									style={{ backgroundColor: `${secondaryColor}15` }}
								>
									<Phone className="size-6" style={{ color: secondaryColor }} />
								</div>
								<h3 className="mb-2 font-semibold">Transparent Process</h3>
								<p className="text-muted-foreground text-sm">
									Clear documentation, straightforward terms, and full
									visibility into your investments.
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Contact Section */}
				<section
					className="border-t px-4 py-12"
					style={{ borderColor: `${primaryColor}10` }}
				>
					<div className="mx-auto max-w-4xl text-center">
						<h2
							className="mb-4 font-semibold text-2xl"
							style={{ color: primaryColor }}
						>
							Questions?
						</h2>
						<p className="mb-6 text-muted-foreground">
							Reach out to {broker.brandName} directly for more information.
						</p>
						<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
							{broker.contactEmail && (
								<a
									className="flex items-center gap-2 text-sm hover:underline"
									href={`mailto:${broker.contactEmail}`}
									style={{ color: secondaryColor }}
								>
									<Mail className="size-4" />
									{broker.contactEmail}
								</a>
							)}
							{broker.contactPhone && (
								<a
									className="flex items-center gap-2 text-sm hover:underline"
									href={`tel:${broker.contactPhone}`}
									style={{ color: secondaryColor }}
								>
									<Phone className="size-4" />
									{broker.contactPhone}
								</a>
							)}
						</div>
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer
				className="border-t px-4 py-6"
				style={{ borderColor: `${primaryColor}10` }}
			>
				<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
					<p className="text-muted-foreground text-sm">
						© {new Date().getFullYear()} {broker.brandName}. All rights
						reserved.
					</p>
					<p className="text-muted-foreground text-xs">
						Powered by{" "}
						<a
							className="hover:underline"
							href="https://fairlend.ca"
							style={{ color: secondaryColor }}
						>
							FairLend
						</a>
					</p>
				</div>
			</footer>
		</div>
	);
}

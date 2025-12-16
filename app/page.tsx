import {
	Activity,
	ArrowRight,
	BarChart3,
	CheckCircle2,
	Coins,
	FileText,
	PieChart,
	RotateCw,
	ShieldCheck,
	TrendingUp,
	Wallet,
	XCircle,
} from "lucide-react";
import { Hero } from "@/components/landingpage/components/hero";
import Team from "@/components/landingpage/components/team";
import {
	WaitlistLinkTrigger,
	WaitlistTextTrigger,
	WaitlistTrigger,
} from "@/components/landingpage/components/waitlist-trigger";
import { LandingPageWrapper } from "@/components/landingpage/landing-wrapper";

export default function Home() {
	return (
		<LandingPageWrapper>
			{/* <LandingNavbar /> - Moved inside wrapper */}
			<Hero />

			{/* 2. How the FairLend MIC Works */}
			<section className="relative z-40 bg-background px-6 py-24 md:px-12 lg:px-24">
				<div className="mx-auto max-w-6xl space-y-16">
					<div className="mx-auto max-w-3xl space-y-6 text-center">
						<h2 className="font-bold text-3xl text-foreground tracking-tight md:text-5xl">
							How the FairLend MIC Works
						</h2>
						<p className="text-lg text-muted-foreground leading-relaxed md:text-xl">
							The FairLend MIC is a pooled vehicle that provides short-term
							funding for private, interest-only mortgages. Instead of holding
							mortgages for years, the MIC funds them for a few days, earns fees
							and interest, then sells them to long-term buyers on the FairLend
							marketplace.
						</p>
						<p className="text-lg text-muted-foreground leading-relaxed md:text-xl">
							When you invest, you don’t pick individual mortgages. You own
							units in the entire MIC pool. Your share of returns is
							proportional to your share of the pool.
						</p>
					</div>

					<div className="relative grid gap-8 md:grid-cols-3">
						{/* Connecting line for desktop */}
						<div className="-z-10 absolute top-12 right-0 left-0 hidden h-0.5 bg-linear-to-r from-emerald-100 via-emerald-500 to-emerald-100 opacity-30 md:block" />

						{[
							{
								icon: Wallet,
								title: "1. You contribute capital",
								description:
									"Your funds enter the MIC pool at the start of the next accrual period. In return, you receive MIC units representing your share of the pool.",
							},
							{
								icon: RotateCw,
								title: "2. The MIC funds & spins mortgages",
								description:
									"The MIC uses the pool to fund short-term mortgages, earns a lending fee and a few days of interest, then offloads the mortgages to 3rd-party investors who hold them long-term.",
							},
							{
								icon: Coins,
								title: "3. Capital returns & is redeployed",
								description:
									"Once the mortgage is sold, the MIC gets the full principal back, plus its fee and short-term interest. That same capital is immediately available to fund the next mortgage and repeat the cycle.",
							},
						].map((step) => (
							<div
								className="relative z-10 rounded-2xl border border-border/50 bg-card p-8 shadow-sm transition-shadow hover:shadow-md"
								key={step.title}
							>
								<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 md:mx-0 dark:bg-emerald-900/20">
									<step.icon className="size-8 text-emerald-600 dark:text-emerald-400" />
								</div>
								<h3 className="mb-4 font-bold text-xl">{step.title}</h3>
								<p className="text-muted-foreground leading-relaxed">
									{step.description}
								</p>
							</div>
						))}
					</div>

					<div className="pt-8 text-center">
						<WaitlistTextTrigger className="inline-flex cursor-pointer items-center font-semibold text-emerald-600 text-lg transition-colors hover:text-emerald-700 hover:underline">
							Ready to see your capital spin instead of sit? Join the MIC
							Waiting List <ArrowRight className="ml-2 size-5" />
						</WaitlistTextTrigger>
					</div>
				</div>
			</section>

			{/* 3. The Spin Model */}
			<section className="bg-muted/30 px-6 py-24 md:px-12 lg:px-24">
				<div className="mx-auto grid max-w-6xl items-start gap-16 lg:grid-cols-2">
					<div className="space-y-8">
						<div>
							<h2 className="mb-6 font-bold text-3xl tracking-tight md:text-5xl">
								The Spin Model: Short-Term Lender, Long-Term Buyers
							</h2>
							<p className="font-medium text-2xl text-emerald-700 dark:text-emerald-400">
								We fund the mortgage. We earn the fee. Long-term risk goes to
								3rd-party investors.
							</p>
						</div>

						<div className="space-y-6">
							<h3 className="font-bold text-muted-foreground text-xl uppercase tracking-wider">
								What the spin model actually is
							</h3>
							<p className="text-lg leading-relaxed">
								In the FairLend MIC, your capital behaves like a short-term
								warehouse line:
							</p>
							<ul className="space-y-4">
								<li className="flex gap-3">
									<CheckCircle2 className="size-6 shrink-0 text-emerald-500" />
									<span>The MIC funds a mortgage from the pool.</span>
								</li>
								<li className="flex gap-3">
									<CheckCircle2 className="size-6 shrink-0 text-emerald-500" />
									<span>
										The MIC holds it for a <strong>few days</strong> (typically
										1–3).
									</span>
								</li>
								<li className="flex gap-3">
									<CheckCircle2 className="size-6 shrink-0 text-emerald-500" />
									<div className="space-y-2">
										<span>During that short window, the MIC earns:</span>
										<ul className="list-inside list-disc space-y-1 pl-4 text-muted-foreground">
											<li>
												A <strong>1% lending fee</strong> on the loan amount,
												split 0.5% to FairLend and{" "}
												<strong>0.5% directly to the MIC</strong>, and
											</li>
											<li>A small amount of interest for those days.</li>
										</ul>
									</div>
								</li>
								<li className="flex gap-3">
									<CheckCircle2 className="size-6 shrink-0 text-emerald-500" />
									<span>
										The mortgage is then{" "}
										<strong>offloaded to 3rd-party investors</strong>
									</span>
								</li>
								<li className="flex gap-3">
									<CheckCircle2 className="size-6 shrink-0 text-emerald-500" />
									<span>
										The MIC gets its <strong>full principal back</strong>, plus
										its share of the lending fee and short-term interest.
									</span>
								</li>
								<li className="flex gap-3">
									<CheckCircle2 className="size-6 shrink-0 text-emerald-500" />
									<span>
										That principal is immediately ready to be deployed again
										into the next deal.
									</span>
								</li>
							</ul>
							<p className="border-emerald-500 border-l-4 bg-emerald-50/50 py-2 pl-4 text-lg text-muted-foreground italic dark:bg-emerald-900/10">
								Over time, the same dollar can spin through many mortgages,
								stacking fee events while keeping each individual exposure
								window short.
							</p>
						</div>
					</div>

					<div className="space-y-8 rounded-3xl border bg-card p-8 shadow-lg">
						<h3 className="font-bold text-muted-foreground text-xl uppercase tracking-wider">
							Why it’s attractive for MIC investors
						</h3>
						<p className="text-lg leading-relaxed">
							In the ideal spin environment, most of your return comes from
							lending fees and high capital turnover, not from sitting in
							long-dated loans.
						</p>

						<div className="space-y-6">
							<div className="space-y-2">
								<div className="flex items-center gap-3 font-bold text-emerald-700 text-lg dark:text-emerald-400">
									<ShieldCheck className="size-6" />
									Short-term exposure, reduced default window
								</div>
								<p className="pl-9 text-muted-foreground">
									Your capital is in a mortgage for days, not years. The
									long-term default and duration risk is primarily taken by
									3rd-party investors who buy the mortgage from the MIC.
								</p>
							</div>

							<div className="space-y-2">
								<div className="flex items-center gap-3 font-bold text-emerald-700 text-lg dark:text-emerald-400">
									<TrendingUp className="size-6" />
									Fee-driven returns
								</div>
								<p className="pl-9 text-muted-foreground">
									While you do earn interest during the MIC’s holding period,{" "}
									<strong>
										the majority of the economic upside comes from the lending
										fee
									</strong>
									. You’re effectively a short-term lender who repeatedly earns
									a fee, gets principal back, and redeploys.
								</p>
							</div>

							<div className="space-y-2">
								<div className="flex items-center gap-3 font-bold text-emerald-700 text-lg dark:text-emerald-400">
									<RotateCw className="size-6" />
									Capital that actually moves
								</div>
								<p className="pl-9 text-muted-foreground">
									Instead of idle cash waiting for “the right deal”, the MIC is
									designed to keep capital cycling through a continuous flow of
									mortgages.
								</p>
							</div>
						</div>

						<div className="border-border border-t pt-6">
							<p className="mb-6 text-muted-foreground text-sm italic">
								The spin model is not theory. It’s designed by Eli Solborano, a
								veteran broker with over $2B in funded mortgage volume and a
								30-year track record, and implemented by a technical team that
								previously shipped RBC Capital Markets systems and RBC’s digital
								banking applications.
							</p>
							<WaitlistTrigger
								className="w-full rounded-xl bg-emerald-600 py-6 font-bold text-lg text-white shadow-md transition-all hover:scale-[1.02] hover:bg-emerald-700"
								size="lg"
							>
								Get on the Waiting List <ArrowRight className="ml-2 size-5" />
							</WaitlistTrigger>
							<p className="mt-3 text-center text-muted-foreground text-xs">
								Want to be in the first cohort of spin-model MIC investors?
							</p>
						</div>
					</div>
				</div>
			</section>

			<Team />

			<section className="relative overflow-hidden bg-slate-950 px-6 py-24 text-white md:px-12 lg:px-24">
				<div className="-translate-y-1/2 absolute top-0 right-0 h-[500px] w-[500px] translate-x-1/2 rounded-full bg-emerald-500/10 blur-[100px]" />
				<div className="-translate-x-1/2 absolute bottom-0 left-0 h-[500px] w-[500px] translate-y-1/2 rounded-full bg-blue-500/10 blur-[100px]" />

				<div className="relative z-10 mx-auto max-w-6xl space-y-16">
					<div className="space-y-6 text-center">
						<h2 className="font-bold text-3xl tracking-tight md:text-5xl">
							What You See as a MIC Investor
						</h2>
						<p className="mx-auto max-w-3xl text-slate-300 text-xl">
							You won’t be guessing where your money is. The MIC runs on a
							dedicated ledger, designed by an ex–RBC engineering team, and you
							get a dashboard built for serious investors with deal-level
							visibility.
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
						<div className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10">
							<PieChart className="mb-4 size-8 text-emerald-400" />
							<h3 className="mb-3 font-bold text-lg">Pool overview</h3>
							<ul className="space-y-2 text-slate-300 text-sm">
								<li>• Total MIC pool size (AUM)</li>
								<li>• Your MIC units & % ownership</li>
								<li>• Estimated stake value</li>
							</ul>
						</div>

						<div className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10">
							<FileText className="mb-4 size-8 text-emerald-400" />
							<h3 className="mb-3 font-bold text-lg">Properties & deal flow</h3>
							<ul className="space-y-2 text-slate-300 text-sm">
								<li>• Live funded properties</li>
								<li>• Mortgages being offloaded</li>
								<li>• Completed spins</li>
								<li>• Principal, rate, hold days, fees</li>
							</ul>
						</div>

						<div className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10">
							<Activity className="mb-4 size-8 text-emerald-400" />
							<h3 className="mb-3 font-bold text-lg">Capital deployment</h3>
							<ul className="space-y-2 text-slate-300 text-sm">
								<li>• Time to first deployment</li>
								<li>• Redeployment speed</li>
								<li>• % deployed vs cash</li>
								<li>• Average hold period</li>
							</ul>
						</div>

						<div className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10">
							<BarChart3 className="mb-4 size-8 text-emerald-400" />
							<h3 className="mb-3 font-bold text-lg">Performance breakdown</h3>
							<ul className="space-y-2 text-slate-300 text-sm">
								<li>• Interest vs fee contribution</li>
								<li>• Gross vs Net return</li>
								<li>• Historical trends</li>
							</ul>
						</div>
					</div>

					<div className="pt-8 text-center">
						<WaitlistLinkTrigger className="inline-flex items-center font-semibold text-emerald-400 text-lg transition-colors hover:text-emerald-300 hover:underline">
							Want this level of visibility on your mortgage exposure? Join the
							MIC Waiting List <ArrowRight className="ml-2 size-5" />
						</WaitlistLinkTrigger>
					</div>
				</div>
			</section>

			{/* 6. Who This Is For */}
			<section className="bg-muted/50 px-6 py-24 md:px-12 lg:px-24">
				<div className="mx-auto max-w-5xl space-y-16">
					<div className="text-center">
						<h2 className="font-bold text-3xl tracking-tight md:text-5xl">
							Who the FairLend MIC Is For
						</h2>
					</div>

					<div className="grid gap-8 md:grid-cols-2 lg:gap-16">
						<div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm dark:border-emerald-900 dark:bg-card">
							<div className="absolute top-0 left-0 h-2 w-full bg-emerald-500" />
							<h3 className="mb-6 flex items-center gap-3 font-bold text-2xl">
								<CheckCircle2 className="size-8 text-emerald-500" />A good fit
								if...
							</h3>
							<p className="mb-6 text-muted-foreground">
								You’re likely a good fit if:
							</p>
							<ul className="space-y-4">
								{[
									"You want short-term exposure to private mortgages rather than multi-year holds.",
									"You care about data, auditability, and transparency, not just headline yield.",
									"You understand that returns are driven by lending fees and capital turnover, not just interest.",
									"You value a MIC operated by a top 1% Canadian broker and built by a team with RBC Capital Markets / RBC Digital experience.",
									"You’re comfortable with a limited-capacity vehicle where once we hit our cap, new investors are turned away.",
								].map((item) => (
									<li className="flex items-start gap-3" key={item}>
										<CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
										<span>{item}</span>
									</li>
								))}
							</ul>
						</div>

						<div className="relative overflow-hidden rounded-3xl border border-border bg-white p-8 opacity-90 shadow-sm dark:bg-card">
							<div className="absolute top-0 left-0 h-2 w-full bg-slate-300 dark:bg-slate-700" />
							<h3 className="mb-6 flex items-center gap-3 font-bold text-2xl text-muted-foreground">
								<XCircle className="size-8" />
								Probably not a fit if...
							</h3>
							<p className="mb-6 text-muted-foreground">
								This may not be for you if:
							</p>
							<ul className="space-y-4 text-muted-foreground">
								{[
									"You want to pick individual mortgages yourself and hold them to maturity.",
									"You’re looking for a simple “set and forget” product with minimal reporting.",
									"You’re uncomfortable with a more active, spin-driven strategy.",
									"You need guaranteed liquidity on demand (MIC redemptions are always subject to terms and market conditions).",
								].map((item) => (
									<li className="flex items-start gap-3" key={item}>
										<div className="mt-2.5 size-1.5 shrink-0 rounded-full bg-slate-300 dark:bg-slate-700" />
										<span>{item}</span>
									</li>
								))}
							</ul>
						</div>
					</div>

					<div className="pt-8 text-center">
						<WaitlistTextTrigger className="inline-flex cursor-pointer items-center font-medium text-lg text-muted-foreground transition-colors hover:text-foreground hover:underline">
							If this sounds like the right side of private credit for you,
							reserve your spot on the MIC Waiting List{" "}
							<ArrowRight className="ml-2 size-5" />
						</WaitlistTextTrigger>
					</div>
				</div>
			</section>

			{/* 7. Limited Spots & Waiting List */}
			<section
				className="relative overflow-hidden bg-emerald-900 px-6 py-24 text-white md:px-12 lg:px-24"
				id="waitlist"
			>
				<div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay" />
				<div className="relative z-10 mx-auto max-w-4xl space-y-10 text-center">
					<div className="space-y-6">
						<span className="inline-block rounded-full border border-emerald-700 bg-emerald-800 px-4 py-1.5 font-semibold text-emerald-200 text-sm uppercase tracking-wide">
							Capacity Warning
						</span>
						<h2 className="font-bold text-4xl tracking-tight md:text-6xl">
							Limited MIC Capacity.
							<br />
							Waiting List Only.
						</h2>
					</div>

					<div className="mx-auto max-w-3xl space-y-6 text-emerald-100 text-xl leading-relaxed">
						<p>
							We are deliberately capping the total capital in the FairLend MIC
							to keep the spin engine efficient, disciplined, and directly
							overseen by Eli Solborano and our ex–RBC engineering team. Once we
							reach that cap, we will close the MIC to new investors.
						</p>
						<p>
							Right now, we’re accepting waiting list registrations only.
							Joining the waiting list does not commit you to invest, but it
							does lock in your place in line.
						</p>
					</div>

					<div className="mx-auto max-w-2xl rounded-2xl border border-white/20 bg-white/10 p-8 text-left backdrop-blur-sm">
						<h3 className="mb-4 font-bold text-emerald-50 text-xl">
							What you get by joining the waiting list:
						</h3>
						<ul className="space-y-3">
							{[
								"Priority invite when the MIC opens to new capital",
								"Early access to detailed MIC documentation and performance simulations",
								"The option to participate in the first live spin cohorts before we hit the cap",
							].map((item) => (
								<li className="flex items-start gap-3" key={item}>
									<CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" />
									<span>{item}</span>
								</li>
							))}
						</ul>
					</div>

					<div className="space-y-4">
						<WaitlistTrigger
							className="rounded-full bg-white px-12 py-8 font-bold text-emerald-900 text-xl shadow-2xl transition-transform hover:scale-105 hover:bg-emerald-50"
							size="lg"
						>
							Join the MIC Waiting List
						</WaitlistTrigger>
						<p className="text-emerald-200/80 text-sm">
							No obligation. We’ll contact you with full details before you
							commit any capital.
						</p>
					</div>
				</div>
			</section>

			{/* 8. FAQ */}
			<section className="bg-background px-6 py-24 md:px-12 lg:px-24">
				<div className="mx-auto max-w-3xl space-y-16">
					<div className="text-center">
						<h2 className="font-bold text-3xl tracking-tight md:text-5xl">
							Frequently Asked Questions
						</h2>
					</div>

					<div className="space-y-8">
						{[
							{
								q: "Who is actually running this MIC?",
								a: "The MIC is led by Eli Solborano, a top 1% mortgage broker in Canada with over $2B in funded mortgage volume over a 30-year career. Eli has been hired by Scotiabank at $2,000/hour to consult on their mortgage products. The infrastructure and dashboards are built by a technical team that previously worked at RBC Capital Markets and RBC Digital on banking infrastructure and mobile applications.",
							},
							{
								q: "Is my capital locked up for years like a traditional MIC?",
								a: "No. The FairLend MIC is designed around short-term deployments. Mortgages are typically held for a few days before being offloaded to 3rd-party investors. That said, all MICs, including ours, have redemption terms and constraints — this is not an on-demand savings account.",
							},
							{
								q: "Where does most of my return actually come from?",
								a: "In the ideal spin setup, most of your return comes from lending fees and capital turnover. You do earn interest during the MIC’s holding period, but the dominant driver is the 0.5% lending fee slice on each funded mortgage, repeated as capital spins through multiple deals.",
							},
							{
								q: "Who takes the long-term mortgage risk?",
								a: "The MIC typically holds a mortgage only until it’s sold on the FairLend marketplace. After that, 3rd-party investors become the long-term holders and take on most of the default and duration risk. The MIC’s risk window is primarily the short period between funding and offload.",
							},
							{
								q: "How transparent is this? Will I see individual deals?",
								a: "Yes. MIC investors get a dashboard with deal-level data: every property the MIC touches, days held, fees earned, time to redeploy, and pool-level metrics like capital utilization and performance breakdowns.",
							},
							{
								q: "What happens if the MIC fills up?",
								a: "Once we reach our capital cap, we will stop accepting new MIC investors. At that point, only waiting list investors may be invited if existing commitments move or the cap is revised. Joining the waiting list now is the only way to guarantee you’re in the first cohort.",
							},
							{
								q: "Does joining the waiting list mean I’m committed to invest?",
								a: "No. Joining the waiting list simply reserves your spot in line. You’ll get full documentation and the chance to review the MIC in detail before making any commitment.",
							},
						].map((faq) => (
							<div className="border-border border-b pb-8" key={faq.q}>
								<h3 className="mb-3 font-bold text-lg">{faq.q}</h3>
								<p className="text-muted-foreground leading-relaxed">{faq.a}</p>
							</div>
						))}
					</div>

					<div className="pt-8 text-center">
						<WaitlistTextTrigger className="inline-flex cursor-pointer items-center font-bold text-lg text-primary hover:underline">
							Still have questions? The first step is securing your spot. Join
							the MIC Waiting List <ArrowRight className="ml-2 size-5" />
						</WaitlistTextTrigger>
					</div>
				</div>
			</section>

			<footer className="border-border border-t px-6 py-12 text-center text-muted-foreground text-sm">
				<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
					<div>
						<span className="font-bold text-foreground">FairLend</span> © 2025
					</div>
					<div className="flex gap-6">
						<a className="hover:text-foreground" href="/privacy">
							Privacy Policy
						</a>
						<a className="hover:text-foreground" href="/terms">
							Terms of Service
						</a>
						<a className="hover:text-foreground" href="/contact">
							Contact
						</a>
					</div>
				</div>
			</footer>
		</LandingPageWrapper>
	);
}

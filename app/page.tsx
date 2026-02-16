import {
	ArrowRight,
	BarChart3,
	CheckCircle2,
	Clock,
	Code2,
	Cpu,
	DollarSign,
	Eye,
	FileText,
	Filter,
	Gavel,
	HardHat,
	Heart,
	Home as HomeIcon,
	Leaf,
	Percent,
	Repeat,
	Scale,
	Search,
	Settings2,
	Shield,
	Target,
	TrendingDown,
	TrendingUp,
	Users,
	XCircle,
} from "lucide-react";
import { Hero } from "@/components/landingpage/components/hero";
import { WaitlistTrigger } from "@/components/landingpage/components/waitlist-trigger";
import { LandingPageWrapper } from "@/components/landingpage/landing-wrapper";

export default function Home() {
	return (
		<LandingPageWrapper>
			<Hero />

			{/* Section 2: The Management Team — Credentials, Expertise & Market Foresight */}
			<section className="relative z-40 bg-background px-6 py-24 md:px-12 lg:px-24">
				<div className="mx-auto max-w-6xl space-y-16">
					{/* Credibility Bar */}
					<div className="grid grid-cols-2 gap-6 md:grid-cols-4">
						{[
							{ value: "90%", label: "Deal rejection rate" },
							{
								value: "~30 Yrs",
								label: "Of compounding mortgage expertise",
							},
							{
								value: "100%",
								label: "Capital recovery in contested defaults",
							},
							{
								value: "$2B+",
								label: "In deals arranged by the founder",
							},
						].map((stat) => (
							<div
								className="rounded-2xl border border-border/50 bg-card p-6 text-center shadow-sm"
								key={stat.label}
							>
								<div className="mb-2 font-bold text-3xl text-emerald-600 md:text-4xl">
									{stat.value}
								</div>
								<div className="text-muted-foreground text-sm leading-snug">
									{stat.label}
								</div>
							</div>
						))}
					</div>

					{/* Elie Soberano — Founder & Portfolio Manager */}
					<div className="mx-auto max-w-4xl space-y-8">
						<div className="space-y-4 text-center">
							<h2 className="font-bold text-3xl text-foreground tracking-tight md:text-5xl">
								The Management Team
							</h2>
							<p className="text-lg text-muted-foreground md:text-xl">
								Credentials, expertise &amp; market foresight
							</p>
						</div>

						<div className="space-y-6">
							<h3 className="font-bold text-2xl">
								Elie Soberano — Founder &amp; Portfolio Manager
							</h3>
							<p className="text-lg text-muted-foreground leading-relaxed">
								Top 1% mortgage broker in Canada by volume. $2B+ in deals
								arranged over a near-30-year career. First broker at Mortgage
								Intelligence, Canada&apos;s largest brokerage. Scotiabank
								retains him at $2,000/hour to consult on mortgage product
								strategy.
							</p>
							<p className="text-lg text-muted-foreground leading-relaxed">
								Elie has personally built 20+ custom homes and completed 50-60+
								renovations. This dual expertise — lender and builder — is the
								foundation of both engines of return. For the capital cycle, his
								nearly three decades of industry relationships produced the
								distribution channels that allow FairLend to sell conservatively
								underwritten mortgages within 60 days, consistently and at
								scale. For the multiplex construction program, he walks every
								site, evaluates every builder, and catches construction problems
								that no spreadsheet can detect. Most MIC managers have deep
								lending expertise or deep construction expertise. Almost none
								have both. This is the capability moat that makes
								FairLend&apos;s model possible.
							</p>
							<p className="text-lg text-muted-foreground leading-relaxed">
								Elie&apos;s network — contractors, project managers, specialized
								trades, industry contacts built over nearly 30 years — is the
								operational backbone of the construction lending program. When a
								build goes off track, FairLend doesn&apos;t file paperwork and
								wait. The team deploys the right people to get the project back
								on course, because they know who to call and those people pick
								up the phone.
							</p>
						</div>
					</div>

					{/* The Team Behind the Engines */}
					<div className="mx-auto max-w-5xl space-y-8">
						<h3 className="text-center font-bold text-muted-foreground text-xl uppercase tracking-wider">
							The Team Behind the Engines
						</h3>
						<div className="grid gap-8 md:grid-cols-3">
							{[
								{
									icon: Code2,
									title: "Fintech & Quantitative Team",
									description:
										"Led by former RBC Capital Markets quant analysts and software engineers. This team built FairLend's AI-powered fraud detection, borrower scoring models, portfolio monitoring systems, and the real-time investor portal. Institutional-grade financial technology, built from the ground up — not a third-party dashboard with a logo on it.",
								},
								{
									icon: Settings2,
									title: "Operations",
									description:
										"Led by the founders of Barton Engineering, a precision manufacturer operating in Ford's just-in-time supply chain — an environment where a single day's delay triggers millions in penalties. That manufacturing-grade discipline governs every FairLend process: document handling, compliance, investor reporting, capital deployment timelines, and construction draw verification.",
								},
								{
									icon: Gavel,
									title: "Legal & Default Response",
									description:
										"A dedicated, specialized team with a proven playbook for mortgage recovery, power of sale proceedings, and receivership strategy. This is not general-purpose legal counsel. It is a standing capability purpose-built for capital recovery.",
								},
							].map((team) => (
								<div
									className="rounded-2xl border border-border/50 bg-card p-8 shadow-sm"
									key={team.title}
								>
									<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
										<team.icon className="size-6 text-emerald-600 dark:text-emerald-400" />
									</div>
									<h4 className="mb-3 font-bold text-lg">{team.title}</h4>
									<p className="text-muted-foreground text-sm leading-relaxed">
										{team.description}
									</p>
								</div>
							))}
						</div>
					</div>

					{/* Market Foresight */}
					<div className="mx-auto max-w-4xl space-y-8">
						<h3 className="text-center font-bold text-muted-foreground text-xl uppercase tracking-wider">
							Market Foresight: A Track Record of Anticipating Shifts
						</h3>
						<div className="space-y-8">
							<div className="rounded-2xl border border-border/50 bg-card p-8 shadow-sm">
								<div className="mb-3 flex items-center gap-3">
									<TrendingDown className="size-6 text-emerald-600 dark:text-emerald-400" />
									<h4 className="font-bold text-lg">
										November 2016: Predicting the correction
									</h4>
								</div>
								<p className="text-muted-foreground leading-relaxed">
									At a national mortgage brokerage conference in Vancouver, Elie
									identified that incoming CMHC rule changes would trigger a
									market correction. He began repositioning 16 months before the
									April 2017 downturn — while most of the industry was still
									originating at the top.
								</p>
							</div>

							<div className="rounded-2xl border border-border/50 bg-card p-8 shadow-sm">
								<div className="mb-3 flex items-center gap-3">
									<HomeIcon className="size-6 text-emerald-600 dark:text-emerald-400" />
									<h4 className="font-bold text-lg">The Multiplex Pivot</h4>
								</div>
								<p className="text-muted-foreground leading-relaxed">
									While the broader market continued building single-family
									homes, Elie identified that government incentives —
									elimination of approximately $450K in development levies per
									5-plex, HST rebates, and CMHC MLI Select financing — had
									fundamentally changed the economics. FairLend pivoted to
									multiplex construction lending before the opportunity became
									crowded and margins compressed.
								</p>
							</div>

							<div className="rounded-2xl border border-border/50 bg-card p-8 shadow-sm">
								<div className="mb-3 flex items-center gap-3">
									<Repeat className="size-6 text-emerald-600 dark:text-emerald-400" />
									<h4 className="font-bold text-lg">
										A dynamic investment thesis — not a fixed playbook
									</h4>
								</div>
								<p className="text-muted-foreground leading-relaxed">
									What constitutes a &ldquo;good deal&rdquo; in private lending
									shifts constantly. Over the past three decades, Elie has
									watched condos go from highly conservative to nearly
									uninvestable in certain markets. Single-family builds went
									from the default play to an overcrowded, margin-compressed
									market. Managers who run a fixed playbook eventually get
									caught on the wrong side of a shift. FairLend&apos;s
									investment thesis evolves with the market because its
									leadership understands when the underlying math changes.
								</p>
							</div>
						</div>

						<p className="text-center text-lg text-muted-foreground italic">
							These are not lucky calls. They reflect a first-principles
							understanding of how capital flows through the lending system, how
							regulatory changes ripple through property valuations, and how
							lender behavior shifts in response.
						</p>
					</div>
				</div>
			</section>

			{/* Section 3: Problem / Pain — Three Failure Modes */}
			<section className="bg-muted/30 px-6 py-24 md:px-12 lg:px-24">
				<div className="mx-auto max-w-4xl space-y-12">
					<div className="space-y-4 text-center">
						<h2 className="font-bold text-3xl tracking-tight md:text-5xl">
							Three Ways MIC Investing Goes Wrong
						</h2>
						<p className="text-lg text-muted-foreground md:text-xl">
							Most investors have experienced all of them.
						</p>
					</div>

					<div className="space-y-8">
						{/* Failure Mode 1: The opaque manager */}
						<div className="rounded-2xl border border-border/50 bg-card p-8 shadow-sm">
							<div className="mb-4 flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
									<XCircle className="size-5 text-red-500" />
								</div>
								<h3 className="font-bold text-xl">
									The opaque, fee-extracting manager
								</h3>
							</div>
							<p className="text-muted-foreground leading-relaxed">
								You already know the first type. Opaque reporting. Fee
								structures that reward origination volume over loan quality.
								Returns that look good until the defaults start surfacing and
								management has already collected its fees. You&apos;ve either
								invested with one of these managers or you&apos;ve made a career
								of avoiding them.
							</p>
						</div>

						{/* Failure Mode 2: Market-rate returns */}
						<div className="rounded-2xl border border-border/50 bg-card p-8 shadow-sm">
							<div className="mb-4 flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20">
									<TrendingDown className="size-5 text-amber-500" />
								</div>
								<h3 className="font-bold text-xl">
									The trustworthy manager with market-rate returns
								</h3>
							</div>
							<p className="text-muted-foreground leading-relaxed">
								So you moved your capital to the second type: conservative,
								well-run MICs with disciplined underwriting and solid track
								records. The kind of manager you can trust. The problem is,
								their returns are pegged to the market. Conservative
								underwriting plus an originate-and-hold model produces
								conservative returns. You&apos;ve protected your capital, but
								you haven&apos;t put it to work.
							</p>
						</div>

						{/* Failure Mode 3: The capital-inflow trap */}
						<div className="rounded-2xl border border-border/50 bg-card p-8 shadow-sm">
							<div className="mb-4 flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/20">
									<TrendingUp className="size-5 text-orange-500" />
								</div>
								<h3 className="font-bold text-xl">The capital-inflow trap</h3>
							</div>
							<p className="text-muted-foreground leading-relaxed">
								Then there&apos;s the third type — and it&apos;s the most
								insidious because it starts as the second type. A conservative,
								well-run MIC builds a strong track record. Capital flows in.
								Then more capital flows in. Now the MIC has $500 million under
								management but only $300 million in quality loan opportunities.
								The pressure to deploy becomes the pressure to lower standards —
								because capital sitting in cash dilutes every investor&apos;s
								return, and diluted returns drive investors out. The MIC starts
								taking deals it would have declined two years ago. This is how
								managers with decades of success produce sudden, large losses.
								It&apos;s not incompetence. It&apos;s a structural failure built
								into the originate-and-hold model.
							</p>
						</div>
					</div>

					<div className="border-emerald-500 border-l-4 bg-emerald-50/50 p-6 dark:bg-emerald-900/10">
						<p className="text-lg leading-relaxed">
							<strong>
								FairLend is built to avoid all three failure modes.
							</strong>{" "}
							Two distinct engines generate above-market returns from the same
							conservative underwriting that the best traditional MICs use. And
							the marketplace structure that powers the capital cycle also gives
							FairLend control levers that no traditional MIC possesses — the
							ability to slow, pause, or reprice deployments when quality deal
							flow doesn&apos;t match available capital. The difference
							isn&apos;t the loan quality. It&apos;s the operating model.
						</p>
					</div>
				</div>
			</section>

			{/* Section 4: Two Engines of Above-Market Returns */}
			<section
				className="bg-background px-6 py-24 md:px-12 lg:px-24"
				id="engines"
			>
				<div className="mx-auto max-w-5xl space-y-24">
					<div className="space-y-4 text-center">
						<h2 className="font-bold text-3xl tracking-tight md:text-5xl">
							Two Engines of Above-Market Returns
						</h2>
					</div>

					{/* Engine 1: The Private Mortgage Capital Cycle */}
					<div className="space-y-12">
						<div className="space-y-4">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
									<Repeat className="size-5 text-emerald-600" />
								</div>
								<h3 className="font-bold text-2xl md:text-3xl">
									Engine 1 — Capital Velocity, Not Credit Risk
								</h3>
							</div>
							<p className="text-lg text-muted-foreground leading-relaxed">
								A traditional MIC originates a mortgage, holds it for 12-24
								months, and collects interest. The return is bounded by the
								interest rate on the loan minus operating costs. If the
								underwriting is conservative, the interest rate is moderate.
								Conservative underwriting and above-market returns are
								structurally incompatible in an originate-and-hold model.
							</p>
							<p className="font-semibold text-emerald-700 text-lg dark:text-emerald-400">
								FairLend&apos;s capital cycle breaks that constraint.
							</p>
						</div>

						{/* The 4 Steps */}
						<div className="grid gap-6 md:grid-cols-2">
							{[
								{
									step: "1",
									title: "Originate",
									description:
										"Investor capital is deployed into a vetted private mortgage. FairLend earns a 1% lending fee on origination. Every deal has passed a 90% rejection filter, double appraisals, conservative LTV limits, and multi-layered AI and human underwriting.",
								},
								{
									step: "2",
									title: "Hold (Maximum 60 Days)",
									description:
										"The mortgage remains on the books for a maximum of 2 months — not 12-24 months. Short duration means less exposure to market shifts, rate changes, and borrower deterioration. This is a risk reduction, not a risk increase.",
								},
								{
									step: "3",
									title: "Distribute",
									description:
										"Through institutional relationships and distribution channels built over nearly 30 years, FairLend sells the mortgage to qualified buyers. These channels didn't appear overnight — they are the product of decades of relationship building.",
								},
								{
									step: "4",
									title: "Redeploy",
									description:
										"That capital cycles back into the next vetted mortgage, earning another origination fee. The same dollar of invested capital generates multiple fee-earning cycles per year.",
								},
							].map((item) => (
								<div
									className="rounded-2xl border border-border/50 bg-card p-8 shadow-sm"
									key={item.step}
								>
									<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
										{item.step}
									</div>
									<h4 className="mb-3 font-bold text-lg">{item.title}</h4>
									<p className="text-muted-foreground text-sm leading-relaxed">
										{item.description}
									</p>
								</div>
							))}
						</div>

						{/* The Math */}
						<div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8 dark:border-emerald-800 dark:bg-emerald-900/10">
							<h4 className="mb-3 font-bold text-lg">The math</h4>
							<p className="text-muted-foreground leading-relaxed">
								A traditional MIC earns one return stream per dollar deployed.
								FairLend earns multiple origination fees per dollar per year, on
								mortgages underwritten to the same conservative standards. The
								outperformance comes from capital velocity — not from looser
								underwriting, higher LTVs, or riskier borrowers.
							</p>
						</div>

						{/* Marketplace Control Levers */}
						<div className="space-y-6">
							<h4 className="font-bold text-xl">
								The Control Levers: Why the Capital Cycle Also Reduces Risk
							</h4>
							<p className="text-muted-foreground leading-relaxed">
								The secondary marketplace that powers the capital cycle gives
								FairLend something no originate-and-hold MIC has: direct control
								over the pace of capital deployment. When quality deal flow
								slows, FairLend doesn&apos;t face the deploy-or-dilute pressure.
								Instead:
							</p>
							<div className="grid gap-4 md:grid-cols-3">
								{[
									{
										icon: Shield,
										title: "Slow or stop mortgage sales",
										description:
											"If quality new originations aren't keeping pace, FairLend holds existing positions rather than cycling capital into weaker deals.",
									},
									{
										icon: DollarSign,
										title: "Adjust marketplace pricing",
										description:
											"FairLend controls the pricing at which mortgages are offered to secondary market buyers. Raising prices slows the cycle deliberately.",
									},
									{
										icon: Users,
										title: "Limit capital acceptance",
										description:
											"FairLend accepts a limited amount of investor capital — sized to what can be deployed at the current quality standard.",
									},
								].map((lever) => (
									<div
										className="rounded-xl border border-border/50 bg-card p-6 shadow-sm"
										key={lever.title}
									>
										<lever.icon className="mb-3 size-6 text-emerald-600 dark:text-emerald-400" />
										<h5 className="mb-2 font-bold text-sm">{lever.title}</h5>
										<p className="text-muted-foreground text-sm leading-relaxed">
											{lever.description}
										</p>
									</div>
								))}
							</div>
							<p className="text-muted-foreground italic">
								The capital cycle runs at the pace of quality deal flow, not the
								pace of investor deposits. This is the structural answer to:
								&ldquo;What happens when quality deals dry up?&rdquo;
							</p>
						</div>
					</div>

					{/* Divider */}
					<div className="mx-auto h-px w-32 bg-border" />

					{/* Engine 2: Multiplex Construction Lending */}
					<div className="space-y-12">
						<div className="space-y-4">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
									<HardHat className="size-5 text-emerald-600" />
								</div>
								<h3 className="font-bold text-2xl md:text-3xl">
									Engine 2 — Builder Expertise That Most MICs Can&apos;t
									Replicate
								</h3>
							</div>
							<p className="text-lg text-muted-foreground leading-relaxed">
								FairLend&apos;s multiplex construction lending program generates
								returns of approximately 14% — roughly 2-5% above comparable
								private mortgage positions. Most MICs don&apos;t operate in
								construction lending because it requires something they
								don&apos;t have: the ability to actually evaluate a build.
							</p>
							<p className="font-semibold text-emerald-700 text-lg dark:text-emerald-400">
								FairLend can, because its management team has done the work
								themselves.
							</p>
						</div>

						<div className="grid gap-8 md:grid-cols-2">
							{[
								{
									icon: Eye,
									title: "The expertise edge",
									description:
										"Elie has personally built 20+ custom homes and completed 50-60+ renovations. When FairLend underwrites a construction loan, Elie walks the site. He assesses the builder's competence, the material quality, the project timeline, and the structural soundness — because he has built these projects himself. This dual expertise allows FairLend to identify winners that look mediocre on paper and reject losers that look good on paper.",
								},
								{
									icon: Users,
									title: "The network edge",
									description:
										"Nearly three decades of operating in this space has produced a deep network of contractors, project managers, and construction specialists. If a build starts going off track, FairLend doesn't wait for a default. The team brings in the right people to get the project back on course. This is active portfolio management at the construction level, not passive lending.",
								},
								{
									icon: Search,
									title: "The verification edge",
									description:
										"FairLend maintains boots on the ground for every construction position in the portfolio. Progress is monitored continuously, not reviewed at quarterly milestones. Every draw is verified against actual progress. Every material delivery is confirmed. The operating principle is trust but verify — and FairLend verifies everything.",
								},
								{
									icon: HomeIcon,
									title: "Why multiplexes",
									description:
										"Government incentives have fundamentally changed the economics of multiplex construction: elimination of approximately $450K in development levies per 5-plex, HST rebates, and CMHC MLI Select financing. FairLend identified this shift early and pivoted before the opportunity became crowded.",
								},
							].map((edge) => (
								<div
									className="rounded-2xl border border-border/50 bg-card p-8 shadow-sm"
									key={edge.title}
								>
									<edge.icon className="mb-4 size-6 text-emerald-600 dark:text-emerald-400" />
									<h4 className="mb-3 font-bold text-lg">{edge.title}</h4>
									<p className="text-muted-foreground text-sm leading-relaxed">
										{edge.description}
									</p>
								</div>
							))}
						</div>

						{/* The conviction framework */}
						<div className="rounded-2xl border border-border/50 bg-card p-8 shadow-sm">
							<h4 className="mb-3 font-bold text-lg">
								The conviction framework
							</h4>
							<p className="text-muted-foreground leading-relaxed">
								Elie applies a clear mental model to every construction
								opportunity: when the completed property value exceeds the cost
								of land plus cost of construction, the deal creates real equity
								— and FairLend is bullish. When value merely equals costs, the
								position is neutral. When value falls below costs, FairLend
								declines regardless of how attractive the borrower profile
								looks. This framework — grounded in Elie&apos;s ability to
								independently assess construction costs — means FairLend only
								enters construction positions where the math creates value, not
								just moves money.
							</p>
						</div>

						{/* Why this isn't higher risk */}
						<div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8 dark:border-emerald-800 dark:bg-emerald-900/10">
							<h4 className="mb-3 font-bold text-lg">
								Why this isn&apos;t higher risk
							</h4>
							<p className="text-muted-foreground leading-relaxed">
								Construction lending at most MICs IS higher risk — because most
								MICs are lending blind. They evaluate creditworthiness and
								appraised completion value but have no ability to assess whether
								the builder can actually deliver. FairLend&apos;s builder
								expertise, active site monitoring, draw verification, and
								contractor network eliminate the primary risk factors. The
								higher return isn&apos;t compensation for higher risk. It&apos;s
								compensation for expertise that most lenders don&apos;t possess.
							</p>
						</div>
					</div>

					{/* Combined engines summary */}
					<div className="border-emerald-500 border-l-4 bg-emerald-50/50 p-6 dark:bg-emerald-900/10">
						<p className="text-lg leading-relaxed">
							<strong>
								Combined, these two engines create a portfolio that delivers
								above-market returns through operational capability — not
								through relaxed credit standards.
							</strong>{" "}
							The capital cycle generates alpha through velocity. The multiplex
							program generates alpha through expertise. Both operate under the
							same conservative underwriting framework.
						</p>
					</div>

					<div className="text-center">
						<WaitlistTrigger
							className="rounded-xl bg-emerald-600 px-8 py-6 font-bold text-lg text-white shadow-md transition-all hover:scale-[1.02] hover:bg-emerald-700"
							size="lg"
						>
							Request the Full Portfolio Overview{" "}
							<ArrowRight className="ml-2 inline size-5" />
						</WaitlistTrigger>
					</div>
				</div>
			</section>

			{/* Section 5: Six Layers of Capital Protection */}
			<section className="bg-muted/30 px-6 py-24 md:px-12 lg:px-24">
				<div className="mx-auto max-w-5xl space-y-12">
					<div className="space-y-4 text-center">
						<h2 className="font-bold text-3xl tracking-tight md:text-5xl">
							Six Independent Layers of Capital Protection
						</h2>
					</div>

					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{[
							{
								icon: Filter,
								layer: "Layer 1",
								title: "Extreme Deal Selection",
								description:
									"90% of inbound deals are declined before a single dollar is deployed. FairLend's underwriting team, led by a founder who has arranged $2B+ in mortgage transactions, filters for the highest-quality borrowers. The strongest form of capital protection is never making a bad loan.",
							},
							{
								icon: Percent,
								layer: "Layer 2",
								title: "Conservative LTV Discipline",
								description:
									"Maximum 75% loan-to-value on first mortgages. Maximum 80% on seconds. Every position carries a substantial equity cushion — meaning property values would need to decline significantly before investor capital is exposed.",
							},
							{
								icon: Search,
								layer: "Layer 3",
								title: "Independent Double Appraisal",
								description:
									"Two independent third-party appraisals on every deal. No single appraiser's judgment determines collateral value. Inflated valuations — the hidden risk in most private lending — are structurally eliminated.",
							},
							{
								icon: Cpu,
								layer: "Layer 4",
								title: "AI-Augmented Human Underwriting",
								description:
									"Machine learning fraud detection, income verification, credit analysis, and background checks augment — not replace — expert human underwriters with conservative lending mandates. Technology catches what humans miss. Humans catch what models can't see.",
							},
							{
								icon: Clock,
								layer: "Layer 5",
								title: "Short Duration by Design",
								description:
									"Through the capital cycle, most positions are held for a maximum of 60 days. This is a protection most MICs cannot offer — because they hold positions to maturity, they carry 12-24 months of duration risk on every loan.",
							},
							{
								icon: Gavel,
								layer: "Layer 6",
								title: "Power of Sale + Standing Recovery Team",
								description:
									"Every FairLend mortgage includes power of sale provisions. A dedicated legal and default response team with a proven recovery playbook is maintained as a standing capability. Track record: 100% recovery of principal and interest in contested defaults.",
							},
						].map((layer) => (
							<div
								className="rounded-2xl border border-border/50 bg-card p-8 shadow-sm"
								key={layer.title}
							>
								<layer.icon className="mb-4 size-8 text-emerald-600 dark:text-emerald-400" />
								<div className="mb-1 font-semibold text-emerald-600 text-xs uppercase tracking-wider dark:text-emerald-400">
									{layer.layer}
								</div>
								<h3 className="mb-3 font-bold text-lg">{layer.title}</h3>
								<p className="text-muted-foreground text-sm leading-relaxed">
									{layer.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Section 6: Transparency / Investor Portal */}
			<section className="relative overflow-hidden bg-slate-950 px-6 py-24 text-white md:px-12 lg:px-24">
				<div className="-translate-y-1/2 absolute top-0 right-0 h-[500px] w-[500px] translate-x-1/2 rounded-full bg-emerald-500/10 blur-[100px]" />
				<div className="-translate-x-1/2 absolute bottom-0 left-0 h-[500px] w-[500px] translate-y-1/2 rounded-full bg-blue-500/10 blur-[100px]" />

				<div className="relative z-10 mx-auto max-w-6xl space-y-12">
					<div className="space-y-4 text-center">
						<h2 className="font-bold text-3xl tracking-tight md:text-5xl">
							Full Portfolio Transparency. In Real Time. Not Quarterly.
						</h2>
						<p className="mx-auto max-w-3xl text-slate-300 text-xl">
							FairLend&apos;s investor portal provides complete, live visibility
							into every aspect of your investment.
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{[
							{
								icon: FileText,
								title: "Position-level data",
								description:
									"Every mortgage in the portfolio, updated in real time.",
							},
							{
								icon: Search,
								title: "Full vetting documentation",
								description:
									"Borrower information, credit analysis, and both appraisals.",
							},
							{
								icon: BarChart3,
								title: "Payment tracking",
								description:
									"Current status and complete payment history for every position.",
							},
							{
								icon: Scale,
								title: "Legal documentation",
								description:
									"All documents associated with each investment, accessible on demand.",
							},
							{
								icon: DollarSign,
								title: "Money flow accounting",
								description:
									"Every dollar tracked every time it changes hands, visible to you.",
							},
							{
								icon: FileText,
								title: "Tax documents",
								description: "T3s and T5s generated with one click.",
							},
						].map((item) => (
							<div
								className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10"
								key={item.title + item.description}
							>
								<item.icon className="mb-4 size-8 text-emerald-400" />
								<h3 className="mb-2 font-bold text-lg">{item.title}</h3>
								<p className="text-slate-300 text-sm">{item.description}</p>
							</div>
						))}
					</div>

					<p className="mx-auto max-w-3xl text-center text-slate-400 leading-relaxed">
						Compare this to what you currently receive from your MIC allocation.
						Most managers — even good ones — send a quarterly PDF summarizing
						portfolio performance at the aggregate level. FairLend eliminates
						that trust requirement. Every position, every money flow, and every
						vetting decision is visible in real time.{" "}
						<strong className="text-white">
							The system keeps us accountable — by design, not by promise.
						</strong>
					</p>
				</div>
			</section>

			{/* Section 7: Case Study — Capital Recovery Under Pressure */}
			<section className="bg-background px-6 py-24 md:px-12 lg:px-24">
				<div className="mx-auto max-w-4xl space-y-12">
					<div className="space-y-4 text-center">
						<h2 className="font-bold text-3xl tracking-tight md:text-5xl">
							A Contested Default. A 16-Month Legal Battle. 100% Recovery.
						</h2>
					</div>

					<div className="space-y-8">
						<p className="text-lg text-muted-foreground leading-relaxed">
							A borrower defaulted and contested the power of sale. Opposing
							counsel moved to extend timelines and stonewall proceedings. The
							case entered a 16-month legal proceeding — the kind of contested
							default that most private lenders are not equipped to resolve.
						</p>

						<div className="space-y-4">
							<h3 className="font-bold text-lg">FairLend&apos;s response:</h3>
							<ul className="space-y-4">
								{[
									"Activated a dedicated default response team on day one — not assembled ad hoc, but standing and prepared",
									"Elie consulted daily with lawyers on litigation strategy, not just compliance reviews",
									"Pushed timelines aggressively rather than allowing opposing counsel to extend them",
									"Designed and executed a receivership strategy to bypass the secured debt hierarchy",
								].map((item) => (
									<li className="flex items-start gap-3" key={item}>
										<CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
										<span className="text-muted-foreground">{item}</span>
									</li>
								))}
							</ul>
						</div>

						<div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-900/10">
							<div className="mb-2 font-bold text-4xl text-emerald-600">
								100% Recovery
							</div>
							<p className="text-muted-foreground">
								Every dollar of principal and every dollar of interest returned
								to investors.
							</p>
						</div>

						<p className="text-muted-foreground italic leading-relaxed">
							This is not an outlier. It is the standard. FairLend maintains a
							standing legal and default response capability with a proven
							playbook because the time to prepare for a contested default is
							before it happens — not during.
						</p>
					</div>

					<div className="text-center">
						<WaitlistTrigger
							className="rounded-xl bg-emerald-600 px-8 py-6 font-bold text-lg text-white shadow-md transition-all hover:scale-[1.02] hover:bg-emerald-700"
							size="lg"
						>
							Request the Capital Protection Overview{" "}
							<ArrowRight className="ml-2 inline size-5" />
						</WaitlistTrigger>
					</div>
				</div>
			</section>

			{/* Section 8: Alignment of Interests */}
			<section className="bg-muted/30 px-6 py-24 md:px-12 lg:px-24">
				<div className="mx-auto max-w-4xl space-y-12">
					<div className="space-y-4 text-center">
						<h2 className="font-bold text-3xl tracking-tight md:text-5xl">
							Aligned Incentives. No Self-Dealing. Verify It Yourself.
						</h2>
						<p className="text-lg text-muted-foreground md:text-xl">
							The biggest risk in private lending isn&apos;t a bad mortgage —
							it&apos;s a bad manager.
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2">
						{[
							{
								icon: Heart,
								title: "No predatory borrower fees",
								description:
									"No $450 NSF fees, no debt traps, no revenue extracted through management self-dealing. Every dollar of fee income is earned through origination and disclosed transparently.",
							},
							{
								icon: FileText,
								title: "Publicly viewable, standardized contracts",
								description:
									"Borrowers see the same terms every time. This eliminates hidden complexity — and it attracts higher-quality borrowers who have options and choose FairLend because the terms are fair.",
							},
							{
								icon: Target,
								title: "No incentive to originate bad loans",
								description:
									"The capital cycle's profitability depends on deal volume across high-quality positions. A single default disrupts the entire cycle. Management's economic interest and your capital preservation interest are structurally identical.",
							},
							{
								icon: Leaf,
								title: "ESG commitment funded from the management fee",
								description:
									"FairLend measures the carbon emissions of every construction build and its materials, then pays from its own fee — not yours — to reach net carbon zero. Sustainable investing isn't a marketing line. It's a line item.",
							},
						].map((item) => (
							<div
								className="rounded-2xl border border-border/50 bg-card p-8 shadow-sm"
								key={item.title}
							>
								<item.icon className="mb-4 size-6 text-emerald-600 dark:text-emerald-400" />
								<h3 className="mb-3 font-bold text-lg">{item.title}</h3>
								<p className="text-muted-foreground text-sm leading-relaxed">
									{item.description}
								</p>
							</div>
						))}
					</div>

					<p className="border-emerald-500 border-l-4 bg-emerald-50/50 py-4 pl-6 text-lg text-muted-foreground italic dark:bg-emerald-900/10">
						When borrowers are treated fairly, they perform better. When they
						perform better, default rates stay low. When default rates stay low,
						your capital compounds. Alignment isn&apos;t a philosophy —
						it&apos;s the operating structure.
					</p>
				</div>
			</section>

			{/* Section 9: FAQ */}
			<section className="bg-background px-6 py-24 md:px-12 lg:px-24">
				<div className="mx-auto max-w-3xl space-y-16">
					<div className="text-center">
						<h2 className="font-bold text-3xl tracking-tight md:text-5xl">
							Questions We Hear from Investors and Their Advisors
						</h2>
					</div>

					<div className="space-y-8">
						{[
							{
								q: "What regulatory framework does FairLend operate under?",
								a: "FairLend is fully FSRA and OSC compliant. Investments are eligible for registered accounts including TFSA, RRSP, and RESP.",
							},
							{
								q: "I already invest with a conservative MIC I trust. Why would I move capital to FairLend?",
								a: "You may not need to move all of it. But consider the structural difference: your current MIC likely operates an originate-and-hold model, which means your return is bounded by the interest rate on the underlying mortgages. FairLend's capital cycle generates multiple fee-earning deployments per year on the same dollar of capital — using the same conservative underwriting standards. The question isn't whether your current MIC is trustworthy. It's whether the originate-and-hold model is the most capital-efficient way to deploy into private mortgages.",
							},
							{
								q: "How are above-market returns possible without taking on additional risk?",
								a: "Through two structural advantages, not leverage or credit relaxation. First, the capital cycle redeploys investor capital multiple times per year, earning a 1% origination fee on each cycle — every mortgage underwritten to the same conservative standards. Second, the multiplex construction lending program generates approximately 14% returns in a niche where FairLend's rare builder + lender dual expertise allows it to assess and manage construction risk that most MICs cannot evaluate.",
							},
							{
								q: "Isn't construction lending riskier than standard private mortgages?",
								a: "Construction lending at most MICs is riskier — because most MICs are lending blind on the build itself. FairLend's founder has personally built 20+ custom homes and completed 50-60+ renovations. The team walks every site, verifies every draw against actual progress, and maintains a deep network of contractors who can be deployed if a build goes off track. The higher return reflects the expertise premium, not a risk premium.",
							},
							{
								q: "FairLend is a new MIC. Why should I trust a manager without a long public track record?",
								a: "FairLend is a new entity. The people and capabilities behind it are not. Elie Soberano has arranged $2B+ in mortgage transactions over nearly 30 years, with zero losses on deals he personally underwrote. The fintech team comes from RBC Capital Markets. The operations team built precision manufacturing systems for Ford. The legal team has a proven recovery playbook tested in contested defaults. New structure, decades of underlying capability.",
							},
							{
								q: "What is the default recovery process?",
								a: "FairLend maintains a standing legal and default response team — not ad hoc counsel. All investments include power of sale provisions. In all contested default situations to date, FairLend has recovered 100% of principal and interest.",
							},
							{
								q: "What level of portfolio visibility do investors have?",
								a: "Complete. The real-time investor portal shows every position, every appraisal, every payment, every legal document, and every money flow — as it happens. This is not a quarterly summary. It is a live, auditable view of your investment.",
							},
							{
								q: "What is the minimum investment?",
								a: "$10,000. This provides full access to the FairLend portfolio, the real-time investor portal, and all structural protections. For larger allocations or institutional structures, contact the team directly.",
							},
							{
								q: "How are returns distributed?",
								a: "Quarterly, via direct bank transfer. Distributions are reflected in your investor portal before they arrive in your account.",
							},
							{
								q: "Can FairLend accommodate institutional or family office allocations?",
								a: "Yes. Contact the team to discuss allocation size, reporting requirements, and structuring.",
							},
						].map((faq) => (
							<div className="border-border border-b pb-8" key={faq.q}>
								<h3 className="mb-3 font-bold text-lg">{faq.q}</h3>
								<p className="text-muted-foreground leading-relaxed">{faq.a}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Section 10: Final CTA */}
			<section
				className="relative overflow-hidden bg-emerald-900 px-6 py-24 text-white md:px-12 lg:px-24"
				id="cta"
			>
				<div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay" />
				<div className="relative z-10 mx-auto max-w-4xl space-y-10 text-center">
					<div className="space-y-6">
						<h2 className="font-bold text-3xl tracking-tight md:text-5xl">
							Conservative Underwriting. Two Engines of Alpha.
							<br />
							Now You Know How.
						</h2>
					</div>

					<div className="mx-auto max-w-3xl space-y-6 text-emerald-100 text-xl leading-relaxed">
						<p>
							FairLend combines nearly 30 years of mortgage expertise, rare
							builder + lender dual capability, institutional-grade technology,
							and two distinct engines of above-market return — a capital cycle
							that compounds origination fees through rapid redeployment, and a
							multiplex construction lending program generating approximately
							14% returns through expertise most MICs don&apos;t possess. All
							structured around six independent layers of investor protection
							and complete real-time transparency.
						</p>
						<p>
							Fully regulated. Tax-advantaged. Built on the thesis that
							conservative underwriting and above-market returns aren&apos;t
							opposites — they&apos;re the product of a better operating model
							and deeper expertise.
						</p>
						<p className="font-semibold text-white">
							You no longer have to choose between a manager you trust and a
							return worth having.
						</p>
					</div>

					<div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
						<WaitlistTrigger
							className="rounded-full bg-white px-12 py-8 font-bold text-emerald-900 text-xl shadow-2xl transition-transform hover:scale-105 hover:bg-emerald-50"
							size="lg"
						>
							Request the Investor Package
						</WaitlistTrigger>
						<WaitlistTrigger
							className="rounded-full border-2 border-white/30 bg-transparent px-8 py-6 font-semibold text-lg text-white transition-all hover:border-white/50 hover:bg-white/10"
							size="lg"
						>
							Schedule a Call with the Team
						</WaitlistTrigger>
					</div>
					<p className="text-emerald-200/80 text-sm">
						No obligation. We&apos;ll provide full documentation before you
						commit any capital.
					</p>
				</div>
			</section>

			{/* Footer */}
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

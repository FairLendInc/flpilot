import {
	ArrowRight,
	ArrowUpRight,
	BarChart3,
	Cpu,
	Landmark,
	LineChart,
	Mail,
	Menu,
	ShieldCheck,
	TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { ScrollReveal } from "./scroll-reveal";
import { ScrollToTop } from "./scroll-to-top";
import { SwissSection } from "./swiss-section";

export type CodexVariant =
	| "codexlp1"
	| "codexlp2"
	| "codexlp3"
	| "codexlp4"
	| "codexlp5";

type SwissTone =
	| "light"
	| "lightSoft"
	| "dark"
	| "darkSoft"
	| "green"
	| "greenSoft"
	| "sand"
	| "sandSoft";

type VariantTheme = {
	accentHex: string;
	accentSoftHex: string;
	accentText: string;
	accentBg: string;
	accentBorder: string;
	accentMutedBg: string;
	background: string;
	headerBg: string;
	headerBorder: string;
	headerNav: string;
	headerMeta: string;
	logo: string;
	primaryButton: string;
	secondaryButton: string;
	sectionPattern: string;
	panel: string;
	panelSoft: string;
	panelDark: string;
	subtleText: string;
	sectionTones: {
		credibility: SwissTone;
		problem: SwissTone;
		engines: SwissTone;
		protection: SwissTone;
		transparency: SwissTone;
		caseStudy: SwissTone;
		team: SwissTone;
		market: SwissTone;
		alignment: SwissTone;
		faq: SwissTone;
		final: SwissTone;
	};
};

const THEMES: Record<CodexVariant, VariantTheme> = {
	codexlp1: {
		accentHex: "#C63B1E",
		accentSoftHex: "#AE2F14",
		accentText: "text-[#C63B1E]",
		accentBg: "bg-[#C63B1E]",
		accentBorder: "border-[#C63B1E]/40",
		accentMutedBg: "bg-[#F3E3DD]",
		background: "bg-[#F2EEE8] text-neutral-900",
		headerBg: "bg-[#F2EEE8]/95",
		headerBorder: "border-neutral-300",
		headerNav: "text-neutral-700",
		headerMeta: "text-neutral-500",
		logo: "bg-[#C63B1E] text-white",
		primaryButton: "bg-[#C63B1E] text-white hover:bg-[#9E2E16]",
		secondaryButton:
			"border-neutral-800 text-neutral-900 hover:border-[#C63B1E] hover:text-[#C63B1E]",
		sectionPattern: "lp-pattern-grid-red",
		panel: "bg-white",
		panelSoft: "bg-white/80",
		panelDark: "bg-[#151515] text-white",
		subtleText: "text-neutral-600",
		sectionTones: {
			credibility: "sand",
			problem: "light",
			engines: "light",
			protection: "sand",
			transparency: "dark",
			caseStudy: "light",
			team: "sand",
			market: "light",
			alignment: "dark",
			faq: "light",
			final: "green",
		},
	},
	codexlp2: {
		accentHex: "#D38A25",
		accentSoftHex: "#BC7520",
		accentText: "text-[#D38A25]",
		accentBg: "bg-[#D38A25]",
		accentBorder: "border-[#D38A25]/50",
		accentMutedBg: "bg-[#2D2418]",
		background: "bg-[#090B0F] text-neutral-100",
		headerBg: "bg-[#090B0F]/95",
		headerBorder: "border-neutral-800",
		headerNav: "text-neutral-300",
		headerMeta: "text-neutral-500",
		logo: "bg-[#D38A25] text-black",
		primaryButton: "bg-[#D38A25] text-black hover:bg-[#F5B04F]",
		secondaryButton:
			"border-neutral-600 text-neutral-200 hover:border-[#D38A25] hover:text-[#D38A25]",
		sectionPattern: "lp-pattern-grid-gold",
		panel: "bg-neutral-900",
		panelSoft: "bg-neutral-900/70",
		panelDark: "bg-black text-white",
		subtleText: "text-neutral-300",
		sectionTones: {
			credibility: "darkSoft",
			problem: "dark",
			engines: "darkSoft",
			protection: "dark",
			transparency: "greenSoft",
			caseStudy: "darkSoft",
			team: "dark",
			market: "darkSoft",
			alignment: "greenSoft",
			faq: "dark",
			final: "darkSoft",
		},
	},
	codexlp3: {
		accentHex: "#0E7C86",
		accentSoftHex: "#0B646D",
		accentText: "text-[#0E7C86]",
		accentBg: "bg-[#0E7C86]",
		accentBorder: "border-[#0E7C86]/40",
		accentMutedBg: "bg-[#D9ECED]",
		background: "bg-[#E8ECEC] text-neutral-900",
		headerBg: "bg-[#E8ECEC]/95",
		headerBorder: "border-neutral-400",
		headerNav: "text-neutral-700",
		headerMeta: "text-neutral-500",
		logo: "bg-[#0E7C86] text-white",
		primaryButton: "bg-[#0E7C86] text-white hover:bg-[#0B646D]",
		secondaryButton:
			"border-neutral-800 text-neutral-900 hover:border-[#0E7C86] hover:text-[#0E7C86]",
		sectionPattern: "lp-pattern-grid-cyan",
		panel: "bg-white",
		panelSoft: "bg-[#F3F8F8]",
		panelDark: "bg-[#12363B] text-white",
		subtleText: "text-neutral-600",
		sectionTones: {
			credibility: "lightSoft",
			problem: "sandSoft",
			engines: "light",
			protection: "sand",
			transparency: "darkSoft",
			caseStudy: "light",
			team: "sandSoft",
			market: "lightSoft",
			alignment: "darkSoft",
			faq: "light",
			final: "greenSoft",
		},
	},
	codexlp4: {
		accentHex: "#BE4A14",
		accentSoftHex: "#96390F",
		accentText: "text-[#BE4A14]",
		accentBg: "bg-[#BE4A14]",
		accentBorder: "border-[#BE4A14]/40",
		accentMutedBg: "bg-[#F5E6DC]",
		background: "bg-[#F4F1EB] text-neutral-900",
		headerBg: "bg-[#F4F1EB]/95",
		headerBorder: "border-neutral-300",
		headerNav: "text-neutral-700",
		headerMeta: "text-neutral-500",
		logo: "bg-[#BE4A14] text-white",
		primaryButton: "bg-[#BE4A14] text-white hover:bg-[#96390F]",
		secondaryButton:
			"border-neutral-800 text-neutral-900 hover:border-[#BE4A14] hover:text-[#BE4A14]",
		sectionPattern: "lp-pattern-grid-orange",
		panel: "bg-white",
		panelSoft: "bg-[#FAF7F3]",
		panelDark: "bg-[#1A1A1A] text-white",
		subtleText: "text-neutral-600",
		sectionTones: {
			credibility: "sand",
			problem: "light",
			engines: "sandSoft",
			protection: "light",
			transparency: "dark",
			caseStudy: "sand",
			team: "light",
			market: "sandSoft",
			alignment: "darkSoft",
			faq: "light",
			final: "green",
		},
	},
	codexlp5: {
		accentHex: "#2D7F5E",
		accentSoftHex: "#24684D",
		accentText: "text-[#2D7F5E]",
		accentBg: "bg-[#2D7F5E]",
		accentBorder: "border-[#2D7F5E]/45",
		accentMutedBg: "bg-[#E1EFE9]",
		background: "bg-[#E9ECE8] text-neutral-900",
		headerBg: "bg-[#E9ECE8]/95",
		headerBorder: "border-neutral-300",
		headerNav: "text-neutral-700",
		headerMeta: "text-neutral-500",
		logo: "bg-[#2D7F5E] text-white",
		primaryButton: "bg-[#2D7F5E] text-white hover:bg-[#24684D]",
		secondaryButton:
			"border-neutral-800 text-neutral-900 hover:border-[#2D7F5E] hover:text-[#2D7F5E]",
		sectionPattern: "lp-pattern-grid-green",
		panel: "bg-white",
		panelSoft: "bg-[#F6FAF7]",
		panelDark: "bg-[#11251E] text-white",
		subtleText: "text-neutral-600",
		sectionTones: {
			credibility: "light",
			problem: "sand",
			engines: "lightSoft",
			protection: "sandSoft",
			transparency: "darkSoft",
			caseStudy: "light",
			team: "sand",
			market: "lightSoft",
			alignment: "dark",
			faq: "light",
			final: "greenSoft",
		},
	},
};

const credibilityStats = [
	{ value: "90%", label: "Deal rejection rate" },
	{ value: "Nearly 30 Years", label: "Of compounding mortgage expertise" },
	{ value: "100%", label: "Capital recovery in contested defaults" },
	{ value: "$2B+", label: "In deals arranged by the founder" },
] as const;

const protectionLayers = [
	{
		title: "Layer 1 - Extreme Deal Selection",
		copy: "90% of inbound deals are declined before a single dollar is deployed. FairLend's underwriting team, led by a founder who has arranged $2B+ in mortgage transactions, filters for the highest-quality borrowers. The strongest form of capital protection is never making a bad loan.",
	},
	{
		title: "Layer 2 - Conservative LTV Discipline",
		copy: "Maximum 75% loan-to-value on first mortgages. Maximum 80% on seconds. Every position carries a substantial equity cushion, meaning property values would need to decline significantly before investor capital is exposed. These are the same conservative limits applied by the most disciplined MICs in the market.",
	},
	{
		title: "Layer 3 - Independent Double Appraisal",
		copy: "Two independent third-party appraisals on every deal. No single appraiser's judgment determines collateral value. Inflated valuations, the hidden risk in most private lending, are structurally eliminated.",
	},
	{
		title: "Layer 4 - AI-Augmented Human Underwriting",
		copy: "Machine learning fraud detection, income verification, credit analysis, and background checks augment, not replace, expert human underwriters with conservative lending mandates. Technology catches what humans miss. Humans catch what models can't see.",
	},
	{
		title: "Layer 5 - Short Duration by Design",
		copy: "Through the capital cycle, most positions are held for a maximum of 60 days. This is a protection most MICs cannot offer. Because they hold positions to maturity, they carry 12-24 months of duration risk on every loan. FairLend's short exposure window means less time for rate shifts, borrower deterioration, and market corrections to impact the portfolio.",
	},
	{
		title: "Layer 6 - Power of Sale + Standing Recovery Team",
		copy: "Every FairLend mortgage includes power of sale provisions. A dedicated legal and default response team with a proven recovery playbook is maintained as a standing capability, not assembled reactively when problems arise. Track record: 100% recovery of principal and interest in contested defaults.",
	},
] as const;

const portalItems = [
	"Position-level data - every mortgage in the portfolio, updated in real time",
	"Full vetting documentation - borrower information, credit analysis, and both appraisals",
	"Payment tracking - current status and complete payment history for every position",
	"Legal documentation - all documents associated with each investment, accessible on demand",
	"Money flow accounting - every dollar tracked every time it changes hands, visible to you",
	"Tax documents - T3s and T5s generated with one click",
] as const;

const caseResponse = [
	"Activated a dedicated default response team on day one, not assembled ad hoc, but standing and prepared",
	"Elie consulted daily with lawyers on litigation strategy, not just compliance reviews",
	"Pushed timelines aggressively rather than allowing opposing counsel to extend them",
	"Designed and executed a receivership strategy to bypass the secured debt hierarchy",
] as const;

const teamBlocks = [
	{
		title: "Elie Soberano - Founder & Portfolio Manager",
		copy: [
			"Top 1% mortgage broker in Canada by volume. $2B+ in deals arranged over a near-30-year career. First broker at Mortgage Intelligence, Canada's largest brokerage. Scotiabank retains him at $2,000/hour to consult on mortgage product strategy.",
			"Elie has personally built 20+ custom homes and completed 50-60+ renovations. This dual expertise, lender and builder, is the foundation of both engines of return. For the capital cycle, his nearly three decades of industry relationships produced the distribution channels that allow FairLend to sell conservatively underwritten mortgages within 60 days, consistently and at scale. For the multiplex construction program, he walks every site, evaluates every builder, and catches construction problems that no spreadsheet can detect. Most MIC managers have deep lending expertise or deep construction expertise. Almost none have both. This is the capability moat that makes FairLend's model possible.",
			"Elie's network, contractors, project managers, specialized trades, industry contacts built over nearly 30 years, is the operational backbone of the construction lending program. When a build goes off track, FairLend doesn't file paperwork and wait. The team deploys the right people to get the project back on course, because they know who to call and those people pick up the phone.",
		],
	},
	{
		title: "Fintech & Quantitative Team",
		copy: [
			"Led by former RBC Capital Markets quant analysts and software engineers. This team built FairLend's AI-powered fraud detection, borrower scoring models, portfolio monitoring systems, and the real-time investor portal. Institutional-grade financial technology, built from the ground up, not a third-party dashboard with a logo on it.",
		],
	},
	{
		title: "Operations",
		copy: [
			"Led by the founders of Barton Engineering, a precision manufacturer operating in Ford's just-in-time supply chain, an environment where a single day's delay triggers millions in penalties. That manufacturing-grade discipline governs every FairLend process: document handling, compliance, investor reporting, capital deployment timelines, and construction draw verification. In a model where operational speed IS the return, this team ensures nothing slows down.",
		],
	},
	{
		title: "Legal & Default Response",
		copy: [
			"A dedicated, specialized team with a proven playbook for mortgage recovery, power of sale proceedings, and receivership strategy. This is not general-purpose legal counsel. It is a standing capability purpose-built for capital recovery.",
		],
	},
] as const;

const faqItems = [
	{
		q: "What regulatory framework does FairLend operate under?",
		a: "FairLend is fully FSRA and OSC compliant. Investments are eligible for registered accounts including TFSA, RRSP, and RESP.",
	},
	{
		q: "I already invest with a conservative MIC I trust. Why would I move capital to FairLend?",
		a: "You may not need to move all of it. But consider the structural difference: your current MIC likely operates an originate-and-hold model, which means your return is bounded by the interest rate on the underlying mortgages. FairLend's capital cycle generates multiple fee-earning deployments per year on the same dollar of capital, using the same conservative underwriting standards. The question isn't whether your current MIC is trustworthy. It's whether the originate-and-hold model is the most capital-efficient way to deploy into private mortgages. For most investors, a conversation with our team makes the structural difference clear.",
	},
	{
		q: "How are above-market returns possible without taking on additional risk?",
		a: "Through two structural advantages, not leverage or credit relaxation. First, the capital cycle redeploys investor capital multiple times per year, earning a 1% origination fee on each cycle, every mortgage underwritten to the same conservative standards. Second, the multiplex construction lending program generates approximately 14% returns in a niche where FairLend's rare builder + lender dual expertise allows it to assess and manage construction risk that most MICs cannot evaluate. The underwriting is conservative. The operating model and expertise base are what differentiate the return.",
	},
	{
		q: "Isn't construction lending riskier than standard private mortgages?",
		a: "Construction lending at most MICs is riskier because most MICs are lending blind on the build itself. They evaluate creditworthiness and appraised completion value but have no ability to assess whether the builder can deliver. FairLend's founder has personally built 20+ custom homes and completed 50-60+ renovations. The team walks every site, verifies every draw against actual progress, and maintains a deep network of contractors and project managers who can be deployed if a build goes off track. The higher return on construction lending reflects the expertise premium, not a risk premium. FairLend can underwrite what others can only estimate.",
	},
	{
		q: "FairLend is a new MIC. Why should I trust a manager without a long public track record?",
		a: "FairLend is a new entity. The people and capabilities behind it are not. Elie Soberano has arranged $2B+ in mortgage transactions over nearly 30 years, with a track record that includes zero losses on deals he personally underwrote. The distribution channels powering the capital cycle were built over that same career. The construction network, contractors, project managers, trades, is the product of decades of hands-on building experience. The fintech team comes from RBC Capital Markets. The operations team built precision manufacturing systems for Ford. The legal team has a proven recovery playbook tested in contested defaults. New structure, decades of underlying capability.",
	},
	{
		q: "What is the default recovery process?",
		a: "FairLend maintains a standing legal and default response team, not ad hoc counsel. All investments include power of sale provisions. The recovery playbook has been tested in contested proceedings. In all contested default situations to date, FairLend has recovered 100% of principal and interest.",
	},
	{
		q: "What level of portfolio visibility do investors have?",
		a: "Complete. The real-time investor portal shows every position, every appraisal, every payment, every legal document, and every money flow, as it happens. This is not a quarterly summary. It is a live, auditable view of your investment.",
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
] as const;

const sectionAnchors = [
	{ href: "#credibility", label: "Proof" },
	{ href: "#problem", label: "Problem" },
	{ href: "#spin-model", label: "Two Engines" },
	{ href: "#protection", label: "Protection" },
	{ href: "#faq", label: "FAQ" },
] as const;

export function CodexLanding({ variant }: { variant: CodexVariant }) {
	const theme = THEMES[variant];

	return (
		<div
			className={cn(
				"relative z-10 flex min-h-screen w-full flex-col",
				theme.background
			)}
		>
			<ScrollReveal />
			<Header theme={theme} variant={variant} />
			<div
				className={cn("absolute inset-0 opacity-[0.22]", theme.sectionPattern)}
			/>
			<main className="relative z-10 flex w-full flex-col">
				<HeroSection />
				<CredibilitySection theme={theme} variant={variant} />
				<ProblemSection theme={theme} />
				<EnginesSection theme={theme} />
				<ProtectionSection theme={theme} />
				<TransparencySection theme={theme} />
				<CaseStudySection theme={theme} />
				<TeamSection theme={theme} variant={variant} />
				<MarketForesightSection theme={theme} />
				<AlignmentSection theme={theme} />
				<FAQSection theme={theme} />
				<FinalCTASection theme={theme} variant={variant} />
			</main>
			<Footer theme={theme} />
			<div className="fixed right-8 bottom-8 z-40 hidden lg:block">
				<ScrollToTop />
			</div>
		</div>
	);
}

function Header({
	theme,
	variant,
}: {
	theme: VariantTheme;
	variant: CodexVariant;
}) {
	return (
		<header
			className={cn(
				"sticky top-0 z-50 flex h-14 w-full items-center border-b backdrop-blur-sm",
				theme.headerBg,
				theme.headerBorder
			)}
		>
			<div
				className={cn(
					"flex h-full w-16 flex-shrink-0 items-center justify-center border-r",
					theme.headerBorder
				)}
			>
				<div
					className={cn("flex h-8 w-8 items-center justify-center", theme.logo)}
				>
					<BarChart3 className="h-4 w-4" />
				</div>
			</div>
			<div className="flex h-full flex-1 items-center justify-between px-6 lg:px-12">
				<nav
					className={cn(
						"hidden items-center gap-8 font-bold text-[10px] uppercase tracking-[0.28em] xl:flex",
						theme.headerNav
					)}
				>
					{sectionAnchors.map((anchor) => (
						<a
							className="lp-underline cursor-pointer transition-colors hover:text-primary"
							href={anchor.href}
							key={anchor.href}
						>
							{anchor.label}
						</a>
					))}
				</nav>
				<div className="ml-auto flex items-center gap-4">
					<span
						className={cn(
							"hidden font-bold text-[10px] uppercase tracking-[0.3em] sm:block",
							theme.headerMeta
						)}
					>
						{variant.toUpperCase()}
					</span>
					<a
						className={cn(
							"lp-cta cursor-pointer px-5 py-2.5 font-bold text-[10px] uppercase tracking-[0.28em] transition-all lg:px-7",
							theme.primaryButton
						)}
						href="#waitlist"
					>
						Request the Investor Package
					</a>
				</div>
			</div>
			<div
				className={cn(
					"flex h-full w-16 flex-shrink-0 items-center justify-center border-l",
					theme.headerBorder
				)}
			>
				<Menu className="h-5 w-5" />
			</div>
		</header>
	);
}

function CredibilitySection({
	theme,
	variant,
}: {
	theme: VariantTheme;
	variant: CodexVariant;
}) {
	return (
		<SwissSection
			id="credibility"
			leftTone={theme.sectionTones.credibility}
			rightTone={theme.sectionTones.credibility}
			subtitle="SECTION 02"
			title="CREDIBILITY BAR"
			tone={theme.sectionTones.credibility}
		>
			<div className="px-8 py-14 lg:px-14 lg:py-20">
				<div className="mb-10 flex flex-col gap-4 lg:mb-14 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<p
							className={cn(
								"lp-reveal font-bold text-[11px] uppercase tracking-[0.3em]",
								theme.accentText
							)}
							data-reveal="fade-up"
						>
							Anchoring starts here
						</p>
						<h2
							className="lp-reveal mt-3 font-bold font-display text-3xl uppercase tracking-tight lg:text-5xl"
							data-delay="1"
							data-reveal="fade-up"
						>
							Verifiable Numbers, Not Marketing Language
						</h2>
					</div>
					<p
						className={cn(
							"lp-reveal max-w-xl text-sm leading-relaxed lg:text-base",
							theme.subtleText
						)}
						data-delay="2"
						data-reveal="fade-up"
					>
						These four signals set the risk frame before anything else is read.
					</p>
				</div>
				<div className="lp-stagger grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
					{credibilityStats.map((stat) => (
						<div
							className={cn(
								"lp-hover-raise lp-reveal border p-5 lg:p-6",
								theme.accentBorder,
								theme.panel
							)}
							data-reveal="fade-up"
							key={stat.value}
						>
							<p
								className={cn(
									"mb-3 font-bold font-display text-3xl leading-none tracking-tight lg:text-4xl",
									theme.accentText
								)}
							>
								{stat.value}
							</p>
							<p className={cn("text-sm leading-relaxed", theme.subtleText)}>
								{stat.label}
							</p>
						</div>
					))}
				</div>
				<div
					className={cn(
						"lp-reveal mt-10 border p-6 lg:mt-12",
						theme.accentBorder,
						theme.panelSoft
					)}
					data-reveal="fade-in"
				>
					<svg aria-hidden className="h-20 w-full" viewBox="0 0 1200 100">
						<title>Decorative visualization</title>
						<path
							className="lp-draw-path"
							d="M10 80 C120 20, 260 20, 360 60 C470 95, 620 20, 730 45 C860 75, 980 30, 1190 50"
							fill="none"
							stroke={theme.accentHex}
							strokeWidth="2"
						/>
						<circle
							className="lp-signal-pulse"
							cx="360"
							cy="60"
							fill={theme.accentSoftHex}
							r="6"
						/>
						<circle
							className="lp-signal-pulse"
							cx="730"
							cy="45"
							fill={theme.accentSoftHex}
							r="6"
							style={{ animationDelay: "200ms" }}
						/>
						<circle
							className="lp-signal-pulse"
							cx="1190"
							cy="50"
							fill={theme.accentSoftHex}
							r="6"
							style={{ animationDelay: "400ms" }}
						/>
					</svg>
					<p
						className={cn(
							"mt-3 text-right font-mono text-[10px] uppercase tracking-[0.28em]",
							theme.subtleText
						)}
					>
						Statistical evidence stream / {variant}
					</p>
				</div>
			</div>
		</SwissSection>
	);
}

function ProblemSection({ theme }: { theme: VariantTheme }) {
	return (
		<SwissSection
			id="problem"
			leftTone={theme.sectionTones.problem}
			rightTone={theme.sectionTones.problem}
			subtitle="SECTION 03"
			title="PROBLEM"
			tone={theme.sectionTones.problem}
		>
			<div className="grid gap-8 px-8 py-14 lg:grid-cols-12 lg:px-14 lg:py-20">
				<div className="lg:col-span-4">
					<h2
						className="lp-reveal font-bold font-display text-4xl uppercase leading-[0.9] tracking-tight lg:text-6xl"
						data-reveal="fade-up"
					>
						Two kinds of MICs.
						<br />
						Neither solves the whole problem.
					</h2>
					<div
						className={cn(
							"lp-reveal mt-8 flex items-center gap-3 border-t pt-5",
							theme.accentBorder
						)}
						data-delay="1"
						data-reveal="fade-in"
					>
						<ArrowUpRight className={cn("h-4 w-4", theme.accentText)} />
						<span
							className={cn(
								"font-mono text-[10px] uppercase tracking-[0.28em]",
								theme.subtleText
							)}
						>
							Normalized trade-off in private lending
						</span>
					</div>
					<div
						className="lp-reveal mt-8 hidden lg:block"
						data-delay="2"
						data-reveal="fade-in"
					>
						<svg aria-hidden className="h-56 w-full" viewBox="0 0 260 220">
							<title>Decorative visualization</title>
							<rect
								fill="none"
								height="200"
								rx="18"
								stroke={theme.accentHex}
								strokeDasharray="5 7"
								strokeWidth="1.5"
								width="240"
								x="10"
								y="10"
							/>
							<line
								stroke={theme.accentHex}
								strokeWidth="1.5"
								x1="130"
								x2="130"
								y1="20"
								y2="200"
							/>
							<line
								stroke={theme.accentHex}
								strokeWidth="1.5"
								x1="20"
								x2="240"
								y1="110"
								y2="110"
							/>
							<circle
								className="lp-soft-float"
								cx="67"
								cy="73"
								fill={theme.accentHex}
								r="8"
							/>
							<circle
								className="lp-soft-float"
								cx="193"
								cy="148"
								fill={theme.accentSoftHex}
								r="8"
								style={{ animationDelay: "300ms" }}
							/>
							<text
								className="fill-neutral-500 text-[9px] uppercase tracking-[0.2em]"
								x="26"
								y="32"
							>
								Trust
							</text>
							<text
								className="fill-neutral-500 text-[9px] uppercase tracking-[0.2em]"
								x="26"
								y="214"
							>
								Returns
							</text>
						</svg>
					</div>
				</div>
				<div className="space-y-6 lg:col-span-8 lg:space-y-8">
					<BodyParagraph delay="1">
						You already know the first type. Opaque reporting. Fee structures
						that reward origination volume over loan quality. Returns that look
						good until the defaults start surfacing and management has already
						collected its fees. You've either invested with one of these
						managers or you've made a career of avoiding them.
					</BodyParagraph>
					<BodyParagraph delay="2">
						So you moved your capital to the second type: conservative, well-run
						MICs with disciplined underwriting and solid track records. The kind
						of manager you can trust. The problem is, their returns are pegged
						to the market. Conservative underwriting plus an originate-and-hold
						model produces conservative returns. You've protected your capital,
						but you haven't put it to work.
					</BodyParagraph>
					<BodyParagraph delay="3">
						That's the trade-off the industry has normalized: either you trust
						the manager and accept market-rate returns, or you chase higher
						yield and accept the risk that comes with it.
					</BodyParagraph>
					<BodyParagraph delay="4">
						FairLend is built on the thesis that this trade-off is a structural
						problem, not an inevitability. Two distinct engines generate
						above-market returns from the same conservative underwriting that
						the best traditional MICs use: a capital cycle that compounds
						origination fees through rapid redeployment, and a multiplex
						construction lending program that captures higher yields through
						rare builder + lender dual expertise. The difference isn't the loan
						quality. It's the operating model.
					</BodyParagraph>
					<div
						className={cn(
							"lp-reveal rounded border p-4 text-[11px] uppercase tracking-[0.28em]",
							theme.accentBorder,
							theme.accentMutedBg,
							theme.accentText
						)}
						data-reveal="fade-in"
					>
						Conversion focus: remove status-quo comfort and isolate model
						mismatch.
					</div>
				</div>
			</div>
		</SwissSection>
	);
}

function EnginesSection({ theme }: { theme: VariantTheme }) {
	return (
		<SwissSection
			id="spin-model"
			leftTone={theme.sectionTones.engines}
			rightTone={theme.sectionTones.engines}
			subtitle="SECTION 04"
			title="TWO ENGINES"
			tone={theme.sectionTones.engines}
		>
			<div className="space-y-12 px-8 py-14 lg:space-y-16 lg:px-14 lg:py-20">
				<div className="grid gap-8 lg:grid-cols-12 lg:items-end">
					<div className="lg:col-span-8">
						<h2
							className="lp-reveal font-bold font-display text-4xl uppercase tracking-tight lg:text-6xl"
							data-reveal="fade-up"
						>
							Two Engines of Above-Market Returns
						</h2>
					</div>
					<div className="lg:col-span-4 lg:text-right">
						<a
							className={cn(
								"lp-reveal inline-flex cursor-pointer items-center gap-2 border px-5 py-3 font-bold text-[10px] uppercase tracking-[0.28em]",
								theme.accentBorder,
								theme.accentText,
								theme.panel
							)}
							data-reveal="fade-in"
							href="#waitlist"
						>
							Request the Full Portfolio Overview
							<ArrowRight className="h-4 w-4" />
						</a>
					</div>
				</div>

				<SwissEngineCard
					description="A traditional MIC originates a mortgage, holds it for 12-24 months, and collects interest. The return is bounded by the interest rate on the loan minus operating costs. If the underwriting is conservative, the interest rate is moderate. Conservative underwriting and above-market returns are structurally incompatible in an originate-and-hold model."
					theme={theme}
					title="Engine 1 - Capital velocity, not credit risk"
				>
					<p
						className="lp-reveal text-base leading-relaxed"
						data-reveal="fade-up"
					>
						FairLend's capital cycle breaks that constraint.
					</p>
					<div className="lp-stagger mt-6 grid gap-4 md:grid-cols-2">
						<EngineStep
							copy="Investor capital is deployed into a vetted private mortgage. FairLend earns a 1% lending fee on origination. Every deal has passed a 90% rejection filter, double appraisals, conservative LTV limits, and multi-layered AI and human underwriting, the same standards any disciplined MIC would apply."
							title="Step 1: Originate"
						/>
						<EngineStep
							copy="The mortgage remains on the books for a maximum of 2 months, not 12-24 months. Short duration means less exposure to market shifts, rate changes, and borrower deterioration. This is a risk reduction, not a risk increase."
							title="Step 2: Hold (Maximum 60 Days)"
						/>
						<EngineStep
							copy="Through institutional relationships and distribution channels built over nearly 30 years, FairLend sells the mortgage to qualified buyers. These channels didn't appear overnight, they are the product of decades of relationship building that a newer manager cannot replicate on day one. Investor capital is freed."
							title="Step 3: Distribute"
						/>
						<EngineStep
							copy="That capital cycles back into the next vetted mortgage, earning another origination fee. The same dollar of invested capital generates multiple fee-earning cycles per year."
							title="Step 4: Redeploy"
						/>
					</div>
					<div
						className={cn(
							"lp-reveal mt-6 rounded border p-4 text-sm leading-relaxed",
							theme.accentBorder,
							theme.accentMutedBg
						)}
						data-reveal="fade-in"
					>
						<strong>The math:</strong> A traditional MIC earns one return stream
						per dollar deployed. FairLend earns multiple origination fees per
						dollar per year, on mortgages underwritten to the same conservative
						standards. The outperformance comes from capital velocity, not from
						looser underwriting, higher LTVs, or riskier borrowers.
					</div>
					<div className="lp-reveal mt-8" data-reveal="fade-in">
						<svg aria-hidden className="h-48 w-full" viewBox="0 0 760 220">
							<title>Decorative visualization</title>
							<circle
								cx="380"
								cy="110"
								fill="none"
								r="78"
								stroke={theme.accentHex}
								strokeDasharray="6 8"
								strokeWidth="2"
							/>
							<circle
								cx="380"
								cy="110"
								fill="none"
								r="48"
								stroke={theme.accentSoftHex}
								strokeWidth="1.5"
							/>
							<path
								className="lp-draw-path"
								d="M380 22 C460 22, 540 68, 560 110"
								fill="none"
								stroke={theme.accentHex}
								strokeWidth="2.5"
							/>
							<path
								className="lp-draw-path"
								d="M560 110 C540 152, 460 198, 380 198"
								fill="none"
								stroke={theme.accentHex}
								strokeWidth="2.5"
								style={{ animationDelay: "150ms" }}
							/>
							<path
								className="lp-draw-path"
								d="M380 198 C300 198, 220 152, 200 110"
								fill="none"
								stroke={theme.accentHex}
								strokeWidth="2.5"
								style={{ animationDelay: "300ms" }}
							/>
							<path
								className="lp-draw-path"
								d="M200 110 C220 68, 300 22, 380 22"
								fill="none"
								stroke={theme.accentHex}
								strokeWidth="2.5"
								style={{ animationDelay: "450ms" }}
							/>
							<text
								className="fill-neutral-500 text-[11px] uppercase tracking-[0.2em]"
								x="346"
								y="115"
							>
								1% fee
							</text>
							<text
								className="fill-neutral-500 text-[11px] uppercase tracking-[0.2em]"
								x="336"
								y="34"
							>
								Originate
							</text>
							<text
								className="fill-neutral-500 text-[11px] uppercase tracking-[0.2em]"
								x="563"
								y="113"
							>
								Hold 60d
							</text>
							<text
								className="fill-neutral-500 text-[11px] uppercase tracking-[0.2em]"
								x="330"
								y="214"
							>
								Distribute
							</text>
							<text
								className="fill-neutral-500 text-[11px] uppercase tracking-[0.2em]"
								x="96"
								y="113"
							>
								Redeploy
							</text>
						</svg>
					</div>
				</SwissEngineCard>

				<SwissEngineCard
					description="FairLend's multiplex construction lending program generates returns of approximately 14%, roughly 2-5% above comparable private mortgage positions. Most MICs don't operate in construction lending because it requires something they don't have: the ability to actually evaluate a build."
					theme={theme}
					title="Engine 2 - Builder expertise that most MICs can't replicate"
				>
					<p
						className="lp-reveal text-base leading-relaxed"
						data-reveal="fade-up"
					>
						FairLend can, because its management team has done the work
						themselves.
					</p>
					<div className="lp-stagger mt-6 grid gap-4 lg:grid-cols-2">
						<EngineDetail
							copy="Elie Soberano has personally built 20+ custom homes and completed 50-60+ renovations. When FairLend underwrites a construction loan, the evaluation isn't limited to financial statements and appraisals. Elie walks the site. He assesses the builder's competence, the material quality, the project timeline, and the structural soundness, because he has built these projects himself. This dual expertise, lender who is also a builder, allows FairLend to identify winners that look mediocre on paper and reject losers that look good on paper. Most MICs can only see the paper."
							title="The expertise edge"
						/>
						<EngineDetail
							copy="Nearly three decades of operating in this space has produced a deep network of contractors, project managers, and construction specialists. If a build starts going off track, delays, budget overruns, quality problems, FairLend doesn't wait for a default. The team brings in the right people to get the project back on course: replacement contractors, specialized trades, experienced project managers. This is active portfolio management at the construction level, not passive lending."
							title="The network edge"
						/>
						<EngineDetail
							copy="FairLend maintains boots on the ground for every construction position in the portfolio. Progress is monitored continuously, not reviewed at quarterly milestones. Every draw is verified against actual progress. Every material delivery is confirmed. The operating principle is trust but verify, and FairLend verifies everything."
							title="The verification edge"
						/>
						<EngineDetail
							copy="Government incentives have fundamentally changed the economics of multiplex construction: elimination of approximately $450K in development levies per 5-plex, HST rebates, and CMHC MLI Select financing. FairLend identified this shift early and pivoted before the opportunity became crowded. The combination of favorable government policy and FairLend's construction underwriting expertise makes this a high-conviction position with structural tailwinds."
							title="Why multiplexes"
						/>
					</div>
					<div
						className={cn(
							"lp-reveal mt-6 rounded border p-4 text-sm leading-relaxed",
							theme.accentBorder,
							theme.panelSoft
						)}
						data-reveal="fade-in"
					>
						<strong>Why this isn't higher risk:</strong> Construction lending at
						most MICs IS higher risk because most MICs are lending blind. They
						evaluate the borrower's creditworthiness and the appraised value of
						the finished product, but they have no ability to assess whether the
						builder can actually deliver. FairLend's builder expertise, active
						site monitoring, and contractor network eliminate the primary risk
						factor in construction lending: the build itself. The higher return
						isn't compensation for higher risk. It's compensation for expertise
						that most lenders don't possess.
					</div>
					<div
						className={cn(
							"lp-reveal mt-8 border p-6",
							theme.accentBorder,
							theme.panel
						)}
						data-reveal="fade-in"
					>
						<svg aria-hidden className="h-44 w-full" viewBox="0 0 760 190">
							<title>Decorative visualization</title>
							<rect
								fill="none"
								height="130"
								stroke={theme.accentHex}
								strokeWidth="2"
								width="180"
								x="30"
								y="30"
							/>
							<rect
								fill="none"
								height="110"
								stroke={theme.accentHex}
								strokeWidth="2"
								width="140"
								x="230"
								y="50"
							/>
							<rect
								fill="none"
								height="150"
								stroke={theme.accentHex}
								strokeWidth="2"
								width="220"
								x="390"
								y="10"
							/>
							<line
								className="lp-draw-path"
								stroke={theme.accentSoftHex}
								strokeWidth="2"
								x1="30"
								x2="610"
								y1="160"
								y2="160"
							/>
							<line
								className="lp-draw-path"
								stroke={theme.accentSoftHex}
								strokeWidth="2"
								x1="120"
								x2="120"
								y1="30"
								y2="10"
							/>
							<line
								className="lp-draw-path"
								stroke={theme.accentSoftHex}
								strokeWidth="2"
								style={{ animationDelay: "180ms" }}
								x1="300"
								x2="300"
								y1="50"
								y2="20"
							/>
							<line
								className="lp-draw-path"
								stroke={theme.accentSoftHex}
								strokeWidth="2"
								style={{ animationDelay: "320ms" }}
								x1="500"
								x2="500"
								y1="10"
								y2="-10"
							/>
							<text
								className="fill-neutral-500 text-[10px] uppercase tracking-[0.2em]"
								x="36"
								y="24"
							>
								Builder + Lender Expertise
							</text>
							<text
								className={cn(
									"font-bold text-[26px] tracking-tight",
									theme.accentText
								)}
								x="642"
								y="96"
							>
								~14%
							</text>
						</svg>
					</div>
				</SwissEngineCard>

				<div
					className={cn(
						"lp-reveal border p-6 lg:p-8",
						theme.accentBorder,
						theme.accentMutedBg
					)}
					data-reveal="fade-up"
				>
					<p className="text-base leading-relaxed lg:text-lg">
						Combined, these two engines create a portfolio that delivers
						above-market returns through operational capability, not through
						relaxed credit standards. The capital cycle generates alpha through
						velocity. The multiplex program generates alpha through expertise.
						Both operate under the same conservative underwriting framework.
					</p>
				</div>
			</div>
		</SwissSection>
	);
}

function ProtectionSection({ theme }: { theme: VariantTheme }) {
	return (
		<SwissSection
			id="protection"
			leftTone={theme.sectionTones.protection}
			rightTone={theme.sectionTones.protection}
			subtitle="SECTION 05"
			title="CAPITAL PROTECTION"
			tone={theme.sectionTones.protection}
		>
			<div className="px-8 py-14 lg:px-14 lg:py-20">
				<div className="grid gap-8 lg:grid-cols-12 lg:items-start">
					<div className="lg:col-span-4">
						<h2
							className="lp-reveal font-bold font-display text-4xl uppercase leading-[0.9] tracking-tight lg:text-5xl"
							data-reveal="fade-up"
						>
							Six independent layers of capital protection
						</h2>
						<div
							className="lp-reveal mt-8"
							data-delay="1"
							data-reveal="fade-in"
						>
							<svg aria-hidden className="h-56 w-full" viewBox="0 0 280 240">
								<title>Decorative visualization</title>
								<polygon
									fill="none"
									points="140,16 252,74 252,166 140,224 28,166 28,74"
									stroke={theme.accentHex}
									strokeWidth="2"
								/>
								<polygon
									fill="none"
									points="140,44 228,90 228,150 140,196 52,150 52,90"
									stroke={theme.accentHex}
									strokeWidth="1.5"
								/>
								{[0, 1, 2, 3, 4, 5].map((ring) => (
									<circle
										className="lp-signal-pulse"
										cx={140}
										cy={28 + ring * 34}
										fill={theme.accentSoftHex}
										key={ring}
										r="4"
										style={{ animationDelay: `${ring * 120}ms` }}
									/>
								))}
							</svg>
							<p
								className={cn(
									"font-mono text-[10px] uppercase tracking-[0.28em]",
									theme.subtleText
								)}
							>
								6 independent protections
							</p>
						</div>
					</div>
					<div className="lp-stagger grid gap-4 md:grid-cols-2 lg:col-span-8">
						{protectionLayers.map((layer) => (
							<div
								className={cn(
									"lp-hover-raise lp-reveal border p-5 lg:p-6",
									theme.accentBorder,
									theme.panel
								)}
								data-reveal="fade-up"
								key={layer.title}
							>
								<h3
									className={cn(
										"mb-3 font-bold font-display text-lg tracking-tight",
										theme.accentText
									)}
								>
									{layer.title}
								</h3>
								<p className={cn("text-sm leading-relaxed", theme.subtleText)}>
									{layer.copy}
								</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</SwissSection>
	);
}

function TransparencySection({ theme }: { theme: VariantTheme }) {
	const isDark =
		theme.sectionTones.transparency.includes("dark") ||
		theme.sectionTones.transparency.includes("green");

	return (
		<SwissSection
			id="transparency"
			leftTone={theme.sectionTones.transparency}
			rightTone={theme.sectionTones.transparency}
			subtitle="SECTION 06"
			title="TRANSPARENCY"
			titleTone="inverse"
			tone={theme.sectionTones.transparency}
		>
			<div className="grid gap-8 px-8 py-14 lg:grid-cols-12 lg:px-14 lg:py-20">
				<div className="lg:col-span-6">
					<h2
						className="lp-reveal font-bold font-display text-4xl uppercase leading-[0.95] tracking-tight lg:text-5xl"
						data-reveal="fade-up"
					>
						Full portfolio transparency.
						<br />
						In real time. Not quarterly.
					</h2>
					<p
						className={cn(
							"lp-reveal mt-6 text-base leading-relaxed",
							isDark ? "text-white/80" : theme.subtleText
						)}
						data-delay="1"
						data-reveal="fade-up"
					>
						FairLend's investor portal provides complete, live visibility into
						every aspect of your investment:
					</p>
					<ul className="lp-stagger mt-6 space-y-3">
						{portalItems.map((item) => (
							<li
								className="lp-reveal flex items-start gap-3"
								data-reveal="fade-up"
								key={item}
							>
								<span
									className={cn(
										"mt-1 block h-2 w-2 rounded-full",
										theme.accentBg
									)}
								/>
								<span
									className={cn(
										"text-sm leading-relaxed",
										isDark ? "text-white/85" : theme.subtleText
									)}
								>
									{item}
								</span>
							</li>
						))}
					</ul>
				</div>
				<div className="lg:col-span-6">
					<div
						className={cn(
							"lp-reveal border p-5 lg:p-6",
							theme.accentBorder,
							isDark ? "bg-black/30" : theme.panel
						)}
						data-reveal="fade-in"
					>
						<div className="mb-5 flex items-center justify-between">
							<p
								className={cn(
									"font-mono text-[10px] uppercase tracking-[0.28em]",
									isDark ? "text-white/50" : theme.subtleText
								)}
							>
								Live Portfolio Surface
							</p>
							<LineChart className={cn("h-4 w-4", theme.accentText)} />
						</div>
						<svg aria-hidden className="h-52 w-full" viewBox="0 0 520 220">
							<title>Decorative visualization</title>
							<rect
								fill="none"
								height="188"
								rx="10"
								stroke={theme.accentHex}
								strokeWidth="1.5"
								width="500"
								x="10"
								y="16"
							/>
							<line
								stroke={theme.accentHex}
								strokeWidth="1"
								x1="10"
								x2="510"
								y1="58"
								y2="58"
							/>
							<line
								stroke={theme.accentHex}
								strokeWidth="1"
								x1="180"
								x2="180"
								y1="16"
								y2="204"
							/>
							<line
								stroke={theme.accentHex}
								strokeWidth="1"
								x1="345"
								x2="345"
								y1="16"
								y2="204"
							/>
							<path
								className="lp-draw-path"
								d="M30 176 L100 130 L160 146 L220 96 L280 118 L350 64 L420 90 L488 44"
								fill="none"
								stroke={theme.accentSoftHex}
								strokeWidth="2.5"
							/>
							<text
								className={cn(
									"text-[10px] uppercase tracking-[0.18em]",
									isDark ? "fill-white/60" : "fill-neutral-500"
								)}
								x="30"
								y="44"
							>
								Position-Level Data
							</text>
							<text
								className={cn(
									"text-[10px] uppercase tracking-[0.18em]",
									isDark ? "fill-white/60" : "fill-neutral-500"
								)}
								x="198"
								y="44"
							>
								Payment Tracking
							</text>
							<text
								className={cn(
									"text-[10px] uppercase tracking-[0.18em]",
									isDark ? "fill-white/60" : "fill-neutral-500"
								)}
								x="364"
								y="44"
							>
								Money Flow
							</text>
						</svg>
					</div>
					<p
						className={cn(
							"lp-reveal mt-6 text-sm leading-relaxed",
							isDark ? "text-white/80" : theme.subtleText
						)}
						data-delay="1"
						data-reveal="fade-up"
					>
						Compare this to what you currently receive from your MIC allocation.
						Most managers, even good ones, send a quarterly PDF summarizing
						portfolio performance at the aggregate level. You're trusting that
						the underlying positions are what they say they are. FairLend
						eliminates that trust requirement. Every position, every money flow,
						and every vetting decision is visible in real time.
					</p>
					<p
						className={cn(
							"lp-reveal mt-4 font-bold text-xs uppercase tracking-[0.18em]",
							theme.accentText
						)}
						data-delay="2"
						data-reveal="fade-up"
					>
						The system keeps us accountable, by design, not by promise.
					</p>
				</div>
			</div>
		</SwissSection>
	);
}

function CaseStudySection({ theme }: { theme: VariantTheme }) {
	return (
		<SwissSection
			id="case-study"
			leftTone={theme.sectionTones.caseStudy}
			rightTone={theme.sectionTones.caseStudy}
			subtitle="SECTION 07"
			title="CASE STUDY"
			tone={theme.sectionTones.caseStudy}
		>
			<div className="grid gap-8 px-8 py-14 lg:grid-cols-12 lg:px-14 lg:py-20">
				<div className="lg:col-span-4">
					<h2
						className="lp-reveal font-bold font-display text-4xl uppercase leading-[0.92] tracking-tight lg:text-5xl"
						data-reveal="fade-up"
					>
						A contested default.
						<br />A 16-month legal battle.
						<br />
						100% recovery.
					</h2>
					<div
						className={cn(
							"lp-reveal mt-6 inline-flex items-center gap-3 rounded border px-4 py-2 text-[11px] uppercase tracking-[0.25em]",
							theme.accentBorder,
							theme.accentText
						)}
						data-reveal="fade-in"
					>
						<ShieldCheck className="h-4 w-4" />
						Live default-response protocol
					</div>
					<div className="lp-reveal mt-8" data-delay="1" data-reveal="fade-in">
						<svg aria-hidden className="h-52 w-full" viewBox="0 0 280 240">
							<title>Decorative visualization</title>
							<line
								className="lp-draw-path"
								stroke={theme.accentHex}
								strokeWidth="2"
								x1="28"
								x2="252"
								y1="32"
								y2="208"
							/>
							<circle cx="40" cy="42" fill={theme.accentHex} r="9" />
							<circle cx="108" cy="96" fill={theme.accentSoftHex} r="9" />
							<circle cx="176" cy="150" fill={theme.accentHex} r="9" />
							<circle cx="240" cy="198" fill={theme.accentSoftHex} r="9" />
							<text
								className="fill-neutral-500 text-[10px] uppercase tracking-[0.16em]"
								x="52"
								y="38"
							>
								Default
							</text>
							<text
								className="fill-neutral-500 text-[10px] uppercase tracking-[0.16em]"
								x="120"
								y="92"
							>
								Litigation
							</text>
							<text
								className="fill-neutral-500 text-[10px] uppercase tracking-[0.16em]"
								x="188"
								y="146"
							>
								Receivership
							</text>
							<text
								className="fill-neutral-500 text-[10px] uppercase tracking-[0.16em]"
								x="188"
								y="214"
							>
								100% recovery
							</text>
						</svg>
					</div>
				</div>
				<div className="space-y-6 lg:col-span-8">
					<BodyParagraph delay="1">
						A borrower defaulted and contested the power of sale. Opposing
						counsel moved to extend timelines and stonewall proceedings. The
						case entered a 16-month legal proceeding, the kind of contested
						default that most private lenders are not equipped to resolve.
					</BodyParagraph>
					<p
						className={cn(
							"lp-reveal font-bold text-xs uppercase tracking-[0.2em]",
							theme.accentText
						)}
						data-delay="2"
						data-reveal="fade-up"
					>
						FairLend's response:
					</p>
					<ul className="lp-stagger space-y-3">
						{caseResponse.map((item) => (
							<li
								className="lp-reveal flex items-start gap-3"
								data-reveal="fade-up"
								key={item}
							>
								<ArrowRight
									className={cn("mt-0.5 h-4 w-4", theme.accentText)}
								/>
								<span
									className={cn("text-sm leading-relaxed", theme.subtleText)}
								>
									{item}
								</span>
							</li>
						))}
					</ul>
					<div
						className={cn(
							"lp-reveal border p-5",
							theme.accentBorder,
							theme.accentMutedBg
						)}
						data-reveal="fade-in"
					>
						<p className="text-base leading-relaxed">
							<strong>Result:</strong> 100% recovery. Every dollar of principal
							and every dollar of interest returned to investors.
						</p>
					</div>
					<BodyParagraph delay="3">
						This is not an outlier. It is the standard. FairLend maintains a
						standing legal and default response capability with a proven
						playbook because the time to prepare for a contested default is
						before it happens, not during.
					</BodyParagraph>
					<a
						className={cn(
							"lp-reveal inline-flex cursor-pointer items-center gap-2 border px-5 py-3 font-bold text-[10px] uppercase tracking-[0.25em]",
							theme.accentBorder,
							theme.accentText
						)}
						data-reveal="fade-in"
						href="#waitlist"
					>
						Request the Capital Protection Overview
						<ArrowRight className="h-4 w-4" />
					</a>
				</div>
			</div>
		</SwissSection>
	);
}

function TeamSection({
	theme,
	variant,
}: {
	theme: VariantTheme;
	variant: CodexVariant;
}) {
	return (
		<SwissSection
			id="team"
			leftTone={theme.sectionTones.team}
			rightTone={theme.sectionTones.team}
			subtitle="SECTION 08"
			title="LEADERSHIP"
			tone={theme.sectionTones.team}
		>
			<div className="px-8 py-14 lg:px-14 lg:py-20">
				<div className="grid gap-8 lg:grid-cols-12">
					<div className="lg:col-span-4">
						<h2
							className="lp-reveal font-bold font-display text-4xl uppercase leading-[0.9] tracking-tight lg:text-5xl"
							data-reveal="fade-up"
						>
							The team managing your capital and why they can run both engines
						</h2>
						<div className="lp-reveal mt-8" data-reveal="fade-in">
							<svg aria-hidden className="h-52 w-full" viewBox="0 0 280 220">
								<title>Decorative visualization</title>
								<circle cx="70" cy="54" fill={theme.accentHex} r="22" />
								<circle cx="210" cy="54" fill={theme.accentHex} r="22" />
								<circle cx="140" cy="170" fill={theme.accentSoftHex} r="26" />
								<line
									className="lp-draw-path"
									stroke={theme.accentHex}
									strokeWidth="2"
									x1="70"
									x2="140"
									y1="54"
									y2="170"
								/>
								<line
									className="lp-draw-path"
									stroke={theme.accentHex}
									strokeWidth="2"
									style={{ animationDelay: "200ms" }}
									x1="210"
									x2="140"
									y1="54"
									y2="170"
								/>
								<line
									className="lp-draw-path"
									stroke={theme.accentHex}
									strokeWidth="2"
									style={{ animationDelay: "400ms" }}
									x1="70"
									x2="210"
									y1="54"
									y2="54"
								/>
								<text
									className="fill-white text-[10px] uppercase tracking-[0.14em]"
									x="48"
									y="58"
								>
									Lending
								</text>
								<text
									className="fill-white text-[10px] uppercase tracking-[0.14em]"
									x="186"
									y="58"
								>
									Build
								</text>
								<text
									className="fill-white text-[10px] uppercase tracking-[0.14em]"
									x="114"
									y="174"
								>
									Ops
								</text>
							</svg>
							<p
								className={cn(
									"font-mono text-[10px] uppercase tracking-[0.25em]",
									theme.subtleText
								)}
							>
								Capability topology / {variant}
							</p>
						</div>
					</div>
					<div className="space-y-4 lg:col-span-8">
						{teamBlocks.map((block, index) => (
							<div
								className={cn(
									"lp-hover-raise lp-reveal border p-5 lg:p-6",
									theme.accentBorder,
									index % 2 ? theme.panelSoft : theme.panel
								)}
								data-reveal="fade-up"
								key={block.title}
							>
								<h3
									className={cn(
										"mb-3 font-bold font-display text-xl tracking-tight",
										theme.accentText
									)}
								>
									{block.title}
								</h3>
								<div className="space-y-3">
									{block.copy.map((item) => (
										<p
											className={cn(
												"text-sm leading-relaxed",
												theme.subtleText
											)}
											key={item}
										>
											{item}
										</p>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</SwissSection>
	);
}

function MarketForesightSection({ theme }: { theme: VariantTheme }) {
	return (
		<SwissSection
			id="market"
			leftTone={theme.sectionTones.market}
			rightTone={theme.sectionTones.market}
			subtitle="SECTION 09"
			title="MARKET FORESIGHT"
			tone={theme.sectionTones.market}
		>
			<div className="px-8 py-14 lg:px-14 lg:py-20">
				<h2
					className="lp-reveal max-w-4xl font-bold font-display text-4xl uppercase leading-[0.92] tracking-tight lg:text-5xl"
					data-reveal="fade-up"
				>
					A track record of anticipating market shifts, not reacting to them
				</h2>
				<div className="lp-stagger mt-8 grid gap-4 lg:grid-cols-3">
					<SignalCard
						copy="At a national mortgage brokerage conference in Vancouver, Elie identified that incoming CMHC rule changes would trigger a market correction. He began repositioning 16 months before the April 2017 downturn, while most of the industry was still originating at the top."
						theme={theme}
						title="November 2016: Predicting the correction"
					/>
					<SignalCard
						copy="While the broader market continued building single-family homes, Elie identified that government incentives, elimination of approximately $450K in development levies per 5-plex, HST rebates, and CMHC MLI Select financing, had fundamentally changed the economics. FairLend pivoted to multiplex construction lending before the opportunity became crowded and margins compressed."
						theme={theme}
						title="The Multiplex Pivot"
					/>
					<SignalCard
						copy="The capital cycle provides an additional layer of protection that traditional MICs cannot match: because most positions are held for a maximum of 60 days, FairLend can slow or pause new deployments within weeks if market conditions deteriorate. A traditional MIC holding 12-24 month positions has no such option, their capital is locked into positions originated months ago, under conditions that may no longer hold."
						theme={theme}
						title="Structural downside agility"
					/>
				</div>
				<p
					className={cn(
						"lp-reveal mt-8 text-sm leading-relaxed lg:text-base",
						theme.subtleText
					)}
					data-delay="2"
					data-reveal="fade-up"
				>
					These are not lucky calls. They reflect a first-principles
					understanding of how capital flows through the lending system, how
					regulatory changes ripple through property valuations, and how lender
					behavior shifts in response. FairLend's leadership reads the market
					12-18 months ahead because they understand its underlying mechanics,
					not just its surface indicators.
				</p>
				<div
					className={cn(
						"lp-reveal mt-8 border p-5",
						theme.accentBorder,
						theme.panelSoft
					)}
					data-reveal="fade-in"
				>
					<svg aria-hidden className="h-20 w-full" viewBox="0 0 1180 100">
						<title>Decorative visualization</title>
						<rect
							fill="none"
							height="64"
							stroke={theme.accentHex}
							strokeWidth="1.4"
							width="1160"
							x="10"
							y="18"
						/>
						<path
							className="lp-draw-path"
							d="M30 70 L130 44 L230 56 L330 38 L430 66 L530 34 L630 58 L730 30 L830 62 L930 40 L1030 54 L1140 28"
							fill="none"
							stroke={theme.accentSoftHex}
							strokeWidth="2.6"
						/>
					</svg>
				</div>
			</div>
		</SwissSection>
	);
}

function AlignmentSection({ theme }: { theme: VariantTheme }) {
	const isDark =
		theme.sectionTones.alignment.includes("dark") ||
		theme.sectionTones.alignment.includes("green");

	return (
		<SwissSection
			id="alignment"
			leftTone={theme.sectionTones.alignment}
			rightTone={theme.sectionTones.alignment}
			subtitle="SECTION 10"
			title="ALIGNMENT"
			titleTone="inverse"
			tone={theme.sectionTones.alignment}
		>
			<div className="grid gap-8 px-8 py-14 lg:grid-cols-12 lg:px-14 lg:py-20">
				<div className="lg:col-span-5">
					<h2
						className="lp-reveal font-bold font-display text-4xl uppercase leading-[0.9] tracking-tight lg:text-5xl"
						data-reveal="fade-up"
					>
						Aligned incentives.
						<br />
						No self-dealing.
						<br />
						Verify it yourself.
					</h2>
					<p
						className={cn(
							"lp-reveal mt-6 text-base leading-relaxed",
							isDark ? "text-white/85" : theme.subtleText
						)}
						data-delay="1"
						data-reveal="fade-up"
					>
						The biggest risk in private lending isn't a bad mortgage, it's a bad
						manager. FairLend's operating structure eliminates the conflicts
						that erode investor returns at most MICs:
					</p>
					<div className="lp-reveal mt-8" data-delay="2" data-reveal="fade-in">
						<svg aria-hidden className="h-44 w-full" viewBox="0 0 360 170">
							<title>Decorative visualization</title>
							<path
								className="lp-draw-path"
								d="M30 146 H330"
								fill="none"
								stroke={theme.accentHex}
								strokeWidth="2"
							/>
							<path
								className="lp-draw-path"
								d="M70 146 V44 H170"
								fill="none"
								stroke={theme.accentHex}
								strokeWidth="2"
								style={{ animationDelay: "200ms" }}
							/>
							<path
								className="lp-draw-path"
								d="M290 146 V44 H190"
								fill="none"
								stroke={theme.accentHex}
								strokeWidth="2"
								style={{ animationDelay: "400ms" }}
							/>
							<circle cx="180" cy="44" fill={theme.accentSoftHex} r="10" />
							<text
								className={cn(
									"text-[10px] uppercase tracking-[0.2em]",
									isDark ? "fill-white/60" : "fill-neutral-500"
								)}
								x="128"
								y="26"
							>
								Aligned incentives
							</text>
						</svg>
					</div>
				</div>
				<div className="space-y-4 lg:col-span-7">
					<AlignmentCard
						copy="No $450 NSF fees, no debt traps, no revenue extracted through management self-dealing. Every dollar of fee income is earned through origination and disclosed transparently."
						isDark={isDark}
						theme={theme}
						title="No predatory borrower fees"
					/>
					<AlignmentCard
						copy="Borrowers see the same terms every time. This eliminates hidden complexity and attracts higher-quality borrowers who have options and choose FairLend because the terms are fair."
						isDark={isDark}
						theme={theme}
						title="Publicly viewable, standardized contracts"
					/>
					<AlignmentCard
						copy="The capital cycle's profitability depends on deal volume across high-quality positions. A single default disrupts the entire cycle, it removes capital from rotation and triggers the recovery process. Management's economic interest and your capital preservation interest are structurally identical."
						isDark={isDark}
						theme={theme}
						title="No incentive to originate bad loans"
					/>
					<AlignmentCard
						copy="FairLend measures the carbon emissions of every construction build and its materials, then pays from its own fee, not yours, to reach net carbon zero. Sustainable investing isn't a marketing line. It's a line item."
						isDark={isDark}
						theme={theme}
						title="ESG commitment funded from the management fee"
					/>
					<p
						className={cn(
							"lp-reveal border-t pt-5 text-sm leading-relaxed",
							isDark
								? "border-white/20 text-white/80"
								: cn(theme.accentBorder, theme.subtleText)
						)}
						data-reveal="fade-up"
					>
						When borrowers are treated fairly, they perform better. When they
						perform better, default rates stay low. When default rates stay low,
						your capital compounds. Alignment isn't a philosophy, it's the
						operating structure.
					</p>
				</div>
			</div>
		</SwissSection>
	);
}

function FAQSection({ theme }: { theme: VariantTheme }) {
	return (
		<SwissSection
			id="faq"
			leftTone={theme.sectionTones.faq}
			rightTone={theme.sectionTones.faq}
			subtitle="SECTION 11"
			title="FAQ"
			tone={theme.sectionTones.faq}
		>
			<div className="px-8 py-14 lg:px-14 lg:py-20">
				<div className="mb-8 lg:mb-10">
					<h2
						className="lp-reveal font-bold font-display text-4xl uppercase leading-[0.92] tracking-tight lg:text-5xl"
						data-reveal="fade-up"
					>
						Questions we hear from investors and their advisors
					</h2>
				</div>
				<div className="lp-stagger space-y-4">
					{faqItems.map((item) => (
						<div
							className={cn(
								"lp-hover-raise lp-reveal border p-5 lg:p-6",
								theme.accentBorder,
								theme.panel
							)}
							data-reveal="fade-up"
							key={item.q}
						>
							<h3
								className={cn(
									"font-bold text-sm uppercase tracking-[0.18em]",
									theme.accentText
								)}
							>
								{item.q}
							</h3>
							<p
								className={cn("mt-3 text-sm leading-relaxed", theme.subtleText)}
							>
								{item.a}
							</p>
						</div>
					))}
				</div>
				<div
					className={cn(
						"lp-reveal mt-8 border p-5",
						theme.accentBorder,
						theme.panelSoft
					)}
					data-reveal="fade-in"
				>
					<svg aria-hidden className="h-16 w-full" viewBox="0 0 1120 80">
						<title>Decorative visualization</title>
						<path
							className="lp-draw-path"
							d="M20 44 C120 18, 220 68, 320 44 C420 18, 520 68, 620 44 C720 18, 820 68, 920 44 C980 32, 1040 32, 1100 44"
							fill="none"
							stroke={theme.accentHex}
							strokeWidth="2"
						/>
					</svg>
				</div>
			</div>
		</SwissSection>
	);
}

function FinalCTASection({
	theme,
	variant,
}: {
	theme: VariantTheme;
	variant: CodexVariant;
}) {
	const isDark =
		theme.sectionTones.final.includes("dark") ||
		theme.sectionTones.final.includes("green");

	return (
		<SwissSection
			id="waitlist"
			leftTone={theme.sectionTones.final}
			rightTone={theme.sectionTones.final}
			subtitle="SECTION 12"
			title="FINAL CTA"
			titleTone="inverse"
			tone={theme.sectionTones.final}
		>
			<div className="grid gap-8 px-8 py-16 lg:grid-cols-12 lg:px-14 lg:py-24">
				<div className="lg:col-span-8">
					<h2
						className="lp-reveal font-bold font-display text-4xl uppercase leading-[0.9] tracking-tight lg:text-6xl"
						data-reveal="fade-up"
					>
						Conservative underwriting.
						<br />
						Two engines of alpha.
						<br />
						Now you know how.
					</h2>
					<p
						className={cn(
							"lp-reveal mt-6 text-base leading-relaxed lg:text-lg",
							isDark ? "text-white/85" : theme.subtleText
						)}
						data-delay="1"
						data-reveal="fade-up"
					>
						FairLend combines nearly 30 years of mortgage expertise, rare
						builder + lender dual capability, institutional-grade technology,
						and two distinct engines of above-market return, a capital cycle
						that compounds origination fees through rapid redeployment, and a
						multiplex construction lending program generating approximately 14%
						returns through expertise most MICs don't possess. All structured
						around six independent layers of investor protection and complete
						real-time transparency.
					</p>
					<p
						className={cn(
							"lp-reveal mt-4 text-base leading-relaxed lg:text-lg",
							isDark ? "text-white/85" : theme.subtleText
						)}
						data-delay="2"
						data-reveal="fade-up"
					>
						Fully regulated. Tax-advantaged. Built on the thesis that
						conservative underwriting and above-market returns aren't opposites,
						they're the product of a better operating model and deeper
						expertise.
					</p>
					<p
						className={cn("lp-reveal mt-4 font-bold text-lg", theme.accentText)}
						data-delay="3"
						data-reveal="fade-up"
					>
						You no longer have to choose between a manager you trust and a
						return worth having.
					</p>
					<div
						className="lp-reveal mt-8 flex flex-wrap gap-3"
						data-delay="4"
						data-reveal="fade-in"
					>
						<a
							className={cn(
								"lp-cta inline-flex cursor-pointer items-center gap-2 px-5 py-3 font-bold text-[10px] uppercase tracking-[0.25em]",
								theme.primaryButton
							)}
							href="#waitlist"
						>
							Request the Investor Package
							<ArrowRight className="h-4 w-4" />
						</a>
						<a
							className={cn(
								"inline-flex cursor-pointer items-center gap-2 border px-5 py-3 font-bold text-[10px] uppercase tracking-[0.25em]",
								theme.secondaryButton
							)}
							href="mailto:invest@fairlend.com"
						>
							Schedule a Call with the Team
							<Mail className="h-4 w-4" />
						</a>
					</div>
				</div>
				<div className="lg:col-span-4">
					<div
						className={cn(
							"lp-reveal border p-5",
							theme.accentBorder,
							isDark ? "bg-black/25" : theme.panel
						)}
						data-reveal="fade-in"
					>
						<svg aria-hidden className="h-64 w-full" viewBox="0 0 280 280">
							<title>Decorative visualization</title>
							<rect
								fill="none"
								height="232"
								stroke={theme.accentHex}
								strokeWidth="1.6"
								width="232"
								x="24"
								y="24"
							/>
							<path
								className="lp-draw-path"
								d="M40 220 L96 174 L144 190 L188 140 L232 162"
								fill="none"
								stroke={theme.accentHex}
								strokeWidth="3"
							/>
							<circle
								className="lp-signal-pulse"
								cx="96"
								cy="174"
								fill={theme.accentSoftHex}
								r="6"
							/>
							<circle
								className="lp-signal-pulse"
								cx="188"
								cy="140"
								fill={theme.accentSoftHex}
								r="6"
								style={{ animationDelay: "220ms" }}
							/>
							<text
								className={cn(
									"text-[10px] uppercase tracking-[0.2em]",
									isDark ? "fill-white/60" : "fill-neutral-500"
								)}
								x="40"
								y="58"
							>
								Conservative Underwriting
							</text>
							<text
								className={cn(
									"text-[10px] uppercase tracking-[0.2em]",
									isDark ? "fill-white/60" : "fill-neutral-500"
								)}
								x="40"
								y="74"
							>
								Two Engines / Above-Market Return
							</text>
							<text
								className={cn(
									"text-[10px] uppercase tracking-[0.2em]",
									isDark ? "fill-white/60" : "fill-neutral-500"
								)}
								x="40"
								y="90"
							>
								Variant: {variant}
							</text>
						</svg>
					</div>
				</div>
			</div>
		</SwissSection>
	);
}

function Footer({ theme }: { theme: VariantTheme }) {
	return (
		<footer
			className={cn(
				"relative z-10 border-t",
				theme.headerBorder,
				theme.headerBg
			)}
		>
			<div className="mx-auto flex max-w-7xl flex-col gap-3 px-8 py-8 text-[10px] uppercase tracking-[0.22em] lg:flex-row lg:items-center lg:justify-between">
				<p className={theme.headerMeta}>
					FairLend MIC - Above-Market Private Mortgage Returns with
					Institutional Capital Protection
				</p>
				<div className="flex items-center gap-5">
					<span className={theme.headerMeta}>FSRA + OSC compliant</span>
					<span className={theme.headerMeta}>TFSA / RRSP / RESP eligible</span>
				</div>
			</div>
		</footer>
	);
}

function BodyParagraph({
	children,
	delay,
}: {
	children: ReactNode;
	delay?: "1" | "2" | "3" | "4";
}) {
	return (
		<p
			className="lp-reveal text-sm leading-relaxed lg:text-base"
			data-delay={delay}
			data-reveal="fade-up"
		>
			{children}
		</p>
	);
}

function SwissEngineCard({
	theme,
	title,
	description,
	children,
}: {
	theme: VariantTheme;
	title: string;
	description: string;
	children: ReactNode;
}) {
	return (
		<div className={cn("border p-6 lg:p-8", theme.accentBorder, theme.panel)}>
			<h3
				className={cn(
					"lp-reveal font-bold font-display text-2xl tracking-tight lg:text-3xl",
					theme.accentText
				)}
				data-reveal="fade-up"
			>
				{title}
			</h3>
			<p
				className={cn(
					"lp-reveal mt-4 text-sm leading-relaxed lg:text-base",
					theme.subtleText
				)}
				data-delay="1"
				data-reveal="fade-up"
			>
				{description}
			</p>
			<div className="mt-6">{children}</div>
		</div>
	);
}

function EngineStep({ title, copy }: { title: string; copy: string }) {
	return (
		<div
			className="lp-hover-raise lp-reveal border border-neutral-300/60 bg-white/60 p-4"
			data-reveal="fade-up"
		>
			<h4 className="mb-2 font-bold text-neutral-700 text-xs uppercase tracking-[0.2em]">
				{title}
			</h4>
			<p className="text-neutral-600 text-sm leading-relaxed">{copy}</p>
		</div>
	);
}

function EngineDetail({ title, copy }: { title: string; copy: string }) {
	return (
		<div
			className="lp-hover-raise lp-reveal border border-neutral-300/60 bg-white/50 p-4"
			data-reveal="fade-up"
		>
			<h4 className="mb-2 font-bold text-neutral-700 text-xs uppercase tracking-[0.2em]">
				{title}
			</h4>
			<p className="text-neutral-600 text-sm leading-relaxed">{copy}</p>
		</div>
	);
}

function SignalCard({
	theme,
	title,
	copy,
}: {
	theme: VariantTheme;
	title: string;
	copy: string;
}) {
	return (
		<div
			className={cn(
				"lp-hover-raise lp-reveal border p-5",
				theme.accentBorder,
				theme.panel
			)}
			data-reveal="fade-up"
		>
			<h3
				className={cn(
					"mb-3 font-bold text-sm uppercase tracking-[0.18em]",
					theme.accentText
				)}
			>
				{title}
			</h3>
			<p className={cn("text-sm leading-relaxed", theme.subtleText)}>{copy}</p>
		</div>
	);
}

function AlignmentCard({
	theme,
	title,
	copy,
	isDark,
}: {
	theme: VariantTheme;
	title: string;
	copy: string;
	isDark: boolean;
}) {
	return (
		<div
			className={cn(
				"lp-hover-raise lp-reveal border p-5",
				theme.accentBorder,
				isDark ? "bg-black/25" : theme.panel
			)}
			data-reveal="fade-up"
		>
			<h3
				className={cn(
					"font-bold text-sm uppercase tracking-[0.18em]",
					theme.accentText
				)}
			>
				{title}
			</h3>
			<p
				className={cn(
					"mt-3 text-sm leading-relaxed",
					isDark ? "text-white/80" : theme.subtleText
				)}
			>
				{copy}
			</p>
		</div>
	);
}

function HeroSection() {
	return (
		<section
			className="section-grid min-h-[calc(100vh-16rem)] bg-white dark:bg-background-dark"
			id="how-it-works"
		>
			<div className="margin-col swiss-border border-r">
				<div className="h-full w-px bg-neutral-100 dark:bg-neutral-900/20" />
			</div>
			<div className="grid w-full grid-cols-1 lg:grid-cols-12">
				<div className="swiss-border col-span-12 flex flex-col border-b lg:col-span-5 lg:border-r lg:border-b-0">
					<div className="flex flex-grow flex-col justify-between px-8 pt-12 pb-8 lg:px-12 lg:pt-16 lg:pb-12">
						<div>
							<div
								className="lp-reveal mb-12 flex items-center space-x-4 lg:mb-20"
								data-delay="1"
								data-reveal="fade-up"
							>
								<span className="h-[2px] w-12 bg-primary" />
								<span className="font-bold text-[12px] text-neutral-500 uppercase tracking-[0.4em]">
									FairLend MIC
								</span>
							</div>
							<div className="mb-12 lg:mb-16">
								<h1
									className="lp-reveal -ml-1 mb-4 font-black font-display text-[56px] uppercase leading-[0.85] tracking-tighter md:text-[70px] lg:text-[90px] xl:text-[110px]"
									data-delay="2"
									data-reveal="fade-up"
								>
									FairLend
								</h1>
								<div
									className="lp-reveal -mt-2 md:-mt-4 mb-8 font-serif text-5xl text-primary lowercase italic tracking-tight md:mb-12 md:text-6xl lg:text-7xl xl:text-8xl"
									data-delay="3"
									data-reveal="fade-up"
								>
									mic
								</div>
								<div className="w-full max-w-[400px]">
									<p
										className="lp-reveal text-justify font-light text-[15px] text-neutral-600 leading-[1.6] md:text-[16px] dark:text-neutral-400"
										data-delay="4"
										data-reveal="fade-up"
									>
										The FairLend MIC is a pooled vehicle that provides
										short-term funding for private, interest-only mortgages.
										Instead of holding mortgages for years, the MIC funds them
										for a few days, earns fees and interest, then sells them to
										long-term buyers on the FairLend marketplace.
									</p>
								</div>
							</div>
						</div>
						<div
							className="lp-reveal flex flex-wrap gap-4"
							data-delay="5"
							data-reveal="fade-in"
						>
							<a
								className="lp-cta lp-hover-raise inline-flex cursor-pointer items-center gap-2 bg-primary px-6 py-3 font-bold text-[11px] text-white uppercase tracking-widest transition-all hover:bg-neutral-900"
								href="#waitlist"
							>
								Get Started
								<ArrowRight className="h-4 w-4" />
							</a>
							<a
								className="lp-hover-raise inline-flex cursor-pointer items-center gap-2 border border-neutral-200 bg-white px-6 py-3 font-bold text-[11px] uppercase tracking-widest transition-all hover:border-primary hover:text-primary dark:border-neutral-800 dark:bg-black"
								href="#spin-model"
							>
								Learn More
							</a>
						</div>
					</div>
					<div
						className="swiss-border group lp-reveal relative h-[280px] overflow-hidden border-t lg:h-[300px]"
						data-delay="2"
						data-reveal="fade-in"
					>
						<div className="absolute inset-0 bg-architectural bg-center bg-cover opacity-20 contrast-125 grayscale transition-opacity duration-700 group-hover:opacity-30" />
						<div className="relative z-10 flex h-full flex-col justify-between p-8 lg:p-12">
							<div>
								<h3 className="stat-label text-neutral-500">The Spin Model</h3>
								<div className="mt-4 h-[2px] w-12 bg-primary" />
							</div>
							<div>
								<p className="mb-2 font-bold font-display text-2xl uppercase leading-none tracking-tight lg:text-3xl">
									Short-Term Lender
								</p>
								<p className="font-serif text-neutral-600 text-xl italic lg:text-2xl dark:text-neutral-400">
									Long-Term Buyers
								</p>
							</div>
							<div className="absolute right-8 bottom-8 lg:right-12 lg:bottom-12">
								<Cpu className="lp-soft-float h-8 w-8 text-neutral-900 opacity-20 lg:h-10 lg:w-10 dark:text-white" />
							</div>
						</div>
					</div>
				</div>
				<div className="col-span-12 flex flex-col lg:col-span-7">
					<div className="swiss-border lp-stagger grid h-32 grid-cols-3 border-b lg:h-40">
						<div
							className="swiss-border group lp-reveal flex cursor-pointer items-center justify-center border-r transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
							data-delay="1"
							data-reveal="fade-in"
						>
							<span className="box-type text-2xl transition-colors group-hover:text-primary lg:text-3xl xl:text-4xl">
								TFSA
							</span>
						</div>
						<div
							className="swiss-border group lp-reveal flex cursor-pointer items-center justify-center border-r transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
							data-delay="2"
							data-reveal="fade-in"
						>
							<span className="box-type text-2xl transition-colors group-hover:text-primary lg:text-3xl xl:text-4xl">
								RRSP
							</span>
						</div>
						<div
							className="group lp-reveal flex cursor-pointer items-center justify-center transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
							data-delay="3"
							data-reveal="fade-in"
						>
							<span className="box-type text-2xl transition-colors group-hover:text-primary lg:text-3xl xl:text-4xl">
								RESP
							</span>
						</div>
					</div>
					<div className="swiss-border lp-stagger grid flex-grow grid-cols-1 border-b md:grid-cols-2">
						<div
							className="swiss-border group lp-hover-raise lp-reveal flex flex-col justify-between border-b p-8 transition-colors hover:bg-neutral-50 md:border-r md:border-b-0 lg:p-12 dark:hover:bg-neutral-900"
							data-reveal="fade-up"
						>
							<div className="flex items-start justify-between">
								<h4 className="stat-label">LTV</h4>
								<TrendingUp className="h-5 w-5 text-neutral-300 transition-colors group-hover:text-primary" />
							</div>
							<div>
								<div className="stat-value text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
									75
									<span className="ml-1 align-top font-sans text-xl md:text-2xl">
										%
									</span>
								</div>
								<p className="mt-4 font-mono text-[10px] text-neutral-400 uppercase tracking-tighter">
									Max loan-to-value
								</p>
							</div>
						</div>
						<div
							className="group lp-hover-raise lp-reveal flex flex-col justify-between p-8 transition-colors hover:bg-neutral-50 lg:p-12 dark:hover:bg-neutral-900"
							data-reveal="fade-up"
						>
							<div className="flex items-start justify-between">
								<h4 className="stat-label">Lending Fee</h4>
								<Landmark className="h-5 w-5 text-neutral-300 transition-colors group-hover:text-primary" />
							</div>
							<div>
								<div className="stat-value text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
									1
									<span className="ml-1 align-top font-sans text-xl md:text-2xl">
										%
									</span>
								</div>
								<p className="mt-4 font-mono text-[10px] text-neutral-400 uppercase tracking-tighter">
									Lending Fee on Origination
								</p>
							</div>
						</div>
					</div>
					<div
						className="lp-reveal relative flex h-[280px] flex-col justify-between overflow-hidden bg-security-green p-8 text-white lg:h-[300px] lg:p-12"
						data-delay="2"
						data-reveal="scale-in"
					>
						<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] opacity-10" />
						<div className="relative z-10 flex items-start justify-between">
							<div>
								<h4 className="mb-6 font-bold text-[11px] text-white/50 uppercase tracking-[0.4em] lg:mb-8">
									MIC Visibility
								</h4>
								<h3 className="mb-2 font-bold font-display text-2xl tracking-tight lg:text-3xl">
									Deal-Level Transparency
								</h3>
								<p className="font-serif text-lg text-primary italic lg:text-xl">
									Built for serious investors
								</p>
							</div>
							<ShieldCheck className="lp-soft-float h-8 w-8 text-primary lg:h-10 lg:w-10" />
						</div>
						<div className="lp-stagger relative z-10 grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2 lg:gap-x-12 lg:gap-y-4">
							<ProtocolItem label="Pool overview" />
							<ProtocolItem label="Properties & deal flow" />
							<ProtocolItem label="Capital deployment" />
							<ProtocolItem label="Performance breakdown" />
						</div>
					</div>
				</div>
			</div>
			<div className="margin-col swiss-border border-l" />
		</section>
	);
}

function ProtocolItem({ label }: { label: string }) {
	return (
		<div
			className="group lp-reveal flex items-center space-x-3 border-white/10 border-b pb-2 lg:space-x-4"
			data-reveal="fade-up"
		>
			<ArrowRight className="lp-icon-nudge h-4 w-4 text-primary" />
			<span className="font-bold text-xs uppercase tracking-widest">
				{label}
			</span>
		</div>
	);
}

import {
	ArrowRight,
	ArrowUpRight,
	BarChart3,
	Building2,
	CheckCircle2,
	ChevronRight,
	Clock,
	Cpu,
	Landmark,
	LineChart,
	Mail,
	MapPin,
	Menu,
	PiggyBank,
	ShieldCheck,
	Target,
	TrendingUp,
	Verified,
	Wallet,
} from "lucide-react";
import { ScrollReveal } from "./components/scroll-reveal";
import { ScrollToTop } from "./components/scroll-to-top";
import { SwissSection } from "./components/swiss-section";

export default function Home() {
	return (
		<div className="relative z-10 flex min-h-screen w-full flex-col">
			<ScrollReveal />
			<Header />
			<div className="flex w-full flex-col">
				<HeroSection />
				<TrustBanner />
				<HowItWorksSection />
				<TransparencySection />
				<ComplianceSection />
				<InvestmentTiersSection />
				<EngineeringSection />
				<TestimonialsSection />
				<FAQSection />
				<AuditSection />
				<CTASection />
			</div>
			<Footer />

			{/* Background Watermark */}
			<div className="-translate-x-1/2 -translate-y-1/2 pointer-events-none fixed top-1/2 left-1/2 z-0 select-none opacity-[0.02]">
				<span className="lp-watermark font-black font-display text-[45vw] uppercase leading-none tracking-tighter">
					FairLend
				</span>
			</div>
		</div>
	);
}

function Header() {
	return (
		<header className="swiss-border sticky top-0 z-50 flex h-14 w-full items-center border-b bg-white/95 backdrop-blur-sm dark:bg-black/95">
			<div className="swiss-border flex h-full w-16 flex-shrink-0 items-center justify-center border-r bg-white dark:bg-black">
				<div className="flex h-8 w-8 items-center justify-center bg-black dark:bg-white">
					<BarChart3 className="h-4 w-4 text-white dark:text-black" />
				</div>
			</div>
			<div className="flex h-full flex-1 items-center justify-between bg-white px-6 lg:px-12 dark:bg-black">
				<nav className="hidden space-x-8 font-bold text-[11px] uppercase tracking-[0.3em] xl:flex">
					<a
						className="lp-underline cursor-pointer transition-colors hover:text-primary"
						href="#how-it-works"
					>
						How It Works
					</a>
					<a
						className="lp-underline cursor-pointer transition-colors hover:text-primary"
						href="#spin-model"
					>
						Spin Model
					</a>
					<a
						className="lp-underline cursor-pointer transition-colors hover:text-primary"
						href="#investment"
					>
						Investment Tiers
					</a>
					<a
						className="lp-underline cursor-pointer transition-colors hover:text-primary"
						href="#faq"
					>
						FAQ
					</a>
				</nav>
				<div className="ml-auto flex items-center space-x-6 lg:space-x-12">
					<div className="hidden space-x-6 font-bold text-[10px] text-neutral-400 tracking-widest sm:flex">
						<span>EST. 2024</span>
						<span className="text-primary">MIC: WAITLIST</span>
					</div>
					<div className="flex items-center space-x-4">
						<a
							className="lp-cta lp-hover-raise cursor-pointer bg-primary px-6 py-3 font-bold text-[11px] text-white uppercase tracking-widest transition-all hover:bg-neutral-900 lg:px-8"
							href="#waitlist"
						>
							Join Waitlist
						</a>
					</div>
				</div>
			</div>
			<div className="swiss-border flex h-full w-16 flex-shrink-0 cursor-pointer items-center justify-center border-l bg-white transition-colors hover:bg-neutral-50 dark:bg-black dark:hover:bg-neutral-900">
				<Menu className="h-5 w-5 text-neutral-900 dark:text-white" />
			</div>
		</header>
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

function TrustBanner() {
	return (
		<SwissSection tone="light">
			<div className="flex flex-col items-center justify-center py-12 lg:py-16">
				<p
					className="lp-reveal mb-8 font-bold text-[10px] text-neutral-400 uppercase tracking-[0.3em]"
					data-reveal="fade-up"
				>
					Trusted by Canadians Coast to Coast
				</p>
				<div className="lp-stagger flex flex-wrap items-center justify-center gap-8 lg:gap-16">
					<TrustStat label="Assets Under Management" value="$25M+" />
					<div className="hidden h-8 w-px bg-neutral-200 lg:block" />
					<TrustStat label="Active Investors" value="500+" />
					<div className="hidden h-8 w-px bg-neutral-200 lg:block" />
					<TrustStat label="Mortgages Funded" value="150+" />
					<div className="hidden h-8 w-px bg-neutral-200 lg:block" />
					<TrustStat label="Default Rate" value="0.0%" />
				</div>
			</div>
		</SwissSection>
	);
}

function TrustStat({ label, value }: { label: string; value: string }) {
	return (
		<div className="lp-reveal flex flex-col items-center" data-reveal="fade-in">
			<span className="mb-2 font-bold font-display text-2xl tracking-tight lg:text-3xl">
				{value}
			</span>
			<span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
				{label}
			</span>
		</div>
	);
}

function HowItWorksSection() {
	return (
		<SwissSection
			leftTone="sand"
			rightTone="sand"
			title="THE PROCESS"
			tone="sand"
		>
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<div className="mb-12 lg:mb-16">
					<h2
						className="lp-reveal mb-4 font-bold font-display text-4xl uppercase tracking-tighter lg:text-5xl"
						data-reveal="fade-up"
					>
						How It Works
					</h2>
					<p
						className="lp-reveal max-w-xl font-light text-neutral-600 leading-relaxed"
						data-delay="1"
						data-reveal="fade-up"
					>
						Our spin model maximizes capital efficiency by funding mortgages
						short-term, then selling to long-term investors.
					</p>
				</div>
				<div className="lp-stagger grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
					<ProcessStep
						description="Place your capital into the MIC. We accept TFSA, RRSP, RESP, and non-registered accounts."
						icon={<Wallet className="h-6 w-6" />}
						number="01"
						title="Invest"
					/>
					<ProcessStep
						description="The MIC funds private mortgages with strict underwriting: 75% max LTV, verified appraisals."
						icon={<Building2 className="h-6 w-6" />}
						number="02"
						title="Fund"
					/>
					<ProcessStep
						description="The MIC earns lending fees (1%) plus daily interest accrual during the short hold period."
						icon={<TrendingUp className="h-6 w-6" />}
						number="03"
						title="Earn"
					/>
					<ProcessStep
						description="Mortgages are sold to long-term buyers. Capital recycles for the next deal."
						icon={<Target className="h-6 w-6" />}
						number="04"
						title="Spin"
					/>
				</div>
			</div>
		</SwissSection>
	);
}

function ProcessStep({
	number,
	title,
	description,
	icon,
}: {
	number: string;
	title: string;
	description: string;
	icon: React.ReactNode;
}) {
	return (
		<div
			className="group lp-hover-raise lp-reveal relative border border-neutral-300 bg-white p-6 transition-all hover:border-primary lg:p-8"
			data-reveal="fade-up"
		>
			<div className="absolute top-6 right-6 font-mono text-[10px] text-neutral-300 transition-colors group-hover:text-primary lg:top-8 lg:right-8">
				{number}
			</div>
			<div className="mb-6 text-neutral-400 transition-colors group-hover:text-primary">
				{icon}
			</div>
			<h3 className="mb-3 font-bold font-display text-xl uppercase tracking-tight">
				{title}
			</h3>
			<p className="font-light text-neutral-600 text-sm leading-relaxed">
				{description}
			</p>
		</div>
	);
}

function TransparencySection() {
	return (
		<SwissSection
			leftTone="dark"
			rightTone="dark"
			title="01 / TRANSPARENCY"
			titleTone="dark"
			tone="dark"
		>
			<div className="grid min-h-[600px] grid-cols-1 lg:grid-cols-2">
				<div className="flex flex-col justify-center border-neutral-800 border-b p-8 lg:border-r lg:border-b-0 lg:p-16">
					<h2
						className="lp-reveal mb-8 font-bold font-display text-4xl uppercase leading-tight tracking-tighter lg:text-5xl xl:text-6xl"
						data-reveal="fade-up"
					>
						What You See
						<br />
						as a MIC
						<br />
						<span className="text-neutral-500">Investor</span>
					</h2>
					<p
						className="lp-reveal mb-12 max-w-md font-light text-base text-neutral-400 leading-relaxed lg:text-lg"
						data-delay="1"
						data-reveal="fade-up"
					>
						You won't be guessing where your money is. The MIC runs on a
						dedicated ledger, designed by an ex–RBC engineering team, and you
						get a dashboard built for serious investors with deal-level
						visibility.
					</p>
					<div
						className="lp-reveal flex items-center space-x-4 font-bold text-primary text-xs uppercase tracking-widest"
						data-delay="2"
						data-reveal="fade-in"
					>
						<span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
						<span>Deal-Level Visibility</span>
					</div>
				</div>
				<div className="flex flex-col justify-center space-y-8 p-8 lg:space-y-12 lg:p-16">
					<div className="lp-stagger grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
						<div
							className="lp-hover-raise lp-reveal border border-neutral-700 bg-neutral-800/50 p-5 lg:p-6"
							data-reveal="fade-in"
						>
							<div className="mb-6 flex justify-between text-[10px] text-neutral-500 uppercase tracking-widest">
								<span>Capital Deployment</span>
								<LineChart className="h-4 w-4" />
							</div>
							<div className="flex h-20 items-end justify-between gap-2 lg:h-24">
								<Bar height="30%" label="12%" />
								<Bar active height="65%" label="45%" />
								<Bar height="40%" label="28%" />
								<Bar height="15%" label="15%" />
							</div>
							<div className="mt-2 flex justify-between font-mono text-[9px] text-neutral-500">
								<span>Cash</span>
								<span>Deployed</span>
							</div>
						</div>
						<div
							className="lp-hover-raise lp-reveal relative overflow-hidden border border-neutral-700 bg-neutral-800/50 p-5 lg:p-6"
							data-reveal="fade-in"
						>
							<div className="mb-2 flex justify-between text-[10px] text-neutral-500 uppercase tracking-widest">
								<span>Capital Utilization</span>
								<span className="h-1.5 w-1.5 rounded-full bg-primary" />
							</div>
							<div className="mb-4 font-bold font-display text-3xl tracking-tighter lg:text-4xl">
								92%
							</div>
							<div className="mb-1 h-1 w-full bg-neutral-700">
								<div className="h-full w-[92%] bg-green-500" />
							</div>
							<div className="flex justify-between font-mono text-[9px]">
								<span className="text-neutral-400">Target: 90%</span>
								<span className="text-green-500">+2%</span>
							</div>
						</div>
					</div>
					<div className="border-neutral-800 border-t pt-6 lg:pt-8">
						<div className="mb-4 text-[10px] text-neutral-500 uppercase tracking-widest lg:mb-6">
							Deal Flow Regions
						</div>
						<div className="lp-stagger grid grid-cols-3 gap-3 lg:gap-4">
							<GeoBadge city="Toronto" value="42%" />
							<GeoBadge city="Vancouver" value="38%" />
							<GeoBadge city="Montreal" value="20%" />
						</div>
					</div>
				</div>
			</div>
		</SwissSection>
	);
}

function ComplianceSection() {
	return (
		<SwissSection title="02 / COMPLIANCE" tone="light">
			<div className="grid min-h-[500px] grid-cols-1 lg:grid-cols-2">
				<div className="swiss-border flex flex-col justify-center border-b p-8 lg:border-r lg:border-b-0 lg:p-20">
					<h4
						className="lp-reveal mb-8 font-bold text-[12px] text-neutral-400 uppercase tracking-[0.3em]"
						data-reveal="fade-up"
					>
						Return Profile
					</h4>
					<div
						className="lp-reveal flex items-start"
						data-delay="1"
						data-reveal="fade-up"
					>
						<span className="font-bold font-display text-[80px] text-green-600 leading-[0.8] tracking-tighter lg:text-[120px] xl:text-[160px]">
							9.25
						</span>
						<div className="mt-2 ml-2 flex flex-col lg:mt-4 lg:ml-4">
							<span className="font-bold font-display text-2xl text-green-600 lg:text-4xl">
								%
							</span>
							<span className="font-bold font-display text-green-600 text-xl lg:text-2xl">
								+
							</span>
						</div>
					</div>
					<p
						className="lp-reveal mt-8 max-w-md font-light text-base text-neutral-600 lg:text-lg"
						data-delay="2"
						data-reveal="fade-up"
					>
						In the ideal spin environment, most of your return comes from
						lending fees and high capital turnover, not from sitting in
						long-dated loans.
					</p>
				</div>
				<div className="flex flex-col justify-center bg-neutral-50/50 p-8 lg:p-20">
					<h4
						className="lp-reveal mb-8 font-bold text-[12px] text-neutral-400 uppercase tracking-[0.3em] lg:mb-12"
						data-reveal="fade-up"
					>
						Regulation & Governance
					</h4>
					<div className="lp-stagger space-y-8 lg:space-y-12">
						<Partner
							brand="FSRA"
							fullName="Financial Services Regulatory Authority"
						/>
						<Partner brand="OSC" fullName="Ontario Securities Commission" />
						<Partner
							brand="METAL"
							fullName="Custody & Administration Partner"
						/>
					</div>
				</div>
			</div>
		</SwissSection>
	);
}

function InvestmentTiersSection() {
	return (
		<SwissSection
			id="investment"
			leftTone="light"
			rightTone="light"
			title="INVESTMENT TIERS"
			tone="light"
		>
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<div className="mb-12 text-center lg:mb-16">
					<h2
						className="lp-reveal mb-4 font-bold font-display text-4xl uppercase tracking-tighter lg:text-5xl"
						data-reveal="fade-up"
					>
						Choose Your Tier
					</h2>
					<p
						className="lp-reveal mx-auto max-w-xl font-light text-neutral-600 leading-relaxed"
						data-delay="1"
						data-reveal="fade-up"
					>
						Different investment levels to match your financial goals and risk
						appetite.
					</p>
				</div>
				<div className="lp-stagger grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
					<InvestmentTier
						features={[
							"Deal-level dashboard access",
							"Quarterly reporting",
							"Email support",
							"TFSA/RRSP eligible",
						]}
						minimum="$25,000"
						name="Foundation"
						targetReturn="8.5%"
					/>
					<InvestmentTier
						features={[
							"Everything in Foundation",
							"Priority deal allocation",
							"Monthly reporting",
							"Phone support",
							"Dedicated account manager",
						]}
						highlighted
						minimum="$100,000"
						name="Growth"
						targetReturn="9.25%"
					/>
					<InvestmentTier
						features={[
							"Everything in Growth",
							"Custom deal selection",
							"Weekly reporting",
							"Direct line to principals",
							"Co-investment opportunities",
						]}
						minimum="$500,000"
						name="Premier"
						targetReturn="10%+"
					/>
				</div>
			</div>
		</SwissSection>
	);
}

function InvestmentTier({
	name,
	minimum,
	targetReturn,
	features,
	highlighted = false,
}: {
	name: string;
	minimum: string;
	targetReturn: string;
	features: string[];
	highlighted?: boolean;
}) {
	return (
		<div
			className={`group lp-hover-raise lp-reveal relative flex flex-col border p-6 transition-all lg:p-8 ${
				highlighted
					? "border-primary bg-primary/5"
					: "border-neutral-200 bg-white hover:border-primary"
			}`}
			data-reveal="fade-up"
		>
			{highlighted && (
				<div className="-translate-y-1/2 absolute top-0 right-6 bg-primary px-4 py-1 font-bold text-[10px] text-white uppercase tracking-widest lg:right-8">
					Most Popular
				</div>
			)}
			<h3 className="mb-2 font-bold font-display text-2xl uppercase tracking-tight">
				{name}
			</h3>
			<div className="mb-6">
				<span className="font-light text-neutral-500 text-sm">
					Minimum Investment
				</span>
				<div className="font-bold font-display text-3xl tracking-tighter lg:text-4xl">
					{minimum}
				</div>
			</div>
			<div className="mb-6 border-neutral-200 border-t border-b py-4">
				<span className="font-bold text-[10px] text-neutral-400 uppercase tracking-widest">
					Target Return
				</span>
				<div className="font-bold font-display text-2xl text-green-600 tracking-tight lg:text-3xl">
					{targetReturn}
				</div>
			</div>
			<ul className="mb-8 flex-grow space-y-3">
				{features.map((feature) => (
					<li className="flex items-start gap-3" key={feature}>
						<CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
						<span className="text-neutral-600 text-sm">{feature}</span>
					</li>
				))}
			</ul>
			<a
				className={`lp-cta block cursor-pointer py-3 text-center font-bold text-[11px] uppercase tracking-widest transition-all ${
					highlighted
						? "bg-primary text-white hover:bg-neutral-900"
						: "border border-neutral-200 bg-white hover:border-primary hover:text-primary"
				}`}
				href="#waitlist"
			>
				Join Waitlist
			</a>
		</div>
	);
}

function EngineeringSection() {
	return (
		<SwissSection
			id="spin-model"
			leftTone="green"
			rightTone="green"
			subtitle="V. 2.0"
			subtitleTone="inverse"
			title="03 / ENGINEERING"
			titleTone="inverse"
			tone="green"
		>
			<div className="group relative min-h-[600px] overflow-hidden">
				<div className="absolute inset-0 scale-100 bg-architectural bg-center bg-cover opacity-20 mix-blend-overlay grayscale transition-all duration-1000 group-hover:scale-105 group-hover:opacity-30" />
				<div className="absolute inset-0 bg-gradient-to-t from-security-green via-transparent to-transparent" />
				<div className="relative z-10 flex h-full flex-col justify-end p-8 lg:p-16">
					<div className="max-w-4xl">
						<div className="mb-8 h-1 w-20 bg-primary" />
						<h2
							className="lp-reveal mb-4 font-bold font-display text-4xl uppercase tracking-tighter md:text-6xl lg:text-8xl"
							data-reveal="fade-up"
						>
							Built by Ex–RBC
						</h2>
						<p
							className="lp-reveal mb-8 font-serif text-2xl text-white/80 italic md:text-4xl lg:mb-12 lg:text-5xl"
							data-delay="1"
							data-reveal="fade-up"
						>
							Capital Markets & Digital Engineers
						</p>
						<div className="grid grid-cols-1 gap-8 border-white/10 border-t pt-8 md:grid-cols-2 lg:gap-12 lg:pt-12">
							<div>
								<h3
									className="lp-reveal mb-4 font-bold text-primary text-xs uppercase tracking-[0.2em]"
									data-delay="2"
									data-reveal="fade-up"
								>
									Dedicated Ledger
								</h3>
								<p
									className="lp-reveal text-justify font-mono text-white/60 text-xs leading-relaxed lg:text-sm"
									data-delay="3"
									data-reveal="fade-up"
								>
									The MIC runs on infrastructure built for auditability and
									transparency, with deal-level visibility and reporting
									designed for serious investors.
								</p>
							</div>
							<div
								className="lp-reveal flex flex-col space-y-3 lg:space-y-4"
								data-delay="2"
								data-reveal="fade-up"
							>
								<EngineeringFeature label="Deal-Level Dashboard" />
								<EngineeringFeature label="Capital Deployment Metrics" />
								<EngineeringFeature label="Fee vs Interest Breakdown" />
							</div>
						</div>
					</div>
				</div>
				<div className="absolute top-8 right-8 lg:top-16 lg:right-16">
					<Cpu className="lp-soft-float h-12 w-12 text-white/10 lg:h-16 lg:w-16" />
				</div>
			</div>
		</SwissSection>
	);
}

function TestimonialsSection() {
	return (
		<SwissSection
			leftTone="light"
			rightTone="light"
			title="TESTIMONIALS"
			tone="light"
		>
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<div className="mb-12 lg:mb-16">
					<h2
						className="lp-reveal mb-4 font-bold font-display text-4xl uppercase tracking-tighter lg:text-5xl"
						data-reveal="fade-up"
					>
						What Investors Say
					</h2>
					<p
						className="lp-reveal max-w-xl font-light text-neutral-600 leading-relaxed"
						data-delay="1"
						data-reveal="fade-up"
					>
						Hear from investors who have experienced the FairLend difference.
					</p>
				</div>
				<div className="lp-stagger grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
					<Testimonial
						location="Toronto, ON"
						name="Michael R."
						quote="The transparency is unmatched. I can see exactly where my capital is deployed at any time. Finally, a MIC that treats investors like partners."
						title="Real Estate Professional"
					/>
					<Testimonial
						location="Vancouver, BC"
						name="Sarah L."
						quote="The spin model is brilliant. Instead of my money sitting in long-term loans, it's constantly working. The returns have exceeded my expectations."
						title="Financial Advisor"
					/>
					<Testimonial
						location="Calgary, AB"
						name="David T."
						quote="I've invested in several MICs over the years. FairLend's engineering-first approach and deal-level visibility sets them apart completely."
						title="Portfolio Manager"
					/>
				</div>
			</div>
		</SwissSection>
	);
}

function Testimonial({
	quote,
	name,
	title,
	location,
}: {
	quote: string;
	name: string;
	title: string;
	location: string;
}) {
	return (
		<div
			className="group lp-hover-raise lp-reveal flex flex-col border border-neutral-200 bg-white p-6 transition-all hover:border-primary lg:p-8"
			data-reveal="fade-up"
		>
			<div className="mb-6 flex gap-1">
				{[1, 2, 3, 4, 5].map((i) => (
					<div className="h-1 w-6 bg-primary" key={i} />
				))}
			</div>
			<blockquote className="mb-6 flex-grow font-light text-neutral-700 italic leading-relaxed">
				"{quote}"
			</blockquote>
			<div className="border-neutral-200 border-t pt-4">
				<div className="font-bold font-display text-lg tracking-tight">
					{name}
				</div>
				<div className="text-neutral-500 text-sm">{title}</div>
				<div className="mt-1 flex items-center gap-1 font-mono text-[10px] text-neutral-400">
					<MapPin className="h-3 w-3" />
					{location}
				</div>
			</div>
		</div>
	);
}

function FAQSection() {
	return (
		<SwissSection
			id="faq"
			leftTone="sand"
			rightTone="sand"
			title="FAQ"
			tone="sand"
		>
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<div className="mb-12 lg:mb-16">
					<h2
						className="lp-reveal mb-4 font-bold font-display text-4xl uppercase tracking-tighter lg:text-5xl"
						data-reveal="fade-up"
					>
						Frequently Asked Questions
					</h2>
					<p
						className="lp-reveal max-w-xl font-light text-neutral-600 leading-relaxed"
						data-delay="1"
						data-reveal="fade-up"
					>
						Everything you need to know about investing with FairLend MIC.
					</p>
				</div>
				<div className="lp-stagger grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
					<FAQItem
						answer="A MIC (Mortgage Investment Corporation) is a Canadian investment vehicle that pools investor capital to fund mortgages. It's a flow-through entity, meaning income passes directly to investors without corporate taxation."
						question="What is a MIC?"
					/>
					<FAQItem
						answer="Unlike traditional MICs that hold mortgages for years, we fund mortgages short-term, earn lending fees and interest, then sell to long-term buyers. This 'spin' model maximizes capital efficiency and fee income."
						question="How does the FairLend MIC differ from others?"
					/>
					<FAQItem
						answer="Yes! MIC shares are eligible for TFSA, RRSP, RESP, RRIF, RDSP, and LIRA accounts. This makes them highly tax-efficient investment vehicles."
						question="Can I hold MIC shares in my TFSA or RRSP?"
					/>
					<FAQItem
						answer="We maintain strict underwriting: maximum 75% LTV, verified appraisals, first-lien positions only, and geographic diversification across major Canadian markets."
						question="How is risk managed?"
					/>
					<FAQItem
						answer="Typically within 30-90 days of submitting your subscription agreement. We process new investments in cohorts to maintain optimal capital deployment."
						question="How quickly can I start investing?"
					/>
					<FAQItem
						answer="FairLend MIC shares have a one-year minimum hold period. After that, redemptions are processed quarterly with 60 days notice, subject to available liquidity."
						question="What is the redemption process?"
					/>
				</div>
			</div>
		</SwissSection>
	);
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
	return (
		<div
			className="group lp-hover-raise lp-reveal border border-neutral-300 bg-white p-6 transition-all hover:border-primary lg:p-8"
			data-reveal="fade-up"
		>
			<h3 className="mb-4 flex items-start gap-3 font-bold font-display text-lg tracking-tight lg:text-xl">
				<ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 text-primary transition-transform group-hover:translate-x-1" />
				{question}
			</h3>
			<p className="pl-8 font-light text-neutral-600 text-sm leading-relaxed">
				{answer}
			</p>
		</div>
	);
}

function AuditSection() {
	return (
		<SwissSection
			leftTone="sand"
			rightTone="sand"
			title="04 / AUDIT"
			tone="sand"
		>
			<div className="flex min-h-[500px] flex-col p-8 lg:p-20">
				<div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end lg:mb-16">
					<div>
						<h4
							className="lp-reveal mb-4 font-bold text-[12px] text-neutral-400 uppercase tracking-[0.3em]"
							data-reveal="fade-up"
						>
							Spin Event Log
						</h4>
						<h2
							className="lp-reveal font-bold font-display text-3xl uppercase tracking-tight lg:text-4xl"
							data-delay="1"
							data-reveal="fade-up"
						>
							Deal-Level Activity
						</h2>
					</div>
					<div
						className="swiss-border lp-reveal flex items-center space-x-2 border bg-white px-4 py-2"
						data-delay="2"
						data-reveal="fade-in"
					>
						<span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
						<span className="font-bold text-[10px] text-neutral-500 uppercase tracking-widest">
							Live Sync
						</span>
					</div>
				</div>
				<div
					className="lp-reveal w-full overflow-x-auto"
					data-delay="2"
					data-reveal="fade-in"
				>
					<table className="w-full border-collapse text-left">
						<thead>
							<tr className="border-neutral-300 border-b-2">
								<th className="w-24 py-4 font-bold text-[10px] text-neutral-500 uppercase tracking-widest lg:w-32">
									Time
								</th>
								<th className="py-4 font-bold text-[10px] text-neutral-500 uppercase tracking-widest">
									Spin Event
								</th>
								<th className="w-32 py-4 font-bold text-[10px] text-neutral-500 uppercase tracking-widest lg:w-48">
									Status
								</th>
								<th className="w-24 py-4 text-right font-bold text-[10px] text-neutral-500 uppercase tracking-widest lg:w-32">
									Deal
								</th>
							</tr>
						</thead>
						<tbody className="lp-stagger font-mono text-xs">
							<AuditRow
								block="#SPIN-1042"
								event="Mortgage funded — accrual period start"
								status="verified"
								time="10:42:05"
							/>
							<AuditRow
								block="#SPIN-1041"
								event="Lending fee posted (0.5% MIC slice)"
								status="verified"
								time="10:41:58"
							/>
							<AuditRow
								block="#SPIN-1040"
								event="Mortgage offloaded to long-term buyer"
								status="verified"
								time="10:40:12"
							/>
							<AuditRow
								block="#SPIN-1038"
								event="Capital redeployment queued"
								status="pending"
								time="10:38:00"
							/>
						</tbody>
					</table>
				</div>
			</div>
		</SwissSection>
	);
}

function CTASection() {
	return (
		<SwissSection
			id="waitlist"
			leftTone="dark"
			rightTone="dark"
			title="JOIN THE MIC"
			titleTone="dark"
			tone="dark"
		>
			<div className="flex min-h-[500px] flex-col items-center justify-center px-8 py-16 text-center lg:py-24">
				<div
					className="lp-reveal mb-8 flex h-20 w-20 items-center justify-center border border-white/20 bg-white/5 lg:h-24 lg:w-24"
					data-reveal="scale-in"
				>
					<PiggyBank className="h-10 w-10 text-primary lg:h-12 lg:w-12" />
				</div>
				<h2
					className="lp-reveal mb-4 font-bold font-display text-4xl uppercase tracking-tighter lg:text-6xl"
					data-delay="1"
					data-reveal="fade-up"
				>
					Ready to Invest?
				</h2>
				<p
					className="lp-reveal mb-8 max-w-xl font-light text-base text-neutral-400 leading-relaxed lg:mb-12 lg:text-lg"
					data-delay="2"
					data-reveal="fade-up"
				>
					Join the waitlist for early access to the FairLend MIC. Limited
					capacity available for our first cohort.
				</p>
				<div
					className="lp-reveal flex flex-col gap-4 sm:flex-row"
					data-delay="3"
					data-reveal="fade-up"
				>
					<div className="flex items-center">
						<input
							className="h-12 w-64 border border-white/20 border-r-0 bg-white/5 px-4 font-mono text-sm text-white placeholder:text-neutral-500 focus:border-primary focus:outline-none lg:w-80"
							placeholder="Enter your email"
							type="email"
						/>
						<button
							className="lp-cta h-12 cursor-pointer bg-primary px-6 font-bold text-[11px] text-white uppercase tracking-widest transition-all hover:bg-white hover:text-black lg:px-8"
							type="button"
						>
							Join
						</button>
					</div>
				</div>
				<p
					className="lp-reveal mt-6 font-mono text-[10px] text-neutral-500"
					data-delay="4"
					data-reveal="fade-in"
				>
					By joining, you agree to receive updates about FairLend MIC. No spam,
					unsubscribe anytime.
				</p>
			</div>
		</SwissSection>
	);
}

function Footer() {
	return (
		<>
			{/* Full Footer */}
			<SwissSection leftTone="dark" rightTone="dark" tone="dark">
				<div className="px-8 py-12 lg:px-16 lg:py-16">
					<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
						{/* Brand Column */}
						<div className="lg:col-span-1">
							<div className="mb-6 flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center bg-white">
									<BarChart3 className="h-5 w-5 text-black" />
								</div>
								<span className="font-bold font-display text-xl tracking-tight">
									FairLend
								</span>
							</div>
							<p className="mb-6 font-light text-neutral-400 text-sm leading-relaxed">
								A modern mortgage investment corporation built for transparency
								and engineered for returns.
							</p>
							<div className="flex items-center gap-2">
								<span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
								<span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
									Accepting Waitlist
								</span>
							</div>
						</div>

						{/* Quick Links */}
						<div>
							<h4 className="mb-6 font-bold text-[11px] uppercase tracking-[0.3em]">
								Quick Links
							</h4>
							<ul className="space-y-3">
								<FooterLink href="#how-it-works" label="How It Works" />
								<FooterLink href="#spin-model" label="Spin Model" />
								<FooterLink href="#investment" label="Investment Tiers" />
								<FooterLink href="#faq" label="FAQ" />
								<FooterLink href="#waitlist" label="Join Waitlist" />
							</ul>
						</div>

						{/* Legal */}
						<div>
							<h4 className="mb-6 font-bold text-[11px] uppercase tracking-[0.3em]">
								Legal
							</h4>
							<ul className="space-y-3">
								<FooterLink href="#" label="Offering Memorandum" />
								<FooterLink href="#" label="Privacy Policy" />
								<FooterLink href="#" label="Terms of Service" />
								<FooterLink href="#" label="Risk Disclosure" />
							</ul>
						</div>

						{/* Contact */}
						<div>
							<h4 className="mb-6 font-bold text-[11px] uppercase tracking-[0.3em]">
								Contact
							</h4>
							<ul className="space-y-4">
								<li className="flex items-start gap-3 text-neutral-400 text-sm">
									<Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
									<span>invest@fairlend.ca</span>
								</li>
								<li className="flex items-start gap-3 text-neutral-400 text-sm">
									<MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
									<span>Toronto, Ontario, Canada</span>
								</li>
							</ul>
						</div>
					</div>

					{/* Bottom Bar */}
					<div className="mt-12 flex flex-col items-center justify-between gap-4 border-neutral-800 border-t pt-8 md:flex-row lg:mt-16">
						<p className="text-center font-mono text-[10px] text-neutral-500 md:text-left">
							© 2024 FairLend Mortgage Investment Corporation. All rights
							reserved.
						</p>
						<div className="flex items-center gap-6">
							<span className="font-mono text-[10px] text-neutral-500">
								FSRA Regulated
							</span>
							<span className="h-3 w-px bg-neutral-700" />
							<span className="font-mono text-[10px] text-neutral-500">
								OSC Compliant
							</span>
						</div>
					</div>
				</div>
			</SwissSection>

			{/* Sticky Footer Bar */}
			<footer className="section-grid h-16 bg-white lg:h-20 dark:bg-black">
				<div className="margin-col swiss-border border-r" />
				<div className="flex h-full flex-1 items-center justify-between px-6 lg:px-12">
					<div className="flex items-center space-x-8 lg:space-x-16">
						<div className="flex flex-col">
							<span className="mb-1 text-[9px] text-neutral-400 uppercase tracking-widest">
								MIC Status
							</span>
							<div className="flex items-center space-x-2">
								<span className="h-1.5 w-1.5 rounded-full bg-green-500" />
								<span className="font-bold text-[11px] uppercase tracking-wider">
									Waiting List Only
								</span>
							</div>
						</div>
						<div className="swiss-border hidden flex-col border-l pl-8 md:flex lg:pl-16">
							<span className="mb-1 text-[9px] text-neutral-400 uppercase tracking-widest">
								Capacity
							</span>
							<span className="font-bold text-[11px] uppercase tracking-widest">
								Limited — Cohort Based
							</span>
						</div>
					</div>
					<div className="flex h-full items-center space-x-6 lg:space-x-12">
						<div className="hidden items-center space-x-4 md:flex lg:space-x-6">
							<span className="font-bold text-[10px] text-neutral-400 uppercase tracking-[0.3em]">
								Scroll for details
							</span>
							<div className="h-px w-8 bg-neutral-300 lg:w-16 dark:bg-neutral-700" />
						</div>
						<ScrollToTop />
					</div>
				</div>
				<div className="margin-col swiss-border border-l" />
			</footer>
		</>
	);
}

function FooterLink({ href, label }: { href: string; label: string }) {
	return (
		<li>
			<a
				className="group flex cursor-pointer items-center gap-2 text-neutral-400 text-sm transition-colors hover:text-white"
				href={href}
			>
				<ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
				{label}
			</a>
		</li>
	);
}

// Sub-components
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

function Bar({
	height,
	label,
	active = false,
}: {
	height: string;
	label: string;
	active?: boolean;
}) {
	return (
		<div
			className={`w-1/4 ${active ? "bg-primary" : "bg-primary/40"} group relative cursor-pointer transition-colors hover:bg-primary`}
			style={{ height }}
		>
			<div className="-translate-x-1/2 absolute bottom-full left-1/2 mb-2 text-[9px] opacity-0 transition-opacity group-hover:opacity-100">
				{label}
			</div>
		</div>
	);
}

function GeoBadge({ city, value }: { city: string; value: string }) {
	return (
		<div
			className="lp-hover-raise lp-reveal cursor-pointer border border-neutral-700 p-3 transition-colors hover:border-primary lg:p-4"
			data-reveal="fade-in"
		>
			<div className="mb-2 text-[10px] text-neutral-400">{city}</div>
			<div className="font-bold font-display text-xl lg:text-2xl">{value}</div>
		</div>
	);
}

function Partner({ brand, fullName }: { brand: string; fullName: string }) {
	return (
		<div
			className="group swiss-border lp-hover-raise lp-reveal cursor-pointer border-b pb-6 lg:pb-8"
			data-reveal="fade-up"
		>
			<div className="mb-2 flex items-center justify-between">
				<span className="font-bold font-display text-2xl tracking-tight transition-colors group-hover:text-primary lg:text-3xl">
					{brand}
				</span>
				<ArrowUpRight className="lp-icon-nudge h-5 w-5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
			</div>
			<div className="text-[10px] text-neutral-500 uppercase tracking-widest">
				{fullName}
			</div>
		</div>
	);
}

function EngineeringFeature({ label }: { label: string }) {
	return (
		<div className="group/item flex cursor-pointer items-center space-x-3 lg:space-x-4">
			<ArrowRight className="h-4 w-4 text-primary transition-transform group-hover/item:translate-x-1" />
			<span className="font-bold text-xs uppercase tracking-widest lg:text-sm">
				{label}
			</span>
		</div>
	);
}

function AuditRow({
	time,
	event,
	status,
	block,
}: {
	time: string;
	event: string;
	status: "verified" | "pending";
	block: string;
}) {
	return (
		<tr
			className="lp-reveal border-neutral-200 border-b transition-colors hover:bg-white"
			data-reveal="fade-in"
		>
			<td className="py-4 text-neutral-400">{time}</td>
			<td className="py-4 font-medium">{event}</td>
			<td
				className={`flex items-center gap-2 py-4 ${status === "verified" ? "text-green-600" : "text-neutral-400"}`}
			>
				{status === "verified" ? (
					<Verified className="h-4 w-4" />
				) : (
					<Clock className="h-4 w-4" />
				)}
				{status.toUpperCase()}
			</td>
			<td className="py-4 text-right text-neutral-400">{block}</td>
		</tr>
	);
}

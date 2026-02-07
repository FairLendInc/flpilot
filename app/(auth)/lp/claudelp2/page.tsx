import {
	ArrowRight,
	ArrowUpRight,
	BarChart3,
	Building2,
	CheckCircle2,
	ChevronRight,
	Clock,
	Cpu,
	Crown,
	Diamond,
	Eye,
	Landmark,
	LineChart,
	Lock,
	Mail,
	MapPin,
	Menu,
	Shield,
	ShieldCheck,
	Sparkles,
	Target,
	TrendingUp,
	Wallet,
} from "lucide-react";
import { ScrollReveal } from "../components/scroll-reveal";
import { ScrollToTop } from "../components/scroll-to-top";
import { SwissSection } from "../components/swiss-section";

/* ─────────────────────────────────────────────────
   VARIANT 2: DARK LUXURY / PRIVATE BANKING
   Think Amex Centurion meets Swiss private bank.
   Almost entirely dark, amber/gold accents,
   ultra-refined typography, exclusivity.
   ───────────────────────────────────────────────── */

export default function ClaudeLp2() {
	return (
		<div className="relative z-10 flex min-h-screen w-full flex-col">
			<ScrollReveal />
			<LuxuryHeader />
			<div className="flex w-full flex-col">
				<HeroSection />
				<TrustMetrics />
				<ApproachSection />
				<ProtectionSection />
				<ReturnsSection />
				<RegulatorySection />
				<PrincipalsSection />
				<MarketIntelligence />
				<PortfolioSection />
				<BuildsSection />
				<TestimonialSection />
				<FAQSection />
				<CTASection />
			</div>
			<LuxuryFooter />
		</div>
	);
}

/* ── HEADER ────────────────────────────────────── */
function LuxuryHeader() {
	return (
		<header className="sticky top-0 z-50 flex h-14 w-full items-center border-neutral-800 border-b bg-neutral-950/95 backdrop-blur-sm">
			<div className="flex h-full w-16 flex-shrink-0 items-center justify-center border-neutral-800 border-r bg-neutral-950">
				<div className="flex h-8 w-8 items-center justify-center bg-[#D4A574]">
					<BarChart3 className="h-4 w-4 text-neutral-950" />
				</div>
			</div>
			<div className="flex h-full flex-1 items-center justify-between bg-neutral-950 px-6 lg:px-12">
				<nav className="hidden space-x-8 font-bold text-[11px] text-neutral-400 uppercase tracking-[0.3em] xl:flex">
					<a className="cursor-pointer transition-colors hover:text-[#D4A574]" href="#approach">Approach</a>
					<a className="cursor-pointer transition-colors hover:text-[#D4A574]" href="#protection">Protection</a>
					<a className="cursor-pointer transition-colors hover:text-[#D4A574]" href="#returns">Returns</a>
					<a className="cursor-pointer transition-colors hover:text-[#D4A574]" href="#portfolio">Portfolio</a>
				</nav>
				<a className="lp-cta lp-hover-raise cursor-pointer bg-[#D4A574] px-6 py-3 font-bold text-[11px] text-neutral-950 uppercase tracking-widest transition-all hover:bg-white lg:px-8" href="#cta">
					Book a Presentation
				</a>
			</div>
			<div className="flex h-full w-16 flex-shrink-0 cursor-pointer items-center justify-center border-neutral-800 border-l bg-neutral-950 transition-colors hover:bg-neutral-900">
				<Menu className="h-5 w-5 text-neutral-400" />
			</div>
		</header>
	);
}

/* ── HERO (UNTOUCHED) ──────────────────────────── */
function HeroSection() {
	return (
		<section className="section-grid min-h-[calc(100vh-16rem)] border-neutral-800 bg-neutral-900 text-white" id="how-it-works">
			<div className="margin-col border-neutral-800 border-r" />
			<div className="grid w-full grid-cols-1 lg:grid-cols-12">
				<div className="col-span-12 flex flex-col border-neutral-800 border-b lg:col-span-5 lg:border-r lg:border-b-0">
					<div className="flex flex-grow flex-col justify-between px-8 pt-12 pb-8 lg:px-12 lg:pt-16 lg:pb-12">
						<div>
							<div className="lp-reveal mb-12 flex items-center space-x-4 lg:mb-20" data-delay="1" data-reveal="fade-up">
								<span className="h-[2px] w-12 bg-[#D4A574]" />
								<span className="font-bold text-[12px] text-neutral-500 uppercase tracking-[0.4em]">FairLend MIC</span>
							</div>
							<div className="mb-12 lg:mb-16">
								<h1 className="lp-reveal -ml-1 mb-4 font-black font-display text-[56px] uppercase leading-[0.85] tracking-tighter md:text-[70px] lg:text-[90px] xl:text-[110px]" data-delay="2" data-reveal="fade-up">FairLend</h1>
								<div className="lp-reveal -mt-2 md:-mt-4 mb-8 font-serif text-5xl text-[#D4A574] lowercase italic tracking-tight md:mb-12 md:text-6xl lg:text-7xl xl:text-8xl" data-delay="3" data-reveal="fade-up">mic</div>
								<div className="w-full max-w-[400px]">
									<p className="lp-reveal text-justify font-light text-[15px] text-neutral-400 leading-[1.6] md:text-[16px]" data-delay="4" data-reveal="fade-up">
										The FairLend MIC is a pooled vehicle that provides short-term funding for private, interest-only mortgages. Instead of holding mortgages for years, the MIC funds them for a few days, earns fees and interest, then sells them to long-term buyers on the FairLend marketplace.
									</p>
								</div>
							</div>
						</div>
						<div className="lp-reveal flex flex-wrap gap-4" data-delay="5" data-reveal="fade-in">
							<a className="lp-cta lp-hover-raise inline-flex cursor-pointer items-center gap-2 bg-[#D4A574] px-6 py-3 font-bold text-[11px] text-neutral-950 uppercase tracking-widest transition-all hover:bg-white" href="#waitlist">
								Request Access <ArrowRight className="h-4 w-4" />
							</a>
							<a className="lp-hover-raise inline-flex cursor-pointer items-center gap-2 border border-neutral-700 px-6 py-3 font-bold text-[11px] uppercase tracking-widest transition-all hover:border-[#D4A574] hover:text-[#D4A574]" href="#approach">
								Learn More
							</a>
						</div>
					</div>
					<div className="group lp-reveal relative h-[280px] overflow-hidden border-neutral-800 border-t lg:h-[300px]" data-delay="2" data-reveal="fade-in">
						<div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-center bg-cover opacity-10 contrast-125 grayscale transition-opacity duration-700 group-hover:opacity-20" />
						<div className="relative z-10 flex h-full flex-col justify-between p-8 lg:p-12">
							<div>
								<h3 className="font-bold text-[10px] text-neutral-500 uppercase tracking-widest">The Spin Model</h3>
								<div className="mt-4 h-[2px] w-12 bg-[#D4A574]" />
							</div>
							<div>
								<p className="mb-2 font-bold font-display text-2xl uppercase leading-none tracking-tight lg:text-3xl">Short-Term Lender</p>
								<p className="font-serif text-[#D4A574] text-xl italic lg:text-2xl">Long-Term Buyers</p>
							</div>
						</div>
					</div>
				</div>
				<div className="col-span-12 flex flex-col lg:col-span-7">
					<div className="lp-stagger grid h-32 grid-cols-3 border-neutral-800 border-b lg:h-40">
						<div className="group lp-reveal flex cursor-pointer items-center justify-center border-neutral-800 border-r transition-colors hover:bg-neutral-800" data-delay="1" data-reveal="fade-in">
							<span className="font-bold font-display text-2xl tracking-tighter transition-colors group-hover:text-[#D4A574] lg:text-3xl xl:text-4xl">TFSA</span>
						</div>
						<div className="group lp-reveal flex cursor-pointer items-center justify-center border-neutral-800 border-r transition-colors hover:bg-neutral-800" data-delay="2" data-reveal="fade-in">
							<span className="font-bold font-display text-2xl tracking-tighter transition-colors group-hover:text-[#D4A574] lg:text-3xl xl:text-4xl">RRSP</span>
						</div>
						<div className="group lp-reveal flex cursor-pointer items-center justify-center transition-colors hover:bg-neutral-800" data-delay="3" data-reveal="fade-in">
							<span className="font-bold font-display text-2xl tracking-tighter transition-colors group-hover:text-[#D4A574] lg:text-3xl xl:text-4xl">RESP</span>
						</div>
					</div>
					<div className="lp-stagger grid flex-grow grid-cols-1 border-neutral-800 border-b md:grid-cols-2">
						<div className="group lp-hover-raise lp-reveal flex flex-col justify-between border-neutral-800 border-b p-8 transition-colors hover:bg-neutral-800 md:border-r md:border-b-0 lg:p-12" data-reveal="fade-up">
							<div className="flex items-start justify-between">
								<h4 className="font-bold text-[10px] text-neutral-500 uppercase tracking-widest">LTV</h4>
								<TrendingUp className="h-5 w-5 text-neutral-600 transition-colors group-hover:text-[#D4A574]" />
							</div>
							<div>
								<div className="font-bold font-display text-4xl tracking-tighter md:text-5xl lg:text-6xl xl:text-7xl">75<span className="ml-1 align-top font-sans text-xl md:text-2xl">%</span></div>
								<p className="mt-4 font-mono text-[10px] text-neutral-500 uppercase tracking-tighter">Max loan-to-value</p>
							</div>
						</div>
						<div className="group lp-hover-raise lp-reveal flex flex-col justify-between p-8 transition-colors hover:bg-neutral-800 lg:p-12" data-reveal="fade-up">
							<div className="flex items-start justify-between">
								<h4 className="font-bold text-[10px] text-neutral-500 uppercase tracking-widest">Lending Fee</h4>
								<Landmark className="h-5 w-5 text-neutral-600 transition-colors group-hover:text-[#D4A574]" />
							</div>
							<div>
								<div className="font-bold font-display text-4xl tracking-tighter md:text-5xl lg:text-6xl xl:text-7xl">1<span className="ml-1 align-top font-sans text-xl md:text-2xl">%</span></div>
								<p className="mt-4 font-mono text-[10px] text-neutral-500 uppercase tracking-tighter">Lending Fee on Origination</p>
							</div>
						</div>
					</div>
					<div className="lp-reveal relative flex h-[280px] flex-col justify-between overflow-hidden bg-security-green p-8 text-white lg:h-[300px] lg:p-12" data-delay="2" data-reveal="scale-in">
						<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] opacity-10" />
						<div className="relative z-10 flex items-start justify-between">
							<div>
								<h4 className="mb-6 font-bold text-[11px] text-white/50 uppercase tracking-[0.4em] lg:mb-8">MIC Visibility</h4>
								<h3 className="mb-2 font-bold font-display text-2xl tracking-tight lg:text-3xl">Deal-Level Transparency</h3>
								<p className="font-serif text-[#D4A574] text-lg italic lg:text-xl">Built for serious investors</p>
							</div>
							<ShieldCheck className="lp-soft-float h-8 w-8 text-[#D4A574] lg:h-10 lg:w-10" />
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
			<div className="margin-col border-neutral-800 border-l" />
		</section>
	);
}

/* ── TRUST METRICS ─────────────────────────────── */
function TrustMetrics() {
	return (
		<SwissSection tone="dark" leftTone="dark" rightTone="dark">
			<div className="py-16 lg:py-20">
				<div className="lp-stagger grid grid-cols-2 gap-0 lg:grid-cols-4">
					<MetricBlock label="Assets Under Management" value="$25M+" />
					<MetricBlock label="Active Investors" value="500+" />
					<MetricBlock label="Mortgages Funded" value="150+" />
					<MetricBlock label="Default Rate" value="0.0%" accent />
				</div>
			</div>
		</SwissSection>
	);
}

function MetricBlock({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
	return (
		<div className="lp-reveal group flex flex-col items-center justify-center border-neutral-800 border-r p-8 last:border-r-0 lg:p-12" data-reveal="fade-in">
			<span className={`mb-3 font-bold font-display text-3xl tracking-tighter lg:text-5xl ${accent ? "text-[#D4A574]" : ""}`}>{value}</span>
			<span className="text-center font-mono text-[9px] text-neutral-500 uppercase tracking-widest">{label}</span>
		</div>
	);
}

/* ── THE APPROACH ──────────────────────────────── */
function ApproachSection() {
	return (
		<SwissSection id="approach" tone="dark" leftTone="dark" rightTone="dark" title="THE APPROACH" titleTone="dark">
			<div className="px-8 py-16 lg:px-20 lg:py-24">
				<div className="mb-16 max-w-2xl">
					<h2 className="lp-reveal mb-6 font-bold font-display text-4xl uppercase tracking-tighter lg:text-6xl" data-reveal="fade-up">
						Three Engines<br />of <span className="text-[#D4A574]">Alpha</span>
					</h2>
					<p className="lp-reveal font-light text-neutral-400 leading-relaxed lg:text-lg" data-delay="1" data-reveal="fade-up">
						Higher returns through harder work, not riskier bets. Transparent, auditable, and built on nearly three decades of compounding expertise.
					</p>
				</div>
				<div className="lp-stagger grid grid-cols-1 gap-px bg-neutral-800 md:grid-cols-3">
					<EngineCard number="I" title="Best Borrowers" description="90% rejection rate. Double appraisals. Expert human underwriters with AI fraud detection. Builder assessment from a builder who's personally constructed 20+ custom homes." icon={<Shield className="h-6 w-6" />} />
					<EngineCard number="II" title="The Flywheel" description="1% lending fee per origination. Max 2-month hold. Capital continuously recycles — multiple fee-earning cycles per year on the same dollar of invested capital." icon={<Target className="h-6 w-6" />} />
					<EngineCard number="III" title="Tech + Network" description="Ex-RBC Capital Markets quant team powers fraud detection, scoring, and monitoring. 30-year distribution network moves capital faster than anyone." icon={<Cpu className="h-6 w-6" />} />
				</div>
			</div>
		</SwissSection>
	);
}

function EngineCard({ number, title, description, icon }: { number: string; title: string; description: string; icon: React.ReactNode }) {
	return (
		<div className="group lp-hover-raise lp-reveal bg-neutral-900 p-8 transition-all lg:p-12" data-reveal="fade-up">
			<div className="mb-8 flex items-center justify-between">
				<span className="font-serif text-3xl text-neutral-700 italic">{number}</span>
				<div className="text-neutral-600 transition-colors group-hover:text-[#D4A574]">{icon}</div>
			</div>
			<h3 className="mb-4 font-bold font-display text-xl uppercase tracking-tight">{title}</h3>
			<p className="font-light text-neutral-400 text-sm leading-relaxed">{description}</p>
			<div className="mt-6 h-px w-full bg-gradient-to-r from-[#D4A574]/40 to-transparent" />
		</div>
	);
}

/* ── CAPITAL PROTECTION ────────────────────────── */
function ProtectionSection() {
	return (
		<SwissSection id="protection" tone="dark" leftTone="dark" rightTone="dark" title="PROTECTION" titleTone="dark">
			<div className="px-8 py-16 lg:px-20 lg:py-24">
				<h2 className="lp-reveal mb-4 font-bold font-display text-4xl uppercase tracking-tighter lg:text-5xl" data-reveal="fade-up">Six Layers of Capital Protection</h2>
				<p className="lp-reveal mb-16 max-w-xl font-light text-neutral-400 leading-relaxed" data-delay="1" data-reveal="fade-up">
					Engineered for downside protection at every level. The strongest form of capital preservation is never making a bad loan.
				</p>
				<div className="lp-stagger space-y-4">
					<LayerRow number="01" title="Extreme Deal Selection" detail="90% of deals declined before a single dollar is deployed" />
					<LayerRow number="02" title="Conservative LTV Limits" detail="Max 75% on firsts, 80% on seconds — substantial equity cushion" />
					<LayerRow number="03" title="Double Appraisal Verification" detail="Two independent third-party appraisals per deal" />
					<LayerRow number="04" title="AI + Human Vetting" detail="ML fraud detection, income verification, credit analysis" />
					<LayerRow number="05" title="Short Exposure Windows" detail="Most positions held max 2 months via the Flywheel" />
					<LayerRow number="06" title="Power of Sale + Recovery" detail="Dedicated legal team with 100% recovery track record" />
				</div>
			</div>
		</SwissSection>
	);
}

function LayerRow({ number, title, detail }: { number: string; title: string; detail: string }) {
	return (
		<div className="group lp-reveal flex items-center gap-6 border-neutral-800 border-b pb-4 transition-colors hover:border-[#D4A574]/40 lg:gap-8" data-reveal="fade-in">
			<span className="font-mono text-[10px] text-[#D4A574]">{number}</span>
			<Lock className="h-4 w-4 text-neutral-700 transition-colors group-hover:text-[#D4A574]" />
			<div className="flex-1">
				<span className="font-bold font-display text-sm uppercase tracking-tight lg:text-base">{title}</span>
			</div>
			<span className="hidden font-light text-neutral-500 text-sm lg:block">{detail}</span>
		</div>
	);
}

/* ── RETURNS ───────────────────────────────────── */
function ReturnsSection() {
	return (
		<SwissSection id="returns" tone="dark" leftTone="dark" rightTone="dark" title="RETURNS" titleTone="dark">
			<div className="grid min-h-[500px] grid-cols-1 lg:grid-cols-2">
				<div className="flex flex-col justify-center border-neutral-800 border-b p-8 lg:border-r lg:border-b-0 lg:p-20">
					<div className="lp-reveal mb-4 font-bold text-[10px] text-[#D4A574] uppercase tracking-[0.4em]" data-reveal="fade-up">Target Return Profile</div>
					<div className="lp-reveal flex items-start" data-delay="1" data-reveal="fade-up">
						<span className="font-bold font-display text-[80px] text-[#D4A574] leading-[0.8] tracking-tighter lg:text-[120px] xl:text-[160px]">9.25</span>
						<div className="mt-2 ml-2 flex flex-col lg:mt-4 lg:ml-4">
							<span className="font-bold font-display text-[#D4A574] text-2xl lg:text-4xl">%</span>
							<span className="font-bold font-display text-[#D4A574] text-xl lg:text-2xl">+</span>
						</div>
					</div>
					<p className="lp-reveal mt-8 max-w-md font-light text-neutral-400 leading-relaxed lg:text-lg" data-delay="2" data-reveal="fade-up">
						Most of your return comes from lending fees and high capital turnover, not from sitting in long-dated loans.
					</p>
				</div>
				<div className="flex flex-col justify-center p-8 lg:p-20">
					<div className="lp-stagger space-y-6">
						<ReturnBreakdown label="Lending Fee Income" value="1% per origination" note="Multiple cycles/year" />
						<ReturnBreakdown label="Interest Accrual" value="Daily during hold" note="Short-term positions" />
						<ReturnBreakdown label="Capital Turnover" value="4-6x annually" note="Via the Flywheel" />
						<ReturnBreakdown label="Tax Efficiency" value="Flow-through" note="TFSA/RRSP eligible" />
					</div>
				</div>
			</div>
		</SwissSection>
	);
}

function ReturnBreakdown({ label, value, note }: { label: string; value: string; note: string }) {
	return (
		<div className="group lp-reveal flex items-center justify-between border-neutral-800 border-b pb-4" data-reveal="fade-in">
			<div>
				<div className="font-bold font-display text-sm uppercase tracking-tight">{label}</div>
				<div className="font-mono text-[10px] text-neutral-500">{note}</div>
			</div>
			<span className="font-bold font-display text-lg text-[#D4A574] tracking-tight">{value}</span>
		</div>
	);
}

/* ── REGULATORY ────────────────────────────────── */
function RegulatorySection() {
	return (
		<SwissSection tone="dark" leftTone="dark" rightTone="dark">
			<div className="flex flex-wrap items-center justify-center gap-8 py-12 lg:gap-16 lg:py-16">
				<RegBadge label="FSRA" sublabel="Financial Services Regulatory Authority" />
				<div className="h-8 w-px bg-neutral-800" />
				<RegBadge label="OSC" sublabel="Ontario Securities Commission" />
				<div className="h-8 w-px bg-neutral-800" />
				<RegBadge label="TFSA" sublabel="Tax-Free Savings Account Eligible" />
				<div className="h-8 w-px bg-neutral-800" />
				<RegBadge label="RRSP" sublabel="Registered Retirement Eligible" />
			</div>
		</SwissSection>
	);
}

function RegBadge({ label, sublabel }: { label: string; sublabel: string }) {
	return (
		<div className="lp-reveal flex flex-col items-center" data-reveal="fade-in">
			<span className="mb-1 font-bold font-display text-xl tracking-tighter text-[#D4A574] lg:text-2xl">{label}</span>
			<span className="max-w-[140px] text-center font-mono text-[8px] text-neutral-500 uppercase tracking-wider">{sublabel}</span>
		</div>
	);
}

/* ── THE PRINCIPALS ────────────────────────────── */
function PrincipalsSection() {
	return (
		<SwissSection tone="dark" leftTone="dark" rightTone="dark" title="PRINCIPALS" titleTone="dark">
			<div className="px-8 py-16 lg:px-20 lg:py-24">
				<h2 className="lp-reveal mb-16 font-bold font-display text-4xl uppercase tracking-tighter lg:text-5xl" data-reveal="fade-up">
					The <span className="text-[#D4A574]">Team</span>
				</h2>
				<div className="lp-stagger grid grid-cols-1 gap-px bg-neutral-800 md:grid-cols-2">
					<PrincipalCard name="Elie Soberano" role="Founder" credentials={["Top 1% mortgage broker in Canada", "$2B+ deals over 30-year career", "Scotiabank retains at $2,000/hr", "Built 20+ custom homes"]} />
					<PrincipalCard name="Fintech Division" role="Engineering" credentials={["Ex-RBC Capital Markets quants", "AI/ML fraud detection", "Real-time portfolio monitoring", "Institutional-grade platform"]} />
					<PrincipalCard name="Operations" role="Business" credentials={["Barton Engineering founders", "JIT supply chain (Ford)", "Manufacturing-grade discipline", "Zero tolerance for delays"]} />
					<PrincipalCard name="Legal Division" role="Default Response" credentials={["Specialized recovery team", "Power of sale expertise", "Receivership strategy", "100% recovery track record"]} />
				</div>
			</div>
		</SwissSection>
	);
}

function PrincipalCard({ name, role, credentials }: { name: string; role: string; credentials: string[] }) {
	return (
		<div className="group lp-reveal bg-neutral-900 p-8 transition-all lg:p-12" data-reveal="fade-up">
			<div className="mb-6">
				<h3 className="font-bold font-display text-xl uppercase tracking-tight">{name}</h3>
				<span className="font-serif text-[#D4A574] text-sm italic">{role}</span>
			</div>
			<ul className="space-y-2">
				{credentials.map((c) => (
					<li className="flex items-start gap-3 text-neutral-400 text-sm" key={c}>
						<Diamond className="mt-1 h-3 w-3 flex-shrink-0 text-[#D4A574]/40" />
						{c}
					</li>
				))}
			</ul>
		</div>
	);
}

/* ── MARKET INTELLIGENCE ───────────────────────── */
function MarketIntelligence() {
	return (
		<SwissSection tone="dark" leftTone="dark" rightTone="dark" title="FORESIGHT" titleTone="dark">
			<div className="grid min-h-[400px] grid-cols-1 lg:grid-cols-2">
				<div className="flex flex-col justify-center border-neutral-800 border-b p-8 lg:border-r lg:border-b-0 lg:p-20">
					<h2 className="lp-reveal mb-6 font-bold font-display text-3xl uppercase tracking-tighter lg:text-5xl" data-reveal="fade-up">
						We See Market Shifts <span className="text-[#D4A574]">Coming</span>
					</h2>
					<p className="lp-reveal font-light text-neutral-400 leading-relaxed" data-delay="1" data-reveal="fade-up">
						Elie&apos;s track record of anticipating regulatory and market changes — not reacting to them — separates FairLend from managers who operate in the rearview mirror.
					</p>
				</div>
				<div className="flex flex-col justify-center p-8 lg:p-20">
					<div className="lp-stagger space-y-6">
						<ForesightItem year="2016" event="Predicted April 2017 correction" detail="16 months before it caught the industry off guard" />
						<ForesightItem year="2023" event="Pivoted to multiplexes" detail="Before single-family saturation set in" />
						<ForesightItem year="2024" event="Identified levy elimination" detail="~$450K savings per 5-plex from government incentives" />
					</div>
				</div>
			</div>
		</SwissSection>
	);
}

function ForesightItem({ year, event, detail }: { year: string; event: string; detail: string }) {
	return (
		<div className="group lp-reveal flex items-start gap-6 border-neutral-800 border-b pb-4" data-reveal="fade-in">
			<span className="font-mono text-[10px] text-[#D4A574]">{year}</span>
			<div>
				<div className="font-bold font-display text-sm uppercase tracking-tight">{event}</div>
				<div className="font-light text-neutral-500 text-xs">{detail}</div>
			</div>
		</div>
	);
}

/* ── PORTFOLIO COMPOSITION ──────────────────────── */
function PortfolioSection() {
	return (
		<SwissSection id="access" tone="dark" leftTone="dark" rightTone="dark" title="PORTFOLIO" titleTone="dark">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<h2 className="lp-reveal mb-4 font-bold font-display text-4xl uppercase tracking-tighter lg:text-5xl" data-reveal="fade-up">
					Portfolio <span className="text-[#D4A574]">Architecture</span>
				</h2>
				<p className="lp-reveal mb-16 max-w-xl font-light text-neutral-400 leading-relaxed" data-delay="1" data-reveal="fade-up">
					A deliberately structured portfolio balancing yield, duration, and risk across three complementary asset classes.
				</p>
				<div className="lp-stagger grid grid-cols-1 gap-px bg-neutral-800 md:grid-cols-3">
					<PortfolioCard allocation="50%" title="First Mortgages" description="Conservative first-lien bridge loans at sub-75% LTV. The stable core powering the lending fee flywheel." returnTarget="~9%" holdPeriod="Short-term" />
					<PortfolioCard allocation="30%" title="Multiplex Builds" description="Ground-up construction lending where our builder expertise provides an edge that desk-only lenders cannot replicate." returnTarget="~14%" holdPeriod="8–14 months" highlighted />
					<PortfolioCard allocation="20%" title="Second Mortgages" description="Carefully underwritten second-lien positions at sub-80% LTV. Higher yield with the same rigorous vetting process." returnTarget="~12%" holdPeriod="Short-term" />
				</div>
			</div>
		</SwissSection>
	);
}

function PortfolioCard({ allocation, title, description, returnTarget, holdPeriod, highlighted = false }: { allocation: string; title: string; description: string; returnTarget: string; holdPeriod: string; highlighted?: boolean }) {
	return (
		<div className={`group lp-reveal p-8 transition-all lg:p-10 ${highlighted ? "bg-[#D4A574]/5" : "bg-neutral-900"}`} data-reveal="fade-up">
			{highlighted && <div className="mb-6 h-px w-full bg-[#D4A574]/40" />}
			<div className="mb-6 flex items-end justify-between">
				<span className="font-bold font-display text-4xl text-[#D4A574] tracking-tighter lg:text-5xl">{allocation}</span>
				<span className="font-mono text-[9px] text-neutral-600 uppercase">{holdPeriod}</span>
			</div>
			<h3 className="mb-3 font-bold font-display text-lg uppercase tracking-tight">{title}</h3>
			<p className="mb-6 font-light text-neutral-400 text-sm leading-relaxed">{description}</p>
			<div className="border-neutral-800 border-t pt-4">
				<span className="font-mono text-[9px] text-neutral-600 uppercase tracking-widest">Target</span>
				<div className="font-bold font-display text-xl text-[#D4A574] tracking-tight">{returnTarget}</div>
			</div>
		</div>
	);
}

/* ── THE BUILDS ────────────────────────────────── */
function BuildsSection() {
	return (
		<SwissSection tone="dark" leftTone="dark" rightTone="dark" title="THE BUILDS" titleTone="dark">
			<div className="grid min-h-[500px] grid-cols-1 lg:grid-cols-2">
				<div className="flex flex-col justify-center border-neutral-800 border-b p-8 lg:border-r lg:border-b-0 lg:p-20">
					<h2 className="lp-reveal mb-6 font-bold font-display text-3xl uppercase tracking-tighter lg:text-5xl" data-reveal="fade-up">
						Builder Meets <span className="text-[#D4A574]">Lender</span>
					</h2>
					<p className="lp-reveal font-light text-neutral-400 leading-relaxed lg:text-lg" data-delay="1" data-reveal="fade-up">
						Most lenders review blueprints from behind a desk. Our founder has personally constructed over 20 custom homes and managed 50+ renovation projects. He walks the site, assesses the builder, and catches the issues that paper-only lenders never see. It&apos;s this rare combination of instinct and discipline that lets us find opportunities others miss and avoid the ones that merely look good on paper.
					</p>
				</div>
				<div className="flex flex-col justify-center p-8 lg:p-20">
					<div className="lp-stagger space-y-6">
						<BuildDetail label="30-year contractor network" detail="Rapid intervention when builds need course correction" />
						<BuildDetail label="Expert on-site monitoring" detail="Boots on the ground from foundation to finish" />
						<BuildDetail label="~14% target returns" detail="2–5% premium over standard private mortgage yields" />
						<BuildDetail label="Trust but verify" detail="Every build tracked, every milestone confirmed in person" />
					</div>
				</div>
			</div>
		</SwissSection>
	);
}

function BuildDetail({ label, detail }: { label: string; detail: string }) {
	return (
		<div className="group lp-reveal flex items-start gap-6 border-neutral-800 border-b pb-4" data-reveal="fade-in">
			<Diamond className="mt-1 h-3 w-3 flex-shrink-0 text-[#D4A574]/60" />
			<div>
				<div className="font-bold font-display text-sm uppercase tracking-tight">{label}</div>
				<div className="font-light text-neutral-500 text-xs">{detail}</div>
			</div>
		</div>
	);
}

/* ── TESTIMONIALS ──────────────────────────────── */
function TestimonialSection() {
	return (
		<SwissSection tone="dark" leftTone="dark" rightTone="dark">
			<div className="flex flex-col items-center justify-center px-8 py-16 lg:py-24">
				<Sparkles className="lp-reveal mb-8 h-6 w-6 text-[#D4A574]/40" data-reveal="fade-in" />
				<blockquote className="lp-reveal mb-8 max-w-2xl text-center font-serif text-2xl text-neutral-200 italic leading-relaxed lg:text-3xl" data-delay="1" data-reveal="fade-up">
					&ldquo;The transparency is unmatched. I can see exactly where my capital is deployed at any time. Finally, a MIC that treats investors like partners.&rdquo;
				</blockquote>
				<div className="lp-reveal flex items-center gap-4" data-delay="2" data-reveal="fade-in">
					<div className="h-px w-12 bg-[#D4A574]/40" />
					<div className="text-center">
						<div className="font-bold font-display text-sm uppercase tracking-wider">Michael R.</div>
						<div className="font-mono text-[10px] text-neutral-500">Real Estate Professional — Toronto</div>
					</div>
					<div className="h-px w-12 bg-[#D4A574]/40" />
				</div>
			</div>
		</SwissSection>
	);
}

/* ── FAQ ───────────────────────────────────────── */
function FAQSection() {
	return (
		<SwissSection id="faq" tone="dark" leftTone="dark" rightTone="dark" title="FAQ" titleTone="dark">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<h2 className="lp-reveal mb-12 font-bold font-display text-4xl uppercase tracking-tighter lg:mb-16 lg:text-5xl" data-reveal="fade-up">Common Questions</h2>
				<div className="lp-stagger space-y-4">
					<DarkFAQ question="What is a MIC?" answer="A Mortgage Investment Corporation pools investor capital to fund mortgages. It's a flow-through entity — income passes directly to investors without corporate taxation." />
					<DarkFAQ question="How does FairLend differ?" answer="We fund mortgages short-term, earn lending fees and interest, then sell to long-term buyers. This 'spin' model maximizes capital efficiency and fee income." />
					<DarkFAQ question="Is it TFSA/RRSP eligible?" answer="Yes. MIC shares are eligible for TFSA, RRSP, RESP, RRIF, RDSP, and LIRA accounts." />
					<DarkFAQ question="How is risk managed?" answer="Maximum 75% LTV, double appraisals, AI + human vetting, short exposure windows, and power of sale on all investments." />
					<DarkFAQ question="How quickly can I start?" answer="Typically 30-90 days. We process new investments in cohorts for optimal capital deployment." />
					<DarkFAQ question="What's the redemption process?" answer="One-year minimum hold. Then quarterly redemptions with 60 days notice, subject to liquidity." />
				</div>
			</div>
		</SwissSection>
	);
}

function DarkFAQ({ question, answer }: { question: string; answer: string }) {
	return (
		<div className="group lp-reveal border-neutral-800 border-b pb-4 transition-colors hover:border-[#D4A574]/40" data-reveal="fade-in">
			<h3 className="mb-2 flex items-center gap-3 font-bold font-display text-base uppercase tracking-tight lg:text-lg">
				<ChevronRight className="h-4 w-4 text-[#D4A574]/60 transition-transform group-hover:translate-x-1" />
				{question}
			</h3>
			<p className="pl-7 font-light text-neutral-400 text-sm leading-relaxed">{answer}</p>
		</div>
	);
}

/* ── CTA ───────────────────────────────────────── */
function CTASection() {
	return (
		<SwissSection id="cta" tone="dark" leftTone="dark" rightTone="dark" title="NEXT STEP" titleTone="dark">
			<div className="flex min-h-[500px] flex-col items-center justify-center px-8 py-16 text-center lg:py-24">
				<Crown className="lp-reveal mb-8 h-10 w-10 text-[#D4A574] lg:h-12 lg:w-12" data-reveal="scale-in" />
				<h2 className="lp-reveal mb-4 font-bold font-display text-4xl uppercase tracking-tighter lg:text-6xl" data-delay="1" data-reveal="fade-up">
					See the Full <span className="text-[#D4A574]">Picture</span>
				</h2>
				<p className="lp-reveal mb-8 max-w-xl font-light text-neutral-400 leading-relaxed lg:mb-12 lg:text-lg" data-delay="2" data-reveal="fade-up">
					Numbers tell part of the story. A thirty-minute presentation covers the rest — the team, the deals, and the discipline behind every dollar deployed.
				</p>
				<div className="lp-reveal flex flex-col gap-4 sm:flex-row" data-delay="3" data-reveal="fade-up">
					<a className="lp-cta lp-hover-raise inline-flex cursor-pointer items-center gap-2 bg-[#D4A574] px-8 py-4 font-bold text-[11px] text-neutral-950 uppercase tracking-widest transition-all hover:bg-white" href="#book">
						Book a Presentation <ArrowRight className="h-4 w-4" />
					</a>
					<a className="lp-hover-raise inline-flex cursor-pointer items-center gap-2 border border-neutral-700 px-8 py-4 font-bold text-[11px] uppercase tracking-widest transition-all hover:border-[#D4A574] hover:text-[#D4A574]" href="#prospectus">
						View Prospectus <ArrowUpRight className="h-4 w-4" />
					</a>
				</div>
				<p className="lp-reveal mt-8 font-mono text-[10px] text-neutral-600" data-delay="4" data-reveal="fade-in">
					FSRA regulated &middot; OSC compliant &middot; TFSA / RRSP / RESP eligible
				</p>
			</div>
		</SwissSection>
	);
}

/* ── FOOTER ────────────────────────────────────── */
function LuxuryFooter() {
	return (
		<>
			<SwissSection leftTone="dark" rightTone="dark" tone="dark">
				<div className="px-8 py-12 lg:px-16 lg:py-16">
					<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
						<div>
							<div className="mb-6 flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center bg-[#D4A574]">
									<BarChart3 className="h-5 w-5 text-neutral-950" />
								</div>
								<span className="font-bold font-display text-xl tracking-tight">FairLend</span>
							</div>
							<p className="mb-6 font-light text-neutral-500 text-sm leading-relaxed">Private mortgage investment, engineered for returns.</p>
						</div>
						<div>
							<h4 className="mb-6 font-bold text-[11px] text-neutral-400 uppercase tracking-[0.3em]">Navigation</h4>
							<ul className="space-y-3">
								<FooterLink href="#approach" label="The Approach" />
								<FooterLink href="#protection" label="Protection" />
								<FooterLink href="#returns" label="Returns" />
								<FooterLink href="#portfolio" label="Portfolio" />
							</ul>
						</div>
						<div>
							<h4 className="mb-6 font-bold text-[11px] text-neutral-400 uppercase tracking-[0.3em]">Legal</h4>
							<ul className="space-y-3">
								<FooterLink href="#" label="Offering Memorandum" />
								<FooterLink href="#" label="Privacy Policy" />
								<FooterLink href="#" label="Terms of Service" />
							</ul>
						</div>
						<div>
							<h4 className="mb-6 font-bold text-[11px] text-neutral-400 uppercase tracking-[0.3em]">Contact</h4>
							<ul className="space-y-4">
								<li className="flex items-start gap-3 text-neutral-500 text-sm"><Mail className="mt-0.5 h-4 w-4 text-[#D4A574]" /> invest@fairlend.ca</li>
								<li className="flex items-start gap-3 text-neutral-500 text-sm"><MapPin className="mt-0.5 h-4 w-4 text-[#D4A574]" /> Toronto, Ontario</li>
							</ul>
						</div>
					</div>
					<div className="mt-12 flex flex-col items-center justify-between gap-4 border-neutral-800 border-t pt-8 md:flex-row">
						<p className="font-mono text-[10px] text-neutral-600">&copy; 2024 FairLend MIC. All rights reserved.</p>
						<div className="flex items-center gap-6">
							<span className="font-mono text-[10px] text-neutral-600">FSRA</span>
							<span className="h-3 w-px bg-neutral-800" />
							<span className="font-mono text-[10px] text-neutral-600">OSC</span>
						</div>
					</div>
				</div>
			</SwissSection>
			<footer className="section-grid h-16 border-neutral-800 bg-neutral-950 text-white lg:h-20">
				<div className="margin-col border-neutral-800 border-r" />
				<div className="flex h-full flex-1 items-center justify-between px-6 lg:px-12">
					<span className="font-mono text-[10px] text-neutral-600 uppercase tracking-widest">By Invitation</span>
					<ScrollToTop />
				</div>
				<div className="margin-col border-neutral-800 border-l" />
			</footer>
		</>
	);
}

function FooterLink({ href, label }: { href: string; label: string }) {
	return (
		<li><a className="group flex cursor-pointer items-center gap-2 text-neutral-500 text-sm transition-colors hover:text-[#D4A574]" href={href}><ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" /> {label}</a></li>
	);
}

/* ── SUB-COMPONENTS ────────────────────────────── */
function ProtocolItem({ label }: { label: string }) {
	return (
		<div className="group lp-reveal flex items-center space-x-3 border-white/10 border-b pb-2 lg:space-x-4" data-reveal="fade-up">
			<ArrowRight className="lp-icon-nudge h-4 w-4 text-[#D4A574]" />
			<span className="font-bold text-xs uppercase tracking-widest">{label}</span>
		</div>
	);
}

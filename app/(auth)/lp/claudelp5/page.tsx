import {
	ArrowRight,
	ArrowUpRight,
	BarChart3,
	ChevronRight,
	Cpu,
	Diamond,
	Hexagon,
	Landmark,
	Mail,
	MapPin,
	Menu,
	Rocket,
	Shield,
	ShieldCheck,
	Star,
	Target,
	TrendingUp,
	Triangle,
	Users,
	Wallet,
	Zap,
} from "lucide-react";
import { ScrollReveal } from "../components/scroll-reveal";
import { ScrollToTop } from "../components/scroll-to-top";
import { SwissSection } from "../components/swiss-section";

/* ─────────────────────────────────────────────────
   VARIANT 5: GEOMETRIC / ART DECO FINTECH
   stripe.com meets 1920s Art Deco poster design.
   Bold geometric shapes, angular, vivid palette.
   ───────────────────────────────────────────────── */

export default function ClaudeLp5() {
	return (
		<div className="relative z-10 flex min-h-screen w-full flex-col">
			<ScrollReveal />
			<GeoHeader />
			<div className="flex w-full flex-col">
				<HeroSection />
				<MetricsStrip />
				<EngineSection />
				<PillarsSection />
				<ProtectionGrid />
				<PerformanceSection />
				<RegulatoryShield />
				<LeadershipSection />
				<ForesightTimeline />
				<PortfolioSection />
				<BuildsSection />
				<SignalsSection />
				<IntelSection />
				<DeployCTA />
			</div>
			<GeoFooter />
		</div>
	);
}

/* ── HEADER ────────────────────────────────────── */
function GeoHeader() {
	return (
		<header className="sticky top-0 z-50 flex h-14 w-full items-center border-neutral-800 border-b bg-[#0A1628]/95 text-white backdrop-blur-sm">
			<div className="flex h-full w-16 flex-shrink-0 items-center justify-center border-neutral-800 border-r">
				<div className="flex h-8 w-8 items-center justify-center bg-[#00D4AA]" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
					<BarChart3 className="h-4 w-4 text-[#0A1628]" />
				</div>
			</div>
			<div className="flex h-full flex-1 items-center justify-between bg-[#0A1628] px-6 lg:px-12">
				<span className="font-bold font-display text-lg tracking-tight">FAIRLEND</span>
				<nav className="hidden gap-8 font-bold text-[11px] text-neutral-400 uppercase tracking-[0.3em] xl:flex">
					<a className="cursor-pointer transition-colors hover:text-[#00D4AA]" href="#engine">Engine</a>
					<a className="cursor-pointer transition-colors hover:text-[#00D4AA]" href="#protection">Protection</a>
					<a className="cursor-pointer transition-colors hover:text-[#00D4AA]" href="#portfolio">Portfolio</a>
					<a className="cursor-pointer transition-colors hover:text-[#00D4AA]" href="#intel">Intel</a>
				</nav>
				<a className="lp-cta cursor-pointer bg-[#00D4AA] px-6 py-2.5 font-bold text-[11px] text-[#0A1628] uppercase tracking-widest transition-all hover:bg-[#FFB800]" href="#cta">
					Book a Presentation
				</a>
			</div>
			<div className="flex h-full w-16 flex-shrink-0 cursor-pointer items-center justify-center border-neutral-800 border-l transition-colors hover:bg-[#0A1628]">
				<Menu className="h-5 w-5 text-neutral-500" />
			</div>
		</header>
	);
}

/* ── HERO (UNTOUCHED) ──────────────────────────── */
function HeroSection() {
	return (
		<section className="section-grid min-h-[calc(100vh-16rem)] border-neutral-800 bg-[#0A1628] text-white" id="how-it-works">
			<div className="margin-col border-neutral-800 border-r" />
			<div className="grid w-full grid-cols-1 lg:grid-cols-12">
				<div className="col-span-12 flex flex-col border-neutral-800 border-b lg:col-span-5 lg:border-r lg:border-b-0">
					<div className="flex flex-grow flex-col justify-between px-8 pt-12 pb-8 lg:px-12 lg:pt-16 lg:pb-12">
						<div>
							<div className="lp-reveal mb-12 flex items-center space-x-4 lg:mb-20" data-delay="1" data-reveal="fade-up">
								<span className="h-[2px] w-12 bg-[#00D4AA]" />
								<span className="font-bold text-[12px] text-neutral-500 uppercase tracking-[0.4em]">FairLend MIC</span>
							</div>
							<div className="mb-12 lg:mb-16">
								<h1 className="lp-reveal -ml-1 mb-4 font-black font-display text-[56px] uppercase leading-[0.85] tracking-tighter md:text-[70px] lg:text-[90px] xl:text-[110px]" data-delay="2" data-reveal="fade-up">FairLend</h1>
								<div className="lp-reveal -mt-2 md:-mt-4 mb-8 font-serif text-5xl text-[#00D4AA] lowercase italic tracking-tight md:mb-12 md:text-6xl lg:text-7xl xl:text-8xl" data-delay="3" data-reveal="fade-up">mic</div>
								<div className="w-full max-w-[400px]">
									<p className="lp-reveal text-justify font-light text-[15px] text-neutral-400 leading-[1.6] md:text-[16px]" data-delay="4" data-reveal="fade-up">
										The FairLend MIC is a pooled vehicle that provides short-term funding for private, interest-only mortgages. Instead of holding mortgages for years, the MIC funds them for a few days, earns fees and interest, then sells them to long-term buyers on the FairLend marketplace.
									</p>
								</div>
							</div>
						</div>
						<div className="lp-reveal flex flex-wrap gap-4" data-delay="5" data-reveal="fade-in">
							<a className="lp-cta lp-hover-raise inline-flex cursor-pointer items-center gap-2 bg-[#00D4AA] px-6 py-3 font-bold text-[11px] text-[#0A1628] uppercase tracking-widest transition-all hover:bg-[#FFB800]" href="#cta">
								Book a Presentation <ArrowRight className="h-4 w-4" />
							</a>
							<a className="lp-hover-raise inline-flex cursor-pointer items-center gap-2 border border-neutral-700 px-6 py-3 font-bold text-[11px] uppercase tracking-widest transition-all hover:border-[#00D4AA] hover:text-[#00D4AA]" href="#engine">
								The Engine
							</a>
						</div>
					</div>
					<div className="group lp-reveal relative h-[280px] overflow-hidden border-neutral-800 border-t lg:h-[300px]" data-delay="2" data-reveal="fade-in">
						<div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-center bg-cover opacity-10 contrast-125 grayscale transition-opacity duration-700 group-hover:opacity-20" />
						{/* Geometric pattern overlay */}
						<div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 20px, #00D4AA 20px, #00D4AA 21px)" }} />
						<div className="relative z-10 flex h-full flex-col justify-between p-8 lg:p-12">
							<div>
								<h3 className="font-bold text-[10px] text-neutral-500 uppercase tracking-widest">The Spin Model</h3>
								<div className="mt-4 h-[2px] w-12 bg-[#00D4AA]" />
							</div>
							<div>
								<p className="mb-2 font-bold font-display text-2xl uppercase leading-none tracking-tight lg:text-3xl">Short-Term Lender</p>
								<p className="font-serif text-[#FFB800] text-xl italic lg:text-2xl">Long-Term Buyers</p>
							</div>
						</div>
					</div>
				</div>
				<div className="col-span-12 flex flex-col lg:col-span-7">
					<div className="lp-stagger grid h-32 grid-cols-3 border-neutral-800 border-b lg:h-40">
						<div className="group lp-reveal flex cursor-pointer items-center justify-center border-neutral-800 border-r transition-colors hover:bg-[#00D4AA]/5" data-delay="1" data-reveal="fade-in">
							<span className="font-bold font-display text-2xl tracking-tighter transition-colors group-hover:text-[#00D4AA] lg:text-3xl xl:text-4xl">TFSA</span>
						</div>
						<div className="group lp-reveal flex cursor-pointer items-center justify-center border-neutral-800 border-r transition-colors hover:bg-[#00D4AA]/5" data-delay="2" data-reveal="fade-in">
							<span className="font-bold font-display text-2xl tracking-tighter transition-colors group-hover:text-[#00D4AA] lg:text-3xl xl:text-4xl">RRSP</span>
						</div>
						<div className="group lp-reveal flex cursor-pointer items-center justify-center transition-colors hover:bg-[#00D4AA]/5" data-delay="3" data-reveal="fade-in">
							<span className="font-bold font-display text-2xl tracking-tighter transition-colors group-hover:text-[#00D4AA] lg:text-3xl xl:text-4xl">RESP</span>
						</div>
					</div>
					<div className="lp-stagger grid flex-grow grid-cols-1 border-neutral-800 border-b md:grid-cols-2">
						<div className="group lp-hover-raise lp-reveal flex flex-col justify-between border-neutral-800 border-b p-8 transition-colors hover:bg-[#00D4AA]/5 md:border-r md:border-b-0 lg:p-12" data-reveal="fade-up">
							<div className="flex items-start justify-between">
								<h4 className="font-bold text-[10px] text-neutral-500 uppercase tracking-widest">LTV</h4>
								<TrendingUp className="h-5 w-5 text-neutral-700 transition-colors group-hover:text-[#00D4AA]" />
							</div>
							<div>
								<div className="font-bold font-display text-4xl tracking-tighter md:text-5xl lg:text-6xl xl:text-7xl">75<span className="ml-1 align-top font-sans text-xl md:text-2xl">%</span></div>
								<p className="mt-4 font-mono text-[10px] text-neutral-500 uppercase tracking-tighter">Max loan-to-value</p>
							</div>
						</div>
						<div className="group lp-hover-raise lp-reveal flex flex-col justify-between p-8 transition-colors hover:bg-[#00D4AA]/5 lg:p-12" data-reveal="fade-up">
							<div className="flex items-start justify-between">
								<h4 className="font-bold text-[10px] text-neutral-500 uppercase tracking-widest">Lending Fee</h4>
								<Landmark className="h-5 w-5 text-neutral-700 transition-colors group-hover:text-[#00D4AA]" />
							</div>
							<div>
								<div className="font-bold font-display text-4xl tracking-tighter md:text-5xl lg:text-6xl xl:text-7xl">1<span className="ml-1 align-top font-sans text-xl md:text-2xl">%</span></div>
								<p className="mt-4 font-mono text-[10px] text-neutral-500 uppercase tracking-tighter">Lending Fee on Origination</p>
							</div>
						</div>
					</div>
					<div className="lp-reveal relative flex h-[280px] flex-col justify-between overflow-hidden bg-security-green p-8 text-white lg:h-[300px] lg:p-12" data-delay="2" data-reveal="scale-in">
						<div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(60deg, transparent, transparent 30px, #00D4AA 30px, #00D4AA 31px)" }} />
						<div className="relative z-10 flex items-start justify-between">
							<div>
								<h4 className="mb-6 font-bold text-[11px] text-white/50 uppercase tracking-[0.4em] lg:mb-8">MIC Visibility</h4>
								<h3 className="mb-2 font-bold font-display text-2xl tracking-tight lg:text-3xl">Deal-Level Transparency</h3>
								<p className="font-serif text-[#00D4AA] text-lg italic lg:text-xl">Built for serious investors</p>
							</div>
							<ShieldCheck className="lp-soft-float h-8 w-8 text-[#00D4AA] lg:h-10 lg:w-10" />
						</div>
						<div className="lp-stagger relative z-10 grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2 lg:gap-x-12 lg:gap-y-4">
							<GeoProtocolItem label="Pool overview" />
							<GeoProtocolItem label="Properties & deal flow" />
							<GeoProtocolItem label="Capital deployment" />
							<GeoProtocolItem label="Performance breakdown" />
						</div>
					</div>
				</div>
			</div>
			<div className="margin-col border-neutral-800 border-l" />
		</section>
	);
}

/* ── METRICS STRIP ─────────────────────────────── */
function MetricsStrip() {
	return (
		<SwissSection tone="dark" leftTone="dark" rightTone="dark">
			<div className="lp-stagger grid grid-cols-2 gap-0 md:grid-cols-4">
				<MetricCard label="AUM" value="$25M+" color="text-[#00D4AA]" />
				<MetricCard label="Investors" value="500+" color="text-[#FFB800]" />
				<MetricCard label="Funded" value="150+" color="text-[#00D4AA]" />
				<MetricCard label="Defaults" value="0.0%" color="text-[#FFB800]" />
			</div>
		</SwissSection>
	);
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
	return (
		<div className="lp-reveal group flex flex-col items-center justify-center border-neutral-800 border-r bg-[#0A1628] p-8 last:border-r-0 transition-colors hover:bg-[#0F1D30] lg:p-12" data-reveal="fade-in">
			<span className={`mb-2 font-bold font-display text-3xl tracking-tighter lg:text-5xl ${color}`}>{value}</span>
			<span className="font-bold text-[9px] text-neutral-500 uppercase tracking-widest">{label}</span>
		</div>
	);
}

/* ── THE ENGINE ────────────────────────────────── */
function EngineSection() {
	return (
		<SwissSection id="engine" tone="dark" leftTone="dark" rightTone="dark" title="THE ENGINE" titleTone="dark">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<h2 className="lp-reveal mb-4 font-bold font-display text-4xl uppercase tracking-tighter lg:text-6xl" data-reveal="fade-up">
					The <span className="text-[#00D4AA]">Spin</span> Engine
				</h2>
				<p className="lp-reveal mb-16 max-w-xl font-light text-neutral-400 leading-relaxed lg:text-lg" data-delay="1" data-reveal="fade-up">
					Capital recycling mechanism that compounds returns without compounding risk.
				</p>
				<div className="lp-stagger grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-0">
					<SpinStep number="01" title="Originate" description="1% lending fee earned" accent="#00D4AA" />
					<SpinStep number="02" title="Hold" description="Daily interest accrual" accent="#FFB800" />
					<SpinStep number="03" title="Distribute" description="Sold to long-term buyers" accent="#00D4AA" />
					<SpinStep number="04" title="Recycle" description="Capital redeployed" accent="#FFB800" />
				</div>
			</div>
		</SwissSection>
	);
}

function SpinStep({ number, title, description, accent }: { number: string; title: string; description: string; accent: string }) {
	return (
		<div className="group lp-reveal relative border-neutral-800 p-6 lg:border-r lg:p-8 lg:last:border-r-0" data-reveal="fade-up">
			<div className="absolute top-0 left-0 h-1 w-full lg:h-full lg:w-1" style={{ backgroundColor: accent }} />
			<span className="mb-4 block font-mono text-[10px] text-neutral-600">{number}</span>
			<h3 className="mb-2 font-bold font-display text-xl uppercase tracking-tight">{title}</h3>
			<p className="font-light text-neutral-500 text-sm">{description}</p>
			<ArrowRight className="mt-4 h-4 w-4 text-neutral-700 transition-colors" style={{ color: accent }} />
		</div>
	);
}

/* ── THREE PILLARS ─────────────────────────────── */
function PillarsSection() {
	return (
		<SwissSection tone="dark" leftTone="dark" rightTone="dark" title="ALPHA" titleTone="dark">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<h2 className="lp-reveal mb-16 font-bold font-display text-4xl uppercase tracking-tighter lg:text-5xl" data-reveal="fade-up">
					Three Engines of <span className="text-[#FFB800]">Alpha</span>
				</h2>
				<div className="lp-stagger grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
					<PillarCard icon={<Shield className="h-6 w-6" />} title="Best Borrowers" description="90% rejection rate. Double appraisals. AI fraud detection + expert human underwriters." accent="#00D4AA" />
					<PillarCard icon={<Target className="h-6 w-6" />} title="The Flywheel" description="1% fee per origination. Max 2-month hold. Multiple cycles per year on the same capital." accent="#FFB800" />
					<PillarCard icon={<Cpu className="h-6 w-6" />} title="Tech + Network" description="Ex-RBC Capital Markets quant team. 30-year distribution network. Institutional infrastructure." accent="#00D4AA" />
				</div>
			</div>
		</SwissSection>
	);
}

function PillarCard({ icon, title, description, accent }: { icon: React.ReactNode; title: string; description: string; accent: string }) {
	return (
		<div className="group lp-hover-raise lp-reveal relative overflow-hidden border border-neutral-800 bg-[#0A1628] p-6 transition-all hover:border-neutral-700 lg:p-8" data-reveal="fade-up">
			<div className="absolute top-0 left-0 h-1 w-full" style={{ backgroundColor: accent }} />
			<div className="mb-6 flex h-12 w-12 items-center justify-center border border-neutral-800" style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)", borderColor: accent, color: accent }}>
				{icon}
			</div>
			<h3 className="mb-3 font-bold font-display text-xl uppercase tracking-tight">{title}</h3>
			<p className="font-light text-neutral-400 text-sm leading-relaxed">{description}</p>
		</div>
	);
}

/* ── PROTECTION GRID ───────────────────────────── */
function ProtectionGrid() {
	return (
		<SwissSection id="protection" tone="dark" leftTone="dark" rightTone="dark" title="SHIELD" titleTone="dark">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<h2 className="lp-reveal mb-4 font-bold font-display text-4xl uppercase tracking-tighter lg:text-5xl" data-reveal="fade-up">
					Six-Layer <span className="text-[#00D4AA]">Protection</span>
				</h2>
				<p className="lp-reveal mb-16 max-w-xl font-light text-neutral-400 leading-relaxed" data-delay="1" data-reveal="fade-up">
					Engineered for downside protection at every level.
				</p>
				<div className="lp-stagger grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					<ShieldCard number="01" title="Deal Selection" detail="90% rejection — the strongest filter" accent="#00D4AA" />
					<ShieldCard number="02" title="Conservative LTV" detail="75% max first, 80% max second" accent="#FFB800" />
					<ShieldCard number="03" title="Double Appraisal" detail="2 independent valuations per deal" accent="#00D4AA" />
					<ShieldCard number="04" title="AI + Human Vetting" detail="ML fraud detection + expert review" accent="#FFB800" />
					<ShieldCard number="05" title="Short Exposure" detail="Max 2-month positions via flywheel" accent="#00D4AA" />
					<ShieldCard number="06" title="Recovery Team" detail="100% track record in distressed situations" accent="#FFB800" />
				</div>
			</div>
		</SwissSection>
	);
}

function ShieldCard({ number, title, detail, accent }: { number: string; title: string; detail: string; accent: string }) {
	return (
		<div className="group lp-reveal border border-neutral-800 bg-[#0F1D30] p-6 transition-all hover:border-neutral-700" data-reveal="fade-up">
			<div className="mb-4 flex items-center justify-between">
				<span className="font-mono text-[10px]" style={{ color: accent }}>{number}</span>
				<Diamond className="h-4 w-4 text-neutral-700 transition-colors" style={{ color: `${accent}40` }} />
			</div>
			<h4 className="mb-2 font-bold font-display text-base uppercase tracking-tight">{title}</h4>
			<p className="font-light text-neutral-500 text-sm">{detail}</p>
		</div>
	);
}

/* ── PERFORMANCE ───────────────────────────────── */
function PerformanceSection() {
	return (
		<SwissSection tone="dark" leftTone="dark" rightTone="dark" title="YIELD" titleTone="dark">
			<div className="grid min-h-[500px] grid-cols-1 lg:grid-cols-2">
				<div className="flex flex-col justify-center border-neutral-800 border-b p-8 lg:border-r lg:border-b-0 lg:p-20">
					<div className="lp-reveal mb-2 font-bold text-[10px] text-[#FFB800] uppercase tracking-[0.4em]" data-reveal="fade-up">Performance Target</div>
					<div className="lp-reveal flex items-start" data-delay="1" data-reveal="fade-up">
						<span className="font-bold font-display text-[80px] leading-[0.8] tracking-tighter lg:text-[120px] xl:text-[160px]">
							<span className="text-[#00D4AA]">9</span>
							<span className="text-[#FFB800]">.25</span>
						</span>
						<div className="mt-2 ml-2 flex flex-col lg:mt-4">
							<span className="font-bold font-display text-[#00D4AA] text-2xl lg:text-4xl">%</span>
							<span className="font-bold font-display text-[#FFB800] text-xl lg:text-2xl">+</span>
						</div>
					</div>
					<p className="lp-reveal mt-8 max-w-md font-light text-neutral-400 leading-relaxed lg:text-lg" data-delay="2" data-reveal="fade-up">
						Returns from operational excellence and fee generation — not from leveraging risk.
					</p>
				</div>
				<div className="p-8 lg:p-16">
					<div className="lp-stagger space-y-6">
						<YieldBar label="Fee Income" value="1% per cycle" width="85%" color="#00D4AA" />
						<YieldBar label="Interest" value="Daily accrual" width="65%" color="#FFB800" />
						<YieldBar label="Turnover" value="4-6x annually" width="90%" color="#00D4AA" />
						<YieldBar label="Tax Efficiency" value="Flow-through" width="100%" color="#FFB800" />
					</div>
				</div>
			</div>
		</SwissSection>
	);
}

function YieldBar({ label, value, width, color }: { label: string; value: string; width: string; color: string }) {
	return (
		<div className="lp-reveal" data-reveal="fade-in">
			<div className="mb-2 flex items-center justify-between">
				<span className="font-bold font-display text-sm uppercase tracking-tight">{label}</span>
				<span className="font-mono text-[10px] text-neutral-500">{value}</span>
			</div>
			<div className="h-2 w-full bg-neutral-800">
				<div className="h-full transition-all duration-1000" style={{ width, backgroundColor: color }} />
			</div>
		</div>
	);
}

/* ── REGULATORY ────────────────────────────────── */
function RegulatoryShield() {
	return (
		<SwissSection tone="dark" leftTone="dark" rightTone="dark">
			<div className="flex flex-wrap items-center justify-center gap-6 py-12 lg:gap-10 lg:py-16">
				<GeoRegBadge label="FSRA" color="#00D4AA" />
				<GeoRegBadge label="OSC" color="#FFB800" />
				<GeoRegBadge label="TFSA" color="#00D4AA" />
				<GeoRegBadge label="RRSP" color="#FFB800" />
				<GeoRegBadge label="RESP" color="#00D4AA" />
			</div>
		</SwissSection>
	);
}

function GeoRegBadge({ label, color }: { label: string; color: string }) {
	return (
		<div className="lp-reveal flex items-center gap-3 border px-5 py-2.5" style={{ borderColor: `${color}40` }} data-reveal="fade-in">
			<div className="h-2 w-2" style={{ backgroundColor: color, clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
			<span className="font-bold font-display text-lg tracking-tight" style={{ color }}>{label}</span>
		</div>
	);
}

/* ── LEADERSHIP ────────────────────────────────── */
function LeadershipSection() {
	return (
		<SwissSection tone="dark" leftTone="dark" rightTone="dark" title="TEAM" titleTone="dark">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<h2 className="lp-reveal mb-16 font-bold font-display text-4xl uppercase tracking-tighter lg:text-5xl" data-reveal="fade-up">
					Leadership <span className="text-[#FFB800]">Grid</span>
				</h2>
				<div className="lp-stagger grid grid-cols-1 gap-4 md:grid-cols-2">
					<LeaderCard name="Elie Soberano" role="Founder" credentials={["Top 1% Canadian mortgage broker", "$2B+ deals over 30 years", "Built 20+ custom homes"]} accent="#00D4AA" />
					<LeaderCard name="Fintech Division" role="Engineering" credentials={["Ex-RBC Capital Markets quants", "AI/ML fraud detection", "Institutional-grade platform"]} accent="#FFB800" />
					<LeaderCard name="Operations" role="Business" credentials={["Barton Engineering founders", "JIT supply chain (Ford)", "Manufacturing-grade ops"]} accent="#FFB800" />
					<LeaderCard name="Legal Division" role="Recovery" credentials={["Specialized recovery team", "Power of sale expertise", "100% recovery track record"]} accent="#00D4AA" />
				</div>
			</div>
		</SwissSection>
	);
}

function LeaderCard({ name, role, credentials, accent }: { name: string; role: string; credentials: string[]; accent: string }) {
	return (
		<div className="group lp-reveal relative overflow-hidden border border-neutral-800 bg-[#0A1628] p-6 transition-all hover:border-neutral-700 lg:p-8" data-reveal="fade-up">
			<div className="absolute top-0 left-0 h-full w-1" style={{ backgroundColor: accent }} />
			<h3 className="mb-1 font-bold font-display text-lg uppercase tracking-tight">{name}</h3>
			<span className="mb-4 block font-mono text-[10px] uppercase tracking-widest" style={{ color: accent }}>{role}</span>
			<ul className="space-y-2">
				{credentials.map((c) => (
					<li className="flex items-center gap-2 text-neutral-400 text-sm" key={c}>
						<ChevronRight className="h-3 w-3" style={{ color: accent }} /> {c}
					</li>
				))}
			</ul>
		</div>
	);
}

/* ── FORESIGHT TIMELINE ────────────────────────── */
function ForesightTimeline() {
	return (
		<SwissSection tone="dark" leftTone="dark" rightTone="dark" title="FORESIGHT" titleTone="dark">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<h2 className="lp-reveal mb-16 font-bold font-display text-4xl uppercase tracking-tighter lg:text-5xl" data-reveal="fade-up">
					Market <span className="text-[#00D4AA]">Foresight</span>
				</h2>
				<div className="lp-stagger space-y-0">
					<TimelineItem year="2016" event="Predicted the April 2017 correction" detail="16 months before it caught the industry" color="#00D4AA" />
					<TimelineItem year="2023" event="Pivoted to multiplexes" detail="Before single-family saturation" color="#FFB800" />
					<TimelineItem year="2024" event="Identified levy elimination" detail="~$450K savings per 5-plex" color="#00D4AA" />
				</div>
			</div>
		</SwissSection>
	);
}

function TimelineItem({ year, event, detail, color }: { year: string; event: string; detail: string; color: string }) {
	return (
		<div className="group lp-reveal flex items-center gap-6 border-neutral-800 border-b py-6 lg:gap-8" data-reveal="fade-in">
			<span className="font-bold font-display text-2xl tracking-tighter" style={{ color }}>{year}</span>
			<div className="h-3 w-3" style={{ backgroundColor: color, clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
			<div className="flex-1">
				<span className="font-bold font-display text-sm uppercase tracking-tight">{event}</span>
				<span className="ml-4 hidden font-light text-neutral-500 text-sm lg:inline">{detail}</span>
			</div>
		</div>
	);
}

/* ── PORTFOLIO COMPOSITION ──────────────────────── */
function PortfolioSection() {
	return (
		<SwissSection id="portfolio" tone="dark" leftTone="dark" rightTone="dark" title="PORTFOLIO" titleTone="dark">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<h2 className="lp-reveal mb-4 font-bold font-display text-4xl uppercase tracking-tighter lg:text-5xl" data-reveal="fade-up">
					Portfolio <span className="text-[#00D4AA]">Architecture</span>
				</h2>
				<p className="lp-reveal mb-16 max-w-xl font-light text-neutral-400 leading-relaxed" data-delay="1" data-reveal="fade-up">
					Deliberately structured across three complementary asset classes for balanced yield, duration, and risk.
				</p>
				<div className="lp-stagger grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
					<PortfolioCard allocation="50%" title="First Mortgages" description="Conservative first-lien bridge loans at sub-75% LTV. The stable core powering the lending fee flywheel." returnTarget="~9%" holdPeriod="Short-term" accent="#00D4AA" />
					<PortfolioCard allocation="30%" title="Multiplex Builds" description="Ground-up construction lending where our builder expertise provides an edge desk-only lenders cannot replicate." returnTarget="~14%" holdPeriod="8–14 months" accent="#FFB800" highlighted />
					<PortfolioCard allocation="20%" title="Second Mortgages" description="Carefully underwritten second-lien positions at sub-80% LTV. Higher yield with the same rigorous vetting." returnTarget="~12%" holdPeriod="Short-term" accent="#00D4AA" />
				</div>
			</div>
		</SwissSection>
	);
}

function PortfolioCard({ allocation, title, description, returnTarget, holdPeriod, accent, highlighted = false }: { allocation: string; title: string; description: string; returnTarget: string; holdPeriod: string; accent: string; highlighted?: boolean }) {
	return (
		<div className={`group lp-hover-raise lp-reveal relative overflow-hidden border bg-[#0A1628] p-6 transition-all lg:p-8 ${highlighted ? "border-[#FFB800]" : "border-neutral-800 hover:border-neutral-700"}`} data-reveal="fade-up">
			<div className="absolute top-0 left-0 h-1 w-full" style={{ backgroundColor: accent }} />
			<div className="mb-6 flex items-end justify-between">
				<span className="font-bold font-display text-4xl tracking-tighter lg:text-5xl" style={{ color: accent }}>{allocation}</span>
				<span className="font-mono text-[10px] text-neutral-600 uppercase">{holdPeriod}</span>
			</div>
			<h3 className="mb-3 font-bold font-display text-lg uppercase tracking-tight">{title}</h3>
			<p className="mb-6 font-light text-neutral-400 text-sm leading-relaxed">{description}</p>
			<div className="border-neutral-800 border-t pt-4">
				<span className="font-mono text-[10px] text-neutral-600 uppercase tracking-widest">Target</span>
				<div className="font-bold font-display text-xl tracking-tight" style={{ color: accent }}>{returnTarget}</div>
			</div>
		</div>
	);
}

/* ── THE BUILDS ────────────────────────────────── */
function BuildsSection() {
	return (
		<SwissSection tone="dark" leftTone="dark" rightTone="dark" title="BUILDS" titleTone="dark">
			<div className="grid min-h-[500px] grid-cols-1 lg:grid-cols-2">
				<div className="flex flex-col justify-center border-neutral-800 border-b p-8 lg:border-r lg:border-b-0 lg:p-20">
					<h2 className="lp-reveal mb-6 font-bold font-display text-3xl uppercase tracking-tighter lg:text-5xl" data-reveal="fade-up">
						Builder <span className="text-[#FFB800]">Meets</span> Lender
					</h2>
					<p className="lp-reveal font-light text-neutral-400 leading-relaxed lg:text-lg" data-delay="1" data-reveal="fade-up">
						Most lenders review blueprints from behind a desk. Our founder has personally constructed over 20 custom homes and managed 50+ renovation projects. He walks the site, assesses the builder, and catches the issues that paper-only lenders never see. This rare combination of instinct and discipline lets us find opportunities others miss.
					</p>
				</div>
				<div className="flex flex-col justify-center p-8 lg:p-16">
					<div className="lp-stagger space-y-6">
						<BuildDetail label="30-year contractor network" detail="Rapid intervention when builds need course correction" color="#00D4AA" />
						<BuildDetail label="Expert on-site monitoring" detail="Boots on the ground from foundation to finish" color="#FFB800" />
						<BuildDetail label="~14% target returns" detail="2–5% premium over standard private mortgage yields" color="#00D4AA" />
						<BuildDetail label="Trust but verify" detail="Every build tracked, every milestone confirmed in person" color="#FFB800" />
					</div>
				</div>
			</div>
		</SwissSection>
	);
}

function BuildDetail({ label, detail, color }: { label: string; detail: string; color: string }) {
	return (
		<div className="group lp-reveal flex items-center gap-6 border-neutral-800 border-b pb-4" data-reveal="fade-in">
			<div className="h-3 w-3 flex-shrink-0" style={{ backgroundColor: color, clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
			<div>
				<div className="font-bold font-display text-sm uppercase tracking-tight">{label}</div>
				<div className="font-light text-neutral-500 text-xs">{detail}</div>
			</div>
		</div>
	);
}

/* ── SIGNALS (TESTIMONIALS) ────────────────────── */
function SignalsSection() {
	return (
		<SwissSection tone="dark" leftTone="dark" rightTone="dark" title="SIGNALS" titleTone="dark">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<h2 className="lp-reveal mb-12 font-bold font-display text-3xl uppercase tracking-tighter lg:mb-16 lg:text-4xl" data-reveal="fade-up">Investor Signals</h2>
				<div className="lp-stagger grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
					<SigCard quote="The transparency is unmatched. I can see exactly where my capital is deployed." name="Michael R." role="RE Professional" accent="#00D4AA" />
					<SigCard quote="The spin model is brilliant. My money is constantly working." name="Sarah L." role="Financial Advisor" accent="#FFB800" />
					<SigCard quote="Engineering-first approach and deal-level visibility sets them apart." name="David T." role="Portfolio Manager" accent="#00D4AA" />
				</div>
			</div>
		</SwissSection>
	);
}

function SigCard({ quote, name, role, accent }: { quote: string; name: string; role: string; accent: string }) {
	return (
		<div className="group lp-reveal border border-neutral-800 bg-[#0A1628] p-6 transition-all hover:border-neutral-700 lg:p-8" data-reveal="fade-up">
			<div className="mb-4 h-1 w-12" style={{ backgroundColor: accent }} />
			<blockquote className="mb-6 font-light text-neutral-300 italic leading-relaxed">&ldquo;{quote}&rdquo;</blockquote>
			<div>
				<span className="font-bold font-display text-sm uppercase tracking-tight">{name}</span>
				<div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: accent }}>{role}</div>
			</div>
		</div>
	);
}

/* ── INTEL (FAQ) ───────────────────────────────── */
function IntelSection() {
	return (
		<SwissSection id="intel" tone="dark" leftTone="dark" rightTone="dark" title="INTEL" titleTone="dark">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<h2 className="lp-reveal mb-12 font-bold font-display text-4xl uppercase tracking-tighter lg:mb-16 lg:text-5xl" data-reveal="fade-up">Intel</h2>
				<div className="lp-stagger grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
					<IntelCard question="What is a MIC?" answer="Pools capital to fund mortgages. Flow-through entity — income passes directly to investors without corporate tax." accent="#00D4AA" />
					<IntelCard question="How does FairLend differ?" answer="Short-term fund, earn fees, sell, recycle. The 'spin' model maximizes capital efficiency versus traditional long-hold." accent="#FFB800" />
					<IntelCard question="Tax eligible?" answer="TFSA, RRSP, RESP, RRIF, RDSP, LIRA — all eligible. Highly tax-efficient." accent="#00D4AA" />
					<IntelCard question="Risk management?" answer="75% max LTV, double appraisals, AI + human vetting, 2-month max exposure, dedicated recovery team." accent="#FFB800" />
					<IntelCard question="Timeline?" answer="30-90 days from subscription. Cohort-based for optimal capital deployment." accent="#00D4AA" />
					<IntelCard question="Redemption?" answer="1-year minimum. Quarterly after that, 60 days notice, subject to liquidity." accent="#FFB800" />
				</div>
			</div>
		</SwissSection>
	);
}

function IntelCard({ question, answer, accent }: { question: string; answer: string; accent: string }) {
	return (
		<div className="group lp-reveal border border-neutral-800 p-6 transition-all hover:border-neutral-700 lg:p-8" data-reveal="fade-up">
			<h3 className="mb-3 flex items-start gap-3 font-bold font-display text-lg uppercase tracking-tight">
				<ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 transition-transform group-hover:translate-x-1" style={{ color: accent }} />
				{question}
			</h3>
			<p className="pl-8 font-light text-neutral-400 text-sm leading-relaxed">{answer}</p>
		</div>
	);
}

/* ── DEPLOY CTA ────────────────────────────────── */
function DeployCTA() {
	return (
		<SwissSection id="cta" tone="dark" leftTone="dark" rightTone="dark" title="NEXT" titleTone="dark">
			<div className="relative flex min-h-[500px] flex-col items-center justify-center px-8 py-16 text-center lg:py-24">
				<div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 40px, #00D4AA 40px, #00D4AA 41px), repeating-linear-gradient(-45deg, transparent, transparent 40px, #FFB800 40px, #FFB800 41px)" }} />
				<Rocket className="lp-reveal relative z-10 mb-8 h-10 w-10 text-[#00D4AA] lg:h-12 lg:w-12" data-reveal="scale-in" />
				<h2 className="lp-reveal relative z-10 mb-4 font-bold font-display text-4xl uppercase tracking-tighter lg:text-6xl" data-delay="1" data-reveal="fade-up">
					See the Full <span className="text-[#00D4AA]">Picture</span>
				</h2>
				<p className="lp-reveal relative z-10 mb-8 max-w-xl font-light text-neutral-400 leading-relaxed lg:mb-12 lg:text-lg" data-delay="2" data-reveal="fade-up">
					Numbers tell part of the story. A thirty-minute presentation covers the rest — the team, the deals, and the discipline behind every dollar deployed.
				</p>
				<div className="lp-reveal relative z-10 flex flex-col gap-4 sm:flex-row" data-delay="3" data-reveal="fade-up">
					<a className="lp-cta lp-hover-raise inline-flex cursor-pointer items-center gap-2 bg-[#00D4AA] px-8 py-4 font-bold text-[11px] text-[#0A1628] uppercase tracking-widest transition-all hover:bg-[#FFB800]" href="#book">
						Book a Presentation <ArrowRight className="h-4 w-4" />
					</a>
					<a className="lp-hover-raise inline-flex cursor-pointer items-center gap-2 border border-neutral-700 px-8 py-4 font-bold text-[11px] uppercase tracking-widest transition-all hover:border-[#00D4AA] hover:text-[#00D4AA]" href="#prospectus">
						View Prospectus <ArrowUpRight className="h-4 w-4" />
					</a>
				</div>
				<p className="lp-reveal relative z-10 mt-8 font-mono text-[10px] text-neutral-600" data-delay="4" data-reveal="fade-in">
					FSRA regulated &middot; OSC compliant &middot; TFSA / RRSP / RESP eligible
				</p>
			</div>
		</SwissSection>
	);
}

/* ── FOOTER ────────────────────────────────────── */
function GeoFooter() {
	return (
		<>
			<SwissSection leftTone="dark" rightTone="dark" tone="dark">
				<div className="px-8 py-12 lg:px-16 lg:py-16">
					<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
						<div>
							<div className="mb-6 flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center bg-[#00D4AA]" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
									<BarChart3 className="h-5 w-5 text-[#0A1628]" />
								</div>
								<span className="font-bold font-display text-xl tracking-tight">FAIRLEND</span>
							</div>
							<p className="font-light text-neutral-500 text-sm leading-relaxed">Capital deployment engine for the modern investor.</p>
						</div>
						<div>
							<h4 className="mb-6 font-bold text-[11px] text-neutral-400 uppercase tracking-[0.3em]">Navigate</h4>
							<ul className="space-y-3">
								<GeoFooterLink href="#engine" label="The Engine" color="#00D4AA" />
								<GeoFooterLink href="#protection" label="Protection" color="#FFB800" />
								<GeoFooterLink href="#portfolio" label="Portfolio" color="#00D4AA" />
								<GeoFooterLink href="#intel" label="Intel" color="#FFB800" />
							</ul>
						</div>
						<div>
							<h4 className="mb-6 font-bold text-[11px] text-neutral-400 uppercase tracking-[0.3em]">Legal</h4>
							<ul className="space-y-3">
								<GeoFooterLink href="#" label="Offering Memorandum" color="#00D4AA" />
								<GeoFooterLink href="#" label="Privacy" color="#00D4AA" />
								<GeoFooterLink href="#" label="Terms" color="#00D4AA" />
							</ul>
						</div>
						<div>
							<h4 className="mb-6 font-bold text-[11px] text-neutral-400 uppercase tracking-[0.3em]">Connect</h4>
							<ul className="space-y-4">
								<li className="flex items-start gap-3 text-neutral-500 text-sm"><Mail className="mt-0.5 h-4 w-4 text-[#00D4AA]" /> invest@fairlend.ca</li>
								<li className="flex items-start gap-3 text-neutral-500 text-sm"><MapPin className="mt-0.5 h-4 w-4 text-[#FFB800]" /> Toronto, Ontario</li>
							</ul>
						</div>
					</div>
					<div className="mt-12 flex flex-col items-center justify-between gap-4 border-neutral-800 border-t pt-8 md:flex-row">
						<p className="font-mono text-[10px] text-neutral-600">&copy; 2024 FairLend MIC</p>
						<div className="flex items-center gap-4 font-mono text-[10px] text-neutral-600">
							<span>FSRA</span>
							<div className="h-2 w-2 bg-[#00D4AA]" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
							<span>OSC</span>
						</div>
					</div>
				</div>
			</SwissSection>
			<footer className="section-grid h-16 border-neutral-800 bg-[#0A1628] text-white lg:h-20">
				<div className="margin-col border-neutral-800 border-r" />
				<div className="flex h-full flex-1 items-center justify-between px-6 lg:px-12">
					<span className="font-mono text-[10px] text-neutral-600 uppercase tracking-widest">Engineered for Alpha</span>
					<ScrollToTop />
				</div>
				<div className="margin-col border-neutral-800 border-l" />
			</footer>
		</>
	);
}

function GeoFooterLink({ href, label, color }: { href: string; label: string; color: string }) {
	return (
		<li><a className="group flex cursor-pointer items-center gap-2 text-neutral-500 text-sm transition-colors hover:text-white" href={href}>
			<ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" style={{ color }} /> {label}
		</a></li>
	);
}

function GeoProtocolItem({ label }: { label: string }) {
	return (
		<div className="group lp-reveal flex items-center space-x-3 border-white/10 border-b pb-2 lg:space-x-4" data-reveal="fade-up">
			<ArrowRight className="lp-icon-nudge h-4 w-4 text-[#00D4AA]" />
			<span className="font-bold text-xs uppercase tracking-widest">{label}</span>
		</div>
	);
}

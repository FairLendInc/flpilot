import {
	ArrowRight,
	ArrowUpRight,
	BarChart3,
	BookOpen,
	Building2,
	ChevronRight,
	Cpu,
	HardHat,
	Landmark,
	LineChart,
	Lock,
	Mail,
	MapPin,
	Menu,
	Scale,
	Shield,
	ShieldCheck,
	Target,
	TrendingUp,
	Users,
	Wallet,
} from "lucide-react";
import { ScrollReveal } from "../components/scroll-reveal";
import { ScrollToTop } from "../components/scroll-to-top";
import { SwissSection } from "../components/swiss-section";

/* ─────────────────────────────────────────────────
   VARIANT 1: EDITORIAL / MAGAZINE
   Think Bloomberg Businessweek meets Kinfolk.
   Serif-dominant, pull-quotes, chapter numbers,
   asymmetric columns, intellectual authority.
   ───────────────────────────────────────────────── */

export default function ClaudeLp1() {
	return (
		<div className="relative z-10 flex min-h-screen w-full flex-col">
			<ScrollReveal />
			<EditorialHeader />
			<div className="flex w-full flex-col">
				{/* HERO IS UNTOUCHED — rendered by parent layout or kept as-is */}
				<HeroSection />
				<TableOfContents />
				<TrustBanner />
				<ThesisSection />
				<ProtectionSection />
				<FlywheelSection />
				<PortfolioSection />
				<BuildsSection />
				<TeamSection />
				<TestimonialsSection />
				<FAQSection />
				<CTASection />
			</div>
			<EditorialFooter />
		</div>
	);
}

/* ── HEADER ────────────────────────────────────── */
function EditorialHeader() {
	return (
		<header className="swiss-border sticky top-0 z-50 flex h-14 w-full items-center border-b bg-white/95 backdrop-blur-sm">
			<div className="swiss-border flex h-full w-16 flex-shrink-0 items-center justify-center border-r bg-white">
				<div className="flex h-8 w-8 items-center justify-center bg-black">
					<BarChart3 className="h-4 w-4 text-white" />
				</div>
			</div>
			<div className="flex h-full flex-1 items-center justify-between bg-white px-6 lg:px-12">
				<div className="hidden items-center gap-2 xl:flex">
					<span className="font-serif text-lg italic tracking-tight">FairLend</span>
					<span className="font-bold text-[10px] text-neutral-400 uppercase tracking-[0.3em]">MIC Quarterly</span>
				</div>
				<nav className="hidden space-x-8 font-bold text-[11px] uppercase tracking-[0.3em] xl:flex">
					<a className="lp-underline cursor-pointer transition-colors hover:text-primary" href="#thesis">The Thesis</a>
					<a className="lp-underline cursor-pointer transition-colors hover:text-primary" href="#protection">Protection</a>
					<a className="lp-underline cursor-pointer transition-colors hover:text-primary" href="#tiers">Investment</a>
					<a className="lp-underline cursor-pointer transition-colors hover:text-primary" href="#faq">FAQ</a>
				</nav>
				<a className="lp-cta lp-hover-raise cursor-pointer bg-primary px-6 py-3 font-bold text-[11px] text-white uppercase tracking-widest transition-all hover:bg-neutral-900 lg:px-8" href="#waitlist">
					Book a Presentation
				</a>
			</div>
			<div className="swiss-border flex h-full w-16 flex-shrink-0 cursor-pointer items-center justify-center border-l bg-white transition-colors hover:bg-neutral-50">
				<Menu className="h-5 w-5 text-neutral-900" />
			</div>
		</header>
	);
}

/* ── HERO (UNTOUCHED — identical to original) ── */
function HeroSection() {
	return (
		<section className="section-grid min-h-[calc(100vh-16rem)] bg-white" id="how-it-works">
			<div className="margin-col swiss-border border-r">
				<div className="h-full w-px bg-neutral-100" />
			</div>
			<div className="grid w-full grid-cols-1 lg:grid-cols-12">
				<div className="swiss-border col-span-12 flex flex-col border-b lg:col-span-5 lg:border-r lg:border-b-0">
					<div className="flex flex-grow flex-col justify-between px-8 pt-12 pb-8 lg:px-12 lg:pt-16 lg:pb-12">
						<div>
							<div className="lp-reveal mb-12 flex items-center space-x-4 lg:mb-20" data-delay="1" data-reveal="fade-up">
								<span className="h-[2px] w-12 bg-primary" />
								<span className="font-bold text-[12px] text-neutral-500 uppercase tracking-[0.4em]">FairLend MIC</span>
							</div>
							<div className="mb-12 lg:mb-16">
								<h1 className="lp-reveal -ml-1 mb-4 font-black font-display text-[56px] uppercase leading-[0.85] tracking-tighter md:text-[70px] lg:text-[90px] xl:text-[110px]" data-delay="2" data-reveal="fade-up">FairLend</h1>
								<div className="lp-reveal -mt-2 md:-mt-4 mb-8 font-serif text-5xl text-primary lowercase italic tracking-tight md:mb-12 md:text-6xl lg:text-7xl xl:text-8xl" data-delay="3" data-reveal="fade-up">mic</div>
								<div className="w-full max-w-[400px]">
									<p className="lp-reveal text-justify font-light text-[15px] text-neutral-600 leading-[1.6] md:text-[16px]" data-delay="4" data-reveal="fade-up">
										The FairLend MIC is a pooled vehicle that provides short-term funding for private, interest-only mortgages. Instead of holding mortgages for years, the MIC funds them for a few days, earns fees and interest, then sells them to long-term buyers on the FairLend marketplace.
									</p>
								</div>
							</div>
						</div>
						<div className="lp-reveal flex flex-wrap gap-4" data-delay="5" data-reveal="fade-in">
							<a className="lp-cta lp-hover-raise inline-flex cursor-pointer items-center gap-2 bg-primary px-6 py-3 font-bold text-[11px] text-white uppercase tracking-widest transition-all hover:bg-neutral-900" href="#waitlist">
								Get Started <ArrowRight className="h-4 w-4" />
							</a>
							<a className="lp-hover-raise inline-flex cursor-pointer items-center gap-2 border border-neutral-200 bg-white px-6 py-3 font-bold text-[11px] uppercase tracking-widest transition-all hover:border-primary hover:text-primary" href="#thesis">
								Learn More
							</a>
						</div>
					</div>
					<div className="swiss-border group lp-reveal relative h-[280px] overflow-hidden border-t lg:h-[300px]" data-delay="2" data-reveal="fade-in">
						<div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-center bg-cover opacity-20 contrast-125 grayscale transition-opacity duration-700 group-hover:opacity-30" />
						<div className="relative z-10 flex h-full flex-col justify-between p-8 lg:p-12">
							<div>
								<h3 className="stat-label text-neutral-500">The Spin Model</h3>
								<div className="mt-4 h-[2px] w-12 bg-primary" />
							</div>
							<div>
								<p className="mb-2 font-bold font-display text-2xl uppercase leading-none tracking-tight lg:text-3xl">Short-Term Lender</p>
								<p className="font-serif text-neutral-600 text-xl italic lg:text-2xl">Long-Term Buyers</p>
							</div>
							<div className="absolute right-8 bottom-8 lg:right-12 lg:bottom-12">
								<Cpu className="lp-soft-float h-8 w-8 text-neutral-900 opacity-20 lg:h-10 lg:w-10" />
							</div>
						</div>
					</div>
				</div>
				<div className="col-span-12 flex flex-col lg:col-span-7">
					<div className="swiss-border lp-stagger grid h-32 grid-cols-3 border-b lg:h-40">
						<div className="swiss-border group lp-reveal flex cursor-pointer items-center justify-center border-r transition-colors hover:bg-neutral-50" data-delay="1" data-reveal="fade-in">
							<span className="box-type text-2xl transition-colors group-hover:text-primary lg:text-3xl xl:text-4xl">TFSA</span>
						</div>
						<div className="swiss-border group lp-reveal flex cursor-pointer items-center justify-center border-r transition-colors hover:bg-neutral-50" data-delay="2" data-reveal="fade-in">
							<span className="box-type text-2xl transition-colors group-hover:text-primary lg:text-3xl xl:text-4xl">RRSP</span>
						</div>
						<div className="group lp-reveal flex cursor-pointer items-center justify-center transition-colors hover:bg-neutral-50" data-delay="3" data-reveal="fade-in">
							<span className="box-type text-2xl transition-colors group-hover:text-primary lg:text-3xl xl:text-4xl">RESP</span>
						</div>
					</div>
					<div className="swiss-border lp-stagger grid flex-grow grid-cols-1 border-b md:grid-cols-2">
						<div className="swiss-border group lp-hover-raise lp-reveal flex flex-col justify-between border-b p-8 transition-colors hover:bg-neutral-50 md:border-r md:border-b-0 lg:p-12" data-reveal="fade-up">
							<div className="flex items-start justify-between">
								<h4 className="stat-label">LTV</h4>
								<TrendingUp className="h-5 w-5 text-neutral-300 transition-colors group-hover:text-primary" />
							</div>
							<div>
								<div className="stat-value text-4xl md:text-5xl lg:text-6xl xl:text-7xl">75<span className="ml-1 align-top font-sans text-xl md:text-2xl">%</span></div>
								<p className="mt-4 font-mono text-[10px] text-neutral-400 uppercase tracking-tighter">Max loan-to-value</p>
							</div>
						</div>
						<div className="group lp-hover-raise lp-reveal flex flex-col justify-between p-8 transition-colors hover:bg-neutral-50 lg:p-12" data-reveal="fade-up">
							<div className="flex items-start justify-between">
								<h4 className="stat-label">Lending Fee</h4>
								<Landmark className="h-5 w-5 text-neutral-300 transition-colors group-hover:text-primary" />
							</div>
							<div>
								<div className="stat-value text-4xl md:text-5xl lg:text-6xl xl:text-7xl">1<span className="ml-1 align-top font-sans text-xl md:text-2xl">%</span></div>
								<p className="mt-4 font-mono text-[10px] text-neutral-400 uppercase tracking-tighter">Lending Fee on Origination</p>
							</div>
						</div>
					</div>
					<div className="lp-reveal relative flex h-[280px] flex-col justify-between overflow-hidden bg-security-green p-8 text-white lg:h-[300px] lg:p-12" data-delay="2" data-reveal="scale-in">
						<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] opacity-10" />
						<div className="relative z-10 flex items-start justify-between">
							<div>
								<h4 className="mb-6 font-bold text-[11px] text-white/50 uppercase tracking-[0.4em] lg:mb-8">MIC Visibility</h4>
								<h3 className="mb-2 font-bold font-display text-2xl tracking-tight lg:text-3xl">Deal-Level Transparency</h3>
								<p className="font-serif text-lg text-primary italic lg:text-xl">Built for serious investors</p>
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

/* ── TABLE OF CONTENTS ─────────────────────────── */
function TableOfContents() {
	return (
		<SwissSection tone="sand" leftTone="sand" rightTone="sand" title="CONTENTS">
			<div className="px-8 py-12 lg:px-16 lg:py-16">
				<div className="lp-stagger grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-3">
					<TOCItem chapter="I" href="#thesis" title="The Thesis" subtitle="Why harder work, not riskier bets" />
					<TOCItem chapter="II" href="#protection" title="Capital Protection" subtitle="Six structural layers of defense" />
					<TOCItem chapter="III" href="#flywheel" title="The Flywheel" subtitle="How capital recycles for returns" />
					<TOCItem chapter="IV" href="#portfolio" title="The Portfolio" subtitle="Multiplex builds + private mortgages" />
					<TOCItem chapter="V" href="#builds" title="The Builds" subtitle="Builder meets lender, a rare edge" />
					<TOCItem chapter="VI" href="#team" title="The Principals" subtitle="30 years of compounded expertise" />
					<TOCItem chapter="VII" href="#faq" title="Investor FAQ" subtitle="What you need to know" />
				</div>
			</div>
		</SwissSection>
	);
}

function TOCItem({ chapter, title, subtitle, href }: { chapter: string; title: string; subtitle: string; href: string }) {
	return (
		<a className="group lp-reveal flex cursor-pointer items-start gap-6 border-neutral-300 border-b p-6 transition-colors hover:bg-white lg:p-8" href={href} data-reveal="fade-in">
			<span className="font-serif text-3xl text-neutral-300 italic transition-colors group-hover:text-primary lg:text-4xl">{chapter}</span>
			<div>
				<h3 className="mb-1 font-bold font-display text-lg uppercase tracking-tight transition-colors group-hover:text-primary">{title}</h3>
				<p className="font-serif text-neutral-500 text-sm italic">{subtitle}</p>
			</div>
			<ArrowRight className="lp-icon-nudge ml-auto mt-2 h-4 w-4 text-neutral-300 transition-colors group-hover:text-primary" />
		</a>
	);
}

/* ── TRUST BANNER ──────────────────────────────── */
function TrustBanner() {
	return (
		<SwissSection tone="light">
			<div className="flex flex-col items-center justify-center py-12 lg:py-16">
				<p className="lp-reveal mb-8 font-serif text-sm text-neutral-400 italic" data-reveal="fade-up">Trusted by Canadians Coast to Coast</p>
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
			<span className="mb-2 font-bold font-display text-2xl tracking-tight lg:text-3xl">{value}</span>
			<span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider">{label}</span>
		</div>
	);
}

/* ── I. THE THESIS ─────────────────────────────── */
function ThesisSection() {
	return (
		<SwissSection id="thesis" tone="light" title="I / THE THESIS" leftTone="light" rightTone="light">
			<div className="grid min-h-[700px] grid-cols-1 lg:grid-cols-2">
				<div className="flex flex-col justify-center p-8 lg:p-20">
					<div className="lp-reveal mb-4 font-serif text-[10px] text-neutral-400 uppercase tracking-[0.4em]" data-reveal="fade-up">Chapter I</div>
					<h2 className="lp-reveal mb-8 font-bold font-display text-4xl uppercase tracking-tighter lg:text-6xl" data-delay="1" data-reveal="fade-up">
						Higher Alpha Through<br />
						<span className="font-serif text-primary italic normal-case">Harder Work</span>
					</h2>
					<p className="lp-reveal max-w-lg font-light text-neutral-600 leading-[1.8] lg:text-lg" data-delay="2" data-reveal="fade-up">
						FairLend delivers market-beating returns not through financial engineering or aggressive risk-taking, but through a relentless, multi-layered approach to extracting value at every stage of the lending cycle. It&apos;s not black magic — it&apos;s transparent, auditable, and built on nearly three decades of compounding expertise.
					</p>
				</div>

				<div className="swiss-border flex flex-col justify-center border-t bg-[#FAFAF7] p-8 lg:border-t-0 lg:border-l lg:p-20">
					{/* Editorial Pull Quote */}
					<div className="lp-reveal relative" data-delay="2" data-reveal="fade-up">
						<span className="absolute -top-8 -left-4 font-serif text-[120px] text-neutral-200 leading-none lg:-top-12 lg:-left-8 lg:text-[180px]">&ldquo;</span>
						<blockquote className="relative z-10 mb-8 font-serif text-2xl text-neutral-800 italic leading-relaxed lg:text-3xl">
							I turn down 9 out of 10 deals that cross my desk. This isn&apos;t lost revenue — it&apos;s investor protection built into the DNA.
						</blockquote>
						<div className="flex items-center gap-4">
							<div className="h-px w-12 bg-primary" />
							<div>
								<div className="font-bold font-display text-sm uppercase tracking-wider">Elie Soberano</div>
								<div className="font-serif text-neutral-500 text-xs italic">Founder, FairLend MIC</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Three Engines Sub-section */}
			<div className="swiss-border border-t">
				<div className="px-8 py-12 lg:px-20 lg:py-16">
					<h3 className="lp-reveal mb-12 font-serif text-xl text-neutral-400 italic lg:mb-16 lg:text-2xl" data-reveal="fade-up">The Three Engines of Alpha</h3>
					<div className="lp-stagger grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
						<EngineCard
							number="01"
							title="Extreme Vetting"
							description="90% rejection rate. Double appraisals. Expert human underwriters with conservative LTV policies empowered by AI fraud detection."
							icon={<Shield className="h-5 w-5" />}
						/>
						<EngineCard
							number="02"
							title="The Flywheel"
							description="1% lending fee per origination. 2-month max hold. Capital recycles continuously, earning multiple fee cycles per year."
							icon={<Target className="h-5 w-5" />}
						/>
						<EngineCard
							number="03"
							title="Tech + Relationships"
							description="Ex-RBC quant team automates operations. 30-year distribution network ensures capital moves faster than any competitor."
							icon={<Cpu className="h-5 w-5" />}
						/>
					</div>
				</div>
			</div>
		</SwissSection>
	);
}

function EngineCard({ number, title, description, icon }: { number: string; title: string; description: string; icon: React.ReactNode }) {
	return (
		<div className="group lp-hover-raise lp-reveal border border-neutral-200 bg-white p-6 transition-all hover:border-primary lg:p-8" data-reveal="fade-up">
			<div className="mb-6 flex items-center justify-between">
				<div className="text-neutral-400 transition-colors group-hover:text-primary">{icon}</div>
				<span className="font-mono text-[10px] text-neutral-300">{number}</span>
			</div>
			<h4 className="mb-3 font-bold font-display text-xl uppercase tracking-tight">{title}</h4>
			<p className="font-light text-neutral-600 text-sm leading-relaxed">{description}</p>
		</div>
	);
}

/* ── II. PROTECTION ────────────────────────────── */
function ProtectionSection() {
	return (
		<SwissSection id="protection" tone="dark" leftTone="dark" rightTone="dark" title="II / PROTECTION" titleTone="dark">
			<div className="px-8 py-16 lg:px-20 lg:py-24">
				<div className="mb-4 font-serif text-[10px] text-neutral-500 uppercase tracking-[0.4em]">Chapter II</div>
				<h2 className="lp-reveal mb-4 font-bold font-display text-4xl uppercase tracking-tighter lg:text-6xl" data-reveal="fade-up">
					Six Layers of<br />
					<span className="font-serif text-primary italic normal-case">Capital Protection</span>
				</h2>
				<p className="lp-reveal mb-16 max-w-xl font-light text-neutral-400 leading-relaxed lg:text-lg" data-delay="1" data-reveal="fade-up">
					FairLend&apos;s portfolio is engineered for downside protection at every level. The strongest form of capital preservation is never making a bad loan.
				</p>
				<div className="lp-stagger grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
					<LayerCard number="01" title="Extreme Deal Selection" description="90% of deals are declined before a single dollar is deployed." />
					<LayerCard number="02" title="Conservative LTV" description="Maximum 75% on first mortgages, 80% on seconds. Substantial equity cushion." />
					<LayerCard number="03" title="Double Appraisal" description="Two independent third-party appraisals eliminate inflated valuations." />
					<LayerCard number="04" title="AI + Human Vetting" description="ML fraud detection, income verification, credit analysis, and background checks." />
					<LayerCard number="05" title="Short Exposure" description="Most positions held max 2 months via the Flywheel. Less time = less risk." />
					<LayerCard number="06" title="Power of Sale + Recovery" description="All investments include power of sale. Dedicated legal team with proven playbook." />
				</div>
			</div>
		</SwissSection>
	);
}

function LayerCard({ number, title, description }: { number: string; title: string; description: string }) {
	return (
		<div className="group lp-hover-raise lp-reveal border border-neutral-700 bg-neutral-800/50 p-6 transition-all hover:border-primary lg:p-8" data-reveal="fade-up">
			<div className="mb-6 flex items-center justify-between">
				<span className="font-mono text-[10px] text-primary">{number}</span>
				<Lock className="h-4 w-4 text-neutral-600 transition-colors group-hover:text-primary" />
			</div>
			<h4 className="mb-3 font-bold font-display text-lg uppercase tracking-tight">{title}</h4>
			<p className="font-light text-neutral-400 text-sm leading-relaxed">{description}</p>
		</div>
	);
}

/* ── III. THE FLYWHEEL ─────────────────────────── */
function FlywheelSection() {
	return (
		<SwissSection id="flywheel" tone="light" leftTone="light" rightTone="light" title="III / FLYWHEEL">
			<div className="grid min-h-[600px] grid-cols-1 lg:grid-cols-2">
				<div className="swiss-border flex flex-col justify-center border-b p-8 lg:border-r lg:border-b-0 lg:p-20">
					<div className="lp-reveal mb-4 font-serif text-[10px] text-neutral-400 uppercase tracking-[0.4em]" data-reveal="fade-up">Chapter III</div>
					<h2 className="lp-reveal mb-8 font-bold font-display text-4xl uppercase tracking-tighter lg:text-6xl" data-delay="1" data-reveal="fade-up">
						The Private<br />Mortgage<br />
						<span className="font-serif text-primary italic normal-case">Flywheel</span>
					</h2>
					<p className="lp-reveal max-w-md font-light text-neutral-600 leading-[1.8] lg:text-lg" data-delay="2" data-reveal="fade-up">
						FairLend&apos;s proprietary capital recycling mechanism compounds returns without compounding risk. Multiple fee-earning cycles per year on the same dollar of invested capital.
					</p>
				</div>
				<div className="flex flex-col justify-center bg-[#FAFAF7] p-8 lg:p-20">
					<div className="lp-stagger space-y-8">
						<FlywheelStep number="01" title="Originate" detail="MIC earns 1% lending fee on every mortgage origination" />
						<FlywheelStep number="02" title="Hold" detail="Mortgage held max 2 months — accruing daily interest" />
						<FlywheelStep number="03" title="Sell" detail="Distributed to long-term buyers via 30-year network" />
						<FlywheelStep number="04" title="Recycle" detail="Capital immediately redeployed — another 1% fee earned" />
					</div>
					<div className="lp-reveal mt-12 border-neutral-300 border-t pt-8" data-delay="3" data-reveal="fade-in">
						<div className="flex items-end gap-4">
							<span className="font-bold font-display text-5xl text-green-600 tracking-tighter lg:text-7xl">9.25</span>
							<div className="mb-2">
								<span className="font-bold font-display text-green-600 text-xl">%+</span>
								<div className="font-mono text-[10px] text-neutral-400 uppercase">Target Return</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</SwissSection>
	);
}

function FlywheelStep({ number, title, detail }: { number: string; title: string; detail: string }) {
	return (
		<div className="group lp-reveal flex items-start gap-6" data-reveal="fade-up">
			<span className="font-serif text-2xl text-neutral-300 italic">{number}</span>
			<div className="border-neutral-200 border-b pb-6">
				<h4 className="mb-2 font-bold font-display text-lg uppercase tracking-tight">{title}</h4>
				<p className="font-light text-neutral-600 text-sm leading-relaxed">{detail}</p>
			</div>
		</div>
	);
}

/* ── IV. THE PORTFOLIO ──────────────────────────── */
function PortfolioSection() {
	return (
		<SwissSection id="portfolio" tone="sand" leftTone="sand" rightTone="sand" title="IV / PORTFOLIO">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<div className="mb-4 font-serif text-[10px] text-neutral-400 uppercase tracking-[0.4em]">Chapter IV</div>
				<h2 className="lp-reveal mb-4 font-bold font-display text-4xl uppercase tracking-tighter lg:text-6xl" data-reveal="fade-up">
					Portfolio <span className="font-serif text-primary italic normal-case">Architecture</span>
				</h2>
				<p className="lp-reveal mb-16 max-w-xl font-light text-neutral-600 leading-relaxed lg:text-lg" data-delay="1" data-reveal="fade-up">
					A deliberately structured mix of short-term private mortgages and multiplex construction lending — each component chosen for its risk-adjusted return profile.
				</p>
				<div className="lp-stagger grid grid-cols-1 gap-8 lg:grid-cols-3">
					<PortfolioCard
						allocation="50%"
						title="First Mortgages"
						description="Conservative first-lien bridge loans at sub-75% loan-to-value. Short-duration positions that form the stable core of the portfolio and power the lending fee flywheel."
						returnTarget="~9%"
						holdPeriod="Short-term"
					/>
					<PortfolioCard
						allocation="30%"
						title="Multiplex Builds"
						description="Ground-up multiplex construction lending where our founder's hands-on building experience gives us an edge others can't replicate. Boots on the ground from foundation to finish."
						returnTarget="~14%"
						holdPeriod="8–14 months"
						highlighted
					/>
					<PortfolioCard
						allocation="20%"
						title="Second Mortgages"
						description="Carefully underwritten second-lien positions at sub-80% LTV. Higher yield compensates for position in the capital stack, with the same rigorous vetting applied to every deal."
						returnTarget="~12%"
						holdPeriod="Short-term"
					/>
				</div>
			</div>
		</SwissSection>
	);
}

function PortfolioCard({ allocation, title, description, returnTarget, holdPeriod, highlighted = false }: { allocation: string; title: string; description: string; returnTarget: string; holdPeriod: string; highlighted?: boolean }) {
	return (
		<div className={`group lp-hover-raise lp-reveal relative border bg-white p-6 transition-all lg:p-8 ${highlighted ? "border-primary" : "border-neutral-300 hover:border-primary"}`} data-reveal="fade-up">
			<div className="mb-6 flex items-end justify-between">
				<span className="font-bold font-display text-5xl text-primary tracking-tighter lg:text-6xl">{allocation}</span>
				<span className="font-mono text-[10px] text-neutral-400 uppercase">{holdPeriod}</span>
			</div>
			<h3 className="mb-3 font-bold font-display text-xl uppercase tracking-tight">{title}</h3>
			<p className="mb-6 font-light text-neutral-600 text-sm leading-relaxed">{description}</p>
			<div className="border-neutral-200 border-t pt-4">
				<span className="font-bold text-[10px] text-neutral-400 uppercase tracking-widest">Target Return</span>
				<div className="font-bold font-display text-2xl text-green-600 tracking-tight">{returnTarget}</div>
			</div>
		</div>
	);
}

/* ── V. THE BUILDS ─────────────────────────────── */
function BuildsSection() {
	return (
		<SwissSection id="builds" tone="green" leftTone="green" rightTone="green" title="V / THE BUILDS" titleTone="inverse">
			<div className="grid min-h-[600px] grid-cols-1 lg:grid-cols-2">
				<div className="flex flex-col justify-center border-white/10 border-b p-8 lg:border-r lg:border-b-0 lg:p-20">
					<div className="mb-4 font-serif text-[10px] text-white/40 uppercase tracking-[0.4em]">Chapter V</div>
					<h2 className="lp-reveal mb-8 font-bold font-display text-4xl uppercase tracking-tighter lg:text-6xl" data-reveal="fade-up">
						Builder Meets<br /><span className="font-serif text-primary italic normal-case">Lender</span>
					</h2>
					<p className="lp-reveal max-w-md font-light text-white/70 leading-[1.8] lg:text-lg" data-delay="1" data-reveal="fade-up">
						Most lenders review blueprints from a desk. Our founder has personally built over 20 custom homes and managed more than 50 renovation projects. He walks construction sites and catches problems that paper-only lenders never see — a rare combination of builder instinct and lending discipline that lets our team find winners others miss and avoid losers that look good on paper.
					</p>
				</div>
				<div className="flex flex-col justify-center p-8 lg:p-20">
					{/* Editorial Pull Quote */}
					<div className="lp-reveal relative mb-12" data-delay="2" data-reveal="fade-up">
						<span className="absolute -top-8 -left-4 font-serif text-[100px] text-white/10 leading-none lg:-top-10 lg:-left-6 lg:text-[140px]">&ldquo;</span>
						<blockquote className="relative z-10 font-serif text-xl text-white/90 italic leading-relaxed lg:text-2xl">
							We live by one motto: trust but verify. And we verify everything. Boots on the ground for every build — making sure everything is transparent and on track.
						</blockquote>
					</div>
					<div className="lp-stagger space-y-4">
						<BuildFeature label="30-year contractor and trades network for rapid intervention" />
						<BuildFeature label="Expert on-site monitoring from foundation to finish" />
						<BuildFeature label="Multiplex builds returning approximately 14% annually" />
						<BuildFeature label="Ability to step in with the right people when builds go sideways" />
					</div>
				</div>
			</div>
		</SwissSection>
	);
}

function BuildFeature({ label }: { label: string }) {
	return (
		<div className="group lp-reveal flex items-center gap-3 border-white/10 border-b pb-3" data-reveal="fade-in">
			<HardHat className="h-4 w-4 flex-shrink-0 text-primary" />
			<span className="font-light text-white/80 text-sm">{label}</span>
		</div>
	);
}

/* ── V. THE TEAM ───────────────────────────────── */
function TeamSection() {
	return (
		<SwissSection id="team" tone="dark" leftTone="dark" rightTone="dark" title="VI / PRINCIPALS" titleTone="dark">
			<div className="px-8 py-16 lg:px-20 lg:py-24">
				<div className="mb-4 font-serif text-[10px] text-neutral-500 uppercase tracking-[0.4em]">Chapter VI</div>
				<h2 className="lp-reveal mb-4 font-bold font-display text-4xl uppercase tracking-tighter lg:text-6xl" data-reveal="fade-up">
					Built on<br /><span className="font-serif text-primary italic normal-case">Real Experience</span>
				</h2>
				<p className="lp-reveal mb-16 max-w-xl font-light text-white/60 leading-relaxed lg:text-lg" data-delay="1" data-reveal="fade-up">
					Three rare expertise domains that almost never exist under one roof: deep mortgage lending, hands-on construction, and precision operations management.
				</p>
				<div className="lp-stagger grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
					<TeamCard
						name="Elie Soberano"
						role="Founder"
						details={["Top 1% mortgage broker in Canada", "$2B+ in deals over 30-year career", "Scotiabank retains at $2,000/hour", "Built 20+ custom homes personally"]}
					/>
					<TeamCard
						name="Fintech Division"
						role="Engineering"
						details={["Ex-RBC Capital Markets quant analysts", "AI/ML fraud detection & scoring", "Real-time portfolio monitoring", "Institutional-grade technology"]}
					/>
					<TeamCard
						name="Operations Team"
						role="Business Operations"
						details={["Founders of Barton Engineering", "JIT supply chain for Ford", "Zero tolerance for delays", "Manufacturing-grade discipline"]}
					/>
					<TeamCard
						name="Legal Division"
						role="Default Response"
						details={["Specialized mortgage recovery", "Power of sale proceedings", "Receivership strategy", "100% recovery track record"]}
					/>
				</div>
			</div>
		</SwissSection>
	);
}

function TeamCard({ name, role, details }: { name: string; role: string; details: string[] }) {
	return (
		<div className="group lp-hover-raise lp-reveal border border-white/10 bg-white/5 p-6 transition-all hover:border-primary lg:p-8" data-reveal="fade-up">
			<div className="mb-6 flex items-start justify-between">
				<div>
					<h4 className="font-bold font-display text-xl uppercase tracking-tight">{name}</h4>
					<span className="font-serif text-primary text-sm italic">{role}</span>
				</div>
				<ArrowUpRight className="lp-icon-nudge h-5 w-5 text-white/20 transition-colors group-hover:text-primary" />
			</div>
			<ul className="space-y-2">
				{details.map((d) => (
					<li className="flex items-start gap-2 text-white/60 text-sm" key={d}>
						<span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
						{d}
					</li>
				))}
			</ul>
		</div>
	);
}

/* ── TESTIMONIALS ──────────────────────────────── */
function TestimonialsSection() {
	return (
		<SwissSection tone="light" leftTone="light" rightTone="light" title="VOICES">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<h2 className="lp-reveal mb-12 font-serif text-3xl italic lg:mb-16 lg:text-4xl" data-reveal="fade-up">What Investors Say</h2>
				<div className="lp-stagger grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
					<PullQuote quote="The transparency is unmatched. I can see exactly where my capital is deployed at any time." name="Michael R." title="Real Estate Professional" location="Toronto, ON" />
					<PullQuote quote="The spin model is brilliant. Instead of my money sitting in long-term loans, it's constantly working." name="Sarah L." title="Financial Advisor" location="Vancouver, BC" />
					<PullQuote quote="FairLend's engineering-first approach and deal-level visibility sets them apart completely." name="David T." title="Portfolio Manager" location="Calgary, AB" />
				</div>
			</div>
		</SwissSection>
	);
}

function PullQuote({ quote, name, title, location }: { quote: string; name: string; title: string; location: string }) {
	return (
		<div className="group lp-reveal" data-reveal="fade-up">
			<div className="relative mb-6">
				<span className="absolute -top-4 -left-2 font-serif text-[80px] text-neutral-200 leading-none">&ldquo;</span>
				<blockquote className="relative z-10 pt-8 font-serif text-lg text-neutral-700 italic leading-relaxed lg:text-xl">
					{quote}
				</blockquote>
			</div>
			<div className="flex items-center gap-4 border-neutral-200 border-t pt-4">
				<div className="h-px w-8 bg-primary" />
				<div>
					<div className="font-bold font-display text-sm uppercase tracking-tight">{name}</div>
					<div className="text-neutral-500 text-xs">{title}</div>
					<div className="mt-1 flex items-center gap-1 font-mono text-[9px] text-neutral-400">
						<MapPin className="h-3 w-3" /> {location}
					</div>
				</div>
			</div>
		</div>
	);
}

/* ── FAQ ───────────────────────────────────────── */
function FAQSection() {
	return (
		<SwissSection id="faq" tone="sand" leftTone="sand" rightTone="sand" title="VII / FAQ">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<div className="mb-4 font-serif text-[10px] text-neutral-400 uppercase tracking-[0.4em]">Chapter VII</div>
				<h2 className="lp-reveal mb-12 font-bold font-display text-4xl uppercase tracking-tighter lg:mb-16 lg:text-5xl" data-reveal="fade-up">Investor FAQ</h2>
				<div className="lp-stagger grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
					<FAQItem question="What is a MIC?" answer="A MIC (Mortgage Investment Corporation) is a Canadian investment vehicle that pools investor capital to fund mortgages. It's a flow-through entity, meaning income passes directly to investors without corporate taxation." />
					<FAQItem question="How does FairLend differ?" answer="Unlike traditional MICs that hold mortgages for years, we fund mortgages short-term, earn lending fees and interest, then sell to long-term buyers. This 'spin' model maximizes capital efficiency." />
					<FAQItem question="TFSA/RRSP eligible?" answer="Yes. MIC shares are eligible for TFSA, RRSP, RESP, RRIF, RDSP, and LIRA accounts — making them highly tax-efficient." />
					<FAQItem question="How is risk managed?" answer="We maintain strict underwriting: maximum 75% LTV, double appraisals, first-lien positions, AI vetting, and geographic diversification across major Canadian markets." />
					<FAQItem question="How quickly can I start?" answer="Typically within 30-90 days of submitting your subscription agreement. We process new investments in cohorts for optimal capital deployment." />
					<FAQItem question="What's the redemption process?" answer="One-year minimum hold. After that, redemptions processed quarterly with 60 days notice, subject to available liquidity." />
				</div>
			</div>
		</SwissSection>
	);
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
	return (
		<div className="group lp-hover-raise lp-reveal border border-neutral-300 bg-white p-6 transition-all hover:border-primary lg:p-8" data-reveal="fade-up">
			<h3 className="mb-4 flex items-start gap-3 font-bold font-display text-lg tracking-tight lg:text-xl">
				<ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 text-primary transition-transform group-hover:translate-x-1" />
				{question}
			</h3>
			<p className="pl-8 font-light text-neutral-600 text-sm leading-relaxed">{answer}</p>
		</div>
	);
}

/* ── CTA ───────────────────────────────────────── */
function CTASection() {
	return (
		<SwissSection id="waitlist" tone="dark" leftTone="dark" rightTone="dark" title="NEXT STEP" titleTone="dark">
			<div className="flex min-h-[500px] flex-col items-center justify-center px-8 py-16 text-center lg:py-24">
				<div className="lp-reveal mb-8 flex h-20 w-20 items-center justify-center border border-white/20 bg-white/5 lg:h-24 lg:w-24" data-reveal="scale-in">
					<BookOpen className="h-10 w-10 text-primary lg:h-12 lg:w-12" />
				</div>
				<h2 className="lp-reveal mb-4 font-serif text-4xl italic lg:text-6xl" data-delay="1" data-reveal="fade-up">See the Full Picture</h2>
				<p className="lp-reveal mb-8 max-w-xl font-light text-neutral-400 leading-relaxed lg:mb-12 lg:text-lg" data-delay="2" data-reveal="fade-up">
					Book a presentation with our team to walk through the prospectus, portfolio strategy, and real-time investor portal.
				</p>
				<div className="lp-reveal flex flex-wrap justify-center gap-4" data-delay="3" data-reveal="fade-up">
					<a className="lp-cta lp-hover-raise inline-flex cursor-pointer items-center gap-2 bg-primary px-8 py-3 font-bold text-[11px] text-white uppercase tracking-widest transition-all hover:bg-white hover:text-black" href="#waitlist">
						Book a Presentation <ArrowRight className="h-4 w-4" />
					</a>
					<a className="lp-hover-raise inline-flex cursor-pointer items-center gap-2 border border-white/20 px-8 py-3 font-bold text-[11px] uppercase tracking-widest transition-all hover:border-primary hover:text-primary" href="#waitlist">
						View Prospectus
					</a>
				</div>
				<p className="lp-reveal mt-6 font-mono text-[10px] text-neutral-500" data-delay="4" data-reveal="fade-in">
					FSRA + OSC compliant. TFSA, RRSP, RESP eligible.
				</p>
			</div>
		</SwissSection>
	);
}

/* ── FOOTER ────────────────────────────────────── */
function EditorialFooter() {
	return (
		<>
			<SwissSection leftTone="dark" rightTone="dark" tone="dark">
				<div className="px-8 py-12 lg:px-16 lg:py-16">
					<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
						<div className="lg:col-span-1">
							<div className="mb-6 flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center bg-white">
									<BarChart3 className="h-5 w-5 text-black" />
								</div>
								<span className="font-serif text-xl italic">FairLend</span>
							</div>
							<p className="mb-6 font-light text-neutral-400 text-sm leading-relaxed">
								A modern mortgage investment corporation built for transparency and engineered for returns.
							</p>
						</div>
						<div>
							<h4 className="mb-6 font-bold text-[11px] uppercase tracking-[0.3em]">Chapters</h4>
							<ul className="space-y-3">
								<FooterLink href="#thesis" label="I. The Thesis" />
								<FooterLink href="#protection" label="II. Protection" />
								<FooterLink href="#flywheel" label="III. The Flywheel" />
								<FooterLink href="#portfolio" label="IV. Portfolio" />
								<FooterLink href="#builds" label="V. The Builds" />
								<FooterLink href="#team" label="VI. Principals" />
								<FooterLink href="#faq" label="VII. FAQ" />
							</ul>
						</div>
						<div>
							<h4 className="mb-6 font-bold text-[11px] uppercase tracking-[0.3em]">Legal</h4>
							<ul className="space-y-3">
								<FooterLink href="#" label="Offering Memorandum" />
								<FooterLink href="#" label="Privacy Policy" />
								<FooterLink href="#" label="Terms of Service" />
								<FooterLink href="#" label="Risk Disclosure" />
							</ul>
						</div>
						<div>
							<h4 className="mb-6 font-bold text-[11px] uppercase tracking-[0.3em]">Contact</h4>
							<ul className="space-y-4">
								<li className="flex items-start gap-3 text-neutral-400 text-sm"><Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" /> invest@fairlend.ca</li>
								<li className="flex items-start gap-3 text-neutral-400 text-sm"><MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" /> Toronto, Ontario, Canada</li>
							</ul>
						</div>
					</div>
					<div className="mt-12 flex flex-col items-center justify-between gap-4 border-neutral-800 border-t pt-8 md:flex-row lg:mt-16">
						<p className="font-mono text-[10px] text-neutral-500">&copy; 2024 FairLend Mortgage Investment Corporation. All rights reserved.</p>
						<div className="flex items-center gap-6">
							<span className="font-mono text-[10px] text-neutral-500">FSRA Regulated</span>
							<span className="h-3 w-px bg-neutral-700" />
							<span className="font-mono text-[10px] text-neutral-500">OSC Compliant</span>
						</div>
					</div>
				</div>
			</SwissSection>
			<footer className="section-grid h-16 bg-white lg:h-20">
				<div className="margin-col swiss-border border-r" />
				<div className="flex h-full flex-1 items-center justify-between px-6 lg:px-12">
					<span className="font-serif text-neutral-500 text-sm italic">FairLend MIC Quarterly</span>
					<ScrollToTop />
				</div>
				<div className="margin-col swiss-border border-l" />
			</footer>
		</>
	);
}

function FooterLink({ href, label }: { href: string; label: string }) {
	return (
		<li>
			<a className="group flex cursor-pointer items-center gap-2 text-neutral-400 text-sm transition-colors hover:text-white" href={href}>
				<ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" /> {label}
			</a>
		</li>
	);
}

/* ── SUB-COMPONENTS ────────────────────────────── */
function ProtocolItem({ label }: { label: string }) {
	return (
		<div className="group lp-reveal flex items-center space-x-3 border-white/10 border-b pb-2 lg:space-x-4" data-reveal="fade-up">
			<ArrowRight className="lp-icon-nudge h-4 w-4 text-primary" />
			<span className="font-bold text-xs uppercase tracking-widest">{label}</span>
		</div>
	);
}

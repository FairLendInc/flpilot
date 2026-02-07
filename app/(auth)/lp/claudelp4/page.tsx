import {
	ArrowRight,
	ArrowUpRight,
	ChevronRight,
	Globe,
	Heart,
	Landmark,
	Leaf,
	Mail,
	MapPin,
	Menu,
	Shield,
	ShieldCheck,
	Sprout,
	Target,
	TrendingUp,
	TreePine,
	Users,
	Wallet,
} from "lucide-react";
import { ScrollReveal } from "../components/scroll-reveal";
import { ScrollToTop } from "../components/scroll-to-top";
import { SwissSection } from "../components/swiss-section";

/* ─────────────────────────────────────────────────
   VARIANT 4: WARM ORGANIC / EARTH TONES
   Think Aesop meets sustainable architecture.
   Warm, natural, trustworthy, human stories.
   ───────────────────────────────────────────────── */

export default function ClaudeLp4() {
	return (
		<div className="relative z-10 flex min-h-screen w-full flex-col">
			<ScrollReveal />
			<WarmHeader />
			<div className="flex w-full flex-col">
				<HeroSection />
				<TrustBar />
				<PhilosophySection />
				<HowItWorks />
				<ProtectionSection />
				<CaseStudy />
				<ReturnsSection />
				<TeamSection />
				<PortfolioSection />
				<BuildsSection />
				<InvestorStories />
				<CommonQuestions />
				<GetStarted />
			</div>
			<WarmFooter />
		</div>
	);
}

/* ── HEADER ────────────────────────────────────── */
function WarmHeader() {
	return (
		<header className="swiss-border sticky top-0 z-50 flex h-14 w-full items-center border-b bg-[#FAF8F5]/95 backdrop-blur-sm">
			<div className="flex h-full w-16 flex-shrink-0 items-center justify-center border-[#E8E4DF] border-r bg-[#FAF8F5]">
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3D4F2F]">
					<Leaf className="h-4 w-4 text-white" />
				</div>
			</div>
			<div className="flex h-full flex-1 items-center justify-between bg-[#FAF8F5] px-6 lg:px-12">
				<div className="flex items-center gap-2">
					<span className="font-serif text-xl italic text-[#3D2E2E]">FairLend</span>
				</div>
				<nav className="hidden space-x-8 text-[11px] text-[#8B7D6B] uppercase tracking-[0.25em] xl:flex">
					<a className="cursor-pointer transition-colors hover:text-[#3D4F2F]" href="#philosophy">Philosophy</a>
					<a className="cursor-pointer transition-colors hover:text-[#3D4F2F]" href="#protection">Protection</a>
					<a className="cursor-pointer transition-colors hover:text-[#3D4F2F]" href="#portfolio">Portfolio</a>
					<a className="cursor-pointer transition-colors hover:text-[#3D4F2F]" href="#questions">FAQ</a>
				</nav>
				<a className="lp-cta cursor-pointer rounded-full bg-[#3D4F2F] px-6 py-2.5 font-bold text-[11px] text-white uppercase tracking-widest transition-all hover:bg-[#3D2E2E] lg:px-8" href="#cta">
					Book a Presentation
				</a>
			</div>
			<div className="flex h-full w-16 flex-shrink-0 cursor-pointer items-center justify-center border-[#E8E4DF] border-l bg-[#FAF8F5] transition-colors hover:bg-[#F0EDE8]">
				<Menu className="h-5 w-5 text-[#8B7D6B]" />
			</div>
		</header>
	);
}

/* ── HERO (UNTOUCHED) ──────────────────────────── */
function HeroSection() {
	return (
		<section className="section-grid min-h-[calc(100vh-16rem)] bg-white" id="how-it-works">
			<div className="margin-col swiss-border border-r" />
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
							<a className="lp-cta lp-hover-raise inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#3D4F2F] px-6 py-3 font-bold text-[11px] text-white uppercase tracking-widest transition-all hover:bg-[#3D2E2E]" href="#cta">
								Book a Presentation <ArrowRight className="h-4 w-4" />
							</a>
							<a className="lp-hover-raise inline-flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-3 font-bold text-[11px] uppercase tracking-widest transition-all hover:border-[#3D4F2F] hover:text-[#3D4F2F]" href="#philosophy">
								Our Philosophy
							</a>
						</div>
					</div>
					<div className="swiss-border group lp-reveal relative h-[280px] overflow-hidden border-t lg:h-[300px]" data-delay="2" data-reveal="fade-in">
						<div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-center bg-cover opacity-20 contrast-125 grayscale transition-opacity duration-700 group-hover:opacity-30" />
						<div className="relative z-10 flex h-full flex-col justify-between p-8 lg:p-12">
							<div>
								<h3 className="stat-label text-neutral-500">The Spin Model</h3>
								<div className="mt-4 h-[2px] w-12 bg-[#3D4F2F]" />
							</div>
							<div>
								<p className="mb-2 font-bold font-display text-2xl uppercase leading-none tracking-tight lg:text-3xl">Short-Term Lender</p>
								<p className="font-serif text-[#8B7D6B] text-xl italic lg:text-2xl">Long-Term Buyers</p>
							</div>
						</div>
					</div>
				</div>
				<div className="col-span-12 flex flex-col lg:col-span-7">
					<div className="swiss-border lp-stagger grid h-32 grid-cols-3 border-b lg:h-40">
						<div className="swiss-border group lp-reveal flex cursor-pointer items-center justify-center border-r transition-colors hover:bg-[#FAF8F5]" data-delay="1" data-reveal="fade-in">
							<span className="box-type text-2xl transition-colors group-hover:text-[#3D4F2F] lg:text-3xl xl:text-4xl">TFSA</span>
						</div>
						<div className="swiss-border group lp-reveal flex cursor-pointer items-center justify-center border-r transition-colors hover:bg-[#FAF8F5]" data-delay="2" data-reveal="fade-in">
							<span className="box-type text-2xl transition-colors group-hover:text-[#3D4F2F] lg:text-3xl xl:text-4xl">RRSP</span>
						</div>
						<div className="group lp-reveal flex cursor-pointer items-center justify-center transition-colors hover:bg-[#FAF8F5]" data-delay="3" data-reveal="fade-in">
							<span className="box-type text-2xl transition-colors group-hover:text-[#3D4F2F] lg:text-3xl xl:text-4xl">RESP</span>
						</div>
					</div>
					<div className="swiss-border lp-stagger grid flex-grow grid-cols-1 border-b md:grid-cols-2">
						<div className="swiss-border group lp-hover-raise lp-reveal flex flex-col justify-between border-b p-8 transition-colors hover:bg-[#FAF8F5] md:border-r md:border-b-0 lg:p-12" data-reveal="fade-up">
							<div className="flex items-start justify-between">
								<h4 className="stat-label">LTV</h4>
								<TrendingUp className="h-5 w-5 text-neutral-300 transition-colors group-hover:text-[#3D4F2F]" />
							</div>
							<div>
								<div className="stat-value text-4xl md:text-5xl lg:text-6xl xl:text-7xl">75<span className="ml-1 align-top font-sans text-xl md:text-2xl">%</span></div>
								<p className="mt-4 font-mono text-[10px] text-neutral-400 uppercase tracking-tighter">Max loan-to-value</p>
							</div>
						</div>
						<div className="group lp-hover-raise lp-reveal flex flex-col justify-between p-8 transition-colors hover:bg-[#FAF8F5] lg:p-12" data-reveal="fade-up">
							<div className="flex items-start justify-between">
								<h4 className="stat-label">Lending Fee</h4>
								<Landmark className="h-5 w-5 text-neutral-300 transition-colors group-hover:text-[#3D4F2F]" />
							</div>
							<div>
								<div className="stat-value text-4xl md:text-5xl lg:text-6xl xl:text-7xl">1<span className="ml-1 align-top font-sans text-xl md:text-2xl">%</span></div>
								<p className="mt-4 font-mono text-[10px] text-neutral-400 uppercase tracking-tighter">Lending Fee on Origination</p>
							</div>
						</div>
					</div>
					<div className="lp-reveal relative flex h-[280px] flex-col justify-between overflow-hidden bg-[#3D4F2F] p-8 text-white lg:h-[300px] lg:p-12" data-delay="2" data-reveal="scale-in">
						<div className="relative z-10 flex items-start justify-between">
							<div>
								<h4 className="mb-6 font-bold text-[11px] text-white/50 uppercase tracking-[0.4em] lg:mb-8">MIC Visibility</h4>
								<h3 className="mb-2 font-bold font-display text-2xl tracking-tight lg:text-3xl">Deal-Level Transparency</h3>
								<p className="font-serif text-lg text-[#C67A4B] italic lg:text-xl">Built for serious investors</p>
							</div>
							<ShieldCheck className="lp-soft-float h-8 w-8 text-[#C67A4B] lg:h-10 lg:w-10" />
						</div>
						<div className="lp-stagger relative z-10 grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2 lg:gap-x-12 lg:gap-y-4">
							<WarmProtocolItem label="Pool overview" />
							<WarmProtocolItem label="Properties & deal flow" />
							<WarmProtocolItem label="Capital deployment" />
							<WarmProtocolItem label="Performance breakdown" />
						</div>
					</div>
				</div>
			</div>
			<div className="margin-col swiss-border border-l" />
		</section>
	);
}

/* ── TRUST BAR ─────────────────────────────────── */
function TrustBar() {
	return (
		<SwissSection tone="sand" leftTone="sand" rightTone="sand">
			<div className="flex flex-col items-center justify-center py-12 lg:py-16">
				<p className="lp-reveal mb-8 font-serif text-[#8B7D6B] italic" data-reveal="fade-up">Trusted across Canada</p>
				<div className="lp-stagger flex flex-wrap items-center justify-center gap-8 lg:gap-16">
					<WarmStat label="Assets Managed" value="$25M+" />
					<div className="hidden h-8 w-px bg-[#E8E4DF] lg:block" />
					<WarmStat label="Investors" value="500+" />
					<div className="hidden h-8 w-px bg-[#E8E4DF] lg:block" />
					<WarmStat label="Mortgages" value="150+" />
					<div className="hidden h-8 w-px bg-[#E8E4DF] lg:block" />
					<WarmStat label="Defaults" value="Zero" />
				</div>
			</div>
		</SwissSection>
	);
}

function WarmStat({ label, value }: { label: string; value: string }) {
	return (
		<div className="lp-reveal flex flex-col items-center" data-reveal="fade-in">
			<span className="mb-2 font-bold font-display text-2xl text-[#3D2E2E] tracking-tight lg:text-3xl">{value}</span>
			<span className="text-[11px] text-[#8B7D6B] uppercase tracking-wider">{label}</span>
		</div>
	);
}

/* ── OUR PHILOSOPHY ────────────────────────────── */
function PhilosophySection() {
	return (
		<SwissSection id="philosophy" tone="sand" leftTone="sand" rightTone="sand" title="PHILOSOPHY">
			<div className="grid min-h-[600px] grid-cols-1 lg:grid-cols-2">
				<div className="flex flex-col justify-center border-[#E8E4DF] border-b p-8 lg:border-r lg:border-b-0 lg:p-20">
					<h2 className="lp-reveal mb-8 font-serif text-4xl text-[#3D2E2E] italic leading-tight lg:text-5xl" data-reveal="fade-up">
						Fair lending isn&apos;t just our name — it&apos;s how we operate.
					</h2>
					<p className="lp-reveal max-w-lg font-light text-[#8B7D6B] leading-[1.8] lg:text-lg" data-delay="1" data-reveal="fade-up">
						We believe profitability and social responsibility aren&apos;t competing priorities — they&apos;re the same strategy. When borrowers succeed, investors succeed. It&apos;s that simple.
					</p>
				</div>
				<div className="flex flex-col justify-center p-8 lg:p-20">
					<div className="lp-stagger space-y-8">
						<PhiloCard icon={<Heart className="h-5 w-5 text-[#C67A4B]" />} title="No Predatory Fees" description="No $450 NSF fees, no debt traps. Publicly viewable, standardized contracts. Borrowers know exactly what they're signing." />
						<PhiloCard icon={<Globe className="h-5 w-5 text-[#C67A4B]" />} title="Full Transparency" description="Real-time data from every position. Complete vetting information. Transparent accounting — every penny tracked." />
						<PhiloCard icon={<Sprout className="h-5 w-5 text-[#C67A4B]" />} title="Carbon Neutral" description="We measure emissions on every build and pay to plant enough trees to reach net carbon zero. Sustainability isn't optional." />
					</div>
				</div>
			</div>
		</SwissSection>
	);
}

function PhiloCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
	return (
		<div className="group lp-reveal flex items-start gap-5" data-reveal="fade-up">
			<div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#3D4F2F]/10">
				{icon}
			</div>
			<div>
				<h3 className="mb-2 font-bold font-display text-lg text-[#3D2E2E] tracking-tight">{title}</h3>
				<p className="font-light text-[#8B7D6B] text-sm leading-relaxed">{description}</p>
			</div>
		</div>
	);
}

/* ── HOW YOUR CAPITAL WORKS ────────────────────── */
function HowItWorks() {
	return (
		<SwissSection tone="light" leftTone="light" rightTone="light" title="THE PROCESS">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<h2 className="lp-reveal mb-4 font-serif text-3xl text-[#3D2E2E] italic lg:text-4xl" data-reveal="fade-up">How Your Capital Works</h2>
				<p className="lp-reveal mb-12 max-w-xl font-light text-[#8B7D6B] leading-relaxed lg:mb-16" data-delay="1" data-reveal="fade-up">
					Your investment enters a cycle of careful lending that earns fees at every turn, without the risks of long-term loan exposure.
				</p>
				<div className="lp-stagger grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
					<StepCard number="01" title="You Invest" description="Place capital in the MIC via TFSA, RRSP, RESP, or non-registered accounts." icon={<Wallet className="h-6 w-6" />} />
					<StepCard number="02" title="We Lend" description="The MIC funds private mortgages with strict 75% LTV underwriting." icon={<Landmark className="h-6 w-6" />} />
					<StepCard number="03" title="Fees Accrue" description="1% lending fee plus daily interest during the short hold period." icon={<TrendingUp className="h-6 w-6" />} />
					<StepCard number="04" title="Capital Returns" description="Mortgages sold to long-term buyers. Your capital recycles for the next deal." icon={<Target className="h-6 w-6" />} />
				</div>
			</div>
		</SwissSection>
	);
}

function StepCard({ number, title, description, icon }: { number: string; title: string; description: string; icon: React.ReactNode }) {
	return (
		<div className="group lp-hover-raise lp-reveal rounded-xl border border-[#E8E4DF] bg-white p-6 shadow-sm transition-all hover:border-[#3D4F2F] hover:shadow-md lg:p-8" data-reveal="fade-up">
			<div className="mb-6 flex items-center justify-between">
				<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3D4F2F]/10 text-[#3D4F2F] transition-colors group-hover:bg-[#3D4F2F] group-hover:text-white">{icon}</div>
				<span className="font-serif text-2xl text-[#E8E4DF] italic">{number}</span>
			</div>
			<h3 className="mb-3 font-bold font-display text-lg text-[#3D2E2E] tracking-tight">{title}</h3>
			<p className="font-light text-[#8B7D6B] text-sm leading-relaxed">{description}</p>
		</div>
	);
}

/* ── PROTECTION ────────────────────────────────── */
function ProtectionSection() {
	return (
		<SwissSection id="protection" tone="sand" leftTone="sand" rightTone="sand" title="YOUR CARE">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<h2 className="lp-reveal mb-4 font-serif text-3xl text-[#3D2E2E] italic lg:text-4xl" data-reveal="fade-up">How We Protect Your Capital</h2>
				<p className="lp-reveal mb-12 max-w-xl font-light text-[#8B7D6B] leading-relaxed lg:mb-16" data-delay="1" data-reveal="fade-up">
					Six thoughtful layers of protection ensure your capital is cared for at every stage. The best protection? We simply don&apos;t make bad loans.
				</p>
				<div className="lp-stagger grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
					<CareCard title="Careful Selection" description="We decline 90% of deals. Only the most qualified borrowers make it through our process." />
					<CareCard title="Conservative Lending" description="Maximum 75% loan-to-value on firsts. There's always a meaningful equity cushion." />
					<CareCard title="Double Verification" description="Two independent appraisals on every deal — no single opinion drives the decision." />
					<CareCard title="Smart Technology" description="AI fraud detection, income verification, and credit analysis catch what humans might miss." />
					<CareCard title="Short Exposure" description="Most positions held under 2 months. Brief exposure means less time for things to change." />
					<CareCard title="Recovery Team" description="Dedicated legal team with a 100% track record recovering investor capital in distressed situations." />
				</div>
			</div>
		</SwissSection>
	);
}

function CareCard({ title, description }: { title: string; description: string }) {
	return (
		<div className="group lp-hover-raise lp-reveal rounded-xl border border-[#E8E4DF] bg-white p-6 shadow-sm transition-all hover:shadow-md lg:p-8" data-reveal="fade-up">
			<div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#3D4F2F]/10">
				<Shield className="h-4 w-4 text-[#3D4F2F]" />
			</div>
			<h3 className="mb-3 font-bold font-display text-lg text-[#3D2E2E] tracking-tight">{title}</h3>
			<p className="font-light text-[#8B7D6B] text-sm leading-relaxed">{description}</p>
		</div>
	);
}

/* ── CASE STUDY ────────────────────────────────── */
function CaseStudy() {
	return (
		<SwissSection tone="green" leftTone="green" rightTone="green" title="A TRUE STORY" titleTone="inverse">
			<div className="px-8 py-16 lg:px-20 lg:py-24">
				<div className="mx-auto max-w-3xl">
					<div className="lp-reveal mb-8 flex items-center gap-4" data-reveal="fade-up">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
							<Heart className="h-6 w-6 text-[#C67A4B]" />
						</div>
						<div>
							<h3 className="font-bold font-display text-lg uppercase tracking-tight">100% Recovery</h3>
							<span className="font-serif text-[#C67A4B] text-sm italic">A story of persistence and investor protection</span>
						</div>
					</div>
					<p className="lp-reveal mb-6 font-serif text-xl text-white/80 italic leading-relaxed lg:text-2xl" data-delay="1" data-reveal="fade-up">
						When a borrower&apos;s husband passed away and the widow contested the power of sale, our founder Elie navigated a 16-month legal battle. He consulted daily with lawyers, pushed timelines, and deployed a creative receivership strategy.
					</p>
					<p className="lp-reveal mb-8 font-serif text-2xl text-white italic leading-relaxed lg:text-3xl" data-delay="2" data-reveal="fade-up">
						The result? Every single penny of principal and interest — recovered for investors.
					</p>
					<p className="lp-reveal font-light text-white/60 text-sm leading-relaxed" data-delay="3" data-reveal="fade-in">
						This is what sets FairLend apart. Not just systems and technology, but the personal commitment to fight for your capital as if it were our own.
					</p>
				</div>
			</div>
		</SwissSection>
	);
}

/* ── RETURNS ───────────────────────────────────── */
function ReturnsSection() {
	return (
		<SwissSection tone="light" leftTone="light" rightTone="light" title="RETURNS">
			<div className="grid min-h-[500px] grid-cols-1 lg:grid-cols-2">
				<div className="swiss-border flex flex-col justify-center border-b p-8 lg:border-r lg:border-b-0 lg:p-20">
					<div className="lp-reveal mb-2 font-serif text-[#8B7D6B] text-sm italic" data-reveal="fade-up">Target Return</div>
					<div className="lp-reveal flex items-start" data-delay="1" data-reveal="fade-up">
						<span className="font-bold font-display text-[80px] text-[#3D4F2F] leading-[0.8] tracking-tighter lg:text-[120px]">9.25</span>
						<div className="mt-2 ml-2 flex flex-col lg:mt-4">
							<span className="font-bold font-display text-[#3D4F2F] text-2xl lg:text-4xl">%</span>
							<span className="font-bold font-display text-[#3D4F2F] text-xl lg:text-2xl">+</span>
						</div>
					</div>
					<p className="lp-reveal mt-8 max-w-md font-light text-[#8B7D6B] leading-relaxed lg:text-lg" data-delay="2" data-reveal="fade-up">
						Returns come from the work we do — lending fees and capital turnover — not from taking bigger risks with your money.
					</p>
				</div>
				<div className="flex flex-col justify-center bg-[#FAF8F5] p-8 lg:p-20">
					<div className="lp-reveal mb-8 font-serif text-[#8B7D6B] italic" data-reveal="fade-up">Regulation & Governance</div>
					<div className="lp-stagger space-y-6">
						<RegPartner name="FSRA" description="Financial Services Regulatory Authority of Ontario" />
						<RegPartner name="OSC" description="Ontario Securities Commission" />
						<RegPartner name="METAL" description="Custody & Administration Partner" />
					</div>
				</div>
			</div>
		</SwissSection>
	);
}

function RegPartner({ name, description }: { name: string; description: string }) {
	return (
		<div className="group lp-reveal flex items-center justify-between border-[#E8E4DF] border-b pb-4" data-reveal="fade-up">
			<div>
				<span className="font-bold font-display text-xl text-[#3D2E2E] tracking-tight transition-colors group-hover:text-[#3D4F2F] lg:text-2xl">{name}</span>
				<div className="text-[10px] text-[#8B7D6B] uppercase tracking-wider">{description}</div>
			</div>
			<ArrowUpRight className="h-4 w-4 text-[#E8E4DF] transition-colors group-hover:text-[#3D4F2F]" />
		</div>
	);
}

/* ── YOUR TEAM ─────────────────────────────────── */
function TeamSection() {
	return (
		<SwissSection tone="sand" leftTone="sand" rightTone="sand" title="YOUR TEAM">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<h2 className="lp-reveal mb-4 font-serif text-3xl text-[#3D2E2E] italic lg:text-4xl" data-reveal="fade-up">The People Behind FairLend</h2>
				<p className="lp-reveal mb-12 max-w-xl font-light text-[#8B7D6B] leading-relaxed lg:mb-16" data-delay="1" data-reveal="fade-up">
					Three rare expertise domains under one roof: deep mortgage lending, hands-on construction, and precision operations.
				</p>
				<div className="lp-stagger grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
					<PersonCard name="Elie Soberano" role="Founder" description="Top 1% Canadian mortgage broker with $2B+ in deals. Personally built 20+ custom homes. Scotiabank retains him at $2,000/hour for strategy consulting." />
					<PersonCard name="Fintech Team" role="Engineering" description="Ex-RBC Capital Markets quant analysts and software engineers building the AI systems that power fraud detection, scoring, and real-time monitoring." />
					<PersonCard name="Operations" role="Business" description="Founded by the creators of Barton Engineering — a precision manufacturer for Ford's supply chain. They bring manufacturing discipline to financial operations." />
					<PersonCard name="Legal Team" role="Recovery" description="A specialized team trained in mortgage recovery, power of sale proceedings, and receivership. Not general counsel — dedicated experts." />
				</div>
			</div>
		</SwissSection>
	);
}

function PersonCard({ name, role, description }: { name: string; role: string; description: string }) {
	return (
		<div className="group lp-hover-raise lp-reveal rounded-xl border border-[#E8E4DF] bg-white p-6 shadow-sm transition-all hover:shadow-md lg:p-8" data-reveal="fade-up">
			<div className="mb-4 flex items-center gap-4">
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3D4F2F]/10">
					<Users className="h-5 w-5 text-[#3D4F2F]" />
				</div>
				<div>
					<h3 className="font-bold font-display text-lg text-[#3D2E2E] tracking-tight">{name}</h3>
					<span className="font-serif text-[#C67A4B] text-sm italic">{role}</span>
				</div>
			</div>
			<p className="font-light text-[#8B7D6B] text-sm leading-relaxed">{description}</p>
		</div>
	);
}

/* ── PORTFOLIO COMPOSITION ──────────────────────── */
function PortfolioSection() {
	return (
		<SwissSection id="portfolio" tone="light" leftTone="light" rightTone="light" title="YOUR PORTFOLIO">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<h2 className="lp-reveal mb-4 font-serif text-3xl text-[#3D2E2E] italic lg:text-4xl" data-reveal="fade-up">Where Your Capital Goes</h2>
				<p className="lp-reveal mb-12 max-w-xl font-light text-[#8B7D6B] leading-relaxed lg:mb-16" data-delay="1" data-reveal="fade-up">
					A thoughtfully structured portfolio balancing yield, duration, and risk across three complementary areas.
				</p>
				<div className="lp-stagger grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
					<PortfolioCard allocation="50%" title="First Mortgages" description="Conservative first-lien bridge loans at sub-75% LTV. The stable core that powers the lending fee flywheel." returnTarget="~9%" holdPeriod="Short-term" />
					<PortfolioCard allocation="30%" title="Multiplex Builds" description="Ground-up construction lending where our builder expertise provides an edge desk-only lenders simply cannot replicate." returnTarget="~14%" holdPeriod="8–14 months" highlighted />
					<PortfolioCard allocation="20%" title="Second Mortgages" description="Carefully underwritten second-lien positions at sub-80% LTV. Higher yield with the same rigorous vetting." returnTarget="~12%" holdPeriod="Short-term" />
				</div>
			</div>
		</SwissSection>
	);
}

function PortfolioCard({ allocation, title, description, returnTarget, holdPeriod, highlighted = false }: { allocation: string; title: string; description: string; returnTarget: string; holdPeriod: string; highlighted?: boolean }) {
	return (
		<div className={`group lp-hover-raise lp-reveal rounded-xl border p-6 shadow-sm transition-all hover:shadow-md lg:p-8 ${highlighted ? "border-[#3D4F2F] bg-[#3D4F2F]/5" : "border-[#E8E4DF] bg-white"}`} data-reveal="fade-up">
			{highlighted && <div className="-translate-y-1/2 absolute top-0 right-6 rounded-full bg-[#C67A4B] px-4 py-1 font-bold text-[10px] text-white uppercase tracking-widest">Our Edge</div>}
			<div className="mb-6 flex items-end justify-between">
				<span className="font-bold font-display text-4xl text-[#3D4F2F] tracking-tighter lg:text-5xl">{allocation}</span>
				<span className="font-serif text-[#8B7D6B] text-sm italic">{holdPeriod}</span>
			</div>
			<h3 className="mb-3 font-bold font-display text-lg text-[#3D2E2E] tracking-tight">{title}</h3>
			<p className="mb-6 font-light text-[#8B7D6B] text-sm leading-relaxed">{description}</p>
			<div className="border-[#E8E4DF] border-t pt-4">
				<span className="text-[10px] text-[#8B7D6B] uppercase tracking-widest">Target Return</span>
				<div className="font-bold font-display text-xl text-[#3D4F2F] tracking-tight">{returnTarget}</div>
			</div>
		</div>
	);
}

/* ── THE BUILDS ────────────────────────────────── */
function BuildsSection() {
	return (
		<SwissSection tone="green" leftTone="green" rightTone="green" title="THE BUILDS" titleTone="inverse">
			<div className="grid min-h-[500px] grid-cols-1 lg:grid-cols-2">
				<div className="flex flex-col justify-center border-white/10 border-b p-8 lg:border-r lg:border-b-0 lg:p-20">
					<h2 className="lp-reveal mb-6 font-serif text-3xl italic lg:text-5xl" data-reveal="fade-up">
						Builder Meets Lender
					</h2>
					<p className="lp-reveal font-light text-white/70 leading-relaxed lg:text-lg" data-delay="1" data-reveal="fade-up">
						Most lenders review blueprints from behind a desk. Our founder has personally constructed over 20 custom homes and managed 50+ renovation projects. He walks the site, assesses the builder, and catches the issues that paper-only lenders never see. It&apos;s this rare combination of instinct and discipline that lets us find opportunities others miss.
					</p>
				</div>
				<div className="flex flex-col justify-center p-8 lg:p-20">
					<div className="lp-stagger space-y-6">
						<BuildFeature title="30-Year Contractor Network" description="Rapid intervention when builds need course correction" />
						<BuildFeature title="Expert On-Site Monitoring" description="Boots on the ground from foundation to finish" />
						<BuildFeature title="~14% Target Returns" description="2–5% premium over standard private mortgage yields" />
						<BuildFeature title="Trust But Verify" description="Every build tracked, every milestone confirmed in person" />
					</div>
				</div>
			</div>
		</SwissSection>
	);
}

function BuildFeature({ title, description }: { title: string; description: string }) {
	return (
		<div className="group lp-reveal flex items-start gap-4 border-white/10 border-b pb-4" data-reveal="fade-up">
			<div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
				<Sprout className="h-4 w-4 text-[#C67A4B]" />
			</div>
			<div>
				<h4 className="font-bold font-display text-base tracking-tight">{title}</h4>
				<p className="font-light text-white/50 text-sm">{description}</p>
			</div>
		</div>
	);
}

/* ── INVESTOR STORIES ──────────────────────────── */
function InvestorStories() {
	return (
		<SwissSection tone="sand" leftTone="sand" rightTone="sand" title="STORIES">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<h2 className="lp-reveal mb-12 font-serif text-3xl text-[#3D2E2E] italic lg:mb-16 lg:text-4xl" data-reveal="fade-up">What Investors Share</h2>
				<div className="lp-stagger grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
					<StoryCard quote="The transparency is unmatched. I can see exactly where my capital is deployed at any time." name="Michael R." location="Toronto, ON" />
					<StoryCard quote="The spin model is brilliant. My money is constantly working instead of sitting in long-term loans." name="Sarah L." location="Vancouver, BC" />
					<StoryCard quote="FairLend's engineering-first approach and deal-level visibility sets them apart completely." name="David T." location="Calgary, AB" />
				</div>
			</div>
		</SwissSection>
	);
}

function StoryCard({ quote, name, location }: { quote: string; name: string; location: string }) {
	return (
		<div className="group lp-hover-raise lp-reveal rounded-xl border border-[#E8E4DF] bg-white p-6 shadow-sm transition-all hover:shadow-md lg:p-8" data-reveal="fade-up">
			<blockquote className="mb-6 font-serif text-lg text-[#3D2E2E] italic leading-relaxed">&ldquo;{quote}&rdquo;</blockquote>
			<div className="flex items-center gap-3 border-[#E8E4DF] border-t pt-4">
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3D4F2F]/10">
					<Users className="h-4 w-4 text-[#3D4F2F]" />
				</div>
				<div>
					<div className="font-bold font-display text-sm text-[#3D2E2E]">{name}</div>
					<div className="flex items-center gap-1 text-[10px] text-[#8B7D6B]">
						<MapPin className="h-3 w-3" /> {location}
					</div>
				</div>
			</div>
		</div>
	);
}

/* ── FAQ ───────────────────────────────────────── */
function CommonQuestions() {
	return (
		<SwissSection id="questions" tone="light" leftTone="light" rightTone="light" title="QUESTIONS">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<h2 className="lp-reveal mb-12 font-serif text-3xl text-[#3D2E2E] italic lg:mb-16 lg:text-4xl" data-reveal="fade-up">Common Questions</h2>
				<div className="lp-stagger grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
					<QACard question="What is a MIC?" answer="A Mortgage Investment Corporation pools capital to fund mortgages. Income flows directly to investors without corporate taxation — it's a very tax-efficient vehicle." />
					<QACard question="How is FairLend different?" answer="We fund mortgages short-term, earn fees, then sell to long-term buyers. This 'spin' cycle keeps your capital working harder than traditional hold-to-maturity MICs." />
					<QACard question="Can I use my TFSA or RRSP?" answer="Absolutely. MIC shares are eligible for TFSA, RRSP, RESP, and several other registered accounts." />
					<QACard question="How do you manage risk?" answer="Through six layers of protection: extreme selectivity, conservative LTVs, double appraisals, AI vetting, short exposure, and a dedicated recovery team." />
					<QACard question="How soon can I start?" answer="Typically within 30-90 days. We bring on new investors in cohorts to ensure optimal capital deployment." />
					<QACard question="What about getting my money back?" answer="After a one-year hold, redemptions are processed quarterly with 60 days notice, based on available liquidity." />
				</div>
			</div>
		</SwissSection>
	);
}

function QACard({ question, answer }: { question: string; answer: string }) {
	return (
		<div className="group lp-hover-raise lp-reveal rounded-xl border border-[#E8E4DF] bg-white p-6 shadow-sm transition-all hover:shadow-md lg:p-8" data-reveal="fade-up">
			<h3 className="mb-3 flex items-start gap-3 font-bold font-display text-lg text-[#3D2E2E] tracking-tight">
				<ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 text-[#3D4F2F] transition-transform group-hover:translate-x-1" />
				{question}
			</h3>
			<p className="pl-8 font-light text-[#8B7D6B] text-sm leading-relaxed">{answer}</p>
		</div>
	);
}

/* ── CTA ───────────────────────────────────────── */
function GetStarted() {
	return (
		<SwissSection id="cta" tone="green" leftTone="green" rightTone="green" title="NEXT STEP" titleTone="inverse">
			<div className="flex min-h-[500px] flex-col items-center justify-center px-8 py-16 text-center lg:py-24">
				<div className="lp-reveal mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 lg:h-24 lg:w-24" data-reveal="scale-in">
					<TreePine className="h-10 w-10 text-[#C67A4B] lg:h-12 lg:w-12" />
				</div>
				<h2 className="lp-reveal mb-4 font-serif text-4xl italic lg:text-6xl" data-delay="1" data-reveal="fade-up">See the full picture</h2>
				<p className="lp-reveal mb-8 max-w-xl font-light text-white/60 leading-relaxed lg:mb-12 lg:text-lg" data-delay="2" data-reveal="fade-up">
					Numbers tell part of the story. A thirty-minute presentation covers the rest — the team, the deals, and the discipline behind every dollar deployed.
				</p>
				<div className="lp-reveal flex flex-col gap-4 sm:flex-row" data-delay="3" data-reveal="fade-up">
					<a className="lp-cta lp-hover-raise inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#C67A4B] px-8 py-4 font-bold text-[11px] text-white uppercase tracking-widest transition-all hover:bg-white hover:text-[#3D2E2E]" href="#book">
						Book a Presentation <ArrowRight className="h-4 w-4" />
					</a>
					<a className="lp-hover-raise inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/20 px-8 py-4 font-bold text-[11px] uppercase tracking-widest transition-all hover:border-[#C67A4B] hover:text-[#C67A4B]" href="#prospectus">
						View Prospectus <ArrowUpRight className="h-4 w-4" />
					</a>
				</div>
				<p className="lp-reveal mt-8 font-sans text-[10px] text-white/40" data-delay="4" data-reveal="fade-in">
					FSRA regulated &middot; OSC compliant &middot; TFSA / RRSP / RESP eligible
				</p>
			</div>
		</SwissSection>
	);
}

/* ── FOOTER ────────────────────────────────────── */
function WarmFooter() {
	return (
		<>
			<SwissSection tone="sand" leftTone="sand" rightTone="sand">
				<div className="px-8 py-12 lg:px-16 lg:py-16">
					<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
						<div>
							<div className="mb-6 flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3D4F2F]">
									<Leaf className="h-5 w-5 text-white" />
								</div>
								<span className="font-serif text-xl text-[#3D2E2E] italic">FairLend</span>
							</div>
							<p className="font-light text-[#8B7D6B] text-sm leading-relaxed">Fair lending, transparent investing, sustainable building.</p>
						</div>
						<div>
							<h4 className="mb-6 font-bold text-[11px] text-[#3D2E2E] uppercase tracking-[0.3em]">Explore</h4>
							<ul className="space-y-3">
								<WarmFooterLink href="#philosophy" label="Our Philosophy" />
								<WarmFooterLink href="#protection" label="Your Protection" />
								<WarmFooterLink href="#portfolio" label="Portfolio" />
								<WarmFooterLink href="#questions" label="Questions" />
							</ul>
						</div>
						<div>
							<h4 className="mb-6 font-bold text-[11px] text-[#3D2E2E] uppercase tracking-[0.3em]">Legal</h4>
							<ul className="space-y-3">
								<WarmFooterLink href="#" label="Offering Memorandum" />
								<WarmFooterLink href="#" label="Privacy Policy" />
								<WarmFooterLink href="#" label="Terms of Service" />
							</ul>
						</div>
						<div>
							<h4 className="mb-6 font-bold text-[11px] text-[#3D2E2E] uppercase tracking-[0.3em]">Say Hello</h4>
							<ul className="space-y-4">
								<li className="flex items-start gap-3 text-[#8B7D6B] text-sm"><Mail className="mt-0.5 h-4 w-4 text-[#C67A4B]" /> invest@fairlend.ca</li>
								<li className="flex items-start gap-3 text-[#8B7D6B] text-sm"><MapPin className="mt-0.5 h-4 w-4 text-[#C67A4B]" /> Toronto, Ontario</li>
							</ul>
						</div>
					</div>
					<div className="mt-12 flex flex-col items-center justify-between gap-4 border-[#E8E4DF] border-t pt-8 md:flex-row">
						<p className="text-[10px] text-[#8B7D6B]">&copy; 2024 FairLend MIC. All rights reserved.</p>
						<div className="flex items-center gap-4 text-[10px] text-[#8B7D6B]">
							<span>FSRA Regulated</span>
							<span className="h-3 w-px bg-[#E8E4DF]" />
							<span>OSC Compliant</span>
							<span className="h-3 w-px bg-[#E8E4DF]" />
							<span>Carbon Neutral</span>
						</div>
					</div>
				</div>
			</SwissSection>
			<footer className="section-grid h-16 bg-[#FAF8F5] lg:h-20">
				<div className="margin-col border-[#E8E4DF] border-r" />
				<div className="flex h-full flex-1 items-center justify-between px-6 lg:px-12">
					<span className="font-serif text-[#8B7D6B] text-sm italic">Growing together, thoughtfully.</span>
					<ScrollToTop />
				</div>
				<div className="margin-col border-[#E8E4DF] border-l" />
			</footer>
		</>
	);
}

function WarmFooterLink({ href, label }: { href: string; label: string }) {
	return (
		<li><a className="group flex cursor-pointer items-center gap-2 text-[#8B7D6B] text-sm transition-colors hover:text-[#3D4F2F]" href={href}><ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" /> {label}</a></li>
	);
}

function WarmProtocolItem({ label }: { label: string }) {
	return (
		<div className="group lp-reveal flex items-center space-x-3 border-white/10 border-b pb-2 lg:space-x-4" data-reveal="fade-up">
			<ArrowRight className="lp-icon-nudge h-4 w-4 text-[#C67A4B]" />
			<span className="font-bold text-xs uppercase tracking-widest">{label}</span>
		</div>
	);
}

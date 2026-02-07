import {
	AlertTriangle,
	ArrowRight,
	BarChart3,
	CheckCircle2,
	ChevronRight,
	Clock,
	Cpu,
	Database,
	FileText,
	Landmark,
	Lock,
	Mail,
	MapPin,
	Menu,
	Shield,
	ShieldCheck,
	Target,
	Terminal,
	TrendingUp,
	Verified,
	Wallet,
	Zap,
} from "lucide-react";
import { ScrollReveal } from "../components/scroll-reveal";
import { ScrollToTop } from "../components/scroll-to-top";
import { SwissSection } from "../components/swiss-section";

/* ─────────────────────────────────────────────────
   VARIANT 3: BRUTALIST / RAW DATA TERMINAL
   Bloomberg Terminal meets concrete. Monospace,
   exposed grid, raw numbers, no decoration.
   ───────────────────────────────────────────────── */

export default function ClaudeLp3() {
	return (
		<div className="relative z-10 flex min-h-screen w-full flex-col">
			<ScrollReveal />
			<TerminalHeader />
			<div className="flex w-full flex-col">
				<HeroSection />
				<SystemStatus />
				<SpinProtocol />
				<RiskMatrix />
				<YieldOutput />
				<ComplianceStamps />
				<DossierSection />
				<DealLog />
				<PortfolioSection />
				<BuildsSection />
				<SignalsSection />
				<FAQTerminal />
				<AccessRequest />
			</div>
			<TerminalFooter />
		</div>
	);
}

/* ── HEADER ────────────────────────────────────── */
function TerminalHeader() {
	return (
		<header className="sticky top-0 z-50 flex h-14 w-full items-center border-neutral-800 border-b bg-black/95 font-mono text-white backdrop-blur-sm">
			<div className="flex h-full w-16 flex-shrink-0 items-center justify-center border-neutral-800 border-r">
				<Terminal className="h-5 w-5 text-primary" />
			</div>
			<div className="flex h-full flex-1 items-center justify-between px-6 lg:px-12">
				<div className="flex items-center gap-4">
					<span className="font-bold text-[11px] uppercase tracking-widest">FL-MIC</span>
					<span className="flex items-center gap-2 text-[10px] text-green-400">
						<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
						ONLINE
					</span>
				</div>
				<nav className="hidden gap-6 text-[10px] text-neutral-500 uppercase tracking-widest xl:flex">
					<a className="cursor-pointer transition-colors hover:text-primary" href="#status">SYS_STATUS</a>
					<a className="cursor-pointer transition-colors hover:text-primary" href="#protocol">PROTOCOL</a>
					<a className="cursor-pointer transition-colors hover:text-primary" href="#yield">YIELD</a>
					<a className="cursor-pointer transition-colors hover:text-primary" href="#portfolio">PORTFOLIO</a>
				</nav>
				<a className="lp-cta cursor-pointer bg-primary px-6 py-2.5 font-bold text-[10px] text-white uppercase tracking-widest transition-all hover:bg-white hover:text-black" href="#cta">
					BOOK_PRESENTATION
				</a>
			</div>
			<div className="flex h-full w-16 flex-shrink-0 cursor-pointer items-center justify-center border-neutral-800 border-l transition-colors hover:bg-neutral-900">
				<Menu className="h-5 w-5 text-neutral-500" />
			</div>
		</header>
	);
}

/* ── HERO (UNTOUCHED) ──────────────────────────── */
function HeroSection() {
	return (
		<section className="section-grid min-h-[calc(100vh-16rem)] border-neutral-800 bg-black text-white" id="how-it-works">
			<div className="margin-col border-neutral-800 border-r" />
			<div className="grid w-full grid-cols-1 lg:grid-cols-12">
				<div className="col-span-12 flex flex-col border-neutral-800 border-b lg:col-span-5 lg:border-r lg:border-b-0">
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
									<p className="lp-reveal text-justify font-mono text-[13px] text-neutral-400 leading-[1.8]" data-delay="4" data-reveal="fade-up">
										The FairLend MIC is a pooled vehicle that provides short-term funding for private, interest-only mortgages. Instead of holding mortgages for years, the MIC funds them for a few days, earns fees and interest, then sells them to long-term buyers on the FairLend marketplace.
									</p>
								</div>
							</div>
						</div>
						<div className="lp-reveal flex flex-wrap gap-4" data-delay="5" data-reveal="fade-in">
							<a className="lp-cta inline-flex cursor-pointer items-center gap-2 bg-primary px-6 py-3 font-mono font-bold text-[10px] text-white uppercase tracking-widest transition-all hover:bg-white hover:text-black" href="#cta">
								INIT_ACCESS <ArrowRight className="h-4 w-4" />
							</a>
							<a className="inline-flex cursor-pointer items-center gap-2 border border-neutral-700 px-6 py-3 font-mono font-bold text-[10px] uppercase tracking-widest transition-all hover:border-primary hover:text-primary" href="#protocol">
								READ_DOCS
							</a>
						</div>
					</div>
					<div className="group lp-reveal relative h-[280px] overflow-hidden border-neutral-800 border-t lg:h-[300px]" data-delay="2" data-reveal="fade-in">
						<div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-center bg-cover opacity-10 contrast-125 grayscale" />
						<div className="relative z-10 flex h-full flex-col justify-between p-8 lg:p-12">
							<div>
								<h3 className="font-mono font-bold text-[10px] text-neutral-500 uppercase tracking-widest">SPIN_MODEL_V2</h3>
								<div className="mt-4 h-[2px] w-12 bg-primary" />
							</div>
							<div>
								<p className="mb-2 font-bold font-display text-2xl uppercase leading-none tracking-tight lg:text-3xl">Short-Term Lender</p>
								<p className="font-mono text-primary text-sm">→ Long-Term Buyers</p>
							</div>
						</div>
					</div>
				</div>
				<div className="col-span-12 flex flex-col lg:col-span-7">
					<div className="lp-stagger grid h-32 grid-cols-3 border-neutral-800 border-b lg:h-40">
						<div className="group lp-reveal flex cursor-pointer items-center justify-center border-neutral-800 border-r transition-colors hover:bg-neutral-900" data-delay="1" data-reveal="fade-in">
							<span className="font-bold font-display text-2xl tracking-tighter transition-colors group-hover:text-primary lg:text-3xl xl:text-4xl">TFSA</span>
						</div>
						<div className="group lp-reveal flex cursor-pointer items-center justify-center border-neutral-800 border-r transition-colors hover:bg-neutral-900" data-delay="2" data-reveal="fade-in">
							<span className="font-bold font-display text-2xl tracking-tighter transition-colors group-hover:text-primary lg:text-3xl xl:text-4xl">RRSP</span>
						</div>
						<div className="group lp-reveal flex cursor-pointer items-center justify-center transition-colors hover:bg-neutral-900" data-delay="3" data-reveal="fade-in">
							<span className="font-bold font-display text-2xl tracking-tighter transition-colors group-hover:text-primary lg:text-3xl xl:text-4xl">RESP</span>
						</div>
					</div>
					<div className="lp-stagger grid flex-grow grid-cols-1 border-neutral-800 border-b md:grid-cols-2">
						<div className="group lp-hover-raise lp-reveal flex flex-col justify-between border-neutral-800 border-b p-8 transition-colors hover:bg-neutral-900 md:border-r md:border-b-0 lg:p-12" data-reveal="fade-up">
							<div className="flex items-start justify-between">
								<h4 className="font-mono font-bold text-[10px] text-neutral-500 uppercase tracking-widest">LTV_MAX</h4>
								<TrendingUp className="h-5 w-5 text-neutral-700 transition-colors group-hover:text-primary" />
							</div>
							<div>
								<div className="font-bold font-display text-4xl tracking-tighter md:text-5xl lg:text-6xl xl:text-7xl">75<span className="ml-1 align-top font-mono text-xl md:text-2xl">%</span></div>
								<p className="mt-4 font-mono text-[10px] text-neutral-500 uppercase tracking-tighter">LOAN_TO_VALUE</p>
							</div>
						</div>
						<div className="group lp-hover-raise lp-reveal flex flex-col justify-between p-8 transition-colors hover:bg-neutral-900 lg:p-12" data-reveal="fade-up">
							<div className="flex items-start justify-between">
								<h4 className="font-mono font-bold text-[10px] text-neutral-500 uppercase tracking-widest">FEE_PCT</h4>
								<Landmark className="h-5 w-5 text-neutral-700 transition-colors group-hover:text-primary" />
							</div>
							<div>
								<div className="font-bold font-display text-4xl tracking-tighter md:text-5xl lg:text-6xl xl:text-7xl">1<span className="ml-1 align-top font-mono text-xl md:text-2xl">%</span></div>
								<p className="mt-4 font-mono text-[10px] text-neutral-500 uppercase tracking-tighter">ORIGINATION_FEE</p>
							</div>
						</div>
					</div>
					<div className="lp-reveal relative flex h-[280px] flex-col justify-between overflow-hidden bg-security-green p-8 text-white lg:h-[300px] lg:p-12" data-delay="2" data-reveal="scale-in">
						<div className="relative z-10 flex items-start justify-between">
							<div>
								<h4 className="mb-6 font-mono font-bold text-[10px] text-white/40 uppercase tracking-widest lg:mb-8">VISIBILITY_LEVEL: FULL</h4>
								<h3 className="mb-2 font-bold font-display text-2xl tracking-tight lg:text-3xl">Deal-Level Transparency</h3>
								<p className="font-mono text-primary text-sm">// INVESTOR_GRADE_ACCESS</p>
							</div>
							<ShieldCheck className="lp-soft-float h-8 w-8 text-primary lg:h-10 lg:w-10" />
						</div>
						<div className="lp-stagger relative z-10 grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2 lg:gap-x-12 lg:gap-y-4">
							<DataPoint label="POOL_OVERVIEW" />
							<DataPoint label="DEAL_FLOW" />
							<DataPoint label="CAPITAL_DEPLOY" />
							<DataPoint label="PERF_METRICS" />
						</div>
					</div>
				</div>
			</div>
			<div className="margin-col border-neutral-800 border-l" />
		</section>
	);
}

/* ── SYSTEM STATUS ─────────────────────────────── */
function SystemStatus() {
	return (
		<SwissSection id="status" tone="dark" leftTone="dark" rightTone="dark" title="SYS_STATUS" titleTone="dark">
			<div className="py-8 lg:py-12">
				<div className="mb-6 flex items-center gap-4 px-8 lg:px-16">
					<span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
					<span className="font-mono font-bold text-[10px] text-green-400 uppercase tracking-widest">ALL SYSTEMS OPERATIONAL</span>
					<span className="font-mono text-[9px] text-neutral-600">REF: #FL-SYS-001</span>
				</div>
				<div className="lp-stagger grid grid-cols-2 gap-0 border-neutral-800 border-t md:grid-cols-4">
					<StatusCell label="AUM_TOTAL" value="$25M+" status="ACTIVE" />
					<StatusCell label="INVESTOR_CT" value="500+" status="ACTIVE" />
					<StatusCell label="MORTGAGES" value="150+" status="FUNDED" />
					<StatusCell label="DEFAULT_RT" value="0.0%" status="NOMINAL" accent />
				</div>
			</div>
		</SwissSection>
	);
}

function StatusCell({ label, value, status, accent = false }: { label: string; value: string; status: string; accent?: boolean }) {
	return (
		<div className="lp-reveal border-neutral-800 border-r border-b p-6 last:border-r-0 lg:p-8" data-reveal="fade-in">
			<div className="mb-4 font-mono text-[9px] text-neutral-600 uppercase tracking-widest">{label}</div>
			<div className={`mb-2 font-bold font-display text-2xl tracking-tighter lg:text-4xl ${accent ? "text-[#00FF41]" : ""}`}>{value}</div>
			<div className="flex items-center gap-2">
				<span className={`h-1 w-1 rounded-full ${accent ? "bg-[#00FF41]" : "bg-green-500"}`} />
				<span className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest">{status}</span>
			</div>
		</div>
	);
}

/* ── SPIN PROTOCOL ─────────────────────────────── */
function SpinProtocol() {
	return (
		<SwissSection id="protocol" tone="dark" leftTone="dark" rightTone="dark" title="SPIN_PROTO" titleTone="dark">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<div className="mb-4 font-mono text-[9px] text-neutral-600">REF: #FL-PROTO-002 | CLEARANCE: PUBLIC</div>
				<h2 className="lp-reveal mb-4 font-bold font-display text-4xl uppercase tracking-tighter lg:text-6xl" data-reveal="fade-up">
					SPIN_<span className="text-primary">PROTOCOL</span>
				</h2>
				<p className="lp-reveal mb-16 max-w-xl font-mono text-neutral-500 text-sm leading-relaxed" data-delay="1" data-reveal="fade-up">
					// Capital recycling mechanism. Compounds returns without compounding risk.
				</p>
				<div className="lp-stagger space-y-0">
					<ProtoStep step="01" cmd="ORIGINATE" detail="MIC earns 1% lending fee on mortgage origination" status="EXECUTE" />
					<ProtoStep step="02" cmd="HOLD" detail="Max 2-month hold — accruing daily interest" status="ACCRUE" />
					<ProtoStep step="03" cmd="DISTRIBUTE" detail="Sold to long-term buyers via 30-year network" status="TRANSFER" />
					<ProtoStep step="04" cmd="RECYCLE" detail="Capital immediately redeployed — new cycle begins" status="LOOP" />
				</div>
			</div>
		</SwissSection>
	);
}

function ProtoStep({ step, cmd, detail, status }: { step: string; cmd: string; detail: string; status: string }) {
	return (
		<div className="group lp-reveal flex items-center gap-4 border-neutral-800 border-b py-6 font-mono transition-colors hover:bg-neutral-900 lg:gap-8" data-reveal="fade-in">
			<span className="text-[10px] text-neutral-700">{step}</span>
			<span className="font-bold text-primary text-sm uppercase">{cmd}</span>
			<span className="hidden flex-1 text-neutral-500 text-xs lg:block">{detail}</span>
			<span className="ml-auto text-[9px] text-green-500 uppercase tracking-widest">[{status}]</span>
		</div>
	);
}

/* ── RISK MATRIX ───────────────────────────────── */
function RiskMatrix() {
	return (
		<SwissSection tone="dark" leftTone="dark" rightTone="dark" title="RISK_MATRIX" titleTone="dark">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<div className="mb-4 flex items-center gap-4">
					<Shield className="h-5 w-5 text-primary" />
					<span className="font-mono font-bold text-[10px] text-primary uppercase tracking-widest">CAPITAL PROTECTION LAYERS</span>
				</div>
				<div className="mb-16 font-mono text-[9px] text-neutral-600">REF: #FL-RISK-003 | LAYERS: 6 | STATUS: ENFORCED</div>
				<div className="lp-stagger">
					<div className="grid grid-cols-[auto_1fr_auto] gap-0 border-neutral-800 border font-mono text-xs">
						<div className="border-neutral-800 border-r border-b bg-neutral-900 px-4 py-3 font-bold text-[9px] text-neutral-500 uppercase tracking-widest">LAYER</div>
						<div className="border-neutral-800 border-r border-b bg-neutral-900 px-4 py-3 font-bold text-[9px] text-neutral-500 uppercase tracking-widest">DESCRIPTION</div>
						<div className="border-neutral-800 border-b bg-neutral-900 px-4 py-3 font-bold text-[9px] text-neutral-500 uppercase tracking-widest">STATUS</div>
						<RiskRow layer="L1" desc="EXTREME_DEAL_SELECTION — 90% rejection rate" status="ENFORCED" />
						<RiskRow layer="L2" desc="CONSERVATIVE_LTV — Max 75% first, 80% second" status="ENFORCED" />
						<RiskRow layer="L3" desc="DOUBLE_APPRAISAL — 2x independent verification" status="ENFORCED" />
						<RiskRow layer="L4" desc="AI_HUMAN_VETTING — ML fraud + manual review" status="ENFORCED" />
						<RiskRow layer="L5" desc="SHORT_EXPOSURE — Max 2mo hold via flywheel" status="ENFORCED" />
						<RiskRow layer="L6" desc="POWER_OF_SALE — Dedicated recovery team" status="ENFORCED" />
					</div>
				</div>
			</div>
		</SwissSection>
	);
}

function RiskRow({ layer, desc, status }: { layer: string; desc: string; status: string }) {
	return (
		<>
			<div className="lp-reveal border-neutral-800 border-r border-b px-4 py-3 text-primary" data-reveal="fade-in">{layer}</div>
			<div className="lp-reveal border-neutral-800 border-r border-b px-4 py-3 text-neutral-400" data-reveal="fade-in">{desc}</div>
			<div className="lp-reveal border-neutral-800 border-b px-4 py-3 text-[#00FF41]" data-reveal="fade-in">{status}</div>
		</>
	);
}

/* ── YIELD OUTPUT ──────────────────────────────── */
function YieldOutput() {
	return (
		<SwissSection id="yield" tone="dark" leftTone="dark" rightTone="dark" title="YIELD_OUT" titleTone="dark">
			<div className="grid min-h-[400px] grid-cols-1 lg:grid-cols-2">
				<div className="flex flex-col justify-center border-neutral-800 border-b p-8 lg:border-r lg:border-b-0 lg:p-20">
					<div className="lp-reveal mb-2 font-mono text-[9px] text-neutral-600" data-reveal="fade-up">OUTPUT: TARGET_RETURN</div>
					<div className="lp-reveal flex items-start" data-delay="1" data-reveal="fade-up">
						<span className="font-bold font-display text-[80px] text-primary leading-[0.8] tracking-tighter lg:text-[120px] xl:text-[160px]">9.25</span>
						<div className="mt-2 ml-2 flex flex-col lg:mt-4">
							<span className="font-mono text-primary text-2xl lg:text-4xl">%</span>
							<span className="font-mono text-primary text-xl lg:text-2xl">+</span>
						</div>
					</div>
					<div className="lp-reveal mt-6 font-mono text-neutral-500 text-xs leading-relaxed" data-delay="2" data-reveal="fade-in">
						// Returns from lending fees + high capital turnover,<br />
						// not from long-dated loan exposure.
					</div>
				</div>
				<div className="p-8 lg:p-16">
					<div className="lp-stagger font-mono text-xs">
						<div className="mb-6 font-bold text-[9px] text-neutral-600 uppercase tracking-widest">YIELD_BREAKDOWN</div>
						<YieldRow label="FEE_INCOME" value="1% / origination" cycles="4-6x/yr" />
						<YieldRow label="INTEREST_ACCRUAL" value="Daily" cycles="~60 days" />
						<YieldRow label="CAPITAL_TURN" value="4-6x annually" cycles="VIA_FLYWHEEL" />
						<YieldRow label="TAX_STATUS" value="FLOW_THROUGH" cycles="TFSA/RRSP" />
					</div>
				</div>
			</div>
		</SwissSection>
	);
}

function YieldRow({ label, value, cycles }: { label: string; value: string; cycles: string }) {
	return (
		<div className="lp-reveal flex items-center justify-between border-neutral-800 border-b py-4" data-reveal="fade-in">
			<span className="text-primary">{label}</span>
			<span className="text-neutral-400">{value}</span>
			<span className="text-neutral-600">[{cycles}]</span>
		</div>
	);
}

/* ── COMPLIANCE STAMPS ─────────────────────────── */
function ComplianceStamps() {
	return (
		<SwissSection tone="dark" leftTone="dark" rightTone="dark">
			<div className="flex flex-wrap items-center justify-center gap-6 py-12 lg:gap-12 lg:py-16">
				<Stamp label="FSRA" status="COMPLIANT" />
				<Stamp label="OSC" status="COMPLIANT" />
				<Stamp label="TFSA" status="ELIGIBLE" />
				<Stamp label="RRSP" status="ELIGIBLE" />
				<Stamp label="RESP" status="ELIGIBLE" />
			</div>
		</SwissSection>
	);
}

function Stamp({ label, status }: { label: string; status: string }) {
	return (
		<div className="lp-reveal flex items-center gap-3 border border-neutral-800 px-4 py-2" data-reveal="fade-in">
			<Verified className="h-4 w-4 text-[#00FF41]" />
			<div className="font-mono">
				<div className="font-bold text-[11px] uppercase tracking-widest">{label}</div>
				<div className="text-[8px] text-[#00FF41] uppercase">{status}</div>
			</div>
		</div>
	);
}

/* ── DOSSIER ───────────────────────────────────── */
function DossierSection() {
	return (
		<SwissSection tone="dark" leftTone="dark" rightTone="dark" title="PERSONNEL" titleTone="dark">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<div className="mb-4 font-mono text-[9px] text-neutral-600">CLEARANCE: PUBLIC | REF: #FL-TEAM-004</div>
				<h2 className="lp-reveal mb-16 font-bold font-display text-4xl uppercase tracking-tighter lg:text-5xl" data-reveal="fade-up">TEAM_DOSSIER</h2>
				<div className="lp-stagger grid grid-cols-1 gap-4 md:grid-cols-2">
					<Dossier id="FL-001" name="SOBERANO, ELIE" role="FOUNDER" clearance="PRINCIPAL" stats={["TOP_1%_BROKER_CA", "$2B+_DEALS_30YR", "SCOTIABANK_$2K/HR", "20+_BUILDS_PERSONAL"]} />
					<Dossier id="FL-002" name="FINTECH_DIV" role="ENGINEERING" clearance="TECHNICAL" stats={["EX_RBC_CAP_MARKETS", "ML_FRAUD_DETECTION", "REALTIME_MONITORING", "INST_GRADE_INFRA"]} />
					<Dossier id="FL-003" name="OPS_TEAM" role="OPERATIONS" clearance="OPERATIONAL" stats={["BARTON_ENGINEERING", "JIT_FORD_SUPPLY", "ZERO_DELAY_TOLERANCE", "MFG_GRADE_PROCESS"]} />
					<Dossier id="FL-004" name="LEGAL_DIV" role="DEFAULT_RESPONSE" clearance="RECOVERY" stats={["MORTGAGE_RECOVERY", "POWER_OF_SALE", "RECEIVERSHIP_STRAT", "100%_RECOVERY_RATE"]} />
				</div>
			</div>
		</SwissSection>
	);
}

function Dossier({ id, name, role, clearance, stats }: { id: string; name: string; role: string; clearance: string; stats: string[] }) {
	return (
		<div className="group lp-reveal border border-neutral-800 bg-neutral-900 p-6 font-mono transition-all hover:border-primary lg:p-8" data-reveal="fade-up">
			<div className="mb-4 flex items-center justify-between text-[9px] text-neutral-600">
				<span>{id}</span>
				<span className="text-primary">CLEARANCE: {clearance}</span>
			</div>
			<h3 className="mb-1 font-bold text-base uppercase tracking-wider">{name}</h3>
			<div className="mb-6 text-[10px] text-neutral-500">{role}</div>
			<div className="space-y-1">
				{stats.map((s) => (
					<div className="flex items-center gap-2 text-[10px] text-neutral-400" key={s}>
						<span className="text-primary">›</span> {s}
					</div>
				))}
			</div>
		</div>
	);
}

/* ── DEAL LOG ──────────────────────────────────── */
function DealLog() {
	return (
		<SwissSection tone="dark" leftTone="dark" rightTone="dark" title="DEAL_LOG" titleTone="dark">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h2 className="lp-reveal font-bold font-display text-3xl uppercase tracking-tighter lg:text-4xl" data-reveal="fade-up">EVENT_LOG</h2>
						<div className="font-mono text-[9px] text-neutral-600">SPIN_EVENTS | LIVE_SYNC</div>
					</div>
					<div className="lp-reveal flex items-center gap-2 border border-neutral-800 px-4 py-2" data-reveal="fade-in">
						<span className="h-2 w-2 animate-pulse rounded-full bg-[#00FF41]" />
						<span className="font-mono font-bold text-[9px] text-[#00FF41] uppercase tracking-widest">STREAMING</span>
					</div>
				</div>
				<div className="lp-stagger overflow-x-auto font-mono text-xs">
					<LogEntry time="10:42:05" event="MORTGAGE_FUNDED — accrual period start" ref_id="#SPIN-1042" status="VERIFIED" />
					<LogEntry time="10:41:58" event="FEE_POSTED — 0.5% MIC slice" ref_id="#SPIN-1041" status="VERIFIED" />
					<LogEntry time="10:40:12" event="MORTGAGE_OFFLOADED — long-term buyer" ref_id="#SPIN-1040" status="VERIFIED" />
					<LogEntry time="10:38:00" event="CAPITAL_REDEPLOYMENT — queued" ref_id="#SPIN-1038" status="PENDING" />
					<LogEntry time="10:35:22" event="APPRAISAL_VERIFIED — dual confirmation" ref_id="#SPIN-1037" status="VERIFIED" />
					<LogEntry time="10:32:10" event="BORROWER_VETTED — AI + human pass" ref_id="#SPIN-1036" status="VERIFIED" />
				</div>
			</div>
		</SwissSection>
	);
}

function LogEntry({ time, event, ref_id, status }: { time: string; event: string; ref_id: string; status: string }) {
	return (
		<div className="lp-reveal flex items-center gap-4 border-neutral-800 border-b py-3 lg:gap-8" data-reveal="fade-in">
			<span className="text-neutral-600">{time}</span>
			<span className="flex-1 text-neutral-400">{event}</span>
			<span className="text-neutral-700">{ref_id}</span>
			<span className={status === "VERIFIED" ? "text-[#00FF41]" : "text-neutral-500"}>[{status}]</span>
		</div>
	);
}

/* ── PORTFOLIO COMPOSITION ──────────────────────── */
function PortfolioSection() {
	return (
		<SwissSection id="portfolio" tone="dark" leftTone="dark" rightTone="dark" title="ALLOC_MAP" titleTone="dark">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<div className="mb-4 font-mono text-[9px] text-neutral-600">REF: #FL-ALLOC-005 | STATUS: ACTIVE</div>
				<h2 className="lp-reveal mb-4 font-bold font-display text-4xl uppercase tracking-tighter lg:text-5xl" data-reveal="fade-up">
					PORTFOLIO_<span className="text-primary">ARCHITECTURE</span>
				</h2>
				<p className="lp-reveal mb-16 max-w-xl font-mono text-neutral-500 text-sm leading-relaxed" data-delay="1" data-reveal="fade-up">
					// Structured allocation across three asset classes. Yield, duration, and risk — balanced.
				</p>
				<div className="lp-stagger grid grid-cols-1 gap-4 md:grid-cols-3">
					<PortfolioCard alloc="50%" name="FIRST_MORTGAGES" desc="Conservative first-lien bridge loans. Sub-75% LTV. Stable core powering the lending fee flywheel." target="~9%" hold="SHORT_TERM" />
					<PortfolioCard alloc="30%" name="MULTIPLEX_BUILDS" desc="Ground-up construction lending. Builder expertise provides edge that desk-only lenders cannot replicate." target="~14%" hold="8-14_MO" highlighted />
					<PortfolioCard alloc="20%" name="SECOND_MORTGAGES" desc="Carefully underwritten second-lien positions. Sub-80% LTV. Higher yield, same rigorous vetting." target="~12%" hold="SHORT_TERM" />
				</div>
			</div>
		</SwissSection>
	);
}

function PortfolioCard({ alloc, name, desc, target, hold, highlighted = false }: { alloc: string; name: string; desc: string; target: string; hold: string; highlighted?: boolean }) {
	return (
		<div className={`group lp-reveal border p-6 font-mono transition-all lg:p-8 ${highlighted ? "border-primary bg-primary/5" : "border-neutral-800 bg-neutral-900 hover:border-primary"}`} data-reveal="fade-up">
			{highlighted && <div className="mb-4 text-[9px] text-primary">RECOMMENDED_ALLOC</div>}
			<div className="mb-4 flex items-end justify-between">
				<span className="font-bold font-display text-4xl text-primary tracking-tighter lg:text-5xl">{alloc}</span>
				<span className="text-[9px] text-neutral-600 uppercase">[{hold}]</span>
			</div>
			<h3 className="mb-3 font-bold text-base uppercase tracking-wider">{name}</h3>
			<p className="mb-6 text-[11px] text-neutral-400 leading-relaxed">{desc}</p>
			<div className="border-neutral-800 border-t pt-4">
				<div className="text-[9px] text-neutral-600 uppercase tracking-widest">TARGET_RETURN</div>
				<div className="font-bold text-xl text-[#00FF41]">{target}</div>
			</div>
		</div>
	);
}

/* ── THE BUILDS ────────────────────────────────── */
function BuildsSection() {
	return (
		<SwissSection tone="dark" leftTone="dark" rightTone="dark" title="BUILD_OPS" titleTone="dark">
			<div className="grid min-h-[500px] grid-cols-1 lg:grid-cols-2">
				<div className="flex flex-col justify-center border-neutral-800 border-b p-8 lg:border-r lg:border-b-0 lg:p-20">
					<div className="lp-reveal mb-2 font-mono text-[9px] text-neutral-600" data-reveal="fade-up">REF: #FL-BUILD-006 | CLEARANCE: PUBLIC</div>
					<h2 className="lp-reveal mb-6 font-bold font-display text-3xl uppercase tracking-tighter lg:text-5xl" data-reveal="fade-up">
						BUILDER_<span className="text-primary">LENDER</span>
					</h2>
					<p className="lp-reveal font-mono text-neutral-400 text-sm leading-relaxed" data-delay="1" data-reveal="fade-up">
						// Most lenders review blueprints from behind a desk. Our founder has personally constructed 20+ custom homes and managed 50+ renovation projects. He walks the site, assesses the builder, and catches the issues that paper-only lenders never see.
					</p>
				</div>
				<div className="flex flex-col justify-center p-8 lg:p-16">
					<div className="lp-stagger font-mono text-xs">
						<div className="mb-6 font-bold text-[9px] text-neutral-600 uppercase tracking-widest">BUILD_ADVANTAGES</div>
						<BuildDetail label="CONTRACTOR_NETWORK" value="30-year deep" detail="Rapid intervention when builds need course correction" />
						<BuildDetail label="SITE_MONITORING" value="Boots on ground" detail="Foundation to finish — every milestone confirmed in person" />
						<BuildDetail label="TARGET_RETURN" value="~14%" detail="2-5% premium over standard private mortgage yields" />
						<BuildDetail label="VERIFICATION" value="Trust but verify" detail="Every build tracked, every draw validated on-site" />
					</div>
				</div>
			</div>
		</SwissSection>
	);
}

function BuildDetail({ label, value, detail }: { label: string; value: string; detail: string }) {
	return (
		<div className="lp-reveal flex items-center justify-between border-neutral-800 border-b py-4" data-reveal="fade-in">
			<div>
				<span className="text-primary">{label}</span>
				<div className="mt-1 text-[10px] text-neutral-600">{detail}</div>
			</div>
			<span className="text-neutral-400">{value}</span>
		</div>
	);
}

/* ── SIGNALS (TESTIMONIALS) ────────────────────── */
function SignalsSection() {
	return (
		<SwissSection tone="dark" leftTone="dark" rightTone="dark" title="SIGNALS" titleTone="dark">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<h2 className="lp-reveal mb-16 font-bold font-display text-3xl uppercase tracking-tighter lg:text-4xl" data-reveal="fade-up">INVESTOR_SIGNALS</h2>
				<div className="lp-stagger grid grid-cols-1 gap-4 lg:grid-cols-3">
					<SignalCard src="SIG-001" msg="The transparency is unmatched. I can see exactly where my capital is deployed at any time." origin="M.R. // TORONTO" class_type="RE_PROFESSIONAL" />
					<SignalCard src="SIG-002" msg="The spin model is brilliant. Instead of my money sitting in long-term loans, it's constantly working." origin="S.L. // VANCOUVER" class_type="FIN_ADVISOR" />
					<SignalCard src="SIG-003" msg="FairLend's engineering-first approach and deal-level visibility sets them apart completely." origin="D.T. // CALGARY" class_type="PORT_MANAGER" />
				</div>
			</div>
		</SwissSection>
	);
}

function SignalCard({ src, msg, origin, class_type }: { src: string; msg: string; origin: string; class_type: string }) {
	return (
		<div className="group lp-reveal border border-neutral-800 bg-neutral-900 p-6 font-mono transition-all hover:border-primary" data-reveal="fade-up">
			<div className="mb-4 flex items-center justify-between text-[9px] text-neutral-600">
				<span>{src}</span>
				<span className="text-primary">{class_type}</span>
			</div>
			<p className="mb-6 text-neutral-400 text-sm leading-relaxed">&quot;{msg}&quot;</p>
			<div className="text-[10px] text-neutral-600">— {origin}</div>
		</div>
	);
}

/* ── FAQ TERMINAL ──────────────────────────────── */
function FAQTerminal() {
	return (
		<SwissSection tone="dark" leftTone="dark" rightTone="dark" title="FAQ_SYS" titleTone="dark">
			<div className="px-8 py-16 lg:px-16 lg:py-24">
				<h2 className="lp-reveal mb-16 font-bold font-display text-4xl uppercase tracking-tighter lg:text-5xl" data-reveal="fade-up">FAQ_TERMINAL</h2>
				<div className="lp-stagger space-y-4 font-mono text-sm">
					<CmdFAQ cmd="QUERY: what_is_mic" response="Mortgage Investment Corporation — pools capital to fund mortgages. Flow-through entity, no corporate taxation." />
					<CmdFAQ cmd="QUERY: how_different" response="Short-term funding + sell cycle. 'Spin' model maximizes capital efficiency vs traditional long-hold MICs." />
					<CmdFAQ cmd="QUERY: tax_eligible" response="AFFIRM — TFSA, RRSP, RESP, RRIF, RDSP, LIRA all eligible." />
					<CmdFAQ cmd="QUERY: risk_mgmt" response="75% LTV max, double appraisals, AI+human vetting, 2mo max hold, power of sale on all positions." />
					<CmdFAQ cmd="QUERY: timeline" response="30-90 days from subscription. Cohort-based deployment for optimal capital utilization." />
					<CmdFAQ cmd="QUERY: redemption" response="1yr min hold. Quarterly redemptions, 60 days notice, subject to liquidity." />
				</div>
			</div>
		</SwissSection>
	);
}

function CmdFAQ({ cmd, response }: { cmd: string; response: string }) {
	return (
		<div className="group lp-reveal border border-neutral-800 bg-neutral-900 p-4 transition-all hover:border-primary lg:p-6" data-reveal="fade-in">
			<div className="mb-2 text-primary">$ {cmd}</div>
			<div className="text-neutral-400">&gt; {response}</div>
		</div>
	);
}

/* ── ACCESS REQUEST (CTA) ──────────────────────── */
function AccessRequest() {
	return (
		<SwissSection id="cta" tone="dark" leftTone="dark" rightTone="dark" title="INIT" titleTone="dark">
			<div className="flex min-h-[400px] flex-col items-center justify-center px-8 py-16 text-center lg:py-24">
				<Zap className="lp-reveal mb-8 h-10 w-10 text-primary lg:h-12 lg:w-12" data-reveal="scale-in" />
				<h2 className="lp-reveal mb-4 font-bold font-display text-4xl uppercase tracking-tighter lg:text-6xl" data-delay="1" data-reveal="fade-up">
					SEE_THE_FULL_<span className="text-primary">PICTURE</span>
				</h2>
				<p className="lp-reveal mb-8 max-w-md font-mono text-neutral-500 text-sm leading-relaxed lg:mb-12" data-delay="2" data-reveal="fade-up">
					// Numbers tell part of the story. A thirty-minute presentation covers the rest — team, deals, and the discipline behind every dollar deployed.
				</p>
				<div className="lp-reveal flex flex-col gap-4 sm:flex-row" data-delay="3" data-reveal="fade-up">
					<a className="lp-cta inline-flex cursor-pointer items-center gap-2 bg-primary px-8 py-4 font-mono font-bold text-[10px] text-white uppercase tracking-widest transition-all hover:bg-white hover:text-black" href="#book">
						BOOK_PRESENTATION <ArrowRight className="h-4 w-4" />
					</a>
					<a className="inline-flex cursor-pointer items-center gap-2 border border-neutral-700 px-8 py-4 font-mono font-bold text-[10px] uppercase tracking-widest transition-all hover:border-primary hover:text-primary" href="#prospectus">
						VIEW_PROSPECTUS
					</a>
				</div>
				<p className="lp-reveal mt-8 font-mono text-[9px] text-neutral-700" data-delay="4" data-reveal="fade-in">
					FSRA_REGULATED | OSC_COMPLIANT | TFSA / RRSP / RESP ELIGIBLE
				</p>
			</div>
		</SwissSection>
	);
}

/* ── FOOTER ────────────────────────────────────── */
function TerminalFooter() {
	return (
		<footer className="section-grid h-16 border-neutral-800 bg-black text-white lg:h-20">
			<div className="margin-col border-neutral-800 border-r" />
			<div className="flex h-full flex-1 items-center justify-between px-6 font-mono text-[9px] text-neutral-600 lg:px-12">
				<div className="flex items-center gap-6">
					<span>&copy; 2024 FL-MIC</span>
					<span className="hidden md:inline">FSRA | OSC</span>
				</div>
				<div className="flex items-center gap-4">
					<span className="hidden md:inline">SYS_V2.0</span>
					<ScrollToTop />
				</div>
			</div>
			<div className="margin-col border-neutral-800 border-l" />
		</footer>
	);
}

/* ── SUB-COMPONENTS ────────────────────────────── */
function DataPoint({ label }: { label: string }) {
	return (
		<div className="group lp-reveal flex items-center space-x-3 border-white/10 border-b pb-2 lg:space-x-4" data-reveal="fade-up">
			<ArrowRight className="lp-icon-nudge h-4 w-4 text-primary" />
			<span className="font-mono font-bold text-xs uppercase tracking-widest">{label}</span>
		</div>
	);
}

import {
	ArrowRight,
	ArrowUpRight,
	BarChart3,
	ChevronsUp,
	Clock,
	Cpu,
	Donut,
	Landmark,
	Menu,
	ShieldCheck,
	TrendingUp,
	Verified,
} from "lucide-react";
import { ScrollReveal } from "./components/scroll-reveal";
import { SwissSection } from "./components/swiss-section";
export default function Home() {
	return (
		<div className="relative z-10 flex min-h-screen w-full flex-col">
			<ScrollReveal />
			<Header />
			<div className="flex w-full flex-col">
				<HeroSection />
				<TransparencySection />
				<ComplianceSection />
				<EngineeringSection />
				<AuditSection />
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
			<div className="flex h-full flex-1 items-center justify-between bg-white px-12 dark:bg-black">
				<nav className="hidden space-x-12 font-bold text-[11px] uppercase tracking-[0.3em] lg:flex">
					<a
						className="lp-underline transition-colors hover:text-primary"
						href="#how-it-works"
					>
						How It Works
					</a>
					<a
						className="lp-underline transition-colors hover:text-primary"
						href="#spin-model"
					>
						Spin Model
					</a>
					<a
						className="lp-underline transition-colors hover:text-primary"
						href="#waitlist"
					>
						Waiting List
					</a>
				</nav>
				<div className="ml-auto flex items-center space-x-12">
					<div className="hidden space-x-6 font-bold text-[10px] text-neutral-400 tracking-widest sm:flex">
						<span>EST. 2024</span>
						<span className="text-primary">MIC: WAITLIST</span>
					</div>
					<div className="flex items-center space-x-4">
						{/* <ThemeToggle /> */}
						<button
							className="lp-cta lp-hover-raise bg-primary px-8 py-3 font-bold text-[11px] text-white uppercase tracking-widest transition-all hover:bg-neutral-900"
							type="button"
						>
							Join the MIC Waiting List
						</button>
					</div>
				</div>
			</div>
			<div className="swiss-border flex h-full w-16 flex-shrink-0 items-center justify-center border-l bg-white dark:bg-black">
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
					<div className="flex flex-grow flex-col justify-between px-12 pt-16 pb-12">
						<div>
							<div
								className="lp-reveal mb-20 flex items-center space-x-4"
								data-delay="1"
								data-reveal="fade-up"
							>
								<span className="h-[2px] w-12 bg-primary" />
								<span className="font-bold text-[12px] text-neutral-500 uppercase tracking-[0.4em]">
									FairLend MIC
								</span>
							</div>
							<div className="mb-16">
								<h1
									className="lp-reveal -ml-1 mb-4 font-black font-display text-[80px] uppercase leading-[0.85] tracking-tighter md:text-[90px] xl:text-[110px]"
									data-delay="2"
									data-reveal="fade-up"
								>
									FairLend
								</h1>
								<div
									className="lp-reveal -mt-4 mb-12 font-serif text-6xl text-primary lowercase italic tracking-tight md:text-7xl xl:text-8xl"
									data-delay="3"
									data-reveal="fade-up"
								>
									mic
								</div>
								<div className="w-full max-w-[400px]">
									<p
										className="lp-reveal text-justify font-light text-[16px] text-neutral-600 leading-[1.6] dark:text-neutral-400"
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
					</div>
					<div
						className="swiss-border group lp-reveal relative h-[300px] overflow-hidden border-t"
						data-delay="2"
						data-reveal="fade-in"
					>
						<div className="absolute inset-0 bg-architectural bg-center bg-cover opacity-20 contrast-125 grayscale transition-opacity duration-700 group-hover:opacity-30" />
						<div className="relative z-10 flex h-full flex-col justify-between p-12">
							<div>
								<h3 className="stat-label text-neutral-500">The Spin Model</h3>
								<div className="mt-4 h-[2px] w-12 bg-primary" />
							</div>
							<div>
								<p className="mb-2 font-bold font-display text-3xl uppercase leading-none tracking-tight">
									Short-Term Lender
								</p>
								<p className="font-serif text-2xl text-neutral-600 italic dark:text-neutral-400">
									Long-Term Buyers
								</p>
							</div>
							<div className="absolute right-12 bottom-12">
								<Cpu className="lp-soft-float h-10 w-10 text-neutral-900 opacity-20 dark:text-white" />
							</div>
						</div>
					</div>
				</div>
				<div className="col-span-12 flex flex-col lg:col-span-7">
					<div className="swiss-border lp-stagger grid h-40 grid-cols-3 border-b">
						<div
							className="swiss-border group lp-reveal flex cursor-default items-center justify-center border-r transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
							data-delay="1"
							data-reveal="fade-in"
						>
							<span className="box-type transition-colors group-hover:text-primary">
								TFSA
							</span>
						</div>
						<div
							className="swiss-border group lp-reveal flex cursor-default items-center justify-center border-r transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
							data-delay="2"
							data-reveal="fade-in"
						>
							<span className="box-type transition-colors group-hover:text-primary">
								RRSP
							</span>
						</div>
						<div
							className="group lp-reveal flex cursor-default items-center justify-center transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
							data-delay="3"
							data-reveal="fade-in"
						>
							<span className="box-type transition-colors group-hover:text-primary">
								RESP
							</span>
						</div>
					</div>
					<div className="swiss-border lp-stagger grid flex-grow grid-cols-2 border-b">
						<div
							className="swiss-border group lp-hover-raise lp-reveal flex flex-col justify-between border-r p-12 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
							data-reveal="fade-up"
						>
							<div className="flex items-start justify-between">
								<h4 className="stat-label">LTV</h4>
								<TrendingUp className="h-5 w-5 text-neutral-300 transition-colors group-hover:text-primary" />
							</div>
							<div>
								<div className="stat-value">
									75
									<span className="ml-1 align-top font-sans text-2xl">%</span>
								</div>
								<p className="mt-4 font-mono text-[10px] text-neutral-400 uppercase tracking-tighter">
									Max loan-to-value
								</p>
							</div>
						</div>
						<div
							className="group lp-hover-raise lp-reveal flex flex-col justify-between p-12 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
							data-reveal="fade-up"
						>
							<div className="flex items-start justify-between">
								<h4 className="stat-label">Lending Fee</h4>
								<Landmark className="h-5 w-5 text-neutral-300 transition-colors group-hover:text-primary" />
							</div>
							<div>
								<div className="stat-value">
									1<span className="ml-1 align-top font-sans text-2xl">%</span>
								</div>
								<p className="mt-4 font-mono text-[10px] text-neutral-400 uppercase tracking-tighter">
									Lending Fee on Origination
								</p>
							</div>
						</div>
					</div>
					<div
						className="lp-reveal relative flex h-[300px] flex-col justify-between overflow-hidden bg-security-green p-12 text-white"
						data-delay="2"
						data-reveal="scale-in"
					>
						<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] opacity-10" />
						<div className="relative z-10 flex items-start justify-between">
							<div>
								<h4 className="mb-8 font-bold text-[11px] text-white/50 uppercase tracking-[0.4em]">
									MIC Visibility
								</h4>
								<h3 className="mb-2 font-bold font-display text-3xl tracking-tight">
									Deal-Level Transparency
								</h3>
								<p className="font-serif text-primary text-xl italic">
									Built for serious investors
								</p>
							</div>
							<ShieldCheck className="lp-soft-float h-10 w-10 text-primary" />
						</div>
						<div className="lp-stagger relative z-10 grid grid-cols-1 gap-x-12 gap-y-4 md:grid-cols-2">
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
				<div className="flex flex-col justify-center border-neutral-800 border-b p-12 lg:border-r lg:border-b-0 lg:p-16">
					<h2
						className="lp-reveal mb-8 font-bold font-display text-5xl uppercase leading-tight tracking-tighter lg:text-6xl"
						data-reveal="fade-up"
					>
						What You See
						<br />
						as a MIC
						<br />
						<span className="text-neutral-500">Investor</span>
					</h2>
					<p
						className="lp-reveal mb-12 max-w-md font-light text-lg text-neutral-400 leading-relaxed"
						data-delay="1"
						data-reveal="fade-up"
					>
						You won’t be guessing where your money is. The MIC runs on a
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
				<div className="flex flex-col justify-center space-y-12 p-12 lg:p-16">
					<div className="lp-stagger grid grid-cols-2 gap-8">
						<div
							className="lp-hover-raise lp-reveal border border-neutral-700 bg-neutral-800/50 p-6"
							data-reveal="fade-in"
						>
							<div className="mb-6 flex justify-between text-[10px] text-neutral-500 uppercase tracking-widest">
								<span>Capital Deployment</span>
								<Donut className="h-4 w-4" />
							</div>
							<div className="flex h-24 items-end justify-between gap-2">
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
							className="lp-hover-raise lp-reveal relative overflow-hidden border border-neutral-700 bg-neutral-800/50 p-6"
							data-reveal="fade-in"
						>
							<div className="mb-2 flex justify-between text-[10px] text-neutral-500 uppercase tracking-widest">
								<span>Capital Utilization</span>
								<span className="h-1.5 w-1.5 rounded-full bg-primary" />
							</div>
							<div className="mb-4 font-bold font-display text-4xl tracking-tighter">
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
					<div className="border-neutral-800 border-t pt-8">
						<div className="mb-6 text-[10px] text-neutral-500 uppercase tracking-widest">
							Deal Flow Regions
						</div>
						<div className="lp-stagger grid grid-cols-3 gap-4">
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
				<div className="swiss-border flex flex-col justify-center border-b p-12 lg:border-r lg:border-b-0 lg:p-20">
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
						<span className="font-bold font-display text-[120px] text-green-600 leading-[0.8] tracking-tighter lg:text-[160px]">
							9.25
						</span>
						<div className="mt-4 ml-4 flex flex-col">
							<span className="font-bold font-display text-4xl text-green-600">
								%
							</span>
							<span className="font-bold font-display text-2xl text-green-600">
								+
							</span>
						</div>
					</div>
					<p
						className="lp-reveal mt-8 max-w-md font-light text-lg text-neutral-600"
						data-delay="2"
						data-reveal="fade-up"
					>
						In the ideal spin environment, most of your return comes from
						lending fees and high capital turnover, not from sitting in
						long-dated loans.
					</p>
				</div>
				<div className="flex flex-col justify-center bg-neutral-50/50 p-12 lg:p-20">
					<h4
						className="lp-reveal mb-12 font-bold text-[12px] text-neutral-400 uppercase tracking-[0.3em]"
						data-reveal="fade-up"
					>
						Regulation & Governance
					</h4>
					<div className="lp-stagger space-y-12">
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
				<div className="relative z-10 flex h-full flex-col justify-end p-16">
					<div className="max-w-4xl">
						<div className="mb-8 h-1 w-20 bg-primary" />
						<h2
							className="lp-reveal mb-4 font-bold font-display text-6xl uppercase tracking-tighter md:text-8xl"
							data-reveal="fade-up"
						>
							Built by Ex–RBC
						</h2>
						<p
							className="lp-reveal mb-12 font-serif text-4xl text-white/80 italic md:text-5xl"
							data-delay="1"
							data-reveal="fade-up"
						>
							Capital Markets & Digital Engineers
						</p>
						<div className="grid grid-cols-1 gap-12 border-white/10 border-t pt-12 md:grid-cols-2">
							<div>
								<h3
									className="lp-reveal mb-4 font-bold text-primary text-xs uppercase tracking-[0.2em]"
									data-delay="2"
									data-reveal="fade-up"
								>
									Dedicated Ledger
								</h3>
								<p
									className="lp-reveal text-justify font-mono text-sm text-white/60 leading-relaxed"
									data-delay="3"
									data-reveal="fade-up"
								>
									The MIC runs on infrastructure built for auditability and
									transparency, with deal-level visibility and reporting
									designed for serious investors.
								</p>
							</div>
							<div
								className="lp-reveal flex flex-col space-y-4"
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
				<div className="absolute top-16 right-16">
					<Cpu className="lp-soft-float h-16 w-16 text-white/10" />
				</div>
			</div>
		</SwissSection>
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
			<div className="flex min-h-[500px] flex-col p-12 lg:p-20">
				<div className="mb-16 flex items-end justify-between">
					<div>
						<h4
							className="lp-reveal mb-4 font-bold text-[12px] text-neutral-400 uppercase tracking-[0.3em]"
							data-reveal="fade-up"
						>
							Spin Event Log
						</h4>
						<h2
							className="lp-reveal font-bold font-display text-4xl uppercase tracking-tight"
							data-delay="1"
							data-reveal="fade-up"
						>
							Deal-Level Activity
						</h2>
					</div>
					<div
						className="swiss-border lp-reveal hidden items-center space-x-2 border bg-white px-4 py-2 md:flex"
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
								<th className="w-32 py-4 font-bold text-[10px] text-neutral-500 uppercase tracking-widest">
									Time
								</th>
								<th className="py-4 font-bold text-[10px] text-neutral-500 uppercase tracking-widest">
									Spin Event
								</th>
								<th className="w-48 py-4 font-bold text-[10px] text-neutral-500 uppercase tracking-widest">
									Status
								</th>
								<th className="w-32 py-4 text-right font-bold text-[10px] text-neutral-500 uppercase tracking-widest">
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

function Footer() {
	return (
		<footer className="section-grid h-20 bg-white dark:bg-black" id="waitlist">
			<div className="margin-col swiss-border border-r" />
			<div className="flex h-full flex-1 items-center justify-between px-12">
				<div className="flex items-center space-x-16">
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
					<div className="swiss-border hidden flex-col border-l pl-16 md:flex">
						<span className="mb-1 text-[9px] text-neutral-400 uppercase tracking-widest">
							Capacity
						</span>
						<span className="font-bold text-[11px] uppercase tracking-widest">
							Limited — Cohort Based
						</span>
					</div>
				</div>
				<div className="flex h-full items-center space-x-12">
					<div className="flex items-center space-x-6">
						<span className="font-bold text-[10px] text-neutral-400 uppercase tracking-[0.3em]">
							Scroll for details
						</span>
						<div className="h-px w-16 bg-neutral-300 dark:bg-neutral-700" />
					</div>
					<div className="swiss-border lp-hover-raise flex h-12 w-12 items-center justify-center border">
						<ChevronsUp className="h-5 w-5" />
					</div>
				</div>
			</div>
			<div className="margin-col swiss-border border-l" />
		</footer>
	);
}

// Sub-components
function ProtocolItem({ label }: { label: string }) {
	return (
		<div
			className="group lp-reveal flex items-center space-x-4 border-white/10 border-b pb-2"
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
			className={`w-1/4 ${active ? "bg-primary" : "bg-primary/40"} group relative`}
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
			className="lp-hover-raise lp-reveal cursor-default border border-neutral-700 p-4 transition-colors hover:border-primary"
			data-reveal="fade-in"
		>
			<div className="mb-2 text-[10px] text-neutral-400">{city}</div>
			<div className="font-bold font-display text-2xl">{value}</div>
		</div>
	);
}

function Partner({ brand, fullName }: { brand: string; fullName: string }) {
	return (
		<div
			className="group swiss-border lp-hover-raise lp-reveal border-b pb-8"
			data-reveal="fade-up"
		>
			<div className="mb-2 flex items-center justify-between">
				<span className="font-bold font-display text-3xl tracking-tight transition-colors group-hover:text-primary">
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
		<div className="group/item flex cursor-pointer items-center space-x-4">
			<ArrowRight className="h-4 w-4 text-primary transition-transform group-hover/item:translate-x-1" />
			<span className="font-bold text-sm uppercase tracking-widest">
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

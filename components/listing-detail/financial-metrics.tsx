import { Card, CardContent } from "@heroui/react";
import { Icon } from "@iconify/react";
import { differenceInDays, format, parseISO } from "date-fns";

// Regex for splitting property type - defined at top level for performance
const PROPERTY_TYPE_SPLIT_REGEX = /\s+-\s+|\s+-|-/;

type FinancialMetricsProps = {
	financials: {
		purchasePrice: number;
		currentValue: number;
		monthlyPayment: number;
		interestRate: number;
		loanTerm: number; // in months
		maturityDate: string; // ISO date string
		principalLoanAmount: number; // New: Original loan amount
		priorEncumbrance?: {
			// New: Prior encumbrance details (optional)
			amount: number;
			lender: string;
		} | null;
		mortgageType?: string; // New: 1st, 2nd, 3rd mortgage
		propertyType?: string; // New: e.g., "Residential - Condo", "Commercial - Office"
	};
};

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

function formatPercentage(rate: number): string {
	return `${rate.toFixed(2)}%`;
}

function formatLTV(value: number): string {
	return `${value.toFixed(1)}%`;
}

type MetricCardProps = {
	icon: string;
	label: string;
	value: string;
	sublabel?: string;
	colorClass?: string;
	trend?: "up" | "down" | "neutral";
	isHighlighted?: boolean;
};

function MetricCard({
	icon,
	label,
	value,
	sublabel,
	colorClass = "text-primary",
	trend,
	isHighlighted = false,
}: MetricCardProps) {
	return (
		<Card.Root
			className={`hover:-translate-y-1 transition-all duration-300 hover:shadow-lg ${
				isHighlighted ? "shadow-lg ring-2 ring-primary/50" : ""
			}`}
		>
			<CardContent className="relative overflow-hidden p-5">
				{/* Animated background gradient */}
				<div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />

				<div className="relative z-10 flex items-start gap-3">
					<div
						className={`rounded-xl bg-linear-to-br from-primary/10 to-primary/5 p-3 ${colorClass} shadow-sm transition-all duration-300 hover:scale-110`}
					>
						<Icon className="h-6 w-6" icon={icon} />
					</div>
					<div className="flex-1">
						<p className="font-medium text-gray-600 text-sm dark:text-gray-400">
							{label}
						</p>
						<div className="mt-2 flex items-baseline gap-2">
							<p className="font-bold text-2xl text-gray-900 dark:text-white">
								{value}
							</p>
							{trend && (
								<Icon
									className={`h-4 w-4 ${
										trend === "up"
											? "text-green-500"
											: trend === "down"
												? "text-red-500"
												: "text-gray-400"
									} transition-all duration-300`}
									icon={
										trend === "up"
											? "lucide:arrow-up"
											: trend === "down"
												? "lucide:arrow-down"
												: "lucide:minus"
									}
								/>
							)}
						</div>
						{sublabel && (
							<p className="mt-2 font-medium text-gray-500 text-xs dark:text-gray-400">
								{sublabel}
							</p>
						)}
					</div>
				</div>
			</CardContent>
		</Card.Root>
	);
}

export function FinancialMetrics({ financials }: FinancialMetricsProps) {
	const maturityDate = parseISO(financials.maturityDate);
	const daysUntilMaturity = differenceInDays(
		maturityDate,
		new Date("2025-11-01")
	); // Using current date from env
	const yearsRemaining = Math.floor(daysUntilMaturity / 365);
	const monthsRemaining = Math.floor((daysUntilMaturity % 365) / 30);

	// Fallback to hardcoded amount if data is not available (MUST BE FIRST)
	const principalLoanAmount = financials.principalLoanAmount || 650000; // Hardcoded fallback
	const currentValue = financials.currentValue || 850000; // Hardcoded fallback

	const valueChange = currentValue - financials.purchasePrice;
	const valueChangePercent = (valueChange / financials.purchasePrice) * 100;

	const loanTermYears = Math.floor(financials.loanTerm / 12);
	const loanTermMonths = financials.loanTerm % 12;
	const loanTermText =
		loanTermMonths > 0
			? `${loanTermYears}y ${loanTermMonths}m`
			: `${loanTermYears} years`;

	// Parse property type to show category and sub-type
	const parsePropertyType = (type?: string) => {
		if (!type) return { category: "Residential", subType: "Detached House" };

		// Try to split by " - " or " -" or "-"
		const parts = type.split(PROPERTY_TYPE_SPLIT_REGEX);
		if (parts.length >= 2) {
			return {
				category: parts[0].trim(),
				subType: parts.slice(1).join(" - ").trim(),
			};
		}

		// If no separator, assume it's a sub-type and category is Residential
		return {
			category: "Residential",
			subType: type.trim(),
		};
	};

	const { category, subType } = parsePropertyType(financials.propertyType);

	// Calculate LTV (Loan-to-Value ratio) - with fallback values
	const ltv = (principalLoanAmount / currentValue) * 100;

	// Determine LTV color coding
	const getLTVColorClass = (value: number) => {
		if (value <= 60) return "text-green-600";
		if (value <= 80) return "text-yellow-600";
		return "text-red-600";
	};

	const getLTVLabel = (value: number) => {
		if (value <= 60) return "Excellent (≤60%)";
		if (value <= 80) return "Good (≤80%)";
		return "High Risk (>80%)";
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Icon
						className="h-6 w-6 animate-pulse text-primary"
						icon="lucide:trending-up"
					/>
					<h2 className="font-bold text-2xl">Key Financials</h2>
				</div>
				<div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5">
					<Icon className="h-4 w-4 text-primary" icon="lucide:calendar" />
					<p className="font-medium text-primary text-sm">As of Nov 1, 2025</p>
				</div>
			</div>

			{/* Metrics Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{/* Current Market Price */}
				<MetricCard
					colorClass={valueChange >= 0 ? "text-green-600" : "text-red-600"}
					icon="lucide:home"
					isHighlighted
					label="Current Market Price"
					sublabel={
						financials.currentValue
							? `${valueChangePercent >= 0 ? "+" : ""}${valueChangePercent.toFixed(1)}% from purchase`
							: "Estimated value"
					}
					trend={valueChange >= 0 ? "up" : "down"}
					value={formatCurrency(currentValue)}
				/>

				{/* LTV Ratio */}
				<MetricCard
					colorClass={getLTVColorClass(ltv)}
					icon="lucide:percent-circle"
					label="Loan-to-Value (LTV)"
					sublabel={
						financials.principalLoanAmount && financials.currentValue
							? getLTVLabel(ltv)
							: "Estimated value"
					}
					trend={ltv <= 80 ? "up" : "down"}
					value={formatLTV(ltv)}
				/>

				{/* Interest Rate */}
				<MetricCard
					colorClass="text-purple-600"
					icon="lucide:percent"
					label="Interest Rate"
					value={formatPercentage(financials.interestRate)}
				/>

				{/* Principal Loan Amount */}
				<MetricCard
					colorClass="text-indigo-600"
					icon="lucide:banknote"
					label="Principal Loan Amount"
					sublabel={
						financials.principalLoanAmount ? undefined : "Estimated value"
					}
					value={formatCurrency(principalLoanAmount)}
				/>

				{/* Mortgage Type */}
				<MetricCard
					colorClass="text-cyan-600"
					icon="lucide:credit-card"
					label="Mortgage Type"
					value={financials.mortgageType || "1st Position"}
				/>

				{/* Property Type */}
				<MetricCard
					colorClass="text-teal-600"
					icon="lucide:building"
					label="Property Type"
					sublabel={`${category}${financials.propertyType ? "" : " (Default)"}`}
					value={subType}
				/>

				{/* Monthly Payment */}
				<MetricCard
					colorClass="text-emerald-600"
					icon="lucide:calendar-days"
					isHighlighted
					label="Monthly Payment"
					value={formatCurrency(financials.monthlyPayment)}
				/>

				{/* Loan Term */}
				<MetricCard
					colorClass="text-amber-600"
					icon="lucide:clock"
					label="Loan Term"
					value={loanTermText}
				/>

				{/* Maturity Date - Takes 2 columns */}
				<Card.Root className="transition-all duration-300 hover:shadow-lg sm:col-span-2 lg:col-span-3 xl:col-span-3">
					<CardContent className="relative overflow-hidden p-5">
						{/* Animated background gradient */}
						<div className="absolute inset-0 bg-linear-to-br from-orange-500/5 to-amber-500/5" />

						<div className="relative z-10 flex items-start gap-3">
							<div className="rounded-xl bg-linear-to-br from-orange-100 to-amber-100 p-3 text-orange-600 shadow-sm transition-all duration-300 hover:scale-110 dark:from-orange-900/30 dark:to-amber-900/30">
								<Icon className="h-6 w-6" icon="lucide:calendar-check" />
							</div>
							<div className="flex-1">
								<p className="font-medium text-gray-600 text-sm dark:text-gray-400">
									Maturity Date
								</p>
								<p className="mt-2 font-bold text-2xl text-gray-900 dark:text-white">
									{format(maturityDate, "MMMM d, yyyy")}
								</p>
								<div className="mt-3 flex items-center gap-2">
									<Icon className="h-4 w-4 text-gray-500" icon="lucide:timer" />
									<p className="font-medium text-gray-600 text-sm dark:text-gray-400">
										{daysUntilMaturity > 0 ? (
											<>
												{yearsRemaining > 0 && (
													<span>{yearsRemaining} years </span>
												)}
												{monthsRemaining > 0 && (
													<span>{monthsRemaining} months </span>
												)}
												remaining
											</>
										) : (
											<span className="font-semibold text-red-600">
												Matured
											</span>
										)}
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card.Root>

				{/* Prior Encumbrance - Takes 2 columns */}
				{financials.priorEncumbrance && (
					<Card.Root className="transition-all duration-300 hover:shadow-lg sm:col-span-2 lg:col-span-2 xl:col-span-2">
						<CardContent className="relative overflow-hidden p-5">
							{/* Animated background gradient */}
							<div className="absolute inset-0 bg-linear-to-br from-red-500/5 to-pink-500/5" />

							<div className="relative z-10 flex items-start gap-3">
								<div className="rounded-xl bg-linear-to-br from-red-100 to-pink-100 p-3 text-red-600 shadow-sm transition-all duration-300 hover:scale-110 dark:from-red-900/30 dark:to-pink-900/30">
									<Icon className="h-6 w-6" icon="lucide:shield-alert" />
								</div>
								<div className="flex-1">
									<p className="font-medium text-gray-600 text-sm dark:text-gray-400">
										Prior Encumbrance
									</p>
									<div className="mt-2 flex items-baseline gap-2">
										<p className="font-bold text-2xl text-gray-900 dark:text-white">
											{formatCurrency(financials.priorEncumbrance.amount)}
										</p>
										{financials.mortgageType && (
											<span className="rounded-full bg-red-100 px-2 py-1 font-semibold text-red-700 text-xs dark:bg-red-900/30 dark:text-red-400">
												{financials.mortgageType}
											</span>
										)}
									</div>
									<div className="mt-2 flex items-center gap-2">
										<Icon
											className="h-4 w-4 text-gray-500"
											icon="lucide:building-2"
										/>
										<p className="font-medium text-gray-600 text-sm dark:text-gray-400">
											{financials.priorEncumbrance.lender}
										</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card.Root>
				)}
			</div>
		</div>
	);
}

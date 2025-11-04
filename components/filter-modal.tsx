import { Icon } from "@iconify/react";
import {
	Indicator as CheckboxIndicator,
	Root as CheckboxRoot,
} from "@radix-ui/react-checkbox";
import { CircleCheck } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import RangeSliderWithHistogram from "@/components/ui/range-slider-with-histogram";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { FilterableItem } from "./ListingGridShell";
import {
	FILTER_BOUNDS,
	type FilterState,
	type MortgageType,
	type PropertyType,
} from "./types/listing-filters";

type FilterModalProps = {
	filters: FilterState;
	onFiltersChange: (filters: FilterState) => void;
	items?: readonly FilterableItem[] | FilterableItem[];
};

export default function FilterModal({
	filters,
	onFiltersChange,
	items = [],
}: FilterModalProps) {
	const [isOpen, setIsOpen] = React.useState(false);

	// Ensure tooltips appear above all other elements when modal is open
	React.useEffect(() => {
		if (isOpen) {
			const style = document.createElement("style");
			style.textContent = `
        [data-radix-tooltip-content] {
          z-index: 9999 !important;
        }
      `;
			style.id = "tooltip-z-index-fix";
			document.head.appendChild(style);

			return () => {
				const existingStyle = document.getElementById("tooltip-z-index-fix");
				if (existingStyle) {
					existingStyle.remove();
				}
			};
		}
	}, [isOpen]);

	// Calculate histogram data from actual items
	const calculateHistogram = React.useCallback(
		(
			field: "ltv" | "apr" | "principal",
			min: number,
			max: number,
			barCount: number
		): number[] => {
			const buckets = new Array(barCount).fill(0);
			const bucketSize = (max - min) / barCount;

			for (const item of items) {
				const value = item[field];
				if (value !== undefined && value >= min && value <= max) {
					const bucketIndex = Math.min(
						Math.floor((value - min) / bucketSize),
						barCount - 1
					);
					buckets[bucketIndex] += 1;
				}
			}

			return buckets;
		},
		[items]
	);

	// Pre-calculate histogram data for all sliders with finer detail (40 bars = 20 * 2)
	const ltvHistogram = React.useMemo(
		() =>
			calculateHistogram(
				"ltv",
				FILTER_BOUNDS.ltvRange[0],
				FILTER_BOUNDS.ltvRange[1],
				20
			),
		[calculateHistogram]
	);

	const aprHistogram = React.useMemo(
		() =>
			calculateHistogram(
				"apr",
				FILTER_BOUNDS.interestRateRange[0],
				FILTER_BOUNDS.interestRateRange[1],
				20
			),
		[calculateHistogram]
	);

	const principalHistogram = React.useMemo(
		() =>
			calculateHistogram(
				"principal",
				FILTER_BOUNDS.loanAmountRange[0],
				FILTER_BOUNDS.loanAmountRange[1],
				20
			),
		[calculateHistogram]
	);

	const safeFilters: FilterState = filters || {
		ltvRange: [0, 100] as [number, number],
		interestRateRange: [0, 10] as [number, number],
		loanAmountRange: [0, 10000000] as [number, number],
		loanAmountMin: 0,
		loanAmountMax: 10000000,
		mortgageTypes: [],
		propertyTypes: [],
		searchQuery: "",
		maturityDate: undefined,
	};

	const handleLtvChange = (values: [number, number]) => {
		onFiltersChange({
			...safeFilters,
			ltvRange: values,
		});
	};

	const handleInterestRateChange = (values: [number, number]) => {
		onFiltersChange({
			...safeFilters,
			interestRateRange: values,
		});
	};

	const handleLoanAmountChange = (values: [number, number]) => {
		onFiltersChange({
			...safeFilters,
			loanAmountRange: values,
		});
	};

	const handleMortgageTypeToggle = (type: MortgageType) => {
		const currentTypes = safeFilters.mortgageTypes;
		const newTypes = currentTypes.includes(type)
			? currentTypes.filter((t) => t !== type)
			: [...currentTypes, type];

		onFiltersChange({
			...safeFilters,
			mortgageTypes: newTypes,
		});
	};

	const handlePropertyTypeToggle = (type: PropertyType) => {
		const currentTypes = safeFilters.propertyTypes;
		const newTypes = currentTypes.includes(type)
			? currentTypes.filter((t) => t !== type)
			: [...currentTypes, type];

		onFiltersChange({
			...safeFilters,
			propertyTypes: newTypes,
		});
	};

	const handleMaturityDateChange = (date?: Date) => {
		onFiltersChange({
			...safeFilters,
			maturityDate: date,
		});
	};

	const handleClearFilters = () => {
		onFiltersChange({
			ltvRange: FILTER_BOUNDS.ltvRange,
			interestRateRange: FILTER_BOUNDS.interestRateRange,
			loanAmountRange: FILTER_BOUNDS.loanAmountRange,
			loanAmountMin: FILTER_BOUNDS.loanAmountMin,
			loanAmountMax: FILTER_BOUNDS.loanAmountMax,
			mortgageTypes: [],
			propertyTypes: [],
			searchQuery: "",
			maturityDate: undefined,
		});
	};

	const hasActiveFilters =
		safeFilters.ltvRange[0] > FILTER_BOUNDS.ltvRange[0] ||
		safeFilters.ltvRange[1] < FILTER_BOUNDS.ltvRange[1] ||
		safeFilters.interestRateRange[0] > FILTER_BOUNDS.interestRateRange[0] ||
		safeFilters.interestRateRange[1] < FILTER_BOUNDS.interestRateRange[1] ||
		safeFilters.loanAmountRange[0] > FILTER_BOUNDS.loanAmountRange[0] ||
		safeFilters.loanAmountRange[1] < FILTER_BOUNDS.loanAmountRange[1] ||
		safeFilters.mortgageTypes.length > 0 ||
		safeFilters.propertyTypes.length > 0 ||
		safeFilters.maturityDate !== undefined;

	const mortgageTypeOptions: Array<{
		value: MortgageType;
		label: string;
		displayLabel: string;
	}> = [
		{ value: "First", label: "1st", displayLabel: "1st" },
		{ value: "Second", label: "2nd", displayLabel: "2nd" },
		{ value: "Other", label: "3+", displayLabel: "3+" },
	];

	const propertyTypeOptions: Array<{
		value: PropertyType;
		label: string;
		displayLabel: string;
		icon: string;
	}> = [
		{
			value: "Detached Home",
			label: "Detached",
			displayLabel: "Detached",
			icon: "lucide:home",
		},
		{
			value: "Duplex",
			label: "Duplex",
			displayLabel: "Duplex",
			icon: "lucide:building-2",
		},
		{
			value: "Triplex",
			label: "Triplex",
			displayLabel: "Triplex",
			icon: "lucide:building",
		},
		{
			value: "Apartment",
			label: "Apartment",
			displayLabel: "Apartment",
			icon: "lucide:landmark",
		},
		{
			value: "Condo",
			label: "Condo",
			displayLabel: "Condo",
			icon: "lucide:building-2",
		},
		{
			value: "Cottage",
			label: "Cottage",
			displayLabel: "Cottage",
			icon: "lucide:home",
		},
		{
			value: "Townhouse",
			label: "Townhouse",
			displayLabel: "Townhouse",
			icon: "lucide:home",
		},
		{
			value: "Commercial",
			label: "Commercial",
			displayLabel: "Commercial",
			icon: "lucide:briefcase",
		},
		{
			value: "Mixed-Use",
			label: "Mixed-Use",
			displayLabel: "Mixed-Use",
			icon: "lucide:layers",
		},
		{
			value: "Other",
			label: "Other",
			displayLabel: "Other",
			icon: "lucide:help-circle",
		},
	];

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger asChild>
				<Button className="rounded-full" size="lg" variant="outline">
					Filters
					<Icon className="ml-2" icon="lucide:filter" />
				</Button>
			</DialogTrigger>
			<TooltipProvider delayDuration={0}>
				<DialogContent className="z-101 max-h-[80vh] w-[calc(100vw-1rem)] min-w-[300px] max-w-[calc(100vw-1rem)] overflow-y-auto px-2 sm:px-6">
					<DialogHeader>
						<DialogTitle className="text-center font-medium text-2xl">
							Filters
						</DialogTitle>
					</DialogHeader>

					<div className="flex flex-col gap-3 px-1 py-1 sm:px-0">
						<Separator />

						<div className="space-y-2">
							<h2 className="flex items-center justify-center gap-2 text-center font-medium text-foreground/50 text-lg sm:text-xl">
								<Icon className="h-5 w-5" icon="lucide:percent" />
								LTV
							</h2>
							<div className="relative z-[105] w-full overflow-x-hidden">
								<RangeSliderWithHistogram
									className="w-full"
									defaultValue={safeFilters.ltvRange}
									formatValue={(value) => `${value}%`}
									histogramData={ltvHistogram}
									max={FILTER_BOUNDS.ltvRange[1]}
									min={FILTER_BOUNDS.ltvRange[0]}
									onValueChange={handleLtvChange}
									showCard={false}
									showTitle={false}
									step={1}
									targetBarCount={20}
									variant="compact"
								/>
							</div>
						</div>

						<Separator />

						<div className="space-y-2">
							<h2 className="flex items-center justify-center gap-2 text-center font-medium text-foreground/50 text-lg sm:text-xl">
								<Icon className="h-5 w-5" icon="lucide:trending-up" />
								Interest Rate
							</h2>
							<div className="relative z-[105] w-full overflow-x-hidden">
								<RangeSliderWithHistogram
									className="w-full"
									defaultValue={safeFilters.interestRateRange}
									formatValue={(value) => `${value}%`}
									histogramData={aprHistogram}
									max={FILTER_BOUNDS.interestRateRange[1]}
									min={FILTER_BOUNDS.interestRateRange[0]}
									onValueChange={handleInterestRateChange}
									showCard={false}
									showTitle={false}
									step={0.1}
									targetBarCount={20}
									variant="compact"
								/>
							</div>
						</div>

						<Separator />

						<div className="space-y-2">
							<h2 className="flex items-center justify-center gap-2 text-center font-medium text-foreground/50 text-lg sm:text-xl">
								<Icon className="h-5 w-5" icon="lucide:dollar-sign" />
								Loan Amount
							</h2>
							<div className="relative z-[105] w-full overflow-x-hidden">
								<RangeSliderWithHistogram
									className="w-full"
									defaultValue={safeFilters.loanAmountRange}
									formatValue={(value) => `$${value.toLocaleString()}`}
									histogramData={principalHistogram}
									max={FILTER_BOUNDS.loanAmountRange[1]}
									min={FILTER_BOUNDS.loanAmountRange[0]}
									onValueChange={handleLoanAmountChange}
									showCard={false}
									showTitle={false}
									step={10000}
									targetBarCount={20}
									variant="compact"
								/>
							</div>
						</div>

						<Separator />

						<div className="space-y-2">
							<h2 className="flex items-center justify-center gap-2 text-center font-medium text-foreground/50 text-lg sm:text-xl">
								<Icon className="h-5 w-5" icon="lucide:file-text" />
								Mortgage Type
							</h2>
							<div className="grid grid-cols-1 items-center justify-center gap-2 py-4 sm:grid-cols-3 sm:gap-3">
								{mortgageTypeOptions.map((option) => (
									<CheckboxRoot
										checked={safeFilters.mortgageTypes.includes(option.value)}
										className="relative rounded-lg px-2 py-2 text-center text-muted-foreground ring-[1px] ring-border transition-all data-[state=checked]:text-primary data-[state=checked]:ring-2 data-[state=checked]:ring-primary sm:px-4 sm:py-3"
										key={option.value}
										onCheckedChange={() =>
											handleMortgageTypeToggle(option.value)
										}
									>
										<div className="flex flex-col items-center gap-2">
											<span className="font-semibold text-2xl">
												{option.label}
											</span>
											<span className="font-medium text-sm tracking-tight">
												{option.displayLabel}
											</span>
										</div>
										<CheckboxIndicator className="absolute top-2 right-2">
											<CircleCheck className="h-5 w-5 fill-primary text-primary-foreground" />
										</CheckboxIndicator>
									</CheckboxRoot>
								))}
							</div>
						</div>

						<Separator />

						<div className="space-y-2">
							<h2 className="flex items-center justify-center gap-2 text-center font-medium text-foreground/50 text-lg sm:text-xl">
								<Icon className="h-5 w-5" icon="lucide:building" />
								Property Type
							</h2>
							<div className="grid grid-cols-1 items-center justify-center gap-2 py-4 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
								{propertyTypeOptions.map((option) => (
									<CheckboxRoot
										checked={safeFilters.propertyTypes.includes(option.value)}
										className="relative h-16 rounded-lg px-4 py-3 text-center text-muted-foreground ring-[1px] ring-border transition-all data-[state=checked]:text-primary data-[state=checked]:ring-2 data-[state=checked]:ring-primary"
										key={option.value}
										onCheckedChange={() =>
											handlePropertyTypeToggle(option.value)
										}
									>
										<div className="flex h-full flex-col items-center justify-center gap-2">
											<Icon className="h-5 w-5" icon={option.icon} />
											<span className="font-semibold text-xs leading-tight sm:text-sm">
												{option.label}
											</span>
										</div>
										<CheckboxIndicator className="absolute top-2 right-2">
											<CircleCheck className="h-4 w-4 fill-primary text-primary-foreground" />
										</CheckboxIndicator>
									</CheckboxRoot>
								))}
							</div>
						</div>

						<Separator />

						<div className="space-y-2">
							<h2 className="flex items-center justify-center gap-2 text-center font-medium text-foreground/50 text-lg sm:text-xl">
								<Icon className="h-5 w-5" icon="lucide:calendar" />
								Maturity Date
							</h2>
							<div className="flex justify-center">
								<DatePicker
									date={safeFilters.maturityDate}
									onDateChange={handleMaturityDateChange}
								/>
							</div>
						</div>
					</div>

					<DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
						<Button
							onClick={() => setIsOpen(false)}
							size="sm"
							variant="outline"
						>
							Close
						</Button>
						{hasActiveFilters && (
							<Button
								onClick={handleClearFilters}
								size="sm"
								variant="destructive"
							>
								<Icon className="mr-2" icon="lucide:x" />
								Clear Filters
							</Button>
						)}
						<Button onClick={() => setIsOpen(false)} size="sm">
							Apply
						</Button>
					</DialogFooter>
				</DialogContent>
			</TooltipProvider>
		</Dialog>
	);
}

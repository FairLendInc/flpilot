import { Card, CardContent } from "@heroui/react";
import { Icon } from "@iconify/react";
import { format, parseISO } from "date-fns";
import Image from "next/image";

type AsIfAppraisalData = {
	marketValue: number;
	method: string;
	company: string;
	date: string;
	description?: string;
	imageStorageIds?: string[];
	projectedCompletionDate?: string;
	cost?: number;
};

type AppraisalDataProps = {
	appraisal: {
		value: number;
		date: string;
		appraiser: string;
		method: string;
	};
	currentValue: number;
	asIfAppraisal?: AsIfAppraisalData | null;
};

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

const methodLabels: Record<string, string> = {
	comparative: "Comparative Market Analysis",
	income: "Income Approach",
	cost: "Cost Approach",
};

export function AppraisalData({
	appraisal,
	currentValue,
	asIfAppraisal,
}: AppraisalDataProps) {
	// Handle case where appraisal is undefined
	if (!appraisal) {
		return (
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<Icon className="h-6 w-6 text-foreground/40" icon="lucide:file-x" />
					<h2 className="font-bold text-2xl text-foreground/50">
						No Appraisal Data Available
					</h2>
				</div>
				<Card.Root>
					<CardContent className="p-8 text-center">
						<p className="text-foreground/50">
							No appraisal information available for this property.
						</p>
						<div className="mt-4 text-foreground/40 text-sm">
							Current Value: {formatCurrency(currentValue)}
						</div>
					</CardContent>
				</Card.Root>
			</div>
		);
	}

	const appraisalDate = parseISO(appraisal.date);
	const valueChange = currentValue - appraisal.value;
	const valueChangePercent = (valueChange / appraisal.value) * 100;
	const isPositiveChange = valueChange >= 0;

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<Icon className="h-6 w-6 text-primary" icon="lucide:file-check" />
				<h2 className="font-bold text-2xl">Appraisal Data</h2>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				{/* Appraised Value Card */}
				<Card.Root>
					<CardContent className="p-4">
						<div className="flex items-start gap-3">
							<div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
								<Icon className="h-5 w-5" icon="lucide:clipboard-check" />
							</div>
							<div className="flex-1">
								<p className="text-foreground/60 text-sm">Appraised Value</p>
								<p className="mt-1 font-bold text-3xl text-foreground">
									{formatCurrency(appraisal.value)}
								</p>
								<p className="mt-2 text-foreground/50 text-xs">
									As of {format(appraisalDate, "MMMM d, yyyy")}
								</p>
							</div>
						</div>
					</CardContent>
				</Card.Root>

				{/* Value Change Card */}
				<Card.Root>
					<CardContent className="p-4">
						<div className="flex items-start gap-3">
							<div
								className={`rounded-lg p-2 ${isPositiveChange ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}
							>
								<Icon
									className="h-5 w-5"
									icon={
										isPositiveChange
											? "lucide:trending-up"
											: "lucide:trending-down"
									}
								/>
							</div>
							<div className="flex-1">
								<p className="text-foreground/60 text-sm">Value Change</p>
								<p
									className={`mt-1 font-bold text-3xl ${isPositiveChange ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
								>
									{isPositiveChange ? "+" : ""}
									{formatCurrency(valueChange)}
								</p>
								<p className="mt-2 flex items-center gap-1 text-foreground/50 text-xs">
									<Icon
										className="h-3 w-3"
										icon={
											isPositiveChange ? "lucide:arrow-up" : "lucide:arrow-down"
										}
									/>
									{isPositiveChange ? "+" : ""}
									{valueChangePercent.toFixed(1)}% from appraisal
								</p>
							</div>
						</div>
					</CardContent>
				</Card.Root>

				{/* Appraisal Details Card - Spans full width */}
				<Card.Root className="md:col-span-2">
					<CardContent className="p-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="flex items-start gap-3">
								<Icon
									className="mt-0.5 h-5 w-5 text-foreground/50"
									icon="lucide:user"
								/>
								<div>
									<p className="font-medium text-foreground/60 text-sm">
										Appraiser
									</p>
									<p className="mt-1 text-foreground">{appraisal.appraiser}</p>
								</div>
							</div>

							<div className="flex items-start gap-3">
								<Icon
									className="mt-0.5 h-5 w-5 text-foreground/50"
									icon="lucide:clipboard-list"
								/>
								<div>
									<p className="font-medium text-foreground/60 text-sm">
										Method
									</p>
									<p className="mt-1 text-foreground">
										{methodLabels[appraisal.method] || appraisal.method}
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card.Root>
			</div>

			{/* As-If Appraisal Section - Only shown when asIfAppraisal exists */}
			{asIfAppraisal && (
				<div className="mt-8 space-y-4">
					<div className="flex items-center gap-2">
						<Icon className="h-6 w-6 text-blue-600" icon="lucide:compass" />
						<h2 className="font-bold text-2xl">As-If Complete Appraisal</h2>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						{/* As-If Market Value Card */}
						<Card.Root>
							<CardContent className="p-4">
								<div className="flex items-start gap-3">
									<div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
										<Icon className="h-5 w-5" icon="lucide:target" />
									</div>
									<div className="flex-1">
										<p className="text-foreground/60 text-sm">
											Projected Value
										</p>
										<p className="mt-1 font-bold text-3xl text-foreground">
											{formatCurrency(asIfAppraisal.marketValue)}
										</p>
										<p className="mt-2 text-foreground/50 text-xs">
											After improvements complete
										</p>
									</div>
								</div>
							</CardContent>
						</Card.Root>

						{/* Renovation Cost Card - Only if cost is provided */}
						{asIfAppraisal.cost && (
							<Card.Root>
								<CardContent className="p-4">
									<div className="flex items-start gap-3">
										<div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
											<Icon className="h-5 w-5" icon="lucide:hammer" />
										</div>
										<div className="flex-1">
											<p className="text-foreground/60 text-sm">
												Renovation Cost
											</p>
											<p className="mt-1 font-bold text-3xl text-foreground">
												{formatCurrency(asIfAppraisal.cost)}
											</p>
											{asIfAppraisal.projectedCompletionDate && (
												<p className="mt-2 text-foreground/50 text-xs">
													Est. completion:{" "}
													{format(
														parseISO(asIfAppraisal.projectedCompletionDate),
														"MMMM yyyy"
													)}
												</p>
											)}
										</div>
									</div>
								</CardContent>
							</Card.Root>
						)}

						{/* Renovation Description Card - Full width if description exists */}
						{asIfAppraisal.description && (
							<Card.Root className="md:col-span-2">
								<CardContent className="p-4">
									<div className="flex items-start gap-3">
										<Icon
											className="mt-0.5 h-5 w-5 text-foreground/50"
											icon="lucide:file-text"
										/>
										<div>
											<p className="font-medium text-foreground/60 text-sm">
												Renovation Details
											</p>
											<p className="mt-1 text-foreground">
												{asIfAppraisal.description}
											</p>
										</div>
									</div>
								</CardContent>
							</Card.Root>
						)}

						{/* Improvement Images Gallery - Only if images exist */}
						{asIfAppraisal.imageStorageIds &&
							asIfAppraisal.imageStorageIds.length > 0 && (
								<Card.Root className="md:col-span-2">
									<CardContent className="p-4">
										<div className="mb-3 flex items-center gap-2">
											<Icon
												className="h-5 w-5 text-foreground/50"
												icon="lucide:images"
											/>
											<p className="font-medium text-foreground/60 text-sm">
												Improvement Mockups
											</p>
										</div>
										<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
											{asIfAppraisal.imageStorageIds.map((storageId, index) => (
												<div
													className="relative aspect-square overflow-hidden rounded-lg border"
													key={storageId}
												>
													<Image
														alt={`Improvement mockup ${index + 1}`}
														className="object-cover"
														fill
														src={`/api/storage/${storageId}`}
													/>
												</div>
											))}
										</div>
									</CardContent>
								</Card.Root>
							)}
					</div>
				</div>
			)}
		</div>
	);
}

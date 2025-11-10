import { Card, CardContent, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { format, parseISO } from "date-fns";
import Image from "next/image";

type AppraisalComparable = {
	_id: string;
	address: {
		street: string;
		city: string;
		state: string;
		zip: string;
	};
	saleAmount: number;
	saleDate: string; // ISO date
	distance: number; // in miles
	squareFeet?: number;
	bedrooms?: number;
	bathrooms?: number;
	propertyType?: string;
	asIf?: boolean; // New: true for as-if complete appraisal comparables
	imageUrl: string;
};

type ComparablePropertiesProps = {
	comparables: AppraisalComparable[];
};

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

function formatDistance(miles: number): string {
	if (miles < 0.1) {
		return "< 0.1 mi";
	}
	return `${miles.toFixed(1)} mi`;
}

export function ComparableProperties({
	comparables,
}: ComparablePropertiesProps) {
	// Split comparables into as-is and as-if sections
	const asIsComparables = comparables.filter((comp) => !comp.asIf);
	const asIfComparables = comparables.filter((comp) => comp.asIf);

	// Hide section when no comparables
	if (comparables.length === 0) {
		return null;
	}

	return (
		<div className="space-y-8">
			<div className="flex items-center gap-2">
				<Icon className="h-6 w-6 text-primary" icon="lucide:file-text" />
				<h2 className="font-bold text-2xl">Appraisal Comparables</h2>
				<Chip>{comparables.length} properties</Chip>
			</div>

			<p className="text-foreground/60 text-sm">
				Recent sales of similar properties used in the appraisal analysis
			</p>

			{/* As-Is Appraisal Comparables Section */}
			{asIsComparables.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<Icon className="h-5 w-5 text-foreground/60" icon="lucide:home" />
						<h3 className="font-bold text-xl">As-Is Appraisal Comparables</h3>
						<Chip>{asIsComparables.length} properties</Chip>
					</div>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{asIsComparables.map((comp) => {
							const saleDate = parseISO(comp.saleDate);

							return (
								<Card.Root
									className="overflow-hidden transition-shadow hover:shadow-md"
									key={comp._id}
								>
									<CardContent className="p-0">
										{/* Property Image */}
										<div className="relative aspect-video w-full overflow-hidden rounded-lg">
											<Image
												alt={`${comp.address.street} - Comparable Property`}
												className="rounded-lg object-cover transition-transform hover:scale-110"
												fill
												sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
												src={comp.imageUrl}
											/>
											{/* Distance badge */}
											<div className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1 font-medium text-sm text-white backdrop-blur-sm">
												{formatDistance(comp.distance)}
											</div>
										</div>

										<div className="space-y-4 p-5">
											{/* Header: Sale Amount */}
											<div>
												<p className="font-bold text-2xl text-foreground">
													{formatCurrency(comp.saleAmount)}
												</p>
												<p className="text-foreground/50 text-sm">Sale Price</p>
											</div>

											{/* Address */}
											<div className="flex items-start gap-2 border-border border-t pt-3">
												<Icon
													className="mt-0.5 h-5 w-5 shrink-0 text-foreground/40"
													icon="lucide:map-pin"
												/>
												<div className="flex-1">
													<p className="font-medium text-foreground">
														{comp.address.street}
													</p>
													<p className="text-foreground/60 text-sm">
														{comp.address.city}, {comp.address.state}{" "}
														{comp.address.zip}
													</p>
												</div>
											</div>

											{/* Sale Date */}
											<div className="flex items-center gap-2 text-foreground/60 text-sm">
												<Icon className="h-4 w-4" icon="lucide:calendar" />
												<span>Sold: {format(saleDate, "MMMM d, yyyy")}</span>
											</div>

											{/* Property Details */}
											{(comp.squareFeet ||
												comp.bedrooms ||
												comp.bathrooms ||
												comp.propertyType) && (
												<div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-border border-t pt-3 text-foreground/60 text-sm">
													{comp.propertyType && (
														<div className="flex items-center gap-1.5">
															<Icon
																className="h-4 w-4"
																icon="lucide:building"
															/>
															<span>{comp.propertyType}</span>
														</div>
													)}
													{comp.squareFeet && (
														<div className="flex items-center gap-1.5">
															<Icon
																className="h-4 w-4"
																icon="lucide:maximize"
															/>
															<span>
																{comp.squareFeet.toLocaleString()} sq ft
															</span>
														</div>
													)}
													{comp.bedrooms && (
														<div className="flex items-center gap-1.5">
															<Icon className="h-4 w-4" icon="lucide:bed" />
															<span>{comp.bedrooms} bed</span>
														</div>
													)}
													{comp.bathrooms && (
														<div className="flex items-center gap-1.5">
															<Icon className="h-4 w-4" icon="lucide:bath" />
															<span>{comp.bathrooms} bath</span>
														</div>
													)}
												</div>
											)}
										</div>
									</CardContent>
								</Card.Root>
							);
						})}
					</div>
				</div>
			)}

			{/* As-If Complete Appraisal Comparables Section */}
			{asIfComparables.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<Icon
							className="h-5 w-5 text-foreground/60"
							icon="lucide:compass"
						/>
						<h3 className="font-bold text-xl">
							As-If Complete Appraisal Comparables
						</h3>
						<Chip>{asIfComparables.length} properties</Chip>
					</div>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{asIfComparables.map((comp) => {
							const saleDate = parseISO(comp.saleDate);

							return (
								<Card.Root
									className="overflow-hidden transition-shadow hover:shadow-md"
									key={comp._id}
								>
									<CardContent className="p-0">
										{/* Property Image */}
										<div className="relative aspect-video w-full overflow-hidden rounded-lg">
											<Image
												alt={`${comp.address.street} - Comparable Property`}
												className="rounded-lg object-cover transition-transform hover:scale-110"
												fill
												sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
												src={comp.imageUrl}
											/>
											{/* Distance badge */}
											<div className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1 font-medium text-sm text-white backdrop-blur-sm">
												{formatDistance(comp.distance)}
											</div>
										</div>

										<div className="space-y-4 p-5">
											{/* Header: Sale Amount */}
											<div>
												<p className="font-bold text-2xl text-foreground">
													{formatCurrency(comp.saleAmount)}
												</p>
												<p className="text-foreground/50 text-sm">Sale Price</p>
											</div>

											{/* Address */}
											<div className="flex items-start gap-2 border-border border-t pt-3">
												<Icon
													className="mt-0.5 h-5 w-5 shrink-0 text-foreground/40"
													icon="lucide:map-pin"
												/>
												<div className="flex-1">
													<p className="font-medium text-foreground">
														{comp.address.street}
													</p>
													<p className="text-foreground/60 text-sm">
														{comp.address.city}, {comp.address.state}{" "}
														{comp.address.zip}
													</p>
												</div>
											</div>

											{/* Sale Date */}
											<div className="flex items-center gap-2 text-foreground/60 text-sm">
												<Icon className="h-4 w-4" icon="lucide:calendar" />
												<span>Sold: {format(saleDate, "MMMM d, yyyy")}</span>
											</div>

											{/* Property Details */}
											{(comp.squareFeet ||
												comp.bedrooms ||
												comp.bathrooms ||
												comp.propertyType) && (
												<div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-border border-t pt-3 text-foreground/60 text-sm">
													{comp.propertyType && (
														<div className="flex items-center gap-1.5">
															<Icon
																className="h-4 w-4"
																icon="lucide:building"
															/>
															<span>{comp.propertyType}</span>
														</div>
													)}
													{comp.squareFeet && (
														<div className="flex items-center gap-1.5">
															<Icon
																className="h-4 w-4"
																icon="lucide:maximize"
															/>
															<span>
																{comp.squareFeet.toLocaleString()} sq ft
															</span>
														</div>
													)}
													{comp.bedrooms && (
														<div className="flex items-center gap-1.5">
															<Icon className="h-4 w-4" icon="lucide:bed" />
															<span>{comp.bedrooms} bed</span>
														</div>
													)}
													{comp.bathrooms && (
														<div className="flex items-center gap-1.5">
															<Icon className="h-4 w-4" icon="lucide:bath" />
															<span>{comp.bathrooms} bath</span>
														</div>
													)}
												</div>
											)}
										</div>
									</CardContent>
								</Card.Root>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}

"use client";

import { useAction, useConvexAuth } from "convex/react";
import {
	ArrowRight,
	Calendar,
	DollarSign,
	Home,
	Link2,
	Loader2,
	RefreshCw,
	User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuthenticatedQuery } from "@/convex/lib/client";

type UnlinkedSchedule = {
	scheduleId: number;
	customerId: number;
	customerName: string;
	customerEmail: string;
	amount: number;
	frequency: string;
	nextProcessDate?: string;
};

type AvailableMortgage = {
	_id: Id<"mortgages">;
	borrowerId: Id<"borrowers">;
	borrowerName: string;
	propertyAddress: string;
	loanAmount: number;
	monthlyInterestPayment: number;
	status: string;
};

export default function LinkSchedulesPage() {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();

	// State
	const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
	const [schedules, setSchedules] = useState<UnlinkedSchedule[]>([]);
	const [selectedSchedule, setSelectedSchedule] =
		useState<UnlinkedSchedule | null>(null);
	const [selectedMortgage, setSelectedMortgage] =
		useState<AvailableMortgage | null>(null);
	const [triggerBackfill, setTriggerBackfill] = useState(true);
	const [isLinking, setIsLinking] = useState(false);

	// Actions
	const getUnlinkedSchedules = useAction(api.rotessaAdmin.getUnlinkedSchedules);
	const linkSchedule = useAction(api.rotessaAdmin.linkScheduleToMortgage);

	// Query for available mortgages
	const availableMortgages = useAuthenticatedQuery(
		api.mortgages.getMortgagesWithoutSchedule,
		{}
	);

	// Fetch unlinked schedules
	const fetchSchedules = async () => {
		setIsLoadingSchedules(true);
		try {
			const result = await getUnlinkedSchedules({});
			if (result.success && result.data) {
				setSchedules(result.data);
			} else if ("error" in result) {
				toast.error("Failed to fetch schedules", {
					description: result.error,
				});
			}
		} catch (error) {
			toast.error("Failed to fetch schedules", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setIsLoadingSchedules(false);
		}
	};

	// Load on first render
	useState(() => {
		fetchSchedules();
	});

	// Handle linking
	const handleLink = async () => {
		if (!selectedSchedule || !selectedMortgage) return;

		setIsLinking(true);
		try {
			const result = await linkSchedule({
				mortgageId: selectedMortgage._id,
				scheduleId: selectedSchedule.scheduleId,
				triggerBackfill,
			});

			if (result.success) {
				toast.success("Schedule linked successfully", {
					description: result.backfillScheduled
						? "Historical payment backfill has been scheduled"
						: undefined,
				});

				if (result.borrowerMismatch) {
					toast.warning("Borrower mismatch detected", {
						description:
							"The Rotessa customer may not match the mortgage borrower",
					});
				}

				// Clear selections and refresh
				setSelectedSchedule(null);
				setSelectedMortgage(null);
				await fetchSchedules();
			} else if ("error" in result) {
				toast.error("Failed to link schedule", {
					description: result.error,
				});
			}
		} catch (error) {
			toast.error("Failed to link schedule", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setIsLinking(false);
		}
	};

	// Format currency
	const formatCurrency = (amount: number) =>
		new Intl.NumberFormat("en-CA", {
			style: "currency",
			currency: "CAD",
		}).format(amount);

	// Loading states
	if (authLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground">Authentication required</p>
			</div>
		);
	}

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Link Rotessa Schedules</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				{/* Instructions */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base">How it works</CardTitle>
						<CardDescription>
							Select a Rotessa schedule and a mortgage to link them. Historical
							payments will be backfilled to the ledger with correct settlement
							dates.
						</CardDescription>
					</CardHeader>
				</Card>

				{/* Two-panel layout */}
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					{/* Left panel: Unlinked Schedules */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-3">
							<div>
								<CardTitle className="text-base">
									Unlinked Schedules ({schedules.length})
								</CardTitle>
								<CardDescription>
									Rotessa schedules not linked to any mortgage
								</CardDescription>
							</div>
							<Button
								disabled={isLoadingSchedules}
								onClick={fetchSchedules}
								size="sm"
								variant="outline"
							>
								{isLoadingSchedules ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<RefreshCw className="h-4 w-4" />
								)}
							</Button>
						</CardHeader>
						<CardContent>
							<div className="max-h-[400px] space-y-2 overflow-y-auto">
								{isLoadingSchedules ? (
									<div className="flex items-center justify-center py-8">
										<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
									</div>
								) : schedules.length === 0 ? (
									<p className="py-8 text-center text-muted-foreground text-sm">
										No unlinked schedules found
									</p>
								) : (
									schedules.map((schedule) => (
										<button
											className={`w-full rounded-lg border p-3 text-left transition-colors ${
												selectedSchedule?.scheduleId === schedule.scheduleId
													? "border-primary bg-primary/5"
													: "hover:bg-muted/50"
											}`}
											key={schedule.scheduleId}
											onClick={() => setSelectedSchedule(schedule)}
											type="button"
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<User className="h-4 w-4 text-muted-foreground" />
													<span className="font-medium">
														{schedule.customerName}
													</span>
												</div>
												<span className="font-semibold">
													{formatCurrency(schedule.amount)}
												</span>
											</div>
											<div className="mt-1 flex items-center gap-4 text-muted-foreground text-sm">
												<span>{schedule.frequency}</span>
												{schedule.nextProcessDate && (
													<span className="flex items-center gap-1">
														<Calendar className="h-3 w-3" />
														{schedule.nextProcessDate}
													</span>
												)}
											</div>
											<div className="mt-1 truncate text-muted-foreground text-xs">
												{schedule.customerEmail}
											</div>
										</button>
									))
								)}
							</div>
						</CardContent>
					</Card>

					{/* Right panel: Available Mortgages */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-base">
								Available Mortgages ({availableMortgages?.length ?? 0})
							</CardTitle>
							<CardDescription>
								Mortgages without a linked Rotessa schedule
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="max-h-[400px] space-y-2 overflow-y-auto">
								{!availableMortgages ? (
									<div className="flex items-center justify-center py-8">
										<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
									</div>
								) : availableMortgages.length === 0 ? (
									<p className="py-8 text-center text-muted-foreground text-sm">
										No mortgages without schedules
									</p>
								) : (
									availableMortgages.map((mortgage) => (
										<button
											className={`w-full rounded-lg border p-3 text-left transition-colors ${
												selectedMortgage?._id === mortgage._id
													? "border-primary bg-primary/5"
													: "hover:bg-muted/50"
											}`}
											key={mortgage._id}
											onClick={() => setSelectedMortgage(mortgage)}
											type="button"
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<Home className="h-4 w-4 text-muted-foreground" />
													<span className="font-medium">
														{mortgage.borrowerName}
													</span>
												</div>
												<span className="font-semibold">
													{formatCurrency(mortgage.loanAmount)}
												</span>
											</div>
											<div className="mt-1 truncate text-muted-foreground text-sm">
												{mortgage.propertyAddress}
											</div>
											<div className="mt-1 flex items-center gap-1 text-muted-foreground text-xs">
												<DollarSign className="h-3 w-3" />
												{formatCurrency(mortgage.monthlyInterestPayment)}/month
											</div>
										</button>
									))
								)}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Link action */}
				<Card>
					<CardContent className="pt-6">
						<div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
							<div className="flex flex-1 items-center gap-4">
								{/* Selection summary */}
								<div className="flex items-center gap-2 text-sm">
									{selectedSchedule ? (
										<span className="rounded bg-muted px-2 py-1">
											{selectedSchedule.customerName} -{" "}
											{formatCurrency(selectedSchedule.amount)}{" "}
											{selectedSchedule.frequency}
										</span>
									) : (
										<span className="text-muted-foreground">
											Select a schedule
										</span>
									)}
								</div>
								<ArrowRight className="h-4 w-4 text-muted-foreground" />
								<div className="flex items-center gap-2 text-sm">
									{selectedMortgage ? (
										<span className="rounded bg-muted px-2 py-1">
											{selectedMortgage.borrowerName} -{" "}
											{selectedMortgage.propertyAddress.split(",")[0]}
										</span>
									) : (
										<span className="text-muted-foreground">
											Select a mortgage
										</span>
									)}
								</div>
							</div>

							<div className="flex items-center gap-4">
								{/* Backfill checkbox */}
								<div className="flex items-center space-x-2">
									<Checkbox
										checked={triggerBackfill}
										id="backfill"
										onCheckedChange={(checked) =>
											setTriggerBackfill(checked === true)
										}
									/>
									<Label className="text-sm" htmlFor="backfill">
										Backfill historical payments
									</Label>
								</div>

								{/* Link button */}
								<Button
									disabled={!selectedSchedule || !selectedMortgage || isLinking}
									onClick={handleLink}
								>
									{isLinking ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<Link2 className="mr-2 h-4 w-4" />
									)}
									Link Schedule
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</>
	);
}

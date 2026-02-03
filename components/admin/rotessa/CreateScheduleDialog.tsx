"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Id } from "@/convex/_generated/dataModel";

const frequencyOptions = [
	{ value: "Once", label: "One-time" },
	{ value: "Weekly", label: "Weekly" },
	{ value: "Every Other Week", label: "Bi-weekly" },
	{ value: "Monthly", label: "Monthly" },
	{ value: "Every Other Month", label: "Every 2 months" },
	{ value: "Quarterly", label: "Quarterly" },
	{ value: "Semi-Annually", label: "Semi-annually" },
	{ value: "Yearly", label: "Yearly" },
] as const;

const createScheduleSchema = z.object({
	amount: z.string().refine(
		(val) => {
			const num = Number.parseFloat(val);
			return !Number.isNaN(num) && num > 0;
		},
		{ message: "Amount must be a positive number" }
	),
	frequency: z.enum([
		"Once",
		"Weekly",
		"Every Other Week",
		"Monthly",
		"Every Other Month",
		"Quarterly",
		"Semi-Annually",
		"Yearly",
	] as const),
	processDate: z.string().min(1, "Process date is required"),
	installments: z.string().optional(),
	comment: z.string().optional(),
	linkToMortgage: z.boolean(),
	mortgageId: z.string().optional(),
});

type CreateScheduleFormData = z.infer<typeof createScheduleSchema>;

type MortgageOption = {
	_id: Id<"mortgages">;
	borrowerId: Id<"borrowers">;
	borrowerName: string;
	propertyAddress: string;
	loanAmount: number;
	monthlyInterestPayment: number;
};

type CreateScheduleDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	customerId: number;
	customerName: string;
	onSubmit: (
		data: Omit<CreateScheduleFormData, "amount" | "installments"> & {
			amount: number;
			installments?: number;
		}
	) => Promise<void>;
	availableMortgages?: MortgageOption[];
};

export function CreateScheduleDialog({
	open,
	onOpenChange,
	customerId,
	customerName,
	onSubmit,
	availableMortgages = [],
}: CreateScheduleDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Default to tomorrow's date
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const defaultDate = tomorrow.toISOString().split("T")[0];

	const form = useForm<CreateScheduleFormData>({
		resolver: zodResolver(createScheduleSchema),
		defaultValues: {
			amount: "",
			frequency: "Monthly",
			processDate: defaultDate,
			installments: "",
			comment: "",
			linkToMortgage: false,
			mortgageId: "",
		},
	});

	const watchLinkToMortgage = form.watch("linkToMortgage");
	const watchMortgageId = form.watch("mortgageId");

	// Auto-fill amount when mortgage is selected
	const _selectedMortgage = availableMortgages.find(
		(m) => m._id === watchMortgageId
	);

	const handleMortgageSelect = (mortgageId: string) => {
		form.setValue("mortgageId", mortgageId);
		const mortgage = availableMortgages.find((m) => m._id === mortgageId);
		if (mortgage) {
			form.setValue("amount", mortgage.monthlyInterestPayment.toFixed(2));
			form.setValue(
				"comment",
				`Monthly payment for ${mortgage.propertyAddress}`
			);
		}
	};

	const handleSubmit = async (data: CreateScheduleFormData) => {
		setIsSubmitting(true);
		try {
			await onSubmit({
				...data,
				amount: Number.parseFloat(data.amount),
				installments: data.installments
					? Number.parseInt(data.installments, 10)
					: undefined,
			});
			form.reset();
			onOpenChange(false);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Create Transaction Schedule</DialogTitle>
					<DialogDescription>
						Create a new payment schedule for {customerName} (ID: {customerId})
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						className="space-y-4"
						onSubmit={form.handleSubmit(handleSubmit)}
					>
						{/* Link to Mortgage */}
						{availableMortgages.length > 0 && (
							<FormField
								control={form.control}
								name="linkToMortgage"
								render={({ field }) => (
									<FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<div className="space-y-1 leading-none">
											<FormLabel>Link to mortgage</FormLabel>
											<FormDescription>
												Auto-fill from an existing mortgage
											</FormDescription>
										</div>
									</FormItem>
								)}
							/>
						)}

						{watchLinkToMortgage && availableMortgages.length > 0 && (
							<FormField
								control={form.control}
								name="mortgageId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Select Mortgage</FormLabel>
										<Select
											onValueChange={handleMortgageSelect}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a mortgage..." />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{availableMortgages.map((mortgage) => (
													<SelectItem key={mortgage._id} value={mortgage._id}>
														<div className="flex flex-col">
															<span>{mortgage.propertyAddress}</span>
															<span className="text-muted-foreground text-xs">
																{mortgage.borrowerName} - $
																{mortgage.monthlyInterestPayment.toFixed(2)}/mo
															</span>
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{/* Amount */}
						<FormField
							control={form.control}
							name="amount"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Amount (CAD)</FormLabel>
									<FormControl>
										<div className="relative">
											<span className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground">
												$
											</span>
											<Input
												className="pl-7"
												placeholder="1500.00"
												type="text"
												{...field}
											/>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Frequency */}
						<FormField
							control={form.control}
							name="frequency"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Frequency</FormLabel>
									<Select
										defaultValue={field.value}
										onValueChange={field.onChange}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{frequencyOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Process Date */}
						<FormField
							control={form.control}
							name="processDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>First Process Date</FormLabel>
									<FormControl>
										<div className="relative">
											<Calendar className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
											<Input className="pl-10" type="date" {...field} />
										</div>
									</FormControl>
									<FormDescription>
										When the first payment should be processed
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Installments */}
						<FormField
							control={form.control}
							name="installments"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Installments (Optional)</FormLabel>
									<FormControl>
										<Input
											placeholder="Leave empty for ongoing"
											type="number"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Number of payments, or leave empty for indefinite
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Comment */}
						<FormField
							control={form.control}
							name="comment"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Comment (Optional)</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Monthly mortgage payment..."
											rows={2}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								onClick={() => onOpenChange(false)}
								type="button"
								variant="outline"
							>
								Cancel
							</Button>
							<Button disabled={isSubmitting} type="submit">
								{isSubmitting && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Create Schedule
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

"use client";

import {
	Button,
	Description,
	FieldError,
	FieldGroup,
	Fieldset,
	Form,
	Input,
	Label,
	Surface,
	TextField,
} from "@heroui/react";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface MortgageUpdateFormProps {
	mortgageId: Id<"mortgages">;
	onSuccess?: () => void;
}

const MORTGAGE_STATUS_OPTIONS = [
	{ key: "active", label: "Active" },
	{ key: "renewed", label: "Renewed" },
	{ key: "closed", label: "Closed" },
	{ key: "defaulted", label: "Defaulted" },
] as const;

const MORTGAGE_TYPE_OPTIONS = [
	{ key: "1st", label: "First Position" },
	{ key: "2nd", label: "Second Position" },
	{ key: "other", label: "Other" },
] as const;

export function MortgageUpdateForm({
	mortgageId,
	onSuccess,
}: MortgageUpdateFormProps) {
	const mortgage = useQuery(api.mortgages.getMortgage, { id: mortgageId });
	const updateMortgage = useMutation(api.mortgages.updateMortgage);
	const [loanAmount, setLoanAmount] = useState("");
	const [interestRate, setInterestRate] = useState("");
	const [status, setStatus] = useState<string>("");
	const [mortgageType, setMortgageType] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Initialize form fields from mortgage data
	useEffect(() => {
		if (mortgage) {
			if (loanAmount === "") {
				setLoanAmount(String(mortgage.loanAmount));
			}
			if (interestRate === "") {
				setInterestRate(String(mortgage.interestRate));
			}
			if (status === "" && mortgage.status) {
				setStatus(mortgage.status);
			}
			if (mortgageType === "" && mortgage.mortgageType) {
				setMortgageType(mortgage.mortgageType);
			}
		}
	}, [mortgage, loanAmount, interestRate, status, mortgageType]);

	if (!mortgage) {
		return (
			<div className="flex items-center justify-center py-12">
				<p className="text-muted-foreground text-sm">Loading mortgage...</p>
			</div>
		);
	}

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setIsSubmitting(true);

		try {
			const updates: {
				id: Id<"mortgages">;
				loanAmount?: number;
				interestRate?: number;
				status?: "active" | "renewed" | "closed" | "defaulted";
				mortgageType?: "1st" | "2nd" | "other";
			} = {
				id: mortgageId,
			};

			if (loanAmount !== String(mortgage.loanAmount)) {
				updates.loanAmount = Number(loanAmount);
			}
			if (interestRate !== String(mortgage.interestRate)) {
				updates.interestRate = Number(interestRate);
			}
			if (status !== mortgage.status) {
				updates.status = status as "active" | "renewed" | "closed" | "defaulted";
			}
			if (mortgageType !== mortgage.mortgageType) {
				updates.mortgageType = mortgageType as "1st" | "2nd" | "other";
			}

			await updateMortgage(updates);
			toast.success("Mortgage updated successfully");
			onSuccess?.();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unable to update mortgage";
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Form onSubmit={handleSubmit} className="space-y-6">
			<Surface className="flex flex-col gap-3 rounded-3xl p-6" variant="default">
				<Fieldset.Root>
					<Fieldset.Legend className="text-foreground/70">
						Mortgage Details
					</Fieldset.Legend>
					<Description className="text-foreground/50">
						Update mortgage loan details and status.
					</Description>
					<FieldGroup className="grid gap-x-4 md:grid-cols-2">
						<TextField name="loanAmount">
							<Label>Loan Amount</Label>
							<Input
								className="placeholder:text-foreground/50"
								onChange={(e) => setLoanAmount(e.target.value)}
								placeholder="450000"
								type="number"
								value={loanAmount}
							/>
							<FieldError />
						</TextField>
						<TextField name="interestRate">
							<Label>Interest Rate (%)</Label>
							<Input
								className="placeholder:text-foreground/50"
								onChange={(e) => setInterestRate(e.target.value)}
								placeholder="5.25"
								type="number"
								value={interestRate}
							/>
							<FieldError />
						</TextField>
						<div>
							<Label>Status</Label>
							<Select onValueChange={setStatus} value={status}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select mortgage status" />
								</SelectTrigger>
								<SelectContent>
									{MORTGAGE_STATUS_OPTIONS.map((option) => (
										<SelectItem key={option.key} value={String(option.key)}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Mortgage Type</Label>
							<Select onValueChange={setMortgageType} value={mortgageType}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select mortgage type" />
								</SelectTrigger>
								<SelectContent>
									{MORTGAGE_TYPE_OPTIONS.map((option) => (
										<SelectItem key={option.key} value={String(option.key)}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</FieldGroup>
					<Fieldset.Actions>
						<Button isDisabled={isSubmitting} type="submit" variant="primary">
							{isSubmitting ? "Updating…" : "Update Mortgage"}
						</Button>
					</Fieldset.Actions>
				</Fieldset.Root>
			</Surface>
		</Form>
	);
}


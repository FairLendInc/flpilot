"use client";

import { useQuery } from "convex/react";
import { Building2, CheckCircle2, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/convex/_generated/api";

type BrokerSelectionStepProps = {
	busy: boolean;
	onContinue: (brokerCode?: string) => Promise<void>;
};

export function BrokerSelectionStep({
	busy,
	onContinue,
}: BrokerSelectionStepProps) {
	const [brokerCode, setBrokerCode] = useState("");
	const [validatedBroker, setValidatedBroker] = useState<{
		_id: string;
		brandName: string;
		subdomain: string;
		branding: {
			logoStorageId?: string;
			primaryColor?: string;
			secondaryColor?: string;
		};
	} | null>(null);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [validating, setValidating] = useState(false);

	// Use a state to trigger the query
	const [codeToValidate, setCodeToValidate] = useState<string | null>(null);

	const validationResult = useQuery(
		api.brokers.codes.validateBrokerCode,
		codeToValidate ? { code: codeToValidate } : "skip"
	);

	// Handle validation result
	if (validating && validationResult) {
		if (validationResult.valid) {
			setValidatedBroker(validationResult.broker);
			setValidationError(null);
		} else {
			setValidationError(validationResult.error);
			setValidatedBroker(null);
		}
		setValidating(false);
		setCodeToValidate(null);
	}

	const handleValidateCode = () => {
		if (!brokerCode.trim()) {
			setValidationError(null);
			setValidatedBroker(null);
			return;
		}

		setValidating(true);
		setValidationError(null);
		setCodeToValidate(brokerCode.trim());
	};

	const handleContinue = async () => {
		// If no code entered, proceed with FairLend (no broker code)
		// If code entered and validated, proceed with that broker
		// If code entered but not validated, show error
		if (brokerCode.trim() && !validatedBroker) {
			setValidationError(
				"Please enter a valid broker code or leave empty for FairLend"
			);
			return;
		}

		await onContinue(brokerCode.trim() || undefined);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Choose Your Broker</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-4">
					<div>
						<Label htmlFor="brokerCode">Broker Code (Optional)</Label>
						<div className="mt-1.5 flex gap-2">
							<Input
								disabled={busy || validating}
								id="brokerCode"
								onBlur={handleValidateCode}
								onChange={(e) => {
									setBrokerCode(e.target.value);
									setValidatedBroker(null);
									setValidationError(null);
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleValidateCode();
									}
								}}
								placeholder="Enter broker code (e.g., ABC123)"
								value={brokerCode}
							/>
							<Button
								disabled={!brokerCode.trim() || validating || busy}
								onClick={handleValidateCode}
								type="button"
								variant="secondary"
							>
								{validating ? <Spinner className="size-4" /> : "Validate"}
							</Button>
						</div>
						<p className="mt-1.5 text-muted-foreground text-xs">
							Leave empty to join under FairLend Direct
						</p>
					</div>

					{validationError && (
						<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-destructive text-sm">
							{validationError}
						</div>
					)}

					{validatedBroker && (
						<div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
							<div className="flex items-start gap-3">
								<div className="rounded-full bg-primary/10 p-2">
									<Building2 className="size-5 text-primary" />
								</div>
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<h4 className="font-medium">{validatedBroker.brandName}</h4>
										<CheckCircle2 className="size-4 text-green-500" />
									</div>
									<p className="text-muted-foreground text-sm">
										{validatedBroker.subdomain}.flpilot.com
									</p>
								</div>
							</div>
						</div>
					)}

					{!(brokerCode.trim() || validatedBroker) && (
						<div className="rounded-lg border bg-muted/50 p-4">
							<div className="flex items-start gap-3">
								<div className="rounded-full bg-primary/10 p-2">
									<User className="size-5 text-primary" />
								</div>
								<div>
									<h4 className="font-medium">FairLend Direct</h4>
									<p className="text-muted-foreground text-sm">
										Invest directly with FairLend. You will have access to all
										available listings and will work with our team directly.
									</p>
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="flex justify-end">
					<Button
						disabled={busy || validating}
						onClick={handleContinue}
						size="lg"
						type="button"
					>
						{busy ? (
							<>
								<Spinner className="mr-2 size-4" />
								Saving...
							</>
						) : (
							"Continue"
						)}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

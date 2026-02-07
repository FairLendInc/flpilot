"use client";

import { useQuery } from "convex/react";
import {
	ArrowRight,
	Building2,
	CheckCircle2,
	Shield,
	User,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/convex/_generated/api";

// Design System: FairLend Investor Onboarding
// Style: Glassmorphism with dark tech theme
// Colors: Primary #F59E0B, Secondary #FBBF24, CTA #8B5CF6, Background #0F172A, Text #F8FAFC

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

	const [codeToValidate, setCodeToValidate] = useState<string | null>(null);

	const validationResult = useQuery(
		api.brokers.codes.validateBrokerCode,
		codeToValidate ? { code: codeToValidate } : "skip"
	);

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
		if (brokerCode.trim() && !validatedBroker) {
			setValidationError(
				"Please enter a valid broker code or leave empty for FairLend"
			);
			return;
		}

		await onContinue(brokerCode.trim() || undefined);
	};

	return (
		<Card className="border-[#F59E0B]/20 bg-[#0F172A] shadow-xl">
			<CardHeader className="border-[#F59E0B]/10 border-b">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8B5CF6]/20">
						<Shield className="h-5 w-5 text-[#8B5CF6]" />
					</div>
					<div>
						<CardTitle className="text-[#F8FAFC]">Choose Your Broker</CardTitle>
						<p className="text-[#F8FAFC]/60 text-sm">
							Select who you will invest with
						</p>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-6 pt-6">
				<div className="space-y-4">
					<div>
						<Label className="text-[#F8FAFC]" htmlFor="brokerCode">
							Broker Code (Optional)
						</Label>
						<div className="mt-1.5 flex gap-2">
							<Input
								className="border-[#F59E0B]/30 bg-[#0F172A] text-[#F8FAFC] placeholder:text-[#F8FAFC]/40 focus:border-[#F59E0B] focus:ring-[#F59E0B]/20"
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
								className="border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B]/10"
								disabled={!brokerCode.trim() || validating || busy}
								onClick={handleValidateCode}
								type="button"
								variant="outline"
							>
								{validating ? <Spinner className="h-4 w-4" /> : "Validate"}
							</Button>
						</div>
						<p className="mt-1.5 text-[#F8FAFC]/50 text-xs">
							Leave empty to invest directly with FairLend
						</p>
					</div>

					{validationError && (
						<div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-400 text-sm">
							{validationError}
						</div>
					)}

					{validatedBroker && (
						<div className="rounded-lg border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 p-4">
							<div className="flex items-start gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8B5CF6]/20">
									<Building2 className="h-5 w-5 text-[#8B5CF6]" />
								</div>
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<h4 className="font-medium text-[#F8FAFC]">
											{validatedBroker.brandName}
										</h4>
										<CheckCircle2 className="h-4 w-4 text-green-400" />
									</div>
									<p className="text-[#F8FAFC]/60 text-sm">
										{validatedBroker.subdomain}.flpilot.com
									</p>
								</div>
							</div>
						</div>
					)}

					{!(brokerCode.trim() || validatedBroker) && (
						<div className="rounded-lg border border-[#F59E0B]/20 bg-[#F59E0B]/5 p-4">
							<div className="flex items-start gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F59E0B]/20">
									<User className="h-5 w-5 text-[#F59E0B]" />
								</div>
								<div>
									<h4 className="font-medium text-[#F8FAFC]">
										FairLend Direct
									</h4>
									<p className="text-[#F8FAFC]/60 text-sm">
										Invest directly with FairLend. Access all available listings
										and work with our team directly.
									</p>
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="flex justify-end">
					<Button
						className="bg-[#8B5CF6] text-white hover:bg-[#8B5CF6]/90"
						disabled={busy || validating}
						onClick={handleContinue}
						size="lg"
						type="button"
					>
						{busy ? (
							<>
								<Spinner className="mr-2 h-4 w-4" />
								Saving...
							</>
						) : (
							<>
								Continue
								<ArrowRight className="ml-2 h-4 w-4" />
							</>
						)}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

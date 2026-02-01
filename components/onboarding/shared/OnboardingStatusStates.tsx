import { AlertTriangle } from "lucide-react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { OnboardingCard } from "./OnboardingCard";

export function PendingAdminState() {
	return (
		<OnboardingCard className="border-dashed">
			<CardHeader>
				<CardTitle>Hang tight!</CardTitle>
			</CardHeader>
			<CardContent className="flex items-center gap-3 text-muted-foreground text-sm">
				<Spinner className="size-4" />
				Your onboarding is waiting for an admin. We'll email you as soon as it's
				approved.
			</CardContent>
		</OnboardingCard>
	);
}

export function RejectedState({
	decision,
}: {
	decision?: {
		decidedAt?: string;
		decidedBy?: string;
		decisionSource?: "admin" | "system";
		notes?: string;
	};
}) {
	return (
		<OnboardingCard className="border-destructive/50">
			<CardHeader>
				<CardTitle>Onboarding requires changes</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="flex items-start gap-3 text-muted-foreground text-sm">
					<AlertTriangle className="mt-1 size-5 text-destructive" />
					<div>
						<p className="font-medium">We couldn't approve this submission.</p>
						<p>Please email support@fairlend.com with the reference below.</p>
					</div>
				</div>
				{decision?.notes ? (
					<p className="rounded border bg-muted/40 p-3 text-sm">
						{decision.notes}
					</p>
				) : null}
			</CardContent>
		</OnboardingCard>
	);
}

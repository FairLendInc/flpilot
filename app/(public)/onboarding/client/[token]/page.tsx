"use client";

import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientOnboardingPage() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Building2 className="h-6 w-6" />
						Under Construction
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">
						The client onboarding portal is currently under development. Please
						contact your broker for onboarding assistance.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

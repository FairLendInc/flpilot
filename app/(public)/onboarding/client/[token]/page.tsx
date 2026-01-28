"use client";

import { useQuery } from "convex/react";
import { Building2, CheckCircle, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";

export default function ClientOnboardingPage() {
	const params = useParams();
	const _router = useRouter();
	const token = params.token as string;

	const [activeTab, setActiveTab] = useState("profile");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");

	const invite = useQuery(api.brokers.clients.getClientByInviteToken, {
		token,
	});

	if (!invite) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Building2 className="h-6 w-6" />
							Invalid Invitation
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground">
							This invitation link is invalid or has expired.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
			<Card className="w-full max-w-lg">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Building2 className="h-6 w-6" />
						Complete Your Profile
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Tabs onValueChange={setActiveTab} value={activeTab}>
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="profile">
								<User className="mr-2 h-4 w-4" />
								Profile
							</TabsTrigger>
							<TabsTrigger value="filters">Settings</TabsTrigger>
							<TabsTrigger value="review">
								<CheckCircle className="mr-2 h-4 w-4" />
								Review
							</TabsTrigger>
						</TabsList>

						<TabsContent className="space-y-4" value="profile">
							<div className="space-y-2">
								<Label>First Name</Label>
								<Input
									onChange={(e) => setFirstName(e.target.value)}
									placeholder="John"
									value={firstName}
								/>
							</div>
							<div className="space-y-2">
								<Label>Last Name</Label>
								<Input
									onChange={(e) => setLastName(e.target.value)}
									placeholder="Doe"
									value={lastName}
								/>
							</div>
							<Button
								className="w-full"
								disabled={!(firstName && lastName)}
								onClick={() => setActiveTab("filters")}
							>
								Continue
							</Button>
						</TabsContent>

						<TabsContent value="filters">
							<div className="space-y-4">
								<p className="text-muted-foreground text-sm">
									Your broker has configured the following filters for you:
								</p>
								<div className="rounded-lg border p-4">
									<p className="font-medium">Filter Configuration</p>
									<p className="text-muted-foreground text-sm">
										Risk Profile: {invite.filters.values.riskProfile}
									</p>
								</div>
								<Button
									className="w-full"
									onClick={() => setActiveTab("review")}
								>
									Continue to Review
								</Button>
							</div>
						</TabsContent>

						<TabsContent value="review">
							<div className="space-y-4">
								<div className="rounded-lg border p-4">
									<p className="font-medium">Profile Summary</p>
									<p className="text-muted-foreground text-sm">
										{firstName} {lastName}
									</p>
								</div>
								<Button className="w-full">Submit for Approval</Button>
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}

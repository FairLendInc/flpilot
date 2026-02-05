"use client";

import { useConvexAuth, useMutation } from "convex/react";
import { ArrowLeft, Check, Mail, Settings, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";

export default function ClientOnboardPage() {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
	const router = useRouter();
	const [activeTab, setActiveTab] = useState("invite");
	const [email, setEmail] = useState("");
	const [clientName, setClientName] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const createClient = useMutation(api.brokers.clients.createClientOnboarding);

	if (authLoading) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<div className="text-center">Loading...</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		router.push("/sign-in");
		return null;
	}

	const handleSendInvite = async () => {
		if (!email?.includes("@")) {
			toast.error("Please enter a valid email address");
			return;
		}

		setIsSubmitting(true);
		try {
			await createClient({
				clientEmail: email,
				clientName: clientName || "New Client",
				filters: {
					constraints: {},
					values: {
						propertyTypes: [],
						locations: [],
						riskProfile: "balanced",
					},
				},
			});
			toast.success("Invitation sent successfully!");
			setEmail("");
			setClientName("");
			router.push("/dashboard/broker/clients");
		} catch (error) {
			toast.error("Failed to send invitation");
			console.error(error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<Button asChild size="sm" variant="ghost">
					<Link href="/dashboard/broker/clients">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Clients
					</Link>
				</Button>
				<Separator className="mx-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Onboard New Client</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
					<TabsList className="grid w-full max-w-md grid-cols-3">
						<TabsTrigger value="invite">
							<Mail className="mr-2 h-4 w-4" />
							Invite
						</TabsTrigger>
						<TabsTrigger value="filters">
							<Settings className="mr-2 h-4 w-4" />
							Filters
						</TabsTrigger>
						<TabsTrigger value="review">
							<Check className="mr-2 h-4 w-4" />
							Review
						</TabsTrigger>
					</TabsList>

					<TabsContent className="mt-6" value="invite">
						<Card className="max-w-md">
							<CardHeader>
								<CardTitle>Invite Client</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="clientName">Client Name</Label>
									<Input
										id="clientName"
										onChange={(e) => setClientName(e.target.value)}
										placeholder="John Doe"
										type="text"
										value={clientName}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="email">Client Email Address</Label>
									<Input
										id="email"
										onChange={(e) => setEmail(e.target.value)}
										placeholder="client@example.com"
										type="email"
										value={email}
									/>
									<p className="text-muted-foreground text-sm">
										An invitation email will be sent to this address with a
										unique signup link.
									</p>
								</div>
								<Button
									className="w-full"
									disabled={!(email?.includes("@") && clientName?.trim())}
									onClick={() => setActiveTab("filters")}
								>
									Continue to Filter Configuration
								</Button>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent className="mt-6" value="filters">
						<Card>
							<CardHeader>
								<CardTitle>Configure Listing Filters</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Filter configuration will be implemented here. You will be
									able to set:
								</p>
								<ul className="mt-4 list-disc pl-5 text-muted-foreground text-sm">
									<li>LTV constraints (min/max)</li>
									<li>Loan amount constraints</li>
									<li>Interest rate constraints</li>
									<li>Allowed property types</li>
									<li>Allowed locations</li>
									<li>Risk profile settings</li>
								</ul>
								<div className="mt-6 flex gap-4">
									<Button
										onClick={() => setActiveTab("invite")}
										variant="outline"
									>
										Back
									</Button>
									<Button onClick={() => setActiveTab("review")}>
										Continue to Review
									</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent className="mt-6" value="review">
						<Card>
							<CardHeader>
								<CardTitle>Review & Send Invite</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="rounded-lg border p-4">
									<h4 className="font-medium">Client Name</h4>
									<p className="text-muted-foreground">
										{clientName || "Not provided"}
									</p>
								</div>
								<div className="rounded-lg border p-4">
									<h4 className="font-medium">Client Email</h4>
									<p className="text-muted-foreground">
										{email || "Not provided"}
									</p>
								</div>
								<div className="rounded-lg border p-4">
									<h4 className="font-medium">Filter Configuration</h4>
									<p className="text-muted-foreground">Default constraints:</p>
									<ul className="mt-1 ml-4 list-disc text-muted-foreground">
										<li>Property Types: All</li>
										<li>Locations: All</li>
										<li>Risk Profile: Balanced</li>
									</ul>
								</div>

								<div className="flex gap-4">
									<Button
										onClick={() => setActiveTab("filters")}
										variant="outline"
									>
										Back
									</Button>
									<Button
										disabled={isSubmitting || !email || !clientName?.trim()}
										onClick={handleSendInvite}
									>
										<UserPlus className="mr-2 h-4 w-4" />
										{isSubmitting ? "Sending..." : "Send Invitation"}
									</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</>
	);
}

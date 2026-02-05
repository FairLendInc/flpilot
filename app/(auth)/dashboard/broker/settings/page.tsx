"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ArrowLeft, Palette, Save, Settings, User } from "lucide-react";
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

export default function BrokerSettingsPage() {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
	const router = useRouter();

	const broker = useQuery(api.brokers.management.getBrokerByUserId, {});
	const updateBroker = useMutation(
		api.brokers.management.updateBrokerConfiguration
	);

	const [brandName, setBrandName] = useState(broker?.subdomain || "");

	const _isLoading = authLoading || !broker;

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

	const handleSave = async () => {
		if (!broker) {
			toast.error("Broker not found");
			return;
		}
		try {
			await updateBroker({
				brokerId: broker._id,
				branding: {
					...broker.branding,
				},
			});
			toast.success("Settings saved");
		} catch (_error) {
			toast.error("Failed to save settings");
		}
	};

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<Button asChild size="sm" variant="ghost">
					<Link href="/dashboard/broker">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back
					</Link>
				</Button>
				<Separator className="mx-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Settings</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<Tabs defaultValue="profile">
					<TabsList>
						<TabsTrigger value="profile">
							<User className="mr-2 h-4 w-4" />
							Profile
						</TabsTrigger>
						<TabsTrigger value="branding">
							<Palette className="mr-2 h-4 w-4" />
							Branding
						</TabsTrigger>
						<TabsTrigger value="commission">
							<Settings className="mr-2 h-4 w-4" />
							Commission
						</TabsTrigger>
					</TabsList>

					<TabsContent className="mt-6" value="profile">
						<Card className="max-w-md">
							<CardHeader>
								<CardTitle>Profile Settings</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label>Brand Name</Label>
									<Input
										onChange={(e) => setBrandName(e.target.value)}
										placeholder="Your Brokerage Name"
										value={brandName}
									/>
								</div>
								<Button onClick={handleSave}>
									<Save className="mr-2 h-4 w-4" />
									Save Changes
								</Button>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent className="mt-6" value="branding">
						<Card>
							<CardHeader>
								<CardTitle>Branding Settings</CardTitle>
							</CardHeader>
							<CardContent>
								<Button asChild>
									<Link href="/dashboard/broker/settings/branding">
										<Palette className="mr-2 h-4 w-4" />
										Configure Branding
									</Link>
								</Button>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent className="mt-6" value="commission">
						<Card className="max-w-md">
							<CardHeader>
								<CardTitle>Commission Settings</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label>Commission Rate</Label>
									<Input
										disabled
										readOnly
										value={broker?.commission?.ratePercentage || 0}
									/>
									<p className="text-muted-foreground text-sm">
										Managed by FairLend
									</p>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</>
	);
}

"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ArrowLeft, Image, Palette, Save } from "lucide-react";
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
import { api } from "@/convex/_generated/api";

export default function BrandingSettingsPage() {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
	const router = useRouter();

	const broker = useQuery(api.brokers.management.getBrokerByUserId, {});
	const updateBroker = useMutation(
		api.brokers.management.updateBrokerConfiguration
	);

	const [primaryColor, setPrimaryColor] = useState(
		broker?.branding?.primaryColor || "#F59E0B"
	);
	const [secondaryColor, setSecondaryColor] = useState(
		broker?.branding?.secondaryColor || "#FBBF24"
	);
	// brandName is stored as local state only for display purposes
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
					primaryColor,
					secondaryColor,
				},
			});
			toast.success("Branding settings saved");
		} catch (_error) {
			toast.error("Failed to save branding");
		}
	};

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<Button asChild size="sm" variant="ghost">
					<Link href="/dashboard/broker/settings">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back
					</Link>
				</Button>
				<Separator className="mx-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Branding Configuration</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<div className="grid gap-6 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center">
								<Palette className="mr-2 h-5 w-5" />
								Colors
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label>Primary Color</Label>
								<div className="flex gap-2">
									<Input
										className="h-10 w-20"
										onChange={(e) => setPrimaryColor(e.target.value)}
										type="color"
										value={primaryColor}
									/>
									<Input
										onChange={(e) => setPrimaryColor(e.target.value)}
										placeholder="#F59E0B"
										value={primaryColor}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label>Secondary Color</Label>
								<div className="flex gap-2">
									<Input
										className="h-10 w-20"
										onChange={(e) => setSecondaryColor(e.target.value)}
										type="color"
										value={secondaryColor}
									/>
									<Input
										onChange={(e) => setSecondaryColor(e.target.value)}
										placeholder="#FBBF24"
										value={secondaryColor}
									/>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center">
								<Image className="mr-2 h-5 w-5" />
								Logo & Brand
							</CardTitle>
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

							<div className="space-y-2">
								<Label>Logo Upload</Label>
								<div className="rounded-lg border-2 border-dashed p-8 text-center">
									<p className="text-muted-foreground text-sm">
										Logo upload coming soon
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Preview</CardTitle>
					</CardHeader>
					<CardContent>
						<div
							className="rounded-lg p-6"
							style={{ backgroundColor: primaryColor }}
						>
							<h3 className="font-bold text-2xl text-white">
								{brandName || broker?.subdomain || "Your Brand"}
							</h3>
							<p className="mt-2 text-white/80">
								{broker?.subdomain}.flpilot.com
							</p>
						</div>
					</CardContent>
				</Card>

				<div className="flex justify-end">
					<Button onClick={handleSave}>
						<Save className="mr-2 h-4 w-4" />
						Save Branding
					</Button>
				</div>
			</div>
		</>
	);
}

"use client";

import { Archive, CheckCircle2, Send, UserX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ClientDetailPage({
	params,
}: {
	params: { id: string };
}) {
	console.log(params);
	const [kycVerified, setKycVerified] = useState(false);
	const [ltvValue, setLtvValue] = useState([70]);
	const [loanAmount, setLoanAmount] = useState([500000]);
	const [selectedLoanTypes, setSelectedLoanTypes] = useState<string[]>([]);

	const handleAttest = () => {
		setKycVerified(true);
		toast.success("KYC Verified", {
			description: "Client has been successfully verified.",
		});
	};

	const handleSendOTP = () => {
		if (!kycVerified) {
			toast.error("Verification Required", {
				description: "Please verify KYC before sending sign-in code.",
			});
			return;
		}
		toast.success("Sign-In Code Sent", {
			description: "One-time password has been sent to the client.",
		});
	};

	const handleSaveFilters = () => {
		toast.success("Filters Saved", {
			description: "Client filter preferences have been updated.",
		});
	};

	const loanTypes = ["Residential", "Commercial", "Investment", "Refinance"];

	const toggleLoanType = (type: string) => {
		setSelectedLoanTypes((prev) =>
			prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
		);
	};

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Client Details</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<Tabs className="w-full" defaultValue="profile">
					<TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
						<TabsTrigger value="profile">Profile</TabsTrigger>
						<TabsTrigger value="compliance">Compliance</TabsTrigger>
						<TabsTrigger value="filters">Filters</TabsTrigger>
					</TabsList>

					{/* Profile Tab */}
					<TabsContent className="space-y-4" value="profile">
						<Card>
							<CardHeader>
								<CardTitle>Client Information</CardTitle>
								<CardDescription>View and edit client details</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-4 sm:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="name">Full Name</Label>
										<Input defaultValue="John Smith" id="name" />
									</div>
									<div className="space-y-2">
										<Label htmlFor="email">Email</Label>
										<Input
											defaultValue="john.smith@example.com"
											id="email"
											type="email"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="phone">Phone</Label>
										<Input
											defaultValue="+1 (555) 123-4567"
											id="phone"
											type="tel"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="tags">Tags</Label>
										<Input defaultValue="Premium, Verified" id="tags" />
									</div>
								</div>
								<div className="flex justify-end">
									<Button>Save Changes</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Compliance Tab */}
					<TabsContent className="space-y-4" value="compliance">
						<Card>
							<CardHeader>
								<CardTitle>KYC Verification</CardTitle>
								<CardDescription>
									Verify client identity and compliance
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center justify-between rounded-lg border p-4">
									<div className="space-y-1">
										<p className="font-medium">KYC Status</p>
										<p className="text-muted-foreground text-sm">
											Client identity verification
										</p>
									</div>
									{kycVerified ? (
										<Badge className="gap-1">
											<CheckCircle2 className="h-3 w-3" />
											Verified
										</Badge>
									) : (
										<Button onClick={handleAttest}>Attest</Button>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="kyc-id">KYC ID</Label>
									<Input defaultValue="KYC-2024-001234" disabled id="kyc-id" />
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Filters Tab */}
					<TabsContent className="space-y-4" value="filters">
						<Card>
							<CardHeader>
								<CardTitle>Investment Filters</CardTitle>
								<CardDescription>
									Configure client investment preferences
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="space-y-4">
									<div className="space-y-2">
										<Label>Loan-to-Value Ratio (LTV)</Label>
										<div className="flex items-center gap-4">
											<Slider
												className="flex-1"
												max={100}
												onValueChange={setLtvValue}
												step={5}
												value={ltvValue}
											/>
											<span className="w-12 font-medium text-sm">
												{ltvValue}%
											</span>
										</div>
									</div>

									<div className="space-y-2">
										<Label>Loan Amount</Label>
										<div className="flex items-center gap-4">
											<Slider
												className="flex-1"
												max={2000000}
												onValueChange={setLoanAmount}
												step={50000}
												value={loanAmount}
											/>
											<span className="w-24 font-medium text-sm">
												${loanAmount.toLocaleString()}
											</span>
										</div>
									</div>

									<div className="space-y-3">
										<Label>Loan Types</Label>
										<div className="space-y-2">
											{loanTypes.map((type) => (
												<div className="flex items-center space-x-2" key={type}>
													<Checkbox
														checked={selectedLoanTypes.includes(type)}
														id={type}
														onCheckedChange={() => toggleLoanType(type)}
													/>
													<label
														className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
														htmlFor={type}
													>
														{type}
													</label>
												</div>
											))}
										</div>
									</div>

									{selectedLoanTypes.length > 0 && (
										<div className="flex flex-wrap gap-2">
											{selectedLoanTypes.map((type) => (
												<Badge key={type} variant="secondary">
													{type}
												</Badge>
											))}
										</div>
									)}
								</div>

								<div className="flex justify-end">
									<Button onClick={handleSaveFilters}>Save Filters</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* Actions Card */}
				<Card>
					<CardHeader>
						<CardTitle>Client Actions</CardTitle>
						<CardDescription>Manage client account and access</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-wrap gap-3">
						<Button disabled={!kycVerified} onClick={handleSendOTP}>
							<Send className="mr-2 h-4 w-4" />
							Send Sign-In Code
						</Button>
						<Button variant="outline">
							<UserX className="mr-2 h-4 w-4" />
							Suspend Account
						</Button>
						<Button variant="outline">
							<Archive className="mr-2 h-4 w-4" />
							Archive Client
						</Button>
					</CardContent>
				</Card>
			</div>
		</>
	);
}

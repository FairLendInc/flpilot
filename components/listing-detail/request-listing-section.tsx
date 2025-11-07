"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import {
	Building2,
	Check,
	ChevronsUpDown,
	FileText,
	Lock,
	Mail,
	User,
} from "lucide-react";
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
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

// Mock lawyer data
const MOCK_LAWYERS = [
	{ id: "1", name: "Sarah Chen", lsoNumber: "12345" },
	{ id: "2", name: "Michael Rodriguez", lsoNumber: "23456" },
	{ id: "3", name: "Jennifer Thompson", lsoNumber: "34567" },
	{ id: "4", name: "David Kim", lsoNumber: "45678" },
	{ id: "5", name: "Emily Watson", lsoNumber: "56789" },
	{ id: "6", name: "Robert Foster", lsoNumber: "67890" },
	{ id: "7", name: "Amanda Liu", lsoNumber: "78901" },
	{ id: "8", name: "James Patterson", lsoNumber: "89012" },
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RequestListingSectionProps = {
	listing: {
		title: string;
		address: {
			street: string;
			city: string;
			state: string;
			zip: string;
		};
		financials: {
			currentValue: number;
		};
	};
	listingId: Id<"listings">;
	isLocked: boolean; // Preloaded lock status from server
};

export function RequestListingSection({
	listing,
	listingId,
	isLocked,
}: RequestListingSectionProps) {
	const { user } = useAuth();

	// Form state
	const [selectedLawyer, setSelectedLawyer] = useState<string>("");
	const [lawyerLSONumber, setLawyerLSONumber] = useState("");
	const [lawyerEmail, setLawyerEmail] = useState("");
	const [disclosureAccepted, setDisclosureAccepted] = useState(false);
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Get mutation hook
	const createRequest = useMutation(api.lockRequests.createLockRequest);

	// Get display name for user
	const displayName = user
		? [user.firstName, user.lastName].filter(Boolean).join(" ") ||
			user.email ||
			"User"
		: "Guest User";
	const userEmail = user?.email ?? "";

	// Find selected lawyer data
	// const selectedLawyerData = MOCK_LAWYERS.find(
	// 	(lawyer) => lawyer.name === selectedLawyer
	// );

	// Form validation
	const isFormValid =
		selectedLawyer.trim() !== "" &&
		lawyerLSONumber.trim() !== "" &&
		lawyerEmail.trim() !== "" &&
		disclosureAccepted &&
		emailRegex.test(lawyerEmail); // Basic email validation

	// Handle form submission
	const handleSubmit = async () => {
		if (!isFormValid || isSubmitting || isLocked) return;

		setIsSubmitting(true);
		try {
			const requestId = await createRequest({
				listingId,
				requestNotes: undefined, // No notes field in this form
				lawyerName: selectedLawyer,
				lawyerLSONumber,
				lawyerEmail,
			});

			// Verify mutation returned a valid requestId
			if (!requestId) {
				throw new Error("Request creation failed: no ID returned");
			}

			toast.success("Listing Request Submitted!", {
				description: `Your request for ${listing.title} has been successfully submitted. We'll notify you once it's processed.`,
				duration: 5000,
			});

			// Reset form
			setSelectedLawyer("");
			setLawyerLSONumber("");
			setLawyerEmail("");
			setDisclosureAccepted(false);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to submit request";
			console.error("Lock request creation error:", error);
			toast.error("Request failed", {
				description: errorMessage,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	// Show locked message if listing is locked
	if (isLocked) {
		return (
			<div className="mb-12">
				<Card>
					<CardHeader>
						<CardTitle className="text-2xl">Listing Locked</CardTitle>
						<CardDescription className="text-base">
							This listing has been locked and is no longer available for new
							requests.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Badge className="gap-2" variant="destructive">
							<Lock className="h-3 w-3" />
							Listing is locked
						</Badge>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="mb-12">
			<Card>
				<CardHeader>
					<CardTitle className="text-2xl">Request This Listing</CardTitle>
					<CardDescription className="text-base">
						Submit your request with lawyer information to proceed with this
						investment opportunity.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-8 lg:grid-cols-2">
						{/* Left Column - Form */}
						<div className="space-y-6">
							{/* Recommended Lawyers Autocomplete */}
							<div className="space-y-2">
								<Label htmlFor="lawyer-search">Recommended Lawyers</Label>
								<Popover onOpenChange={setIsPopoverOpen} open={isPopoverOpen}>
									<PopoverTrigger asChild>
										<Button
											aria-expanded={isPopoverOpen}
											className="w-full justify-between"
											id="lawyer-search"
											role="combobox"
											variant="outline"
										>
											{selectedLawyer || "Select a lawyer..."}
											<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
										</Button>
									</PopoverTrigger>
									<PopoverContent align="start" className="w-full p-0">
										<Command>
											<CommandInput placeholder="Search lawyers..." />
											<CommandList>
												<CommandEmpty>No lawyer found.</CommandEmpty>
												<CommandGroup>
													{MOCK_LAWYERS.map((lawyer) => (
														<CommandItem
															key={lawyer.id}
															onSelect={(currentValue) => {
																setSelectedLawyer(
																	currentValue === selectedLawyer
																		? ""
																		: currentValue
																);
																setLawyerLSONumber(lawyer.lsoNumber);
																setIsPopoverOpen(false);
															}}
															value={lawyer.name}
														>
															<Check
																className={cn(
																	"mr-2 h-4 w-4",
																	selectedLawyer === lawyer.name
																		? "opacity-100"
																		: "opacity-0"
																)}
															/>
															<div className="flex flex-col">
																<span>{lawyer.name}</span>
																<span className="text-muted-foreground text-xs">
																	LSO: {lawyer.lsoNumber}
																</span>
															</div>
														</CommandItem>
													))}
												</CommandGroup>
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>
							</div>

							{/* Lawyer LSO Number */}
							<div className="space-y-2">
								<Label htmlFor="lso-number">Lawyer LSO Number</Label>
								<Input
									id="lso-number"
									onChange={(e) => setLawyerLSONumber(e.target.value)}
									placeholder="Enter LSO number"
									type="text"
									value={lawyerLSONumber}
								/>
							</div>

							{/* Lawyer Email */}
							<div className="space-y-2">
								<Label htmlFor="lawyer-email">Lawyer Email</Label>
								<Input
									id="lawyer-email"
									onChange={(e) => setLawyerEmail(e.target.value)}
									placeholder="lawyer@example.com"
									type="email"
									value={lawyerEmail}
								/>
							</div>

							{/* Disclosure Policy Checkbox */}
							<div className="space-y-2">
								<Label>Disclosure Policy</Label>
								<motion.div
									className={cn(
										"relative cursor-pointer rounded-xl border-2 p-4 transition-colors",
										disclosureAccepted
											? "border-primary bg-primary/5"
											: "border-border bg-background hover:bg-muted/50"
									)}
									onClick={() => setDisclosureAccepted(!disclosureAccepted)}
									transition={{ type: "spring", stiffness: 300, damping: 20 }}
									whileHover={{ scale: 1.01 }}
									whileTap={{ scale: 0.99 }}
								>
									<div className="flex items-start space-x-3">
										<div
											className={cn(
												"mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
												disclosureAccepted
													? "border-primary bg-primary"
													: "border-muted-foreground bg-background"
											)}
										>
											{disclosureAccepted && (
												<motion.div
													animate={{ scale: 1 }}
													initial={{ scale: 0 }}
													transition={{
														type: "spring",
														stiffness: 500,
														damping: 20,
													}}
												>
													<Check className="h-3 w-3 text-primary-foreground" />
												</motion.div>
											)}
										</div>
										<div className="flex-1">
											<p className="font-medium">
												I agree to the disclosure policy
											</p>
											<p className="mt-1 text-muted-foreground text-sm">
												I confirm that all information provided is accurate and
												I have read and understood the investment disclosure
												policy and terms of service.
											</p>
										</div>
									</div>
								</motion.div>
							</div>
						</div>

						{/* Right Column - Preview */}
						<div className="h-fit lg:sticky lg:top-8">
							<Card>
								<CardHeader>
									<CardTitle>Request Summary</CardTitle>
									<CardDescription>
										Review your information before submitting
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									{/* User Information */}
									<div className="space-y-3">
										<div className="flex items-center space-x-2 font-medium text-sm">
											<User className="h-4 w-4 text-muted-foreground" />
											<span>Your Information</span>
										</div>
										<div className="ml-6 space-y-1.5 text-sm">
											<div>
												<span className="text-muted-foreground">Name:</span>{" "}
												<span className="font-medium">{displayName}</span>
											</div>
											<div>
												<span className="text-muted-foreground">Email:</span>{" "}
												<span className="font-medium">{userEmail}</span>
											</div>
										</div>
									</div>

									{/* Listing Information */}
									<div className="space-y-3">
										<div className="flex items-center space-x-2 font-medium text-sm">
											<Building2 className="h-4 w-4 text-muted-foreground" />
											<span>Property Details</span>
										</div>
										<div className="ml-6 space-y-1.5 text-sm">
											<div>
												<span className="text-muted-foreground">Title:</span>{" "}
												<span className="font-medium">{listing.title}</span>
											</div>
											<div>
												<span className="text-muted-foreground">Address:</span>{" "}
												<span className="font-medium">
													{listing.address.street}, {listing.address.city},{" "}
													{listing.address.state}
												</span>
											</div>
											<div>
												<span className="text-muted-foreground">Value:</span>{" "}
												<span className="font-medium">
													${listing.financials.currentValue.toLocaleString()}
												</span>
											</div>
										</div>
									</div>

									{/* Lawyer Information */}
									<div className="space-y-3">
										<div className="flex items-center space-x-2 font-medium text-sm">
											<FileText className="h-4 w-4 text-muted-foreground" />
											<span>Legal Representative</span>
										</div>
										<div className="ml-6 space-y-1.5 text-sm">
											{selectedLawyer ? (
												<>
													<div>
														<span className="text-muted-foreground">
															Lawyer:
														</span>{" "}
														<span className="font-medium">
															{selectedLawyer}
														</span>
													</div>
													<div>
														<span className="text-muted-foreground">
															LSO Number:
														</span>{" "}
														<span className="font-medium">
															{lawyerLSONumber || "Not provided"}
														</span>
													</div>
													<div className="flex items-center space-x-1">
														<Mail className="h-3 w-3 text-muted-foreground" />
														<span className="font-medium">
															{lawyerEmail || "Not provided"}
														</span>
													</div>
												</>
											) : (
												<div className="text-muted-foreground italic">
													No lawyer selected
												</div>
											)}
										</div>
									</div>

									{/* Submit Button */}
									<Button
										className="w-full"
										disabled={!isFormValid || isSubmitting || isLocked}
										onClick={handleSubmit}
										size="lg"
									>
										{isSubmitting ? "Submitting..." : "Request Listing"}
									</Button>
								</CardContent>
							</Card>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

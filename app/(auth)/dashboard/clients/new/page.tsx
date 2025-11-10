"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function NewClientPage() {
	const router = useRouter();
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
		tags: "",
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		toast.success("Client Added", {
			description: `${formData.name} has been successfully added.`,
		});
		router.push("/dashboard/clients");
	};

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<Button asChild size="icon" variant="ghost">
					<Link href="/dashboard/clients">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<h1 className="font-semibold text-lg">Add New Client</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<Card className="mx-auto w-full max-w-2xl">
					<CardHeader>
						<CardTitle>Client Information</CardTitle>
						<CardDescription>
							Enter the details for the new client
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form className="space-y-4" onSubmit={handleSubmit}>
							<div className="space-y-2">
								<Label htmlFor="name">Full Name *</Label>
								<Input
									id="name"
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									placeholder="John Smith"
									required
									value={formData.name}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="email">Email *</Label>
								<Input
									id="email"
									onChange={(e) =>
										setFormData({ ...formData, email: e.target.value })
									}
									placeholder="john.smith@example.com"
									required
									type="email"
									value={formData.email}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="phone">Phone</Label>
								<Input
									id="phone"
									onChange={(e) =>
										setFormData({ ...formData, phone: e.target.value })
									}
									placeholder="+1 (555) 123-4567"
									type="tel"
									value={formData.phone}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="tags">Tags</Label>
								<Input
									id="tags"
									onChange={(e) =>
										setFormData({ ...formData, tags: e.target.value })
									}
									placeholder="Premium, New Client"
									value={formData.tags}
								/>
								<p className="text-muted-foreground text-xs">
									Separate multiple tags with commas
								</p>
							</div>

							<div className="flex justify-end gap-3 pt-4">
								<Button asChild type="button" variant="outline">
									<Link href="/dashboard/clients">Cancel</Link>
								</Button>
								<Button type="submit">Add Client</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</>
	);
}

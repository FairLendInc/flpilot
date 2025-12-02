"use client";

import { MoreVertical, Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

// Sample data
const clients = [
	{
		id: "1",
		name: "John Smith",
		email: "john.smith@example.com",
		status: "Active",
		lastLogin: "2024-01-15",
		tags: ["Premium", "Verified"],
	},
	{
		id: "2",
		name: "Sarah Johnson",
		email: "sarah.j@example.com",
		status: "Active",
		lastLogin: "2024-01-14",
		tags: ["Standard"],
	},
	{
		id: "3",
		name: "Michael Brown",
		email: "m.brown@example.com",
		status: "Pending",
		lastLogin: "Never",
		tags: ["New"],
	},
];

export default function ClientsPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	return (
		<>
			<header className="mt-4 flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Clients</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<Card>
					<CardHeader>
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<CardTitle>Client List</CardTitle>
							<Button asChild>
								<Link href="/dashboard/clients/new">
									<UserPlus className="mr-2 h-4 w-4" />
									Add Client
								</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{/* Search and Filter */}
						<div className="mb-6 flex flex-col gap-4 sm:flex-row">
							<div className="relative flex-1">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									className="pl-9"
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search clients..."
									value={searchQuery}
								/>
							</div>
							<Select onValueChange={setStatusFilter} value={statusFilter}>
								<SelectTrigger className="w-full sm:w-[180px]">
									<SelectValue placeholder="Filter by status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="pending">Pending</SelectItem>
									<SelectItem value="suspended">Suspended</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Table */}
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Last Login</TableHead>
										<TableHead>Tags</TableHead>
										<TableHead className="w-[50px]" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{clients.map((client) => (
										<TableRow key={client.id}>
											<TableCell className="font-medium">
												<Link
													className="hover:underline"
													href={`/dashboard/clients/${client.id}`}
												>
													{client.name}
												</Link>
											</TableCell>
											<TableCell>{client.email}</TableCell>
											<TableCell>
												<Badge
													variant={
														client.status === "Active" ? "default" : "secondary"
													}
												>
													{client.status}
												</Badge>
											</TableCell>
											<TableCell className="text-muted-foreground">
												{client.lastLogin}
											</TableCell>
											<TableCell>
												<div className="flex gap-1">
													{client.tags.map((tag) => (
														<Badge key={tag} variant="outline">
															{tag}
														</Badge>
													))}
												</div>
											</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button size="icon" variant="ghost">
															<MoreVertical className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem asChild>
															<Link href={`/dashboard/clients/${client.id}`}>
																View Details
															</Link>
														</DropdownMenuItem>
														<DropdownMenuItem>Edit</DropdownMenuItem>
														<DropdownMenuItem className="text-destructive">
															Suspend
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			</div>
		</>
	);
}

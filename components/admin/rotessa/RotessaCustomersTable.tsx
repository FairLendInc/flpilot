"use client";

import {
	Building2,
	Calendar,
	Eye,
	Link,
	Loader2,
	MoreHorizontal,
	RefreshCw,
	Search,
	User,
	UserPlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export type RotessaCustomer = {
	id: number;
	name: string;
	email: string;
	customerType?: "Personal" | "Business";
	customIdentifier?: string;
	active?: boolean;
	transactionSchedules?: Array<{
		id: number;
		amount: number | string;
		frequency: string;
	}>;
	linkedBorrowerId?: string;
};

type RotessaCustomersTableProps = {
	customers: RotessaCustomer[];
	isLoading: boolean;
	onRefresh: () => void;
	onViewDetail: (customerId: number) => void;
	onCreateCustomer: () => void;
	onCreateSchedule: (customerId: number) => void;
	onSyncToConvex: (customerId: number) => Promise<void>;
};

export function RotessaCustomersTable({
	customers,
	isLoading,
	onRefresh,
	onViewDetail,
	onCreateCustomer,
	onCreateSchedule,
	onSyncToConvex,
}: RotessaCustomersTableProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [syncingCustomers, setSyncingCustomers] = useState<Set<number>>(
		new Set()
	);

	const filteredCustomers = customers.filter((customer) => {
		if (!searchQuery) return true;
		const query = searchQuery.toLowerCase();
		return (
			customer.name.toLowerCase().includes(query) ||
			customer.email.toLowerCase().includes(query) ||
			customer.customIdentifier?.toLowerCase().includes(query)
		);
	});

	const handleSync = async (customerId: number) => {
		setSyncingCustomers((prev) => new Set(prev).add(customerId));
		try {
			await onSyncToConvex(customerId);
			toast.success("Customer synced to Convex");
		} catch (error) {
			toast.error("Failed to sync customer", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setSyncingCustomers((prev) => {
				const next = new Set(prev);
				next.delete(customerId);
				return next;
			});
		}
	};

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<div className="relative">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							className="w-[300px] pl-10"
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by name, email, or ID..."
							value={searchQuery}
						/>
					</div>
					<Button
						disabled={isLoading}
						onClick={onRefresh}
						size="sm"
						variant="outline"
					>
						{isLoading ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<RefreshCw className="mr-2 h-4 w-4" />
						)}
						Refresh
					</Button>
				</div>
				<Button onClick={onCreateCustomer}>
					<UserPlus className="mr-2 h-4 w-4" />
					Create Customer
				</Button>
			</div>

			{/* Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[50px]">ID</TableHead>
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Custom ID</TableHead>
							<TableHead className="text-center">Schedules</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell className="text-center" colSpan={8}>
									<div className="flex items-center justify-center py-8">
										<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
									</div>
								</TableCell>
							</TableRow>
						) : filteredCustomers.length === 0 ? (
							<TableRow>
								<TableCell
									className="text-center text-muted-foreground"
									colSpan={8}
								>
									{searchQuery
										? "No customers match your search"
										: "No Rotessa customers found"}
								</TableCell>
							</TableRow>
						) : (
							filteredCustomers.map((customer) => (
								<TableRow key={customer.id}>
									<TableCell className="font-mono text-xs">
										{customer.id}
									</TableCell>
									<TableCell className="font-medium">{customer.name}</TableCell>
									<TableCell>{customer.email}</TableCell>
									<TableCell>
										{customer.customerType === "Business" ? (
											<div className="flex items-center gap-1">
												<Building2 className="h-3.5 w-3.5 text-muted-foreground" />
												<span className="text-sm">Business</span>
											</div>
										) : (
											<div className="flex items-center gap-1">
												<User className="h-3.5 w-3.5 text-muted-foreground" />
												<span className="text-sm">Personal</span>
											</div>
										)}
									</TableCell>
									<TableCell>
										<span className="font-mono text-xs">
											{customer.customIdentifier || "-"}
										</span>
									</TableCell>
									<TableCell className="text-center">
										<Badge variant="secondary">
											{customer.transactionSchedules?.length ?? 0}
										</Badge>
									</TableCell>
									<TableCell>
										{customer.linkedBorrowerId ? (
											<Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
												<Link className="mr-1 h-3 w-3" />
												Linked
											</Badge>
										) : customer.active ? (
											<Badge variant="outline">Active</Badge>
										) : (
											<Badge variant="secondary">Inactive</Badge>
										)}
									</TableCell>
									<TableCell className="text-right">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button size="icon" variant="ghost">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={() => onViewDetail(customer.id)}
												>
													<Eye className="mr-2 h-4 w-4" />
													View Details
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => onCreateSchedule(customer.id)}
												>
													<Calendar className="mr-2 h-4 w-4" />
													Create Schedule
												</DropdownMenuItem>
												<DropdownMenuItem
													disabled={syncingCustomers.has(customer.id)}
													onClick={() => handleSync(customer.id)}
												>
													{syncingCustomers.has(customer.id) ? (
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													) : (
														<RefreshCw className="mr-2 h-4 w-4" />
													)}
													Sync to Convex
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Footer */}
			<div className="flex items-center justify-between text-muted-foreground text-sm">
				<span>
					Showing {filteredCustomers.length} of {customers.length} customers
				</span>
			</div>
		</div>
	);
}

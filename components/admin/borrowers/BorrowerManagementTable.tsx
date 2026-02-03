"use client";

import {
	ChevronDown,
	ChevronRight,
	ChevronUp,
	Eye,
	Filter,
	MoreHorizontal,
	RefreshCw,
	Search,
	UserPlus,
	X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
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
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import {
	type BorrowerStatus,
	BorrowerStatusBadge,
} from "./BorrowerStatusBadge";
import { type RotessaStatus, RotessaStatusIcon } from "./RotessaStatusIcon";

export type BorrowerData = {
	_id: Id<"borrowers">;
	name: string;
	email: string;
	phone?: string;
	status: BorrowerStatus;
	rotessaCustomerId?: string;
	rotessaStatus: RotessaStatus;
	userId?: Id<"users">;
	createdAt?: string;
};

type SortColumn = "name" | "email" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

type BorrowerManagementTableProps = {
	borrowers: BorrowerData[];
	onViewDetail: (borrowerId: Id<"borrowers">) => void;
	onEdit: (borrowerId: Id<"borrowers">) => void;
	onLinkUser?: (borrowerId: Id<"borrowers">) => void;
	onSyncRotessa?: (borrowerId: Id<"borrowers">) => void;
	onSuspend?: (borrowerId: Id<"borrowers">) => void;
	onInvite?: () => void;
	isLoading?: boolean;
};

function SortButton({
	column,
	currentColumn,
	direction,
	onClick,
}: {
	column: SortColumn;
	currentColumn: SortColumn | null;
	direction: SortDirection | null;
	onClick: () => void;
}) {
	const isActive = currentColumn === column;
	let Icon = ChevronRight;
	if (isActive) {
		Icon = direction === "desc" ? ChevronDown : ChevronUp;
	}

	return (
		<Button
			aria-label={`Sort by ${column}`}
			className="h-6 w-6 p-0"
			onClick={onClick}
			size="sm"
			variant="ghost"
		>
			<Icon
				className={cn(
					"h-4 w-4 transition-colors",
					isActive ? "text-foreground" : "text-muted-foreground/50"
				)}
			/>
		</Button>
	);
}

export function BorrowerManagementTable({
	borrowers,
	onViewDetail,
	onEdit,
	onLinkUser,
	onSyncRotessa,
	onSuspend,
	onInvite,
	isLoading,
}: BorrowerManagementTableProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
	const [sortDirection, setSortDirection] = useState<SortDirection | null>(
		null
	);

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	const toggleSort = (column: SortColumn) => {
		if (sortColumn === column) {
			if (sortDirection === "asc") {
				setSortDirection("desc");
			} else if (sortDirection === "desc") {
				setSortColumn(null);
				setSortDirection(null);
			}
		} else {
			setSortColumn(column);
			setSortDirection("asc");
		}
	};

	const filteredAndSorted = useMemo(() => {
		let result = borrowers;

		// Search filter
		if (debouncedSearch.trim()) {
			const query = debouncedSearch.toLowerCase();
			result = result.filter(
				(b) =>
					b.name.toLowerCase().includes(query) ||
					b.email.toLowerCase().includes(query) ||
					b.phone?.toLowerCase().includes(query)
			);
		}

		// Sort
		if (sortColumn && sortDirection) {
			result = [...result].sort((a, b) => {
				let aVal: string | undefined;
				let bVal: string | undefined;

				switch (sortColumn) {
					case "name":
						aVal = a.name;
						bVal = b.name;
						break;
					case "email":
						aVal = a.email;
						bVal = b.email;
						break;
					case "status":
						aVal = a.status;
						bVal = b.status;
						break;
					case "createdAt":
						aVal = a.createdAt;
						bVal = b.createdAt;
						break;
					default:
						// No-op for unknown columns
						break;
				}

				if (!(aVal || bVal)) return 0;
				if (!aVal) return 1;
				if (!bVal) return -1;

				const cmp = aVal.localeCompare(bVal);
				return sortDirection === "desc" ? -cmp : cmp;
			});
		}

		return result;
	}, [borrowers, debouncedSearch, sortColumn, sortDirection]);

	const pendingCount = borrowers.filter(
		(b) => b.status === "pending_approval"
	).length;

	return (
		<div className="space-y-6">
			{/* Header with Search and Actions */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative max-w-md flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
					<Input
						className="border-muted-foreground/10 bg-muted/30 pr-9 pl-9 transition-colors focus:bg-background"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search borrowers..."
						value={searchQuery}
					/>
					{searchQuery && (
						<Button
							className="-translate-y-1/2 absolute top-1/2 right-1 h-7 w-7 p-0"
							onClick={() => setSearchQuery("")}
							size="sm"
							variant="ghost"
						>
							<X className="h-4 w-4" />
						</Button>
					)}
				</div>

				<div className="flex items-center gap-2">
					<Button className="gap-2" disabled size="sm" variant="outline">
						<Filter className="h-4 w-4" />
						Filter
					</Button>
					{onInvite && (
						<Button className="gap-2" onClick={onInvite} size="sm">
							<UserPlus className="h-4 w-4" />
							Invite Borrower
						</Button>
					)}
				</div>
			</div>

			{/* Stats Banner */}
			{pendingCount > 0 && (
				<div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/20">
					<Badge
						className="border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-900 dark:text-amber-300"
						variant="outline"
					>
						{pendingCount}
					</Badge>
					<span className="text-amber-700 text-sm dark:text-amber-300">
						borrower{pendingCount === 1 ? "" : "s"} pending approval
					</span>
				</div>
			)}

			{/* Result Count */}
			<p className="text-muted-foreground text-sm">
				{filteredAndSorted.length === borrowers.length
					? `${borrowers.length} borrower${borrowers.length === 1 ? "" : "s"}`
					: `${filteredAndSorted.length} of ${borrowers.length} borrower${borrowers.length === 1 ? "" : "s"}`}
			</p>

			{/* Table */}
			{isLoading ? (
				<div className="flex items-center justify-center py-16">
					<div className="flex flex-col items-center gap-3">
						<RefreshCw className="h-8 w-8 animate-spin text-muted-foreground/50" />
						<p className="text-muted-foreground text-sm">
							Loading borrowers...
						</p>
					</div>
				</div>
			) : filteredAndSorted.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-16">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
						<Search className="h-8 w-8 text-muted-foreground/50" />
					</div>
					<div className="text-center">
						<p className="font-medium">No borrowers found</p>
						<p className="text-muted-foreground text-sm">
							{searchQuery
								? "Try adjusting your search"
								: "Get started by inviting a borrower"}
						</p>
					</div>
					{!searchQuery && onInvite && (
						<Button className="gap-2" onClick={onInvite}>
							<UserPlus className="h-4 w-4" />
							Invite Borrower
						</Button>
					)}
				</div>
			) : (
				<div className="overflow-hidden rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/30 hover:bg-muted/30">
								<TableHead className="w-[280px]">
									<div className="flex items-center gap-2">
										<span className="font-semibold">Name</span>
										<SortButton
											column="name"
											currentColumn={sortColumn}
											direction={sortDirection}
											onClick={() => toggleSort("name")}
										/>
									</div>
								</TableHead>
								<TableHead>
									<div className="flex items-center gap-2">
										<span className="font-semibold">Email</span>
										<SortButton
											column="email"
											currentColumn={sortColumn}
											direction={sortDirection}
											onClick={() => toggleSort("email")}
										/>
									</div>
								</TableHead>
								<TableHead className="w-[120px]">Phone</TableHead>
								<TableHead className="w-[130px]">
									<div className="flex items-center gap-2">
										<span className="font-semibold">Status</span>
										<SortButton
											column="status"
											currentColumn={sortColumn}
											direction={sortDirection}
											onClick={() => toggleSort("status")}
										/>
									</div>
								</TableHead>
								<TableHead className="w-[80px] text-center">Rotessa</TableHead>
								<TableHead className="w-[60px] text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredAndSorted.map((borrower) => (
								<TableRow
									className="group cursor-pointer transition-colors hover:bg-muted/50"
									key={borrower._id}
									onClick={() => onViewDetail(borrower._id)}
								>
									<TableCell>
										<div className="flex flex-col">
											<span className="font-medium">{borrower.name}</span>
											<span className="font-mono text-muted-foreground text-xs">
												{borrower._id.slice(0, 12)}...
											</span>
										</div>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{borrower.email}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{borrower.phone || "—"}
									</TableCell>
									<TableCell>
										<BorrowerStatusBadge status={borrower.status} />
									</TableCell>
									<TableCell className="text-center">
										<RotessaStatusIcon
											customerId={borrower.rotessaCustomerId}
											status={borrower.rotessaStatus}
										/>
									</TableCell>
									<TableCell className="text-right">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
													onClick={(e) => e.stopPropagation()}
													size="sm"
													variant="ghost"
												>
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={(e) => {
														e.stopPropagation();
														onViewDetail(borrower._id);
													}}
												>
													<Eye className="mr-2 h-4 w-4" />
													View Details
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={(e) => {
														e.stopPropagation();
														onEdit(borrower._id);
													}}
												>
													Edit Borrower
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												{!borrower.userId && onLinkUser && (
													<DropdownMenuItem
														onClick={(e) => {
															e.stopPropagation();
															onLinkUser(borrower._id);
														}}
													>
														Link User Account
													</DropdownMenuItem>
												)}
												{onSyncRotessa && (
													<DropdownMenuItem
														onClick={(e) => {
															e.stopPropagation();
															onSyncRotessa(borrower._id);
														}}
													>
														<RefreshCw className="mr-2 h-4 w-4" />
														Sync Rotessa
													</DropdownMenuItem>
												)}
												{borrower.status === "active" && onSuspend && (
													<>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive focus:text-destructive"
															onClick={(e) => {
																e.stopPropagation();
																onSuspend(borrower._id);
															}}
														>
															Suspend
														</DropdownMenuItem>
													</>
												)}
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}

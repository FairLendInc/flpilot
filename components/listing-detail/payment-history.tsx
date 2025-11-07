"use client";

import { Card, CardContent, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

type Payment = {
	_id: string;
	_creationTime: number;
	listingId: string;
	amount: number;
	date: string;
	status: string;
	type: string;
};

type PaymentHistoryProps = {
	payments: Payment[];
	itemsPerPage?: number;
};

const statusConfig: Record<
	Payment["status"],
	{ label: string; color: "success" | "warning" | "danger"; icon: string }
> = {
	paid: {
		label: "Paid",
		color: "success",
		icon: "lucide:circle-check",
	},
	pending: {
		label: "Pending",
		color: "warning",
		icon: "lucide:clock",
	},
	late: {
		label: "Late",
		color: "danger",
		icon: "lucide:alert-circle",
	},
};

const typeConfig: Record<
	Payment["type"],
	{ label: string; icon: string; color: string }
> = {
	principal: {
		label: "Principal",
		icon: "lucide:home",
		color: "text-blue-600",
	},
	interest: {
		label: "Interest",
		icon: "lucide:percent",
		color: "text-purple-600",
	},
	escrow: {
		label: "Escrow",
		icon: "lucide:shield",
		color: "text-green-600",
	},
};

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}

export function PaymentHistory({
	payments,
	itemsPerPage = 5,
}: PaymentHistoryProps) {
	const [currentPage, setCurrentPage] = useState(1);

	// Calculate pagination
	const totalPages = Math.ceil(payments.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;

	// Get current page items
	const currentPayments = useMemo(
		() => payments.slice(startIndex, endIndex),
		[payments, startIndex, endIndex]
	);

	// Generate page numbers for pagination
	const getPageNumbers = () => {
		const pages: (number | "ellipsis")[] = [];

		if (totalPages <= 7) {
			// Show all pages if 7 or fewer
			for (let i = 1; i <= totalPages; i += 1) {
				pages.push(i);
			}
		} else {
			// Always show first page
			pages.push(1);

			if (currentPage > 3) {
				pages.push("ellipsis");
			}

			// Show pages around current page
			const start = Math.max(2, currentPage - 1);
			const end = Math.min(totalPages - 1, currentPage + 1);

			for (let i = start; i <= end; i += 1) {
				pages.push(i);
			}

			if (currentPage < totalPages - 2) {
				pages.push("ellipsis");
			}

			// Always show last page
			pages.push(totalPages);
		}

		return pages;
	};

	if (payments.length === 0) {
		return (
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<Icon className="h-6 w-6 text-primary" icon="lucide:receipt" />
					<h2 className="font-bold text-2xl">Payment History</h2>
				</div>
				<Card.Root>
					<CardContent className="py-12 text-center">
						<Icon
							className="mx-auto h-12 w-12 text-gray-400"
							icon="lucide:inbox"
						/>
						<p className="mt-3 font-medium text-gray-700 dark:text-gray-300">
							No Payment History
						</p>
						<p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
							Payments will appear here after the first payment is made.
						</p>
					</CardContent>
				</Card.Root>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<Icon className="h-6 w-6 text-primary" icon="lucide:receipt" />
				<h2 className="font-bold text-2xl">Payment History</h2>
				<Chip>{payments.length} payments</Chip>
			</div>

			<div className="space-y-3">
				{currentPayments.map((payment, index) => {
					const statusInfo =
						statusConfig[payment.status] || statusConfig.pending; // Fallback to pending if status unknown
					const typeInfo = typeConfig[payment.type] || typeConfig.interest; // Fallback to interest if type unknown
					const paymentDate = parseISO(payment.date);

					return (
						<Card.Root key={payment._id}>
							<CardContent className="p-4">
								<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
									{/* Left side: Date and Type */}
									<div className="flex items-start gap-3">
										{/* Timeline dot */}
										<div className="relative">
											<div
												className={`rounded-full p-1.5 ${statusInfo.color === "success" ? "bg-green-100 dark:bg-green-900/30" : statusInfo.color === "warning" ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-red-100 dark:bg-red-900/30"}`}
											>
												<Icon
													className={`h-4 w-4 ${statusInfo.color === "success" ? "text-green-600" : statusInfo.color === "warning" ? "text-yellow-600" : "text-red-600"}`}
													icon={statusInfo.icon}
												/>
											</div>
											{/* Vertical line (except for last item on page) */}
											{index < currentPayments.length - 1 && (
												<div className="-translate-x-1/2 absolute top-full left-1/2 h-3 w-px bg-gray-200 dark:bg-gray-700" />
											)}
										</div>

										<div className="flex-1">
											<div className="flex items-center gap-2">
												<p className="font-semibold text-gray-900 dark:text-white">
													{format(paymentDate, "MMMM d, yyyy")}
												</p>
												<Chip color={statusInfo.color}>{statusInfo.label}</Chip>
											</div>
											<div className="mt-1 flex items-center gap-1.5 text-gray-600 text-sm dark:text-gray-400">
												<Icon
													className={`h-4 w-4 ${typeInfo.color}`}
													icon={typeInfo.icon}
												/>
												<span>{typeInfo.label}</span>
											</div>
										</div>
									</div>

									{/* Right side: Amount */}
									<div className="text-right sm:text-left">
										<p className="font-bold text-2xl text-gray-900 dark:text-white">
											{formatCurrency(payment.amount)}
										</p>
										<p className="text-gray-500 text-xs dark:text-gray-500">
											{format(paymentDate, "h:mm a")}
										</p>
									</div>
								</div>
							</CardContent>
						</Card.Root>
					);
				})}
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="mt-6 flex justify-center">
					<Pagination>
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									className={
										currentPage === 1
											? "pointer-events-none opacity-50"
											: "cursor-pointer"
									}
									href="#"
									onClick={(e) => {
										e.preventDefault();
										if (currentPage > 1) {
											setCurrentPage(currentPage - 1);
										}
									}}
								/>
							</PaginationItem>

							{getPageNumbers().map((page) => (
								<PaginationItem key={page}>
									{page === "ellipsis" || typeof page !== "number" ? (
										<PaginationEllipsis />
									) : (
										<PaginationLink
											className="cursor-pointer"
											href="#"
											isActive={currentPage === page}
											onClick={(e) => {
												e.preventDefault();
												setCurrentPage(page);
											}}
										>
											{page}
										</PaginationLink>
									)}
								</PaginationItem>
							))}

							<PaginationItem>
								<PaginationNext
									className={
										currentPage === totalPages
											? "pointer-events-none opacity-50"
											: "cursor-pointer"
									}
									href="#"
									onClick={(e) => {
										e.preventDefault();
										if (currentPage < totalPages) {
											setCurrentPage(currentPage + 1);
										}
									}}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</div>
			)}
		</div>
	);
}

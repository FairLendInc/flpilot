"use client";

import type { Id } from "@/convex/_generated/dataModel";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";

export interface MortgageData {
	_id: Id<"mortgages">;
	borrowerId: Id<"borrowers">;
	loanAmount: number;
	interestRate: number;
	status: "active" | "renewed" | "closed" | "defaulted";
	address: {
		street: string;
		city: string;
		state: string;
		zip: string;
		country: string;
	};
	maturityDate: string;
}

interface MortgageManagementTableProps {
	mortgages: MortgageData[];
	onEdit: (mortgage: MortgageData) => void;
	onDelete: (mortgageId: Id<"mortgages">, address: string) => void;
}

export function MortgageManagementTable({
	mortgages,
	onEdit,
	onDelete,
}: MortgageManagementTableProps) {
	if (mortgages.length === 0) {
		return (
			<div className="flex flex-1 items-center justify-center py-12">
				<p className="text-muted-foreground">No mortgages found</p>
			</div>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Property Address</TableHead>
					<TableHead>Loan Amount</TableHead>
					<TableHead>Interest Rate</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Maturity Date</TableHead>
					<TableHead className="text-right">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{mortgages.map((mortgage) => (
					<TableRow key={mortgage._id}>
						<TableCell>
							<div>
								<p className="font-medium">{mortgage.address.street}</p>
								<p className="text-muted-foreground text-sm">
									{mortgage.address.city}, {mortgage.address.state}{" "}
									{mortgage.address.zip}
								</p>
							</div>
						</TableCell>
						<TableCell>${mortgage.loanAmount.toLocaleString()}</TableCell>
						<TableCell>{mortgage.interestRate}%</TableCell>
						<TableCell>
							<Badge
								variant={
									mortgage.status === "active"
										? "default"
										: mortgage.status === "closed"
											? "secondary"
											: mortgage.status === "defaulted"
												? "destructive"
												: "outline"
								}
							>
								{mortgage.status}
							</Badge>
						</TableCell>
						<TableCell>
							{new Date(mortgage.maturityDate).toLocaleDateString()}
						</TableCell>
						<TableCell className="text-right">
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => onEdit(mortgage)}
								>
									<Edit className="mr-2 h-4 w-4" />
									Edit
								</Button>
								<Button
									variant="destructive"
									size="sm"
									onClick={() =>
										onDelete(
											mortgage._id,
											`${mortgage.address.street}, ${mortgage.address.city}, ${mortgage.address.state} ${mortgage.address.zip}`
										)
									}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete
								</Button>
							</div>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}


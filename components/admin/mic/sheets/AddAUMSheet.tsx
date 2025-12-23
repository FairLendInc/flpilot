"use client";

import { Building2, DollarSign, MapPin, Percent } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";

type AddAUMSheetProps = {
	/**
	 * Whether the sheet is open
	 */
	open: boolean;
	/**
	 * Callback when the open state changes
	 */
	onOpenChange: (open: boolean) => void;
	/**
	 * Callback when form is submitted
	 */
	onSubmit: (data: {
		name: string;
		address: string;
		totalPrincipal: number;
		micOwnershipPercentage: number;
	}) => void;
};

/**
 * A slide-out panel for adding new mortgage assets to the MIC's Assets Under Management (AUM).
 * Supports fractional ownership configuration and initial principal entry.
 */
export function AddAUMSheet({
	open,
	onOpenChange,
	onSubmit,
}: AddAUMSheetProps) {
	const [name, setName] = React.useState("");
	const [address, setAddress] = React.useState("");
	const [principal, setPrincipal] = React.useState("");
	const [ownership, setOwnership] = React.useState("100");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit({
			name,
			address,
			totalPrincipal: Number.parseFloat(principal) || 0,
			micOwnershipPercentage: Number.parseFloat(ownership) || 0,
		});
		onOpenChange(false);
	};

	const micValue =
		((Number.parseFloat(principal) || 0) *
			(Number.parseFloat(ownership) || 0)) /
		100;

	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			<SheetContent className="border-none backdrop-blur-xl sm:max-w-md dark:bg-slate-900/95">
				<SheetHeader className="pb-8">
					<div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
						<Building2 className="size-6" />
					</div>
					<SheetTitle className="font-bold text-2xl tracking-tight">
						Add Mortgage Asset
					</SheetTitle>
					<SheetDescription className="font-medium text-muted-foreground/80 text-sm">
						Onboard a new mortgage into the pool and set the MIC's initial
						participation share.
					</SheetDescription>
				</SheetHeader>

				<form className="flex flex-col gap-6" onSubmit={handleSubmit}>
					<div className="flex flex-col gap-4">
						<div className="grid gap-2">
							<Label
								className="font-bold text-muted-foreground/60 text-xs uppercase tracking-widest"
								htmlFor="aum_name"
							>
								Mortgage Name
							</Label>
							<div className="relative">
								<Input
									className="border-muted-foreground/20 bg-muted/30 pl-9 focus-visible:ring-primary/20"
									id="aum_name"
									onChange={(e) => setName(e.target.value)}
									placeholder="e.g. First Mortgage Toronto"
									required
									value={name}
								/>
								<Building2 className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground/40" />
							</div>
						</div>

						<div className="grid gap-2">
							<Label
								className="font-bold text-muted-foreground/60 text-xs uppercase tracking-widest"
								htmlFor="aum_address"
							>
								Property Address
							</Label>
							<div className="relative">
								<Input
									className="border-muted-foreground/20 bg-muted/30 pl-9 focus-visible:ring-primary/20"
									id="aum_address"
									onChange={(e) => setAddress(e.target.value)}
									placeholder="123 Example St, City, Prov"
									required
									value={address}
								/>
								<MapPin className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground/40" />
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-2">
								<Label
									className="font-bold text-muted-foreground/60 text-xs uppercase tracking-widest"
									htmlFor="principal"
								>
									Total Principal ($)
								</Label>
								<div className="relative">
									<Input
										className="border-muted-foreground/20 bg-muted/30 pl-9 focus-visible:ring-primary/20"
										id="principal"
										onChange={(e) => setPrincipal(e.target.value)}
										placeholder="0.00"
										required
										type="number"
										value={principal}
									/>
									<DollarSign className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground/40" />
								</div>
							</div>
							<div className="grid gap-2">
								<Label
									className="font-bold text-muted-foreground/60 text-xs uppercase tracking-widest"
									htmlFor="ownership"
								>
									MIC Ownership (%)
								</Label>
								<div className="relative">
									<Input
										className="border-muted-foreground/20 bg-muted/30 pl-9 focus-visible:ring-primary/20"
										id="ownership"
										max="100"
										min="0"
										onChange={(e) => setOwnership(e.target.value)}
										placeholder="100"
										required
										type="number"
										value={ownership}
									/>
									<Percent className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground/40" />
								</div>
							</div>
						</div>
					</div>

					<div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4">
						<div className="flex items-center justify-between">
							<span className="font-bold text-[10px] text-blue-600 uppercase tracking-widest dark:text-blue-400">
								Total MIC Participation
							</span>
							<span className="font-bold text-foreground text-sm">
								${micValue.toLocaleString()}
							</span>
						</div>
					</div>

					<SheetFooter className="mt-4">
						<SheetClose asChild>
							<Button
								className="border-muted-foreground/20"
								type="button"
								variant="outline"
							>
								Cancel
							</Button>
						</SheetClose>
						<Button
							className="bg-blue-600 shadow-sm hover:bg-blue-700"
							type="submit"
						>
							Add AUM Asset
						</Button>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	);
}

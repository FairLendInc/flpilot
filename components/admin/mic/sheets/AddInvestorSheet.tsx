"use client";

import { Mail, ShieldCheck, UserPlus, Wallet } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";

type AddInvestorSheetProps = {
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
		email: string;
		capitalClass: string;
		initialSubscription: number;
	}) => void;
};

/**
 * A slide-out panel for registering new investors into the MIC.
 * Includes field validation and a premium administrative layout.
 */
export function AddInvestorSheet({
	open,
	onOpenChange,
	onSubmit,
}: AddInvestorSheetProps) {
	const [name, setName] = React.useState("");
	const [email, setEmail] = React.useState("");
	const [capitalClass, setCapitalClass] = React.useState("MICCAP-FLMIC/0");
	const [amount, setAmount] = React.useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit({
			name,
			email,
			capitalClass,
			initialSubscription: Number.parseFloat(amount) || 0,
		});
		onOpenChange(false);
	};

	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			<SheetContent className="border-none backdrop-blur-xl sm:max-w-md dark:bg-slate-900/95">
				<SheetHeader className="pb-8">
					<div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
						<UserPlus className="size-6" />
					</div>
					<SheetTitle className="font-bold text-2xl tracking-tight">
						Add New Investor
					</SheetTitle>
					<SheetDescription className="font-medium text-muted-foreground/80 text-sm">
						Register a new investor and process their initial capital
						subscription.
					</SheetDescription>
				</SheetHeader>

				<form className="flex flex-col gap-6" onSubmit={handleSubmit}>
					<div className="flex flex-col gap-4">
						<div className="grid gap-2">
							<Label
								className="font-bold text-muted-foreground/60 text-xs uppercase tracking-widest"
								htmlFor="name"
							>
								Full Name
							</Label>
							<div className="relative">
								<Input
									className="border-muted-foreground/20 bg-muted/30 pl-9 focus-visible:ring-primary/20"
									id="name"
									onChange={(e) => setName(e.target.value)}
									placeholder="e.g. Michael Scott"
									required
									value={name}
								/>
								<ShieldCheck className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground/40" />
							</div>
						</div>

						<div className="grid gap-2">
							<Label
								className="font-bold text-muted-foreground/60 text-xs uppercase tracking-widest"
								htmlFor="email"
							>
								Email Address
							</Label>
							<div className="relative">
								<Input
									className="border-muted-foreground/20 bg-muted/30 pl-9 focus-visible:ring-primary/20"
									id="email"
									onChange={(e) => setEmail(e.target.value)}
									placeholder="michael@dundermifflin.com"
									required
									type="email"
									value={email}
								/>
								<Mail className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground/40" />
							</div>
						</div>

						<div className="grid gap-2">
							<Label
								className="font-bold text-muted-foreground/60 text-xs uppercase tracking-widest"
								htmlFor="capital-class"
							>
								Capital Class
							</Label>
							<Select onValueChange={setCapitalClass} value={capitalClass}>
								<SelectTrigger
									className="border-muted-foreground/20 bg-muted/30 shadow-none focus:ring-primary/20"
									id="capital-class"
								>
									<SelectValue placeholder="Select capital class" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="MICCAP-FLMIC/0">
										MICCAP-FLMIC/0 (Legacy)
									</SelectItem>
									<SelectItem value="MICCAP-FLMIC/1">
										MICCAP-FLMIC/1 (New)
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-2">
							<Label
								className="font-bold text-muted-foreground/60 text-xs uppercase tracking-widest"
								htmlFor="amount"
							>
								Initial Subscription ($)
							</Label>
							<div className="relative">
								<Input
									className="border-muted-foreground/20 bg-muted/30 pl-9 focus-visible:ring-primary/20"
									id="amount"
									min="0"
									onChange={(e) => {
										const value = e.target.value;
										const numericValue = Number.parseFloat(value);
										if (!Number.isNaN(numericValue) && numericValue < 0) {
											setAmount("0");
											return;
										}
										setAmount(value);
									}}
									placeholder="0.00"
									required
									type="number"
									value={amount}
								/>
								<Wallet className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground/40" />
							</div>
						</div>
					</div>

					<div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
						<p className="font-bold text-[10px] text-primary/80 uppercase leading-relaxed tracking-wider">
							Note: Submitting this form will create the investor profile and
							initiate a subscription transaction on the ledger.
						</p>
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
							className="bg-primary shadow-sm hover:bg-primary/90"
							type="submit"
						>
							Register Investor
						</Button>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	);
}

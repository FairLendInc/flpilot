"use client";

import { Save, Shield, TrendingUp, Wallet, Zap } from "lucide-react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function MICSettingsPage() {
	return (
		<div className="mx-auto flex max-w-5xl flex-1 flex-col gap-8 overflow-y-auto p-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-3xl text-foreground tracking-tight">
						Fund Settings
					</h2>
					<p className="mt-1 text-muted-foreground">
						Configure MIC economic policies, capital classes, and platform
						rules.
					</p>
				</div>
				<Button className="gap-2 shadow-lg shadow-primary/20">
					<Save className="h-4 w-4" />
					Save Changes
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
				<div className="space-y-8 lg:col-span-2">
					<Card className="border-none shadow-sm dark:bg-slate-900/50">
						<CardHeader>
							<div className="mb-1 flex items-center gap-2 text-primary">
								<TrendingUp className="size-4" />
								<span className="font-bold text-[10px] uppercase tracking-widest">
									Economics
								</span>
							</div>
							<CardTitle className="font-bold text-xl tracking-tight">
								Distribution Policy
							</CardTitle>
							<CardDescription>
								Define how fund interest is calculated and distributed to
								investors.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid grid-cols-2 gap-6">
								<div className="space-y-2">
									<Label
										className="font-bold text-muted-foreground/80 text-xs uppercase tracking-wider"
										htmlFor="target-yield"
									>
										Target Annual Yield (%)
									</Label>
									<Input
										className="border-muted-foreground/20 bg-muted/30"
										defaultValue="9.5"
										id="target-yield"
									/>
								</div>
								<div className="space-y-2">
									<Label
										className="font-bold text-muted-foreground/80 text-xs uppercase tracking-wider"
										htmlFor="dist-freq"
									>
										Distribution Frequency
									</Label>
									<Select defaultValue="monthly">
										<SelectTrigger
											className="border-muted-foreground/20 bg-muted/30"
											id="dist-freq"
										>
											<SelectValue placeholder="Select frequency" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="monthly">Monthly</SelectItem>
											<SelectItem value="quarterly">Quarterly</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="flex items-center justify-between rounded-xl border border-primary/10 bg-primary/5 p-4">
								<div className="space-y-0.5">
									<Label className="font-bold text-sm">
										Net-Zero Payout Policy
									</Label>
									<p className="text-muted-foreground text-xs">
										Automatically distribute 100% of accrued interest during
										close.
									</p>
								</div>
								<Switch defaultChecked />
							</div>
						</CardContent>
					</Card>

					<Card className="border-none shadow-sm dark:bg-slate-900/50">
						<CardHeader>
							<div className="mb-1 flex items-center gap-2 text-indigo-500">
								<Shield className="size-4" />
								<span className="font-bold text-[10px] uppercase tracking-widest">
									Compliance
								</span>
							</div>
							<CardTitle className="font-bold text-xl tracking-tight">
								Redemption Rules
							</CardTitle>
							<CardDescription>
								Set limits and notice periods for capital withdrawals.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid grid-cols-2 gap-6">
								<div className="space-y-2">
									<Label
										className="font-bold text-muted-foreground/80 text-xs uppercase tracking-wider"
										htmlFor="notice-period"
									>
										Notice Period (Days)
									</Label>
									<Input
										className="border-muted-foreground/20 bg-muted/30"
										defaultValue="30"
										id="notice-period"
										type="number"
									/>
								</div>
								<div className="space-y-2">
									<Label
										className="font-bold text-muted-foreground/80 text-xs uppercase tracking-wider"
										htmlFor="max-redemption"
									>
										Max Monthly Redemption (%)
									</Label>
									<Input
										className="border-muted-foreground/20 bg-muted/30"
										defaultValue="5"
										id="max-redemption"
										type="number"
									/>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="space-y-8">
					<Card className="border-none shadow-sm dark:bg-slate-900/50">
						<CardHeader>
							<div className="mb-1 flex items-center gap-2 text-amber-500">
								<Zap className="size-4" />
								<span className="font-bold text-[10px] uppercase tracking-widest">
									System
								</span>
							</div>
							<CardTitle className="font-bold text-xl tracking-tight">
								Platform Health
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-3">
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">Ledger Sync</span>
									<span className="flex items-center gap-1 font-bold text-emerald-500">
										<div className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
										Active
									</span>
								</div>
								<Separator className="opacity-50" />
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">Auto-Accrual</span>
									<span className="font-bold text-muted-foreground">
										Disabled
									</span>
								</div>
							</div>
							<Button
								className="mt-2 w-full border-muted-foreground/20 font-bold text-xs uppercase tracking-widest"
								variant="outline"
							>
								Run Health Audit
							</Button>
						</CardContent>
					</Card>

					<Card className="border-none bg-indigo-600 text-white shadow-sm">
						<CardHeader>
							<div className="mb-1 flex items-center gap-2 text-indigo-200">
								<Wallet className="size-4" />
								<span className="font-bold text-[10px] text-white/70 uppercase tracking-widest">
									Subscription
								</span>
							</div>
							<CardTitle className="font-bold text-lg tracking-tight">
								Governance Tokens
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="font-medium text-indigo-100 text-xs leading-relaxed">
								MICCAP-FLMIC/1 holders have voting rights on new originations
								and platform fees.
							</p>
							<Button
								className="w-full border-white/20 bg-white/10 font-bold text-white text-xs uppercase tracking-widest hover:bg-white/20"
								variant="outline"
							>
								Manage Holders
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

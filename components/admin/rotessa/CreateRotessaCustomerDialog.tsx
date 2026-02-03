"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const createCustomerSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
	customIdentifier: z.string().optional(),
	customerType: z.enum(["Personal", "Business"]),
	phone: z.string().optional(),
	authorizationType: z.enum(["In Person", "Online"]),
	// Canadian bank info
	institutionNumber: z
		.string()
		.length(3, "Institution number must be 3 digits")
		.regex(/^\d+$/, "Must be digits only"),
	transitNumber: z
		.string()
		.length(5, "Transit number must be 5 digits")
		.regex(/^\d+$/, "Must be digits only"),
	accountNumber: z
		.string()
		.min(5, "Account number must be 5-12 digits")
		.max(12, "Account number must be 5-12 digits")
		.regex(/^\d+$/, "Must be digits only"),
	bankAccountType: z.enum(["Savings", "Checking"]),
	// Options
	createBorrower: z.boolean(),
	provisionUser: z.boolean(),
});

type CreateCustomerFormData = z.infer<typeof createCustomerSchema>;

type CreateRotessaCustomerDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (data: CreateCustomerFormData) => Promise<void>;
};

export function CreateRotessaCustomerDialog({
	open,
	onOpenChange,
	onSubmit,
}: CreateRotessaCustomerDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<CreateCustomerFormData>({
		resolver: zodResolver(createCustomerSchema),
		defaultValues: {
			name: "",
			email: "",
			customIdentifier: "",
			customerType: "Personal",
			phone: "",
			authorizationType: "Online",
			institutionNumber: "",
			transitNumber: "",
			accountNumber: "",
			bankAccountType: "Checking",
			createBorrower: true,
			provisionUser: false,
		},
	});

	const handleSubmit = async (data: CreateCustomerFormData) => {
		setIsSubmitting(true);
		try {
			await onSubmit(data);
			form.reset();
			onOpenChange(false);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Create Rotessa Customer</DialogTitle>
					<DialogDescription>
						Create a new customer in Rotessa for pre-authorized debit payments.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						className="space-y-6"
						onSubmit={form.handleSubmit(handleSubmit)}
					>
						{/* Basic Information */}
						<div className="space-y-4">
							<h4 className="font-medium text-muted-foreground text-sm">
								Customer Information
							</h4>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem className="col-span-2">
											<FormLabel>Full Name</FormLabel>
											<FormControl>
												<Input placeholder="John Doe" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input
													placeholder="john@example.com"
													type="email"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="phone"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Phone (Optional)</FormLabel>
											<FormControl>
												<Input placeholder="(416) 555-0123" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="customerType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Customer Type</FormLabel>
											<Select
												defaultValue={field.value}
												onValueChange={field.onChange}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select type" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="Personal">Personal</SelectItem>
													<SelectItem value="Business">Business</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="customIdentifier"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Custom ID (Optional)</FormLabel>
											<FormControl>
												<Input placeholder="BOR-001" {...field} />
											</FormControl>
											<FormDescription>Your internal reference</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* Bank Information */}
						<div className="space-y-4">
							<h4 className="font-medium text-muted-foreground text-sm">
								Bank Information (Canadian)
							</h4>

							<div className="grid grid-cols-3 gap-4">
								<FormField
									control={form.control}
									name="institutionNumber"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Institution #</FormLabel>
											<FormControl>
												<Input maxLength={3} placeholder="001" {...field} />
											</FormControl>
											<FormDescription>3 digits</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="transitNumber"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Transit #</FormLabel>
											<FormControl>
												<Input maxLength={5} placeholder="00001" {...field} />
											</FormControl>
											<FormDescription>5 digits</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="accountNumber"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Account #</FormLabel>
											<FormControl>
												<Input
													maxLength={12}
													placeholder="123456789"
													{...field}
												/>
											</FormControl>
											<FormDescription>5-12 digits</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="bankAccountType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Account Type</FormLabel>
											<Select
												defaultValue={field.value}
												onValueChange={field.onChange}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="Checking">Checking</SelectItem>
													<SelectItem value="Savings">Savings</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="authorizationType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Authorization Type</FormLabel>
											<Select
												defaultValue={field.value}
												onValueChange={field.onChange}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="Online">Online</SelectItem>
													<SelectItem value="In Person">In Person</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* Options */}
						<div className="space-y-4">
							<h4 className="font-medium text-muted-foreground text-sm">
								Integration Options
							</h4>

							<FormField
								control={form.control}
								name="createBorrower"
								render={({ field }) => (
									<FormItem className="flex items-start space-x-3 space-y-0">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<div className="space-y-1 leading-none">
											<FormLabel>Create borrower record in system</FormLabel>
											<FormDescription>
												Automatically create a linked borrower profile
											</FormDescription>
										</div>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="provisionUser"
								render={({ field }) => (
									<FormItem className="flex items-start space-x-3 space-y-0">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<div className="space-y-1 leading-none">
											<FormLabel>Provision platform user account</FormLabel>
											<FormDescription>
												Create a login account for the borrower portal
											</FormDescription>
										</div>
									</FormItem>
								)}
							/>
						</div>

						<DialogFooter>
							<Button
								onClick={() => onOpenChange(false)}
								type="button"
								variant="outline"
							>
								Cancel
							</Button>
							<Button disabled={isSubmitting} type="submit">
								{isSubmitting && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Create Customer
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

export type { CreateCustomerFormData };

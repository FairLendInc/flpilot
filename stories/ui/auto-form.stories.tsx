import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { z } from "zod";
import { AutoForm, AutoFormSubmit } from "@/components/ui/auto-form";
import { DependencyType, FieldConfig, FormLayout } from "@/components/ui/auto-form/types";
import { toast, Toaster } from "sonner";

const meta: Meta<typeof AutoForm> = {
	title: "UI/AutoForm",
	component: AutoForm,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"AutoForm automatically generates form fields from Zod schemas. It supports all Zod types, nested objects, arrays, field dependencies, and custom configurations.",
			},
		},
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div className="w-full max-w-2xl p-8">
				<Toaster />
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic form schema
const basicSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	email: z.string().email("Invalid email address"),
	age: z.number().min(18, "Must be at least 18 years old"),
	subscribe: z.boolean().default(false),
});

export const Basic: Story = {
	render: () => {
		const [submittedData, setSubmittedData] = useState<z.infer<
			typeof basicSchema
		> | null>(null);

		function handleSubmit(data: z.infer<typeof basicSchema>) {
			setSubmittedData(data);
			toast.success("Form submitted successfully!");
		}

		return (
			<div className="space-y-6">
				<AutoForm formSchema={basicSchema} onSubmit={handleSubmit}>
					<AutoFormSubmit />
				</AutoForm>
				{submittedData && (
					<div className="mt-4 rounded-lg border bg-muted p-4">
						<h3 className="mb-2 font-semibold">Submitted Data:</h3>
						<pre className="text-sm">
							{JSON.stringify(submittedData, null, 2)}
						</pre>
					</div>
				)}
			</div>
		);
	},
};

// Side-by-side layout story
const sideBySideSchema = z.object({
	firstName: z.string().min(2, "First name must be at least 2 characters"),
	lastName: z.string().min(2, "Last name must be at least 2 characters"),
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	passwordConfirm: z.string().min(8, "Password must be at least 8 characters"),
	bio: z.string().optional().describe("Tell us about yourself"),
	notifications: z.boolean().default(false),
});

export const SideBySide: Story = {
	render: () => {
		const [submittedData, setSubmittedData] = useState<z.infer<
			typeof sideBySideSchema
		> | null>(null);

		function handleSubmit(data: z.infer<typeof sideBySideSchema>) {
			setSubmittedData(data);
			toast.success("Form submitted successfully!");
		}

		return (
			<div className="space-y-6">
				<AutoForm
					formSchema={sideBySideSchema}
					onSubmit={handleSubmit}
					layout={FormLayout.SIDEBYSIDE}
					fieldConfig={{
						bio: {
							description: "Optional: Share a brief description about yourself",
							inputProps: {
								showLabel: true,
							},
						},
					}}
				>
					<AutoFormSubmit />
				</AutoForm>
				{submittedData && (
					<div className="mt-4 rounded-lg border bg-muted p-4">
						<h3 className="mb-2 font-semibold">Submitted Data:</h3>
						<pre className="text-sm">
							{JSON.stringify(submittedData, null, 2)}
						</pre>
					</div>
				)}
			</div>
		);
	},
};

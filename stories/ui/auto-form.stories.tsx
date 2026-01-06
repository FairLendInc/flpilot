import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { AutoForm, AutoFormSubmit } from "@/components/ui/auto-form";
import { DependencyType, FieldConfig, FormLayout } from "@/components/ui/auto-form/types";
import { toast, Toaster } from "sonner";
import { User, Mail, Calendar, Settings, Info, Lock, FileText, Hash, CheckSquare, ToggleLeft, List, Radio, Type } from "lucide-react";

const meta: Meta<typeof AutoForm> = {
	title: "UI/AutoForm",
	component: AutoForm,
	parameters: {
		layout: "fullscreen",
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
			<div className="w-full">
				<Toaster />
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Comprehensive schema for all stories
const comprehensiveSchema = z.object({
	text: z.string().describe("Standard text input"),
	number: z.number().describe("Number input"),
	textarea: z.string().describe("Textarea input"),
	date: z.date().describe("Date picker"),
	select: z.enum(["Option 1", "Option 2", "Option 3"]).describe("Select dropdown"),
	radio: z.enum(["One", "Two", "Three"]).describe("Radio group"),
	checkbox: z.boolean().describe("Checkbox"),
	switch: z.boolean().describe("Switch toggle"),
	file: z.string().describe("File upload"),
	tags: z.array(z.string()).describe("Tags input"),
	categories: z.array(z.enum(["Tech", "Design", "Business"])).describe("Multi-select categories"),
	array: z.array(z.object({
		name: z.string(),
		role: z.string(),
	})).describe("Array of objects"),
	nested: z.object({
		subfield: z.string().describe("Subfield in object"),
	}).describe("Nested object"),
});

const comprehensiveFieldConfig: FieldConfig<z.infer<typeof comprehensiveSchema>> = {
	text: {
		icon: <FileText className="size-4" />,
		inputProps: { placeholder: "Enter some text..." },
	},
	number: {
		icon: <Hash className="size-4" />,
		inputProps: { placeholder: "42" },
	},
	textarea: {
		fieldType: "textarea",
		icon: <FileText className="size-4" />,
		inputProps: { placeholder: "Write a long story here..." },
	},
	date: {
		icon: <Calendar className="size-4" />,
		inputProps: { placeholder: "Select a date" },
	},
	select: {
		icon: <List className="size-4" />,
		inputProps: { placeholder: "Choose an option" },
	},
	radio: {
		fieldType: "radio",
		icon: <Radio className="size-4" />,
	},
	checkbox: {
		icon: <CheckSquare className="size-4" />,
	},
	switch: {
		fieldType: "switch",
		icon: <ToggleLeft className="size-4" />,
	},
	file: {
		fieldType: "file",
		icon: <FileText className="size-4" />,
	},
	tags: {
		icon: <List className="size-4" />,
		inputProps: { placeholder: "Add tags..." },
	},
	categories: {
		icon: <Settings className="size-4" />,
		inputProps: { placeholder: "Select categories..." },
	},
	array: {
		name: {
			inputProps: { placeholder: "Item name" },
		},
		role: {
			inputProps: { placeholder: "Item role" },
		},
	},
	nested: {
		subfield: {
			inputProps: { placeholder: "Nested value" },
		},
	},
};

export const Basic: Story = {
	render: () => {
		const [submittedData, setSubmittedData] = useState<any>(null);

		function handleSubmit(data: any) {
			setSubmittedData(data);
			toast.success("Form submitted successfully!");
		}

		return (
			<div className="space-y-6">
				<AutoForm
					formSchema={comprehensiveSchema}
					onSubmit={handleSubmit}
					fieldConfig={comprehensiveFieldConfig}
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

export const SideBySide: Story = {
	render: () => {
		const [submittedData, setSubmittedData] = useState<any>(null);

		function handleSubmit(data: any) {
			setSubmittedData(data);
			toast.success("Form submitted successfully!");
		}

		return (
			<div className="space-y-6">
				<AutoForm
					formSchema={comprehensiveSchema}
					onSubmit={handleSubmit}
					layout={FormLayout.SIDEBYSIDE}
					fieldConfig={comprehensiveFieldConfig}
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

export const WithIcons: Story = {
	render: () => {
		const [submittedData, setSubmittedData] = useState<any>(null);

		function handleSubmit(data: any) {
			setSubmittedData(data);
			toast.success("Form submitted successfully!");
		}

		return (
			<div className="space-y-6">
				<AutoForm
					formSchema={comprehensiveSchema}
					onSubmit={handleSubmit}
					fieldConfig={comprehensiveFieldConfig}
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

export const Comprehensive: Story = {
	render: () => {
		const [submittedData, setSubmittedData] = useState<any>(null);

		function handleSubmit(data: any) {
			setSubmittedData(data);
			toast.success("Form submitted successfully!");
		}

		return (
			<div className="space-y-6">
				<AutoForm
					formSchema={comprehensiveSchema}
					onSubmit={handleSubmit}
					fieldConfig={comprehensiveFieldConfig}
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

export const SideBySideWithIcons: Story = {
	render: () => {
		const [submittedData, setSubmittedData] = useState<any>(null);

		function handleSubmit(data: any) {
			setSubmittedData(data);
			toast.success("Form submitted successfully!");
		}

		return (
			<div className="space-y-6">
				<AutoForm
					formSchema={comprehensiveSchema}
					onSubmit={handleSubmit}
					layout={FormLayout.SIDEBYSIDE}
					fieldConfig={comprehensiveFieldConfig}
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

export const GhostInputs: Story = {
	render: () => {
		const [submittedData, setSubmittedData] = useState<any>(null);

		function handleSubmit(data: any) {
			setSubmittedData(data);
			toast.success("Form submitted successfully!");
		}

		// Create ghost field config by spreading comprehensiveFieldConfig and adding variant: "ghost"
		const ghostFieldConfig = Object.keys(comprehensiveFieldConfig).reduce((acc, key) => {
			const config = comprehensiveFieldConfig[key as keyof typeof comprehensiveFieldConfig];
			if (typeof config === 'object' && config !== null) {
				acc[key as keyof typeof comprehensiveFieldConfig] = {
					...config,
					variant: "ghost" as const,
				} as any;
			}
			return acc;
		}, {} as any);

		return (
			<div className="space-y-6">
				<AutoForm
					formSchema={comprehensiveSchema}
					onSubmit={handleSubmit}
					layout={FormLayout.SIDEBYSIDE}
					fieldConfig={ghostFieldConfig}
					values={{
						text: "Pre-filled text",
						number: 123,
						textarea: "This is some pre-filled long text content.",
						date: new Date(),
						select: "Option 2",
						radio: "Two",
						checkbox: true,
						switch: true,
						tags: ["Ghost", "In", "The", "Shell"],
						categories: ["Design", "Business"],
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

// Rich Text Editor Story
const richTextSchema = z.object({
	title: z.string().min(1, "Title is required").describe("Article title"),
	content: z.any().optional().describe("Rich text content"),
});

export const RichText: Story = {
	render: () => {
		const [submittedData, setSubmittedData] = useState<any>(null);

		function handleSubmit(data: any) {
			setSubmittedData(data);
			toast.success("Form submitted successfully!");
		}

		return (
			<div className="space-y-6">
				<AutoForm
					formSchema={richTextSchema}
					onSubmit={handleSubmit}
					fieldConfig={{
						title: {
							icon: <FileText className="size-4" />,
							inputProps: { placeholder: "Enter article title..." },
						},
						content: {
							fieldType: "richtext",
							label: "Content",
							icon: <Type className="size-4" />,
							description: "Write your content with rich formatting. Use '/' for quick commands.",
						},
					}}
				>
					<AutoFormSubmit />
				</AutoForm>
				{submittedData && (
					<div className="mt-4 rounded-lg border bg-muted p-4">
						<h3 className="mb-2 font-semibold">Submitted Data:</h3>
						<pre className="max-h-[300px] overflow-auto text-sm">
							{JSON.stringify(submittedData, null, 2)}
						</pre>
					</div>
				)}
			</div>
		);
	},
};

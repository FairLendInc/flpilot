import type { Meta, StoryObj } from "@storybook/react";
import { z } from "zod";
import { RecordSheetRoot } from "@/components/crm/record-sheet/record-sheet";
import { AutoForm } from "@/components/ui/auto-form";
import { FormLayout } from "@/components/ui/auto-form/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, FileText } from "lucide-react";

const meta: Meta<typeof RecordSheetRoot> = {
	title: "CRM/RecordSheet",
	component: RecordSheetRoot,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const contactSchema = z.object({
	firstName: z.string().describe("First Name"),
	lastName: z.string().describe("Last Name"),
	email: z.string().email().describe("Email Address"),
	phone: z.string().optional().describe("Phone Number"),
	notes: z.string().optional().describe("Notes"),
});

const contactFieldConfig = {
	firstName: {
		icon: <User className="size-4" />,
	},
	lastName: {
		icon: <User className="size-4" />,
	},
	email: {
		icon: <Mail className="size-4" />,
	},
	phone: {
		icon: <Phone className="size-4" />,
	},
	notes: {
		icon: <FileText className="size-4" />,
		fieldType: "textarea" as const,
	},
};

export const Basic: Story = {
	args: {
		title: "Contact Details",
		open: true,
		homeContent: {
			fields: (
				<AutoForm
					formSchema={contactSchema}
					fieldConfig={contactFieldConfig}
					onSubmit={(data) => console.log("Form submitted:", data)}
				/>
			),
			connections: [{
				title: "Connections",
				content: <div className="p-4 text-muted-foreground">No connections found.</div>,
			}],
		},
		children: null,
	},
	render: (args) => {
		const [open, setOpen] = useState(args.open ?? false);
		return (
			<div className="flex min-h-[400px] items-center justify-center p-8">
				<Button onClick={() => setOpen(true)}>Open Record Sheet</Button>
				<RecordSheetRoot 
                    {...args} 
                    open={open} 
                    title="Contact Details"
                    onOpenChange={setOpen} 
                    homeContent={{
                        ...args.homeContent,
                        fields: (
                            <AutoForm
                                formSchema={contactSchema}
                                fieldConfig={contactFieldConfig}
                                onSubmit={(data) => {
                                    console.log("Form submitted:", data);
                                    setOpen(false);
                                }}
                            />
                        )
                    }}
                />
			</div>
		);
	},
};

export const SideBySide: Story = {
	args: {
		title: "Quick Edit",
		open: true,
		homeContent: {
			fields: (
				<AutoForm
					formSchema={contactSchema}
					fieldConfig={contactFieldConfig}
					layout={FormLayout.SIDEBYSIDE}
					onSubmit={(data) => console.log("Form submitted:", data)}
				/>
			),
			connections: [{
				title: "Connections",
				content: <div className="p-4">Active Connections: 2</div>,
			}],
		},
		children: null,
	},
	render: (args) => {
		const [open, setOpen] = useState(args.open ?? false);
		return (
			<div className="flex min-h-[400px] items-center justify-center p-8">
				<Button onClick={() => setOpen(true)}>Open Record Sheet</Button>
				<RecordSheetRoot 
                    {...args} 
                    open={open} 
                    onOpenChange={setOpen} 
                    homeContent={{
                        ...args.homeContent,
                        fields: (
                            <AutoForm
                                formSchema={contactSchema}
                                fieldConfig={contactFieldConfig}
                                layout={FormLayout.SIDEBYSIDE}
                                onSubmit={(data) => {
                                    console.log("Form submitted:", data);
                                    setOpen(false);
                                }}
                            />
                        )
                    }}
                />
			</div>
		);
	},
};

export const EmptyStates: Story = {
	args: {
		title: "New Record",
		open: true,
		defaultTab: "tasks",
		homeContent: {
			fields: (
				<AutoForm
					formSchema={contactSchema}
					fieldConfig={contactFieldConfig}
					onSubmit={(data) => console.log("Form submitted:", data)}
				/>
			),
			connections: [],
		},
		children: null,
	},
	render: (args) => {
		const [open, setOpen] = useState(args.open ?? false);
		return (
			<div className="flex min-h-[400px] items-center justify-center p-8">
				<Button onClick={() => setOpen(true)}>Open Sheet (Tasks Tab)</Button>
				<RecordSheetRoot 
                    {...args} 
                    open={open} 
                    onOpenChange={setOpen}
                />
			</div>
		);
	},
};
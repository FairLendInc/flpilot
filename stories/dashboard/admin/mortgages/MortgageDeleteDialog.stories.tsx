import type { Meta, StoryObj } from "@storybook/react";
import { MortgageDeleteDialog } from "@/app/dashboard/admin/mortgages/components/MortgageDeleteDialog";
import type { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";

const meta: Meta<typeof MortgageDeleteDialog> = {
	title: "Dashboard/Admin/Mortgages/MortgageDeleteDialog",
	component: MortgageDeleteDialog,
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof MortgageDeleteDialog>;

function DialogWrapper({ children, defaultOpen = false }: { children: React.ReactNode; defaultOpen?: boolean }) {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<div>
			<button onClick={() => setOpen(true)} className="rounded bg-primary px-4 py-2 text-primary-foreground">
				Open Dialog
			</button>
			{open && <div>{children}</div>}
		</div>
	);
}

export const SimpleMortgage: Story = {
	render: () => (
		<DialogWrapper defaultOpen>
			<MortgageDeleteDialog
				mortgageId={"j1234567890abcdef" as Id<"mortgages">}
				open={true}
				onOpenChange={() => {}}
			/>
		</DialogWrapper>
	),
};

export const MortgageWithListing: Story = {
	render: () => (
		<DialogWrapper defaultOpen>
			<MortgageDeleteDialog
				mortgageId={"j1234567890abcdef" as Id<"mortgages">}
				open={true}
				onOpenChange={() => {}}
			/>
		</DialogWrapper>
	),
	parameters: {
		mockData: {
			hasListing: true,
			isLocked: false,
		},
	},
};

export const MortgageWithLockedListing: Story = {
	render: () => (
		<DialogWrapper defaultOpen>
			<MortgageDeleteDialog
				mortgageId={"j1234567890abcdef" as Id<"mortgages">}
				open={true}
				onOpenChange={() => {}}
			/>
		</DialogWrapper>
	),
	parameters: {
		mockData: {
			hasListing: true,
			isLocked: true,
		},
	},
};

export const Interactive: Story = {
	render: () => {
		const [open, setOpen] = useState(false);
		return (
			<div>
				<button onClick={() => setOpen(true)} className="rounded bg-destructive px-4 py-2 text-destructive-foreground">
					Delete Mortgage
				</button>
				<MortgageDeleteDialog
					mortgageId={"j1234567890abcdef" as Id<"mortgages">}
					open={open}
					onOpenChange={setOpen}
				/>
			</div>
		);
	},
};


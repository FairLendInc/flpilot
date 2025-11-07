import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "@/components/ui/badge";

const meta = {
	title: "UI/Badge/Status Variants",
	component: Badge,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Status badge variants for lock request workflow. Uses HeroUI design tokens for consistent colors and accessibility.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: ["success", "warning", "danger"],
			description: "Status variant",
		},
		children: {
			control: "text",
			description: "Badge text content",
		},
	},
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Status badge variants for the lock request approval workflow.
 *
 * **Color Mapping:**
 * - `success` (Green) - Approved requests
 * - `warning` (Yellow/Orange) - Pending requests
 * - `danger` (Red) - Rejected requests
 *
 * **Accessibility:**
 * All variants use HeroUI design tokens which ensure WCAG AA contrast ratios:
 * - Success: Green background with white text
 * - Warning: Yellow/Orange background with dark text
 * - Danger: Red background with white text
 */
export const StatusVariants: Story = {
	render: () => (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-4">
				<Badge variant="warning">pending</Badge>
				<span className="text-sm text-muted-foreground">
					Pending requests awaiting review
				</span>
			</div>
			<div className="flex items-center gap-4">
				<Badge variant="success">approved</Badge>
				<span className="text-sm text-muted-foreground">
					Approved requests (listing locked)
				</span>
			</div>
			<div className="flex items-center gap-4">
				<Badge variant="danger">rejected</Badge>
				<span className="text-sm text-muted-foreground">
					Rejected requests
				</span>
			</div>
		</div>
	),
};

export const Pending: Story = {
	args: {
		variant: "warning",
		children: "pending",
	},
};

export const Approved: Story = {
	args: {
		variant: "success",
		children: "approved",
	},
};

export const Rejected: Story = {
	args: {
		variant: "danger",
		children: "rejected",
	},
};

/**
 * All badge variants for comparison.
 */
export const AllVariants: Story = {
	render: () => (
		<div className="flex flex-wrap gap-3">
			<Badge variant="default">default</Badge>
			<Badge variant="secondary">secondary</Badge>
			<Badge variant="destructive">destructive</Badge>
			<Badge variant="outline">outline</Badge>
			<Badge variant="success">success</Badge>
			<Badge variant="warning">warning</Badge>
			<Badge variant="danger">danger</Badge>
		</div>
	),
};

/**
 * Status badges in dark mode context.
 */
export const DarkMode: Story = {
	render: () => (
		<div className="dark rounded-lg bg-background p-6">
			<div className="flex flex-col gap-4">
				<div className="flex items-center gap-4">
					<Badge variant="warning">pending</Badge>
					<span className="text-sm text-muted-foreground">
						Pending requests awaiting review
					</span>
				</div>
				<div className="flex items-center gap-4">
					<Badge variant="success">approved</Badge>
					<span className="text-sm text-muted-foreground">
						Approved requests (listing locked)
					</span>
				</div>
				<div className="flex items-center gap-4">
					<Badge variant="danger">rejected</Badge>
					<span className="text-sm text-muted-foreground">
						Rejected requests
					</span>
				</div>
			</div>
		</div>
	),
	parameters: {
		backgrounds: { default: "dark" },
	},
};


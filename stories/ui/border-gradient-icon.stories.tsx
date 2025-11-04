import type { Meta, StoryObj } from "@storybook/react";
import {
	Heart,
	Shield,
	ShoppingBag,
	Sparkles,
	Star,
	Trophy,
	Users,
	Zap,
} from "lucide-react";
import { BorderGradientIcon } from "@/components/ui/border-gradient-icon";

const meta: Meta<typeof BorderGradientIcon> = {
	title: "UI/BorderGradientIcon",
	component: BorderGradientIcon,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Icon component with gradient border effect. Perfect for highlighting important actions, features, or status indicators.",
			},
		},
	},
	argTypes: {
		title: {
			control: { type: "text" },
			description: "Accessibility title for the icon",
		},
		icon: {
			control: { type: "object" },
			description: "React node to display as the icon",
		},
		width: {
			control: { type: "text" },
			description: "Width of the icon container (default: 120px)",
		},
		height: {
			control: { type: "text" },
			description: "Height of the icon container (default: 120px)",
		},
		iconClassName: {
			control: { type: "text" },
			description: "Additional CSS classes for the icon",
		},
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-md p-8">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: "Star Icon",
		icon: <Star className="h-6 w-6" />,
	},
	parameters: {
		docs: {
			description: {
				story: "Default gradient icon with star shape.",
			},
		},
	},
};

export const DifferentIcons: Story = {
	render: () => (
		<div className="flex flex-wrap gap-4">
			<BorderGradientIcon
				icon={<Heart className="h-6 w-6" />}
				title="Heart Icon"
			/>
			<BorderGradientIcon
				icon={<ShoppingBag className="h-6 w-6" />}
				title="Shopping Bag Icon"
			/>
			<BorderGradientIcon
				icon={<Users className="h-6 w-6" />}
				title="Users Icon"
			/>
			<BorderGradientIcon icon={<Zap className="h-6 w-6" />} title="Zap Icon" />
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Various icon types for different use cases.",
			},
		},
	},
};

export const DifferentSizes: Story = {
	render: () => (
		<div className="flex items-center gap-4">
			<div className="text-center">
				<BorderGradientIcon
					height="80px"
					icon={<Trophy className="h-4 w-4" />}
					title="Small Trophy"
					width="80px"
				/>
				<p className="mt-2 text-xs">Small</p>
			</div>
			<div className="text-center">
				<BorderGradientIcon
					height="120px"
					icon={<Trophy className="h-6 w-6" />}
					title="Medium Trophy"
					width="120px"
				/>
				<p className="mt-2 text-xs">Medium</p>
			</div>
			<div className="text-center">
				<BorderGradientIcon
					height="160px"
					icon={<Trophy className="h-8 w-8" />}
					title="Large Trophy"
					width="160px"
				/>
				<p className="mt-2 text-xs">Large</p>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Different size options from small to large.",
			},
		},
	},
};

export const CustomIconColors: Story = {
	render: () => (
		<div className="flex flex-wrap gap-4">
			<BorderGradientIcon
				icon={<Star className="h-6 w-6 text-blue-500" />}
				iconClassName="text-blue-500"
				title="Star Icon"
			/>
			<BorderGradientIcon
				icon={<Heart className="h-6 w-6 text-red-500" />}
				iconClassName="text-red-500"
				title="Heart Icon"
			/>
			<BorderGradientIcon
				icon={<Zap className="h-6 w-6 text-yellow-500" />}
				iconClassName="text-yellow-500"
				title="Zap Icon"
			/>
			<BorderGradientIcon
				icon={<Shield className="h-6 w-6 text-green-500" />}
				iconClassName="text-green-500"
				title="Shield Icon"
			/>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Custom icon colors for different themes and visibility requirements.",
			},
		},
	},
};

export const BusinessIcons: Story = {
	render: () => (
		<div className="space-y-4">
			<h3 className="font-medium text-lg">Business & Professional</h3>
			<div className="flex flex-wrap gap-4">
				<BorderGradientIcon
					icon={<Trophy className="h-6 w-6" />}
					title="Trophy Icon"
				/>
				<BorderGradientIcon
					icon={<Shield className="h-6 w-6" />}
					title="Shield Icon"
				/>
				<BorderGradientIcon
					icon={<Users className="h-6 w-6" />}
					title="Users Icon"
				/>
			</div>

			<h3 className="font-medium text-lg">Social & Engagement</h3>
			<div className="flex flex-wrap gap-4">
				<BorderGradientIcon
					icon={<Heart className="h-6 w-6" />}
					title="Heart Icon"
				/>
				<BorderGradientIcon
					icon={<Star className="h-6 w-6" />}
					title="Star Icon"
				/>
				<BorderGradientIcon
					icon={<Sparkles className="h-6 w-6" />}
					title="Sparkles Icon"
				/>
			</div>

			<h3 className="font-medium text-lg">Action & Commerce</h3>
			<div className="flex flex-wrap gap-4">
				<BorderGradientIcon
					icon={<ShoppingBag className="h-6 w-6" />}
					title="Shopping Bag Icon"
				/>
				<BorderGradientIcon
					icon={<Zap className="h-6 w-6" />}
					title="Zap Icon"
				/>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Grouped icons showing different business use cases and categories.",
			},
		},
	},
};

export const CustomDimensions: Story = {
	render: () => (
		<div className="flex flex-wrap gap-4">
			<BorderGradientIcon
				height="100px"
				icon={<Star className="h-6 w-6" />}
				title="Square Icon"
				width="100px"
			/>
			<BorderGradientIcon
				height="80px"
				icon={<Heart className="h-6 w-6" />}
				title="Rectangle Icon"
				width="120px"
			/>
			<BorderGradientIcon
				height="180px"
				icon={<Sparkles className="h-8 w-8" />}
				title="Large Icon"
				width="180px"
			/>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Icons with custom dimensions for different layout requirements.",
			},
		},
	},
};

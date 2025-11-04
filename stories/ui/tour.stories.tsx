import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Tour } from "@/components/ui/tour";

const meta: Meta<typeof Tour> = {
	title: "UI/Tour",
	component: Tour,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Interactive tour component with step-by-step guidance and tooltips. Creates an overlay with highlighted target elements and popup cards with navigation controls.",
			},
		},
	},
	argTypes: {
		steps: {
			description:
				"Array of tour steps with target selectors, titles, descriptions, and placement options",
		},
		open: {
			control: { type: "boolean" },
			description: "Whether the tour is currently open and visible",
		},
		onClose: {
			action: "closed",
			description: "Callback when tour is closed by user",
		},
		onFinish: {
			action: "finished",
			description: "Callback when tour reaches the final step and completes",
		},
		className: {
			control: { type: "text" },
			description: "Additional CSS classes for the tour card",
		},
		maskClassName: {
			control: { type: "text" },
			description: "Additional CSS classes for the overlay mask",
		},
		placement: {
			control: { type: "select" },
			options: ["top", "bottom", "left", "right"],
			description:
				"Default placement for tour tooltips relative to target elements",
		},
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-4xl p-8">
				<div className="relative min-h-[400px] rounded-lg bg-gray-50 p-8 dark:bg-gray-900">
					<Story />
				</div>
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample tour steps
const sampleSteps = [
	{
		target: "#welcome-button",
		title: "Welcome to Our Platform",
		description:
			"Let's take a quick tour to help you get started with all the amazing features we have to offer.",
		placement: "bottom" as const,
	},
	{
		target: "#dashboard-area",
		title: "Your Dashboard",
		description:
			"This is your personalized dashboard where you can see all your important information at a glance.",
		placement: "right" as const,
	},
	{
		target: "#nav-menu",
		title: "Navigation Menu",
		description:
			"Use this menu to navigate between different sections of the application.",
		placement: "bottom" as const,
	},
	{
		target: "#profile-button",
		title: "Profile Settings",
		description:
			"Manage your account settings, preferences, and personal information here.",
		placement: "left" as const,
	},
];

export const Default: Story = {
	args: {
		steps: sampleSteps,
		open: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Default tour showing basic configuration with multiple steps and different tooltip positions.",
			},
		},
	},
};

export const InteractiveTour: Story = {
	render: () => {
		const [open, setOpen] = useState(false);

		const handleClose = () => {
			setOpen(false);
		};

		const handleFinish = () => {
			setOpen(false);
			console.log("Tour completed!");
		};

		return (
			<div className="text-center">
				<button
					className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
					id="start-tour-btn"
					onClick={() => setOpen(true)}
				>
					Start Interactive Tour
				</button>

				<div
					className="mt-8 rounded-lg bg-white p-4 dark:bg-gray-800"
					id="dashboard-area"
				>
					<h3 className="font-semibold text-lg">Dashboard Area</h3>
					<p className="text-gray-600 dark:text-gray-400">
						This area would be highlighted in the tour.
					</p>
				</div>

				<Tour
					onClose={handleClose}
					onFinish={handleFinish}
					open={open}
					steps={sampleSteps}
				/>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Interactive tour that can be started and controlled by the user.",
			},
		},
	},
};

export const OnboardingTour: Story = {
	args: {
		steps: [
			{
				target: "#getting-started",
				title: "Getting Started",
				description:
					"Welcome! This quick tour will help you understand the basics of using our platform effectively.",
				placement: "bottom" as const,
			},
			{
				target: "#create-first",
				title: "Create Your First Project",
				description:
					"Click here to create your first project. Projects help you organize your work and collaborate with others.",
				placement: "bottom" as const,
			},
			{
				target: "#invite-team",
				title: "Invite Team Members",
				description:
					"Collaboration is key! Invite your team members to work together on projects.",
				placement: "right" as const,
			},
			{
				target: "#explore",
				title: "Explore Features",
				description:
					"Take some time to explore all the features available to you. There's a lot to discover!",
				placement: "left" as const,
			},
		],
		open: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Onboarding tour designed for new users with step-by-step guidance.",
			},
		},
	},
};

export const FeatureHighlight: Story = {
	args: {
		steps: [
			{
				target: "#analytics",
				title: "Advanced Analytics",
				description:
					"Track performance, user engagement, and key metrics with our comprehensive analytics dashboard.",
				placement: "bottom" as const,
			},
			{
				target: "#automation",
				title: "Workflow Automation",
				description:
					"Automate repetitive tasks and create powerful workflows to save time and reduce errors.",
				placement: "top" as const,
			},
		],
		open: true,
	},
	parameters: {
		docs: {
			description: {
				story: "Feature highlighting tour showcasing specific capabilities.",
			},
		},
	},
};

export const MinimalTour: Story = {
	args: {
		steps: [
			{
				target: "#help-button",
				title: "Quick Tip",
				description: "Press '?' anywhere to access help and documentation.",
				placement: "top" as const,
			},
		],
		open: true,
	},
	parameters: {
		docs: {
			description: {
				story: "Minimal tour with single step and simplified controls.",
			},
		},
	},
};

export const DifferentPositions: Story = {
	render: () => {
		const [placement, setPlacement] = useState<
			"top" | "bottom" | "left" | "right"
		>("bottom");

		return (
			<div className="space-y-4">
				<div className="flex space-x-2">
					{(["top", "bottom", "left", "right"] as const).map((pos) => (
						<button
							className={`rounded-md px-4 py-2 ${
								placement === pos
									? "bg-blue-600 text-white"
									: "bg-gray-200 text-gray-700 hover:bg-gray-300"
							}`}
							key={pos}
							onClick={() => setPlacement(pos)}
						>
							{pos.charAt(0).toUpperCase() + pos.slice(1)}
						</button>
					))}
				</div>

				<Tour
					open={true}
					steps={[
						{
							target: "#position-demo",
							title: "Position Demo",
							description: `This tour step is positioned at the ${placement}. Try different positions to see how it works.`,
							placement,
						},
					]}
				/>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Tour with configurable positioning to test different tooltip placements.",
			},
		},
	},
};

export const CustomStyling: Story = {
	args: {
		steps: [
			{
				target: "#custom-element",
				title: "Custom Styled Tour",
				description:
					"This tour features custom styling to match your brand and design requirements.",
				placement: "bottom" as const,
			},
		],
		open: true,
		className: "bg-white border-2 border-purple-500 rounded-xl shadow-2xl",
	},
	parameters: {
		docs: {
			description: {
				story: "Tour with custom styling and branding.",
			},
		},
	},
};

export const ProductTour: Story = {
	args: {
		steps: [
			{
				target: "#product-overview",
				title: "Product Overview",
				description:
					"Learn about our product's key features and benefits that will help you achieve your goals.",
				placement: "bottom" as const,
			},
			{
				target: "#analytics-feature",
				title: "Smart Analytics",
				description:
					"Get insights and recommendations based on your data with our AI-powered analytics engine.",
				placement: "right" as const,
			},
			{
				target: "#collaboration-feature",
				title: "Real-time Collaboration",
				description:
					"Work together with your team in real-time, no matter where you are located.",
				placement: "left" as const,
			},
			{
				target: "#security-feature",
				title: "Enterprise Security",
				description:
					"Your data is protected with enterprise-grade security and compliance.",
				placement: "top" as const,
			},
		],
		open: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Product-focused tour highlighting key selling points and features.",
			},
		},
	},
};

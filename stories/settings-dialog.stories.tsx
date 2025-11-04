import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SettingsDialog } from "@/components/settings-dialog";

const meta: Meta<typeof SettingsDialog> = {
	title: "Components/SettingsDialog",
	component: SettingsDialog,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"A comprehensive settings dialog with responsive design. Features a collapsible sidebar navigation on desktop and a bottom tab bar on mobile. Includes multiple sections with sub-navigation for the messages section.",
			},
		},
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default settings dialog with messages section active
 */
export const Default: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"Default state showing the messages section with the messages list sub-tab active. Desktop view shows sidebar navigation.",
			},
		},
	},
};

/**
 * Interactive dialog that can be opened and closed
 */
export const Interactive: Story = {
	render: () => (
		<div className="flex min-h-[400px] items-center justify-center">
			<SettingsDialog />
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Fully interactive settings dialog. Click the trigger button to open, navigate between sections, and interact with all features.",
			},
		},
	},
};

/**
 * Messages section - Messages list view
 */
export const MessagesListView: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"Messages section showing the list of recent messages with avatars, timestamps, and message previews.",
			},
		},
		viewport: {
			defaultViewport: "desktop",
		},
	},
};

/**
 * Messages section - Media view
 */
export const MediaView: Story = {
	render: () => {
		const Wrapper = () => {
			const [key, setKey] = useState(0);

			// Force re-render with media tab active
			useState(() => {
				setTimeout(() => setKey(1), 100);
			});

			return <SettingsDialog key={key} />;
		};

		return <Wrapper />;
	},
	parameters: {
		docs: {
			description: {
				story:
					"Media sub-tab showing a grid of images and videos with file details, sizes, and dates.",
			},
		},
	},
};

/**
 * Mobile responsive view
 */
export const MobileView: Story = {
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
		docs: {
			description: {
				story:
					"Mobile-optimized view using a drawer layout with a bottom navigation bar and full-height content area.",
			},
		},
	},
};

/**
 * Tablet responsive view
 */
export const TabletView: Story = {
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
		docs: {
			description: {
				story:
					"Tablet view showing the responsive breakpoint between mobile drawer and desktop dialog layouts.",
			},
		},
	},
};

/**
 * Navigation section
 */
export const NavigationSection: Story = {
	render: () => (
		<div className="flex min-h-[500px] items-center justify-center">
			<p className="text-muted-foreground">
				Click "Open Dialog" and select "Navigation" from the sidebar
			</p>
			<SettingsDialog />
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Navigation section placeholder - demonstrating the structure for sections without content yet.",
			},
		},
	},
};

/**
 * Notifications section
 */
export const NotificationsSection: Story = {
	render: () => (
		<div className="flex min-h-[500px] items-center justify-center">
			<p className="text-muted-foreground">
				Click "Open Dialog" and select "Notifications" from the sidebar
			</p>
			<SettingsDialog />
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Notifications section showing the basic structure for notification preferences.",
			},
		},
	},
};

/**
 * Appearance section
 */
export const AppearanceSection: Story = {
	render: () => (
		<div className="flex min-h-[500px] items-center justify-center">
			<p className="text-muted-foreground">
				Click "Open Dialog" and select "Appearance" from the sidebar
			</p>
			<SettingsDialog />
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Appearance section for theme and visual customization settings.",
			},
		},
	},
};

/**
 * Privacy & visibility section
 */
export const PrivacySection: Story = {
	render: () => (
		<div className="flex min-h-[500px] items-center justify-center">
			<p className="text-muted-foreground">
				Click "Open Dialog" and select "Privacy & visibility" from the sidebar
			</p>
			<SettingsDialog />
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Privacy and visibility settings section for controlling data and profile visibility.",
			},
		},
	},
};

/**
 * All sections overview
 */
export const AllSections: Story = {
	render: () => (
		<div className="space-y-4">
			<div className="space-y-2 text-center">
				<h3 className="font-semibold text-lg">Available Settings Sections</h3>
				<p className="text-muted-foreground text-sm">
					Navigate through all available sections using the sidebar
				</p>
			</div>
			<div className="mx-auto mb-4 grid max-w-2xl grid-cols-2 gap-4">
				<div className="rounded-lg border p-4">
					<h4 className="mb-2 font-medium">Notifications</h4>
					<p className="text-muted-foreground text-xs">
						Manage notification preferences
					</p>
				</div>
				<div className="rounded-lg border p-4">
					<h4 className="mb-2 font-medium">Navigation</h4>
					<p className="text-muted-foreground text-xs">Navigation settings</p>
				</div>
				<div className="rounded-lg border p-4">
					<h4 className="mb-2 font-medium">Home</h4>
					<p className="text-muted-foreground text-xs">Home page settings</p>
				</div>
				<div className="rounded-lg border p-4">
					<h4 className="mb-2 font-medium">Appearance</h4>
					<p className="text-muted-foreground text-xs">
						Theme and visual settings
					</p>
				</div>
				<div className="rounded-lg border p-4">
					<h4 className="mb-2 font-medium">Messages & media</h4>
					<p className="text-muted-foreground text-xs">
						Messages, media, links, and files
					</p>
				</div>
				<div className="rounded-lg border p-4">
					<h4 className="mb-2 font-medium">Language & region</h4>
					<p className="text-muted-foreground text-xs">Localization settings</p>
				</div>
				<div className="rounded-lg border p-4">
					<h4 className="mb-2 font-medium">Accessibility</h4>
					<p className="text-muted-foreground text-xs">Accessibility options</p>
				</div>
				<div className="rounded-lg border p-4">
					<h4 className="mb-2 font-medium">Audio & video</h4>
					<p className="text-muted-foreground text-xs">Media preferences</p>
				</div>
				<div className="rounded-lg border p-4">
					<h4 className="mb-2 font-medium">Connected accounts</h4>
					<p className="text-muted-foreground text-xs">
						Third-party integrations
					</p>
				</div>
				<div className="rounded-lg border p-4">
					<h4 className="mb-2 font-medium">Privacy & visibility</h4>
					<p className="text-muted-foreground text-xs">Privacy controls</p>
				</div>
				<div className="rounded-lg border p-4">
					<h4 className="mb-2 font-medium">Advanced</h4>
					<p className="text-muted-foreground text-xs">Advanced settings</p>
				</div>
				<div className="rounded-lg border p-4">
					<h4 className="mb-2 font-medium">Mark as read</h4>
					<p className="text-muted-foreground text-xs">Mark all as read</p>
				</div>
			</div>
			<div className="flex justify-center">
				<SettingsDialog />
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Overview of all available settings sections. Each section provides specific configuration options for different aspects of the application.",
			},
		},
	},
};

/**
 * Dark mode demonstration
 */
export const DarkMode: Story = {
	parameters: {
		backgrounds: {
			default: "dark",
		},
		docs: {
			description: {
				story:
					"Settings dialog in dark mode, demonstrating proper theming support.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div className="dark">
				<Story />
			</div>
		),
	],
};

/**
 * Responsive breakpoints comparison
 */
export const ResponsiveComparison: Story = {
	render: () => (
		<div className="space-y-8">
			<div>
				<h3 className="mb-4 text-center font-semibold text-lg">Desktop View</h3>
				<div className="min-w-[1000px] rounded-lg border p-4">
					<SettingsDialog />
				</div>
			</div>
			<div>
				<h3 className="mb-4 text-center font-semibold text-lg">Mobile View</h3>
				<div className="mx-auto max-w-[375px] rounded-lg border p-4">
					<div className="origin-top scale-75">
						<SettingsDialog />
					</div>
				</div>
			</div>
		</div>
	),
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				story:
					"Side-by-side comparison of desktop dialog and mobile drawer implementations, showcasing the responsive design patterns.",
			},
		},
	},
};

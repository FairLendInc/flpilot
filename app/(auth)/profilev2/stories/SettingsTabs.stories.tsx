import type { Meta, StoryObj } from "@storybook/react";
import { SettingsTabs } from "../components/SettingsTabs";

const meta: Meta<typeof SettingsTabs> = {
	title: "Profile/SettingsTabs",
	component: SettingsTabs,
};

export default meta;
type Story = StoryObj<typeof SettingsTabs>;

export const Default: Story = {
	args: {
		onNotificationToggle: (type: string, checked: boolean) =>
			console.log("Notification toggle", type, checked),
	},
};

export const SecurityTab: Story = {
	args: {
		onNotificationToggle: (type: string, checked: boolean) =>
			console.log("Notification toggle", type, checked),
	},
	parameters: {
		docs: {
			description: {
				story:
					"The Security tab is selected by default and shows two-factor authentication, password management, and active sessions options.",
			},
		},
	},
};

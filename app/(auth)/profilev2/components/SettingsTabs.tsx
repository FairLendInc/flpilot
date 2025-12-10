"use client";

import {
	Button,
	Card,
	Tab,
	TabIndicator,
	TabList,
	TabPanel,
	TabsRoot,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { A11Y, TOAST_MESSAGES, UI } from "../constants";
import type { SettingsTabsProps } from "../types";

export function SettingsTabs({ onNotificationToggle }: SettingsTabsProps) {
	return (
		<Card.Root
			className="overflow-hidden rounded-2xl border-2 shadow-lg"
			data-testid="settings-tabs"
		>
			<Card.Header className={`border-b ${UI.GRADIENTS.cardHeader}`}>
				<div className="flex items-center gap-3">
					<div
						className={`flex h-10 w-10 items-center justify-center rounded-full ${UI.GRADIENTS.primary}`}
					>
						<Icon className="h-5 w-5 text-white" icon="gravity-ui:gear" />
					</div>
					<div>
						<Card.Title className="text-xl">Settings</Card.Title>
						<Card.Description>
							Manage security and notification preferences
						</Card.Description>
					</div>
				</div>
			</Card.Header>
			<Card.Content className="p-6">
				<TabsRoot defaultSelectedKey="security">
					<TabList aria-label="Settings tabs">
						<Tab id="security">
							<Icon className="mr-2 h-4 w-4" icon="gravity-ui:shield-check" />
							{A11Y.SECURITY_TAB}
							<TabIndicator />
						</Tab>
						<Tab id="notifications">
							<Icon className="mr-2 h-4 w-4" icon="gravity-ui:bell" />
							{A11Y.NOTIFICATIONS_TAB}
							<TabIndicator />
						</Tab>
					</TabList>

					<TabPanel className="pt-6" id="security">
						<div className="space-y-6">
							<div>
								<h3 className="mb-2 font-medium text-lg">
									Two-Factor Authentication
								</h3>
								<p className="mb-4 text-muted-foreground text-sm">
									Add an extra layer of security to your account
								</p>
								<Button
									onPress={() => {
										toast.info(TOAST_MESSAGES.SETTINGS.twoFactor);
									}}
									type="button"
									variant="secondary"
								>
									<Icon icon="gravity-ui:shield-check" />
									Enable 2FA
								</Button>
							</div>

							<div className="border-t pt-6">
								<h3 className="mb-2 font-medium text-lg">Password</h3>
								<p className="mb-4 text-muted-foreground text-sm">
									Change your account password
								</p>
								<Button
									onPress={() => {
										toast.info(TOAST_MESSAGES.SETTINGS.password);
									}}
									type="button"
									variant="secondary"
								>
									<Icon icon="gravity-ui:key" />
									Change Password
								</Button>
							</div>

							<div className="border-t pt-6">
								<h3 className="mb-2 font-medium text-lg">Active Sessions</h3>
								<p className="mb-4 text-muted-foreground text-sm">
									Manage devices where you're currently signed in
								</p>
								<Button
									onPress={() => {
										toast.info(TOAST_MESSAGES.SETTINGS.sessions);
									}}
									type="button"
									variant="secondary"
								>
									<Icon icon="gravity-ui:display" />
									View Sessions
								</Button>
							</div>
						</div>
					</TabPanel>

					<TabPanel className="pt-6" id="notifications">
						<div className="space-y-6">
							<div>
								<h3 className="mb-2 font-medium text-lg">
									Email Notifications
								</h3>
								<p className="mb-4 text-muted-foreground text-sm">
									Choose what updates you want to receive via email
								</p>
								<div className="space-y-3">
									<label className="flex cursor-pointer items-center gap-3">
										<input
											aria-label={A11Y.CHECKBOXES.accountUpdates}
											className="h-4 w-4 rounded border-gray-300"
											onChange={(e) => {
												onNotificationToggle(
													"accountUpdates",
													e.target.checked
												);
												toast.success(
													e.target.checked
														? TOAST_MESSAGES.NOTIFICATIONS.accountUpdates
																.enabled
														: TOAST_MESSAGES.NOTIFICATIONS.accountUpdates
																.disabled
												);
											}}
											type="checkbox"
										/>
										<span className="text-sm">Account updates</span>
									</label>
									<label className="flex cursor-pointer items-center gap-3">
										<input
											aria-label={A11Y.CHECKBOXES.securityAlerts}
											className="h-4 w-4 rounded border-gray-300"
											onChange={(e) => {
												onNotificationToggle(
													"securityAlerts",
													e.target.checked
												);
												toast.success(
													e.target.checked
														? TOAST_MESSAGES.NOTIFICATIONS.securityAlerts
																.enabled
														: TOAST_MESSAGES.NOTIFICATIONS.securityAlerts
																.disabled
												);
											}}
											type="checkbox"
										/>
										<span className="text-sm">Security alerts</span>
									</label>
									<label className="flex cursor-pointer items-center gap-3">
										<input
											aria-label={A11Y.CHECKBOXES.productUpdates}
											className="h-4 w-4 rounded border-gray-300"
											onChange={(e) => {
												onNotificationToggle(
													"productUpdates",
													e.target.checked
												);
												toast.success(
													e.target.checked
														? TOAST_MESSAGES.NOTIFICATIONS.productUpdates
																.enabled
														: TOAST_MESSAGES.NOTIFICATIONS.productUpdates
																.disabled
												);
											}}
											type="checkbox"
										/>
										<span className="text-sm">Product updates</span>
									</label>
								</div>
							</div>

							<div className="border-t pt-6">
								<h3 className="mb-2 font-medium text-lg">Push Notifications</h3>
								<p className="mb-4 text-muted-foreground text-sm">
									Receive notifications on your devices
								</p>
								<Button
									onPress={() => {
										toast.info(TOAST_MESSAGES.SETTINGS.pushNotifications);
									}}
									type="button"
									variant="secondary"
								>
									<Icon icon="gravity-ui:bell" />
									Configure Push
								</Button>
							</div>
						</div>
					</TabPanel>
				</TabsRoot>
			</Card.Content>
		</Card.Root>
	);
}

"use client";

import { Button, Card } from "@heroui/react";
import { Icon } from "@iconify/react";
import type { ProfileFormFieldsProps } from "../types";

export function ProfileFormFields({
	firstName,
	lastName,
	email,
	phone,
	isSaving,
	onFirstNameChange,
	onLastNameChange,
	onPhoneChange,
	onSubmit,
}: ProfileFormFieldsProps) {
	return (
		<Card.Root
			className="overflow-hidden rounded-2xl border-2 shadow-lg transition-all hover:shadow-xl"
			data-testid="profile-form-fields"
		>
			<Card.Header className="border-b bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-purple-600">
						<Icon
							className="h-5 w-5 text-white"
							data-testid="profile-icon"
							icon="gravity-ui:user"
						/>
					</div>
					<div>
						<Card.Title className="text-xl">Profile Information</Card.Title>
						<Card.Description>Update your personal details</Card.Description>
					</div>
				</div>
			</Card.Header>
			<Card.Content className="p-6">
				<form className="w-full" onSubmit={onSubmit}>
					<div className="space-y-4">
						<div>
							<label
								className="mb-1 block font-medium text-sm"
								htmlFor="first-name"
							>
								First Name
							</label>
							<input
								className="w-full rounded-md border border-gray-300 px-3 py-2"
								id="first-name"
								data-testid="profile-first-name"
								onChange={(e) => onFirstNameChange(e.target.value)}
								placeholder="First Name"
								value={firstName}
							/>
						</div>
						<div>
							<label
								className="mb-1 block font-medium text-sm"
								htmlFor="last-name"
							>
								Last Name
							</label>
							<input
								className="w-full rounded-md border border-gray-300 px-3 py-2"
								id="last-name"
								data-testid="profile-last-name"
								onChange={(e) => onLastNameChange(e.target.value)}
								placeholder="Last Name"
								value={lastName}
							/>
						</div>
						<div>
							<label className="mb-1 block font-medium text-sm" htmlFor="email">
								Email (Read Only)
							</label>
							<input
								className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2"
								disabled
								id="email"
								data-testid="profile-email"
								placeholder="john@example.com"
								value={email}
							/>
						</div>
						<div>
							<label className="mb-1 block font-medium text-sm" htmlFor="phone">
								Phone
							</label>
							<input
								className="w-full rounded-md border border-gray-300 px-3 py-2"
								id="phone"
								data-testid="profile-phone"
								onChange={(e) => onPhoneChange(e.target.value)}
								placeholder="+1 (555) 123-4567"
								value={phone}
							/>
						</div>
					</div>
					<div className="flex gap-3 pt-6">
						<Button
							className="flex-1 bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg transition-all hover:shadow-xl"
							isDisabled={isSaving}
							type="submit"
						>
							<Icon icon="gravity-ui:floppy-disk" />
							{isSaving ? "Saving..." : "Save Changes"}
						</Button>
						<Button
							className="border-2"
							isDisabled={isSaving}
							type="reset"
							variant="secondary"
						>
							Cancel
						</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	);
}
